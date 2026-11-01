"""Validated runtime composition; resource construction belongs to app lifespan."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.application import create_app as assemble_app
from app.core.auth import SupabaseTokenVerifier, UnavailableTokenVerifier
from app.core.config import Settings
from app.core.jwks import JwksResolver


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings if settings is not None else Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        if not settings.auth_configured:
            yield
            return
        resolver = JwksResolver(settings)
        try:
            application.state.token_verifier = SupabaseTokenVerifier(settings, resolver)
            yield
        finally:
            application.state.token_verifier = UnavailableTokenVerifier()
            await resolver.aclose()

    application = assemble_app(cors_origins=settings.cors_allowed_origins, lifespan=lifespan)
    application.state.settings = settings
    return application
