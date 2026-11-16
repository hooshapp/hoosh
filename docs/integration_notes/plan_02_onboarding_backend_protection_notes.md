# Plan 02 — Onboarding into the shared app

**Checkpoint:** INT-ONB-C01 local checks complete. **Next:** INT-ONB-C02. **Branch:** `integration/shared-product`. **Starting revision:** `b5b8c10` (AUTH-C06). **Commit:** Pending.

## INT-ONB-C01 — Introduction and scoped setup progress

Intro source: landing-page `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1`.

- Restored the three landing-page introduction screens using the original exports already in `assets/intro`. Compared the live Figma frames `1:2`, `6:34` and `6:71` at 393 × 852. Ported the scroll, five-gesture fallback, Skip, reduced-motion and storage-recovery paths. Web keeps scroll available and exposes a keyboard-accessible Continue action. First launch uses the introduction before sign-up. Returning launches from the root and explicit sign-out lead to login. Direct sign-in remains available.
- Added a local, versioned setup repository using the app's storage, keyed by project and verified account. Missing, malformed, unavailable and newer-version records are distinct. Writes are serialized within the running app and stale completions are fenced, including a same-user session replacement. Records contain only approved settings draft fields, revisions and deferrals. The landing-page UUID-only draft/answers/completion keys are deliberately left untouched and are not imported. Cross-device restore and OS backup behavior were outside this check.
- **Settings → Set up Hoosh** opens the verified scope. A known unfinished draft resumes once on Home. The setup screen waits for account/settings verification before starting or reviewing setup. It offers retry/discard where applicable and allows returning to Home. Reviewing and keeping existing settings records a local receipt without writing server defaults or changing installed protection.
- Uses the existing Auth gate and account data provider. Added Expo Linear Gradient and AsyncStorage for the source intro and local progress. New profile/settings changes, the remaining questionnaire and plan conversion, and native permission/Apply remain the following Plan 02 checkpoints.

### Verification

Typecheck, 632 unit tests and 76 targeted component tests passed. Lint reported the four existing warnings. Chrome verified the reference artwork positions at 393 × 852, five light scrolls into the next page, completion into sign-up and the returning-launch path. The normal-root fixture verified resume without a redirect loop and preserving existing server settings and installed protection. Repository tests cover project/user isolation, stalled/unreadable/incompatible storage and write retirement. Android debug assembly and the production web export passed. No physical-device or hosted settings-database acceptance was performed.
