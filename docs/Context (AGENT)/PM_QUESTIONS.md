# Disconnect — PM Questions and Answer Log

**Created:** 2026-10-28  
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

_No answer recorded._

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

