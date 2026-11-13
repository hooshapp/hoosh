"""Parent-row serialization makes schedule CAS, cancellation and deletion coherent."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.domain.quest_occurrences import occurrence
from app.models.quest import UserQuest
from app.models.quest_execution import QuestOccurrenceOutcome as Outcome
from app.models.quest_execution import QuestScheduleVersion as Version
from app.schemas.errors import ConflictDetails, ErrorCode, ValidationDetails, ValidationField
from app.schemas.quest_execution import (
    QuestExecutionView,
    QuestOccurrenceView,
    QuestSchedulePut,
    QuestScheduleVersionView,
)
from app.schemas.quests import QuestDefinition


def conflict(revision=0):
    raise ApiError(ErrorCode.QUEST_CONFLICT, details=ConflictDetails(current_revision=revision))


def locked_quest(session: UserSession, quest_id: UUID):
    owner = require_user_context(session)
    return session.scalar(
        select(UserQuest)
        .where(UserQuest.user_id == owner, UserQuest.quest_id == quest_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )


def latest(session: UserSession, quest_id: UUID):
    owner = require_user_context(session)
    return session.scalar(
        select(Version)
        .where(Version.user_id == owner, Version.quest_id == quest_id)
        .order_by(Version.revision.desc())
        .limit(1)
    )


def relevant_versions(session: UserSession, quest_id: UUID, now: datetime):
    owner = require_user_context(session)
    # Current definition plus recently closed versions for overnight/active snapshots.
    return list(
        session.scalars(
            select(Version)
            .where(
                Version.user_id == owner,
                Version.quest_id == quest_id,
                Version.definition.is_not(None),
                Version.enabled.is_(True),
                (Version.effective_until.is_(None))
                | (Version.effective_until >= now - timedelta(days=32)),
            )
            .order_by(Version.revision.desc())
            .limit(129)
        )
    )


def bounds(version: Version, day: date):
    if not version.enabled or version.definition is None:
        return None
    times = occurrence(QuestDefinition.model_validate(version.definition), version.first_date, day)
    if (
        times is None
        or times[0] < version.effective_from
        or (version.effective_until is not None and times[0] >= version.effective_until)
    ):
        return None
    return times


def stop_active(session: UserSession, quest_id: UUID, now: datetime):
    owner = require_user_context(session)
    for version in relevant_versions(session, quest_id, now):
        if version.definition is None:
            continue
        today = now.astimezone(ZoneInfo(version.definition["timezone_id"])).date()
        for day in (today - timedelta(days=1), today):
            times = bounds(version, day)
            if times and times[0] <= now < times[1]:
                session.execute(
                    insert(Outcome)
                    .values(
                        user_id=owner,
                        quest_id=quest_id,
                        schedule_revision=version.revision,
                        local_date=day,
                        state="cancelled",
                        credits=0,
                    )
                    .on_conflict_do_nothing()
                )


def put_schedule(session: UserSession, quest_id: UUID, body: QuestSchedulePut, now: datetime):
    owner = require_user_context(session)
    quest = locked_quest(session, quest_id)
    previous = latest(session, quest_id)
    revision = previous.revision if previous else 0
    if previous is not None:
        now = max(now, previous.effective_from)
    if (
        not quest
        or quest.definition is None
        or quest.revision != body.quest_revision
        or revision != body.expected_revision
    ):
        conflict(revision)
    definition = QuestDefinition.model_validate(quest.definition)
    today = now.astimezone(ZoneInfo(definition.timezone_id)).date()
    if body.enabled:
        if body.first_date < today or body.first_date > today + timedelta(days=365):
            raise ApiError(
                ErrorCode.VALIDATION_ERROR,
                details=ValidationDetails(
                    fields=[ValidationField(field="body", code="invalid_range")]
                ),
            )
        candidates = [
            occurrence(definition, body.first_date, body.first_date + timedelta(days=i))
            for i in range(7)
        ]
        first = next((value for value in candidates if value is not None), None)
        if first is None or first[0] < now:
            raise ApiError(
                ErrorCode.VALIDATION_ERROR,
                details=ValidationDetails(
                    fields=[ValidationField(field="body", code="invalid_range")]
                ),
            )
    else:
        stop_active(session, quest_id, now)
    # An update preserves already-active old windows. Stop records explicit cancellation.
    if previous is not None:
        previous.effective_until = now
    session.add(
        Version(
            user_id=owner,
            quest_id=quest_id,
            revision=revision + 1,
            quest_revision=quest.revision,
            first_date=body.first_date,
            definition=quest.definition,
            effective_from=now,
            effective_until=None,
            enabled=body.enabled,
        )
    )
    session.flush()
    return execution(session, quest_id, now)


def execution(
    session: UserSession, quest_id: UUID, now: datetime, first: date | None = None, days=14
):
    owner = require_user_context(session)
    current = latest(session, quest_id)
    versions = relevant_versions(session, quest_id, now)
    if len(versions) > 128:
        conflict(current.revision if current else 0)
    zone = (
        ZoneInfo(current.definition["timezone_id"])
        if current and current.definition
        else ZoneInfo("UTC")
    )
    today = now.astimezone(zone).date()
    first = first or today - timedelta(days=7)
    if not today - timedelta(days=31) <= first <= today + timedelta(days=365):
        raise ApiError(
            ErrorCode.VALIDATION_ERROR,
            details=ValidationDetails(fields=[ValidationField(field="body", code="invalid_range")]),
        )
    finish = first + timedelta(days=days)
    outcomes = {
        (row.schedule_revision, row.local_date): row
        for row in session.scalars(
            select(Outcome).where(
                Outcome.user_id == owner,
                Outcome.quest_id == quest_id,
                Outcome.local_date >= first,
                Outcome.local_date < finish,
            )
        )
    }
    views = []
    for version in versions:
        for offset in range(days):
            day = first + timedelta(days=offset)
            times = bounds(version, day)
            if not times:
                continue
            start, end = times
            outcome = outcomes.get((version.revision, day))
            eligible = end <= now <= end + timedelta(days=7)
            state = (
                outcome.state
                if outcome
                else "upcoming"
                if now < start
                else "active"
                if now < end
                else "ended"
                if eligible
                else "missed"
            )
            views.append(
                QuestOccurrenceView(
                    schedule_revision=version.revision,
                    local_date=day,
                    starts_at=start,
                    ends_at=end,
                    title=version.definition["title"],
                    state=state,
                    can_confirm=outcome is None and eligible,
                    credits=outcome.credits if outcome else 0,
                )
            )
    credits, count = session.execute(
        select(func.coalesce(func.sum(Outcome.credits), 0), func.count()).where(
            Outcome.user_id == owner, Outcome.quest_id == quest_id, Outcome.state == "completed"
        )
    ).one()
    return QuestExecutionView(
        user_id=owner,
        quest_id=quest_id,
        observed_at=now,
        revision=current.revision if current else 0,
        enabled=bool(current and current.enabled and current.definition),
        versions=[
            QuestScheduleVersionView(
                revision=v.revision,
                quest_revision=v.quest_revision,
                first_date=v.first_date,
                definition=QuestDefinition.model_validate(v.definition),
                effective_from=v.effective_from,
                effective_until=v.effective_until,
                enabled=v.enabled,
            )
            for v in versions
            if v.definition
        ],
        occurrences=sorted(views, key=lambda v: (v.starts_at, v.schedule_revision)),
        credits=credits,
        completed_count=count,
    )


def put_outcome(
    session: UserSession, quest_id: UUID, revision: int, day: date, state: str, now: datetime
):
    owner = require_user_context(session)
    quest = locked_quest(session, quest_id)
    if not quest or quest.definition is None:
        conflict()
    key = (owner, quest_id, revision, day)
    existing = session.get(Outcome, key)
    if existing:
        if existing.state != state:
            conflict()
        return existing
    version = session.get(Version, (owner, quest_id, revision))
    times = bounds(version, day) if version else None
    if (
        times is None
        or (state == "completed" and not times[1] <= now <= times[1] + timedelta(days=7))
        or (state == "cancelled" and now >= times[1])
    ):
        raise ApiError(
            ErrorCode.VALIDATION_ERROR,
            details=ValidationDetails(fields=[ValidationField(field="body", code="invalid_range")]),
        )
    row = Outcome(
        user_id=owner,
        quest_id=quest_id,
        schedule_revision=revision,
        local_date=day,
        state=state,
        credits=50 if state == "completed" else 0,
    )
    session.add(row)
    if state == "completed":
        from app.repositories.rewards import quest_credit

        quest_credit(session, quest_id, revision, day, now)
    session.flush()
    return row


def erase_quest_execution(session: UserSession, quest_id: UUID):
    owner = require_user_context(session)
    now = datetime.now(UTC)
    stop_active(session, quest_id, now)
    session.execute(
        update(Version)
        .where(Version.user_id == owner, Version.quest_id == quest_id)
        .values(
            definition=None,
            enabled=False,
            effective_until=func.coalesce(Version.effective_until, now),
        )
    )
