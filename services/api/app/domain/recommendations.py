"""Transparent deterministic matching. No LLM, raw usage or inferred free time."""

from datetime import UTC, datetime, timedelta
from uuid import NAMESPACE_URL, UUID, uuid5
from zoneinfo import ZoneInfo

from app.domain.quest_occurrences import occurrence
from app.schemas.quests import QuestDefinition
from app.schemas.recommendations import RecommendationOffer

TEMPLATES = {
    "reading": ("Read for a little while", "Reading", 20),
    "walking": ("Make room for a short walk", "Walking", 10),
    "arts_and_crafts": ("Make something with your hands", "Arts and crafts", 20),
    "music": ("Make time for music", "Music", 15),
    "cooking": ("Make time to cook", "Cooking", 20),
    "gym": ("Make room for some movement", "Gym", 20),
}


def offer(owner: UUID, settings, now: datetime) -> RecommendationOffer:
    zone = (settings.plan_draft or {}).get("timezone_id") if settings else None
    zone = zone or "UTC"
    local = now.astimezone(ZoneInfo(zone))
    choices = settings.activities.get("selected_activity_ids", []) if settings else []
    choices = sorted(set(choices) & TEMPLATES.keys())
    if "reading" in choices and local.hour >= 21:
        selected = "reading"
    elif "walking" in choices and 7 <= local.hour < 20:
        selected = "walking"
    else:
        selected = choices[local.date().toordinal() % len(choices)] if choices else None
    title, activity, minutes = TEMPLATES.get(
        selected, ("Make room for a little offline time", "Offline break", 10)
    )
    slot = int(now.timestamp()) // 900
    identity = f"hoosh/recommendation/v1/{owner}/{slot}/{settings.revision if settings else 0}"
    return RecommendationOffer(
        offer_id=uuid5(NAMESPACE_URL, identity),
        title=title,
        activity=activity,
        duration_minutes=minutes,
        timezone_id=zone,
        source="activity_template" if selected else "generic_template",
        expires_at=datetime.fromtimestamp((slot + 1) * 900, UTC),
    )


def one_time_definition(value: RecommendationOffer, now: datetime) -> QuestDefinition:
    # Reviewable wall-clock time; normal quest scheduling remains the activation authority.
    start = now.astimezone(ZoneInfo(value.timezone_id)).replace(second=0, microsecond=0)
    start += timedelta(minutes=2)
    for _ in range(181):
        end = start + timedelta(minutes=value.duration_minutes)
        definition = QuestDefinition(
            title=value.title,
            activity=value.activity,
            start_local=start.strftime("%H:%M"),
            end_local=end.strftime("%H:%M"),
            next_day=end.date() > start.date(),
            repeat="none",
            weekdays=[],
            timezone_id=value.timezone_id,
        )
        bounds = occurrence(definition, start.date(), start.date())
        if (
            bounds
            and bounds[0] > now
            and bounds[1] - bounds[0] == timedelta(minutes=value.duration_minutes)
        ):
            return definition
        # Avoid past fold occurrences and gap/fold windows with a different real duration.
        start += timedelta(minutes=1)
    raise ValueError("No valid near-term quest time")
