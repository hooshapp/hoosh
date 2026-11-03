"""Own settings queries; replace only submitted sections in the atomic CAS."""

from typing import NoReturn

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.models import UserSettings
from app.schemas.errors import ConflictDetails, ErrorCode
from app.schemas.settings import MAX_REVISION, ActivityPreferences, SettingsPatch


def read_own_settings(session: UserSession) -> UserSettings | None:
    owner = require_user_context(session)
    return session.scalars(select(UserSettings).where(UserSettings.user_id == owner)).one_or_none()


def save_own_settings(session: UserSession, patch: SettingsPatch) -> UserSettings:
    owner = require_user_context(session)
    # Do not use exclude_none: explicit null is a clear intent. No read/merge race.
    changes = patch.model_dump(mode="json", exclude_unset=True, exclude={"expected_revision"})
    if "activities" in changes and changes["activities"] is None:
        changes["activities"] = ActivityPreferences(
            selected_activity_ids=[], custom_text=None
        ).model_dump(mode="json")
    if patch.expected_revision == 0:
        statement = (
            insert(UserSettings)
            .values(user_id=owner, revision=1, **changes)
            .on_conflict_do_nothing(index_elements=[UserSettings.user_id])
            .returning(UserSettings)
        )
    else:
        statement = (
            update(UserSettings)
            .where(
                UserSettings.user_id == owner,
                UserSettings.revision == patch.expected_revision,
                UserSettings.revision < MAX_REVISION,
            )
            .values(revision=UserSettings.revision + 1, **changes)
            .returning(UserSettings)
        )
    try:
        row = session.scalars(statement.execution_options(populate_existing=True)).one_or_none()
    except IntegrityError as error:
        diagnostic = getattr(error.orig, "diag", None)
        if (
            getattr(error.orig, "sqlstate", None) == "23503"
            and getattr(diagnostic, "schema_name", None) == "public"
            and getattr(diagnostic, "table_name", None) == "user_settings"
            and getattr(diagnostic, "constraint_name", None) == "fk_user_settings_user_id_users"
        ):
            raise ApiError(ErrorCode.FORBIDDEN) from None
        raise
    if row is not None:
        return row
    _raise_conflict(session)


def _raise_conflict(session: UserSession) -> NoReturn:
    owner = require_user_context(session)
    current = session.scalar(select(UserSettings.revision).where(UserSettings.user_id == owner))
    raise ApiError(
        ErrorCode.SETTINGS_CONFLICT,
        details=ConflictDetails(current_revision=current if current is not None else 0),
    )
