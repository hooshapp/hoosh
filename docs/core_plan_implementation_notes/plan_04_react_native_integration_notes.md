# Plan 04 — React Native Integration Implementation Notes

**Plan:** [04_react_native_integration.md](../core_plan/04_react_native_integration.md)

**Owner:** Ishmum. Anisha owns Auth/onboarding and iOS; these shared primitives are ready for her consumers.

**Current part:** RN-08 Android debug-native intervention/session/owner-event coordinator implemented; actual service/device acceptance and production integration remain open. Read the latest entry and runbook; Auth/tokens and iOS stay deferred.

**Implementation branch:** `task/react-native/rn-08-android-interventions`; parent `56e7ba4`; local commit only, no push/main merge or iOS/Auth change.

**Commit reference:** RN-01 `2f88102`; RN-02 `2d5c0d1`; RN-03 `0741758`; RN-04 `610f570`; RN-05 preparation `0c6e4db`; RN-07 UI `5790302`; RN-08 preparation `71da2d5`; RN-09a `ff75039`. RN-10 is `9b5fbd0`.

**Last updated:** 2026-11-10.

**Shared workflow:** [Implementation knowledge base](README.md).

## Resume here

- **RN-08 native coordinator (2026-11-10):** branch `task/react-native/rn-08-android-interventions`, parent `56e7ba4`. Ishmum authorized provisional defaults recorded in PM questions/decision record. Debug-native revisioned finite-window installation, per-app elapsed/day accounting, overlap, lifetime fences, native disclosure/overlay and owner-local journal/erasure implemented. JVM 40 passes, full/shared/build/export checks recorded in final entry. New 46-case Android runner and actual service/device acceptance remain pending because ADB disconnected; no new phone changes. Production Auth-bound adapter, iOS, recurrence/reward producers and signed/store acceptance stay open. Read [runbook](../qa/android-interventions.md) and [evidence](artifacts/rn-08-interventions/evidence.json); IDs/counts unchanged. Own hash Pending until next normal update.

- **Physical acceptance continuation (2026-11-10):** actual picker lock/unlock cancellation and unchanged saved count pass on Pixel/API 36, without process restart. Confirmation focus remains unverified after interruption; TalkBack, speech-caption preference, power/usage/font/reverse and owned process/files restored. No runtime/Auth/iOS change. Read the final entry and [follow-up evidence](artifacts/rn-09f-device-followup/evidence.json); previous implementation is `082b1b9`. Resume confirmation focus only with the unlocked device/owner available.

- **Selection lifecycle/accessibility (2026-11-10):** branch `task/react-native/rn-09f-selection-lifecycle`, parent `751633b`. Controlled-owner retain/erase/failure recovery and generation fences, native lock/catalog/issued-write races and picker focus handling implemented. Full checks 382/590 (+2 Android-only-event iOS skips)/601; actual native cases 17 plus 22/12/10 regressions. Serial A/B device flows and bounded owner/caption TalkBack observations pass; post-confirmation focus is explicitly pending. User disabled TalkBack during interruption; leave it off. Read the final entry, [runbook](../qa/android-durable-selection.md) and [evidence](artifacts/rn-09f-lifecycle/evidence.json) for final cleanup/lock checkpoint and remaining production/device gates. No Auth/tokens/iOS or production capability change; full parents and 46/21/25 remain open. Local commit only, own hash Pending.

- **RN08-D03 / RN-09f durable local selection (2026-11-09):** debug native owner/global-group draft/Save transaction and existing AppsEditor consumer in Saved apps editor QA. Native picker confirmation stages; editor Save performs bounded atomic revision CAS and readback. Cancel/Discard/release do not erase saved state; restart reloads it. Final native tests, phone flows, large-text header correction and cleanup are recorded in the final entry and [runbook](../qa/android-durable-selection.md). No default production owner, Router/Auth binding, installed rule or capability/iOS change. Next production owner-generation/account lifecycle and active-occurrence contract before enabling real selection; user tokens/Auth still deferred. Existing IDs/counts unchanged. Parent PM documentation is `e9e2d90`; durable implementation is `751633b` (recorded during lifecycle follow-up).

- **PM reconciliation (2026-11-09):** [ADR](../architecture/pm-decisions-2026-11-09.md) records the supplied Q02–Q22 responses; Q09 explicitly settles global selection for quests, so older global/per-quest follow-ups below are historical. Next durable native owner/group/revision and stage/commit/discard semantics, then existing RN-09f Apps editor wiring. No runtime capability, storage, enforcement, account/Auth/iOS change in this documentation follow-up; full parents/counts stay open. Tokens/Auth user-deferred. [Plan 00 notes](plan_00_shared_contracts_notes.md) contain this commit's complete file/line ledger and verification; previous preview commit is `90cdc44`.

- **RN08-D03 volatile native picker implemented (2026-11-09):** branch `task/react-native/rn-08-selection-preview`, parent `6e36788`; debug-native chooser and isolated QA page return only count/revision, with native search/checked draft/confirm/cancel and ephemeral owner/lifecycle cleanup. Final Pixel/API 36 APKs pass 14 normal-font and six font-2.0 UI observations, 12 session/10 discovery native cases; pure JVM 12 and full checks 382/538/601 pass, production exports/release isolation pass. Three observed layout defects were corrected before final runs. Current-run phone settings/usage/reverse restored, own Metro/XML removed, app data retained. Next durable owner/group/stage/commit/discard contract before real Apps integration; no account save/Auth/root/capability/enforcement/iOS changes. Complete spoken TalkBack, race/profile/other-device/signed release gates stay open; tokens/Auth user-deferred. Read [runbook](../qa/android-selection-preview.md), [sanitized results](artifacts/rn-08-selection/preview.json) and final entry; older next-action bullets below are historical. Local commit only; own hash Pending until next normal update.

- **RN08-D03 discovery probe implemented (2026-11-09):** branch `task/react-native/rn-08-selection-probe`, parent `9fda458`; test-APK-only collector/checks and debug-only launcher query with reproducible no-query control. Both APK variants compile; release manifest excludes query and app APK excludes probe definitions. Pixel/API 36 target-UID runs with usage denied return 53 baseline / 183 query unique candidates; baseline resources 53, query capped 64, no resolution failures. Ten synthetic checks pass in each of three final accepted runs, original-mode query and legacy usage regression pass. Final APK hashes were reinstalled/retested; usage mode allow restored, font/stay-awake/reverse unchanged, no data clear. Existing production selection/protection remain unavailable/unsupported. Next volatile native QA picker in existing module after intentionally extracting the validated candidate logic, preserving identity privacy/cancel/lifecycle boundaries; persistent owner/group/commit semantics remain separate. Tokens/Auth user-deferred, iOS Anisha-owned; no shared port/root/backend change or new parent count. See [runbook](../qa/android-selection-discovery-probe.md) and final entry; older next-action bullets below are historical.

- **RN08-D03 / RN-09f selection investigation (2026-11-07):** branch `task/react-native/rn-08-selection-investigation`, parent `f2fae39`; API/source/existing-APK research complete, no picker/runtime/manifest/shared-port change. Recommend targeted current-profile MAIN/LAUNCHER discovery and a native-owned multi-select returning the existing summary. No broad package permission/library, inventory upload or guessed persistent account/global group. Zero authorized Android devices at inspection; actual app-UID coverage/resources remain untested. Next debug-only aggregate discovery probe, then volatile native QA picker. Production commit/cancel/owner semantics remain explicit prerequisites. Tokens/Auth integration stay user-deferred. Read [investigation](../qa/android-app-selection-investigation.md) and final entry; stable IDs/counts and all prior gates preserved. Previous documentation `f2fae39` passed Foundation run 42420770085, as verified in the preceding publication task.

- **RN-10d publication verified (2026-11-07):** pushed implementation `0f7f74e` on `task/react-native/rn-10-android-acceptance`; Foundation run 42420522051 passed all mobile/API/database jobs and their steps. See final publication entry and artifact. This follow-up documentation receives its own subsequent run, checked before reporting completion. No main merge/deployment or change to Auth/account/iOS/release gates; previous local-only status is historical.

- **RN-10d Android follow-up (2026-11-07):** branch `task/react-native/rn-10-android-acceptance`, parent `e55e314`; commit by subject `fix(mobile): improve Android focus and record RN-10 device checks`. Two actual-device defects fixed: focused content beneath the floating bar, and TalkBack return after native dismissal. Pixel debug host checked at font 1.15/2.0, actual tabs/details/IME/dirty navigation, selected speech, bounded sample states and local lifecycle. Full checks 382 portable / 518 component / 601 API; final focused 64/64; web 38/71, Android Hermes and UI gallery build pass. Settings/connections restored to this run's baseline; usage access allow preserved. Full manual/async speech, physical keyboard/exhaustive motion-state matrix, additional devices/release, Auth/root/current-account and Anisha's iOS remain open. Next joint RN-06/07/09l/10/11 when Auth/root and fresh approved tokens exist; tokens/C deletion stay user-deferred. Read the final entry and RN-10d device record; original 46/21/25 counts remain.

- **Plan 03 hosted handoff (2026-11-07):** development settings migration 0002 is applied/security-verified, profiles preserved, settings empty. The hosted schema prerequisite for RN-09i/j/l is satisfied; existing HTTP/generated contracts are unchanged. Current A/B tokens are expired and user explicitly leaves real-account checks pending. Joint Auth/root/profile/settings phone and signed/native/C-deletion acceptance remain open. Backend follow-up, exact file changes and 601 API/199 DB evidence are recorded in the latest Plan 03 entry; no Plan 04 implementation is claimed by this documentation handoff. Earlier resume entries are historical.

- **RN-08a–d Android read/permission scope implemented (2026-11-03):** a `6117b96`, b `6734a26`, c `d1aa6ee`, d `cadc91d`. Actual Pixel Android 16 Home Settings grant/deny/foreground/revoke/cold, native keyguard/empty/null and Expo Go absence/font-2.0 checks pass. Native final reads work with Metro/API absent; user settings and task connections restored. Full checks 382 portable / 502 component / 590 API, web 38/71, native builds/Hermes. RN-09k's Android read-only producer and l's independent native-revoke evidence now exist. Next joint Auth/root + hosted migration 0002 + authenticated settings/profile phone acceptance; enforcement/product policies, iOS/signing/speech and user-deferred hosted-C deletion stay open. See the final a–d entries/runbook; earlier resume bullets below are historical.

- **RN-09l local acceptance implemented (2026-11-03):** production mobile HTTP client/scope/settings projections pass eight actual TCP/FastAPI/PostgreSQL scenarios, including true API process restart and cold mobile reload. Real Router tests cover dirty navigation and uncertain saves. Checks: 352 portable / 488 component / 590 API / 192 DB, web isolation/assets. CI's required DB job now installs mobile/Node prerequisites. Next RN-08a; hosted migration, Auth/root, authenticated phone, k native status/native revocation, iOS/signing/speech and deferred hosted C deletion remain open. Task-owned disposable DB stopped, volume kept. Read the latest RN-09l entry and QA matrix.


- **RN-09k preferences implemented (2026-11-03):** Home/Settings share one settings query/projection and canonical activity/nullable draft labels. Home edit navigation reuses the existing detail routes; offline/errors/unavailable credentials mask private summaries. Pending/dirty/uncertain writes do not optimistically update Home. Full checks pass: 352 portable / 478 component / 590 API; web isolation/assets and Android QA Hermes compile. Native status stays unavailable until RN-08c, so k native acceptance and full parent RN-09 stay open. Next RN-09l independent checks or RN-08a; hosted/Auth/root/phone and C-deletion deferrals remain. Read the latest RN-09k entry.

- **RN-09j implemented:** days/hours/sessions persist nullable partial drafts, explicit clears and raw timezone through the same account settings query/revision as activities. Shared save/review machinery is extracted from RN-09i; views preserve other fields after explicit conflict review. Live labels say draft/not active; no enforcement or allowance policy is defined. Full checks: 342 portable / 448 component / 590 API, web isolation/assets and Android QA Hermes. Next RN-09k; native availability awaits RN-08c, and hosted/Auth/phone/C-deletion gates remain open. Read the latest RN-09j entry.


- **RN-09i implemented:** runtime settings decoding, one shared scoped settings query, revisioned activity edits/review and provider-gated route/summary wiring. Checks pass: 325 portable / 416 component / 590 API, web isolation/assets and Android QA Hermes export. Next RN-09j using the same query/revision. No hosted upgrade, real Auth/root, authenticated phone, native activation or product rules. Read the latest RN-09i entry.
- **API-12 handoff (2026-11-02):** The protected settings endpoints, generated DTOs and safe client errors now exist. Next is RN-09i activity preferences, then RN-09j non-enforcing draft editors; RN-08a remains independent. Backend scope is locally accepted with 590 deterministic/191 PostgreSQL and true HTTP process restart/race evidence; no hosted upgrade/managed or authenticated-device claim. Existing Auth/iOS/product and phone/C-deletion gates remain. Counts: 46 parts / 21 producers implemented / 25 pending. See Plan 03's API-12 notes; no frontend feature query/form was added by this backend commit.
- **API-11 handoff (2026-11-02):** Settings data contract/models and local migration now exist; see Plan 03's API-11 notes for exact changes/tests. Settings HTTP endpoints/generated types remain API-12, so RN-09i/j are not started yet. Next backend step is API-12; RN-08a remains independent. Current totals are 46 top-level parts / 20 implemented producers / 26 pending. This changes no frontend/Auth/native behavior or previous phone/deletion deferrals; earlier planning checkpoints below remain historical.
- **Planning update (2026-11-02):** Branch `task/plans/rn-08-09-expansion` adds planned RN-08a–d and RN-09i–l inside the existing parts; no implementation started. API-11/12 in Plan 03 are their settings dependencies. Next: API-11 independently or RN-08a with build/device access. Anisha's Auth/onboarding/iOS and unanswered product behavior remain out of scope. Read the latest planning entry at the end; full RN-08/09 acceptance is still open. Current totals are 46 top-level parts / 19 implemented producers / 27 pending.
- Latest RN-07 wiring: branch `task/react-native/rn-07-profile-wiring`, parent `f201d0c`, subject `feat(mobile): wire revisioned profile editing through account scopes`. Consumer/Settings/API decoder tests pass; full acceptance remains open. Read the latest entry at the end of this file before resuming; the RN-10c bullets below describe earlier physical UI evidence.
- Historical RN-07 checks: `npm run check` passed 273 portable / 384 component / 473 API tests, types, lint, assets and contract checks; `npm run api:db:up` then `npm run api:db:test` passes 104 PostgreSQL checks. `npm run mobile:export` passes 38-file QA isolation and 71 original assets. Native profile QA compiled/loaded on Pixel 8 Pro / Android 16, but credentials expired before a profile round trip. User deferred authenticated phone testing and hosted C deletion. No managed profile or Auth mutation occurred; no release/signed/iOS/screen-reader acceptance is claimed.
- Latest: **RN-10c Physical Android UI QA and rendering fixes**, subject `fix(mobile): polish weekday reflow and native tab backgrounds`. Review actual RN-10c phone evidence and continue live backend/Auth/native prerequisites independently. TalkBack/VoiceOver speech/traversal, iOS, other devices, signed standalone builds and full lifecycle/state acceptance remain open; see Plan 04 D01–D06. Both observed UI failures are fixed and physically retested. User settings restored; QA Home Ready left available. No push/merge requested.
- Actual validation: `npm run check` passed TypeScript/ESLint, 250 portable tests, 362 iOS/Android component tests, asset integrity, Ruff and 3 API tests after both fixes. `mobile:export` passed 38-file isolation and 71 original assets. Final iOS/Android Hermes exact-source checks include both changed shared components and exclude project-local dev/test/private API consumers. Physical Pixel 8 Pro / Android 16 / Expo Go 58.0.5: 19 QA pages at font 1.15, 11 representative pages at 2.0, actual four Router tabs at both scales, typed drafts/IME/header and hardware Back/discard, weekday two-row/selection retest, rounded tab native pixel audit, hours drag, session increment and six Home scenarios. Capture audit passed 44 inspected phone crops. Font 1.15, stay-awake 0 and screen timeout 30000 confirmed at handoff. This does not complete TalkBack/iOS/standalone/live/native-policy acceptance.
- UI-only local drafts are not accepted wire/policy schemas or saved outcomes. Existing RN07/08/09/10/Auth/API/native and signed-device gates remain open. Anisha owns Auth/onboarding/iOS; Ishmum shared UI/Android/backend. No cloud/native state was changed.
- User icon packs and workspace file remain untracked/excluded. Continue the same notes file and original plan ledger for each sequential UI part.

## Recording rules

1. Keep one implementation-notes file per plan in this folder. Continue appending to this file when later Plan 04 parts begin; do not create a separate file for each part or chat.
2. Give every implementation commit its own heading identifying the plan part, purpose, and actual commit hash when available. Use `Pending` before a commit exists; never invent a hash or claim an uncommitted change was committed. If the actual hash is recorded in a later documentation commit, identify the implementation commit explicitly.
3. Account for every changed file and every logical change, including tests, dependency manifests, lockfiles, configuration, generated files, and documentation. Use multiple entries for distinct changes in the same file.
4. Record repository-relative file paths and exact line ranges from the referenced commit, followed by a brief description of what changed and why it helps. Historical ranges refer to that commit, not necessarily the latest checkout; preserve the explanation when later edits move code.
5. Explain meaningful decisions, edge cases, contract relationships, alternatives rejected when relevant, and departures from the plan. Distinguish existing behavior from behavior introduced by the commit.
6. Record the exact checks actually run and their results. Separate automated, browser, native build, and physical-device evidence. Label checks not run and behavior still unverified; do not turn planned acceptance into a passed result.
7. State remaining work, blockers, and the next concrete step so a new agent can resume without this conversation. Keep the original plan ledger synchronized with status, commit references, and acceptance evidence; this file adds detail rather than replacing that ledger.
8. Keep credentials, tokens, personal test-account details, and secret-bearing callback URLs out of notes and captured output.

## Commit entries

### RN-01 — Shared accessible screen state primitives

**Commit message:** `feat(mobile): add shared accessible screen state primitives`.

**Hash:** `2f88102` (recorded during RN-02; this entry originally traveled with that commit). Its historical file/line ranges and evidence below refer to RN-01, including the then-existing footer fallback. RN-02 changes are recorded separately.

**Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-01`. **Parent/shared base:** `6a64e98`.

**Scope:** Plan 04 RN-01 only; PRD NFR-008/011 and supporting FR-009/034. This is reusable UI, test infrastructure and isolated visual evidence, not completed account/profile/Auth/native behavior.

#### Every changed file and logical change

Ranges refer to this implementation commit. Binary screenshots have dimensions/size rather than line numbers. Generated dependency resolutions are summarized as a graph change with precise file ranges; npm owns that file.

| File and exact lines in RN-01 | Change and reason |
|---|---|
| `.github/workflows/checks.yml`: lines 1–37 | Name the portable plus iOS/Android test step and build the isolated specimen in CI. The existing real export step now also enforces specimen isolation through the root script. |
| `README.md`: lines 10–10 | Advertise the shared primitives and link their consumer contract, distinguishing available UI from completed Auth/data functionality. |
| `README.md`: lines 96–100 | Add specimen commands and explain combined workspace checks, developer-only preview, release export isolation and separate device acceptance. |
| `README.md`: lines 104–104 | Replace the baseline audit count with the measured 16 findings and record the compatible RN patch. Retain the prohibition on forced incompatible dependency downgrades. |
| `apps/mobile/README.md`: lines 10–10 | Add the isolated preview command alongside ordinary mobile verification. |
| `apps/mobile/README.md`: lines 15–15 | Link the component/controller/testing contract so Anisha can reuse the primitives without moving validation or submission authority into them. |
| `apps/mobile/dev/env.d.ts`: lines 1–1 | Load Vite client declarations for CSS/font imports in the isolated developer entry; no production route is added. |
| `apps/mobile/dev/ui/index.html`: lines 1–12 | Create the separate HTML mount and module entry used only by the development specimen build. |
| `apps/mobile/dev/ui/main.tsx`: lines 1–93 | Compose actual warm/dark Screen, Field, Button, InlineStatus and EmptyCard components with local presentation state. Provide error, retry, saving, disabled and reset interactions without calling Auth, an API or native enforcement. |
| `apps/mobile/dev/ui/main.tsx`: lines 95–112 | Offer 393/320 px frame and large-text stress modes, validate the root mount and expose stable isolation markers. Frame sizing is not a phone/device acceptance claim. |
| `apps/mobile/dev/ui/styles.css`: lines 1–63 | Use the existing packaged Space Grotesk weights, responsive side-by-side specimen frames and explicit large-text stress rules. No generated font binaries or screenshot substitutes enter the app. |
| `apps/mobile/dev/vite.config.mts`: lines 1–42 | Configure a separate local Vite root/output, RN Web and source aliases, web-first resolution, JSX and the safe-area optimization exception. Filter only irrelevant client-directive warnings; bind the preview to loopback and keep it outside Expo Router. |
| `apps/mobile/eslint.config.js`: lines 1–4 | Ignore generated app/specimen outputs while retaining the Expo flat configuration. Combined with source-only lint inputs, this prevents linting generated bundles. |
| `apps/mobile/jest.config.cjs`: lines 1–24 | Share alias/setup/disjoint native-component discovery across SDK iOS/Android presets. Exclude opposite-platform native test filenames and clear mocks for reliable consumer tests. |
| `apps/mobile/jest.setup.ts`: lines 1–4 | Install the official safe-area-context Jest mock for deterministic native inset/layout tests; production safe-area behavior remains real. |
| `apps/mobile/package.json`: lines 21–21 | Align React Native from 0.88.0 to the SDK-recommended 0.88.1 patch after Expo compatibility verification. |
| `apps/mobile/package.json`: lines 29–43 | Add compatible native presets, Jest/RNTL/Test Renderer and required typings; declare the already-used Vite version directly for the isolated specimen. Retain existing lint/TypeScript/Vitest tools. |
| `apps/mobile/package.json`: lines 49–54 | Keep portable and component runners separate but compose both in npm test. Limit lint to source inputs and expose developer specimen serve/build commands. |
| `apps/mobile/src/components/ui/README.md`: lines 1–70 | Document each public primitive and helper, controller-owned busy/error/cancellation policy and raw input handling. Include a real callback example and uncertain-write reconciliation guidance. |
| `apps/mobile/src/components/ui/README.md`: lines 72–95 | Record exact Figma nodes, contextual sizes/fonts, intentional accessibility additions and caller-owned footer/keyboard geometry. |
| `apps/mobile/src/components/ui/README.md`: lines 97–132 | Provide shared test/preview/export commands, asynchronous RNTL 14 and runner conventions, isolated preview limits and the email-only Auth/copy boundary. Link persistent evidence and define the production isolation rule. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 1–82 | Create one internal ref/event-preserving Pressable presentation for action buttons and real Router links. Expose native and web accessible name/busy/disabled state, reduced-motion progress, focus indication and controlled action labels. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 84–99 | Preserve distinct 52/48 px minimum-height primary/secondary recipes with wrapping bold labels, pressed feedback and an explicit disabled treatment. |
| `apps/mobile/src/components/ui/button.tsx`: lines 1–24 | Require a real action callback, forward the modern native ref and delegate presentation to ButtonSurface. Combine controlled operation-long busy/disabled state with the same-turn guard without owning promises or retry policy. |
| `apps/mobile/src/components/ui/button.test.tsx`: lines 1–62 | Verify neutral secondary actions stay enabled, a controlled pending operation rejects repeat submission and re-enables on completion, and disabled actions never invoke their callback. Run the behavior under both OS presets. |
| `apps/mobile/src/components/ui/empty-card.tsx`: lines 1–20 | Read the local recipe and render a noninteractive empty result with an accessible secondary heading; use explicit web heading level 2. |
| `apps/mobile/src/components/ui/empty-card.tsx`: lines 22–31 | Retain contextual card geometry/typography while moving colors into the active recipe so dark and warm surfaces both work. |
| `apps/mobile/src/components/ui/field.tsx`: lines 1–103 | Introduce a controlled raw-value field with a persistent label, native ref/options and preserved caller focus events. Associate hint/error IDs on web/Android, provide iOS label/announcement fallback, expose read-only state and choose recipe/error/focus appearance without stealing focus. |
| `apps/mobile/src/components/ui/field.tsx`: lines 105–111 | Use growing minimum-height input geometry and wrapping persistent label/detail typography. Keep disabled appearance separate from validation or normalization policy. |
| `apps/mobile/src/components/ui/field.test.tsx`: lines 1–81 | Check whitespace/combining/astral text preservation, persistent labels, changing/cleared errors and iOS announcement deduplication, forwarded native refs/options/focus handlers and blocked read-only editing. |
| `apps/mobile/src/components/ui/inline-status.tsx`: lines 1–58 | Use a discriminated union to distinguish loading/saving from error/unavailable. Announce status without fake actions, expose native/web busy/live state and render a controlled retry only when its real callback exists. |
| `apps/mobile/src/components/ui/inline-status.tsx`: lines 60–64 | Lay out status text and decorative progress with wrapping text, preserving compact contextual typography and spacing. |
| `apps/mobile/src/components/ui/inline-status.test.tsx`: lines 1–49 | Assert busy loading/saving without retry actions, distinct unavailable content, controlled retry invocation and recovery to an actual empty card. Verify decorative progress is absent from the accessible role tree. |
| `apps/mobile/src/components/ui/progress-indicator.tsx`: lines 1–40 | Read and subscribe to reduced-motion preferences conservatively, handle initial-read/event races and clean up on unmount. Hide the decorative indicator with native and web properties so text owns the accessible status. |
| `apps/mobile/src/components/ui/progress-indicator.test.tsx`: lines 1–46 | Exercise reduced-motion changes, subscription cleanup and a delayed initial preference that must not overwrite a newer event. |
| `apps/mobile/src/components/ui/route-button.tsx`: lines 1–10 | Replace duplicated hardcoded Pressable styling with ButtonSurface while retaining actual Expo Link/asChild behavior, ref/event plumbing and link semantics. Navigation remains distinct from action handling. |
| `apps/mobile/src/components/ui/route-button.test.tsx`: lines 1–15 | Render a real Expo Router test tree and activate the link to an existing typed settings destination; assert visible destination content and the resulting pathname. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 1–29 | Extend the existing dark-compatible Screen API with caller footer clearance, keyboard offset and test ID; select contextual theme tokens and safe-area insets. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 31–61 | Provide local UI theme, keyboard-aware scrolling/dismissal, preserved safe-area edges and accessible screen heading. Preserve the old default bottom reserve and support zero overlapping-footer clearance for standalone forms. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 64–69 | Keep a flexible screen, content gaps and growing heading/subtitle styles while delegating colors to recipes. |
| `apps/mobile/src/components/ui/screen.test.tsx`: lines 1–50 | Render warm/dark screens with usable controls/headings and assert safe-inset plus caller-clearance behavior, platform keyboard avoidance and scroll tap/dismiss semantics. |
| `apps/mobile/src/components/ui/theme.tsx`: lines 1–14 | Provide a tiny presentation-only warm/dark context with a warm default and typed recipe lookup. It carries no session, account, profile or native state. |
| `apps/mobile/src/components/ui/use-announcement.ts`: lines 1–14 | Queue new nonempty iOS accessibility messages, deduplicate unchanged text and reset when cleared. Android/web use the rendering components' live-region properties. |
| `apps/mobile/src/components/ui/use-announcement.native.test.ts`: lines 1–17 | Exercise a native-only filename through the Jest harness and verify clear-then-repeat announcements work while unchanged messages stay deduplicated. |
| `apps/mobile/src/components/ui/use-press-guard.ts`: lines 1–20 | Guard callbacks with a ref until the next microtask, including thrown callbacks, and honor the latest controlled blocked flag. This closes the React pre-render gap without claiming request/server idempotency. |
| `apps/mobile/src/components/ui/use-press-guard.test.tsx`: lines 1–37 | Test the same-turn press race independently of rendered interactions and confirm the latest blocked state prevents callbacks. |
| `apps/mobile/src/design/tokens.ts`: lines 18–28 | Add contextual action/field/error/focus colors and stronger editable boundaries while retaining existing Figma palette and installed font names. |
| `apps/mobile/src/design/tokens.ts`: lines 38–61 | Define the warm presentation/field recipe, including independent typography, spacing and 44 px minimum height with 16 px radius. |
| `apps/mobile/src/design/tokens.ts`: lines 62–86 | Define the distinct dark field/surface recipe and typed theme key, preserving 48 px minimum height, 7 px radius and light font instead of normalizing every control. |
| `apps/mobile/tsconfig.json`: lines 1–26 | Declare React Native, Node and Jest ambient types for the shared component/test/preview sources while preserving strict Expo/contract configuration. |
| `apps/mobile/vitest.config.mts`: lines 1–9 | Keep the portable TypeScript glob and default exclusions, explicitly exclude native-adapter tests and prevent overlap with the Jest harness. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Replace the prepared/unstarted RN-01 pointer with the actual implementation checkpoint so replacement agents inspect current evidence and next steps. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–10 | Record implemented RN-01 status, the task branch and separate device acceptance; retain mandatory per-commit notes/evidence rather than treating preparation as completion. |
| `docs/core_plan/04_react_native_integration.md`: lines 182–186 | Update RN-01 alone in the execution ledger with actual test/visual/isolation evidence and its unique Git reference; leave later parts unstarted. |
| `docs/core_plan/04_react_native_integration.md`: lines 228–228 | Link detailed RN-01 changes and the consumer contract, stating unverified native keyboard/screen-reader/Dynamic Type gates. |
| `docs/core_plan/README.md`: lines 3–12 | Advance the execution index to five implemented parts and 39 future parts, while preserving unresolved Auth/API/database/native boundaries. |
| `docs/core_plan/README.md`: lines 115–115 | Distinguish contract/UI evidence from the remaining implementation parts and live Auth/cloud/device acceptance. |
| `docs/core_plan_implementation_notes/README.md`: lines 40–42 | Point readers at the live Plan 04 checkpoint instead of the obsolete unstarted preparation state; preserve the historical documentation setup entry. |
| `docs/core_plan_implementation_notes/artifacts/rn-01/specimens-320-errors.jpg`: binary, no line numbers | Preserve the original Chrome capture for 320 px error/retry presentation: 1512×1045 pixels, 94,019 bytes. It contains the two specimen frames and is evidence, not an app asset or device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-01/specimens-320-large-text.jpg`: binary, no line numbers | Preserve the original Chrome capture for 320 px large-text stress: 1512×1045 pixels, 99,094 bytes. It contains the two specimen frames and is evidence, not an app asset or device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-01/specimens-393.jpg`: binary, no line numbers | Preserve the original Chrome capture for 393 px warm/dark presentation: 1512×1045 pixels, 95,668 bytes. It contains the two specimen frames and is evidence, not an app asset or device acceptance. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–211 | Replace the preparation-only checkpoint with this RN-01 implementation entry: complete file/line inventory, architectural/design decisions, actual checks/screenshots, limitations and next-owner handoff. Preserve recording rules/template and an honest Git lookup until the next normal notes update can record the hash. |
| `package-lock.json`: lines 1–20765 | Regenerate the single npm workspace dependency graph for the mobile test/preview additions and SDK RN patch, including platform/transitive entries and npm hoisting changes. Preserve reproducible integrity/resolution metadata; do not hand-edit generated blocks. The large graph diff is tooling resolution rather than extra product functionality. |
| `package.json`: lines 1–29 | Expose root specimen commands and enforce production isolation after the real Expo export. Preserve the existing workspace check composition; npm expanded the workspace-array formatting. |
| `scripts/check-ui-preview-isolation.mjs`: lines 1–36 | Anchor the real Expo export path to this script, require actual HTML/JavaScript output, recursively scan only JS/HTML for specimen markers and fail on leaks. CI/root export consume the same guard; a deliberate temporary leak was verified and cleaned. |

#### Design, architecture and compatibility decisions

- Figma file `ukmD2ZidJ9UR2XxUkvdPoJ`, read session `2cb2b79c-34f7-4f24-9c1d-f7bb65ea6cc5`: stylebook `10611:12784` was sparse, so full contexts and renders were fetched for primary action `10611:13017`, secondary action `10611:13022`, warm field reference `10611:13056` and dark field `10611:13082`. The rendered controls preserve 52/48 px button heights and 10 px radii, warm 44 px/16 px field geometry and dark 48 px/7 px geometry. Controls can grow for larger text instead of clipping to fixed heights.
- The warm field reference includes a pencil for a separate read-only quest editor. RN-01 implements an editable text primitive, not that complete editor/action. No Figma icon, mascot or placeholder image was substituted or introduced; full asset/control inventory belongs to RN-02. Space Grotesk comes from the existing npm package, not copied font binaries.
- Persistent labels, focus/busy/error/retry states and stronger editable boundaries are engineering accessibility additions, since those Figma states are incomplete. Native input text/labels use the corresponding warm medium/dark light recipes. No synthetic 600 font weight, universal radius or schema-driven form framework was added.
- Warm field boundary `#9A8662` contrasts 3.17:1 with `#FFF1DD`; the dark boundary `#ADADAD` contrasts 7.09:1 with `#222222`. Primary label `#111111` on `#33C659` is 8.42:1; warm label text is 4.83:1 and warm muted text 5.88:1. These calculated ratios motivate the intentional boundary/focus additions; they do not establish complete WCAG/device compliance. [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- UI theme context contains presentation recipes only. Controllers own data validation, current account state, submission, errors, cancellation and lifecycle. `Button` expects busy to be set synchronously for the full operation; its small guard additionally closes the pre-render same-turn gap. It neither retries writes nor handles rejected network promises or server idempotency.
- `Field` forwards a modern native input ref and raw values, including whitespace/combining/astral characters. It never duplicates the profile normalizer or imposes a raw 80-character cap. Android combines label/error native IDs; iOS has a label/error fallback and queued announcements; web has label/description/error ARIA relationships. Errors do not steal focus; the form can deliberately focus an invalid field through its ref.
- Explicit ARIA busy/disabled/live/hidden properties are necessary alongside native props: real browser inspection caught that the older accessibility-state object alone did not expose all web state. Decorative spinners stay hidden from assistive technologies; text describes status. Reduced motion defaults conservatively until read, handles preference events without a stale initial read overwriting them, and cleans up listeners.
- `Screen` preserves the existing shell's default bottom reserve (24 + 88 px + safe inset), exposes caller-supplied clearance/keyboard offset and supports standalone forms with zero overlapping-footer clearance. RN-02 owns measured tab geometry; this commit does not claim that the old shell reserve is a measured final navigation design.
- React Native's 0.88 host refs use `ComponentRef<typeof ...>`, not the old component-as-instance annotations. Installed test tooling: Jest 30.5.2, jest-expo 58.0.13, native preset 0.88.1, RNTL 14.1.0 and the compatible Test Renderer 1.3 line. RNTL 14 render/events/rerenders are async. No deprecated react-test-renderer was added.
- Expo's SDK compatibility check found the baseline RN 0.88.0 below its expected patch; Expo install aligned it to 0.88.1. Existing native source/targets/configuration were not regenerated. The patch was followed by the full checks/build/export again.
- Jest executes shared components/hooks under both iOS and Android presets and includes native-adapter test filenames; opposite-platform native filenames are excluded appropriately. Vitest keeps portable TypeScript and its default exclusions while explicitly rejecting `*.native.test.ts`. Actual runner discovery confirmed 8 component/native files and 1 portable file, with no overlap; the announcement test exercises the native-only filename path.
- The visual entry is under `apps/mobile/dev/ui/`, outside `src/app` and all production imports. It has local-only presentation controls and no services, auth bypass, fake installed protection or saved data. Vite was already used by Vitest and is declared directly for this browser specimen, not as the app's bundler. Its safe-area dependency is excluded from preoptimization so web extensions resolve correctly. Only irrelevant `use client` directive warnings are filtered in this entirely client-side preview; other build warnings remain visible.
- A real Expo export, not `__DEV__` hiding, is checked for specimen markers. The guard fails without a real HTML/JS export, passed for 32 actual app files, and rejected an intentionally injected specimen marker before the temporary probe was removed. Root check/CI runs both test runners; CI also builds the specimen and checks app export isolation.

#### Actual validation and observed results

Environment: Node 24.20.0, npm 11.19.0, Expo 58.0.21, React 19.3.0, React Native 0.88.1, RN Web 0.21.4, Python 3.12.14. Browser verification used Chrome on the development machine; no signed native/device result is claimed.

| Check | Result / coverage |
|---|---|
| `npx expo install --check` (from `apps/mobile`) | Passed after the RN 0.88.1 compatibility patch. |
| `npm ci --ignore-scripts --dry-run --json` | Passed with zero added/removed/changed packages; verified the manifest/lock installation plan without reinstalling dependencies. |
| `npm run check` | Passed: mobile/contracts TypeScript, ESLint, 5 portable Vitest checks, 40 Jest checks in 16 iOS/Android suites, Ruff and 3 existing pytest API checks. |
| `npm run mobile:ui:build` | Passed: separate specimen build; output and generated font assets remain ignored. |
| `npm run mobile:export` | Passed: real Metro/Expo static export, unchanged set of 16 app routes; isolation guard passed over 32 JS/HTML files. |
| `npm run mobile:check-ui-isolation` | Passed. A one-off Node deliberate-leak probe in ignored export output was rejected; the probe was removed in `finally`, then the real export passed again. |
| Actual Jest `--listTests --json --runInBand` / Vitest `list --filesOnly` | 8 unique Jest component/native files versus 1 Vitest portable file; no intersection; native announcement file is Jest-only. |
| Chrome specimens via `npm run mobile:ui` | Warm/dark frames verified at 393×852 and 320×852. Actual button/field sizes, font families, label/error descriptions and zero horizontal overflow observed. Keyboard Tab moved name → email → action; Enter entered saving; back/reset restored controls; error/retry transitioned to loading. |
| Browser accessibility checks | Busy and disabled ARIA became true while saving; decorative progress indicators had `aria-hidden=true`; invalid inputs referenced the visible hint/error; card headings are secondary headings. No browser error logs observed. |
| Large-text browser stress | At 320 px, 24 px body/input and 48 px heading CSS stress wrapped/scrolled without horizontal overflow in either recipe. This is not native Dynamic Type acceptance. |
| Actual exported app served with `vite preview --outDir dist --port 8092` | Settings → sign-in → sign-up worked through the real shared Router links; placeholder/guard behavior was not replaced. No browser error logs observed. |
| `npm audit --json` | 16 reported package findings (3 high, 13 low). Existing high Expo/Zod findings remain; new low paths include testing-tool ancestors. Reported automatic remediation downgrades compatible frameworks/tools; no forced downgrade applied. |
| `git diff --check` and documentation/reference audit | Run before commit; every staged file is accounted for in the change table above and current local links/ranges are checked. |

Component coverage includes pending/disabled and enabled-neutral actions, same-turn deduplication, full-operation busy state with a controller, actual Router navigation, raw input, native refs/focus callbacks, error announcement/deduplication/clear/replay, read-only editing, loading/saving/unavailable/empty/retry distinction, safe insets/footer clearance, and reduced-motion preference races/cleanup. Tests assert behavior instead of broad snapshots.

Initial harness development exposed outdated ref types, overlapping async test interactions and Android's combined label naming; these were corrected with modern ref types, isolated hook race tests and accessible-name assertions. The first lint command traversed generated specimen output; lint inputs/ignores were corrected to source-only. Browser checks then drove the explicit web ARIA fix. Failed intermediate runs are not counted as passing evidence above.

#### Visual evidence

The JPEGs are original browser captures, each 1512×1045 pixels, containing both the warm and dark specimen frames. Frame widths, not the desktop browser viewport, are the 393/320 px measurements. No screenshot is used as an app implementation asset.

- [393 px specimens](artifacts/rn-01/specimens-393.jpg).
- [320 px error specimens](artifacts/rn-01/specimens-320-errors.jpg).
- [320 px large-text stress](artifacts/rn-01/specimens-320-large-text.jpg).

#### Remaining gates and handoff

- Real iOS/Android keyboard avoidance, safe-area/device variants, VoiceOver/TalkBack announcement/focus behavior, native Dynamic Type and native animation behavior still require device/build evidence. Jest's two OS presets do not simulate a complete device.
- Existing Auth/onboarding screens, guards, native bridging/enforcement, profile persistence and APIs remain owned by their later parts. No PM question was answered by adding UI/error treatments.
- `Screen`'s final tab-bar reserve/geometry belongs to RN-02. Authentic asset integration belongs there too; these primitives do not complete the designed screens.
- Root README records the actual dependency advisory state; recheck compatible fixes before release. The audit is not a release/security sign-off.
- Anisha can use the [component contract](../../apps/mobile/src/components/ui/README.md), `jest.config.cjs`/setup and disjoint test conventions. Coordinate shared package/lock/root-file changes as before. She owns her actual controllers and live provider checks.
- Next Plan 04 action: RN-02 source assets/navigation; or explicitly switch to API-01 for the independent backend lane. First review/integrate this RN-01 task commit through the agreed branch flow; do not mark later parts complete.

### RN-02 — Authentic assets and floating main navigation

**Commit message:** `feat(mobile): add authentic assets and floating main navigation`.

**Hash:** `2d5c0d1` (recorded during RN-03; ranges/evidence below are historical to RN-02). Resolve with `git log --oneline --all --grep='^feat(mobile): add authentic assets and floating main navigation$'`; the real hash is recorded above.

**Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-02`. **Parent/shared base:** `2f88102`.

**Status:** Implemented and validated for RN-02 scope. Signed-device rendering/accessibility gates remain unverified. No later RN part or real Auth/native enforcement milestone is complete.

**Scope:** FR-028/029/034 supporting original asset inventory and canonical four-tab navigation; NFR-008/011. Preserve the existing screen placeholders, route groups and Auth/root guard ownership. PD-07/08/Q13–14 (Dino scoring/feed/streak) and native/Auth gates remain unresolved; no user score or mood is inferred from artwork.

#### Every changed file and logical change

Ranges below refer to RN-02. RN-01's earlier ranges remain historical to `2f88102`. The original SVGs are unchanged source artifacts; their line counts are recorded without rewriting paths. Screenshots use dimensions/bytes rather than line numbers. Generated lock/manifest/evidence records are summarized without pretending each resolution or measurement is a new product feature.

| File and exact lines in RN-02 | Change and reason |
|---|---|
| `.github/workflows/checks.yml`: lines 22–23 | Run the original design-asset integrity guard explicitly in mobile CI before tests/builds; export also verifies bundled nav assets. |
| `README.md`: lines 11–11 | Advertise implemented RN-02 navigation and link the consumer geometry contract and original-asset provenance. |
| `README.md`: lines 99–99 | Document the asset-integrity command alongside existing build/test/preview commands. |
| `README.md`: lines 102–102 | Explain source-byte verification in check/export while retaining separate signed-device acceptance and release-preview isolation. |
| `README.md`: lines 120–120 | Advance the next-work guidance to RN-03/API-01/Android investigation and require inspection of current branch/notes before starting. |
| `apps/mobile/README.md`: lines 17–17 | Replace the obsolete text-only statement with local authentic nav assets, inventory-only Dino boundaries and the navigation/provenance links. Keep font binaries package-managed. |
| `apps/mobile/app.config.ts`: lines 12–12 | Register the Expo-requested image plugin in the dynamic configuration without generating or altering native projects/signing. Formatting compacts the existing plugin array. |
| `apps/mobile/assets/README.md`: lines 1–30 | Create human-readable provenance for every original glyph/Dino source: Figma file/node/date, view bounds, purposes, exact-source preservation, image-renderer/device limits and original-byte/export verification. Distinguish inventory-only Dino and future app/provider logos. |
| `apps/mobile/assets/manifest.json`: lines 1–127 | Record the 12 source assets with node IDs, capture/version limits, intrinsic dimensions/viewBox, bytes, SHA-256 and release-navigation versus inventory-only usage. This is the guard's immutable-source comparison baseline. |
| `apps/mobile/assets/icons/navigation/home-active.svg`: lines 1–3 | Add the untouched original Figma SVG from node 84:135; 20.5×20.7758 px, viewBox 0 0 20.5 20.7758, 549 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/home-inactive.svg`: lines 1–3 | Add the untouched original Figma SVG from node 10573:366; 20.5×20.7758 px, viewBox 0 0 20.5 20.7758, 549 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/quests-active.svg`: lines 1–5 | Add the untouched original Figma SVG from node 10491:103; 20×20 px, viewBox 0 0 20 20, 1,508 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/quests-inactive.svg`: lines 1–5 | Add the untouched original Figma SVG from node 84:151; 20×20 px, viewBox 0 0 20 20, 1,508 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/history-active.svg`: lines 1–10 | Add the untouched original Figma SVG from node 10573:381; 20×20 px, viewBox 0 0 20 20, 594 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/history-inactive.svg`: lines 1–10 | Add the untouched original Figma SVG from node 84:154; 20×20 px, viewBox 0 0 20 20, 594 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/settings-active.svg`: lines 1–5 | Add the untouched original Figma SVG from node 10601:231; 20×20 px, viewBox 0 0 20 20, 2,764 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/icons/navigation/settings-inactive.svg`: lines 1–5 | Add the untouched original Figma SVG from node 84:148; 20×20 px, viewBox 0 0 20 20, 2,764 bytes. Use this exact active/inactive navigation source without tint/path changes; preserve intrinsic stroke bounds. |
| `apps/mobile/assets/mascot/dino-happy.svg`: lines 1–15 | Add the untouched original Figma SVG from node 84:77; 110×110 px, viewBox 0 0 110 110, 1,654 bytes. Preserve Dino expression/colors for the source inventory/gallery; no release Home consumer or real user score is introduced. |
| `apps/mobile/assets/mascot/dino-needs-care.svg`: lines 1–15 | Add the untouched original Figma SVG from node 88:68; 110×110 px, viewBox 0 0 110 110, 1,708 bytes. Preserve Dino expression/colors for the source inventory/gallery; no release Home consumer or real user score is introduced. |
| `apps/mobile/assets/mascot/dino-feeling-low.svg`: lines 1–14 | Add the untouched original Figma SVG from node 88:77; 110×110 px, viewBox 0 0 110 110, 1,624 bytes. Preserve Dino expression/colors for the source inventory/gallery; no release Home consumer or real user score is introduced. |
| `apps/mobile/assets/mascot/dino-doing-okay.svg`: lines 1–12 | Add the untouched original Figma SVG from node 88:86; 110×110 px, viewBox 0 0 110 110, 1,808 bytes. Preserve Dino expression/colors for the source inventory/gallery; no release Home consumer or real user score is introduced. |
| `apps/mobile/dev/ui/asset-gallery.tsx`: lines 1–42 | Render all eight glyph variants and four named, unscored Dino sources at original image bounds in the isolated developer entry. Active/inactive swatches preserve each asset's source contrast; no user state or service is consulted. |
| `apps/mobile/dev/ui/main.tsx`: lines 13–13 | Import the separate artwork gallery only into the existing isolated specimen entry. |
| `apps/mobile/dev/ui/main.tsx`: lines 112–112 | Mount the artwork inventory below the existing warm/dark UI specimens; production routes never import it. |
| `apps/mobile/dev/ui/styles.css`: lines 64–90 | Add wrapping source-asset swatches, labels and original active/inactive contrast surfaces to the developer gallery without changing app geometry. |
| `apps/mobile/dev/vite.config.mts`: lines 31–31 | Disable build-time data-URI inlining so the preview emits individually inspectable original SVG files. |
| `apps/mobile/package.json`: lines 13–13 | Add only SDK-compatible expo-image ~58.0.18 as the local SVG image renderer; leave the existing RN/Expo/test versions unchanged. |
| `apps/mobile/src/app/(tabs)/_layout.tsx`: lines 1–24 | Replace scaffold text-only styling with the custom bar, local measurement/ID provider and real screen-panel association. Retain the four canonical routes and router ownership; choose visited-tab history and keep Auth/onboarding outside this layout. |
| `apps/mobile/src/components/navigation/README.md`: lines 1–100 | Document SDK 58 adapter/event/history ownership, native/web semantics, exact source geometry, measured clearance, large-text/narrow reflow, original asset/error behavior, test commands and concrete Anisha/device handoff. |
| `apps/mobile/src/components/navigation/floating-tab-bar-metrics.tsx`: lines 1–31 | Centralize the source minimum/margins and safe bottom-gap rule; provide measured height, clearance and scoped IDs through a presentation-only context. Preserve a first-layout minimum fallback and count the safe inset once. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 1–89 | Define canonical visual labels and render a shared accessible tab target with explicit native/web role/selection, original static SVG variant/bounds, growing labels, roving web Tab index, focus outline and readable image-error fallback. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 90–164 | Adapt the actual SDK emitter/navigateToTab/link-builder/height APIs. Measure bar layout, place it from safe insets, reflow for font/width changes, connect panels and preserve canceled/long/reselected presses and source-specific spacer behavior. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 166–218 | Implement source bar/pill typography, 44 px minimum targets, shadow/rounding and adaptive two-column/focus styles without resizing original glyphs or imposing a universal screen height. |
| `apps/mobile/src/components/navigation/main-tab-panel.tsx`: lines 1–25 | Use the navigator screen layout to associate a real web panel with its scoped tab ID and make its content reachable. Keep native accessibility on actual screen elements and retain flexible layout. |
| `apps/mobile/src/components/navigation/tab-list-keyboard.ts`: lines 1–41 | Isolate web manual keyboard activation at the RN event boundary: wrapping RTL-aware arrows and Home/End move focus; Space activates the existing real link. Guard DOM access; native Pressable interaction remains unchanged. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 1–166 | Exercise actual route components/layout in both native presets: four destinations and direct links, selection/history/reselect, Auth-stack separation/back, cancellable/long presses, live font-scale and measured-clearance updates, image failure and zero/horizontal safe insets. A minimal root wrapper omits only unrelated font loading. |
| `apps/mobile/src/components/ui/README.md`: lines 90–97 | Replace the temporary 88 px reserve guidance with measured navigator clearance, standalone safe spacing and explicit-footer override semantics; link the actual geometry contract. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 6–31 | Read optional navigator presentation metrics; preserve explicit caller clearance, use measured reservation under main tabs and remove the phantom tab estimate outside that provider. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 51–51 | Apply the resolved clearance with content spacing and the actual safe inset, preserving keyboard/scroll behavior. |
| `apps/mobile/src/components/ui/screen.test.tsx`: lines 51–64 | Prove a standalone form with bottom inset 34 reserves exactly 58 px rather than a phantom navigator. Existing explicit-footer checks remain in the same suite. |
| `apps/mobile/src/design/mascot-assets.ts`: lines 1–8 | Create a static four-variant source inventory and exact 110×110 bounds with no default mood or score mapping. Only the developer gallery consumes this inventory at this stage. |
| `apps/mobile/src/design/navigation-assets.ts`: lines 1–38 | Statically import all eight unmodified local variants for Metro/Vite and record exact root image dimensions plus Home stroke-overhang slot offsets. Export the canonical tab-name type without duplicating routes. |
| `apps/mobile/src/types/assets.d.ts`: lines 1–5 | Type local SVG imports as Metro asset IDs or Vite local URLs, avoiding transformers, inline SVG components or unsafe consumer casts. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Point replacement agents at the current RN-01/02 checkpoint and evidence. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Update the artifact index to 6 implemented/38 future parts while preserving the 44 stable IDs and cross-plan gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record RN-01/02 implementation and native-JS-versus-signed-device evidence boundaries. |
| `docs/core_plan/04_react_native_integration.md`: lines 37–38 | Label scaffold observations as the starting baseline so they are not mistaken for current RN-02 behavior. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–189 | Advance only RN-02 in the ledger with its actual subject/evidence and record RN-01's known hash. Keep RN-03–11 unstarted. |
| `docs/core_plan/04_react_native_integration.md`: lines 256–256 | Link detailed implementation/navigation/provenance evidence and retain Dino/Auth/native acceptance limits. |
| `docs/core_plan/README.md`: lines 3–12 | Advance current status/counts to RN-01/02 plus SC-01–04 (6 implemented, 38 future) without promoting Auth/API/database/native adapters. |
| `docs/core_plan/README.md`: lines 115–115 | Distinguish asset/navigation/UI evidence from all remaining implementation and live cloud/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/bar-history.png`: binary, no line numbers | Idle source navbar state capture: 353×62 px, 4,259 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/bar-home.png`: binary, no line numbers | Idle source navbar state capture: 353×62 px, 3,937 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/bar-quests.png`: binary, no line numbers | Idle source navbar state capture: 353×62 px, 4,338 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/bar-settings.png`: binary, no line numbers | Idle source navbar state capture: 353×62 px, 4,554 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/navigation-320.png`: binary, no line numbers | Real app portrait viewport capture: 320×568 px, 36,704 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/navigation-393.png`: binary, no line numbers | Real app portrait viewport capture: 393×852 px, 26,384 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/navigation-430.png`: binary, no line numbers | Real app portrait viewport capture: 430×932 px, 34,880 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/navigation-compact-280.png`: binary, no line numbers | Compact two-column responsive stress capture: 280×568 px, 33,977 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/original-asset-gallery.png`: binary, no line numbers | Original artwork gallery capture: 1152×344 px, 34,039 bytes. Preserve actual browser evidence only; not an app asset or signed-device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/browser-check.mjs`: lines 1–301 | Retain an optional executable Playwright evidence runner with explicit local tool/server prerequisites and an isolated Chrome context. Exercise actual app viewports, geometry, assets, browser history, direct links, warmed offline routing, Auth/scroll separation, keyboard control, compact reflow and image failures; record baseline favicon warnings separately. |
| `docs/core_plan_implementation_notes/artifacts/rn-02/browser-results.json`: lines 1–1281 | Preserve the actual 21 passing case groups and per-viewport bar/target/image/padding measurements, browser version, original-gallery decode results, zero unexpected errors, five deliberate image failures and two known favicon 404s. This is observed evidence, not product data. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–358 | Record RN-01's actual hash, refresh the live checkpoint and add the complete RN-02 inventory/decisions/checks/evidence/gates/handoff in this commit. Preserve RN-01's historical ranges and distinguish self-hash lookup from uncommitted preparation. |
| `package-lock.json`: lines 30–30 | Record the mobile workspace's expo-image dependency in npm's single generated lock history. |
| `package-lock.json`: lines 9705–9724 | Pin expo-image 58.0.18 with original registry integrity, dependency/peer metadata; no existing locked package version changes. |
| `package.json`: lines 17–17 | Require exact bundled navigation assets after the real web export and existing developer-isolation check. |
| `package.json`: lines 24–24 | Add original source-asset integrity to ordinary workspace checks before tests. |
| `package.json`: lines 27–28 | Expose one reusable root asset-integrity command; preserve the existing specimen guard. |
| `scripts/check-design-assets.mjs`: lines 1–45 | Reject an empty inventory, verify every source SVG against exact bytes/hash/root dimensions, and optionally require all navigation hashes in the real web export. Reuse the same guard locally/CI without network access or asset rewriting. |

#### Design, architecture and compatibility decisions

- Read-only Figma session `5ba1f272-e404-4b64-a5be-27dafd073f1f`. High-fidelity contexts and screenshots were obtained for Home `22:4`, Quests `27:155`, History `27:153`, Settings `27:157`, navbar children `84:133`, `10491:97`, `10573:364`, `10601:221`, and Dino `88:96` with its individual variants. Metadata identified the inactive Home vector `10573:366`, followed by its actual design context before implementation. No Figma nodes were edited.
- Downloaded the original SVG URLs exposed by those contexts as instructed; no transient URL survives in app code or asset metadata. The provenance manifest records file/node IDs, capture date, intrinsic width/height/viewBox, size and SHA-256. No immutable Figma version was supplied, so none is invented. Home active/inactive retain 20.5×20.7758 px stroke bounds around the 18 px slot and its offset; other glyphs are 20×20; all four Dino sources are 110×110.
- Match the actual requested navbar, leaving the pre-existing placeholder screen bodies for their future parts. At 393×852, the real app bar is exactly x=20, y=762, width=353, height=62; radius 31, 12/8 px padding, 44 px minimum targets and active-only icon/label pill. Settings centers all items; the other three source states have the source spacer after Home. All artwork/colors remain original; focus feedback and readable image-failure labels are deliberate functional additions.
- Use SDK-compatible `expo-image` 58.0.18 for untouched bundled SVGs; no `react-native-svg`, transformer, rewritten paths or runtime tinting. Its SDK docs note a native iOS SVG decoder limitation; signed-device visual verification remains required. [SDK 58 image reference](https://docs.expo.dev/versions/v58.0.0/sdk/image/). The install added one package; the only lock additions are the workspace dependency and its resolved entry. Existing locked versions did not change.
- Expo install could not edit dynamic `app.config.ts` and exited after dependency installation with its explicit plugin instruction. Added `expo-image` to the existing plugin list manually, then verified public config, SDK compatibility, typechecks, web and native JS exports. No prebuild, Pod install, native source regeneration, entitlement or signing changes were run.
- Expo Router 58's installed public JS tabs API uses `emitter`/`navigateToTab`, rather than the older tutorial `navigation` prop. Adapt that actual API and its public height callback/context. Use its public link builder and platform pressable to retain valid hrefs, browser modified clicks, cancellable tab presses, long presses and reselect behavior. The tab navigator owns history with `backBehavior="history"`; there is no second route implementation or Auth coordinator.
- A small provider owns bar height and scoped accessibility IDs only. Placement uses horizontal safe insets + 20 px and bottom `max(safeInset, 28)`. Screen reserves 24 px plus the measured occupied bottom extent, counting the safe inset once. The first-layout fallback is the 62 px source minimum; layout measurement replaces it. Standalone screens no longer reserve RN-01's temporary 88 px tab estimate; explicit footer clearance still overrides the provider.
- At font scale >1.3 or usable bar width <280 px, use two wrapping columns and visible labels. Glyph bounds stay unchanged; text and height can grow. Native tests change the actual Dimensions subscription to font scale 2 and feed changing bar layout measurements, proving reservation updates. They do not establish native pixel layout or Dynamic Type acceptance. The 280 px browser stress case separately verifies an actual 108 px two-row bar with no horizontal overflow.
- Native/web selected state and explicit tab roles prevent the platform pressable's default button/link role from winning. Web has one active Tab stop, Left/Right (RTL-aware), Home/End focus and manual Space/Enter activation, plus real panel associations via the navigator's screen layout. Focus changes alone do not navigate. The keyboard adapter is typed at RN's event boundary and only accesses DOM objects after a web guard. [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
- Dino source variants remain in the isolated gallery/inventory; they are not a scored release Home component. No neutral state or "85% happy" user default was invented. Third-party app/provider logos are separate future assets, not replacements using these line icons. Gallery labels explicitly say the artwork is unscored; its active swatches use the source action surface for contrast.
- Keep the developer gallery outside Router/release imports. Vite emits individual local SVGs rather than data-URI inlining. Root checks/CI enforce source-byte integrity; the real Expo export additionally must contain all eight original nav hashes and no developer markers. A missing-export probe was rejected and its ignored exported file restored in `finally`; checked-in original SVGs were never modified for testing.
- The optional browser evidence runner uses an ephemeral Playwright installation, not an app dependency, existing personal browser session or automatic CI device gate. It captures real viewport/asset/clearance measurements and records expected deliberately failed SVG requests separately. The baseline missing `/favicon.ico` requests on app/preview are identified, not silently relabeled as app failures or fixed with invented artwork.

#### Actual validation and observed results

Environment: Node 24.20.0, npm 11.19.0, Expo 58.0.21, React 19.3.0, RN 0.88.1, expo-image 58.0.18, Python 3.12.14. Browser: separate headless Chrome 156.0.8078.49 via ephemeral Playwright 1.64.1. No signed-device result is claimed.

| Actual command/check | Result / scope |
|---|---|
| `npm run check` | Passed: workspace TypeScript/ESLint, original asset integrity, 5 portable checks, 62 component/hook checks in 18 iOS/Android suites, Ruff and 3 existing pytest checks. RN-02 adds 22 component cases across the two presets; RN-01's 40 remain covered. |
| `npm run mobile:ui:build` | Passed; local gallery includes all 12 original SVG files and existing packaged fonts, with generated output ignored. |
| `npm run mobile:export` | Passed; same 16 static routes; developer isolation passed across 32 JS/HTML files; exact original bytes of all 8 nav SVGs present. |
| `npx expo install --check` (mobile directory) | Passed: dependencies up to date after adding SDK-compatible expo-image. |
| `npx expo config --type public --json` (mobile directory) | Passed with expo-image plugin present; no native project generation. Output was local verification, not a committed configuration/secret artifact. |
| `npm ci --ignore-scripts --dry-run --json` | Passed with zero added/removed/changed installation actions; manifest and lock agree. |
| `npx expo export --platform ios --platform android --output-dir /tmp/hoosh-rn02-native-export` (mobile directory) | Passed for both OSes. Hermes bundles: iOS 2,578,892 bytes, Android 2,915,814 bytes. Per-platform metadata verification found all 8 original SVG SHA-256 values in each platform's asset entries. This is JS/assets export, not a signed/native module build. |
| `node scripts/check-design-assets.mjs --export` | Passed. A one-off Python probe temporarily withheld an ignored exported Home SVG, observed the expected rejection, restored it in `finally`, then reran the positive check. |
| `npm exec --yes --package @playwright/test -- playwright --version` | Ephemeral validation tool reported 1.64.1; no Playwright package/lock dependency was added. |
| `PLAYWRIGHT_MODULE=<local ephemeral Playwright ESM entry> node docs/core_plan_implementation_notes/artifacts/rn-02/browser-check.mjs` | Passed 21 cases; the environment variable identifies a machine-local module path, not app configuration. Actual browser/data/results are retained below. Serve the real export with `npm exec --workspace @disconnect/mobile -- vite preview --host 127.0.0.1 --port 8092 --strictPort --outDir dist` and the gallery with `npm run mobile:ui`. |
| `git diff --check` and file/link/range/scope audit | Run before commit; every changed file and logical addition is inventoried in this entry; no legacy native, root Auth guard, backend or contract changes. |

Browser assertions covered all four active states at actual 320×568, 393×852 and 430×932 viewports: correct canonical route/heading, one selected tab, active-only visible label, panel association, 44 px targets, exact intrinsic glyph geometry, decoded local assets, measured 114 px content padding for the normal 62 px bar + 28 px bottom gap + 24 px content gap, and no horizontal overflow. Also checked Back/reselect history, four fresh direct links, Auth-stack hidden-tab separation and return, final Settings action scrolled above the bar, keyboard focus/activation, 280 px two-row reflow and actual asset-error fallback. All eight glyphs and four Dino variants decoded in the source gallery at their original bounds.

Offline assertions apply after all route modules/assets have been visited in the **current document**, then networking is disabled and all four tab transitions still work. They do not assert a fresh offline web load. The JSON records zero unexpected app/console errors, five deliberate SVG request failures and two pre-existing missing-favicon 404s. No new product function was inferred from these checks.

During development, assertions caught the pressable role override and native preset Dimensions behavior; explicit roles and real dimension-subscription changes corrected them. Router fixtures now account for hidden-but-mounted back-stack screens, and the source sign-in heading is correctly asserted as "Welcome back". Native export assets have extensionless hash filenames, so verification follows their metadata `ext` entries. Intermediate failures were corrected and are not counted as passing evidence.

#### Visual and machine-readable evidence

All PNGs are actual browser captures, not generated artwork or implementation assets. Standard frame screenshots show the existing placeholder bodies with the new source navbar; a small initial fold can scroll beneath the floating bar, and the measured padding lets its final content clear the bar. Source bar captures are taken after pressed/hover opacity settles. Native pixel rendering remains unverified.

- [320×568 viewport](artifacts/rn-02/navigation-320.png), [393×852 viewport](artifacts/rn-02/navigation-393.png), [430×932 viewport](artifacts/rn-02/navigation-430.png).
- 353×62 source state captures: [Home](artifacts/rn-02/bar-home.png), [Quests](artifacts/rn-02/bar-quests.png), [History](artifacts/rn-02/bar-history.png), [Settings](artifacts/rn-02/bar-settings.png).
- [280 px compact stress](artifacts/rn-02/navigation-compact-280.png), [all original glyphs/Dino source variants](artifacts/rn-02/original-asset-gallery.png).
- [Executable browser evidence runner](artifacts/rn-02/browser-check.mjs), [measured browser results](artifacts/rn-02/browser-results.json).

#### Remaining gates and next handoff

- Signed iOS/Android builds must link the new native image module and verify untouched SVG decoding, stroke bounds, font scaling/RTL, VoiceOver/TalkBack, keyboard interaction, real safe-area variants and app upgrade behavior. Exporting Hermes/asset files does not execute these native behaviors or audit imported Swift targets.
- Actual Auth bootstrap/deep-link guards remain Anisha's AUTH-07 work. The direct-link tests prove current shell routing, not future unauthorized-access protection. Shared contracts, session storage, backend/API/database and native enforcement are unchanged.
- Dino scoring/feed/reward/streak policies and full Home/Quests/History/Settings content remain future producer/PM-dependent work. The 4 prepared Dino assets are absent from the release import graph until a legitimate consumer exists. App/provider logos must come from their own source inventory later.
- The existing missing web favicon is recorded as baseline cosmetic evidence. The 16 existing npm findings (3 high, 13 low) reported by installation remain tracked in the root README; no forced incompatible downgrade was applied.
- Anisha can reuse the UI/test contract and integrate native image linking during her audited iOS work. Root guards stay outside the main tab provider. Coordinate the package/lock/app-config changes before overlapping work.
- Next: review/integrate RN-02 through the agreed area/main flow, then begin RN-03 on a new task branch, or deliberately switch to independent API-01. Keep all remaining plan parts pending. This task commits locally and does not push/merge main automatically.

### RN-03 — Bounded account-scoped HTTP client

**Commit message:** `feat(mobile): harden account-scoped HTTP requests`.

**Hash:** `0741758` (recorded during RN-04). **Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-03`. **Parent:** `2d5c0d1`.

**Status:** Implemented. Shared HTTP/client producer only; no live Auth/API integration, query cache or screen wiring.

**Scope:** Plan 00 AuthSessionPort and HTTP contracts, NFR-005/006/009/010. Add validated configuration, whole-operation cancellation/deadline, safe typed errors, runtime decoders, account-generation guards and bounded 401 recovery/pause. API-05 remains the future generated schema authority; no handwritten replacement DTO package or generator is introduced.

**Initial decisions:** Keep credential/session ownership in Auth. Require the full public port for protected calls, not an unscoped token callback. Never replay writes. Resume a paused scope with an explicit identity GET verification, not a health request or token-refresh event. Keep all tests deterministic/local and all test doubles outside release routes.

#### Every changed file and logical change

Ranges refer to this RN-03 commit. Runtime modules separate transport, decoding, errors, cancellation and account ownership.

| File and exact lines in RN-03 | Change and reason |
|---|---|
| `README.md`: lines 1–126 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `apps/mobile/README.md`: lines 1–21 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `apps/mobile/src/features/README.md`: lines 1–10 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `apps/mobile/src/infrastructure/api/README.md`: lines 1–144 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `apps/mobile/src/infrastructure/api/__tests__/support.ts`: lines 1–97 | Supply isolated synthetic public Auth and response helpers for tests; never import into release code. |
| `apps/mobile/src/infrastructure/api/client-lifecycle.test.ts`: lines 1–330 | Verify HTTP boundary behavior, ownership/recovery races, cancellation and safe failures using deterministic fixtures or loopback HTTP. |
| `apps/mobile/src/infrastructure/api/client-recovery.test.ts`: lines 1–236 | Verify HTTP boundary behavior, ownership/recovery races, cancellation and safe failures using deterministic fixtures or loopback HTTP. |
| `apps/mobile/src/infrastructure/api/client-transport.test.ts`: lines 1–64 | Verify HTTP boundary behavior, ownership/recovery races, cancellation and safe failures using deterministic fixtures or loopback HTTP. |
| `apps/mobile/src/infrastructure/api/client.test.ts`: lines 1–287 | Verify HTTP boundary behavior, ownership/recovery races, cancellation and safe failures using deterministic fixtures or loopback HTTP. |
| `apps/mobile/src/infrastructure/api/client.ts`: lines 1–153 | Orchestrate safe dispatch, account checks, deadlines, runtime validation and bounded GET recovery; never replay writes. |
| `apps/mobile/src/infrastructure/api/config.ts`: lines 1–43 | Validate explicit origin/path/timeout and expose unavailable configuration. |
| `apps/mobile/src/infrastructure/api/decoders.ts`: lines 1–20 | Validate existing health and canonical same-owner identity responses. |
| `apps/mobile/src/infrastructure/api/errors.ts`: lines 1–201 | Define safe typed errors and strict canonical envelope/Retry-After parsing without exposing raw server text. |
| `apps/mobile/src/infrastructure/api/operation.ts`: lines 1–61 | Own one cancellable deadline and dispose timers/listeners; discard late response bodies. |
| `apps/mobile/src/infrastructure/api/protocol.ts`: lines 1–59 | Prepare safe headers and JSON bodies; enforce response origin/media type and safe body failures. |
| `apps/mobile/src/infrastructure/api/session-scope.ts`: lines 1–157 | Guard UUID/generation and recovery leases using the public Auth port; clean temporary subscriptions. |
| `apps/mobile/src/infrastructure/api/transport.native.ts`: lines 1–4 | Select Expo native Fetch explicitly without another dependency. |
| `apps/mobile/src/infrastructure/api/transport.ts`: lines 1–3 | Use standard Fetch outside native. |
| `apps/mobile/src/infrastructure/api/types.ts`: lines 1–26 | Require runtime JSON decoders or explicit empty responses; expose typed injection options. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 1–132 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `docs/core_plan/04_react_native_integration.md`: lines 1–546 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `docs/core_plan/README.md`: lines 1–117 | Document the HTTP producer/consumer contract and synchronize plan status, ownership and the next integration step. |
| `docs/core_plan_implementation_notes/artifacts/rn-03/validation-results.json`: lines 1–75 | Record actual check counts, runtime/bundle hashes and static compilation limitations for reproducible handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–419 | Record current checkpoint, prior hashes and every RN-03 file, decision, check and remaining integration gate. |

#### Decisions, behavior and edge cases

- The client now consumes the full AuthSessionPort rather than an unscoped token callback. Protected requests capture UUID/generation, obtain fresh credentials per attempt, check immediately before dispatch and before delivering decoded data, and cancel on ownership changes. No production caller existed to migrate. Routine credential rotation preserves ownership; temporary unavailability never signs out.
- Configuration accepts an explicit HTTP(S) origin only, with no fallback URL, credentials, prefix, query or fragment. Paths stay same-origin. Caller credentials/cookies/correlation headers are stripped. Native dispatch explicitly uses expo/fetch; redirects are refused. Development HTTP remains possible; deployed origins must use HTTPS.
- One 15-second operation budget covers token acquisition, recovery, dispatch, body reading and runtime decoding, including elapsed wall time after suspension. Abort listeners/timers are cleaned up and late work is discarded. Synchronous CPU parsing cannot be preempted mid-call. Cancelling a consumer does not cancel Auth's shared refresh or undo a server write.
- JSON requires a decoder; explicit empty responses accept 204 only. Identity decoding reuses canonical AuthIdentity and requires the captured owner. API-05 remains the generated DTO authority. Raw profile input is not normalized by transport.
- Errors expose fixed client copy and allowlisted metadata only. Canonical fixture envelopes validate status/code/details/request IDs; raw server/SDK text cannot escape. Retry-After accepts valid hints up to 60 seconds; longer hints disable automatic retry rather than being shortened. The HTTP client schedules no generic retries.
- A GET 401 delegates one revalidation to Auth and allows one same-owner replay. Sustained 401 pauses automatic work across credential rotation. Explicit recovery permits one identity probe; only a valid matching identity clears the pause. A local epoch rejects older in-flight recovery results. Writes never replay or refresh automatically; uncertain dispatched writes report requestMayHaveCommitted for future authoritative reconciliation.

#### Actual validation

- `npm run check` passed: 121 portable tests in four files, 62 component/hook tests in 18 suites, workspace TypeScript/ESLint, source asset integrity, Ruff and 3 pytest checks. Tests include account switches, same-UUID new generations, body/token/recovery delays, cleanup, mutation uncertainty, safe errors and concurrency.
- Two loopback HTTP server tests use real Fetch: redirect target receives no bearer/request, and a never-ending response body reaches its deadline. Test servers close in finally; no remote credentials are used.
- `npm run mobile:export` passed: 16 static routes, 32 JS/HTML isolation files, original nav asset integrity. This existing app does not yet import the producer.
- From apps/mobile, `npx expo export:embed --entry-file src/infrastructure/api/client.ts --platform ios --dev false --bundle-output /tmp/hoosh-rn03-client/ios.js --sourcemap-output /tmp/hoosh-rn03-client/ios.map` and the corresponding android command passed. Direct bundles are 896659 / 901330 bytes; indexed maps have 548 / 546 entries and select transport.native.ts plus Expo's fetch implementation. Neither maps nor bundles contain test fixtures. These are static JS compilations, not installed/signed app execution.
- [Machine-readable evidence](artifacts/rn-03/validation-results.json) records runtime source and bundle SHA-256 values, exact counts and limitations. Release JS/HTML and both direct bundles exclude the synthetic Auth/server-copy test markers.

#### Remaining and handoff

RN-04 owns query scope, guarded mutation callbacks and platform lifecycle integration. Anisha supplies live Auth and coordinates root wiring. RN-05/API-04/05 own the real identity round trip and generated response types. Real Supabase/private API, signed native HTTP/abort/redirect behavior and platform device acceptance remain unverified. No backend, contracts, lockfile, app config, routes, native targets or enforcement policy changed. No new visual assets or screenshots were needed. This commit is local; no push/main merge is implied.

### RN-04 — Account-scoped server state and lifecycle

**Commit message:** `feat(mobile): isolate account server state and lifecycle`.
**Hash:** `610f570` (recorded during RN-05). **Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-04`.
**Status:** Implemented for producer scope; independently tested. Real Auth/root wiring stays Anisha's coordinated integration.

**Scope:** Memory-only account QueryClients, same-generation readiness gating, query cancellation, guarded mutations/callbacks, bounded read retries and native/web focus/connectivity adapters. No profile/identity screen, persisted cache, Auth implementation or native restriction cleanup.

#### Every changed file and logical change

Ranges refer to this RN-04 commit. Historical RN-01–03 ranges above remain tied to their own commits.

| File and exact lines in RN-04 | Change and reason |
|---|---|
| `README.md`: lines 13–13 | Advertise the query/lifecycle producer and consumer contract; advance next-work guidance to real Auth/API prerequisites, independent backend/Android work and coordinated root wiring. |
| `README.md`: lines 122–122 | Advertise the query/lifecycle producer and consumer contract; advance next-work guidance to real Auth/API prerequisites, independent backend/Android work and coordinated root wiring. |
| `apps/mobile/README.md`: lines 21–23 | Link the account query/lifecycle handoff and clarify that live composition and native Expo Network linking remain future coordinated work. |
| `apps/mobile/package.json`: lines 9–9 | Declare React Query and SDK-compatible Expo Network as mobile runtime dependencies; root lockfile supplies exact reproducible versions. No new Auth/persistence package or app/native config is added. |
| `apps/mobile/package.json`: lines 16–16 | Declare React Query and SDK-compatible Expo Network as mobile runtime dependencies; root lockfile supplies exact reproducible versions. No new Auth/persistence package or app/native config is added. |
| `apps/mobile/src/features/README.md`: lines 7–7 | Require account feature controllers to use the keyed query boundary, cancellation and guarded callbacks; keep root Auth/guards coordinated with Anisha. |
| `apps/mobile/src/infrastructure/query/README.md`: lines 1–151 | Document stable Auth/API/controller composition, private subtree placement, readiness/cache/retry policy, safe read/mutation usage, synchronous callback rules, uncertainty reconciliation and native/browser lifecycle ownership. Distinguish tested producer behavior from pending root, live API and signed-device integration. |
| `apps/mobile/src/infrastructure/query/account-controller.test.ts`: lines 1–382 | Exercise account/generation retirement, failed sign-out, same-user unavailability, actual HTTP abort forwarding and ignored producer/notification races. Verify deduplication/stale data, bounded retries/429 delay, offline/logout cleanup, sustained-401 focus/reconnect gating, explicit recovery and uncertain writes. |
| `apps/mobile/src/infrastructure/query/account-controller.ts`: lines 1–133 | Project the public Auth snapshot into one disposable UUID/generation cache owner and honest access availability. Retire on ownership/sign-out intent, preserve same-user outage data, invalidate on readiness/recovery and ref-count one Auth subscription without owning refresh. |
| `apps/mobile/src/infrastructure/query/account-data-provider.test.tsx`: lines 1–246 | Verify actual React form remount/retention, accountless fallback and only-current-account query rendering. Cover old mutation success/error suppression, current callback delivery, duplicate submissions and remount/subscription cleanup on both platform presets. |
| `apps/mobile/src/infrastructure/query/account-data-provider.tsx`: lines 1–94 | Subscribe through React’s external-store API and key the private provider tree to scope lifetime so forms reset on account changes. Supply gated/deduplicated queries and no-replay mutations with guarded callbacks, full-operation pending state and same-turn duplicate suppression. |
| `apps/mobile/src/infrastructure/query/account-scope.ts`: lines 1–123 | Create per-owner query keys/client and guard dispatch, response adoption and synchronous effects. Link operation/query aborts, suppress ignored cancellation, fail offline writes and conservatively flag cancelled started writes as uncertain; disposal aborts and clears caches. |
| `apps/mobile/src/infrastructure/query/lifecycle.test.ts`: lines 1–117 | Verify one lifecycle installation across consumers, cleanup/rollback/conflicts, unknown connectivity and real browser EventTarget/SSR behavior without native module imports. |
| `apps/mobile/src/infrastructure/query/lifecycle.ts`: lines 1–51 | Install one reference-counted focus/online event owner, with rollback on registration failure, exact cleanup and conflict detection. Treat unknown reachability optimistically without confusing it with successful HTTP access. |
| `apps/mobile/src/infrastructure/query/platform-lifecycle.native.test.ts`: lines 1–80 | Mock actual native AppState/Expo Network APIs under both OS presets. Check focus changes, initial-read/event ordering, failed reachability fallback and suppression after cleanup. |
| `apps/mobile/src/infrastructure/query/platform-lifecycle.native.ts`: lines 1–32 | Map AppState and Expo Network to Query managers, with asynchronous initial-read ordering and cleanup guards. Keep Auth refresh ownership separate and ignore late network results after unmount. |
| `apps/mobile/src/infrastructure/query/platform-lifecycle.ts`: lines 1–24 | Use SSR-safe browser visibility/online/offline subscriptions without importing Expo Network. Remove exact callbacks and avoid permanently gating startup on a stale navigator.onLine hint. |
| `apps/mobile/src/infrastructure/query/query-client.ts`: lines 1–38 | Configure memory-only per-scope retention, 30-second freshness and at most one transient read retry with bounded Retry-After delay. Reject other known HTTP/raw failures and all mutation retries/offline queuing; owner teardown replaces per-entry GC timers. |
| `apps/mobile/src/infrastructure/query/query-lifecycle-boundary.tsx`: lines 1–10 | Expose one root-composable effect boundary around the platform lifecycle adapter, with idempotent shared cleanup and no Auth/root route implementation. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Make the RN-01–04 producer checkpoint discoverable to new agents and synchronize 36 future parts while explicitly retaining RN-04 root integration as pending. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Make the RN-01–04 producer checkpoint discoverable to new agents and synchronize 36 future parts while explicitly retaining RN-04 root integration as pending. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record RN-03’s actual commit and RN-04’s real subject, tested producer status, dependency/acceptance evidence and scope-lifetime retention choice. Preserve pending Auth/root wiring and RN-05–11 status. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record RN-03’s actual commit and RN-04’s real subject, tested producer status, dependency/acceptance evidence and scope-lifetime retention choice. Preserve pending Auth/root wiring and RN-05–11 status. |
| `docs/core_plan/04_react_native_integration.md`: lines 190–191 | Record RN-03’s actual commit and RN-04’s real subject, tested producer status, dependency/acceptance evidence and scope-lifetime retention choice. Preserve pending Auth/root wiring and RN-05–11 status. |
| `docs/core_plan/04_react_native_integration.md`: lines 310–311 | Record RN-03’s actual commit and RN-04’s real subject, tested producer status, dependency/acceptance evidence and scope-lifetime retention choice. Preserve pending Auth/root wiring and RN-05–11 status. |
| `docs/core_plan/README.md`: lines 3–3 | Synchronize eight implemented parts/producers and 36 future parts, linking actual query/lifecycle evidence while preserving the real Auth/root integration gate. |
| `docs/core_plan/README.md`: lines 12–12 | Synchronize eight implemented parts/producers and 36 future parts, linking actual query/lifecycle evidence while preserving the real Auth/root integration gate. |
| `docs/core_plan/README.md`: lines 115–115 | Synchronize eight implemented parts/producers and 36 future parts, linking actual query/lifecycle evidence while preserving the real Auth/root integration gate. |
| `docs/core_plan_implementation_notes/artifacts/rn-04/bundle-results.json`: lines 1–59 | Record actual final runtime hashes and direct native graph/bundle measurements: iOS 1079372 bytes and 685 map entries; Android graph/bytes recorded alongside. Preserve explicit static-compilation and pending-integration limitations. |
| `docs/core_plan_implementation_notes/artifacts/rn-04/check-bundles.mjs`: lines 1–37 | Audit direct producer bundles using recursive indexed source maps, required native/Query/Expo Network modules and fixture exclusion. Record source/bundle SHA-256 values without storing binaries or claiming device execution. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–503 | Update the resume checkpoint and RN-03 actual hash, preserve historical ranges, and append the full RN-04 file/line inventory, decisions, observed timer fix, checks/evidence, limitations and next-owner handoff. |
| `package-lock.json`: lines 1–20830 | Update the single generated workspace graph for React Query/core 5.105.0 and Expo Network 58.0.4, including matching mobile dependency declarations and registry integrity. No other dependency resolution or lockfile is introduced. |

#### Decisions, relationships and edge cases

- Query uses TanStack React Query 5.105.0 and its matching core. Expo install selected SDK-compatible expo-network 58.0.4. Only the mobile manifest and existing root lockfile change; there is no second lockfile, NetInfo, new Auth SDK, native prebuild/config/target regeneration or root guard edit. npm still reports the existing 16 findings (3 high/13 low), without forced downgrades.
- One controller projects the public Auth port and owns one disposable cache per UUID/generation. It creates no credentials and never changes Auth generation. Email/token rotation preserves the scope; ownership replacement, generation advance, signing-out intent, signed-out or bootstrap restart clears it synchronously. Failed sign-out cannot revive the retired scope even when the same UUID/generation returns. Same-generation temporary Auth unavailability preserves data/drafts and cancels work until readiness returns.
- Each scope owns pending operation controllers, links Query cancellation to HTTP, races uncooperative producers, and rechecks the actual snapshot before dispatch/adoption. Keyed QueryClientProvider remounts private forms; callbacks use a still-current scope guard. The mutation helper exposes submit rather than mutateAsync/per-call callbacks, blocks duplicate same-turn submissions, never retries/queues writes, and forwards abort signals. Async transport functions must be free of UI effects; synchronous callbacks and after-await scope.commit checks are the documented boundary. External/global state cannot be cleared by this provider automatically.
- Query keys contain account UUID plus feature/filter parameters, not email/tokens. All cache state is memory-only. Read freshness is 30 seconds; retention lasts only for the owning scope (gcTime Infinity), with explicit teardown. This deliberate choice fixed observed five-minute timers scheduled by detached observers after synchronous cache clearing but before React unmount; component tests now exit normally. Future large feeds need bounded cardinality.
- Reads add at most one retry for retryable network/timeout/503 or a valid bounded 429 hint; fake-time tests prove counts/delays and cancellation of waiting retries. Other known HTTP failures and raw exceptions do not retry. HTTP remains the sole 401 recovery owner; paused API gates block automatic focus/reconnect/rotation/refetch. Explicit recovery performs the RN-03 identity probe and invalidates same-owner reads on success. A server outage never signs out.
- Native AppState/Expo Network and browser visibility/online/offline feed one reference-counted manager installation, with no Auth refresh calls. Network initial reads cannot overwrite newer events or publish after cleanup. Unknown/failed reachability is optimistic, known false is offline, and browser startup avoids a stale navigator.onLine lock. Competing lifecycle owners fail explicitly. SSR returns an accountless snapshot and does not access browser/native network objects.
- Root composition is intentionally reserved for Anisha with her actual AUTH-02 producer. No route bypass, production fake identity, generated DTO replacement, profile UI, cache persistence, native rule clearing or unresolved PM product policy is added. Requirements are NFR-005/006/009/010; this is lifecycle logic, so no new Figma visual implementation/screenshot was needed.

#### Actual validation and evidence

| Command/check | Actual result and scope |
|---|---|
| `npm run check` | Passed: 163 portable cases in 6 files (42 new RN-04); 88 component/native cases across 22 iOS/Android suites (26 new); workspace TypeScript/ESLint, 12 original SVG integrity checks, Ruff and 3 pytest tests. Component runners exit normally without forced termination. |
| `npm run mobile:export` | Passed supported app web export, 16 static routes, 32 JS/HTML developer-isolation files, all 8 original navigation assets. App routes still do not import this producer, so this is regression evidence. |
| `npx expo install --check` from apps/mobile | Passed, dependencies up to date; installed expo-network 58.0.4 and React Query 5.105.0. No native prebuild/Pod/signing command executed. |
| `npm ci --ignore-scripts --dry-run --json` | Passed with zero added/removed/changed actions; manifest/lock agreement only, not an install or release audit. |
| Direct native producer exports + graph audit below | Passed for iOS and Android, with account controller/provider, lifecycle native adapter, Expo Network, React Query and native HTTP transport selected; zero test/fixture sources or synthetic markers. |
| `git diff --cached --check`, file/range/link/scope audit | Performed before commit. Unrelated icon folders remain untracked; no native source, app routes, backend or shared contract changes. |

Portable tests cover two-account delayed data, same-UUID generation replacement, sign-out failure, same-user unavailable restoration, actual HTTP abort forwarding, ignored cancellation/notification races, deduplication, stale-data failure, exact retry budgets/429 waits, pending/offline retry cleanup, 401 pause across actual manager focus/reconnect signals, explicit recovery and late mutation callbacks. Component tests verify draft remount/retention, accountless fallback, deduplicated query rendering, suppressed success/error callbacks, duplicate writes and mount/unmount cleanup on both OS presets. Native adapter mocks verify event ordering and unsubscribe/late-read behavior; browser/SSR event tests use real EventTargets without a live backend.

To reproduce direct compilation, create ignored `apps/mobile/.expo/rn04-validation.ts` with exports for createAccountDataController, AccountDataProvider/useAccountData/useAccountQuery/useAccountMutation, QueryLifecycleBoundary and createApiClient, from their corresponding ../src/infrastructure modules. From apps/mobile run, once per platform ios/android:

```bash
npx expo export:embed --entry-file .expo/rn04-validation.ts --platform ios --dev false --bundle-output /tmp/hoosh-rn04-client/ios.js --sourcemap-output /tmp/hoosh-rn04-client/ios.map
```

Use android and android.js/map for the other platform. Then from root run `node docs/core_plan_implementation_notes/artifacts/rn-04/check-bundles.mjs` and remove the temporary entry. [The audit script](artifacts/rn-04/check-bundles.mjs) and [actual bundle/source hashes](artifacts/rn-04/bundle-results.json) are committed; compiled files remain temporary. Expo's direct native CLI reported 676 iOS / 674 Android modules (source maps also contain synthetic prelude entries). This is static JS compilation, not installed native module execution. A supplemental direct web-embed attempt exited zero but emitted Expo's relative source-map URL linking warning; it is not used as web acceptance. The supported app web export above passed.

#### Remaining gates and next handoff

Anisha must wire the real Auth/root provider and route policy, confirm the single Auth refresh owner, and verify Expo Network autolinking in audited native builds. RN-05/API-04/05 then supply real identity and generated DTOs, followed by joint M1 acceptance. No real Supabase/private API, signed-device focus/network/abort/redirect behavior, accessibility acceptance or native protection ownership transition was executed. Cancellation cannot undo a committed server mutation; profile controllers must reconcile uncertain writes rather than repeat them blindly. No persisted cache/offline write replay is permitted. This is a local implementation commit on the RN-04 task branch, not a push/main merge.

### RN-05 preparation — Identity consumer and account region

**Commit message:** `feat(mobile): prepare guarded identity account surface`.
**Hash:** `0c6e4db` (recorded during RN-07 UI preparation). **Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-05`. **Parent:** `610f570`.
**Status:** Consumer preparation implemented/tested; RN-05 live completion remains blocked and is not accepted.
**Missing outputs:** SB-03, real AUTH-01/02/03/07, protected API-04 identity, API-05 generated types, coordinated RN-04/root wiring. The repository contains only public health and test Auth doubles.
**Independent scope:** Prepare the canonical identity read/query and Figma account-region consumer with safe failure/recovery/sign-out delegation, deterministic tests and isolated visual evidence. Do not add mock Auth to the release tree, replace generated schemas, edit Anisha's guards or claim M1.

#### Every changed file and logical change

Ranges refer to this preparation commit, not a completed RN-05 milestone. PNG evidence records dimensions/bytes instead of text line numbers.

| File and exact lines in RN-05 preparation | Change and reason |
|---|---|
| `README.md`: lines 14–14 | Link the prepared account consumer and its handoff, making the missing live Auth/API/generated-type/guard outputs visible rather than presenting a completed account feature. |
| `apps/mobile/README.md`: lines 24–25 | Link the prepared account consumer and its handoff, making the missing live Auth/API/generated-type/guard outputs visible rather than presenting a completed account feature. |
| `apps/mobile/assets/README.md`: lines 5–5 | Link exact Settings-avatar provenance and update the integrity inventory count to 13, while retaining the eight required release nav assets and deferred live account consumer. |
| `apps/mobile/assets/README.md`: lines 28–28 | Link exact Settings-avatar provenance and update the integrity inventory count to 13, while retaining the eight required release nav assets and deferred live account consumer. |
| `apps/mobile/assets/README.md`: lines 31–32 | Link exact Settings-avatar provenance and update the integrity inventory count to 13, while retaining the eight required release nav assets and deferred live account consumer. |
| `apps/mobile/assets/account/README.md`: lines 1–22 | Record read-only Figma session/node provenance, exact source dimensions/hash, source slot geometry, decorative semantics and pending live/native integration. |
| `apps/mobile/assets/account/settings-avatar.svg`: lines 1–13 | Add the untouched 52×52 original Settings avatar (1,929 bytes; source 10562:244). Preserve root/viewBox/paths and manifest hash instead of resizing the Home artwork or inventing a user avatar. |
| `apps/mobile/assets/manifest.json`: lines 125–134 | Register original account SVG node, byte count, SHA-256 and unchanged 52×52 root/viewBox so the existing asset checker validates all 13 originals. Keep its consumer inventory separate from required release navigation assets. |
| `apps/mobile/dev/ui/account-specimen.tsx`: lines 1–30 | Render actual AccountHeader components with explicitly synthetic presentation props in the isolated developer entry. Include ordinary/null/long Unicode email and a unique release-isolation marker; no Auth producer or API is instantiated. |
| `apps/mobile/dev/ui/main.tsx`: lines 13–13 | Mount the clearly labeled account presentation specimen alongside existing isolated UI/assets; keep it outside all Router/production imports. |
| `apps/mobile/dev/ui/main.tsx`: lines 114–114 | Mount the clearly labeled account presentation specimen alongside existing isolated UI/assets; keep it outside all Router/production imports. |
| `apps/mobile/dev/vite.config.mts`: lines 6–23 | Make actual expo-image rendering work in the isolated built/development Vite specimen: source/core re-export resolution, declaration-only type import correction, web platform define and browser dependency preoptimization. Preserve the real component/library functions; do not edit SDK files or Expo’s app bundler. |
| `apps/mobile/dev/vite.config.mts`: lines 25–25 | Make actual expo-image rendering work in the isolated built/development Vite specimen: source/core re-export resolution, declaration-only type import correction, web platform define and browser dependency preoptimization. Preserve the real component/library functions; do not edit SDK files or Expo’s app bundler. |
| `apps/mobile/dev/vite.config.mts`: lines 27–30 | Make actual expo-image rendering work in the isolated built/development Vite specimen: source/core re-export resolution, declaration-only type import correction, web platform define and browser dependency preoptimization. Preserve the real component/library functions; do not edit SDK files or Expo’s app bundler. |
| `apps/mobile/dev/vite.config.mts`: lines 32–34 | Make actual expo-image rendering work in the isolated built/development Vite specimen: source/core re-export resolution, declaration-only type import correction, web platform define and browser dependency preoptimization. Preserve the real component/library functions; do not edit SDK files or Expo’s app bundler. |
| `apps/mobile/dev/vite.config.mts`: lines 37–38 | Make actual expo-image rendering work in the isolated built/development Vite specimen: source/core re-export resolution, declaration-only type import correction, web platform define and browser dependency preoptimization. Preserve the real component/library functions; do not edit SDK files or Expo’s app bundler. |
| `apps/mobile/src/features/README.md`: lines 12–13 | Link the prepared account consumer and its handoff, making the missing live Auth/API/generated-type/guard outputs visible rather than presenting a completed account feature. |
| `apps/mobile/src/features/account/README.md`: lines 1–87 | Specify the consumer’s prepared-only status, required same-controller/guard composition, identity trust/cache/error rules, optional Auth-owned actions and Figma adaptations. List real generated-type/Auth/API/root/device outputs needed before RN-05 completion. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 1–62 | Translate Figma 10562:136 into the source 20 px/16 px card layout and exact 64 px container/52 px original avatar. Use neutral title, backend email/null fallback, wrapping/selectable text, hidden decorative semantics and a text-preserving image-failure state. |
| `apps/mobile/src/features/account/account-surface.test.tsx`: lines 1–294 | Verify all consumer states under both OS presets: safe email/null display, refreshed/stale data, manual retry, mismatch cache removal, explicit recovery, offline/reconnect and account switching. Also cover optional/delegated sign-out, duplicate taps, safe errors and sign-out during an identity request with a late response. |
| `apps/mobile/src/features/account/account-surface.tsx`: lines 1–145 | Compose account-local loading, refresh/stale, offline, Auth/API unavailable, protocol/error, explicit recovery and optional sign-out UI using shared primitives. Keep actions Auth-owned, disable duplicate taps, and never infer profile/protection or navigate around guards. |
| `apps/mobile/src/features/account/api.test.ts`: lines 1–58 | Exercise the actual RN-03 identity consumer with local fixtures: nullable/real email, strict subject/schema checks, abort forwarding and 503 preservation without Auth invalidation. No real Supabase credentials or endpoint is involved. |
| `apps/mobile/src/features/account/api.ts`: lines 1–7 | Read authenticated /v1/me using RN-03’s existing canonical runtime decoder and forwarded query/account cancellation. Do not introduce handwritten generated wire types or use SDK/health data as verified identity. |
| `apps/mobile/src/features/account/identity-query.ts`: lines 1–20 | Share RN-04’s account-prefixed identity query. Immediately mask old data on protocol/mismatched-subject failure, then remove that identity cache entry without an automatic reset/refetch loop. |
| `apps/mobile/src/features/account/use-account-action.ts`: lines 1–46 | Run owner-provided account actions separately from protected server writes so API pause does not prevent local sign-out. Guard same-turn duplicates and mounted/scope ownership before setting busy/error state; ignore raw/late exception content. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Expose the RN-05 preparation checkpoint and remaining acceptance count to new agents without implying real Auth/API/root integration. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Expose the RN-05 preparation checkpoint and remaining acceptance count to new agents without implying real Auth/API/root integration. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record RN-04’s actual hash and RN-05’s prepared consumer/evidence while leaving the real identity round trip, generated types, guarded Settings/root wiring and live acceptance pending. Preserve other part IDs and prerequisites. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record RN-04’s actual hash and RN-05’s prepared consumer/evidence while leaving the real identity round trip, generated types, guarded Settings/root wiring and live acceptance pending. Preserve other part IDs and prerequisites. |
| `docs/core_plan/04_react_native_integration.md`: lines 191–192 | Record RN-04’s actual hash and RN-05’s prepared consumer/evidence while leaving the real identity round trip, generated types, guarded Settings/root wiring and live acceptance pending. Preserve other part IDs and prerequisites. |
| `docs/core_plan/04_react_native_integration.md`: lines 336–337 | Record RN-04’s actual hash and RN-05’s prepared consumer/evidence while leaving the real identity round trip, generated types, guarded Settings/root wiring and live acceptance pending. Preserve other part IDs and prerequisites. |
| `docs/core_plan/README.md`: lines 3–3 | Retain eight accepted parts/producers and 36 awaiting acceptance, explicitly distinguishing RN-05 consumer preparation from completion. |
| `docs/core_plan/README.md`: lines 12–12 | Retain eight accepted parts/producers and 36 awaiting acceptance, explicitly distinguishing RN-05 consumer preparation from completion. |
| `docs/core_plan/README.md`: lines 115–115 | Retain eight accepted parts/producers and 36 awaiting acceptance, explicitly distinguishing RN-05 consumer preparation from completion. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/account-280-long-email.png`: binary PNG, 280×173, 11889 bytes | Preserve an actual browser capture of the prepared account component or deliberate image-failure state; synthetic text is explicitly presentation-only. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/account-393-email.png`: binary PNG, 393×115, 7945 bytes | Preserve an actual browser capture of the prepared account component or deliberate image-failure state; synthetic text is explicitly presentation-only. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/account-393-null-email.png`: binary PNG, 393×115, 7561 bytes | Preserve an actual browser capture of the prepared account component or deliberate image-failure state; synthetic text is explicitly presentation-only. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/account-image-failure.png`: binary PNG, 393×115, 6911 bytes | Preserve an actual browser capture of the prepared account component or deliberate image-failure state; synthetic text is explicitly presentation-only. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/browser-check.mjs`: lines 1–97 | Measure original SVG decoding and effective slot/container/inset geometry, wrapping and load-error fallback at three component widths. Save real captures/results, assert zero page errors and also smoke-test the actual Vite development entry. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/browser-results.json`: lines 1–278 | Record actual Chrome version, ten built-preview component/asset cases, deliberate image failures and clean development-mode rendering. Measurements are component-width evidence, not native/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/figma-account-reference.png`: binary PNG, 393×114, 7555 bytes | Preserve the read-only Figma profile-card render as the visual reference; never use it as a runtime implementation asset. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/native-results.json`: lines 1–32 | Record final runtime/bundle SHA-256 values, source-map counts and original avatar inclusion for iOS/Android. Explicitly mark live acceptance and device execution false. |
| `docs/core_plan_implementation_notes/artifacts/rn-05/verify-native.mjs`: lines 1–82 | Audit both direct consumer bundles against final runtime source contents, synthetic-marker exclusion and exact original-avatar hashes in copied native assets. Write measured output without claiming native code/device execution. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–600 | Advance the resume checkpoint, record RN-04’s actual hash and append RN-05 preparation history with all file/line changes, Figma provenance, actual checks, observed preview compatibility fixes and unfulfilled live acceptance prerequisites. |
| `scripts/check-ui-preview-isolation.mjs`: lines 6–10 | Reject RN-05’s unique developer-account marker in real exported JS/HTML, alongside existing specimen markers. Verify the guard with an intentional ignored-file leak and cleanup. |

#### Decisions and implementation boundary

- RN-05's original completion condition requires a real session reaching a protected backend and the UI showing only that verified identity. Repository inspection found none of the real AUTH/SB/API outputs, so this commit deliberately prepares the independent consumer and leaves the milestone incomplete. No fixture Auth is wired into routes and no handwritten wire DTO/generator replaces API-05. readIdentity reuses the existing canonical AuthIdentity projection/runtime decoder; the real generated schema binding is a remaining task.
- readIdentity forwards the query/account AbortSignal into authenticated /v1/me through RN-03/04. SDK email and /healthz cannot populate the surface. Protocol/mismatched-owner errors suppress prior identity immediately, then remove that identity cache entry without reset/invalidation retry loops. Other same-user transient failures retain data with honest stale/offline messaging. Ownership cancellation/remount remains RN-04's authority.
- High-fidelity read-only Figma session `59e9e8d6-3a5f-40c5-9f5a-45f17ee62e97` inspected Settings `27:157` and profile card `10562:136`, including screenshot renders. Source text nodes are `10562:139–142`, avatar `10562:244`. The exact source SVG is 52×52 (not a resized Home Dino), rendered inside the source 64×64 container with 20 px card padding/16 px gap. Packaged Space Grotesk, RN-01 controls and RN-04 data ownership are reused. The neutral heading and actual/nullable email intentionally replace the design's fictional person; decorative brand artwork infers no gender, score, mood or protection. An image failure leaves readable text and no replacement illustration.
- Account status is local to the region, separate from navigation/native protection. Explicit recovery delegates once to controller.recoverSession and never runs passively. Optional sign-out delegates only to AuthAccountActions, works independently of a paused API gate, blocks repeated taps and suppresses late busy/error updates by mounted/scope checks. Auth still owns generation advance, credential erasure, guards and storage-error recovery. Sign-out's placement is a proposed functional design addition, not an approved Figma control.
- No Settings/root route was changed because the real guard/provider does not exist. Existing preview links must be removed when guarded integration lands. No personal/profile defaults, database row, native restriction release, policy answer, new dependency or configuration secret is introduced.
- The Vite specimen now imports the actual Expo image component. SDK 58 exposes declaration-only imports and Metro bootstrap assumptions that plain Vite cannot execute. Preview-only resolution selects official source/core re-exports used by expo-image, corrects four imports to type imports in the SDK declaration-only module, supplies EXPO_OS=web, excludes platform-sensitive Expo packages from preoptimization and prebundles their CommonJS browser dependencies. SDK files and the Expo production bundler are untouched. Both built preview and development rendering were actually verified; a nonfatal SDK Metro-runtime eval build warning remains visible. Failed intermediate preview attempts are not passing evidence.

#### Actual validation and evidence

| Check | Actual result / limit |
|---|---|
| `npm run check` | Passed: 169 portable tests in 7 files (6 new), 120 component/native cases in 24 iOS/Android suites (32 new), workspace TypeScript/ESLint, 13 original asset checks, Ruff and 3 pytest tests. No live backend/Auth project. |
| Final `npm run typecheck` and `npm run lint` | Passed after final preview changes; the earlier unused test import was removed. No final lint warning. |
| `npm run mobile:export` | Passed supported web export, 16 routes/32 JS-HTML isolation files and original nav bytes. This is regression evidence, not account routing integration. |
| `npm run mobile:ui:build` | Passed with actual account component and original SVG. Nonfatal upstream Metro-runtime eval warning is recorded; not suppressed or labeled production app code. |
| Browser runner below | Passed 10 built-preview cases: actual card widths 393/320/280, nullable/ordinary/long email, exact decoded 52×52 artwork inside 64×64 container, 20 px inset, no component overflow and load-failure fallback. Development server also renders all three cases and decodes the original SVG with zero page errors. |
| Developer marker negative probe | An ignored exported JS file containing RN05_ACCOUNT_SPECIMEN_ONLY caused the isolation guard to reject; removed in finally, then the real 32-file positive guard passed. No original assets were altered. |
| Direct native consumer compile + verify-native.mjs | iOS/Android passed. Bundles 1,100,031 / 1,105,021 bytes; indexed maps 706 / 704 entries. Every runtime source content matches the final file, each native asset output contains the original avatar SHA-256 exactly once, and test/preview markers are absent. Static JS/assets only; no installed/signed app execution. |
| Git/file/range/link/scope audit | Performed before local commit; every changed file is inventoried below. Unrelated icon folders remain untracked. No production routes/native/backend/contracts/package/lockfile changes. |

Browser evidence uses an isolated headless Chrome 156.0.8078.49 via existing ephemeral Playwright 1.64.1, not an added application dependency. Serve built UI with `npm exec --workspace @disconnect/mobile -- vite preview --config dev/vite.config.mts --host 127.0.0.1 --port 8093 --strictPort`, and development UI with `npm run mobile:ui -- --port 8094`. Run `PLAYWRIGHT_MODULE=<local Playwright ESM entry> node docs/core_plan_implementation_notes/artifacts/rn-05/browser-check.mjs`.

[Browser measurements](artifacts/rn-05/browser-results.json), [executable runner](artifacts/rn-05/browser-check.mjs), [Figma account reference](artifacts/rn-05/figma-account-reference.png), [actual ordinary email](artifacts/rn-05/account-393-email.png), [nullable email](artifacts/rn-05/account-393-null-email.png), [280 px long email](artifacts/rn-05/account-280-long-email.png) and [image failure](artifacts/rn-05/account-image-failure.png) are retained. Standard actual card geometry is 393×114, matching the reference; account text differs intentionally. These are component-width stress cases, not whole-app/device screenshots or screen-reader acceptance.

For direct compilation create ignored apps/mobile/.expo/rn05-validation.ts exporting AccountSurface, createAccountDataController, AccountDataProvider and createApiClient from their corresponding ../src/features/account or ../src/infrastructure modules. From apps/mobile, run per platform ios/android:

```bash
npx expo export:embed --entry-file .expo/rn05-validation.ts --platform ios --dev false --bundle-output /tmp/hoosh-rn05-client/ios.js --sourcemap-output /tmp/hoosh-rn05-client/ios.map --assets-dest /tmp/hoosh-rn05-client/ios-assets
```

Replace ios with android for the second command. From root, run `node docs/core_plan_implementation_notes/artifacts/rn-05/verify-native.mjs`; [the report](artifacts/rn-05/native-results.json) records hashes/source/bundle/asset evidence. The ignored entry was removed after validation. No full native project generation, Pod/signing change, cloud mutation or real credentials were used.

#### Remaining work and next handoff

RN-05 **remains incomplete** until SB-03 + real AUTH-01/02/03/07 and API-04/05 exist, generated schema types are consumed, coordinated root/Settings integration removes preview links, PM/design reviews sign-out placement, and a disposable development user completes the documented identity/error/sign-out acceptance matrix. Wrong project, missing/invalid live JWT, real Supabase storage/link flows, 503 integration and physical-device HTTP/SVG/assistive behavior are unverified. The current tests use explicit isolated doubles and local transport fixtures only. Backend API-01 onward is Ishmum's next prerequisite lane; Anisha retains Auth/iOS ownership. This preparation commit is local and does not push or merge main.

### RN-07 UI preparation — Controlled display-name editor

**Commit message:** `feat(mobile): prepare profile editor UI without persistence`.
**Hash:** `5790302` (recorded during RN-08). **Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-07-ui`. **Parent:** `0c6e4db`.
**Status:** Implemented/tested as UI preparation only; not RN-07 integration acceptance.
**User-directed scope:** Build buttons/profile editing presentation without real data or API/Auth work, using one clearly labeled Figma example in an isolated developer preview. Record all skipped work here and in the original plan.
**Design:** Read-only Figma session `381e60fc-0a09-464f-a2a3-6114fb62a179`; Settings card `10562:136` and primary/secondary recipes `10611:13017`, `10611:13022`. No dedicated display-name edit frame is established; the controlled editor is an engineering adaptation using existing Field/Button/Screen primitives, not a claim that age/gender editors are approved.

#### Every changed file and logical change

Ranges refer to this UI-only preparation commit. PNGs record actual binary dimensions/size. Historical entries remain tied to their earlier commits.

| File and exact lines in RN-07 UI preparation | Change and reason |
|---|---|
| `README.md`: lines 15–15 | Advertise the prepared profile editor and the developer-preview command, clearly preserving pending Auth/API/profile persistence and route wiring. |
| `apps/mobile/README.md`: lines 26–27 | Advertise the prepared profile editor and the developer-preview command, clearly preserving pending Auth/API/profile persistence and route wiring. |
| `apps/mobile/dev/ui/main.tsx`: lines 13–13 | Mount the labeled profile specimen alongside existing UI/account galleries outside the Expo Router import graph. |
| `apps/mobile/dev/ui/main.tsx`: lines 116–116 | Mount the labeled profile specimen alongside existing UI/account galleries outside the Expo Router import graph. |
| `apps/mobile/dev/ui/profile-specimen.tsx`: lines 1–107 | Provide one clearly labeled, developer-only Jordan Rivera Figma sample with ephemeral draft/baseline and local apply/discard/clear/status simulations. Use the existing fixed phone frame for stable SafeAreaProvider scrolling; keep blockers during edits and reset sample on reload without Auth, private HTTP or storage. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 1–76 | Publish the controlled UI/event contract, how to view/interact with the isolated example, source design adaptations and the full deferred integration checklist. Distinguish UI events from API DTOs and local preview behavior from actual M2 acceptance. |
| `apps/mobile/src/features/account/README.md`: lines 88–89 | Link the prepared profile UI contract and describe AccountHeader’s additive name input, developer-only sample and deferred data/controller work. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 11–18 | Accept an optional supplied validated display name, preserving the neutral title for absent/null values and all existing identity/avatar geometry. Never infer a profile name from email or embed a production example. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 40–40 | Accept an optional supplied validated display name, preserving the neutral title for absent/null values and all existing identity/avatar geometry. Never infer a profile name from email or embed a production example. |
| `apps/mobile/src/features/account/profile-form.test.tsx`: lines 1–152 | Exercise 15 presentation cases under both OS presets: missing-handler/unchanged Save, raw Unicode/whitespace, busy locks, deliberate clear versus blank text, discard, validation association, failure retention and blocked conflict/uncertain saves. Verify the additive supplied-name header preserves RN-05 neutral fallback; no test claims a real profile write. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 1–170 | Add controlled display-name editing with raw-text vs explicit-clear intents, dirty/busy state and optional Save/review callbacks. Reuse shared controls for validation, confirmed removal, discard, unavailable/conflict/unconfirmed states; do not own data, normalization, requests, revisions, persisted success or account state. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Make RN-07’s UI-only checkpoint discoverable alongside RN-05 preparation so future agents do not mistake presentation for completed profile integration. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Make RN-07’s UI-only checkpoint discoverable alongside RN-05 preparation so future agents do not mistake presentation for completed profile integration. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record RN-05’s actual preparation commit and RN-07 UI-only ledger status. Add the user-authorized scope split and stable RN07-D01–D07 checklist while preserving original live dependencies, implementation steps and M2 exit criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record RN-05’s actual preparation commit and RN-07 UI-only ledger status. Add the user-authorized scope split and stable RN07-D01–D07 checklist while preserving original live dependencies, implementation steps and M2 exit criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 192–192 | Record RN-05’s actual preparation commit and RN-07 UI-only ledger status. Add the user-authorized scope split and stable RN07-D01–D07 checklist while preserving original live dependencies, implementation steps and M2 exit criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 194–194 | Record RN-05’s actual preparation commit and RN-07 UI-only ledger status. Add the user-authorized scope split and stable RN07-D01–D07 checklist while preserving original live dependencies, implementation steps and M2 exit criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 359–378 | Record RN-05’s actual preparation commit and RN-07 UI-only ledger status. Add the user-authorized scope split and stable RN07-D01–D07 checklist while preserving original live dependencies, implementation steps and M2 exit criteria. |
| `docs/core_plan/README.md`: lines 3–3 | Expose RN-07 UI preparation without increasing the accepted-part count: eight completed producers/parts and 36 still awaiting acceptance, including both prepared RN-05/RN-07 work. |
| `docs/core_plan/README.md`: lines 12–12 | Expose RN-07 UI preparation without increasing the accepted-part count: eight completed producers/parts and 36 still awaiting acceptance, including both prepared RN-05/RN-07 work. |
| `docs/core_plan/README.md`: lines 115–115 | Expose RN-07 UI preparation without increasing the accepted-part count: eight completed producers/parts and 36 still awaiting acceptance, including both prepared RN-05/RN-07 work. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/browser-check.mjs`: lines 1–128 | Exercise real preview edit/discard/apply/reload/clear and simulated review/busy/validation behavior. Measure original SVG/Save geometry and three widths plus enlarged-text reflow; capture real evidence and reject private API requests/page errors. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/browser-results.json`: lines 1–55 | Record actual Chrome version and 12 UI/geometry cases, including component widths 393/320/280, 52 px artwork/button measurements, local-only interactions, no private requests and no page errors. These are browser presentation results, not live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/native-results.json`: lines 1–29 | Preserve final UI source/bundle SHA-256 values, 646/644 indexed source-map entries, 1,009,941/1,014,967 byte native JS bundles and exact avatar inclusion. Explicitly mark live RN-07 acceptance/device execution false. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/profile-320-large-text.png`: binary PNG, 320×853, 56049 bytes | Preserve an actual browser profile-frame capture (initial example, validation or enlarged text). The sample and local-only notices are deliberate preview content, not evidence of a signed-in or persisted profile. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/profile-393-initial.png`: binary PNG, 393×853, 38194 bytes | Preserve an actual browser profile-frame capture (initial example, validation or enlarged text). The sample and local-only notices are deliberate preview content, not evidence of a signed-in or persisted profile. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/profile-validation.png`: binary PNG, 393×853, 42213 bytes | Preserve an actual browser profile-frame capture (initial example, validation or enlarged text). The sample and local-only notices are deliberate preview content, not evidence of a signed-in or persisted profile. |
| `docs/core_plan_implementation_notes/artifacts/rn-07/verify-native.mjs`: lines 1–90 | Check direct iOS/Android UI bundles against final runtime source contents and exact original avatar bytes. Reject private API/query clients, tests and Figma sample/preview markers in the compiled producer graph; record actual hashes and false live/device flags. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–697 | Record RN-05’s actual preparation hash and the current UI-only resume checkpoint; append all RN-07 file/line changes, user-directed scope, Figma decisions, real checks/evidence and matching RN07-D01–D07 deferred work. Preserve earlier implementation history and honest pending self-hash. |
| `scripts/check-ui-preview-isolation.mjs`: lines 10–10 | Reject RN07_PROFILE_SPECIMEN_ONLY in real app export files; an intentional ignored-file leak probe was rejected and cleaned before the positive scan. |

#### Decisions and behavior implemented

- This is the explicit UI-only split requested by Ishmum. RN-07's original completion criteria still require an actual persisted, authorized profile edit through API reload/restart. No prerequisite was silently waived and no live profile/API/Auth result is claimed. The original plan and this entry retain the same stable deferred-work IDs below for future agents.
- ProfileForm is controlled presentation over raw text or explicit clear intent. Its local union is a UI event model, not a generated wire DTO. The owning future controller supplies dirty/busy/snapshot/revision and callbacks. No callback means Save is disabled; unchanged input cannot submit. The form does not trim, normalize, cap raw Unicode input, call HTTP, create a profile, assume success or persist drafts.
- The user deliberately confirms removal before the form emits clear intent. Empty/whitespace text remains text, distinct from future null. Busy state locks input and mutable actions. Conflict and unconfirmed states retain the draft and block Save; review buttons are callbacks only and absent without handlers. Real read/compare/conflict resolution is deferred rather than simulated as accepted server behavior.
- Reuse RN-01 Field/Button/InlineStatus/Screen, packaged Space Grotesk and warm tokens. AccountHeader gets an additive optional validated displayName prop while preserving RN-05's neutral fallback for absent/null names. Default production presentation contains no Jordan/example identity. Figma profile card `10562:136`, original avatar `10562:244` and primary/secondary recipes `10611:13017` / `10611:13022` were inspected read-only. The fresh 52×52 asset has the same SHA-256 as the existing local source, so no duplicate artwork was added. All existing avatar geometry remains exact.
- No dedicated display-name edit frame is established in the source design. The form is an engineering adaptation of the approved minimal display-name contract and existing control recipes, not a claim to implement an undocumented Figma frame or the separate age/gender/activity/plan editors. The sample header faithfully supplies the source Jordan Rivera / jord@gmail.com only inside the isolated specimen.
- The developer host keeps one ephemeral local baseline/draft, labels all changes as preview-only, and offers explicit saving/validation/failure/conflict/unconfirmed/unavailable simulations. Apply updates only that component's React state; reload resets the sample. Conflict/unavailable/unconfirmed blockers persist while editing until an explicit preview review/reset, without any private API request. The preview uses the existing fixed-height phone frame so its SafeAreaProvider/ScrollView layout is stable; the first auto-height attempt revealed a resize feedback loop and was corrected before passing browser evidence.
- No real Settings/detail/root route, Auth SDK/store, generated schema, backend/database, native project/config, storage, package or lockfile is changed. Existing development Settings links remain until real guards land. Future integration must put the form under RN-04's keyed private subtree and define dirty navigation handling; this UI component cannot guard arbitrary external state.

#### Work intentionally skipped at this commit

The original RN-07 plan contains this same checklist. All seven entries remain **deferred** here; update the live plan and append new implementation history as they are actually completed.

| Ref | Deferred work | Required producer / future evidence |
|---|---|---|
| RN07-D01 | Generated profile DTOs, actual authenticated GET/PATCH, missing-row/null-name semantics and persistence | Ishmum API-05/06–09; real RN-05/Auth handoff. No profile API/query module is implemented by this UI commit. |
| RN07-D02 | Canonical snapshot/revision vs draft, expected-revision create/update and adopting the server-normalized success | Real backend/DB, approved HTTP contract and guarded query/mutation controller. No optimistic saved badge. |
| RN07-D03 | Authoritative validation, Unicode/Python normalization, approved length/body bounds and real field errors | API validation/schema tests and actual mapped server responses; UI only forwards raw text or explicit clear intent. |
| RN07-D04 | 409 fetch-latest/review/resolution and preserving dirty input across background reads | Actual revision conflict responses and deliberate reconciliation. Prepared buttons do not perform reconciliation. |
| RN07-D05 | Timeout/disconnect ambiguity, authoritative reload/compare and safe deliberate retry | Real GET after an uncertain write; no blind write replay/offline queue. UI currently only blocks Save and exposes a callback. |
| RN07-D06 | Account/generation guards, cancellation, keyed form reset, Settings/detail route/guard wiring and dirty-navigation behavior | RN-04/05 real composition with Anisha. No sample session or unguarded profile route is introduced. |
| RN07-D07 | Any durable/offline draft storage, restart/reload persistence, two-account security and live/device M2 acceptance | Shared draft ownership/storage contract, real DB/Auth, documented tests and physical-device keyboard/assistive evidence. UI tests are not persistence evidence. |

#### Actual validation and evidence

| Check | Actual result and scope |
|---|---|
| `npm run check` | Passed: 169 portable tests in 7 files; 150 component cases in 26 iOS/Android suites (30 new RN-07); workspace TypeScript/ESLint, 13 original assets, Ruff and 3 backend pytest cases. No new live integration tests were run. |
| Final `npm run typecheck` / `npm run lint` | Passed after the final fixed-frame preview change; no warnings. |
| `npm run mobile:ui:build` | Passed actual isolated component/preview build; existing SDK Metro-runtime eval warning remains visible, with no bundler/SDK changes in this task. |
| `npm run mobile:export` | Passed existing 16 routes, 32 JS/HTML isolation files and all 8 original navigation SVGs. Prepared profile UI/sample is not in Router imports. |
| Browser evidence runner | Passed 12 cases: initial labeled example, exact 52×52 asset, 52 px Save height, 393/320/280 component widths, edit/discard/local apply/reload reset, confirmed clear, conflict/unconfirmed blocking, busy lock, validation and 320 px/24 px text stress. No page errors and no /v1 private requests. |
| Isolation negative probe | A temporary ignored app-export JS file containing RN07_PROFILE_SPECIMEN_ONLY was rejected. Removed in finally, then the positive real 32-file scan passed. |
| Direct iOS/Android UI compilation and source/asset audit | Passed. Bundles 1,009,941 / 1,014,967 bytes; indexed maps 646 / 644 entries. Runtime source contents match final ProfileForm/AccountHeader, the exact avatar occurs once in each asset directory, and test/sample/API/query client imports are absent. Static JS/assets, not installed/native execution. |
| File/line/link/scope and `git diff --cached --check` | Performed before local commit; unrelated untracked icon folders excluded. No real profile/identity/guard/persistence or native enforcement claim is made. |

The 30 new component cases cover absent-handler/unchanged Save, raw whitespace/combining/astral values without an authoritative client cap, saving locks, deliberate clear vs text, discard, associated validation, conflict/uncertainty callbacks, unavailable editing, failure retention and supplied/null header names under both OS presets. The initial label assertion assumed identical iOS/Android accessible naming; it was corrected to respect RN-01's existing platform-specific label association. Final suites pass; UI callbacks do not establish server correctness.

Run `npm run mobile:ui:build`, serve with `npm exec --workspace @disconnect/mobile -- vite preview --config dev/vite.config.mts --host 127.0.0.1 --port 8093 --strictPort`, then `PLAYWRIGHT_MODULE=<local Playwright ESM entry> node docs/core_plan_implementation_notes/artifacts/rn-07/browser-check.mjs`. Evidence uses existing ephemeral Playwright 1.64.1 / headless Chrome 156.0.8078.49, not a new runtime dependency. [Runner](artifacts/rn-07/browser-check.mjs), [measured results](artifacts/rn-07/browser-results.json), [initial 393 px UI](artifacts/rn-07/profile-393-initial.png), [validation](artifacts/rn-07/profile-validation.png) and [320 px enlarged text](artifacts/rn-07/profile-320-large-text.png) are retained. These are actual component-frame captures, not native/device acceptance. The source account-card reference is retained in [RN-05 evidence](artifacts/rn-05/figma-account-reference.png).

For direct compilation, create ignored apps/mobile/.expo/rn07-validation.ts exporting ProfileForm and AccountHeader from their ../src/features/account modules. From apps/mobile, run once for each ios/android platform:

```bash
npx expo export:embed --entry-file .expo/rn07-validation.ts --platform ios --dev false --bundle-output /tmp/hoosh-rn07-ui/ios.js --sourcemap-output /tmp/hoosh-rn07-ui/ios.map --assets-dest /tmp/hoosh-rn07-ui/ios-assets
```

Use android paths for the second command. From root run `node docs/core_plan_implementation_notes/artifacts/rn-07/verify-native.mjs`. [Source/bundle/asset report](artifacts/rn-07/native-results.json) records exact hashes and unverified device/live status. The temporary entry was removed. No native rebuild, Pod install, signing, cloud/DB mutation or real credentials were involved.

#### Handoff

Future RN-07 integration commits must complete RN07-D01–D07 and original M2 acceptance using actual Auth/API/DB outputs; preserve this UI-only historical entry. Do not enable a sample-backed profile route, infer onboarding completion from a preview, attach old drafts to a new account, or treat UI feedback simulations as real reconciliation. Independent RN-08/RN-09 frontend work can proceed while those producers are built. Local commit only; no push or main merge.

### RN-08 preparation — Evidence-based protection presentation

**Commit message:** `feat(mobile): prepare capability-aware protection status UI`.
**Hash:** `71da2d5` (recorded during RN-09a; ranges/evidence below remain historical to RN-08). **Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-ui`. **Parent:** `5790302`.
**Status:** Independent presentation/read consumer implemented/tested; live native wiring/device acceptance remains pending.
**Scope:** Map shared native availability/capability/authorization/revision evidence, render honest status/actions, provide a bounded read-only hook and isolated simulated preview, and document skipped native integration/device acceptance in this record and the original plan. No permission prompts/writes or fake adapter is wired into the app.
**Figma:** Read-only session `d5c91295-9bd7-435c-957b-f2b5d1a63107`, Home `22:4` and permission `50:85`. Home has no complete protection-status card/state set; the image-free status summary adapts its existing warm card recipes. The actual onboarding permission screen remains Anisha's scope; its artwork and OS bar are not copied into this new summary.

#### Every changed file and logical change

Ranges refer to this RN-08 preparation commit. PNG evidence records binary dimensions/bytes; historical entries retain their original commit context.

| File and exact lines in RN-08 preparation | Change and reason |
|---|---|
| `README.md`: lines 16–16 | Link the new protection consumer/preview contract and clearly distinguish prepared status UI from real adapter registration, permission/actions and native/device acceptance. |
| `apps/mobile/README.md`: lines 28–29 | Link the new protection consumer/preview contract and clearly distinguish prepared status UI from real adapter registration, permission/actions and native/device acceptance. |
| `apps/mobile/dev/ui/main.tsx`: lines 13–13 | Mount the protection evidence specimen only in the existing developer gallery, alongside earlier UI examples and outside Router imports. |
| `apps/mobile/dev/ui/main.tsx`: lines 118–118 | Mount the protection evidence specimen only in the existing developer gallery, alongside earlier UI examples and outside Router imports. |
| `apps/mobile/dev/ui/protection-specimen.tsx`: lines 1–143 | Add a clearly labeled isolated evidence selector for fourteen status cases, warm/dark rendering and preview-only recovery notices. Construct presentation inputs only, not a native service; capture the simulated-evidence label inside every screenshot and never grant permission or activate restrictions. |
| `apps/mobile/src/features/README.md`: lines 14–15 | Link the new protection consumer/preview contract and clearly distinguish prepared status UI from real adapter registration, permission/actions and native/device acceptance. |
| `apps/mobile/src/features/protection/README.md`: lines 1–111 | Define trusted native inputs, positive-claim requirements, revision/account-ownership limits, stable integration/explicit visibility, bounded read semantics and action ownership. Document the image-free Figma adaptation, simulated preview and all six deferred live/device gates. |
| `apps/mobile/src/features/protection/__tests__/fixtures.ts`: lines 1–31 | Supply test-only native capability/status values and connection wrappers with unique marker strings. No SDK/native service implementation or fixture is imported by the actual producer or app routes. |
| `apps/mobile/src/features/protection/protection-status.test.tsx`: lines 1–285 | Exercise 17 cases on both OS presets for callback matching/busy, no permission or write side effects, strict repeated effects, producer/revision/visibility invalidation and deliberate retry. Verify cleanup, stopped/late results and both timer expiry and overdue success after suspension. |
| `apps/mobile/src/features/protection/protection-status.tsx`: lines 1–80 | Render a warm/dark accessible status summary through existing typography, Button and InlineStatus recipes. Show recovery/setup actions only when both the model and matching owner callback permit them, with controlled busy state; add no imagery, native writes or automatic activation. |
| `apps/mobile/src/features/protection/status-model.test.ts`: lines 1–209 | Exercise 47 pure mapping cases for independent bridge/permission/capability states, native errors, revision validity/mismatch, missing reasons and diagnostic privacy. Verify fresh matching shield evidence only, distinct reminder/overlay labels and truthful earlier/same/newer installation copy. |
| `apps/mobile/src/features/protection/status-model.ts`: lines 1–228 | Project native availability/capability/authorization/installation evidence into fixed-copy status states, validating basic platform/shape/revision constraints before positive claims. Preserve installed-versus-desired state, distinguish shields/overlays/reminders and suppress raw diagnostic/identity data without mutating native state. |
| `apps/mobile/src/features/protection/use-protection-status.ts`: lines 1–78 | Provide an explicit-visibility, read-only native consumer with stable request tickets across producer/revision/focus changes. Read capabilities/authorization/status only; bound UI waiting to ten seconds including wall-clock suspension, clean own timers and ignore overdue/replaced/unmounted results without cancelling rules or prompting. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 11–12 | Link the shared read-only status consumer and specify real adapter identity, device-native desired revision and lifecycle inputs that native owners must still provide. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Make the new protection presentation/read-consumer checkpoint discoverable to future agents while retaining pending live/native status. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Make the new protection presentation/read-consumer checkpoint discoverable to future agents while retaining pending live/native status. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record RN-07’s actual UI commit and RN-08 presentation status/evidence. Add stable RN08-D01–D06 native deferrals while retaining original live/native dependencies, implementation requirements and device acceptance criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record RN-07’s actual UI commit and RN-08 presentation status/evidence. Add stable RN08-D01–D06 native deferrals while retaining original live/native dependencies, implementation requirements and device acceptance criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 194–195 | Record RN-07’s actual UI commit and RN-08 presentation status/evidence. Add stable RN08-D01–D06 native deferrals while retaining original live/native dependencies, implementation requirements and device acceptance criteria. |
| `docs/core_plan/04_react_native_integration.md`: lines 406–416 | Record RN-07’s actual UI commit and RN-08 presentation status/evidence. Add stable RN08-D01–D06 native deferrals while retaining original live/native dependencies, implementation requirements and device acceptance criteria. |
| `docs/core_plan/README.md`: lines 3–3 | Expose RN-08 preparation alongside RN-05/RN-07 without converting pending live acceptance into a completed milestone; preserve eight accepted parts/producers and 36 awaiting acceptance. |
| `docs/core_plan/README.md`: lines 12–12 | Expose RN-08 preparation alongside RN-05/RN-07 without converting pending live acceptance into a completed milestone; preserve eight accepted parts/producers and 36 awaiting acceptance. |
| `docs/core_plan/README.md`: lines 115–115 | Expose RN-08 preparation alongside RN-05/RN-07 without converting pending live acceptance into a completed milestone; preserve eight accepted parts/producers and 36 awaiting acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/browser-check.mjs`: lines 1–104 | Validate fourteen state/action cases, six warm/dark width/target geometries and enlarged-text reflow in actual Chrome. Save source-independent screenshots/results and fail on page errors or private API requests; simulated callbacks must not silently activate protection. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/browser-results.json`: lines 1–160 | Record 21 real browser presentation cases with 393/320/280 component widths, minimum targets, dark/large-text checks, no page errors and no private requests. This is not a report of actual OS permission or protection. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/native-results.json`: lines 1–29 | Preserve final source/bundle hashes and direct native graph sizes: 867401/871762 bytes and 508/506 indexed map entries. Explicitly record zero fixture/private imports and false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/status-320-dark.png`: binary PNG, 320×316, 17806 bytes | Preserve an actual browser status-summary capture with an embedded simulated-evidence label: unavailable, confirmed example, dark permission state or enlarged text. No actual device state is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/status-320-large-text.png`: binary PNG, 320×551, 35776 bytes | Preserve an actual browser status-summary capture with an embedded simulated-evidence label: unavailable, confirmed example, dark permission state or enlarged text. No actual device state is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/status-confirmed-example.png`: binary PNG, 393×210, 14583 bytes | Preserve an actual browser status-summary capture with an embedded simulated-evidence label: unavailable, confirmed example, dark permission state or enlarged text. No actual device state is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/status-unavailable.png`: binary PNG, 393×210, 14930 bytes | Preserve an actual browser status-summary capture with an embedded simulated-evidence label: unavailable, confirmed example, dark permission state or enlarged text. No actual device state is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/verify-native.mjs`: lines 1–74 | Audit direct iOS/Android exports against final mapper/card/hook source contents and SHA-256 values. Reject test/example/account/API/query imports and markers, and record static compilation separately from device execution. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–797 | Record RN-07’s actual commit and update the resume checkpoint for RN-08. Append every changed file/range, design/read-only decisions, actual checks/source evidence and the exact RN08-D01–D06 deferred native checklist, preserving historical entries and an honest pending self-hash. |
| `scripts/check-ui-preview-isolation.mjs`: lines 11–11 | Reject RN08_PROTECTION_SPECIMEN_ONLY in real exported app JS/HTML; the intentional ignored-file leak probe was rejected and cleaned before the positive check. |

#### Decisions, behavior and integration boundary

- RN-08 is implemented as the independent presentation/read-consumer slice allowed by the plan and the user's request to continue similarly to RN-07. There is no registered native adapter in this checkout. No live protection, Android parity, permission grant, native installation or full platform acceptance is inferred from this commit. All device examples are outside the release import graph.
- The pure mapper separates bridge availability, supported mode, current authorization, native state, desired configuration and installed revision. It checks basic evidence shape/platform and nonnegative safe-integer revisions before positive claims. Active shield status requires a fresh authorized native active state, reasons, matching expected device-native revision and no reported error. Notifications say Reminders active and explicitly do not claim blocking; overlays say App interventions active. Unsupported/absent/checking/permission/inactive/installing/pending/degraded/failed/unknown remain distinct.
- The desired revision is the device-native coordinator's expectation, never a backend/profile row revision or API acknowledgment. Fresh earlier installed metadata survives pending updates without claiming the new plan is installed. Same/newer pending revisions are not mislabeled older. Null desired config, stale/error/inconsistent evidence or missing installed reasons cannot produce positive status. Native notes/error codes/reason IDs/raw exceptions are never rendered or logged by these components.
- The hook calls only getCapabilities, getAuthorization and getStatus. It requires an explicit visibility input from the future foreground AND route-focus owner, plus stable integration identity. Integration/revision/visibility-cycle/manual-refresh tickets suppress old results even before effects run. Reads have one 10-second deadline and wall-clock check after suspension, with own-timer cleanup and ignored late/uncancellable native work. It does not poll, install, request permission, pick apps, allow usage, cancel reasons, drain events, subscribe to Auth or make restrictions depend on JS/cloud.
- The card reuses existing warm/dark recipes, fonts, shared Button and InlineStatus. Only a matching supplied native-owner callback exposes a permission/setup/retry action; its async busy/errors remain owner-controlled. Read refresh alone cannot reinitialize a missing adapter. There is no default action that grants permission or turns the state active. Header/descriptions use fixed ordinary copy; internal revisions stay out of product text.
- Read-only Figma session `d5c91295-9bd7-435c-957b-f2b5d1a63107` inspected Home `22:4` and permission `50:85`. Neither contains the complete protection-status state set, so this image-free summary is an engineering adaptation of the warm 24 px card surface and existing dark/action recipes. It does not implement Anisha's onboarding permission screen or copy that screen's Dino/glow/OS bars; no new artwork or source assets were necessary. Existing Home, metrics and policy-dependent features are untouched.
- The isolated developer specimen constructs presentation evidence only, not a ProtectionService/SDK mock. Every card capture carries “Simulated evidence — no device connected”. Selecting states and clicking example recovery controls changes only preview notices and cannot enable real permission/restrictions. No private API request is made. Actual app/root/native source, contract/package/lockfile/config and backend/Auth code are unchanged.

#### Work intentionally deferred

The original RN-08 plan contains this same checklist. These remain **pending live/native integration** despite completion of the independent presentation slice. Append new implementation records and update the live plan as evidence is actually obtained.

| Ref | Native work intentionally deferred | Owner / required evidence |
|---|---|---|
| RN08-D01 | Audit and implement real Swift/Kotlin adapters and register the shared native port with truthful per-device capabilities | Anisha iOS; Ishmum Android. Source/entitlement/signing audit and Android feasibility are not established by UI or mock-service tests. |
| RN08-D02 | Wire actual AppState + route focus/native changes into the required visibility input, refresh after real actions, and supply the authoritative device-native desired revision | Coordinated main/native host integration. The hook accepts these inputs but does not register lifecycle listeners or infer revision from a backend/profile save. |
| RN08-D03 | Supply actual permission/recovery/selection/setup handlers and complete async busy/error flows | Native owners' supported platform flows. Presentation callbacks/preview notices do not prompt or grant permission, and a read refresh cannot reinitialize an absent adapter. |
| RN08-D04 | Confirm real installation/revision reconciliation and approved overlapping restriction behavior | Real native coordinator and approved policy. Old installed state stays distinct from a new desired plan; UI/API success is not installation evidence. |
| RN08-D05 | Decide and implement account/sign-out ownership, event attribution and any restriction transfer/cleanup | PM/native migration protocol. This module does not clear, reassign or drain native rules/events on Auth changes or unmount. |
| RN08-D06 | Execute signed-device revocation/install-failure/foreground/offline/host-termination and accessibility checks | Platform owners' reproducible device evidence. Browser typography/layout and JS compilation do not establish OS protection or Android/iOS parity. |

#### Actual validation and evidence

| Check | Actual result / limits |
|---|---|
| `npm run check` | Passed: 216 portable cases in 8 files (47 new mapper cases), 184 component cases in 28 iOS/Android suites (34 new), workspace TypeScript/ESLint, 13 original assets, Ruff and 3 pytest cases. No live API/native device involved. |
| Focused component/type checks during implementation | Passed after requiring explicit visibility and fixing own-timer assertions. Final full check includes the later suspension-deadline regression. |
| `npm run mobile:ui:build` | Passed real isolated developer UI. Existing nonfatal upstream Metro-runtime eval warning remains visible; no SDK/bundler change in RN-08. |
| `npm run mobile:export` | Passed 16 existing app routes, 32 JS/HTML isolation files and original navigation assets. No status specimen or native adapter is imported into app routes. |
| Browser runner | Passed 21 cases: 14 mapped states with explicit simulated evidence and no activation from callbacks; six warm/dark geometry cases at 393/320/280 component widths with 48 px minimum targets; 320 px/24 px text reflow. Zero page errors or private /v1 requests. |
| Isolation negative probe | The real export guard rejected an intentional ignored JS file containing RN08_PROTECTION_SPECIMEN_ONLY. Removed in finally; subsequent positive 32-file scan passed. |
| Direct iOS/Android consumer compilation and verify-native.mjs | Passed: bundles 867401 / 871762 bytes, 508 / 506 indexed map entries. All final runtime source contents match; no test/example/account/private API/query sources or markers. These are static JS bundles, not signed/installed native module execution. |
| File/line/link/deferral/scope audit and `git diff --cached --check` | Performed before local commit. No unrelated icon folders, legacy native, routes, backend, shared contracts, package/lock or app-config changes are staged. |

Mapper tests cover all availability/authorization/capability/status classes, unsupported/malformed evidence, desired/installed revision comparisons including zero/unknown/invalid values, absent reasons, safe native error copy and distinct shield/overlay/notification claims. Component/hook tests cover explicit matching callbacks, controlled busy, no native writes, strict-effect remount, integration replacement, visibility invalidation/reentry, desired-plan changes, retry, unmount, deadline and overdue success after suspension. An initial global timer-count assertion included framework timers; it was corrected to assert cleanup of the hook's own captured deadline timer. Final results do not claim zero unrelated renderer timers or native cancellation support.

Serve the built UI with `npm exec --workspace @disconnect/mobile -- vite preview --config dev/vite.config.mts --host 127.0.0.1 --port 8093 --strictPort`, then run `PLAYWRIGHT_MODULE=<local Playwright ESM entry> node docs/core_plan_implementation_notes/artifacts/rn-08/browser-check.mjs`. Existing ephemeral Playwright 1.64.1/headless Chrome 156.0.8078.49 produced [the actual results](artifacts/rn-08/browser-results.json) and [executable runner](artifacts/rn-08/browser-check.mjs). Captures: [unavailable](artifacts/rn-08/status-unavailable.png), [confirmed simulated example](artifacts/rn-08/status-confirmed-example.png), [320 px dark permission state](artifacts/rn-08/status-320-dark.png), [320 px enlarged text](artifacts/rn-08/status-320-large-text.png). These are component widths, not whole-app/device screenshots or native assistive acceptance.

For direct compilation, create ignored apps/mobile/.expo/rn08-validation.ts exporting ProtectionStatus, mapProtectionStatus and useProtectionStatus from their corresponding ../src/features/protection modules. From apps/mobile run per ios/android platform:

```bash
npx expo export:embed --entry-file .expo/rn08-validation.ts --platform ios --dev false --bundle-output /tmp/hoosh-rn08-ui/ios.js --sourcemap-output /tmp/hoosh-rn08-ui/ios.map
```

Use android paths for the other platform; run `node docs/core_plan_implementation_notes/artifacts/rn-08/verify-native.mjs` from root. [Native source/bundle report](artifacts/rn-08/native-results.json) records exact hashes and false live/device flags. The temporary entry was removed after compilation. No native build/regeneration/signing, permission prompt, cloud/database action or real credentials were used.

#### Next handoff

Use these producer components for independent RN-09 presentation while keeping unsupported/unavailable states truthful. Complete RN08-D01–D06 with the native owners before live/device acceptance, preserve UI/installed restrictions during rollbacks, and never infer account ownership or clear rules/events from Auth sign-out. RN-05/06 and RN-07 data integration stay pending under their own recorded gates. Local task commit only; no push/main merge.

### RN-09a — Home composition with explicit feature availability

**Hash:** `ff75039` (recorded during RN-10; historical ranges/evidence below remain RN-09a).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09-home`. **Parent:** `71da2d5`.
**Status:** Implemented and validated; local commit pending. This entry travels with that commit. RN-09 remains partial until its other bounded screen increments and relevant integration acceptance exist.

**Scope:** Plan 04 RN-09a, the bounded Home increment allowed by RN-09's commit-done condition and per-screen split rule. FR-022/028/029/030 presentation; NFR-005/008/011. No auth/onboarding/native/backend implementation or reward/measurement policy is added. The cumulative task branch retains earlier unmerged producer work; it is not a main/area merge.

#### Every changed file and logical change

Line ranges are from this implementation commit. SVG ranges describe untouched original download bytes; PNGs have actual dimensions/sizes rather than invented line numbers. Historical RN-01–08 ranges remain tied to their earlier commits.

| File and exact lines in RN-09a | Change and reason |
|---|---|
| `apps/mobile/src/features/home/home-model.ts`: lines 1–40 | Define independent readonly display inputs for health/artwork/cost, credits, weekly provenance, streak evidence and temporary recommendations. These are local UI shapes, not approved HTTP/policy contracts or a new account store. |
| `apps/mobile/src/features/home/home-model.ts`: lines 41–50 | Supply the real route with explicit unavailable regions. No sample account, default mood, fabricated statistics or successful quest is present. |
| `apps/mobile/src/features/home/home-model.ts`: lines 51–101 | Validate displayed numbers/required context per region and map fixed safe availability copy. Preserve genuine supplied zeroes/decimals while rejecting invalid values without clamping or borrowing a fixture. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 1–150 | Compose explicit health/artwork, conditional Feed price/handler/balance gates, credits and weekly regions. Image failure preserves semantic values; optional History navigation never activates protection or invents a measurement. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 151–272 | Preserve upper-card widths/gutter/source slots and warm recipes; grow/stack by available content. Keep 44 px targets, original ellipse layer and proportional health fill instead of absolute screen canvases. |
| `apps/mobile/src/features/home/home-recommendation.tsx`: lines 1–103 | Keep ready/loading/error/unavailable/empty recommendations distinct. Omit missing reward/restriction claims, delegate only explicit ID intents, disable absent/busy actions, and perform no optimistic quest/reward/install transition. |
| `apps/mobile/src/features/home/home-recommendation.tsx`: lines 104–195 | Preserve source card/header/chip/notice/control hierarchy. Compact headers use a full constrained text line, no wrapping column layout, and stacked actions; large-text words remain visible instead of clipping. |
| `apps/mobile/src/features/home/home-screen.tsx`: lines 1–85 | Compose the independent regions, explicit recent-week streak dots, visible measurement provenance and separate native-owned presentation slot. Actual content measurement/native font scale controls reflow; model data never grants native protection. |
| `apps/mobile/src/features/home/home-screen.tsx`: lines 86–109 | Use the source Home insets/card spacing and flexible streak/provenance styling while retaining Screen safe areas, scrolling and measured tab clearance. |
| `apps/mobile/src/features/home/home-artwork.tsx`: lines 1–32 | Render decorative original source assets at their exact bounds through expo-image. Failed decorations disappear without substitute glyphs, while their fixed slot remains stable and hidden from accessibility. |
| `apps/mobile/src/features/home/home-model.test.ts`: lines 1–75 | Nineteen portable cases cover independent availability, explicit zeroes/artwork, invalid percentages/credits/hours, required measurement context and malformed regional display inputs; no Auth or API test fixture is introduced. |
| `apps/mobile/src/features/home/home-screen.test.tsx`: lines 1–248 | Sixteen logical component cases run on both iOS/Android presets: actual unavailable route, source bounds, optional/explicit handlers, busy, ready-to-unavailable transitions, empty vs failure, Feed gates, omitted claims, week evidence, image failure, width/font reflow and independent native presentation. Decorative-image queries and real ExpoImage error payloads respect the native boundary. |
| `apps/mobile/src/features/home/__tests__/fixtures.ts`: lines 1–28 | Keep a marked synthetic display fixture isolated under tests. It is neither a fake account/native service nor the production default, and its unique marker is rejected by release guards. |
| `apps/mobile/src/features/home/README.md`: lines 1–108 | Document display-vs-producer authority, controlled callbacks, account/freshness/native gates, exact source geometry, image failure, layout adaptations, preview reproduction and RN09-D01–D06 handoff. |
| `apps/mobile/src/design/home-assets.ts`: lines 1–16 | Expose unchanged local Home assets with original bounds and explicitly named Dino variants. The fresh Home happy export occupies its actual source slot; no percentage-to-mood rule is implemented. |
| `apps/mobile/src/app/(tabs)/index.tsx`: lines 1–17 | Replace only the Home placeholder body with HomeScreen plus explicit unavailable inputs and an independent unavailable protection card. No root/guard/session/native/API connection or private example is added. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 1–41 | Add optional custom/null header and source-specific content-style inputs; existing callers keep the standard heading/subtitle without changes. |
| `apps/mobile/src/components/ui/screen.tsx`: lines 57–83 | Name the scroll region, allow source content insets and apply computed bottom reserve last. Home can match a design without a duplicate heading while retaining real safe-area/keyboard/navigation ownership. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 1–39 | Add optional decorative visual slots and label styling so Home composes the shared action/Router-link surface rather than duplicating its focus/busy/disabled behavior. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 90–112 | Hide decorative slots from accessibility and replace them during busy state; preserve an explicit text/action name and apply source label typography. Default buttons/links and press guards are unchanged. |
| `apps/mobile/src/components/ui/screen.test.tsx`: lines 1–82 | Add the named custom-header/null-header/footer-clearance regression on both platforms, retaining earlier standard heading/theme/safe-area tests. Styling cannot erase an actual footer reserve. |
| `apps/mobile/dev/ui/home-specimen.tsx`: lines 1–151 | Add nine visibly labeled developer-only Home scenarios, including original Figma values, missing handlers, busy, long content and mixed availability. Example callbacks update a notice only; values/quests/rewards/restrictions never change or persist. |
| `README.md`: lines 8–8 | Update current behavior and link Home handoff; distinguish composed unavailable Home from remaining placeholders and live functionality. |
| `README.md`: lines 17–17 | Update current behavior and link Home handoff; distinguish composed unavailable Home from remaining placeholders and live functionality. |
| `apps/mobile/README.md`: lines 17–17 | Describe the real unavailable Home route, isolated example command and remaining screen/data/native gates; update the earlier inventory-only description to match the current consumer. |
| `apps/mobile/README.md`: lines 30–31 | Describe the real unavailable Home route, isolated example command and remaining screen/data/native gates; update the earlier inventory-only description to match the current consumer. |
| `apps/mobile/assets/README.md`: lines 3–3 | Record both capture dates, fresh Home node/bounds provenance, retained earlier original bytes, actual variant use and 18-asset integrity/compilation limits. |
| `apps/mobile/assets/README.md`: lines 17–25 | Record both capture dates, fresh Home node/bounds provenance, retained earlier original bytes, actual variant use and 18-asset integrity/compilation limits. |
| `apps/mobile/assets/README.md`: lines 33–40 | Record both capture dates, fresh Home node/bounds provenance, retained earlier original bytes, actual variant use and 18-asset integrity/compilation limits. |
| `apps/mobile/assets/manifest.json`: lines 104–104 | Record the three existing variant usage changes and five new original Home SVGs with node IDs, exact bounds, capture date, lengths and hashes. Earlier artwork bytes and hashes are preserved. |
| `apps/mobile/assets/manifest.json`: lines 114–114 | Record the three existing variant usage changes and five new original Home SVGs with node IDs, exact bounds, capture date, lengths and hashes. Earlier artwork bytes and hashes are preserved. |
| `apps/mobile/assets/manifest.json`: lines 124–124 | Record the three existing variant usage changes and five new original Home SVGs with node IDs, exact bounds, capture date, lengths and hashes. Earlier artwork bytes and hashes are preserved. |
| `apps/mobile/assets/manifest.json`: lines 135–189 | Record the three existing variant usage changes and five new original Home SVGs with node IDs, exact bounds, capture date, lengths and hashes. Earlier artwork bytes and hashes are preserved. |
| `apps/mobile/dev/ui/main.tsx`: lines 14–14 | Mount the Home specimen only in the separate Vite developer entry, outside Expo Router and release/native graphs. |
| `apps/mobile/dev/ui/main.tsx`: lines 120–120 | Mount the Home specimen only in the separate Vite developer entry, outside Expo Router and release/native graphs. |
| `apps/mobile/src/components/ui/README.md`: lines 13–17 | Document the optional header/content inputs, invariant footer reserve and decorative/busy button slots; presentation extensions do not add business-state ownership. |
| `apps/mobile/src/components/ui/README.md`: lines 22–25 | Document the optional header/content inputs, invariant footer reserve and decorative/busy button slots; presentation extensions do not add business-state ownership. |
| `apps/mobile/src/features/README.md`: lines 5–5 | Index Home and its explicit unavailable production inputs, remaining tab increments and future producer/account/native integration. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 7–7 | Refresh checkout/implementation entry context so a new agent sees Home progress and the pending live/other-tab boundary. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Refresh checkout/implementation entry context so a new agent sees Home progress and the pending live/other-tab boundary. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Refresh checkout/implementation entry context so a new agent sees Home progress and the pending live/other-tab boundary. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record the actual RN-08 hash, partial RN-09 ledger and explicit RN-09a/b/c/d checkpoints, Home evidence/adaptations and stable RN09-D01–D06 deferred work; do not advance unrelated live acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record the actual RN-08 hash, partial RN-09 ledger and explicit RN-09a/b/c/d checkpoints, Home evidence/adaptations and stable RN09-D01–D06 deferred work; do not advance unrelated live acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 195–196 | Record the actual RN-08 hash, partial RN-09 ledger and explicit RN-09a/b/c/d checkpoints, Home evidence/adaptations and stable RN09-D01–D06 deferred work; do not advance unrelated live acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 462–508 | Record the actual RN-08 hash, partial RN-09 ledger and explicit RN-09a/b/c/d checkpoints, Home evidence/adaptations and stable RN09-D01–D06 deferred work; do not advance unrelated live acceptance. |
| `docs/core_plan/README.md`: lines 3–3 | Keep the 44 top-level parts and 8 accepted/36 awaiting counts; report partial Home composition and outstanding tab/live work without treating preparation as full completion. |
| `docs/core_plan/README.md`: lines 12–12 | Keep the 44 top-level parts and 8 accepted/36 awaiting counts; report partial Home composition and outstanding tab/live work without treating preparation as full completion. |
| `docs/core_plan/README.md`: lines 115–115 | Keep the 44 top-level parts and 8 accepted/36 awaiting counts; report partial Home composition and outstanding tab/live work without treating preparation as full completion. |
| `scripts/check-ui-preview-isolation.mjs`: lines 12–15 | Reject Home specimen, sample/long recommendation and test fixture markers in real exported JS/HTML; existing export prerequisite and earlier guards remain intact. |
| `apps/mobile/assets/icons/home/heart.svg`: lines 1–10 | Download the unmodified original SVG for 84:145; 12×12 health-row heart. No root/path/color edits or runtime Figma URL; record integrity in the manifest. |
| `apps/mobile/assets/icons/home/check.svg`: lines 1–5 | Download the unmodified original SVG for 10605:227; 16×16 Accept decoration. No root/path/color edits or runtime Figma URL; record integrity in the manifest. |
| `apps/mobile/assets/icons/home/saved-time-ellipse.svg`: lines 1–3 | Download the unmodified original SVG for 84:97; 110×110 weekly-card layer at left 80/top −30. No root/path/color edits or runtime Figma URL; record integrity in the manifest. |
| `apps/mobile/assets/icons/home/streak-dots.svg`: lines 1–11 | Download the unmodified original SVG for 84:125; 86×8 streak indicators with explicit recent-week evidence. No root/path/color edits or runtime Figma URL; record integrity in the manifest. |
| `apps/mobile/assets/mascot/home-dino-happy.svg`: lines 1–15 | Download the unmodified original SVG for 84:77; fresh 110×110 Home Dino export retained separately from RN-02 original capture. No root/path/color edits or runtime Figma URL; record integrity in the manifest. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/browser-check.mjs`: lines 1–258 | Reproducible built-preview and real-app browser checks: state matrix, callbacks without business changes, five exact asset slots/served bytes, source geometry, narrow/large text including outer text bounds, actual four-tab navigation and clearance. Wait for actual Router selection, not the click promise alone. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/browser-results.json`: lines 1–370 | Record 30 passing Chrome browser cases, actual source/layout/target geometry, zero page errors/private requests and false device-execution status. This is presentation evidence, not an authenticated/native acceptance run. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/verify-native.mjs`: lines 1–94 | Verify full iOS/Android Expo Router/Hermes source maps against final route/components, exclude fixture/test/private producer imports and check all 16 required navigation/Home original asset hashes. Explicitly separate static compilation from live/device behavior. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/native-results.json`: lines 1–39 | Record actual Node version, parent commit, final runtime hashes, full-app bytecode sizes/digests, map entry counts, 16 verified assets/platform and false live/signed/device acceptance flags. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/home-figma-example.png`: binary PNG, 393×885, 49694 bytes | Source-layout comparison, visibly labeled example; no OS/navigation replica. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/home-320-unavailable.png`: binary PNG, 320×901, 38788 bytes | 320 px unavailable layout with no mood/score/outcomes. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/home-320-large-text.png`: binary PNG, 320×901, 46952 bytes | 320 px/24 px text and 48 px heading stress after compact-header constraints. The phone scrolls; this capture shows its initial viewport. |
| `docs/core_plan_implementation_notes/artifacts/rn-09a/home-real-app.png`: binary PNG, 393×852, 51943 bytes | Actual 393 px app Home with unavailable inputs and the existing floating navigation; focus styling remains visible. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh the resume checkpoint, branch/parent, actual prior hashes, latest checks and next bounded screen; identify user-owned untracked files without staging them. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 668–668 | Record RN-08’s actual implementation hash during this next normal notes update, preserving its historical line ranges and evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 765–903 | Record every RN-09a change, decision, actual validation, skipped-work IDs and next handoff in the same implementation commit with an honest pending self-hash. |

#### Decisions, behavior and scope

- RN-09 explicitly permits a bounded selected-screen commit and per-screen splits. Home plus its source assets/model/states is one coherent increment; Quests, History and Settings remain RN-09b/c/d. The 44 top-level plan parts/counts do not change. RN-09 as a whole is not marked accepted, and no FR-022–034 business behavior is claimed complete.
- The real Home route uses unavailableHome and exposes no private account or functional transaction. Regions distinguish loading/error/unavailable; an empty recommendation is a separate successful state. Valid zeroes remain zeroes only when explicitly supplied. Invalid health/counts or incomplete measurement context become unavailable per region without changing other ready inputs. No fallback fixture, HTTP/native mock, local persistence, new endpoint, inferred score bands or dynamic reward formula exists.
- Feed requires an explicit handler, ready health/cost/balance and sufficient displayed credits. Recommendation handlers receive only the supplied temporary ID. Busy is controller-owned; no success, debit, accepted quest, native rule or completion is inferred. A future live controller must serialize conflicting actions, handle errors/uncertain writes and enforce idempotency/authorization. The UI model is not a wire schema or approval of product policy.
- Read-only Figma session 6e843e23-fbc5-4280-8931-aba6891fbef6 inspected full Home 22:4 context and screenshot. Downloaded all five source SVGs with curl -L as instructed by that context. Existing variants/assets/shared components were inspected first. The fresh Home Dino export differs in bytes from the earlier same-node capture, so both originals are retained rather than rewriting historical bytes. No Figma file was edited and no SVG paths/root dimensions/colors were changed.
- Preserve source insets/cards/slots/typography and reuse the real floating navigation, Screen, Button and expo-image. The iPhone Code Connect status-bar reference cannot be used as an RN app component: the OS/root already owns it, so no static status bar or fake device chrome is drawn. Measured content width/native fontScale controls reflow instead of fixed full-screen coordinates. Health fill follows the supplied percentage rather than the source's inconsistent fixed 85 px fill; Feed/History get 44 px minimum targets and source/coverage are visible. These adaptations and unknown states are explicit, not pixel-identical claims for absent functionality.
- Applied the Figma design-to-code workflow and React best-practices review: feature-scoped components, direct imports, render-time derived values, no duplicate global listeners/cache/state manager, stable original assets, controlled semantic actions and no network/native effects. No dependency, lockfile, app config, Auth guard/provider, native target or backend changes are required.
- Visual review caught both narrow-column wrapping and a later long-heading clip under extreme browser text stress. Compact headers now disable column wrapping and constrain heading width to the available line. Browser regressions check outer text bounds as well as internal scroll overflow; the final screenshots were re-viewed. Initial image tests incorrectly queried hidden decorations/omitted ExpoImage nativeEvent payloads, and default test fontScale forced stacking; corrected the harness, exercised the actual image boundary and restored Dimensions after tests. A browser request URL and immediate Router-selection assertion were likewise fixed in the evidence runner, without changing routing behavior.

#### Work intentionally deferred

The original RN-09 plan contains the same stable checklist. RN-09b/c/d also remain unstarted. Earlier RN07-D01–D07 and RN08-D01–D06 remain pending; UI or export success does not satisfy those gates.

| Ref | Home work intentionally deferred | Owner / required evidence |
|---|---|---|
| RN09-D01 | Approve and implement Dino health/artwork, Feed pricing/transactions, credit ledger and streak producers | PM PD-06–08/Q12–14 and feature/backend owners; current display inputs do not define policy or prove an outcome. |
| RN09-D02 | Provide valid weekly saved-time measurements with range/source/coverage and any comparison eligibility | PM PD-11/12/Q15/16 plus permitted native measurement and insights contracts; no usage or savings are calculated here. |
| RN09-D03 | Define and wire temporary recommendation generation, Skip/Accept lifecycle, persistence/failure and any reward/restriction notices | PM/native/backend feature owners; no saved quest, installed restriction, completion or reward follows from a UI callback. |
| RN09-D04 | Connect actual native status and supported permission/setup/recovery actions into the Home protection region | Native owners and RN08-D01–D06; scores, profiles and API acknowledgments are never installation evidence. |
| RN09-D05 | Wire real account-scoped Home producers, freshness/errors, cancellation and guarded mutations | Auth/backend/RN owners using RN-04 scope/generation rules; no A-to-B data, stale action or uncertain write may be accepted. |
| RN09-D06 | Execute signed-device rendering, native SVG, font/screen-reader/focus and lifecycle acceptance | Platform owners with RN-10 evidence; browser reflow and Hermes compilation do not establish device behavior. |

#### Actual validation and reproducible evidence

| Check | Actual result / limits |
|---|---|
| `npm run check` | Passed workspace TypeScript/ESLint, 235 portable cases in 9 files (19 new), 218 component cases in 30 iOS/Android suites (34 new), 18 original SVGs, Ruff and 3 pytest cases. No live data/device involved. |
| `npm run mobile:ui:build` | Passed isolated real-component preview. Existing nonfatal upstream Expo eval warning remains visible; no build/SDK patch or dependency change added. |
| `npm run mobile:export` | Passed all 16 existing routes, 32 JS/HTML isolation files and eight original navigation assets. The actual Home route has unavailable values and no specimen imports. |
| Isolation negative/positive probes | An intentional ignored JS file with RN09_HOME_SPECIMEN_ONLY was rejected, removed in finally, then the real 32-file guard passed. The added sample/test/long-sample markers are also checked. |
| Browser runner | Passed 30 cases: nine states, four callback/no-business-mutation checks, five exact served SVG bytes/bounds, baseline source card geometry, nine 393/320/280 px availability/long-content cases, enlarged-text bounds/scroll, and actual four-tab app/clearance. Zero page errors or /v1 requests. |
| Full iOS/Android application export + `verify-native.mjs` | Passed actual Expo Router/Hermes graphs: 2112904 / 2402756 bytes; 1194 / 1333 source-map entries. All nine final runtime sources match; 16 required original navigation/Home assets per platform; no developer/test/fixture or account/API/query producer sources. Static bytecode, not signing/install/device evidence. |
| Final file/line/link/deferral/scope audit and `git diff --cached --check` | Run before the local commit; every changed file is covered below its actual part, and pending live/other-screen work remains explicit. User icon folders and workspace file are excluded. |

Browser evidence: [runner](artifacts/rn-09a/browser-check.mjs), [actual results](artifacts/rn-09a/browser-results.json), [labeled source example](artifacts/rn-09a/home-figma-example.png), [320 px unavailable](artifacts/rn-09a/home-320-unavailable.png), [320 px enlarged text](artifacts/rn-09a/home-320-large-text.png), and [actual app with navigation](artifacts/rn-09a/home-real-app.png). Chrome 156.0.8078.49 / existing ephemeral Playwright 1.64.1 were used. The large-text CSS uses 24 px ordinary text and 48 px headings; it is deliberate browser layout stress, not native Dynamic Type evidence. Component preview omits OS status bar/navigation; the actual app capture separately includes real navigation. The longest text scrolls rather than fitting a fixed phone canvas.

Reproduce from root after building both previews:

```bash
npm exec --workspace @disconnect/mobile -- vite preview --config dev/vite.config.mts --host 127.0.0.1 --port 8093 --strictPort
# In another terminal:
python3 -m http.server 8094 --bind 127.0.0.1 --directory apps/mobile/dist
# In another terminal; point this variable at an installed Playwright ESM entry:
PLAYWRIGHT_MODULE=<local-entry> node docs/core_plan_implementation_notes/artifacts/rn-09a/browser-check.mjs
```

Full native application compilation, from apps/mobile:

```bash
npx expo export --platform ios --platform android --output-dir .expo/rn09-native --source-maps
```

Then from root run `node docs/core_plan_implementation_notes/artifacts/rn-09a/verify-native.mjs`. [The actual report](artifacts/rn-09a/native-results.json) contains final source/bundle hashes and false live/signed/device flags. Ignored output stays local. There was no native regeneration, signing, permission prompt, cloud/database write, credential handling or device execution. Local preview servers are stopped after verification.

#### Next handoff

RN-09b Quests presentation is the next bounded frontend commit. Read its real Figma context and preserve suggested-vs-saved distinction, unapproved editor/lifecycle/reward/selection gates and sample isolation. RN-09c/d follow in their own screen-sized commits. Complete RN09-D01–D06 with approved producers before live Home acceptance; coordinate Anisha's root/Auth/iOS work and use RN-04 account scopes. This task is a local commit only, with no push/area/main merge or changes to user-owned untracked files.

### RN-10 — Accessibility, responsive layout and lifecycle hardening

**Hash:** `9b5fbd0` (recorded during RN-09b; ranges/evidence below remain RN-10).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-10-accessibility`. **Parent:** `ff75039`.
**Status:** Shared implementation and portable/browser/compilation checks passed; local commit pending. Full signed-device/live acceptance remains pending under RN10-D01–D06.

**Scope:** NFR-008/009/011; AC-12 as actually tested. The user chose RN-10 ahead of remaining RN-09 screens and deferred original icon-pack rewiring. The subsequent conditional RN-11 request did not cancel the unfinished RN-10 patch; its prerequisite audit is documented, with no RN-11 live work falsely marked complete. No Auth/root guard/provider, backend, contract, dependency, lockfile, native target or SVG/icon-pack change is made.

#### Every changed file and logical change

Ranges below refer to this implementation commit. Pure removals identify old lines at parent ff75039; all other ranges are current. Historical RN-01–09a entries retain their own commit context. PNGs use actual dimensions/byte sizes rather than invented source lines.

| File and exact lines in RN-10 | Change and reason |
|---|---|
| `README.md`: lines 18–18 | Index RN-10 shared hardening/QA and make signed-device/live RN-11 prerequisites visible from the repository entry point. |
| `apps/mobile/dev/ui/profile-specimen.tsx`: lines 12–12 | Compose the original account header and controlled editor under one Screen scroll owner, preserving header artwork/insets and an explicit preview-only title/copy. Long names no longer consume the editor viewport outside its scroll area; no persisted profile or fixture account is wired into release. |
| `apps/mobile/dev/ui/profile-specimen.tsx`: old lines 44–52 at parent `ff75039` | Compose the original account header and controlled editor under one Screen scroll owner, preserving header artwork/insets and an explicit preview-only title/copy. Long names no longer consume the editor viewport outside its scroll area; no persisted profile or fixture account is wired into release. |
| `apps/mobile/dev/ui/profile-specimen.tsx`: lines 47–74 | Compose the original account header and controlled editor under one Screen scroll owner, preserving header artwork/insets and an explicit preview-only title/copy. Long names no longer consume the editor viewport outside its scroll area; no persisted profile or fixture account is wired into release. |
| `apps/mobile/src/app/(tabs)/_layout.tsx`: lines 2–2 | Use the public web top tab-bar position for DOM focus order while the absolute custom bar stays visually at the bottom; retain native bottom position. No Auth/root guard or navigation paths are replaced. |
| `apps/mobile/src/app/(tabs)/_layout.tsx`: lines 17–22 | Use the public web top tab-bar position for DOM focus order while the absolute custom bar stays visually at the bottom; retain native bottom position. No Auth/root guard or navigation paths are replaced. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: old lines 125–125 at parent `ff75039` | Keep tab controls keyed by stable tab name through Router route-key changes, preserve keyboard focus, set stacking above panels, and allow intrinsic wrapping when browser text scaling does not change RN fontScale. Keep event/navigation route keys and the measured footer owner; remove the redundant expansion-only wrap style. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 132–134 | Keep tab controls keyed by stable tab name through Router route-key changes, preserve keyboard focus, set stacking above panels, and allow intrinsic wrapping when browser text scaling does not change RN fontScale. Keep event/navigation route keys and the measured footer owner; remove the redundant expansion-only wrap style. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 170–170 | Keep tab controls keyed by stable tab name through Router route-key changes, preserve keyboard focus, set stacking above panels, and allow intrinsic wrapping when browser text scaling does not change RN fontScale. Keep event/navigation route keys and the measured footer owner; remove the redundant expansion-only wrap style. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 178–180 | Keep tab controls keyed by stable tab name through Router route-key changes, preserve keyboard focus, set stacking above panels, and allow intrinsic wrapping when browser text scaling does not change RN fontScale. Keep event/navigation route keys and the measured footer owner; remove the redundant expansion-only wrap style. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: old lines 181–181 at parent `ff75039` | Keep tab controls keyed by stable tab name through Router route-key changes, preserve keyboard focus, set stacking above panels, and allow intrinsic wrapping when browser text scaling does not change RN fontScale. Keep event/navigation route keys and the measured footer owner; remove the redundant expansion-only wrap style. |
| `apps/mobile/src/components/navigation/main-tab-panel.tsx`: lines 2–2 | Use public route focus to exclude inactive panels from native accessibility and web tab order/display while preserving mounted React subtrees. This prevents keyboard visits to hidden screens without deleting drafts or pretending to authorize data. |
| `apps/mobile/src/components/navigation/main-tab-panel.tsx`: lines 10–10 | Use public route focus to exclude inactive panels from native accessibility and web tab order/display while preserving mounted React subtrees. This prevents keyboard visits to hidden screens without deleting drafts or pretending to authorize data. |
| `apps/mobile/src/components/navigation/main-tab-panel.tsx`: lines 18–18 | Use public route focus to exclude inactive panels from native accessibility and web tab order/display while preserving mounted React subtrees. This prevents keyboard visits to hidden screens without deleting drafts or pretending to authorize data. |
| `apps/mobile/src/components/navigation/main-tab-panel.tsx`: lines 21–25 | Use public route focus to exclude inactive panels from native accessibility and web tab order/display while preserving mounted React subtrees. This prevents keyboard visits to hidden screens without deleting drafts or pretending to authorize data. |
| `apps/mobile/src/components/navigation/main-tab-panel.tsx`: lines 31–31 | Use public route focus to exclude inactive panels from native accessibility and web tab order/display while preserving mounted React subtrees. This prevents keyboard visits to hidden screens without deleting drafts or pretending to authorize data. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 5–5 | Add a real Router regression: edit a controlled draft, switch tabs, exclude the inactive field from accessibility, and return with the exact unsaved value. Existing navigation/history/safe-inset/font/image regressions remain. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 15–15 | Add a real Router regression: edit a controlled draft, switch tabs, exclude the inactive field from accessibility, and return with the exact unsaved value. Existing navigation/history/safe-inset/font/image regressions remain. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 52–67 | Add a real Router regression: edit a controlled draft, switch tabs, exclude the inactive field from accessibility, and return with the exact unsaved value. Existing navigation/history/safe-inset/font/image regressions remain. |
| `apps/mobile/src/components/navigation/README.md`: lines 101–115 | Document web DOM-vs-visual order, stable control keys, inactive-panel visibility without unmount, intrinsic text reflow and the separate native/device QA gates. |
| `apps/mobile/src/components/ui/README.md`: lines 144–151 | Document explicit intent-only focus requests, null/detached behavior and native/public API use; clarify status-vs-alert semantics and link actual QA limits. |
| `apps/mobile/src/components/ui/inline-status.tsx`: lines 1–1 | Keep existing error alerts and native announcements, and give non-error web feedback explicit status semantics so waiting/saving messages are programmatically identified without moving focus. |
| `apps/mobile/src/components/ui/inline-status.tsx`: lines 39–39 | Keep existing error alerts and native announcements, and give non-error web feedback explicit status semantics so waiting/saving messages are programmatically identified without moving focus. |
| `apps/mobile/src/components/ui/progress-indicator.test.tsx`: lines 8–21 | Add the rejected preference-read regression: reduced-motion presentation remains conservatively nonanimated. Existing OS-change/late-read/listener cleanup coverage remains. |
| `apps/mobile/src/design/tokens.ts`: lines 5–6 | Add readableSuccess as an accessibility adaptation for small text/white-label badges. Preserve original action/decorative green tokens and all SVG colors/bytes. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 77–84 | Record confirmation focus/announcement behavior and the single-scroll-owner requirement for future real Settings integration, with device checks still pending. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 1–1 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 7–8 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 31–31 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 44–60 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 68–68 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 112–112 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 119–119 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 125–125 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 129–132 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 137–137 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.tsx`: lines 141–144 | Use forwarded field/button refs and one consumed explicit focus intent: open to Keep name, cancel to trigger, staged clear to field. Announce the confirmation purpose with the existing deduplicated helper; ordinary status/data changes never request focus and no action saves implicitly. |
| `apps/mobile/src/features/account/profile-form.test.tsx`: lines 3–3 | Check native focus is requested only for explicit confirmation intents, iOS hears the purpose, and an intervening error status does not steal focus. Existing controlled draft/save/clear tests remain. |
| `apps/mobile/src/features/account/profile-form.test.tsx`: lines 18–39 | Check native focus is requested only for explicit confirmation intents, iOS hears the purpose, and an intervening error status does not steal focus. Existing controlled draft/save/clear tests remain. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 6–6 | Name and announce controlled ongoing feeding without inventing success. Improve percentage, price-badge and hours text contrast while leaving source artwork, values, policy and unavailability gates unchanged. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 30–30 | Name and announce controlled ongoing feeding without inventing success. Improve percentage, price-badge and hours text contrast while leaving source artwork, values, policy and unavailability gates unchanged. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 79–83 | Name and announce controlled ongoing feeding without inventing success. Improve percentage, price-badge and hours text contrast while leaving source artwork, values, policy and unavailability gates unchanged. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 187–187 | Name and announce controlled ongoing feeding without inventing success. Improve percentage, price-badge and hours text contrast while leaving source artwork, values, policy and unavailability gates unchanged. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 215–215 | Name and announce controlled ongoing feeding without inventing success. Improve percentage, price-badge and hours text contrast while leaving source artwork, values, policy and unavailability gates unchanged. |
| `apps/mobile/src/features/home/home-overview.tsx`: lines 254–254 | Name and announce controlled ongoing feeding without inventing success. Improve percentage, price-badge and hours text contrast while leaving source artwork, values, policy and unavailability gates unchanged. |
| `apps/mobile/src/features/home/home-recommendation.tsx`: lines 122–122 | Use the readable badge background for the original small white Quest label; source layout, callbacks, data boundaries and unapproved policy gates remain unchanged. |
| `apps/mobile/src/features/home/home-screen.test.tsx`: lines 97–97 | Expect the new descriptive in-progress Feed name in the existing controlled-busy regression; this still asserts disabled/no-dispatch behavior rather than a completed transaction. |
| `apps/mobile/src/features/protection/protection-status.tsx`: lines 5–5 | Announce current non-checking status title/message on iOS. Checking continues through InlineStatus once; no duplicate native read, focus request, permission prompt or protection claim is added. |
| `apps/mobile/src/features/protection/protection-status.tsx`: lines 27–28 | Announce current non-checking status title/message on iOS. Checking continues through InlineStatus once; no duplicate native read, focus request, permission prompt or protection claim is added. |
| `apps/mobile/src/features/protection/protection-status.test.tsx`: lines 4–4 | Check deduplicated checking/current-state speech through public native APIs and no assistive focus request from a status update; real VoiceOver audibility remains a device gate. |
| `apps/mobile/src/features/protection/protection-status.test.tsx`: lines 60–89 | Check deduplicated checking/current-state speech through public native APIs and no assistive focus request from a status update; real VoiceOver audibility remains a device gate. |
| `apps/mobile/src/infrastructure/query/lifecycle.ts`: lines 15–16 | Stop callback delivery before failed registration/disposal; roll back/reset managers, attempt both cleanup functions and release ownership in finally. Old event owners cannot change the next owner after replacement, and no Auth/native restriction policy changes. |
| `apps/mobile/src/infrastructure/query/lifecycle.ts`: lines 19–24 | Stop callback delivery before failed registration/disposal; roll back/reset managers, attempt both cleanup functions and release ownership in finally. Old event owners cannot change the next owner after replacement, and no Auth/native restriction policy changes. |
| `apps/mobile/src/infrastructure/query/lifecycle.ts`: lines 26–32 | Stop callback delivery before failed registration/disposal; roll back/reset managers, attempt both cleanup functions and release ownership in finally. Old event owners cannot change the next owner after replacement, and no Auth/native restriction policy changes. |
| `apps/mobile/src/infrastructure/query/lifecycle.ts`: lines 39–44 | Stop callback delivery before failed registration/disposal; roll back/reset managers, attempt both cleanup functions and release ownership in finally. Old event owners cannot change the next owner after replacement, and no Auth/native restriction policy changes. |
| `apps/mobile/src/infrastructure/query/lifecycle.ts`: lines 55–61 | Stop callback delivery before failed registration/disposal; roll back/reset managers, attempt both cleanup functions and release ownership in finally. Old event owners cannot change the next owner after replacement, and no Auth/native restriction policy changes. |
| `apps/mobile/src/infrastructure/query/lifecycle.test.ts`: lines 36–88 | Four new portable cases cover disposed-owner callbacks, focus/online registration failures, cleanup exceptions and clean replacement. Keep existing ref-count/SSR/browser event behavior checks. |
| `apps/mobile/src/infrastructure/query/platform-lifecycle.native.ts`: lines 8–8 | Guard native AppState delivery after disposal and make removal idempotent; retain actual AppState focus semantics and the existing network hint/read ordering. |
| `apps/mobile/src/infrastructure/query/platform-lifecycle.native.ts`: lines 10–17 | Guard native AppState delivery after disposal and make removal idempotent; retain actual AppState focus semantics and the existing network hint/read ordering. |
| `apps/mobile/src/infrastructure/query/platform-lifecycle.native.test.ts`: lines 38–42 | Extend native focus cleanup coverage to deliver a late background callback and repeat disposal, proving no post-disposal notification or duplicate listener removal. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Refresh the shared implementation/QA entry point with RN-10 progress and the current RN-11 live dependency boundary. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Refresh the shared implementation/QA entry point with RN-10 progress and the current RN-11 live dependency boundary. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 133–134 | Refresh the shared implementation/QA entry point with RN-10 progress and the current RN-11 live dependency boundary. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record RN-09a actual hash, RN-10 partial/shared acceptance, RN10-D01–D06 and the explicit RN-11 prerequisite audit with owners. Preserve original live acceptance criteria and other unfinished parts. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record RN-09a actual hash, RN-10 partial/shared acceptance, RN10-D01–D06 and the explicit RN-11 prerequisite audit with owners. Preserve original live acceptance criteria and other unfinished parts. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–198 | Record RN-09a actual hash, RN-10 partial/shared acceptance, RN10-D01–D06 and the explicit RN-11 prerequisite audit with owners. Preserve original live acceptance criteria and other unfinished parts. |
| `docs/core_plan/04_react_native_integration.md`: lines 523–545 | Record RN-09a actual hash, RN-10 partial/shared acceptance, RN10-D01–D06 and the explicit RN-11 prerequisite audit with owners. Preserve original live acceptance criteria and other unfinished parts. |
| `docs/core_plan/04_react_native_integration.md`: lines 560–570 | Record RN-09a actual hash, RN-10 partial/shared acceptance, RN10-D01–D06 and the explicit RN-11 prerequisite audit with owners. Preserve original live acceptance criteria and other unfinished parts. |
| `docs/core_plan/README.md`: lines 3–3 | Keep top-level part/acceptance counts honest while reporting RN-10 hardening and linking the RN-11 readiness audit; no placeholder is promoted to an integrated milestone. |
| `docs/core_plan/README.md`: lines 12–12 | Keep top-level part/acceptance counts honest while reporting RN-10 hardening and linking the RN-11 readiness audit; no placeholder is promoted to an integrated milestone. |
| `docs/core_plan/README.md`: lines 115–115 | Keep top-level part/acceptance counts honest while reporting RN-10 hardening and linking the RN-11 readiness audit; no placeholder is promoted to an integrated milestone. |
| `docs/core_plan/README.md`: lines 118–119 | Keep top-level part/acceptance counts honest while reporting RN-10 hardening and linking the RN-11 readiness audit; no placeholder is promoted to an integrated milestone. |
| `apps/mobile/src/components/ui/focus-control.ts`: lines 1–13 | Internal helper uses normal focus then native public sendAccessibilityEvent. Missing/detached targets cannot retry into a different screen or fail the underlying user action; web uses the actual forwarded DOM ref. |
| `apps/mobile/src/components/ui/focus-control.native.test.ts`: lines 1–41 | Four logical cases run under both native presets: focus order, null target, detached normal focus and failed assistive focus. These assert public API requests, not physical screen-reader behavior. |
| `apps/mobile/src/design/contrast.test.ts`: lines 1–32 | Eleven opaque sRGB text/surface cases calculate WCAG relative luminance and enforce at least 4.5:1 for selected actual token pairs. This does not certify alpha backgrounds, every asset, disabled controls or the whole app. |
| `docs/qa/mobile-accessibility.md`: lines 1–97 | Persistent actual-findings/evidence record, W3C references, exact scope, stable device/live gates and the RN-11 readiness table. Distinguish local UI/producers, cloud outputs not present in this checkout, and real integration acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/browser-check.mjs`: lines 1–291 | Reproducible actual-app keyboard/AX-tree, four-width/four-tab/default-or-24px layout/clearance, real profile confirmation/error/draft/reduced-motion/long-name and rendered Home contrast/status checks. Wait for lazy route content, not selected state alone; no synthetic private service is called. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/browser-results.json`: lines 1–1330 | Record 44 successful cases, Chrome version, measured control/footer/contrast values, no page errors/private requests and false native-assistive acceptance. Existing developer examples are explicit and isolated. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/verify-native.mjs`: lines 1–100 | Compare final source contents for both routed application and prepared profile/protection/focus/lifecycle consumers across iOS/Android exports; reject test/dev/private API sources and record actual bundle hashes. It does not sign/link/execute an adapter. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/native-results.json`: lines 1–65 | Actual 13 unique runtime source hashes, four compilation digests/size/source-map counts, zero fixture/private API sources and explicit false live/Auth/device/assistive acceptance flags. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/home-readable-text.png`: binary PNG, 320×901, 40786 bytes | Actual browser capture: readable Home text, expanded-text footer or scrolled long-name profile viewport as named. Developer examples show no real account/device state; these are not native screenshots. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/navigation-320-large-text.png`: binary PNG, 320×568, 34527 bytes | Actual browser capture: readable Home text, expanded-text footer or scrolled long-name profile viewport as named. Developer examples show no real account/device state; these are not native screenshots. |
| `docs/core_plan_implementation_notes/artifacts/rn-10/profile-long-name-320.png`: binary PNG, 320×853, 50849 bytes | Actual browser capture: readable Home text, expanded-text footer or scrolled long-name profile viewport as named. Developer examples show no real account/device state; these are not native screenshots. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current progress, exact prior commit hashes, checks, pending device/live work and the conditional RN-11 decision with an unblocked next task. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 767–767 | Record the actual RN-09a commit in this next normal notes update, preserving its historical file/line evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 904–1038 | Record every RN-10 change, validation, scope/decision and handoff, including why RN-11 cannot yet run. Its self-hash stays honestly pending until the next normal update. |

#### Decisions and observed behavior

- Reused the established primitives, native announcement helper, typed ports, account lifecycle ownership, Router public APIs and original local assets. Applied the React best-practices review to the changed TSX: local/derived state, consumed explicit focus intents, direct imports, no duplicate router/Auth authority/listener store, and no invented producer data. The user explicitly postponed icon-pack rewiring; all asset files/manifest remain unchanged.
- Actual Home text contrasts were 2.02:1 for warm hours/action green, 3.64:1 for white/success green badges and 3.50:1 for success-green percentage/card. Rendered results now measure 6.206:1 (hours), 5.656:1 (percentage) and 5.878:1 (Quest/price white labels). The accessible green is separate from source decorative green. No scoring/mood/Feed/reward policy changes or per-user measurements are introduced.
- Browser evidence found three real keyboard problems: panel DOM order behind bottom navigation, focused tab remount on route-key replacement, and inactive visited panels in keyboard order. Public web top placement plus unchanged bottom styling solves DOM order; stable tab names retain control identity; actual route focus hides inactive panels while keeping their React subtrees. The new Router draft regression proves tab switching preserves unsaved input. Root/Auth route contracts are untouched. A later runner wait was corrected for lazy route content, distinct from the actual focus failures.
- Browser text-only scaling does not necessarily change RN Web fontScale; intrinsic bar wrapping and actual onLayout measurements handle it. Existing native expansion/insets remain. Long profile names exposed a developer host composition problem: a header outside the scroller consumed the available editor height. The same source header now shares one Screen owner with the specimen form, and future Settings must compose it similarly. Source avatar bytes/bounds are unchanged.
- Profile confirmation moves focus only on explicit open/cancel/stage-clear intent and announces the question. The focus helper uses the installed RN 0.88.1 public host API, with no legacy findNodeHandle path or delayed cross-screen retry. Native API calls/queued messages are unit-tested; audible/focus behavior still needs signed devices. Status changes do not steal focus or create success; controlled feeding announces its ongoing state and retains disabled/write gates.
- Lifecycle fixes deactivate each callback generation before rollback/cleanup, attempt both disposers, and always reset ownership/managers. Failed registration or a disposed native AppState callback cannot publish into the next owner. Native restrictions remain independent of JS, cloud, Auth and these query hints. No startup/performance SLA or persisted private cache is invented.
- RN-11 was conditionally requested during this task. Read-only source and actual FastAPI OpenAPI inspection show only /healthz, placeholder mobile sign-in/preview root, absent generated foundation schema/types and no migrations/profile endpoints. The QA readiness table identifies Anisha's Auth/Supabase/root outputs and Ishmum's protected API/DB/profile work. No external cloud state was inferred, no other branch's work was claimed absent, and no fixture was promoted to real M1/M2 evidence. API-01 remains independently unblocked for Ishmum.

#### Actual checks and evidence

| Check | Actual result / limits |
|---|---|
| `npm run check` | Passed workspace types/ESLint, 250 portable cases in 10 files (15 new), 234 component cases in 32 iOS/Android suites (16 new), 18 original SVGs, Ruff and 3 pytest cases. Public native API mocks are not device evidence. |
| `npm run mobile:ui:build` | Passed isolated developer UI; existing nonfatal upstream Expo eval warning remains visible. No SDK/dependency/config workaround was added. |
| `npm run mobile:export` | Passed 16 routes, 32-file preview isolation and original navigation assets. Browser app contains no sample account/transaction/default score or activated native adapter. |
| Browser runner | Passed 44 cases at 280/320/393/430 px and default/24 px text across all four tabs, plus keyboard/Chrome accessibility tree, real confirmation/error/draft/reduced-motion/long-name and four actual contrast pairs. Zero page errors or private /v1 requests. |
| Four native compilations + verify-native.mjs | Full iOS/Android Router/Hermes application exports and direct prepared-consumer JS bundles match all final source-map contents. No test/dev/private API consumer source leaks. Static compilation only; actual sizes/hashes/counts are in native-results.json. |
| RN-11 read-only prerequisite audit | `uv run --project services/api python` inspecting `app.openapi()['paths']` returned only ['/healthz']; foundation.openapi.json and http.generated.ts were absent. No authenticated/profile flow was executed or invented. |
| File/line/link/deferred-ID/evidence/scope audit + `git diff --cached --check` | Performed before local commit; code/notes/plan agree, old evidence stays historical, new captures/hashes are current, unrelated user icon/workspace files remain excluded. |

Reproduce browser checks after building the actual app and isolated preview: serve Vite preview on 8093 with `npm exec --workspace @disconnect/mobile -- vite preview --config dev/vite.config.mts --host 127.0.0.1 --port 8093 --strictPort`; serve actual dist on 8094 with `python3 -m http.server 8094 --bind 127.0.0.1 --directory apps/mobile/dist`. Then run `PLAYWRIGHT_MODULE=<installed Playwright ESM entry> node docs/core_plan_implementation_notes/artifacts/rn-10/browser-check.mjs`. Actual run: existing ephemeral Playwright 1.64.1 / Chrome 156.0.8078.49. Browser accessibility-tree checks are not physical VoiceOver/TalkBack.

[Browser runner/results](artifacts/rn-10/browser-results.json), [320 px enlarged navigation](artifacts/rn-10/navigation-320-large-text.png), [scrolled 80-character profile at enlarged text](artifacts/rn-10/profile-long-name-320.png) and [Home readable text example](artifacts/rn-10/home-readable-text.png) are actual evidence. Profile stress uses 24 px ordinary/48 px heading CSS; the editor retains the full 852 px scroll viewport with its header inside it. A single-line field may scroll its raw value horizontally as expected. No normal native font cap or server name normalization was added.

From apps/mobile, compile the actual app with `npx expo export --platform ios --platform android --output-dir .expo/rn10-native --source-maps`. For prepared consumers, create ignored `.expo/rn10-validation.ts` exporting ProfileForm, ProtectionStatus, attachQueryLifecycle and platformQueryLifecycle from their respective ../src modules (explicit platform-lifecycle.native). Compile each platform with `npx expo export:embed --entry-file .expo/rn10-validation.ts --platform ios --dev false --bundle-output /tmp/hoosh-rn10-consumers/ios.js --sourcemap-output /tmp/hoosh-rn10-consumers/ios.map` and android equivalents. From root run `node docs/core_plan_implementation_notes/artifacts/rn-10/verify-native.mjs`. [The actual four-export report](artifacts/rn-10/native-results.json) records hashes/sizes and false live/device acceptance. The temporary entry is removed; ignored exports stay local. Local task servers are stopped after checks.

#### Remaining acceptance and handoff

RN10-D01–D06 in the original plan and [QA record](../qa/mobile-accessibility.md) remain pending: actual VoiceOver/TalkBack, native keyboard/font/safe-area/SVG, live Auth/profile/root lifecycle, native foreground reconciliation, future screen audits, and device memory/termination/restoration/performance. Existing RN07/08/09 deferred IDs remain unchanged. Portrait configuration is preserved; supported rotation is not expanded. This commit does not claim full mobile accessibility, cloud/database/native enforcement, or M1/M2 integration.

RN-11 remains awaiting its real producers. Next independent work is backend API-01 or the unstarted RN-09b/c/d frontend slices, while Anisha supplies Auth/Supabase/root/iOS. When real producers land, execute RN-05/06, complete RN-07 persistence and run RN-11 with the exact mobile/API/schema/migration/device versions. This is a local RN-10 commit only; no push/main/area merge or automatic native rule/account cleanup.

### RN-09b — Quests presentation

**Hash:** `2bbebad` (recorded during RN-09c).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09bcd-ui`. **Parent:** `9b5fbd0`.
**Status:** Presentation implemented and validated; local commit pending, live/device acceptance deferred.

#### Every changed file and logical change

Ranges refer to this commit; previous entries remain historical. Source SVGs are unchanged original bytes. Pure deletions cite parent ranges. Screenshots use actual dimensions/size.

| File and lines | Change and reason |
|---|---|
| `README.md`: lines 8–8 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/assets/README.md`: lines 45–50 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/assets/icons/quests/pencil.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/manifest.json`: lines 190–201 | Record each new original icon with source node, root bounds, hash/length and original-pack path; existing entries remain unchanged. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/dev/ui/main.tsx`: lines 122–122 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/dev/ui/quests-specimen.tsx`: lines 1–142 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/src/app/(tabs)/quests.tsx`: lines 1–2 | Compose the tab with the actual feature presentation and explicit unavailable inputs; keep route names/root/Auth guards and unsupported live actions unchanged. |
| `apps/mobile/src/app/(tabs)/quests.tsx`: lines 5–5 | Compose the tab with the actual feature presentation and explicit unavailable inputs; keep route names/root/Auth guards and unsupported live actions unchanged. |
| `apps/mobile/src/components/ui/README.md`: lines 152–157 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 19–19 | Extend the shared controlled action with a wrapping caption and meaningful accessible name; preserve default focus, busy/disabled, decorative slots and duplicate-press handling. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 34–34 | Extend the shared controlled action with a wrapping caption and meaningful accessible name; preserve default focus, busy/disabled, decorative slots and duplicate-press handling. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 55–58 | Extend the shared controlled action with a wrapping caption and meaningful accessible name; preserve default focus, busy/disabled, decorative slots and duplicate-press handling. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 105–122 | Extend the shared controlled action with a wrapping caption and meaningful accessible name; preserve default focus, busy/disabled, decorative slots and duplicate-press handling. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 138–139 | Extend the shared controlled action with a wrapping caption and meaningful accessible name; preserve default focus, busy/disabled, decorative slots and duplicate-press handling. |
| `apps/mobile/src/components/ui/design-artwork.tsx`: lines 1–29 | Share fixed original asset bounds, inaccessible decoration and safe image-failure behavior across feature screens instead of duplicate renderers or cross-feature imports. |
| `apps/mobile/src/design/quest-assets.ts`: lines 1–7 | Statically map original local assets with their original source dimensions; reuse exact existing matches and avoid runtime Figma URLs or path/color editing. |
| `apps/mobile/src/features/README.md`: lines 17–21 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/features/home/home-artwork.tsx`: lines 1–2 | Keep Home’s compatibility export while moving the same fixed-bound decorative/failure semantics into the shared DesignArtwork component; no artwork/data behavior is replaced. |
| `apps/mobile/src/features/quests/README.md`: lines 1–34 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/features/quests/quest-card.tsx`: lines 1–89 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/quests/quest-card.tsx`: lines 90–151 | Source typography, colors, insets, card/row hierarchy and flexible minimum targets; wrap/scroll at narrow widths and enlarged fonts without scaling the original SVG roots. |
| `apps/mobile/src/features/quests/quests-model.ts`: lines 1–29 | Define local display-only shapes and explicit unavailable production inputs. Preserve independent states; no endpoint/schema, policy, identity, measurement, persistence or fixture fallback is invented. |
| `apps/mobile/src/features/quests/quests-screen.test.tsx`: lines 1–112 | Behavior regressions cover explicit data/action/state boundaries and absence of fixture fallback; retained existing shared/native tests continue to run. |
| `apps/mobile/src/features/quests/quests-screen.tsx`: lines 1–153 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/quests/quests-screen.tsx`: lines 154–192 | Source typography, colors, insets, card/row hierarchy and flexible minimum targets; wrap/scroll at narrow widths and enlarged fonts without scaling the original SVG roots. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 472–472 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 503–503 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 509–510 | Document RN-09b presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan_implementation_notes/artifacts/check-main-screen.mjs`: lines 1–139 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09b/browser-config.mjs`: lines 1–53 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09b/browser-results.json`: lines 1–274 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09b/figma-example.png`: binary PNG, 393×885, 60181 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09b/large-text-320.png`: binary PNG, 320×901, 56483 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09b/native-results.json`: lines 1–31 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09b/unavailable-320.png`: binary PNG, 320×901, 30098 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs`: lines 1–59 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–24 | Refresh resume state, actual previous hashes, branch, checks and the next sequential increment. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 905–905 | Record RN-10’s known hash during the next normal implementation update, keeping its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1038–1104 | Record this commit’s full change/evidence/decision/handoff entry with an honest pending self-hash. |

#### Decisions, checks and deferred acceptance

Read-only Figma session 26dd22ea-c87c-4b6c-a571-5e74d6eff5e8 inspected full 27:155 context and screenshot. Original 14 px pencil is copied from icon pack/actions / minimal-pencil /minimal-pencil--10498-94.svg; the exact existing check is reused from the identical Figma source asset. QuestsModel separates suggestions and saved records; ready empty, loading, error and unavailable do not borrow samples. Actual route uses unavailableQuests and disabled creation. QuestCard renders category/context, schedule chips and an optional approved restriction notice. Accept/Personalize delegate only the suggestion ID; no saved record, rule, reward or optimistic completion is created. Callback owners hold busy and handle persistence/failures. Create remains an entry intent: no editor/recurrence schema is guessed. Narrow/native large-font actions stack; source artwork sizes stay exact. Reading badge/caption colors retain RN-10 contrast adaptations. Shared DesignArtwork preserves Home’s prior decorative/failure behavior through a compatibility export; Button’s optional caption retains controlled action/focus/accessible naming. No OS status bar is faked and existing floating navigation is reused. Developer examples show simulated notices only. Evidence commands: PLAYWRIGHT_MODULE=<ESM entry> node docs/core_plan_implementation_notes/artifacts/check-main-screen.mjs rn-09b after Vite preview on 8093; from apps/mobile npx expo export --platform ios --platform android --output-dir .expo/rn-09b-native --source-maps, then native verifier from root.

**Actual validation:** npm run check passed: 250 portable, 254 iOS/Android component cases (20 new), 3 pytest; types/ESLint/Ruff, 19 original assets. mobile:ui:build and mobile:export passed (16 routes, 32-file isolation). Shared browser runner rn-09b passed 22 cases including nine states, explicit intent without saved outcomes, original pencil/check bytes and 14/16 px bounds, 393/320/280 px and enlarged text. Both full native Router/Hermes exports match final sources via verify-main-native.mjs rn-09b; fixture/private API graphs excluded. Browser screenshots were visually reviewed.

**Remaining:** RN09B-D01 approved quest/editor/recurrence API and persistence; RN09B-D02 actual Auth/account-scoped producers, mutation serialization and error/uncertain-write recovery; RN09B-D03 approved completion/reward/native restriction semantics; RN09B-D04 signed-device/accessibility acceptance. Existing RN07/08/09/10 gates and RN-11 live dependencies remain pending.

**Next:** Next: implement RN-09c History, followed by RN-09d Settings, as explicitly requested. This task is a local commit only. No push, merge, backend, cloud, native project regeneration/signing or live-data/permission/restriction action occurred. Original user packs/workspace files remain untracked and excluded. Bytecode exports do not certify native device rendering, accessibility or policy outcomes.


### RN-09c — History presentation

**Hash:** `c1c84c3` (recorded during RN-09d; correct the preceding validation count to the actual 284 component tests).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09bcd-ui`. **Parent:** `2bbebad`.
**Status:** Presentation implemented and validated; local commit pending, live/device acceptance deferred.

#### Every changed file and logical change

Ranges refer to this commit; previous entries remain historical. Source SVGs are unchanged original bytes. Pure deletions cite parent ranges. Screenshots use actual dimensions/size.

| File and lines | Change and reason |
|---|---|
| `apps/mobile/assets/README.md`: lines 51–52 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/assets/icons/history/comparison.svg`: lines 1–5 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/history/next.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/history/pagination.svg`: lines 1–5 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/manifest.json`: lines 202–237 | Record each new original icon with source node, root bounds, hash/length and original-pack path; existing entries remain unchanged. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 1–145 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/dev/ui/main.tsx`: lines 124–124 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/src/app/(tabs)/history.tsx`: lines 1–2 | Compose the tab with the actual feature presentation and explicit unavailable inputs; keep route names/root/Auth guards and unsupported live actions unchanged. |
| `apps/mobile/src/app/(tabs)/history.tsx`: lines 5–5 | Compose the tab with the actual feature presentation and explicit unavailable inputs; keep route names/root/Auth guards and unsupported live actions unchanged. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 75–75 | Behavior regressions cover explicit data/action/state boundaries and absence of fixture fallback; retained existing shared/native tests continue to run. |
| `apps/mobile/src/components/ui/README.md`: lines 158–159 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/design/history-assets.ts`: lines 1–9 | Statically map original local assets with their original source dimensions; reuse exact existing matches and avoid runtime Figma URLs or path/color editing. |
| `apps/mobile/src/features/history/README.md`: lines 1–27 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/features/history/history-model.ts`: lines 1–45 | Define local display-only shapes and explicit unavailable production inputs. Preserve independent states; no endpoint/schema, policy, identity, measurement, persistence or fixture fallback is invented. |
| `apps/mobile/src/features/history/history-screen.test.tsx`: lines 1–120 | Behavior regressions cover explicit data/action/state boundaries and absence of fixture fallback; retained existing shared/native tests continue to run. |
| `apps/mobile/src/features/history/history-screen.tsx`: lines 1–214 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/history/history-screen.tsx`: lines 215–312 | Source typography, colors, insets, card/row hierarchy and flexible minimum targets; wrap/scroll at narrow widths and enlarged fonts without scaling the original SVG roots. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 473–473 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 503–503 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 665–666 | Document RN-09c presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan_implementation_notes/artifacts/rn-09c/browser-config.mjs`: lines 1–75 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09c/browser-results.json`: lines 1–193 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09c/figma-example.png`: binary PNG, 393×885, 43938 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09c/large-text-320.png`: binary PNG, 320×901, 55446 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09c/native-results.json`: lines 1–30 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09c/unavailable-320.png`: binary PNG, 320×901, 25088 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `scripts/check-ui-preview-isolation.mjs`: lines 16–21 | Reject new developer example/test markers from real exported app JS/HTML; keep the existing fail-closed export prerequisite and prior guards. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–24 | Refresh resume state, actual previous hashes, branch, checks and the next sequential increment. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 905–905 | Record RN-10’s known hash during the next normal implementation update, keeping its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1105–1162 | Record this commit’s full change/evidence/decision/handoff entry with an honest pending self-hash. |

#### Decisions, checks and deferred acceptance

Figma 27:153 from the already reviewed full context/screenshot in read-only session 26dd22ea-c87c-4b6c-a571-5e74d6eff5e8. HistoryModel is display-only: finite nonnegative values (including valid zero), nonblank display/period/source/coverage, independent read states, and explicit before/now comparison eligibility. Invalid ready inputs are unavailable; the view never derives savings, rewards, percentages or forecasts. Source 40/96/34 typography, dividers and original 20/20/32x8 assets are responsive; evidence captions are a deliberate transparency addition. Next-page affordance is optional and delegates only; actual route has no fake details navigation. Figma numbers exist only in a visibly simulated isolated specimen. Component tests cover unavailable routes, evidence validation, real zero, partial/ineligible states and delegated callbacks; browser checks additionally cover narrow/enlarged layouts and original bytes. Preserve shared lifecycle/nav behavior and update the source heading regression. Includes the six RN09B/RN09C export-isolation markers: b markers were left unstaged in 2bbebad and are now covered by the actual passing guarded export. React best-practices skill checklist applied: pure controlled data, direct imports, bounded state, accessible labels, no unnecessary effects/dependencies.

**Actual validation:** npm run check passed (250 portable, 284 component tests, 3 API tests, types/lint/Ruff and 22 original assets); mobile:ui:build and mobile:export passed; iOS/Android Hermes exports with final source-map equality passed; 23 browser cases passed at 393/320/280 px and enlarged text, original asset byte/bounds checks, no private requests/page errors. No signed-device run.

**Remaining:** RN09C-D01 approved measurement/source/insights contract; D02 real scoped insights/coverage/eligibility/recovery; D03 detail pages 10570:192/193, navigation and PD-12 forecast decision; D04 signed-device/accessibility. Existing deferred work remains pending.

**Next:** Next: implement RN-09d Settings, as explicitly requested. This task is a local commit only. No push, merge, backend, cloud, native project regeneration/signing or live-data/permission/restriction action occurred. Original user packs/workspace files remain untracked and excluded. Bytecode exports do not certify native device rendering, accessibility or policy outcomes.


### RN-09d — Settings presentation and main-screen handoff

**Hash:** `4cf7b30` (recorded during RN-09e).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09bcd-ui`. **Parent:** `c1c84c3`.
**Status:** Presentation implemented and validated; local commit pending, live/device acceptance deferred.

#### Every changed file and logical change

Ranges refer to this commit; previous entries remain historical. Source SVGs are unchanged original bytes. Pure deletions cite parent ranges. Screenshots use actual dimensions/size.

| File and lines | Change and reason |
|---|---|
| `README.md`: lines 8–8 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `README.md`: lines 17–17 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `README.md`: lines 133–134 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/README.md`: lines 17–17 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/assets/README.md`: lines 53–54 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/assets/icons/settings/activities.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/apps.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/calendar.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/chevron.svg`: lines 1–5 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/clock.svg`: lines 1–10 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/gender.svg`: lines 1–10 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/info.svg`: lines 1–10 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/timer.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/icons/settings/user.svg`: lines 1–3 | Copy an unchanged original from the user icon pack (or the recorded Figma context when missing), preserving source node/bounds, bytes and provenance. No previous icon is rewired. |
| `apps/mobile/assets/manifest.json`: lines 238–345 | Record each new original icon with source node, root bounds, hash/length and original-pack path; existing entries remain unchanged. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/dev/ui/main.tsx`: lines 126–126 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 1–176 | Render the real presentation in the separate developer-only gallery, with visibly simulated source examples and local-only interactions; no Auth/API/native service or production fixture mode. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 1–2 | Compose the tab with the actual feature presentation and explicit unavailable inputs; keep route names/root/Auth guards and unsupported live actions unchanged. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 5–5 | Compose the tab with the actual feature presentation and explicit unavailable inputs; keep route names/root/Auth guards and unsupported live actions unchanged. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 104–105 | Behavior regressions cover explicit data/action/state boundaries and absence of fixture fallback; retained existing shared/native tests continue to run. |
| `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 110–110 | Behavior regressions cover explicit data/action/state boundaries and absence of fixture fallback; retained existing shared/native tests continue to run. |
| `apps/mobile/src/components/ui/README.md`: lines 160–161 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 27–27 | Add optional caption styling to the existing controlled Button surface so Settings preserves the source 13 px caption independently from its 15 px title; leave other consumers, focus/busy/disabled and press semantics unchanged. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 43–43 | Add optional caption styling to the existing controlled Button surface so Settings preserves the source 13 px caption independently from its 15 px title; leave other consumers, focus/busy/disabled and press semantics unchanged. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 117–117 | Add optional caption styling to the existing controlled Button surface so Settings preserves the source 13 px caption independently from its 15 px title; leave other consumers, focus/busy/disabled and press semantics unchanged. |
| `apps/mobile/src/design/settings-assets.ts`: lines 1–21 | Statically map original local assets with their original source dimensions; reuse exact existing matches and avoid runtime Figma URLs or path/color editing. |
| `apps/mobile/src/features/README.md`: lines 5–5 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/features/README.md`: lines 22–23 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 15–15 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 31–31 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 41–41 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/account/account-header.tsx`: lines 45–45 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/settings/README.md`: lines 1–48 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `apps/mobile/src/features/settings/settings-model.ts`: lines 1–51 | Define local display-only shapes and explicit unavailable production inputs. Preserve independent states; no endpoint/schema, policy, identity, measurement, persistence or fixture fallback is invented. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 1–83 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 84–138 | Source typography, colors, insets, card/row hierarchy and flexible minimum targets; wrap/scroll at narrow widths and enlarged fonts without scaling the original SVG roots. |
| `apps/mobile/src/features/settings/settings-screen.test.tsx`: lines 1–174 | Behavior regressions cover explicit data/action/state boundaries and absence of fixture fallback; retained existing shared/native tests continue to run. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 1–190 | Implement source-aligned responsive presentation and controlled supported actions using shared primitives, authentic assets and explicit feature states; preserve future producer ownership and honest unavailable behavior. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 191–234 | Source typography, colors, insets, card/row hierarchy and flexible minimum targets; wrap/scroll at narrow widths and enlarged fonts without scaling the original SVG roots. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 7–7 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 336–336 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 474–474 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 503–503 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 666–667 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/README.md`: lines 3–3 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/README.md`: lines 12–12 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan/README.md`: lines 115–115 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/app-navigation-results.json`: lines 1–1145 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/app-settings-320-large.png`: binary PNG, 320×568, 40469 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/browser-config.mjs`: lines 1–141 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/browser-results.json`: lines 1–427 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/check-app-navigation.mjs`: lines 1–163 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/figma-bottom.png`: binary PNG, 393×853, 35825 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/figma-example.png`: binary PNG, 393×885, 52813 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/large-text-320.png`: binary PNG, 320×901, 46803 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/native-results.json`: lines 1–42 | Record/reproduce actual browser or native compilation evidence, including original asset bounds/bytes, source-map equality, responsive/state checks and explicit false live/device acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09d/unavailable-320.png`: binary PNG, 320×901, 46134 bytes | Actual isolated component capture (example, unavailable or enlarged text as named); not native/device or live-account evidence. |
| `docs/qa/mobile-accessibility.md`: lines 8–8 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `docs/qa/mobile-accessibility.md`: lines 98–121 | Document RN-09d presentation progress, provenance, interfaces, actual checks and explicitly remaining work without marking unrelated integration complete. |
| `scripts/check-ui-preview-isolation.mjs`: lines 22–23 | Reject new developer example/test markers from real exported app JS/HTML; keep the existing fail-closed export prerequisite and prior guards. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–24 | Refresh resume state, actual previous hashes, branch, checks and the next sequential increment. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 905–905 | Record RN-10’s known hash during the next normal implementation update, keeping its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1163–1257 | Record this commit’s full change/evidence/decision/handoff entry with an honest pending self-hash. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1107–1107 | Record RN-09c’s actual commit hash during RN-09d; its historical ranges remain unchanged. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1156–1156 | Correct RN-09c’s transcription from 286 to the actual 284 passing component tests, verified from its check log. |

#### Decisions, checks and deferred acceptance

Figma 27:157 from full reviewed context/screenshot in read-only session 26dd22ea-c87c-4b6c-a571-5e74d6eff5e8. SettingsModel/settingsValueLabel distinguish known empty from unavailable/loading/error without defining onboarding, native selection or calendar schemas. SettingsRow renders normal-contrast static source rows unless a ready value and supported owner callback both exist; only those actions show a chevron. Source row icons retain 18 px roots, info 14 px, chevrons 16 px, avatar 52 px; all nine new SVGs are unchanged original-pack copies. Shared Button gains an optional caption style solely to preserve source title/caption typography. SettingsScreen composes source header/account/sections/session explanation, readable error/loading feedback and optional retry in one shared safe-area/keyboard/footer-aware scroll owner. Optional demographics/calendars remain hidden in the actual route; Figma sample values appear only in a visibly simulated developer specimen. AccountHeader explicitly accepts null, suppresses a stale name and signed-in assertion, and preserves verified-identity behavior. Optional ProfileFormProps reuses RN-07 unchanged, keyed additionally by user ID, requiring a supplied identity; the host still owns draft/canonical validation, real account-generation reset and all persistence. Edit-profile/row/retry intents never fabricate saved account, picker/calendar connection, installed plan, restriction or policy. Remove obsolete developer Auth/onboarding links from Settings without changing their routes/root guards; navigation tests now enter Auth explicitly and return to the real Settings header. New component tests cover unknown identity, static/controlled rows, empty/error/loading/partial values, optional sections, profile callback reuse and retry. Actual-app browser checks retain manual keyboard activation, one visible/selected panel, hidden inactive semantics, measured footer clearance and absence of fixtures. Refresh context/index/QA docs; preserve RN-10 historical evidence. Correct RN-09c notes from 286 to the actual 284 component tests and record c1c84c3; b is 2bbebad. React best-practices review applied: pure controlled props, direct imports, no new dependency, unnecessary effect or duplicated domain controller.

**Actual validation:** npm run check passed: 250 portable tests, 308 iOS/Android component tests in 38 suites, 3 API tests, types/lint/Ruff and 31 original assets. mobile:ui:build and mobile:export passed with 32 JS/HTML files isolated from developer examples. iOS/Android Hermes exports passed and final source maps match all three new feature routes, models, components, asset mappings and reused account/profile UI. Settings has 30 browser cases (nine states, ten original asset byte/bounds checks, 393/320/280 px and enlarged text); actual exported app has 36 navigation/direct-link/keyboard/footer cases at 280/320/393/430 px, including 320x568, with no private requests or page errors. No signed-device/live account acceptance.

**Remaining:** RN09D-D01 real RN-05/07 profile/Auth/guard/save integration and reviewed account actions; D02 approved shared onboarding/plan/activity/native-selection editors, revisioned persistence and native reconciliation; D03 demographic/calendar scope and actual provider authorization flows; D04 signed-device/accessibility/keyboard/lifecycle. RN09B-D01–D04, RN09C-D01–D04 and existing RN07/08/09/10 gates remain open; RN-11 still requires actual M1/M2 acceptance.

**Next:** RN-09a/b/c/d presentation is ready for review. Next: coordinate real Auth/root/API/profile prerequisites and approved feature/native contracts, then wire scoped producers and validate on signed devices; do not mark Plan 04 fully complete. This task is a local commit only. No push, merge, backend, cloud, native project regeneration/signing or live-data/permission/restriction action occurred. Original user packs/workspace files remain untracked and excluded. Bytecode exports do not certify native device rendering, accessibility or policy outcomes.


### RN-09e — Quest editor UI and reusable draft controls

**Hash:** `3c9d20d` (recorded in the next UI part).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09-detail-ui`. **Parent:** `4cf7b30`.
**Status:** Independent UI implemented and validated; live persistence/native policy and device acceptance remain pending.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `apps/mobile/assets/icons/questeditor/back.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/calendar.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/check.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/duration.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/interest.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/lock.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/pencil.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/repeat.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/time.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/questeditor/timer.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/manifest.json`: lines 346–465 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/main.tsx`: lines 128–128 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/quest-editor-specimen.tsx`: lines 1–21 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/src/app/(tabs)/quests.tsx`: lines 1–1 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/(tabs)/quests.tsx`: lines 6–6 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/quest/[id].tsx`: lines 1–8 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/quest/new.tsx`: lines 1–20 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 1–1 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 16–16 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 21–21 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 44–44 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 85–85 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 89–90 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/field.tsx`: lines 112–113 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/design/questeditor-assets.ts`: lines 1–23 | Statically import original local assets and retain exact root dimensions at callsites; no runtime Figma URLs. |
| `apps/mobile/src/features/editors/draft-utils.ts`: lines 1–12 | Implement toggleItem, parseTime, formatTime: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 1–105 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/README.md`: lines 35–62 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/quests/quest-draft.ts`: lines 1–24 | Implement questDuration, questDraftIssue, durationLabel: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.test.tsx`: lines 1–34 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 1–80 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quests-screen.test.tsx`: lines 21–21 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quests-screen.test.tsx`: lines 24–24 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `docs/core_plan/04_react_native_integration.md`: lines 476–497 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/personalize.png`: binary PNG, 393×853, 55429 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `scripts/check-ui-preview-isolation.mjs`: lines 24–24 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1257–1320 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

Source frames 10487:126 and 10577:427, full context/screenshots read in Figma session 81abaa02-0cf1-4cd0-b22f-25ecb77f4a7f. Implement raw controlled title/activity, editable time/duration/repeat/weekday draft, explicit overnight, required/invalid validation, separate confirmed cancellation intent and dirty-exit flow. Saving/conflict/unconfirmed/unavailable outcomes never fabricate success. Add reusable accessible Choice/EditorPage/EditorActions/TimeControl and pure date-free draft utilities; extend Field with decorative pencil slot. The real custom route is blank and has no save callback; existing-record route stays unavailable. Use public SDK usePreventRemove for dirty route removal/unload, in addition to explicit Back confirmation; do not copy deprecated private navigation APIs. No Auth/API/native producer or policy was invented. Original assets retain exact roots; source static phone chrome remains OS-owned; weekday targets are enlarged and selected chips use source action green. Read the plan e/f/g/h execution inventory: all eleven detail frames were reviewed before coding. Record 4cf7b30 from the previous increment. React best-practices checklist applied for controlled state, direct imports, accessibility and no duplicated domain authority.

**Actual validation:** Workspace typecheck/lint and web export passed (41 original assets, fixture-isolation guard); targeted iOS/Android quest/editor/navigation component suite passed 66 tests in 8 suites; developer Vite build passed and actual Personalize screenshot visually inspected. Final full regression/native exports and broader browser evidence follow in RN-09h.

**Remaining / next:** Continue RN-09f preference editors, then RN-09g shared plan editors and RN-09h History details/navigation/whole-UI verification. Existing integration/device gates remain pending.

No push/merge, Supabase/API/database/native permission/restriction action or signed-device run occurred. Compilation/browser checks do not certify physical-device accessibility or native protection.


### RN-09f — Preference detail and inline gender UI

**Hash:** `d0206b4` (recorded in the next UI part).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09-detail-ui`. **Parent:** `3c9d20d`.
**Status:** Independent UI implemented and validated; live persistence/native policy and device acceptance remain pending.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `apps/mobile/assets/icons/preference/arts.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/back.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/checked.svg`: lines 1–5 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/cooking.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/custom.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/gym.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/instagram.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/move.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/music.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/radio.svg`: lines 1–5 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/reading.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/search.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/snapchat.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/spotify.svg`: lines 1–4 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/summaryCheck.svg`: lines 1–5 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/tiktok.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/walking.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/whatsapp.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/preference/youtube.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/manifest.json`: lines 466–693 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/main.tsx`: lines 130–130 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/preference-specimen.tsx`: lines 1–26 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 16–16 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/src/app/quest/new.tsx`: old lines 3–3 at `3c9d20d` | Remove superseded placeholder/wording while preserving real integration prerequisites. |
| `apps/mobile/src/app/quest/new.tsx`: lines 6–6 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/quest/new.tsx`: old lines 10–11 at `3c9d20d` | Remove superseded placeholder/wording while preserving real integration prerequisites. |
| `apps/mobile/src/app/quest/new.tsx`: lines 10–11 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/quest/new.tsx`: lines 13–13 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 1–20 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/design/preference-assets.ts`: lines 1–43 | Statically import original local assets and retain exact root dimensions at callsites; no runtime Figma URLs. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 3–3 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 15–15 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 17–17 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 25–26 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 32–33 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 43–43 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 56–57 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 61–61 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 63–64 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 66–67 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/use-route-draft-guard.tsx`: lines 1–13 | Implement useRouteDraftGuard: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/README.md`: lines 1–32 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 1–39 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 1–97 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 1–1 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 21–21 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 33–33 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 43–43 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 54–54 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 60–60 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 65–65 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 70–70 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 81–81 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 84–85 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 1–1 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 24–24 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 32–32 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 105–105 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 132–132 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 140–140 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 151–151 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `docs/core_plan/04_react_native_integration.md`: lines 486–486 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/check-detail-ui.mjs`: lines 1–51 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/activities.png`: binary PNG, 393×853, 35487 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/age.png`: binary PNG, 393×853, 25698 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/apps.png`: binary PNG, 393×853, 39661 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/browser-results.json`: lines 1–511 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/gender.png`: binary PNG, 393×853, 37701 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/large-text-320.png`: binary PNG, 320×853, 48737 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/long-text.png`: binary PNG, 393×853, 54161 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09f/native-unavailable.png`: binary PNG, 393×853, 28054 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `scripts/check-ui-preview-isolation.mjs`: lines 25–25 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1259–1259 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1321–1421 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

Reviewed full original contexts/screenshots for age 10601:5908, activities 10601:6057, apps 10601:5968 and gender 10601:6146. Age/Gender choices and optional null are supplied rather than inventing collection/range policy. Source age wheel is an accessible bounded radio list; selection text separates 44 px number and 13 px years-old suffix. Activities support multi-select/custom text preservation and blank-custom validation. Catalog search preserves all selected IDs across filters; a separate native handoff has no synthetic catalog/tokens/success. Source examples remain solely in developer UI. Add exact preference arrow/check slots to shared page/action controls and a controlled inline-editor slot to Settings/rows, including rotated original chevron and source expanded borders. Refactor the real quest/preference dirty-route guard through one public usePreventRemove wrapper; no duplicated auth or draft persistence authority. Real detail routes use unavailable inputs and no saves. Original pack files are preferred; missing node filenames use curl on exact context-provided originals, with recorded node/hash/root provenance. No runtime temporary URLs. Persistent labels, optional demographic clearing, enlarged touch targets and accessible contrast are intentional source adaptations. Reuse the developer Settings example for source inline composition without duplicating runtime fixtures. Record preceding 3c9d20d via the normal notes update.

**Actual validation:** Workspace typecheck/lint, Vite developer build and web export passed (60 original SVGs; 38 app JS/HTML files isolated); 52 targeted iOS/Android component tests in 6 suites passed. Browser runner passed 13 state/responsive/enlarged-text cases and verified 30 distinct visible original assets against root sizes/served bytes. Activities and Age actual captures visually inspected. Full regression/native build acceptance follows in RN-09h.

**Remaining / next:** Continue RN-09g shared days/hours/sessions editors, then RN-09h History details/navigation and complete UI verification. Actual permitted choices, native picker, shared schemas, guarded persistence and signed-device validation remain deferred.

No push/merge, Supabase/API/database/native permission/restriction action or signed-device run occurred. Compilation/browser checks do not certify physical-device accessibility or native protection.


### RN-09g — Shared inline plan editor UI

**Hash:** `b319d75` (recorded in the next UI part).
**Date:** 2026-10-30. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09-detail-ui`. **Parent:** `d0206b4`.
**Status:** Independent UI implemented and validated; live persistence/native policy and device acceptance remain pending.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `apps/mobile/assets/icons/planeditor/minus.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/planeditor/plus.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/planeditor/range.svg`: lines 1–9 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/manifest.json`: lines 694–729 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/main.tsx`: lines 132–132 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/plan-editor-specimen.tsx`: lines 1–22 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 1–1 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 13–15 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 21–21 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/design/planeditor-assets.ts`: lines 1–9 | Statically import original local assets and retain exact root dimensions at callsites; no runtime Figma URLs. |
| `apps/mobile/src/features/plans/README.md`: lines 1–29 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 1–34 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 1–74 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 1–57 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `docs/core_plan/04_react_native_integration.md`: lines 487–487 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/check-detail-ui.mjs`: lines 27–27 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/check-detail-ui.mjs`: lines 37–40 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/browser-results.json`: lines 1–503 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/days-editor.png`: binary PNG, 393×853, 42870 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/days.png`: binary PNG, 393×853, 43806 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/hours-editor.png`: binary PNG, 393×853, 39780 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/hours.png`: binary PNG, 393×853, 39780 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/large-text-320.png`: binary PNG, 320×853, 46231 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/long-text.png`: binary PNG, 393×853, 42598 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/save-error.png`: binary PNG, 393×853, 43849 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/saving.png`: binary PNG, 393×853, 38768 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/sessions-editor.png`: binary PNG, 393×853, 39038 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/sessions.png`: binary PNG, 393×853, 39038 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09g/unavailable.png`: binary PNG, 393×853, 44587 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `scripts/check-ui-preview-isolation.mjs`: lines 26–26 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1259–1259 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1323–1323 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1422–1481 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

Implement reviewed inline frames 10601:6315/6513/6690, sharing controlled components through Settings inlineEditor for future AUTH-12 reuse. Day presets/individual selection, editable 24-hour times and explicit overnight validation, accessible adjustable and keyboard/drag range handles, caller-bounded session steppers and planned count-times-minutes caption are local draft behavior only. Invalid/missing bounds disable actions; unknown session counts remain em dashes. No backend schema, hardcoded production allowance bounds, scheduler, timezone/DST policy or native install outcome is inferred. Preserve original 321x42 range SVG exactly at 09:00–22:00 when source-width space permits; it is the reference render of a dynamic control, so other values/narrow widths use functional native track/handles rather than displaying a false fixed interval. Original plus/minus retain 16 px roots; targets enlarge to 44 px. The actual direct detail pages use empty/unavailable values and no saves; dirty edits use the shared public navigation guard. Component tests cover presets, bounds/unknowns, clamping, budget wording, overnight and assistive range actions. Developer source example and bounds stay outside runtime routes. Extend browser evidence to wait for onLayout and capture scrolled editor regions, fixing the initial missed range check before final evidence; no asset geometry was scaled. Record d0206b4 from RN-09f.

**Actual validation:** Workspace typecheck/lint and Vite developer build passed; 46 targeted iOS/Android component tests in 6 suites passed. Web export passed with 63 original SVGs and isolated developer examples. Browser runner passed 14 source/state/responsive/enlarged-text cases with 16 distinct original asset byte/root checks, including the 321x42 range graphic; Hours editor capture visually inspected. Final comprehensive interaction/regression/native exports follow in RN-09h.

**Remaining / next:** Continue RN-09h History progress/reduction pages, real tab/detail navigation, complete source inventory and final verification. Approved plan schema, actual persistence/install reconciliation, Auth scope and signed-device validation remain pending.

No push/merge, Supabase/API/database/native permission/restriction action or signed-device run occurred. Compilation/browser checks do not certify physical-device accessibility or native protection.


### RN-09h — History details, navigation and RN-09 UI closure

**Hash:** `f67a8ea` (recorded during RN-10 icon/device follow-up).
**Date:** 2026-10-31. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09-detail-ui`. **Parent:** `b319d75`.
**Status:** Independent UI implemented and validated; live persistence/native policy and device acceptance remain pending.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `README.md`: lines 135–136 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/README.md`: lines 32–33 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/assets/icons/historydetail/back.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/freedCircle.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/freedLegend.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/next.svg`: lines 1–5 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/progressDots.svg`: lines 1–5 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/reclaimedDots.svg`: lines 1–5 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/remainingCircle.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/historydetail/remainingLegend.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/manifest.json`: lines 729–825 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/dev/ui/history-detail-specimen.tsx`: lines 1–17 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/main.tsx`: lines 15–15 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/dev/ui/main.tsx`: lines 134–134 | Exercise the real component in the separate developer gallery with clearly simulated examples and local-only edits; no sample account/data enters actual routes. |
| `apps/mobile/src/app/(tabs)/history.tsx`: lines 1–1 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/(tabs)/history.tsx`: lines 3–3 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/(tabs)/history.tsx`: lines 5–5 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 1–1 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: old lines 3–3 at `b319d75` | Remove superseded placeholder/wording while preserving real integration prerequisites. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 5–18 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/quest/[id].tsx`: lines 5–14 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/quest/new.tsx`: lines 11–29 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 1–6 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 10–15 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 22–26 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 29–33 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 35–99 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 28–29 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 46–47 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/components/ui/button-surface.tsx`: lines 74–74 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `apps/mobile/src/design/historydetail-assets.ts`: lines 1–19 | Statically import original local assets and retain exact root dimensions at callsites; no runtime Figma URLs. |
| `apps/mobile/src/features/editors/draft-utils.ts`: lines 1–9 | Implement toggleItem, parseTime, formatTime: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/draft-utils.ts`: lines 15–16 | Implement toggleItem, parseTime, formatTime: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/draft-utils.ts`: lines 19–22 | Implement toggleItem, parseTime, formatTime: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 3–11 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 23–46 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 50–93 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 95–110 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 113–150 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 152–158 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 160–171 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 173–189 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 193–235 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 238–248 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 250–276 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 282–289 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 294–305 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 308–324 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 329–334 | Implement Choice, EditorActions, LeaveConfirmation, EditorPage, TimeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/editors/use-route-draft-guard.tsx`: lines 10–23 | Implement useRouteDraftGuard: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/history/README.md`: lines 28–46 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/history/history-details-model.ts`: lines 1–26 | Implement usableHistoryDetail: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/history/history-details.test.tsx`: lines 1–102 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/history/history-details.tsx`: lines 1–278 | Implement HistoryDetails: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/history/history-experience.tsx`: lines 1–31 | Implement HistoryExperience: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/history/history-screen.test.tsx`: lines 31–31 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/history/history-screen.test.tsx`: lines 37–37 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/home/README.md`: lines 7–7 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 4–9 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 13–15 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 18–19 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 22–31 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 33–34 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 38–45 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 47–54 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 58–59 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.test.tsx`: lines 61–63 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 7–15 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 18–37 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 39–80 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 83–89 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 91–140 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 145–151 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 154–160 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 162–170 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 173–203 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 205–217 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 219–249 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 258–300 | Implement DaysEditor, HoursEditor, SessionsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 1–1 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 11–20 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 24–61 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 63–76 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 78–79 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 81–83 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 86–94 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 96–148 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 152–159 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/plans/time-range-control.tsx`: lines 161–176 | Implement minutesTime, TimeRangeControl: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 2–8 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 11–18 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 22–36 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 40–56 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 58–64 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 67–78 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 80–83 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 86–101 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.test.tsx`: lines 104–117 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 10–17 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 19–36 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 38–63 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 66–140 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 142–150 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 152–177 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 179–194 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 197–238 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 240–246 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 249–255 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 257–261 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 264–362 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 365–380 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 383–396 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 403–409 | Implement AgeEditor, GenderEditor, ActivitiesEditor, AppsEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/README.md`: lines 10–10 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/quests/quest-draft.ts`: lines 4–10 | Implement questDuration, questDraftIssue, durationLabel: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-draft.ts`: lines 12–20 | Implement questDuration, questDraftIssue, durationLabel: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-draft.ts`: lines 22–23 | Implement questDuration, questDraftIssue, durationLabel: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-draft.ts`: lines 30–31 | Implement questDuration, questDraftIssue, durationLabel: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-draft.ts`: lines 37–44 | Implement questDuration, questDraftIssue, durationLabel: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.test.tsx`: lines 4–12 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quest-editor.test.tsx`: lines 21–31 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quest-editor.test.tsx`: lines 37–58 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quest-editor.test.tsx`: lines 60–81 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quest-editor.test.tsx`: lines 84–99 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 8–18 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 22–32 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 34–46 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 48–272 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 275–279 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 282–287 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 290–302 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 306–314 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 318–324 | Implement QuestEditor: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/README.md`: lines 49–56 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 18–19 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 32–32 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 45–45 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-row.tsx`: lines 52–52 | Implement SettingsRow: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.test.tsx`: lines 23–23 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/settings/settings-screen.test.tsx`: lines 30–30 | Verify real draft/state/action boundaries, validation and absence of invented saved or measured outcomes on both iOS/Android component projects. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 20–20 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 30–30 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 117–117 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 124–124 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 133–133 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 141–141 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 152–152 | Implement SettingsScreen: controlled local presentation and supported intents, preserving explicit availability, accessible wrapping controls and source hierarchy. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 135–136 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 473–473 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 485–485 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 488–488 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 525–534 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 696–701 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/README.md`: lines 3–3 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/README.md`: lines 120–121 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/check-detail-ui.mjs`: lines 32–32 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/blank.png`: binary PNG, 393×853, 37658 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/browser-results.json`: lines 1–503 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/conflict.png`: binary PNG, 393×853, 59026 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/custom.png`: binary PNG, 393×853, 48653 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/edit.png`: binary PNG, 393×853, 47939 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/large-text-320.png`: binary PNG, 320×853, 55245 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/long-text.png`: binary PNG, 393×853, 56311 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/save-error.png`: binary PNG, 393×853, 59522 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/saving.png`: binary PNG, 393×853, 55079 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/unavailable.png`: binary PNG, 393×853, 58484 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09e/unconfirmed.png`: binary PNG, 393×853, 59745 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/app-navigation-results.json`: lines 1–1145 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/app-settings-320-large.png`: binary PNG, 320×568, 35742 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/browser-config.mjs`: lines 1–28 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/browser-results.json`: lines 1–243 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/check-app-navigation.mjs`: lines 1–163 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/check-interactions.mjs`: lines 1–32 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/ineligible.png`: binary PNG, 393×853, 19459 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/interaction-results.json`: lines 1–16 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/large-text-320.png`: binary PNG, 320×853, 54230 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/loading.png`: binary PNG, 393×853, 18611 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/long-text.png`: binary PNG, 393×853, 55603 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/native-results.json`: lines 1–52 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/progress.png`: binary PNG, 393×853, 58642 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/read-error.png`: binary PNG, 393×853, 20064 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/reduction.png`: binary PNG, 393×853, 45985 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/unavailable.png`: binary PNG, 393×853, 19459 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-09h/zero-baseline.png`: binary PNG, 393×853, 19459 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs`: lines 8–8 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/qa/mobile-accessibility.md`: lines 122–123 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/qa/rn09-ui-coverage.md`: lines 1–108 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `scripts/check-ui-preview-isolation.mjs`: lines 27–28 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1259–1259 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1323–1323 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1424–1424 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1482–1704 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

Complete reviewed progress frame 10570:192 and reduction/reclaimed frame 10570:193. Independently supplied week/month readings require eligibility, positive baseline, non-increasing usage, period/source/coverage and finite reduction within 0–100; missing/ineligible/error data never selects samples or zero. Producer owns narrative and saved hours; UI does not infer savings or future lifespan. Source ten-circle diagram is dynamic using unchanged individual green/tan ellipse child assets from full child contexts 10577:407/421; clipped partial buckets preserve original root geometry. Replace unapproved PD-12 gender/lifespan forecast with supplied period saved hours/evidence. HistoryExperience retains existing tab shell and tracks only local page/period state, with summary/progress/reclaimed/back navigation and no monthly fallback. Settings onOpen is an explicit navigation-only entry separate from ready-only onEdit: actual unavailable values can open local detail UI while all real saves/native choice remain disabled. Add optional selected/expanded semantics to shared ButtonSurface without overriding busy/disabled guards. Finalize readable formatting solely for this task’s new editors/routes/tests; Field/shared behavior remains covered by full regression. Keep one stable imperative RN pan responder per range handle and update its current options outside render; test keyboard and drag, with no ref access during render or duplicated native policy. Browser drag checks explicitly scroll the handle into view before mouse input; do not interpret an off-viewport synthetic drag as native acceptance. Correct the RN-09g route trailing whitespace flagged before its commit; final diff check is clean. Record source inventory/entry points/adaptations/remaining gates in the QA coverage document and synchronize plan/context/feature READMEs. Add final native source-map and complete browser evidence; copy the unchanged app navigation runner into RN-09h and preserve RN-09d historical captures. New originals come from the icon pack or exact MCP downloads with node/hash metadata; no SVG roots/paths/colors are rewritten. Record b319d75 from the preceding increment; all code remains local, no dependency/native/Auth/backend changes.

**Actual validation:** Final npm run check passed: 250 portable mobile tests, 356 iOS/Android component tests across 46 suites, 3 API tests, workspace types/lint/Ruff and 71 original SVGs. Vite gallery build and web export/fixture exclusion passed. iOS/Android Hermes exports passed; verify-main-native rn-09h confirms final source-map equality for all new runtime sources and excludes tests/dev fixtures/private API consumers. Browser e/f/g/h state/layout cases: 17/13/14/15 at 393/320/280 px plus enlarged text; original asset bytes/root geometry checked (0.02 px tolerance for browser subpixel rounding of fractional ellipse roots). Nine browser interaction flows and 36 real-app tab/keyboard/direct-link/footer checks passed. Actual source captures visually inspected; git diff whitespace check passed. One initial full run hit an existing Home test timeout; full rerun passed without modifying that test or its timeout. Signed-device acceptance not run.

**Remaining / next:** RN-09a–h independent UI/local-interaction scope is complete and ready for review. Real Auth/account-generation wiring, approved feature/plan contracts, database/API persistence, native-authorized selection/enforcement, measured outcomes and signed-device/accessibility acceptance remain under existing deferred IDs. Calendar provider scope, PD-12 forecast and explicitly postponed wholesale icon rewiring remain excluded. Plan 04 overall is not complete; do not rebuild these UI screens when their producers arrive.

No push/merge, Supabase/API/database/native permission/restriction action or signed-device run occurred. Compilation/browser checks do not certify physical-device accessibility or native protection.


### RN-10a — Original icon-pack refresh

**Hash:** `ab7d855` (recorded in the next UI part).
**Date:** 2026-10-31. **Owner:** Ishmum. **Branch:** `task/react-native/rn-10-android-icons`. **Parent:** `f67a8ea`.
**Status:** Independent UI implemented and validated; live persistence/native policy and device acceptance remain pending.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `apps/mobile/assets/README.md`: lines 5–5 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/assets/README.md`: lines 9–10 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/assets/README.md`: lines 33–33 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/assets/README.md`: lines 55–85 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/assets/account/settings-avatar.svg`: lines 1–10 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/home/heart.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/home/heart.svg`: lines 6–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/home/streak-dots.svg`: lines 1–8 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/history-active.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/history-active.svg`: lines 6–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/history-inactive.svg`: lines 1–3 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/history-inactive.svg`: lines 6–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/home-active.svg`: lines 1–2 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/home-inactive.svg`: lines 1–2 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/quests-active.svg`: lines 1–2 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/quests-inactive.svg`: lines 1–2 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/settings-active.svg`: lines 1–2 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/icons/navigation/settings-inactive.svg`: lines 1–2 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/manifest.json`: lines 9–16 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 21–28 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 36–40 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 48–52 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 60–64 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 72–76 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 84–88 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 96–100 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 108–112 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 120–124 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 132–136 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 144–148 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 156–160 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 168–169 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 171–173 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 203–204 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 206–208 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 216–217 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 219–221 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 233–234 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 246–247 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 259–260 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 272–273 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 285–286 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 298–299 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 311–312 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 324–325 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 337–338 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 350–351 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 363–364 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 376–377 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 389–390 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 402–403 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 415–416 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 428–429 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 441–442 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 454–455 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 467–468 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 480–481 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 493–494 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 506–507 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 519–520 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 532–533 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 545–546 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 558–559 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 571–572 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 596–597 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 609–610 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 622–623 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 635–636 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 648–649 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 661–662 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 674–675 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 687–688 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 700–701 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 713–714 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 726–727 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 739–740 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 752–753 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 777–778 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 790–791 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 815–816 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 828–829 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/manifest.json`: lines 853–854 | Record original asset nodes, roots, byte hashes/lengths and pack paths; reuse exact existing originals. |
| `apps/mobile/assets/mascot/dino-doing-okay.svg`: lines 1–9 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/dino-feeling-low.svg`: lines 1–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/dino-feeling-low.svg`: lines 9–11 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/dino-happy.svg`: lines 1–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/dino-happy.svg`: lines 9–12 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/dino-needs-care.svg`: lines 1–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/dino-needs-care.svg`: lines 9–12 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/home-dino-happy.svg`: lines 1–6 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/assets/mascot/home-dino-happy.svg`: lines 9–12 | Copy the unchanged original Figma SVG from the user pack; preserve source roots, colors, bytes and manifest provenance. |
| `apps/mobile/src/components/navigation/README.md`: lines 53–53 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/components/navigation/README.md`: lines 116–117 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/design/navigation-assets.ts`: lines 15–16 | Statically import original local assets and retain exact root dimensions at callsites; no runtime Figma URLs. |
| `apps/mobile/src/design/navigation-assets.ts`: lines 18–19 | Statically import original local assets and retain exact root dimensions at callsites; no runtime Figma URLs. |
| `docs/core_plan/04_react_native_integration.md`: lines 560–560 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 702–703 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/rn-10a/browser-results.json`: lines 1–123 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10a/check-icons.mjs`: lines 1–33 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10a/home-originals.png`: binary PNG, 393×853, 45125 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10a/icon-pack-audit.json`: lines 1–860 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10a/pack-gallery.png`: binary PNG, 1052×344, 35127 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `scripts/check-design-assets.mjs`: lines 12–12 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `scripts/check-design-assets.mjs`: lines 22–27 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `scripts/check-design-assets.mjs`: lines 51–51 | Implement the independent UI/provenance/evidence/route handoff described below, preserving existing ownership and live-data boundaries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1259–1259 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1323–1323 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1424–1424 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1484–1484 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1705–1848 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

User authorized the deferred icon work. Full fresh Home22:4/Quests27:155/Settings27:157/mood88:96 contexts/screenshots read in Figma session39610fcb-dd2b-4c4a-b841-92d7d363408a. Audit all71 tracked originals against210 SVGs in the supplied pack. Copy all61 same-node matches byte-for-byte; 16 earlier capture bytes change, including eight nav variants, Dino variants, Settings avatar, Home heart/streak and Home happy duplicate. Preserve original SVG roots/paths/colors; Home renders original21x21 in the existing18px layout slot with -1.5 offsets. No control target/name/selected-state or actual score/auth/native behavior changes. Preserve all literal Figma emoji/text glyphs, confirmed in source; do not replace them with unrelated line icons. Ten originals without matching source-node pack names remain unchanged Figma-context originals, not placeholders. Manifest now records source pack paths, roots/hashes and copy date. Optional --pack validation checks real source bytes when the user pack exists; default CI remains independent of untracked source folders. The audit retains prior hashes/dimensions and provenance; historical captures remain in Git. Browser audit fixed its own avatar selector to inspect the actual nested HTML image rather than its Expo wrapper. New temporary Android Platform Tools37.0.1 checks device availability only; no device was initially present. Exact Google tooling download is outside repo, no system PATH/global project changes. Record f67a8ea from the previous increment. No whole source pack or user workspace file is committed.

**Actual validation:** Before native QA fixture extraction, npm run check passed (250 portable, 356 native-component, 3 API tests, types/lint/Ruff), web export passed with 71 original SVGs, and Vite preview built. Explicit --pack check confirms 61 exact original-pack copies. Browser audit verifies served bytes/effective root geometry for 17 visible navigation/mascot/Home/avatar assets at 393/320/280 px, with original-gallery/Home captures visually inspected. Native physical-device acceptance has not run; ADB lists zero devices.

**Remaining / next:** Continue RN-10b isolated native QA/polish. USB device setup question is pending; actual Android font/keyboard/Back/SVG/TalkBack/lifecycle evidence must be observed on an authorized device, not inferred from browser/bundle checks. Live Auth/native-policy gates remain separate.

No push/merge, Supabase/API/database/native permission/restriction action or signed-device run occurred. Compilation/browser checks do not certify physical-device accessibility or native protection.


### RN-10b — Native Android QA preparation and confirmation polish

**Hash:** `704bc49` (recorded in the next UI part).
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/react-native/rn-10-android-icons`. **Parent:** `ab7d855`.
**Status:** Independent UI implemented and validated; live persistence/native policy and device acceptance remain pending.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `README.md`: lines 76–87 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/README.md`: lines 34–41 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/dev/native/App.tsx`: lines 1–65 | Import actual feature components, existing fonts, typed local models and original asset registries; no Auth/API/native service producer. |
| `apps/mobile/dev/native/App.tsx`: lines 66–89 | Define the 19 QA destinations and six scenario controls using literal unions. |
| `apps/mobile/dev/native/App.tsx`: lines 90–111 | Load existing Space Grotesk weights and mount safe-area/status/footer contexts for the separate native entry. |
| `apps/mobile/dev/native/App.tsx`: lines 112–182 | QaHost owns page/scenario/reset and explicit UI-only notices; keyed remount resets samples and measured footer height reserves scroll clearance. |
| `apps/mobile/dev/native/App.tsx`: lines 183–240 | QaScreen owns controlled quest/activity/profile/preference/plan drafts and maps scenarios to existing availability/busy contracts. |
| `apps/mobile/dev/native/App.tsx`: lines 241–334 | Render actual Home/Quests/History/detail/quest components with shared source examples or explicit missing readings; monthly data never falls back to weekly. |
| `apps/mobile/dev/native/App.tsx`: lines 335–440 | Compose age/activity/app/gender/day/hour/session editors with local callbacks, original logos and no installed-app or policy inference. |
| `apps/mobile/dev/native/App.tsx`: lines 441–474 | Reuse Settings inline layout and ProfileForm/AccountHeader with synthetic QA identity; no production route or saved result is created. |
| `apps/mobile/dev/native/App.tsx`: lines 475–519 | Inventory original icons, all Dino moods and navigation variants at original roots; horizontally scroll wide assets. |
| `apps/mobile/dev/native/App.tsx`: lines 520–550 | Style the isolated QA footer/menu/assets using existing tokens, wrapping labels and minimum-size controls. |
| `apps/mobile/dev/native/README.md`: lines 1–92 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/dev/native/app.config.ts`: lines 1–10 | Define a separate portrait/light Expo Go project identity; no native application identifiers, signing or plugin regeneration. |
| `apps/mobile/dev/native/index.tsx`: lines 1–3 | Register the isolated QA root with Expo without importing Router or changing the actual application entry. |
| `apps/mobile/dev/native/metro.config.cjs`: lines 1–11 | Use Expo defaults plus repository watch/root node_modules paths so shared-source edits and newly created files refresh in the nested QA app; declare the CommonJS dirname global for lint. |
| `apps/mobile/dev/native/package.json`: lines 1–11 | Declare the private Expo Go entry and already installed SDK/React/RN versions; no nested install, added workspace or lockfile. |
| `apps/mobile/dev/native/tsconfig.json`: lines 1–7 | Extend mobile strict types, resolve shared aliases relative to the nested project and include shared sample/SVG declarations. |
| `apps/mobile/dev/shared/ui-samples.ts`: lines 1–122 | Extract the unchanged typed Home/Quests/Settings/History/detail examples and ready/metric helpers for both QA entries; retain existing fixture markers. |
| `apps/mobile/dev/ui/history-detail-specimen.tsx`: lines 1–1 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-detail-specimen.tsx`: lines 5–6 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-detail-specimen.tsx`: lines 8–84 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 1–1 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 5–5 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: old lines 10–33 at `ab7d855` | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 50–50 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 60–60 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 70–70 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 81–81 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 97–97 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/history-specimen.tsx`: lines 100–100 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/home-specimen.tsx`: lines 1–1 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/home-specimen.tsx`: old lines 8–33 at `ab7d855` | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/quests-specimen.tsx`: lines 1–1 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/quests-specimen.tsx`: old lines 7–33 at `ab7d855` | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 1–1 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: old lines 7–7 at `ab7d855` | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 12–13 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 77–77 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 82–95 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 106–106 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 122–122 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 131–131 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/dev/ui/settings-specimen.tsx`: lines 135–135 | Import the shared source sample/helpers instead of duplicating them; retain existing web example/state behavior and format touched presentation for readability. Re-export example for existing plan/preference specimens. |
| `apps/mobile/package.json`: lines 52–52 | Extend existing lint coverage to the native QA and shared sample directories. |
| `apps/mobile/src/features/editors/confirmation-dialog.test.tsx`: lines 1–65 | Verify request-close never discards, show dismisses keyboard before requesting focus, and busy cancellation cannot repeat while Keep remains enabled, on both native component projects. |
| `apps/mobile/src/features/editors/confirmation-dialog.tsx`: lines 1–67 | Add the native Modal with its own safe-area context, keyboard dismissal/show-time safe focus, nondestructive request-close, disabled repeat cancellation, scrollable wrapping and capped card width. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 1–1 | Replace the inline LeaveConfirmation and its old announcement effect with the shared modal, preserving labels/callbacks and EditorPage focus-return behavior; other controls are unchanged. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 3–3 | Replace the inline LeaveConfirmation and its old announcement effect with the shared modal, preserving labels/callbacks and EditorPage focus-return behavior; other controls are unchanged. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: old lines 159–162 at `ab7d855` | Replace the inline LeaveConfirmation and its old announcement effect with the shared modal, preserving labels/callbacks and EditorPage focus-return behavior; other controls are unchanged. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 161–167 | Replace the inline LeaveConfirmation and its old announcement effect with the shared modal, preserving labels/callbacks and EditorPage focus-return behavior; other controls are unchanged. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 1–3 | Replace inline quest cancellation with shared ConfirmationDialog; retain busy cancellation guard and restore safe trigger focus on Keep through a typed ref. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 53–53 | Replace inline quest cancellation with shared ConfirmationDialog; retain busy cancellation guard and restore safe trigger focus on Keep through a typed ref. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 251–251 | Replace inline quest cancellation with shared ConfirmationDialog; retain busy cancellation guard and restore safe trigger focus on Keep through a typed ref. |
| `apps/mobile/src/features/quests/quest-editor.tsx`: lines 259–272 | Replace inline quest cancellation with shared ConfirmationDialog; retain busy cancellation guard and restore safe trigger focus on Keep through a typed ref. |
| `docs/core_plan/04_react_native_integration.md`: lines 531–532 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 563–564 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 572–572 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 704–714 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/README.md`: lines 1–68 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/browser-config.mjs`: lines 1–2 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/check-confirmations.mjs`: lines 1–78 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/check-interactions.mjs`: lines 1–135 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/check-qa-bundles.mjs`: lines 1–29 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/confirmation-280-large.png`: binary PNG, 280×480, 25750 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/confirmation-280.png`: binary PNG, 280×480, 26673 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/confirmation-393-large.png`: binary PNG, 393×480, 26570 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/confirmation-393.png`: binary PNG, 393×480, 25987 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/confirmation-results.json`: lines 1–52 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/device-status.json`: lines 1–14 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/interaction-results.json`: lines 1–16 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/native-results.json`: lines 1–53 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/qa-bundle-results.json`: lines 1–22 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/quest-draft-retained.png`: binary PNG, 1050×1000, 75627 bytes | Actual browser capture of the indicated source-aligned component or state; no account/device outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10b/verification-results.json`: lines 1–42 | Record/reproduce observed browser/build evidence with explicit false native-device/live-service acceptance. |
| `docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs`: lines 8–9 | Accept RN-10b exact-runtime verification and reject any project-local dev source in actual iOS/Android source maps while allowing SDK devtools. |
| `docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs`: lines 44–46 | Accept RN-10b exact-runtime verification and reject any project-local dev source in actual iOS/Android source maps while allowing SDK devtools. |
| `docs/qa/mobile-accessibility.md`: lines 73–73 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/qa/mobile-accessibility.md`: lines 124–157 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `package.json`: lines 28–29 | Add mobile:qa:android to start the separate Expo Go project over LAN on port 8090. |
| `scripts/check-ui-preview-isolation.mjs`: lines 29–30 | Reject both new native QA markers in ordinary app exports alongside existing specimen markers. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1259–1259 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1323–1323 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1424–1424 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1484–1484 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1707–1707 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1841–1962 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

- Requirements: Plan 04 RN-10, NFR-008/009/011 and AC-12. Preserve RN-09 Figma presentations and RN-10a original-pack provenance. Prior Figma frame checks and RN-10a captures remain the design references; this part adds no invented product design or policy.
- `ConfirmationDialog` uses the public React Native Modal with its own SafeAreaProvider, a scrollable safe-area overlay and a capped, wrapping card. A browser test initially found inherited off-screen specimen insets expanding padding beyond the viewport; the modal-specific provider fixes the coordinate boundary. Android request-close calls Keep, never Discard. On modal show, dismiss the IME and explicitly focus the safe action. iOS announcement uses the existing shared helper; native speech still requires observation. There is no timer, replay or private native API.
- `LeaveConfirmation` now composes that dialog, so EditorPage and Router removal guards share safe presentation without changing their dirty-state contracts. Quest cancellation uses it too, restores trigger focus on Keep and retains its busy disable guard via `discardDisabled`. The focused tests cover request-close safety, show-time keyboard/focus and blocked repeat cancellation. The actual modal hardware Back, IME and spoken focus must still be tested on a phone.
- `dev/native` is an isolated Expo Go project, not another installed workspace or app route. Its own registration/config/tsconfig and Metro root watch/dependency paths allow live shared-source edits and new files. An initial iOS request exposed missing outside-project file watching; the explicit config and restart yielded HTTP 200 for both platforms. Dependencies come from the existing root install; no new lockfile, native project, signing identity or iOS target was generated.
- The native QA root loads existing Space Grotesk fonts and safe-area/footer metrics. Its menu selects 19 real component presentations. Its Ready/Loading/Error/Unavailable/Busy/Long text scenarios only supply controlled local models/drafts. Unsupported readings stay unavailable; callbacks produce an explicit intent notice, never saved/earned/installed/connected success. Changing a scenario/reset intentionally remounts local drafts. QA Screens/Reset are test controls, not proof of real app navigation or lifecycle persistence.
- `dev/shared/ui-samples.ts` extracts unchanged Home/Quests/Settings/History/detail source examples and helpers from the web gallery. Existing consumers retain labels, fields and sample markers. This removes duplicate web/native sample definitions while production routes remain unavailable. The asset inventory statically imports tracked originals and scrolls wide artwork horizontally without changing roots or selecting a production Dino outcome.
- Ordinary app isolation checks reject the new QA markers; native verification rejects the entire project-local dev tree, with an RN-10b exact-source runtime list. Shared SDK devtools are not falsely treated as application fixtures. Browser/native/build results identify their actual boundary and explicitly deny device/live acceptance.
- Browser flows exercise overnight quest validation, retained draft, app search/selection, custom activity validation, day/hour/session controls, missing monthly history and real unavailable detail routes. Confirmation checks cover 393/320/280 px, 480 px height, normal/24 px browser text, visible minimum-size actions, safe initial/return focus and Escape. Captures were visually inspected; they are browser images, not phone screenshots.
- The runbook documents Expo Go launch, optional authorized USB setup, source samples, state/reset semantics, required separate real Router tab/hardware Back run and the remaining TalkBack/font/IME/SVG/lifecycle observations. Do not toggle permissions, erase app data or claim actual protection as part of UI QA. Restore any device font settings after future checks.
- Ownership stays unchanged: Ishmum shared UI/Android/backend; Anisha Auth/onboarding/iOS. Real Auth/API/root/native integration is still deferred. User packs/workspace files are excluded from staging; existing local original assets already make pack-free CI reproducible.

**Actual validation:** `npm run check` passed TypeScript/ESLint, 250 portable tests, 362 component tests in iOS/Android projects, original asset integrity, Ruff and 3 API tests. Final nested Metro config lint and QA-specific TypeScript passed separately. `mobile:ui:build` passed; `mobile:export` passed 38 file isolation and 71 original SVG checks; `mobile:check-assets -- --pack` verified 61 exact copies. Final real-app iOS/Android Hermes exports/source maps match current runtime sources and exclude all project-local dev/test/private API consumer sources. QA Android/iOS Metro bundles served HTTP 200 with their explicit QA marker. Nine browser interaction flows and seven narrow/large-text confirmation checks passed without page errors/private API requests. No physical device was detected; no phone acceptance is claimed.

**Remaining / next:** Connect an authorized Android phone (USB debugging accepted), follow `apps/mobile/dev/native/README.md`, and append actual model/OS/build/font/steps/results and redacted captures. RN10-D01/D02/D06 and native D05 remain pending; RN10-D03/D04 require real producers. No phone was detected by adb on 2026-11-01. RN-10a icons are complete at `ab7d855`. No push/merge requested.

No push/merge, Supabase/API/database/native permission/restriction action or signed-device run occurred. Compilation/browser checks do not certify physical-device accessibility or native protection.


### RN-10c — Physical Android UI QA and rendering fixes

**Hash:** Pending; resolve by `fix(mobile): polish weekday reflow and native tab backgrounds`.
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/react-native/rn-10-android-icons`. **Parent:** `704bc49`.
**Status:** Physical Android Expo Go scope executed; both found UI defects fixed and retested. Remaining platform/live/signed-build acceptance is explicitly open.

#### Every changed file and logical change

Ranges refer to this commit. Deletions cite parent ranges; binary captures have dimensions. Existing historical entries remain valid for their own commits.

| File and lines | Change and reason |
|---|---|
| `README.md`: lines 86–87 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/README.md`: lines 40–41 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/dev/native/README.md`: lines 89–101 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `apps/mobile/src/components/navigation/main-tab-bar.tsx`: lines 201–209 | Initialize pill background with the existing dark bar color so selected color changes retain rounded native rendering; preserve target sizes, labels, routing and original SVG geometry. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 6–6 | Read native system fontScale and increase compact choice minimum width above 1.3, allowing existing weekday rows to wrap complete labels; normal 1.15 behavior and selection/validation contracts remain unchanged. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 51–51 | Read native system fontScale and increase compact choice minimum width above 1.3, allowing existing weekday rows to wrap complete labels; normal 1.15 behavior and selection/validation contracts remain unchanged. |
| `apps/mobile/src/features/editors/editor-controls.tsx`: lines 66–66 | Read native system fontScale and increase compact choice minimum width above 1.3, allowing existing weekday rows to wrap complete labels; normal 1.15 behavior and selection/validation contracts remain unchanged. |
| `docs/core_plan/04_react_native_integration.md`: lines 197–197 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 569–569 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 572–572 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan/04_react_native_integration.md`: lines 715–737 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/README.md`: lines 1–102 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/activities-baseline.png`: binary PNG, 1344×2697, 192552 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/activities-font-2-bottom.png`: binary PNG, 1344×2697, 216482 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/activities-keyboard.png`: binary PNG, 1344×2697, 213790 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-history-font-2-bottom.png`: binary PNG, 1344×2697, 174578 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-history.png`: binary PNG, 1344×2697, 117398 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-home-font-2-bottom.png`: binary PNG, 1344×2697, 299317 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-home.png`: binary PNG, 1344×2697, 221363 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-quests-font-2-bottom.png`: binary PNG, 1344×2697, 206987 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-quests.png`: binary PNG, 1344×2697, 136060 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-route-hardware-back.png`: binary PNG, 1344×2697, 186790 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-settings-font-2-bottom.png`: binary PNG, 1344×2697, 304739 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-settings-font-2.png`: binary PNG, 1344×2697, 242226 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/actual-settings.png`: binary PNG, 1344×2697, 210473 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/age-baseline.png`: binary PNG, 1344×2697, 152713 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/apps-baseline.png`: binary PNG, 1344×2697, 214303 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/apps-font-2-bottom.png`: binary PNG, 1344×2697, 228103 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/browser-config.mjs`: lines 1–2 | Reuse the prior exact-source runtime list and include changed MainTabBar for final iOS/Android source-map verification. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/capture-audit.json`: lines 1–368 | Record hashes/dimensions for all 44 inspected cropped phone PNGs and the actual square-before/rounded-after selected-pill pixel measurements. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/check-captures.py`: lines 1–41 | Reproduce native pill corner geometry comparison and validate all committed phone capture dimensions/hashes using optional Pillow; fail if the demonstrated regression remains. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/custom-quest-baseline.png`: binary PNG, 1344×2697, 235406 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/edit-quest-baseline.png`: binary PNG, 1344×2697, 230718 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/gender-baseline-clean.png`: binary PNG, 1344×2697, 178835 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/history-baseline.png`: binary PNG, 1344×2697, 209338 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/home-baseline.png`: binary PNG, 1344×2697, 237297 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/home-error.png`: binary PNG, 1344×2697, 184755 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/home-final.png`: binary PNG, 1344×2697, 237297 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/home-font-2.png`: binary PNG, 1344×2697, 213776 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/home-long-text.png`: binary PNG, 1344×2697, 248491 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/hours-native-drag.png`: binary PNG, 1344×2697, 231039 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/native-results.json`: lines 1–54 | Record separate final iOS/Android Hermes bytes/source hashes and zero project-local dev/private consumers; exported bundles themselves were not installed on the phone. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/native-selection-baseline.png`: binary PNG, 1344×2697, 158408 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/original-assets-scroll-6.png`: binary PNG, 1344×2697, 147558 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/personalize-baseline.png`: binary PNG, 1344×2697, 259586 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/phone-results.json`: lines 1–306 | Record actual device/build/font context, 19 baseline and 11 large-text destinations, native actions/retests, fixed failures, restored settings, compile checks and remaining acceptance; no serial or personal notification content. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/profile-baseline.png`: binary PNG, 1344×2697, 174728 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/profile-font-2-bottom.png`: binary PNG, 1344×2697, 246513 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/progress-baseline.png`: binary PNG, 1344×2697, 298587 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/progress-font-2-bottom.png`: binary PNG, 1344×2697, 299580 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/quest-discard-prompt.png`: binary PNG, 1344×2697, 240840 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/quest-keyboard.png`: binary PNG, 1344×2697, 226469 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/quest-modal-font-2.png`: binary PNG, 1344×2697, 256133 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/quest-weekdays-after.png`: binary PNG, 1344×2697, 250355 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/quest-weekdays-before.png`: binary PNG, 1344×2697, 249392 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/quests-baseline.png`: binary PNG, 1344×2697, 277906 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/sessions-native-stepper.png`: binary PNG, 1344×2697, 231982 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/settings-baseline.png`: binary PNG, 1344×2697, 209100 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/settings-font-2-bottom.png`: binary PNG, 1344×2697, 266286 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/tab-pill-after.png`: binary PNG, 1344×2697, 212874 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/rn-10c/time-reclaimed-baseline.png`: binary PNG, 1344×2697, 244500 bytes | Actual inspected Pixel 8 Pro Expo Go capture, cropped to app content; filename identifies normal/large-font/state or before/after evidence. Synthetic QA data is distinct from unavailable actual routes; no signed-build/live outcome is implied. |
| `docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs`: lines 8–9 | Allow RN-10c evidence output while retaining exact runtime-source matching and project-local fixture/private-consumer exclusion. |
| `docs/qa/mobile-accessibility.md`: lines 70–70 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/qa/mobile-accessibility.md`: lines 73–73 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/qa/mobile-accessibility.md`: lines 149–150 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/qa/mobile-accessibility.md`: lines 158–199 | Synchronize scope, current progress, UI-only adapters, source provenance, remaining integration/device gates and handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–25 | Refresh current branch, UI scope, actual checks and next handoff. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1164–1164 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1259–1259 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1323–1323 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1424–1424 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1484–1484 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1707–1707 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1843–1843 | Record the known preceding commit hash during a normal notes update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1963–2073 | Record this full file/line change table, decisions, actual validation and remaining work in the code commit. |

#### Decisions and boundaries

- Requirements: Plan 04 RN-10, NFR-008/009/011 and AC-12. The user explicitly authorized direct USB testing after enabling debugging. Read the existing native QA runbook and RN-10b checkpoint; preserve the current branch, original assets, native project identity and untracked user packs/workspace.
- Real environment: Pixel 8 Pro, Android 16/API 36, Expo Go 58.0.5, 1344×2992 pixels, density 480. Initial font scale 1.15 and USB stay-awake 0 were recorded before changes. No device serial is stored. Use ADB reverse ports 8090/8081 to load separate QA and ordinary Router experiences. Device observations are not mock/component/browser evidence and are not signed standalone native integration acceptance.
- Found compact quest weekday labels split into individual letters at font scale 2.0. `Choice` now reads public `useWindowDimensions` and grows compact minimum width above 1.3; the existing flex-wrap row distributes complete labels over two rows. Normal 1.15 appearance stays unchanged. Actual seven-label/two-row checks, deselection/reselection and before/after phone captures verify the fix; no day mapping, validation or persistence rule changed.
- Found selected main-tab pills became square after switches, although initial Home was rounded. Initialize every pill background with the existing dark bar color before selection changes it to green. This retains native background initialization without remounting controls, replacing assets or changing navigation. The native Settings before/after captures have the same 377 px middle width; 10 px below the top changes from 377 to 325 px. `check-captures.py` asserts square-before/rounded-after against actual screenshots. Actual four-tab passes at both font scales retain selected semantics; large text expands labeled navigation rows.
- Phone baseline: all 19 QA destinations opened and were inspected, including source branded logos and four Dino moods. Eleven representative pages were checked at font 2.0, with scrolling and lower-content captures. These are sampled views, not exhaustive checks of every state on every page. Only explicitly synthetic source values appear in the QA project; actual Router values remained unavailable.
- Physical actions: typed a local quest name with software IME; header Back at font 2.0 opened the reachable modal and dismissed IME. Android Back in the prompt preserved the typed draft in QA and the actual Router; explicit discard returned to the appropriate menu/Quests route. The ordinary hardware route-removal path was exercised separately from QA component Back.
- A late custom Activities field scrolled into view above the IME while typing. Native hours-handle drag changed the local start from 9:00 AM to 1:22 PM; incrementing session count updated the local budget to 45 minutes. Home cycled Loading/Error/Unavailable/Busy/Long text/Ready. These remain local UI states and callbacks, not actual saves, measured usage, earned rewards, installed policies or permission operations.
- A stale HMR connection registered the ordinary Router entry against the nested QA root and stopped the local Metro server. Restarted Metro and cold-opened Expo Go between projects, then the interrupted retests passed. This is documented as a development-tool failure. No framework upgrade, dependency change, native regeneration or data wipe was used. Cold-opening Expo Go is test setup, not released-app process-death/offline acceptance.
- The phone auto-locked; requested and received the owner's unlock before continuing. UI inspection stops at a locked device. Later temporary USB stay-awake avoided timeouts and was restored in cleanup. Font scale was restored to 1.15, stay-awake to 0, and the unchanged 30-second screen timeout was read back. QA Home Ready was the final foreground experience; ordinary auto-lock stays enabled.
- Only inspected owned-app PNGs are committed, cropped to remove status/notification icons and system navigation. No app pixels were repainted or resized. A notification-overlaid capture was excluded and retaken. A gray Tools gear belongs to Expo Go. Raw UI XML/personal notifications are not evidence; account/email values visible in the selected QA captures are the existing fictional source sample. The capture audit records dimensions/hashes and the native corner regression; it requires Pillow only for artifact inspection.
- Keep static compile evidence distinct: `native-results.json` reports final Hermes source-map matches but those generated exports were not installed. `phone-results.json` records actual Expo Go execution and outstanding scope. Source map verification now accepts RN-10c and explicitly includes the changed navigation component along with the inherited editor runtime list.
- No extra implementation-mirroring component test was added for a small reversible layout change: actual failing/passing native captures and observable selection/geometry checks cover the discovered regressions; the existing full iOS/Android component and portable/API suites passed after both changes.
- RN10-D02/D05 now have partial actual Android evidence. RN10-D01 requires observed TalkBack/VoiceOver speech/traversal; D03/D04 need real Auth/API/native producers; D06 still needs standalone-build lifecycle/offline/low-memory and measured responsiveness. iOS, additional devices/sizes, hardware keyboard and exhaustive feature-state matrices remain pending. Anisha retains Auth/onboarding/iOS; Ishmum shared UI/Android/backend. No native permission, restriction, cloud/database or released iOS identity changed.

**Actual validation:** `npm run check` passed TypeScript/ESLint, 250 portable tests, 362 iOS/Android component tests, asset integrity, Ruff and 3 API tests after both fixes. `mobile:export` passed 38-file isolation and 71 original assets. Final iOS/Android Hermes exact-source checks include both changed shared components and exclude project-local dev/test/private API consumers. Physical Pixel 8 Pro / Android 16 / Expo Go 58.0.5: 19 QA pages at font 1.15, 11 representative pages at 2.0, actual four Router tabs at both scales, typed drafts/IME/header and hardware Back/discard, weekday two-row/selection retest, rounded tab native pixel audit, hours drag, session increment and six Home scenarios. Capture audit passed 44 inspected phone crops. Font 1.15, stay-awake 0 and screen timeout 30000 confirmed at handoff. This does not complete TalkBack/iOS/standalone/live/native-policy acceptance.

**Remaining / next:** Review actual RN-10c phone evidence and continue live backend/Auth/native prerequisites independently. TalkBack/VoiceOver speech/traversal, iOS, other devices, signed standalone builds and full lifecycle/state acceptance remain open; see Plan 04 D01–D06. Both observed UI failures are fixed and physically retested. User settings restored; QA Home Ready left available. No push/merge requested.

No push/merge, Supabase/API/database/native permission/restriction or signed standalone integration occurred. Actual Expo Go phone observations are recorded separately from compile/browser results; TalkBack/native protection and other platform gates remain open.


### Entry template

Use the following structure for future commits, including corrective commits.

```markdown
### RN-01 — <commit purpose>

**Commit:** Pending / <actual implementation commit hash>
**Commit message:** <actual message>
**Date:** <date>
**Status:** <in progress, implemented but uncommitted, or committed; remaining acceptance if any>
**Plan scope:** Plan 04, RN-01 — <specific work covered by this commit>

**Changes:**

| File and lines at this commit | What changed | Why / relationship |
|---|---|---|
| `apps/mobile/src/components/ui/example.tsx`: lines 25–59 | <brief description> | <purpose, consumer, or edge case addressed> |
| `<another changed file>`: lines <start>–<end> | <brief description> | <purpose> |

**Decisions and deviations:**
- <choice and rationale; relevant shared contract or dependency>

**Validation:**
- `<exact command>` — <actual result and relevant test coverage>
- <visual/device evidence, or explicitly not run>

**Remaining / unverified:**
- <specific unfinished acceptance, blocker, or limitation>

**Handoff and next step:**
- <what another part/Anisha can now consume and the next concrete task>
```

### RN-07 wiring — Revisioned profile consumer and acceptance

**Commit message:** `feat(mobile): wire revisioned profile editing through account scopes`.
**Hash:** `f32e87c` (recorded during the next normal planning update). **Date:** 2026-11-02. **Owner:** Ishmum.
**Branch:** `task/react-native/rn-07-profile-wiring`. **Parent:** `f201d0c`.

**Scope and decisions:** Reuse the original RN-07 controlled UI and RN-03/04 transports/scopes. PRD account/profile requirements (FR-009/034 and NFR-008/011); existing Settings frame `27:157` and profile card `10562:136` remain the visual source, with no new design/assets/native policy. Only display_name is writable. The server owns normalization; the consumer validates returned data but never JS-trims input or turns whitespace into null. Clean views derive canonical state; dirty/error drafts preserve their original revision. Save is pessimistic, and its success revision must equal the submitted revision plus one. Conflict/uncertain responses require a latest GET followed by an explicit keep/discard decision; neither decision writes automatically. Failed reconciliation preserves the blocked draft. No durable storage or write queue is introduced.

**Ownership and product boundary:** The actual Settings route consumes Anisha's provider when present; no Auth/session producer, onboarding completion, demographic schema or native protection behavior is installed in the application root. The context exposes the existing controller for deliberate recovery, without adding an Auth subscription. The separate developer Expo project verifies operator tokens through the API and exercises the same consumer, but is not mobile Auth SDK acceptance. QA markers are excluded from the real app export.

**Validation actually run:** `npm run check` passes 273 portable mobile tests, 384 Android/iOS component tests, 473 deterministic API tests, TypeScript, ESLint, asset integrity, Ruff and generated contract checks. `npm run api:db:test` initially failed because its local disposable fixture was stopped; `npm run api:db:up` then `npm run api:db:test` passed all 104 PostgreSQL checks, including storage-only cascade/isolation. The task-started fixture was stopped with `npm run api:db:down` after tests, without deleting its volume. `npm run mobile:export` passes 38-file QA isolation and 71 original SVG assets. `git diff --check` passes. Formatter: pinned ephemeral Prettier 3.6.2, single quotes/100 columns; no dependency was added.

**Test-driven corrections:** Wrong-owner profile responses now quarantine the previous form rather than removing an observed query and causing an automatic reload. Reconciliation failures expose one deliberate retry action. Connectivity subscribes to the existing online manager so Save disables immediately. API save decoding rejects impossible revisions as potentially committed failures; test mocks return genuine revision increments. These checks exercise failures/races rather than mirror JSX structure.

**Physical evidence and limits:** Pixel 8 Pro / Android 16 connected through authorized adb. The isolated Expo Go project compiled and loaded; secure token entry and safe 401 copy were exercised. Initial A/B host verification passed, and no native profile write occurred. Native attempts returned INVALID_TOKEN; later host verification reported TOKEN_EXPIRED for the saved token. Native input was not proven byte-identical, so no native expired-token-specific result or successful native credential verification is claimed. User explicitly deferred fresh tokens/authenticated phone testing. The device disconnected before final phone cleanup; task-owned API/Metro were stopped, no phone settings changed, and USB mappings were session-local. iOS, standalone builds, keyboard/assistive/profile/restart journeys remain unverified. No managed Auth/schema/profile mutation occurred; A/B remain intact.

**Lifecycle deferral:** User selected a separate disposable C, then explicitly left hosted deletion acceptance pending. The C runbook protects A/B and requires supported provider deletion plus a still-unexpired-token check; local SQL cascade checks are separate evidence. The current login helper only accepts A/B and must be extended/preservation-tested before C is introduced. No admin secret was requested or stored, and no account was deleted. The existing ignored private A/B token inputs, certificates and baseline snapshot are excluded from Git.

**Handoff:** Mount the real Auth/root/guard and account-actions composition with Anisha, refresh A/B through the existing login flow, then execute the native QA runbook and actual application M1/M2 journeys. Resume C lifecycle only when explicitly ready. Full RN-07, API-10 and Plans 03/04 remain OPEN; current part counts stay 19 implemented producers / 25 awaiting full acceptance. No push/merge requested. User icon/workspace files remain excluded.

#### File and line record for this commit

| File / exact lines | Change and reason |
|---|---|
| `apps/mobile/dev/profile/README.md`: lines 1–39 | Document API/USB/Expo setup, secure operator-token handling, real revision/conflict/lost-response journeys, safe restoration and limits relative to Auth SDK acceptance. |
| `apps/mobile/dev/profile/app.config.ts`: lines 1–10 | Declare a separate developer Expo identity without modifying the real app or native targets. |
| `apps/mobile/dev/profile/app/_layout.tsx`: lines 1–48 | Load real fonts, account and native query lifecycle providers around the isolated Router; reject non-development use and let provider unmount retire scopes. |
| `apps/mobile/dev/profile/app/index.tsx`: lines 1–80 | Secure token entry, bounded safe error copy, QA connect/disconnect and one-shot loss controls. Clear input after connection attempts and keep controls outside the production graph. |
| `apps/mobile/dev/profile/app/profile.tsx`: lines 1–13 | Compose the real Settings/ProfileSurface under the verified QA account provider, with truthful unavailable non-profile product settings. |
| `apps/mobile/dev/profile/index.ts`: lines 1–1 | Load Expo Router through a local entry so Metro resolves the hoisted dependency correctly. |
| `apps/mobile/dev/profile/metro.config.cjs`: lines 1–8 | Resolve repository modules for the separate QA project; no production import registration. |
| `apps/mobile/dev/profile/package.json`: lines 1–12 | Use an isolated non-workspace Expo Router entry with existing root dependencies; no credential or install-time secret. |
| `apps/mobile/dev/profile/runtime.tsx`: lines 1–8 | Verify a supplied operator token at real /v1/me, provide an in-memory developer credential port, and offer one deliberate lost-PATCH-response fault. Never persist/refresh credentials or claim this is the Auth SDK. |
| `apps/mobile/dev/profile/runtime.tsx`: lines 9–63 | Verify a supplied operator token at real /v1/me, provide an in-memory developer credential port, and offer one deliberate lost-PATCH-response fault. Never persist/refresh credentials or claim this is the Auth SDK. |
| `apps/mobile/dev/profile/runtime.tsx`: lines 64–64 | Verify a supplied operator token at real /v1/me, provide an in-memory developer credential port, and offer one deliberate lost-PATCH-response fault. Never persist/refresh credentials or claim this is the Auth SDK. |
| `apps/mobile/dev/profile/tsconfig.json`: lines 1–7 | Type-check the nested QA project against shared aliases and asset declarations. |
| `apps/mobile/package.json`: lines 52–52 | Include the separate profile QA project in ESLint; no dependency or release entry change. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 4–5 | Mount the live ProfileSurface only when the existing private account provider has a scope. Without Auth composition, retain neutral unavailable Settings. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 7–7 | Mount the live ProfileSurface only when the existing private account provider has a scope. Without Auth composition, retain neutral unavailable Settings. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 13–13 | Mount the live ProfileSurface only when the existing private account provider has a scope. Without Auth composition, retain neutral unavailable Settings. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 1–1 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 3–13 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 28–28 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 34–35 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 60–60 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 62–82 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/PROFILE_UI.md`: lines 84–90 | Replace the stale UI-only current checkpoint with consumer semantics, Auth-owner handoff and explicit remaining acceptance; preserve the original preview history. |
| `apps/mobile/src/features/account/README.md`: lines 6–7 | Explain conditional Settings integration and the isolated operator-token harness without claiming RN-05/Auth SDK completion. |
| `apps/mobile/src/features/account/README.md`: lines 93–103 | Explain conditional Settings integration and the isolated operator-token harness without claiming RN-05/Auth SDK completion. |
| `apps/mobile/src/features/account/api.test.ts`: lines 4–4 | Exercise the real HTTP client for missing-row GET, approved raw PATCH fields, canonical results, impossible success revision and conflict metadata without write replay; original identity cases remain. |
| `apps/mobile/src/features/account/api.test.ts`: lines 11–11 | Exercise the real HTTP client for missing-row GET, approved raw PATCH fields, canonical results, impossible success revision and conflict metadata without write replay; original identity cases remain. |
| `apps/mobile/src/features/account/api.test.ts`: lines 60–117 | Exercise the real HTTP client for missing-row GET, approved raw PATCH fields, canonical results, impossible success revision and conflict metadata without write replay; original identity cases remain. |
| `apps/mobile/src/features/account/api.ts`: lines 1–7 | Use generated profile types, scoped GET/PATCH signals, runtime same-owner decoding and exact expected-revision-plus-one validation. Preserve raw input/null intent and treat impossible success as uncertain. |
| `apps/mobile/src/features/account/api.ts`: lines 10–10 | Use generated profile types, scoped GET/PATCH signals, runtime same-owner decoding and exact expected-revision-plus-one validation. Preserve raw input/null intent and treat impossible success as uncertain. |
| `apps/mobile/src/features/account/api.ts`: lines 14–29 | Use generated profile types, scoped GET/PATCH signals, runtime same-owner decoding and exact expected-revision-plus-one validation. Preserve raw input/null intent and treat impossible success as uncertain. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 1–102 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 103–117 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 118–139 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 140–168 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 169–181 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 182–199 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 200–217 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 218–248 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 249–274 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 275–291 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.test.tsx`: lines 292–303 | Use synthetic test-only Auth/API ports to exercise real consumer hooks, decoders and scoped state across saves, failures, refreshes, ownership and offline transitions; no fixtures are installed in the app. |
| `apps/mobile/src/features/account/profile-surface.tsx`: lines 1–14 | Compose verified account header, profile form, deliberate account recovery, dirty removal guard, safe read errors and explicit latest-profile review choices without writing automatically. |
| `apps/mobile/src/features/account/profile-surface.tsx`: lines 15–113 | Compose verified account header, profile form, deliberate account recovery, dirty removal guard, safe read errors and explicit latest-profile review choices without writing automatically. |
| `apps/mobile/src/features/account/profile-surface.tsx`: lines 114–118 | Compose verified account header, profile form, deliberate account recovery, dirty removal guard, safe read errors and explicit latest-profile review choices without writing automatically. |
| `apps/mobile/src/features/account/use-profile-editor.ts`: lines 1–32 | Own volatile raw drafts independently of canonical query data, preserve dirty base revisions, map server validation, block offline/duplicate/ambiguous saves, and scope manual latest-read/review resolution to the current mounted account. |
| `apps/mobile/src/features/account/use-profile-editor.ts`: lines 33–49 | Own volatile raw drafts independently of canonical query data, preserve dirty base revisions, map server validation, block offline/duplicate/ambiguous saves, and scope manual latest-read/review resolution to the current mounted account. |
| `apps/mobile/src/features/account/use-profile-editor.ts`: lines 50–99 | Own volatile raw drafts independently of canonical query data, preserve dirty base revisions, map server validation, block offline/duplicate/ambiguous saves, and scope manual latest-read/review resolution to the current mounted account. |
| `apps/mobile/src/features/account/use-profile-editor.ts`: lines 100–139 | Own volatile raw drafts independently of canonical query data, preserve dirty base revisions, map server validation, block offline/duplicate/ambiguous saves, and scope manual latest-read/review resolution to the current mounted account. |
| `apps/mobile/src/features/account/use-profile-editor.ts`: lines 140–189 | Own volatile raw drafts independently of canonical query data, preserve dirty base revisions, map server validation, block offline/duplicate/ambiguous saves, and scope manual latest-read/review resolution to the current mounted account. |
| `apps/mobile/src/features/account/use-profile-editor.ts`: lines 190–193 | Own volatile raw drafts independently of canonical query data, preserve dirty base revisions, map server validation, block offline/duplicate/ambiguous saves, and scope manual latest-read/review resolution to the current mounted account. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 25–26 | Accept a host-supplied account region so the live header/editor reuse one Settings scroll owner; keep existing controlled preview props. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 36–36 | Accept a host-supplied account region so the live header/editor reuse one Settings scroll owner; keep existing controlled preview props. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 62–62 | Accept a host-supplied account region so the live header/editor reuse one Settings scroll owner; keep existing controlled preview props. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 65–65 | Accept a host-supplied account region so the live header/editor reuse one Settings scroll owner; keep existing controlled preview props. |
| `apps/mobile/src/infrastructure/api/decoders.ts`: lines 1–7 | Import generated DTOs and validate profile owner, positive safe revision, nullable bounded Unicode name and real UTC timestamps. Separate absent GET from nonnullable save response and project only approved fields; identity formatting is mechanical. |
| `apps/mobile/src/infrastructure/api/decoders.ts`: lines 25–80 | Import generated DTOs and validate profile owner, positive safe revision, nullable bounded Unicode name and real UTC timestamps. Separate absent GET from nonnullable save response and project only approved fields; identity formatting is mechanical. |
| `apps/mobile/src/infrastructure/api/profile-decoders.test.ts`: lines 1–61 | Reject malformed/missing/wrong-owner profiles, invalid revisions, Unicode and impossible UTC dates; distinguish absence/null and accept 80 astral code points without client normalization. |
| `apps/mobile/src/infrastructure/query/account-data-provider.tsx`: lines 7–9 | Expose the same controller for deliberate API recovery and an optional context hook for preview routes. Retain keyed private subtree/cache cancellation and single Auth ownership. |
| `apps/mobile/src/infrastructure/query/account-data-provider.tsx`: lines 27–27 | Expose the same controller for deliberate API recovery and an optional context hook for preview routes. Retain keyed private subtree/cache cancellation and single Auth ownership. |
| `apps/mobile/src/infrastructure/query/account-data-provider.tsx`: lines 43–46 | Expose the same controller for deliberate API recovery and an optional context hook for preview routes. Retain keyed private subtree/cache cancellation and single Auth ownership. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 11–11 | Refresh the current RN-07 checkpoint and link the device/lifecycle handoff; leave full Auth/root/M2 acceptance open. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Refresh the current RN-07 checkpoint and link the device/lifecycle handoff; leave full Auth/root/M2 acceptance open. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 220–230 | Refresh the current RN-07 checkpoint and link the device/lifecycle handoff; leave full Auth/root/M2 acceptance open. |
| `docs/core_plan/03_backend_foundation.md`: lines 621–631 | Record the RN-07 contract consumer handoff and separately deferred real Auth/device/cascade acceptance without marking API-10 complete. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/04_react_native_integration.md`: lines 194–194 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/04_react_native_integration.md`: lines 365–365 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/04_react_native_integration.md`: lines 367–367 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/04_react_native_integration.md`: lines 371–377 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/04_react_native_integration.md`: lines 785–805 | Update RN-07 ledger, original D01-D07 deferrals and latest checkpoint to separate implemented consumer behavior from deferred Auth, device and dedicated-C lifecycle evidence. |
| `docs/core_plan/README.md`: lines 3–3 | Refresh consumer status and correct the stale remaining count to the existing 19/25 ledger totals; do not promote a partial RN-07 into a completed part. |
| `docs/core_plan/README.md`: lines 12–12 | Refresh consumer status and correct the stale remaining count to the existing 19/25 ledger totals; do not promote a partial RN-07 into a completed part. |
| `docs/core_plan/README.md`: lines 115–115 | Refresh consumer status and correct the stale remaining count to the existing 19/25 ledger totals; do not promote a partial RN-07 into a completed part. |
| `docs/core_plan/README.md`: lines 189–198 | Refresh consumer status and correct the stale remaining count to the existing 19/25 ledger totals; do not promote a partial RN-07 into a completed part. |
| `docs/core_plan_implementation_notes/artifacts/rn-07-wiring/verification.json`: lines 1–42 | Record sanitized automated counts, fixture recovery, physical harness load/401 limits, user deferrals and zero hosted mutations; no credentials, identities or personal profile values. |
| `docs/qa/profile-cascade-acceptance.md`: lines 1–52 | Prepare the coordinated disposable-C lifecycle sequence, protect A/B, distinguish provider deletion from SQL fixture checks and unexpired-JWT behavior, and document the current user-requested deferral. |
| `package.json`: lines 30–30 | Add mobile:qa:profile for a separate USB-loopback Expo Go entry on 8091; ordinary app/Auth and UI-only QA commands remain separate. |
| `scripts/check-ui-preview-isolation.mjs`: lines 31–31 | Reject the live-device QA marker if developer credential/fault tooling leaks into the real app export. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–7 | Refresh current part, branch/date and resume checks/deferrals; preserve historical RN-10c evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 9–9 | Refresh current part, branch/date and resume checks/deferrals; preserve historical RN-10c evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 13–13 | Refresh current part, branch/date and resume checks/deferrals; preserve historical RN-10c evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 19–20 | Refresh current part, branch/date and resume checks/deferrals; preserve historical RN-10c evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2110–2218 | Record this commit’s scope, decisions, exact file coverage, real checks, failed probes, user deferrals and next handoff. Hash remains Pending until the next normal update. |


### Planning expansion — RN-08/RN-09 and bounded backend dependencies

**Commit message:** `docs: expand RN-08 and RN-09 execution steps`.
**Hash:** `d590858` (recorded during the API-11 handoff update).
**Date:** 2026-11-02. **Owner:** Ishmum. **Branch:** `task/plans/rn-08-09-expansion`.
**Parent:** `f32e87c`. **Status:** Planning complete; all new execution parts planned/not started.

**User direction:** Expand the existing plans, preserve their part IDs, keep the design small and do not start implementation. No new plan or implementation-notes file was created. Original API-01–10, RN-01–11, RN-09a–h and D-ref identifiers/history remain intact. Add API-11/12 to the backend plan, RN-08a–d and RN-09i–l as subparts of the existing RN parts. Current totals are 46 top-level parts / 19 implemented producers / 27 pending; the extra RN subparts do not inflate that count.

**Decisions and dependencies:** One revisioned settings document stores alternative-activity preferences and a non-enforcing plan draft; reuse the current transaction/RLS/CAS, contracts/query infrastructure and editors. No new generic CRUD/settings framework, state library, persisted query cache, worker, event/reward tables or second Auth manager. API-11 specifies the bounded contract/schema; API-12 implements endpoints/exports, unlocking RN-09i/j. RN-08a independently measures Android capability/build feasibility, b extends the same probe/module into an adapter, c wires status/lifecycle, and d records device acceptance. RN-09k/l compose and verify these real outputs. Mobile drafts remain volatile within account scope; server-stored drafts never install restrictions or complete onboarding. Explicitly distinguish omit/null/empty and expected revisions.

**Ownership and retained gates:** Anisha keeps Auth/onboarding/root guard and iOS/Swift/signing. Their actual integration remains joint acceptance; it is not a prerequisite for isolated module/API work. PM questions remain unanswered. Session/override/overlap policy, quest lifecycle/completion, rewards/Dino/streaks, derived History/forecast claims and native account transfer stay gated. The Android slice observes permission/status and rejects unsupported writes; it does not introduce enforcement or a parity claim. Native code requires measured development-build evidence; no unrestricted clean native regeneration over the imported iOS tree.

**Validation:** `python3 /tmp/hoosh-check-plan-expansion.py` passed preserved original IDs/D-refs, distinct planned new IDs, original RN-09a–h, local added-link targets, part totals/dependency ordering, and a six-Markdown-file-only diff. Official Expo/Android/package-visibility/Play references were read and linked inside RN-08 for implementation-time rechecking. `git diff --check` passed. The per-commit file/line coverage audit passed before commit. Application tests/builds were not rerun because no executable source, manifest, contract artifact, environment or native files changed; prior implementation results remain tied to their original commits.

**Next:** Start API-11 for settings contract/storage, or RN-08a when the Android build/device is available. Add implementation evidence to the same Plan 03/04 notes commit by commit. Do not mark any new part or parent RN-08/09 accepted from this planning change. The previous authenticated phone and hosted disposable-C deletion deferrals remain unchanged. No Supabase/Auth/device/migration/deployment operation, push or merge occurred. User workspace/icon files remain excluded. RN-07 hash `f32e87c` and backend follow-up `f201d0c` are recorded during this normal update without altering their historical evidence.

#### Changed files and exact line ranges

| File / lines in this planning commit | Change and reason |
|---|---|
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Update the discovery index/current counts and append the planning-only checkpoint, ownership boundary and concrete next steps; retain historical acceptance records. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 231–243 | Update the discovery index/current counts and append the planning-only checkpoint, ownership boundary and concrete next steps; retain historical acceptance records. |
| `docs/core_plan/03_backend_foundation.md`: lines 4–4 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/03_backend_foundation.md`: lines 11–11 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/03_backend_foundation.md`: lines 24–24 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/03_backend_foundation.md`: lines 30–30 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/03_backend_foundation.md`: lines 400–495 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/03_backend_foundation.md`: lines 523–527 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/03_backend_foundation.md`: lines 553–554 | Keep API-01–10 unchanged; add planned API-11/12 scope, one settings/draft resource, atomic revision/omit/null semantics, schema/RLS/API/export checks, recovery and ledger/dependencies. Clarify the bounded extension without activating product policy. |
| `docs/core_plan/04_react_native_integration.md`: lines 194–196 | Preserve existing RN/deferral IDs and UI history; add planned RN-08a–d and RN-09i–l with dependencies, expected files, focused acceptance and retained gates. Resolve the known RN-07 wiring hash and distinguish partial extension completion from full parent acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 200–208 | Preserve existing RN/deferral IDs and UI history; add planned RN-08a–d and RN-09i–l with dependencies, expected files, focused acceptance and retained gates. Resolve the known RN-07 wiring hash and distinguish partial extension completion from full parent acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 447–489 | Preserve existing RN/deferral IDs and UI history; add planned RN-08a–d and RN-09i–l with dependencies, expected files, focused acceptance and retained gates. Resolve the known RN-07 wiring hash and distinguish partial extension completion from full parent acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 590–634 | Preserve existing RN/deferral IDs and UI history; add planned RN-08a–d and RN-09i–l with dependencies, expected files, focused acceptance and retained gates. Resolve the known RN-07 wiring hash and distinguish partial extension completion from full parent acceptance. |
| `docs/core_plan/README.md`: lines 5–5 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 12–17 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 24–24 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 52–52 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 66–66 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 111–111 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 113–118 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 124–124 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 126–126 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan/README.md`: lines 210–225 | Add the two backend parts and eight RN subparts to the existing execution map, correct current totals to 46/19/27, identify independent lanes and retain product/acceptance gates. No new plan files are required. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 5–5 | Refresh the resume/branch checkpoint and known prior commit reference; keep earlier file/line evidence historical. Newly planned parts remain unimplemented. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 11–12 | Refresh the resume/branch checkpoint and known prior commit reference; keep earlier file/line evidence historical. Newly planned parts remain unimplemented. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1129–1130 | Refresh the resume/branch checkpoint and known prior commit reference; keep earlier file/line evidence historical. Newly planned parts remain unimplemented. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1131–1182 | Record this documentation commit, scope/dependency choices, exact file coverage, actual documentation checks, retained deferrals and next implementation step. No implementation is claimed. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 19–19 | Refresh the resume/branch checkpoint and known prior commit reference; keep earlier file/line evidence historical. Newly planned parts remain unimplemented. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2114–2114 | Refresh the resume/branch checkpoint and known prior commit reference; keep earlier file/line evidence historical. Newly planned parts remain unimplemented. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2220–2221 | Refresh the resume/branch checkpoint and known prior commit reference; keep earlier file/line evidence historical. Newly planned parts remain unimplemented. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2222–2273 | Record this documentation commit, scope/dependency choices, exact file coverage, actual documentation checks, retained deferrals and next implementation step. No implementation is claimed. |


### RN-09i — Persist alternative activity preferences

**Commit message:** `feat(settings): persist alternative activity preferences`.
**Hash:** `daf4247` (recorded during RN-09j).
**Date:** 2026-11-02. **Owner:** Ishmum.
**Branch:** `task/react-native/rn-09i-activity-preferences`. **Parent:** `90fe8e3` (API-12).
**Status:** Consumer implemented and locally verified; hosted/real Auth/device acceptance remains pending. Parent RN-09 and Plan 04 remain open.

**Requirement and scope:** FR-034's existing activity-settings UI now consumes API-12. Preserve the previously reviewed RN-09f editor, source choices and original Figma SVGs; this commit adds persistence behavior rather than another visual implementation. Only built-in alternatives and custom activity text are written. No plan editor, native selection/rules, onboarding producer, calendar, demographics, recommendation or reward policy is added. Anisha retains Auth/onboarding/project Auth setup and native iOS ownership.

**Decisions / behavior:**

- One `scope.key('settings')` resource holds the whole generated settings DTO and revision. Settings summary and detail editor observe it; RN-09j must reuse `settings-api.ts` and `settings-query.ts`, not create a second cache/revision. Writes cancel current reads before PATCH and again before committing its response. A newer cached revision wins; no optimistic success, previous-account placeholders, persisted drafts or write replay.
- Runtime decoding checks the captured owner, revision bounds, real UTC dates, required activities and the complete nullable plan-draft shape. Unknown response extras are projected away. The backend owns actual timezone catalog membership because client OS catalogs vary. Impossible save revisions become `invalid_response`; the existing HTTP client marks malformed successful write responses as potentially committed.
- Missing row is a verified empty editor, not an outage. An explicit Save may create empty preferences with revision zero; loading/error states cannot create defaults. First opening an untouched missing row does not require a discard warning. An existing empty selection displays Not set; a missing row displays Not saved yet.
- Raw custom text is never trimmed, normalized, truncated or silently converted to null in the mobile request. The previous JavaScript `trim()` advisory is replaced with a zero-length advisory: Python's adopted stripping set preserves FEFF while JS trim removes it. The API remains authoritative for blank/length/invalid-text validation. Deselecting Custom sends null; its unsaved raw input remains available if toggled back on, including during background reads.
- Dirty/error/uncertain drafts retain their original revision even when another client changes the plan section. Activity saves send only `expected_revision` and `activities`. Fixed field copy never displays arbitrary server errors. Offline input stays volatile; reconnect does not submit it. Same-turn duplicate saves use the existing mutation guard; editing/Back are locked during saves.
- A 409 or potentially committed write blocks another save. Check latest explicitly performs GET, then shows the canonical summary beside the retained draft. Keep my edits rebases to that reviewed revision but does not save; Use latest preferences replaces the draft without a write. An absent latest row is reviewable with revision zero. Failed review keeps the draft and blocked state with one retry control; Discard after an uncertain/conflicting write also requires review.
- Protocol-invalid reads hide previous data without removing/recreating the observed query. Account/generation replacement retires the private cache and remounts the form. Scoped callbacks reject late A work; mounted checks suppress abandoned form effects. Credential loss cancels in-flight writes into explicit review, with no automatic replay on recovery.
- The actual Settings/detail routes activate the live consumer only with the existing provider. No new SDK/session/root/Auth implementation is created. The isolated profile QA entry now reuses these same production components for later authorized settings journeys; its existing operator token adapter and lost-response control remain developer-only.

**Validation actually run:**

- `npm run test:unit --workspace @disconnect/mobile -- src/features/settings/settings-api.test.ts`: **35 passed**. Canonical/null/malformed/foreign responses, complete partial-plan shape, Unicode boundary, exact section-only request, real HTTP client error flags and revision checks.
- `npm run test:components --workspace @disconnect/mobile -- activity-preferences-screen.test.tsx`: **32 passed**, 16 scenarios on each Android/iOS preset. Explicit empty save, canonical response/duplicate taps, authoritative raw-text error, inactive custom retention, dirty background revision, higher cached revision, conflict/review choices, failed uncertain review, latest absence, local discard/Back, offline/reconnect, A-to-B and same-user generation changes, invalid-response quarantine, shared tab summary, provider-gated real route, read/write race and credential cancellation.
- `npm run check`: **325 portable mobile / 416 component / 590 deterministic API tests pass**, 191 DB tests deselected by the normal command. Workspace TypeScript, ESLint, Ruff, original SVG inventory, environment-free OpenAPI and pinned generated-type checks pass. Database code/schema is unchanged here; the prior API-12 PostgreSQL evidence remains historical, not rerun/claimed in this commit.
- `npm run mobile:export`: passes; **38** exported app JS/HTML files exclude QA/specimen markers; **71** original local SVGs pass integrity/export checks.
- From `apps/mobile/dev/profile`, `npx expo export --platform android --output-dir /tmp/hoosh-rn09i-profile-android`: passes, producing Android Hermes bytecode for the updated isolated QA entry. Compilation is not device rendering, a signed build or live account acceptance.
- `git diff --check` and implementation-record file/range/changed-file coverage checks pass before commit. No secret-bearing file, user workspace or original icon-pack directory is staged.

**Failures corrected during implementation:** Initial TypeScript checks found QA absolute routes outside the production typed route inventory and a nonexistent ready InlineStatus state; use relative QA routes and an accessible success Text instead. The first component run failed six assertions because exact custom-field labels ignored the validation hint included in the accessibility label; prefix selectors fixed the tests without weakening that behavior. Subsequent focused and full checks pass. No unresolved automated failure remains.

**Remaining / handoff:** Next RN-09j wires existing days/hours/sessions to the very same settings query and guarded mutation, preserving omitted sections and labeling accepted data Saved draft — not active. RN-09k Home/native composition and RN-09l simultaneous real-editor/lifecycle acceptance remain separate. Hosted migration 0002 is still pending coordination; no hosted migration, managed-account mutation, credential access/refresh, actual HTTP/phone settings round trip, physical native rendering or screen-reader test was attempted here. Anisha's real Auth/root and iOS acceptance, RN-08 native work and user-deferred authenticated phone and dedicated disposable-C deletion remain open. Full top-level totals stay 46 parts / 21 implemented producers / 25 pending because this subpart does not complete RN-09. Local commit only; no push/merge/deployment. Untracked workspace/icon packs are untouched.

**Changed files and exact line coverage (this commit):**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/dev/profile/README.md`: lines 40–69 | Document approved development migration prerequisites, real activity QA steps, loss/conflict/revision/restore checks and the unchanged hosted/Auth/device limits. |
| `apps/mobile/dev/profile/app/activities.tsx`: lines 1–20 | Reuse the production live activity screen under the existing QA runtime; relative Back/fallback routes and unavailable connection state avoid another Auth owner. |
| `apps/mobile/dev/profile/app/profile.tsx`: lines 3–4 | Use the connected settings summary and route to the same live activity editor only after the existing QA connection is installed. |
| `apps/mobile/dev/profile/app/profile.tsx`: lines 8–11 | Use the connected settings summary and route to the same live activity editor only after the existing QA connection is installed. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 4–4 | Delegate to ConnectedSettingsScreen under the existing private provider; retain neutral preview behavior and the existing detail navigation otherwise. |
| `apps/mobile/src/app/(tabs)/settings.tsx`: lines 10–20 | Delegate to ConnectedSettingsScreen under the existing private provider; retain neutral preview behavior and the existing detail navigation otherwise. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 19–20 | Gate the live activities detail on the existing scope, preserving all other unavailable editors in a separate hook-owning component; formatting is mechanical. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 23–35 | Gate the live activities detail on the existing scope, preserving all other unavailable editors in a separate hook-owning component; formatting is mechanical. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 87–88 | Gate the live activities detail on the existing scope, preserving all other unavailable editors in a separate hook-owning component; formatting is mechanical. |
| `apps/mobile/src/features/preferences/activity-model.ts`: lines 1–4 | Import generated activity types and the existing controlled draft; keep stable choices typed to the contract. |
| `apps/mobile/src/features/preferences/activity-model.ts`: lines 5–18 | Map the six contract IDs to existing source labels and validate membership without adding selected defaults. |
| `apps/mobile/src/features/preferences/activity-model.ts`: lines 19–25 | Translate accepted preferences or verified absence into a volatile controlled draft. |
| `apps/mobile/src/features/preferences/activity-model.ts`: lines 26–40 | Project only validated activity IDs plus unchanged raw custom text; null means explicit Custom deselection. |
| `apps/mobile/src/features/preferences/activity-model.ts`: lines 41–48 | Compare complete raw drafts, including inactive custom input, so background reads cannot discard it. |
| `apps/mobile/src/features/preferences/activity-model.ts`: lines 49–53 | Format accepted built-in/custom choices for canonical summaries; explicit empty stays null. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 1–1 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 189–191 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 198–200 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 202–203 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 209–209 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 211–212 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 214–214 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 243–243 | Extend the existing activity editor with host feedback, authoritative field errors and separate navigation dirty state; preserve raw Unicode input and original assets without duplicating its scroll owner. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 1–129 | Provide synthetic Auth/account scopes, deferred requests and controlled UI helpers. Mock only the external Router removal boundary; local Back confirmation and real query/scope/decoder behavior remain exercised. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 130–144 | Verify verified absence can explicitly save empty preferences without prompting on untouched Back. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 145–177 | Verify save sends only activities, accepts canonical text and shares the saved resource with Settings. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 178–199 | Verify authoritative Unicode validation retains raw input; custom deselection sends null. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 200–236 | Verify dirty background reads never overwrite raw inactive custom text or advance the draft base. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 237–257 | Verify 409 requires a fresh read and explicit Keep my edits before revision-based resubmission. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 258–278 | Verify unconfirmed write and failed latest read retain draft and block automatic replay. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 279–293 | Verify latest absence is reviewed explicitly; keep edits then creates with revision zero. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 294–308 | Verify discard is local and dirty Back uses the existing confirmation. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 309–319 | Verify offline edits stay volatile and reconnect never submits a write. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 320–351 | Verify new account/generation drops pending old drafts and save effects. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 352–369 | Verify protocol-invalid refresh quarantines old data without an automatic reload loop. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 370–389 | Verify Settings observes canonical preferences from the same query without activating other rows. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 390–406 | Verify real detail route stays unavailable without the provider and activates the same editor with it. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 407–442 | Verify a read begun during a pending write is cancelled before the accepted save enters cache. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 443–461 | Verify credential unavailability cancels a write into explicit review and resume never replays it. Run on both Android and iOS presets; no hosted or physical-device claim. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 1–29 | Map stable IDs to existing original preference assets and compose the existing account recovery/draft guard; add no Auth producer. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 30–124 | Render safe read/recovery/saved states plus explicit conflict/uncertain latest-read and keep/use-latest decisions inside the existing editor. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 125–137 | Reuse one ActivitiesEditor/EditorPage scroll owner and the existing route removal confirmation for the live or unavailable screen. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 1–35 | Observe the shared private settings resource, derive activity labels only from canonical accepted data, distinguish missing/error/unavailable, and reuse ProfileSurface while other rows remain unavailable. |
| `apps/mobile/src/features/settings/settings-api.test.ts`: lines 1–28 | Build synthetic owner fixtures and a complete settings response without live credentials. |
| `apps/mobile/src/features/settings/settings-api.test.ts`: lines 29–108 | Verify response projection/absence, malformed and foreign payload rejection, nullable draft fields, Unicode limits and unchanged raw activity requests. |
| `apps/mobile/src/features/settings/settings-api.test.ts`: lines 109–152 | Exercise actual HTTP-client GET/PATCH decoding, exact section-only JSON and definite conflict versus potentially committed invalid-success behavior. |
| `apps/mobile/src/features/settings/settings-api.ts`: lines 1–14 | Consume generated DTOs and existing scoped transport/error/date boundaries; do not duplicate mobile wire types. |
| `apps/mobile/src/features/settings/settings-api.ts`: lines 15–51 | Validate safe bounded integers and canonical activity responses, including unique IDs, code-point length and the adopted whitespace set. |
| `apps/mobile/src/features/settings/settings-api.ts`: lines 52–102 | Validate complete nullable draft responses, sorted weekdays, HH:mm/range and bounded timezone/session shape; catalog membership stays server-owned. |
| `apps/mobile/src/features/settings/settings-api.ts`: lines 103–130 | Project verified own-account settings with required sections, bounded revision and ordered valid UTC timestamps; distinguish null absence. |
| `apps/mobile/src/features/settings/settings-api.ts`: lines 131–154 | Reject missing save results, forward scoped GET/PATCH signals and verify exactly one accepted revision increment. |
| `apps/mobile/src/features/settings/settings-query.ts`: lines 1–9 | Reuse existing account query/mutation infrastructure and generated settings response/patch types. |
| `apps/mobile/src/features/settings/settings-query.ts`: lines 10–16 | Observe the sole settings key and quarantine old data after invalid protocol responses without an automatic remove/refetch loop. |
| `apps/mobile/src/features/settings/settings-query.ts`: lines 17–44 | Wrap guarded section writes, cancel racing reads before/after PATCH and publish only canonical responses without replacing a newer cached revision. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 1–14 | Use generated settings, existing account scope/online status and controlled editor types; own only volatile form state. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 15–49 | Construct canonical draft bases and raw dirty comparison; map definite validation/conflict versus potentially committed failures to fixed UI states. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 50–93 | Retain dirty/error bases, own account-keyed review state, and apply canonical save results only while mounted, respecting a newer cache revision. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 94–122 | Disable writes during unavailable/fetching states; explicitly load latest preferences and resolve keep/discard against the reviewed snapshot without sending a write. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 123–179 | Separate explicit empty-save eligibility from navigation dirtiness; preserve raw drafts, block offline/duplicate/conflicting writes, send only activities and review uncertain discard. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 180–197 | Expose query/form/review state and canonical-only saved feedback for the thin screen. |
| `apps/mobile/src/infrastructure/api/decoders.ts`: lines 58–58 | Export the existing UTC timestamp validator unchanged so settings and profiles share the same calendar/date boundary. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 264–274 | Append the current consumer/checkpoint, exact checks, next RN-09j step and retained Auth/hosted/device gates for future agents. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Update RN-09 ledger and i subpart evidence while preserving original IDs, planned j-l work, parent counts and remaining live/product/native acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 201–203 | Update RN-09 ledger and i subpart evidence while preserving original IDs, planned j-l work, parent counts and remaining live/product/native acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 593–593 | Update RN-09 ledger and i subpart evidence while preserving original IDs, planned j-l work, parent counts and remaining live/product/native acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 601–601 | Update RN-09 ledger and i subpart evidence while preserving original IDs, planned j-l work, parent counts and remaining live/product/native acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 606–624 | Update RN-09 ledger and i subpart evidence while preserving original IDs, planned j-l work, parent counts and remaining live/product/native acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 634–635 | Update RN-09 ledger and i subpart evidence while preserving original IDs, planned j-l work, parent counts and remaining live/product/native acceptance. |
| `docs/core_plan/README.md`: lines 66–66 | Update the execution lane/checkpoint to RN-09i consumer completion and RN-09j next, without promoting full RN-09 or changing top-level totals. |
| `docs/core_plan/README.md`: lines 245–256 | Update the execution lane/checkpoint to RN-09i consumer completion and RN-09j next, without promoting full RN-09 or changing top-level totals. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–25 | Refresh the current part/branch/resume evidence, keep previous checkpoints historical and identify RN-09j plus retained acceptance gates. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2279–2388 | Record this commit’s decisions, edge cases, failures corrected, exact file coverage, actual checks, retained user deferrals and next handoff. Own hash remains Pending until the next normal update. |


### RN-09j — Persist non-enforcing plan drafts

**Commit message:** `feat(settings): persist non-enforcing plan drafts`.
**Hash:** `1326601` (recorded during RN-09k).
**Date:** 2026-11-02. **Owner:** Ishmum.
**Branch:** `task/react-native/rn-09j-plan-drafts`. **Parent:** `daf4247` (RN-09i).
**Status:** Consumer implemented and locally verified; live hosted/Auth/device acceptance and full parent RN-09/Plan 04 remain open.

**Requirement and scope:** Continue FR-034 using API-11/12's agreed nullable settings contract and the previously reviewed RN-09g day/hour/session controls and original icons. Wire draft persistence only. Preserve Anisha's Auth/onboarding/root/Supabase Auth and native iOS ownership. No device rule installation, onboarding completion, session allowance/reset, calendar, demographic, quest or reward policy is introduced. Existing UI specimens retain their complete-plan display mode; live consumers explicitly opt into draft mode.

**Decisions and relationships:**

- Extract the existing RN-09i state machine into `use-settings-editor.ts` and its recovery/review presentation into `settings-editor-feedback.tsx`. Activities keep their typed adapter and fixed custom-text validation. Plan views supply four small projection functions to the same settings-only helper. This reuses the existing account query/mutation API and one `scope.key('settings')` revision; it adds no library, generic CRUD layer, persistence cache, Auth store or write queue.
- `PlanDraftInput` represents raw editable hours/timezone, nullable session values and explicit whole-section null intent. Missing settings/missing plan are verified empty forms with an explicit Save; no read auto-creates a row or supplies sample choices/default times/timezone. A clean view follows canonical reads; a dirty/error/uncertain view retains its original base revision and raw input.
- Each form sends `expected_revision` plus `plan_draft` only. Days replace only weekdays, hours replace the hours/timezone group, and sessions replace count/minutes. The remaining fields are copied from the captured base. After conflict review, Keep my edits retains the viewed field group and builds against the explicitly reviewed base; other groups use the latest accepted values. The entire visible group is retained (not a field-by-field merge inside that view). Save is still a separate deliberate action. Activities are omitted, so the server preserves them.
- Partial hours retain null for either endpoint, including a nullable whole hours object. An entered endpoint must be strict HH:mm; when both exist, overnight requires explicit next-day and equal/inconsistent endpoints are rejected. The shared hours validator serves UI and request projection. Blank timezone means explicit null; other raw text goes unchanged to authoritative server validation, with fixed error copy. No timezone is inferred from the device and aliases are retained.
- Draft sessions permit nullable count/minutes and independent clear buttons. The accepted contract's 1–1000 count and 1–1440 minute storage ceilings bound the existing steppers; they do not define a daily reset, allowance or enforcement behavior. Live labels say draft count/minutes, and the source specimen's daily-budget product/total is suppressed in draft mode.
- Explicit individual clear preserves other fields. Clear entire plan draft first changes local intent and shows a separate Save cleared draft action; only Save sends `plan_draft: null`. It preserves activities and never touches an installed plan. After accepted clear, a user may explicitly create another empty draft; no automatic write follows.
- Live Settings labels and accepted summaries say draft/not active. A verified clean draft displays Saved draft — not active; dirty, unavailable or ambiguous states use neutral Draft — not active plus the existing precise status/error message. Saving preferences never claims native installation, protection enablement or onboarding success. Unavailable reads cannot become a missing-plan default.
- Reuse original conflict/uncertain-write review, fixed safe validation, request cancellation, monotonic cache publication, duplicate-tap guard, offline no-replay and account-generation remount/callback fences. Back uses existing dirty-navigation confirmation. Plan detail routes are provider-gated and keyed by field so changing views cannot reuse another field's local form. Other unavailable routes remain unchanged.
- The isolated existing profile QA project now exposes all three production plan views. It keeps its memory-only operator credential adapter and one-shot lost-response control outside the production graph; it does not replace the real Auth/root handoff. No hosted migration, live token access/refresh or Auth configuration change occurred.

**Validation actually run:**

- `npm run test:unit --workspace @disconnect/mobile -- src/features/plans/plan-draft-model.test.ts`: **17 passed**. Partial/null round-trip, field-group projection against a reviewed base, omit/null/empty semantics, unmodified activity section, sorted days, unchanged raw timezone, nullable/coherent and invalid hours, technical session limits, dirty equality and truthful summaries.
- `npm run test:components --workspace @disconnect/mobile -- plan-draft-screen.test.tsx activity-preferences-screen.test.tsx plan-editors.test.tsx`: **74 passed** across Android/iOS presets (32 new plan-consumer checks plus activity/source-control regressions). The final plan screen status-copy adjustment was followed by `npm run test:components --workspace @disconnect/mobile -- plan-draft-screen.test.tsx`: **32 passed** again.
- New component scenarios cover verified absence versus failure, empty draft save, preservation of partial hours/zone/sessions, partial hours and explicit timezone/hour clears, next-day/equal/malformed input, authoritative raw timezone validation, nullable sessions without daily policy, whole-section null, activity/day and day/hour concurrent editors sharing CAS revision, failed review after a committed save loses its response, offline/reconnect/discard/Back, A-to-B and same-user generation changes, provider-gated real route and canonical Settings summaries. Keep/use-latest decisions never send writes by themselves.
- `npm run check`: **342 portable mobile / 448 component / 590 deterministic API tests pass**; normal API selection leaves 191 DB checks deselected. Workspace TypeScript/ESLint, Ruff, environment-free OpenAPI, pinned generated DTO and original asset checks pass. No backend/schema changes were made, so prior API-12 DB/process-restart evidence is retained as historical rather than rerun/claimed here.
- `npm run mobile:export`: passes with **38** exported JS/HTML files excluding QA/specimen markers and **71** original SVGs passing integrity/export checks. Repeated after the final neutral status-copy adjustment.
- From `apps/mobile/dev/profile`, `npx expo export --platform android --output-dir /tmp/hoosh-rn09j-profile-android`: passes, producing Android Hermes bytecode for the updated QA routes. Repeated after the final status-copy adjustment. Compilation is not physical rendering, signing, live Auth or installed native protection.
- `git diff --check` and staged file/range coverage checks pass before commit. Original user workspace/icon packs and all ignored private environment/credential files remain excluded.

**Failure corrected:** The first RN-09i regression run found its summary error assertion assumed exactly one Couldn't load row. The connected view now correctly marks activities plus all three draft rows as failed; assert all four errors. The focused and full suites then pass. No unresolved automated failure remains. A final neutral header avoids claiming an ambiguous write definitely remained unsaved or that an unavailable cached value is freshly verified; its focused tests/exports pass.

**Remaining / next:** RN-09k can compose accepted preferences/draft producers into Home while native availability remains unavailable until RN-08c. RN-08a remains an independent Android lane; RN-09l retains broader HTTP/device/lifecycle acceptance. Hosted migration 0002, real Auth/root, actual HTTP/authenticated Android phone journeys, signing/assistive speech, Anisha's iOS checks, installed-native/status producers and unanswered product rules are still pending. Earlier authenticated-phone and dedicated disposable-C deletion deferrals remain unchanged; no managed user/account was mutated. Top-level counts remain 46 parts / 21 producers implemented / 25 pending, since j does not complete parent RN-09. RN-09i hash `daf4247` is recorded during this normal update. Local commit only; no push/main merge/deployment.

**Changed files and exact line coverage (this commit):**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/dev/profile/README.md`: lines 70–105 | Add plan QA steps for partial/null fields, timezone/range validation, reviewed concurrent field-group saves, lost responses and unchanged real Auth/device/hosted gates. |
| `apps/mobile/dev/profile/app/plan.tsx`: lines 1–25 | Reuse production plan screens under the existing QA runtime, validate/key route fields and supply an unavailable fallback and relative Back navigation. |
| `apps/mobile/dev/profile/app/profile.tsx`: lines 9–16 | Expose existing live Settings plan-detail callbacks in the isolated QA project using relative routes, without adding an Auth owner. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 21–22 | Activate the existing plan draft consumer only under the settled account provider, keyed by validated field; preserve all other route behavior. |
| `apps/mobile/src/app/settings/[field].tsx`: lines 26–36 | Activate the existing plan draft consumer only under the settled account provider, keyed by validated field; preserve all other route behavior. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 1–30 | Provide synthetic fixtures and controlled helpers without live credentials. Exercise existing query/controller/decoder/editor behavior; fixtures do not establish hosted or physical-device acceptance. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 31–49 | Verify preserves all partial nullable data, aliases and explicit null intent. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 50–72 | Verify replaces only viewed fields using the explicitly reviewed base and never sends activities. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 73–80 | Verify does not guess a timezone or normalize invalid raw timezone text. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 81–87 | Verify allows nullable or coherent hours. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 88–100 | Verify rejects entered invalid hours without dropping raw values. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 101–112 | Verify validates bounded storage choices without inventing allowance policy. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 113–126 | Verify dirty equality considers the viewed fields and distinguishes hours null from partial input. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.test.ts`: lines 127–135 | Verify labels only draft values, including partial values and known absence. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/plans/plan-draft-model.ts`: lines 1–14 | Use generated plan/settings DTOs, typed raw control drafts and stable day/hour/session field identifiers. |
| `apps/mobile/src/features/plans/plan-draft-model.ts`: lines 15–35 | Construct explicit blank/partial form projections without choosing times, days, timezone or session defaults. |
| `apps/mobile/src/features/plans/plan-draft-model.ts`: lines 36–59 | Validate optional entered endpoints and compare only the viewed raw field group; null hours and explicit clear stay distinct. |
| `apps/mobile/src/features/plans/plan-draft-model.ts`: lines 60–101 | Build safe validation errors and section-only patches from the captured/reviewed base, preserving other groups and passing raw timezone to server validation. |
| `apps/mobile/src/features/plans/plan-draft-model.ts`: lines 102–117 | Format accepted partial/absent plans as draft-only row and full review summaries, without activation or measured/allowance claims. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 18–18 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 43–43 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 45–49 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 52–56 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 96–96 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 98–102 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 105–108 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 112–114 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 145–145 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 167–170 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 186–186 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 192–192 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 194–196 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 199–203 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 205–205 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 211–218 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 220–220 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/plans/plan-editors.tsx`: lines 226–235 | Add opt-in inactive draft mode to the existing day/hour/session controls: shared nullable hours validation, nullable session clear buttons and draft labels without daily budget claims; complete source-preview defaults remain unchanged. |
| `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: lines 387–387 | Update the failed-query summary assertion to verify all four live settings rows fail together instead of assuming activities is the sole live row. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 1–1 | Reuse extracted recovery/review feedback while retaining original activity choices/icons, provider boundary, editor and navigation behavior; remove duplicated feedback code. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 3–3 | Reuse extracted recovery/review feedback while retaining original activity choices/icons, provider boundary, editor and navigation behavior; remove duplicated feedback code. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 6–7 | Reuse extracted recovery/review feedback while retaining original activity choices/icons, provider boundary, editor and navigation behavior; remove duplicated feedback code. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx`: lines 20–20 | Reuse extracted recovery/review feedback while retaining original activity choices/icons, provider boundary, editor and navigation behavior; remove duplicated feedback code. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 6–6 | Derive all draft rows from the same canonical settings query with missing/error/unavailable states and pass explicit draft-only presentation to Settings. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 13–13 | Derive all draft rows from the same canonical settings query with missing/error/unavailable states and pass explicit draft-only presentation to Settings. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 19–19 | Derive all draft rows from the same canonical settings query with missing/error/unavailable states and pass explicit draft-only presentation to Settings. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 21–25 | Derive all draft rows from the same canonical settings query with missing/error/unavailable states and pass explicit draft-only presentation to Settings. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 28–35 | Derive all draft rows from the same canonical settings query with missing/error/unavailable states and pass explicit draft-only presentation to Settings. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 1–149 | Provide synthetic fixtures and controlled helpers without live credentials. Exercise existing query/controller/decoder/editor behavior; fixtures do not establish hosted or physical-device acceptance. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 150–162 | Verify verified missing row explicitly saves an empty inactive draft, without defaults or a Back warning. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 163–185 | Verify day edits preserve partial hours, timezone and session values and omit activities entirely. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 186–211 | Verify hours can save one entered time and raw timezone, then explicitly clear hours and timezone. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 212–225 | Verify entered overnight hours need explicit next day; equal or malformed times stay unsaved. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 226–243 | Verify authoritative timezone error retains raw input; correction saves only accepted canonical data. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 244–264 | Verify sessions preserve nullable fields, allow explicit individual clears, and claim no daily allowance. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 265–276 | Verify clearing the whole plan sends explicit null only after Save and preserves activities. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 277–299 | Verify dirty days keep their old base after an activity save, then require review without overwriting activities. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 300–318 | Verify separate days and hours editors share one revision; explicit keep preserves latest unseen hours. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 319–342 | Verify uncertain save and failed review preserve partial raw draft; Use latest requires GET and sends no write. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 343–360 | Verify offline drafts and local discard never replay a write; dirty Back uses existing confirmation. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 361–384 | Verify account or generation replacement suppresses pending old draft/save effects. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 385–398 | Verify a failed initial read is unavailable, not a missing draft that could create defaults. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 399–411 | Verify real detail route remains unavailable without Auth provider and activates the draft consumer inside it. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.test.tsx`: lines 412–423 | Verify Settings summaries distinguish accepted partial drafts from missing, active or measured outcomes. Test ports and accepted generated DTO shapes remain synthetic. |
| `apps/mobile/src/features/settings/plan-draft-screen.tsx`: lines 1–22 | Compose existing controls, generated-compatible field choices, accepted storage bounds and the existing account-scoped editor/navigation guard. |
| `apps/mobile/src/features/settings/plan-draft-screen.tsx`: lines 23–55 | Map whitelisted timezone/other validation to fixed copy and label verified versus dirty/unavailable/ambiguous data as inactive draft preferences. |
| `apps/mobile/src/features/settings/plan-draft-screen.tsx`: lines 56–145 | Offer staged entire-section clear plus Save, and route the current field group through original days/hours/sessions editors with raw timezone/nullable fields and explicit individual clears. |
| `apps/mobile/src/features/settings/settings-editor-feedback.tsx`: lines 1–62 | Extract RN-09i recovery/read/error presentation, using the same controller and existing buttons/status UI for both typed editors. |
| `apps/mobile/src/features/settings/settings-editor-feedback.tsx`: lines 63–99 | Render canonical-only success and deliberate latest-read/retry controls without treating uncertain saves as successful. |
| `apps/mobile/src/features/settings/settings-editor-feedback.tsx`: lines 100–129 | Compare the complete accepted activity or plan summary with retained input; explicit keep/use-latest only changes local review state. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 19–20 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 33–33 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 133–133 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 135–135 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 143–143 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 152–152 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/settings-screen.tsx`: lines 167–167 | Add an optional draft-only presentation flag; live plan section/row/context labels describe inactive saved drafts while existing presentation consumers retain their defaults. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 6–7 | Replace duplicated state management with the shared settings editor and a typed activity adapter; preserve raw draft mapping, explicit empty save and fixed custom-text validation. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 9–16 | Replace duplicated state management with the shared settings editor and a typed activity adapter; preserve raw draft mapping, explicit empty save and fixed custom-text validation. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 18–20 | Replace duplicated state management with the shared settings editor and a typed activity adapter; preserve raw draft mapping, explicit empty save and fixed custom-text validation. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 22–23 | Replace duplicated state management with the shared settings editor and a typed activity adapter; preserve raw draft mapping, explicit empty save and fixed custom-text validation. |
| `apps/mobile/src/features/settings/use-activities-editor.ts`: lines 33–33 | Replace duplicated state management with the shared settings editor and a typed activity adapter; preserve raw draft mapping, explicit empty save and fixed custom-text validation. |
| `apps/mobile/src/features/settings/use-plan-draft-editor.ts`: lines 1–18 | Adapt each plan view to the shared state machine: project nullable defaults only after verified read, compare the viewed fields and construct a section-only patch using its reviewed base. |
| `apps/mobile/src/features/settings/use-settings-editor.ts`: lines 1–23 | Extract the settings-only typed projection boundary from RN-09i; keep the existing scope/query/mutation transports and editor state types. |
| `apps/mobile/src/features/settings/use-settings-editor.ts`: lines 24–62 | Map safe validation, definite conflict and potentially committed failures; share account-keyed raw/base and mounted ownership state. |
| `apps/mobile/src/features/settings/use-settings-editor.ts`: lines 63–110 | Publish canonical save state while respecting a newer cache revision; retain the existing deliberate latest GET and explicit keep/use-latest workflow. |
| `apps/mobile/src/features/settings/use-settings-editor.ts`: lines 111–185 | Separate initial explicit-save eligibility from navigation dirtiness, guard writes/discard and expose canonical-only success; no replay or dirty automatic rebase. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 275–286 | Append the current RN-09j checkpoint, actual checks, next bounded work and retained hosted/Auth/native/device acceptance for future agents. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Update stable RN-09j/parent ledger and deferral mapping with consumer evidence and reviewed field-group semantics; preserve k/l and parent acceptance gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 202–202 | Update stable RN-09j/parent ledger and deferral mapping with consumer evidence and reviewed field-group semantics; preserve k/l and parent acceptance gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 593–593 | Update stable RN-09j/parent ledger and deferral mapping with consumer evidence and reviewed field-group semantics; preserve k/l and parent acceptance gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 602–602 | Update stable RN-09j/parent ledger and deferral mapping with consumer evidence and reviewed field-group semantics; preserve k/l and parent acceptance gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 625–650 | Update stable RN-09j/parent ledger and deferral mapping with consumer evidence and reviewed field-group semantics; preserve k/l and parent acceptance gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 660–661 | Update stable RN-09j/parent ledger and deferral mapping with consumer evidence and reviewed field-group semantics; preserve k/l and parent acceptance gates. |
| `docs/core_plan/README.md`: lines 66–66 | Update the execution lane and latest checkpoint to i/j consumer completion, k composition next and unchanged parent counts/live gates. |
| `docs/core_plan/README.md`: lines 257–269 | Update the execution lane and latest checkpoint to i/j consumer completion, k composition next and unchanged parent counts/live gates. |
| `apps/mobile/src/features/settings/use-activities-editor.ts` (parent `daf4247`): lines 15–197 | Extract the former form state/review/save implementation into use-settings-editor.ts; the current file retains the typed activity adapter and field validation. These are old-source ranges. |
| `apps/mobile/src/features/settings/activity-preferences-screen.tsx` (parent `daf4247`): lines 26–124 | Extract duplicated account recovery/read/latest-review UI into settings-editor-feedback.tsx, reused by activity and plan consumers. These are old-source ranges. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–26 | Refresh current part/branch/resume evidence and next work while retaining historical checkpoints. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2285–2285 | Record RN-09i’s actual hash during the next normal update; keep its historical file/line evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2394–2533 | Record this commit’s scope, extraction reasons, field-group semantics, exact file coverage, actual checks, corrected regression and retained user deferrals/handoff. Own hash remains Pending until the next normal update. |


### RN-09k — Consume saved preferences and device availability

**Commit message:** `feat(home): consume saved preferences and device availability`.
**Hash:** `dd74a80` (recorded during RN-09l).
**Date:** 2026-11-03. **Owner:** Ishmum.
**Branch:** `task/react-native/rn-09k-home-preferences`. **Parent:** `1326601` (RN-09j).
**Status:** Saved-preference composition implemented and locally verified. The RN-08c dependency has no registered native adapter, so k's real native-status portion remains pending; full RN-09/Plan 04 stays open.

**Scope and prerequisites:** Consume API-12/RN-09i/j's existing canonical settings response in the existing Home composition and Settings models (FR-034). Use prior Home/card/control/type recipes and original icons unchanged; this is producer wiring plus a semantic saved-preferences card, not another translation of the illustrated Figma Home example. Native status remains the existing unavailable presentation. Anisha retains all Auth/onboarding/root/Supabase Auth and native iOS work. No new backend, product rule, native capability, permission flow or recommendation producer is added.

**Decisions / behavior:**

- `settings-summary-model.ts` is a pure projection from accepted generated settings data plus existing availability/read/online state. `use-settings-summary.ts` observes the same account `settings` query as both existing editors. Connected Home and Settings reuse that projection, including labels and missing/empty/error states. No duplicate Home request/key, local response copy, durable query cache, second account store, metric DTO or new state library is introduced.
- The shared availability projection masks previous private labels when offline, credentials/API access are unavailable, or a read fails. Protocol-invalid reads are already quarantined by `useSettingsQuery`; the summary cannot fall back to their older cache data. Verified row absence displays Not saved yet / No saved draft; explicit empty activities display Not set. Inactive nullable hours, timezone and session values retain the existing accepted draft labels.
- A normal background refresh may retain the last canonical data while Home shows Updating saved preferences. Failed/invalid refresh replaces the labels with error state. Retry is explicit and available only while the existing account gate/online status permits it. API pause uses `useAccountAction` and the same controller's deliberate recoverSession with safe failure copy; credential unavailability never starts another refresh/session owner. Offline masks labels and reconnect never submits a write.
- `HomeScreen` gains an optional preferences composition slot inside its single existing scroll owner. Its metric/outcome `HomeModel` remains unchanged. `HomePreferences` uses existing warm surface, typography, accessible text/status/Button recipes and growing layouts. Four editor navigation callbacks are optional; missing callbacks omit their actions. Its saved-plan language always distinguishes inactive drafts from protection.
- Production Home activates `ConnectedHomeScreen` only under the settled existing account provider, just like Settings. It links to existing activity/day/hour/session detail routes without changing Auth/root ownership. Outside that provider, the original neutral Home remains available and makes no private query. Provider replacement disposes/remounts private data by UUID/generation; late old reads cannot populate the replacement account.
- Home never reads local editor drafts or mutation output directly. Only existing guarded canonical cache publication or a verified GET changes summaries. Dirty input, pending saves and unconfirmed write responses keep the prior canonical summary. A deliberate latest GET can reveal an accepted lost-response write without replaying it or falsely announcing that its save response succeeded. Draft null clears and accepted partial saves update Home/Settings immediately from the single cache.
- RN-08c is unimplemented and no native adapter is registered. `UnavailableDeviceProtection` reuses the existing unavailable card on both neutral and connected Home. No permission, selected-app state, desired/installed revision, native status/action or positive protection claim is synthesized from API preferences/revision. Existing Dino, Feed/credits, streak, recommendation and usage/saved-time inputs remain unavailable. RN09-D01–D04 and D06 plus the remaining native/product scope of D05 remain open.
- The existing isolated profile QA project adds Open live Home and reuses the production Home consumer and four editor routes. Its memory-only operator credential adapter and one-shot loss control remain outside production exports. This compiles the consumer for later device use; it does not replace Auth/root or managed-account acceptance.

**Validation actually run:**

- `npm run test:unit --workspace @disconnect/mobile -- src/features/settings/settings-summary-model.test.ts`: **10 passed**. Loading versus absent versus empty, exact Unicode/partial labels, every existing non-ready availability, offline/error cache masking and paused absence.
- `npm run test:components --workspace @disconnect/mobile -- connected-home-screen.test.tsx home-screen.test.tsx activity-preferences-screen.test.tsx plan-draft-screen.test.tsx`: **126 passed** across Android/iOS presets. The new consumer contributes 15 scenarios per platform (30 total). Covers deduplicated Home/Settings GET, canonical partial agreement, absence/empty, dirty/pending activities, accepted save/whole-draft clear, committed write with lost response followed by explicit GET, background error/invalid read and retry, pending initial read, marked background refresh, offline/reconnect, failed/successful deliberate recovery, A-to-B/same-user generation late-read fencing, sign-out and provider-gated real route. Supported navigation intent assertions were subsequently added and passed in the full suite.
- `npm run check`: **352 portable mobile / 478 component / 590 deterministic API tests pass**; the normal API selection deselects 191 PostgreSQL checks. Workspace TypeScript/ESLint, Ruff, asset inventory, environment-free OpenAPI and pinned generated DTO checks pass. No API/schema changes, so no DB/migration/HTTP-process acceptance was repeated or newly claimed.
- `npm run mobile:export`: passes; **38** exported app JS/HTML files exclude QA/specimen markers and **71** original local SVGs pass integrity/export checks.
- From `apps/mobile/dev/profile`, `npx expo export --platform android --output-dir /tmp/hoosh-rn09k-profile-android`: passes, producing Android Hermes bytecode including connected Home. Compilation is separate from device rendering, signing, assistive speech, real Auth and installed native behavior.
- Applied the `vercel:react-best-practices` skill as a React review: top-level hooks in small connected/presentation components, derived projection during render without effect copies, the existing query for deduplication/cancellation, optional stable module definitions, typed callbacks and existing accessible UI primitives. No Vercel/Next-specific migration, new dependencies or unnecessary memoization is introduced. Review found no additional correction needed.
- `git diff --check` and exact changed-file/current/parent range coverage checks pass before commit. No failed automated check remains. Original icon packs/workspace and ignored private credential/environment files remain excluded.

**Remaining / handoff:** RN-09l can proceed with independent settings integration/acceptance work; RN-08a is an independent Android lane. Complete k's native status portion only after RN-08c supplies actual capability/authorization/install evidence and accepted lifecycle ownership. Keep Home's current unavailable card until then; do not pass API draft revisions into native status. Hosted migration 0002, real Auth/root, actual HTTP/authenticated phone settings/Home journeys, signed builds/speech, Anisha's iOS and unanswered product/native features remain separate gates. User-deferred authenticated-phone and dedicated disposable-C deletion remain unchanged. No hosted operation, credential read/refresh, managed-user mutation, device action, native project change or deployment occurred. Counts remain 46 top-level parts / 21 producers implemented / 25 pending because this composition does not complete parent RN-09. RN-09j hash `1326601` is recorded during this normal update. Local commit only; no push/merge.

**Changed files and exact line coverage (this commit):**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/dev/profile/README.md`: lines 106–125 | Document Home/Settings canonical agreement, supported edit navigation, uncertain/read/offline/recovery/account checks and unchanged hosted/Auth/native/device limits. |
| `apps/mobile/dev/profile/app/home.tsx`: lines 1–24 | Reuse production connected Home under the existing QA account and pass relative editor navigation; a disconnected QA runtime keeps neutral Home with unavailable protection. |
| `apps/mobile/dev/profile/app/index.tsx`: lines 23–23 | Add Open live Home to the existing connected QA controls; reuse the same private runtime and relative routing. |
| `apps/mobile/src/app/(tabs)/index.tsx`: lines 1–6 | Gate connected Home on the existing account scope, pass supported activity/draft editor navigation and reuse the unchanged unavailable protection presentation for the neutral preview. |
| `apps/mobile/src/app/(tabs)/index.tsx`: lines 11–25 | Gate connected Home on the existing account scope, pass supported activity/draft editor navigation and reuse the unchanged unavailable protection presentation for the neutral preview. |
| `apps/mobile/src/features/home/README.md`: lines 5–10 | Update current producer/route facts and document shared settings projection, canonical-only values, freshness/error/offline behavior, native absence and retained acceptance gates. |
| `apps/mobile/src/features/home/README.md`: lines 62–63 | Update current producer/route facts and document shared settings projection, canonical-only values, freshness/error/offline behavior, native absence and retained acceptance gates. |
| `apps/mobile/src/features/home/README.md`: lines 112–150 | Update current producer/route facts and document shared settings projection, canonical-only values, freshness/error/offline behavior, native absence and retained acceptance gates. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 1–146 | Provide synthetic accepted settings/account fixtures and controlled helpers without live credentials; consumer checks reuse real account/controller/query/decoder components. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 147–163 | Verify Home and Settings deduplicate their read and display identical canonical partial summaries. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 164–187 | Verify verified missing row and explicit empty selection/draft have distinct labels without writes. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 188–209 | Verify Home never shows a dirty or pending activity draft; accepted canonical save updates it immediately. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 210–224 | Verify accepted draft saves and explicit section clear update Home without activating native protection. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 225–242 | Verify an uncertain write never publishes its unverified response; a deliberate GET can update canonical summaries. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 243–257 | Verify failed background reads hide old values in both surfaces while metrics and native availability still render. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 258–269 | Verify malformed foreign read hides prior values without retry loops and explicit retry restores them. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 270–284 | Verify pending initial read is loading rather than missing; its failure cannot create defaults. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 285–309 | Verify background refresh marks updating while showing the last canonical value, then updates both surfaces. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 310–320 | Verify offline masks cached private labels on both surfaces and reconnect never submits a write. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 321–342 | Verify credential unavailability masks saved data and API pause offers deliberate existing-controller recovery. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 343–376 | Verify account/generation replacement rejects a late old read. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 377–383 | Verify sign-out retires the private Home region rather than retaining preference summaries. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.test.tsx`: lines 384–417 | Verify the actual route mounts the consumer only inside the provider and passes supported detail navigation. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/home/connected-home-screen.tsx`: lines 1–11 | Compose the existing controller/action, summary query and Home presentation; no native adapter or second Auth producer is added. |
| `apps/mobile/src/features/home/connected-home-screen.tsx`: lines 12–19 | Reuse the existing unavailable device card until RN-08c supplies real status. Saved preferences/revisions cannot make protection active. |
| `apps/mobile/src/features/home/connected-home-screen.tsx`: lines 20–69 | Derive safe offline/account/recovery presentation from the real scope and shared summaries; retry reads deliberately and keep metric/native inputs unavailable. |
| `apps/mobile/src/features/home/home-model.ts`: lines 41–41 | Correct the unavailable model comment: metric/outcome producers remain unavailable while saved preferences use their separate composition slot. No data shape or sample defaults change. |
| `apps/mobile/src/features/home/home-preferences.tsx`: lines 1–17 | Define typed activity/draft navigation and stable labels using existing shared controls, theme and summary value formatting. |
| `apps/mobile/src/features/home/home-preferences.tsx`: lines 18–81 | Present canonical preference rows, marked loading/updating/error states and optional supported editor navigation in a growing card; drafts never imply protection. |
| `apps/mobile/src/features/home/home-preferences.tsx`: lines 82–88 | Reuse warm card/type recipes with growing content and no fixed row height or source asset substitutions. |
| `apps/mobile/src/features/home/home-screen.tsx`: lines 18–19 | Add one optional preferences slot within the existing Home scroll/card composition, distinct from native protection and the unchanged metric/outcome model. |
| `apps/mobile/src/features/home/home-screen.tsx`: lines 31–31 | Add one optional preferences slot within the existing Home scroll/card composition, distinct from native protection and the unchanged metric/outcome model. |
| `apps/mobile/src/features/home/home-screen.tsx`: lines 84–84 | Add one optional preferences slot within the existing Home scroll/card composition, distinct from native protection and the unchanged metric/outcome model. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 3–4 | Reuse the shared summary hook/projection for activities and all draft labels, so Home/Settings use identical availability, canonical data and offline handling; retain profile composition. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 8–8 | Reuse the shared summary hook/projection for activities and all draft labels, so Home/Settings use identical availability, canonical data and offline handling; retain profile composition. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx`: lines 13–13 | Reuse the shared summary hook/projection for activities and all draft labels, so Home/Settings use identical availability, canonical data and offline handling; retain profile composition. |
| `apps/mobile/src/features/settings/settings-summary-model.test.ts`: lines 1–28 | Provide synthetic accepted settings/account fixtures and controlled helpers without live credentials; consumer checks reuse real account/controller/query/decoder components. |
| `apps/mobile/src/features/settings/settings-summary-model.test.ts`: lines 29–51 | Verify distinguishes initial loading, verified absence and an explicit empty selection/draft. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/settings/settings-summary-model.test.ts`: lines 52–59 | Verify retains canonical labels, Unicode and partial fields without active or measured claims. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/settings/settings-summary-model.test.ts`: lines 60–74 | Verify parameterized account-generation or availability fencing. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/settings/settings-summary-model.test.ts`: lines 75–92 | Verify masks private cached labels offline and after a read error; paused absence is not a verified missing row. Synthetic tests establish consumer behavior, not hosted/native/device acceptance. |
| `apps/mobile/src/features/settings/settings-summary-model.ts`: lines 1–10 | Use generated accepted settings types and existing availability/display types for one canonical Home/Settings summary model. |
| `apps/mobile/src/features/settings/settings-summary-model.ts`: lines 11–38 | Project exact activity/partial-plan labels only from verified data, distinguishing null absence/empty and masking unavailable/offline/read-error values. |
| `apps/mobile/src/features/settings/use-settings-summary.ts`: lines 1–27 | Observe existing account availability, online manager and the sole scoped settings query. Derive summary during render; no effect copies, private Home store or additional request key. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 287–297 | Append current preference composition, actual checks, next independent work and retained native/hosted/Auth/phone/product gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Record k saved-preference implementation separately from pending RN-08c native status, preserving existing part/deferral IDs, counts and parent acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 593–593 | Record k saved-preference implementation separately from pending RN-08c native status, preserving existing part/deferral IDs, counts and parent acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 603–603 | Record k saved-preference implementation separately from pending RN-08c native status, preserving existing part/deferral IDs, counts and parent acceptance. |
| `docs/core_plan/04_react_native_integration.md`: lines 651–673 | Record k saved-preference implementation separately from pending RN-08c native status, preserving existing part/deferral IDs, counts and parent acceptance. |
| `docs/core_plan/README.md`: lines 270–280 | Append the current k checkpoint, actual validation and next l/Android work while preserving full native/live acceptance and existing top-level counts. |
| `apps/mobile/src/features/settings/connected-settings-screen.tsx` (parent `1326601`): lines 1–29 | Extract the existing inline canonical/availability projection into the shared pure summary and scoped hook, then consume it from both Home and Settings. Old-source range; no response is copied into local state. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–26 | Refresh current part, branch/date, current evidence and next step while retaining historical entries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2399–2399 | Record RN-09j’s actual hash during this normal update without rewriting its historical implementation evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2538–2628 | Record this commit’s scope, decisions, exact file/line coverage, actual checks and retained native/hosted/Auth/device/product gates. Own hash stays Pending until the next normal update. |


### RN-09l — Verify settings persistence and isolation

**Commit message:** `test(mobile): verify settings persistence and isolation`.
**Hash:** `a0cb9bc` (recorded during RN-08a).
**Date:** 2026-11-03. **Owner:** Ishmum.
**Branch:** `task/react-native/rn-09l-settings-acceptance`. **Parent:** `dd74a80` (RN-09k).
**Status:** Local automated acceptance implemented and passed. Hosted/Auth/root, authenticated phone, native status/revocation and signed-device acceptance remain pending; full RN-09/Plan 04 is open.

**User request / interpretation:** “Implement RN-09I” follows the next-step discussion of RN-09l; the initial update explicitly interpreted the final character as lowercase l. RN-09i is already implemented in `daf4247`. Continue the existing Plan 04 notes/IDs, rather than repeat i or create a new plan.

**Decisions and implementation:**

- The existing API-12 tests prove server/database behavior and the RN-09i/j/k tests prove controlled mobile behavior, but did not cross the actual mobile-client-to-HTTP boundary. Add a dedicated, explicitly selected developer Vitest acceptance file/config, invoked by a guarded database pytest wrapper. It imports the production portable API client, settings runtime decoder, account controller/scope, activity request projection, plan field-group projection and Home/Settings summary projection. No production feature or Auth SDK code is added or changed.
- Reuse the existing FastAPI process fixture and normal JWT verification: an ephemeral Python signer supplies a public JWKS through the existing test transport and private short-lived local tokens to the child environment. The signing key remains in Python memory. The child fixture requires explicit marker, three disposable identities and a loopback HTTP origin. It does not read the real API `.env`, hosted keys or local live-account token file. This is a test credential port, not another application Auth/session manager or an Auth SDK acceptance claim.
- Move the API-12 restart test's process context manager into shared `tests.support.http`. Readiness, actual loopback TCP, bounded start/stop, suppressed process logs and task-owned termination behavior are preserved. Both the original restart test and new mobile wrapper reuse it. No verifier/route shortcut, migration reset or separate settings server implementation is introduced.
- Seven mobile scenarios execute before restart: absent/explicit empty creation and A/B/C isolation; actual nested validation plus nullable partial draft round-trip; overlapping activity/day PATCH requests with one CAS conflict and explicit latest-base retry; an actual committed write whose real response is deliberately consumed/lost; held real HTTP reads rejected after A-to-B/same-user generation replacement; offline write rejection before dispatch/no replay; and explicit section clears preserving omitted data plus a final canonical sentinel. These execute real requests and real PostgreSQL transactions, not mocked response JSON. The existing SQL race tests independently cover multiple database-connection concurrency.
- Stop the first FastAPI subprocess and start a second PID. A new Node/mobile client process executes the eighth scenario, recovering the exact revision-nine activity/partial-plan sentinel, independent B preferences and absent C settings. The Python parent separately reads persisted SQL, confirms no post-restart writes and unchanged profile rows. Existing fixture teardown deletes only the random local test users and their cascade rows; it is unrelated to the user-deferred hosted disposable-C deletion.
- Parent subprocess environment forwards only selected toolchain/system variables plus the ephemeral fixture payload. It captures and withholds raw child output, reports only fixed failed test titles, asserts exact nested scenario counts and removes temporary JSON reports in finally. No JWT, private key or database URI is written to committed evidence. Missing Node/mobile dependencies fails the DB check rather than silently skipping it.
- Add real Router component tests using the actual Home/detail routes, Stack, account provider and removal guard with synthetic API/Auth ports. Hardware-style Router back on activity/day drafts can Keep editing or Discard and leave; reopening starts from accepted data. Local Back leaves once without a second prompt. A confirmed save returns to retained Home with canonical summaries; an uncertain save remains guarded/blocked after Keep editing and does not replay. There is no mock of useRouteDraftGuard or Router in these tests. This proves Router behavior on platform presets, not actual phone gestures/speech.
- Add Node setup/npm ci to the existing required database CI job because the PostgreSQL acceptance now invokes the mobile client. Reuse the pinned toolchain/actions and existing database guards/cleanup. Add `RN09L_HTTP_ACCEPTANCE_ONLY` to release export isolation. Ordinary Vitest still selects only portable src tests; the new acceptance file runs only with its dedicated developer config. No runtime source, lockfile, package dependency, native project or cloud configuration changes.
- Add one acceptance matrix and sanitized JSON evidence describing actual layers, fixture/toolchain versions and explicit remaining gates. Extend existing developer/API test runbooks. Native absence remains truthful under existing tests; native revocation/install/permission behavior cannot be tested until RN-08a–d exist. Maintain k's native dependency and full Auth/root/iOS/product acceptance separately.

**Actual validation:**

- `npm run api:db:up`: started only the named guarded fixture; initial Docker inventory showed it was not running. PostgreSQL observed **17.11 (Debian 17.11-1.pgdg12+2)**, host Darwin arm64, Node **24.20.0**, Python **3.12.14**.
- `uv run --project services/api pytest services/api/tests/db/test_mobile_settings_acceptance.py -o addopts= -m database -q`: **1 passed**, enforcing **7 + 1 = 8** nested mobile HTTP scenarios across actual process restart. This is one DB pytest case, not eight extra counted DB tests.
- `npm run test:components --workspace @disconnect/mobile -- settings-navigation.test.tsx`: initial four scenarios **8 passed** across Android/iOS. A fifth uncertain-save scenario was then added and all **10** new checks passed in the full suite below.
- `npm run check`: **352 portable mobile / 488 Android+iOS component / 590 deterministic API tests pass**. Default API selection deselects 192 DB checks. Workspace TypeScript/ESLint, Ruff, original assets, environment-free OpenAPI and pinned generated DTO checks pass. The acceptance TS/config participates in mobile type/lint checks without running against a missing DB in the normal unit suite.
- `npm run api:db:test`: **192 passed, 590 deselected**, including the original extracted API restart case and new mobile HTTP wrapper. Actual migrations, role/RLS, isolation, race, rollback and restart checks pass. No hosted URL or migration is used.
- `npm run mobile:export`: **38** app JS/HTML files pass preview/acceptance marker isolation; **71** original SVG assets pass integrity/export checks. No new native compilation was needed for this test/docs/CI-only change; prior k compilation evidence remains historical, not a new physical-device claim.
- `npm run api:db:down`: stopped/removed only the task-started disposable container/network and retained its labeled volume. The scoped fixture had already cleaned its random users/data. No global Docker cleanup, volume reset, managed account or hosted Auth mutation occurred.
- Workflow YAML parses with the installed `js-yaml` module and verifies npm ci precedes DB acceptance. Sanitized evidence JSON and runbook relative links validate. `git diff --check` and current/parent line-range plus changed-file coverage checks pass before commit. GitHub Actions workflow prerequisites are updated, but the remote workflow was not executed/pushed here.

**Failures corrected:** The first scaffold used `describe.sequential`, unavailable in the pinned Vitest API; use its normal serial suite configuration (`fileParallelism: false`) instead. Typecheck and the initially failed child startup then pass. Initial Router reopen assertions used low-level immediate fireEvent button presses, which raced the retained navigation/button event lifecycle; use the same userEvent press simulation as existing actual Router tests. Keep/discard/reopen then passes on both presets without changing production navigation behavior. An optional YAML syntax probe first tried an unavailable `yaml` package; use the already-installed `js-yaml` parser instead, which validates workflow syntax/prerequisite order without a dependency change. Full checks have no unresolved failures.

**Remaining / next:** Next independent implementation is RN-08a, followed by b/c/d to supply actual Android capability/permission/status evidence and finish k's native wiring/l's native lifecycle acceptance. Hosted migration 0002, actual Auth/root integration and authenticated phone flows, native revocation/installation, signed Android/iOS, TalkBack/VoiceOver speech and remaining product answers remain open. Anisha owns Auth/onboarding/root and native iOS. Prior user deferrals for authenticated-phone token refresh and dedicated disposable-C hosted deletion are preserved. This locally automated l increment does not complete parent RN-09, API-10 or Plan 04; totals remain 46 top-level parts / 21 implemented producers / 25 pending. RN-09k's actual hash `dd74a80` is recorded during this normal update. Local commit only; no push, merge or deployment. User workspace/icon packs and all private ignored environment/credential files stay excluded.

**Changed files and exact line coverage (this commit):**

| File and lines | Change and reason |
|---|---|
| `.github/workflows/checks.yml`: lines 53–58 | Install the pinned Node toolchain and mobile dependencies in the existing required DB job before running the same guarded PostgreSQL group; rename the step to include mobile HTTP coverage. |
| `.github/workflows/checks.yml`: lines 65–65 | Install the pinned Node toolchain and mobile dependencies in the existing required DB job before running the same guarded PostgreSQL group; rename the step to include mobile HTTP coverage. |
| `apps/mobile/dev/profile/README.md`: lines 126–141 | Document the separate guarded HTTP acceptance config, real portable-client layers, run commands and exact distinction from hosted/Auth/native/device QA. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 1–39 | Import production portable API/scope/settings/projection modules and require an explicit ephemeral loopback-only acceptance payload. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 40–127 | Define synthetic final sentinels and a test-only credential port/real Fetch wrapper; observe statuses, hold actual responses or consume/lose one committed write response without mocking JSON. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 128–166 | Own bounded test clients and cleanup, read canonical settings through actual scopes, and reuse the production Home/Settings projection. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 167–186 | Verify verified absence, explicit empty preferences and two-user isolation cross the actual wire. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 187–218 | Verify authoritative nested validation and partial nullable plan fields survive request/response decoding. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 219–255 | Verify real concurrent section writes have one conflict; explicit latest-base retry preserves the winner. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 256–270 | Verify a real committed save with its response lost is uncertain and requires a GET without replay. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 271–300 | Verify A-to-B and same-user generation changes suppress old actual HTTP read/cache effects. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 301–314 | Verify offline writes are not dispatched, queued or replayed when connectivity returns. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 315–348 | Verify explicit clears preserve omitted sections and final canonical sentinel is saved for a cold restart. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/settings-http.acceptance.ts`: lines 349–361 | Verify cold mobile clients recover the same canonical data after the actual API process restarts. Requests use real loopback TCP, normal JWT verification and isolated PostgreSQL; UI review remains separately tested. |
| `apps/mobile/dev/profile/acceptance/vitest.config.mts`: lines 1–11 | Select only the explicitly invoked acceptance TS file in Node, with a bounded timeout and serial file execution; ordinary portable tests remain independent of DB availability. |
| `apps/mobile/src/features/settings/settings-navigation.test.tsx`: lines 1–76 | Create synthetic scoped API/Auth fixtures and mount the actual Home/detail routes inside the existing provider and Stack; use the actual removal guard and normal userEvent button interaction. |
| `apps/mobile/src/features/settings/settings-navigation.test.tsx`: lines 77–103 | Verify actual activity/day dirty Router removal with keep/discard and clean reopen. Both Android/iOS component presets exercise the actual Router/removal guard, not physical gestures or Auth SDK. |
| `apps/mobile/src/features/settings/settings-navigation.test.tsx`: lines 104–116 | Verify local Back confirmation leaves through the real removal guard once, without a second prompt. Both Android/iOS component presets exercise the actual Router/removal guard, not physical gestures or Auth SDK. |
| `apps/mobile/src/features/settings/settings-navigation.test.tsx`: lines 117–130 | Verify accepted save permits real Back without discard and updates the retained Home summary. Both Android/iOS component presets exercise the actual Router/removal guard, not physical gestures or Auth SDK. |
| `apps/mobile/src/features/settings/settings-navigation.test.tsx`: lines 131–147 | Verify an unconfirmed save remains dirty behind real Router removal and cannot replay after Keep editing. Both Android/iOS component presets exercise the actual Router/removal guard, not physical gestures or Auth SDK. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 298–309 | Append current l local-acceptance evidence, commands/discovery link, next RN-08a work and retained hosted/Auth/native/phone/user-deferral gates. |
| `docs/core_plan/04_react_native_integration.md`: lines 196–196 | Update original l/parent ledger and checkpoint with local HTTP/DB/Router evidence while retaining k native and l hosted/Auth/device acceptance and unchanged counts. |
| `docs/core_plan/04_react_native_integration.md`: lines 593–593 | Update original l/parent ledger and checkpoint with local HTTP/DB/Router evidence while retaining k native and l hosted/Auth/device acceptance and unchanged counts. |
| `docs/core_plan/04_react_native_integration.md`: lines 604–604 | Update original l/parent ledger and checkpoint with local HTTP/DB/Router evidence while retaining k native and l hosted/Auth/device acceptance and unchanged counts. |
| `docs/core_plan/04_react_native_integration.md`: lines 674–701 | Update original l/parent ledger and checkpoint with local HTTP/DB/Router evidence while retaining k native and l hosted/Auth/device acceptance and unchanged counts. |
| `docs/core_plan/README.md`: lines 281–294 | Append the l local-acceptance checkpoint, exact check counts, CI dependency and next independent Android work without claiming full parent acceptance. |
| `docs/core_plan_implementation_notes/artifacts/rn-09l/verification.json`: lines 1–54 | Record sanitized observed versions/counts, actual HTTP/DB/restart evidence and false hosted/Auth/native/device acceptance without identities or credentials. |
| `docs/qa/rn09-settings-acceptance.md`: lines 1–34 | Define the local automated acceptance boundary, actual commands/layers and links to detailed evidence without claiming full Plan 04. |
| `docs/qa/rn09-settings-acceptance.md`: lines 35–54 | Map each save/reload/isolation/review/offline/navigation/native scenario to actual evidence and explicitly pending hosted/Auth/device acceptance. |
| `docs/qa/rn09-settings-acceptance.md`: lines 55–86 | Give guarded reproduction/focused commands, CI/toolchain prerequisites, fixture cleanup and exact next independent work; preserve user deferrals. |
| `scripts/check-ui-preview-isolation.mjs`: lines 32–32 | Reject the new developer-only HTTP acceptance fixture marker in actual production JS/HTML exports. |
| `services/api/tests/db/test_mobile_settings_acceptance.py`: lines 1–22 | Use existing guarded DB/process/ephemeral signing fixtures; no hosted configuration or Auth SDK is read. |
| `services/api/tests/db/test_mobile_settings_acceptance.py`: lines 23–72 | Spawn the production portable mobile acceptance with a minimal private environment, exact scenario count and bounded timeout; withhold raw child output and expose fixed failed titles only. |
| `services/api/tests/db/test_mobile_settings_acceptance.py`: lines 73–114 | Run write/restart phases against separate actual FastAPI PIDs, independently verify persisted SQL and unchanged profiles, and delete transient reports in finally. |
| `services/api/tests/db/test_settings_restart.py`: lines 4–4 | Reuse the extracted shared process context manager; retain the original actual HTTP API restart assertions unchanged. |
| `services/api/tests/support/README.md`: lines 81–103 | Document Node/mobile prerequisites, guarded real HTTP process/client checks, credential/report hygiene and retained hosted/device limits. |
| `services/api/tests/support/http.py`: lines 3–6 | Move the existing API-12 task-owned process startup/readiness/teardown helper into common HTTP support, preserving real verifier, ephemeral JWKS and bounded loopback lifecycle. |
| `services/api/tests/support/http.py`: lines 8–9 | Move the existing API-12 task-owned process startup/readiness/teardown helper into common HTTP support, preserving real verifier, ephemeral JWKS and bounded loopback lifecycle. |
| `services/api/tests/support/http.py`: lines 12–12 | Move the existing API-12 task-owned process startup/readiness/teardown helper into common HTTP support, preserving real verifier, ephemeral JWKS and bounded loopback lifecycle. |
| `services/api/tests/support/http.py`: lines 42–90 | Move the existing API-12 task-owned process startup/readiness/teardown helper into common HTTP support, preserving real verifier, ephemeral JWKS and bounded loopback lifecycle. |
| `services/api/tests/db/test_settings_restart.py` (parent `dd74a80`): lines 1–65 | Move the prior process helper/imports to shared tests.support.http and import it here; preserve the existing restart test. Old-source range accounts for removed implementation. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–26 | Refresh the current part/branch/resume evidence and next Android step while retaining historical entries. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2544–2544 | Record RN-09k’s actual hash during the normal next implementation update. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2634–2718 | Record this commit’s actual HTTP/DB/Router scope, exact changes, checks, corrected scaffold/test timing failures and retained acceptance/handoff. Own hash remains Pending until the next normal update. |


### RN-08a — Bounded Android capability probe

**Commit:** `chore(android): add a bounded capability probe`. **Hash:** `6117b96` (recorded during RN-08b).
**Date:** 2026-11-03. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-android-foundation`. **Parent:** `a0cb9bc`.
**Status:** Probe and Android-only development host implemented; actual APK/test APK build/install and initial denied Kotlin device observation pass. Grant/revocation/lock/empty-window matrix continues in b/d.

**Decisions / exact scope:**
- One local Expo Android module under `apps/mobile/modules/hoosh-usage` is autolinked into the existing mobile project. No new standalone app or iOS generation. Development application ID `com.hoosh.disconnect.dev` is deliberately separate from a future store identity. Existing native QA receives a probe page, with no Auth/server dependency. Its marker is blocked from app exports.
- Actual UsageStatsManager queryEvents is bounded to 1–15 minutes/1,000 scanned events. Only count/capped/state/bounds/own-package visibility leave Kotlin. No package/event identifiers are copied, persisted, logged or uploaded. User first-unlock and current keyguard are separate observations and both gate the query; recheck permission/lock afterward. Unknown/denied/locked/error counts are null. Own package visibility is not evidence of an app catalog.
- Generate only Android (`CI=1 npx expo prebuild --platform android --no-install`). Track the host, Gradle wrapper/resources and test instrumentation, while ignoring generated builds/caches/local.properties/signing material. The template's ordinary local debug signing is retained; release signing is unset. Template launcher assets are development scaffolding, not final production branding/Figma replacements.
- Remove template overlay/legacy storage permissions from main/debug/debugOptimized manifests, including higher-priority debug declarations. Final merged APK has usage access with no overlay/storage/accessibility/foreground-service/broad-package permission. No rule/timer/selection/metrics/outbox is implemented. Native iOS tracked files remain unchanged.
- Prepare JDK/SDK locally under `/tmp/hoosh-android-build-tools`, not in the repo: checksum-verified Temurin 17.0.21+9 and official Google command-line ZIP. Existing adb was found at `/tmp/hoosh-android-tools/platform-tools`. SDK/NDK versions follow installed RN/Expo Gradle inputs: compile 37/target 36/min 24, NDK 27.1.12297006, Gradle 9.4.1; SDK platform package is android-37.0. No global Java path/config or production signing is changed.

**Actual checks / device evidence:**
- User connected/unlocked the authorized Pixel 8 Pro; adb observed Android 16/API 36. It initially had no development package; after installation, AppOps GET_USAGE_STATS is default and the real reader reports denied with null count, unlocked=true, keyguard=false and own package visible=true. Actual instrumentation result and debug APK SHA are sanitized in `artifacts/rn-08/probe-a.json`; no device serial or app/event identities are committed.
- Android debug APK build passed (481 tasks first build); final combined `:app:assembleDebug :app:assembleDebugAndroidTest -PreactNativeArchitectures=arm64-v8a` passed (533 tasks, 30 executed). Both APKs installed with adb. Custom development test instrumentation ran the actual reader and returned the denied observation. Metro/native QA compiled (529 modules); no claim yet that permission/lifecycle UI is accepted.
- `expo-modules-autolinking resolve --platform android --json` discovers the intended local module/class. Mobile TypeScript and ESLint pass; `git diff --exit-code -- apps/mobile/ios` passes. Final merged manifest audit shows usage permission and no SYSTEM_ALERT_WINDOW/legacy-storage declarations. Signing keys/local SDK/Gradle outputs are excluded.
- Official sources reviewed: https://docs.expo.dev/modules/get-started/ ; https://docs.expo.dev/modules/autolinking/ ; https://developer.android.com/reference/android/app/usage/UsageStatsManager ; https://developer.android.com/training/package-visibility . Tool versions/capabilities come from this actual checkout/device, not guessed parity.

**Failures corrected / limits:** Python urllib's JDK metadata request returned 403; curl retrieved the official binary/checksum successfully. SDK manager requires platforms;android-37.0 rather than android-37. Initial concurrent first builds raced transitive build-tools 36 installation; the final serial combined build passes. Template overlay declaration survived in debug priority until explicitly removed in both debug manifests; final merged audit is clean. Initial shell reads used a nested cwd with root-relative paths; those failed without modifying files and were rerun from root. Kotlin/AGP dependency deprecation warnings remain upstream, not build failures. Generated Windows wrapper CRLF was normalized to LF after the whitespace check flagged it; line content/count is preserved. Full workspace/export checks follow once the sequential adapter/UI changes are complete.

**Handoff / next:** Extend this same reader/module in RN-08b with native capabilities/status and explicit usage-access settings action; all unsupported protection operations must reject. RN-08c wires foreground/focus state, d executes the full real-device matrix and cleanup. Usage access is observation only and cannot produce an installed/active rule. Anisha's iOS/Auth/root, product enforcement and release/accessibility gates remain open. No hosted/Auth/API mutation, native enforcement, push or merge. Existing workspace/icon packs remain excluded. RN-09l's hash `a0cb9bc` is recorded during this normal update.

**Every changed file / exact commit line ranges:**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/android/.gitignore`: lines 1–20 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/build.gradle`: lines 1–175 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/proguard-rules.pro`: lines 1–14 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 1–25 | Add UsageProbeInstrumentation.kt for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/android/app/src/debug/AndroidManifest.xml`: lines 1–7 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/debugOptimized/AndroidManifest.xml`: lines 1–7 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/AndroidManifest.xml`: lines 1–33 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/java/com/hoosh/disconnect/dev/MainActivity.kt`: lines 1–65 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/java/com/hoosh/disconnect/dev/MainApplication.kt`: lines 1–45 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/drawable/ic_launcher_background.xml`: lines 1–3 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/drawable/rn_edit_text_material.xml`: lines 1–37 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/drawable/splashscreen_logo.xml`: lines 1–4 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.webp` | Binary Expo template development resource (3056 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.webp` | Binary Expo template development resource (5024 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.webp` | Binary Expo template development resource (2096 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.webp` | Binary Expo template development resource (2858 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.webp` | Binary Expo template development resource (4569 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.webp` | Binary Expo template development resource (7098 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.webp` | Binary Expo template development resource (6464 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp` | Binary Expo template development resource (10676 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp` | Binary Expo template development resource (9250 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp` | Binary Expo template development resource (15523 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/app/src/main/res/values-night/colors.xml`: lines 1–1 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/values/colors.xml`: lines 1–4 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/values/strings.xml`: lines 1–5 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/app/src/main/res/values/styles.xml`: lines 1–14 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/build.gradle`: lines 1–25 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/gradle.properties`: lines 1–78 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/gradle/wrapper/gradle-wrapper.jar` | Binary Expo template development resource (46175 bytes); no source line numbers. Preserve generated wrapper/launcher resource for reproducible Android development builds; no signing key or final product artwork. |
| `apps/mobile/android/gradle/wrapper/gradle-wrapper.properties`: lines 1–7 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/gradlew`: lines 1–248 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/gradlew.bat`: lines 1–98 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/android/settings.gradle`: lines 1–39 | Check in the Expo Android development host/resource; preserve Android-only generation, local debug signing, unset release signing and minimal permission configuration described above. No iOS file is changed. |
| `apps/mobile/app.config.ts`: lines 14–22 | Add app.config.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 2–2 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 68–68 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 126–126 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/usage-probe.tsx`: lines 1–57 | Expose developer-only real probe observations through the existing native QA entry; preserve unavailable/busy/error behavior and unmount safety. |
| `apps/mobile/modules/hoosh-usage/android/build.gradle`: lines 1–12 | Add build.gradle for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/modules/hoosh-usage/android/src/main/AndroidManifest.xml`: lines 1–3 | Add AndroidManifest.xml for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 1–13 | Expose the same local Kotlin reader through the Expo bridge with real context/errors; no successful enforcement/event stubs. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/UsageReader.kt`: lines 1–63 | Read actual AppOps/unlock/keyguard/own-package evidence and bounded count-only events; denied/locked/error never becomes zero, and no identifiers or enforcement escape. |
| `apps/mobile/modules/hoosh-usage/expo-module.config.json`: lines 1–4 | Add expo-module.config.json for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/modules/hoosh-usage/package.json`: lines 1–5 | Add package.json for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `docs/core_plan/04_react_native_integration.md`: lines 450–450 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 457–457 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 1001–1009 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/probe-a.json`: lines 1–36 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/android-capability-probe.md`: lines 1–74 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `scripts/check-ui-preview-isolation.mjs`: lines 33–33 | Add check-ui-preview-isolation.mjs for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2637–2637 | Record the preceding part hash during this normal update; retain its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–13 | Update current part/branch checkpoint; previous evidence remains historical. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2721–2800 | Record this part’s decisions, actual checks/failures, every file/line and remaining work. Own hash stays Pending until next normal update. |


### RN-08b — Android read and usage-access adapter

**Commit:** `feat(android): expose measured capabilities and usage access`. **Hash:** `6734a26` (recorded during RN-08c).
**Date:** 2026-11-03. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-android-foundation`. **Parent:** `6117b96`.
**Status:** Same native module extended and adapter implemented; actual denied/granted Kotlin observations and 30 portable checks pass. UI registration/foreground wiring and complete device matrix continue c/d.

**Decisions / changes:** Extend UsageReader with honest unsupported protection capabilities (every protection/summary flag false, picker unavailable), freshly read authorization and inactive/needs-permission status with no installed revision/reasons. Add explicit Settings ACTION_USAGE_ACCESS_SETTINGS with app-specific URI/general fallback, narrow intent visibility and main-queue launch; absent/unavailable activity throws rather than pretending grant. The TypeScript adapter consumes only those methods, validates every native shape and strips extras/untrusted notes. Every unsupported pick/get-selection, apply/cancel, allowance, event drain/ack operation rejects. No timer, restriction, package catalog or successful empty event stub exists. Permission request is serialized and returns a current read, not a promise that the user granted it; c refreshes again on foreground return. Raw native exceptions become fixed safe errors.

**Actual checks:** Combined debug/test APK build passes (533 tasks, 43 executed); APK/test APK install successfully. Instrumentation reports denied/needs_permission/null revision and, after an explicit temporary AppOps grant for our own development package, authorized/inactive/null revision/empty reasons. All capability flags remain false. The one-minute bounded query returned ready/count 5/capped false; no identifiers leave the module. Sanitized evidence and APK SHA are in adapter-b.json. `npm run test:unit --workspace @disconnect/mobile -- src/infrastructure/native/android-usage-adapter.test.ts` passes 30 checks: absent/incomplete modules, safe native validation, all grant states, fabricated capability/installed claims, extra/private fields, exceptions, duplicate intent serialization, failed intent retry and every unsupported operation. Mobile TypeScript passes; no new dependency or Auth/root/iOS change. Actual Settings UI launch and native return/revoke lifecycle are c/d acceptance, not inferred from these tests. Full shared/export checks follow c/d. No unresolved adapter/build failure.

**Remaining / ownership:** c registers the Android module and connects existing protection/read presentation with actual foreground + route visibility, busy/errors and safe native permission action. d tests real grant/deny/revoke/lock/empty/read/UI/API-independence and restores the temporary permission to initial default. Usage access never installs protection; unsupported mode refers to this build, not an Android-wide verdict. Anisha's iOS/Auth and all enforcement/ownership/product policy remain unchanged. The existing RN-08a hash 6117b96 is recorded during this normal update. Local sequential commit; no hosted/API operation, push or merge.

**Every changed file / exact commit line ranges:**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 18–21 | Add UsageProbeInstrumentation.kt for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/modules/hoosh-usage/android/src/main/AndroidManifest.xml`: lines 3–3 | Add AndroidManifest.xml for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 5–5 | Expose the same local Kotlin reader through the Expo bridge with real context/errors; no successful enforcement/event stubs. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 13–15 | Expose the same local Kotlin reader through the Expo bridge with real context/errors; no successful enforcement/event stubs. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/UsageReader.kt`: lines 8–10 | Read actual AppOps/unlock/keyguard/own-package evidence and bounded count-only events; denied/locked/error never becomes zero, and no identifiers or enforcement escape. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/UsageReader.kt`: lines 17–38 | Read actual AppOps/unlock/keyguard/own-package evidence and bounded count-only events; denied/locked/error never becomes zero, and no identifiers or enforcement escape. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 4–4 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 13–20 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/android-usage-adapter.test.ts`: lines 1–151 | Add android-usage-adapter.test.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/android-usage-adapter.ts`: lines 1–128 | Add android-usage-adapter.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `docs/core_plan/04_react_native_integration.md`: lines 450–450 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 458–458 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/adapter-b.json`: lines 1–71 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/android-capability-probe.md`: lines 75–101 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2723–2723 | Record the preceding part hash during this normal update; retain its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–13 | Update current part/branch checkpoint; previous evidence remains historical. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2803–2835 | Record this part’s decisions, actual checks/failures, every file/line and remaining work. Own hash stays Pending until next normal update. |


### RN-08c — Native status and foreground integration

**Commit:** `feat(protection-ui): connect Android status and foreground refresh`. **Hash:** `d1aa6ee` (recorded during RN-08d).
**Date:** 2026-11-03. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-android-foundation`. **Parent:** `6734a26`.
**Status:** Android registration/read/permission integration implemented and verified; full physical matrix/cleanup continues d.

**Changes / reasons:** Register a stable Android-only optional module/adapter, with iOS delegated to Anisha and web/absent-module fallback unchanged. Home's connected and neutral routes render the native region independently of API/Auth; no root/provider change. Existing protection read hook gets actual Router focus AND AppState foreground, and exposes authorization only when current read sources agree. Integration/visibility changes, errors and deadlines invalidate stale evidence. Desired native revision is null: no configuration is installed and no API draft/revision is substituted. The unsupported copy now describes this build instead of falsely judging the device. A separate usage-access region explains authorization without claiming protection, and delegates explicit settings launch to the shared port. Operation-long launch/read busy, same-turn/in-flight duplicate fences, fixed safe failures, deliberate retry and module/unmount generation fences prevent stale callbacks. A native read retry never opens permission settings. The existing developer QA renders the same production view with real AppState, disables simulated probe-state controls and labels real observations instead of source examples. No account attribution, native writes, sign-out cleanup, iOS edit or cloud dependency.

**Actual checks:** `npm run check` passes 382 portable / 502 Android+iOS component / 590 API plus types/lint/contracts/assets; ordinary API excludes 192 DB checks (no backend changes). New `device-protection.test.tsx` contributes 14 checks: granted does not imply active; hide/show and external revoke; permission busy/duplicates/failure/retry; read retry without permission; replacement/unmount late action; module absence; actual Router focus plus AppState and listener cleanup. Existing protection/Home regressions pass 98 focused checks. `npm run mobile:export` passes 38-file isolation/71 assets. `npx expo export --platform android --output-dir .expo/rn08c-android` produces real production Hermes bytecode including registry/consumer. These are separate from actual device observations. On Pixel Android 16, the development APK loaded the native QA component: module connected, usage allowed, protection unimplemented/inactive; Review usage access opened the own-app Android Settings page and Back returned to the app. Full device revoke/lock/cold/font/absence matrix remains d; no speech/release signing claim. Version/checkpoint artifact integration-c.json and runbook record evidence.

**Failures / corrections:** Test mocks initially widened string literals beyond generated capability/status types and used an undeclared absolute test route; explicit return types and a relative Router test path fix typecheck. Dependency warnings are upstream; final checks pass. The phone auto-locked during the build; user unlocked it on request, and temporary USB stay-awake (initial 0) prevents repeated lock during interactive checks; d restores that exact value. No lock-screen content or personal identifiers are committed. Native QA footer previously called every screen sample data; actual probe now has explicit real-device labels and no simulated state selection. No unresolved source/test error.

**Next:** d records real grant/deny/revoke, keyguard/empty window, foreground/cold start, API-independent Kotlin reads, absent-module builds, responsive/accessibility labels and restores own-package AppOps/USB state. Native enforcement, signed release, speech, iOS/Auth and unresolved policy remain open; this is read/permission status only. RN-08b hash 6734a26 is recorded during the normal update. No hosted/Auth/backend/native rule action, push or merge.

**Every changed file / exact commit line ranges:**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/dev/native/App.tsx`: lines 126–126 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 137–137 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 155–155 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 158–158 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/App.tsx`: lines 169–169 | Add App.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/dev/native/usage-probe.tsx`: lines 6–8 | Expose developer-only real probe observations through the existing native QA entry; preserve unavailable/busy/error behavior and unmount safety. |
| `apps/mobile/dev/native/usage-probe.tsx`: lines 16–16 | Expose developer-only real probe observations through the existing native QA entry; preserve unavailable/busy/error behavior and unmount safety. |
| `apps/mobile/dev/native/usage-probe.tsx`: lines 21–29 | Expose developer-only real probe observations through the existing native QA entry; preserve unavailable/busy/error behavior and unmount safety. |
| `apps/mobile/dev/native/usage-probe.tsx`: lines 33–33 | Expose developer-only real probe observations through the existing native QA entry; preserve unavailable/busy/error behavior and unmount safety. |
| `apps/mobile/src/app/(tabs)/index.tsx`: lines 2–2 | Add index.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/app/(tabs)/index.tsx`: lines 6–6 | Add index.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/app/(tabs)/index.tsx`: lines 23–23 | Add index.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/home/README.md`: lines 8–9 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/home/README.md`: lines 140–142 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/home/connected-home-screen.tsx`: lines 2–3 | Add connected-home-screen.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/home/connected-home-screen.tsx`: lines 58–58 | Add connected-home-screen.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/README.md`: lines 3–5 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/README.md`: lines 112–127 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/device-protection.test.tsx`: lines 1–236 | Add device-protection.test.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/device-protection.tsx`: lines 1–79 | Add device-protection.tsx for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/status-model.ts`: lines 129–129 | Add status-model.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/use-protection-status.ts`: lines 76–76 | Add use-protection-status.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/use-usage-permission-action.ts`: lines 1–63 | Add use-usage-permission-action.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 4–4 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/protection-integration.android.ts`: lines 1–7 | Add protection-integration.android.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/protection-integration.ts`: lines 1–12 | Add protection-integration.ts for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `docs/core_plan/04_react_native_integration.md`: lines 450–450 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 459–459 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 1010–1020 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/integration-c.json`: lines 1–23 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/android-capability-probe.md`: lines 102–133 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2805–2805 | Record the preceding part hash during this normal update; retain its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–13 | Update current part/branch checkpoint; previous evidence remains historical. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2838–2889 | Record this part’s decisions, actual checks/failures, every file/line and remaining work. Own hash stays Pending until next normal update. |


### RN-08d — Android device permission/status acceptance

**Commit:** `test(android): verify permission and status lifecycle`. **Hash:** `cadc91d` (recorded during RN-10d).
**Date:** 2026-11-03. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-android-foundation`. **Parent:** `d1aa6ee`.
**Status:** Implemented and physically verified within the Android read/usage-permission/status scope. All a–d commits are local; no push/merge.

**Changes / reasons:** Finish actual device acceptance rather than promote JS tests into native evidence. The development test instrumentation gains an `emptyWindow` argument; the same Kotlin reader can run `queryEvents(end,end)` for an actual successful empty interval. Its production Expo method retains the 1–15-minute input and exposes no test flag. Empty/ready/zero is distinct from locked/denied/unknown/null; counts remain bounded diagnostics, never metrics. No event identifiers, account data, service, timer, enforcement, native policy, Auth/root, hosted database or iOS code is added. `device-d.json` records exact final APK hashes/tool versions, sanitized native results, UI observations/bounds, check counts, cleanup and limits. The runbook documents reproduction, actual-device matrix and explicit non-results. Home/protection/native READMEs and plan/index/context now mark Android read-only integration available; the settings acceptance matrix links this later independent device evidence without rewriting RN-09l's historical artifact or claiming combined authenticated settings acceptance. Preserve all part IDs and top-level 46/21/25 counts; parent RN-08/09 remain open.

**Actual physical evidence:** Pixel 8 Pro / Android 16/API 36. Debug and test APKs build/install; actual production Home works without API/Auth configuration. Review usage access opens Disconnect's own Android Settings page. Turn switch off/on and Back: denied/allowed refreshed correctly, protection remains unimplemented/inactive, installedRevision null and reasons empty. External own-package AppOps revoke while backgrounded updates Home on foreground. AppOps allow + force-stop/cold launch reads current grant. Current keyguard locked: same-reader instrumentation reports deviceLocked true, state locked and count null; after user unlock it reports ready, count 0 in the final one-minute window. The zero-width instrumentation case separately returns ready/0. Both task Metro servers were stopped before final locked/unlocked/revoke/default instrumentation; no API was configured. This proves Kotlin read independence, not JS development UI without Metro or a restriction engine surviving termination. After external ignore the reader returns denied/null; restored default does too, with needs_permission. No first-unlock-after-reboot claim. Expo Go actually loads the native-QA entry and shows absent module / protection unavailable, disabled bounded probe and no usage-permission action. Existing adapter tests, rather than the physical phone, cover malformed values/unavailable Settings/duplicate requests/error paths.

**Responsive/accessibility evidence:** Actual Home font 1.15 and 2.0, density 480dpi. Permission button reachable by scrolling; actual large-text tap opens own-app Settings. Clickable outer height 160px (~53dp) at 1.15, 192px (64dp) at 2.0; labels wrap/grow and controls remain usable above the floating navigation at the bottom of the scroll. UI bounds and labels are sanitized in the artifact. This verifies those layout/control observations only; TalkBack/VoiceOver speech/traversal and full accessibility/signing are not certified.

**Validation commands actually run:** JDK 17.0.21+9 / Gradle 9.4.1: `apps/mobile/android/gradlew -p apps/mobile/android :app:assembleDebug :app:assembleDebugAndroidTest -PreactNativeArchitectures=arm64-v8a --console=plain` with local JAVA_HOME/ANDROID_HOME passes; both APKs installed with `adb install -r`. `adb shell am instrument -w com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation` runs actual same-reader observations; `-e emptyWindow true` selects the empty interval. `npm run check` passes 382 portable / 502 component / 590 API, types, ESLint, Ruff, contracts and original assets (192 DB tests intentionally deselected; no backend change). `npm run mobile:export` passes 38-file production isolation / 71 original SVGs. Production Android Hermes export also passes. Tracked iOS diff is empty. Artifact JSON, exact notes line ranges, local document links, `git diff --check` and final staging are checked before commit. No hosted migration, Auth account/token action, backend persistence write or production signing occurred.

**Failures / corrections:** Phone auto-lock required the user's explicit unlock, then temporary USB stay-awake. A first lock probe raced unlock; acceptance requires actual deviceLocked true, obtained in the recorded result. Partially visible Home button overlapped the floating navigation during an automation tap; scrolling to the bottom made the full control reachable/operable at both font scales. Cold launch initially raced completion of instrumentation, which stops the target process; repeating after test completion passed. Expo Go retained a scrolled QA screen; reset to Screens/top then Android probe passed. These were test timing/navigation issues; no production code fix was needed. The empty-window flag is the only source change in d. No unresolved build/test failure.

**Cleanup actually verified:** Only own development package GET_USAGE_STATS changed; restored initial default and final read denied/null/needs_permission. Restore original font scale 1.15, global USB stay-awake 0; screen timeout unchanged 30000ms. Stop both task-owned Metro servers; remove only task reverse mappings 8090/8092 (final list empty) and own `/sdcard/hoosh-rn08.xml`. Keep own development/test APKs and local SDK/JDK/cache for future reproducibility. No user app/data removal, global process cleanup, permission reset for another package, credential reset or iOS operation. No private identifiers, raw UI dumps or secrets committed. Unrelated root/script icon packs and workspace file remain untracked and excluded.

**Handoff / next:** RN-09k now has Android read-only native status, and l's native absence/revocation has separate actual-device evidence. Full authenticated settings/profile phone journeys still need coordinated Auth/root, hosted settings migration 0002 and approved current test accounts. User-deferred fresh-token and hosted-C deletion work stays deferred. RN08-D04 rule installation/overlap, D05 native account transfer and enforcement/signed-device D06, package picker, background monitoring/outbox, metrics/rewards, product policy and Anisha's iOS remain open. Do not treat usage access or server draft persistence as active protection. Read the latest plan checkpoint/device runbook; no new plan or guessed policy is introduced. RN-08c hash d1aa6ee is recorded in this normal update.

**Every changed file / exact commit line ranges:**

| File and lines | Change and reason |
|---|---|
| `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 11–11 | Read the development test runner emptyWindow argument and pass it to the same Kotlin reader for a real SDK empty-window check; ordinary instrumentation and production bridge behavior remain unchanged. |
| `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 14–14 | Read the development test runner emptyWindow argument and pass it to the same Kotlin reader for a real SDK empty-window check; ordinary instrumentation and production bridge behavior remain unchanged. |
| `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 21–21 | Read the development test runner emptyWindow argument and pass it to the same Kotlin reader for a real SDK empty-window check; ordinary instrumentation and production bridge behavior remain unchanged. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/UsageReader.kt`: lines 53–53 | Add an instrumentation-only zero-width query option and report its zero-minute bounds; the Expo bridge still accepts only 1–15 minutes. This distinguishes actual empty/ready/zero from permission/lock failures without metrics or event identifiers. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/UsageReader.kt`: lines 56–57 | Add an instrumentation-only zero-width query option and report its zero-minute bounds; the Expo bridge still accepts only 1–15 minutes. This distinguishes actual empty/ready/zero from permission/lock failures without metrics or event identifiers. |
| `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/UsageReader.kt`: lines 62–62 | Add an instrumentation-only zero-width query option and report its zero-minute bounds; the Expo bridge still accepts only 1–15 minutes. This distinguishes actual empty/ready/zero from permission/lock failures without metrics or event identifiers. |
| `apps/mobile/src/features/home/README.md`: lines 149–153 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/features/protection/README.md`: lines 128–134 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 12–12 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 21–27 | Add README.md for the documented Android probe/build or read/permission integration; see decisions above for its ownership, trust boundary and verification. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 310–322 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 4–4 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 184–184 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 195–195 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 450–450 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 459–460 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 603–603 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 661–661 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/04_react_native_integration.md`: lines 1021–1043 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/README.md`: lines 3–3 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan/README.md`: lines 295–303 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/android-capability-probe.md`: lines 134–187 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/rn09-settings-acceptance.md`: lines 49–49 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/rn09-settings-acceptance.md`: lines 52–52 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/qa/rn09-settings-acceptance.md`: lines 84–86 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/artifacts/rn-08/device-d.json`: lines 1–308 | Record current scope/evidence, exact reproducible checks and retained acceptance boundaries; preserve prior part IDs/history. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 19–19 | Add the latest resume checkpoint: actual a–d scope, checks, cleanup and joint prerequisites; retain older entries as historical. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2842–2842 | Record the preceding part hash during this normal update; retain its historical evidence. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–13 | Update current part/branch checkpoint; previous evidence remains historical. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 2894–2947 | Record this part’s decisions, actual checks/failures, every file/line and remaining work. Own hash stays Pending until next normal update. |


### RN-10d — Independent Android accessibility, navigation and lifecycle acceptance

**Commit:** `fix(mobile): improve Android focus and record RN-10 device checks`. **Hash:** `0f7f74e` (recorded during publication verification).

**Date:** 2026-11-07. **Owner:** Ishmum. **Branch:** `task/react-native/rn-10-android-acceptance`. **Parent:** `e55e314`.

**Scope:** Existing RN-10, NFR-008/009/011 and AC-12 within implemented independent Android UI. This is a JS/layout/focus fix plus actual development-device evidence, not full RN-10, Auth/root or release acceptance. Existing RN-08 debug host reused. No native/backend/migration/dependency/icon/iOS change; no real credentials, account save, hosted operation or deletion. User's continued phone authorization and confirmation of audible TalkBack carry across the usage-limit interruption.

#### Decisions and actual findings

- **Android scroll-to-focus:** Home's last action could be focused beneath the floating navigation even though manual scrolling had enough trailing padding. Reserve measured footer plus safe inset outside the Android ScrollView viewport, retaining 24px inner padding. At font 1.15 the viewport bottom changed from y=2992 to y=2662, matching the bar top. At 2.0 button bottom 2416 is above bar top 2488. Standalone forms keep their inset padding; iOS/web keep existing behavior. Android container no longer names/groups the entire screen; headings/controls remain individual targets.
- **Native modal return:** immediate assistive focus could be overwritten by Android's native-window dismissal. Subscribe before closing, wait for activity focus and one 150ms settle, focus the existing trigger, and clean up. Missing event expires at 1000ms; background, target-owner replacement, unmount and a later explicit request cancel it. No retry loop, focus during revalidation, new dependency or claimed latency SLA. Both dirty-exit Back and quest cancellation triggers consume the hook. Actual clean phone screenshot shows Back focus after Keep editing; cancellation caller also has component coverage, not a live saved-quest acceptance claim.
- **Corrected test method:** initial `uiautomator dump` calls while TalkBack was active disturbed assistive focus. Early inferred timing/focus results were discarded, and an interim hook was removed before clean retesting. Screenshot/direct-input-only retests reproduced the dismissal race and verified the final bounded hook. Tree automation now runs only with TalkBack off. Visible captions and owner-confirmed audibility are separate observations; direct taps/Tab do not establish touch exploration, double taps, physical keyboard or exhaustive manual traversal.
- **Local continuity:** typed quest input survives background/return, an injected RUNNING_LOW callback and temporary Wi-Fi/mobile data off/on. Back opens confirmation; Back in the dialog keeps input; explicit discard exits. Own-app force-stop/cold start reaches safe unavailable Home. Unsaved process-death persistence is not promised. Injected callback is not a real OS low-memory kill, and USB Metro remains reachable with radios off; no authenticated offline replay claim.
- **Sample boundaries:** Days checkbox checked/unchecked and TalkBack selected output, disabled busy day controls, Profile error with editable input/retry and disabled busy profile actions were checked in the isolated native QA project. Reduced-motion Profile Busy frame pairs changed 385 pixels normally, 0 with reduced motion and 686 after preference restoration; inspected button crops show the spinner hidden while Saving text stays. This verifies one native indicator, not every animation. These are component-state evidence, not account/API saves or installed rules. Original source data never becomes production metrics.
- **Development interruptions/privacy:** stale project HMR/linking produced duplicate-navigation warnings; own-app force-stop and one correct project launch cleared them. Nothing was suppressed or called a fixed production defect. TalkBack tutorial completed, optional notification prompt canceled. One private notification-overlaid capture excluded; only three inspected app-only crops are tracked. No serial/raw tree/full phone capture/token/account identifier recorded.

#### Validation actually run

- `npm run check` passed TypeScript, ESLint (0 errors; 11 existing warnings outside changed files), original assets, 382 portable tests, 518 native-component tests / 62 suites, Ruff, 601 API tests and generated contracts. 199 PostgreSQL tests deselected, not rerun for JS-only changes.
- `npm run test:components --workspace @disconnect/mobile -- --runTestsByPath src/components/ui/use-dialog-focus-return.test.tsx src/components/ui/screen.test.tsx src/components/navigation/main-tab-bar.test.tsx src/features/quests/quest-editor.test.tsx` passed 64 tests / 8 suites in both native presets after final test formatting. New hook's eight cases run in each preset (16 results).
- `npm run mobile:export` passed production web isolation (38 JS/HTML files) and 71 original SVGs. From `apps/mobile`, `npx expo export --platform android --output-dir .expo/rn10d-production` produced the production Hermes bundle. `npm run mobile:ui:build` passed the isolated Vite gallery build, with existing dependency eval/chunk-size warnings. Exports/builds do not certify device execution or release signing.
- Actual Pixel 8 Pro / Android 16/API 36, 1344×2992/density 480: existing local debug host + current JS, four Router tabs at font 1.15/2.0, quest long input/software IME/footer/Back/Keep/discard, five Settings details, History summary/progress/month/reclaimed, selected-tab/control speech and modal return. Sample checkbox/error/busy checked separately. Runtime data and unsupported saves remain unavailable.
- Existing automated reduced-motion preference tests and the bounded physical indicator check pass; exhaustive motion/state matrix/landscape, real OS memory-pressure kill, full manual/async speech, physical keyboard, additional devices, release signing and authenticated process/offline integration are not accepted by this run. Portrait remains configured. No iOS physical claim.
- Cleanup verified against this run's private baseline: font 1.15, timeout **600000ms** (do not reuse RN-10c's old 30000), stay-awake 0, TalkBack/services/touch exploration/display speech output off, Wi-Fi/mobile data on, rotation and animation values unchanged. Existing usage access **allow** preserved. Removed owned ports 8090/8092 and own phone XML, stopped both owned Metro processes; debug app/data retained. No lock bypass or app-data erase.

#### Every changed file and logical change

- `apps/mobile/src/components/ui/screen.tsx`: lines 45–48, 63–65, 73. Reserve the measured Android floating footer outside native focus-scroll bounds, avoid duplicate inset padding, and expose child controls individually. Other platforms and standalone forms preserve prior layout.
- `apps/mobile/src/components/ui/screen.test.tsx`: lines 2, 23–28, 30, 65, 67–72, 89–91. Assert Android container semantics and viewport/padding math, iOS behavior and standalone inset handling; prevent source-specific content padding from erasing clearance.
- `apps/mobile/src/components/navigation/main-tab-bar.test.tsx`: lines 4, 142–149, 151, 163, 165–168, 173–176, 178. Verify measured bar height changes update Android viewport versus iOS padding and retain an actual input draft during layout changes.
- `apps/mobile/src/components/ui/use-dialog-focus-return.ts`: lines 1–50. New explicit-return hook: Android window-focus subscription, one settle, bounded deadline and cancellation on background/unmount/owner/new request. Non-Android uses existing immediate focusControl.
- `apps/mobile/src/components/ui/use-dialog-focus-return.test.tsx`: lines 1–121. Eight cases cover one-shot settle, duplicate/late events, timeout/background/unmount/owner replacement, pending-settle cleanup, repeated explicit requests and detached targets across both native presets.
- `apps/mobile/src/features/editors/editor-controls.tsx`: lines 19, 193, 228. Use the scoped modal-return hook for Back before dismissing dirty-exit confirmation, retaining the existing safe-action and draft behavior.
- `apps/mobile/src/features/quests/quest-editor.tsx`: lines 2, 54, 266. Use the same scoped hook for Keep quest cancellation dismissal; no live quest cancellation or save semantics change.
- `apps/mobile/dev/native/README.md`: lines 102–114. Add current debug-host sample-state evidence and the corrected TalkBack automation method, restoration requirements and release/Auth boundaries.
- `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 13–21. Add latest RN-10d handoff pointers and explicit remaining Auth/iOS/release/device acceptance without changing ownership or earlier history.
- `docs/core_plan/README.md`: lines 8–15. Add current Android checkpoint and implementation/device links; preserve original plan IDs and counts.
- `docs/core_plan/04_react_native_integration.md`: lines 197, 758–760, 764–765, 767–769, 1054–1075. Update RN-10 ledger and D01–D06 evidence/gates, then append current scope, validations, cleanup and next joint handoff; do not mark the parent complete.
- `docs/qa/mobile-accessibility.md`: lines 61, 69–70, 72–74, 200–240. Update current acceptance matrix and append actual Android findings, sample/Router separation, corrected method, validation, cleanup and precise limits.
- `docs/core_plan_implementation_notes/artifacts/rn-10d/README.md`: lines 1–73. Reproduction, three image meanings, actual findings, scope/validation and remaining device/joint gates, including primary Android accessibility testing reference.
- `docs/core_plan_implementation_notes/artifacts/rn-10d/device-results.json`: lines 1–216. Sanitized device/build identity, measured geometry, TalkBack/Router/sample/lifecycle results, validation counts, restored settings/connections and explicit unverified limits.
- `docs/core_plan_implementation_notes/artifacts/rn-10d/large-font-footer.png`: binary PNG, 118,549 bytes; no line numbers. Inspected app-only crop: font-2.0 Home action and footer separation.
- `docs/core_plan_implementation_notes/artifacts/rn-10d/modal-return-focus.png`: binary PNG, 16,262 bytes; no line numbers. Inspected app-only crop: actual Back assistive-focus rectangle after Keep editing, excluding stale caption.
- `docs/core_plan_implementation_notes/artifacts/rn-10d/sample-checkbox-focus.png`: binary PNG, 23,594 bytes; no line numbers. Inspected app-only crop: isolated sample Monday checkbox/focus, not account data.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7, 9, 13, 19–20, 23, 2900, 2952–3003. Update current/resume status and record prior RN-08d hash; this entry accounts for every changed file, rationale, test method correction, actual checks, cleanup and remaining gates.

#### Remaining work and handoff

RN10-D01/D02/D05/D06 now have explicit bounded Android debug-device evidence; RN-08d `cadc91d` already supplies D04's read/permission scope. Parent RN-10 and Plan 04 remain open for joint Auth/root/current-account flows, iOS/VoiceOver, release and additional-device/physical-keyboard matrices, full manual/async speech, exhaustive motion/state checks and true OS/authenticated process/offline integration. Do not treat untested states as passed or report every independent Android matrix complete. Hosted schema is ready from Plan 03; refreshed A/B tokens, authenticated phone and hosted-C deletion remain user-deferred. Next coordinated RN-06/07/09l/10/11 once the real Auth/root producer and approved accounts are available, or separately schedule the explicitly remaining Android/release checks. Stable IDs and 46 top-level / 21 producers / 25 pending are unchanged. Local commit only; no push/merge requested for this task. Unrelated icon packs and workspace file excluded.


### RN-10d follow-up — Publish and verify GitHub Foundation checks

**Commit:** `docs(mobile): record RN-10 GitHub verification`. **Hash:** `f2fae39` (recorded during the selection investigation).

**Date:** 2026-11-07. **Owner:** Ishmum. **Branch:** `task/react-native/rn-10-android-acceptance`. **Parent:** `0f7f74e`.

**Authorization/scope:** User requested push and verification. Normal non-force `git push -u origin HEAD` published this feature branch and its existing ancestors. Exact remote HEAD and push workflow matched implementation SHA `0f7f74ee455ee0497c2348fca993c4b62e2ea85b`. No main merge/push, PR, deployment, Auth action, Supabase write, phone operation or workflow/source change. Unrelated untracked workspace/icon packs remain excluded.

**Actual hosted result:** [Foundation run 42420522051](https://github.com/hooshapp/hoosh/actions/runs/42420522051), attempt 1, event push, completed/success. All three expected jobs and their completed steps were inspected through the GitHub connector's workflow API. The combined legacy commit-status endpoint returned no statuses, which was not treated as success; the actual Actions run/jobs provide acceptance. No inference from local test success.

- Mobile: clean npm install, types/lint, original assets, portable/native-component tests, isolated gallery build and production web export passed.
- API: frozen setup, Ruff, deterministic tests and reproducible OpenAPI/generated HTTP types passed.
- Database: disposable PostgreSQL setup, required migration/RLS/mobile HTTP acceptance and labeled fixture cleanup passed.

**Decisions/validation:** Record only sanitized run/job/step metadata for the exact implementation, not account records, logs, tokens or future self-referential CI claims. Documentation publication is monitored against its own subsequent exact-SHA run before task completion; its final hash/run belongs in Git history/final response, avoiding an endless series of documentation commits. JSON, file/line ledger, staged-only scope and `git diff --check` checked. No new local runtime suite needed for documentation-only changes; actual hosted checks cover the pushed implementation.

#### Every changed file and logical change

- `docs/core_plan_implementation_notes/artifacts/rn-10d/github-checks.json`: lines 1–293. New sanitized exact-SHA workflow and required job/step results; no private logs/credentials. Separate hosted execution from physical-device and full parent acceptance.
- `docs/core_plan/04_react_native_integration.md`: lines 1076–1084. Append published implementation/run/job evidence while preserving original part IDs, counts, ownership and remaining gates.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 19–20, 2958, 3006–3030. Record prior implementation hash and latest resume checkpoint; this entry documents authorized publication, actual hosted checks, every changed file and remaining handoff.

**Remaining/handoff:** RN-10d publication verification is complete. Parent RN-10/Plan 04 still require the explicitly listed joint Auth/root/current-account, iOS/VoiceOver, release/additional-device and remaining accessibility/lifecycle evidence. Fresh A/B tokens and hosted-C deletion remain user-deferred. No part IDs/counts or implementation claims changed. Teammate can pull this feature branch and read the same implementation/device/CI records.


### RN08-D03 / RN-09f — Android app visibility and selection investigation

**Commit:** `docs(android): investigate app visibility and selection`. **Hash:** `9fda458` (recorded during discovery-probe implementation).

**Date:** 2026-11-07. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-selection-investigation`. **Parent:** `f2fae39`.

**Status/scope:** User-requested first investigation step complete for primary Android/Play API documentation, existing source/shared-contract/UI audit and static inspection of the existing local debug APK. Plan 04 RN08-D03 / RN-09f, FR-004/034, NFR-005 and later NFR-008 acceptance. No new top-level plan/part, native picker/runtime/manifest/capability/dependency/shared contract or UI implementation. Existing Apps source frame `10601:5968` is referenced from the plan, not freshly inspected or redesigned in Figma. Anisha's Auth/onboarding/iOS remains untouched; tokens/Auth integration explicitly remain deferred. No independent teammate review, Play approval or complete device feasibility is claimed.

#### Findings, decisions and relationships

- Android documents filtered package visibility for target API 30+ and targeted intent declarations. Recommend MAIN/LAUNCHER query in current app/profile with ordinary query flags; avoid MATCH_DEFAULT_ONLY, broad package permission, app-name allowlist or new native dependency. This is the direction for an actual app-context probe, not a claim of a complete inventory or measured package coverage.
- The summary-only ProtectionService already exposes pickApps/getSelectedApps; AppsEditor already has a native Choose apps/summary branch. Prefer a Kotlin-owned multi-select that keeps package identifiers/drawables native; a full React Native inventory would require another reviewed catalog/icon boundary. Native picker means app-owned UI, not an OS authorization picker. ACTION_PICK_ACTIVITY is a single-activity result, while LauncherApps introduces profile/synthesized-entry considerations. Existing capabilities and unsupported methods remain unchanged.
- Found a concrete contract boundary: cancellation, owner/group/revision and native confirm versus outer Save are not fully defined. Recommend a distinct native cancellation rejection handled as no-op, before implementation; do not turn cancel into an empty saved selection. Independent probe/QA picker can use volatile local drafts without tokens. Persistent account/global selection, per-quest scope and sign-out/deletion behavior remain deferred rather than invented from missing parameters.
- Record deduplication by package within current profile, enabled/exported/current candidates, native labels/icons/fallbacks, locale sorting, duplicate/long/bidirectional labels, stale/uninstalled/disabled apps, hidden/work/private profile limits, lifecycle/reentry/late-result fencing and TalkBack/large text. Do not classify all preinstalled apps as ineligible from FLAG_SYSTEM, claim Most used from launcher data, upload inventory or equate selection/usage grant with enforcement.
- Static APK audit finds target 36/minimum 24, no QUERY_ALL_PACKAGES and no MAIN/LAUNCHER visibility declaration. Existing dependency queries are retained and recorded, not assumed absent or sufficient. Binary hash identifies the pre-existing file; no new build/source attestation is made. ADB reports zero authorized devices. No package inventory, permission grant, native UI/app-context discovery or current phone acceptance occurred.

#### Validation and limits

- Read the current primary Android package visibility/declaration/testing, PackageManager, LauncherApps, Intent, ResolveInfo, ApplicationInfo/private-space and Google Play package-visibility guidance on 2026-11-07; report links support each factual API/policy finding. Engineering recommendations and unrun device assertions are explicitly separate.
- Inspected existing port, Android adapter/module/manifests, actual Apps route/editor and tests at parent f2fae39. Decoded the existing `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` with local JDK 17 / Android `apkanalyzer manifest print`, parsed permissions/intent queries/SDKs and SHA-256; sanitized audit contains no installed-app inventory or device identifier.
- `adb devices` yields 0 authorized devices, so physical probe/picker/label/icon coverage stays pending. No shell package query substitutes for app UID; no APK install, app data/permission/radio change, mapping/server, Auth/Supabase/backend/iOS operation performed.
- Validation passed for JSON fields/source/APK hash, illustrative XML syntax, local links, every changed file/line ledger and `git diff --check`. No executable code changed; runtime suites/native builds are not rerun. Earlier RN-08/RN-10/CI results are historical, not a passed selection test.
- Preceding documentation hash f2fae39 and its successful Foundation run [42420770085](https://github.com/hooshapp/hoosh/actions/runs/42420770085) are recorded during this normal update. This investigation is a local documentation commit; no new push/CI result is claimed.

#### Every changed file and logical change

- `docs/qa/android-app-selection-investigation.md`: lines 1–25. Record part/owner/baseline and the recommended narrow discovery/native-summary approach, separating documented Android filtering from untested engineering inference.
- `docs/qa/android-app-selection-investigation.md`: lines 26–42. Audit actual port/editor/route/adapter/module and existing APK, including the missing launcher declaration and unavailable runtime selection; point to sanitized evidence.
- `docs/qa/android-app-selection-investigation.md`: lines 43–84. Specify the future debug-only intent/query sketch, ordinary matching flags and separate visibility/usage/enforcement boundaries, with primary platform/Play citations; no executable change.
- `docs/qa/android-app-selection-investigation.md`: lines 85–102. Compare PackageManager, broad/fixed inventories, LauncherApps, single-activity chooser, RN catalog and dependencies; explain the native summary route choice and limits.
- `docs/qa/android-app-selection-investigation.md`: lines 103–134. Record deduplication, resource/fallback/locale behavior, preinstalled/profile/empty-list/race boundaries and the separate Most used measurement requirement.
- `docs/qa/android-app-selection-investigation.md`: lines 135–159. Identify cancellation, commit, owner/group/revision, stale candidates, lifecycle and capability gaps; define safe volatile prototype work and persistent/account prerequisites.
- `docs/qa/android-app-selection-investigation.md`: lines 160–185. Refine remaining existing-plan commits into discovery probe, volatile picker, eventual editor wiring and actual device acceptance without claiming their implementation.
- `docs/qa/android-app-selection-investigation.md`: lines 186–201. Separate documentation/source/static-binary validation from unavailable device tests and runtime suites that were not run.
- `docs/qa/android-app-selection-investigation.md`: lines 202–209. Give the next concrete probe and account/storage/enforcement handoff without changing existing capability or Auth/root behavior.
- `docs/core_plan_implementation_notes/artifacts/rn-08-selection/visibility-audit.json`: lines 1–76. New sanitized static APK/source audit: binary hash/SDKs, exact permissions and intent queries, missing launcher/broad query flags, source paths, deferred Auth and zero-device/unimplemented status. No inventory or personal identifier.
- `docs/core_plan/04_react_native_integration.md`: lines 491–523. Add current investigation evidence and candidate direction, concrete next commit scopes, device/contract gates and preserved IDs/counts. Earlier a–d history and remaining full-parent acceptance stay intact.
- `docs/core_plan/README.md`: lines 16–25. Expose latest independent Android investigation and next probe in the execution entry point; explicitly preserve token/Auth deferral and pending production semantics.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7, 9, 19–20, 3012, 3033–3077. Update current branch/status and resume, record prior publication hash, and document this investigation, all file/line changes, actual validations, limits and concrete next action.

#### Next action and remaining gates

Next independent implementation: use the existing Android instrumentation/local module path for a debug-only current-profile launcher-discovery probe; record sanitized aggregate counts/deduplication/resources with/without the narrow declaration under our app UID and denied usage access. Actual authorized device acceptance must precede claiming our catalog works. Then build a volatile native QA picker with cancellation/confirm/search/lifecycle tests. Real Apps editor save/persistence/root wiring follows explicit owner/group/revision/stage/commit/discard semantics and later account acceptance; no new Auth bypass, global store or product rule is introduced by a prototype. Tokens/Auth remain user-deferred; iOS remains Anisha's. Keep RN-08a–d history, RN08-D01–D06, RN-09f and 46 top-level / 21 producers / 25 pending counts. Full RN-08/RN-09/Plan 04, enforcement and release gates remain open. Unrelated untracked workspace/icon packs are excluded; no push requested for this investigation.


### RN08-D03 — Debug-only app-context discovery probe

**Commit:** `test(android): add app-context selection discovery probe`. **Hash:** `6e36788` (recorded during volatile-picker implementation).

**Date:** 2026-11-09. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-selection-probe`. **Parent:** `9fda458`.

**Scope/status:** Implements the user-requested diagnostic in existing Plan 04 RN08-D03, supporting later RN-09f/FR-004/034 and NFR-005. Collector/checks are androidTest-only; launcher query is debug-only; a baseline debug manifest omits it. No production picker, runtime bridge, shared contract, Auth/root/onboarding/iOS, saved selection, plan/rule, database/schema/dependency or production identity change. Tokens/Auth remain explicitly deferred. Physical phone was initially absent; after owner confirmed connection/unlock, actual Pixel/API 36 runs and restoration were completed. This bounded probe is accepted, not full RN-08/RN-09/Plan 04, signed release or app blocking. Original IDs and 46/21/25 counts stay unchanged.

#### Decisions and edge cases

- Extend existing UsageProbeInstrumentation with explicit `probe=selection`; preserve default/emptyWindow usage behavior. Selection runs ten synthetic checks before reading the real app-context catalog. Fixed-field aggregate results only; no package IDs, labels, drawables, exception text, inventory upload or UI screenshots. No UiAutomation/adoptShellPermissionIdentity or privileged shell catalog substitutes.
- Verify target-context application UID equals Process.myUid and the host is debuggable. Inspect only our manifest for forbidden broad visibility/overlay/accessibility service; fail closed on unsafe configuration. Read usage authorization without requesting/granting it. Lock/unlock availability is checked before and after work; locked/unknown/denied-query/error counts stay null rather than empty zero.
- Use matching MAIN/LAUNCHER activities with flags 0, typed overload on API 33+ and guarded compatibility path. Exclude self, invalid/disabled/nonexported/other-profile/forwarder entries, deduplicate by package within the current profile. Keep preinstalled user-facing apps eligible; do not infer Most used, categories, selected apps or enforcement from counts.
- Bound expensive label/icon resolution to 64 deterministic unique candidates, retaining complete visible-candidate counts and an explicit capped flag. Empty/failed resources increment counters independently. Native icon fallback may count as resolution, so zero failures is not proof of all original app icons or all 183 resources. Repeated aliases are not counted as more apps.
- Baseline switches only debug's source manifest with a strict true/false Gradle property; baseline preserves overlay removal/cleartext overrides. No fake action/filter, manual source mutation, broad visibility permission, extra app/framework or runtime bypass. Release/main/debugOptimized source manifests stay unchanged; release merged query absence and application/test DEX separation are explicitly inspected. The collector stays test-only; later picker work intentionally extracts suitable candidate logic into the existing local module.
- Ten Android synthetic cases cover empty success, duplicate/self/ineligible/privacy, capped metadata, blank/throwing label/icon loaders, early locked, unknown lock, mid-work lock, query denial, wrong caller context and nondebuggable host. Tests use fabricated entries; actual visibility is measured separately. No additional test library/dependency.

#### Actual validation, corrections and cleanup

- Recovered missing local SDK files: official command-line tools archive size/published checksum verified, then pinned platform 37.0, build-tools 36, NDK 27.1.12297006 and CMake 3.22.1 restored with the Android CLI/sdkmanager. Existing JDK Temurin 17.0.21 and Gradle 9.4.1 used; no project toolchain version or lockfile change. Did not run suggested Android CLI init/install project skills. A first sdkmanager invocation failed because its old temporary executable was missing; restoration resolved it.
- From apps/mobile/android with JAVA_HOME/ANDROID_HOME, query/default `./gradlew :app:assembleDebug :app:assembleDebugAndroidTest :app:processReleaseMainManifest -PreactNativeArchitectures=arm64-v8a --console=plain` passes; baseline `./gradlew :app:assembleDebug :app:assembleDebugAndroidTest -PreactNativeArchitectures=arm64-v8a -PhooshSelectionProbeBaseline=true --console=plain` passes. Compile/test APK builds prove compilation, not device behavior. Final ordinary outputs restored to default query variant. Existing Gradle deprecation warnings remain.
- APK inspection with apkanalyzer: targeted debug query present, baseline/release query absent, requested permissions identical/no broad/overlay/cross-profile permission; probe/check definitions present only in test APK, absent from app APK. Control app bytecode hashes match, as do test bytecode hashes. Initial XML ordered-tree comparison failed on manifest ordering; corrected semantic contents comparison verifies only the launcher query differs, not a source defect. Strict baseline configuration rejects both invalid and empty property values.
- Initially no authorized device; user subsequently confirmed connected/unlocked. Install -r only known dev/test APKs, preserve app data and record original own-app GET_USAGE_STATS mode. Actual Pixel 8 Pro/API 36: baseline denied gives 54 matched/53 unique, resource samples 53, failures 0; query denied 185 matched/183 unique, resource samples capped 64, failures 0; restored original authorized mode has same query counts. Ready state, target UID, no forbidden manifest configuration and ten checks verified each time (30 final case results, not 30 unique tests). Last measured runs 379/322/302ms; no promised latency percentile/SLA.
- Final default rebuild changed APK byte hashes. A hash guard caught this, so archives/manifest/DEX audits were refreshed and the exact final APKs reinstalled/retested before accepting evidence. Final ordinary build output hashes match the recorded device-tested query pair. No code defect was hidden or untested APK claimed tested.
- Legacy emptyWindow instrumentation still passes; real native capabilities selectionUI unavailable/mode unsupported and inactive/null revision/empty reasons verified. No discovery count is wired into product UI. Ten synthetic guard cases do not stand in for physical lock/unlock, cross-profile or uninstall/resource races on additional devices; those and actual picker/accessibility/release acceptance stay open.
- A finally block restores exact original own-app usage mode **allow**, even on failure. Font/stay-awake/USB reverse mappings unchanged; no data clear, lock/UI operations, Metro/API server, extra mapping, Auth/Supabase or other-package permission change. Existing development app/test APKs and local ignored controls retained. No credential, serial, catalog identity or raw device log committed.
- Validation passed for structured evidence/source hashes/APK identities, aggregate-only numeric/schema invariants, baseline debug override equality, local links, file/line bounds and git diff --check; staged-only file coverage is checked before commit. No JS/TypeScript/API production source changed, so unrelated root suites were not rerun; native builds, actual native checks and isolation checks are the relevant verification. New push/CI/merge is not requested or claimed.

#### Every changed file and logical change

- `apps/mobile/android/app/build.gradle`: lines 101–109. Add strict baseline property selecting only debug’s no-launcher-query manifest; reject typos/empty values without changing application ID, release signing or dependencies.
- `apps/mobile/android/app/src/debug/AndroidManifest.xml`: lines 6–13. Add targeted MAIN/LAUNCHER visibility only for the debug experiment; preserve existing permission removal and cleartext override. No broad visibility permission.
- `apps/mobile/android/app/src/selectionProbeBaseline/AndroidManifest.xml`: lines 1–8. New explicit debug control manifest with identical overrides and no launcher query, enabling reproducible same-app/bytecode comparison without editing tracked sources.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 12, 16, 22–28, 35–40. Dispatch selection mode through targetContext, run/check synthetic cases and emit fixed JSON/canceled failure; retain default and emptyWindow behavior with no sensitive exception text.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionDiscoveryProbe.kt`: lines 1–172. New test-only bounded collector: fixed schema/null failures, app-UID/debug/manifest/lock guards, ordinary current-profile query/filter/dedup, capped resource counters, post-read lock fence and sanitized failure codes. No native production bridge or state writes.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionDiscoveryProbeChecks.kt`: lines 1–86. New ten-case Android checks using synthetic candidates/loaders and ContextWrapper: empty versus unknown, identity privacy/dedup/filter, cap/resource faults, lock races/query denial and wrong-UID/nondebug refusal; no owner catalog fixtures.
- `docs/qa/android-selection-discovery-probe.md`: lines 1–166. New repeatable build/install/run guide, diagnostic schema/state meaning, permission restoration, test-only boundaries and device matrix/results with exact limits, corrections and next volatile-picker handoff.
- `docs/core_plan_implementation_notes/artifacts/rn-08-selection/discovery-build.json`: lines 1–223. New sanitized variant APK/source hashes, permission/manifest/DEX comparison, toolchain/config validations, three final app-context results/30 synthetic outcomes, restored settings and limits. No inventory, raw logs, device serial or private token.
- `docs/core_plan/04_react_native_integration.md`: lines 515, 524–543. Mark only existing D03 discovery slice implemented and append concrete build/device evidence, bounds/cleanup and next step; keep original part IDs, a–d history, full-parent/Auth/product gates and counts.
- `docs/core_plan/README.md`: lines 16–27. Expose implemented/proven discovery and next volatile picker in execution index; label older investigation checkpoint historical and preserve token/Auth deferral.
- `docs/qa/android-app-selection-investigation.md`: lines 9–14. Add current implementation/device pointer while retaining the dated original research/source/APK baseline and its then-unavailable device observation.
- `docs/qa/android-capability-probe.md`: lines 188–197. Link separate discovery diagnostic and new runner option, explicitly retain the physically checked original usage scope and unavailable production selection.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7, 9, 13, 19–20, 3086, 3133–3258. Update current/resume branch/status/date, record prior research hash, and account for every changed file/line, choices, native/device validation, audit corrections, cleanup and remaining work.

#### Remaining work and next step

Discovery producer/probe acceptance is complete within recorded Pixel/debug/current-profile scope. Next: volatile native multi-select picker in the existing module and isolated QA host, extracting candidate discovery deliberately while leaving aggregate test reporting outside production. Add search/retained draft/cancel/confirm, single-flight/lifecycle/late-result cleanup and actual picker accessibility tests. Explicit owner/group/revision and stage/commit/discard semantics are required before durable selection or real Apps editor saves; tokens/Auth stay user-deferred and iOS remains Anisha's. No global selection ownership, account cleanup, per-quest scope, usage ranking or restriction policy is invented. Full parent plans and signed release/other-device/profile/race matrices remain open. Local commit only; unrelated untracked workspace and icon packs excluded.


### RN08-D03 — Volatile native selection preview

**Commit:** `feat(android): add volatile native app-selection preview`. **Hash:** `90cdc44` (recorded during PM reconciliation).

**Date:** 2026-11-09. **Owner:** Ishmum. **Branch:** `task/react-native/rn-08-selection-preview`. **Parent:** `6e36788`.

#### Scope and decisions

Implement the next bounded RN08-D03 producer following the accepted discovery
experiment. Reuse the existing hoosh-usage module, extract its tested narrow
current-profile launcher query/filter, and expose three explicitly preview-only
methods to the isolated QA host. Package names, labels, icons, searches, drafts
and confirmed sets remain native; JS receives only nonnegative count/revision.
The single ephemeral QA owner is deliberately separate from Auth/account scope.
No new library, dependency, manifest/permission, backend/database, production
ProtectionService/native adapter/capability, real Apps route or iOS file changes.
Tokens/Auth remain user-deferred, iOS Anisha-owned. Requirements FR-006/010/018/021
and NFR-001/002/003/004/011 remain the existing scope; Apps frame 10601:5968 is a
future production consumer, not redesigned or integrated by this QA producer.

Search filters labels without removing hidden checks. Cancel/hardware Back discard
only the working draft; Clear checks requires explicit confirmation. Confirmation
requeries eligible candidates while unlocked, rejects stale candidates without
changing memory, copies the accepted set and increments revision only on change.
One main-thread request/controller and one worker prevent overlapping dialogs and
keep catalog/resource work off the UI thread. Worker callbacks, dismissal and
module/Activity/owner lifecycle are fenced; background cancels pending work,
destruction clears memory, and dispose shuts the worker down. Release an old owner
without clearing the new owner. JS separately normalizes errors, rejects malformed
summaries, blocks double opening and ignores late reads/results after unmount.

Release uses a compile-time false source-set factory: no preview method
registrations or catalog/dialog/session implementation classes compile into that
variant. Existing Expo VIEW/document queries remain in the merged release
manifest; the debug MAIN/LAUNCHER discovery query and broad permission are absent.
This precise check replaced an overly broad audit assertion that wrongly expected
all SDK queries to disappear; no manifest change was required.

#### Actual-device corrections before acceptance

The first native AlertDialog clipped its neutral/bottom actions at the owner's
font scale 1.15. Replace it with an app-owned full-height native Dialog, independent
scrolling header/list regions and three native actions. Apply system bar, cutout
and IME insets so a bottom action cannot hit Android navigation. Keep selected/
match status outside the header scroller after an actual keyboard check found it
hidden by the reduced header viewport. The initial flow attempts stopped on these
layout observations; only reruns against the final APK count as acceptance. Native
checkbox semantics and decorative icon exclusion are retained, not emulated in JS.

#### Validation

- `npm run check`: 382 portable tests, 538 component tests (64 suites), 601 API
  tests pass; 199 DB tests deselected, not rerun for this native/QA-only change.
  TypeScript, lint, Ruff, original assets and generated contracts pass. Eleven
  pre-existing ESLint warnings remain; the new cleanup-ref warning was removed.
  Twenty component results across Android/iOS presets cover 10 preview scenarios;
  passing iOS mocks does not implement an iOS picker.
- `npm run mobile:export`: 38 JS/HTML files pass QA isolation, all 71 original SVGs
  pass export checks. Android production Hermes export excludes the preview marker.
  `npm run mobile:ui:build` passes (existing dependency direct-eval warning).
- Debug app/test APKs, release Kotlin and release main manifest compile with
  JDK 17.0.21+9 / SDK build tools 37.0 / target 36 / min 24 / Gradle 9.4.1;
  arm64-v8a device build. Existing Gradle deprecations and Android's deprecated
  ADJUST_RESIZE compatibility constant warning remain. No release signing claimed.
- Compiled bytecode audit: nine debug picker implementation classes, zero release;
  release HooshUsageModule has no preview method registration literals. The
  release main manifest has no targeted launcher discovery/broad package permission.
- Pure JVM checks: 12 volatile-owner/session cases pass. Final on-device native
  regressions pass 12 session + 10 discovery cases using the final APK pair. Pixel
  API 36 UI passes 14 normal-font observations and six at scale 2.0, including
  search retention, cancel/no-op/change revision, clear/Back/reset/leave/background,
  denied usage, header scroll and IME action/status access. See [sanitized evidence](artifacts/rn-08-selection/preview.json).
- Cleanup matches this run's private baseline: font 1.15, usage allow, accessibility
  off/original services, original timeout and USB keep-awake restored. Only task
  port 8094/XML and owned Metro listener removed. APKs/data retained. No inventory
  screenshots or raw logs committed; private output stays ignored under `.expo`.
  No current TalkBack spoken/focus check is claimed.

- Final React checklist review covers stable component definitions, lazy native
  setup, effect listener/owner cleanup, transient operation refs, derived state,
  interaction-owned async work and accessible busy/status controls. Production
  export isolation is verified separately; no Next.js/web-only framework change.
- Staged-file audit: all 23 files appear in the ledger, exact ranges fit their
  files, source hashes/counts match the artifact, runbook links resolve and
  `git diff --cached --check` passes.

#### Every changed file and logical change

- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/SelectionPreview.kt`: lines 1–14. Add the narrow internal preview lifecycle/summary boundary shared by variant factories. No package list, persistent group or account API crosses the bridge.
- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 5–20, 28–46. Add lazy preview construction, disposed/unavailable guards and debug-gated main-queue pick/read/release functions; cancel on background, clear on Activity destruction and dispose on module teardown. Existing usage reads/settings/capabilities at lines 21–27 are preserved.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionPreviewFactory.kt`: lines 1–12. Construct the preview only in a debuggable application, using application context for the catalog.
- `apps/mobile/modules/hoosh-usage/android/src/release/java/expo/modules/hooshusage/SelectionPreviewFactory.kt`: lines 1–9. Compile-time disabled factory prevents preview registrations; no catalog/session/dialog implementation is available in release.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/LauncherAppCatalog.kt`: lines 1–56. Extract validated API-version-aware launcher query, current-profile lock checks, own/disabled/nonexported/cross-profile exclusion and per-package dedup into debug code reused by picker and instrumentation. Lines 58–82 add cancellable label loading/native fallback/locale sort and unlock-fenced confirmation requery. Identities/resources stay native.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/VolatileSelection.kt`: lines 1–31. One main-thread ephemeral owner/set/revision with defensive copies, no-op revision stability, old-owner isolation and explicit release/reset. No disk/account/rule state.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/NativeSelectionPreview.kt`: lines 1–55. Single-flight request, activity/owner/disposal guards, background catalog loading and late-result fencing before opening native UI. Lines 57–110 revalidate eligibility/focus, normalize errors, settle exactly once, safely dismiss detached windows, cancel/release/clear and shut down the worker.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionPreviewDialog.kt`: lines 1–84. Build native-only rows/draft/search/availability notice and live selected/match status. Lines 85–149 implement the device-corrected full-height window, scroll regions, status/action placement, system/IME insets, explicit confirm/clear/cancel, busy state and dismissal/keyboard cleanup. Lines 151–193 implement native checkboxes, decorative icons, recycled-view guards and bounded asynchronous icon cache; names never serialize into JS.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionDiscoveryProbe.kt`: lines 1–11, 74–76, 103–108, 133–134. Replace duplicate native query/filter/lock helpers with debug catalog calls and map aggregate counts from the extracted result; retain capped resource reporting and security guards. Parent `6e36788` lines 3, 5, 10, 13–14, 79–99 and 156–170 are removed/moved imports/helper logic; their replacements are in LauncherAppCatalog, not deleted behavior.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionPreviewChecks.kt`: lines 1–39. Add 12 synthetic session cases covering empty/new owner, defensive copy/count privacy, unchanged/canceled draft, other-owner read/release isolation, owner switch, confirmed clear, invalid owner, release and module clear. Emit only the case count.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 13, 18, 24–28, 43–45. Add explicit selectionPreviewChecks dispatch and fixed failure marker; retain original usage, empty-window and selection modes without exposing exceptions.
- `apps/mobile/dev/native/selection-preview.tsx`: lines 1–36. Detect optional Android debug methods and decode safe count/revision only; never echo native inventory or messages. Lines 38–78 add per-mount owner, mounted/operation/single-flight fences, foreground refresh, release/listener cleanup and explicit close-only focus request. Lines 79–121 present the temporary/no-save/no-block notice and trigger, normalized cancellation/change/failure notices and busy state; no production route consumes it.
- `apps/mobile/dev/native/App.tsx`: lines 3, 70, 123, 130, 158–161, 172. Add the separate preview entry/rendering, identify real native diagnostics in footer and disable sample State controls for them. Reset/Screens remount/unmount behavior releases the QA owner.
- `apps/mobile/src/features/protection/selection-preview.test.tsx`: lines 1–118. Ten scenarios (20 results across presets) verify missing native fallback, count-only decoding/privacy, dialog-wide single flight, cancel/changed/unknown normalization, malformed confirmation, stale read fencing, unmount/new-owner/late result and foreground/listener cleanup. Uses explicit injected preview ports, never owner inventory fixtures.
- `scripts/check-ui-preview-isolation.mjs`: line 34. Forbid RN08_SELECTION_PREVIEW_ONLY in ordinary exported app content, complementing native release-class/registration auditing.
- `apps/mobile/dev/native/README.md`: lines 30, 116–127. Correct menu total to 21, explain native temporary behavior/fallback/owner reset and link the detailed build/privacy runbook.
- `docs/qa/android-selection-preview.md`: lines 1–106. Add reproducible build/run and synthetic instrumentation commands, exact temporary semantics, threading/privacy/release boundaries, safe recording/cleanup, bounded actual phone results and remaining production/spoken/device gates.
- `docs/qa/android-selection-discovery-probe.md`: lines 169–178. Add current debug-helper extraction/new session runner handoff while preserving the original dated control experiment and aggregate schema.
- `docs/qa/android-app-selection-investigation.md`: lines 13–16. Point research readers at the implemented volatile picker, distinguish the historical baseline from current production capabilities and preserve Auth deferral.
- `docs/core_plan/04_react_native_integration.md`: lines 516, 518, 544–556. Mark only the debug producer/recorded device subset implemented, link evidence/runbook and retain durable ownership/production/root/speech/other-device gates and stable IDs/counts.
- `docs/core_plan/README.md`: lines 16–26. Replace the current discovery-only next-action checkpoint with the volatile producer/next durable semantics handoff; retain prior discovery evidence, deferrals and full-parent status.
- `docs/core_plan_implementation_notes/artifacts/rn-08-selection/preview.json`: lines 1–156. Record final APK/source hashes, toolchain, full check counts, native/model/device results, release audit, precise corrections, baseline cleanup and remaining gates. No personal inventory, raw device logs or screenshot is published.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7, 9, 13, 19–20, 3086, 3133–3258. Update current/resume checkpoint, record preceding discovery commit hash, and document every change, reason, failed-prototype correction, actual validation, cleanup, limitation and next step in this entry.

#### Remaining work and handoff

This completes only the volatile debug producer/recorded Pixel scope. Next define
native durable owner/group/revision and stage/commit/discard behavior, then reuse
RN-09f's existing native chooser entry for a real editor consumer. Define scope
(global versus per quest) with product owners rather than silently choosing it.
Persistent storage, account switch/sign-out/deletion cleanup, Auth/root/backend
wiring, enforcement, iOS, signed release, other devices/profiles, installation/
uninstall races, resource-failure UI and complete TalkBack spoken traversal/focus
acceptance remain open. Native checkable semantics are not heard speech evidence.
No account token, hosted migration, permission reset or data clear was needed.
Original RN08-D03/RN-09f and 46/21/25 counts are preserved; full RN-08/09/Plan 04
remain open. Local commit only; no push/CI/merge is requested or claimed. Unrelated
workspace and original icon-pack untracked directories are excluded.


### SC-01–04 documentation handoff — PM product answers

**Commit:** `docs: reconcile PM answers and update implementation gates`. **Hash:** `e9e2d90` (recorded during durable selection implementation).
**Date:** 2026-11-09. **Owner:** Ishmum. **Branch:** `task/docs/pm-answer-reconciliation`.

Documentation only: Q09 global scope is now settled; durable ownership/save/discard
and active-occurrence/account cleanup contracts still precede production wiring.
Preview implementation remains `90cdc44` and its recorded evidence is unchanged.
The [Plan 00 reconciliation entry](plan_00_shared_contracts_notes.md) is the
canonical complete file/line ledger, verification, decisions and remaining gates
for this cross-plan commit. No new RN part or completion count; Auth/tokens stay
deferred, and Anisha's producer ownership is preserved. Historical next-action
bullets above reflect their dates and are superseded by the current resume entry.


### RN08-D03 / RN-09f — Durable global-selection draft and Save contract

**Commit:** `feat(android): add revisioned local selection drafts and editor save`.
**Hash:** `751633b` (recorded during lifecycle follow-up).
**Date:** 2026-11-09. **Owner:** Ishmum. **Branch:** `task/react-native/rn-09f-durable-selection`.
**Parent:** `e9e2d90`. **Status:** Implemented for debug-native/local transaction
and controlled-owner existing AppsEditor scope; production/account integration open.

#### Scope, contract and reasons

Continue the PM-reconciled global-selection decision (Q09 / PD-18) under existing
RN08-D03/RN-09f, not another parent plan. Reuse the tested current-profile native
catalog/window and real AppsEditor. Trace FR-004/013/021/034 and NFR-001/002/004/005/
008/011; source Apps frame 10601:5968 remains unchanged. No new Figma assets or
replacement screen, library, dependency/lockfile, manifest permission, HTTP schema,
DB migration, Auth store, usage capability, native restriction rule or Swift code.
Ishmum owns this shared/native work; Anisha retains Auth/onboarding/root/iOS.

The [transaction contract](../architecture/native-global-selection.md) makes owner,
global group, ephemeral draft UUID/version and saved revision explicit. Namespace +
UUID partitions local storage, not authentication. No anonymous/default production
owner is created. Native chooser Use these choices stages; editor Save alone
compares revisions and persists. Cancel/Back preserve the previous draft;
Discard/release/remount drops unsaved edits, not saved state. Persisted empty sets
retain an incremented revision tombstone; unchanged saves do not increment it.
Owner/version mismatches, stale saves, missing apps and corruption reject rather
than silently overwriting or accepting an empty record. Count equality does not
mean set equality. Current debug bridge registrations are separate from the
unchanged ProtectionService pickApps/getSelectedApps and capability summary.

Use existing platform AtomicFile in a private no-backup debug directory, bounded
schema/package-set records with hashed owner filenames, serialized process-wide
compare-and-set and post-write readback. No bespoke database or encryption claim.
Only count/draft/revision/dirty metadata crosses JS; names/IDs/icons/search remain
native. AtomicFile is not a writer lock; the explicit lock covers read/CAS/write
across instances. A multi-process extension writer is not supported by this slice.
Original platform API references are linked in the contract. Disk/catalog work is
on one worker; request/dialog state on main; synchronized draft state handles the
short main-thread staging operation. Module shutdown drains issued writes/cleanup.
An already-issued explicit Save may complete after leaving: release is not a
promise to undo committed disk state. Conflict or uncertain acknowledgment requires
explicit reload; never replay mutations blindly. Activity/module cleanup clears
leases while preserving saved records. Background cancels only pending picker UI.

The consumer receives explicit port/owner, keys account changes synchronously,
fences async results, releases late handles, serializes actions and uses existing
Back/discard confirmation. The isolated Saved apps editor supplies a labeled
synthetic QA owner. The real Router remains unavailable because Auth-derived owner
binding, production adapter/capability and lifecycle/installed-rule semantics are
not wired. This is the existing product component with a real native local producer,
not a successful production account flow or an account-required-policy bypass.
Tokens/Auth remain user-deferred. Active-occurrence global-edit effects and account
switch/deletion protocol remain separate; no production erasure is attempted.

#### Corrections and actual verification

- Native transaction/storage runner: **22 cases pass on Pixel 8 Pro / API 36**,
  including actual AtomicFile reopen/backup recovery/corruption/size bounds,
  concurrent two-instance CAS, synthetic owner/lease isolation, stale versions,
  no-op/empty revisions, failed writes and lost acknowledgments. Test storage is a
  unique cache directory removed in finally, never the owner's saved QA folder.
  Existing volatile 12 and shared discovery 10 native cases also pass on the final
  installed app/test APKs. The 22-case runner reports only count/fixed failure and
  case index. Its first oversized-write fixture was slightly below 128 KiB; increase
  the synthetic package lengths within bounds and rerun successfully, not a claimed
  storage failure. No personal inventory is in committed evidence.
- Actual phone: **14 normal-font observations** cover the existing AppsEditor,
  stage versus Save/reset, persisted count after remount/force-stop/cold process,
  picker Cancel, editor Discard, hardware Back keep/discard, unsaved restart,
  background picker cancellation and explicit empty Save/restart. **Eight large-
  text/restoration observations** cover native entry/actions, Save reachability,
  cold saved count, explicit empty save and normal-scale restoration.
- Visual inspection at scale 2.0 found Back wrapped onto two lines in the existing
  detail header with fixed width 76. At large scale use its original arrow artwork alone with
  accessibility name Back and balanced slots of 44 logical units, restoring the text label at
  normal scale. Rechecked on phone and inspected the corrected private app image.
  Shared activity tests that searched optional visible Back text failed; change
  their press helper to semantic button role/name, preserving all assertions.
  Affected activity tests **32/32** pass; final full component **572/572** pass
  across 66 native suites, including **34 new results** for 17 transaction consumer
  scenarios. This is not iOS native functionality or new spoken TalkBack evidence.
- `npm run check` passes: **382 portable / 572 component / 601 API**, 199 DB
  deselected. TypeScript, Ruff, contracts/assets and lint pass with 11 pre-existing
  warnings. After the header polish, repeat TypeScript/lint/all 572 components and
  affected 32 activity cases; no new warning. React best-practices review covers
  effect cleanup, scope remount, external native synchronization, late results,
  transitory refs, action serialization and accessible controls. No web-framework
  changes were introduced for this native task.
- JDK 17.0.21+9 / Gradle 9.4.1 / build tools 37.0 / target SDK 36 / min 24;
  arm64-v8a debug app/test, release Kotlin and release main manifest compile.
  Existing SDK/Gradle deprecations remain; no release signing is claimed. Release
  class audit finds 10 debug durable implementation classes versus zero release,
  no transaction method registration literals in release HooshUsageModule, and no
  launcher discovery query in release. Ordinary SDK VIEW/document queries remain.
- Final `npm run mobile:export` passes 38 JS/HTML isolation files and all 71 original
  SVG checks. Android Hermes export excludes the durable QA marker; UI gallery
  build passes (existing dependency direct-eval warning). Exports were repeated
  after the production-shared header change; no fixture/QA import ships.
- [Sanitized evidence](artifacts/rn-09f-selection/evidence.json) contains final APK/
  source hashes, actual counts/flows/isolation/cleanup and pending scope. Private
  phone hierarchy/logs/images stay ignored under `.expo/durable-selection`; no
  selected-app labels/package IDs, user serials, credentials or screenshot is
  committed. Current-run baseline restored: font 1.15, keep-awake 0, usage allow,
  original accessibility and timeout; task 8094 mapping/XML/Metro removed. App data
  and debug APKs retained; synthetic saved QA selection deliberately left empty.

- Final record audit: all 28 staged files have exact line-range entries; local
  links, source/APK hashes, observation counts and restored-settings evidence
  match. `git diff --cached --check` passes; private outputs/unrelated files excluded.

#### Every changed file and logical change

- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/SelectionEditor.kt`: lines 1–15. Add the explicit owner/draft/version begin/pick/commit/release lifecycle boundary, separate from the unchanged ProtectionService. Common interface compiles in both variants; current producer exists only in debug.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionDrafts.kt`: lines 1–36. Define saved persistence/CAS boundary, bounded synchronized leases, owner/version validation and count-only snapshots with native set equality. Lines 37–54 stage defensively copied sets, commit only after eligible/native durable acknowledgment, and release/clear drafts without erasing saved records. Lines 55–65 validate namespace/UUID and bounded native package sets; no default owner or authentication claim.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/AtomicSelectionPersistence.kt`: lines 1–51. Hash validated owner paths, read bounded schema/group/revision/set records under a process-wide lock, recover atomic backups and distinguish missing from corrupt/unreadable state. Lines 52–75 compare revisions atomically, retain no-op/empty revision semantics, reject oversize writes before opening writer, finish/fail and read back before acknowledgment. It stores only package IDs in the no-backup directory selected by the controller.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/NativeSelectionEditor.kt`: lines 1–59. Create native catalog/drafts/private store, worker/main dispatch, single-flight request and fixed-error handling, begin and eligibility-checked Save. Lines 60–93 release exact owner/handle without blocking behind chooser, and load/show the existing native window with draft copy. Lines 94–123 revalidate focus/eligibility before staging and implement picker-only background cancellation, draft teardown and draining shutdown without interrupting already-issued atomic writes.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionPreviewDialog.kt`: lines 39, 61, 68, 107, 151. Add optional saved-draft copy/title/action/status to the existing window while preserving the original volatile preview defaults, accessibility/native rows, search and cancellation. Use these choices is explicitly a draft action, never editor Save.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionPreviewFactory.kt`: line 12. Construct the durable editor only when the app is debuggable, reusing application context.
- `apps/mobile/modules/hoosh-usage/android/src/release/java/expo/modules/hooshusage/SelectionPreviewFactory.kt`: line 9. Return no editor implementation in release; compile-time false registration guard remains unchanged.
- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 10, 22–30. Add lazy editor availability/disposal guard with a fixed failure. Lines 54–73 register four explicit main-queue transaction calls only in debug; require a foreground Activity for picker, cancel picker on background, clear drafts on Activity teardown and dispose on module teardown. Existing usage methods/capability response are unchanged.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionDraftChecks.kt`: lines 1–152. Add 22 native cases using synthetic owners/packages and a unique temporary directory: model/copy/privacy/stage/version/owner/release/missing-candidate/CAS/no-op/empty/failure/lost-ack/bounds cases, actual AtomicFile reopen/backup/corrupt/size cases and two-instance concurrent CAS. Retain fixed failed-case index, clean only the test directory in finally, and never touch the saved QA-owner directory.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 14, 20, 26–30, 50–53. Add selectionDraftChecks mode, count and fixed failed-case index; preserve existing usage/volatile/discovery runner behavior without exposing exception text or identities.
- `apps/mobile/src/infrastructure/native/selection-editor.ts`: lines 1–34. Define the count-only transaction port and strict decoder for UUID/group, integer/revision/count/dirty invariants; reconstruct allowed fields so native extras never enter state. No loader/default owner or authentication/installation interface is added.
- `apps/mobile/src/features/preferences/native-apps-editor.tsx`: lines 1–48. Reuse AppsEditor behind an explicit port/owner with keyed scope remount, native begin, active-scope fencing, listener and late-handle cleanup. Lines 49–92 implement hardware Back, action serialization, strict acknowledgment consistency, stale/conflict/uncertain recovery and count-only notices. Lines 93–113 connect existing Choose/Save/Discard/feedback and reload with no anonymous fallback or optimistic save. The component is not mounted by the production Router.
- `apps/mobile/src/features/preferences/native-apps-editor.test.tsx`: lines 1–145. Seventeen scenarios produce 34 native-preset results: stage versus Save/discard/cancel, three stale/expired errors, uncertain Save/reload, missing producer, single flight, scope replacement/late handle, unmount, malformed acknowledgment, hardware Back, inventory stripping and three inconsistent Save results. Synthetic values only; actual persistence is tested natively.
- `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 21, 266, 270, 272, 287, 290, 298–299, 301, 364. Add optional action disable/feedback and native picker busy/disabled inputs; lock editor writes/discard during chooser and show Choosing apps rather than Saving. Existing catalog/demographic/source layouts and icon assets stay intact.
- `apps/mobile/src/features/editors/editor-controls.tsx`: lines 102, 111, 118, 151. Add explicit disable support for Save/Discard while a separate picker operation is pending. Lines 194–196, 207, 214, 227 fix the device-observed large-text Back wrap with original arrow/accessibility label and balanced logical slots; normal detail text label and other variants remain intact.
- `apps/mobile/src/features/settings/activity-preferences-screen.test.tsx`: line 116. Query press targets by accessible button role/name rather than text, retaining the same clean/dirty Back and save/recovery assertions at enlarged fonts; this fixes the four failed preset results after the shared header change.
- `apps/mobile/dev/native/durable-selection.tsx`: lines 1–21. Detect optional debug methods and render the real editor with a labeled synthetic namespace/UUID, isolated QA marker and parent Back. Native absence is unavailable; no production Auth store/guest identity/fixture save.
- `apps/mobile/dev/native/App.tsx`: lines 4, 72, 125, 131, 160. Add Saved apps editor to the existing host, render the real consumer, identify native-local QA and disable specimen State. Existing footer Reset/Screens intentionally remount/unmount the lease; the ordinary app navigation is unchanged.
- `scripts/check-ui-preview-isolation.mjs`: line 35. Forbid the durable-selection QA marker in ordinary production exports, alongside the previous volatile/test markers.
- `apps/mobile/dev/native/README.md`: lines 30, 128–139. Update to 22 pages and document real editor/native local persistence versus draft/reset behavior, unavailable runtimes, scope and reproduction links.
- `apps/mobile/src/features/preferences/README.md`: lines 33–44. Document the reusable explicit-owner consumer, failure/lifecycle handling and controlled QA integration, without claiming production account save.
- `apps/mobile/src/infrastructure/native/README.md`: lines 28–38. Describe the separate transaction port/decoder and why the read-only usage adapter does not advertise native selection or enforcement from its presence.
- `docs/architecture/native-global-selection.md`: lines 1–117. Specify current owner/global-group/lease/revision transaction, bounded atomic persistence, acknowledgment/conflict/lifecycle behavior, real API source links and production/multi-process/account/rule gates. Distinguish implemented debug contract from desired enforcement.
- `docs/qa/android-durable-selection.md`: lines 1–67. Add reproducible shared editor/native build flow, 22-case runner, expected stage/save/cancel/restart behavior, private test directory/identity constraints, cleanup and remaining acceptance.
- `docs/core_plan_implementation_notes/artifacts/rn-09f-selection/evidence.json`: lines 1–170. Publish final APK/source hashes, toolchain/check counts, 14 normal/eight enlarged/restoration phone observations, release registration/class/manifest isolation, corrections, restored settings and limits. No inventory, screenshot, raw phone log or secret.
- `docs/core_plan/04_react_native_integration.md`: lines 24–34, 540–541, 630. Record only the durable debug producer/controlled AppsEditor sub-scope as implemented; link contract/runbook, preserve Auth/production installation/iOS and remaining acceptance gates, stable refs and parent counts.
- `docs/core_plan/README.md`: lines 8–16, 22–24, 36, 45–46. Put current durable implementation first, mark the prior volatile next-step historical, and distinguish next production/account/occurrence work from completed local transaction without adding a new parent plan.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7, 9, 19–20, 3267, 3280–3439. Update branch/current/resume checkpoint, record preceding PM reconciliation hash e9e2d90 and document all files/line ranges, decisions, actual checks/corrections, cleanup and remaining work in this entry.

#### Remaining work and next step

Local durable transaction and controlled-owner Apps consumer are complete within
recorded scope. Before production selection, coordinate Auth-derived namespace/UUID
and session-generation lifetime, account switch isolation, sign-out preservation
versus credential/cache erasure, coordinated deletion/local cleanup acknowledgment
and adapter/Router registration. Define global-selection edits affecting existing
quest occurrences/installed configuration; saving a selection is not rule install.
Do not enable capabilities from mere method presence. Tokens/Auth remain deferred;
iOS belongs to Anisha. No backend selection inventory upload is introduced.

Complete spoken TalkBack traversal/post-picker return, removed/disabled-app races
and resource failures, lock/save/interruption cases beyond this bounded run,
additional profiles/devices and signed release acceptance. Future native extension
writers need cross-process coordination; cross-device allowance remains deferred.
Existing volatile preview evidence and PM ADR remain dated; this entry supersedes
prior next-step descriptions only. Full RN-08/09/Plan 04 and 46/21/25 counts stay
open/unchanged. Local commit only, no push/CI/merge/deployment. Unrelated workspace
and original icon-pack untracked files are excluded.


### RN08-D03 / RN-09f / RN-10 — Selection lifecycle, interruption and accessibility

**Commit:** `feat(android): harden selection lifecycle and picker accessibility`.
**Hash:** `082b1b9` (recorded during physical acceptance continuation). **Owner:** Ishmum.
**Started:** 2026-11-09; resumed/completed documentation 2026-11-10 after usage interruption.
**Branch:** `task/react-native/rn-09f-selection-lifecycle`. **Parent:** `751633b`.
**Status:** Independent debug implementation and bounded checks complete. Actual
post-confirmation TalkBack focus and the wider production/device matrix remain
open. This does not close full RN08-D03, RN-09f, RN-10 or Plan 04.

#### Scope and decisions

Extend the existing native module, transaction and AppsEditor; add no service,
dependency, database migration or new parent plan. Anisha retains Auth/onboarding
authority and iOS. Tokens/Auth remain explicitly user-deferred. Fixed synthetic A/B
owners exist only in the isolated developer host, never the production Router.
No account provisioning/deletion, token refresh or Supabase operation occurs here.

`selectionEndOwner(owner, eraseLocalSelection)` is an explicit local lifecycle hook.
The future caller must invalidate its UI before calling it, await cleanup, and
supply the real Auth session generation on remount, including a new session with
the same UUID. Every native request carries its owner. Cleanup cancels only that
owner's pending work; it removes all of that owner's leases before attempting disk
erasure. Invalid owners cannot cancel a valid Save. Other owners stay independent.

Already-issued writes drain on the same worker before cleanup acknowledgment;
queued canceled work is fenced. Retention keeps a write that already reached disk.
Erasure verifies the owner's base, .bak and .new files are absent. Partial failure
rejects instead of claiming success, and the consumer stays paused; Retry preserves
the original erase/switch intent. Old draft handles cannot resurrect erased state.
Erasure needs no decoding of a corrupt record and never recursively deletes a user
directory. This is app-local selection cleanup, not full account/rules deletion.
A future coordinated deletion flow still needs durable intent/restart recovery;
this small hook is not that coordinator. Storage format remains v1.

Begin checks lock state before/after read and releases any lock-race handle.
Save checks lock/catalog eligibility before writing. Lock during an issued write
returns an uncertain acknowledgment and requires explicit reload: the write may
have persisted. Missing/disabled candidates retain the draft and reject before
write. Injected lock/catalog races are distinct from physical app uninstall tests.

Picker window/pane names and checkbox rows improve accessibility. Choose apps
focus return waits for both settled bridge/UI and native window focus, handles
either event order, and cancels on background, unmount, replacement or missing
focus. The deadline starts after dismissal; a long-open picker remains eligible.
Ordinary renders never move focus. No iOS picker integration is added. The QA host
also now respects the top safe-area inset after a measured status-bar overlap.

#### Actual validation and corrections

- `npm run check`: 382 portable; 590 component passes, two explicit iOS-preset
  skips for Android-only window focus events, 70 suites; 601 API passes and 199
  DB tests deselected. TypeScript, Ruff, contracts/generated types/assets pass;
  ESLint has the same 11 existing warnings and no errors. No database behavior
  changed and database tests were not rerun. After the final QA-only safe-area
  correction, all four QA component results, workspace types and lint pass again.
- Debug app/test APKs, release module Kotlin and release manifest build pass using
  JDK 17.0.21+9 / Gradle 9.4.1, SDK/build tools 37.0, target 36/min 24, arm64-v8a.
  Final native source was built and both APKs installed with replacement, without
  clearing data. Pixel 8 Pro/API 36 instrumentation passes 17 lifecycle cases,
  original 22 draft, 12 volatile preview and ten discovery regressions. The earlier
  16-case log is superseded by the final 17-case run, not added to its total.
- Web export passes 38-file QA isolation and all 71 original SVG checks; Android
  production Hermes export and UI gallery build pass (gallery's existing eval
  warning remains). Release bytecode contains none of ten debug implementation
  classes or five transaction/lifecycle bridge registrations; release manifest
  has no targeted launcher query. This is compile/export isolation, not signed
  release behavior or store acceptance.
- Serial phone flows at font 1.15 pass: A Save one, B initially empty, B Save two,
  return A retains one, end/resume retains A with a new generation, erase A,
  B still has two, erase B and return A empty. Both synthetic owners' saved
  selections are explicitly empty after cleanup. No real Auth identity was used.
- Phone background with the native picker open cancels it; return shows the
  unchanged empty saved selection. Physical lock/return and final restoration
  results are recorded in the following checkpoint and sanitized artifact.
- TalkBack: verified actual service before accepted observations; native pane/title
  and Cancel-to-Choose-apps speech captions observed privately. Owner reports
  audible announcements, checkbox activation with a double tap and an announcement,
  then double-tap Use these choices closes the picker. That report does not prove
  exact spoken text or confirmation focus return. The captured confirmation caption
  did not verify Choose apps focus, so that physical assertion stays pending.
  Unit tests cover focus timing, but do not replace speech/focus acceptance.
- Discarded the initial overlapping automation runs and reran serially. A temporary
  UIAutomation accessibility flag with no TalkBack service had been misread; those
  observations are not speech evidence. Injected Enter/touch actions after an
  accessibility focus change did not reliably traverse the native checkbox; only
  the owner's subsequent actual gesture is accepted for its announcement.
- Corrected the Jest fixture's function-valued AppState mock and typed hook props
  before accepted checks. Fixed the QA top inset after a real phone overlap;
  accepted owner controls and targeted tests were rerun. A resumed settings restore
  stopped on its ownership guard after losing settings focus; relaunching the
  verified settings component restored the original speech-output preference.
- React component review covered hook ownership/cleanup, callback scope fences,
  native-only events, disabled actions, types and production QA isolation. No
  broad refactor, package addition or warning suppression was needed.

#### Device handoff and remaining acceptance

User turned TalkBack off during the interruption; continuation leaves it off.
Display speech output is restored to its original false value. Only this task's
power/reverse/XML/Metro settings are restored/removed; preserve pre-existing usage
access/font/timeout, APKs and app data. Raw hierarchy, inventory, captions and crops
stay under ignored .expo; only aggregate/fixed-state evidence is committed.

Physical return/cleanup checkpoint (2026-11-10): actual lock with picker open
observed from lock metadata, without viewing/capturing the locked screen. Phone
remained locked and no unlock-return observation was available; that assertion is
pending. Force-stopped only the QA app to release its in-memory unsaved draft.
Verified the complete current-run baseline: TalkBack/services/touch exploration
off, font 1.15, timeout 600000, USB keep-awake 0, pre-existing usage access allow,
no reverse mappings, original Display speech output false. Removed both task XML
files and stopped the verified task-owned Metro 8094 process. No app-data clear;
APKs and other saved application data retained. Synthetic A/B saved counts were
both empty before the lock test. Resume the physical lock-return check with the
runbook's QA host when unlocked; do not infer success from forced termination.

Production Auth namespace/session generation/root binding and capability wiring
remain deferred. Complete coordinated full account deletion with persistent cleanup
intent, active-occurrence/installed-rule semantics, confirmation focus speech,
full traversal/keyboard/error states, real uninstall/resource faults, other
profiles/devices and signed release acceptance before broader claims. iOS remains
Anisha's. No install/enforcement, backend inventory upload, cloud sync, hosted
account deletion, token work, push/CI/merge or deployment is claimed. Original
46/21/25 counts and all IDs remain unchanged.

Next independent step: finish the pending explicit-confirmation focus observation
and remaining device/accessibility matrix when the owner is available; define
active-occurrence/installed configuration contracts before expanding native rules.
When Auth work resumes, consume this lifecycle hook and real generation, never
copy the QA owner constants. Follow the [runbook](../qa/android-durable-selection.md)
and [sanitized evidence](artifacts/rn-09f-lifecycle/evidence.json).

#### Every changed file and logical change

- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionDrafts.kt`: lines 9, 55–59. Add persistence erasure and synchronized owner teardown. Expire every matching lease before optional deletion so failed erasure cannot leave an old writable handle; retain other owners.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/AtomicSelectionPersistence.kt`: lines 62–68. Erase only the validated owner hash under the existing process lock. Verify base/.bak/.new absence and directory accessibility; static failure on partial erasure, no recursive deletion or success from a void OS call.
- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/SelectionEditor.kt`: lines 12. Add explicit endOwner(owner, erase, promise) contract without changing ordinary usage/protection capabilities.
- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 71–73. Register selectionEndOwner only inside the existing compile-time debug guard and dispatch on MAIN. Release registers no selection transaction/lifecycle methods.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/NativeSelectionEditor.kt`: lines 13–19, 46–79, 132–141. Inject storage/catalog/lock/draft seams for real controller tests and expose this debug class to instrumentation. Tag begin/Save requests with owner, release lock-race handles, fence canceled work before Save, return uncertain ACK after an issued write locks, validate cleanup before canceling and queue owner cleanup behind issued work.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionPreviewDialog.kt`: lines 119–121, 136, 163, 181. Name Dialog and accessible pane for both chooser modes. Exclude row wrapper while retaining native checkbox semantics; avoid an empty keyboard focus stop. Native identities remain in native UI.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionDraftChecks.kt`: lines 23. Implement erase on the existing test persistence so the original 22-case regression suite exercises the expanded interface.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 15, 22–32, 57–60. Route selectionLifecycleChecks and report bounded count or fixed failure/case marker; retain existing discovery/preview/draft modes and avoid native exception/inventory output.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/SelectionLifecycleChecks.kt`: lines 1–194. Add 17 meaningful real Android/controller cases using synthetic owners, Promise callbacks, worker/main scheduling and latch-controlled races. Cover retention/erasure/retry, actual AtomicFile sidecars/partial deletion, lock/read/write/catalog timing, canceled Save, teardown, wrong-owner isolation and invalid cleanup. Unique cache fixtures cleaned in finally; no Auth or real app mutation.
- `apps/mobile/src/components/ui/use-native-picker-focus-return.ts`: lines 1–55. Own the explicit chooser-close focus lifecycle. Coordinate busy settlement and Android focus in either order, delay once, start deadline only after close, cancel background/unmount/replacement/timeouts and remove listeners. Ordinary renders do not focus.
- `apps/mobile/src/components/ui/use-native-picker-focus-return.test.tsx`: lines 1–74. Test long-open chooser, both event orders, missing-focus deadline, background, unmount/listener cleanup, ordinary renders and replacement. Correct mock descriptor fixture; Android event-specific cases explicitly skip the iOS preset (12 pass/two skips across presets).
- `apps/mobile/src/features/preferences/preference-editors.tsx`: lines 1–2, 275–276, 300. Attach a typed Choose apps ref and call the focus-return hook only for the native busy cycle. Existing catalog editor and surrounding design remain intact.
- `apps/mobile/src/infrastructure/native/selection-editor.ts`: lines 17–20. Add a separate typed owner-lifecycle port with explicit local-only erasure semantics. Do not reinterpret the existing protection or transaction APIs as account deletion.
- `apps/mobile/src/features/preferences/native-apps-editor.tsx`: lines 8–12, 60–68. Accept an explicit session generation in the synchronous scope key and recheck captured activity before dispatching deferred pick/Save. A replaced same-owner session cannot adopt old state; no Auth SDK or new session store.
- `apps/mobile/src/features/preferences/native-apps-editor.test.tsx`: lines 146–156. Hold an old Save across same-owner generation replacement; verify the new editor remains empty and old handle released instead of rendering late acknowledgment.
- `apps/mobile/dev/native/durable-selection.tsx`: lines 1–55. Extend the isolated real editor host to synthetic A/B scopes, explicit end/retain/local erase, generation remount, pause-before-native cleanup and intent-preserving Retry. Resume requires cleanup acknowledgment. Inject test port and add top safe-area inset/wrapping after phone overlap. Never delete an Auth account.
- `apps/mobile/src/features/protection/selection-lifecycle-qa.test.tsx`: lines 1–45. Four preset results verify immediate A-state removal, disabled Resume until cleanup, empty B and erase-failure pause/retry preserving the true erasure intent without exposing native exception text.
- `apps/mobile/dev/native/README.md`: lines 140–148. Document synthetic lifecycle controls, paused cleanup/retry contract and no Auth/production installation claim.
- `apps/mobile/src/features/preferences/README.md`: lines 45–52. Explain owner/generation remount, pre-dispatch/result fences and the future caller responsibility; distinguish implementation tests from speech/device acceptance.
- `apps/mobile/src/infrastructure/native/README.md`: lines 39–46. Document lifecycle port trust boundary, issued-write drainage, retention versus verified local erasure and fixed synthetic QA owners confined outside the Router.
- `docs/architecture/native-global-selection.md`: lines 3, 48, 102–138, 151–152. Advance contract to v2 with lifecycle table row, owner/session handoff, failed-cleanup recovery, lock/uncertain acknowledgment and focus protocol. Preserve future deletion-intent, occurrence/rules and production registration gates; link primary Android pane API.
- `docs/qa/android-durable-selection.md`: lines 68–124. Add reproducible lifecycle runner and 17-case scope, controlled owner controls, physical/speech capture safeguards, current bounded observations and artifact link. Explicitly leave unobserved confirmation focus and larger matrix pending.
- `docs/core_plan/04_react_native_integration.md`: lines 35–46. Record this follow-up in existing RN08-D03/RN-09f/RN-10 scope, native/physical evidence distinctions and remaining production gates. Preserve IDs and 46/21/25 counts.
- `docs/core_plan/README.md`: lines 8–17. Put current lifecycle checkpoint first with measured tests/phone boundaries and links; leave Auth/iOS ownership and parent counts unchanged.
- `docs/core_plan_implementation_notes/artifacts/rn-09f-lifecycle/evidence.json`: lines 1–150. Publish final APK/source hashes, toolchain/build/check counts, native regression/release isolation and bounded A/B/background/speech/lock evidence, cleanup, corrections and pending gates. Contains only sanitized aggregates/fixed states; no inventory/captures/secrets.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–9, 13, 19–23, 3285, 3444–3603. Update current branch/resume/date and previous durable commit hash, then record this commit's scope, lifecycle decisions, exact checks/corrections, cleanup, remaining work and complete per-file line ledger. Historical entries remain dated.


### RN08-D03 / RN-09f / RN-10 — Physical acceptance continuation

**Proposed commit:** `docs(android): record picker lock-return acceptance`.
**Hash:** `56e7ba4` (recorded during Android coordinator implementation).
**Owner:** Ishmum. **Date:** 2026-11-10. **Parent:** `082b1b9`.
**Branch:** `task/react-native/rn-09f-selection-lifecycle`.
**Status:** Partial physical acceptance recorded. Lock-return passed on this Pixel;
TalkBack confirmation focus is unverified. All temporary device settings restored.
No runtime source, dependency, Auth/token/backend/iOS or capability change.

#### Actual observations and limits

Saved a fresh per-run baseline privately instead of overwriting prior evidence.
Opened Saved apps editor under synthetic owner A with saved count zero, then the
native chooser. Locked the actual phone and observed lock metadata without viewing
or capturing its locked screen. After unlock, own-window-guarded hierarchy check
confirmed no picker checkbox list, zero saved selection and explicit “Picker
canceled. Your draft is unchanged.” notice. No force stop, process restart or
reload occurred between lock and this accepted return observation. This closes the
preceding entry's physical lock-return gap for Pixel 8 Pro/API 36 only.

Configured Display speech output while TalkBack was off, saving its original false
value, then explicitly verified the enabled TalkBack service. The first focus probe
stopped on its own-window ownership guard in system Settings; no foreign capture.
USB disconnected before reattempt; after reconnection verified unlocked own app
and restored only the task port. Keyboard Tab opened the native chooser; waited
for its named native window instead of treating the transient busy screen as open.
Native search focus caption was observed. Up-arrow navigation did not reach the
confirmation action and is not accepted confirmation evidence. Requested an actual
owner gesture/announcement report; no accepted confirmation result arrived before
the turn was interrupted. The proposed final keyboard-driven confirmation was not
executed. No current-run speaker audibility or post-confirmation focus pass claimed.
Do not reuse the prior owner's checkbox/audio report as a new confirmation result.

On interruption, stopped verification and restored TalkBack/services/touch
exploration off and Display speech output false. Independently verified the new
baseline: font 1.15, timeout 600000, USB keep-awake 0, usage access allow and no
reverse mappings. Removed own XML files, confirmed task Metro 8094 stopped, and
force-stopped only the QA app to discard its unsaved in-memory test draft. No data
clear or account deletion; APKs/application data retained. A/B saved selections
were empty before this run and no Save occurred. A cleanup helper initially found
Metro already absent after interruption; made cleanup tolerate that absence and
completed full baseline verification, without stopping unrelated processes.

#### Validation and next step

Actual ADB/own-window checks, per-run baseline comparison, native picker title,
service verification and private caption observations only. No runtime code changed;
portable/component/API/database/build/export suites were not rerun. The successful
checks recorded in `082b1b9` stay historical, not new executions. `git diff --check`
and changed-document links/line-ledger bounds verified for this record.

Next: run the documented QA host with an available unlocked phone and observe Use
these choices dismissal, Choose apps focus/caption and owner-reported audio. Keep
confirmation pending until observed. Complete other profiles/devices, signed
release and wider accessibility/state acceptance separately. Auth/tokens stay
user-deferred; iOS belongs to Anisha. Existing IDs/counts and production-unavailable
state stay unchanged. Local documentation commit only; no push/CI/merge/deployment.

#### Every changed file and logical change

- `docs/core_plan/04_react_native_integration.md`: lines 47–52. Add measured lock-return checkpoint and link this follow-up; preserve unverified confirmation focus, restored settings, ownership and original counts.
- `docs/core_plan_implementation_notes/artifacts/rn-09f-device-followup/evidence.json`: lines 1–68. Record accepted lock/unlock state, nonaccepted focus attempts, restored baseline, privacy boundaries and remaining gates; no raw device/app identities or captions.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 19–20, 3449, 3608–3671. Add latest resume point, record preceding implementation hash and document actual observations, interrupted focus limit, complete restoration, checks not rerun and exact per-file ledger. Own hash remains Pending until the next normal update.


### RN-08 / RN08-D01–D06 — Android intervention coordinator

**Commit:** `feat(android): add native intervention coordinator and owner fencing`.
**Hash:** Pending; record on the next normal update. **Owner:** Ishmum.
**Date:** 2026-11-10. **Branch:** `task/react-native/rn-08-android-interventions`.
**Parent:** `56e7ba4` (preceding physical lock-return documentation now committed).
**Status:** Independent debug-native producer, typed QA consumer and reproducible
controller checks implemented. Actual new service/device acceptance is pending:
ADB disconnected before installation/testing and reconnection was requested.
Full RN-08 is not accepted. iOS and real Auth/token integration stay user-deferred.

#### Scope, decisions and relationships

Ishmum explicitly authorized sensible defaults for previously partial RN-08
session/day/bypass/active-selection choices. Appended dated decisions to the
original PM questions and register without rewriting the supplied PM responses or
calling these PM approval. The [decision record](../architecture/android-intervention-defaults.md)
explains user-facing choices: reuse running same-app timers; independent per-app
elapsed sessions; saved-zone midnight buckets/travel stability; crossing-midnight
sessions retain original deadline and starting-day charge; always-available extra
configured-duration bypass; exhaustion signal only on the first extra session;
reason-scoped grants and active occurrence app snapshots. Real streak/reward
calculation and recurrence/template producers remain separate.

Extend the existing local Android module and isolated native QA host; introduce no
second app session store, cloud endpoint, Supabase mutation, dependency or iOS
change. Root package.json adds a reproducible optional JVM command, with no lockfile
change required. Production ProtectionService/read-only registration stays intact;
its unsupported operations/capabilities are not silently reinterpreted as this
separate debug coordinator. No fixed production/anonymous owner is introduced.

The coordinator consumes explicit finite windows (at most 32, each at most seven
days), native saved-selection revision and explicit timezone/session policy. It
freezes active occurrence app snapshots by reason ID/start while future explicitly
updated installations use the latest supplied global selection. A new start is a
new occurrence. This is not an offline weekly recurrence compiler or backend
quest/template generator. Counter/session state survives compatible config edits;
timezone changes reject explicitly until a migration exists. No silent reset.

One native actor serializes installation revision CAS, per-app allowances/counters
and an at-least-once journal in one bounded AtomicFile record with readback. Failed
writes do not confirm a new revision. Cancel one reason without deleting others or
their grants. New overlapping reasons reuse remaining session time without an
extra charge/extension. Record one session-start action regardless of overlapping
reason count; emit exhaustion as metadata rather than awarding/resetting anything.
Wall/elapsed/boot checks bound exemptions; midnight/DST/calendar handling is native.
There is no cross-device budget or tamper-proof/force-stop guarantee.

Native lifetime handles close the stale-write gap beyond owner strings/CAS alone.
Each React module has a distinct bridge lifetime; its teardown invalidates only its
handles, never native installed policy/events or another bridge's handles. Ending
an owner expires all its handles. Retention preserves native installation/event
ownership; erasure drains issued actor work, verifies file/sidecar removal and
blocks new opens after failure until successful retry. A failed erase cannot be
downgraded to retention. Invalid/wrong owners do not clear another account's policy.
These handles identify local operation lifetime, not authentication. The future
Auth caller still invalidates its old UI before native cleanup; full deletion
must coordinate selection/Auth/backend/other-device data and restart recovery.

The explicitly enabled AccessibilityService receives window-package metadata,
never view nodes/text/typed input or gestures. A native in-app disclosure precedes
system settings; no ADB access grant or security-control bypass is implemented.
Authorization requires both a real bound service and Android's current enabled
service list, in addition to recorded consent. Revision/status remains separate
from permission, backend drafts and actual on-screen intervention. The native
scrollable overlay has system insets, safe focus, Back/Return home, per-app Open
anyway and Disable test access. Keyguard/screen-off/foreign-host windows/revocation
clear it; coalesced native boundary reads reject stale callbacks. No API, LLM,
React Native timer, foreground polling service or SYSTEM_ALERT_WINDOW dependency.

Actor journal/storage errors never fabricate rewards or saved state. A full queue
rejects further event-bearing writes until explicit drain/ack instead of silently
dropping accepted events. If persisting Open anyway fails, dismiss and disable
test access with a fixed message rather than trapping the user behind the pause.
Uncertain mutation/storage faults invalidate pending presentation; conflict leaves
the old valid installation intact. Disclosure work is canceled with its bridge/
activity lifetime; installed native work survives React bridge disposal.

#### Validation actually run

- `npm run check` passes on final source: 382 portable, 602 component passes plus
  two explicit existing Android-event/iOS-preset skips in 72 suites, 601 API passes
  and 199 database cases deselected. Types, ESLint, assets, Ruff and generated
  HTTP/OpenAPI checks pass; no backend/database behavior changed.
- Final focused component checks pass 12/12 across SDK presets; types and lint pass
  with zero errors and the same 11 existing warnings. Separate affected-suite
  rerun passes 24/24 after an unchanged age-editor test timed out in one full run.
  No timeout increase or production change was used to hide that failure; its
  root cause is not established. Final full rerun result above is separate evidence.
- `JAVA_HOME=<native JDK> npm run mobile:check-intervention-engine`: 40/40 actual
  pure Kotlin controller/lifetime cases pass on JVM, using the same source invoked
  by instrumentation. Covers per-app concurrency/reentry, overlap/one start,
  first extra session, midnight, both US DST transitions, clock/boot changes,
  snapshots, preservation, CAS/failure, owner/lease fences and journal limits/ack.
  Committed runner needs cached Gradle Kotlin compiler/JDK, downloads nothing,
  writes ignored .expo only and passes targeted Ruff/format checks.
- Final debug app/test APK builds, release module Kotlin and release manifest pass
  with JDK 17.0.21+9/Kotlin 2.2.0/Gradle 9.4.1, build tools 37.0, target 36/min 24,
  arm64-v8a. New Android runner compiles 46 cases: the same 40 pure cases plus six
  real AtomicFile cases. **Zero new Android instrumentation cases executed** while
  no phone was available. Build success is not that runner passing.
- Web export passes 38-file isolation and all 71 original SVG checks. Production
  Android Hermes, isolated QA Android Hermes and UI gallery build pass; gallery's
  existing eval warning remains. Release audit finds eight selected debug
  implementation classes and zero release instances, no nine intervention bridge
  registrations and no service declaration in release; debug manifest contains the
  bound service and excludes SYSTEM_ALERT_WINDOW. Common interface/factory types
  are intentionally shared, without implementation/capability activation.
- No new APK was installed or test service enabled. No new overlay, permission,
  expiry/bypass, task/process/reboot, lock/TalkBack or native revocation phone pass
  is claimed. Earlier selection/lock/speech records do not establish this service.
  No phone settings changed in this implementation, so no new restoration claim.
- Corrected an initial QA apostrophe lint error/new cleanup-ref warning and runner
  import ordering before accepted checks. Early commands from a nested working
  directory failed path/script lookup; subsequent scoped root commands are the
  accepted runs. No runtime bypass, warning suppression or dependency workaround.
- React best-practices review checked action lifetime, coalesced reads, immediate
  duplicate lock, stale-response epochs, unmount-before-dispatch/release, honest
  permission/uncertainty/busy states, native-only identities and export separation.

#### Remaining work and next concrete action

Read the [runbook](../qa/android-interventions.md) and
[sanitized evidence](artifacts/rn-08-interventions/evidence.json). Reconnect/unlock
the phone, install both APKs, run the new 46-case runner and legacy native
regressions, save only the owned test target, then have the owner read the native
disclosure and enable Disconnect intervention test in Android settings. Verify
actual overlay/expiry/overlap/bypass/revocation/lock/foreground/Metro-absent behavior
and accessibility, then erase the controlled test record and restore baseline.
Do not use UIAutomation dumps with the service active or capture foreign/locked UI.

Production Auth-bound adapter/root/desired-revision wiring and coordinated deletion
stay deferred; Anisha owns iOS. Actual other-device/profile, signed/store approval,
process/reboot/performance and full accessibility matrices remain unaccepted. The
compiled-window API does not supply recurrence, usage thresholds, advance warning,
reward/streak producers or a timezone-migration protocol. Do not mark these native
capabilities true merely because method names/builds/tests exist. Original part
IDs/46–21–25 counts stay unchanged; full RN-08 remains open. Local commit only;
no push, CI, main merge, deployment or remote/credential/account changes.

#### Every changed file and logical change

- `apps/mobile/android/app/src/androidTest/AndroidManifest.xml`: lines 1–7. Register only the separate test APK launcher target used for owned-device acceptance; do not add it to the app APK.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/InterventionChecks.kt`: lines 1–54. Run the shared 40 cases and six additional actual Android AtomicFile cases in unique cache fixtures: cold roundtrip, malformed state/numeric version, oversized record, partial erasure and sidecars. Preserve fixed last-case diagnostics and cleanup; Android execution remains pending.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/InterventionEngineChecks.kt`: lines 1–139. Share 40 actual pure controller/lifetime cases between JVM and instrumentation: revision/failure/isolation, concurrent/reused timers, overlap, extra-session signal, midnight/DST/clock/boot, snapshots, journal ack/limits and handle/bridge/erasure fencing.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/InterventionFixtureActivity.kt`: lines 1–22. Add an owned disposable target in the separate test APK with a Return to Hoosh action, so actual launch/pause testing can avoid personal third-party apps and accounts.
- `apps/mobile/android/app/src/androidTest/java/com/hoosh/disconnect/dev/UsageProbeInstrumentation.kt`: lines 16, 24, 30–32, 62–64. Add interventionChecks routing/count/fixed failure marker while preserving legacy selection/usage runners. Report no native exception, app inventory, account or resource details.
- `apps/mobile/dev/native/App.tsx`: lines 1, 71, 127, 133, 162. Add the Android interventions diagnostic to the existing developer menu/render/footer routing. Keep it in the isolated host; ordinary UI samples remain fixtures.
- `apps/mobile/dev/native/README.md`: lines 6, 30, 34–35, 149–166. Update diagnostic count and ordinary-fixture wording; document real local intervention controls, explicit fixture values, release separation, lifetime cleanup and device runbook.
- `apps/mobile/dev/native/interventions.tsx`: lines 1–74. Add synthetic-owner native diagnostics using explicit two-minute/15-second/UTC fixtures. Handle disclosure/refresh, selection and configuration leases, CAS install/cancel/stop, explicit drain/ack/erase, duplicate suppression, stale response/unmount fences and accessible busy/error/permission states; no production identity or Auth imports.
- `apps/mobile/modules/hoosh-usage/android/src/debug/AndroidManifest.xml`: lines 1–8. Declare only the debug accessibility service, explicit system binding permission and metadata; no release declaration or overlay/broad-package permission.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/AtomicInterventionPersistence.kt`: lines 1–72. Persist one bounded no-backup AtomicFile record with strict typed decoding, duplicate/bound checks and post-write readback. Store installation/session/counters/events together; detect corrupt/oversized/partial state and verify base/.bak/.new erasure.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/InterventionAccessibilityService.kt`: lines 1–141. Listen only for window metadata and drive native safe-inset scrollable pause/actions, coalesced native deadline reads, app/reason allowances and keyguard/foreign-window/revocation teardown. Reject stale presentation, record facts after display and disable test access if a bypass cannot persist; do not retrieve contents or inject gestures.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/InterventionEngine.kt`: lines 1–93. Implement native revision CAS, snapshot preservation, owner isolation, per-app elapsed sessions/day buckets, overlap/reentry, first-extra-session signal, clock/boot guards, precise reason cancellation and durable drain/ack/backpressure. Keep ambiguous writes unconfirmed and never compute rewards.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/InterventionLeases.kt`: lines 1–31. Issue bounded per-bridge owner handles; fence stale/wrong-owner writes, invalidate only a closing bridge, expire all owner handles at cleanup and block opens/downgraded retention while erasure remains unconfirmed. Handles are lifetimes, not Auth.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/InterventionModel.kt`: lines 1–35. Define immutable compiled-window, snapshot, policy, per-app session/day, allowance and journal records; bound/validate owner, windows, timezone, count and duration independently of Android UI or Auth.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/InterventionRuntime.kt`: lines 1–138. Provide process-wide native actor, current system-service/consent authorization, explicit setup disclosure, strict install parsing/selection validation and status/event/cleanup operations. Keep IO off window callbacks, fence async presentation with epochs and tie disclosure to bridge/activity lifetime; no network or Auth store.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/NativeInterventionBridge.kt`: lines 1–20. Give each React module its own lifetime handle namespace and disclosure ownership while delegating durable work to the process actor. Teardown drops only that bridge handles/review, not installed policy/events.
- `apps/mobile/modules/hoosh-usage/android/src/debug/java/expo/modules/hooshusage/SelectionPreviewFactory.kt`: lines 13. Construct a debug-only lifetime-scoped intervention gateway around the singleton actor after DEBUGGABLE validation.
- `apps/mobile/modules/hoosh-usage/android/src/debug/res/values/strings.xml`: lines 1–1. Provide the debug service description explaining local app-window monitoring, no content/text retrieval, visible pauses, user disable control and non-disability-tool scope.
- `apps/mobile/modules/hoosh-usage/android/src/debug/res/xml/hoosh_intervention_accessibility.xml`: lines 1–8. Limit the debug service to window-state events/generic feedback; explicitly disable content retrieval/gesture capability and isAccessibilityTool; reference the disclosure description.
- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/HooshUsageModule.kt`: lines 9, 40–58, 94–96. Cache one coordinator per React module, register nine intervention operations only under the debug factory guard, serialize gateway access on MAIN and cancel review/close handles during activity/module lifecycle. Leave production read/usage operations and capability flags intact.
- `apps/mobile/modules/hoosh-usage/android/src/main/java/expo/modules/hooshusage/InterventionCoordinator.kt`: lines 1–19. Declare the separate native gateway operations, lifetime open/release/close and review cancellation without changing the production ProtectionService or requiring a second Auth authority.
- `apps/mobile/modules/hoosh-usage/android/src/release/java/expo/modules/hooshusage/SelectionPreviewFactory.kt`: lines 10. Return no intervention gateway in release; retain compile-time feature disabling and absence of service/producer implementations.
- `apps/mobile/src/features/protection/intervention-qa.test.tsx`: lines 1–57. Add 12 preset results covering absence, native selection/revision/lease installation, uncertain write/duplicate/busy handling, unmount-before-dispatch cleanup, status/event decoding and revocation before service disconnect. Passing mocked iOS presentation is not native iOS implementation.
- `apps/mobile/src/infrastructure/native/README.md`: lines 4, 10, 47–62. Document separate coordinator/lease/native event trust boundary, existing production read-only registration and future Auth/deletion responsibilities; replace stale no-policy wording with current defaults.
- `apps/mobile/src/infrastructure/native/intervention-coordinator.ts`: lines 1–47. Define explicit typed debug coordinator/lifetime operations, finite windows and session policy. Strictly decode coherent count-only native status and unique event IDs; strip extras and reject armed/zero-app or unpermitted contradictions.
- `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 17–24. Expose new RN-08 default authority/producer status to future agents, with links and explicit device/production/iOS/signed limitations instead of relying on chat history.
- `docs/Context (AGENT)/OPEN_DECISIONS.yaml`: lines 3–4, 240–252. Advance register metadata and add a separate authorized implementation-default section referencing the affected PD IDs, rationale record and unchanged Auth/iOS/feature exclusions. Do not relabel original PM approvals.
- `docs/Context (AGENT)/PM_QUESTIONS.md`: lines 4–5, 44, 80–85, 103–108, 143–148, 166–171, 189–194, 212–217, 307–312. Append dated Ishmum-authorized implementation decisions under Q03/Q04/Q06–Q09/Q14 and link the rationale; preserve original PM answers/statuses and distinguish resolved engineering choices from remaining feature acceptance.
- `docs/architecture/android-intervention-defaults.md`: lines 1–41. Record Ishmum-authorized provisional defaults, reasons and explicit migration/capability limits, separated from PM answers. Document primary Android/Play research and debug disclosure/service approach without asserting store approval or device reliability.
- `docs/architecture/pm-decisions-2026-11-09.md`: lines 64–71. Link subsequent Ishmum authority without rewriting the dated PM reconciliation or pretending a new PM/Anisha review occurred.
- `docs/core_plan/04_react_native_integration.md`: lines 458–472, 475, 542–546. Record the debug coordinator under existing RN08-D01–D06, distinguish original read-only deferrals from new producer scope and retain unaccepted production/device/recurrence gates. Preserve original IDs/counts; no full-RN-08 completion claim.
- `docs/core_plan/README.md`: lines 8–15. Add current coordinator/default/check checkpoint and links; retain original producer counts, Auth/iOS ownership and open parent acceptance.
- `docs/core_plan_implementation_notes/artifacts/rn-08-interventions/evidence.json`: lines 1–135. Record final source/APK fingerprints, actual checks and release isolation, limits and remaining acceptance. Clearly distinguish 40 JVM passes from zero new Android executions and exclude inventory/captures/credentials/serials.
- `docs/qa/android-interventions.md`: lines 1–135. Document architecture/bounds, reproducible native/JVM commands, 46-case versus 40-case evidence, disclosure/owned-target UI flow, permission/revision/expiry/owner/Metro tests and privacy/baseline restoration. Explicitly label absent physical acceptance.
- `package.json`: lines 28. Add the optional mobile:check-intervention-engine script for reproducible native logic checks without making Node-only root CI depend on an SDK/cache. No dependency/lockfile changes.
- `packages/contracts/src/protection.ts`: lines 1. Correct the stale contract header to point at current PM/Ishmum authority. Preserve all existing public interface types and capability semantics.
- `scripts/check-android-intervention-engine.py`: lines 1–108. Compile the actual pure Kotlin implementation and shared test file using local Gradle compiler/JDK caches; run 40 cases without fake Android classes or downloads. Write only ignored output and keep Android persistence checks separate.
- `scripts/check-ui-preview-isolation.mjs`: lines 34. Add the intervention QA marker to production export isolation enforcement; verify the current 38-file export excludes it.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7–9, 19–20, 3613, 3676–3856. Update current branch/resume/previous commit hash and document every decision, implementation relationship, actual check/correction, unavailable device limit, remaining gate and exact per-file ledger. Historical line ranges remain tied to their old commits.
