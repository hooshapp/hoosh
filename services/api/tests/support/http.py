"""Full runtime routes with ephemeral signing keys and an in-memory JWKS transport."""

import json
import socket
import subprocess
import sys
import time
from contextlib import contextmanager
from pathlib import Path

import httpx2
import pytest

from app.core.jwks import JwksResolver
from app.runtime import create_app
from tests.auth.support import LocalSigner


def signed_headers(signer, claims=None):
    now = int(time.time())
    token = signer.token({"iat": now - 60, "exp": now + 300, **(claims or {})})
    return {"Authorization": "Bearer " + token}


def authenticated_app(monkeypatch, config, *, signer=None, claims=None):
    signer = signer or LocalSigner()

    def resolver_factory(value):
        return JwksResolver(
            value,
            client=httpx2.AsyncClient(
                transport=httpx2.MockTransport(
                    lambda request: httpx2.Response(200, json={"keys": [signer.jwk]})
                )
            ),
        )

    monkeypatch.setattr("app.runtime.JwksResolver", resolver_factory)
    app = create_app(config)
    assert not app.dependency_overrides
    return app, signed_headers(signer, claims)


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
