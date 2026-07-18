import csv
import io
import json
import logging
from datetime import datetime, timedelta
import random

from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SleepEntry, SleepGoal
from .permissions import IsOwner
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    SleepEntrySerializer,
    SleepGoalSerializer,
)

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = Token.objects.get(user=user)
        return Response(
            {"token": token.key, "user_id": user.id, "username": user.username},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user_id": user.id, "username": user.username}
        )


class SleepEntryViewSet(viewsets.ModelViewSet):
    serializer_class = SleepEntrySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return SleepEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_object(self):
        obj = super().get_object()
        if obj.user != self.request.user:
            raise PermissionDenied("You do not have access to this entry.")
        return obj

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        from .services import compute_analytics

        entries = self.get_queryset()
        if not entries.exists():
            return Response(
                {"detail": "No sleep entries found."},
                status=status.HTTP_200_OK,
            )
        try:
            data = compute_analytics(entries)
        except Exception as e:
            logger.exception("Error computing analytics")
            return Response(
                {"detail": "Failed to compute analytics."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(data)

    @action(detail=False, methods=["post"])
    def recommend(self, request):
        from .services import generate_recommendation
        from groq import APIStatusError, AuthenticationError, PermissionDeniedError

        try:
            recommendation = generate_recommendation(request.user)
        except (APIStatusError, AuthenticationError, PermissionDeniedError) as e:
            logger.warning("Groq API error: %s", e)
            return Response(
                {"detail": "AI service is currently unavailable. Please check the API key configuration."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            logger.exception("Error generating AI recommendation")
            return Response(
                {"detail": "Failed to generate recommendation. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({"recommendation": recommendation})

    @action(detail=False, methods=["get"])
    def trends(self, request):
        from .services import analyze_trends
        from groq import APIStatusError, AuthenticationError, PermissionDeniedError

        try:
            data = analyze_trends(request.user)
        except (APIStatusError, AuthenticationError, PermissionDeniedError) as e:
            logger.warning("Groq API error in trends: %s", e)
            return Response(
                {"detail": "AI trend analysis is currently unavailable. Please check the API key configuration."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            logger.exception("Error analyzing trends")
            return Response(
                {"detail": "Failed to analyze trends."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(data)

    @action(detail=False, methods=["get"])
    def wind_down(self, request):
        from .services import predict_wind_down

        try:
            data = predict_wind_down(request.user)
        except Exception:
            logger.exception("Error predicting wind-down time")
            return Response(
                {"detail": "Failed to predict wind-down time."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(data)

    @action(detail=False, methods=["post"])
    def import_wearable(self, request):
        """Import sleep data from wearable CSV or JSON."""
        data_file = request.FILES.get("file")
        if not data_file:
            return Response(
                {"detail": "No file uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = data_file.read().decode("utf-8")
        filename = data_file.name.lower()
        imported = 0
        skipped = 0
        errors = []

        try:
            if filename.endswith(".json"):
                records = json.loads(content)
            elif filename.endswith(".csv"):
                reader = csv.DictReader(io.StringIO(content))
                records = list(reader)
            else:
                return Response(
                    {"detail": "Unsupported file format. Use .csv or .json."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for i, record in enumerate(records):
                try:
                    date_str = record.get("date", "")
                    bed_str = record.get("bed_time", "")
                    wake_str = record.get("wake_time", "")

                    if not all([date_str, bed_str, wake_str]):
                        skipped += 1
                        continue

                    bed_time = datetime.fromisoformat(bed_str.replace("Z", "+00:00"))
                    wake_time = datetime.fromisoformat(wake_str.replace("Z", "+00:00"))
                    quality = int(record.get("quality", 3))
                    quality = max(1, min(5, quality))

                    if SleepEntry.objects.filter(user=request.user, date=date_str).exists():
                        skipped += 1
                        continue

                    SleepEntry.objects.create(
                        user=request.user,
                        date=date_str,
                        bed_time=bed_time,
                        wake_time=wake_time,
                        quality=quality,
                        notes=record.get("notes", ""),
                        caffeine=record.get("caffeine", "NONE"),
                        exercise=record.get("exercise", "false").lower() in ("true", "1", "yes"),
                        screen_time_before_bed=record.get("screen_time_before_bed", "false").lower() in ("true", "1", "yes"),
                    )
                    imported += 1
                except Exception as e:
                    errors.append(f"Row {i + 1}: {str(e)}")
                    skipped += 1

        except (json.JSONDecodeError, csv.Error) as e:
            return Response(
                {"detail": f"Failed to parse file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10],
        })

    @action(detail=False, methods=["post"])
    def mock_generate(self, request):
        """Generate mock wearable sleep data for demo purposes."""
        days = int(request.data.get("days", 14))
        days = min(days, 90)

        today = datetime.now().date()
        created = 0

        for i in range(days):
            d = today - timedelta(days=i + 1)
            if SleepEntry.objects.filter(user=request.user, date=d).exists():
                continue

            hour = random.choice([22, 23, 0, 1])
            minute = random.choice([0, 15, 30, 45])
            bed = datetime.combine(d, datetime.min.time().replace(hour=hour, minute=minute))
            duration = random.uniform(5.5, 9.0)
            wake = bed + timedelta(hours=duration)
            quality = random.choices([1, 2, 3, 4, 5], weights=[10, 15, 25, 30, 20])[0]
            caffeine = random.choice(["NONE", "NONE", "MORNING", "AFTERNOON", "EVENING"])
            exercise = random.choice([True, False, False])
            screen = random.choice([True, True, False])

            SleepEntry.objects.create(
                user=request.user,
                date=d,
                bed_time=bed,
                wake_time=wake,
                quality=quality,
                caffeine=caffeine,
                exercise=exercise,
                screen_time_before_bed=screen,
                notes="",
            )
            created += 1

        return Response({"created": created, "total_days": days})


class SleepGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SleepGoalSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return SleepGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_object(self):
        obj = super().get_object()
        if obj.user != self.request.user:
            raise PermissionDenied("You do not have access to this goal.")
        return obj

    @action(detail=False, methods=["get"])
    def streak(self, request):
        from .services import compute_streaks

        goal = SleepGoal.objects.filter(user=request.user).first()
        if not goal:
            return Response(
                {"detail": "No sleep goal set. Create one first."},
                status=status.HTTP_200_OK,
            )
        entries = SleepEntry.objects.filter(user=request.user).order_by("date")
        try:
            data = compute_streaks(entries, goal)
        except Exception as e:
            logger.exception("Error computing streaks")
            return Response(
                {"detail": "Failed to compute streaks."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(data)
