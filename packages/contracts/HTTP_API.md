# Identity, profile and settings data contracts

**Status:** Adopted for M1/M2 on 2026-10-28 at Ishmum's direction. These endpoints
now have implemented `/healthz`, identity GET and profile GET/PATCH (API-01–09). Ishmum owns the
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
  alone or log a rejected body. Require a UTF-8 JSON object (application/json or
  application/*+json); duplicate keys, NaN/Infinity, non-JSON/invalid JSON and
  undecodable UTF-8 yield safe 422 body/invalid_json. Size/JSON checks precede Auth;
  typed field and identity validation precede database acquisition.
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

API routing errors also use safe `NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405),
and `HTTP_ERROR` for other framework HTTP failures, without raw framework details.
CORS preflight responses are browser protocol responses rather than endpoint JSON.

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

API-05 now publishes Pydantic + exported FastAPI OpenAPI as executable authority
for implemented `/healthz`, `/v1/me`, `GET/PATCH /v1/profile` and shared error schemas. Committed outputs
are `openapi/foundation.openapi.json` and `src/http.generated.ts`; regenerate/check
with root `api:generate` / `api:check-contracts`. The pinned build-only generator
produces types, not another HTTP client. Public `HealthResponse`, `MeResponse`, `ProfileView`, `ProfileResponse`,
`ProfilePatch`, `ProfileSavedResponse` and error aliases are derived from generated schemas; domain Auth/native ports remain
handwritten. Error codes discriminate required details and literal retryability in
both JSON Schema and TypeScript. API-08 validates profile success examples against the generated GET envelope.
API-09 now publishes strict PATCH input and a nonnullable ProfileSavedResponse:
its profile always exists on a successful save, whereas GET can return null.
Both operations use required nullable names and UTC Z timestamps. Backend M2
is accepted locally; real managed-user/mobile integration remains API-10 joint work.
The applied int32 revision storage never wraps: an exhausted revision returns
409 with that own current revision and needs a reviewed forward schema change,
not automatic replay. Larger positive expectations return ordinary own conflicts.

## Settings data contract — API-11; endpoints reserved for API-12

**2026-11-02:** Strict Python data models and the `user_settings` storage migration
exist. **GET/PATCH `/v1/settings` are not registered yet** and are not in the
published OpenAPI/TypeScript endpoint exports. The following is the adopted
storage/consumer handoff for API-12, not a claim that a settings HTTP call succeeds.
Synthetic cases live in [settings-v1.json](fixtures/settings-v1.json).

One resource belongs to the verified Auth UUID and has its **own** revision. It
is independent of the profile and of any installed native revision. It stores
activity preferences and draft intentions only; saving it does not activate
restrictions, allocate sessions, change quests/rewards, or complete onboarding.

### Resource and section shapes

Reserved GET returns `{"settings":null}` for an absent row. An existing/saved
resource has all of `user_id`, `revision`, `activities`, `plan_draft`, `created_at`
and `updated_at`. Revision is 1–2147483647; timestamps are server-owned UTC RFC3339
with `Z`. Saved-response `settings` is nonnullable. No owner is accepted in PATCH.

`activities` always has both fields:

```json
{"selected_activity_ids":["reading","gym"],"custom_text":"Read a chapter"}
```

| Stable ID | Existing UI label / legacy specimen ID |
|---|---|
| `gym` | Gym |
| `reading` | Reading |
| `arts_and_crafts` | Arts and crafts |
| `walking` | Walking |
| `music` | Music |
| `cooking` | Cooking |

These IDs map the existing preference editor/assets. They are not default selected
values or a recommendation ranking. Preserve selected order, allow empty selection,
reject duplicate/unknown/case-changed IDs; maximum six entries. Mobile maps label
IDs to these keys instead of sending a translated label as storage identity. Custom
selection maps to raw `custom_text`; deselected Custom maps to explicit null even
if its volatile input still contains text. No SDK/onboarding storage is rewritten
by adopting this mapping; Anisha consumes it during later integration.

Custom text is strict string or null. Reject NUL/unpaired surrogates, apply Python
3.12 `str.strip()` once, then require 1–200 Unicode code points. No NFC, case or JS
trim normalization. Blank text is an error, not a clear. Null clears. A custom
activity may exist without a predefined selection. These are storage bounds.

`plan_draft` is null or an object with all five fields:

```json
{
  "weekdays":[0,2,6],
  "hours":{"start_local":"22:30","end_local":null,"next_day":true},
  "timezone_id":"America/New_York",
  "session_count":2,
  "session_minutes":null
}
```

- Weekdays: strict integer list, Monday=0 through Sunday=6, maximum seven, no
  duplicates; canonical output sorts ascending. Empty is a valid draft.
- Hours: null or a strict object requiring `start_local`, `end_local`, `next_day`.
  Each time is null or an ASCII `HH:mm` 24-hour string; next_day is a strict boolean.
  Partially entered times are valid. When both times exist, next_day=false requires
  end>start and next_day=true requires end<start; equal times are rejected. This
  matches the existing editor's representation, not a 24-hour enforcement rule.
- Timezone: null or a known available IANA identifier/alias, 1–128 ASCII letters,
  digits, `_`, `+`, `/`, `-`. Preserve spelling; reject unknown/path/host-local
  keys. The locked `tzdata` package supplies names when system data is absent;
  `localtime`, `posixrules` and posix/right trees are not accepted. No automatic
  travel conversion, timezone default, DST execution or reset behavior is defined.
- Session count: null or strict integer 1–1000. Session minutes: null or strict
  integer 1–1440. They are independent nullable inputs with engineering storage
  ceilings, not approved allowances, per-app/global scope or a consumption rule.
- Incomplete drafts are valid. No field is populated from Figma example values.
  Nested section fields remain explicit/required even when their values are null.
  Reject unknown fields such as `active`, `installed_revision`, app inventories,
  selection tokens, credits and onboarding-completion state.

### Reserved write and conflict semantics

PATCH requires a strict object with `expected_revision` (integer 0–2147483646,
no boolean/float/string coercion) and at least one of activities/plan_draft:

```json
{"expected_revision":0,"activities":{"selected_activity_ids":[],"custom_text":null}}
```

| Input | Meaning |
|---|---|
| Section omitted | Preserve the current section; never infer clear from a default Python None |
| `activities:null` | Reset to `{"selected_activity_ids":[],"custom_text":null}` |
| `plan_draft:null` | Remove the draft (SQL NULL), retaining the settings row |
| Section object | Replace that complete section; no recursive arbitrary JSON merge |
| Both omitted | Reject as required-section validation failure |

Use `model_fields_set` / `exclude_unset=True`; `exclude_none=True` would erase
clear intent. On explicit first create, omitted sections use empty activities/null
draft. GET never inserts. Revision 0 creates only when absent; a positive expected
revision updates only an existing match. Each accepted write, including an equal
value, increments once. The upper expected-revision bound leaves room for that
increment. Preserve omitted sections atomically in the same CAS, not a read/merge
race. Share the settings revision between activity and schedule editors so stale
cross-section edits receive a conflict rather than silently overriding data.

API-12 must enforce the existing 16 KiB raw JSON-body bound, strict JSON/media-type
rules and private transport protections. Planned errors reuse safe 401/403/413/
422/503 handling; 409 adds **SETTINGS_CONFLICT** with own `current_revision` (0 when
absent), retryable=false. A deleted Auth owner cannot be recreated by a settings
write. No automatic write replay after conflict, timeout or possible commit.

Before exposing routes, API-12 must extend the backend envelope and mobile decoder
whitelists together. Validation details use only fixed fields: `body`,
`expected_revision`, `activities`, `activities.selected_activity_ids`,
`activities.custom_text`, `plan_draft`, `plan_draft.weekdays`, `plan_draft.hours`,
`plan_draft.hours.start_local`, `plan_draft.hours.end_local`,
`plan_draft.hours.next_day`, `plan_draft.timezone_id`, `plan_draft.session_count`,
`plan_draft.session_minutes`. Collapse list indices/unknown keys to these paths;
never echo input/key names. In addition to existing issue codes, settings needs
`duplicate`, `invalid_choice`, `invalid_time`, `invalid_range`, `invalid_timezone`.
Those HTTP error changes are reserved for API-12, not silently added to current
profile responses or generated types by API-11.

### Storage boundary

One `public.user_settings` table holds the owner UUID, nonnull activities JSONB,
nullable plan_draft JSONB, integer revision and timestamps. The owner FK points
directly to managed Auth, not to profiles; either resource may exist independently.
Canonical empty activities is a DB default; clearing a draft is SQL NULL, not a
JSON scalar null. RLS/default deny, owner checks, explicit runtime SELECT/INSERT/
UPDATE only, no public/Data API grants, and server timestamp triggers mirror the
existing product boundary. No native/app/session/reward table is introduced.

Database constraints check exact keys, JSON types, bounded/unique selected IDs and
weekdays, canonical custom text, entered clock relationships, timezone shape and
numeric ceilings. Python additionally validates actual timezone catalog membership
and canonicalizes weekday order. JSONB preserves semantic numbers, not the original
JSON number spelling; strict integer token validation belongs to Python before
storage. The unchanged profile history precedes revision `20261102_0002`. Local
migration/security/cascade evidence is separate from a managed Auth deletion test;
no hosted upgrade or account operation is implied by this contract commit.
