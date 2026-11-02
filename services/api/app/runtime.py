"""Validated runtime composition; resource construction belongs to app lifespan."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.concurrency import run_in_threadpool

from app.application import create_app as assemble_app
from app.core.auth import SupabaseTokenVerifier, UnavailableTokenVerifier
from app.core.config import Settings
from app.core.jwks import JwksResolver
from app.db.engine import Database


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings if settings is not None else Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        resolver = None
        database = None
        try:
            if settings.database_url is not None:
                database = Database(settings)  # Lazy pool: never connects during startup.
                application.state.database = database
            if settings.auth_configured:
                resolver = JwksResolver(settings)
                application.state.token_verifier = SupabaseTokenVerifier(settings, resolver)
            yield
        finally:
            application.state.token_verifier = UnavailableTokenVerifier()
            application.state.database = None
            try:
                if resolver is not None:
                    await resolver.aclose()
            finally:
                if database is not None:
                    await run_in_threadpool(database.close)

    application = assemble_app(cors_origins=settings.cors_allowed_origins, lifespan=lifespan)
    application.state.settings = settings
    return application
