"""Runtime entry point. Schema tooling must import application, never this module."""

from fastapi import FastAPI

from app.application import create_app as assemble_app
from app.core.config import Settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings if settings is not None else Settings()
    application = assemble_app(cors_origins=settings.cors_allowed_origins)
    application.state.settings = settings
    return application


app = create_app()
