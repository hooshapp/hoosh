# Plan 02 — Onboarding into the shared app

**Checkpoint:** INT-ONB-C04 Android build and fixture checks passed. **Next:** INT-ONB-C05. **Branch:** `integration/shared-product`. **Starting revision:** `9b98445` (ONB-C03). **Commit:** Pending.

## INT-ONB-C01 — Introduction and scoped setup progress

Intro source: landing-page `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1`.

- Restored the three landing-page introduction screens using the original exports already in `assets/intro`. Compared the live Figma frames `1:2`, `6:34` and `6:71` at 393 × 852. Ported the scroll, five-gesture fallback, Skip, reduced-motion and storage-recovery paths. Web keeps scroll available and exposes a keyboard-accessible Continue action. First launch uses the introduction before sign-up. Returning launches from the root and explicit sign-out lead to login. Direct sign-in remains available.
- Added a local, versioned setup repository using the app's storage, keyed by project and verified account. Missing, malformed, unavailable and newer-version records are distinct. Writes are serialized within the running app and stale completions are fenced, including a same-user session replacement. Records contain only approved settings draft fields, revisions and deferrals. The landing-page UUID-only draft/answers/completion keys are deliberately left untouched and are not imported. Cross-device restore and OS backup behavior were outside this check.
- **Settings → Set up Hoosh** opens the verified scope. A known unfinished draft resumes once on Home. The setup screen waits for account/settings verification before starting or reviewing setup. It offers retry/discard where applicable and allows returning to Home. Reviewing and keeping existing settings records a local receipt without writing server defaults or changing installed protection.
- Uses the existing Auth gate and account data provider. Added Expo Linear Gradient and AsyncStorage for the source intro and local progress. New profile/settings changes, the remaining questionnaire and plan conversion, and native permission/Apply remain the following Plan 02 checkpoints.

### Verification

Typecheck, 632 unit tests and 76 targeted component tests passed. Lint reported the four existing warnings. Chrome verified the reference artwork positions at 393 × 852, five light scrolls into the next page, completion into sign-up and the returning-launch path. The normal-root fixture verified resume without a redirect loop and preserving existing server settings and installed protection. Repository tests cover project/user isolation, stalled/unreadable/incompatible storage and write retirement. Android debug assembly and the production web export passed. No physical-device or hosted settings-database acceptance was performed.

## INT-ONB-C02 — Questionnaire and plan review

- Wired the hobbies, starter plan, manual schedule and draft review into the scoped setup route. Visual references were Figma `50:83`, `50:87` and `10556:120`. The manual setup artwork uses original Figma SVGs. The screen progression reflects the current flow, and the plan cards show actual schedule values in place of the old example apps and savings estimates.
- **Engineering decision:** use the reviewed manual defaults for both paths: Monday–Friday, 09:00–22:00 in the explicit device IANA zone, two 15-minute sessions per app. The manual path edits the same draft. Incomplete schedules remain drafts. There is no AI or usage-derived recommendation.
- Activities use the shared IDs and custom text is validated against the shared API boundary while preserving raw input for canonicalization on save. Unrecognized IDs, multiple custom values and invalid schedules require correction. Existing server values are displayed without overwriting them. The setup draft is local and resumable at the reviewed step.
- Age/gender collection is deferred under PD-17. The app selection row shows that selection is unavailable during this step. Server save and revision recovery belong to C03, real platform permissions and selection to C04, and explicit protection Apply to C05.

### Verification

TypeScript, 640 unit tests, 58 routed component tests, the production web export and asset checks passed. Lint reported four existing warnings. Chrome at 393 × 852, using a fixture account and API, verified selecting hobbies, entering custom text, editing manual days, reviewing the plan, reloading, and rendering the Figma artwork. The component tests covered both paths and preserving existing settings without a PATCH or native Apply. No physical-device or live database verification was performed in this checkpoint.

## INT-ONB-C03 — Account save and recovery

- The setup review uses the shared settings query and mutation. A reviewed save sends changed activities and plan fields in one revision-checked PATCH. Missing settings are distinct from a read failure. Only validated same-owner receipts advance the shared cache.
- Hoosh records the exact pending fields and expected revision locally before sending. Conflicts and uncertain replies require a fresh read and an explicit decision. Matching values can be confirmed without another PATCH. Keeping edits preserves the originally submitted fields and requires a new save against the reviewed revision. A late receipt cannot replace a different local attempt.
- Optional profile review uses the existing AUTH-C05 editor and signup-name handoff. Its receipt is recorded independently so settings recovery never replays profile work. If account settings save succeeds but the setup receipt fails locally, the retry only records progress. A restarted setup can recover from current account values.
- Offline deferral keeps an unsynced draft that can be reopened from Settings. After a confirmed settings review, the local permission checkpoint is ready for C04. No permission request or native Apply runs from a settings save.

### Verification

TypeScript, 641 mobile unit tests, 136 targeted component tests, 682 API tests and the production web export passed. Lint reported the four existing warnings. Routed tests covered the combined PATCH, a concurrent revision conflict, preservation of unrelated fields, lost reply, restart, local receipt failure, account replacement during save and offline deferral. Chrome exercised the real app HTTP client against a fixture server, including the separate profile save, dropped settings reply, reload, reconciliation without a second PATCH and readback in Settings. The disposable PostgreSQL suite was left open because Docker and a local PostgreSQL instance were unavailable. Physical-device permissions remain C04/C06 work.

## INT-ONB-C04 — Device permissions and app selection

- After reviewing account preferences, Android onboarding uses the existing verified native owner and Apps editor. Picker changes remain staged until explicit Save. Returning from the editor reloads the saved native count and revision. Native reads flag apps that have been removed or are no longer eligible without exposing app identities.
- Usage Access for measurement and Accessibility access for app protection have separate status and actions. Returning to the foreground refreshes both. The app uses Android's existing disclosure flow and device Settings for the actual grant.
- The protection review checkpoint verifies the current authorization and saved selection again on tap. A changed revision requires another review even when the count stays the same. Local progress keeps only the advisory selection revision. Users can defer and reopen device setup from Settings. Setup does not install or change a schedule.
- Web and builds without the owner-scoped native bridge show an unavailable state and permit deferral. The shared iPhone build has no registered Plan 04 selection bridge. Plan 04 and a signed physical iPhone test are required before iPhone device setup can be verified.

### Verification

TypeScript, 641 mobile unit tests, 128 targeted component tests, 117 Android JVM cases, Android debug assembly and the production web export passed. Lint reported the four existing warnings. Routed and picker tests covered staged Save, owner binding and release, foreground permission checks and revocation, same-count revision changes, removed apps, deferral and missing native support. No physical device or emulator permission flow was run at this checkpoint.
