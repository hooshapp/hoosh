# Legacy DisconnectApp import: native source audit

Read-only audit of `/Users/anishadasgupta/Desktop/DisconnectApp`, branch `pre-main`, HEAD `a5fb309dc3728427d756bac4088524aa38f158ca`. README contains only the project title; no nested instruction files found. Only tracked dirty file is `DisconnectApp.xcodeproj/xcuserdata/anishadasgupta.xcuserdatad/xcschemes/xcschememanagement.plist`; exclude all userstate. No source changes, branch switches, builds, deployments, application launches, permission prompts or live cloud calls occurred.

## Import shape and identity invariants

Importing the complete tracked source snapshot under `apps/mobile/ios/` while retaining relative paths is structurally appropriate. Xcode project has **7 targets** and file-system-synchronized groups rooted beside the `.xcodeproj`; no absolute user path/project root or external local file reference was found. `projectDirPath` and `projectRoot` are empty. Do not cherry-pick only the three extensions: host-side stores, models and extension-local mirrored decoders depend on common key/format conventions.

Preserve these source folders together:

- `DisconnectApp/`: SwiftUI host, FamilyControls picker/authorization, shared-state stores, native shield control, contextual nudges, metrics/history, Firebase integration and app assets.
- `Disconnect/`: DeviceActivity report extension (`Disconnect.swift`, TotalActivityReport/View, plist, entitlement file).
- `DisconnectDeviceActivityMonitorExtension/`: native monitoring callbacks, relock/reminder behavior, mirrored shared state.
- `DisconnectShieldConfigurationExtension/`: actual native shield rendering and cached-context lookup.
- `DisconnectShieldActionExtension/`: quit/bypass actions, monitor scheduling and history writing.
- `DisconnectAppTests/`, `DisconnectAppUITests/`: preserve existing tests, but they are largely launch/template tests.
- `DisconnectApp.xcodeproj/project.pbxproj`, workspace self-reference and **tracked `project.xcworkspace/xcshareddata/swiftpm/Package.resolved`**. Source `.gitignore` broadly ignores `project.xcworkspace/`; don't accidentally drop these tracked reproducibility files when filtering copied paths.
- `scripts/verify_shield_bundle.sh`: retain as an existing signed-bundle validation helper. `functions/` and Firebase configuration are existing backend support, not part of the RN/FastAPI runtime.

Keep `xcuserdata`, `.xcuserstate`, caches/builds/DerivedData, `functions/node_modules`, ignored `DisconnectApp/Secrets.plist`, credentials, nested `.git`, provisioning/certificates and user-generated state out. Separate audit of tracked service config may choose a local template/omission; do not print its values. `FirebaseApp.configure()` expects its local configuration, so removing that file must be documented as a build/runtime setup requirement rather than pretending a cloud-ready standalone import.

Non-secret source identifiers that must remain unchanged for any later existing-user migration:

| Item | Existing value |
|---|---|
| Host bundle ID | `com.AnishaDasgupta.DisconnectApp` |
| App Group | `group.com.AnishaDasgupta.DisconnectApp` |
| Report extension ID | `com.AnishaDasgupta.DisconnectApp.Disconnect` |
| Shield config extension ID | `com.AnishaDasgupta.DisconnectApp.DisconnectShieldConfigurationExtension` |
| Shield action extension ID | `com.AnishaDasgupta.DisconnectApp.DisconnectShieldActionExtension` |
| Monitor extension ID | `com.AnishaDasgupta.DisconnectApp.DisconnectDeviceActivityMonitorExtension` |
| Development team in project | `KBW8M9TJN2` |
| Host source version/build | `1.0.1` / `6` |
| Host+extension deployment target | iOS16; test/project defaults still18.5 |

Both Debug and Release preserve the same production IDs, entitlements and AI endpoint setting (`project.pbxproj:765–829`). This is configuration evidence; distribution entitlement approval, current provisioning, App Store release and runtime success were **not** independently verified.

Host embeds report extension in ExtensionKit Extensions and shield-config/action/monitor in PlugIns, with target dependencies (`project.pbxproj:65–88,271–301`). Host, shield-config/action and monitor entitlement files declare FamilyControls and the App Group; report entitlement file is currently empty. Preserve the latter as existing source and record signed-device/report feasibility for follow-up, rather than silently adding capabilities during import.

SPM dependencies on the host: FirebaseAnalytics, FirebaseAuth, FirebaseFirestore (firebase-ios-sdk12.13.0) and MacPaw OpenAI0.4.9; lockfile includes16 resolved package pins. Current AIService uses URLSession backend calls, not a direct imported OpenAI client. Preserve dependency metadata during archival import; removal/refactoring is separate work.

## Reusable native architecture

1. **Authorization and selection**: `ScreenTimeAuthorizationService.swift:27–39` requests `.individual` FamilyControls authorization and refreshes OS status. `AppSelectionView.swift:125–177` presents real FamilyActivityPicker after authorization, requires at least one app/category/domain before continuing. `AppSelectionStore.swift:11–39` serializes FamilyActivitySelection with PropertyListEncoder into App Group defaults under `familyActivitySelection`, with legacy standard-default read fallback. Opaque selection remains local.
2. **State shared across processes**: `OnboardingResponseStore.swift:107–153` owns App Group constant, JSON `onboardingResponses`, `shieldBypassUntil`, local `onboardingCompleted`; options5–60min. ProductivityContextSnapshot and AIGeneratedNudgePack also use App Group JSON. Extensions mirror response/cache/selection structures locally, so file independence does not mean their schemas can change independently.
3. **Host protection**: `ShieldStoreController.swift:12–90` sets application/category/web-domain shields; persists bypass; schedules OS monitor + notification reminders + host DispatchQueue reapply fallback. `refreshShieldStateAfterInstallOrRun` reapplies source selection. `DisconnectAppApp.swift:13–18,43–47` initializes Firebase/reminders/shields on launch and ends bypass+refreshes context when scene becomes active.
4. **Shield UI**: `ShieldConfigurationExtension.swift:31–71` constructs system ShieldConfiguration with selected question, contextual nudge, bounded text, close and temporary-open actions. Actual source is a native supported shield, not the new Figma's arbitrary RN/typewriter layout. Source UI/artwork differ from current Figma and remain legacy reference only.
5. **Quit/bypass actions**: `ShieldActionExtension.swift:25–67` primary cancels reminders/bypass/monitor, records focus and returns `.close`; secondary persists bypass, records open-anyway/attempt, schedules relock+usage monitors, clears shields and returns `.defer`. Bypass clamps5–60min and defaults5, not Figma10min (`91–99`). Scheduler has one-shot relock window starting about2s before duration and threshold monitoring; separate per-minute usage thresholds generate reminders (`161–244`).
6. **Native monitor**: `DeviceActivityMonitorExtension.swift:12–71` re-shields on relevant interval start/end or bypass limit, posts immediate usage-triggered notifications and re-shields at final minute. OS extension callbacks do not depend on RN/JS/server. Preserve callback names, DeviceActivityName/Event strings, App Group and token serialization.
7. **Notifications**: host `BreakReminderScheduler.swift:34–67` schedules time-based local notifications with `I'm done` foreground action. Extension schedule paths differ: action's `scheduleBreakReminders` registers/cancels only while actual usage notifications come from monitor thresholds. Do not collapse these separate mechanisms when wrapping them.
8. **Reporting/history**: DeviceActivity report sums actual `totalActivityDuration` for report UI (`Disconnect/TotalActivityReport.swift:25–36`). Separate intervention history is App Group PropertyList data, written in shield action, retaining only50 newest events (`ShieldActionExtension.swift:723–758`) and read by host store. No transactional backend outbox/reward ledger or revisioned reason coordinator is implemented by this snapshot.

## Existing AI, Calendar/Reminders and identity — qualify Hoosh assumptions

**AI source already exists**. `AIService.swift:10–24,110–131` POSTs onboarding responses+ProductivityContextSnapshot to configured AI_NUDGE_ENDPOINT,12s timeout, decodes a generated pack and caches it. Missing endpoint/network/server/unhelpful pack falls back to deterministic local pack. `AIGeneratedNudgeStore.swift:19–42` caches in App Group. Shield-config prefers cached shield prompt (`ShieldConfigurationExtension.swift:258–263`); host and shield-action reminder engines read cached packs. Monitor has its own deterministic reminder path. `generateNudge(for:screenTimeData:)` is separately a legacy simulation (`AIService.swift:6–7`); do not confuse it with the real backend request path.

`functions/index.js:6–69` contains an actual Firebase v2 HTTPS `generateNudgePack` handler calling OpenAI Chat Completions with a server-managed secret, JSON output and normalized pack. Host Debug+Release have endpoint setting. This proves an implementation path exists; deployment health, quota, model success, billing and currently delivered messages remain unverified. Do not deploy or migrate it during import. The handler's source has open CORS and no request identity/rate-limit check before generation; importing it doesn't approve it for the new service architecture.

**Apple Calendar and Reminders integration already exists**. `AppleProductivityContextService.swift:18–77,88–128` requests EventKit access, finds next event within36h and next incomplete reminder, prioritizes near-term items, persists short contextual snapshot and refreshes cached nudge pack. Source UI wires permission actions (`ContentView.swift:1149,1160,2616,2628`) and foreground refresh. This is on-device EventKit integration; it is not Google Calendar OAuth/cloud synchronization or new RN Settings integration. Permission/runtime data/privacy behavior weren't exercised.

**Legacy identity is Firebase, not Supabase**. App launch configures Firebase (`DisconnectAppApp.swift:15`). `DatabaseService.swift:68–130,209–219` records install-scoped analytics/profile using Firebase anonymous auth, Firestore and FirebaseAnalytics, while only sending selected-item counts instead of raw selection tokens. `AuthService.swift:8–27` contains an older email sign-in-then-create-on-any-error helper, called from a separate older demo OnboardingView with synthetic test inputs. Current root instead branches on local onboardingCompleted (`ContentView.swift:6–20`) and does not guard the main app using Supabase or that email-auth helper. Preserve this historical source without adopting its auth model or executing it.

**Metrics are not directly reusable as measured savings**. `SharedInterventionHistory.recordStayedFocused` assigns bypassMinutes as savedMinutes for a quit action (`ShieldActionExtension.swift:723–725`); `DashboardMetrics.swift:63–105,129–135` sums that estimate and calculates rates. This is not observed reduction in OS usage. Hoosh PRD's no fabricated/measured-savings rule remains necessary. Current SwiftUI has Stats/History/Feedback/Settings (`ContentView.swift:1817–1851`), not new Figma Home/Quests/History/Settings.

## Later RN integration must retain these gaps explicitly

- Existing default unnamed ManagedSettingsStore writers **clear all shields for bypass** (`ShieldStoreController.swift:56–69`, `ShieldActionExtension.swift:63–76`). There is no union-of-reasons coordinator or quest precedence. Import as legacy; do not claim it implements Hoosh's overlapping-rule contract.
- No approved new session/day accounting, revisioned plan install, native account ownership, Supabase migration, server reward ledger, event idempotency/outbox, new Figma quests/Dino/credit policy or measured History source is established by copying.
- Host uses delayed native-process reapply as a fallback in addition to OS monitors. Source presence alone does not re-prove termination/reboot/timezone behavior. Current signing/device test gate survives import.
- Context caches/preferences/history use shared UserDefaults with `.standard` fallback; source audit isn't a guarantee of group availability, atomic cross-process behavior or corruption recovery. Wrapping should preserve old data keys while planning schema/account ownership deliberately.
- Existing app/domain logging includes public application/domain names. This is legacy implementation detail to revisit for Hoosh privacy policy; no live logs were read.
- Current automated Swift test files are templates/basic launch/performance/screenshots, not the required protection/account-race regression suite. Do not overstate coverage.

## Structural validation performed / repeat after copy

Performed without builds or cloud access:

- Parsed OpenStep `project.pbxproj` with system plutil JSON conversion: **pass,7 native targets**.
- Checked all synchronized-group directories and all CODE_SIGN_ENTITLEMENTS/INFOPLIST_FILE relative paths: **pass**.
- Parsed10 tracked non-userstate plist/entitlement files (values not emitted for service config): **pass**.
- Workspace `self:` reference present; tracked source contains no symlinks; no absolute local source references found.
- `bash -n scripts/verify_shield_bundle.sh`: **pass**. Did not run it against a bundle or invoke codesign.
- Inspected source/manifest/lock metadata only; no package resolution or Xcode build performed.

After import, parent should verify byte hashes of copied source against source commit for allowed files, identical relative path layout,7 targets and referenced files, both recipient branches containing the same import commit/files, and source checkout unchanged including its preexisting xcuserdata modification. Preserve source commit provenance and exclusions in import README. This completes source-transfer readiness; it does not complete RN adapter integration or signed-device acceptance.


## Import record

Preserved the user-selected location `apps/mobile/ios` from main commit `fe8f262` and landing-page commit `6a044a0`. Source/configuration identity is unchanged. See `import-manifest.json` for hashes of all retained source and support files. Existing Firebase client configuration is versioned source, not a service-account/private credential. No Firebase call, deploy, signing change, React Native bridge or native build was performed by the import.
