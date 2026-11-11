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

The native coordinator consumes explicit finite UTC windows, selected-app revision
and session policy. It is not a recurrence/template generator or reward engine.
Streak/reward effects remain signals until their feature producer consumes native
facts. Usage-threshold enforcement, recurrence compilation, production Auth binding,
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
