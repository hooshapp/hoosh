"""Ephemeral signing material exists only in test memory; no tokens/keys on disk."""

import json
from dataclasses import dataclass
from uuid import UUID

import jwt
from cryptography.hazmat.primitives.asymmetric import ec, rsa

from app.core.auth import signing_key
from app.core.config import Settings

NOW = 1800000000
USER_A = UUID("a46e48ad-c742-4e18-b57d-2c9a56544944")
USER_B = UUID("986b55fa-65ec-457b-971a-2934b8bf51fb")


def settings(**overrides):
    return Settings(
        _env_file=None,
        **{
            "supabase_project_url": "https://example.supabase.co",
            "supabase_jwt_issuer": "https://example.supabase.co/auth/v1",
            "supabase_jwt_audience": "authenticated",
            "supabase_jwt_algorithms": ["ES256", "RS256"],
            **overrides,
        },
    )


@dataclass
class LocalSigner:
    algorithm: str = "ES256"
    kid: str = "local-key-a"

    def __post_init__(self):
        self.private = (
            ec.generate_private_key(ec.SECP256R1())
            if self.algorithm == "ES256"
            else rsa.generate_private_key(public_exponent=65537, key_size=2048)
        )
        impl = jwt.algorithms.get_default_algorithms()[self.algorithm]
        self.jwk = {
            **json.loads(impl.to_jwk(self.private.public_key())),
            "alg": self.algorithm,
            "kid": self.kid,
            "use": "sig",
            "key_ops": ["verify"],
        }
        self.key = signing_key(self.jwk, [self.algorithm])

    def token(self, claims=None, *, omit=(), headers=None):
        payload = {
            "sub": str(USER_A),
            "email": "student@example.invalid",
            "role": "authenticated",
            "is_anonymous": False,
            "iss": "https://example.supabase.co/auth/v1",
            "aud": "authenticated",
            "iat": NOW - 60,
            "exp": NOW + 3600,
            **(claims or {}),
        }
        for name in omit:
            payload.pop(name, None)
        return jwt.encode(
            payload,
            self.private,
            algorithm=self.algorithm,
            headers={"kid": self.kid, **(headers or {})},
        )


class FixedResolver:
    def __init__(self, key):
        self.key = key
        self.calls = []

    async def resolve(self, kid, algorithm):
        self.calls.append((kid, algorithm))
        return self.key
