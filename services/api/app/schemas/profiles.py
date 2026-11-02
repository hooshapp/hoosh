"""M2 read wire shape; absence is explicit and every nullable field is required."""

from datetime import UTC, datetime
from uuid import UUID

from pydantic import AwareDatetime, Field, StrictInt, StrictStr, field_validator
from pydantic_core import PydanticCustomError

from app.schemas.errors import WireModel


class ProfileView(WireModel):
    user_id: UUID
    display_name: str | None = Field(min_length=1, max_length=80)
    revision: StrictInt = Field(ge=1)
    created_at: AwareDatetime = Field(
        description="Server-created UTC RFC 3339 timestamp with Z.",
        json_schema_extra={"pattern": "Z$"},
    )
    updated_at: AwareDatetime = Field(
        description="Server-updated UTC RFC 3339 timestamp with Z.",
        json_schema_extra={"pattern": "Z$"},
    )

    @field_validator("created_at", "updated_at")
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        # Session TimeZone may differ. Never attach a guessed zone to a naive value.
        return value.astimezone(UTC)


class ProfileResponse(WireModel):
    profile: ProfileView | None


class ProfileSavedResponse(WireModel):
    """A successful mutation always returns a persisted profile, never absence."""

    profile: ProfileView


class ProfilePatch(WireModel):
    expected_revision: StrictInt = Field(ge=0)
    display_name: StrictStr | None = Field(
        description=(
            "Required mutable field: null clears. Reject NUL/unpaired surrogates, then Python "
            "3.12 str.strip(); require 1–80 Unicode code points after stripping. "
            "No Unicode/case normalization. Raw request body is limited to 16 KiB."
        )
    )

    @field_validator("display_name")
    @classmethod
    def canonical_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if any(char == "\x00" or 0xD800 <= ord(char) <= 0xDFFF for char in value):
            raise PydanticCustomError("invalid_text", "Invalid text")
        value = value.strip()
        if not value:
            raise PydanticCustomError("blank", "Name is blank")
        if len(value) > 80:
            raise PydanticCustomError("too_long", "Name is too long")
        return value
