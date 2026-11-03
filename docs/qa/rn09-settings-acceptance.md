# RN-09l settings acceptance — 2026-11-03

The local automated settings acceptance slice passes. This does **not** complete
Plan 04, RN-09k native status, hosted Auth or signed-device acceptance. Ishmum owns
this verification; Anisha retains Auth/onboarding/root and native iOS ownership.
See the [Plan 04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md)
for the commit, exact files and checks, and the [sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09l/verification.json).

## What actually ran

- `npm run api:db:up` starts only the guarded PostgreSQL fixture. `npm run api:db:test`
  passes **192** database checks, including the new mobile HTTP acceptance test.
- The new Python test starts the existing FastAPI subprocess fixture with normal
  JWT verification and ephemeral public JWKS, then invokes the production portable
  TypeScript API client, settings decoder, scope/controller and activity/plan/summary
  projections against real loopback TCP. Seven mobile scenarios run before restart;
  a fresh process/client runs one recovery scenario afterward. No response JSON is
  mocked in this test. The test-only signing key stays in Python memory; JWTs reach
  the child only through its private environment, not arguments/files/logs. Captured
  child output is withheld; disposable JSON assertion reports are deleted.
- Real PostgreSQL migrations/RLS/runtime roles and random disposable fixture users
  are used. Independent SQL reads verify the exact persisted revisions, partial data,
  no row for the third user, no post-restart mutation and unchanged profile rows.
  Existing scoped fixture cleanup removes only these random local users/rows.
- Real Router component tests use the actual Home/detail routes, Stack, provider,
  editor state and removal guard, with synthetic API/Auth ports. Ten Android/iOS
  preset checks exercise dirty keep/discard, local Back, saved Back and unconfirmed
  navigation. They do **not** run the Auth SDK or physical Android Back gesture.
- `npm run check` passes **352** portable mobile, **488** component and **590**
  deterministic API tests, plus workspace types/lint/contracts/assets. Ordinary
  checks deliberately exclude the database group; run both commands.
- `npm run mobile:export` passes **38** exported JS/HTML isolation checks and **71**
  original SVG checks. The new acceptance-only marker is forbidden in app exports.

## Acceptance matrix

| Scenario | Actual evidence | Status / remaining boundary |
|---|---|---|
| Missing GET versus outage, explicit empty activities | Real mobile HTTP create/read and existing UI error tests | Pass locally; no GET creates defaults |
| Nullable/partial hours, timezone alias, sessions and canonical Unicode | Real mobile request/decoder + PostgreSQL readback | Pass locally; no timezone/default enforcement inference |
| Nested field validation and retained raw drafts | Real server 422 parsed by mobile, plus editor tests | Pass locally |
| Concurrent activity and draft edits | Actual overlapping HTTP PATCH requests yield one 200/one 409; deliberate latest-base retry; actual UI multi-editor tests | Pass locally; no automatic rebase/replay |
| Whole-draft null and empty activities preserve omitted sections | Actual mobile PATCH/read + SQL, existing UI controls | Pass locally |
| Committed save loses response | Test transport awaits actual response, drops it; client marks uncertain; explicit GET finds one increment | Pass locally; UI still requires review |
| A/B isolation and same-user generation replacement | Separate signed identities, scoped held actual HTTP response and callback/cache fences; existing UI tests | Pass locally; Auth SDK lifecycle still joint acceptance |
| Offline edits/reconnect | Real scope prevents dispatch; existing controlled editor/Home tests preserve dirty input and never replay writes | Pass locally; actual phone network lifecycle pending |
| API restart and cold reload | Kill first task-owned FastAPI process; new PID and new mobile client recover same DB data; B isolated/C absent/profile unchanged | Pass locally; no hosted deployment involved |
| Dirty navigation | Actual Router removal/confirmation and real routes on both Jest platform presets | Pass locally; hardware Back, gestures and speech need device evidence |
| Native module absent | Existing Home/protection tests retain unavailable status despite successful saves | Pass for absence; RN-08d later verifies independent Android permission revocation; installation remains unimplemented |
| Hosted settings migration/managed accounts | Not run; development migration 0002 remains coordinated separately | Pending |
| Real Auth/root and authenticated Android journey | User previously deferred token refresh/phone acceptance | Pending; do not treat operator-token or ephemeral-JWT fixture as M1/M2 completion |
| Native grant/deny/revoke; signed release/iOS/speech | RN-09l itself performed no native operation; later RN-08d independently verifies actual Android permission/status on Pixel | Read-only Android matrix passes separately; combined authenticated settings phone journey, enforcement, signed release/iOS/speech pending; Anisha owns iOS |
| Dedicated disposable-C hosted deletion | Previously deferred by user; unrelated to local fixture cleanup | Pending under coordinated API-10 acceptance |

## Reproduce and resume

Install the pinned Node/npm and Python/uv dependencies with `npm ci` and
`uv sync --project services/api --frozen`. With Docker running:

```bash
npm run api:db:up
npm run api:db:test
npm run check
npm run mobile:export
npm run api:db:down
```

The database command now requires Node and installed mobile workspaces. CI's
existing required database job installs these before running the same group.
To focus only the cross-boundary case:

```bash
uv run --project services/api pytest services/api/tests/db/test_mobile_settings_acceptance.py -o addopts= -m database -q
```

Do not invoke the acceptance Vitest file directly with live credentials. It requires
an explicit loopback-only fixture from the guarded Python test; it reads neither
`services/api/.env` nor `.local/live-acceptance.env`. The ordinary mobile test suite
excludes this separately selected acceptance filename/config. The local database
helper rejects managed/unsafe URLs before connecting or cleaning up.

No hosted project, Supabase account or phone was touched. This run started/stopped
only the named disposable Compose stack and retained its volume; no global Docker
cleanup or production migration occurred during RN-09l. Later RN-08a–d implements
and verifies the independent Android read/permission slice; see the
[device matrix](android-capability-probe.md). Resume
hosted/Auth/phone acceptance only with the required coordinated setup and approved
current test accounts. Keep all real credentials local and out of the notes.
