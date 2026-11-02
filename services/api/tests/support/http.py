"""Full runtime routes with ephemeral signing keys and an in-memory JWKS transport."""

import time

import httpx2

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
