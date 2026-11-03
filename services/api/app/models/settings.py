"""One settings row per Auth owner; drafts are data, never installed native policy."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, FetchedValue, ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.managed_auth import auth_users
from app.models.profile import STRIP_CHARACTERS

# Concrete storage predicates, not a general JSON-schema engine. Pydantic additionally
# checks timezone existence and canonicalizes weekday order at the API boundary.
_strip_sql = "E'" + "".join(f"\\u{ord(char):04x}" for char in STRIP_CHARACTERS) + "'"
_ids = ("gym", "reading", "arts_and_crafts", "walking", "music", "cooking")
_id_array = "'[" + ",".join('"' + item + '"' for item in _ids) + "]'::jsonb"
_id_count = " + ".join(
    f"((activities->'selected_activity_ids') @> '[\"{item}\"]'::jsonb)::int" for item in _ids
)
_day_count = " + ".join(f"((plan_draft->'weekdays') @> '[{day}]'::jsonb)::int" for day in range(7))
_time_pattern = "'^([01][0-9]|2[0-3]):[0-5][0-9]$'"
_hours = "plan_draft->'hours'"
SETTINGS_CHECKS = {
    "revision_positive": "revision >= 1",
    "activities_shape": "jsonb_typeof(activities) = 'object' AND "
    "activities ?& ARRAY['selected_activity_ids','custom_text'] AND "
    "activities - ARRAY['selected_activity_ids','custom_text'] = '{}'::jsonb",
    "activity_ids_valid": "CASE WHEN jsonb_typeof(activities->'selected_activity_ids') = 'array' "
    "THEN jsonb_array_length(activities->'selected_activity_ids') <= 6 AND "
    f"(activities->'selected_activity_ids') <@ {_id_array} AND "
    f"jsonb_array_length(activities->'selected_activity_ids') = ({_id_count}) ELSE false END",
    "custom_text_valid": "activities->'custom_text' = 'null'::jsonb OR "
    "(jsonb_typeof(activities->'custom_text') = 'string' AND "
    "char_length(activities->>'custom_text') BETWEEN 1 AND 200 AND "
    f"activities->>'custom_text' = btrim(activities->>'custom_text', {_strip_sql}))",
    "plan_draft_shape": "plan_draft IS NULL OR (jsonb_typeof(plan_draft) = 'object' AND "
    "plan_draft ?& ARRAY['weekdays','hours','timezone_id','session_count','session_minutes'] "
    "AND plan_draft - ARRAY['weekdays','hours','timezone_id','session_count','session_minutes'] "
    "= '{}'::jsonb)",
    "weekdays_valid": "plan_draft IS NULL OR CASE WHEN "
    "jsonb_typeof(plan_draft->'weekdays') = 'array' THEN "
    "jsonb_array_length(plan_draft->'weekdays') <= 7 AND "
    "(plan_draft->'weekdays') <@ '[0,1,2,3,4,5,6]'::jsonb AND "
    f"jsonb_array_length(plan_draft->'weekdays') = ({_day_count}) ELSE false END",
    "hours_valid": f"plan_draft IS NULL OR {_hours} = 'null'::jsonb OR ("
    f"jsonb_typeof({_hours}) = 'object' AND "
    f"({_hours}) ?& ARRAY['start_local','end_local','next_day'] AND "
    f"({_hours}) - ARRAY['start_local','end_local','next_day'] = '{{}}'::jsonb AND "
    f"jsonb_typeof({_hours}->'next_day') = 'boolean' AND "
    f"({_hours}->'start_local' = 'null'::jsonb OR ("
    f"jsonb_typeof({_hours}->'start_local') = 'string' AND "
    f"{_hours}->>'start_local' ~ {_time_pattern})) AND "
    f"({_hours}->'end_local' = 'null'::jsonb OR ("
    f"jsonb_typeof({_hours}->'end_local') = 'string' AND "
    f"{_hours}->>'end_local' ~ {_time_pattern})) AND ("
    f"{_hours}->'start_local' = 'null'::jsonb OR {_hours}->'end_local' = 'null'::jsonb OR "
    f"({_hours}->'next_day' = 'true'::jsonb AND "
    f"{_hours}->>'end_local' < {_hours}->>'start_local') OR "
    f"({_hours}->'next_day' = 'false'::jsonb AND "
    f"{_hours}->>'end_local' > {_hours}->>'start_local')))",
    "timezone_bounded": "plan_draft IS NULL OR plan_draft->'timezone_id' = 'null'::jsonb OR ("
    "jsonb_typeof(plan_draft->'timezone_id') = 'string' AND "
    "char_length(plan_draft->>'timezone_id') BETWEEN 1 AND 128 AND "
    "plan_draft->>'timezone_id' ~ '^[A-Za-z0-9_+/-]+$')",
}
for _key, _maximum in (("session_count", 1000), ("session_minutes", 1440)):
    SETTINGS_CHECKS[_key + "_valid"] = (
        f"plan_draft IS NULL OR plan_draft->'{_key}' = 'null'::jsonb OR CASE WHEN "
        f"jsonb_typeof(plan_draft->'{_key}') = 'number' THEN "
        f"(plan_draft->>'{_key}') ~ '^[0-9]+$' AND "
        f"(plan_draft->>'{_key}')::numeric BETWEEN 1 AND {_maximum} ELSE false END"
    )


class UserSettings(Base):
    __tablename__ = "user_settings"
    __table_args__ = (
        *(CheckConstraint(value, name=name) for name, value in SETTINGS_CHECKS.items()),
        {"schema": "public"},
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey(auth_users.c.id, ondelete="CASCADE"), primary_key=True
    )
    activities: Mapped[dict] = mapped_column(
        JSONB(none_as_null=True),
        nullable=False,
        server_default=text('\'{"selected_activity_ids":[],"custom_text": null}\'::jsonb'),
    )
    plan_draft: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True), nullable=True)
    revision: Mapped[int] = mapped_column(server_default=text("1"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("statement_timestamp()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("statement_timestamp()"),
        server_onupdate=FetchedValue(),
        nullable=False,
    )
