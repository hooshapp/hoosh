# Identity and profile HTTP contract

**Status:** Adopted for M1/M2 on 2026-10-28 at Ishmum's direction. These endpoints
are specified, not implemented. Only `/healthz` currently runs. Ishmum owns the
server/schema/client; Anisha owns the Auth session consumed by the client.

See [architecture](../../docs/architecture/identity-foundation.md),
[Plan 00](../../docs/core_plan/00_shared_contracts.md), and the synthetic
[HTTP examples](fixtures/http-v1.json) and [name cases](fixtures/display-name.json).
The fixtures are test input outside the mobile route/import tree, not a mock mode.

## Transport and identity

- Private routes use `Authorization: Bearer <current Supabase access JWT>` and
  `Content-Type: application/json` for PATCH. Never send a refresh token/password
  to FastAPI. Deployment uses HTTPS; explicit local development can use HTTP.
- Supabase Auth UUID (`sub`) is the sole owner key. The configured verifier checks
  signature, issuer, audience, timestamps, subject, and initial non-anonymous scope.
  The API ignores neither signature errors nor project mismatches.
- All successful operations below return **200** and JSON; no 201/204 alternative.
- Every API response carries a server-generated UUID `X-Request-ID`. Errors repeat
  it in the body. Ignore caller-supplied IDs for authority; never echo arbitrary
  incoming text into logs. Browser CORS must expose `X-Request-ID` to allowed origins.
- Private successes and errors carry `Cache-Control: no-store`; 401 also carries
  `WWW-Authenticate: Bearer`. No access/refresh token appears in a response body.
- UTC timestamps use RFC 3339 with `Z` (fractional seconds permitted). `email` and
  `display_name` always appear, including explicit nulls. UUIDs are UUID strings.

## GET /v1/me — M1

```json
{"user_id":"a46e48ad-c742-4e18-b57d-2c9a56544944","email":"student@example.invalid"}
```

`email` may be null. No product-table access, profile creation, onboarding state,
permissions, or installed-plan claim. A mobile consumer must reject a returned
UUID that differs from its captured current Auth identity. Check generation after
token acquisition and after response delivery, even when cancellation was requested.

## GET /v1/profile — M2

No row is normal and nonmutating:

```json
{"profile":null}
```

An existing row:

```json
{
  "profile": {
    "user_id":"a46e48ad-c742-4e18-b57d-2c9a56544944",
    "display_name":"Jordan",
    "revision":1,
    "created_at":"2026-10-28T18:00:00Z",
    "updated_at":"2026-10-28T18:00:00Z"
  }
}
```

`revision` is a positive integer assigned by the server. The verified identity
selects the row; no owner parameter or email lookup. A missing row does not mean
signed out or completed onboarding. A name can be null even when the row exists.

## PATCH /v1/profile — M2

```json
{"expected_revision":0,"display_name":"  Jordan  "}
```

- Strict object; reject extra fields. `expected_revision` is a required integer
  >=0, without string/float/boolean coercion. At least one mutable field is required;
  the only M2 mutable field is `display_name`. A revision-only body is invalid.
- Name is string or null. Null clears; omission never clears. Reject NUL and
  unpaired Unicode surrogates before database access. Then use **Python 3.12
  `str.strip()`**, reject blank output, and limit to **80 Unicode code points after
  stripping**. No NFC/case normalization. The response contains the canonical name.
- Client sends the raw draft or explicit null. JS `trim()` and UTF-16 `.length`
  cannot be independent authoritative validators; Unicode cases are in the fixture.
  A padded 80-code-point name can be valid even when raw length exceeds 80.
  Describe this normalization in OpenAPI; do not set a misleading raw `maxLength:80`.
- Bound the raw PATCH body to **16 KiB**, including streamed/chunked bodies;
  exceeding the bound yields 413 `REQUEST_TOO_LARGE`. This engineering resource
  bound is separate from the normalized name length. Do not trust Content-Length
  alone or log a rejected body. Non-JSON/invalid JSON yields safe 422 validation.
- Expected revision 0 inserts only if absent, producing revision 1. A positive
  revision updates only a matching existing row and increments atomically. An
  absent row with a positive expectation, stale expectation, or concurrent initial
  insert returns 409. No silent upsert or last-write-wins behavior.
- Success is the existing-profile envelope above, with current timestamps/revision.
  Preserve `created_at` on updates. Null name does not delete the row.
- Client cannot set owner/email/role/timestamps/rewards or a revision directly.
  Product tables have one Alembic history; mobile does no direct product-table CRUD.
- No automatic write replay. If a response is lost, refetch and compare before a
  deliberate new save. For conflicts retain the unsaved draft, refetch, and reconcile.
- A signup name is an operation-local draft, bound only to the resulting verified
  account. It must not be attached to an unrelated restored session through email
  matching or become a second canonical value in mutable Auth metadata.

## Error contract

```json
{
  "error": {
    "code":"PROFILE_CONFLICT",
    "message":"Your profile changed. Review the latest version before saving.",
    "retryable":false,
    "request_id":"a46e48ad-c742-4e18-b57d-2c9a56544945",
    "details":{"current_revision":2}
  }
}
```

| Status | Code | Retryable | Meaning / action |
|---|---|---|---|
| 401 | `AUTH_REQUIRED` | false | Missing/malformed bearer syntax; consult current Auth state |
| 401 | `INVALID_TOKEN` | false | Invalid signature/claims under available trusted keys |
| 401 | `TOKEN_EXPIRED` | false | Verified expiration; obtain credentials through Auth |
| 403 | `FORBIDDEN` | false | Verified anonymous identity excluded initially, or specific deleted-owner FK on profile write |
| 409 | `PROFILE_CONFLICT` | false | Preserve draft, refetch, deliberate reconciliation |
| 413 | `REQUEST_TOO_LARGE` | false | Body exceeds 16 KiB; reduce input |
| 422 | `VALIDATION_ERROR` | false | Safe field/code errors; fix input |
| 503 | `AUTH_UNAVAILABLE` | true | Required trust material/configured Auth service unavailable |
| 503 | `DEPENDENCY_UNAVAILABLE` | true | Required DB/service unavailable; identity may still be valid |
| 500 | `INTERNAL_ERROR` | false | Safe generic failure; use request ID for investigation |

`message` is safe human copy, not a client branching key or stable byte-for-byte
assertion. Clients branch on status/code; localized copy can replace it. General
errors omit `details`. Conflict details are required and exactly
`{"current_revision": integer >=0}`; zero means absent at the conflict read.
This snapshot can already be stale; never automatically resubmit against it.

Validation details are required:

```json
{"fields":[{"field":"display_name","code":"blank"}]}
```

Return at most ten entries. `field` is `body`, `expected_revision`, or `display_name`.
`code` is `required`, `invalid_type`, `blank`, `too_long`, `invalid_text`,
`out_of_range`, `extra_field`, or `invalid_json`. Map unknown keys to
`body/extra_field`, malformed/non-JSON to `body/invalid_json`, and revision-only
input to `display_name/required`. Never expose raw values, arbitrary submitted
key names, Pydantic `input`/`ctx`, SQL, exceptions, tokens, or stack traces.

Token expiration is classified only after signature/other trust checks; an
attacker-supplied expired payload is not proof of expiration. Classify genuine
trust outages separately from a provably invalid token. A deleted owner's profile
FK does not retroactively revoke an otherwise unexpired stateless JWT at `/v1/me`.

## Consumer recovery and schema authority

One auth-owned single-flight revalidation can lead to **one GET replay** for the
same account/generation. Never replay a mutation. If 401 persists, pause automatic
protected requests for that account/generation. Focus, reconnect, and routine token
rotation cannot resume the loop. An explicit user recovery attempt or actual
session replacement can. 403/409/422/503 are not generic sign-out triggers.

Offline transport, cancellation, non-JSON replies, and shape mismatch are client
failure categories; do not fabricate this server envelope for them. Validate
responses at the client boundary when RN-03 implements it; TypeScript alone does
not validate network data. Unknown future codes get a safe fallback, never success.

These examples are the initial design authority. API-05 makes Pydantic + exported
FastAPI OpenAPI the executable authority, committing
`openapi/foundation.openapi.json` and `src/http.generated.ts`. Generate types with
a pinned `openapi-typescript`; keep one runtime client. API schema tests must consume
these fixtures. Do not handwrite duplicate HTTP response types now. HealthResponse
remains the existing small implemented liveness type until that generation step.
