"""Single-purpose process fixture: real JWT verification with an ephemeral public JWKS.

Only invoked explicitly by the disposable database restart test. No production
route, verifier override, user shortcut or private signing material exists here.
"""

import json
import sys

import httpx2
import uvicorn

from app import runtime
from app.core.config import Settings
from app.core.jwks import JwksResolver


def main():
    payload = json.loads(sys.stdin.readline(65536))
    values = payload["settings"]
    if values["app_env"] != "test":
        raise RuntimeError("Only explicit disposable test configuration is supported")

    def resolver(config):
        return JwksResolver(
            config,
            client=httpx2.AsyncClient(
                transport=httpx2.MockTransport(
                    lambda request: httpx2.Response(200, json={"keys": [payload["public_jwk"]]})
                )
            ),
        )

    runtime.JwksResolver = resolver
    app = runtime.create_app(Settings(_env_file=None, **values))
    uvicorn.run(app, host="127.0.0.1", port=payload["port"], access_log=False, log_level="critical")


if __name__ == "__main__":
    main()
