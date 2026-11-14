"""Fixed baseline and honest comparable periods over bounded own daily summaries."""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import DateTime, select
from sqlalchemy.dialects.postgresql import insert

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.models.history import HistoryRecord as Record
from app.models.rewards import RewardEntry
from app.schemas.errors import ConflictDetails, ErrorCode, ValidationDetails, ValidationField
from app.schemas.history import HistoryPut, HistoryView, HistoryWindow

DAY = 86400000


def conflict(revision):
    raise ApiError(ErrorCode.HISTORY_CONFLICT, details=ConflictDetails(current_revision=revision))


def invalid():
    raise ApiError(
        ErrorCode.VALIDATION_ERROR,
        details=ValidationDetails(fields=[ValidationField(field="body", code="invalid_range")]),
    )


def duration(day: date, zone: ZoneInfo):
    # UTC timestamps across midnight are23/24/25hours; never subtract same-zone datetimes.
    return int(
        (
            datetime.combine(day + timedelta(days=1), datetime.min.time(), zone).timestamp()
            - datetime.combine(day, datetime.min.time(), zone).timestamp()
        )
        * 1000
    )


def normalized(day, value, zone):
    return round(value * DAY / duration(day, zone))


def closed_days(today, count):
    return [today - timedelta(days=i) for i in range(count, 0, -1)]


def turn_offs(session, owner, start, end, zone):
    # Count intent, not credited amount; reward cooldowns do not erase a genuine quit.
    start_at = datetime.combine(start, datetime.min.time(), zone)
    end_at = datetime.combine(end, datetime.min.time(), zone)
    entries = session.scalars(
        select(RewardEntry)
        .where(
            RewardEntry.user_id == owner,
            RewardEntry.kind == "native",
            RewardEntry.payload["kind"].astext == "quit",
            RewardEntry.payload["occurred_at"].astext.cast(DateTime(timezone=True)) >= start_at,
            RewardEntry.payload["occurred_at"].astext.cast(DateTime(timezone=True)) < end_at,
        )
        .order_by(
            RewardEntry.payload["occurred_at"].astext.cast(DateTime(timezone=True)),
            RewardEntry.sequence,
        )
    )
    counts = {"initial": 0, "expired": 0, "mid_session": 0}
    seen = set()
    for entry in entries:
        at = datetime.fromisoformat(entry.payload["occurred_at"].replace("Z", "+00:00"))
        key = (entry.installation_id, entry.payload["encounter_id"])
        if start_at <= at < end_at and key not in seen:
            counts[entry.payload["context"]] += 1
            seen.add(key)
    return counts


def view(session: UserSession, now: datetime):
    owner = require_user_context(session)
    row = session.get(Record, owner)
    zone = ZoneInfo(row.timezone_id if row else "UTC")
    today = now.astimezone(zone).date()
    baseline = row.baseline if row else None
    days = row.days if row else {}

    def window(count):
        target = closed_days(today, count)
        known = [d for d in target if days.get(str(d), {}).get("coverage") == "reported"]
        current = (
            sum(normalized(d, days[str(d)]["usage_ms"], zone) for d in known)
            if len(known) == count
            else None
        )
        after = bool(baseline and str(target[0]) >= baseline["ends_before"])
        eligible = bool(after and current is not None)
        prior = baseline["normalized_ms"] * (count // 7) if eligible else None
        return HistoryWindow(
            starts_on=target[0],
            ends_before=today,
            expected_days=count,
            reported_days=len(known),
            usage_ms=current,
            baseline_ms=prior,
            saved_ms=prior - current if eligible else None,
            reduction_percent=round((prior - current) * 100 / prior, 2)
            if eligible and prior
            else None,
            eligible=eligible,
            reason="collecting_baseline"
            if not baseline
            else "baseline_overlap"
            if not after
            else "incomplete"
            if not eligible
            else "ready",
            turn_offs=turn_offs(session, owner, target[0], today, zone),
        )

    return HistoryView(
        user_id=owner,
        revision=row.revision if row else 0,
        series_id=row.series_id if row else None,
        timezone_id=row.timezone_id if row else None,
        selected_count=row.selected_count if row else None,
        started_on=row.started_on if row else None,
        source="android_usage_events_v1",
        observed_at=now,
        baseline_starts_on=baseline["starts_on"] if baseline else None,
        baseline_ends_before=baseline["ends_before"] if baseline else None,
        baseline_reported_days=7
        if baseline
        else min(
            6,
            max(
                (
                    sum(
                        days.get(str(start + timedelta(days=i)), {}).get("coverage") == "reported"
                        for i in range(7)
                    )
                    for start in (date.fromisoformat(d) for d in days)
                ),
                default=0,
            ),
        ),
        week=window(7),
        month=window(28),
    )


def save(session: UserSession, body: HistoryPut, now: datetime):
    owner = require_user_context(session)
    # Lock a stable per-user identity row, including first inserts, to serialize reset/upload.
    session.execute(
        select(Record).where(Record.user_id == owner).with_for_update()
    ).scalar_one_or_none()
    row = session.get(Record, owner)
    zone = ZoneInfo(body.timezone_id)
    today = now.astimezone(zone).date()
    if not today - timedelta(days=3660) <= body.started_on <= today:
        invalid()
    for day in body.days:
        if not max(body.started_on, today - timedelta(days=60)) <= day.day < today or (
            day.usage_ms is not None and day.usage_ms > duration(day.day, zone)
        ):
            invalid()
    same = row is not None and row.series_id == body.series_id
    if same and (
        row.timezone_id != body.timezone_id
        or row.selected_count != body.selected_count
        or row.started_on != body.started_on
    ):
        conflict(row.revision)
    if not same:
        if body.expected_revision != (row.revision if row else 0):
            conflict(row.revision if row else 0)
        if row is None:
            inserted = session.execute(
                insert(Record)
                .values(
                    user_id=owner,
                    revision=1,
                    series_id=body.series_id,
                    timezone_id=body.timezone_id,
                    selected_count=body.selected_count,
                    started_on=body.started_on,
                    days={},
                    baseline=None,
                    created_at=now,
                    updated_at=now,
                )
                .on_conflict_do_nothing()
                .returning(Record.user_id)
            ).scalar_one_or_none()
            if inserted is None:
                latest = session.get(Record, owner, populate_existing=True)
                conflict(latest.revision if latest else 1)
            row = session.get(Record, owner, populate_existing=True)
        else:
            if row.revision >= 2147483647:
                conflict(row.revision)
            row.series_id, row.timezone_id, row.selected_count, row.started_on = (
                body.series_id,
                body.timezone_id,
                body.selected_count,
                body.started_on,
            )
            row.days, row.baseline = {}, None
            row.revision += 1
    # Same-series replay is safe despite newer revision; completed daily evidence is immutable.
    values = dict(row.days)
    for item in body.days:
        value = item.model_dump(mode="json")
        previous = values.get(str(item.day))
        if previous and previous["coverage"] == "reported" and previous != value:
            conflict(row.revision)
        values[str(item.day)] = value
    if not row.baseline:
        for key in sorted(values):
            start = date.fromisoformat(key)
            run = [start + timedelta(days=i) for i in range(7)]
            if all(values.get(str(d), {}).get("coverage") == "reported" for d in run):
                row.baseline = {
                    "starts_on": str(start),
                    "ends_before": str(start + timedelta(days=7)),
                    "normalized_ms": sum(
                        normalized(d, values[str(d)]["usage_ms"], zone) for d in run
                    ),
                }
                break
    values = {k: v for k, v in values.items() if k >= str(today - timedelta(days=56))}
    if len(values) > 56:
        invalid()
    if values != row.days:
        if row.revision >= 2147483647:
            conflict(row.revision)
        row.days = values
        row.revision += 1
        row.updated_at = now
    session.flush()
    return view(session, now)
