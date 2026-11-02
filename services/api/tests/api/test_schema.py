import importlib.util
import json
import sys

import httpx2
import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator, FormatChecker
from pydantic import ValidationError

from app.application import create_app
from app.core.config import Settings
from app.schemas.errors import ErrorCode, ErrorEnvelope
from app.schemas.identity import MeResponse
from tests.support.schema import FIXTURES, ROOT, SCHEMA_PATH, wire_validator


def exporter():
    spec = importlib.util.spec_from_file_location(
        "schema_export_test", ROOT / "scripts/export-openapi.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_export_is_deterministic_and_never_constructs_runtime_or_clients(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("Schema export attempted runtime settings/network construction")

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SUPABASE_PROJECT_URL", "invalid-and-incomplete")
    monkeypatch.setenv("DATABASE_URL", "invalid-and-secret-database-config")
    monkeypatch.setattr(Settings, "__init__", forbidden)
    monkeypatch.setattr(httpx2.AsyncClient, "__init__", forbidden)
    monkeypatch.setattr("app.db.engine.create_engine", forbidden)
    was_main_imported = "app.main" in sys.modules
    module = exporter()
    first = module.schema_text()
    assert first == module.schema_text() == SCHEMA_PATH.read_text()
    assert ("app.main" in sys.modules) == was_main_imported
    assert set(json.loads(first)["paths"]) == {"/healthz", "/v1/me", "/v1/profile"}


def test_export_drift_check_fails_without_mutating_artifacts(monkeypatch, tmp_path):
    module = exporter()
    target = tmp_path / "schema.json"
    target.write_text("stale")
    monkeypatch.setattr(module, "OUTPUT", target)
    monkeypatch.setattr(sys, "argv", ["export-openapi.py", "--check"])
    with pytest.raises(SystemExit, match="OpenAPI drift"):
        module.main()
    assert target.read_text() == "stale"
    monkeypatch.setattr(sys, "argv", ["export-openapi.py"])
    module.main()
    assert target.read_text() == module.schema_text()
    monkeypatch.setattr(sys, "argv", ["export-openapi.py", "--check"])
    module.main()


@pytest.mark.parametrize(
    "case", [c for c in FIXTURES if c["response"]["status"] >= 400], ids=lambda c: c["case"]
)
def test_shared_error_examples_match_pydantic_and_exported_json_schema(case):
    # M2 error shapes are reserved/shared contracts, not a claim of profile routes.
    body = case["response"]["body"]
    assert ErrorEnvelope.model_validate(body).model_dump(mode="json") == body
    wire_validator("ErrorEnvelope").validate(body)


@pytest.mark.parametrize(
    "case",
    [c for c in FIXTURES if c["request"]["path"] == "/v1/me" and c["response"]["status"] == 200],
    ids=lambda c: c["case"],
)
def test_shared_identity_examples_match_required_nullable_wire_schema(case):
    body = case["response"]["body"]
    assert MeResponse.model_validate(body).model_dump(mode="json") == body
    wire_validator("MeResponse").validate(body)


@pytest.mark.parametrize(
    "body",
    [
        {"user_id": "not-a-uuid", "email": None},
        {"user_id": "a46e48ad-c742-4e18-b57d-2c9a56544944"},
        {"user_id": "a46e48ad-c742-4e18-b57d-2c9a56544944", "email": False},
        {
            "user_id": "a46e48ad-c742-4e18-b57d-2c9a56544944",
            "email": None,
            "access_token": "secret",
        },
    ],
)
def test_public_identity_rejects_missing_invalid_and_internal_fields(body):
    with pytest.raises(ValidationError):
        MeResponse.model_validate(body)
    assert list(wire_validator("MeResponse").iter_errors(body))


def test_error_discriminator_covers_every_code_and_forbids_wrong_detail_retry_shapes():
    schema = ErrorEnvelope.model_json_schema()
    mapping = schema["properties"]["error"]["discriminator"]["mapping"]
    assert set(mapping) == {code.value for code in ErrorCode}
    base = {"request_id": "a46e48ad-c742-4e18-b57d-2c9a56544945", "message": "Safe copy"}
    bad = [
        {**base, "code": "AUTH_UNAVAILABLE", "retryable": False},
        {**base, "code": "INVALID_TOKEN", "retryable": True},
        {**base, "code": "INVALID_TOKEN", "retryable": False, "details": None},
        {**base, "code": "PROFILE_CONFLICT", "retryable": False},
        {
            **base,
            "code": "PROFILE_CONFLICT",
            "retryable": False,
            "details": {"current_revision": -1},
        },
        {
            **base,
            "code": "PROFILE_CONFLICT",
            "retryable": False,
            "details": {"current_revision": True},
        },
        {**base, "code": "VALIDATION_ERROR", "retryable": False},
        {**base, "code": "VALIDATION_ERROR", "retryable": False, "details": {"fields": []}},
        {
            **base,
            "code": "VALIDATION_ERROR",
            "retryable": False,
            "details": {"fields": [{"field": "secret-key", "code": "invalid_type"}]},
        },
        {
            **base,
            "code": "VALIDATION_ERROR",
            "retryable": False,
            "details": {"fields": [{"field": "body", "code": "invalid_type"}] * 11},
        },
    ]
    validator = wire_validator("ErrorEnvelope")
    for error in bad:
        with pytest.raises(ValidationError):
            ErrorEnvelope.model_validate({"error": error})
        assert list(validator.iter_errors({"error": error}))
    # Literal bool schemas must also reject numeric pseudo-booleans at runtime.
    with pytest.raises(ValidationError):
        ErrorEnvelope.model_validate({"error": {**base, "code": "INVALID_TOKEN", "retryable": 0}})


def test_observed_health_and_auth_failures_match_operation_schemas_and_headers():
    schema = create_app().openapi()
    with TestClient(create_app()) as client:
        cases = [
            client.get("/healthz"),
            client.get("/v1/me"),
            client.get("/v1/me", headers={"Authorization": "Bearer placeholder"}),
        ]
    for response in cases:
        path = response.request.url.path
        documented = schema["paths"][path]["get"]["responses"][str(response.status_code)]
        document = {
            **documented["content"]["application/json"]["schema"],
            "components": schema["components"],
        }
        Draft202012Validator(document, format_checker=FormatChecker()).validate(response.json())
        for name, header in documented["headers"].items():
            assert header["required"] is True
            Draft202012Validator(header["schema"], format_checker=FormatChecker()).validate(
                response.headers[name]
            )
    private = schema["paths"]["/v1/me"]["get"]["responses"]
    assert private["401"]["headers"]["WWW-Authenticate"]["schema"]["const"] == "Bearer"
    assert all(
        r["headers"]["Cache-Control"]["schema"]["const"] == "no-store" for r in private.values()
    )
