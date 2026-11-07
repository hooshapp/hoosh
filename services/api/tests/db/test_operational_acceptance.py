import json
import logging

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from app.core.identity import VerifiedIdentity
from tests.auth.support import USER_A, settings
from tests.support import database
from tests.support.http import authenticated_app, signed_headers
from tools.acceptance import account_checks, transport_checks

pytestmark = pytest.mark.database
LOGGER = "uvicorn.error.disconnect"


@pytest.mark.parametrize("absent", [False, True])
def test_full_acceptance_journey_uses_real_routes_and_runtime_role(
    monkeypatch, db_settings, profile_accounts, absent
):
    from tests.auth.support import LocalSigner

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {"cors_allowed_origins": ["http://localhost:8081"]}
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    identities = {
        label: identity.user_id
        for label, identity in zip(
            ("A", "B"), [profile_accounts[0], profile_accounts[2 if absent else 1]], strict=True
        )
    }
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"].removeprefix("Bearer ")
        for label, user in identities.items()
    }
    with TestClient(app) as client:
        assert transport_checks(client, "http://localhost:8081")["corsProtocol"] == "passed"
        report = account_checks(
            client, tokens, identities, write=True, origin="http://localhost:8081"
        )
        assert report["managedProfileWriteAB"].startswith("passed")
        assert app.state.database.engine.pool.checkedout() == 0
    # Local signed-token journey validates the tool, never managed-user acceptance.


@pytest.mark.parametrize(
    "failure,expected",
    [
        ("password", "connection_failure"),
        ("pool", "pool_timeout"),
        ("lock", "lock_unavailable"),
        ("statement", "query_cancelled"),
    ],
)
def test_actual_database_failure_categories_keep_request_correlation(
    monkeypatch, db_settings, db_environment, caplog, failure, expected
):
    caplog.set_level(logging.INFO, logger=LOGGER)
    values = db_settings.model_dump(exclude_none=True) | {
        "db_pool_timeout_seconds": 0.08,
        "db_statement_timeout_ms": 150,
        "db_lock_timeout_ms": 100,
    }
    if failure == "password":
        values["database_url"] = db_settings.database_url.get_secret_value().replace(
            "disconnect_test_runtime_only", "private-wrong-password"
        )
    app, auth = authenticated_app(monkeypatch, settings(**values))
    with TestClient(app) as client:

        def query():
            response = client.get("/v1/profile", headers=auth)
            assert response.status_code == 503
            return response

        if failure == "pool":
            with app.state.database.transaction(VerifiedIdentity(USER_A, None)):
                response = query()
        elif failure in ("lock", "statement"):
            if failure == "statement":

                @event.listens_for(app.state.database.engine, "before_cursor_execute")
                def disable_lock(connection, cursor, statement, parameters, context, executemany):
                    if "FROM public.profiles" in statement:
                        cursor.execute("SET LOCAL lock_timeout=0")

            with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
                with admin.transaction():
                    admin.execute("LOCK TABLE public.profiles IN ACCESS EXCLUSIVE MODE")
                    response = query()
        else:
            response = query()
        logs = [json.loads(r.getMessage()) for r in caplog.records if r.name == LOGGER]
        assert any(
            r.get("dependency") == "database"
            and r["outcome"] == expected
            and r["request_id"] == response.headers["X-Request-ID"]
            for r in logs
        )
        assert "private-wrong-password" not in json.dumps(logs) + response.text


def test_unavailable_profile_journey_with_actual_connection_failure(monkeypatch, db_settings):
    from tests.auth.support import USER_B, LocalSigner
    from tools.acceptance import unavailable_profile_checks

    signer = LocalSigner()
    values = db_settings.model_dump(exclude_none=True) | {
        "cors_allowed_origins": ["http://localhost:8081"],
        "database_url": db_settings.database_url.get_secret_value().replace(
            "disconnect_test_runtime_only", "deliberately-wrong-test-password"
        ),
    }
    app, _ = authenticated_app(monkeypatch, settings(**values), signer=signer)
    identities = {"A": USER_A, "B": USER_B}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    with TestClient(app) as client:
        report = unavailable_profile_checks(
            client, tokens, identities, origin="http://localhost:8081"
        )
        assert report["profileUnavailableAB"].startswith("passed")
        assert app.state.database.engine.pool.checkedout() == 0


def test_unavailable_probe_cannot_create_when_database_recovers_between_requests(
    monkeypatch, db_settings, profile_accounts, db_environment
):
    from app.core.errors import ApiError
    from app.schemas.errors import ErrorCode
    from tests.auth.support import LocalSigner
    from tests.support.profiles import snapshot
    from tools.acceptance import AcceptanceError, unavailable_profile_checks

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {
                "cors_allowed_origins": ["http://localhost:8081"],
            }
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    identities = {"A": profile_accounts[2].user_id, "B": profile_accounts[1].user_id}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    before = snapshot(db_environment, profile_accounts)

    def temporary_read_failure(session):
        raise ApiError(ErrorCode.DEPENDENCY_UNAVAILABLE)

    monkeypatch.setattr("app.api.v1.profiles.read_own_profile", temporary_read_failure)
    with TestClient(app) as client:
        # GET fails, but PATCH can connect. Its impossible revision must not create A's row.
        with pytest.raises(AcceptanceError):
            unavailable_profile_checks(client, tokens, identities, origin="http://localhost:8081")
    assert snapshot(db_environment, profile_accounts) == before


@pytest.mark.parametrize("existing", [False, True])
@pytest.mark.parametrize("write", [False, True])
def test_settings_operator_journey_preserves_controls_and_original_values(
    monkeypatch, db_settings, profile_accounts, db_environment, existing, write
):
    from tests.auth.support import LocalSigner
    from tests.support.profiles import snapshot
    from tools.acceptance import settings_checks

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {"cors_allowed_origins": ["http://localhost:8081"]}
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    # B has an Auth owner but no profile: settings must not manufacture one.
    identities = {"A": profile_accounts[0].user_id, "B": profile_accounts[2].user_id}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    before_profiles = snapshot(db_environment, profile_accounts)
    with TestClient(app) as client:
        before = {}
        for label, token in tokens.items():
            auth = {"Authorization": "Bearer " + token}
            if existing:
                response = client.patch(
                    "/v1/settings",
                    headers=auth,
                    json={
                        "expected_revision": 0,
                        "activities": {
                            "selected_activity_ids": ["music"],
                            "custom_text": "Original 🦖",
                        },
                        "plan_draft": {
                            "weekdays": [1, 5],
                            "hours": None,
                            "timezone_id": "UTC",
                            "session_count": None,
                            "session_minutes": 17,
                        },
                    },
                )
                assert response.status_code == 200
            before[label] = client.get("/v1/settings", headers=auth).json()["settings"]
        report = settings_checks(
            client, tokens, identities, write=write, origin="http://localhost:8081"
        )
        assert report["managedSettingsReadAB"] == "passed"
        if write:
            assert report["managedSettingsWriteAB"].startswith("passed")
        else:
            assert report["managedSettingsWriteAB"] == "not_run"
        for label, token in tokens.items():
            after = client.get("/v1/settings", headers={"Authorization": "Bearer " + token}).json()[
                "settings"
            ]
            if not write:
                assert after == before[label]
            else:
                assert after["revision"] == (6 if existing else 5)
                assert after["activities"] == (
                    before[label]["activities"]
                    if existing
                    else {"selected_activity_ids": [], "custom_text": None}
                )
                assert after["plan_draft"] == (before[label]["plan_draft"] if existing else None)
                if existing:
                    assert after["created_at"] == before[label]["created_at"]
        assert app.state.database.engine.pool.checkedout() == 0
    assert snapshot(db_environment, profile_accounts) == before_profiles


def test_settings_operator_does_not_replay_or_restore_after_lost_success(
    monkeypatch, db_settings, profile_accounts, db_environment
):
    from tests.auth.support import LocalSigner
    from tools import acceptance

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {"cors_allowed_origins": ["http://localhost:8081"]}
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    identities = {"A": profile_accounts[0].user_id, "B": profile_accounts[1].user_id}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    checked = acceptance.checked
    writes = []

    def lost_response(client, method, path, status, **kwargs):
        result = checked(client, method, path, status, **kwargs)
        if method == "PATCH":
            writes.append(method)
            raise acceptance.AcceptanceError("Ambiguous transport; refetch without replay")
        return result

    monkeypatch.setattr(acceptance, "checked", lost_response)
    with TestClient(app) as client:
        with pytest.raises(acceptance.AcceptanceError, match="refetch without replay"):
            acceptance.settings_checks(
                client, tokens, identities, write=True, origin="http://localhost:8081"
            )
        assert writes == ["PATCH"]
        a = client.get("/v1/settings", headers={"Authorization": "Bearer " + tokens["A"]}).json()[
            "settings"
        ]
        assert a["revision"] == 1 and a["activities"]["selected_activity_ids"] == ["reading"]
        assert client.get(
            "/v1/settings", headers={"Authorization": "Bearer " + tokens["B"]}
        ).json() == {"settings": None}


def test_settings_operator_revision_exhaustion_refuses_all_writes(
    monkeypatch, db_settings, profile_accounts, db_environment
):
    from app.schemas.settings import MAX_REVISION
    from tests.auth.support import LocalSigner
    from tools import acceptance

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {"cors_allowed_origins": ["http://localhost:8081"]}
        )
    )
    app, _ = authenticated_app(monkeypatch, config, signer=signer)
    identities = {"A": profile_accounts[0].user_id, "B": profile_accounts[1].user_id}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }
    with TestClient(app) as client:
        assert (
            client.patch(
                "/v1/settings",
                headers={"Authorization": "Bearer " + tokens["B"]},
                json={"expected_revision": 0, "activities": None},
            ).status_code
            == 200
        )
        with database.connect(db_environment, "TEST_MIGRATION_DATABASE_URL") as admin:
            admin.execute(
                "UPDATE public.user_settings SET revision=%s WHERE user_id=%s",
                (MAX_REVISION - 4, identities["B"]),
            )
        before = client.get(
            "/v1/settings", headers={"Authorization": "Bearer " + tokens["B"]}
        ).json()
        with pytest.raises(acceptance.AcceptanceError, match="no settings writes started"):
            acceptance.settings_checks(
                client, tokens, identities, write=True, origin="http://localhost:8081"
            )
        assert client.get(
            "/v1/settings", headers={"Authorization": "Bearer " + tokens["A"]}
        ).json() == {"settings": None}
        assert (
            client.get("/v1/settings", headers={"Authorization": "Bearer " + tokens["B"]}).json()
            == before
        )


def test_settings_operator_actual_http_restart_preserves_saved_results(
    db_settings, profile_accounts
):
    from tests.auth.support import LocalSigner
    from tests.support.http import running_process
    from tools.acceptance import settings_checks

    signer = LocalSigner()
    config = settings(
        **(
            db_settings.model_dump(exclude_none=True)
            | {"cors_allowed_origins": ["http://localhost:8081"]}
        )
    )
    identities = {"A": profile_accounts[0].user_id, "B": profile_accounts[1].user_id}
    tokens = {
        label: signed_headers(signer, {"sub": str(user)})["Authorization"][7:]
        for label, user in identities.items()
    }

    def capture(client):
        result = {}
        for label, token in tokens.items():
            result[label] = {}
            for resource in ("profile", "settings"):
                response = client.get(
                    "/v1/" + resource, headers={"Authorization": "Bearer " + token}
                )
                assert response.status_code == 200
                result[label][resource] = response.json()
        return result

    with running_process(config, signer.jwk) as (client, first_pid):
        profiles_before = {label: row["profile"] for label, row in capture(client).items()}
        report = settings_checks(
            client, tokens, identities, write=True, origin="http://localhost:8081"
        )
        assert report["managedSettingsWriteAB"].startswith("passed")
        before_restart = capture(client)
        assert {label: row["profile"] for label, row in before_restart.items()} == profiles_before
    with running_process(config, signer.jwk) as (client, second_pid):
        assert second_pid != first_pid
        assert capture(client) == before_restart
        report = settings_checks(
            client, tokens, identities, write=False, origin="http://localhost:8081"
        )
        assert report["managedSettingsReadAB"] == "passed"
        assert capture(client) == before_restart
