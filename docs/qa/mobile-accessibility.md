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

## Device/live acceptance still required

Record actual model/OS/build, commit/schema versions, steps and observed result
when executing these checks. Do not replace them with a checkbox inferred from
browser emulation or mocked public native APIs.

| Ref | Remaining work | Owner / acceptance evidence |
|---|---|---|
| RN10-D01 | VoiceOver/TalkBack traversal, selected-tab announcements, confirmation/status/error speech and focus | Anisha iOS; Ishmum Android. Signed builds on supported devices; no duplicate/hidden/off-screen announcements. |
| RN10-D02 | Actual Dynamic Type/font scaling, software/hardware keyboard, safe areas, focus scrolling and SVG rendering | Platform owners. Small/standard/large device checks; portrait remains configured, and unsupported rotation is not enabled by this change. |
| RN10-D03 | Real Auth/account/profile lifecycle, guarded root provider integration and two-account/restored-session transitions | Anisha + Ishmum. RN-05/06 and RN-07 live evidence; current callbacks/provider tests do not establish integration. |
| RN10-D04 | Real native authorization/status visibility and foreground reconciliation | Native owners; RN08-D01–D06. No adapter/action is activated by these UI fixes. |
| RN10-D05 | Audit Quests/History/Settings when RN-09b/c/d are implemented | Ishmum; Anisha reviews Auth/iOS impact. Rerun layout, focus, contrast and state matrix on each real increment. |
| RN10-D06 | Cold start, memory pressure, process death, background/foreground/offline restoration and measured responsiveness | Platform/integration owners. Reproducible real-device observations; no promised latency SLA, persisted private cache or synthetic enforcement from JS. |

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
