# Combined-app integration handoff — November 23, 2026

**Overall integration: partial; not ready to claim both-platform release acceptance.**
The normal Android emulator core journey passed. Signed physical iPhone C05 stays
owner-deferred. C06 records reproducible evidence without closing those gates.

Verified source: `6bf8b299e6970891c211fe019ff501dd2408f608` (`integration/shared-product`, C04). This handoff changes
only documentation. [Machine-readable checks](../integration_notes/artifacts/verify-c06-handoff.json).

## Final checks

- TypeScript, ESLint (four warnings/no errors), asset integrity and eight packaging guards passed.
- Portable tests: 663 passed; iOS/Android renderer components: 967 passed, two platform-conditional skips.
- API: Ruff, 682 deterministic tests, OpenAPI and generated-type drift checks passed.
- PostgreSQL17: all 287 database/migration/RLS tests passed on a separate guarded disposable
  cluster. Original manual-QA data digests matched before/after; API/database restored;
  no hosted database changed. Schema remains `20261114_0007`.
- UI specimen build and production web export passed. Neither proves native enforcement.
- iOS model/storage/transaction/clock/reward and simulator SDK-gate checks passed;
  seven built-product inspector tests passed. No monitor/shield was enabled on a phone.
- [Foundation CI](https://github.com/hooshapp/hoosh/actions/runs/45177285771): mobile,
  API and database jobs passed for the exact source above. This future documentation
  commit needs its own workflow after the owner pushes.

`npm run check` stopped at API lint because `uv` is missing from this shell's PATH.
The remaining exact commands passed via the existing `services/api/.venv` Python/Ruff
executables. No source guard or dependency was changed to obtain these results.

## Journey evidence and remaining work

| IDs | Available evidence | Remaining / owner |
|---|---|---|
| V01–V05 | [C02 SDK/auth regression](../integration_notes/artifacts/verify-c02-auth-isolation.json); C04 real A/B password logins | Anisha: exact packaged fresh email/recovery/provider success/cancel/restart and OS-storage cases; earlier browser tests do not certify these platform runs |
| V06–V08 | [C03 UI/PG persistence](../integration_notes/artifacts/verify-c03-persistence.json); C04 real profile/settings save/readback | Joint: full new-user/onboarding and both-platform device walkthrough not inferred from controlled tests |
| V09–V12 | [C04 normal picker/consent/Apply/expiry/weekly+two quests/scoped Stop](../integration_notes/artifacts/verify-c04-normal-android.json) | Android emulator passed within receipt limits; physical Android/iOS remain platform-owner checks |
| V13–V15 | C04 real reward sync/Feed, recommendation acceptance/cooldown/completion, coverage-qualified History; [fault tests](../integration_notes/artifacts/verify-c04-connected-checks.json) | Ishmum/platform owners: broader real response-loss/measurement duration and iOS producer; no fabricated baseline |
| V16–V17 | C04 real A→B(no install)→A; explicit claim; restored count2/session before deliberate count3 override | Emulator passed; iOS native account claim still needs physical verification |
| V18–V19 | Corrected standalone Android offline expiry/process kill/access revoke/regrant, prior boot evidence and embedded normal app | Physical OEM/LMK/force-stop/field reliability not accepted; exact limits remain in receipt |
| V20 | Existing compatibility tests and local installed upgrade observations | Joint: every actual shipped/internal source upgrade is not exhausted; do not assume downgrade safety |
| V21 | C04 normal/larger-text keyboard; earlier compact iOS simulator evidence | Physical keyboards/VoiceOver/TalkBack still pending |
| V22 | Explicitly deferred hosted deletion/cascade | Joint with owner approval; no accounts deleted by this handoff |
| V23 | Explicitly deferred additional TalkBack | Platform owner, physical pass later |
| V24 | Product/release scope stays open in plan | Product owners: unresolved demographics/lifespan/AI/calendar/shared-device features; store signing and field backend |

## Reproduce and resume

Use Node24/npm11. Configure ignored mobile public Supabase URL/publishable key and
API base URL per `apps/mobile/.env.example`; never ship database/service-role/Apple
private keys in Expo variables. Native Google/Apple require matching provider
configuration and `disconnect-dev` callback registration. Enter credentials privately.
The current Android APK uses an explicit local API8000 ADB reverse and local-debug
signing: it is not off-computer or Play Store distribution. Field builds need an
accessible HTTPS API and production provider/callback/signing configuration.

Run `npm run check`, `npm run mobile:ui:build`, `npm run mobile:export`; with the
supported isolated Docker fixture use `npm run api:db:up` then `npm run api:db:test`
and its guarded cleanup. Never run destructive DB suites against the manual-QA
cluster containing real test-account data. Native read-only/model checks do not
replace the [C05 physical sequence](../integration_plan/05_combined_app_verification.md#int-verify-c05--complete-signed-ios-packaged-journey).

No phone install, production deploy, main merge, account deletion, commit or push
was performed. The Android emulator remains available with the first QA account,
its synthetic selected target and weekly rule; default text/network restored. The
original API8000/database55432 services are running with QA data preserved.

## Rollback and compatibility

Android persistence reads versions1–4 and writes4; owner archives and budgets stay
private. Keep the corrected owner-aware read/claim behavior: reverting it restores
the empty-active-slot allowance-reset bug. iOS store reads1–4, upgrades on a successful
atomic write, and rejects newer formats; older readers may refuse newer records.
Do not clear native stores, reuse owners or silently resume rules during rollback.
Use a tested forward fix; no blanket binary downgrade guarantee is claimed.

Auth uses project-scoped SDK/SecureStore keys and tab-scoped web storage. Old unscoped
sessions require reauthentication; do not import Swift pilot identities or restore
retired tokens. API schema remains the single Alembic head0007; this handoff adds no
migration. Preserve API/schema backward compatibility and native state when preparing
any rollback. Exact accepted Android artifact hash and prior iOS packaging hashes
are in their receipts; current-source signed iOS acceptance is still required.

Minimum release eligibility: a build must include the C04 owner-restoration fix
(commit `6bf8b29`) and satisfy the selected platform's physical/provider/release gates.
This is an internal source baseline, not an announced minimum App Store version.
