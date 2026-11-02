from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.db.dependencies import UserSessionDependency, database
from app.repositories.profiles import read_own_profile, save_own_profile
from app.schemas.errors import ErrorEnvelope
from app.schemas.profiles import ProfilePatch, ProfileResponse, ProfileSavedResponse, ProfileView

router = APIRouter(prefix="/v1", tags=["profile"])


@router.get(
    "/profile",
    response_model=ProfileResponse,
    operation_id="get_own_profile",
    summary="Read the authenticated user's profile",
    description=(
        "The verified access-token subject selects the row; no owner parameter. "
        "Returns {profile:null} only when no row exists. Never creates a profile or imports "
        "Auth metadata. Nullable fields are present; timestamps are UTC RFC 3339 with Z. "
        "Database failure is 503, not absence or sign-out. No-store."
    ),
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing, invalid or expired credentials"},
        403: {"model": ErrorEnvelope, "description": "Verified anonymous identity excluded in M2"},
        503: {"model": ErrorEnvelope, "description": "Identity trust or database unavailable"},
        500: {"model": ErrorEnvelope, "description": "Safe unexpected failure"},
    },
)
def read_profile(session: UserSessionDependency) -> ProfileResponse:
    row = read_own_profile(session)
    # Snapshot inside the live unit; never serialize a detached/lazy ORM object.
    profile = ProfileView.model_validate(row, from_attributes=True) if row is not None else None
    return ProfileResponse(profile=profile)


@router.patch(
    "/profile",
    response_model=ProfileSavedResponse,
    operation_id="save_own_profile",
    summary="Create or edit the authenticated user's profile with a revision check",
    description=(
        "Strict JSON object, at most 16384 raw bytes including streamed bodies. "
        "Expected revision 0 creates only if absent; positive revision updates only a matching "
        "own row and increments atomically. Null clears the required display_name field. "
        "Names use Python 3.12 str.strip and at most 80 Unicode code points after stripping; "
        "reject NUL/unpaired surrogates. No owner input or Auth metadata write. "
        "409 contains only the own current revision (0 if absent); preserve drafts and refetch. "
        "A deleted-owner FK is 403; unrelated errors are not reclassified. "
        "Never automatically replay writes after a lost response, 401 or 503. No-store."
    ),
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing, invalid or expired credentials"},
        403: {"model": ErrorEnvelope, "description": "Anonymous or deleted owner excluded"},
        409: {"model": ErrorEnvelope, "description": "Own revision mismatch or storage exhaustion"},
        413: {"model": ErrorEnvelope, "description": "Raw request exceeds 16 KiB"},
        422: {"model": ErrorEnvelope, "description": "Safe JSON/field validation failure"},
        503: {"model": ErrorEnvelope, "description": "Identity trust or database unavailable"},
    },
)
def patch_profile(
    body: ProfilePatch,
    request: Request,
    identity: Annotated[VerifiedIdentity, Depends(verified_identity)],
) -> ProfileSavedResponse:
    # Open the same verified-user unit only AFTER FastAPI has validated the body
    # and identity. Its exit commits before the handler can return HTTP success.
    with database(request).transaction(identity) as session:
        row = save_own_profile(session, body)
        result = ProfileSavedResponse(profile=ProfileView.model_validate(row, from_attributes=True))
    return result
