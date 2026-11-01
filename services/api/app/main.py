"""Server entry only: schema tooling imports application, never this runtime app."""

from app.runtime import create_app

app = create_app()
