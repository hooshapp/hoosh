# Disconnect — PM Questions and Answer Log

**Delivery preference (Ishmum,2026-11-12; not a PM answer):** further TalkBack-only
implementation/testing/polish is deferred to a separate later pass to prioritize
shipping. Retain current support and accepted evidence; don't make another
TalkBack session a prerequisite for independent feature/backend work. Existing
part IDs remain; defer rather than mark unperformed acceptance complete.

**Created:** 2026-10-28  
**Implementation defaults (2026-11-10):** Ishmum authorized the defaults appended under Q03/Q04/Q06–Q09/Q14; see [decision record](../architecture/android-intervention-defaults.md). They are implementation authority, not PM-supplied answers.

**Purpose:** Preserve the 22 questions sent to the PM and append answers, clarifications, and resulting decisions as they arrive.  
**Current status (reconciled 2026-11-09):** Responses received for Q02–Q22: **4 Answered, 17 Partial, 1 Unanswered (Q01)**. Answers are product intent, not implementation or platform proof. Original responses are preserved verbatim below; respondent identity and response dates were not supplied. See [accepted decisions and remaining gates](../architecture/pm-decisions-2026-11-09.md).

## How to maintain this file

- Keep question IDs `Q01`–`Q22` stable. They are separate from the existing `PD-xx` decision IDs.
- Append dated entries under the relevant question. Preserve earlier entries when an answer changes, and identify which entry supersedes it.
- Use statuses **Unanswered**, **Partial**, **Answered**, or **Deferred**. A deferred decision should name the affected feature and the boundary for proceeding without an answer.
- Distinguish a PM answer from an engineering feasibility finding or an engineering recommendation. A desired behavior still needs platform validation where applicable.
- When an answer is agreed for implementation, update the relevant [PRD](PRD.md), [TSD](TSD.md), and [decision register](OPEN_DECISIONS.yaml). Record new decisions there when no existing `PD-xx` covers the answer.
- Do not mark a question answered merely because a proposed default exists in another document.

Suggested entry format:

```markdown
- Date: YYYY-MM-DD
  Source / respondent:
  Type: PM answer / clarification / engineering finding / agreed decision
  Answer:
  Concrete example / edge cases:
  Remaining questions:
  Supersedes: none / earlier entry date
  Documents or issues updated:
```

## Resolve early, alongside foundation development

These questions affect enforcement, data structures, platform scope, or migration. Unrelated UI and foundation work can proceed while answers are pending; finalize the relevant behavior before completing its implementation.

### Q01 — Next release scope

**Question:** What must the next release accomplish? Which features are essential, which can follow, and can iOS ship before Android?

**Related:** PRD §11; PD-14 informs Android feasibility. Release scope needs an explicit decision beyond the existing register.  
**Status:** Unanswered

**Answers and follow-ups:**

Pretty much full app, atleast everything seen visually in the figma design.

### Q02 — Session allowance scope

**Question:** What does “2 sessions/day, 15 minutes each” mean? Is that allowance per app, shared across selected apps, or across all distracting apps?

**Related:** PD-01.  
**Status:** Answered

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-01.
  - Answer: Session count and duration apply independently to each selected app. Six sessions/day × ten minutes × two apps gives six sessions per app and 120 minutes of total possible allowance.
  - Remaining questions / acceptance gates: Concurrent timers, selection changes and day-boundary handling are separate Q03/Q04 implementation questions.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q03 — Session start, end, and interruptions

**Question:** What starts and ends a session? Does switching apps continue the same session? Does leaving briefly pause it, end it, or consume another session on return?

**Related:** PD-02.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-02.
  - Answer: Open anyway starts a session; the timer continues after leaving that app and expires automatically into an intervention. Switching apps does not transfer the session.
  - Remaining questions / acceptance gates: Specify concurrent timers across apps, reopening the same app while its timer runs and the relationship between wall-clock duration and native usage thresholds. Pause is a suggestion, not a committed requirement or approved new control.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — Reentry/concurrency; **not a PM answer**.
  - Decision: Reuse a running same-app timer without another charge; concurrent selected apps keep independent elapsed timers that continue in the background.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

### Q04 — Allowance resets and time zones

**Question:** When do allowances reset? What happens at midnight, during travel, or when a session crosses the reset boundary?

**Related:** PD-02; TSD §4.2.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-24/21.
  - Answer: Allowances reset daily at 12:00am. The response also describes access beyond the allowance with a streak penalty.
  - Remaining questions / acceptance gates: Choose the reset time zone and travel/DST/clock-change behavior. Define a session spanning midnight; PM explicitly requested clarification. Streak reset timing also conflicts across Q04/Q08/Q14.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — Reset/day boundary; **not a PM answer**.
  - Decision: Reset daily in the saved plan IANA time zone; do not change it silently during travel. A crossing-midnight session keeps its original expiry and starting-day charge; new sessions after expiry use the new day. Native elapsed-time/boot checks bound exemptions; no backwards day reset.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

- Recorded: 2026-11-10 (weekly activation continuation)
  - Source: Ishmum authorized implementing the complete schedule-to-native flow.
  - Type: Provisional engineering decision; **not a new PM answer**.
  - Decision: Persist the weekly plan natively. Use selected start weekdays and explicit overnight ranges; DST gaps clamp to first valid time, collapsed occurrences skip, repeated-hour windows use earlier start/later end. Stop retains history; policy-zone change still requires explicit reset in this development implementation.
  - Details: [Weekly activation choices](../architecture/android-intervention-defaults.md#weekly-plan-activation-continuation--2026-11-10). Equal-time/full-day and empty-day activation are not inferred; incomplete drafts remain unapplied. Quest lifecycle is separate.

### Q05 — Behavior outside active days and hours

**Question:** What happens outside active days/hours? Are apps unrestricted, are only nudges disabled, or do some restrictions remain?

**Related:** FR-013/014/017; PD-02/04 inform overlapping rules. The active-window policy needs an explicit answer.  
**Status:** Answered

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-19.
  - Answer: Outside configured active days/hours, everything is unrestricted.
  - Remaining questions / acceptance gates: Engineering must reconcile the boundaries without ghost restrictions; the treatment of a scheduled quest extending outside that window still needs to be explicit in the overlapping-rule model.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q06 — Intentional pause triggers and suggested-plan meaning

**Question:** When should the intentional pause appear? Every selected-app opening, only outside an allowance, or under another condition? What does “10-minute break” mean in the suggested plan?

**Related:** FR-007/015; PD-01/02.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-02/03.
  - Answer: During configured restriction times, each selected-app opening should show the intentional pause/redirection. A suggested ten-minute break means the per-session allowance.
  - Remaining questions / acceptance gates: Define reopening during an active allowance and how activities are mapped to specific times. Subconscious intent is product language, not something a launch event can verify.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — Reopening exception; **not a PM answer**.
  - Decision: Do not show another pause while the same app has a valid allowance covering all currently active reasons. A new overlapping reason may prompt, reusing remaining session time.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

### Q07 — Open anyway

**Question:** What exactly does “Open anyway” do? Does it start a session, extend one, or grant extra time? How often can users do it, and when does access expire?

**Related:** PD-03.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-03.
  - Answer: Open anyway starts a session with the user-configured duration and configured per-app session count.
  - Remaining questions / acceptance gates: Q08 permits continued bypass after allowance exhaustion. Define the duration/accounting of that bypass; do not invent an extension cap, fixed extra ten minutes or a reward.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — After exhaustion; **not a PM answer**.
  - Decision: Always allow explicit Open anyway for the configured duration; record a session beyond the per-app daily limit as an exhausted-allowance signal, rather than imposing a hard lock.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

### Q08 — Overlapping restrictions and user overrides

**Question:** Which rule wins when restrictions overlap? Can an allowance bypass a quest? Can users cancel a quest or use an emergency override?

**Related:** PD-03/04; FR-017. Cancellation and emergency behavior need explicit answers.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-03/04/21.
  - Answer: The user can always bypass with Open anyway; the app is never an absolute lock, including the answer to quest-overlap questions. A streak consequence applies at/exceeding the last session.
  - Remaining questions / acceptance gates: Specify app/reason scope and duration of the bypass and exactly when the streak resets. Do not clear every native restriction reason to implement a bypass.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — Bypass scope/streak trigger; **not a PM answer**.
  - Decision: Grant only this app and currently active reasons, preserving all installed reasons. The first extra session beyond the configured count emits the streak-break signal; the final allowed session alone does not. Reward/streak computation remains a separate consumer.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

### Q09 — App selection for quests

**Question:** Which apps does each quest restrict? The global selection, a selection per quest, or a default that users can customize?

**Related:** FR-024/025; Figma annotation `10565:254`. Per-quest selection needs an explicit decision.  
**Status:** Answered

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-18.
  - Answer: All quests use the global app selection, rather than a per-quest app picker.
  - Remaining questions / acceptance gates: Define durable native ownership/revision, account cleanup and stage/commit/discard before wiring production saves. Clarify whether editing global selection changes an already-running occurrence; the global scope decision itself is resolved.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — Active occurrence selection; **not a PM answer**.
  - Decision: Freeze selected apps for an already-active occurrence; future occurrences take the latest explicitly installed global selection. Explicit occurrence edits/cancellation remain separate.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

### Q10 — Quest completion and release conditions

**Question:** What completes a quest and releases its restrictions? Scheduled end, user confirmation, or another signal? What happens when users finish early or abandon it?

**Related:** PD-04/05; FR-025/027.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-05/20.
  - Answer: Saved quests repeat until changed or deleted/replaced.
  - Remaining questions / acceptance gates: This answers template persistence, not what ends an occurrence, releases its restrictions or qualifies completion. Early finish, abandonment and the temporary Home quest remain to be specified.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

## Resolve before completing the corresponding features

These can remain pending while unrelated work proceeds. Do not present illustrative data or unapproved behavior as production functionality.

### Q11 — Quest lifecycle and recurrence

**Question:** What happens after accepting a quest? Define upcoming, active, completed, skipped, cancelled, and missed states, including editing recurring quests.

**Related:** FR-024/026/027; PD-05 informs completion evidence. The complete lifecycle needs an explicit decision.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-05/20.
  - Answer: Accepted quests appear at the top under an Accepted heading and remain editable/personalizable and deletable.
  - Remaining questions / acceptance gates: Define upcoming/active/completed/skipped/cancelled/missed occurrence states, edits to one versus future occurrences, and overlapping/overnight recurrence behavior.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q12 — Credit awards

**Question:** What earns credits? For each action, specify the amount, award timing, repeat limits, and whether the reward is for accepting, quitting, or completing.

**Related:** PD-06.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-06.
  - Answer: PM supplies +20 for quitting at the session-end intervention, +5 for quitting at the opening intervention, +30 for quitting mid-session from a nudge, and +50 for the temporary Home quest. The Home recommendation applies to all globally selected apps for that period.
  - Remaining questions / acceptance gates: Specify exact +50 eligibility/timing, native evidence for each quit, repeat/cadence limits, ambiguous close actions, offline/duplicate handling and whether points and credits are the same unit. Feed cost is not answered; do not approve the Figma −10 example.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q13 — Dino health and feeding

**Question:** What determines Dino health? How does it increase/decrease, and what exactly does feeding do?

**Related:** PD-07/08.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-07/08.
  - Answer: Feeding raises Dino health; not feeding lowers it over time.
  - Remaining questions / acceptance gates: Health decay rate/cadence, feeding increment/cost, bounds and offline/time-zone rules are explicitly unfinished.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q14 — Streak qualification

**Question:** What qualifies as a streak day? Does a missed day reset it, and how do travel and offline activity affect it?

**Related:** FR-028. Streak qualification needs an explicit decision beyond the existing register.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-21.
  - Answer: Streak rewards not exhausting sessions; offline/travel/non-use should not itself break the streak.
  - Remaining questions / acceptance gates: Resolve last-session consumption versus bypass-after-exhaustion reset, per-app aggregation and the qualifying day/increment/reset time-zone rules. Missing telemetry is not proof of non-use.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

- Recorded: 2026-11-10
  - Source: Ishmum explicitly authorized sensible engineering defaults while PM clarification is pending.
  - Type: Provisional implementation decision — Exhaustion default; **not a PM answer**.
  - Decision: Use the first session beyond the daily per-app count as the exhausted-allowance/streak-break signal. Do not break merely for starting or finishing the final permitted session. Full day qualification/award computation is still separate.
  - Authority/details: [Android intervention defaults](../architecture/android-intervention-defaults.md). Supersedes only the corresponding unresolved implementation choice; preserve the original PM response and label. Auth/tokens/iOS deferrals remain unchanged.

### Q15 — History metrics and measurement coverage

**Question:** What should History measure? Selected-app usage or total usage? What baseline and comparison period should it use? What should appear when measurements are unavailable?

**Engineering follow-up:** Establish what each platform can actually supply before committing to the desired metrics.  
**Related:** PD-11; FR-031/032/033.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-11/23.
  - Answer: Measure selected-app usage and turn-offs by nudge type. Use a fixed starting baseline, equivalent week/month comparison, baseline minus current usage and clearly unavailable states. A lifetime extrapolation is illustrative, not measured.
  - Remaining questions / acceptance gates: Define initial baseline capture/duration, period normalization, selection changes, incomplete coverage, negative savings and turn-off evidence. Platform measurement feasibility remains an engineering gate.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q16 — Life-years forecast

**Question:** Should the life-years forecast remain? If so, what defensible calculation supports it, and why would gender be needed?

**Historical engineering recommendation, superseded as product intent by Q16 response:** Omit it initially. The formula/validation gate still applies.
**Related:** PD-12.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-12.
  - Answer: PM wants the remaining-lifespan comparison and age/gender collection for that purpose and future R&D. This supersedes the unapproved recommendation to omit it as a product preference.
  - Remaining questions / acceptance gates: No life-expectancy dataset, population, formula, uncertainty or validation is supplied. Forecast stays disabled until these exist; no demographic-based restriction inference is authorized.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q17 — Accounts, authentication, and account lifecycle

**Question:** Is an account required before trying the app? Which sign-in methods are required, and what happens to local plans when users sign out or delete their account?

**Related:** PD-09/10; FR-002; PRD §14. Local protection behavior during sign-out/deletion needs an explicit answer.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-09/10.
  - Answer: An account is required. PM prefers no sign-out control; if sign-out exists it should preserve data and native nudges. Account deletion should delete all user information.
  - Remaining questions / acceptance gates: Required sign-in providers, final sign-out UI choice, local rule/event isolation across account changes, offline deletion and acknowledged cleanup on other devices remain unspecified. Auth credential/cache erasure is separate from deleting product data or stopping nudges.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q18 — Permission deferral and recovery

**Question:** What experience remains when permission is skipped or revoked? Which features work, and how should users restore protection?

**Related:** FR-006/018; NFR-002.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-25.
  - Answer: Without Screen Time permission, show generic options rather than measured History or usage-based plan/quest personalization.
  - Remaining questions / acceptance gates: Define revoked-state recovery, which previously configured rules remain, and per-platform capability-specific gating. Permission alone does not promise measurable app data or protection.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q19 — Demographics and minimum age

**Question:** Why collect age and gender? What user benefit requires them, what minimum age is supported, and can these questions be removed from initial onboarding?

**Related:** PD-17; FR-003; PD-12 if demographics are used for projections.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-17.
  - Answer: PM wants age and gender collection for the Q16 purpose; collection is not rejected from onboarding.
  - Remaining questions / acceptance gates: Minimum supported age, mandatory versus skippable fields, validation, disclosure/consent and retention are not answered. Existing synthetic optional UI does not approve real collection.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q20 — Personalization and tone

**Question:** What personalization is promised initially? Activity-based templates, behavior-based suggestions, or generated AI copy? What tone can users choose?

**Related:** PD-16; FR-020/036.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-16/26.
  - Answer: Use a friendly tone with no tone chooser initially. Personalize generated quests from interests and, where measurable, usage timing; suggested quest times should reflect those inputs.
  - Remaining questions / acceptance gates: Model/provider, permitted input aggregation, budget, evaluation, failure/offline behavior and implementation/release sequencing are not selected. The ring statement is a future concept, not a current implementation requirement.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q21 — Calendars and multiple devices

**Question:** Are calendars and multi-device synchronization launch requirements? If multiple devices are supported, are allowances per device or shared?

**Related:** PD-13; FR-035. Multi-device allowance scope needs an explicit decision beyond the existing register.  
**Status:** Answered

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-13/22.
  - Answer: Calendars and multi-device synchronization are not required initially. Shared allowances across devices of the same user are a future intent.
  - Remaining questions / acceptance gates: Do not implement or claim cross-device session reconciliation now; its consistency/offline policy needs a future design.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.

### Q22 — Success criteria and required data

**Question:** What evidence will demonstrate success? Choose the initial retention, protection reliability, quest adoption, and measurable usage outcomes; decide what data we need to collect.

**Related:** PRD §3 metrics M-01–M-09; PD-11 informs measurement feasibility. Numeric targets and initial experiment scope remain to be agreed.  
**Status:** Partial

**Answers and follow-ups:**

- Recorded: 2026-11-09 (actual response date not supplied)
  - Source: PM responses supplied by Ishmum; [verbatim source](#original-pm-responses).
  - Type: PM answer; interpreted below without treating omissions as approval. Register refs: PD-23.
  - Answer: Success should emphasize recorded turn-offs by intervention type and measured time reclaimed, aggregated across users when comparable.
  - Remaining questions / acceptance gates: Numeric success targets, observation period, retention/adoption/reliability thresholds, consent/data retention and aggregation eligibility are not supplied. The 20-user/ten-hours example is hypothetical, not traction or evidence of causal savings.
  - Supersedes: earlier unapproved recommendations only where explicitly stated; no earlier PM answer existed.
  - Documents updated: [ADR](../architecture/pm-decisions-2026-11-09.md), [decision register](OPEN_DECISIONS.yaml), PRD/TSD and affected core-plan gates. No runtime behavior changed.


<a id="original-pm-responses"></a>

## Original PM responses

Preserved verbatim as supplied. Recorded 2026-11-09; actual response dates and respondent name were not provided. Summaries/statuses above separate explicit choices from remaining details.


2. What does “2 sessions/day, 15 minutes each” mean?
Is that allowance per app, shared across selected apps, or across all distracting apps?
Sessions set up are for all apps. Say that someone set up 6 sessions/day for 10 mins for 2 apps. That means in total they have 6*10*2 mins per day of social media or blocked apps. So 6 sessions/app, goes to both apps, not 3 and 3.
3. What starts and ends a session?
Does switching apps continue the same session? Does leaving briefly pause it, end it, or consume another session on return?
Session starts when user taps on “open anyway”, user could pause it from the island (although thats not in the design, if requested i could do that). And what ends the session is when the timer runs out the session will be ended automatically giving user the block screen. Switching apps doesnt continue the same session. Leaving briefly doesnt pause it or end it, for example if they are using instagram and they go to notes app to write something down quick the session will still keep going. So having a pause button would be nice i feel like. So user could pause and save the time of their session. 
4. When do allowances reset?
What happens at midnight, during travel, or when a session crosses the reset boundary?
Allowances reset every day 12:00am. What do you mean by session crosses the reset boundary ? like if the user finishes all sessions? Then they are gonna be blocked from the apps with block screen but they can still turn the app on, but doing this, they will lose their streak. Streak will go back to 0. 
5. What happens outside active days/hours?
Are apps unrestricted, are only nudges disabled, or do some restrictions remain?
Everything is unrestricted. 
6. When should the intentional pause appear?
Every selected-app opening, only outside an allowance, or under another condition? What does “10-minute break” mean in the suggested plan?
Intentional pause when someone opens the app subconsciously.
Every selected app opening, during the time that they set they wants to be blocked and redirected, and the redirection would be something that they chose for that specific time. 
10 mins break is the allowance that they are getting each session. 
7. What exactly does “Open anyway” do?
Does it start a session, extend one, or grant extra time? How often can users do it, and when does access expire?
Starts a session. How often? However much of sessions they set up, 1 session expires on however much time user set the limit for, all sessions expires when all set sessions expire. 
8. Which rule wins when restrictions overlap?
Can an allowance bypass a quest? Can users cancel a quest or use an emergency override?
Users can always bypass by clicking “open anyway”, app is never totally blocked. It just resets the streak if it was the last session. 
9. Which apps does each quest restrict?
The global selection, a selection per quest, or a default that users can customize?
Global selection.
10. What completes a quest and releases its restrictions?
Scheduled end, user confirmation, or another signal? What happens when users finish early or abandon it?
Quests on quest page stays, and keeps repeating until the user changes it to new quest, or deletes it and adds new quest from the suggestions on quest screen. 
11. What happens after accepting a quest?
Define upcoming, active, completed, skipped, cancelled, and missed states, including editing recurring quests.
It shows as accepted on the quest screen, goes to the top of the screen under accepted small header, where they can still personalize or delete the quest. 
12. What earns credits?
For each action, specify the amount, award timing, repeat limits, and whether the reward is for accepting, quitting, or completing.
When closed after one session is closed and block and redirect screen it shown - 20 credits 
When closed after block and redirect screen is shown after opening app subconsciously - 5 points
When closed mid session from the nudge - 30 credits  
Homescreen quest (this one is temporary btw), what i mean by temporary is basically, if the user is using the phone and gets in our app, homescreen will show one recommended quest, which is for that specific time and its gonna block all the selected apps for that time, and for doing this user will get the most credits  - 50 credits. 
13. What determines Dino health?
How does it increase/decrease, and what exactly does feeding do?
Feeding increasing the dino health, not feeding decreases over time (havent thought how often its gonna decrease, we have to come up with something for that) 
14. What qualifies as a streak day?
Does a missed day reset it, and how do travel and offline activity affect it?
Streak is nothing but not finishing all the sessions, so being offline or when travelling if the user isnt really using their phone, its not gonna reset their streak, if anything, thats better for the streak as they are not using the sessions at all. Thats what we want, we want more no-screen hours for the user.
15. What should History measure?
Selected-app usage or total usage? What baseline and comparison period should it use? What should appear when measurements are unavailable? Engineering must establish what each platform can actually supply.
History measures how much the user has reduced time spent in the apps they’ve chosen to limit, rather than unrelated phone usage. It also tracks how often they turn away from those apps after a nudge.


Baseline: their usage when they started using the product—a fixed starting benchmark, not the previous week.
Comparison: the selected period, This week or This month, compared with the equivalent baseline period.
Time reclaimed: baseline usage minus current usage. The example shows 12h 30m → 2h 30m = 10 hours saved, or 80% less screen time.
Turn-offs: the number of times a nudge resulted in the user turning away from an app during that period.
Lifetime projection: an illustrative extrapolation of the current savings rate, not another measured statistic.
Unavailable measurements: show “Not enough data yet” or “Usage data unavailable,” with a short explanation—not zero, fabricated savings, or a lifetime projection.
Engineering should confirm what each platform can measure and flag any limitations against this intended behaviour.
16. Should the life-years forecast remain?
If so, what defensible calculation supports it, and why would gender be needed? My recommendation is to omit it initially.
Dont worry about gender, thats the only information for our future R&D, that piece of information might come handy in the future. But for now the only place its gonna be used is to track the average male/female age and to give them a time about how much they were wasting out of their rest of the average lifespan vs how much they are able to reclaim. 

17. Is an account required before trying the app?
Which sign-in methods are required, and what happens to local plans when users sign out or delete their account?
Account is required, we are working with personalized nudges, thats our USP, and to be able to do that, we are gonna need account to hold their information and use it for their betterment,. 
We dont have a signout option right now, but if you wanna implement, sure. Signout wont take out or delete any information, and nudges should still work when user is signed out. I recommend not keeping sign out option, but if a user deletes account, it deletes all the information of the user. 
18. What experience remains when permission is skipped or revoked?
Which features work, and how should users restore protection?
If user doesnt give screentime permission, we wont be able to show history, neither we will be able to generate a plan for them or personalize their quest based on time and apps. Its gonna give generic options in that case. We can talk about it more. 
19. Why collect age and gender?
What user benefit requires them, what minimum age is supported, and can these questions be removed from initial onboarding?
Already explained. We need it. 
20. What personalization is promised initially?
Activity-based templates, behavior-based suggestions, or generated AI copy? What tone can users choose?
For now, users cant choose tone, tone should be friendly for now, in future, based on user feedback and interviews, we can pivot from their and think about adding an option for choosing the tone of the ai for the nudges. And the ring will also be able to track what tone it needs to be, so its not in the design purposefully. 
Personalization for now: giving generated quests based on user interests that they choose in the app, and based on screentime access, we can see what time they use the apps the most, and ai can use that information to see when they are free and using it the most, so creating a quest, their is already suggested time and everything in there, so its gonna be personalized in that way.
21. Are calendars and multi-device synchronization launch requirements?
If multiple devices are supported, are allowances per device or shared?
Allowances are shared across devices of same user. But for now we are not implementing it for other devices, we could easily implement that later. 
Calendars and multi-device synchronization is not required, thats why its not in the sign up questions. 
22. What evidence will demonstrate success?
Choose the initial retention, protection reliability, quest adoption, and measurable usage outcomes; decide what data we need to collect.
We decide success by the history page, thats the most important when it comes to measuring success. We should be able to see how many turn offs were possible from session end block, mid session block, subconscious block, then how many hours of times we are able to reclaim for the user. This will help us pitch infront of the investors. For example: say that we have 20 users. And each on average are saving 10 hours a day using our app, thats 200 hours a day, 1400 hours a week, and almost 2 months combined that we are saving for the user for them to do what they love to do! 



## RN09B-D02–D04 implementation defaults — 2026-11-11

Authority: Ishmum explicitly requested the whole D02/D03/D04 and authorized the
best user-facing defaults. These are engineering defaults, **not PM answers**;
original PM replies above remain authoritative. The new request supersedes the
older Auth/token deferral for this quest-integration task. No shared Auth project
settings, credentials or production identities are changed automatically.

- **Account integration:** Supabase remains the sole credential/session owner.
  Connect the existing AuthSessionPort and AccountDataProvider, rather than add a
  second token manager. Native credentials use OS secure storage; web sessions are
  memory-only initially. No private route is shown before account bootstrap.
  Sign-out immediately invalidates private work; local storage failure locks the
  app instead of claiming success. Anisha can reuse/replace the producer through
  the existing interface without changing quest consumers. This does not replace
  her onboarding, provider setup or native iOS ownership.
- **Save versus schedule (Q10/Q11):** Saving edits a reusable definition. Explicit
  scheduling chooses a first local date and acknowledges the global app selection.
  A non-repeating quest runs on that date only; repeating quests recur in the saved
  IANA zone. Never silently interpret an undated saved definition as today.
- **Occurrence boundaries:** Upcoming becomes active at its scheduled start and
  ends at its scheduled end, even without JS/network. Ending releases only that
  occurrence's restriction reason. Finishing early is explicit cancellation,
  never automatic completion. Existing Open anyway remains available and its
  configured per-app allowance does not erase other active reasons.
- **Recurrence edits:** Edits affect future starts only after explicit schedule
  update; active occurrences retain their definition/app snapshot. Stop cancels
  future starts and releases this quest's active reasons. Delete must explicitly
  stop this device's schedule first; failure must not claim restrictions stopped.
- **DST/travel/overlap:** Use the quest's saved zone, not the device's new zone.
  For ambiguous times use earliest start/latest end; nonexistent boundaries clamp
  to the first valid instant. Skip zero-duration DST occurrences. Concurrent quests
  retain independent reasons; canceling one never releases another or the weekly plan.
- **Completion and rewards (Q10–Q13):** A timer ending means ended, not proof of
  activity. The user explicitly confirms completion after the end; otherwise the
  occurrence is missed. A canceled occurrence cannot earn completion. Use the PM’s +50 Home-quest award as the default for an ended, explicitly
  confirmed quest, once per occurrence; label completion as self-reported.
  Credits and points are the same non-monetary unit initially. No inferred
  usage/saved-time claim. Preserve the PM’s session-allowance streak meaning: quest
  completion must not redefine or fabricate that streak. An exhausted-allowance
  event may break the relevant day; missing telemetry alone must not. Existing
  +5/+20/+30 native quit awards and Dino/Feed producers remain separate feature
  consumers; do not infer a quit merely from dismissing this quest editor.
- **Suggestions:** Use transparent activity-based curated suggestions initially;
  label their source. No suggestion is represented as AI-generated without an
  actual model response. Model generation must stay optional and failure-safe;
  neither restrictions nor saved quests depend on an LLM call.
- **Acceptance:** Automated contract/account/native tests are distinct from real
  user-account, physical Android/TalkBack and signed iOS evidence. Implement code
  independently and record any unavailable device/account/signing gate precisely;
  never mark D04 complete from component presets alone.


### RN09B lifecycle default details — 2026-11-11

Provisional engineering decisions under Ishmum’s same authorization, not new PM
answers: allow completion confirmation for seven days after scheduled end to
support forgetting/offline use; after that show missed. Scheduled start must be
future, on an explicit date within the next year. Editing a saved definition does
not re-install a device schedule. Stop/Delete must confirm native Stop on this
device before claiming protection ended; an account save alone is insufficient.
A failed/uncertain server write requires explicit read/review, with no automatic
mutation queue. Credits are +50 per self-reported completed occurrence, unique by
owner/quest/schedule/date. Existing PM native quit rewards and allowance-based
streak are not redefined. See [lifecycle contract](../architecture/quest-occurrence-lifecycle.md).


### Native event coverage default — 2026-11-11

Under the same full-integration authorization: a full local diagnostic journal must
not disable protection, block Open anyway or turn a friendly intervention into a
hard lock. Retain a bounded recent journal and persist a monotonic dropped-event
counter when it overflows. Native-event rewards/allowance streak consumers must
treat a coverage gap as unknown evidence, never assume a successful quit/streak.
Explicit self-reported quest completion remains its separate server-checked ledger.
No native quit award is inferred from this journal change.


#### Device account ownership and diagnostics — 2026-11-11 implementation defaults

Ishmum-authorized D02–D04 choices, not new PM answers. Login/refresh/read/sign-out
never silently replace installed rules. “Use this account on this device” requires
explicit confirmation that the previous account’s local rules stop. Its private
allowance/session history is archived locally; returning to that account restores
stopped rules, never automatically resumes. No cloud account is deleted. Sign-out
masks private UI and retires handles while leaving installed device rules running;
the user must explicitly Stop first to remove those rules.

Diagnostic retention is bounded at 256 events with a monotonic gap count. Reaching
the bound must not disable protection or trap a user by disabling Open anyway.
No missing-event gap is converted into earned credits, saved time or a healthy
streak. SDK bootstrap failures remain locked with explicit retry; an actual
same-user replacement session fences old callbacks, while routine token refresh
does not discard current forms. These choices remain revisable by PM.


#### Shared quest controls and ownership clarification — 2026-11-11

Authorized implementation choices, not additional PM answers: require an explicit
first date and saved quest definition before Schedule. Use the installed session
policy when present (including its reset zone); otherwise require saved session
count/minutes and display the saved-plan or quest zone used. Missing settings link
to existing editors; no hidden default test policy. Stop is device-first, then
account update; offline failure may leave account-enabled/device-stopped, shown
explicitly. Resume/Apply is always a separate action. Deletion requires a confirmed
local Stop. Cancelling one occurrence leaves future repeats and other reasons.
Expired cancellation metadata is pruned, future cancelled dates are retained.

Ishmum reiterated that Auth/sign-in/onboarding is Anisha's responsibility. The
D02 SDK/root foundation already added is a coordinated integration handoff for her
review, not a takeover of those flows. Real-account phone sign-in and combined SDK
acceptance are pending; continue shared quest/Android implementation independently.
Anisha's iOS bridge/signed build is also not ready. No credential/token entry in
chat, Auth administration or further Auth-flow implementation is required here.


### RN09-D01 delivery defaults — Ishmum-authorized implementation,2026-11-13

These fill remaining reward/Dino parameters for full RN09-D01, not new PM answers:
Dino starts50health, loses5 per elapsed24hours (server clock); Feed costs20credits
and restores up to20health, capped100. Full health or insufficient funds costs
nothing. Original artwork bands are0–24needsCare,25–49feelingLow,50–74doingOkay,
75–100happy. Credits/points are the same non-monetary unit. Quest50completion is
retained in the account ledger even if the saved quest is later deleted.
Explicit native Return home earns5 at initial pause,20 after an allowance expires,
30 at the mid-session nudge. Never award on presentation/Open anyway/Keep going.
Deduplicate encounter/session identity; native quit awards have a60second account
cooldown, so repeatedly reopening cannot farm points rapidly. Offline replay does
not duplicate awards. The first extra session beyond the configured per-app daily count breaks that
day's streak; the final permitted session alone does not. A completed covered local day with
no exhaustion increments it; missing coverage freezes/unavailable, not successful
or broken. Require native evidence, not API receipt time, for the local date.
Native business events remain separate from bounded diagnostic telemetry; missing
business evidence is explicitly unknown. Permissions/restrictions never depend on
upload success, wallet state, Feed or a model. Auth/iOS/TalkBack deferrals remain.

RN09-D01 precision: health decay starts at the first wallet activity (the initial
GET is a nonmutating50health/default0balance); the UI states that start. Pending
device uploads are bounded256/30days; account ledger receipts remain until account
deletion for idempotency/history. Full-day coverage needs an applied monitoring
configuration and uninterrupted service/process/boot/clock witness, including
screen-off sleep in the same service. Reconnect, owner archive or Stop freezes
coverage; the first partial day is unknown. Previous Android disclosurev1 does
not approve the added event sync; the updatedv2 disclosure names the uploaded
content-free choices/allowance/coverage metadata explicitly.

RN09-D01 final policy reconciliation: preserve the existing2026-11-10 Q14
implementation decision: only starting the first EXTRA session beyond the daily
count emits exhaustion/streak break. The initial D01a/b wording/producer used
`>=` in error; D01c corrects it to `>`, with a regression assertion for both the
last permitted and first extra session. This is a correction to preserve existing
accepted behavior, not a new PM answer or new final-session penalty.

### RN09-D02 / RN09C-D01–D02 implementation defaults —2026-11-13

Under Ishmum's request to implement History fully, use the first seven consecutive
complete local days for the same saved app selection as a fixed baseline. Start
with the previous seven closed days where Android retains adequate event evidence;
otherwise collect prospectively until such a run exists. Current periods are the
last seven/28 closed local days AFTER the baseline (28days explicitly means four
weeks, not an unequal calendar month). Normalize each day to24hours for DST before
comparing; show actual date ranges, source, observed time and coverage. A zero
baseline has no percentage reduction; negative savings mean increased usage and
must stay visible. No data, retention loss, event cap, permission/lock/reboot gap,
selection or saved-timezone change makes the affected comparison unavailable,
never measured0. Changing selection/device/timezone needs an explicit new baseline;
no automatic reset or mixing of accounts/selections. Turn-offs count uniquely
accepted explicit native quits by initial/expired/mid-session type, including
cooldown-no-credit quits, not shield presentations or generic app closes. Receipt
coverage is described separately from usage completeness. Lifespan prediction
remains disabled under Q16/PD-12. These are documented engineering defaults, not
new PM answers; product decisions remain revisable.

History collection has separate explicit Start/Restart consent. Stopping collection
is a local owner-checked action that works offline or after usage revocation; it
erases local collection state but retains existing server summaries until replaced
or the account is deleted. It does not activate or stop app protection. A pending
read is cancelled so it cannot restore a stopped collection's presentation. These
are recovery/privacy implementation choices, not additional PM-supplied answers.
