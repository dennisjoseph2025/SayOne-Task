from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoginView, RegisterView, SleepEntryViewSet, SleepGoalViewSet

router = DefaultRouter()
router.register(r"sleep-entries", SleepEntryViewSet, basename="sleep-entries")
router.register(r"sleep-goals", SleepGoalViewSet, basename="sleep-goals")

app_name = "sleep"

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("", include(router.urls)),
]
