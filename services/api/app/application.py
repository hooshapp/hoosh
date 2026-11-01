"""Side-effect-free assembly: no environment reads, runtime app or network clients."""

from collections.abc import Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import Lifespan

from app.api.health import router as health_router
from app.core.auth import UnavailableTokenVerifier
from app.core.errors import install_error_handlers
from app.core.request_context import RequestContextMiddleware, UnexpectedErrorMiddleware


def create_app(*, cors_origins: Sequence[str] = (), lifespan: Lifespan | None = None) -> FastAPI:
    application = FastAPI(
        title="Disconnect API",
        version="0.0.0",
        lifespan=lifespan,
        description="Verified identity foundation; profiles and native protection are separate.",
    )
    application.state.token_verifier = UnavailableTokenVerifier()
    install_error_handlers(application)
    # Starlette inserts middleware at the front: context → CORS → error boundary → routes.
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
    return application
