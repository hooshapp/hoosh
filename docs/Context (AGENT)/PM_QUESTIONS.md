# Disconnect — PM Questions and Answer Log

**Created:** 2026-10-28  
**Purpose:** Preserve the 22 questions sent to the PM and append answers, clarifications, and resulting decisions as they arrive.  
**Current status:** All questions are unanswered in this log. Recommendations in other documents are not approved answers.

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
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q03 — Session start, end, and interruptions

**Question:** What starts and ends a session? Does switching apps continue the same session? Does leaving briefly pause it, end it, or consume another session on return?

**Related:** PD-02.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q04 — Allowance resets and time zones

**Question:** When do allowances reset? What happens at midnight, during travel, or when a session crosses the reset boundary?

**Related:** PD-02; TSD §4.2.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q05 — Behavior outside active days and hours

**Question:** What happens outside active days/hours? Are apps unrestricted, are only nudges disabled, or do some restrictions remain?

**Related:** FR-013/014/017; PD-02/04 inform overlapping rules. The active-window policy needs an explicit answer.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q06 — Intentional pause triggers and suggested-plan meaning

**Question:** When should the intentional pause appear? Every selected-app opening, only outside an allowance, or under another condition? What does “10-minute break” mean in the suggested plan?

**Related:** FR-007/015; PD-01/02.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q07 — Open anyway

**Question:** What exactly does “Open anyway” do? Does it start a session, extend one, or grant extra time? How often can users do it, and when does access expire?

**Related:** PD-03.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q08 — Overlapping restrictions and user overrides

**Question:** Which rule wins when restrictions overlap? Can an allowance bypass a quest? Can users cancel a quest or use an emergency override?

**Related:** PD-03/04; FR-017. Cancellation and emergency behavior need explicit answers.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q09 — App selection for quests

**Question:** Which apps does each quest restrict? The global selection, a selection per quest, or a default that users can customize?

**Related:** FR-024/025; Figma annotation `10565:254`. Per-quest selection needs an explicit decision.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q10 — Quest completion and release conditions

**Question:** What completes a quest and releases its restrictions? Scheduled end, user confirmation, or another signal? What happens when users finish early or abandon it?

**Related:** PD-04/05; FR-025/027.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

## Resolve before completing the corresponding features

These can remain pending while unrelated work proceeds. Do not present illustrative data or unapproved behavior as production functionality.

### Q11 — Quest lifecycle and recurrence

**Question:** What happens after accepting a quest? Define upcoming, active, completed, skipped, cancelled, and missed states, including editing recurring quests.

**Related:** FR-024/026/027; PD-05 informs completion evidence. The complete lifecycle needs an explicit decision.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q12 — Credit awards

**Question:** What earns credits? For each action, specify the amount, award timing, repeat limits, and whether the reward is for accepting, quitting, or completing.

**Related:** PD-06.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q13 — Dino health and feeding

**Question:** What determines Dino health? How does it increase/decrease, and what exactly does feeding do?

**Related:** PD-07/08.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q14 — Streak qualification

**Question:** What qualifies as a streak day? Does a missed day reset it, and how do travel and offline activity affect it?

**Related:** FR-028. Streak qualification needs an explicit decision beyond the existing register.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q15 — History metrics and measurement coverage

**Question:** What should History measure? Selected-app usage or total usage? What baseline and comparison period should it use? What should appear when measurements are unavailable?

**Engineering follow-up:** Establish what each platform can actually supply before committing to the desired metrics.  
**Related:** PD-11; FR-031/032/033.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q16 — Life-years forecast

**Question:** Should the life-years forecast remain? If so, what defensible calculation supports it, and why would gender be needed?

**Engineering recommendation, unapproved:** Omit it initially.  
**Related:** PD-12.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q17 — Accounts, authentication, and account lifecycle

**Question:** Is an account required before trying the app? Which sign-in methods are required, and what happens to local plans when users sign out or delete their account?

**Related:** PD-09/10; FR-002; PRD §14. Local protection behavior during sign-out/deletion needs an explicit answer.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q18 — Permission deferral and recovery

**Question:** What experience remains when permission is skipped or revoked? Which features work, and how should users restore protection?

**Related:** FR-006/018; NFR-002.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q19 — Demographics and minimum age

**Question:** Why collect age and gender? What user benefit requires them, what minimum age is supported, and can these questions be removed from initial onboarding?

**Related:** PD-17; FR-003; PD-12 if demographics are used for projections.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q20 — Personalization and tone

**Question:** What personalization is promised initially? Activity-based templates, behavior-based suggestions, or generated AI copy? What tone can users choose?

**Related:** PD-16; FR-020/036.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q21 — Calendars and multiple devices

**Question:** Are calendars and multi-device synchronization launch requirements? If multiple devices are supported, are allowances per device or shared?

**Related:** PD-13; FR-035. Multi-device allowance scope needs an explicit decision beyond the existing register.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._

### Q22 — Success criteria and required data

**Question:** What evidence will demonstrate success? Choose the initial retention, protection reliability, quest adoption, and measurable usage outcomes; decide what data we need to collect.

**Related:** PRD §3 metrics M-01–M-09; PD-11 informs measurement feasibility. Numeric targets and initial experiment scope remain to be agreed.  
**Status:** Unanswered

**Answers and follow-ups:**

_No answer recorded._
