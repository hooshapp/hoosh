"""Bounded process-scoped public key discovery. No per-token URL or background work."""

import asyncio
import time
from collections import OrderedDict
from collections.abc import Callable, Mapping
from types import MappingProxyType

import httpx2

from app.core.auth import signing_key, valid_kid
from app.core.config import Settings, SigningAlgorithm
from app.core.diagnostics import dependency_event
from app.core.errors import ApiError
from app.core.identity import VerificationKey
from app.core.json_data import json_object
from app.schemas.errors import ErrorCode


class JwksResolver:
    def __init__(
        self,
        settings: Settings,
        *,
        client: httpx2.AsyncClient | None = None,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if not settings.auth_configured:
            raise ValueError("JWKS resolver requires complete trusted configuration")
        self.settings = settings
        self.clock = clock
        self._client = (
            client
            if client is not None
            else httpx2.AsyncClient(
                verify=True,
                follow_redirects=False,
                trust_env=False,
                timeout=httpx2.Timeout(
                    settings.auth_jwks_budget_seconds, connect=settings.auth_jwks_connect_seconds
                ),
                limits=httpx2.Limits(max_connections=4, max_keepalive_connections=2),
            )
        )
        self._keys: Mapping[str, VerificationKey] = MappingProxyType({})
        self._expires_at: float | None = None
        self._last_attempt: float | None = None
        self._last_attempt_failed = False
        self._negative: OrderedDict[str, float] = OrderedDict()
        self._lock = asyncio.Lock()
        self._closed = False

    async def resolve(self, kid: str, algorithm: SigningAlgorithm) -> VerificationKey:
        if not valid_kid(kid) or algorithm not in (self.settings.supabase_jwt_algorithms or ()):
            raise ApiError(ErrorCode.INVALID_TOKEN)
        if self._closed:
            dependency_event("jwks", "closed")
            raise ApiError(ErrorCode.AUTH_UNAVAILABLE)
        try:
            # Includes waiting for the coalescing lock, TLS, streaming and validation.
            async with asyncio.timeout(self.settings.auth_jwks_budget_seconds):
                return await self._resolve(kid, algorithm)
        except (TimeoutError, httpx2.HTTPError, ValueError, RuntimeError) as error:
            dependency_event(
                "jwks", "budget_exceeded" if isinstance(error, TimeoutError) else "fetch_failed"
            )
            raise ApiError(ErrorCode.AUTH_UNAVAILABLE) from error

    def _fresh(self) -> bool:
        return self._expires_at is not None and self.clock() < self._expires_at

    def _cooling_down(self) -> bool:
        return (
            self._last_attempt is not None
            and self.clock() - self._last_attempt < self.settings.auth_jwks_refresh_cooldown_seconds
        )

    def _known_key(self, kid: str, algorithm: SigningAlgorithm) -> VerificationKey | None:
        key = self._keys.get(kid)
        if key is not None and key.algorithm != algorithm:
            raise ApiError(ErrorCode.INVALID_TOKEN)
        return key

    def _remember_unknown(self, kid: str) -> None:
        now = self.clock()
        for name, expiry in list(self._negative.items()):
            if expiry <= now:
                del self._negative[name]
        self._negative[kid] = min(
            now + self.settings.auth_jwks_negative_ttl_seconds, self._expires_at or now
        )
        self._negative.move_to_end(kid)
        while len(self._negative) > self.settings.auth_jwks_negative_max_entries:
            self._negative.popitem(last=False)

    def _from_fresh_cache(self, kid: str, algorithm: SigningAlgorithm) -> VerificationKey | None:
        if not self._fresh():
            return None
        if (key := self._known_key(kid, algorithm)) is not None:
            dependency_event("jwks", "cache_hit")
            return key
        if self._negative.get(kid, 0) > self.clock():
            self._negative.move_to_end(kid)  # LRU recency, not a sliding negative TTL.
            dependency_event("jwks", "negative_hit")
            raise ApiError(ErrorCode.INVALID_TOKEN)
        if self._cooling_down():
            dependency_event("jwks", "refresh_suppressed")
            self._remember_unknown(kid)
            raise ApiError(ErrorCode.INVALID_TOKEN)
        return None

    async def _resolve(self, kid: str, algorithm: SigningAlgorithm) -> VerificationKey:
        if (key := self._from_fresh_cache(kid, algorithm)) is not None:
            return key
        async with self._lock:
            if self._closed:
                raise ApiError(ErrorCode.AUTH_UNAVAILABLE)
            # Another request may have populated or refreshed while this one waited.
            if (key := self._from_fresh_cache(kid, algorithm)) is not None:
                return key
            if not self._fresh() and self._last_attempt_failed and self._cooling_down():
                dependency_event("jwks", "refresh_suppressed")
                raise ApiError(ErrorCode.AUTH_UNAVAILABLE)
            self._last_attempt = self.clock()
            # Failure/cancellation leaves a finite cooldown, not a wedged lock or stale extension.
            self._last_attempt_failed = True
            dependency_event("jwks", "fetch_started")
            try:
                keys = await self._fetch_keys()
            except asyncio.CancelledError:
                dependency_event("jwks", "fetch_cancelled")
                raise
            dependency_event("jwks", "fetch_succeeded")
            if self._closed:
                raise ApiError(ErrorCode.AUTH_UNAVAILABLE)
            self._keys = MappingProxyType(keys)
            self._expires_at = self.clock() + self.settings.auth_jwks_ttl_seconds
            self._negative.clear()
            self._last_attempt_failed = False
            if (key := self._known_key(kid, algorithm)) is not None:
                return key
            self._remember_unknown(kid)
            raise ApiError(ErrorCode.INVALID_TOKEN)

    async def _fetch_keys(self) -> dict[str, VerificationKey]:
        async with self._client.stream(
            "GET",
            self.settings.jwks_url,
            follow_redirects=False,
            headers={"Accept": "application/json", "Accept-Encoding": "identity"},
        ) as response:
            if response.status_code != 200:
                raise ValueError("Public key discovery did not succeed")
            if response.headers.get("Content-Encoding", "identity").lower() != "identity":
                raise ValueError("Compressed key sets are not accepted")
            media = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if media not in ("application/json", "application/jwk-set+json"):
                raise ValueError("Public key discovery did not return JSON")
            declared = response.headers.get("Content-Length")
            if declared is not None and (
                not declared.isascii()
                or not declared.isdecimal()
                or len(declared) > 10
                or int(declared) > self.settings.auth_jwks_max_bytes
            ):
                raise ValueError("Invalid/excessive key response length")
            body = bytearray()
            async for chunk in response.aiter_bytes(chunk_size=16384):
                if len(body) + len(chunk) > self.settings.auth_jwks_max_bytes:
                    raise ValueError("Public key set exceeds resource bound")
                body.extend(chunk)
            if declared is not None and len(body) != int(declared):
                raise ValueError("Incomplete key response")
        raw = json_object(bytes(body)).get("keys")
        if not isinstance(raw, list) or len(raw) > self.settings.auth_jwks_max_keys:
            raise ValueError("Invalid/excessive public key list")
        keys = {}
        seen = set()
        for data in raw:
            if not isinstance(data, dict) or not valid_kid(data.get("kid")):
                raise ValueError("Invalid public key entry")
            if data["kid"] in seen:
                raise ValueError("Ambiguous duplicate signing key identifier")
            seen.add(data["kid"])
            if any(name in data for name in ("d", "p", "q", "dp", "dq", "qi", "oth", "k")):
                raise ValueError("Public discovery contained private key material")
            if not isinstance(data.get("alg"), str):
                raise ValueError("Missing public key algorithm metadata")
            if data["alg"] not in (self.settings.supabase_jwt_algorithms or ()):
                continue  # Other advertised algorithms are never implicitly enabled.
            key = signing_key(data, self.settings.supabase_jwt_algorithms or ())
            keys[key.kid] = key
        return keys

    async def aclose(self) -> None:
        if not self._closed:
            self._closed = True
            self._keys = MappingProxyType({})
            self._expires_at = None
            self._negative.clear()
            await self._client.aclose()
