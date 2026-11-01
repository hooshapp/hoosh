from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import verified_identity
from app.core.identity import VerifiedIdentity
from app.schemas.errors import ErrorEnvelope
from app.schemas.identity import MeResponse

router = APIRouter(prefix="/v1", tags=["identity"])


@router.get(
    "/me",
    response_model=MeResponse,
    operation_id="get_verified_identity",
    summary="Read the verified current user's identity",
    description="No profile insertion or database connection. Email is display-only; no-store.",
    responses={
        401: {"model": ErrorEnvelope, "description": "Missing, invalid or expired credentials"},
        403: {"model": ErrorEnvelope, "description": "Verified anonymous identity excluded in M1"},
        503: {"model": ErrorEnvelope, "description": "Required identity trust unavailable"},
        500: {"model": ErrorEnvelope, "description": "Safe unexpected failure"},
    },
)
async def read_me(identity: Annotated[VerifiedIdentity, Depends(verified_identity)]) -> MeResponse:
    return MeResponse(user_id=identity.user_id, email=identity.email)
