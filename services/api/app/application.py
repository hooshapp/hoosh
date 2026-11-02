"""Side-effect-free assembly: no environment reads, runtime app or network clients."""

from collections.abc import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import Lifespan

from app.api.health import router as health_router
from app.api.v1.me import router as identity_router
from app.api.v1.profiles import router as profile_router
from app.core.auth import UnavailableTokenVerifier
from app.core.errors import install_error_handlers
from app.core.openapi import install_openapi
from app.core.profile_body import ProfileBodyMiddleware
from app.core.request_context import RequestContextMiddleware, UnexpectedErrorMiddleware
from app.schemas.errors import ErrorEnvelope


def create_app(*, cors_origins: Sequence[str] = (), lifespan: Lifespan | None = None) -> FastAPI:
    application = FastAPI(
        title="Disconnect API",
        version="0.0.0",
        lifespan=lifespan,
        responses={500: {"model": ErrorEnvelope, "description": "Safe unexpected failure"}},
        description="Verified identity and isolated, revision-safe profiles.",
    )
    application.state.token_verifier = UnavailableTokenVerifier()
    application.state.database = None
    install_error_handlers(application)
    # Starlette inserts at the front: context → CORS → errors → bounded body → routes.
    application.add_middleware(ProfileBodyMiddleware)
    application.add_middleware(UnexpectedErrorMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Request-ID"],
    )
    application.add_middleware(RequestContextMiddleware)
    application.include_router(health_router)
    application.include_router(identity_router)
    application.include_router(profile_router)
    install_openapi(application)
    return application
