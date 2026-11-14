from datetime import date
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas.history import HistoryPut
from tests.auth.support import settings
from tests.support.http import authenticated_app


def payload():
    return dict(
        expected_revision=0,
        series_id=str(uuid4()),
        timezone_id="UTC",
        selected_count=1,
        started_on="2026-11-01",
        source="android_usage_events_v1",
        days=[],
    )


@pytest.mark.parametrize(
    "patch",
    [
        {"selected_count": True},
        {"selected_count": 0},
        {"timezone_id": "Bad/Zone"},
        {"source": "fake"},
        {"packages": ["private.app"]},
        {"expected_revision": -1},
        {"days": [{"day": str(date(2026, 11, 1)), "usage_ms": 0, "coverage": "missing"}]},
        {"days": [{"day": "2026-11-01", "usage_ms": None, "coverage": "reported"}]},
        {"days": [{"day": "2026-11-01", "usage_ms": True, "coverage": "reported"}]},
    ],
)
def test_strict_content_free_history_schema(patch):
    with pytest.raises(ValidationError):
        HistoryPut.model_validate(payload() | patch)


def test_auth_and_json_guards_precede_database(monkeypatch):
    app, headers = authenticated_app(monkeypatch, settings())
    with TestClient(app) as client:
        assert client.get("/v1/history").status_code == 401
        assert client.put("/v1/history/series", json=payload()).status_code == 401
        assert (
            client.put("/v1/history/series", headers=headers, content="x" * 16385).status_code
            == 413
        )
        assert (
            client.put(
                "/v1/history/series",
                headers=headers | {"Content-Type": "application/json"},
                content='{"days":[],"days":[]}',
            ).status_code
            == 422
        )
