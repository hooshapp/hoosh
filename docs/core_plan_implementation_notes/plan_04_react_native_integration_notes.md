# Plan 04 — React Native Integration Implementation Notes

**Plan:** [04_react_native_integration.md](../core_plan/04_react_native_integration.md)

**Owner:** Ishmum. Anisha owns Auth/onboarding and iOS; these shared primitives are ready for her consumers.

**Current part:** RN-01 implemented and validated for its shared UI/testing scope. RN-02–11 remain not started.

**Implementation branch:** `task/react-native/rn-01`, created from `area/react-native`; the shared starting point for this change is `6a64e98`.

**Commit reference:** The RN-01 entry below travels with its implementation commit. Its unique subject is `feat(mobile): add shared accessible screen state primitives`; resolve the actual hash from Git until it is added in a subsequent normal notes update. Do not confuse a pending hash at write time with missing implementation.

**Last updated:** 2026-10-29.

**Shared workflow:** [Implementation knowledge base](README.md).

## Resume here

- RN-01 now provides `Screen`, themed `EmptyCard`, controlled `Button`, Router-preserving `RouteButton`, raw-value `Field` and typed `InlineStatus`, with small presentation/accessibility helpers. See the [component API and controller contract](../../apps/mobile/src/components/ui/README.md).
- Validation passed: 40 component/hook checks across iOS/Android Jest presets, 5 portable Vitest checks, 3 existing API checks, workspace types/lint, SDK dependency compatibility, specimen build and the real Expo web export/isolation guard. Browser checks covered 393/320 px frames, large text, keyboard order, error/busy/retry states and actual exported-app navigation.
- Anisha can consume the shared controls and Jest harness in AUTH-03/04/07. She still owns the Auth client/controllers/guards; Ishmum's components do not sign in, refresh credentials, persist a profile or authorize a user.
- For the next Plan 04 part, start RN-02 (authentic asset inventory and main navigation) in a fresh task branch from the updated shared/area branch. API-01 remains an independent Ishmum backend task if switching lanes. No later part was implemented here.
- Native signed builds, real iOS/Android keyboard behavior, VoiceOver/TalkBack, native Dynamic Type and adapter/enforcement acceptance remain unverified. These screenshots and mocks do not complete RN-10 or native/Auth acceptance.
- Legacy Swift import `fe8f262`, root routing/guard files, native signing, backend and domain contracts are unchanged. Shared context relocation is recorded under [the documentation setup entry](README.md#documentation-setup-commit--context-relocation-and-knowledge-base-workflow).
- Context: [agent entry](<../Context (AGENT)/AGENT_START_HERE.md>), [PRD](<../Context (AGENT)/PRD.md>), [TSD](<../Context (AGENT)/TSD.md>), [PM questions](<../Context (AGENT)/PM_QUESTIONS.md>), [execution order](../core_plan/README.md), [Plan 00](../core_plan/00_shared_contracts.md).

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

**Hash:** Pending at entry write time; this entry and its code are committed together. Locate it with `git log --oneline --all --grep='^feat(mobile): add shared accessible screen state primitives$'`. Record that real hash on the next normal notes update, without a recursive notes-only commit.

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
