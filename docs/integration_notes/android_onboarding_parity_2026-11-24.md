# Android handoff after Anisha’s iPhone onboarding test

Date: November 24, 2026. Branch: `integration/shared-product`.

This records fixes brought into Android from the iPhone test, plus Android-specific work. It is not a physical Android pass. Ishmum’s ordered execution guide is [Physical Android](../qa/physical-device/android.md); preserve its A00–A07 case IDs and record results against the exact APK/commit.

## Changes now in the shared/Android source

| Area | Expected behavior | Evidence boundary |
| --- | --- | --- |
| Intro | Three separate swipes progressively fill the arrow and bottom bar. Continue appears only after completion; completed instruction disappears. | Same shared intro component; earlier iPhone owner acceptance does not prove Android touch feel. |
| First-account routing | Confirmed fresh account starts questionnaires, existing completed account resumes normally. | Shared routing/component checks; fresh Android email/provider callback still needs phone acceptance. |
| Avatar/age | Required Male/Female/Other avatar, explicit age 18–80, no signup age field. | Answers are account-scoped local onboarding progress, not a claim of cross-device demographic sync. |
| App question | Android now uses the installed-app picker through its real selection transaction; the old fixed social-app list is removed from native onboarding. Permission and picker are in this question, without a Hoosh Settings detour. | Android Usage Access opens Android system settings; OS labels differ from Apple. A system permission handoff cannot be replaced by a fake in-app approval. |
| Permission/selection | Read actual authorization on return. Existing permission is retained, not requested again. Cancel/empty/unconfirmed picker saves cannot enable Next. Successful selection is committed and read back with revision/count. | Saved apps are actual device targets, not just questionnaire labels. No protection starts from choosing them. |
| Hobbies/navigation | Required hobby/custom activity, full-width Continue/Next above Back, no narrow wrapped Back button. | Same shared layout and persistence. Check real Android font size/keyboard/Back. |
| Duplicate step | Hobbies proceeds directly to loading; no second questionnaire permission page. | Android’s later Accessibility/disclosure check remains necessary for protection, distinct from Usage Access. Already approved permission-request buttons are hidden there. |
| Loading | Six-second minimum: clockwise ring fill and completed hold; only then show plan options. Reduced animation preserves the wait while suppressing motion. | Shared timing/cancellation/Reduce Motion tests. Physical Android appearance still pending. No live AI-generation claim. |
| Plan options | Suggested plan plus Set up on my own. Manual days/hours/overnight/session controls validate before Save. Plan acceptance saves with existing revision/conflict/uncertain-write handling, without another ordinary Save-to-account page. | Suggestion is the existing starting schedule, not a trained AI model or measured savings. |
| Device/protection | Keep app selection already made; no mandatory repeat selection. Review outstanding Accessibility requirement, explicitly Preview/Apply when testing protection. | Permission, saved account plan and installed protection are different states. Do not infer actual enforcement from a successful save. |
| Restart | Settings → Restart questionnaires → confirm replaces only current account’s local answers. It can start offline; actual account-plan writes still require verified API access. | Does not delete auth, account plan/history, native restrictions or system permissions. |
| Home/Settings/History | Shared grouped dashboard, compact profile editor, Screen Time/device route, maintenance disclosures and saved quest presentation remain shared with Android. | Shared component suite; physical TalkBack and complete visual acceptance remain open. |
| Isolation | New picker work uses the verified native account owner and releases its draft. Logout/unmount fences late UI/save callbacks. | Existing device-owner claim/stop-review logic is preserved; never silently take over another account’s installed protection. |

## Ishmum: shortest useful device pass

1. Follow A00: identify package/signature/APK hash, preserve data on update, verify the API is reachable. Internal APK uses local test signing, not Play Store signing; do not uninstall to hide a signature mismatch.
2. Use a fresh approved account, or explicitly restart only the signed-in test account’s questionnaires. Retained Usage Access is expected on repeat runs.
3. Follow gender → age → target apps. Deny Usage Access once and return: it must stay denied. Then grant through Hoosh’s handoff, return, cancel the app picker once, reopen and select two installed test apps. Next must require confirmed choices.
4. Choose hobbies. Continue must be above Back. Observe loading for at least six seconds, full circle with normal animation settings, then the suggested plan. There must be no duplicate questionnaire Screen Time page.
5. Exercise Set up on my own; invalid times must block Save, an overnight schedule must be explicit, edits must survive accordion changes. Save to the account once; recover conflicts/uncertain saves explicitly.
6. In Android device review, verify target count retained and already approved Usage Access not re-requested. Accessibility remains a separate explicit disclosure/system-service action. Save/permission alone must not block apps.
7. Continue the existing A04–A07 checks: actual target intervention/expiry, daily cap, overlap/scoped Stop, offline/background/force-stop/reboot, A/B isolation and TalkBack. These cannot be inherited from iPhone or passed by component tests.

## Validation status

- Targeted questionnaire/permission/restart/loading/manual-plan/normal-app tests: 154 passed across iOS and Android projects before the final full-suite run.
- TypeScript: passed. Artwork validation: passed (71 original SVGs, 59 integration assets, 31 plan assets).
- Lint, full component suite, packaged Android build and emulator observations: append actual final results below; do not interpret a blank entry as a pass.
- Physical Android: NOT RUN in this handoff. Ishmum records phone evidence using the existing run template.

### Final source regression results

- Full iOS + Android component suite: **143 suites passed; 1,057 tests passed; 2 existing skips**.
- Unit suite: **664 passed**.
- TypeScript passed; lint passed with zero errors and four existing warnings.
- The actual Android permission/picker component is exercised with Android ports, including denied system-settings return, actual grant readback, confirmed save and canceled picker. Normal-app integration covers both suggested/manual plan paths through explicit Android protection review/Apply.
- The platform differences above are intentional: Android uses Usage Access plus a separate Accessibility disclosure/service for protection. Apple Family Controls is not an Android API. No permission or Apply success is fabricated to make the flow match visually.

Build configuration: the internal developer APK uses localhost port 8000. The emulator/USB test therefore needs the owned host API plus `adb -s <device> reverse tcp:8000 tcp:8000`; an unplugged phone needs a separately reviewed reachable HTTPS configuration and rebuild. No provider secrets belong in the app or handoff.

### Packaged Android/emulator results

The ARM64 normal Release/internal APK built successfully. Embedded Hermes/assets/fonts, native protection registration, signature and 16KB alignment checks passed. Installed over the existing Hoosh_Verify_C04 emulator app without clearing data, then launched without Metro. The retained signed-in test session resumed questionnaires; this is not a new email/provider signup pass.

Observed in the actual packaged app: avatar/age input; target picker Cancel leaving Next disabled; confirmation and native readback of two test apps; hobbies with full-width Continue above Back; direct transition to suggestion without a duplicate questionnaire permission page; and the manual option. Cold-launch screenshots show the loading circle partially filled, completely filled, then the suggestion. The exact six-second minimum is unit-tested; screenshot sampling is visual evidence, not an exact stopwatch measurement. No account plan was saved and no protection was applied in this emulator check. Existing Usage Access was retained, so physical deny/grant/revoke remains in Ishmum’s guide.

APK (ignored build output): `apps/mobile/android/app/build/outputs/standalone/disconnect-standalone.apk`. Internal test signature only; local API/USB reverse configuration as above.

Sanitized receipt: [Android parity evidence](artifacts/verify-android-onboarding-parity-2026-11-24.json). Screenshots remain ignored locally in `.native-dev/qa/android-onboarding-parity/`. Physical Android A03–A07 observations are still required. These changes are in the working tree of integration/shared-product and must be committed/pushed before Ishmum can pull them; they have not been pushed by the agent.
