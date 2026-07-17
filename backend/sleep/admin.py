from django.contrib import admin

from .models import SleepEntry, SleepGoal


@admin.register(SleepEntry)
class SleepEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "quality", "caffeine", "exercise", "screen_time_before_bed")
    list_filter = ("quality", "caffeine", "exercise", "screen_time_before_bed")
    search_fields = ("user__username", "notes")


@admin.register(SleepGoal)
class SleepGoalAdmin(admin.ModelAdmin):
    list_display = ("user", "target_bed_time", "target_wake_time", "target_duration_hours")
