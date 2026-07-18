import logging
from datetime import date, timedelta

from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.conf import settings

from sleep.models import SleepEntry, SleepGoal
from sleep.services import compute_analytics

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send a nightly sleep summary email to all users with entries from last night"

    def handle(self, *args, **options):
        from django.contrib.auth.models import User

        yesterday = date.today() - timedelta(days=1)
        users = User.objects.filter(sleep_entries__date=yesterday).distinct()

        sent = 0
        for user in users:
            if not user.email:
                continue

            entries = SleepEntry.objects.filter(user=user, date=yesterday)
            if not entries.exists():
                continue

            entry = entries.first()
            goal = SleepGoal.objects.filter(user=user).first()

            lines = [
                f"Good morning, {user.username}!",
                f"",
                f"Last night's sleep summary ({entry.date}):",
                f"  Bed time: {entry.bed_time.strftime('%H:%M')}",
                f"  Wake time: {entry.wake_time.strftime('%H:%M')}",
                f"  Duration: {entry.duration_hours}h",
                f"  Quality: {entry.quality}/5",
                f"  Caffeine: {entry.caffeine}",
                f"  Exercise: {'Yes' if entry.exercise else 'No'}",
                f"  Screen time before bed: {'Yes' if entry.screen_time_before_bed else 'No'}",
            ]

            if goal:
                actual = entry.bed_time.time()
                target = goal.target_bed_time
                bt_diff = abs((actual.hour * 60 + actual.minute) - (target.hour * 60 + target.minute))
                dur_diff = abs(entry.duration_hours - goal.target_duration_hours)
                met = bt_diff <= 15 and dur_diff <= 0.5
                lines.append(f"  Goal met: {'Yes' if met else 'No'}")

            all_entries = SleepEntry.objects.filter(user=user).order_by("-date")[:7]
            analytics = compute_analytics(all_entries)
            lines.extend([
                f"",
                f"7-day averages:",
                f"  Avg duration: {analytics['average_duration_hours']}h",
                f"  Avg quality: {analytics['average_quality']}/5",
                f"  Consistency: {analytics['consistency_score']}%",
                f"",
                f"— SleepSync",
            ])

            body = "\n".join(lines)
            try:
                send_mail(
                    subject=f"SleepSync — Last night's sleep report",
                    message=body,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@sleepsync.app"),
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                sent += 1
                self.stdout.write(self.style.SUCCESS(f"Sent to {user.email}"))
            except Exception as e:
                logger.exception(f"Failed to send email to {user.email}")
                self.stdout.write(self.style.ERROR(f"Failed to send to {user.email}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Done. Sent {sent} email(s)."))
