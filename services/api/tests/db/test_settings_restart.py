import pytest

from tests.auth.support import LocalSigner, settings
from tests.support.http import running_process, signed_headers

pytestmark = pytest.mark.database


def test_committed_settings_survive_a_real_http_api_process_restart(db_settings, profile_accounts):
    signer = LocalSigner()
    owner = profile_accounts[2]
    config = settings(**db_settings.model_dump(exclude_none=True))
    auth = signed_headers(signer, {"sub": str(owner.user_id)})
    with running_process(config, signer.jwk) as (client, first_pid):
        saved = client.patch(
            "/v1/settings",
            headers=auth,
            json={
                "expected_revision": 0,
                "activities": {
                    "selected_activity_ids": ["reading"],
                    "custom_text": "Read after restart",
                },
            },
        )
        assert saved.status_code == 200
        snapshot = saved.json()
        assert snapshot["settings"]["revision"] == 1
        assert client.get("/v1/profile", headers=auth).json() == {"profile": None}
    with running_process(config, signer.jwk) as (client, second_pid):
        assert first_pid != second_pid
        response = client.get("/v1/settings", headers=auth)
        assert response.status_code == 200 and response.json() == snapshot
        assert response.headers["Cache-Control"] == "no-store"
        assert client.get("/v1/profile", headers=auth).json() == {"profile": None}
