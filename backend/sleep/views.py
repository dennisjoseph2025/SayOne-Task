from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
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
        qs = SleepEntry.objects.filter(user=self.request.user)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def analytics(self, request):
        from .services import compute_analytics

        entries = self.get_queryset()
        if not entries.exists():
            return Response(
                {"detail": "No sleep entries found."},
                status=status.HTTP_200_OK,
            )
        data = compute_analytics(entries)
        return Response(data)


class SleepGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SleepGoalSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return SleepGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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
        data = compute_streaks(entries, goal)
        return Response(data)
