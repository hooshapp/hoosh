# Android app visibility and selection investigation

**Plan:** Plan 04, existing RN08-D03 / RN-09f. **Owner:** Ishmum.
**Investigated:** 2026-11-07. **Source baseline:** `f2fae39`.
**Status:** Documentation/API/source/APK investigation complete; app-context device
probe, picker implementation and production integration are not performed.
Tokens and Auth integration remain explicitly deferred by the user.

**Implementation follow-up (2026-11-09):** the debug-only discovery probe now
has native build/isolation and Pixel/API 36 app-context evidence; see the
[probe runbook](android-selection-discovery-probe.md). The dated investigation
below describes its original 9fda458 baseline, including then-unavailable device
access. A [volatile debug picker](android-selection-preview.md) is now implemented;
production/account selection remains unimplemented and tokens/Auth deferred. The
original recommendations below describe research at that baseline, not current
production capabilities.

## Recommended approach

Use a narrowly declared launcher-intent query to discover candidate apps in the
current Android profile. Present an app-owned native Android multi-select picker,
keep package identities and icon handling native, and return the existing
`SelectedAppsSummary` to React Native. Reuse the Apps editor's `kind: 'native'`
Choose apps entry and summary, rather than adding a second catalog bridge now.
This is the engineering direction for a bounded prototype, not an implemented
picker, approved account-storage policy, Play approval or proof of blocking.

Android filters package queries for apps targeting API 30+. Its documented
`<queries>` intent mechanism can expose packages matching a declared purpose.
Our inference is that launcher matching is the smallest candidate scope worth
validating for this picker. It is not a complete installed-app inventory.
[Package visibility](https://developer.android.com/training/package-visibility),
[declaring intent queries](https://developer.android.com/training/package-visibility/declaring).

## What exists in this repository

| Boundary inspected at the baseline | Actual finding / consequence |
|---|---|
| `packages/contracts/src/protection.ts`, lines 18–37, 111–126 | `selectionUI` supports native picker/package list/unavailable; `pickApps()` and `getSelectedApps()` return summary/revision/counts/optional display names. Raw identities stay native. No catalog, owner/group argument, cancellation or draft-commit protocol is defined. |
| `apps/mobile/src/features/preferences/preference-editors.tsx`, lines 25–30, 257–370 | Existing Apps editor already supports a native chooser/summary and a separate supplied catalog. Catalog icons are tracked `DesignAsset`s, not Android drawables. Outer Save is a separate action; simply opening a picker cannot honestly implement that save. |
| `apps/mobile/src/app/settings/[field].tsx`, lines 87–94 | Actual Apps route supplies absent native selection and unavailable saving. No chooser is registered. |
| `apps/mobile/src/infrastructure/native/android-usage-adapter.ts` | Decoder accepts only unavailable selection/unsupported protection; both selection operations explicitly reject. A future picker needs deliberate adapter/decoder tests; existing usage access is not its selection permission. |
| `apps/mobile/modules/hoosh-usage/android/src/main/AndroidManifest.xml` | Only usage-access permission and the usage Settings intent query; no launcher discovery query. Keep the existing module instead of adding another native framework/library. |
| Existing local debug APK | Target 36/minimum 24; no `QUERY_ALL_PACKAGES`, no MAIN/LAUNCHER visibility query. Other dependency intent queries exist; their presence does not establish a launcher catalog. Binary was not rebuilt or attested to this source commit. |

The [sanitized audit](../core_plan_implementation_notes/artifacts/rn-08-selection/visibility-audit.json)
records the exact APK SHA-256, permissions/query signatures and source checks.
No device inventory was read. ADB reported **zero authorized devices**; no app-UID
catalog query, count, label/icon load or picker behavior is accepted as tested.
Earlier RN-08/RN-10 Pixel evidence covers different operations, not this picker.

## Discovery and permission boundary

For a future prototype, add the following narrowly scoped declaration in a
**debug-only** manifest first; promote it to the module/main manifest only with
reviewed production scope. This task adds neither declaration nor executable code.

```xml
<queries>
  <intent>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent>
</queries>
```

Illustrative query, not code added or executed by this investigation:

```kotlin
val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
val candidates = context.packageManager.queryIntentActivities(intent, 0)
```

Use the current app context, no package allowlist, data URI or DEFAULT category.
`queryIntentActivities` finds matching activities; `MATCH_DEFAULT_ONLY` limits
matches to DEFAULT-capable filters and is unsuitable for discovering ordinary
launcher entries. Adopt the flags overload appropriate to the supported SDK when
implementing. No permission/role elevation is part of this query design.
[PackageManager query and flags](https://developer.android.com/reference/android/content/pm/PackageManager#queryIntentActivities(android.content.Intent,%20int)).

Visibility declaration, usage authorization and enforcement are separate. The
candidate list must work without first granting usage access, subject to the
actual app-context probe. Do not request AccessibilityService, overlay, device
admin, launcher role, cross-profile access or broad package visibility to make a
picker appear available. No intervention capability changes with selection.

Google Play treats installed-app inventory as sensitive and restricts
`QUERY_ALL_PACKAGES`; a narrower solution must be preferred when sufficient.
Therefore this investigation selects targeted discovery and no broad permission.
Store approval and accurate disclosures remain release work; avoiding that
permission does not by itself certify the whole app's policy compliance.
[Play package visibility policy](https://support.google.com/googleplay/android-developer/answer/10158779?hl=en).

## Alternatives evaluated

| Approach | Decision and reason |
|---|---|
| MAIN/LAUNCHER + `PackageManager` | Preferred first probe. Matches the user-facing launcher-app scope and needs only an intent declaration. Availability/coverage must be tested under our app UID. |
| `getInstalledApplications()` + broad visibility | Not selected. It expands scope beyond the intended picker, still faces visibility filtering, and adds no selection interaction. No all-packages fallback. |
| Fixed list of popular package names | Not selected. Cannot represent the user's actual eligible apps and would encode a product catalog we do not have. |
| `LauncherApps.getActivityList()` | Retain as a comparison if the first probe exposes a concrete deficiency. Its documented profile model and synthesized Settings entries need separate eligibility checks; do not assume it is equivalent to launcher-only `PackageManager` results. No launcher role acquisition. |
| `ACTION_PICK_ACTIVITY` | The documented result identifies one activity for an input intent. It does not provide our multi-app draft/confirm transaction; not the selected UX. |
| React Native catalog with package IDs/bitmap data | A possible later alternative, but requires a new reviewed bridge/data/icon boundary. The current summary-only native path already fits the chosen prototype. |
| Third-party installed-app/plugin library | No dependency needed before verifying the platform APIs. Adding one now would obscure manifest/data access and duplicate the existing Kotlin/Expo boundary. |

The LauncherApps profile/synthesized-activity behavior is documented in
[LauncherApps](https://developer.android.com/reference/android/content/pm/LauncherApps#getActivityList(java.lang.String,%20android.os.UserHandle)).
The single-activity result is documented in
[Intent.ACTION_PICK_ACTIVITY](https://developer.android.com/reference/android/content/Intent#ACTION_PICK_ACTIVITY).
These are source/API findings, not comparative device measurements.

## Candidate identity, labels and profile limits

The following are proposed implementation constraints, not implemented behavior:

- Enumerate on explicit user intent; do package/label/icon work off the UI thread.
  Keep results in a short-lived native snapshot. Search filters presentation, never
  the underlying selected set. Recheck eligibility on confirmation/return.
- Use package identity within the current profile, not labels, as the deduplication
  key. Multiple launcher activities/aliases must not inflate app counts. Use a
  deterministic representative, locale-aware label sorting and a stable tie-break.
- Skip our own app and invalid/disabled/non-exported candidates. Do not request
  disabled/uninstalled components or cross-profile intent forwarders as selectable
  apps. Verify filtering on supported API levels; do not claim complete coverage.
- Keep eligible preinstalled user-facing apps. `FLAG_SYSTEM` describes installation
  in the system image, not whether an app is distracting or safely blockable.
  Protected OS targets require a separate enforcement review before rules exist.
  [ApplicationInfo.FLAG_SYSTEM](https://developer.android.com/reference/android/content/pm/ApplicationInfo#FLAG_SYSTEM).
- Load labels/icons through native package metadata. Handle missing resources,
  duplicate/long/bidirectional labels and disappearing packages individually;
  use a local fallback icon without failing the entire picker. Bound/lazily load
  icon work; no base64 inventory or icon cache uploaded to the backend.
  [ResolveInfo label/icon APIs](https://developer.android.com/reference/android/content/pm/ResolveInfo#loadLabel(android.content.pm.PackageManager)).
- Scope the first version to the current profile's matching apps. Do not merge work,
  clone or private-space copies by label or attempt hidden-profile enumeration.
  An incomplete/empty filtered result is not proof that no apps are installed.
  Android's private-space guidance imposes launcher-role/profile conditions; this
  product is not acquiring that role for selection.
  [Android 15 private-space guidance](https://developer.android.com/about/versions/15/behavior-changes-all#private-space).
- Launcher visibility is not usage ranking. Use an honest list label such as
  Apps on this profile; Figma's Most used needs its own permitted measurement
  producer. No fabricated app list, usage order, website/category or count claims.

## Picker transaction and current contract gaps

Use native multi-select UI with search, retained checks, selected count, explicit
confirm and cancel, accessible native labels and scrolling. Native here means
our Kotlin-hosted UI, not a new OS-provided authorization dialog. Existing RN
presentation stays responsible for entry/status/summary. The visible adaptation
is intentional: no installed-package inventory is added to the shared bridge.

Before a **production** selection write, settle these engineering/product boundaries:

| Gap | Smallest next action / safe investigation boundary |
|---|---|
| Cancellation is absent from the port | Specify a stable adapter-recognized cancellation outcome before wiring. Recommended: native promise rejects with a dedicated cancellation code; the consumer clears busy without error/success announcement or mutation. Do not return an empty selection on cancel or silently change the shared Promise type. |
| Native confirm versus outer Save | Define one commit boundary; outer Save cannot be decorative. Prototype can confirm a volatile local draft and report an explicitly temporary summary. Production persistence requires agreed stage/commit/discard semantics. |
| Owner/group and selection revision | Existing methods lack an owner/group input. Keep prototype state memory-only in the isolated QA host. Do not create a persistent global selection, bind it to a guessed account, or assume a global group also defines per-quest app scope (Q09/Q17 remain unanswered). |
| App vanishes or becomes ineligible | Revalidate before accepting. Explain unavailable selections and require deliberate reconciliation; do not silently rewrite durable selections or increment revision during an ordinary read. |
| Process/activity lifetime | Serialize picker openings; settle a pending promise once; cancel on host destruction/owner change, and reject late results. Do not relaunch a picker automatically after process restart. |
| Existing capability decoder | Keep `mode: unsupported`, installed revision null and enforcement flags false. Only advertise selection when the adapter and tested chooser exist; selection capability must not imply active protection. Current capability values stay unchanged in this task. |

Cancellation and local lifecycle mechanics can be engineered/tested without tokens.
Account association, cross-account cleanup, durable native storage and actual
onboarding integration remain coordinated work. No PM answer is inferred from the
prototype. No backend schema, Supabase credential or Auth guard is needed for the
isolated discovery/volatile-picker producer.

## Small next commits within the existing plan

These describe remaining work, not additional implementation delivered here. Keep
RN08-D03 / RN-09f and existing RN-08a–d history; parent counts remain 46/21/25.

1. **App-context discovery probe** — extend the existing Android instrumentation
   path with debug-only launcher visibility. Record aggregate matching/deduplicated
   counts, resource success/failure and forbidden-permission checks, not app names,
   labels or raw package IDs. Compare the old/new manifest behavior without treating
   baseline auto-visible packages as zero. Production selection remains unavailable.
2. **Volatile native picker producer** — reuse that discovery in the existing local
   module and developer-only QA entry; implement draft/search/cancel/confirm,
   cancellation error mapping and lifecycle cleanup. No durable/account selection,
   rule installation or production save. Keep iOS/web fallbacks and shared port stable.
3. **Production editor wiring** — after explicit ownership and commit semantics are
   settled, reuse AppsEditor native branch with operation-long busy/error/return focus,
   real summary and honest save/discard. Add any necessary shared contract change
   explicitly, coordinate with Anisha, and test account transitions when Auth resumes.
4. **Device acceptance** — confirm supported Android/API/device coverage, denied
   usage access, profile limits, install/uninstall/disable races, long/duplicate names,
   rapid reentry, native Back/cancel/no-op confirm/clear, process interruption,
   TalkBack and large text. Probe success is not complete picker or blocking acceptance.

This sequence refines the already planned feature. It does not introduce a new
plan, start implementation steps 2–4 or close full RN-08/RN-09/Plan 04.

## Evidence and validation in this investigation

- Read current Android/Play primary sources above on 2026-11-07; separated documented
  platform behavior, engineering recommendations and untested device assumptions.
- Inspected source ports, native adapter/module/manifests, actual Apps route/editor
  and existing tests. No executable file, dependency or shared contract changed.
- Decoded the pre-existing local debug APK with `apkanalyzer manifest print`, checked
  SDKs/permissions/query signatures and hashed it. This is static binary inspection,
  not a new build, inventory read or app-context permission/visibility result.
- `adb devices` reported zero authorized devices. No app installation, permission,
  UI, radio, lock, account, database or cloud state was changed; no ADB mapping/server
  was started. Device evidence stays explicitly pending instead of substituting a
  privileged shell query or earlier usage probe.
- Validated JSON/source/APK hash, XML sketch syntax, local links and `git diff --check`.
  Runtime suites/native builds are not rerun for documentation-only research.

## Handoff

The supported API direction and repo fit are established enough to start the
bounded discovery probe. An authorized device is needed to accept its actual
visibility/resource behavior. Tokens/Auth remain deferred; persistent account
selection and enforcement are not prerequisites for that isolated probe and are
not silently included in it. No picker capability or product save should be
activated by consuming this investigation document alone.
