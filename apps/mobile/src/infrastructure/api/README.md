# Account-scoped HTTP boundary

RN-03 is a producer for future RN-04/05 wiring. It does not connect a live session,
implement endpoints, create a query cache, sign out, or change root guards. Anisha
owns the real Auth producer; API-05 owns future generated wire types. The adopted
[HTTP contract](../../../../../packages/contracts/HTTP_API.md) remains authoritative.

## Composition and request contract

Create **one stable client per API environment and AuthSessionPort producer**. Do
not recreate it on each request, focus event, token rotation or render: that would
throw away the sustained-401 gate. An actual session-generation replacement is a
legitimate new ownership boundary. Pass the full public port, not an isolated token
callback, so account/generation checks work. No raw session is exposed or stored.

```ts
import type { AuthSessionPort } from '@disconnect/contracts';
import { createApiClient } from './client';
import { decodeIdentity } from './decoders';

function composeApi(auth: AuthSessionPort) {
  return createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL, auth });
}

// With an actual composed client and caller AbortSignal:
// await api.request('/v1/me', { signal, decode: decodeIdentity });
// await api.health(signal); // Explicitly public; does not touch Auth.
```

`configuration` is frozen and either `ready` or `unavailable` with a bounded reason.
Missing/malformed URL or timeout never falls back to a production/local service.
Use an explicit HTTP(S) **origin** (optional trailing slash), without credentials,
query, fragment or a base-path prefix. Deployed origins use HTTPS; explicitly
configured local/LAN HTTP remains possible for development. The existing env name
and `.env.example` are unchanged. The library does not read environment variables.

`request` defaults to authenticated GET. JSON success requires a pure runtime
`decode(value, {account, requestId})` function; generic TypeScript arguments are not
validation. Health validates the implemented HealthResponse. `decodeIdentity`
projects into the existing AuthIdentity contract and rejects missing/nullability
errors or another user's UUID. It defines no replacement HTTP DTO package. Bind
future generated types to endpoint validators during API-05/RN-05/07 integration;
do not use a type assertion as a decoder or add a duplicate generator now.

A `{json: value}` request encodes JSON and sets Content-Type without trimming or
normalizing profile drafts. Raw `{body: ...}` is an alternative, not a simultaneous
option. GET/HEAD cannot carry a body. Auth owns Authorization: supplied bearer,
cookie, proxy-auth, Host and request-ID headers are discarded; public requests get
no bearer. All requests use explicit no-redirect and omit-cookie policy; the web
cache hint is `no-store`. The backend still owns its response no-store headers.

A body-bearing success must declare JSON (application/json or an application +json
media type), parse, decode, and retain its captured account before delivery. A
204 is accepted only with `{response: 'empty'}` and returns `void` without JSON
parsing. It is a protocol failure when JSON was expected; it cannot manufacture a
successful absent profile. Empty-mode consumers also reject unexpected 200 bodies.

## Deadline, ownership and cleanup

The default **15-second operation budget** covers token lookup, permitted recovery,
fetch, body reading/parsing and decoding. It is configurable at composition and is
not a service SLA. Caller abort plus the internal deadline share one controller;
wall-clock checks at phase boundaries reject work overdue after JS suspension.
Every exit removes owned timers, caller listeners and the temporary public-port
subscription. An abort-ignoring fetch's late response is closed and never parsed.
Late token/body/decoder results are not adopted. Synchronous CPU work cannot be
preempted mid-execution; the elapsed-time check prevents a late result being delivered.

The request captures UUID + sessionGeneration before token acquisition, observes
public snapshot changes, and checks ownership again immediately before dispatch
and before delivery. Same-user routine refresh does not create a new owner. A
sign-out/replacement, including the same UUID with a new generation, cancels the
old work. This short-lived port subscription is not a second SDK auth listener,
refresh timer, account store or root transition coordinator.

Cancellation stops this caller's waiting/network work; it does not cancel the
Auth owner's shared SDK flight. Auth still owns that operation and must reject or
ignore its own stale results. Query/controller code must not show a cancellation
error toast or automatically retry it. RN-04 still needs real account-scoped cache,
draft and mutation cleanup; this client is not a cache-isolation implementation.

## Recovery and pause

- A protected GET receiving 401 asks Auth's single-flight `revalidateSession()` once,
  re-reads the same account/generation and token, then replays that GET at most once.
  Concurrent callers use Auth's flight; this client does not build a competing refresh
  implementation. A changed owner cancels rather than replaying.
- A second 401 pauses further automatic protected requests for that owner/generation,
  including requests whose token lookup was already pending. Focus, reconnect, routine
  token changes, public health success and temporary same-generation Auth unavailability
  do not clear the pause. Malformed persistent-401 bodies cannot hide the pause either.
- Only a deliberate user recovery action calls `recoverSession(signal)`. It revalidates
  once and sends **one `/v1/me` verification GET**, with no extra replay. Only a correctly
  decoded identity matching the captured UUID clears the pause. A public endpoint or an
  arbitrary successful body cannot verify it. Failed/overlapping probes do not open an
  automatic request storm. A local verification epoch stops an older 401 from re-pausing
  a successfully verified scope; it is not another Auth generation/credential counter.
- `getRecoveryState()` reports `ready`, `paused`, `recovering` or unavailable port access.
  It reports the API gate, **not** permission to render private content or Auth readiness.
  RN-04 also checks Auth's snapshot/credential availability. Revalidation/storage/network
  errors never fabricate signed-out state; this client has no sign-out authority.
- A write's 401 is returned without automatic revalidation or replay. Verify identity
  separately and reconcile the endpoint before a deliberate write retry. 403/409/422/503
  are not generic refresh/sign-out triggers. No request retries occur except that single
  permitted GET replay. Do not stack another automatic 401 retry in the query layer.

## Typed failures and uncertain writes

`ApiError.kind` distinguishes configuration, no_session, unauthorized, forbidden,
validation, conflict, rate_limited, unavailable, timeout, network, cancelled and
invalid_response. Messages are fixed safe client copy. Only known server codes,
UUID-shaped request IDs and whitelisted revision/field-code details escape the
boundary. Raw server messages, HTML, SDK exceptions, URLs, arbitrary details and
causes are not attached or logged. Unknown codes remain failures with a safe status
category; malformed envelopes retain status/correlation metadata as protocol errors.

`retryable` is a read-policy hint, never permission to replay a write. HTTP 429 only
exposes a valid Retry-After delay within a supported 60-second automatic-delay window;
missing/invalid/longer delays are nonautomatic. Longer server cooldowns are **not
shortened** to an earlier retry. The query layer owns any future bounded scheduling.

`requestMayHaveCommitted` conservatively marks transport/protocol/5xx failures after
a mutation was dispatched. A timeout, cancellation or lost response does not prove
rollback. Preserve the draft, refetch and reconcile through RN-07 rather than
blindly replaying PATCH. This flag does not prove a commit occurred; absence of it
does not authorize mutation replay either.

## Platform transport and evidence

Web/server use standard global Fetch. Metro selects `transport.native.ts`, which
explicitly imports the already-installed `expo/fetch`; this keeps the pinned native
redirect/abort implementation even if the app opts out of Expo's global-fetch
replacement. Its installed Swift/Kotlin sources honor redirect mode `error` before
following redirects. See the [SDK 58 Fetch reference](https://docs.expo.dev/versions/v58.0.0/sdk/expo/#expofetch-api).
No package/config/native-project changes were needed. Device verification remains
separate from TypeScript, Node transport tests and static native bundling.

Run `npm run check` or `npm run test:unit --workspace @disconnect/mobile`. Tests use
canonical HTTP examples as test input, fake Auth ports, deferred promises/fake time
and two small loopback HTTP tests for real Fetch redirect refusal/body deadlines.
They require no Supabase account, JWT, backend deployment or generic mock server.
`__tests__/support.ts` and all fixture imports stay out of release entries/graphs.
No environment switch, test identity or success stub is wired into the actual app.
The Plan 04 notes record exact results and remaining live/backend/device gates.

Quest management adds strict own resource/page/definition decoders and revisioned
PUT/DELETE via the existing scoped request path. QUEST_CONFLICT and definition
validation join the closed safe error whitelist; no response copy/IDs are logged.
Lost writes remain unconfirmed and never retry automatically. See the
[quest contract](../../../../../docs/architecture/quest-definition-management.md).
