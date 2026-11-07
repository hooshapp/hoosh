# 04 — React Native Integration and Shared Frontend Plan

**Date:** 2026-10-28\
**Status:** RN-01/02/03 and RN-04 producer implemented with recorded evidence; RN-04 real root wiring remains coordinated/pending, RN-05 has an independently prepared consumer with live acceptance pending, RN-07 has a revisioned consumer and conditional Settings wiring with real Auth/device acceptance pending, RN-08a–d Android read/permission integration and device acceptance are implemented (enforcement/iOS remain open), RN-09a–h main/detail/editor UI is implemented with live acceptance pending, RN-10 shared UI/lifecycle hardening is implemented with device/live checks pending, and RN-06/11 await their prerequisites. RN-02 also has native JS/Hermes exports; signed-device rendering/keyboard/screen-reader acceptance remains separate.\
**Primary owner:** Ishmum — shared post-onboarding React Native application.\
**Required reviewer / collaborator:** Anisha — authentication, onboarding, iOS integration, and root navigation.\
**Area branch:** `area/react-native`; create each task branch from the updated area branch and integrate working increments into `main`.\
**Companions:** [Shared contracts](00_shared_contracts.md), [Supabase foundation](01_supabase_foundation.md), [Auth/onboarding](02_auth_onboarding.md), [Backend foundation](03_backend_foundation.md), [PM questions](<../Context (AGENT)/PM_QUESTIONS.md>).

**Implementation record:** Follow the [knowledge-base workflow](../core_plan_implementation_notes/README.md) and maintain [Plan 04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md). Each commit needs its own file/line change record, reasoning, checks and handoff. Preparation alone does not complete a part; RN-01's actual evidence is recorded below and in its notes.

## 1. Outcome and deliberate scope

The first outcome is a real authenticated round trip: the mobile app obtains a current session through the auth integration, calls FastAPI `GET /v1/me`, and displays the verified account without leaking an earlier account's data. The second outcome is minimal profile integration, with honest loading, failure, offline, and conflict handling. Neither outcome depends on guessing session allowances, rewards, or Android blocking capabilities.

Alongside that integration, build reusable Figma-derived UI and the four main tab surfaces so screen work can progress while backend and native owners work independently. This is not permission to mark the entire Figma app finished: persistent quests, actual app restrictions, progress calculations, reward awards, and AI suggestions remain separate gated feature work.

### Included now

- Shared UI primitives and screen recipes from the observed visual system.
- Original design assets, accessible navigation, and real empty/error states.
- A small HTTP boundary, generated HTTP types, session-scoped query/cache ownership, and explicit error mapping.
- The real identity screen/header, then approved minimal profile read/update behavior.
- Presentation of actual native capability/status when an adapter becomes available.
- A complete independent-development and integration test path.

### Excluded from these initial commits

- A second login/session manager, refresh-token store, or JWT decoder trusted for authorization.
- Supabase project configuration, server JWT verification, database migrations, or direct product-table writes from mobile.
- Native enforcement implementation or a JavaScript substitute for it.
- A guessed plan/session allocator, reward ledger, Dino formula, streak formula, quest completion verifier, or fabricated usage history.
- A general offline mutation queue, calendar synchronization, push campaign system, AI message generation, payments, or a production release.

## 2. Current code baseline to preserve

The observations below describe the starting scaffold; RN-01/02 additions and current evidence are recorded in the ledger and implementation notes.

These are repository observations at planning time, not desired future behavior:

| Existing surface | Current behavior | Planned treatment |
|---|---|---|
| `src/app/index.tsx` | Redirects directly to tabs as an unauthenticated development preview | Auth owner replaces this with the agreed bootstrap/guard flow; RN owner must not create a competing redirect |
| `src/app/_layout.tsx` | Loads four Space Grotesk weights, controls splash, mounts root stack/safe area | Retain; coordinate provider insertion with auth owner in one reviewable change |
| `src/app/(tabs)/_layout.tsx` | Four tabs; text-only temporary floating bar | Replace with authentic source icon recipes and accessibility behavior |
| `src/components/ui/*` | Basic screen, empty card, route button | Extend only where a real screen needs a new recipe; do not create a huge generic component system |
| `src/infrastructure/api/client.ts` | Injected token provider, same-origin path checks, basic HTTP failure, `204` handling | Preserve security properties; add cancellation, bounded timeout, typed error parsing, and safe response decoding |
| `client.test.ts` | Five tests of the initial HTTP boundary | Extend the behavior tests; do not discard the existing token/path protections |
| `packages/contracts` | `AccessTokenProvider`, liveness type, draft native port | Consume agreed types; generated HTTP types become authoritative for HTTP shapes |
| Main routes | Explicit placeholders; no accounts, app metrics, or successful native adapter | Keep unavailable states truthful throughout incremental integration |
| Installed mobile packages | Expo/Router, React Native, fonts, animation dependencies, pure-TS Vitest | Add only packages used by a planned part and lock the compatible versions |
| Native projects | Legacy iOS source imported in `fe8f262`; audit/build/RN integration pending; no shared protection adapter connected | Device integration cannot be claimed from web or JavaScript export success |

Source paths in this document are relative to `apps/mobile/` unless explicitly prefixed with a repository path.

## 3. Contracts and ownership boundaries

### 3.1 One authentication authority

The auth owner supplies the session snapshot, `AccessTokenProvider`, bootstrap completion, and approved auth-recovery actions from Plan 02. The frontend consumes that public surface and does not read Supabase storage keys directly. The HTTP client asks for the current access token on every protected request; it does not retain a token at module import time.

Root navigation and auth guards remain owned by the auth developer. Expo protected routes are a navigation control, not server authorization; the backend still verifies every protected request. [Expo protected routes](https://docs.expo.dev/router/advanced/protected/)

The public auth snapshot comes from Plan 00: `bootstrapping`, `signed_out`, `signed_in`, `signing_out`, or `unavailable`, always carrying `sessionGeneration`. `signed_in` includes `{ user_id, email }` and credential status `ready`, `refreshing`, or `unavailable`; bootstrap/configuration/storage uncertainty is not a known signed-out state. Do not invent a second `authenticated` boolean/state machine in screen modules. Use the canonical user ID, not email, as cache/draft identity. Email may be absent, changed, or stale.

The generation increments for account/auth-session replacement and sign-out intent, not normal token refresh or duplicate signed-in notifications. `getAccessToken()` returns null only for known signed-out state; transient inability to retrieve/refresh credentials is a typed failure. `revalidateSession(): Promise<void>` is single-flight and owned by auth. HTTP/query code re-reads the snapshot afterwards and may replay only one idempotent GET for the same account/generation. Consume `AuthSessionPort` from the contracts package; AUTH-07 supplies the separate `AuthAccountActions` for Settings sign-out.

### 3.2 HTTP authority and endpoint stages

| Stage | Endpoint | Frontend use | Boundary |
|---|---|---|---|
| M1 identity | `GET /v1/me` → `{ user_id: UUID, email: string \| null }` | Confirms that FastAPI accepted the session and displays the verified identity | No profile table or onboarding completion inference |
| M2 profile | `GET /v1/profile`, `PATCH /v1/profile` | Loads and updates only the minimal display-name profile | Onboarding data needs a separate later contract; use exact M2 semantics from Plans 00/03 |
| Later policy integration | Approved plan/quest/event/insight endpoints | Future feature-specific work | Do not derive new APIs from Figma mock content |

The M2 response is `{ profile: null }` for an absent row, or `{ profile: { user_id, display_name, revision, created_at, updated_at } }` for an existing row. A GET never creates a profile. PATCH sends `{ expected_revision, display_name? }`, with a real mutable field required: revision `0` means insert only if absent; existing rows require compare-and-swap against their current revision. `display_name: null` clears; omission is unchanged. The server applies Plan 00's Python 3.12 `str.strip()` normalization, rejects an empty result, and enforces 80 Unicode code points. Submit raw draft input or explicit null and adopt the returned normalized value; client advisory validation must not reject a server-valid whitespace-padded value. Use server-owned edge fixtures, not an independent JS `trim()`/`.length` rule or a misleading `TextInput maxLength={80}` limit on UTF-16 input.

The canonical failure envelope is `{ error: { code, message, retryable, request_id, details? } }`. Relevant initial codes are `AUTH_REQUIRED`, `INVALID_TOKEN`, and `TOKEN_EXPIRED` (`401`), `FORBIDDEN` (`403`), `AUTH_UNAVAILABLE`/`DEPENDENCY_UNAVAILABLE` (`503`), `VALIDATION_ERROR` (`422`), and `PROFILE_CONFLICT` (`409` with sanitized `details.current_revision`, integer >=0, 0 meaning absent at the conflict read). A conflict revision is advisory; refetch and review rather than automatically retrying with it. Frontend behavior must use these semantics; `retryable: true` is not permission for an unlimited automatic retry.

SC-01 adopted the identity/profile split and updated TSD §8.3. Use the [accepted HTTP contract](../../packages/contracts/HTTP_API.md), its fixtures, and API-05 generated types when available; frontend code must not silently support two incompatible shapes. The endpoints remain future implementation.

API-05 owns OpenAPI export to `packages/contracts/openapi/foundation.openapi.json` and type generation into `packages/contracts/src/http.generated.ts`, using the Plan 00 `openapi-typescript` approach. Consume that output; do not build a competing generated runtime client or duplicate Pydantic models by hand. Retain small response-boundary checks for required fields and show a recoverable protocol error for HTML, malformed JSON, or a mismatched account. The agreed wire version is the `/v1` path; no separate contract-version response header exists in M1/M2. Ignore compatible additive fields while validating required known fields. Generated compile-time types do not validate arbitrary response bytes at runtime.

### 3.3 State ownership

| State | Owner / storage | Frontend rule |
|---|---|---|
| Access/refresh tokens and auth bootstrap | Auth service and its approved secure storage adapter | Never duplicate in a global UI store, query cache, logs, route parameters, or SQLite |
| Server identity/profile | TanStack Query; memory only in M1/M2 | Scope by user and session generation; invalidate/reload when appropriate |
| Unsaved form input | Screen/feature state; account-scoped draft only if the auth/onboarding contract requires persistence | Discard from the current UI on account change; never assign A's draft to B |
| Native authorization, installed revision, active restriction reasons | Native adapter | Query actual status and capabilities; a profile/plan response cannot make protection active |
| UI expansion, modal visibility, active field | Component state | Do not introduce Zustand for state that naturally belongs to one screen |
| Shared product policy | Versioned approved contract | Screens cannot invent their own limits, rewards, or completion rules |

Use TanStack Query for server state once the first real server query is introduced; use React component/context state for the small local UI needs. This is a design choice to reduce duplicated fetch/cache logic, not an instruction to add another state library immediately. Its query functions accept cancellation signals, but cancellation only reaches `fetch` when the client consumes that signal. [TanStack query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)

### 3.4 Integration owner matrix

| Change | Author | Reviewer / handoff |
|---|---|---|
| Shared UI/assets/tab composition | Ishmum | Anisha reviews any auth/onboarding recipe impact |
| Session provider, token refresh, bootstrap, auth routes | Anisha | Ishmum reviews the exposed interface and API handoff |
| Root provider/guard change | Anisha authors coordinated integration | Ishmum supplies query/cache provider and lifecycle hook; avoid simultaneous edits |
| API client and query lifecycle | Ishmum | Anisha validates token/recovery behavior |
| Profile contracts/server logic | Ishmum as backend owner | Anisha validates onboarding use before schema freeze |
| Onboarding screens/drafts | Anisha | Ishmum validates profile/plan contract compatibility |
| iOS native adapter | Anisha | Ishmum consumes its read interface; do not edit Xcode targets independently |
| Android native adapter | Ishmum | Anisha reviews shared port compatibility |
| Root lockfile/shared contract | One named author per PR | Ishmum and Anisha review; update from `main` before editing |

## 4. Figma and requirement mapping

Use [the current design](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1) as visual authority, not proof of shipped features. IDs below are traceability targets, not a claim all their behavior is covered in M1/M2.

| Surface | Figma nodes | Requirements / constraints |
|---|---|---|
| Shared visual recipes | `10611:12784` | NFR-008/011; preserve contextual sizes/radii, font weights, vectors, and warm/dark contexts |
| Main navigation | `22:4`, `27:155`, `27:153`, `27:157` | Home, Quests, History, Settings; active tab has label; content clears bar/safe area |
| Settings/profile | `27:157`; age `10601:5908`; gender `10601:6146` | FR-009/034; demographics remain optional and launch collection is not yet decided |
| Apps/activities editors | `10601:5968`, `10601:6057` | FR-004/005/034; selection data/capabilities must be genuine; no fake most-used list |
| Plan editors | `10601:6315`, `10601:6513`, `10601:6690` | FR-013/021/034; depend on approved plan policy and native reconciliation |
| Home / Dino | `22:4`, `88:96` | FR-022/028/029/030; no assumed health, credits, streak, or saved-time values |
| Quests | `27:155`, `10487:126`, `10577:427` | FR-023–027; completion, per-quest app selection, overlap, and lifecycle still need decisions |
| History | `27:153`, `10570:192`, `10570:193` | FR-031–033; measured source/coverage; forecast remains gated by PD-12 |
| Auth/onboarding relation | `18:2`, `27:59`, `50:85`, `50:87`, `10556:120`, `50:89` | FR-002/006–008; auth owner builds these; success must not falsely imply native protection |
| Native intervention references | `10514:168`, `65:91`, `76:69` | FR-010–020; native supported rendering is validated in separate platform plans, not implemented as arbitrary RN overlays |

Home recommendations must remain temporary unless an explicit accepted action creates a saved object; the annotation `10517:138` does not authorize silently attaching recommendations to the profile. The annotation `10517:234` distinguishes pause/quit reward examples but does not approve a complete reward policy. Annotation `10565:254` asks for app selection per quest; the editor contract needs a PM answer before that feature is built.

The reviewed Settings frame has no sign-out or deletion control. Adding an account sign-out action is a proposed functional adaptation for the real auth milestone, not a claim that it appears in Figma; review its location/copy with PM/design. Account deletion is not silently added by this plan because its native cleanup/identity-deletion behavior still needs a complete contract. The Figma file has no wired prototype reactions, so navigation rules come from explicit route contracts and reviewed screen intent rather than a claimed functioning prototype.

## 5. State and failure design

### 5.1 Separate availability dimensions

Do not collapse all of these into one global loading flag:

- Auth storage/bootstrap: the canonical snapshot states above, with credential readiness separate inside `signed_in`.
- Network/server: reachable, offline, timeout, unavailable service, protocol failure.
- Profile: not requested, loading, missing, loaded, unsaved changes, saving, conflict, failed save.
- Native: adapter absent, unsupported capability, permission required, inactive, pending install, confirmed active, degraded/failed, unknown after read error.

An API outage does not sign the user out automatically. A saved profile does not install native restrictions. Permission denial does not erase the profile. A missing native adapter is not an iOS/Android capability verdict.

### 5.2 Screen state table

| Situation | User sees | Interaction / data rule |
|---|---|---|
| Auth bootstrap has not finished | Short neutral startup/loading state | No authenticated account data, redirects, or account queries until the auth snapshot is settled |
| Signed in; identity request pending | Skeleton/loading in the account region | Do not fill Jordan Rivera or another Figma name/email |
| `/v1/me` accepted | Real account identity | `email: null` gets a neutral account label; no guessed name |
| Offline with no account data loaded | Clear connectivity state and Retry | Do not show zero progress as if measured; sign-in state remains separate |
| Offline after same-user data loaded | Same-user cached account/profile with stale/offline notice where relevant | Memory cache only in M1/M2; no implied server confirmation of edits |
| Service returns `503` | Temporary service unavailable, Retry | Do not clear session or loop refresh; preserve unsaved same-user input |
| API returns canonical `401` | Auth recovery state owned by auth integration | At most the agreed bounded revalidation/retry; no infinite refresh loop |
| API returns `403` | Access unavailable with safe recovery/contact path | Refresh is not an authorization remedy; no automatic retry storm |
| Profile validation `422` | Approved field errors plus general fallback | Keep valid input; do not show raw server stack/errors |
| Revision conflict `409` | Explain that settings changed elsewhere; reload/review choice | Do not blindly overwrite new server data or auto-merge incompatible fields |
| Save request times out after possible server commit | "Couldn't confirm save" and reload/reconcile action | Read the authoritative state before repeating a non-idempotent mutation |
| Native status unavailable | Accurate unavailable/setup state | No green "Protected" badge based on auth/profile/API health |
| Permission revoked on return to app | Permission-needed/recovery state | Re-read native state, keep server profile, and coordinate native owner |
| Feature lacks approved policy/measurement | Explicit unavailable/coming-later surface or hidden production action | No pretend success, fake metrics, dead primary button, or fabricated completion |

Copy should be concise and supportive. Request IDs may appear in a secondary support detail, not as the primary explanation. Backend names, JWT algorithms, schema versions, and developer debugging instructions stay outside ordinary product flows.

### 5.3 Account transition and late-response invariant

Before starting a user-scoped request, capture the current immutable account ID and a monotonically changing session/account generation from the integration layer. After awaiting a token and after receiving a response, verify that generation/account still match the request's owner. A response to A's request must never be rendered, cached under B, or used to navigate B.

On sign-out, account switch, invalidated session, or an auth-recovery transition that removes the account:

1. Stop scheduling new user-scoped queries/mutations for the departing account.
2. Abort pending HTTP requests using their signals and cancel queries.
3. Observe the auth owner's already-advanced `sessionGeneration` and close the departing local request/query scope so late or uncancellable responses are ignored. RN never independently increments or writes the public auth generation.
4. Unmount or reset the departing account's feature tree, forms, transient toasts, and selected IDs.
5. Clear the departing in-memory query/mutation cache and detach its QueryClient.
6. Use a fresh QueryClient for a newly signed-in account; never use previous-account placeholder data.
7. Let auth owner finish its storage/session transition and navigation; do not make local cache cleanup depend on a successful network sign-out.

This is application-data cleanup, not approval to remove native restrictions. Whether native rules survive sign-out, belong to an account, or must be transferred/disabled is a PM/native migration decision (Q17/PD-15). Until defined, there must be no automatic reattribution of local native rules/events to another account. Real account switching with account-bound native protection is a release gate in the platform plans.

## 6. Commit sequence and dependencies

RN-01/02/03 and the RN-04 producer are implemented with evidence linked below; RN-04 real root wiring is pending, RN-05 consumer preparation is recorded separately, RN-07 has revisioned consumer wiring with real Auth/device acceptance pending, RN-08a–d Android read/permission integration and device evidence are recorded separately, RN-09a–h main/detail/editor UI is implemented with live acceptance pending, RN-10 now has shared UI/lifecycle hardening and a reproducible QA record, while its device/live acceptance, RN-06/11 remain pending. A part is not complete merely because its task branch exists. Proposed messages are suggestions for the actual implementation commits, not instructions to commit this planning document under those messages.

| Part | Coherent proposed commit | Prerequisites | Exit evidence | Status | Actual commit |
|---|---|---|---|---|---|
| RN-01 | `feat(mobile): add shared accessible screen state primitives` | Plan 00 UI/state boundary; existing scaffold | 40 iOS/Android component checks, separate 5-test Vitest suite, 393/320 px + large-text specimens, export isolation; see notes | Complete for RN-01 scope | `2f88102` (notes record historical evidence) |
| RN-02 | `feat(mobile): add authentic assets and floating main navigation` | RN-01; verified source asset inventory | 12 original SVGs; 62 iOS/Android checks overall; 21 browser cases; web/native bundle and asset/isolation evidence | Complete for RN-02 scope | `2d5c0d1` (notes record historical evidence) |
| RN-03 | `feat(mobile): harden account-scoped HTTP requests` | Plan 00 HTTP/error contract; current client | 121 HTTP-boundary cases; 62 UI regressions; local Fetch redirect/body tests; direct native client bundles and fixture isolation | Complete for RN-03 scope | `0741758` (historical evidence in notes) |
| RN-04 | `feat(mobile): isolate account server state and lifecycle` | RN-01/03, SC-03; AUTH-02 for real root integration | 42 new portable cases + 26 iOS/Android cases; two-account/draft/callback/retry/event cleanup; direct native compilation | Complete for producer scope; real root wiring pending | `610f570` (producer; real root wiring pending) |
| RN-05 | `feat(account): connect verified API identity to settings` | RN-01/04; AUTH-01/02/03/07; SB-03; API-04/05 | Real sign-in → `/v1/me` account screen evidence | Consumer prepared/tested; real integration and acceptance pending | `0c6e4db` (preparation only) |
| RN-06 | `test(mobile): cover authenticated round trip and recovery` | RN-05; auth guards/recovery integrated | M1 acceptance matrix, no development bypass, build evidence | Not started | — |
| RN-07 | `feat(account): integrate versioned profile reads and edits` | RN-04/05; approved profile contract/API/migration | Real profile round trip, conflict and ambiguous-save handling | Revisioned consumer wired; real Auth/root/device acceptance pending | `5790302` (UI); `f32e87c` (consumer wiring) |
| RN-08 | `feat(protection-ui): show native capability and installation states` | RN-01; agreed native read boundary; actual adapters for integration | Status mapper tests; device evidence only where adapter exists | Android a–d read/permission scope implemented and device-verified; enforcement/iOS/product gates open | `71da2d5`; a `6117b96`, b `6734a26`, c `d1aa6ee`; d see notes/artifact |
| RN-09 | `feat(mobile): compose main app surfaces with explicit feature states` | RN-01/02; RN-07/08 where live data is used | Figma comparisons + no invented production data | RN-09a–h UI, i/j consumers and k saved-preference composition implemented; k native status, l live acceptance and remaining product/live gates open | `ff75039`, `2bbebad`, `c1c84c3`; RN-09d resolved by its notes/unique commit subject |
| RN-10 | `fix(mobile): complete accessibility layout and lifecycle handling` | Implemented RN parts; relevant device build access | Accessibility/device-size checks and targeted regression tests | Shared hardening/icons, Expo Go and RN-10d Android debug-device acceptance recorded; full platform/live acceptance pending | RN-10 notes; RN-10a `ab7d855`, b `704bc49`, c by unique subject |
| RN-11 | `test(integration): document profile and platform handoff acceptance` | RN-06/07/10; RN-08/09 evidence as applicable | M2 matrix, native capability handoff, reproducible runbook | Awaiting live Auth/API/profile prerequisites; not executed | — |

**Planning expansion (2026-11-02):** The original RN-01–11, RN-09a–h and
D-ref IDs are unchanged. RN-08a–d and RN-09i–l below are subparts, not
additional top-level RN parts. RN-09i/j are implemented for their consumer scope;
the remaining subparts and parent live acceptance stay open. API-11/12 are their bounded
backend dependencies in the existing Plan 03. Start RN-08a independently, or
API-11 → API-12 → RN-09i → RN-09j. RN-08c plus RN-09i/j feed RN-09k → RN-09l.
Anisha's Auth/onboarding/iOS and unanswered product behavior remain outside this
implementation slice. Full parent-part/RN-11 acceptance still requires the
original live/native/product evidence.

Independent UI work RN-01/02 may start while Supabase/Auth/backend are being built. RN-03 can use deterministic test responses once the HTTP contract is agreed. RN-04 can use injected test auth snapshots, but no production fixture mode. RN-05/06 are the first real identity milestone. RN-07 is a later profile milestone. RN-08 must not block M1 when no native adapter exists; only its pure presentation boundary can proceed without one. RN-09 is bounded presentation work, not completion of all app business logic.

If a part grows beyond one reviewable behavior change, split it into suffixed parts (for example RN-07a and RN-07b), preserve the original dependency intent, and update this ledger. Do not combine an asset replacement, auth migration, database schema change, and native setup into one commit.

## 7. Detailed parts

### RN-01 — Shared screen, form, and asynchronous state primitives

**Owner:** Ishmum; Anisha reviews primitives used by auth/onboarding.\
**Dependencies:** Shared visual/state boundaries in Plan 00; no Supabase or backend prerequisite.\
**Requirements:** NFR-008/011; FR-009/034 supporting UI.\
**Figma:** `10611:12784`, representative settings/editor frames.

**Proposed files:** Extend `src/components/ui/screen.tsx`, `route-button.tsx`, and `empty-card.tsx`; add only immediately used primitives such as `field.tsx`, `inline-status.tsx`, `retry-state.tsx`, and `save-button.tsx`; extend `src/design/tokens.ts` with observed contextual recipes. Add an isolated development specimen/test entry only if needed for visual checks; it must not become a public account route.

**Implementation steps:**

1. Separate warm everyday surfaces from dark auth/planning recipes; retain Space Grotesk weights without a synthesized 600 weight.
2. Define loading, empty, retryable error, unavailable, and saving presentations. Keep noninteractive notices distinct from actionable buttons.
3. Add persistent form labels, field-specific error association, an accessible screen heading, and logical focus behavior. Neutral Figma secondary buttons are not automatically disabled.
4. Extend hit areas around small icons/steppers without distorting original vector bounds. Let long text wrap and form content scroll above keyboard/safe areas/floating navigation.
5. Give action components explicit `busy`, `disabled`, and accessible labels/roles; suppress duplicate submissions locally while preserving the authoritative server check.
6. Avoid a generic schema-driven form builder, universal radius/spacing normalization, or a full design-system library until real screen reuse justifies it.

**Validation and acceptance:** Inspect warm/dark specimens at 393 px and a smaller supported phone width; test label/error announcements, busy button duplicate prevention, retry callback, focus order, and large-font wrapping. RN-01 is the single shared setup part for SDK-compatible `jest-expo` and React Native Testing Library; auth forms/guards consume it. Keep existing pure-TS Vitest tests. Use disjoint globs: Jest handles component `*.test.tsx` and native-adapter `*.native.test.ts`; Vitest handles portable `*.test.ts` while explicitly excluding `*.native.test.ts` and preserving its default build/dependency exclusions. Wire both scripts into root checks/CI, check pinned SDK/library compatibility, and agree one author before editing shared package/lock/config files. AUTH-01/02 portable work does not wait on this part. [Expo unit testing](https://docs.expo.dev/develop/unit-testing/)

**Edge cases:** Missing labels; very long custom activity names; long localization-ready strings; screen-reader cursor after an error; reduced motion; keyboard covering a footer; font-load error; Android gesture area and iOS bottom inset.

**Commit done when:** Reused primitives render without changing product policy, their interactive behavior checks pass, and Anisha can use the same field/button recipes in auth. **Recovery:** revert the new recipe/component or hide its consumer; no persisted data change exists.

**Implementation evidence (2026-10-29):** [RN-01 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md) record every changed file/line range, design/compatibility decisions, actual checks and browser screenshots. [Component usage](../../apps/mobile/src/components/ui/README.md) documents the controlled form/busy contract and isolated preview. Native iOS/Android keyboard, VoiceOver/TalkBack and Dynamic Type remain explicitly unverified on signed devices; this does not complete RN-10 or native/Auth acceptance.

### RN-02 — Authentic asset inventory and main navigation

**Owner:** Ishmum.\
**Dependencies:** RN-01; current Figma source exports available.\
**Requirements:** FR-028/029/034; NFR-008/011.\
**Figma:** `22:4`, `27:155`, `27:153`, `27:157`, `88:96`, `10611:12784`.

**Proposed files:** `assets/icons/`, `assets/mascot/`, a small `assets/README.md` provenance manifest, `src/components/navigation/`, `src/app/(tabs)/_layout.tsx`, and the package/lockfile only if a source SVG renderer is actually required.

**Implementation steps:**

1. Export the original icon and mascot assets at their required node/view bounds. Record file/node IDs, purpose, export format, and any source version/date. Do not save transient Figma asset URLs as production dependencies.
2. Keep authentic third-party app/provider logos separate from line icons. Preserve expression details and illustration colors; do not replace the Dino with an emoji, an icon font, or generated art.
3. Choose SVG vs raster per source shape and native compatibility; add `react-native-svg` through Expo-compatible installation only if used. Do not introduce a transformer/build plugin merely to import a few assets if a simple explicit component/data path suffices.
4. Replace the temporary text-only tab bar with the source icon/active-label recipe. Preserve accessibility names for inactive icon-only tabs and announce the active tab.
5. Derive floating-bar placement/content clearance from safe-area insets and measured bar geometry, not a hardcoded universal screen height. Preserve route groups and histories owned by the auth integration.
6. Avoid duplicate route implementations for active/inactive states; do not move auth/onboarding into the tab navigator.

**Validation and acceptance:** Test all four tab destinations and back behavior; inspect portrait small/standard/large screens; confirm each active tab label, icon bounds, touch targets, safe areas, and content scroll clearance. Ensure exported assets are bundled locally and load offline. Confirm disabled/unsupported feature entry points are still truthful rather than clickable dead controls.

**Edge cases:** Asset accidentally includes surrounding Figma annotations; clipped vector stroke; raster image larger than intended bounds; missing font/image; inactive tab accessibility name; deep link to a tab before auth bootstrap; large text causing active label overflow. Auth guard behavior itself remains Anisha's change.

**Commit done when:** Main navigation uses authentic assets and works with both placeholder and future data-driven screens. **Recovery:** revert the asset/navigation commit; retain canonical route paths so other work is not broken.

**Implementation evidence (2026-10-29):** [RN-02 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-02--authentic-assets-and-floating-main-navigation), [navigation contract](../../apps/mobile/src/components/navigation/README.md) and [asset provenance](../../apps/mobile/assets/README.md) record original SVGs, measured/reflowing geometry, real Router/history/keyboard behavior and exact automated/browser/native-bundle checks. Native exports are not signed-device rendering or Auth acceptance. Dino assets remain unscored inventory; real Home composition belongs to RN-09.

### RN-03 — HTTP client hardening for the first protected request

**Owner:** Ishmum.\
**Dependencies:** SC-02/03 canonical error/identity/lifecycle contracts and current client. Backend implementation is not required for deterministic tests. Consume API-05 generated DTOs at live integration; do not import a not-yet-generated file or duplicate its generator to start this part.\
**Requirements:** NFR-005/006/009/010.

**Proposed files:** `src/infrastructure/api/client.ts`, `client.test.ts`, `errors.ts`, `config.ts`; generated API types through the Plan 00 command; `.env.example` only if the agreed configuration changes.

**Implementation steps:**

1. Keep fresh-token injection and same-origin URL checks. Validate configuration once at the integration boundary: missing API URL is an explicit configuration/unavailable state, not a request to an undefined host or a fallback to a production service.
2. Support caller `AbortSignal` plus a bounded whole-operation timeout. Proposed initial budget: 15 seconds covering token acquisition, any permitted recovery, dispatch, and response-body reading/parsing, not just fetch-to-headers. Make it testable, not a service SLA. A timed-out token promise may settle later but must never dispatch a request; similarly stop consuming a timed-out body. Combine abort sources and remove listeners/timers in `finally` on every exit. Auth remains responsible for its own SDK operation after a caller stops waiting.
3. Keep explicit public vs authenticated requests. No silent anonymous fallback when `getAccessToken()` returns null. Use authorization headers only for the configured API origin; prevent external absolute paths and protocol-relative URL bypass.
4. Parse the agreed API error envelope into safe typed categories: no session, unauthorized, forbidden, validation, conflict, rate limited, unavailable, timeout, network failure, cancelled, and invalid response. Preserve status/error code/request ID where safe; never expose raw HTML, stack traces, JWTs, or passwords in UI/logs.
5. Handle `204` without JSON parsing. Reject malformed JSON or incompatible required response fields as a protocol failure; do not transform failure into an empty successful profile.
6. Accept explicit JSON encoding helpers if used by profile PATCH. Do not create automatic retries for arbitrary requests. A failed write may have committed; mutations need an endpoint-specific reconciliation strategy.
7. Apply the bounded `401` policy agreed with auth owner: HTTP/query code can invoke the single-flight `revalidateSession()`, but only auth controls refresh/session invalidation. Re-read the snapshot and replay at most one idempotent GET only if the account and generation are unchanged; never automatically replay profile PATCH. A failed revalidation due to temporary network/storage/configuration failure is not fabricated sign-out.
8. Capture account/generation before acquiring the token and recheck before sending and delivering the result. An account change while `getAccessToken()` is pending must cancel that request rather than send A's request with B's token.
9. After recovery and its single GET replay still receive 401, pause protected automatic requests for that account/session generation. Neither focus/reconnect nor a routine token-refresh event clears the pause. Resume only through an explicit user recovery attempt or an actual Auth-session replacement; do not falsely sign out a valid SDK identity because the API's issuer/environment is wrong. Keep this gate local to the request/query scope, not a second auth store.

**Validation and acceptance:** Extend the existing tests with deterministic fetch/token providers and fake timers. Cover missing/invalid configuration, no token, refresh-provided token, protected/public headers, path/origin escape, pre-aborted signal, caller abort, hanging-token and hanging-body deadlines, token-provider rejection, account change during token lookup/response, `204`, malformed success JSON, error envelope, `401/403/409/422/429/503`, and listener cleanup. A late token result after timeout cannot call fetch. Sustained 401 pauses focus/reconnect/repeated-refresh retries until explicit recovery. Cancellation does not show an error toast or retry. Avoid a large generic mock server until multiple endpoints require it.

**Edge cases:** Fetch resolves after cancellation; `AbortSignal` support differs on pinned native/web runtimes; an app resumes after sleeping past the timeout; response loses network after headers; SDK/session refresh is pending; a `Retry-After` value is invalid. Treat connectivity signals as hints; a connected network does not prove API reachability.

**Commit done when:** Pure TS tests establish the HTTP boundary without a live Supabase project, and existing same-origin/fresh-token protections still pass. **Recovery:** revert client helpers and their consumers together; do not weaken auth/path validation to get a feature through.

**Implementation evidence (2026-10-29):** [RN-03 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-03--bounded-account-scoped-http-client) and [client contract](../../apps/mobile/src/infrastructure/api/README.md) document validated configuration, runtime decoding, whole-operation deadlines/cancellation, account/generation guards, safe typed errors and bounded GET recovery/pause. Pure/local HTTP tests and direct iOS/Android client compilation passed. Live Auth/private API/query wiring and signed-device HTTP acceptance remain future gates.

### RN-04 — Account-scoped server state and lifecycle

**Owner:** Ishmum; auth owner authors the coordinated root-provider wiring.\
**Dependencies:** RN-03 and SC-03 for portable lifecycle tests; RN-01 for component/provider tests; AUTH-02's real provider output for coordinated root integration. Neither AUTH-07 nor M1 acceptance is required to build this producer.\
**Requirements:** NFR-005/006/009/010.

**Proposed files:** `src/infrastructure/query/query-client.ts`, `account-data-provider.tsx`, `lifecycle.ts`, account-boundary tests, `src/app/_layout.tsx` in a coordinated PR; package and root lockfile for `@tanstack/react-query` and, when native focus/network integration is implemented, Expo-compatible `expo-network`.

**Implementation steps:**

1. Create one query scope for a settled signed-in account and replace it on an actual account/auth-session ownership transition using canonical `sessionGeneration`. Normal token refresh does not create a new query scope. Use keys such as `['account', userId, 'identity']` and `['account', userId, 'profile']`; include revision/filter parameters only when the query needs them. Do not use raw tokens or email in keys.
2. Disable new protected queries during `bootstrapping`, `signed_out`, `signing_out`, and top-level `unavailable`, or while the signed-in credential state cannot supply a usable token. Preserve same-user cached data with honest stale/unavailable messaging where appropriate. Start the identity query once the auth owner reports a usable session; avoid duplicate component-level fetch effects.
3. Use the cleanup invariant in §5.3. Forward query `signal` into RN-03. Mutations need the same account-generation guard because clearing a cache does not necessarily cancel a server-side write.
4. Start with memory-only server caching. Do not add persisted query caches, cross-account hydration, or offline automatic mutation replay in M1/M2.
5. Choose bounded retry for transient read failures only. Proposed initial behavior: at most one additional read attempt for network/timeout/`503`, no query-layer retries for `401/403/409/422`, and respect bounded server `Retry-After` for `429` rather than a retry loop. Avoid stacked retries in HTTP + Query + screen layers.
6. Keep the last same-user successful data visible during a background refresh with a subtle stale/failure notice; first-load failure gets a retry state. Do not use keep-previous/placeholder data across accounts.
7. Register query-focus/network subscriptions once at the integration boundary with cleanup. They are separate from the auth owner's sole refresh subscription and must not refresh Auth themselves; a small shared platform event adapter is optional if actually useful. Expo Network is preferred because Expo is already the toolchain; do not also add NetInfo for the same job. Preserve browser behavior and verify unknown reachability does not permanently pause queries. Focus/reconnect must respect the sustained-401 pause from RN-03. [TanStack React Native integration](https://tanstack.com/query/latest/docs/framework/react/react-native)

**Validation and acceptance:** Use two accounts and a delayed fake response. Assert A's data never appears after B signs in; no A draft/toast/success callback is delivered to B; cancellations reach fetch; sign-out failure still clears the departing UI; restored same-account auth can refetch; listeners are not doubled on remount/fast refresh; `503` does not log out. Test transient retry count with fake time rather than long sleeps.

**Edge cases:** Fast sign-out/sign-in to the same user; a token refresh event that should not reset valid same-user data; account switching during a mutation; background app restoration; React strict/development repeated effects; multiple consumers observing the same query; offline paused retry resumed after logout.

**Commit done when:** The query layer can be integrated with a real or deterministic test auth service through one public interface, with no session-store duplication. **Recovery:** disable the dependent live screen and revert query provider wiring with the auth owner; do not restore a public protected-screen bypass.

**Implementation evidence (2026-10-29):** The independently consumable [query boundary](../../apps/mobile/src/infrastructure/query/README.md) implements memory-only per-owner caches, cancellation, guarded callbacks, bounded read retries, and native/browser lifecycle adapters. [RN-04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-04--account-scoped-server-state-and-lifecycle) record deterministic tests and direct compilation. Real AUTH-02 provider/root wiring is deliberately pending with Anisha; no live identity, guards, persisted cache or native ownership policy is implied. Retention uses scope lifetime rather than five-minute per-entry timers, with explicit teardown; future large feeds need bounded cardinality.

### RN-05 — Real identity and account surface

**Owner:** Ishmum; Anisha validates the real auth handoff.\
**Dependencies:** RN-01/04; SB-03; AUTH-01/02/03/07 session/sign-in/guard outputs; API-04/05 endpoint/generated types. Signup/email recovery completion AUTH-04–06 and downstream acceptance AUTH-08/SB-06/API-10/RN-06 are not prerequisites for this first controlled sign-in round trip.\
**Requirements:** FR-002/009/034; NFR-005/006.\
**Figma:** Settings `27:157`; auth references `18:2`, `27:59` owned by Anisha.

**Proposed files:** `src/features/account/api.ts`, `identity-query.ts`, `account-header.tsx`, tests, `src/app/(tabs)/settings.tsx`; an internal development connection diagnostic if needed, excluded from ordinary account UI.

**Implementation steps:**

1. Call `/v1/me` through RN-03/04; use the generated identity response. Render the real account's email or a neutral label when null. Do not derive a display name from an email address or reuse Jordan Rivera from Figma.
2. Verify returned `user_id` matches the settled auth subject. A mismatch is a protocol/security integration failure: suppress response, clear that query result, and provide safe recovery; never show the mismatched user's data.
3. Make identity request state local to the account region; a temporary backend problem should not make the entire installed native protection system stop or remove all navigation.
4. Remove the Settings placeholder's public "View sign-in/onboarding screen" links from normal production routes when real guard behavior lands. Developer navigation, if retained, must be isolated from release entry paths and contain no real credentials/data.
5. Integrate the auth owner's sign-out action without implementing Supabase sign-out in the Settings component. Its account-action placement is a proposed addition to the Figma Settings frame and needs design/PM review. Disable duplicate sign-out taps and use the lifecycle cleanup already tested in RN-04; native restriction release/transfer is not implied.
6. Keep `/healthz` separate: a healthy process is not proof the user/session/profile/database/native setup works. Do not display a "Protected" indicator after identity success.

**Validation and acceptance:** Use a real disposable development user on the configured development Supabase project. Record successful signup/sign-in, `/v1/me` status, matching subject, and account display; redact tokens/passwords from evidence. Verify missing token, invalid token, wrong API project, null email, offline, server unavailable, and sign-out during request. Evidence must identify whether it is web or native; web M1 alone does not satisfy physical-device auth/link handling.

**Edge cases:** Email changed after token issue; user has no email; no profile row exists; authenticated SDK session while backend rejects issuer/audience; development API pointed at another Supabase environment; stale account header on tab focus.

**Commit done when:** A real session reaches the protected backend and the account UI shows only that identity. **Recovery:** keep the error/unavailable account surface and disable the live account feature; never substitute a mock user or relax backend authentication.

**Preparation checkpoint (2026-10-29):** [Account consumer](../../apps/mobile/src/features/account/README.md) and [detailed notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-05-preparation--identity-consumer-and-account-region) provide a tested identity query, same-subject validation/cache suppression, original Settings avatar/neutral account header, local failure/recovery states and delegated optional sign-out. This is **not RN-05 completion**: real AUTH/SB outputs, protected API-04, generated API-05 types, coordinated root/Settings wiring, design review of sign-out placement and actual disposable-user acceptance remain pending. RN-09d removes the current route’s developer Auth/onboarding links while guard wiring remains pending. No fake Auth or wire DTO generator was added.

### RN-06 — First milestone acceptance and session recovery integration

**Owner:** Ishmum and Anisha jointly execute; one named author records the commit.\
**Dependencies:** RN-05, AUTH-01/02/03/07, and API-04/05 invalid-token/outage behavior. AUTH-04–06 carry their own broader email-flow acceptance; AUTH-08 and SB-06 consume the joint evidence and are not prerequisites.\
**Requirements:** FR-002/008; NFR-005/006/008/010.\
**Proposed files:** Targeted integration tests in `src/features/account/` or `src/test/integration/`, development-only test harness configuration, `docs/qa/identity-milestone.md` when implemented, and the auth-owner root routing change if not already merged.

**Implementation steps:**

1. Exercise cold launch, restored session, signed-out launch, deep link to Settings, bootstrap delay, invalid/expired session, local sign-out, and account change.
2. Confirm root routes cannot expose authenticated content before bootstrap. For the development identity milestone, use the explicitly chosen auth policy; do not accidentally define launch-wide required-login behavior while PD-09/Q17 remains open.
3. Complete the agreed bounded `401` recovery handshake: one auth recovery, no duplicate refresh races, no blind write replay, and no logout for server/network failure.
4. Remove release-accessible fixture selectors, preview redirects, hardcoded session flags, and bypasses. A developer harness can still instantiate screens with synthetic data outside the release tree.
5. Add a concise reproducible acceptance record: environment identifiers safe to share, build/SDK, tested cases, pass/fail, known limitations, actual commit hashes. Never store access tokens, refresh tokens, passwords, or personal data in that record.

**Validation and acceptance:** Run the M1 matrix in §9. Verify real end-to-end behavior in web and in an approved native development build when the native build/audit prerequisites are available. Missing native build prerequisites are recorded as unverified, not waived. CI unit/UI tests, type/lint checks, and JS exports pass; live Supabase tests remain a separately controlled development workflow with disposable users.

**Commit done when:** Ishmum and Anisha can reproduce M1 from a fresh checkout using documented public/server environment variables, and no account leak or auth bypass remains. **Recovery:** revert feature wiring without reverting account isolation; leave a truthful unavailable screen while fixing provider/API compatibility.

### RN-07 — Minimal profile read/update integration

**Explicit scope split (2026-10-29, requested by Ishmum):** Build the reusable buttons/editor UI now, with the Figma example only in an isolated developer preview. This is **UI preparation, not RN-07 completion**. The live dependencies and original exit criteria below still apply to the later integration work. [Consumer contract](../../apps/mobile/src/features/account/PROFILE_UI.md) and [implementation record](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-07-ui-preparation--controlled-display-name-editor) explain what exists and how to resume.

| Slice | Status | What it means |
|---|---|---|
| Profile editing presentation | Prepared and tested independently | Controlled display-name field, Save/Discard, confirmed clear intent, pending/error/validation/conflict/unconfirmed UI; optional supplied profile name in existing header. |
| Sample content | Developer preview only | One Jordan Rivera Figma example, local-only interactions and simulated statuses; never a production fallback or real account. |
| Live RN-07 consumer | Implemented against the existing account provider; application acceptance pending | Real GET/PATCH, revisioned drafts, validation, explicit conflict/uncertain-save review and conditional Settings mount. Real Auth/root, authenticated phone/restart and lifecycle acceptance remain open. |

**Original UI deferrals — current integration status and remaining acceptance:**

| Ref | Deferred work | Required producer / future evidence |
|---|---|---|
| RN07-D01 | Generated DTOs, scoped GET/PATCH and strict same-owner response decoding implemented; missing-row vs null-name covered by tests | API-05–09 exist. Actual application Auth/root and authenticated device round trip remain pending. |
| RN07-D02 | Canonical profile/revision separate from raw draft; revision-zero creation, CAS update and canonical success implemented | Pessimistic saves, duplicate suppression and no optimistic saved badge. Full application reload/restart evidence pending. |
| RN07-D03 | Raw text/explicit null passed unchanged; approved server validation mapped to fixed field errors | Runtime decoders and API Unicode tests pass; authoritative normalization stays server-owned. |
| RN07-D04 | Conflict → latest GET → explicit Keep my edits / Use latest profile implemented; background reads preserve dirty base | Component tests verify no automatic write/rebase. Real phone conflict journey pending current credentials. |
| RN07-D05 | Uncertain-save state blocks writes; latest GET and explicit resolution required; no offline queue/replay | Includes failed reconciliation and explicit discard handling. Native real lost-response test remains pending. |
| RN07-D06 | Existing scope cancellation/generation-keyed lifetime and dirty removal guard used; Settings mounts only under a real account provider | Anisha still owns Auth/root/actions composition. Developer credential harness is isolated and is not the Auth SDK. |
| RN07-D07 | Durable storage remains deliberately deferred; isolated live device harness/runbook prepared; local two-account/generation races pass | User deferred authenticated phone testing after A/B tokens expired, and deferred hosted deletion using a separate C account. iOS/signed-build/assistive and actual app M2 acceptance remain open. |

**Owner:** Ishmum; Anisha reviews shared onboarding/draft behavior.\
**Dependencies:** RN-04/05 and API-06–09; approved Plan 00 minimal profile contract. No demographic/onboarding field is enabled by this part; those require their own later decisions/contracts.\
**Requirements:** FR-008/009/034; NFR-005/006/007.\
**Figma:** `27:157`; any demographic/activity editor only after its field/scope decision.

**Proposed files:** `src/features/account/profile-api.ts`, `profile-query.ts`, `profile-form.tsx`, profile tests; exact Settings/detail routes needed for the minimal display-name profile. Reuse the approved M2 schema; later onboarding/plan editors require their own agreed shared contract.

**Implementation steps:**

1. Render `GET /v1/profile` according to its agreed missing-row behavior. Do not infer onboarding completion merely because `/v1/me` succeeded or a profile exists.
2. Bind only approved mutable fields. Never allow the mobile payload to set `user_id`, email identity, reward balance, native install confirmation, arbitrary onboarding-complete timestamps, or entitlement flags.
3. Keep server snapshot/revision separate from draft input. Use the server's successful mutation response as the new canonical snapshot; do not show a saved badge before confirmation.
4. Send the agreed expected revision. On conflict, preserve the draft for review, fetch latest data, and require a deliberate resolution; do not auto-resubmit with a new revision or silently overwrite another device's work.
5. Make profile save pessimistic initially: no optimistic completion that could drive navigation or native policy before the server accepts it. Disable duplicate taps while the request is unresolved.
6. On timeout/disconnect after sending a save, label the result unconfirmed and reconcile with `GET /v1/profile`; a retry must follow the API's idempotency/revision semantics, not a generic auto-retry.
7. Offline editing may retain a same-account local draft only when the shared auth/onboarding storage contract includes it. Saving is explicitly pending/unavailable; M2 does not add automatic background mutation replay.
8. Account/session generation guards still apply to form load, save, conflict resolution, success messages, and navigation. An A save that completes after B signs in must not update B's query/cache or send B through onboarding.
9. Keep the raw name draft separate from the normalized server value. A user-confirmed clear action sends null; whitespace-only strings receive the server's validation error rather than becoming an implicit clear. Use the Plan 00 normalization fixtures; client advisory counters are not authoritative limits.

**Validation and acceptance:** Test a missing profile, load failure, server-side validation, unchanged field omission vs explicit null per contract, revision success/conflict, duplicate tap, ambiguous save/reload, draft discard, leave-screen behavior, background refetch while dirty, and account change during save. Check approved Unicode/length limits at both client and server; client validation improves UX but does not replace server checks.

**Edge cases:** Profile deleted elsewhere; row created by another device between read/save; email/account identity changed independently; long name; demographic field removed by a later PM decision; unknown onboarding schema version; old app version receives a new profile field.

**Commit done when:** A real permitted profile edit persists through API reload and restart, rejects stale/wrong-user writes, and does not activate protection. **Recovery:** disable editing while retaining safe reads; use a forward-compatible UI fallback instead of destructive profile/schema rollback.

### RN-08 — Capability-aware native protection presentation

**Independent preparation checkpoint (2026-10-29):** [Protection presentation](../../apps/mobile/src/features/protection/README.md) now supplies an evidence-based mapper, accessible status/action card, bounded read-only consumer and isolated state preview. No native adapter or live route is registered. [RN-08 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-08-preparation--evidence-based-protection-presentation) record exact source/tests/browser/native compilation evidence. This completes the independent presentation slice, not native/device integration. Existing Auth/profile gates remain separate.

| Ref | Native work intentionally deferred | Owner / required evidence |
|---|---|---|
| RN08-D01 | Audit and implement real Swift/Kotlin adapters and register the shared native port with truthful per-device capabilities | Anisha iOS; Ishmum Android. Source/entitlement/signing audit and Android feasibility are not established by UI or mock-service tests. |
| RN08-D02 | Wire actual AppState + route focus/native changes into the required visibility input, refresh after real actions, and supply the authoritative device-native desired revision | Coordinated main/native host integration. The hook accepts these inputs but does not register lifecycle listeners or infer revision from a backend/profile save. |
| RN08-D03 | Supply actual permission/recovery/selection/setup handlers and complete async busy/error flows | Native owners' supported platform flows. Presentation callbacks/preview notices do not prompt or grant permission, and a read refresh cannot reinitialize an absent adapter. |
| RN08-D04 | Confirm real installation/revision reconciliation and approved overlapping restriction behavior | Real native coordinator and approved policy. Old installed state stays distinct from a new desired plan; UI/API success is not installation evidence. |
| RN08-D05 | Decide and implement account/sign-out ownership, event attribution and any restriction transfer/cleanup | PM/native migration protocol. This module does not clear, reassign or drain native rules/events on Auth changes or unmount. |
| RN08-D06 | Execute signed-device revocation/install-failure/foreground/offline/host-termination and accessibility checks | Platform owners' reproducible device evidence. Browser typography/layout and JS compilation do not establish OS protection or Android/iOS parity. |

**Owner:** Ishmum for presentation; native owners supply/validate their adapters.\
**Dependencies:** Native read contract reviewed in Plan 00; source audit/feasibility and native implementation for live integration. Pure status mappers/specimens can proceed earlier.\
**Requirements:** FR-006/010/018/021; NFR-001/002/003/004/011.\
**Figma:** Home `22:4`, permission `50:85`, Settings `27:157`.

**Proposed files:** `src/features/protection/status-model.ts`, `protection-status.tsx`, `use-protection-status.ts`, mapper/component tests; adapter registration stays in native-owner implementation.

**Implementation steps:**

1. Treat adapter presence, platform capability, permission, desired config revision, installed native revision, and last read error as separate inputs.
2. Display active protection only after the native service confirms the expected installed revision/state and authorization. An API config acknowledgment or device report stored on the backend is not fresh proof of the current local device.
3. Map adapter absent/unsupported/permission needed/inactive/installing/degraded/read error explicitly. Do not label all absent adapters "Android unsupported" or all backend outages "unprotected".
4. Refresh native status on relevant foreground/focus changes and after actual native setup/edit actions. Avoid polling a fake JS usage timer or relying on a network round trip to keep restrictions operating.
5. Make permission/retry actions route to native owner's supported flow. If a capability is unavailable, explain the user-visible limit without exposing framework jargon.
6. Preserve planned vs installed distinction during future config edits: keep the old confirmed revision visible as such while a new install is pending; never assume a successful plan save means the new restriction is active.
7. Do not perform automatic native clear/transfer on sign-out until PM/native ownership behavior is defined. Do not attribute buffered native events to a new login merely because the UI account changed.

**Validation and acceptance:** Table-driven pure mapping checks cover each state/revision mismatch, authorization revocation, adapter absence, and native error. Native-owner integration checks cover foreground return, permission change, installation success/failure, and host app termination independently of JS. Where an adapter is not implemented, retain an explicit unavailable state and record device checks as unverified.

**Commit done when:** UI claims match supplied native evidence and degrade honestly. A pure presentation commit can be complete while native integration remains separately blocked; distinguish those statuses in evidence. **Recovery:** revert presentation/actions while leaving native installed policy intact; never clear restrictions as a UI rollback shortcut.

#### RN-08 execution expansion — Android and shared integration (2026-11-02)

**Status: RN-08a–d Android probe/adapter/status integration and bounded physical acceptance implemented.** Keep RN-08 and RN08-D01–D06. The existing
presentation commit is retained. These four commits cover Ishmum's independent
Android/read-permission work; they do not finish native enforcement or iOS.
Anisha continues to own Auth/onboarding, the root Auth guard and Swift integration.

| Part / suggested commit | Work and dependencies | Done when / focused verification |
|---|---|---|
| **RN-08a** — `chore(android): add a bounded capability probe` **Implemented; initial device baseline observed** | Inventory the current Expo/native setup, Android SDK/JDK/build access and actual device availability. Use the current mobile project and one local module for the smallest Android-only probe of usage-access state and bounded usage-event reads; retain that probe for b rather than creating another standalone app. Record observed API/device versions, missing/denied/revoked access, locked-device/empty-window behavior and package visibility. Keep identifiers/events local; record sanitized observations. No Supabase/Auth dependency. | Reproducible probe/build instructions and evidence distinguish available, denied, unsupported and untested behavior. No blocking/parity claim. Missing physical access is recorded, not replaced with mock success. Choose the implementation path for RN-08b from the evidence. |
| **RN-08b** — `feat(android): expose measured capabilities and usage access` **Implemented; read-only device evidence** | After RN-08a, extend that same small local Expo/Kotlin module and add its JS adapter using the installed toolchain. Expose truthful capabilities, authorization reads, an explicit usage-access settings action and fresh status. Reuse `ProtectionService`; operations outside this slice reject explicitly as unavailable. Keep usage access separate from permission to enforce restrictions. Package selection remains unavailable until the investigation establishes an appropriate visibility/selection approach. | Native build and JS contract checks pass; absent module, repeated permission taps, denied/revoked access, unavailable settings activity and malformed native values fail safely. A permission grant never fabricates an installed rule/revision or active protection. No write/timer/override/event-drain success stubs. |
| **RN-08c** — `feat(protection-ui): connect Android status and foreground refresh` **Implemented; d device matrix passed** | After RN-08b, register the Android adapter and reuse the RN-08 mapper/read hook. Supply actual route visibility and AppState foreground inputs; refresh after an explicit permission action. Reuse operation-long busy/error controls. Preserve iOS/web fallback and Anisha's root ownership. | Focus/foreground/return-from-settings reads update the existing UI; listeners are cleaned up, stale reads cannot update an unmounted owner, and retry cannot silently request permission. No installed desired revision is inferred from backend draft saves. |
| **RN-08d** — `test(android): verify permission and status lifecycle` **Implemented within read/permission scope; Pixel debug-device matrix passed** | After RN-08c, run the development-build device matrix: grant, deny, revoke externally, background/foreground, cold start, disconnected API, absent native module and unsupported device/build. Check permission/status accessibility and responsive layout. Test notification/overlay/service behavior only if separately implemented and approved. | Record exact build/device, actions and results; distinguish Kotlin/module execution from Expo Go or JS-only tests. No native rules are installed by this slice. Remaining enforcement/iOS/assistive gaps stay open. |

**Implementation footprint:** `apps/mobile/modules/` for one Android local module,
the Android host/config needed to load it, `src/infrastructure/native/` for the
adapter, and existing `src/features/protection/` consumers/tests. Choose exact
paths in RN-08a after inspecting the current toolchain. Use an Android development
build for new native code; Expo Go alone cannot prove that module runs. Do not run
an unrestricted `prebuild --clean` over the imported iOS tree. Any required native
generation is Android-only, reviewed in Git, with original iOS files intact.
See the official [local module guide](https://docs.expo.dev/modules/get-started/)
and [development build guide](https://docs.expo.dev/develop/development-builds/introduction/).

**Narrow Android investigation:** Start with the documented
[UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager)
API and [package visibility rules](https://developer.android.com/training/package-visibility).
Check current platform/store requirements before choosing an intervention. Do not
add AccessibilityService, overlay permissions, a foreground service or broad
package access merely to populate a UI capability. Accessibility use requires its
own [Play policy assessment](https://support.google.com/googleplay/android-developer/answer/10964491).
These sources were checked on 2026-11-02; they do not prove feasibility on our
actual build or authorize user-visible enforcement behavior.

**Original deferral mapping:** RN08-D01 is addressed for Android by a/b; iOS stays
with Anisha. D02 maps to c/d; the installed desired revision still needs actual
policy installation. D03 maps to b/c for observed permission/recovery flows only;
app selection/setup/install actions remain gated where unsupported. D04 (rule
installation/overlap), D05 (native account ownership/transfer) and the corresponding
D06 signed-device enforcement tests remain open. This extension adds no session
engine, persistent background monitor, native outbox, Android hard-block promise
or automatic cleanup at sign-out. Reverting the shared UI never clears rules.

### RN-09 — Main screen composition within approved data boundaries

**Owner:** Ishmum.\
**Dependencies:** RN-01/02; RN-07/08 only for live profile/status; feature-specific contracts and decisions before live controls are enabled.\
**Requirements:** FR-022–034; NFR-005/008/011.\
**Figma:** Home, Quests, History, Settings, and their detail frames in §4.

**Proposed files:** `src/features/home/`, `quests/`, `history/`, `settings/` presentational components and view models; thin route files in `(tabs)`; selected detail routes outside tabs where appropriate; isolated `.fixtures.ts`/test data under development/test-only imports.

**Implementation steps:**

1. Compose the observed warm layout, cards, nav spacing, profile header, and section hierarchy from reusable recipes. Avoid hardcoding whole 393×852 canvases; use source-specific insets and responsive content flow.
2. Separate each view's display model from its data source. Story/specimen fixtures can demonstrate the Figma happy path, but production selectors receive actual API/native data or explicit unavailable/empty states. Never fall back to the Figma sample if a request fails.
3. Home: preserve Dino/card positions and source assets; keep health, credits, Feed, saved hours, streak, and recommendations gated until approved policies/data exist. An unknown score does not select "happy at 85%" by default. Use a neutral illustration/presentation agreed with design if displaying an unscored Dino.
4. Quests: keep suggestions distinct from accepted/saved occurrences. Build card/editor presentation only against the agreed contract; do not persist a quest, lock apps, or award credits from an unapproved accept action. Lifecycle, per-quest apps, recurrence, cancellation, completion, and overlapping restrictions need the relevant PM/native/backend work.
5. History: production cards require metric value, period, source/coverage, and comparison eligibility from the future insights contract. Missing data is unavailable, not zero. Do not display 51 turn-offs, 10 hours, 80%, or 1.8 years as account outcomes. Keep the forecast absent unless PD-12 is resolved.
6. Settings: reuse the profile form from RN-07. Activities and app selection only become editable when their persistence/native contracts exist. App names/most-used lists must come from permitted real sources; iOS opaque tokens do not become a server catalog. Preserve the native-authorized selection UI adaptation rather than promising an arbitrary iOS app list.
7. Plan editors must share the approved onboarding plan schema and installation reconciliation. There is no separate Settings session policy. Calendar entries are hidden/unavailable until launch scope/provider permissions are decided; a decorative "Connect" button must not pretend to connect.
8. Keep implementation diagnostics in an explicit developer surface, not everyday Home/History messaging. User-facing empty states should explain what the user can do, while development-only screens may state that integrations are unfinished.

**Validation and acceptance:** Source-aligned visual comparisons at the baseline width, actual component behavior checks, overflow/accessibility checks, and explicit tests that failed/missing data never selects a demo fixture. Every activated control has a real handler and defined persistence/failure behavior; otherwise it is omitted or explicitly unavailable. Record which parts are presentation-only, backed by real server data, backed by native evidence, or gated.

**Commit done when:** The selected bounded main-screen presentation increment is visually faithful and its displayed data is honest. Do not mark all FR-022–034 complete from this commit. Split per screen if the composition diff is too large. **Recovery:** hide/revert the affected feature presentation; preserve existing account/protection behavior and persisted user data.

### RN-09 implementation checkpoint — bounded screen increments

RN-09a supplies the independent Home presentation slice; this is not acceptance
of all FR-022–034 or of live scoring/rewards/quest/native/insights behavior. The
original 44-part count remains a count of top-level plan parts; these are RN-09
subparts, not a redefinition of earlier work or its dependencies.

| Subpart | Scope / commit boundary | Actual status |
|---|---|---|
| RN-09a | Home composition, source assets, local display model, explicit feature states, isolated Figma specimen and tests | Implemented under `feat(mobile): compose Home with explicit feature availability`; self-hash recorded in the next normal notes update. The real Home route receives unavailable inputs; no live producer/action is connected. |
| RN-09b | Quests presentation; suggestions distinct from accepted/saved occurrences; editors only against the agreed schema | Presentation implemented; real quest actions/editor/schema/persistence remain deferred under RN09B-D01–D04. |
| RN-09c | History presentation with honest unavailable states and isolated source examples | Summary plus RN-09h details/navigation UI implemented; real metrics/account integration/device acceptance remain deferred under RN09C-D01/D02/D04; PD-12 forecast remains excluded. |
| RN-09d | Settings composition reusing RN-07 profile and genuine availability for plan/app/activity editors | Presentation implemented; RN09D-D01–D04 and RN07-D01–D07/native-selection/shared-schema gates remain before live persistence/actions. |

### RN-09 remaining UI execution — Ishmum, 2026-10-30

User requested completion of independent UI before live integration. These are
subparts of RN-09, not new top-level plans. Local drafts and preview intents may
be implemented without approving persistence/enforcement schemas. No fake success,
account, app inventory or usage is supplied by actual routes.

| Part | Source / scope | Status |
|---|---|---|
| RN-09e | Quest personalize `10487:126` / custom `10577:427`, reusable draft fields, times/repeat/weekdays, validation, dirty exit, action states and routes | UI implemented; live quest persistence/recurrence/native policies remain deferred |
| RN-09f | Age `10601:5908`, activities `10601:6057`, apps `10601:5968`, inline gender `10601:6146`; search/selection/custom drafts, cancellation and save states | UI implemented; real preference persistence/native selection remain deferred |
| RN-09g | Inline days `10601:6315`, hours `10601:6513`, sessions `10601:6690`; shared controlled editors reusable by AUTH-12, explicit limits and unavailable saves | UI implemented; approved shared schema, real saves/install and device checks remain deferred |
| RN-09h | Progress `10570:192`, reduction/time reclaimed `10570:193`, period changes, honest evidence/eligibility states and navigation | UI implemented; live measurements and signed-device acceptance remain deferred |

Each part gets its own local commit and detailed file/line notes. Source assets
come unchanged from the original pack. Actual routes use absent data/disabled
persistence; isolated developer flows exercise source samples and local edits.
No calendar provider flow, lifespan forecast (PD-12), actual native picker,
completion/reward/enforcement policy, Auth/onboarding or backend is implemented by
these UI parts. Device acceptance remains separate. Evidence and any source
adaptations must be recorded before claiming this UI scope complete.

**RN-09a evidence:** Read-only Home `22:4` context/screenshot, original source asset
bounds/bytes, 19 new portable cases and 34 new iOS/Android component cases (including
shared Screen regression), 30 browser cases, real four-tab route/clearance, web export
isolation and full iOS/Android Router/Hermes exports. Exact results, captures and
per-file line ranges are in [the implementation record](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).
These establish presentation/compilation only, not account/measurement/native device acceptance.

**RN-09a adaptations:** Source 16 px insets and card/gutter/radius hierarchy;
responsive stacking based on actual content width and native font scale, with
full-width compact headings/actions. Feed/History targets are at least 44 px;
health fill follows the explicitly supplied percentage instead of the source's
fixed 85 px fill. Ready measurements display range/source/coverage. Unknown health
renders no mood/score; unavailable data never becomes zero or the Figma sample.
OS status bars remain OS-owned; real navigation is reused rather than recreated.

The following Home integration work is deliberately deferred. Keep these IDs in
sync with the notes; none is completed by the developer specimen or static exports.

| Ref | Home work intentionally deferred | Owner / required evidence |
|---|---|---|
| RN09-D01 | Approve and implement Dino health/artwork, Feed pricing/transactions, credit ledger and streak producers | PM PD-06–08/Q12–14 and feature/backend owners; current display inputs do not define policy or prove an outcome. |
| RN09-D02 | Provide valid weekly saved-time measurements with range/source/coverage and any comparison eligibility | PM PD-11/12/Q15/16 plus permitted native measurement and insights contracts; no usage or savings are calculated here. |
| RN09-D03 | Define and wire temporary recommendation generation, Skip/Accept lifecycle, persistence/failure and any reward/restriction notices | PM/native/backend feature owners; no saved quest, installed restriction, completion or reward follows from a UI callback. |
| RN09-D04 | Connect actual native status and supported permission/setup/recovery actions into the Home protection region | Native owners and RN08-D01–D06; scores, profiles and API acknowledgments are never installation evidence. |
| RN09-D05 | Wire real account-scoped Home producers, freshness/errors, cancellation and guarded mutations | Auth/backend/RN owners using RN-04 scope/generation rules; no A-to-B data, stale action or uncertain write may be accepted. |
| RN09-D06 | Execute signed-device rendering, native SVG, font/screen-reader/focus and lifecycle acceptance | Platform owners with RN-10 evidence; browser reflow and Hermes compilation do not establish device behavior. |

RN-09a–h independent UI/local-interaction scope is implemented. The four main
surfaces and all eleven reviewed detail frames are covered in the
[screen-by-screen UI record](../qa/rn09-ui-coverage.md), including deliberate
accessibility/native-picker/forecast adaptations. Next work is real Auth/root/API/
profile prerequisites, approved feature/native contracts and signed-device QA.
These are live acceptance gates, not a claim that the completed detail UI is absent.
Plan 04 as a whole remains open. Original icon rewiring is completed by RN-10a;
Auth/onboarding and native-owned interventions remain
with their respective owners. RN-09e `3c9d20d`, f `d0206b4`, g `b319d75`; h resolves
by its unique commit subject in the notes.

RN-09b source: read-only Figma `27:155`, session `26dd22ea-c87c-4b6c-a571-5e74d6eff5e8`. Quests presentation is independent; no editor/persistence/native action is connected. Deferred: **RN09B-D01** approved quest/editor/recurrence API and persistence; **RN09B-D02** actual Auth/account-scoped data/actions and recovery; **RN09B-D03** approved completion/reward/native restriction evidence; **RN09B-D04** signed-device/accessibility acceptance. Source examples remain isolated. See the implementation notes for exact commit/checks and copied icon-pack provenance.

#### RN-09 execution expansion — preferences and non-enforcing drafts (2026-11-02)

**Status: RN-09i/j consumers and k saved-preference composition implemented; l local automated checks implemented; k native status and l live acceptance pending.** Preserve RN-09a–h and their original UI
history. Continue with i–l below; do not redo the completed screen/editor work.
Use the single settings resource planned in API-11/12. Profile remains the separate
RN-07 resource; app-selection tokens remain device-native. No new state library,
persisted query cache, generic settings framework or automatic write queue.

| Part / suggested commit | Work and dependencies | Done when / focused verification |
|---|---|---|
| **RN-09i** — `feat(settings): persist alternative activity preferences` **Consumer implemented; live acceptance pending** | After API-12, use its generated DTOs/runtime decoder and one account-scoped settings query. Map the existing ActivitiesEditor IDs/custom text to the agreed settings contract. Add read/save/discard, canonical revision handling, fixed server validation and deliberate conflict/uncertain-save review using RN-07 patterns. The API-11 contract records stable existing activity IDs; no Figma sample selection is a production default. | Missing settings is distinct from an outage. Explicit empty selection persists; raw drafts survive validation/conflict/background reads. Two editors share the same settings revision; neither blindly overwrites the other's section. Late A responses cannot populate B. The real route remains unavailable without the real provider. |
| **RN-09j** — `feat(settings): persist non-enforcing plan drafts` **Consumer implemented; live acceptance pending** | After RN-09i, wire existing days/hours/session editors to the same settings query/resource, including its draft timezone field. Reuse the same request/review machinery rather than a second profile-style framework. Omitted sections preserve data; explicit null clears a section. Preserve partially filled nullable draft fields. | Save/reload restores the accepted draft, with validation, revision conflicts and failed/uncertain saves covered. UI explicitly says **Saved draft — not active**; it does not claim a plan is installed, onboarding is complete or protection is enabled. Schedule/session labels must describe draft values without assuming counting/reset/overlap rules. No `applyRules`, native revision change or background installation occurs. |
| **RN-09k** — `feat(home): consume saved preferences and device availability` **Preferences implemented; Android read-only status supplied by RN-08c/d; joint Auth/settings acceptance open** | After i/j, compose accepted preferences/draft summaries into existing Home/Settings models. After RN-08c, include real Android protection availability/status where applicable; before then retain the existing unavailable native state. Keep Home thin and derive state from those producers. | Home/Settings agree after save/refetch, and still render during API/native failures. Saved draft, authorization and installed protection remain distinct. No synthetic quest, usage, streak, Dino health, Feed result or saved-time value is introduced. Suggestions/actions whose product meaning is unresolved stay unavailable. |
| **RN-09l** — `test(mobile): verify settings persistence and isolation` **Local automated acceptance implemented; hosted/Auth/device gates open** | After i–k, test save/reload, two-user isolation, same-user generation change, concurrent activity/schedule edits, explicit clear, dirty navigation, lost response, API restart, offline edits and native absence/revocation where implemented. Reuse existing scoped test ports and QA entry; do not build another Auth system. | Deterministic/component/real-DB checks pass. Run actual HTTP and Android development-build checks when credentials/device exist; otherwise record those exact gates pending. Full application Auth/root, iOS, signed-device accessibility and RN-11 handoff remain joint acceptance, not inferred from an operator-token harness. |

**RN-09i implementation checkpoint (2026-11-02):** Reuse the existing activity
editor and original icons with a generated-type runtime settings decoder, shared
`['settings']` account query/revision and guarded section-only writes. The tab
summary and detail route activate only beneath the existing account provider.
Verified absence permits explicit empty save; outages cannot create defaults.
Keep raw custom text (including inactive input) through validation/background
reads. Definite conflict or uncertain save requires GET plus explicit keep/use
latest; neither review choice writes. Dirty base revisions stay fixed, pending
GETs are cancelled around accepted writes, and newer cached revisions win.
Protocol-invalid reads quarantine the old value without a reload loop.

Checks: `npm run check` (325 portable / 416 component / 590 API, types/lint/assets/
contracts), `npm run mobile:export` (38-file isolation / 71 original assets) and
Android isolated QA Hermes export pass. No physical-device/hosted/Auth acceptance
is inferred from these. Hosted settings migration 0002, real Auth/root wiring,
authenticated phone journeys and later RN-09j/l simultaneous editor acceptance
remain pending. Full RN-09 is open; current top-level counts remain 46/21/25.
See the latest RN-09i [implementation entry](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

**RN-09j implementation checkpoint (2026-11-02):** Days/hours/sessions now
reuse the same settings query and the extracted existing revision/review state
machine (`use-settings-editor.ts`), with common recovery/review feedback. The
activity consumer retains its previous behavior. Each plan view sends only the
`plan_draft` section, copying unrelated fields from its captured base. An explicit
Keep choice uses the reviewed base and retains this view's field group (days;
hours + timezone; or count + minutes), preserving other fields. No automatic dirty
rebase occurs. Explicit whole-draft clear sends null only on Save.

Unset/partial hours, unset timezone and nullable session values persist without
inferred defaults. Session UI ceilings are the accepted storage bounds, not a
daily allowance/reset rule. Existing editors gain an opt-in draft mode; live
Settings/detail labels say draft/not active and never install native rules.
Current source/UI previews keep their established complete-plan presentation.

Checks: full workspace passes (342 portable / 448 component / 590 API, types,
lint, contracts/assets), web export (38-file isolation / 71 assets) and isolated
Android QA Hermes compilation. Partial/null, raw timezone validation, clear,
concurrent activity/day/hour saves, CAS/review, committed lost response,
offline/navigation and account/generation cases pass. No hosted migration,
actual HTTP/phone settings journey, Auth/root or native acceptance occurred.
Next RN-09k can compose the accepted preferences/draft producers; native status
continues unavailable until RN-08c supplies it. RN-09l live acceptance and parent
RN-09/Plan 04 remain open; top-level counts stay 46/21/25. See the latest
[implementation entry](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

**RN-09k implementation checkpoint (2026-11-03):** Home and Settings now use
one account-scoped settings summary hook/projection. Home adds canonical activity
and nullable draft summaries inside its existing scroll owner; the actual route
activates it only beneath the existing account provider. Edit links open the
existing detail consumers. Accepted saves/clears/refetches agree with Settings;
raw dirty/pending/uncertain writes never optimistically populate summaries.
Background reads show an updating indicator; failed/invalid reads, offline and
unavailable credentials mask previous private values. Recovery/retry uses the
existing controller and read lifecycle with no new write or Auth mechanism.

At the RN-09k commit, RN-08c had no registered adapter, so the protection-unavailable card was
retained on connected and neutral Home. No native integration/status acceptance
is claimed. Dino, Feed/credits, streak, recommendations and usage remain unavailable;
saved drafts are separately labeled inactive. This is a bounded implementation of
k's saved-preference composition, with the planned native dependency still open.

Checks: full workspace passes (352 portable / 478 component / 590 API, types,
lint/contracts/assets); web export passes 38-file isolation and 71 original assets;
isolated Android QA Home compiles to Hermes. No hosted/real HTTP/phone/Auth/native
operation occurred. Continue RN-09l's independent checks or RN-08a; wire the rest
of k's native status only after RN-08c and its device evidence. Parent RN-09/
Plan 04 stays open, counts 46/21/25. See the latest implementation notes.

**RN-09l implementation checkpoint (2026-11-03):** The production portable
mobile client, settings decoder, scope/controller and activity/plan/summary
projections now run over actual loopback TCP against the existing FastAPI process
fixture, normal JWT verifier with ephemeral public JWKS, migrated PostgreSQL and
random disposable users. Seven scenarios cover read/save/partial data, safe nested
validation, concurrent section CAS/review, committed lost response, account/
generation fences, offline no-dispatch and explicit clears. After stopping the
first API process, a second PID and cold mobile client recover the exact data.
Independent SQL confirms revision/data persistence, B isolation, C absence and
unchanged profiles. No hosted credentials, Auth SDK or live user is used.

Actual Router tests now exercise the existing Home/detail routes and removal
guard with dirty keep/discard, local Back, accepted save and uncertain-save
navigation on both component presets. Existing editor tests remain the source of
multi-editor/raw-draft behavior. The HTTP process context manager is shared with
the API-12 restart test; the database CI job installs Node/mobile dependencies.
A new acceptance marker is forbidden from production exports.

Checks: 352 portable / 488 component / 590 API and 192 PostgreSQL checks pass,
including eight nested real mobile HTTP scenarios. Web export passes 38-file
isolation and 71 assets. The task-started local DB was stopped, volume retained.
See the [acceptance matrix](../qa/rn09-settings-acceptance.md) and latest notes.
Local automated l scope is implemented; hosted migration 0002, real Auth/root,
authenticated phone, native revocation/installation, signed builds/assistive speech,
iOS and user-deferred disposable-C hosted deletion remain separate. Parent counts
stay 46/21/25 and full RN-09/Plan 04 is open. Next independent implementation:
RN-08a, then b/c/d before finishing k's native status and remaining l native gates.

**Files:** Extend existing `features/preferences`, `plans`, `settings`, `home`, the
scoped API/query consumers and thin Settings/detail routes. Generated types belong
to API-12, not handwritten duplicate mobile DTOs. Keep the actual Auth/root and
onboarding route changes with Anisha. Share the new contract for her later review,
but do not wait for finished Auth screens to implement/test these consumers.
Mobile drafts stay volatile within their account scope; this adds server-side
draft persistence, not an offline/onboarding storage contract.

**Original deferral mapping:** RN09D-D01 still includes real RN-07/Auth acceptance.
RN09D-D02 has activity preference and non-enforcing plan-draft persistence
through i/j. Native
selection, installed plans and enforcement remain gated. RN09D-D03 demographics
and calendars are unchanged. RN09D-D04 device/accessibility checks gain l alongside
RN-10. Home's unavailable inputs gain only the real producers implemented in k.
Existing RN-09e quest editors and RN-09h History detail views remain UI-only until
the following decisions and producers exist; no quest/metrics database is added
by API-11/12.

| Still outside this implementation slice | Required input before activation |
|---|---|
| Active plans, session accounting/reset, override and overlapping restrictions | Q02–Q08 / PD-01–04; measured native mechanisms and installation contract |
| Quest scheduling/recurrence, completion/release and app scope | Q09–Q11, approved quest state/schema and backend/native producers |
| Credits, feeding, Dino health and streaks | Q12–Q14 / PD-05–08; versioned product rules and real evidence |
| History/saved-time/baselines/life-years | Q15–Q16 / PD-11/12; permitted measured sources and approved definitions; forecast stays excluded |
| Account-bound native rule/event transfer or cleanup | Q17 / PD-15 and coordinated native/Auth ownership |
| Demographics, calendars, AI personalization and multi-device enforcement | Q19–Q21 and relevant scope/provider/privacy decisions |

Completing i–l proves this bounded settings/draft integration. It does not mark
all of RN-09 or the product complete. Keep parent RN-09 pending for its remaining
live features, with these subparts individually recorded in the existing notes.

### RN-10 — Accessibility, responsive layout, and lifecycle completion

**Owner:** Ishmum; Anisha checks auth/onboarding regressions and iOS behavior.\
**Dependencies:** Implemented earlier parts and a testable native build for device assertions.\
**Requirements:** NFR-008/009/011; AC-12.

**Proposed files:** Targeted UI components/routes, lifecycle helpers, focused regression tests, and an implementation-time `docs/qa/mobile-accessibility.md` evidence record.

**Implementation steps:** Verify VoiceOver/TalkBack labels and focus; selected tab announcements; errors/async-save feedback; contrast of small text and green actions; large system font sizes; reduced motion; screen rotation handling as supported by configuration; keyboard dismissal and scroll; safe-area/footer overlap; low-memory/background restoration. Set UI timing from actual measurements; do not invent a promised latency SLA.

**Validation and acceptance:** Test actual interactive screens on supported small/standard/large phone sizes and at enlarged font scale, including a long display name/activity string and translated-length test strings. Automated component assertions cover regressions such as inaccessible icon buttons or lost error labels, while manual native accessibility evidence is recorded separately. Browser emulation and JS exports remain useful but do not certify native accessibility, deep links, keyboard, or physical-device protection.

**Commit done when:** Known failures affecting implemented flows are fixed or explicitly tracked with release gates; no unsupported claim that the entire design is accessible is made. **Recovery:** revert the local layout/animation change, retaining the accessible fallback and account cleanup invariant.

**RN-10 implementation checkpoint (2026-10-30):** Shared UI and lifecycle
hardening is implemented under `fix(mobile): improve accessible feedback layout
and lifecycle cleanup`. See [the QA record](../qa/mobile-accessibility.md) and
[per-file implementation notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md)
for exact evidence and limits. Fixes cover Home text contrast, status/confirmation
announcements, explicit confirmation focus/return, retained keyboard tab focus,
active-panel visibility without dropping drafts, web tab-to-panel DOM order,
intrinsic footer reflow and late lifecycle callback/cleanup suppression. All
original SVGs remain unedited. RN-10a now completes the user-authorized original-pack refresh; prior captures remain in Git history.

The following checks remain pending; these IDs match the QA record. RN-10 is not
full signed-release/live acceptance. RN-09b–h have browser/component and bounded
Android device evidence; full device/state coverage remains pending. RN-10d below
records the latest actual development-build scope without closing the parent part.

| Ref | Remaining acceptance | Owner / required evidence |
|---|---|---|
| RN10-D01 | Remaining VoiceOver/TalkBack traversal, announcements and focus | RN-10d verifies Android selected-tab/control/checkbox speech and modal focus/return. Full manual traversal/async speech, signed release, other devices and Anisha’s VoiceOver remain. |
| RN10-D02 | Remaining platform/device font scale, keyboard, safe areas, focus scrolling and SVG acceptance | RN-10c/d record Pixel 8 Pro Expo Go/debug host at 1.15/2.0, software IME, measured focus viewport/footer and detail navigation. Physical keyboard, iOS, other devices and signed release remain. |
| RN10-D03 | Real Auth/account/profile lifecycle and root integration | Anisha + Ishmum; live RN-05/06/07 round trips and account transitions. |
| RN10-D04 | Native authorization/status foreground reconciliation | RN-08d accepts Android read/usage-permission/foreground scope (`cadc91d`); enforcement, other devices, iOS and release integration remain separate. |
| RN10-D05 | Native accessibility of implemented Quests/History/Settings and detail/editor composition | Ishmum; RN-10c/d record actual Android tabs/details/editors, selected controls, dirty Back/modal focus, large text and bounded sample error/busy states. Full state/speech matrices and other platforms/builds remain. |
| RN10-D06 | Cold start, memory pressure, background/termination/offline restoration and responsiveness | RN-10d verifies local draft background return, injected RUNNING_LOW, radio off/on and safe own-package cold start. True OS memory-pressure kill, authenticated offline/process restoration and release integration remain; no SLA. |

### RN-11 — Profile milestone and platform handoff evidence

**Owner:** Ishmum and Anisha execute the shared flow; you author frontend evidence.\
**Dependencies:** RN-06/07/10; native presentation/integration evidence for any activated native controls; corresponding backend/auth acceptance.\
**Requirements:** Relevant implemented FR/NFR IDs; AC-01/07/08/12 as actually covered.

**Proposed files:** Focused integration tests and implementation-time acceptance/runbook docs; update the core plan status/hash ledger only after the work exists.

**Implementation steps:** Run the account/profile matrix, verify a fresh checkout, local/development API configuration, sign-in/out and two-account transitions, profile restart/reload, conflicts, and unavailable native states. Capture the exact frontend/backend schema/commit versions tested together. Identify which platform implementation plan must next connect selection/installation, which PM decisions gate plan/quest work, and whether a small shared development deployment is needed to avoid local-network friction.

**Validation and acceptance:** All relevant root checks and platform JS exports pass; no private fixture/dev bypass ships; no account data crosses a session boundary; real profile save is confirmed; unavailable metrics and native capabilities remain unavailable. Native functionality is signed/device-tested where actually implemented; anything else is recorded unverified, not implicitly passed because the shared UI works.

**Commit done when:** Ishmum and Anisha can continue from a documented, reproducible M1/M2 integration with no hidden dependency on another unmerged task branch. **Recovery:** revert the affected live feature while retaining tested authentication/account-isolation foundations; do not roll back database data from a frontend PR.

**RN-11 prerequisite audit (2026-10-30):** The user conditionally requested
RN-11 after RN-10. Its live milestone cannot execute in this checkout: backend
OpenAPI exposes only `/healthz`; mobile sign-in/root guards are placeholders;
generated foundation API types, database migrations and real profile endpoints
are absent. RN-05/06 M1 and RN-07 M2 are therefore still pending. The
[QA readiness table](../qa/mobile-accessibility.md#rn-11-readiness--live-milestone-cannot-run-yet)
names the owners and required outputs. This is a dependency audit, not RN-11
implementation or integration evidence. Ishmum can start API-01 independently;
Anisha supplies Auth/Supabase and coordinated root wiring. Native absence does
not block identity-only M1, but cannot support claims about enabled protection.

## 8. Product and platform gates

| Gate | Blocks | Does not block |
|---|---|---|
| PD-09/10; Q17 account/provider scope | Launch-required login/provider claims and final guest/auth route policy | Development email/password identity milestone using an explicitly scoped test flow |
| PD-17; Q19 demographics/minimum age | Shipping age/gender collection/rules and age-related copy | Neutral account header and minimal approved profile |
| PD-01–04; Q02–10 | Activating plan/session/override/quest enforcement controls | Layouts, input primitives, identity/profile integration |
| PD-05/06; Q11/12 | Quest completion and real credit transactions | Quests card specimens and explicit unavailable production state |
| PD-07/08; Q13/14 | Dino scoring/Feed/streak display logic | Authentic asset preparation; neutral no-score presentation |
| PD-11/12; Q15/16 | Usage/saved-time/comparison/forecast claims | History structure and unavailable states |
| PD-13; Q21 | Real calendar connect actions | Omitted/feature-gated calendar section |
| PD-14/15; native audit and device evidence | Native action integration, production build identity, enforced-parity claims | Web/shared UI work and honest capability/status mapping |
| Approved sign-out/account deletion/native ownership policy | Real account switching/deletion with account-bound native rules/events | Clearing remote UI caches and testing identity-only account boundaries |

The answer to a product gate is not supplied by a convenient UI fixture, an SDK method name, or a successful mock. Update PM decisions and contracts when the behavior is agreed; add regression cases before enabling it.

## 9. Acceptance matrices

### M1 — Authenticated identity milestone

| Case | Expected result | Evidence owner |
|---|---|---|
| Fresh signed-out launch | Auth/public route selected by the agreed policy; no account query/private cached content | Auth + RN |
| Slow auth bootstrap | Neutral startup state; no redirect loop or private-content flash | Auth + RN |
| Real sign-in | Current token reaches API; matching `/v1/me` identity displayed | Auth + API + RN |
| Restored session | Session refresh/persistence follows auth contract; account query uses current token | Auth + RN |
| Expired/invalid token | Canonical `401` recovery; bounded attempts; no infinite loop or forged success | All |
| JWKS/auth service/API outage | Safe retry/unavailable state; no false account sign-out for API `503` | API + Auth + RN |
| Account email absent | Neutral identity label, no Figma identity substitution | RN |
| A request finishes after sign-out | No A data/toast/navigation appears on signed-out screen | RN |
| A request finishes after B sign-in | No A content in B cache/UI; B gets separate request and query scope | RN + Auth |
| Sign-out network request fails | Local departing-account UI/cache is cleared; auth owner reports recovery state | Auth + RN |
| Protected deep link while signed out | Auth guard handles it without mounting private data; approved return target retained safely if supported | Auth |
| Wrong environment configuration | Clear unavailable/configuration failure; no fallthrough to another service or production | All |

### M2 — Minimal profile milestone

| Case | Expected result |
|---|---|
| Identity exists but profile is missing | Exact approved missing-profile/setup state; no fabricated row or completion |
| Save valid field | Server response/revision becomes canonical; restart/reload retains accepted value |
| Two edits use same revision | One succeeds; stale edit is visibly rejected and can be reviewed/reloaded |
| Invalid field/unknown key | Safe field/general error; client does not bypass server validation |
| Timeout after possible commit | Save remains unconfirmed until a read reconciles server state; no blind replay |
| Offline while editing | Same-user draft preserved according to its contract; no false saved confirmation |
| Account changes during save | No update, success toast, or onboarding navigation for the new account |
| Native adapter absent | Profile still works; UI does not claim apps are protected |
| Permission revoked | Native-needed state accurately refreshed; profile/identity are not erased |
| Unavailable measurements | Explicit unavailable state; no zero/demo statistics or calculated forecast |

## 10. Verification commands and evidence discipline

Use the commands actually present at implementation time; extend them in the relevant commit when adding a test runner. Current foundation commands are:

```bash
npm run typecheck
npm run lint
npm test
npm run api:lint
npm run api:test
npm run mobile:export
npm exec --workspace @disconnect/mobile -- expo export --platform all
```

Add component tests to the root `check`/CI workflow deliberately when RN-01 introduces the chosen SDK-compatible UI test setup. Do not claim `npm test` covers native UI if it still only runs pure Vitest tests. Do not test external Supabase project state from every untrusted pull-request workflow or require production credentials in CI. Live development verification and signed native/device checks get their own redacted evidence records.

For every completed part, record the requirement IDs covered, source Figma IDs reviewed, actual commit hash, tests run/results, screenshots when layout changed, tested platform/build, known unverified behaviors, and the next unlocked part. Record a focused unresolved issue rather than repeatedly rerunning unchanged checks without a new reason.

## 11. Failure prevention and recovery summary

- **Auth/client divergence:** one token/refresh owner; generated API schemas; coordinated root provider change.
- **Cross-account leakage:** account/generation keys, cancellation, fresh query scope, draft/toast/navigation cleanup, two-account delayed-response tests.
- **Infinite retries:** one bounded retry policy with a distinct auth-revalidation path; no mutation replay by default.
- **False protection:** native confirmation and expected revision; no status inferred from profile/API health.
- **Misleading Figma data:** isolated fixtures and explicit production unavailable states; source/coverage contract before actual progress values.
- **Profile overwrite:** expected revision, preserved draft, deliberate conflict review, authoritative reread after ambiguous save.
- **Platform regression:** no native project regeneration/identity changes in UI commits; native owners validate signed builds and persistence.
- **Overbuilt frontend infrastructure:** React state for local UI, one server cache, no persistent cache/background mutation replay/generic rule engine until required.
- **Unsafe rollback:** turn off/revert a feature or apply a forward-compatible UI correction; never clear native restrictions or delete database data as a frontend rollback.

## 12. Current technical references

Official sources were checked while drafting on 2026-10-28. Recheck the version-specific guidance when installing/upgrading packages; source availability is not proof that this project's native behavior has been tested.

- [Expo protected routes](https://docs.expo.dev/router/advanced/protected/) — navigation guards, route history, and SDK-specific redirect behavior.
- [Expo authentication guide](https://docs.expo.dev/router/advanced/authentication/) — shared auth context and navigation integration; auth implementation remains Plan 02's responsibility.
- [Expo unit testing](https://docs.expo.dev/develop/unit-testing/) — SDK-compatible Jest/React Native Testing Library setup; keep native component tests separate from the existing pure-TS Vitest suite.
- [TanStack Query React Native integration](https://tanstack.com/query/latest/docs/framework/react/react-native) — app focus/connectivity integration points and listener cleanup.
- [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) — propagate query cancellation to the underlying HTTP client.
- [TanStack Query network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) — paused/offline fetch state differs from an active first-load request.

The architectural choices, staged scope, timeout/retry proposals, and commit decomposition in this document are engineering recommendations to review with the other plans. They are not PM answers or claims of completed implementation.

RN-09c source: read-only Figma `27:153`, same source session as RN-09b. Summary presentation has independent unavailable/error/loading/ready readings, required evidence and explicit comparison eligibility. Live data remains unavailable. Deferred: **RN09C-D01** approved measurement/source/schema; **RN09C-D02** real account-scoped insights and recovery; **RN09C-D03** detail pages/navigation and gated PD-12 forecast; **RN09C-D04** signed-device/accessibility acceptance. RN-09b commit: `2bbebad`.

RN-09d source: read-only Figma `27:157`, same source session. Account header and RN-07 controlled form are reused within one scroll owner; source grouped rows delegate only supported ready actions. Real route is unavailable; optional demographics/calendars hidden. Deferred: **RN09D-D01** real profile/Auth/guard integration and reviewed account actions; **RN09D-D02** approved shared plan/activity/native selection schema, persistence and reconciliation; **RN09D-D03** demographic/calendar scope and actual provider flows; **RN09D-D04** signed-device/accessibility/lifecycle. RN-09c commit: `c1c84c3`. These presentations do not complete RN-09 live acceptance or RN-11.

RN-09 UI closure: e/f/g/h add controlled editors/detail navigation with unavailable
actual saves and isolated source examples. RN09C-D03 detail presentation/navigation
is implemented; PD-12 forecast remains explicitly excluded. RN09D-D02/D03 editor UI
is prepared; shared approved schemas, real native selection/save/install and launch
scope are still pending. No deferred live contract or platform gate is marked done.

RN-10a original icon-pack work (2026-10-31): 61 same-node tracked files are exact pack copies, refreshing 16 earlier captures. Home nav root is 21×21 with unchanged 18 px slot/−1.5 offsets. Source literal emoji stay literal. Remaining 10 context originals have no same-node pack file and remain verified originals. See assets README and rn-10a audit/evidence. Android device acceptance remains pending until actual device access/results exist.


RN-10b Android QA preparation and polish (2026-11-01): a separate Expo Go project
at `apps/mobile/dev/native` renders actual widgets across 19 local sample pages
without routing fixtures into the real app. Shared samples now serve web/native
QA. Discard/cancel confirmations use a scrollable safe-area modal, dismiss the
keyboard on show, focus the safe action and keep the draft on Android request-close;
busy cancellation remains disabled. See its README, the QA record and per-file
implementation notes. No Android device is connected, so RN10-D01/D02/D06 and
native RN10-D05 acceptance remain pending. RN10-D03/D04 still need real producers.
RN-10a commit: `ab7d855`. Do not mistake a served Expo Go bundle for phone execution.


RN-10c physical Android follow-up (2026-11-01): Ishmum executed Expo Go on an
authorized Pixel 8 Pro, Android 16/API 36, Expo Go 58.0.5. All 19 QA destinations
opened at the original 1.15 font scale; 11 representative pages and all four actual
Router tabs were inspected at 2.0. Typed drafts, software keyboard, header/hardware
Back, explicit discard, Home's six QA scenarios, native hours drag and session
steppers were exercised. Two observed failures are fixed and retested: compact
weekday labels now grow/wrap into intact rows at enlarged fonts, and selected tab
pills keep rounded backgrounds after switching. Phone screenshots and exact limits
are in [RN-10c evidence](../core_plan_implementation_notes/artifacts/rn-10c/README.md).
Font scale 1.15, USB stay-awake setting 0 and the original 30-second screen timeout
were confirmed at handoff. QA Home is left open with explicitly simulated data.

RN10-D02/D05 now have **partial physical Android evidence**, not full platform
acceptance. RN10-D01 still requires observed TalkBack/VoiceOver speech and traversal;
D03/D04 require real producers; D06 needs standalone-build lifecycle/offline/process
and responsiveness evidence. iOS, additional device sizes, signed standalone builds
and the complete per-feature state matrix remain open. A local stale HMR connection
stopped QA Metro during project switching; the server was restarted, Expo Go was
cold-opened between projects and the interrupted cases then passed. This interruption
is recorded as a development-tool failure, not an app lifecycle pass. RN-10b commit:
`704bc49`. No native project, release identity, Auth/backend data or permission changed.


API-01–05 backend producer handoff (2026-11-01): protected `/v1/me`, asymmetric
verification/JWKS and generated `MeResponse`/error/health types now exist. Read
[Plan 03 notes](../core_plan_implementation_notes/plan_03_backend_foundation_notes.md).
This removes the missing backend/schema producer for RN-05; Anisha's actual
Supabase/session/guard/root outputs, configured-project smoke and real RN-05/06
acceptance remain pending. RN-07 now has API-08 GET available but still requires actual profile consumer/Auth integration; SB-04/05 are delivered in the later checkpoint.
No mobile Auth/root provider was wired by the backend commits.

### Supabase database infrastructure follow-up — 2026-11-01

SB-05's disposable real PostgreSQL producer is implemented and verified; SB-04's
hosted role, actual password login and verified TLS/permissions are also accepted. The
backend has observed the real ES256 JWKS and rejects real project public API keys
as user tokens. These are infrastructure/backend checks, not RN-05/06 acceptance.
RN-07 still needs API-10 evidence and real profile HTTP integration, and Anisha's Auth/session/root
producer remains required for live account/UI integration. No mobile Auth or UI
code was changed in this follow-up; see Plan 01 implementation notes for evidence.

API-06 now supplies the guarded lazy database transaction/session producer (337
deterministic / 24 real DB tests). This is backend infrastructure only: API-07 now supplies the profile schema/RLS; HTTP routes remain API-08/09, and real Auth/root wiring still comes from
Anisha. No RN consumer/acceptance status is advanced by this backend-only part.

API-07 now supplies the real profile model/migration/grants/RLS, validated locally
and applied to the empty development schema. API-08 now publishes nonmutating GET
with generated read types; API-09 supplies strict revisioned PATCH (453 deterministic /
96 DB checks). RN-07 consumer wiring, Anisha's Auth/root producer and live
Auth/profile acceptance still remain necessary. No RN UI/consumer status changed here.

API-10 operational diagnostics and reproducible HTTP checks are implemented; real
managed-user/browser/native/root evidence stays pending. Backend availability
(GET/PATCH plus generated types) no longer blocks the independent RN-07 consumer,
but real session/root wiring and joint acceptance remain necessary. See the
backend operator guide and onboarding persistence review. No RN source/status was
advanced by these backend-only operational checks.

API-10 follow-up now accepts actual managed-account A/B HTTP identity/profile
writes/conflicts/isolation and restart persistence. Backend/token availability
for this run is established; RN-07 real consumer and Anisha Auth/root/native
integration remain open. No RN code or application/device milestone was accepted.

API-10 now independently verifies actual browser CORS/protocol and separate
Auth-only/unconfigured startup modes. This removes the browser-protocol gap, not
the real application Auth/root/RN-07/native-client acceptance gates. Backend
identity/profile producers remain available; RN-07 consumer work can proceed
against those contracts, with real Auth integration coordinated with Anisha.


### RN-07 consumer wiring checkpoint (2026-11-02)

`ProfileSurface` now consumes real profile HTTP functions through the existing
account scope. The actual Settings route mounts it when Anisha's provider exists;
without that provider it keeps the neutral preview. No Auth SDK, fixture session,
onboarding-completion or native-policy behavior is installed in the app root.
Conflict/uncertain saves require a latest read and explicit resolution; no blind
retry or durable draft queue is added. See the RN-07 wiring notes for files/checks.

A separate Expo Go profile QA entry compiled and loaded on Pixel 8 Pro / Android
16. Native credential attempts reached the backend and safely displayed a 401 rejection;
host verification then confirmed the saved token had expired. Native input was
not proven byte-identical to the saved token, so no native expired-token-specific
result is claimed;
no authenticated profile round trip or profile write was completed on the phone.
User explicitly deferred refreshing tokens and hosted deletion. Accounts A/B were
not deleted or modified. Follow [device QA](../../apps/mobile/dev/profile/README.md)
and [dedicated-account lifecycle acceptance](../qa/profile-cascade-acceptance.md)
when resuming. Existing full RN-07/API-10/Plan 04 acceptance remains OPEN.


RN-08a checkpoint (2026-11-03): one Android-only local Expo module and development
host build/install on Pixel 8 Pro / Android 16. Actual Kotlin instrumentation
observes initial denied access/null count, own-package visibility and unlocked
state. Bounded count-only probe exports no package/event identifiers. Overlay/
storage permissions removed, release signing unset, iOS unchanged. Continue b/d
for grant/revocation/lock/empty-window evidence; no enforcement/parity claim. See
[probe runbook](../qa/android-capability-probe.md) and implementation notes.


RN-08c checkpoint (2026-11-03): the stable Android adapter is registered on Home;
actual route focus/AppState foreground gate the existing read hook and permission
status. Usage access is separate from unimplemented protection, and API revisions
never become desired native revisions. Module absence/iOS/web retain fallback.
Fourteen new lifecycle/action tests plus full workspace (382 portable/502 component/
590 API), web isolation/assets and Android Hermes pass. Pixel UI shows connected
usage access without active protection and opens own-app Settings correctly. d
continues actual revoke/lock/absence/responsive/cleanup matrix. No Auth/root/iOS,
API or native enforcement operation is introduced.

**RN-08d current checkpoint (2026-11-03):** Android a–d's independent
read/usage-permission/status scope is implemented and physically verified on
Pixel 8 Pro / Android 16/API 36. Actual Home opens own-app usage Settings and
refreshes grant/deny on return, external revoke/foreground and cold start. Actual
Kotlin reads distinguish locked/null from ready/zero and run without Metro/API;
Expo Go retains missing-module fallback. Large text 2.0 leaves the permission
button reachable/operable. Temporary own-package permission, font and stay-awake
are restored; task servers/reverse mappings removed. See the [device runbook](../qa/android-capability-probe.md)
and [exact evidence](../core_plan_implementation_notes/artifacts/rn-08/device-d.json).
Checks: 382 portable / 502 component / 590 API, types/lint/contracts, 38-file export
isolation / 71 original assets, native APKs and Android Hermes export pass.

This supplies RN-09k's Android read-only native-status dependency and RN-09l's
independent native absence/revocation evidence; combined authenticated settings
phone acceptance remains open. No grant or saved draft installs protection.
RN08-D04/D05 and enforcement portions of D06 remain pending; first-unlock/reboot,
other Android devices, assistive speech, signed release and Anisha's iOS/Auth/root
are not accepted by this run. Next: coordinated Auth/root + hosted migration 0002
and approved current test accounts for RN-06/07/09l/10/11, or separately agreed
native enforcement/product policy. User-deferred token refresh and hosted-C
deletion remain deferred. Counts stay 46 top-level / 21 producers / 25 pending;
full parent RN-08/09 and Plan 04 remain open. Earlier checkpoints are historical.

**Plan 03 handoff (2026-11-07):** hosted development settings migration 0002
is now applied and security-verified; existing profiles exactly preserved, settings
empty. This removes the hosted schema prerequisite for RN-09i/j/l. Existing
consumers need no generated-contract or frontend code change. Fresh A/B tokens
and authenticated phone checks remain user-deferred; real Auth/root and joint
RN-06/07/09l/10/11 acceptance remain open. See
[backend evidence](../core_plan_implementation_notes/artifacts/api-10/hosted-settings-acceptance.json).
Do not repeat the applied migration or equate backend acceptance with app success.


**RN-10d current checkpoint (2026-11-07):** independent Android debug-device
checks and two measured fixes are implemented. Native focus scrolling now reserves
the measured floating footer outside the ScrollView viewport; explicit modal return
waits for Android window focus and one bounded settle. Pixel 8 Pro / Android 16
actual Router: font 1.15/2.0, four tabs, Settings/History details, quest IME/Back/
Keep/discard, selected tab/control speech, modal focus/return and local-draft
background/radio/cold-start checks pass within the recorded scope. Isolated sample
checkbox/error/busy and measured reduced-motion indicator checks remain labeled separately. See [RN-10d device evidence](../core_plan_implementation_notes/artifacts/rn-10d/README.md)
and [per-file notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

Full check passes 382 portable / 518 component / 601 API; focused final retest
64/64, web isolation 38 files / 71 original SVGs, Android production Hermes export.
Existing debug host reused; no native rebuild, Auth/root, API/cloud/iOS or signing
change. Phone settings restored to this run's baseline (font 1.15, timeout 600000,
stay-awake 0, TalkBack off/display output off, radios on); existing usage access
allow preserved. Owned Metro servers/reverse mappings/XML removed. RN10-D01–D06
retain the explicit remaining gates above; RN-10 and Plan 04 are not fully accepted.
Next joint Auth/root plus approved current accounts for RN-06/07/09l/10/11; hosted
schema is ready, but refreshed tokens and hosted C deletion remain user-deferred.
Counts remain 46 top-level / 21 producers / 25 pending. No new parent plan/ID.
