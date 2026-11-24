# Dashboard user experience

Owner request on November 24, 2026: preserve approved authentication and onboarding, remove testing-only controls from the ordinary app, and implement the gamified Figma experience on iOS and Android. This checklist is the implementation and acceptance guide for this phase.

## Design authority

| Area | Figma source | Required behavior |
| --- | --- | --- |
| Visual language | 10611:12784 | Warm app surfaces, original Space Grotesk weights, semantic colors, exact assets, safe areas and accessible controls |
| Original icons | 10705:236 | Preserve source vectors and geometry; no emoji substitutes for vector assets |
| Home | 22:4 | Dino health and Feed, credits, measured weekly savings, temporary recommendation, streak, floating Home/Quests/History/Settings navigation |
| Dino states | 88:96 and 10611:13318 | 0–25 needs care; 26–50 feeling low; 51–75 doing okay; 76–100 happy |
| Quests | 27:155, 10487:126, 10577:427 | Accepted tasks, suggestions, personalize, accept, custom quest, save/edit/delete and occurrence completion |
| History | 27:153, 10570:192, 10570:193 | Measured progress and source/coverage-aware comparison; never render sample metrics as real outcomes |
| Settings | 27:157, 10601 expanded frames, 10777:248 | Account identity, age/gender, distracting apps, tone, redirection activities, plan editing and genuine device access management |

The stats-only Home 10832:249 and its Stats/History/Feedback/Settings navigation are a separate Swift-style design family. They do not replace the requested gamified Home or remove Quests. Sample names, balances, savings and streaks remain design examples.

## Protected baseline

Do not rewrite or remove the approved intro animations, sign-in/sign-up/provider verification, recovery, questionnaire flow, embedded native app selection, loading ring, suggested/manual plan flow, shared-budget accounting, eligibility rules or dinosaur app icon. Do not clear account, onboarding or native device data for visual testing. Onboarding replay and setup-entry shortcuts are removed from ordinary Settings; genuine account and protection management remain available.

## Rules and reconciliation

- Feed costs **10 credits**, matching Home 22:4 and the stylebook. Its inherited health gain remains up to 20, capped at 100; initial health 50 and elapsed daily decay 5 are retained implementation defaults because the linked design does not specify replacements.
- Health boundaries are inclusive exactly as shown above. The server and client decoder must agree at 25, 50 and 75.
- Award +5 for an intentional opening pause quit, +20 for a session-end quit and +50 for completing the temporary Home quest. The current stylebook awards +20 for a mid-session quit. This phase follows that rule, superseding the older +30 policy for new events; immutable historical +30 awards remain unchanged.
- A recommendation remains temporary until accepted. Accept creates a one-time occurrence, not a recurring personal template. Skip neither awards credits nor creates a quest. Do not claim an AI model or observed scrolling routine where only activity templates are available.
- Wallet changes are server-authoritative and idempotent. Rapid taps, response loss, retry and navigation must not double spend or double award. Historical 20-credit Feed receipts retain their original amount.
- Missing usage, absent coverage and unsupported iOS measurements are unavailable, never zero or Figma sample values. iPhone report contents remain inside Apple's report extension.
- Keep native explicit Apply/Stop, permission recovery, account ownership and unresolved iOS physical expiry gate. Saving account preferences alone must not claim active protection.
- User-facing copy should explain choices and outcomes. Remove routine diagnostic panels, manual refresh buttons and test-only onboarding controls from normal happy paths; retain concise recovery actions when an actual failure needs them.

## Implementation sequence

1. [x] Record exact asset mapping and verify current screen geometry against the gamified frame family.
2. [x] Remove testing controls and extra Home panels without changing approved onboarding/authentication code.
3. [x] Align Feed, health states and receipt-safe API/storage behavior with Figma.
4. [x] Verify Home recommendation, Feed feedback, credits and streak against actual account state.
5. [x] Verify Quests navigation, accepted/custom/personalized tasks and explicit native application.
6. [x] Verify History navigation, comparable periods and truthful unavailable states.
7. [x] Align Settings rows/editors, tone behavior and genuine protection management.
8. [x] Check layout on compact and standard mobile viewports, text scaling, button labels and assets.
9. [x] Run relevant automated checks, build both native apps and record remaining physical checks separately.

Requirements: FR-009, FR-021–034, NFR-003/004/007/008. No production/store or physical enforcement completion follows from a visual or unit-test pass.

## Evidence and limits — November 24, 2026

Checked items above mean implementation, automated behavior and isolated visual review, not physical protection acceptance.

- Approved onboarding/authentication/intro production files were not modified. No accounts, questionnaires, permissions or native app selections were reset.
- Six fresh Home/health assets are exact Figma exports with source node IDs, original bounds and SHA256 in `apps/mobile/assets/dashboard/manifest.json`. Existing pinned artwork was retained unchanged. Asset checks pass.
- Home uses account rewards, source-aware weekly progress and temporary recommendations. Ordinary Home no longer contains preference/native diagnostic panels. Recovery controls appear only when necessary.
- Settings no longer exposes Restart questionnaires or Set up Hoosh. Age 18–80, Male/Female/Other avatar choice and four nudge tones use account-scoped preferences. Days/hours/sessions expand inline; saving does not automatically apply a device schedule. Native tone bindings exist on both platforms; live delivery remains a physical check.
- Local QA schema migrated to `20261124_0009` with strict ownership/RLS/constraint verification; existing settings retained. Hosted Supabase was not migrated. Deployment must apply this migration before serving the new API/client.
- Isolated PostgreSQL17: 24 tests passed, including owner isolation, persistence, 10-credit Feed retry, historical 20-credit receipt replay and new mid-session pricing. Original local data digests matched and owned API/database services were restored.
- Final native builds passed for iOS Release and Android standalone QA. iPhone installation succeeded over the existing app without uninstalling.
- Full component run: 143 suites passed; 1,035 tests passed and two existing tests skipped.
- API schema/route/migration tests: 104 passed. Mobile unit tests: 698 passed. TypeScript, dashboard changed-file lint and Python lint passed. Full mobile lint still reports two existing errors in untouched `onboarding/setup-draft.tsx`; these are not silently marked passed.
- Layout review: Home, Quests, History and Settings at 393px, plus compact 320px Home. Automated suites cover larger text, native lifecycle, navigation, save conflicts and account boundaries. Synthetic Figma preview values are labeled and are not account outcomes.

### Physical and deferred acceptance

1. Earn real credits from native interventions, verify the wallet after background/relaunch, Feed once and confirm balance/health and the corresponding Dino state.
2. Accept/skip a Home recommendation; personalize/create/edit/delete a quest; verify one-time completion cannot award twice. Confirm native Apply/Stop and permission recovery on each physical platform.
3. Compare History with actual available coverage. iOS report-only or missing usage must remain unavailable rather than display the Figma sample metrics.
4. Change nudge tone and verify the next real intervention uses it for this account, including after switching accounts.
5. iOS elapsed-expiry activation remains gated until its outstanding physical check passes. This dashboard phase does not remove that gate.
6. Calendar connections remain explicitly unavailable in the current deferred scope. No placeholder Connect action is presented as working.

Commit suggestion: `feat: align gamified dashboard and Dino care with Figma`

### Phone connection recovery

A temporary Cloudflare QA tunnel expired after installation, leaving the phone unable to reach the otherwise running API. Saved local QA plan/activity rows were still present. Replaced the tunnel, verified HTTPS health, rebuilt with the replacement URL confirmed inside the compiled bundle, then installed over the existing iPhone app without resetting data. Temporary URLs are stored only in ignored local QA configuration. This is a development connection, not durable hosting; the Mac/API/tunnel must remain running until a stable shared development API is deployed.

### Yesterday-only usage and onboarding recovery correction

User reported screenshots IMG_1787–1789. API logs showed settings PATCH 403; a phone setup account lacked its UUID reference in the isolated local `auth.users` fixture. Added the missing local UUID reference only, without altering managed Auth, account answers, tokens or existing settings. Standalone auto-save recovery is now contained by the existing dark Screen with safe-area/scroll layout rather than naked root fragments.

Android onboarding reads yesterday only; seven-day measurements are not preferred or substituted. iOS report is filtered to yesterday, with no period picker or numeric confirmation form. No sample usage is supplied. Apple’s DeviceActivityReport sandbox prevents the host app from extracting protected report contents, so automatic iOS plan persistence from that total remains blocked; viewing the report does not claim confirmation or create a guessed plan. The existing manual plan remains a user-selected route, not a fallback generated from sample data.

Validation: yesterday-input policy 25 tests passed; save/resume component tests 12 passed; TypeScript passed. Physical report rendering and successful account save need observed device acceptance; prior build/test results do not establish these.

### Current onboarding acceptance flow — supersedes yesterday-only no-fallback decision

The owner now explicitly permits the previous starting/example suggestion when measured usage cannot be used. Questionnaire order, native app selection, loading ring, suggestion/manual layouts and the approved congratulations artwork remain intact. The custom “Your usage, your plan” detour is removed. Android uses only yesterday when it supplies valid measured input; otherwise the existing starting schedule is offered and labeled as not based on measured Screen Time. iPhone uses that starting suggestion without asking for a report total. Example suggestions never become observed History or savings.

Accepting either suggestion or custom plan now uses `SetupPlanSave`: save behind existing Figma loading/suggestion views, then directly show congratulations after server acknowledgment and persisted completion. “Check latest settings”, comparison, and receipt-confirmation pages are absent from this questionnaire path. An uncertain prior save is read back first and not duplicated when it already matches. A real failure retains the selected plan on the existing suggestion design and does not falsely claim completion.

The local QA API previously needed manual `auth.users` UUID fixture enrollment after every new Supabase signup; that caused repeated settings PATCH 403 responses after account recreation. `scripts/local_qa_api.py` now mirrors only cryptographically verified Supabase UUIDs into the isolated loopback fixture after checking its PG17 test marker. It does not alter Supabase Auth, credentials, RLS or production API code. Run with the existing private QA environment, `PYTHONPATH=services/api services/api/.venv/bin/python -m uvicorn local_qa_api:app --app-dir scripts --env-file .native-dev/c06-backend.env --host 127.0.0.1 --port 8000`. Never use this helper for a hosted database or production deployment.

Measured reporting audit: `use-history.ts` intentionally does not collect iOS History. Current iPhone usage-statistics reporting is therefore NOT complete even when permission, selection and native intervention/reward components work. Apple's DeviceActivityReport can render yesterday’s usage within its protected report extension; host export to the API is prohibited by its documented sandbox. A future change must integrate real report presentation into the existing History design, not use sample metrics or claim cross-platform parity. Native protection expiry gating remains unchanged.

Validation for this increment: 26 component tests across iOS/Android cover suggestion/manual navigation, direct completion, save/readback retry and absence of comparison pages; 25 yesterday-policy tests pass. TypeScript and asset checks pass. Missing/invalid JWT requests to the local QA API return 401 without inserting fixture identities. Full physical journey acceptance remains separate.

Commit: `fix: save onboarding plans directly before congratulations`

Final iOS Release build passed and was installed and launched on the existing iPhone without clearing app data. The phone’s profile/quest requests returned 200 through the updated local QA API. This is connection/build proof, not a claim that the user’s fresh signup-to-completion journey has been observed.

Android standalone QA packaging also passed for this increment. Both platforms contain the shared direct-completion flow; only iPhone installation/launch was performed. Android physical acceptance and iPhone measured-History integration remain open. No commits or pushes were performed.

### Google signup routing regression

Reported: Google signup returned to Home instead of questionnaires. Device-local setup records included incomplete plan checkpoints without saved account settings. `SetupResume` previously marked its single check consumed whenever `/welcome` was seen, even before an eligible Home evaluation. OAuth return/reset navigation could therefore move back to Home after the guard had permanently stopped checking.

The guard now keeps incomplete/new accounts eligible for redirect on Home. It settles only for a completed/established account, or an explicit user Skip stored in the disposable account scope. `SetupScreen` records that Skip deliberately instead of inferring it from arbitrary route changes. Decisions are keyed by account scope rather than a global boolean; no account deletion, answer reset, auth-provider behavior change or visual onboarding changes are part of this fix.

Validation: 30 component tests across both platforms cover first signup, callback Home-after-welcome regression, inherited welcome route, incomplete-plan resume, completed-account behavior, explicit Skip, scope replacement and direct save/completion. TypeScript passed. Physical Google signup-to-questionnaire still needs observed acceptance; deterministic reproduction does not establish exact callback timing on the user’s phone.

Commit: `fix: resume onboarding after Google callback navigation`

### Dashboard bypass reinvestigation — actual entry boundary

The prior root-level route observer was insufficient. The phone’s embedded anonymous Cloudflare tunnel had also expired (`Unauthorized: Tunnel not found`; HTTPS DNS lookup failed), while the Mac API remained healthy. The previous observer returned no blocking UI while its backend checks failed, so the tabs could still render without an onboarding decision.

`SetupEntryGate` now wraps the actual `(tabs)` layout. The dashboard cannot mount while verified identity/settings/local-progress checks are pending or failed. Fresh/incomplete accounts return a declarative Redirect to the existing onboarding route, independent of root pathname timing. Established/completed accounts and explicit account-scoped Skip remain supported. Connection failure reuses the existing sign-in status/recovery components; no new app route or questionnaire design was added.

Replaced the failed development tunnel and verified health 200; confirmed the new URL exists in the compiled iPhone bundle. Real Expo Router tests now exercise tabs, redirect-after-callback, blocked pending/offline entry, explicit Skip, corrupt local progress and completed/unfinished accounts. Existing Root integration tests now wait for verified tabs and reflect direct congratulations followed by explicit Apply in Settings. All 114 targeted routing/integration tests, TypeScript and changed-file lint passed. iOS Release build and installation succeeded.

Physical launch was denied because the iPhone was locked. The current live Google identity and displayed destination have NOT been verified; requested unlock/open instead of deleting/resetting another account. An ignored temporary local API diagnostic records only the verified account suffix, a requested-email match boolean and client category, never credentials, to support the next live check. A stable hosted development API is still required to replace anonymous tunnel dependence.

Commit: `fix: gate dashboard entry on verified onboarding state`

### Mandatory target picker without a separate setup-review detour

The signup questionnaire's app step now presents concise instructions and a single Choose apps to target action, followed by Next and Back vertically. The large permission/Dino card, “Review existing setup” button and separate review alert are absent from this signup path. The action explicitly prepares the current device account, reads native ownership, requests OS permission only when not already authorized, opens the real app picker and verifies the committed selection. When previous setup exists, a concise inline notice explains that choosing apps replaces it; nothing is claimed or stopped merely by opening the page. No previous account’s choices or history are displayed. Next is disabled until authorization and a nonempty committed target selection are confirmed. Cancel, denied access, failed assignment and uncertain commit do not grant continuation. Legacy non-signup recovery components remain separately available.

Live entry evidence: the phone's verified iOS request matched the requested test-account email; user screenshot IMG_1793 shows the third questionnaire step. Temporary identity diagnosis was removed after that match was confirmed. No account deletion or answer reset was performed for this change.

No API fallback: runtime receives only the configured API origin; missing URL, failed identity/settings read and unreadable progress cannot grant Dashboard entry. Added real-router coverage for missing URL with zero requests to alternative services. Existing public unsigned component previews are separate from authenticated app entry. This does NOT certify the anonymous development tunnel as reliable: a permanent hosted API remains outstanding and weak networks cannot be guaranteed away.

Validation: 142 permission/routing/normal-Root integration tests passed across both platforms; added missing-URL guard coverage also passed. TypeScript, changed permission-file lint, existing asset integrity checks and iOS Release build passed. Current questionnaire, permission and picker layout changes are shared by iOS/Android. Physical picker/OS permission acceptance still requires user verification.

Commit: `fix: streamline mandatory onboarding app selection`
