import json
import socket
import subprocess
import sys
import time
from contextlib import contextmanager
from pathlib import Path

import httpx2
import pytest

from tests.auth.support import LocalSigner, settings
from tests.support.http import signed_headers

pytestmark = pytest.mark.database
API_ROOT = Path(__file__).resolve().parents[2]


@contextmanager
def running_process(config, public_jwk):
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    values = config.model_dump(mode="json", exclude_none=True)
    values["database_url"] = config.database_url.get_secret_value()
    process = subprocess.Popen(
        [sys.executable, "-m", "tests.support.settings_process"],
        cwd=API_ROOT,
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    try:
        process.stdin.write(
            json.dumps({"settings": values, "public_jwk": public_jwk, "port": port}) + "\n"
        )
        process.stdin.close()
        with httpx2.Client(
            base_url=f"http://127.0.0.1:{port}", timeout=2, trust_env=False
        ) as client:
            deadline = time.monotonic() + 8
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    pytest.fail("Settings process exited before readiness")
                try:
                    if client.get("/healthz").status_code == 200:
                        break
                except httpx2.RequestError:
                    pass
                time.sleep(0.02)
            else:
                pytest.fail("Settings process did not become ready")
            yield client, process.pid
    finally:
        if process.poll() is None:
            process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


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
