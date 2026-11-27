"""One wallet row serializes earning, delivery receipts and spending per account."""

from datetime import date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.models.rewards import RewardEntry as Entry
from app.models.rewards import RewardStream as Stream
from app.models.rewards import RewardWallet as Wallet
from app.repositories.recommendations import save_nudge_quest
from app.repositories.settings import read_own_settings
from app.schemas.errors import ConflictDetails, ErrorCode, ValidationDetails, ValidationField
from app.schemas.rewards import (
    FeedPut,
    FeedReceipt,
    FeedResult,
    RewardBatch,
    RewardBatchResult,
    RewardView,
)


def conflict(revision=0):
    raise ApiError(ErrorCode.REWARD_CONFLICT, details=ConflictDetails(current_revision=revision))


def invalid():
    raise ApiError(
        ErrorCode.VALIDATION_ERROR,
        details=ValidationDetails(fields=[ValidationField(field="body", code="invalid_range")]),
    )


def locked(session: UserSession, now: datetime):
    owner = require_user_context(session)
    session.execute(
        insert(Wallet)
        .values(
            user_id=owner,
            balance=0,
            health=50,
            revision=1,
            health_at=now,
            streak_days=0,
            streak_unknown=True,
        )
        .on_conflict_do_nothing()
    )
    return session.scalar(
        select(Wallet)
        .where(Wallet.user_id == owner)
        .with_for_update()
        .execution_options(populate_existing=True)
    )


def health(wallet, now):
    ticks = max(0, int((now - wallet.health_at).total_seconds()) // 86400)
    return max(0, wallet.health - ticks * 5), ticks


def feed_health(session: UserSession) -> int:
    settings = read_own_settings(session)
    minutes = (settings.plan_draft or {}).get("session_minutes") if settings else None
    return min(minutes, 100) if type(minutes) is int and minutes > 0 else 20


def view(session: UserSession, now: datetime):
    owner = require_user_context(session)
    w = session.get(Wallet, owner)
    value = health(w, now)[0] if w else 50
    # Seven filled dots need seven actual healthy day receipts, never a numerical
    # streak threshold. Missing telemetry freezes the count, but is not coverage.
    week_complete = False
    unknown = not w or w.streak_unknown
    if w and w.streak_day:
        latest_stream = session.scalar(
            select(Stream)
            .where(Stream.user_id == owner)
            .order_by(Stream.last_at.desc().nullslast())
            .limit(1)
        )
        today = (
            now.astimezone(ZoneInfo(latest_stream.timezone_id)).date()
            if latest_stream
            else now.date()
        )
        unknown = unknown or w.streak_day < today - timedelta(days=1)
        days = {str(today - timedelta(days=i)) for i in range(1, 8)}
        reports = session.scalars(
            select(Entry).where(
                Entry.user_id == owner,
                Entry.kind == "native",
                Entry.payload["kind"].astext == "day_closed",
                Entry.payload["day"].astext.in_(days),
            )
        )
        good, bad = set(), set()
        for report in reports:
            target = good if report.payload["covered"] and not report.payload["exhausted"] else bad
            target.add(report.payload["day"])
        week_complete = not unknown and good == days and not bad
    return RewardView(
        user_id=owner,
        revision=w.revision if w else 0,
        balance=w.balance if w else 0,
        health=value,
        feed_health=feed_health(session),
        artwork=(
            "needsCare"
            if value <= 25
            else "feelingLow"
            if value <= 50
            else "doingOkay"
            if value <= 75
            else "happy"
        ),
        streak_days=None if unknown else w.streak_days,
        recent_week_complete=week_complete,
        observed_at=now,
        health_warning_at=(
            w.health_at + timedelta(days=max(0, (w.health - 25 + 4) // 5)) if w else None
        ),
    )


def bump(w):
    if w.revision >= 2147483647:
        conflict(w.revision)
    w.revision += 1


def quest_credit(session: UserSession, quest: UUID, revision: int, day: date, now: datetime):
    owner = require_user_context(session)
    w = locked(session, now)
    source = f"quest:{quest}:{revision}:{day}"
    if session.get(Entry, (owner, source)):
        return
    if w.balance > 9007199254740991 - 50:
        conflict(w.revision)
    session.add(
        Entry(user_id=owner, source=source, kind="quest", amount=50, recorded_at=now, payload={})
    )
    w.balance += 50
    bump(w)
    session.flush()


def feed(session: UserSession, request_id: UUID, body: FeedPut, now: datetime):
    owner = require_user_context(session)
    w = locked(session, now)
    source = f"feed:{request_id}"
    old = session.get(Entry, (owner, source))
    if old:
        if old.payload["expected_revision"] != body.expected_revision:
            conflict(w.revision)
        return FeedResult(
            request_id=request_id,
            charged_credits=-old.amount,
            health_added=old.payload["health_added"],
            wallet=view(session, now),
        )
    # Compare only the locked row, including concurrent first-wallet creation.
    # An absent revision0 cannot fund Feed and must not spend a concurrently earned balance.
    if body.expected_revision != w.revision:
        conflict(w.revision)
    value, ticks = health(w, now)
    if w.balance < 10 or value == 100:
        conflict(w.revision)
    added = min(feed_health(session), 100 - value)
    w.balance -= 10
    w.health = value + added
    w.health_at += timedelta(days=ticks)
    bump(w)
    session.add(
        Entry(
            user_id=owner,
            source=source,
            kind="feed",
            amount=-10,
            recorded_at=now,
            payload={"expected_revision": body.expected_revision, "health_added": added},
        )
    )
    session.flush()
    return FeedResult(request_id=request_id, health_added=added, wallet=view(session, now))


def feed_receipt(session: UserSession, request_id: UUID, now: datetime):
    owner = require_user_context(session)
    receipt = session.get(Entry, (owner, f"feed:{request_id}"))
    return FeedReceipt(
        request_id=request_id,
        recorded=receipt is not None,
        health_added=receipt.payload["health_added"] if receipt else None,
        wallet=view(session, now),
    )


def ingest(session: UserSession, body: RewardBatch, now: datetime):
    owner = require_user_context(session)
    w = locked(session, now)
    stream = session.get(Stream, (owner, body.installation_id))
    if stream is None:
        # Bound dormant/rotated installation metadata without erasing receipt history.
        if (
            len(session.scalars(select(Stream).where(Stream.user_id == owner).limit(65)).all())
            >= 64
        ):
            conflict(w.revision)
        stream = Stream(
            user_id=owner,
            installation_id=body.installation_id,
            sequence=body.acknowledged,
            discarded=0,
            timezone_id=body.timezone_id,
        )
        session.add(stream)
        if body.acknowledged:
            w.streak_unknown = True
    elif body.acknowledged > stream.sequence:
        # The device had already removed this server-confirmed prefix before a
        # restore. Continue at its cursor without fabricating credits or coverage.
        stream.sequence = body.acknowledged
        w.streak_unknown = True
    if stream.timezone_id != body.timezone_id or body.discarded < stream.discarded:
        conflict(w.revision)
    gap_budget = body.discarded - stream.discarded
    if gap_budget:
        w.streak_unknown = True
    changed = bool(gap_budget)
    for e in body.events:
        source = f"native:{body.installation_id}:{e.event_id}"
        payload = e.model_dump(mode="json")
        if e.session_minutes is None:
            payload.pop("session_minutes", None)
        old = session.get(Entry, (owner, source))
        if old:
            if old.payload != payload or old.sequence != e.sequence:
                conflict(w.revision)
            continue
        if e.sequence <= stream.sequence:
            conflict(w.revision)
        missing = e.sequence - stream.sequence - 1
        if missing > gap_budget:
            conflict(w.revision)
        gap_budget -= missing
        if e.occurred_at > now + timedelta(minutes=5) or e.occurred_at < now - timedelta(days=30):
            invalid()
        if stream.last_at and e.occurred_at < stream.last_at:
            invalid()
        local = e.occurred_at.astimezone(ZoneInfo(body.timezone_id)).date()
        if (e.kind == "day_closed" and not local - timedelta(days=2) <= e.day < local) or (
            e.kind != "day_closed" and e.day != local
        ):
            invalid()
        amount = 0
        prior_encounter = None
        if e.kind in ("quit", "nudge_skipped"):
            encounter = str(e.encounter_id)
            prior_encounter = session.scalar(
                select(Entry.source)
                .where(
                    Entry.user_id == owner,
                    Entry.installation_id == body.installation_id,
                    Entry.payload["encounter_id"].astext == encounter,
                )
                .limit(1)
            )
            if e.kind == "quit" and not prior_encounter:
                amount = {
                    "initial": 5,
                    "expired": 20,
                    "mid_session": 20,
                    "notification_accept": 30,
                }[e.context]
                if w.balance > 9007199254740991 - amount:
                    conflict(w.revision)
                w.last_native_at = e.occurred_at
                if e.context == "notification_accept":
                    save_nudge_quest(session, e.day, now)
        if e.kind in ("allowance", "app_open"):
            cost = e.session_minutes if e.session_minutes is not None else (4 if e.exhausted else 2)
            # Apply once for each accepted new session, in addition to time decay.
            # A delayed event from before the last Feed must not eat that meal.
            latest_feed = session.scalar(
                select(Entry.recorded_at)
                .where(Entry.user_id == owner, Entry.kind == "feed")
                .order_by(Entry.recorded_at.desc())
                .limit(1)
            )
            if latest_feed is None or e.occurred_at >= latest_feed:
                value, ticks = health(w, now)
                w.health = max(0, value - cost)
                w.health_at += timedelta(days=ticks)
        if e.kind == "allowance" and e.exhausted:
            w.streak_days = 0
            w.streak_day = e.day
            w.streak_unknown = False
        if e.kind == "day_closed" and (w.streak_day is None or e.day > w.streak_day):
            if not e.covered:
                w.streak_unknown = True
            elif e.exhausted:
                w.streak_days = 0
                w.streak_unknown = False
            else:
                w.streak_days += 1
                w.streak_unknown = False
            w.streak_day = e.day
        session.add(
            Entry(
                user_id=owner,
                source=source,
                kind="native",
                amount=amount,
                recorded_at=now,
                payload=payload,
                installation_id=body.installation_id,
                sequence=e.sequence,
            )
        )
        w.balance += amount
        stream.sequence = e.sequence
        stream.last_at = e.occurred_at
        changed = True
        session.flush()
    stream.discarded = body.discarded
    if changed:
        bump(w)
    session.flush()
    return RewardBatchResult(
        installation_id=body.installation_id,
        accepted_sequence=stream.sequence,
        wallet=view(session, now),
    )
