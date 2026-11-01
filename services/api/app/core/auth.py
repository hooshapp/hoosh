"""Project-pinned asymmetric verification; no login, signing or refresh authority."""

import base64
import binascii
import re
import time
from collections.abc import Callable, Collection
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import jwt
from cryptography.hazmat.primitives.asymmetric import ec, rsa

from app.core.config import Settings, SigningAlgorithm
from app.core.errors import ApiError
from app.core.identity import KeyResolver, VerificationKey, VerifiedIdentity
from app.core.json_data import json_object
from app.schemas.errors import ErrorCode

KID_PATTERN = re.compile(r"[!-~]{1,128}\Z")
SEGMENT_PATTERN = re.compile(r"[A-Za-z0-9_-]+\Z")
MAX_NUMERIC_DATE = 253402300799  # Last second representable in UTC year 9999.


def valid_kid(value: Any) -> bool:
    return isinstance(value, str) and KID_PATTERN.fullmatch(value) is not None


def decode_segment(segment: str) -> bytes:
    if not SEGMENT_PATTERN.fullmatch(segment):
        raise ValueError("Invalid base64url segment")
    try:
        result = base64.b64decode(
            segment + "=" * (-len(segment) % 4), altchars=b"-_", validate=True
        )
    except (ValueError, binascii.Error) as error:
        raise ValueError("Invalid base64url encoding") from error
    if base64.urlsafe_b64encode(result).decode().rstrip("=") != segment:
        raise ValueError("Noncanonical base64url encoding")
    return result


def bearer_token(value: str | None) -> str:
    if value is None or not (match := re.fullmatch(r"(?i:Bearer) +([^\s]+)", value)):
        raise ApiError(ErrorCode.AUTH_REQUIRED)
    return match[1]


@dataclass(frozen=True, slots=True)
class TokenHeader:
    kid: str
    algorithm: SigningAlgorithm


def token_header(token: str, settings: Settings) -> TokenHeader:
    try:
        if (
            not isinstance(token, str)
            or len(token) > settings.auth_token_max_bytes
            or not token.isascii()
        ):
            raise ValueError("Invalid token framing")
        segments = token.split(".")
        if len(segments) != 3:
            raise ValueError("Invalid compact token")
        header = json_object(decode_segment(segments[0]))
        # Check only bounded JSON framing here; no unverified claim authorizes anything.
        json_object(decode_segment(segments[1]))
        signature = decode_segment(segments[2])
        algorithm = header.get("alg")
        if algorithm not in (settings.supabase_jwt_algorithms or ()):
            raise ValueError("Algorithm outside configured allowlist")
        if not valid_kid(header.get("kid")):
            raise ValueError("Invalid signing key identifier")
        if header.get("typ", "JWT") != "JWT":
            raise ValueError("Unsupported token type")
        if any(name in header for name in ("crit", "b64", "jku", "x5u", "jwk", "x5c")):
            raise ValueError("Unsupported JOSE header")
        if algorithm == "ES256" and len(signature) != 64:
            raise ValueError("Invalid EC signature shape")
        if algorithm == "RS256" and not 256 <= len(signature) <= 1024:
            raise ValueError("Invalid RSA signature shape")
        return TokenHeader(kid=header["kid"], algorithm=algorithm)
    except (ValueError, TypeError) as error:
        raise ApiError(ErrorCode.INVALID_TOKEN) from error


def signing_key(data: dict[str, Any], algorithms: Collection[str]) -> VerificationKey:
    """Validate only public verification keys; provider failures are mapped by resolver."""
    algorithm = data.get("alg")
    if algorithm not in algorithms or algorithm not in ("ES256", "RS256"):
        raise ValueError("Unsupported signing key algorithm")
    if not valid_kid(data.get("kid")) or data.get("use", "sig") != "sig":
        raise ValueError("Invalid public signing key metadata")
    if "key_ops" in data and data["key_ops"] != ["verify"]:
        raise ValueError("Key must be exclusively for verification")
    if any(name in data for name in ("d", "p", "q", "dp", "dq", "qi", "oth", "k")):
        raise ValueError("Private/symmetric material is not a public verification key")
    try:
        if algorithm == "ES256":
            if data.get("kty") != "EC" or data.get("crv") != "P-256":
                raise ValueError("ES256 requires P-256")
            if any(len(decode_segment(data[name])) != 32 for name in ("x", "y")):
                raise ValueError("Invalid EC coordinates")
        else:
            if data.get("kty") != "RSA" or not isinstance(data.get("n"), str):
                raise ValueError("RS256 requires RSA")
            if len(data["n"]) > 1366 or len(data.get("e", "")) > 8:
                raise ValueError("RSA key exceeds verification resource bound")
            modulus = int.from_bytes(decode_segment(data["n"]))
            exponent = int.from_bytes(decode_segment(data["e"]))
            if not 2048 <= modulus.bit_length() <= 8192 or not 3 <= exponent <= 2**32 - 1:
                raise ValueError("Invalid RSA strength/exponent")
        public = jwt.PyJWK.from_dict(data, algorithm=algorithm).key
        if algorithm == "ES256" and not (
            isinstance(public, ec.EllipticCurvePublicKey) and isinstance(public.curve, ec.SECP256R1)
        ):
            raise ValueError("Incompatible EC key")
        if algorithm == "RS256" and not isinstance(public, rsa.RSAPublicKey):
            raise ValueError("Incompatible RSA key")
    except (KeyError, TypeError, jwt.PyJWTError, binascii.Error) as error:
        raise ValueError("Invalid public verification key") from error
    return VerificationKey(kid=data["kid"], algorithm=algorithm, public_key=public)


def numeric_date(claims: dict[str, Any], name: str) -> float:
    value = claims.get(name)
    # Supabase NumericDate values may be integral/fractional JSON numbers, never bool/string.
    if type(value) not in (int, float) or not 0 <= value <= MAX_NUMERIC_DATE:
        raise ValueError("Invalid NumericDate")
    return value


class SupabaseTokenVerifier:
    def __init__(
        self, settings: Settings, resolver: KeyResolver, *, clock: Callable[[], float] = time.time
    ) -> None:
        if not settings.auth_configured:
            raise ValueError("Verifier requires complete trusted configuration")
        self.settings = settings
        self.resolver = resolver
        self.clock = clock

    async def verify(self, token: str) -> VerifiedIdentity:
        header = token_header(token, self.settings)
        key = await self.resolver.resolve(header.kid, header.algorithm)
        if key.kid != header.kid or key.algorithm != header.algorithm:
            raise ApiError(ErrorCode.INVALID_TOKEN)
        try:
            claims = jwt.decode(
                token,
                key.public_key,
                algorithms=list(self.settings.supabase_jwt_algorithms or ()),
                issuer=self.settings.supabase_jwt_issuer,
                audience=self.settings.supabase_jwt_audience,
                options={
                    "require": ["exp", "iat", "sub", "iss", "aud", "role", "is_anonymous"],
                    "strict_aud": True,
                    "enforce_minimum_key_length": True,
                    # Signature/issuer/audience stay enabled. Only clock checks are delegated
                    # to the strict NumericDate validation below, using our injectable clock.
                    "verify_exp": False,
                    "verify_iat": False,
                    "verify_nbf": False,
                },
            )
            if claims["role"] != "authenticated" or type(claims["is_anonymous"]) is not bool:
                raise ValueError("Not an authenticated-user token")
            user_id = UUID(claims["sub"])
            email = claims.get("email")
            if email is not None and not isinstance(email, str):
                raise ValueError("Invalid optional display email")
            issued = numeric_date(claims, "iat")
            expiration = numeric_date(claims, "exp")
            not_before = numeric_date(claims, "nbf") if "nbf" in claims else issued
            now = self.clock()
            skew = self.settings.auth_clock_skew_seconds
            if issued > now + skew or not_before > now + skew or expiration <= issued:
                raise ValueError("Invalid issue/validity interval")
            if not_before >= expiration:
                raise ValueError("Invalid not-before interval")
        except (jwt.PyJWTError, ValueError, TypeError, AttributeError) as error:
            raise ApiError(ErrorCode.INVALID_TOKEN) from error
        # Only a cryptographically verified, otherwise valid identity can be called expired.
        if expiration <= now - skew:
            raise ApiError(ErrorCode.TOKEN_EXPIRED)
        if claims["is_anonymous"]:
            raise ApiError(ErrorCode.FORBIDDEN)
        return VerifiedIdentity(user_id=user_id, email=email)


class UnavailableTokenVerifier:
    async def verify(self, token: str) -> VerifiedIdentity:
        raise ApiError(ErrorCode.AUTH_UNAVAILABLE)
