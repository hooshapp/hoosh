# Plan 04 — React Native Integration Implementation Notes

**Plan:** [04_react_native_integration.md](../core_plan/04_react_native_integration.md)

**Owner:** Ishmum. Anisha owns Auth/onboarding and iOS; these shared primitives are ready for her consumers.

**Current part:** RN-04 producer implemented; real Auth/root wiring pending. RN-03 is `0741758`; RN-05–11 remain not started.

**Implementation branch:** `task/react-native/rn-04`, parent RN-03 `0741758`. No push/main merge is implied.

**Commit reference:** RN-01 is `2f88102`; RN-02 is `2d5c0d1`. RN-03 is `0741758`. RN-04 travels with its code under the unique subject `feat(mobile): isolate account server state and lifecycle`; resolve its self-hash from Git until the next normal notes update.

Historical reference: RN-01 is `2f88102`. RN-02 travels with its code under the unique subject `feat(mobile): add authentic assets and floating main navigation`; resolve its hash from Git until the next normal notes update records it. A pending self-hash at write time is not missing implementation.

**Last updated:** 2026-10-29.

**Shared workflow:** [Implementation knowledge base](README.md).

## Resume here

- RN-01 `2f88102`, RN-02 `2d5c0d1`, RN-03 `0741758`; RN-04 now supplies the independently consumable [query/provider contract](../../apps/mobile/src/infrastructure/query/README.md). Its self-hash is resolved by the unique commit subject above.
- Latest checks: 163 portable tests (42 new RN-04), 88 component/native cases in 22 suites (26 new across iOS/Android), 3 API tests; workspace types/lint/assets, supported web export (16 routes/32 isolation files), SDK dependency compatibility and lockfile dry-run passed. Direct native compilation imports all new producers/adapters; see RN-04 source-map/hash evidence.
- Anisha composes the stable AuthSessionPort + API client + account controller and lifecycle boundary in her coordinated root/guard change. The current placeholder app does not consume the producer. Native Expo Network must be autolinked and tested in audited signed builds. No Supabase SDK, private endpoint, generated API DTO, Auth guard or native enforcement is implemented here.
- RN-05 needs real AUTH-02/03/07 and API-04/05 outputs; do not claim M1 or start live identity with a mock account. Ishmum can independently start API-01/backend or Android investigation while those producers are built. RN-05–11 remain unstarted.
- Scope replacement clears private caches and remounts forms; same-owner temporary unavailability preserves drafts/data while blocking requests. Keep all private toasts/drafts inside the keyed boundary. No persisted cache, automatic mutation replay or sign-out native cleanup policy is introduced.
- The unrelated untracked icon folders present at RN-04 start are excluded. Main is neither merged nor pushed by this task.

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
**Hash:** Pending. **Date:** 2026-10-29. **Owner:** Ishmum. **Branch:** `task/react-native/rn-04`.
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
