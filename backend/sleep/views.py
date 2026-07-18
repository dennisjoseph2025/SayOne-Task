import logging

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

        try:
            recommendation = generate_recommendation(request.user)
        except Exception as e:
            logger.exception("Error generating AI recommendation")
            return Response(
                {"detail": "Failed to generate recommendation. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"recommendation": recommendation})

    @action(detail=False, methods=["get"])
    def trends(self, request):
        from .services import analyze_trends

        try:
            data = analyze_trends(request.user)
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
