# Android Home and Settings weekly-plan journey

Date: 2026-11-11. Owner: Ishmum. Existing Plan 04 refs: RN08-D02/D04,
RN09D-D02 and RN-09 Home/Settings presentation. This extends those parts; it
creates no new parent plan and does not complete their joint acceptance gates.

## Behavior and boundaries

The development host's **App journey** renders the existing shared Home and
Settings screens, their days/hours/sessions inline editors and native Apps editor.
The caller supplies an owner and a real native port. The development entry alone
binds a labeled synthetic owner; production Auth/root routes are unchanged.

1. Open Settings → Distracting Apps → Choose apps. Native confirmation stages the
   selection; **Save selected apps** persists it locally. It does not install rules.
2. Set Draft days, Draft hours (including a valid named time zone) and Draft
   sessions. **Use days/hours/sessions** stages fields in this journey's draft.
   These actions neither save to the API nor change the native schedule.
3. **Preview plan** calculates upcoming native occurrences without installing.
4. **Apply plan**, **Apply plan changes** or **Resume plan** explicitly installs the
   whole complete draft with revision comparison and native readback. An ambiguous
   response requires Refresh and review; it is never replayed automatically.
5. Home distinguishes no plan, scheduled, active, stopped, permission needed,
   failed, unavailable and unconfirmed states. Only a confirmed native observation
   can support an active claim. Account, rewards, usage and other unavailable
   outcomes stay unavailable in this account-independent entry.
6. **Stop plan** disables the weekly plan while retaining settings/allowance
   history. Closing the preview never cancels a native plan; stop it explicitly.

One controller survives Home/Settings navigation. Staged drafts survive tab changes;
uncommitted inline edits require Keep/Discard. Closing with unapplied input asks
before discarding it. Background reads preserve raw editor input. Owner replacement
fences old callbacks and writes. This does not implement Auth/account switching.

Native `scheduleRead` now returns `observedAt` and window/status counts calculated
from the same record, native time and authorization observation. Old debug APKs must
be rebuilt. Shared decoding rejects missing/invalid times and incoherent counts.
Home uses this native observation, never JavaScript wall time or an API/draft save.
Visible foreground reads refresh at upcoming boundaries and at most 15 seconds
otherwise. Quiet polls retain confirmed presentation; foreground/boundary/failure
checks mask stale state. JavaScript polling does not execute restrictions.

## Running it

Use the native debug APK and build/test procedure in the
[weekly schedule runbook](android-weekly-schedule.md), then run the existing native
host with Metro (`cd apps/mobile/dev/native && npx expo start --dev-client`). Open
**App journey**, rather than the source samples or standalone Weekly schedule page.
Expo Go cannot run these custom Android methods. Review the existing in-app
intervention disclosure before enabling the exact debug accessibility service.
This new entry adds no permissions or native methods.

For controlled acceptance use only the owned test target, never personal apps or
accounts. Record the build/source version, initial test-service state, known
synthetic-owner files and task-created connections before changing them. Native
accessibility must not be combined with UIAutomation hierarchy dumps; use guarded
owned-window observations and owner-assisted speech checks instead. Never capture
locked/foreign windows or publish inventories, identities or raw device captures.

## Checks and evidence

- `npm run check`: 434 portable, 634 component (+2 existing skips), 601 API;
  types/lint/assets/Ruff/OpenAPI contract checks pass. Existing lint warnings remain.
- New pure status tests: 10. New shared journey component results: 18 across both
  platform presets. They cover full staging/apply/stop, missing module, dirty
  navigation, owner disposal, permission/foreground uncertainty, coalesced reads,
  native time boundaries and committed lost-response recovery without replay.
- JVM native checks: 68. Actual owned API-36 emulator instrumentation: 139.
  Native debug/test and release Kotlin/manifest build checks pass.
- Exact interactive observations, final source/APK hashes and restoration are in
  [sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09-app-journey/evidence.json)
  and the final [Plan 04 entry](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

## Cleanup and remaining gates

Stop/erase only the controlled synthetic installation, disable the test service,
restore only baseline known synthetic selection/coordinator/disclosure files, and
remove task-owned captures/cache/reverse/Metro processes. Do not clear app data,
uninstall arbitrary packages or reset accounts. Stop only the owned emulator.

The 2026-11-11 physical continuation on Pixel 8 Pro / Android 16 / API 36 passed
selection, inline fields/Preview/Apply, automatic Home start transition, actual
pause, Stop/Resume, a one-minute allowance, Update retaining daily count and the
stopped state after journey remount. See the separate
[phone record](../core_plan_implementation_notes/artifacts/rn-09-app-journey-phone/evidence.json).
The prior evidence's locked-phone limit is historical; it is not silently rewritten.
Fresh baseline was restored and test service/owned Metro stopped. No new spoken
TalkBack matrix was run. Production verified owner/root routing, Auth/tokens, iOS,
signed/store compliance, broader device/lifecycle acceptance, quest/reward/usage
producers and policy-zone migration remain separate.
