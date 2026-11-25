# Shared Hoosh iOS — packaged acceptance

This runbook belongs to INT-IOS-C06 / INT-VERIFY-C05. Packaging checks do not
accept Screen Time behavior or authorize installation over the Swift pilot.
The existing host bundle ID is intentionally preserved; the display name is Hoosh.

## Current gates

- C06 originally deferred physical testing. On November 24 the owner requested the selected-app blocking journey. Normal builds remain compiled off; a dedicated device acceptance build uses `HOOSH_PHYSICAL_NUDGE_QA` across the host module and enforcing extensions. This flag enables the existing explicit Apply action; it does not mark device acceptance passed.
- After the owner signed into Xcode, the device Release build and actual signed
  product inspection passed. Host Apple sign-in and enforcing host/extensions
  Family Controls/App Group provisioning are verified in the
  [device receipt](../integration_notes/artifacts/ios-c06-device-product.json).
  This is packaging evidence, not an installed or accepted physical journey.
  Do not remove entitlements to bypass signing.
- C05 has allowance-consumption transport; confirmed quit and complete-day coverage
  producers are not accepted. Missing events are not successful days or rewards.
- iPhone aggregate History remains unavailable; do not display the Android account
  series as iPhone measurements or export native report internals.
- Current local API configuration uses loopback. A physical phone needs a reachable
  configured API endpoint; loopback resolves to the phone. Configure a trusted
  development endpoint privately before rebuilding the device product. Presence
  checks are not connectivity, correct-project or real-account proof.
- Review actual target signing and profiles before any device build/install. Never
  change bundle IDs/App Groups or overwrite the installed pilot as a shortcut.

## C06 closeout checklist

Current checkpoint: November22, source `ed263cc` plus the short-swipe repair delta. **C06 is not complete.**
The iOS plan has C01–C06; it has no C07. Its next named handoff is VERIFY-C05,
within combined-app verification. Do not label the simulator package or the
compiled-off protection path as accepted native enforcement.

| C06 requirement | Current evidence | Still required |
|---|---|---|
| 1. Signed normal-app protection journey | Real RN host, real-authenticated simulator/local API save; device Release provisioning inspected | Spare iPhone: picker Save, authorization, Apply, intervention, temporary-access expiry, Stop/readback |
| 2. Embedded build and lifecycle | Embedded Hermes startup without Metro; simulator terminate/relaunch and API service outage/recovery | Native foreground/background/host termination, lock/unlock, revoke/regrant, offline/reconnect, reboot and schedule/day boundaries |
| 3. Account/device ownership | Observed A→distinct B account/setup separation, A local draft retained | B writes and return-to-A; explicit native device claim, stale callbacks, retained rules and events across transition |
| 4. Product inspection | Simulator package and device development signing inspected; current simulator JS/source hashes matched | Reinspect the exact final phone product after reachable API configuration and any later source changes; distribution approval remains separate |
| 5. Size/text/keyboard/accessibility | Large-text navigation repair verified; standard Home overflow repaired; compact SE public-auth validation/navigation/keyboard pass; responder short-swipe repair passes injected RN handler tests | Compact authenticated pages/native picker, full scrolling/footer reachability, physical intro feel and basic accessibility journey |
| 6. Evidence and handoff | Sanitized receipts, source hashes and simulator notes recorded | Physical results, capability/core gates reconciled and exact-build VERIFY-C05 handoff |

No need to repeat already-passed package checks for every documentation commit.
Use the existing isolated QA simulators; preserve the signed-in Release QA account.
The new **Hoosh C06 Compact QA** is signed out with default text restored. Its
local synthetic test state was reset by reinstalling the app, and it is now at the
fresh intro for the manual swipe check; the owner subsequently reported success.
Physical feel remains pending. The original Release QA/B session
was not changed; only Compact QA has the latest short-swipe package.
No hosted account was created, password/reset email sent or physical phone changed
in the compact continuation. Manual provider/confirmation checks require private
user interaction; do not read stored credentials or fabricate a session.

## Produce a simulator Release product

From the repository root, with installed Pods and pinned packages:

```sh
xcodebuild -workspace apps/mobile/ios/DisconnectApp.xcworkspace \
  -scheme DisconnectApp -configuration Release -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=Hoosh Shared Host C01' \
  -derivedDataPath .native-dev/ios-shared-derived \
  -disableAutomaticPackageResolution -onlyUsePackageVersionsFromResolvedFile \
  CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO ONLY_ACTIVE_ARCH=YES build \
  > /tmp/hoosh-ios-c06-release.log 2>&1

python3 scripts/inspect-ios-product.py \
  .native-dev/ios-shared-derived/Build/Products/Release-iphonesimulator/DisconnectApp.app \
  --output .native-dev/qa/ios-c06/simulator-product.json
```

The host's existing bundle phase resolves Expo Router and uses `export:embed` in
Release. Debug intentionally skips bundling. Inspection checks the actual product:
Hoosh identity/callback/scene, embedded JS, native module registration, absent
preview/pilot configuration, four expected extensions, signatures and available
entitlements. It reports JS/product hashes and whether the JS is Hermes bytecode.
Simulator signing is not device provisioning. No simulator is installed/launched
by these commands, no Metro process is stopped and no test account is changed.

`python3 -m unittest discover -s scripts -p test_inspect_ios_product.py` runs the
inspector fault fixtures. These mocks are not evidence of an Apple signature.

## Inspect an actual device product when available

Use the correct existing signing setup to build/archive the normal **Release**
host. Do not use simulator ad-hoc signing overrides for a phone. Do not enable
activation simply to pass packaging. With the existing developer account signed
into Xcode, the local build command is:

```sh
xcodebuild -workspace apps/mobile/ios/DisconnectApp.xcworkspace \
  -scheme DisconnectApp -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath .native-dev/ios-shared-derived \
  -disableAutomaticPackageResolution -onlyUsePackageVersionsFromResolvedFile \
  -allowProvisioningUpdates build \
  > /tmp/hoosh-ios-c06-device-build.log 2>&1
```

This may refresh profiles for existing capabilities; it does not install the app.
Inspect the built device .app:

```sh
python3 scripts/inspect-ios-product.py /absolute/path/to/DisconnectApp.app \
  --require-device --output .native-dev/qa/ios-c06/device-product.json
```

This additionally rejects simulator products and checks expiration, matching
profile/application identifiers and teams, provisioned App Groups/Family Controls
for the enforcing host/extensions and Apple sign-in for the host. The unused
report extension is inspected, but is not a supported aggregate backend producer.
Profile contents, device IDs and secrets are not copied into the report. Packaging
success still does not establish store entitlement approval or a physical journey.

## Physical journey — pending, owner installation consent required

Record build/SHA/hashes, iPhone model/iOS and pass/fail/pending for each row. Use
private disposable accounts A/B and owned test target apps. Before installation,
identify whether the same bundle ID would replace the Swift pilot, preserve its
required data and obtain the owner's installation decision. Do not uninstall it.

1. Launch with embedded JS and Metro unavailable. Confirm normal Auth/onboarding,
   sign-in and callback routing, not anonymous enrollment or a QA host.
2. Verify picker Save/Cancel and actual permission allow/deny/revoke/regrant.
   Saved backend draft, permission and installed protection must stay distinct.
3. Resolve the deferred elapsed-expiry feasibility test before enabling activation.
   Then explicitly review/Apply a test plan; compare native readback with the
   reviewed revision/selection. Verify actual intervention and allowance expiry
   while the target app remains foreground, weekly/quest overlaps and scoped Stop.
4. Repeat background, host termination, lock/unlock, offline/reconnect, reboot,
   scheduled/day/timezone boundaries and pending-install recovery. Device events
   must work independently of JS/network and retry under the same IDs.
5. A logout retains A rules/journal. B sees no A selections/events and cannot ACK
   them. Test explicit device claim, late A callbacks and A return with separate
   evidence. Do not reinterpret pilot telemetry as shared account receipts.
6. Confirm unknown quit/day coverage earns no invented credit/streak and iPhone
   History stays explicitly unavailable. Verify the real server upload/ACK path
   for supported allowance receipts and lost-response retry without duplicate effects.
7. Check ordinary keyboard/touch/large text, smaller/larger supported iPhones and
   native picker/status. TalkBack remains separately deferred.

Update Plan04 C06 and VERIFY-C05 only with observed results. A gated build cannot
pass Apply/expiry rows; packaging preparation does not close C04/C05/C06 acceptance.
Keep sanitized evidence in integration notes; binaries, profiles, credentials and
private account fixtures remain ignored local files.

## November 24 nudge implementation

- Reused the native selection tokens, transactional Apply/readback, allowance ledger and expiry callbacks. No onboarding or saved-plan reset.
- Figma references: opening `10514:168`, session ended `65:91`, reminder `76:69`. Dino source is the Figma opening-frame SVG, rendered as a transparent PNG. Android uses the existing Space Grotesk font assets.
- iOS uses Apple's supported shield configuration: warm background, Dino, actual application name, opening/expiry copy, real session count, Quit Now and configured temporary allowance. Apple owns the shield typography/layout. Quit does not advertise credits because a verified quit producer is still missing.
- iOS standard local reminders are scheduled at quarter-session boundaries, bounded by the active protection window, and reconciled after allowance/runtime changes. They measure elapsed allowance time, not feed scrolling. Notification permission, Focus settings and OS delivery affect presentation. The full custom Figma recommendation card and Accept/Skip actions are not implemented on iOS.
- Android retains foreground-package-only Accessibility enforcement, verified Home action rewards, and persisted allowance behavior. Its overlay now uses the Figma colors, Dino, font and opening/expiry text reveal. No screen contents are inspected.
- Required physical acceptance remains: Apply during an active window, selected-app launch, Quit, temporary allowance, expiry while the target stays open, reminders, Stop, nonselected apps, revoke/regrant and restart. Build/engine tests do not prove these OS behaviors.
- Do not install a normal gated build over an active QA installation before stopping its protection. Do not enable the release gate until the physical results are recorded.

Device build and package inspection passed on November 24; the dedicated nudge QA build was installed over the existing app on Anisha. Launch was denied because the phone was locked. No selected-app intervention, reminder delivery, expiry, or Stop behavior has been observed for this build yet. Native adapter/transaction/clock checks and 119 Android engine JVM cases passed; these remain separate from OS acceptance.

The Android standalone release build also passed after the native overlay changes, including packaged Dino, Space Grotesk fonts and font license. No Android device intervention has been observed for this build.

### Physical activation investigation

The owner reported target apps opening normally, Settings showing no installed plan, and Apply returning unconfirmed. A sanitized on-device receipt confirmed permission granted and selection saved, but `clockAvailable=false`, no installed schedule and zero monitors. The UUID boot sysctl was replaced with the public Darwin boot-time MIB, while retaining continuous elapsed deadlines. The shared-budget sentinel is also excluded from application-token identity decoding.

Accepting the suggested or manual onboarding plan now installs that exact saved plan and checks native readback before the existing completion screen. An uncertain activation stays on the existing suggestion screen; no extra page or automatic replay is added. Focused activation/client tests (32), onboarding component tests on both platforms (16), TypeScript and changed-file lint passed. Host clock checks passed; the updated phone build still needs device readback and selected-app acceptance.

After installing the clock fix, the actual iPhone receipt reports `clockAvailable=true`, authorization granted and selection present. There is still no installed schedule until the owner retries Apply; shield behavior is not yet accepted. The new signed product passed package inspection.

The owner then confirmed Apply succeeded; the phone receipt independently showed an enabled installation, one active reason and one registered monitor. Opening a target produced a generic Restricted screen. Device process inspection confirmed the monitor, shield configuration and shield action extensions were launched. Rendering was changed to avoid recurrence projection, DeviceActivity readback, boot sampling and blocking/mutating store locks. A read-only atomic snapshot path was added, with a writer-lock contention regression check. The new presentation still requires phone acceptance.

The optimized shield build passed signed product inspection and was installed on Anisha. The owner reopened a selected app and confirmed the cream Hoosh screen with Dino. A post-install phone receipt confirmed authorization, available clock, enabled installation, one active reason and one monitor, with no pending change. Custom shield presentation is physically observed; temporary allowance, timed reblock and reminders remain pending.

The owner confirmed the Dino shield, then reported Open anyway returned to the Home Screen. The secondary-action failure path previously returned `.close`; it now retains the shield with `.defer` on an unconfirmed allowance. A sanitized QA failure code and allowance/grant counts were added for physical diagnosis. No allowance success or expiry is claimed from the screen-only pass.

The subsequent phone receipt reported `grant:unavailable`, zero sessions and zero grants. Preflight was requiring AuthorizationCenter status in the action extension. The driver now requires that host permission status in the host; extension actions use their claimed installation/OS token and retain exact SDK shield and monitor readback. The compiled activation gate remains unchanged. This adjustment requires another physical allowance check.

The next receipt showed one persisted allowance/grant while the shield remained. Direct comparison with the legacy Swift bypass found a duplicate host AuthorizationCenter guard in ProtectionOSAdapter.requireActivation, below the already adjusted driver. That writer guard was corrected for extension execution as well. No all-app shield clearing or allowance reset was added; the active owner/token, compiled gate and exact SDK readback remain required.

A fresh host launch after the lower-level guard correction showed one session, one grant, two monitors and no allowance error. The owner confirmed the selected app opens after returning Home and relaunching, physically verifying the grant/shield removal. Successful secondary actions now return `.none` rather than redrawing via `.defer`; short guarded follow-up shield writes at 0.2/0.6 seconds follow the legacy Swift technique, recomputing from the existing grant without consuming time again. Immediate in-place dismissal and expiry still require acceptance of that final build.

### Active-use session update (pending physical acceptance)

The current candidate follows the newer Swift active-use policy from `landing-page`: background time does not consume a new allowance, unused minutes survive pause/resume, and reminder thresholds round up to active minutes (a 15-minute session nudges at 4, 8 and 12 active minutes). iOS uses fresh DeviceActivity events on iOS 17.4 or newer; Android consumes foreground time and pauses on app switches and lock. Existing elapsed allowances are retained until they finish rather than resetting their daily counts.

Returning to Hoosh pauses native grants and retains unused minutes. iOS provides no reliable general callback for another app exiting to Home, so an entry shield on every ordinary Home/re-entry is not guaranteed; Android has a foreground transition witness. iOS accounting is reported at usage checkpoints, not a live second-by-second app-exit signal.

Explicit Quit choices produce deduplicated +5 opening or +20 mid/end-session receipts. Per the owner's decision, accepting the notification produces +30 immediately, without a later goal-completion requirement; Skip earns nothing. Backend receipt confirmation updates the wallet. The expanded iOS notification now has its own Figma-styled content extension and system Skip/Accept actions; ordinary banners remain OS controlled. These changes supersede the earlier elapsed-reminder and missing-notification statements above.

Automated reward, session and package checks are separate from real-device evidence. Remaining acceptance: new active-use allowance, pause/resume without background consumption or extra daily charge, quarter reminder delivery, immediate Accept reward without duplicate credit, and final reblock. No release activation gate is enabled by these model checks.

The active-use candidate passed native SDK/model checks, 122 Android engine cases, reward backend tests and signed iOS product inspection (including the new notification content extension). Both release packages built successfully. The iPhone candidate was installed over the existing app on Anisha; launch was denied because the device was locked. New active-use behavior, notification rendering/delivery and Accept credit remain physically unverified. The development API health check passed; this is not production hosting proof.

### Direct plan saving; separate device-schedule panel removed

Owner requested removing the confusing Manage device schedule section while retaining Figma pages and Swift session behavior. Production Settings no longer mounts AccountPlanControls or the separate Preview/Apply/Stop/claim panel. Onboarding retains its existing accept/save → native readback → congratulations flow. Explicit Save in the existing inline days/hours/sessions editor now waits for the canonical server receipt, verifies current account and target selection, applies that exact plan, and confirms native readback before closing. Simply opening Settings never installs or resumes rules. Native uncertainty stays inline with Retry; readback of an already matching installation avoids another Apply. No new route, permission reset, owner claim, budget reset or global Stop was added.

The existing active-use Swift/Android engine behavior is preserved: configured session duration/count, minute-based usage, retained unused time, quarter reminders, and idempotent rewards. This UI change does not prove new OS lifecycle behavior or remove iOS callback limitations.

Validation: 130 router/settings component tests passed across iOS and Android; TypeScript, changed-file lint and diff whitespace checks passed. Existing explicit-control transaction/recovery tests retain a test-only harness; a production-route test confirms the panel is absent and Save installs once, and a lost-ack test confirms Retry reads back without a second installation. Device packaging/install results follow separately.

Direct-save iOS Release and Android standalone builds passed. Signed iOS inspection passed; the compiled bundle contains the current reachable QA API and no Manage device schedule label. Installed over the existing iPhone app without clearing data; launch succeeded. Physical editing/native readback remains separate from the passing automated Save/retry checks.

### Save recovery regression investigation

Owner reported session Save doing nothing and selected apps opening. The phone receipt showed granted permission, a claimed owner and saved selection, but `pendingInstallation=true` and `monitorCount=0`. Therefore direct-save automated success did not establish a working physical installation. The removed manual panel had held pending-request recovery, which the first direct Save implementation omitted.

Explicit Settings Save now recovers the exact durable iOS request before considering a new canonical plan; it rereads state and refuses unresolved recovery. Save is also usable when the server preferences are unchanged but native protection is pending, degraded or inactive. The iOS OS adapter now permits recreation of a desired registration that is absent from the OS, including one listed in the previous confirmed plan; a registered conflicting previous schedule remains protected. Recovery writes sanitized success/failure diagnostics. No account, selection or allowance history is cleared.

Recovery unit checks (8), shared router/component checks (100 across both platforms), TypeScript and changed-file lint passed. These results do not close physical acceptance: install candidate, explicitly Save, inspect pending state/monitor count, then observe target-app shield and updated session behavior.

Save-recovery candidate: iOS and Android builds and signed iOS inspection passed. Installed and launched on Anisha. The initial fresh receipt still shows the expected pending request before an explicit Save, with compatible policy, zero monitors and retained allowance counts. Requested one Save action to observe actual recovery; no physical success is claimed yet.

Owner confirmed Save sessions now saves and closes. The fresh phone receipt independently changed to `pendingInstallation=false`, `monitorCount=1`, no failure, with permission/selection/owner still valid. Native Save/recovery is physically observed. Target-app shield after this repair and changed session timing remain pending owner observation.

### Swift entry-shield mismatch (supersedes Active Hours workaround)

After Save recovered successfully, the owner still observed normal target-app launch. The fresh receipt had one registered monitor but zero active reasons. The saved focus window was 09:00–22:00 America/New_York; the native current time was outside it. Direct inspection of `landing-page` Swift `PerAppProtection.reconcileShields` confirms that enabled protection shields all selected apps unless they have an allowance, independent of a focus window. The shared implementation had incorrectly made entry shielding depend only on scheduled focus/quest occurrences. Asking the owner to change hours is a workaround, not Swift parity.

The candidate adds a native daily entry-protection reason for selected apps while the weekly plan is enabled, alongside the existing planned focus and quest reasons. Entry selection uses the current committed app choices. Planned hours remain saved and scheduled; their end does not remove the entry shield. Active-use sessions are capped by their entry-day boundary rather than a shorter focus window, so crossing focus hours preserves remaining minutes and daily counts. Stop disables the entry reason while unrelated quests survive. Daily boundaries resolve natively; no backend or JS timer is required for the shield.

The host also reconciles an already enabled, claimed installation at native startup/foreground even without a live allowance. This does not claim a new owner, enable a stopped plan, or apply an unsaved draft. The prior Save-recovery code remains in place. Android has the same entry-reason behavior. Model expectations were revised explicitly for the added baseline reason, with checks for overnight/weekend entry protection, selected/nonselected apps, focus-boundary remaining-time preservation, Stop and quest coexistence. Android native checks: 124 passed. Physical enforcement of this new candidate remains pending installation and observation.
