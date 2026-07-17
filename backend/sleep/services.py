import statistics
from datetime import datetime, timedelta

# Tolerance constants for streak calculation
BED_TIME_TOLERANCE_MINUTES = 15
DURATION_TOLERANCE_HOURS = 0.5

# Consistency score mapping
CONSISTENCY_MAX_STDDEV_MINUTES = 120


def compute_analytics(entries):
    """Compute aggregate analytics from a queryset of SleepEntry objects."""
    durations = [e.duration_hours for e in entries]
    qualities = [e.quality for e in entries]

    avg_duration = round(sum(durations) / len(durations), 2)
    avg_quality = round(sum(qualities) / len(qualities), 2)

    # Consistency: std dev of bed times mapped to 0-100 score
    bed_time_minutes = []
    for entry in entries:
        bt = entry.bed_time
        minutes = bt.hour * 60 + bt.minute
        bed_time_minutes.append(minutes)

    stddev = statistics.stdev(bed_time_minutes) if len(bed_time_minutes) > 1 else 0
    consistency = max(0, round(100 - (stddev / CONSISTENCY_MAX_STDDEV_MINUTES) * 100))

    # Best and worst nights by quality, tie-break by duration
    best = max(entries, key=lambda e: (e.quality, e.duration_hours))
    worst = min(entries, key=lambda e: (e.quality, e.duration_hours))

    return {
        "average_duration_hours": avg_duration,
        "average_quality": avg_quality,
        "consistency_score": consistency,
        "best_night": {
            "date": str(best.date),
            "quality": best.quality,
            "duration_hours": best.duration_hours,
        },
        "worst_night": {
            "date": str(worst.date),
            "quality": worst.quality,
            "duration_hours": worst.duration_hours,
        },
        "total_nights_logged": entries.count(),
    }


def _goal_met(entry, goal):
    """Check if a single entry meets the user's sleep goal within tolerance."""
    # Bed time tolerance: compare time-of-day
    actual_bt = entry.bed_time.time()
    target_bt = goal.target_bed_time

    actual_minutes = actual_bt.hour * 60 + actual_bt.minute
    target_minutes = target_bt.hour * 60 + target_bt.minute
    bed_diff = abs(actual_minutes - target_minutes)

    # Handle overnight wrap (e.g., target 23:30, actual 00:15 = 45 min diff)
    if bed_diff > 720:
        bed_diff = 1440 - bed_diff

    duration_diff = abs(entry.duration_hours - goal.target_duration_hours)

    return bed_diff <= BED_TIME_TOLERANCE_MINUTES and duration_diff <= DURATION_TOLERANCE_HOURS


def compute_streaks(entries, goal):
    """Compute current streak, longest streak, and weekly score from entries."""
    entries = list(entries)
    if not entries:
        return {
            "current_streak_days": 0,
            "longest_streak_days": 0,
            "weekly_score": 0,
            "goal_met_last_7_nights": [],
        }

    met_flags = [_goal_met(e, goal) for e in entries]

    # Current streak: count from most recent backwards
    current_streak = 0
    for met in reversed(met_flags):
        if met:
            current_streak += 1
        else:
            break

    # Longest streak: scan all
    longest_streak = 0
    streak = 0
    for met in met_flags:
        if met:
            streak += 1
            longest_streak = max(longest_streak, streak)
        else:
            streak = 0

    # Weekly score: last 7 nights
    last_7 = met_flags[-7:]
    weekly_score = round((sum(last_7) / len(last_7)) * 100) if last_7 else 0

    return {
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "weekly_score": weekly_score,
        "goal_met_last_7_nights": last_7,
    }
