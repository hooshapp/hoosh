# Suggested plan chart — implementation checkpoint

Source: Figma App-UI `10769:238`, read November 24, 2026.

## Exact chart policy

Use the average of seven completed consecutive local days of **combined selected-app** usage. Match the nearest baseline row; exact ties select the higher row. One daily budget is shared across all selected apps, never multiplied by the number of apps.

| Baseline hours/day | Sessions/day | Minutes/session | Shared minutes/day |
| --- | --- | --- | --- |
| 2 | 5 | 5 | 25 |
| 3 | 6 | 10 | 60 |
| 5 | 8 | 15 | 120 |
| 10 | 10 | 20 | 200 |
| 12 | 12 | 20 | 240 |
| 15 | 14 | 25 | 350 |
| 18 | 15 | 30 | 450 |
| 20 | 16 | 30 | 480 |

These are the chart’s example starting limits, not clinical guidance or an automatically approved gradual-reduction schedule. Later reductions need user agreement. For low baselines, nearest-row selection can yield a 25-minute budget greater than observed usage; the policy result flags that edge case instead of hiding it.

## Connected implementation

- Android reads aggregate usage for the actual saved target selection and verified owner without starting, resetting or syncing History. Seven complete local days are preferred; only a complete yesterday can be used as the labeled fallback. Missing data is never zero-filled.
- iPhone presents Apple's selected-app DeviceActivityReport inside a native review sheet. The user explicitly enters the displayed period total (seven completed days or yesterday). Only that user-confirmed number returns to Hoosh; protected report internals are not exported. A blank/incomplete report must use manual setup. This is not automatic raw usage-data access.
- The loading animation remains a six-second minimum. An unavailable baseline leads to review/retry/manual setup, never a generic starter template claimed as usage personalization. Suggestions show source, period, average, shared sessions and daily minutes; low-baseline increases are flagged.
- Accept rechecks the saved app selection and completed-day boundary. Returning from manual editing preserves the original suggestion. Raw baseline history stays local and ephemeral; only the reviewed plan is saved to account settings.
- PlanDraft now carries optional `budget_scope: all_selected_apps`. Legacy plans without that field retain per-app behavior. API validation, generated contracts, account readback, local progress, editors and native schedule/quest policies preserve the explicit scope.
- Migration `20261124_0008` adds the storage constraint; the local QA database was upgraded and the running local API restarted. Shared save/readback and invalid-scope rejection were tested in a rolled-back transaction. Production/team databases need the migration before this contract is deployed.
- Both native ledgers persist a shared daily counter and reuse a live session's original deadlines across selected apps. Switching apps cannot create a fresh session or multiply the allowance. Exhaustion blocks new shared sessions. Existing per-app plans retain their behavior and consumed allowances are retained when changing scope.
- Android exhaustion no longer follows the action-failure path that disables protection. It keeps the pause and explains the completed allowance.
- Native capability checks prevent onboarding from suggesting a shared plan on an older per-app-only build. iOS activation remains gated pending the previously deferred physical expiry proof.

## Verification checkpoint

Passed: 689 mobile unit tests, 58 API contract/migration-tool tests, 119 Android native engine checks, focused onboarding component tests on both platforms (including measured shared-plan acceptance), Apple report UI SDK type-check, local database migration and shared-budget roundtrip/rejection. Six Swift native core check programs and the expanded session ledger checks pass. Full component regression passed 142 suites; its two outdated missing-baseline fixture cases were updated to supply real-contract aggregate input, and the entire affected 96-test suite passed on both platforms. The signed iOS release build and packaging/signature/entitlement inspection passed. The final Android release rebuild and device installations are recorded below.

Physical checks still required: report availability/completeness, permission changes, native picker, selected-app switching, elapsed expiry while a target app stays foreground, force-quit/relaunch, reboot, day rollover/DST and account isolation on each OS. Build/model tests do not certify these OS behaviors. Do not clear pilot/user data or enable the iOS activation gate based only on these checks.

Primary references:
- [Apple DeviceActivityReport](https://developer.apple.com/documentation/deviceactivity/deviceactivityreport)
- [Apple approvedWithDataAccess availability](https://developer.apple.com/documentation/familycontrols/authorizationstatus/approvedwithdataaccess)
- [Android UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager)

The backend schema and native budget implementation changed as described above. Developer-account capabilities, entitlements and data-sharing permissions were not expanded. The manual-plan option and existing iOS activation gate remain available/unchanged.


## Final build / installation handoff

- Signed iPhone Release build passed. Packaging inspection verified the main app and all four extension signatures/provisioning; Family Controls, App Group and Sign in with Apple capabilities were retained where applicable.
- Installed over the existing app on the paired iPhone without uninstalling or clearing data. Remote launch failed with CoreDevice remote-service error 4000; the owner can open Hoosh manually. Installation success is not a verified report or protection journey.
- Final Android standalone Release rebuild passed (including the exhaustion-message fix). Hermes/assets, signature, native registration and alignment checks passed. This is an internally signed QA APK, not store-release certification.
- Mobile unit count is now 690 (the final added shared-schedule Apply/readback test passed within its 27-test suite). All six Swift core regression programs and additional shared midnight/reboot/rollback/session serialization checks pass. API contract/migration tests: 58 passed. Android engine: 119 cases. Full component coverage: 142 suites passed initially; all 96 tests in the affected suite passed after updating its two obsolete baseline fixtures.
- Local API is running the new shared-budget contract; local database is at `20261124_0008`. Deploy that migration before deploying this contract to a teammate/hosted database.

### Focused physical acceptance (do not repeat unrelated sign-in checks)

1. Open the updated Hoosh app. Restart questionnaires only when ready to replay onboarding; existing account plans are not silently replaced.
2. Choose the actual target apps in the native picker and complete hobbies. Verify the complete six-second ring transition.
3. On iPhone choose **Review usage report**. Check that the displayed apps/period match your selection. Prefer seven completed days; use Yesterday only if the full report is unavailable. Enter the displayed TOTAL hours/minutes. A blank/incomplete report must cancel to manual setup.
4. On Android check whether complete seven-day or yesterday usage is available. If unavailable, retry or use manual setup; there must be no fabricated personalized suggestion.
5. Verify the suggestion's baseline source/period, average and chart row. Its daily budget is shared, not multiplied by the number of apps. Accept, then confirm account save/readback and manual edit/Back behavior.
6. Native enforcement remains a separate physical check: Android app switching must keep the same session deadline and exhausted allowance must retain protection. For iPhone keep activation gated until the planned elapsed-expiry test on a physical device is completed and recorded. Reboot, day rollover, permission revocation and account switching remain physical acceptance items.

Suggested commit: `feat: connect usage-based shared onboarding plan budgets`.
