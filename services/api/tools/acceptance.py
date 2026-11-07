"""Private development inputs and redacted HTTP acceptance; no Auth administration."""

import json
import os
import re
import stat
import tempfile
from pathlib import Path
from urllib.parse import urlsplit
from uuid import UUID

from dotenv import dotenv_values

from app.api.health import HealthResponse
from app.core.config import API_ROOT, Settings
from app.schemas.errors import ErrorCode, ErrorEnvelope
from app.schemas.identity import MeResponse
from app.schemas.profiles import ProfileResponse, ProfileSavedResponse
from app.schemas.settings import MAX_REVISION, SettingsResponse, SettingsSavedResponse

PRIVATE_INPUT = API_ROOT / ".local/live-acceptance.env"
TOKEN_KEYS = {label: f"API_ACCEPTANCE_ACCESS_TOKEN_{label}" for label in ("A", "B")}


class AcceptanceError(RuntimeError):
    """Static operator messages only; no response bodies or private inputs."""


def development_settings(project: str) -> Settings:
    config = Settings()
    if (
        config.app_env != "development"
        or config.supabase_project_url != f"https://{project}.supabase.co"
    ):
        raise AcceptanceError("Pin the configured development project before acceptance")
    return config


def private_values() -> dict:
    info = PRIVATE_INPUT.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_mode & 0o077 or info.st_size > 65536:
        raise AcceptanceError("Acceptance input must be a private regular file (chmod 600)")
    return dict(dotenv_values(PRIVATE_INPUT, interpolate=False))


def save_token(label: str, token: str) -> None:
    values = private_values()
    values[TOKEN_KEYS[label]] = token
    # Atomic replacement with private permissions; persist access tokens only.
    with tempfile.NamedTemporaryFile(mode="w", dir=PRIVATE_INPUT.parent, delete=False) as output:
        temporary = Path(output.name)
        try:
            os.fchmod(output.fileno(), 0o600)
            for key in (*TOKEN_KEYS.values(), "API_ACCEPTANCE_PUBLISHABLE_KEY"):
                value = values.get(key) or ""
                if any(char.isspace() or char in "'\"#" for char in value):
                    raise AcceptanceError("Unexpected credential framing; nothing was saved")
                output.write(f"{key}={value}\n")
            output.flush()
            os.fsync(output.fileno())
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    try:
        os.replace(temporary, PRIVATE_INPUT)
    finally:
        temporary.unlink(missing_ok=True)


def base_url(value: str) -> str:
    if value != value.strip() or re.search(r"[\s\x00-\x1f\x7f]", value):
        raise AcceptanceError("Use a plain API origin")
    parsed = urlsplit(value)
    if (
        parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
        or parsed.path not in ("", "/")
        or not parsed.hostname
        or parsed.scheme not in ("https", "http")
        or (parsed.scheme == "http" and parsed.hostname not in ("127.0.0.1", "localhost", "::1"))
    ):
        raise AcceptanceError("Use an HTTPS API origin or explicit loopback HTTP")
    _ = parsed.port
    return value.rstrip("/")


def checked(client, method: str, path: str, status: int, *, token=None, origin=None, body=None):
    headers = {"Authorization": "Bearer " + token} if token else {}
    if origin:
        headers["Origin"] = origin
    with client.stream(
        method, path, headers=headers, **({"json": body} if body is not None else {})
    ) as response:
        content = bytearray()
        for chunk in response.iter_bytes():
            if len(content) + len(chunk) > 65536:
                raise AcceptanceError("Acceptance response exceeds its resource bound")
            content.extend(chunk)
    if response.status_code != status:
        raise AcceptanceError("Unexpected HTTP status; inspect the server request ID locally")
    try:
        UUID(response.headers["X-Request-ID"])
        if path.startswith("/v1/") and response.headers.get("Cache-Control") != "no-store":
            raise AcceptanceError("Private response is missing no-store")
        if origin:
            exposed = {
                value.strip().lower()
                for value in response.headers.get("Access-Control-Expose-Headers", "").split(",")
            }
            if (
                response.headers.get("Access-Control-Allow-Origin") != origin
                or "x-request-id" not in exposed
            ):
                raise AcceptanceError("Browser response correlation is not exposed")
        if status >= 400:
            error = ErrorEnvelope.model_validate(json.loads(content)).error
            if str(error.request_id) != response.headers["X-Request-ID"]:
                raise AcceptanceError("Error correlation mismatch")
            return response, error
        return response, json.loads(content)
    except AcceptanceError:
        raise
    except Exception:
        raise AcceptanceError("Response shape or correlation headers are invalid") from None


def transport_checks(client, origin: str) -> dict:
    response, body = checked(client, "GET", "/healthz", 200)
    HealthResponse.model_validate(body)
    for extra_origin in (None, origin):
        response, error = checked(client, "GET", "/v1/me", 401, origin=extra_origin)
        if (
            error.code != ErrorCode.AUTH_REQUIRED
            or response.headers.get("WWW-Authenticate") != "Bearer"
        ):
            raise AcceptanceError("Missing-credential boundary failed")
        if extra_origin and response.headers.get("Access-Control-Allow-Origin") != origin:
            raise AcceptanceError("Configured browser origin is not allowed")
    for path in ("/v1/profile", "/v1/settings"):
        for candidate, allowed in ((origin, True), ("https://disallowed.invalid", False)):
            preflight = client.options(
                path,
                headers={
                    "Origin": candidate,
                    "Access-Control-Request-Method": "PATCH",
                    "Access-Control-Request-Headers": "authorization,content-type",
                },
            )
            if preflight.status_code != (200 if allowed else 400):
                raise AcceptanceError("Browser preflight status mismatch")
            if allowed and preflight.headers.get("Access-Control-Allow-Origin") != origin:
                raise AcceptanceError("Browser preflight origin mismatch")
            if not allowed and "Access-Control-Allow-Origin" in preflight.headers:
                raise AcceptanceError("Disallowed browser origin was exposed")
    return {
        "liveness": "passed",
        "corsProtocol": "passed",
        "noOriginHttp": "passed",
        "browserExecution": "not_run",
        "nativeDevice": "not_run",
    }


def account_checks(client, tokens: dict, expected_users: dict, *, write: bool, origin: str) -> dict:
    if (
        set(tokens) != {"A", "B"}
        or set(expected_users) != {"A", "B"}
        or not all(tokens.values())
        or len(set(expected_users.values())) != 2
    ):
        raise AcceptanceError("Two distinct approved development identities are required")
    current = {}
    for label in ("A", "B"):
        token = tokens[label]
        for browser_origin in (None, origin):
            response, body = checked(
                client, "GET", "/v1/me", 200, token=token, origin=browser_origin
            )
            if MeResponse.model_validate(body).user_id != expected_users[label]:
                raise AcceptanceError("Verified identity differs from the captured account")
            if browser_origin and response.headers.get("Access-Control-Allow-Origin") != origin:
                raise AcceptanceError("Signed browser response lacks CORS exposure")
        _, body = checked(client, "GET", "/v1/profile", 200, token=token)
        profile = ProfileResponse.model_validate(body).profile
        if profile is not None and profile.user_id != expected_users[label]:
            raise AcceptanceError("Profile owner mismatch")
        current[label] = profile
    for label, other in (("A", "B"), ("B", "A")):
        _, body = checked(
            client, "GET", f"/v1/profile?user_id={expected_users[other]}", 200, token=tokens[label]
        )
        if ProfileResponse.model_validate(body).profile != current[label]:
            raise AcceptanceError("Client-supplied owner changed the read scope")
    report = {
        "managedIdentityAB": "passed",
        "managedProfileReadAB": "passed",
        "managedProfileWriteAB": "not_run",
        "accountLifecycleAndMobile": "not_run",
    }
    if not write:
        return report
    for label, other in (("A", "B"), ("B", "A")):
        before = current[label]
        expected = before.revision if before is not None else 0
        _, body = checked(
            client,
            "PATCH",
            "/v1/profile",
            200,
            token=tokens[label],
            origin=origin if label == "A" else None,
            body={
                "expected_revision": expected,
                "display_name": f"Acceptance {label}",
            },
        )
        saved = ProfileSavedResponse.model_validate(body).profile
        if (
            saved.user_id != expected_users[label]
            or saved.revision != expected + 1
            or saved.display_name != f"Acceptance {label}"
        ):
            raise AcceptanceError("Save identity/revision mismatch; refetch without replay")
        _, conflict = checked(
            client,
            "PATCH",
            "/v1/profile",
            409,
            token=tokens[label],
            body={
                "expected_revision": expected,
                "display_name": "Must not replay",
            },
        )
        if (
            conflict.code != ErrorCode.PROFILE_CONFLICT
            or conflict.details.current_revision != saved.revision
        ):
            raise AcceptanceError("Own conflict boundary failed; refetch without replay")
        _, body = checked(client, "GET", "/v1/profile", 200, token=tokens[other])
        if ProfileResponse.model_validate(body).profile != current[other]:
            raise AcceptanceError("Other account changed; stop all writes")
        _, body = checked(
            client,
            "PATCH",
            "/v1/profile",
            200,
            token=tokens[label],
            body={
                "expected_revision": saved.revision,
                "display_name": None,
            },
        )
        cleared = ProfileSavedResponse.model_validate(body).profile
        if (
            cleared.user_id != expected_users[label]
            or cleared.display_name is not None
            or cleared.revision != saved.revision + 1
            or cleared.created_at != saved.created_at
        ):
            raise AcceptanceError("Clear operation differs from the agreed contract")
        _, body = checked(
            client,
            "PATCH",
            "/v1/profile",
            200,
            token=tokens[label],
            body={
                "expected_revision": cleared.revision,
                "display_name": before.display_name if before else None,
            },
        )
        restored = ProfileSavedResponse.model_validate(body).profile
        if (
            restored.user_id != expected_users[label]
            or restored.revision != cleared.revision + 1
            or restored.display_name != (before.display_name if before else None)
            or restored.created_at != saved.created_at
        ):
            raise AcceptanceError("Restored name/revision/creation timestamp mismatch")
        _, body = checked(client, "GET", "/v1/profile", 200, token=tokens[label])
        if ProfileResponse.model_validate(body).profile != restored:
            raise AcceptanceError("Persisted refetch differs from successful save")
        current[label] = restored
    report["managedProfileWriteAB"] = "passed; original names restored; created rows retained"
    return report


def unavailable_profile_checks(client, tokens: dict, expected_users: dict, *, origin: str) -> dict:
    """Read-only acceptance of Auth independence while the product DB is unavailable."""
    if (
        set(tokens) != {"A", "B"}
        or set(expected_users) != {"A", "B"}
        or not all(tokens.values())
        or len(set(expected_users.values())) != 2
    ):
        raise AcceptanceError("Two distinct approved development identities are required")
    # An impossible positive revision cannot create or update a row if the DB
    # recovers between the GET and PATCH probes; a 409 then fails this check safely.
    for label in ("A", "B"):
        for browser_origin in (None, origin):
            _, body = checked(
                client, "GET", "/v1/me", 200, token=tokens[label], origin=browser_origin
            )
            if MeResponse.model_validate(body).user_id != expected_users[label]:
                raise AcceptanceError("Verified identity differs from the captured account")
            for method, body in (
                ("GET", None),
                (
                    "PATCH",
                    {
                        "expected_revision": 10**100,
                        "display_name": "Unavailable acceptance",
                    },
                ),
            ):
                _, error = checked(
                    client,
                    method,
                    "/v1/profile",
                    503,
                    token=tokens[label],
                    origin=browser_origin,
                    body=body,
                )
                if error.code != ErrorCode.DEPENDENCY_UNAVAILABLE or not error.retryable:
                    raise AcceptanceError("Unavailable database was misclassified")
    return {
        "managedIdentityAB": "passed with product database unavailable",
        "profileUnavailableAB": "passed; GET and PATCH return dependency 503, never absence",
        "browserExecution": "not_run",
        "nativeDevice": "not_run",
    }


def settings_checks(
    client, tokens: dict, expected_users: dict, *, write: bool, origin: str
) -> dict:
    """Explicit disposable-account journey; never changes profiles or native policy."""
    if (
        set(tokens) != {"A", "B"}
        or set(expected_users) != {"A", "B"}
        or not all(tokens.values())
        or len(set(expected_users.values())) != 2
    ):
        raise AcceptanceError("Two distinct approved development identities are required")

    def read(label, *, browser_origin=None, path="/v1/settings"):
        _, body = checked(client, "GET", path, 200, token=tokens[label], origin=browser_origin)
        value = SettingsResponse.model_validate(body).settings
        if value is not None and value.user_id != expected_users[label]:
            raise AcceptanceError("Settings owner mismatch; stop all writes")
        return value

    def profile(label):
        _, body = checked(client, "GET", "/v1/profile", 200, token=tokens[label])
        value = ProfileResponse.model_validate(body).profile
        if value is not None and value.user_id != expected_users[label]:
            raise AcceptanceError("Profile owner mismatch; stop all writes")
        return value

    current, profiles = {}, {}
    for label in ("A", "B"):
        profiles[label] = profile(label)
        current[label] = read(label)
        if read(label, browser_origin=origin) != current[label]:
            raise AcceptanceError("Settings changed during read acceptance; inspect privately")
    for label, other in (("A", "B"), ("B", "A")):
        if read(label, path=f"/v1/settings?user_id={expected_users[other]}") != current[label]:
            raise AcceptanceError("Client-supplied owner changed settings scope")
    report = {
        "managedSettingsReadAB": "passed",
        "managedSettingsWriteAB": "not_run",
        "settingsProfilesUnchanged": "passed",
        "settingsRestartPersistence": "not_run; requires a separate actual process restart",
        "accountLifecycleAndMobile": "not_run",
    }
    if not write:
        return report
    # Five accepted writes per account, including explicit restoration. Refuse
    # exhausted revisions BEFORE either account can be changed.
    if any(value is not None and value.revision > MAX_REVISION - 5 for value in current.values()):
        raise AcceptanceError("Insufficient revision headroom; no settings writes started")
    neutral = {"selected_activity_ids": [], "custom_text": None}
    draft = {
        "weekdays": [0, 2],
        "hours": {"start_local": "22:30", "end_local": "07:00", "next_day": True},
        "timezone_id": "America/New_York",
        "session_count": 2,
        "session_minutes": None,
    }
    for label, other in (("A", "B"), ("B", "A")):
        before = current[label]
        state = before

        def unchanged_controls():
            if read(other) != current[other] or any(
                profile(key) != profiles[key] for key in ("A", "B")
            ):
                raise AcceptanceError("Control settings/profile changed; stop all writes")

        def save(**sections):
            nonlocal state
            revision = state.revision if state is not None else 0
            _, body = checked(
                client,
                "PATCH",
                "/v1/settings",
                200,
                token=tokens[label],
                origin=origin if label == "A" else None,
                body={"expected_revision": revision, **sections},
            )
            saved = SettingsSavedResponse.model_validate(body).settings
            activities = sections.get(
                "activities", state.activities.model_dump() if state else neutral
            )
            plan = sections.get(
                "plan_draft", state.plan_draft.model_dump() if state and state.plan_draft else None
            )
            if (
                saved.user_id != expected_users[label]
                or saved.revision != revision + 1
                or saved.activities.model_dump() != (activities or neutral)
                or (saved.plan_draft.model_dump() if saved.plan_draft else None) != plan
                or (state is not None and saved.created_at != state.created_at)
                or saved.updated_at < saved.created_at
                or (state is not None and saved.updated_at < state.updated_at)
            ):
                raise AcceptanceError("Settings save differs from contract; refetch without replay")
            if read(label) != saved:
                raise AcceptanceError("Settings refetch differs from committed save")
            state = saved
            unchanged_controls()

        original_revision = state.revision if state else 0
        save(
            activities={
                "selected_activity_ids": ["reading"],
                "custom_text": f"Acceptance {label} 🦖",
            }
        )
        _, error = checked(
            client,
            "PATCH",
            "/v1/settings",
            409,
            token=tokens[label],
            body={"expected_revision": original_revision, "activities": None},
        )
        if (
            error.code != ErrorCode.SETTINGS_CONFLICT
            or getattr(error.details, "current_revision", None) != state.revision
        ):
            raise AcceptanceError("Settings stale revision was not rejected safely")
        if read(label) != state:
            raise AcceptanceError("Conflicting settings request changed data")
        save(plan_draft=draft)
        _, error = checked(
            client,
            "PATCH",
            "/v1/settings",
            422,
            token=tokens[label],
            body={"expected_revision": state.revision, "plan_draft": {**draft, "weekdays": [0, 0]}},
        )
        if error.code != ErrorCode.VALIDATION_ERROR or read(label) != state:
            raise AcceptanceError("Invalid settings draft changed data or error contract")
        save(plan_draft=None)
        save(activities=None)
        save(
            activities=before.activities.model_dump() if before else neutral,
            plan_draft=before.plan_draft.model_dump() if before and before.plan_draft else None,
        )
        current[label] = state
    report["managedSettingsWriteAB"] = (
        "passed; original values restored; revisions/timestamps advance; created rows retained"
    )
    return report
