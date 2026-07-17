import statistics
from datetime import datetime, timedelta

from groq import Groq

from django.conf import settings

from .models import SleepEntry, SleepGoal

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


AI_LOOKBACK_NIGHTS = 14
MIN_NIGHTS_FOR_RECOMMENDATION = 3

SYSTEM_PROMPT = (
    "You are a sleep hygiene assistant analyzing a user's personal sleep log. "
    "You will be given a list of recent nights with bed time, wake time, sleep quality (1-5), "
    "free-text notes, and lifestyle factors (caffeine timing, exercise, screen time before bed). "
    "Identify concrete patterns connecting these factors to sleep quality. "
    "Then provide one specific, actionable recommendation in 2-4 sentences. "
    "Reference the user's actual data (e.g., specific factors or dates) rather than giving generic sleep advice. "
    "Do not invent information not present in the data. "
    "Maintain a supportive, non-clinical tone. "
    "If the data is insufficient to identify a pattern, say so honestly rather than guessing."
)


def generate_recommendation(user):
    """Generate an AI sleep recommendation based on the user's recent entries."""
    entries = list(
        SleepEntry.objects.filter(user=user)
        .order_by("-date")[:AI_LOOKBACK_NIGHTS]
    )

    if len(entries) < MIN_NIGHTS_FOR_RECOMMENDATION:
        return (
            f"You've logged {len(entries)} night(s) so far. "
            f"Log at least {MIN_NIGHTS_FOR_RECOMMENDATION} nights to get a personalized recommendation."
        )

    goal = SleepGoal.objects.filter(user=user).first()

    nights_text = ""
    for e in reversed(entries):
        nights_text += (
            f"- Date: {e.date}, Bed: {e.bed_time.strftime('%H:%M')}, "
            f"Wake: {e.wake_time.strftime('%H:%M')}, Duration: {e.duration_hours}h, "
            f"Quality: {e.quality}/5, Caffeine: {e.caffeine}, "
            f"Exercise: {'yes' if e.exercise else 'no'}, "
            f"Screen before bed: {'yes' if e.screen_time_before_bed else 'no'}"
        )
        if e.notes:
            nights_text += f", Notes: {e.notes}"
        nights_text += "\n"

    goal_text = ""
    if goal:
        goal_text = (
            f"\nUser's sleep goal: bed by {goal.target_bed_time.strftime('%H:%M')}, "
            f"wake at {goal.target_wake_time.strftime('%H:%M')}, "
            f"target {goal.target_duration_hours}h sleep.\n"
        )

    user_message = (
        f"Here are my recent nights:\n{nights_text}"
        f"{goal_text}"
        f"Based on this data, what pattern do you notice, and what is your recommendation?"
    )

    api_key = settings.GROQ_API_KEY
    if not api_key:
        return "AI recommendation is not configured. Set the GROQ_API_KEY environment variable."

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=256,
        temperature=0.7,
    )

    return response.choices[0].message.content
