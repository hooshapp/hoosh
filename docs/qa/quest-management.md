# Saved quest management acceptance — RN09B-D01

Date: 2026-11-11. Owner: Ishmum. Contract:
[quest definitions](../architecture/quest-definition-management.md).

## What is implemented

Create, list, reload, edit and delete saved quest definitions with a strict API,
forced owner isolation and atomic revision checks. Accepted cards appear above
suggestions and say **Saved · not active**. The original editor is reused, with an
explicit time zone and confirmed content deletion. A save neither activates a
native quest nor awards credits; no AI suggestions or occurrence dates are invented.

Production routes connect only inside the existing AccountDataProvider. That is a
prepared consumer, not completed Auth/root integration. Without that provider the
normal app retains the unavailable preview. Invalid IDs never fetch fixtures.

The existing private profile QA host exposes **Open live Quests**. If an approved
operator account/token is later available, use its existing connection flow and
navigate list → custom editor → Save → edit → Delete. Its **Lose next save response**
control now applies to PUT/DELETE too. Do not provide tokens in chat or source. No
fresh managed-token or Auth SDK test was performed for this task.

## Reproducible independent checks

From repository root:

```bash
npm run check
npm run mobile:export
npm run mobile:ui:build
npm run api:db:up
npm run api:db:test
npm run api:db:down
```

The disposable target validates exact loopback/55432/database/roles and its marker
before migrations or cleanup. No runtime/hosted URI fallback. The database driver
`services/api/tests/db/test_mobile_quests_acceptance.py` runs five write-phase and
one cold restart mobile cases over actual TCP/FastAPI/PostgreSQL. It uses ephemeral
locally signed test credentials with the normal verifier and public-JWKS fixture,
never the Auth SDK or managed accounts. It stops both owned API processes and
removes temporary JSON reports. Raw child output/secrets are withheld.

The portable client verifies canonical text/time/repeat/day/zone shape, own ID,
revision and UTC timestamps. Saved/deletion responses must confirm exact intent.
Reads/list cursors are bounded/progressive. Mutations never automatically retry.

Component cases run both platform presets and cover create/edit, dirty/background
reads, conflict review, a committed lost response, confirmed/idempotent deletion,
uncertain-delete Back protection, offline drafts, generation replacement and
list/empty/pagination. Mocks establish shared behavior; they do not prove real OS
focus, TalkBack, iOS execution or managed Auth.

## Actual evidence

- Full root: 457 portable, 652 component (+2 existing skips; 78 suites), 628 API;
  types/lint/assets/Ruff/contracts pass. Eleven existing ESLint warnings remain.
- Scoped quest boundary: 23 portable; 54 quest presentation/editor/management
  component results, including 18 new management results.
- Real PostgreSQL: 217 passed, including the HTTP driver; final selected driver
  rerun at committed implementation passed (five write + one restart mobile cases).
- Schema test 25 passed after final service description update. Final scoped
  types/lint/management checks and production export pass after availability feedback.
- Export isolation: 38 JS/HTML files, 71 original SVGs. UI specimen build passes
  with the installed Expo UUID module's vendor direct-eval warning.
- Pinned hosted development upgrade: 0002 → `20261111_0003`; security verification
  and autogenerate drift check pass. Existing profile/settings count/content digests
  matched before/after in one guarded transaction; new quest table remains empty.
  No managed Auth DDL/users/provider/credential changes or hosted user CRUD.

See [sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09b-quest-management/evidence.json)
and [implementation notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md)
for exact hashes, commands, failures/corrections, restoration and per-file ranges.

## Recovery and remaining gates

A conflict or uncertain write preserves the raw draft and disables another save.
**Check latest quest** reads; compare full stored values, then explicitly Keep my
edits or Use latest. Keeping does not save. Deleted IDs retain content-free revision
markers and cannot be recreated by an old request; start a fresh entry. Navigation
confirms losing unfinished/uncertain changes; successful deletion exits safely.

Production Auth/root, real managed-account settings/quest acceptance, activation/
occurrence completion/rewards, AI recommendations, signed-device/focus/TalkBack/
iOS and broader native acceptance remain separate under RN09B-D02/D03/D04. No
phone settings were changed in this task; earlier Android intervention evidence
is not a new quest-device result. Task-created local PostgreSQL container/network
are stopped with the labeled volume retained. No push, main merge or deployment.
