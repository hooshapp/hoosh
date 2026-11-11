"""Own saved definitions; content-free tombstones prevent stale-ID resurrection."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, FetchedValue, ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.managed_auth import auth_users
from app.models.profile import STRIP_CHARACTERS

_strip = "E'" + "".join(f"\\u{ord(c):04x}" for c in STRIP_CHARACTERS) + "'"
_day_count = " + ".join(f"((definition->'weekdays') @> '[{d}]'::jsonb)::int" for d in range(7))
QUEST_CHECKS = {
    "revision_positive": "revision >= 1",
    "definition_valid": "definition IS NULL OR (jsonb_typeof(definition) = 'object' AND "
    "definition ?& ARRAY['title','activity','start_local','end_local','next_day',"
    "'repeat','weekdays','timezone_id'] AND definition - ARRAY['title','activity',"
    "'start_local','end_local','next_day','repeat','weekdays','timezone_id'] = '{}'::jsonb "
    "AND jsonb_typeof(definition->'title') = 'string' "
    "AND char_length(definition->>'title') BETWEEN 1 AND 120 "
    f"AND definition->>'title' = btrim(definition->>'title', {_strip}) "
    "AND jsonb_typeof(definition->'activity') = 'string' "
    "AND char_length(definition->>'activity') BETWEEN 1 AND 200 "
    f"AND definition->>'activity' = btrim(definition->>'activity', {_strip}) "
    "AND jsonb_typeof(definition->'start_local') = 'string' "
    "AND definition->>'start_local' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' "
    "AND jsonb_typeof(definition->'end_local') = 'string' "
    "AND definition->>'end_local' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' "
    "AND jsonb_typeof(definition->'next_day') = 'boolean' AND "
    "((definition->'next_day' = 'true'::jsonb AND "
    "definition->>'end_local' < definition->>'start_local') OR "
    "(definition->'next_day' = 'false'::jsonb AND "
    "definition->>'end_local' > definition->>'start_local')) "
    "AND definition->>'repeat' IN ('none','daily','weekly') "
    "AND jsonb_typeof(definition->'repeat') = 'string' "
    "AND CASE WHEN jsonb_typeof(definition->'weekdays') = 'array' THEN "
    "(definition->'weekdays') <@ '[0,1,2,3,4,5,6]'::jsonb AND "
    f"jsonb_array_length(definition->'weekdays') = ({_day_count}) AND "
    "((definition->>'repeat' = 'weekly' AND "
    "jsonb_array_length(definition->'weekdays') BETWEEN 1 AND 7) OR "
    "(definition->>'repeat' IN ('none','daily') AND "
    "jsonb_array_length(definition->'weekdays') = 0)) ELSE false END "
    "AND jsonb_typeof(definition->'timezone_id') = 'string' "
    "AND char_length(definition->>'timezone_id') BETWEEN 1 AND 128 "
    "AND definition->>'timezone_id' ~ '^[A-Za-z0-9_+/-]+$') IS TRUE",
}


class UserQuest(Base):
    __tablename__ = "user_quests"
    __table_args__ = (
        *(CheckConstraint(value, name=name) for name, value in QUEST_CHECKS.items()),
        {"schema": "public"},
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    quest_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    definition: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True), nullable=True)
    revision: Mapped[int] = mapped_column(nullable=False, server_default=text("1"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("statement_timestamp()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("statement_timestamp()"),
        server_onupdate=FetchedValue(),
    )
