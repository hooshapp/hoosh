import pytest
from pydantic import ValidationError

from app.core.config import Settings

TRUST = {
    "supabase_project_url": "https://example.supabase.co",
    "supabase_jwt_issuer": "https://example.supabase.co/auth/v1",
    "supabase_jwt_audience": "authenticated",
    "supabase_jwt_algorithms": ["ES256"],
}


def test_local_unconfigured_shell_has_no_trust_or_discovery_url():
    settings = Settings(_env_file=None)
    assert not settings.auth_configured
    assert settings.jwks_url is None


def test_exact_observed_trust_and_derived_jwks_are_immutable():
    settings = Settings(_env_file=None, app_env="production", **TRUST)
    assert settings.auth_configured
    assert settings.jwks_url == "https://example.supabase.co/auth/v1/.well-known/jwks.json"
    with pytest.raises(ValidationError):
        settings.supabase_jwt_audience = "other"


@pytest.mark.parametrize("field", list(TRUST))
def test_partial_configuration_fails_even_in_development(field):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{field: TRUST[field]})


def test_production_never_silently_enters_local_shell():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="production")


@pytest.mark.parametrize(
    "url",
    [
        "http://example.supabase.co",
        "https://example.supabase.co/path",
        "https://user:password@example.supabase.co",
        "https://example.supabase.co?x=1",
        "https://example.supabase.co#x",
        "https://example.supabase.co:8443",
        "https://127.0.0.1",
        "https://[::1]",
        "https://localhost",
        "https://example..com",
        "https://example.-bad.com",
        " https://example.supabase.co",
        "https://example.supabase.co\n",
        "https://example.supabase.co/\t",
    ],
)
def test_unsafe_project_origin_rejected_without_echoing_input(url):
    with pytest.raises(ValidationError) as error:
        Settings(_env_file=None, **{**TRUST, "supabase_project_url": url})
    assert "input_value" not in str(error.value)
    assert "user:password" not in str(error.value)


@pytest.mark.parametrize(
    "overrides",
    [
        {"supabase_jwt_issuer": "https://another.supabase.co/auth/v1"},
        {"supabase_jwt_issuer": "https://example.supabase.co/auth/v1/"},
        {"supabase_jwt_algorithms": ["HS256"]},
        {"supabase_jwt_algorithms": ["none"]},
        {"supabase_jwt_algorithms": []},
        {"supabase_jwt_algorithms": ["ES256", "ES256"]},
        {"supabase_jwt_audience": ""},
        {"supabase_jwt_audience": "authenticated\n"},
        {"auth_jwks_budget_seconds": 0},
        {"auth_jwks_connect_seconds": 6},
        {"auth_jwks_budget_seconds": 1},
        {"auth_jwks_ttl_seconds": float("inf")},
        {"auth_clock_skew_seconds": float("nan")},
        {"auth_token_max_bytes": 100000},
        {"auth_jwks_max_keys": 33},
        {"auth_jwks_negative_max_entries": 100000},
    ],
)
def test_invalid_trust_and_unbounded_resource_settings_fail(overrides):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{**TRUST, **overrides})


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "null",
        "https://*.example.com",
        "https://a.test/",
        "https://a.test/path",
        "https://u:p@a.test",
        "https://a.test:bad",
    ],
)
def test_cors_accepts_only_exact_browser_origins(origin):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_allowed_origins=[origin])


def test_env_json_arrays_and_complete_configuration(monkeypatch):
    for field, value in TRUST.items():
        monkeypatch.setenv(field.upper(), '["ES256"]' if field.endswith("algorithms") else value)
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", '["http://localhost:8081"]')
    monkeypatch.setenv("AUTH_JWKS_BUDGET_SECONDS", "4")
    settings = Settings(_env_file=None)
    assert settings.supabase_jwt_algorithms == ("ES256",)
    assert settings.cors_allowed_origins == ("http://localhost:8081",)
    assert settings.auth_jwks_budget_seconds == 4


@pytest.mark.parametrize("configured", [False, True])
def test_runtime_entry_validates_production_before_serving(monkeypatch, configured):
    import importlib.util

    from app.core.config import API_ROOT

    monkeypatch.setitem(Settings.model_config, "env_file", None)
    monkeypatch.setenv("APP_ENV", "production")
    if configured:
        import json

        for field, value in TRUST.items():
            monkeypatch.setenv(
                field.upper(), json.dumps(value) if isinstance(value, list) else value
            )
    spec = importlib.util.spec_from_file_location("startup_probe", API_ROOT / "app/main.py")
    module = importlib.util.module_from_spec(spec)
    if configured:
        spec.loader.exec_module(module)
        assert module.app.state.settings.auth_configured
    else:
        with pytest.raises(ValidationError):
            spec.loader.exec_module(module)
