from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SleepEntry(models.Model):
    CAFFEINE_CHOICES = [
        ("NONE", "None"),
        ("MORNING", "Morning"),
        ("AFTERNOON", "Afternoon"),
        ("EVENING", "Evening"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sleep_entries",
    )
    date = models.DateField(help_text="The night of (date the user went to bed)")
    bed_time = models.DateTimeField()
    wake_time = models.DateTimeField()
    quality = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    notes = models.TextField(blank=True, default="")
    caffeine = models.CharField(
        max_length=10,
        choices=CAFFEINE_CHOICES,
        default="NONE",
    )
    exercise = models.BooleanField(default=False)
    screen_time_before_bed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ("user", "date")

    def __str__(self):
        return f"{self.user.username} — {self.date} (Q:{self.quality})"

    @property
    def duration_hours(self):
        delta = self.wake_time - self.bed_time
        return round(delta.total_seconds() / 3600, 2)


class SleepGoal(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sleep_goal",
    )
    target_bed_time = models.TimeField()
    target_wake_time = models.TimeField()
    target_duration_hours = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Sleep Goal"
        verbose_name_plural = "Sleep Goals"

    def __str__(self):
        return f"{self.user.username} — target {self.target_duration_hours}h"
