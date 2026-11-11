"""Bounded own reads and atomic definition writes; no native/occurrence side effect."""

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.models.quest import UserQuest
from app.schemas.errors import ConflictDetails, ErrorCode
from app.schemas.quests import QuestPut
from app.schemas.settings import MAX_REVISION


def own_row(session: UserSession, quest_id: UUID) -> UserQuest | None:
    owner = require_user_context(session)
    return session.scalar(
        select(UserQuest)
        .where(UserQuest.user_id == owner, UserQuest.quest_id == quest_id)
        .execution_options(populate_existing=True)
    )


def list_own_quests(session: UserSession, cursor: UUID | None, limit: int) -> list[UserQuest]:
    owner = require_user_context(session)
    statement = select(UserQuest).where(
        UserQuest.user_id == owner, UserQuest.definition.is_not(None)
    )
    if cursor is not None:
        statement = statement.where(UserQuest.quest_id > cursor)
    return list(session.scalars(statement.order_by(UserQuest.quest_id).limit(limit + 1)))


def _conflict(row: UserQuest | None):
    raise ApiError(
        ErrorCode.QUEST_CONFLICT,
        details=ConflictDetails(current_revision=row.revision if row else 0),
    )


def save_own_quest(session: UserSession, quest_id: UUID, body: QuestPut) -> UserQuest:
    owner = require_user_context(session)
    definition = body.definition.model_dump(mode="json")
    if body.expected_revision == 0:
        statement = (
            insert(UserQuest)
            .values(user_id=owner, quest_id=quest_id, definition=definition, revision=1)
            .on_conflict_do_nothing(index_elements=[UserQuest.user_id, UserQuest.quest_id])
        )
    else:
        statement = (
            update(UserQuest)
            .where(
                UserQuest.user_id == owner,
                UserQuest.quest_id == quest_id,
                UserQuest.definition.is_not(None),
                UserQuest.revision == body.expected_revision,
                UserQuest.revision < MAX_REVISION,
            )
            .values(definition=definition, revision=UserQuest.revision + 1)
        )
    try:
        row = session.scalar(
            statement.returning(UserQuest).execution_options(populate_existing=True)
        )
    except IntegrityError as error:
        diag = getattr(error.orig, "diag", None)
        if (
            getattr(error.orig, "sqlstate", None) == "23503"
            and getattr(diag, "constraint_name", None) == "fk_user_quests_user_id_users"
            and getattr(diag, "schema_name", None) == "public"
            and getattr(diag, "table_name", None) == "user_quests"
        ):
            raise ApiError(ErrorCode.FORBIDDEN) from None
        raise
    if row is None:
        _conflict(own_row(session, quest_id))
    return row


def delete_own_quest(session: UserSession, quest_id: UUID, expected: int) -> None:
    owner = require_user_context(session)
    removed = session.scalar(
        update(UserQuest)
        .where(
            UserQuest.user_id == owner,
            UserQuest.quest_id == quest_id,
            UserQuest.definition.is_not(None),
            UserQuest.revision == expected,
            UserQuest.revision < MAX_REVISION,
        )
        .values(definition=None, revision=UserQuest.revision + 1)
        .returning(UserQuest.quest_id)
    )
    if removed is None:
        row = own_row(session, quest_id)
        if row is not None and row.definition is not None:
            _conflict(row)
