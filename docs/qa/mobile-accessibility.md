# Mobile accessibility and lifecycle evidence

**Date:** 2026-10-30. **Owner:** Ishmum; Anisha owns real Auth/iOS and joint
device validation. **Part:** RN-10. **Base:** RN-09a `ff75039`.

This is evidence for the implemented shared UI and prepared consumers. It does
not certify the whole Figma app, real authentication/profile integration, native
protection or VoiceOver/TalkBack. The original evidence below is historical to RN-10; RN-09b/c/d presentation now has supplemental evidence linked at the end.
Icon-pack rewiring remains deferred at Ishmum's request; original bundled SVGs
and their recorded hashes are unchanged.

## Criteria and checked scope

Use [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
for text/surface measurements and [reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
for narrow layouts. [Focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
and [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
guide keyboard/assistive feedback. These criteria inform local fixes; passing
selected checks is not an app-wide WCAG conformance claim.

| Implemented finding | Change / evidence boundary |
|---|---|
| Warm weekly hours on action green had 2.02:1 contrast; small white labels on source success green had 3.64:1; percentage text on warm card had 3.50:1 | Hours now use the existing dark on-action text. Small badge backgrounds and percentage text use a separate `readableSuccess` token (`#08734E`); existing decorative green and original SVG colors remain unchanged. Eleven portable contrast cases enforce at least 4.5:1 for the selected opaque text pairs; browser evidence measures four actual Home pairs. |
| The web tab list followed its panel in DOM order, so Tab left the page instead of reaching content | Public Router `tabBarPosition` is top on web for DOM order; the custom bar stays physically at the bottom, with explicit stacking. Native position stays bottom. Browser keyboard checks cover manual activation, forward into panel/link, and backward to selected tab. No synthetic keyboard focus trap or second router. |
| Route-key replacement could remount the focused tab during activation | Stable tab-name React keys retain physical tab controls. The browser runner exercises uninterrupted Arrow/Space/End/Enter/Tab sequences. Route keys still identify Router events and navigation destinations. |
| Visited inactive tab panels remained keyboard/assistive targets | Public route focus hides inactive web panels with display none, negative tabIndex and hidden accessibility semantics. Native panels receive matching hidden semantics. React subtrees stay mounted so ordinary tab switching does not discard drafts or caches; account scoping remains RN-04's responsibility. |
| Text-only browser scaling could overflow the bar while RN Web fontScale stayed unchanged | Intrinsic bar content may wrap; actual onLayout height remains the single footer-clearance source. Native font-scale expansion continues to label all four tabs in two columns. |
| Profile confirmation removed the focused DOM element on dismiss/clear | Explicit open intent focuses safe Keep name; Keep returns to the trigger; staged clear focuses the name field. Public native `sendAccessibilityEvent` requests assistive focus after ordinary focus. Null/detached controls do not retry into another screen. Status changes alone never request focus. |
| Very long names outside the profile preview's scrolling owner could leave almost no editor viewport | The specimen now composes its existing account header and editor in one Screen scroll owner. Future Settings integration must follow the same composition; this is no claim that RN-09d is implemented. |
| iOS did not explicitly announce non-checking native-status changes or the clear-confirmation purpose | Reuse queued/deduplicated `useAnnouncement`; checking continues to announce once through InlineStatus. Busy Feed has an explicit ongoing-action name. Non-error web InlineStatus messages have status semantics; errors retain alert semantics. No result/success is invented. |
| Disposed or failed lifecycle registrations could still publish callbacks | The process-wide owner stops delivery before cleanup/rollback, attempts both disposers and resets managers/ownership in finally. Native AppState delivery/cleanup is guarded and idempotent. Tests cover late callbacks after replacement, both registration failures, cleanup failure and remount. |

Existing keyboard-aware Screen behavior is retained: iOS padding/interactive
dismissal, Android height/on-drag behavior, handled taps, safe-area edges and
measured footer reservation. No duplicate keyboard or Auth lifecycle owner was
introduced. Reduced-motion reads still start conservatively, respect newer
preference events and remove listeners. The failed preference-read path now has
a regression test. No JavaScript/native enforcement timer is added.

## Automated and browser evidence

Run `npm run check`, `npm run mobile:ui:build` and `npm run mobile:export` from
root. Actual counts, hashes, code locations and compilation results are recorded
in [the RN-10 implementation entry](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

The optional [browser runner](../core_plan_implementation_notes/artifacts/rn-10/browser-check.mjs)
uses an installed Playwright ESM entry (`PLAYWRIGHT_MODULE`) and its own headless
Chrome session. Serve the built developer UI on 8093 and actual Expo static
export on 8094, as documented in the notes. It checks the actual app at 280,
320, 393 and 430 px, default/24 px text, all four tabs, at least 44 px targets,
measured footer clearance, names/selected state in Chrome's accessibility tree,
and keyboard focus order. Prepared profile/protection examples cover confirmation,
validation descriptions, conflict/draft retention, reduced motion, long names and
status semantics. They make no private API requests and represent no real user.

Full native Router/Hermes exports validate the routed code. Separate direct
consumer bundles validate the prepared profile/protection/focus/lifecycle sources.
Source-map equality establishes compilation of the actual final source, not
native linking, speech, keyboard behavior, signing or device execution.

## Device/live acceptance still required (updated by RN-10d)

Record actual model/OS/build, commit/schema versions, steps and observed result
when executing these checks. Do not replace them with a checkbox inferred from
browser emulation or mocked public native APIs.

| Ref | Remaining work | Owner / acceptance evidence |
|---|---|---|
| RN10-D01 | VoiceOver/TalkBack traversal, selected-tab announcements, confirmation/status/error speech and focus | RN-10d has Android selected-tab/control/checkbox speech and modal focus/return. Anisha owns iOS. Full manual traversal/async speech, supported devices and signed release remain. |
| RN10-D02 | Actual Dynamic Type/font scaling, software/hardware keyboard, safe areas, focus scrolling and SVG rendering | RN-10c/d have Pixel 8 Pro Expo Go/debug host at 1.15/2.0, IME/SVG/detail navigation and measured focus/footer fixes. Physical keyboard, iOS, other devices and signed release remain; portrait stays configured. |
| RN10-D03 | Real Auth/account/profile lifecycle, guarded root provider integration and two-account/restored-session transitions | Anisha + Ishmum. RN-05/06 and RN-07 live evidence; current callbacks/provider tests do not establish integration. |
| RN10-D04 | Real native authorization/status visibility and foreground reconciliation | RN-08d (`cadc91d`) accepts Android read/usage Settings/foreground scope. Enforcement, iOS and release integration remain separate; RN-10d preserves existing usage access. |
| RN10-D05 | Native accessibility of implemented Quests/History/Settings and detail/editor composition | RN-10c/d Android layout, details, dirty navigation, modal return and bounded sample states are recorded. Full traversal/state matrices, other platforms/devices and release builds remain; Anisha owns iOS. |
| RN10-D06 | Cold start, memory pressure, process death, background/foreground/offline restoration and measured responsiveness | RN-10d records local-draft background, injected trim callback, radio toggle and safe cold start. True OS memory-pressure kill, authenticated offline/process restoration and release integration remain; no SLA. |

## RN-11 readiness — live milestone cannot run yet

Read-only repository/schema inspection on 2026-10-30 confirms only `/healthz`
in the backend OpenAPI paths, a placeholder sign-in route and preview redirect,
no foundation generated OpenAPI/HTTP types, and no profile API/database migration
implementation. This does not assert whether Anisha has a cloud project or work
on another branch; those outputs are not integrated in this checkout.

| Missing prerequisite | Owner / next concrete output |
|---|---|
| Supabase Auth configuration and the actual session/sign-in/sign-out/guard producer | Anisha: SB-01–03 and AUTH-01/02/03/07; supply the agreed ports and coordinated root integration. |
| Protected identity and generated foundation API types | Ishmum: API-01–05; then jointly wire RN-05 and execute RN-06's real M1 matrix. Backend foundation can start independently of mobile Auth. |
| Database runtime/test roles, migrations and versioned profile endpoints | Ishmum: SB-04/05 and API-06–09; preserve the accepted identity/profile split and transaction isolation. |
| Real profile read/save/conflict/ambiguous-save integration | Ishmum with Anisha: RN07-D01–D07 and actual M2 evidence; the UI sample is not persistence. |
| Relevant device/accessibility acceptance | Joint: RN10-D01–D06 and RN-08 native gates for any activated native controls. |

RN-11 remains **awaiting live prerequisites**, not implemented or passed. Once
ready, record the exact mobile/API/schema/migration versions and execute real
sign-in/out, two accounts, reload/restart, conflicts and uncertain-save recovery.
An absent adapter does not block identity-only M1, but prevents claims about real
native protection. Scoring, reward and forecasting decisions do not block the
agreed minimal identity/profile foundation; their feature controls remain gated.


## RN-09b/c/d presentation follow-up — 2026-10-30

Quests, History and Settings now have source-aligned presentation, independently of
live feature acceptance. See [Quests browser evidence](../core_plan_implementation_notes/artifacts/rn-09b/browser-results.json),
[History evidence](../core_plan_implementation_notes/artifacts/rn-09c/browser-results.json) and
[Settings evidence](../core_plan_implementation_notes/artifacts/rn-09d/browser-results.json).
These actual component runs check source examples/unavailable/partial states,
original SVG byte/bounds correctness, 393/320/280 px layouts and enlarged text.

[Current real-app navigation evidence](../core_plan_implementation_notes/artifacts/rn-09d/app-navigation-results.json)
checks the actual exported four tabs at 280/320/393/430 px, normal/24 px text,
manual keyboard activation, selected/hidden panel semantics, minimum tab targets,
scroll-to-bottom clearance, absence of source samples/private requests and direct
links to the three new tab bodies. Settings no longer has the RN-10-era developer
Auth links; the new keyboard check goes into/out of its panel. Source sample rows
with no handler remain static; profile form retains the shared scroll owner and
existing confirmation/focus implementation.

These browser checks and iOS/Android Hermes/source-map results do not close
RN10-D01–D06 or the per-feature device/live gates. Repeat on signed devices with
VoiceOver/TalkBack, real fonts/SVGs, keyboard and actual account lifecycle when the
producers exist. No browser record proves native protection or completed Auth.

RN-09e–h editor/detail UI follow-up is recorded in [RN-09 UI coverage](rn09-ui-coverage.md), with original-asset, state, local-interaction and real-route browser evidence. Signed-device/live gates remain pending; original RN-10 evidence stays historical to its commit.


## RN-10a/b icon and Android follow-up — 2026-11-01

RN-10a (`ab7d855`) copied 61 same-node originals byte-for-byte from the user pack,
refreshing 16 earlier exports and correcting Home navigation root geometry. Ten
other exact context originals remain because the pack has no same-node filename.
Source literal emoji/glyphs stay literal. See the rn-10a asset audit and browser
captures; the pack is not needed in CI because originals are tracked locally.

RN-10b moves dirty-exit and quest cancellation prompts into a shared native modal
with scrollable safe-area content and its own safe-area provider. A browser
regression caught inherited gallery insets pushing its actions off-screen; the
modal now measures its own window. Modal show dismisses the keyboard and requests
safe-action focus; request-close delegates to Keep, and busy cancellation cannot
repeat. Existing editor return focus is retained. Component events verify these
contracts, not TalkBack speech or Android IME behavior.

The [native QA runbook](../../apps/mobile/dev/native/README.md) provides a separate
Expo Go project with 19 actual component pages and local examples/state controls.
Samples are shared with the existing web gallery; production exports reject their
markers and native source maps exclude the entire project-local dev tree. The
QA project has no Router; real app hardware Back/tab behavior must be checked in
the ordinary shell separately.

**Physical Android status at the RN-10b checkpoint: pending.** `adb devices -l`
found no authorized devices before the RN-10c connection on 2026-11-01. No phone screenshot, TalkBack observation, font-scale/IME observation
or measured process lifecycle result exists for this part. Bundle compilation,
web navigation and mocked iOS/Android tests are explicitly separate evidence.
RN10-D01/D02/D06 and native D05 remain open; D03/D04 still require live Auth/API
and native producers. No signing, released iOS project or native policy changed.

Reproduction and current results are in
[RN-10b evidence](../core_plan_implementation_notes/artifacts/rn-10b/README.md).


## RN-10c — physical Pixel 8 Pro run, 2026-11-01

Actual device: Pixel 8 Pro, Android 16/API 36, Expo Go 58.0.5, 1344×2992 pixels,
density 480. Original system font scale 1.15; large-font checks used 2.0. This was
Expo Go development UI execution, not a signed standalone native integration run.

| Case | Observed outcome |
|---|---|
| 19 QA pages at 1.15 | All opened; source assets, four Dino moods, controls and sample labels rendered. |
| 11 representative pages at 2.0 | Content wrapped/scrolled; lower controls inspected. Quest weekday letters initially split; fixed by growing compact buttons and wrapping rows. Retest showed all seven labels on two rows and working selection. |
| Actual four Router tabs at 1.15 and 2.0 | Selected semantics and navigation passed. At 2.0 navigation expanded to labeled rows, with scroll clearance. Rounded selected pill was lost after switching at 1.15; explicit default background fixes it, confirmed by phone capture geometry and retest. |
| Quest keyboard and header Back | Typed local text visible; opening the large-font modal dismissed IME. Both prompt actions remained reachable. |
| QA and actual Router hardware Back | Dirty route prompted; Back inside the modal kept typed text; explicit discard returned to the appropriate menu/Quests route. |
| Activities custom input | Typed local text remained visible above the software keyboard. |
| Hours and sessions | Native horizontal handle drag changed 9:00 AM to 1:22 PM; one session increment updated the displayed local budget to 45 minutes. No save/install occurred. |
| Home scenario cycle | Loading, Error, Unavailable, Busy, Long text, Ready opened; sample/intent boundaries stayed explicit. |
| Restoration | Font scale restored to 1.15; temporary USB stay-awake restored to 0; screen timeout remained 30000 ms. QA Home left open. |

[Phone results, capture audit and reproduction](../core_plan_implementation_notes/artifacts/rn-10c/README.md)
include before/after evidence. Status/navigation bars were cropped; only inspected
owned-app captures are tracked. A notification-overlaid capture was excluded and
retaken. The floating gray Tools gear in some captures belongs to Expo Go.

The final workspace check passed 250 portable + 362 native-component + 3 API tests,
types/lint/Ruff and asset checks. Final web export passed isolation for 38 files and
71 original assets; iOS/Android Hermes source-map checks match changed shared code.
Those exports themselves were not installed on the phone; the phone ran Expo Go.

A stale HMR registration for the ordinary Router entry against the nested QA
project stopped local Metro during the final retest. Metro was restarted and Expo
Go cold-opened between projects; the interrupted tests subsequently passed. The
phone auto-locked, its owner unlocked it, and later tests temporarily kept it awake
only while plugged in. No lock was bypassed and no app data was erased.

RN10-D02/D05 have partial actual Android evidence. TalkBack/VoiceOver speech and
traversal, iOS, additional devices/sizes, standalone signing, per-feature exhaustive
states and actual Auth/native integration remain pending. Cold start of Expo Go
for test setup does not establish D06's released-app process/offline/low-memory or
native protection behavior. No native permission, restriction, backend or cloud
state was changed.


## RN-10d — Android development-build accessibility/lifecycle, 2026-11-07

See [device results and reproduction](../core_plan_implementation_notes/artifacts/rn-10d/README.md).
Actual Pixel 8 Pro / Android 16/API 36 reused the RN-08 local debug host with current
JavaScript, separately from production Hermes/web exports. No native source changed.

| Check | Actual observation |
|---|---|
| Focus scrolling | Found Home's focused last action could sit under floating navigation. Android viewport now ends at measured bar top (2662 versus previous 2992); font-2.0 button ends at 2416 above bar top 2488. Safe inset counted once. |
| TalkBack | Visible output identifies selected Quests tab and Create custom quest button; safe modal action/focus observed. Owner confirmed announcements audible. After Keep editing, Back has assistive focus and text remains. |
| Modal return fix | Immediate focus was lost during native window dismissal. Explicit Android request listens for activity focus, settles once for 150ms, expires at 1000ms and cancels on background/unmount/replacement. iOS/web behavior unchanged. |
| Large text / IME | Actual four tabs and Settings apps/activities/days/hours/sessions, History progress/month/reclaimed, custom quest long input/footer/Back/discard checked at font 2.0. Unavailable values/saves remain explicit. |
| Sample states | Separate native QA Days checkbox toggles and reports checked speech/focus; busy day controls disable. Profile Error leaves text/retry editable; Busy disables save/input/discard/remove. No account/API operation. |
| Reduced motion | Isolated Profile Busy indicator: separate button-frame pairs changed 385 pixels normally, 0 with reduced motion and 686 after restoring the preference. Spinner hides; Saving text remains. Original scale 0.5 restored. This is bounded indicator evidence. |
| Local lifecycle | Quest draft remains after Home/background return, injected RUNNING_LOW, and temporary radios off/on. Hardware Back keeps/discards correctly. Own-app force-stop/cold start returns safe Home; unsaved process-death persistence not promised. |
| Cleanup | Baseline font 1.15, timeout 600000, stay-awake 0, TalkBack/services/touch exploration/display speech output off and radios on verified. Existing usage-access allow unchanged. Own servers/reverse mappings/XML removed; no app data erased. |

Important method correction: UI automation dumps disturbed active TalkBack focus,
so early results using that combination were discarded. Clean speech/focus checks
use screenshots/direct input only; hierarchy checks run with TalkBack off. Input
Tab/direct taps do not prove external physical-keyboard or full manual swipe
traversal. Speech captions were remotely observed; owner confirmed audibility,
not every spoken phrase or audio quality. First-use TalkBack tutorial was completed;
optional notification prompt was canceled, not granted. One notification-overlaid
private capture was excluded; tracked images are inspected app-only crops.

`RUNNING_LOW` is an injected callback, not real memory-pressure process death. USB
Metro remained reachable with radios off, so this is local draft continuity, not
API offline/replay acceptance. Rapid project switching/HMR caused development
navigation warnings; one force-stop/single launch cleared them. No warning was
suppressed or represented as a fixed production defect.

Validation passed: full `npm run check` (382 portable / 518 component / 601 API,
199 DB deselected, types/lint/Ruff/contracts/assets), focused final 64/64, web
38-file isolation/71 original SVGs and Android production Hermes export. Existing
11 unrelated lint warnings remain; gallery build has dependency eval/chunk warnings.
Reduced-motion automated and bounded physical indicator checks pass; exhaustive
motion/state matrix, landscape and full manual traversal remain unaccepted.
The parent RN-10 and its joint Auth/iOS/release gates remain open.
