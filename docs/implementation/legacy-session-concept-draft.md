# Swift session and nudge behavior — approved model and implementation

November 4, 2026. Owner approved the model and user-chosen session lengths in chat (“let’s go with this model”). Retain the legacy SwiftUI appearance. The sections below preserve the proposal context; the implementation section supersedes its pending status.

## Sources checked

Live Figma nudge-notification node 10472:70: personalized recommendation five minutes before the timer ends, accept/skip. Live Block node 65:91: session-ended shield, sessions-used counter, Quit Now, explicit Open anyway (+10-minute example). Existing manual-plan documentation supports sessions/day and duration as independent authoring values, explicitly distinct from nudge duration. PRD/PM questions leave session accounting and override rules unresolved.

## Proposed distinct controls

Keep per-app accounting, consistent with the owner's previous choice. Daily budget is the total normal usage allowed per app per calendar day. Session duration is the length of a single intentional use period, separately configurable and bounded by the remaining daily budget. Nudge cadence is independent: quarter-session active-use milestones, optionally the single five-minutes-before-end warning illustrated in Figma. Do not inherit bypass length from a daily limit.

Example for discussion: app daily budget 30 minutes, session duration 30 minutes; personalized nonblocking notifications around 8/15/23 active minutes; session-end shield at 30. Alternative: two 15-minute sessions with nudges around 4/8/12 active minutes in each. A five-minute interval is a user choice, not an imposed cycle. Confirm session choice before implementation.

Initial intentional-pause shield gates a new session during protection hours. Reopening while a session is active continues its remaining allowance; it does not restart the clock, award another session or promise an OS callback on every launch. Count actual app usage rather than locked/background elapsed time. Daily budget exhaustion retains the shield. An explicit extra-time action, if retained, must be a separately displayed, bounded override rather than an unlimited automatic renewal; exact override count/cap remains to be agreed.

Nudges use onboarding preferences and pre-generated cached AI alternatives, with local complete-sentence fallback. Shield extensions cannot make network requests. Quarter milestones use native usage events; do not claim exact delivery or lock behavior until device tests pass. No arbitrary overlay over another app is promised.

## Difference from installed build

Installed build currently waits for a per-app daily threshold before its first shield, and uses that app's daily duration for a subsequent bypass. It does not implement the proposed initial session gate or per-session quarter nudges. Today's build/test results must not be described as proof of this proposed concept.

## Implemented legacy Swift increment

- Per-app daily budgets remain 5–240 minutes. A separate optional session-length field migrates existing rules to min(15, daily allowance). Controls permit 5/10/15/30 minutes plus adjustment up to the daily budget. No existing daily values are silently changed to 30.
- Selected apps are shielded before the first session. The action starts only that app's session; initial gating is intentional in this model. A live session persists on foreground/reopen without restarting. Session-length changes apply next session. Daily allowance changes retain measured session usage and re-register the native total threshold; earlier current-day OS usage still counts.
- One activity observes each active session, with one event per active-use minute. Quarter milestones round up (30 => 8/15/23; 15 => 4/8/12). Only quarter milestones notify. Native callbacks, not wall-clock timers, update monotonic per-app usage. Duplicate, old-activity and out-of-order callbacks cannot charge twice. Early exit uses recorded full-minute checkpoints; daily OS threshold additionally accounts for all selected-app use, including sub-minute usage and usage before migration.
- Session ending removes its grant and reapplies the union of shields; the other app's session remains independent. Next normal session is clipped to the recorded daily remainder, and the OS daily cap can end it earlier if earlier device usage was not represented in the new ledger. No claim of precise remaining seconds is shown.
- Extra time is explicitly labeled and separate: 10 minutes once per app/day is the engineering default to prevent unlimited renewal. User approved separation of extra time; the exact once/day cap was chosen for this implementation, not quoted as an explicit user requirement. No quest/reward integration is claimed.
- Minute callbacks may be coalesced/delayed by iOS. Lock, force-quit, reboot, midnight and notification display still require physical tests. A 24-hour safety expiry and local-day rollover invalidate stale grants; no wall-clock loop generates reminders.
- Nudge actions can end exactly the activity referenced by that notification. A notification for an old session cannot end a new one. User must enable notifications; UI reports denial. Cached valid AI messages rotate, with varied goal-aware local fallback. Shield rendering never calls the network.
- Removed the old visible break-length controls from onboarding and Settings to avoid a third conflicting duration. Native design, App Group, bundle identifiers and the existing picker remain unchanged. Protection is continuous in this build; active-day/hour scheduling remains separate work and is disclosed in UI.

## Validation

Portable session-policy regression checks passed: independent settings, migration, 30/15-minute quarter marks, clipped remaining allowance, early exit, duplicate/stale callbacks, monotonic usage, explicit extension accounting, persistence, initial gating, daily cap and day/expiry boundaries. Existing per-app policy checks also passed after rebuilding their executable. Signed iPhone build passed; extension package/entitlement and device installation evidence recorded separately below after completion.

A live POST to the existing AI endpoint using synthetic reading preferences returned HTTP 200 with five active reminder strings. The deployed endpoint does not yet return the new shieldPrompts array; the shield can rotate the returned short active messages as well as shieldPrompt. This verifies a synthetic backend response, not personalized notification delivery on the phone. No backend deployment, Git push or production release performed.
