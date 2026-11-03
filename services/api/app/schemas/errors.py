"""Shared safe error envelope, including the reserved M2 detail shapes."""

from enum import StrEnum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, field_validator


class ErrorCode(StrEnum):
    AUTH_REQUIRED = "AUTH_REQUIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    FORBIDDEN = "FORBIDDEN"
    PROFILE_CONFLICT = "PROFILE_CONFLICT"
    SETTINGS_CONFLICT = "SETTINGS_CONFLICT"
    REQUEST_TOO_LARGE = "REQUEST_TOO_LARGE"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTH_UNAVAILABLE = "AUTH_UNAVAILABLE"
    DEPENDENCY_UNAVAILABLE = "DEPENDENCY_UNAVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    HTTP_ERROR = "HTTP_ERROR"


class WireModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ValidationField(WireModel):
    field: Literal[
        "body",
        "expected_revision",
        "display_name",
        "activities",
        "activities.selected_activity_ids",
        "activities.custom_text",
        "plan_draft",
        "plan_draft.weekdays",
        "plan_draft.hours",
        "plan_draft.hours.start_local",
        "plan_draft.hours.end_local",
        "plan_draft.hours.next_day",
        "plan_draft.timezone_id",
        "plan_draft.session_count",
        "plan_draft.session_minutes",
    ]
    code: Literal[
        "required",
        "invalid_type",
        "blank",
        "too_long",
        "invalid_text",
        "out_of_range",
        "extra_field",
        "invalid_json",
        "duplicate",
        "invalid_choice",
        "invalid_time",
        "invalid_range",
        "invalid_timezone",
    ]


class ValidationDetails(WireModel):
    fields: list[ValidationField] = Field(min_length=1, max_length=10)


class ConflictDetails(WireModel):
    current_revision: StrictInt = Field(ge=0)


class CommonErrorBody(WireModel):
    message: str
    request_id: UUID
    retryable: StrictBool

    @field_validator("retryable", mode="before")
    @classmethod
    def strict_retryable(cls, value):
        if type(value) is not bool:
            raise ValueError("Retryability must be a JSON boolean")
        return value


class GeneralErrorBody(CommonErrorBody):
    code: Literal[
        ErrorCode.AUTH_REQUIRED,
        ErrorCode.INVALID_TOKEN,
        ErrorCode.TOKEN_EXPIRED,
        ErrorCode.FORBIDDEN,
        ErrorCode.REQUEST_TOO_LARGE,
        ErrorCode.INTERNAL_ERROR,
        ErrorCode.NOT_FOUND,
        ErrorCode.METHOD_NOT_ALLOWED,
        ErrorCode.HTTP_ERROR,
    ]
    retryable: Literal[False]


class UnavailableErrorBody(CommonErrorBody):
    code: Literal[ErrorCode.AUTH_UNAVAILABLE, ErrorCode.DEPENDENCY_UNAVAILABLE]
    retryable: Literal[True]


class ValidationErrorBody(CommonErrorBody):
    code: Literal[ErrorCode.VALIDATION_ERROR]
    retryable: Literal[False]
    details: ValidationDetails


class ConflictErrorBody(CommonErrorBody):
    code: Literal[ErrorCode.PROFILE_CONFLICT, ErrorCode.SETTINGS_CONFLICT]
    retryable: Literal[False]
    details: ConflictDetails


ErrorBody = Annotated[
    GeneralErrorBody | UnavailableErrorBody | ValidationErrorBody | ConflictErrorBody,
    Field(discriminator="code"),
]


class ErrorEnvelope(WireModel):
    error: ErrorBody
