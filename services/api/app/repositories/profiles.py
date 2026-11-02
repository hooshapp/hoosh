"""Own-profile queries; no owner input, implicit creation or Auth metadata lookup."""

from typing import NoReturn

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError

from app.core.errors import ApiError
from app.db.session import UserSession, require_user_context
from app.models import Profile
from app.schemas.errors import ConflictDetails, ErrorCode
from app.schemas.profiles import ProfilePatch

MAX_PROFILE_REVISION = 2_147_483_647


def read_own_profile(session: UserSession) -> Profile | None:
    user_id = require_user_context(session)
    # Explicit owner predicate supplements RLS, rather than relying on it alone.
    return session.scalars(select(Profile).where(Profile.user_id == user_id)).one_or_none()


def save_own_profile(session: UserSession, patch: ProfilePatch) -> Profile:
    user_id = require_user_context(session)
    # A larger positive expectation cannot match int32 storage. Avoid binding an
    # out-of-range integer; keep the adopted arbitrary-positive expectation shape.
    if patch.expected_revision > MAX_PROFILE_REVISION:
        _raise_conflict(session)
    if patch.expected_revision == 0:
        statement = (
            insert(Profile)
            .values(user_id=user_id, display_name=patch.display_name, revision=1)
            .on_conflict_do_nothing(index_elements=[Profile.user_id])
            .returning(Profile)
        )
    else:
        statement = (
            update(Profile)
            .where(
                Profile.user_id == user_id,
                Profile.revision == patch.expected_revision,
                # The applied schema stores int32. Never wrap/reset an exhausted revision.
                Profile.revision < MAX_PROFILE_REVISION,
            )
            .values(display_name=patch.display_name, revision=Profile.revision + 1)
            .returning(Profile)
        )
    try:
        row = session.scalars(statement.execution_options(populate_existing=True)).one_or_none()
    except IntegrityError as error:
        diagnostic = getattr(error.orig, "diag", None)
        if (
            getattr(error.orig, "sqlstate", None) == "23503"
            and getattr(diagnostic, "schema_name", None) == "public"
            and getattr(diagnostic, "table_name", None) == "profiles"
            and getattr(diagnostic, "constraint_name", None) == "fk_profiles_user_id_users"
        ):
            # Abort the entire unit; no query/retry on this now-failed transaction.
            raise ApiError(ErrorCode.FORBIDDEN) from None
        raise
    if row is not None:
        return row
    _raise_conflict(session)


def _raise_conflict(session: UserSession) -> NoReturn:
    user_id = require_user_context(session)
    # A fresh READ COMMITTED statement sees a concurrent insert/update's committed
    # revision. This snapshot is advisory, scoped to this owner, never auto-replayed.
    current = session.scalar(select(Profile.revision).where(Profile.user_id == user_id))
    raise ApiError(
        ErrorCode.PROFILE_CONFLICT,
        details=ConflictDetails(current_revision=current if current is not None else 0),
    )
