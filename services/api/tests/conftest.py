"""Deterministic tests never inherit a developer's provider settings."""

import pytest

from app.core.config import Settings


@pytest.fixture(autouse=True)
def isolated_runtime_environment(monkeypatch, request):
    if request.node.get_closest_marker("database"):
        # DB acceptance requires its explicitly supplied APP_ENV=test, not Settings.
        return
    for name in Settings.model_fields:
        monkeypatch.delenv(name.upper(), raising=False)
