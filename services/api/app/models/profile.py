"""Minimal M2 profile. HTTP validation/revision compare-and-swap arrive in API-08/09."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    FetchedValue,
    ForeignKey,
    MetaData,
    Table,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# Frozen Python 3.12 str.strip whitespace, NOT JavaScript trim or a locale regex.
STRIP_CHARACTERS = (
    "\t\n\v\f\r\x1c\x1d\x1e\x1f \x85\xa0\u1680\u2000\u2001\u2002\u2003\u2004"
    "\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000"
)
NAME_CHECK = (
    "display_name IS NULL OR (char_length(display_name) BETWEEN 1 AND 80 "
    "AND display_name = pg_catalog.btrim(display_name, E'"
    + "".join(f"\\u{ord(char):04x}" for char in STRIP_CHARACTERS)
    + "'))"
)

# Resolves the FK for ORM/autogenerate without claiming ownership of managed Auth.
_auth_users = Table(
    "users",
    MetaData(),
    Column("id", PG_UUID(as_uuid=True), primary_key=True),
    schema="auth",
    info={"external": True},
)


class Profile(Base):
    __tablename__ = "profiles"
    __table_args__ = (
        CheckConstraint(NAME_CHECK, name="display_name_valid"),
        CheckConstraint("revision >= 1", name="revision_positive"),
        {"schema": "public"},
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(_auth_users.c.id, ondelete="CASCADE"),
        primary_key=True,
    )
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    revision: Mapped[int] = mapped_column(server_default=text("1"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("statement_timestamp()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("statement_timestamp()"),
        server_onupdate=FetchedValue(),
        nullable=False,
    )
