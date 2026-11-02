"""Validated runtime trust configuration; importing this module reads no environment."""

import re
from pathlib import Path
from typing import Literal, Self
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.database_config import runtime_database_url

API_ROOT = Path(__file__).resolve().parents[2]
SigningAlgorithm = Literal["ES256", "RS256"]


def https_origin(value: str) -> str:
    """Accept one explicit HTTPS DNS origin, never credentials, paths or redirects."""
    if value != value.strip() or re.search(r"[\s\x00-\x1f\x7f]", value):
        raise ValueError("Use a plain HTTPS project origin")
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.port not in (None, 443)
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
        or parsed.hostname == "localhost"
        or "." not in parsed.hostname
        or not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", parsed.hostname)
        or len(parsed.hostname) > 253
        or any(
            not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", part)
            for part in parsed.hostname.split(".")
        )
        or parsed.hostname.replace(".", "").isdigit()
    ):
        raise ValueError("Use one HTTPS project origin without userinfo, path or query")
    return f"https://{parsed.hostname}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=API_ROOT / ".env", extra="ignore", frozen=True, hide_input_in_errors=True
    )

    app_env: Literal["development", "test", "production"] = "development"
    cors_allowed_origins: tuple[str, ...] = ()
    supabase_project_url: str | None = None
    supabase_jwt_issuer: str | None = None
    supabase_jwt_audience: str | None = Field(default=None, min_length=1, max_length=256)
    supabase_jwt_algorithms: tuple[SigningAlgorithm, ...] | None = None
    database_url: SecretStr | None = Field(default=None, repr=False)
    db_pool_size: int = Field(default=2, ge=1, le=5)
    db_pool_timeout_seconds: float = Field(default=2, ge=0.05, le=10, allow_inf_nan=False)
    db_connect_timeout_seconds: int = Field(default=5, ge=1, le=10)
    db_statement_timeout_ms: int = Field(default=5000, ge=100, le=30000)
    db_lock_timeout_ms: int = Field(default=2000, ge=100, le=5000)
    db_idle_transaction_timeout_ms: int = Field(default=10000, ge=1000, le=60000)
    auth_token_max_bytes: int = Field(default=16384, ge=1024, le=65536)
    auth_clock_skew_seconds: float = Field(default=30, ge=0, le=120, allow_inf_nan=False)
    auth_jwks_ttl_seconds: float = Field(default=300, ge=1, le=600, allow_inf_nan=False)
    auth_jwks_budget_seconds: float = Field(default=5, gt=0, le=10, allow_inf_nan=False)
    auth_jwks_connect_seconds: float = Field(default=2, gt=0, le=5, allow_inf_nan=False)
    auth_jwks_max_bytes: int = Field(default=262144, ge=1024, le=1048576)
    auth_jwks_max_keys: int = Field(default=16, ge=1, le=32)
    auth_jwks_refresh_cooldown_seconds: float = Field(default=30, ge=1, le=120, allow_inf_nan=False)
    auth_jwks_negative_ttl_seconds: float = Field(default=60, ge=1, le=300, allow_inf_nan=False)
    auth_jwks_negative_max_entries: int = Field(default=64, ge=1, le=256)

    @field_validator("supabase_project_url")
    @classmethod
    def validate_project(cls, value: str | None) -> str | None:
        return https_origin(value) if value is not None else None

    @field_validator("cors_allowed_origins")
    @classmethod
    def validate_cors(cls, origins: tuple[str, ...]) -> tuple[str, ...]:
        for origin in origins:
            parsed = urlsplit(origin)
            if (
                origin != origin.strip()
                or re.search(r"[\s\x00-\x1f\x7f]", origin)
                or parsed.scheme not in ("http", "https")
                or not parsed.hostname
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path
                or parsed.query
                or parsed.fragment
                or "*" in origin
            ):
                raise ValueError("CORS entries must be exact HTTP(S) browser origins")
            _ = parsed.port  # Reject malformed/out-of-range ports too.
        if len(set(origins)) != len(origins):
            raise ValueError("CORS origins must be unique")
        return origins

    @model_validator(mode="after")
    def validate_trust(self) -> Self:
        values = (
            self.supabase_project_url,
            self.supabase_jwt_issuer,
            self.supabase_jwt_audience,
            self.supabase_jwt_algorithms,
        )
        if any(value is not None for value in values):
            if any(value is None for value in values):
                raise ValueError("Provide all four Supabase trust settings")
            if self.supabase_jwt_issuer != f"{self.supabase_project_url}/auth/v1":
                raise ValueError("JWT issuer must match project origin plus /auth/v1")
            if not self.supabase_jwt_algorithms or len(set(self.supabase_jwt_algorithms)) != len(
                self.supabase_jwt_algorithms
            ):
                raise ValueError("Provide a nonempty, unique asymmetric algorithm allowlist")
            if re.search(r"[\s\x00-\x1f\x7f]", self.supabase_jwt_audience or ""):
                raise ValueError("JWT audience must be a nonempty identifier")
        elif self.app_env == "production":
            raise ValueError("Production requires complete Supabase verification configuration")
        if self.auth_jwks_connect_seconds > self.auth_jwks_budget_seconds:
            raise ValueError("JWKS connect timeout cannot exceed the complete resolution budget")
        if self.db_lock_timeout_ms > self.db_statement_timeout_ms:
            raise ValueError("Database lock timeout cannot exceed statement timeout")
        if self.database_url is not None:
            runtime_database_url(
                self.database_url.get_secret_value(),
                app_env=self.app_env,
                project_origin=self.supabase_project_url,
            )
        return self

    @property
    def auth_configured(self) -> bool:
        return self.supabase_project_url is not None

    @property
    def jwks_url(self) -> str | None:
        if not self.auth_configured:
            return None
        return f"{self.supabase_jwt_issuer}/.well-known/jwks.json"
