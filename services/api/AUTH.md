# Backend access-token verification

Owner: Ishmum. Supabase project/Auth administration and the mobile session producer
remain Anisha's work. No login, signing, password storage or refresh endpoint exists
here. Consume her SB-02 public trust metadata through the four `.env.example`
settings; production or partially configured environments cannot silently fall back.

## Resources and discovery

The validated runtime factory is `app.runtime.create_app`; only `app.main:app`
constructs global runtime settings. `app.application.create_app` is environment-free
assembly with an unavailable verifier for schema tooling. Lifespan constructs one
resolver/client only when configured, replaces the unavailable port, and restores
it before closing the client on shutdown. Starting `/healthz` does not fetch keys.

Discovery uses only the configured HTTPS issuer's `/.well-known/jwks.json`. No
bearer token, token URL or user-controlled identity is sent. HTTPX2 has TLS
verification, no environment proxies, redirects disabled and a small connection
pool. It is promoted from the existing test dependency, not replaced by another
HTTP stack. The complete asyncio deadline includes lock waiting, connect and body
streaming. Per-I/O timeout alone would not bound a trickle response.

Current configurable defaults:

| Resource | Default / policy |
|---|---|
| JWT | 16 KiB, bounded key ID; strict JSON/base64url and JOSE policy |
| Clock skew | 30 seconds; finite strict NumericDate checks after signature/trust |
| JWKS positive TTL | 300 seconds, monotonic; never extend stale keys after failure |
| Whole lookup / connect | 5 / 2 seconds |
| JWKS bytes / entries | 256 KiB / 16 total advertised entries |
| Refresh cooldown | 30 seconds after an attempt, including failure/cancellation |
| Negative cache | 64 LRU key IDs, 60-second non-sliding TTL, capped by positive expiry |
| Network pool | 4 connections / 2 keepalive; refresh lock coalesces this issuer |

Responses must be HTTP 200 JSON or JWK-set JSON, bounded by declared and actual
streamed bytes. Request identity encoding and reject compressed responses before
decoding, avoiding decompression amplification. Reject malformed/duplicate key IDs,
private material and incompatible configured-algorithm keys. Advertised algorithms
outside the explicit allowlist are ignored, never enabled automatically. A valid
empty/unsupported set authoritatively lacks the requested key and returns 401.

The cache is atomically replaced only after complete validation. Unexpired matching
keys verify locally. Unknown IDs within cooldown/negative TTL return 401; a required
fetch failure returns 503. Unknown traffic cannot allocate an unbounded map or
force per-request discovery. Repeated negative hits do not move expiration forward.
A cancelled owner releases its stream/lock but keeps finite attempt backoff; another
request can succeed after that cooldown. Externally cancelled requests propagate
cancellation instead of becoming an HTTP success/error. A waiting request has its
own whole deadline. No unbounded background thread/task is abandoned.

## Rotation and revocation

A newly rotated kid can be delayed by this service's cooldown/negative TTL and
upstream caching. Supabase documents an additional edge discovery cache; coordinate
standby/rotation with Anisha rather than promising instantaneous propagation.
Restart this service's workers to clear process-local caches during incident
recovery, and account for upstream caches separately. Tightening cache bounds
requires a reliability/rotation review; do not accept stale keys indefinitely.

Offline signature verification does not prove immediate revocation after logout,
password changes or deletion. Valid, unexpired access tokens retain their documented
stateless validity. Future sensitive operations may require a separate online check
with an explicit outage policy; M1 does not introduce one.

## Evidence

Tests use ephemeral test keys, fake monotonic/wall clocks and HTTPX2 mock transports.
They cover coalescing, rotation, outage/expiry, negative storms, malformed/oversized
responses, redirect/compression rejection, lock/body deadlines, cancellation recovery
and lifespan close. These are real crypto/async code paths, not live Supabase
acceptance. SB-02/03 and RN-05/06 supply actual-project/token/mobile evidence later.

Sources reviewed on 2026-11-01:
[Supabase signing keys](https://supabase.com/docs/guides/auth/signing-keys),
[PyJWT verification](https://pyjwt.readthedocs.io/en/stable/api.html),
[Python asyncio timeout/cancellation](https://docs.python.org/3.12/library/asyncio-task.html#asyncio.timeout),
[HTTPX2 package/API](https://pypi.org/project/httpx2/).
