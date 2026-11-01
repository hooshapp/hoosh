"""Authentication dependency: one bearer header, one verified identity authority."""

from typing import Annotated

from fastapi import Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth import bearer_token
from app.core.errors import ApiError
from app.core.identity import TokenVerifier, VerifiedIdentity
from app.schemas.errors import ErrorCode

access_token_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="SupabaseAccessToken",
    description="User access JWT from the configured Supabase project; never an API key.",
)


async def verified_identity(
    request: Request,
    _credentials: Annotated[HTTPAuthorizationCredentials | None, Security(access_token_scheme)],
) -> VerifiedIdentity:
    values = request.headers.getlist("Authorization")
    if len(values) != 1:
        raise ApiError(ErrorCode.AUTH_REQUIRED)
    token = bearer_token(values[0])
    verifier: TokenVerifier = request.app.state.token_verifier
    return await verifier.verify(token)
