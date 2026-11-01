"""Deterministic tests never inherit a developer's provider settings."""

import pytest

from app.core.config import Settings


@pytest.fixture(autouse=True)
def isolated_runtime_environment(monkeypatch):
    for name in Settings.model_fields:
        monkeypatch.delenv(name.upper(), raising=False)
