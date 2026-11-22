# Shared Hoosh iOS — packaged acceptance

This runbook belongs to INT-IOS-C06 / INT-VERIFY-C05. Packaging checks do not
accept Screen Time behavior or authorize installation over the Swift pilot.
The existing host bundle ID is intentionally preserved; the display name is Hoosh.

## Current gates

- Physical iPhone testing was deferred again by the owner during C06. Keep activation compiled off.
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

Current checkpoint: November22, source `08b3766`. **C06 is not complete.**
The iOS plan has C01–C06; it has no C07. Its next named handoff is VERIFY-C05,
within combined-app verification. Do not label the simulator package or the
compiled-off protection path as accepted native enforcement.

| C06 requirement | Current evidence | Still required |
|---|---|---|
| 1. Signed normal-app protection journey | Real RN host, real-authenticated simulator/local API save; device Release provisioning inspected | Spare iPhone: picker Save, authorization, Apply, intervention, temporary-access expiry, Stop/readback |
| 2. Embedded build and lifecycle | Embedded Hermes startup without Metro; simulator terminate/relaunch and API service outage/recovery | Native foreground/background/host termination, lock/unlock, revoke/regrant, offline/reconnect, reboot and schedule/day boundaries |
| 3. Account/device ownership | Observed A→distinct B account/setup separation, A local draft retained | B writes and return-to-A; explicit native device claim, stale callbacks, retained rules and events across transition |
| 4. Product inspection | Simulator package and device development signing inspected; current simulator JS/source hashes matched | Reinspect the exact final phone product after reachable API configuration and any later source changes; distribution approval remains separate |
| 5. Size/text/keyboard/accessibility | Large-text navigation repair verified; standard Home overflow repaired; compact SE public-auth validation/navigation/keyboard pass | Compact authenticated pages/native picker, full scrolling/footer reachability, intro swipes and basic accessibility journey |
| 6. Evidence and handoff | Sanitized receipts, source hashes and simulator notes recorded | Physical results, capability/core gates reconciled and exact-build VERIFY-C05 handoff |

No need to repeat already-passed package checks for every documentation commit.
Use the existing isolated QA simulators; preserve the signed-in Release QA account.
The new **Hoosh C06 Compact QA** is signed out at login with default text restored.
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
