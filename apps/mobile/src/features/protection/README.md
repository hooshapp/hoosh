# RN-08 protection presentation and read-only consumer

**Status: Android read/usage-access integration implemented in RN-08a–c; device
matrix recorded in RN-08d.** Home registers the Android adapter; iOS remains with
Anisha and unavailable builds retain the neutral fallback. This module does not install restrictions or prove Android parity,
Screen Time permissions, production entitlements or current device protection.

## Inputs and trust

`mapProtectionStatus(integration, desiredRevision, read)` is pure presentation over
three separate dimensions: bridge availability, native capabilities and current
permission/installation evidence. Its connected availability projection does not
need a service object; the hook separately consumes the real shared ProtectionService.
No second native policy or wire-contract package is introduced.

Only a fresh successful read with matching platform, known capability mode,
authorized current/status permission, active native state, valid installed reasons,
nonnegative safe-integer installed revision matching the desired native revision,
and no reported native error can produce a positive active state.

- `system_shield` → Protection active.
- `overlay` → App interventions active, without claiming system shields.
- `notification_only` → Reminders active, explicitly saying apps are not blocked.
- Missing adapter, unsupported environment/mode, denied/revoked permission,
  inactive/installing/mismatched revisions, degraded/failed, unknown/read error and
  checking remain distinct. Adapter absence never means an entire OS is unsupported.
- A pending/mismatched install retains actual installed/desired revision metadata;
  the user sees that the latest changes are unconfirmed, not a fabricated success.
  These internal numbers are not displayed as ordinary product copy.
- No native notes, rule IDs, lastErrorCode, raw exception or account identity is
  rendered. Basic native evidence shape checks fail conservatively. This does not
  replace the native adapter's validation or signed-device acceptance.

`desiredRevision` must come from the real **device-native configuration coordinator**,
not a profile row revision, a saved API response, a draft, or another user's plan.
Null means unconfirmed desired configuration and cannot enable active protection.
Revision equality does not establish account ownership; do not reattribute installed
rules/events at account changes before the PM/native ownership protocol is approved.

## Read consumer and actions

```tsx
const { model, refresh } = useProtectionStatus(
  integration,                 // one stable registered native integration object
  expectedNativeRevision,
  appIsActive && routeIsFocused,
);
<ProtectionStatus model={model}
  onRetry={integration.availability === 'connected' ? refresh : undefined}
  onReviewPermissions={nativeOwnerReviewFlow}
  onSetup={nativeOwnerSetupFlow} busy={nativeActionPending} />
```

Anisha supplies/audits iOS; Ishmum supplies Android after feasibility work. The host
must pass an explicit visibility boolean, wire AppState/route events and refresh
after actual native setup/permission/configuration changes. That real host wiring
is **not implemented** in this commit. Keep the integration object stable, replacing
it when the native producer changes. Do not manufacture a fresh object each render.

The hook reads only `getCapabilities`, `getAuthorization` and `getStatus`, with a
10-second UI-read deadline, including elapsed wall time after suspension. Changed integration, desired revision, visibility cycle
or deliberate refresh invalidates prior evidence before delivery. Hidden/failed/
overdue reads cannot keep a previous active claim. Cleanup ignores late results
and clears its own timer, including strict/development repeated effects. The native
port has no cancellation API: an already-dispatched read may finish after cleanup,
but its result is ignored. The deadline is not an enforcement timer or freshness TTL.
It neither cancels native rules nor makes enforcement depend on JavaScript/cloud.

`ProtectionStatus` is a controlled summary using shared UI controls. It shows a
recovery/setup action only if the model calls for it **and** its matching owner
callback exists. Callbacks own their async failure handling and operation-long busy
state. Retrying a failed initialization needs a real owner reinitialization callback, not the read hook’s refresh. Permission/setup presses never automatically enable a positive status; read
fresh native evidence after the owner completes the actual flow. No permission
request, app picker, applyRules, temporary allowance, cancelReason, event drain,
sign-out handler or restriction transfer is called by the hook or mapper.

## Design and local preview

Read-only Figma session `d5c91295-9bd7-435c-957b-f2b5d1a63107` inspected Home `22:4`
and permission `50:85`. Neither supplies a complete protection-status summary/state
set. This image-free card is an engineering adaptation of the existing warm card
surface/24 px radius, Space Grotesk typography, dark recipe and shared action/status
controls. It is not the full Home or Anisha's onboarding permission screen; their
Dino/metric/glow/status-bar imagery is outside this component's scope.

Run `npm run mobile:ui` and find **Device protection — simulated evidence only**.
The isolated specimen exposes every mapped state, warm/dark rendering and a clear
preview-only action notice. It constructs presentation evidence only—no fake native
service or real prompt. Example active/reminder/intervention labels are deliberately
simulated; ordinary app routes import none of this specimen or sample evidence.
The export guard rejects its unique marker.

## Deferred native acceptance

The original plan and Plan 04 implementation notes track **RN08-D01–D06**:

1. Real audited Swift/Kotlin adapters, registration and accurate per-device capabilities.
2. Actual foreground/focus/native-change visibility and refresh wiring, using the
   authoritative native desired revision and current status.
3. Real owner-controlled permission, selection and setup actions, with supported
   platform behavior and complete async errors/busy handling.
4. Real installation/revision reconciliation and approved overlapping native policy;
   API saves and UI clicks do not establish installation success.
5. Approved sign-out/account ownership, restriction/event attribution and transfer
   policy; never clear/reassign rules just because this presentation unmounts.
6. Signed device checks for revocation, failed installs, offline/native continuity,
   foreground return and host termination, plus VoiceOver/TalkBack/font/keyboard checks.

Pure mapping tests, mocked hook checks, browser geometry and native JS compilation
are separate from all six live/device gates. No existing native source, entitlements,
platform settings, backend, Auth contract or enforcement behavior is changed here.

## RN-08c host integration

`device-protection.tsx` uses the platform-specific registered integration, actual
Router focus plus AppState foreground, and the existing read hook/mapper. Desired
native revision stays null because this slice installs no configuration. The hook
also exposes current authorization only when its two read sources agree; hidden/
changing/failed observations clear it. The Android unsupported-mode copy describes
this build, not an Android-wide capability verdict.

Usage access is a separate region with explicit Settings action. Its action hook
owns duplicate suppression, operation-long launch/read busy, safe failure/retry,
module identity and unmount fencing. Foreground return re-reads actual permission.
A grant, API response or navigation cannot claim protection active. No Auth/root
changes, native sign-out cleanup or fabricated installed revision are added.
See [actual Android evidence](../../../../../docs/qa/android-capability-probe.md).
