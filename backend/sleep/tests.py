from datetime import date, datetime, time, timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import SleepEntry, SleepGoal
from .services import compute_analytics, compute_streaks


class SleepEntryModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass123!")

    def test_create_sleep_entry(self):
        entry = SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 15),
            wake_time=datetime(2026, 7, 18, 6, 45),
            quality=4,
            notes="Slept well",
            caffeine="MORNING",
            exercise=True,
            screen_time_before_bed=False,
        )
        self.assertEqual(entry.user, self.user)
        self.assertEqual(entry.date, date(2026, 7, 17))
        self.assertEqual(entry.quality, 4)
        self.assertEqual(entry.caffeine, "MORNING")
        self.assertTrue(entry.exercise)
        self.assertFalse(entry.screen_time_before_bed)

    def test_duration_hours_normal(self):
        entry = SleepEntry(
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
        )
        self.assertEqual(entry.duration_hours, 8.0)

    def test_duration_hours_partial(self):
        entry = SleepEntry(
            bed_time=datetime(2026, 7, 17, 23, 15),
            wake_time=datetime(2026, 7, 18, 6, 45),
        )
        self.assertEqual(entry.duration_hours, 7.5)

    def test_duration_hours_short_sleep(self):
        entry = SleepEntry(
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 3, 30),
        )
        self.assertEqual(entry.duration_hours, 4.5)

    def test_unique_together_constraint(self):
        SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
            quality=4,
        )
        with self.assertRaises(Exception):
            SleepEntry.objects.create(
                user=self.user,
                date=date(2026, 7, 17),
                bed_time=datetime(2026, 7, 17, 22, 0),
                wake_time=datetime(2026, 7, 18, 6, 0),
                quality=3,
            )

    def test_different_users_same_date(self):
        user2 = User.objects.create_user(username="testuser2", password="testpass123!")
        SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
            quality=4,
        )
        entry2 = SleepEntry.objects.create(
            user=user2,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 22, 0),
            wake_time=datetime(2026, 7, 18, 6, 0),
            quality=3,
        )
        self.assertEqual(SleepEntry.objects.filter(date=date(2026, 7, 17)).count(), 2)

    def test_str_representation(self):
        entry = SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
            quality=4,
        )
        self.assertEqual(str(entry), "testuser — 2026-07-17 (Q:4)")


class StreakCalculationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="streakuser", password="testpass123!")
        self.goal = SleepGoal.objects.create(
            user=self.user,
            target_bed_time=time(23, 30),
            target_wake_time=time(7, 0),
            target_duration_hours=7.5,
        )

    def _create_entry(self, dt, bed_hour=23, bed_min=30, duration_hours=7.5):
        wake = datetime(dt.year, dt.month, dt.day, bed_hour, bed_min) + timedelta(hours=duration_hours)
        bed = datetime(dt.year, dt.month, dt.day, bed_hour, bed_min)
        return SleepEntry.objects.create(
            user=self.user,
            date=dt.date() if isinstance(dt, datetime) else dt,
            bed_time=bed,
            wake_time=wake,
            quality=4,
        )

    def test_single_night_met(self):
        self._create_entry(date(2026, 7, 17))
        result = compute_streaks(SleepEntry.objects.filter(user=self.user), self.goal)
        self.assertEqual(result["current_streak_days"], 1)
        self.assertEqual(result["longest_streak_days"], 1)
        self.assertEqual(result["weekly_score"], 100)
        self.assertEqual(result["goal_met_last_7_nights"], [True])

    def test_streak_resets_on_miss(self):
        # 3 consecutive nights meeting goal
        self._create_entry(date(2026, 7, 14))
        self._create_entry(date(2026, 7, 15))
        self._create_entry(date(2026, 7, 16))
        # 1 night missing goal (bad bed time)
        self._create_entry(date(2026, 7, 17), bed_hour=1, bed_min=0, duration_hours=7.5)
        # 1 more night meeting goal
        self._create_entry(date(2026, 7, 18))

        entries = SleepEntry.objects.filter(user=self.user).order_by("date")
        result = compute_streaks(entries, self.goal)

        self.assertEqual(result["current_streak_days"], 1)
        self.assertEqual(result["longest_streak_days"], 3)

    def test_empty_entries(self):
        result = compute_streaks(SleepEntry.objects.none(), self.goal)
        self.assertEqual(result["current_streak_days"], 0)
        self.assertEqual(result["longest_streak_days"], 0)
        self.assertEqual(result["weekly_score"], 0)
        self.assertEqual(result["goal_met_last_7_nights"], [])

    def test_longest_streak_middle(self):
        # Pattern: met, met, met, miss, met, met, met
        self._create_entry(date(2026, 7, 11))
        self._create_entry(date(2026, 7, 12))
        self._create_entry(date(2026, 7, 13))
        self._create_entry(date(2026, 7, 14), bed_hour=1, bed_min=0)  # miss
        self._create_entry(date(2026, 7, 15))
        self._create_entry(date(2026, 7, 16))
        self._create_entry(date(2026, 7, 17))

        entries = SleepEntry.objects.filter(user=self.user).order_by("date")
        result = compute_streaks(entries, self.goal)

        self.assertEqual(result["longest_streak_days"], 3)
        self.assertEqual(result["current_streak_days"], 3)

    def test_weekly_score_partial(self):
        # 5 out of 7 nights met
        self._create_entry(date(2026, 7, 11))
        self._create_entry(date(2026, 7, 12))
        self._create_entry(date(2026, 7, 13), bed_hour=1, bed_min=0)  # miss
        self._create_entry(date(2026, 7, 14))
        self._create_entry(date(2026, 7, 15))
        self._create_entry(date(2026, 7, 16), bed_hour=1, bed_min=0)  # miss
        self._create_entry(date(2026, 7, 17))

        entries = SleepEntry.objects.filter(user=self.user).order_by("date")
        result = compute_streaks(entries, self.goal)

        self.assertEqual(result["weekly_score"], 71)  # 5/7 = 71%


class AnalyticsEndpointTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="analyticsuser", password="testpass123!")
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def _create_entries(self):
        nights = [
            (date(2026, 7, 10), 23, 0, 7, 0, 4),
            (date(2026, 7, 11), 23, 30, 7, 30, 5),
            (date(2026, 7, 12), 22, 45, 6, 45, 3),
            (date(2026, 7, 13), 23, 15, 7, 15, 4),
            (date(2026, 7, 14), 0, 30, 8, 30, 2),
        ]
        for dt, bh, bw, wh, wm, q in nights:
            SleepEntry.objects.create(
                user=self.user,
                date=dt,
                bed_time=datetime(dt.year, dt.month, dt.day, bh, bw),
                wake_time=datetime(dt.year, dt.month, dt.day, wh, wm),
                quality=q,
            )

    def test_analytics_returns_correct_shape(self):
        self._create_entries()
        response = self.client.get("/api/sleep-entries/analytics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("average_duration_hours", data)
        self.assertIn("average_quality", data)
        self.assertIn("consistency_score", data)
        self.assertIn("best_night", data)
        self.assertIn("worst_night", data)
        self.assertIn("total_nights_logged", data)
        self.assertEqual(data["total_nights_logged"], 5)

    def test_analytics_best_worst_nights(self):
        self._create_entries()
        response = self.client.get("/api/sleep-entries/analytics/")
        data = response.data
        self.assertEqual(data["best_night"]["quality"], 5)
        self.assertEqual(data["worst_night"]["quality"], 2)

    def test_analytics_empty_entries(self):
        response = self.client.get("/api/sleep-entries/analytics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("detail", response.data)

    def test_analytics_unauthenticated(self):
        client = APIClient()
        response = client.get("/api/sleep-entries/analytics/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register(self):
        response = self.client.post(
            "/api/auth/register/",
            {"username": "newuser", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertIn("user_id", response.data)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_duplicate_username(self):
        User.objects.create_user(username="existing", password="testpass123!")
        response = self.client.post(
            "/api/auth/register/",
            {"username": "existing", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login(self):
        User.objects.create_user(username="loginuser", password="testpass123!")
        response = self.client.post(
            "/api/auth/login/",
            {"username": "loginuser", "password": "testpass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_login_invalid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "nouser", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SleepEntryAPITest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="apiuser", password="testpass123!")
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_create_entry(self):
        response = self.client.post(
            "/api/sleep-entries/",
            {
                "date": "2026-07-17",
                "bed_time": "2026-07-17T23:15:00",
                "wake_time": "2026-07-18T06:45:00",
                "quality": 4,
                "notes": "Good sleep",
                "caffeine": "MORNING",
                "exercise": True,
                "screen_time_before_bed": False,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["duration_hours"], 7.5)

    def test_create_entry_duplicate_date(self):
        SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
            quality=4,
        )
        response = self.client.post(
            "/api/sleep-entries/",
            {
                "date": "2026-07-17",
                "bed_time": "2026-07-17T22:00:00",
                "wake_time": "2026-07-18T06:00:00",
                "quality": 3,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_wake_before_bed(self):
        response = self.client.post(
            "/api/sleep-entries/",
            {
                "date": "2026-07-17",
                "bed_time": "2026-07-18T06:45:00",
                "wake_time": "2026-07-17T23:15:00",
                "quality": 4,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_entries(self):
        SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
            quality=4,
        )
        response = self.client.get("/api/sleep-entries/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)

    def test_delete_entry(self):
        entry = SleepEntry.objects.create(
            user=self.user,
            date=date(2026, 7, 17),
            bed_time=datetime(2026, 7, 17, 23, 0),
            wake_time=datetime(2026, 7, 18, 7, 0),
            quality=4,
        )
        response = self.client.delete(f"/api/sleep-entries/{entry.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SleepEntry.objects.filter(id=entry.id).exists())

    def test_unauthenticated_access(self):
        client = APIClient()
        response = client.get("/api/sleep-entries/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
