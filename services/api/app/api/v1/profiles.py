from fastapi import APIRouter

from app.db.dependencies import UserSessionDependency
from app.repositories.profiles import read_own_profile
from app.schemas.errors import ErrorEnvelope
from app.schemas.profiles import ProfileResponse, ProfileView

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
