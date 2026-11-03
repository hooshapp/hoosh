from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories.settings import read_own_settings, save_own_settings
from app.schemas.errors import ErrorEnvelope
from app.schemas.settings import (
    SettingsPatch,
    SettingsResponse,
    SettingsSavedResponse,
    SettingsView,
)

router = APIRouter(prefix="/v1", tags=["settings"])


@router.get(
    "/settings",
    response_model=SettingsResponse,
    operation_id="get_own_settings",
    summary="Read the authenticated user's settings without creating a row",
    description=(
        "Returns {settings:null} only when absent. Owner comes only from the verified "
        "token; database failures are not absence. Nullable fields are explicit; "
        "timestamps are UTC with Z. No-store; no Auth or native policy mutation."
    ),
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing, invalid or expired credentials"},
        403: {"model": ErrorEnvelope, "description": "Anonymous identity excluded"},
        503: {"model": ErrorEnvelope, "description": "Identity trust or database unavailable"},
    },
)
def read_settings(session: UserSessionDependency) -> SettingsResponse:
    row = read_own_settings(session)
    result = SettingsView.model_validate(row, from_attributes=True) if row is not None else None
    return SettingsResponse(settings=result)


@router.patch(
    "/settings",
    response_model=SettingsSavedResponse,
    operation_id="save_own_settings",
    summary="Create or edit own settings with an atomic revision check",
    description=(
        "Strict JSON, at most 16384 raw bytes. Expected revision 0 creates only if "
        "absent; positive expectations update only matching own revision. Submit "
        "activities and/or plan_draft: omission preserves, activities null resets empty, "
        "plan_draft null clears; objects replace their whole section. Each accepted "
        "write increments once. Custom text strips once and has 1–200 Unicode code "
        "points; incomplete nullable plan drafts are valid. No installed-rule, "
        "onboarding, session, reward or profile mutation. 409 SETTINGS_CONFLICT gives "
        "only the own current revision; refetch/review and never blindly replay. "
        "Deleted-owner FK is 403. Commit precedes success; UTC clocks and no-store."
    ),
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing, invalid or expired credentials"},
        403: {"model": ErrorEnvelope, "description": "Anonymous or deleted owner excluded"},
        409: {"model": ErrorEnvelope, "description": "Own settings revision conflict"},
        413: {"model": ErrorEnvelope, "description": "Raw request exceeds 16 KiB"},
        422: {"model": ErrorEnvelope, "description": "Safe JSON/field validation failure"},
        503: {"model": ErrorEnvelope, "description": "Identity trust or database unavailable"},
    },
)
def patch_settings(
    body: SettingsPatch,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
) -> SettingsSavedResponse:
    with database(request).transaction(identity) as session:
        row = save_own_settings(session, body)
        result = SettingsSavedResponse(
            settings=SettingsView.model_validate(row, from_attributes=True)
        )
    return result
