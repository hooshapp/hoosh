"""Immutable verified domain result and narrow async trust ports."""

from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from cryptography.hazmat.primitives.asymmetric.ec import EllipticCurvePublicKey
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey

from app.core.config import SigningAlgorithm


@dataclass(frozen=True, slots=True)
class VerifiedIdentity:
    user_id: UUID
    email: str | None


@dataclass(frozen=True, slots=True)
class VerificationKey:
    kid: str
    algorithm: SigningAlgorithm
    public_key: EllipticCurvePublicKey | RSAPublicKey


class KeyResolver(Protocol):
    async def resolve(self, kid: str, algorithm: SigningAlgorithm) -> VerificationKey: ...


class TokenVerifier(Protocol):
    async def verify(self, token: str) -> VerifiedIdentity: ...
