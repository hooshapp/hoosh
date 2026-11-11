# Android intervention defaults — 2026-11-10

**Authority:** Ishmum explicitly instructed the engineering agent to choose sensible
user-facing defaults for the remaining RN-08 questions and record them in
PM_QUESTIONS.md. These are authorized provisional implementation decisions, not
new PM answers. Anisha retains Auth/onboarding/iOS; tokens/Auth remain deferred.

| Area | Chosen behavior | Reason |
|---|---|---|
| Same-app reentry | Reuse its unexpired session and deadline; no extra session charge or new pause for already-covered reasons. | Leaving briefly should not spend another allowance. |
| Concurrent apps | Independent per-app elapsed timers; timers keep running in the background. | Matches the PM's per-app allowance and avoids transferring time. |
| Daily reset | Midnight in the saved plan's IANA time zone, captured from device time zone when creating the plan. Travel does not silently change it. Native day buckets use that time zone, including DST. | Predictable daily allowance while travelling. |
| Crossing midnight | Existing session keeps its deadline and is charged to its starting day. A new session after expiry uses the new day's allowance. | No interruption or free extension at midnight. |
| Clock/reboot | Use elapsed realtime plus wall deadline and boot identity for an active allowance. Rollback or reboot invalidates its exemption; no attempt to defeat Android force-stop/security controls. Day counters never reset backwards. | Prevent accidental indefinite exemptions without pretending this is tamper-proof. |
| Beyond daily allowance | Open anyway remains available for the configured duration. Increment the per-app session count. Emit an exhausted-allowance signal only when an extra session starts; consuming the last allowed session alone does not break a streak. | Preserves autonomy and makes the warning/consequence understandable. |
| Overlapping reasons | Explicit bypass applies only to this app and the reasons active at that action, until their capped deadlines. Never delete reasons. A newly starting reason can prompt again; reuse an existing session's remaining time without charging/extending it. | Avoid bypassing unrelated apps or future quests. |
| Editing global selection | Preserve the app snapshot of an already-active occurrence. Future occurrences use the latest explicitly installed global selection. Editing/canceling an occurrence is a separate explicit operation. | No surprise changes midway through a quest. |
| Policy edits | Preserve running session deadlines and daily counts; timezone changes require clearing the stopped test installation in this prototype. Real plan timezone editing needs a coordinated migration, not implicit allowance reset. | Prevent policy Save from granting extra time. |

The original native coordinator consumes explicit finite UTC windows, selected-app
revision and session policy. The subsequent weekly-plan compiler now persists one
weekly definition and resolves its occurrences on demand; it remains separate
from quest lifecycle/completion and the reward engine.
Streak/reward effects remain signals until their feature producer consumes native
facts. Usage-threshold enforcement, quest recurrence/completion, production Auth binding,
store approval, signed release and iOS are not established by a debug native test.

## Platform approach and limits

Use a user-enabled AccessibilityService with window-package metadata only and a
visible accessibility overlay. No screen-node retrieval, gesture injection,
SYSTEM_ALERT_WINDOW, broad package permission or polling foreground service. The
service is debug-only until production ownership and release review are complete.
Android's [AccessibilityService API](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService)
and [overlay type](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#TYPE_ACCESSIBILITY_OVERLAY)
provide the implementation primitives; this is an implementation direction whose
actual device behavior must be tested, not an OS-wide reliability claim.

Google Play distinguishes non-accessibility tools and requires disclosure/consent
and declaration/review. Its current [Accessibility API guidance](https://support.google.com/googleplay/android-developer/answer/10964491?hl=en)
describes deterministic user-defined automation separately from autonomous action.
This app must not label itself a disability accessibility tool. No store approval
is claimed. Disclosure is shown in-app before opening system access settings.


## Weekly plan activation continuation — 2026-11-10

Ishmum authorized implementing days/hours/session settings through Apply/Update/Stop
and live development-owner verification. The following are explicit engineering
choices for that implementation, not additional PM answers:

- At least one start day, complete coherent HH:mm range, explicit IANA zone and
  positive bounded session count/minutes are required. Empty/incomplete drafts
  remain saveable by existing draft APIs; they are never implicitly unrestricted
  or automatically installed. Equal start/end is rejected; no inferred 24h mode.
- A selected weekday names the start date. Overnight ends the following local
  date even if that next day is not selected. Windows are half-open [start, end).
- Nonexistent DST boundary times clamp to the transition's first valid instant;
  if both ends collapse, that occurrence is skipped. A repeated-hour start uses
  the earlier offset, end uses the later offset, yielding one continuous window.
  Calendar dates skipped by a zone transition are also skipped, not doubled.
- The weekly template repeats natively without a finite-horizon renewal job.
  Preview is bounded to yesterday through seven days ahead, with ended windows
  omitted. Date range is 1970–2100 for this implementation; invalid dates fail
  explicitly. No background network or JavaScript timer is necessary.
- Apply/Update is an explicit native revision CAS and independent readback of
  exact spec/revision/selection. App selection changes do not silently alter an
  already-active occurrence. Later occurrences use the newly applied snapshot.
  Schedule edits themselves take effect on explicit Update; they do not preserve
  removed schedule periods. No quest occurrence rules are implied.
- Stop retains installed settings and daily/running-session history, disables
  recurrence and clears grants. Reapply uses a new native revision. Changing the
  policy time zone requires explicit local test reset; Stop alone does not erase
  history. A production history-preserving zone migration remains separate.
- Native record v2 reads v1 finite records, upgrades on a successful write and
  persists the schedule atomically with counters/events. Older binaries cannot
  read v2; do not downgrade over retained state.

The implementation uses [Java zone rules](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/zone/ZoneRules.html)
and [Android API desugaring](https://developer.android.com/studio/write/java8-support)
with Google's pinned `desugar_jdk_libs:2.1.5` for API 24/25 compatibility. Keep actual
API/device execution evidence separate from compilation. Auth/tokens, Anisha's
iOS, production release/store review and quest/reward producers remain deferred.
