"""Own-profile queries; no owner input, implicit creation or Auth metadata lookup."""

from sqlalchemy import select

from app.db.session import UserSession, require_user_context
from app.models import Profile


def read_own_profile(session: UserSession) -> Profile | None:
    user_id = require_user_context(session)
    # Explicit owner predicate supplements RLS, rather than relying on it alone.
    return session.scalars(select(Profile).where(Profile.user_id == user_id)).one_or_none()
