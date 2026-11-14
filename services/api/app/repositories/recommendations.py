"""Decision and one-time quest creation commit together; no activation or reward on Accept."""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.domain.recommendations import offer, one_time_definition
from app.models.recommendations import RecommendationDecision as Decision
from app.models.settings import UserSettings
from app.repositories.quests import own_row, save_own_quest
from app.schemas.errors import ErrorCode
from app.schemas.quests import QuestPut
from app.schemas.recommendations import RecommendationAction, RecommendationView


def conflict():
    raise ApiError(ErrorCode.RECOMMENDATION_CONFLICT)


def decided_view(session, row, now):
    quest = own_row(session, row.quest_id) if row.quest_id else None
    return RecommendationView(
        user_id=require_user_context(session),
        observed_at=now,
        state=row.decision,
        offer=None,
        accepted_quest_id=row.quest_id if quest and quest.definition is not None else None,
        next_offer_at=row.next_offer_at,
    )


def current(session: UserSession, now: datetime):
    owner = require_user_context(session)
    row = session.get(Decision, owner)
    if row and now < row.next_offer_at:
        return decided_view(session, row, now)
    return RecommendationView(
        user_id=owner,
        observed_at=now,
        state="offered",
        offer=offer(owner, session.get(UserSettings, owner), now),
        accepted_quest_id=None,
        next_offer_at=None,
    )


def decide(session: UserSession, body: RecommendationAction, now: datetime):
    owner = require_user_context(session)
    row = session.scalar(
        select(Decision)
        .where(Decision.user_id == owner)
        .with_for_update()
        .execution_options(populate_existing=True)
    )

    def replay():
        if row and row.offer_id == body.offer_id:
            if row.decision != body.action:
                conflict()
            return decided_view(session, row, now)
        if row and now < row.next_offer_at:
            conflict()
        return None

    previous = replay()
    if previous:
        return previous
    proposed = offer(owner, session.get(UserSettings, owner), now)
    if proposed.offer_id != body.offer_id:
        conflict()
    values = dict(
        offer_id=body.offer_id,
        decision=body.action,
        quest_id=body.offer_id if body.action == "accepted" else None,
        decided_at=now,
        next_offer_at=now + timedelta(hours=24),
    )
    if row is None:
        try:
            added = session.scalar(
                insert(Decision)
                .values(user_id=owner, **values)
                .on_conflict_do_nothing()
                .returning(Decision.user_id)
            )
        except IntegrityError as error:
            if (
                getattr(error.orig, "sqlstate", None) == "23503"
                and getattr(getattr(error.orig, "diag", None), "constraint_name", None)
                == "fk_recommendation_decisions_user_id_users"
            ):
                raise ApiError(ErrorCode.FORBIDDEN) from None
            raise
        row = session.scalar(
            select(Decision)
            .where(Decision.user_id == owner)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if added is None:
            previous = replay()
            if previous:
                return previous
            conflict()
    else:
        for key, value in values.items():
            setattr(row, key, value)
    if body.action == "accepted":
        save_own_quest(
            session,
            body.offer_id,
            QuestPut(expected_revision=0, definition=one_time_definition(proposed, now)),
        )
    session.flush()
    return decided_view(session, row, now)
