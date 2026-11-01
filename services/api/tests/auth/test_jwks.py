import asyncio
import json
import time

import httpx2
import pytest
from fastapi.testclient import TestClient

from app.core.auth import SupabaseTokenVerifier, UnavailableTokenVerifier
from app.core.errors import ApiError
from app.core.jwks import JwksResolver
from app.runtime import create_app
from app.schemas.errors import ErrorCode
from tests.auth.support import LocalSigner, settings


class Clock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


@pytest.fixture(scope="module")
def signer():
    return LocalSigner()


def resolver_for(handler, *, clock=None, config=None):
    client = httpx2.AsyncClient(transport=httpx2.MockTransport(handler))
    return JwksResolver(config or settings(), client=client, clock=clock or Clock())


def assert_code(error, code):
    assert error.value.code == code


def test_cold_hot_expired_cache_and_fixed_request_without_credentials(signer):
    async def run():
        calls = []
        clock = Clock()

        def handler(request):
            calls.append(request)
            return httpx2.Response(200, json={"keys": [signer.jwk]})

        resolver = resolver_for(handler, clock=clock)
        try:
            first = await resolver.resolve(signer.kid, "ES256")
            assert await resolver.resolve(signer.kid, "ES256") is first
            assert len(calls) == 1
            clock.advance(301)
            await resolver.resolve(signer.kid, "ES256")
            assert len(calls) == 2
            assert str(calls[0].url) == settings().jwks_url
            assert "authorization" not in calls[0].headers
            assert calls[0].headers["accept-encoding"] == "identity"
        finally:
            await resolver.aclose()
        assert resolver._client.is_closed
        with pytest.raises(ApiError) as error:
            await resolver.resolve(signer.kid, "ES256")
        assert_code(error, ErrorCode.AUTH_UNAVAILABLE)

    asyncio.run(run())


def test_concurrent_cold_requests_coalesce_and_unknown_storm_is_bounded(signer):
    async def run():
        calls = 0

        async def handler(request):
            nonlocal calls
            calls += 1
            await asyncio.sleep(0)
            return httpx2.Response(200, json={"keys": [signer.jwk]})

        resolver = resolver_for(handler)
        try:
            keys = await asyncio.gather(
                *(resolver.resolve(signer.kid, "ES256") for _ in range(100))
            )
            assert all(key.kid == signer.kid for key in keys)
            assert calls == 1
            for i in range(200):
                with pytest.raises(ApiError) as error:
                    await resolver.resolve(f"unknown-{i}", "ES256")
                assert_code(error, ErrorCode.INVALID_TOKEN)
            assert calls == 1
            assert len(resolver._negative) == 64
        finally:
            await resolver.aclose()

    asyncio.run(run())


def test_unknown_refresh_rotation_and_negative_ttl_does_not_slide(signer):
    async def run():
        clock = Clock()
        newer = LocalSigner(kid="rotated")
        advertised = [signer.jwk]
        calls = 0

        def handler(request):
            nonlocal calls
            calls += 1
            return httpx2.Response(200, json={"keys": advertised})

        resolver = resolver_for(handler, clock=clock)
        try:
            await resolver.resolve(signer.kid, "ES256")
            with pytest.raises(ApiError):
                await resolver.resolve(newer.kid, "ES256")
            expiry = resolver._negative[newer.kid]
            clock.advance(31)
            advertised.append(newer.jwk)
            # Same negative key remains bounded to its original expiry, not renewed on every hit.
            with pytest.raises(ApiError):
                await resolver.resolve(newer.kid, "ES256")
            assert resolver._negative[newer.kid] == expiry
            clock.advance(30)
            assert (await resolver.resolve(newer.kid, "ES256")).kid == newer.kid
            assert calls == 2
            # Expired cache must refresh even when its successful fetch was inside cooldown.
            short = settings(auth_jwks_ttl_seconds=1)
            another = resolver_for(handler, clock=clock, config=short)
            try:
                await another.resolve(newer.kid, "ES256")
                clock.advance(2)
                await another.resolve(newer.kid, "ES256")
                assert calls == 4
            finally:
                await another.aclose()
        finally:
            await resolver.aclose()

    asyncio.run(run())


def test_new_unknown_key_refreshes_once_after_cooldown_and_removed_keys_expire(signer):
    async def run():
        clock = Clock()
        newer = LocalSigner(kid="rotated")
        advertised = [signer.jwk]
        calls = 0

        def handler(request):
            nonlocal calls
            calls += 1
            return httpx2.Response(200, json={"keys": advertised})

        resolver = resolver_for(handler, clock=clock)
        try:
            await resolver.resolve(signer.kid, "ES256")
            clock.advance(31)
            advertised[:] = [newer.jwk]
            assert (await resolver.resolve(newer.kid, "ES256")).kid == newer.kid
            with pytest.raises(ApiError) as error:
                await resolver.resolve(signer.kid, "ES256")
            assert_code(error, ErrorCode.INVALID_TOKEN)
            assert calls == 2
        finally:
            await resolver.aclose()

    asyncio.run(run())


def test_outage_preserves_only_unexpired_known_keys_and_failed_refresh_backoff(signer):
    async def run():
        clock = Clock()
        failing = False
        calls = 0

        def handler(request):
            nonlocal calls
            calls += 1
            if failing:
                raise httpx2.ConnectError("synthetic outage", request=request)
            return httpx2.Response(200, json={"keys": [signer.jwk]})

        resolver = resolver_for(handler, clock=clock)
        try:
            await resolver.resolve(signer.kid, "ES256")
            failing = True
            clock.advance(31)
            with pytest.raises(ApiError) as error:
                await resolver.resolve("new-key", "ES256")
            assert_code(error, ErrorCode.AUTH_UNAVAILABLE)
            assert (await resolver.resolve(signer.kid, "ES256")).kid == signer.kid
            assert calls == 2
            clock.advance(301)
            with pytest.raises(ApiError) as error:
                await resolver.resolve(signer.kid, "ES256")
            assert_code(error, ErrorCode.AUTH_UNAVAILABLE)
            with pytest.raises(ApiError):
                await resolver.resolve(signer.kid, "ES256")
            assert calls == 3
            failing = False
            clock.advance(31)
            assert (await resolver.resolve(signer.kid, "ES256")).kid == signer.kid
        finally:
            await resolver.aclose()

    asyncio.run(run())


@pytest.mark.parametrize(
    "case",
    [
        "redirect",
        "status",
        "not-json",
        "bad-json",
        "duplicate-json",
        "missing-list",
        "not-list",
        "duplicate-kid",
        "too-many",
        "private",
        "bad-use",
        "bad-key",
        "length",
        "length-invalid",
        "compressed",
        "oversized-stream",
        "truncated",
    ],
)
def test_untrusted_discovery_fails_closed_without_redirect_or_partial_cache(signer, case):
    async def run():
        calls = []

        def handler(request):
            calls.append(request)
            keys = [signer.jwk]
            status = 200
            headers = {"Content-Type": "application/json"}
            content = json.dumps({"keys": keys}).encode()
            if case == "redirect":
                status, headers["Location"] = 302, "https://attacker.invalid/keyset"
            elif case == "status":
                status = 500
            elif case == "not-json":
                headers["Content-Type"] = "text/html"
            elif case == "bad-json":
                content = b"{"
            elif case == "duplicate-json":
                content = b'{"keys":[],"keys":[]}'
            elif case == "missing-list":
                content = b"{}"
            elif case == "not-list":
                content = b'{"keys":{}}'
            elif case == "duplicate-kid":
                content = json.dumps({"keys": keys * 2}).encode()
            elif case == "too-many":
                content = json.dumps({"keys": keys * 17}).encode()
            elif case == "private":
                content = json.dumps({"keys": [{**signer.jwk, "d": "secret"}]}).encode()
            elif case == "bad-use":
                content = json.dumps({"keys": [{**signer.jwk, "use": "enc"}]}).encode()
            elif case == "bad-key":
                content = json.dumps({"keys": [{**signer.jwk, "x": "bad"}]}).encode()
            elif case == "length":
                headers["Content-Length"] = "262145"
            elif case == "length-invalid":
                headers["Content-Length"] = "-1"
            elif case == "compressed":
                headers["Content-Encoding"] = "gzip"
            elif case == "oversized-stream":
                content = b" " * 262145
            elif case == "truncated":
                headers["Content-Length"] = str(len(content) + 5)
            return httpx2.Response(status, headers=headers, content=content)

        resolver = resolver_for(handler)
        try:
            with pytest.raises(ApiError) as error:
                await resolver.resolve(signer.kid, "ES256")
            assert_code(error, ErrorCode.AUTH_UNAVAILABLE)
            assert not resolver._keys
            assert len(calls) == 1
            assert str(calls[0].url) == settings().jwks_url
        finally:
            await resolver.aclose()

    asyncio.run(run())


def test_empty_or_unsupported_keyset_and_known_algorithm_mismatch_are_invalid(signer):
    async def run():
        other = {"kid": "future", "alg": "ES384"}
        resolver = resolver_for(lambda r: httpx2.Response(200, json={"keys": [other]}))
        try:
            with pytest.raises(ApiError) as error:
                await resolver.resolve("future", "ES256")
            assert_code(error, ErrorCode.INVALID_TOKEN)
        finally:
            await resolver.aclose()
        resolver = resolver_for(lambda r: httpx2.Response(200, json={"keys": [signer.jwk]}))
        try:
            await resolver.resolve(signer.kid, "ES256")
            with pytest.raises(ApiError) as error:
                await resolver.resolve(signer.kid, "RS256")
            assert_code(error, ErrorCode.INVALID_TOKEN)
        finally:
            await resolver.aclose()

    asyncio.run(run())


class Trickle(httpx2.AsyncByteStream):
    def __init__(self):
        self.closed = False
        self.started = asyncio.Event()

    async def __aiter__(self):
        self.started.set()
        for _ in range(1000):
            yield b" "
            await asyncio.sleep(0.005)

    async def aclose(self):
        self.closed = True


def test_whole_deadline_covers_slow_trickle_and_releases_stream_and_lock(signer):
    async def run():
        stream = Trickle()
        resolver = resolver_for(
            lambda r: httpx2.Response(
                200, stream=stream, headers={"Content-Type": "application/json"}
            ),
            config=settings(auth_jwks_budget_seconds=0.04, auth_jwks_connect_seconds=0.01),
        )
        started = time.monotonic()
        try:
            with pytest.raises(ApiError) as error:
                await resolver.resolve(signer.kid, "ES256")
            assert_code(error, ErrorCode.AUTH_UNAVAILABLE)
            assert time.monotonic() - started < 0.5
            assert stream.closed
            assert not resolver._lock.locked()
        finally:
            await resolver.aclose()

    asyncio.run(run())


def test_wait_for_refresh_lock_also_obeys_complete_budget(signer):
    async def run():
        calls = []
        resolver = resolver_for(
            lambda r: calls.append(r),
            config=settings(auth_jwks_budget_seconds=0.03, auth_jwks_connect_seconds=0.01),
        )
        await resolver._lock.acquire()
        try:
            with pytest.raises(ApiError) as error:
                await resolver.resolve(signer.kid, "ES256")
            assert_code(error, ErrorCode.AUTH_UNAVAILABLE)
            assert not calls
        finally:
            resolver._lock.release()
            await resolver.aclose()

    asyncio.run(run())


def test_cancelled_refresh_allows_later_success_after_finite_cooldown(signer):
    async def run():
        stream = Trickle()
        clock = Clock()
        healthy = False

        def handler(request):
            if healthy:
                return httpx2.Response(200, json={"keys": [signer.jwk]})
            return httpx2.Response(200, stream=stream, headers={"Content-Type": "application/json"})

        resolver = resolver_for(handler, clock=clock)
        try:
            task = asyncio.create_task(resolver.resolve(signer.kid, "ES256"))
            await stream.started.wait()
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
            assert stream.closed
            assert not resolver._lock.locked()
            assert not resolver._keys
            healthy = True
            clock.advance(31)
            assert (await resolver.resolve(signer.kid, "ES256")).kid == signer.kid
        finally:
            await resolver.aclose()

    asyncio.run(run())


def test_runtime_lifespan_owns_one_resolver_and_schema_assembly_owns_none(monkeypatch, signer):
    resolvers = []

    def factory(config):
        resolver = resolver_for(
            lambda r: httpx2.Response(200, json={"keys": [signer.jwk]}), config=config
        )
        resolvers.append(resolver)
        return resolver

    monkeypatch.setattr("app.runtime.JwksResolver", factory)
    app = create_app(settings())
    assert not resolvers
    with TestClient(app) as client:
        assert isinstance(app.state.token_verifier, SupabaseTokenVerifier)
        assert client.get("/healthz").status_code == 200
        assert len(resolvers) == 1
    assert resolvers[0]._client.is_closed
    assert isinstance(app.state.token_verifier, UnavailableTokenVerifier)
    with TestClient(create_app(settings_override := settings())):
        assert settings_override.auth_configured
    assert len(resolvers) == 2
    from app.application import create_app as assemble_app
    from app.core.config import Settings

    with TestClient(assemble_app()):
        assert len(resolvers) == 2
    with TestClient(create_app(Settings(_env_file=None))):
        assert len(resolvers) == 2
