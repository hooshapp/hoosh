"""Pure saved-zone compiler; mirrors native boundary policy, never assumes usage."""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.schemas.quests import QuestDefinition


def boundary(day: date, value: str, zone: ZoneInfo, *, end: bool) -> datetime:
    local = datetime.combine(day, time.fromisoformat(value))
    # A gap clamps to the first valid minute. Covers historical date-line skips too.
    for _ in range(1441):
        candidates = {
            local.replace(tzinfo=zone, fold=fold).astimezone(UTC)
            for fold in (0, 1)
            if local.replace(tzinfo=zone, fold=fold)
            .astimezone(UTC)
            .astimezone(zone)
            .replace(tzinfo=None)
            == local
        }
        if candidates:
            return max(candidates) if end else min(candidates)
        local += timedelta(minutes=1)
    raise ValueError("Timezone boundary unavailable")


def occurrence(definition: QuestDefinition, first: date, day: date):
    if day < first or (definition.repeat == "none" and day != first):
        return None
    if definition.repeat == "weekly" and day.weekday() not in definition.weekdays:
        return None
    zone = ZoneInfo(definition.timezone_id)
    start = boundary(day, definition.start_local, zone, end=False)
    finish = boundary(
        day + timedelta(days=int(definition.next_day)), definition.end_local, zone, end=True
    )
    return (start, finish) if finish > start else None
