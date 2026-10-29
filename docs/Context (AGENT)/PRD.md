# Disconnect — Product Requirements Document (PRD)

**Version:** 1.0 — agent handoff baseline  
**Date:** 2026-10-28  
**Product:** Disconnect, iOS + Android  
**Stage:** Existing iOS app released; expanding to a cross-platform product and preparing for accelerators including YC  
**Document owner:** Founding team (review and approve open decisions)  
**Design source:** [Figma — App-UI](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1)  
**Related:** `TSD.md`, `AGENT_START_HERE.md`  
**Status legend:** **[VERIFIED BY TEAM]** explicitly reported tested; **[DESIGNED]** appears in Figma but not necessarily implemented; **[PROPOSED]** engineering/product recommendation; **[UNKNOWN/DECISION]** needs founder decision or code inspection. **Do not silently convert a proposed choice into a product fact.**

---

## 0. AI-agent operating instructions

1. **Read this PRD and the TSD fully before writing code.** Treat the linked Figma as the visual design authority. Do not generate a substitute design system.
2. **Inspect the existing iOS repository before making architectural changes.** The existing app already has working native functionality. Preserve proven Swift, extension targets, capabilities, configuration, App Groups, and the existing production app identity.
3. **Do not assert a feature is shipped because a Figma screen exists.** Respect status labels and the explicit decision register.
4. **Implement product logic behind testable, platform-neutral interfaces**, with native adapters for each OS. Never implement native enforcement using a JS timer or a remote request.
5. **Do not fabricate usage or time saved.** Some figures and names in Figma are demonstration content.
6. **Safety and user agency:** never use deceptive nudges, fabricate peer statistics, shame people in vulnerable moments, or falsely promise an unblockable lock. A user must have a clear, honest way to manage voluntary self-control settings.
7. **If a platform cannot support a Figma interaction, report the gap and provide a proposed alternative** rather than claiming equivalent iOS and Android enforcement.
8. Every issue/PR must link its `FR-`/`NFR-` requirement IDs, relevant Figma frame ID, test plan, affected native components, and any scope deviation.
9. No production feature may be marked finished until it works on a physical device using an appropriately signed build where applicable.

## 1. Executive product definition

**Mission:** Help people break unintentional short-form social-media scrolling loops and redirect attention toward self-chosen real-world activities and meaningful goals.

**Core job to be done:** “When I open distracting apps automatically or keep scrolling longer than I intend, help me notice, choose intentionally, and return to something I care about without making me feel worse.”

**Positioning:** A personalized behavior-change and attention tool, not merely a passive screen-time tracker or a blanket blocker. Disconnect combines native interruption, configurable allowances, real-world quests, contextual reminders, progress feedback, and optional rewards.

**Primary beachhead:** Motivated college students (~18–24) who feel out of control of scrolling despite academic, career, wellness or social goals. The older problem board names the priority segment **“Ambitious but Undisciplined.”** Other observed segments: **“Productive Identity, Hidden Scroller”** and **“Avoidance Scroller.”** Do not treat people content with their scrolling as primary targets.

**Platforms:** iOS and Android; shared React Native presentation/application domain, native platform monitoring and interventions. No identical enforcement guarantee across OSs.

**Business intent:** Build a low-cost, bootstrapped, reliable product, establish retention and measurable behavioral value, apply to YC and other accelerators. Monetization, paywalls and institution sales are not specified as launch requirements.

## 2. Evidence base and source precedence

### 2.1 Research-derived observations

**Early snapshot in `Report.pdf`:** 80 college-student survey responses and 11 in-depth interviews, not the latest overall company totals. The accompanying spreadsheet is an early 80-response dataset; avoid mixing its denominator with later outreach.

| Observation | Early survey measurement | Interpretation (do not overclaim) |
|---|---:|---|
| Scroll when bored | 73/80, 91.25% | Boredom is a common self-reported trigger |
| Scroll during procrastination | 68/80, 85.0% | Avoidance and task re-entry are important |
| Scroll late at night | 67/80, 83.75% | Evening scheduling is relevant |
| Scroll when stressed | 44/80, 55.0% | Messages must not exacerbate stress |
| Report guilt after prolonged scrolling | 46/80, 57.5% | Avoid shaming tone |
| Very/sometimes willing to try a 30–60 sec replacement action | 77/80, 96.25% | Stated willingness, **not** proven intervention effectiveness |
| Interested in improving phone habits (very/somewhat) | 77/80, 96.25% | Interest, **not** retention or willingness to pay |
| Career/internship goals | 60/80, 75.0% | Goal personalization opportunity |
| Discipline/habit goals | 54/80, 67.5% | Goal personalization opportunity |

Interviews describe boredom, fatigue, overwhelm, avoidance, muscle memory and instant reward; consequences include regret, attention fragmentation, and difficulty returning to cognitively demanding tasks. Existing limits are commonly bypassed. Early evidence favors *in-the-moment interruption plus a low-effort alternative*, not a generic screen-time chart alone.

**Later company status [USER-REPORTED]:** 80+ potential-user interviews as of this conversation, several (~3–4) full design iterations, prior research context of 200+ surveyed students, and a released iOS application. Counts describe different research activities and time points; **do not present the early PDF's 11 interviewees as the current total or claim 80+ interviews are independently audited by the supplied report**. Team previously reported 20+ active beta users; treat current activity count as unverified until updated from analytics.

**Current iOS feasibility [VERIFIED BY TEAM]:** Apple Family Controls distribution entitlement obtained; native app selection/restriction, timers, nudges, and continuing restrictions tested. Monitoring and nudges work with the main app terminated; team has tested persistence through restart, lock/unlock and time-zone changes. This does **not** verify every new Figma flow, new React Native integration, or Android implementation.

### 2.2 Source precedence

1. **Existing working native source code and current product behavior**, after engineering inspection, for what is already implemented.
2. **Current Figma** for visual appearance, screen content, navigation intent, and designed product behavior.
3. **This approved PRD/TSD** for explicit cross-platform contracts, testable semantics, acceptance criteria and intentional adaptations.
4. Older `Report.pdf`, `Problem Board.pdf`, older `DEMO.pdf` and survey data for user insights and prior explorations.
5. Newer team decisions recorded in the decision register and reflected in revised docs.

Where two sources conflict, document the conflict instead of guessing. In particular, the early *app shuffle* concept is **not a current core screen in the expanded Figma UI**; modern Figma centers on Screen Time shields, session allowances, quests and progress. On iOS, the system home screen cannot be reordered by a third-party app.

## 3. Goals, non-goals, success metrics

### Goals

- **G-01:** Users can voluntarily set selected-app restrictions and app-session allowances that operate even when Disconnect is not open.
- **G-02:** A meaningful, contextual pause happens at the right intervention point, with safe offline fallback.
- **G-03:** Users can accept or create achievable real-world quests, then see progress without misleading measurement claims.
- **G-04:** A consistent cross-platform user experience, while describing limitations truthfully.
- **G-05:** Reliable privacy-preserving measurement of engagement, interruptions, overrides, and retention.
- **G-06:** Remain as close to $0/month hosting as reasonable until capacity/reliability requires spending.

### Non-goals for the first production cross-platform release

- Replacing the system launcher or rearranging actual iOS Home Screen icons.
- Reading every TikTok/Instagram video, swipe, message, or feed context; standard Screen Time APIs do not expose this as general behavior data.
- Making restrictions impossible for an adult device owner to disable.
- Full hardware lockbox/BLE device integration (separate future initiative).
- A multi-agent LLM infrastructure, reinforcement learning system, or fine-tuned behavioral model.
- Subscription billing/paywall before pricing and willingness to pay are validated.
- Competitor feature cloning, hidden surveillance, or compulsory parental-control functionality.

### North-star and guardrails

**Suggested north-star [PROPOSED]:** Weekly number of users who experience a restriction/pause and subsequently demonstrate a reduction in unwanted targeted-app usage relative to a defined baseline, with sufficient data quality. Because iOS privacy and measurement availability vary, the metric must be computable per-platform and accompanied by coverage/limitations; never invent it.

**Primary metrics** (separately track iOS/Android and versions):

| ID | Metric | Definition |
|---|---|---|
| M-01 | Week-1 and week-4 retention | Cohort users who return and engage with a meaningful core activity within days 7/28 (define exact window in analytics spec) |
| M-02 | Protection activation rate | Authorized users with >=1 selected app and >=1 successfully installed native restriction configuration / eligible onboarded users |
| M-03 | Intervention opportunity rate | Valid, observable intervention events / observable eligible activity opportunities; report measurement coverage |
| M-04 | Decision/quit rate | Unique, verified native quit actions / eligible actionable interventions; *not* proof of time saved |
| M-05 | Override rate | Unique temporary-access/continue actions / eligible interventions |
| M-06 | Targeted usage trend | Per-user period-over-period usage change where the OS permits a reliable comparable measurement |
| M-07 | Reliability | Native schedule installation success, shield presentation success (when measurable), and stale block incidents |
| M-08 | Quest adoption | Accepted/scheduled quests / users presented with quests; separate self-reported completion |
| M-09 | Crash-free sessions and critical incidents | Monitor native extensions separately from JS crashes |

**Guardrails:** accidental lockouts, permission revocation, high notification volume, uninstall rate, user-reported distress/shame, misleading measurements, battery use, and Android Play compliance.

No numeric growth target is asserted by the source files. Suggested experiments: initial 20-person cohort, retention and usage measurement for 2–4 weeks, comparison of interventions using consented, anonymized/aggregated data.

## 4. Personas and intent

**P-1: Ambitious but undisciplined** — career/academic/fitness goals, high awareness of the habit, wants a timely interruption and progress feedback. Avoid condescending framing.

**P-2: Avoidance scroller** — turns to a feed when stressed, fatigued or stuck. Needs low-pressure alternatives and optional gentler messages; do not turn a stressful moment into a guilt spiral.

**P-3: Connection-driven scroller** — uses social media for relationships and social cues; needs flexible access and intentional sessions rather than indiscriminate blocking.

**JTBD examples:**
- "When I reflexively tap TikTok during a study break, prompt me to decide if I truly want to open it."
- "When my agreed 15-minute session ends, help me exit and return to reading."
- "When I plan to work out, protect that time from my selected distracting apps."
- "Show progress that is measured honestly rather than pretending every nudge equals saved time."

## 5. End-to-end journeys

### Journey J-01 — First-run setup

1. User sees playful landing experience (three pages about scrolling) → sign up/login (email and Google example).
2. Gender and age are **optional**; neither determines app restrictions.
3. User chooses 2–4 most-used/distracting apps (source Figma example; exact maximum is a UI rule, not an OS requirement).
4. User chooses desired replacement activities such as Gym, Reading, Arts & Crafts, Walking, Music, Cooking or custom Studying.
5. App explains the permission and hands off to the actual platform authorization flow. Denial yields useful partial experience and honest state.
6. A suggested plan is generated from chosen apps and activities; the user may accept or configure manually.
7. User sees a completion/celebration screen, then Home.

**Onboarding must survive** app restart, permission denial, incomplete signup, and offline situations without a false "protected" badge.

### Journey J-02 — Intentional pause

1. Selected app launch hits a supported intervention condition.
2. Native enforcement presents a platform-supported message using cached contextual copy, or a safe generic fallback.
3. User sees "Quit Now" (Figma shows +5 example) or "Open anyway" (example 10 min, no points).
4. Native state transitions predictably; optional credit-event evidence is buffered for reconciliation.
5. If continued, the configured temporary allowance expires without the main app being open.

### Journey J-03 — Session ends

1. A planned app session or budget expires, with correct per-app/combined accounting once defined.
2. Native shield presents session-ended messaging (Figma example: "Time to get back to reading Carl Max") with "Quit Now" (+20 example) or "Open anyway" (+10 min no reward).
3. Overlapping quest restrictions retain precedence; override must not accidentally remove unrelated blocks.

### Journey J-04 — Quest and redirection

1. Home may show a **temporary** recommendation (example: read 20 minutes), not automatically attached to saved profile.
2. Quests tab shows suggested Gym and Reading schedules. User accepts, personalizes or creates a custom quest.
3. Scheduled quest restricts selected apps for its duration, using a separate restriction reason/source.
4. On end/termination, only the quest-specific reason is removed. Other active limits remain.
5. Quest completion may be self-reported unless verified evidence exists; rewards must not imply a verified real-world action.

### Journey J-05 — History and progress

1. History shows **turn-offs from nudges**, screen-time comparisons *if measurable*, and time saved *if validly computed*.
2. Secondary screens provide progress narrative and screen-time reduction visualization.
3. Figma examples such as "51 turn-offs," "12h 30m → 2h 30m," "10 hours saved," "80%," and "1.8 years" are **mock data, not actual customer outcomes**.
4. Forecasts must be explicitly labeled hypothetical; **recommend omitting the age/gender-based life-years calculation until ethically and statistically reviewed**.

## 6. Functional requirements

Priority labels: **P0** core release, **P1** full Figma scope, **P2** future/optional. Status **D**=Figma designed, **V**=existing iOS behavior reported verified, **N**=new/shared build, **U**=unconfirmed feasibility.

### 6.1 Auth, onboarding and permissions

| ID | Prio | Status | Requirement and acceptance criteria |
|---|---|---|---|
| FR-001 | P0 | D/N | Landing 1–3 reproduces the intended scrolling narrative; offers accessibility skip/reduced motion |
| FR-002 | P0 | D/N | Email/password signup/login with validation, duplicate handling, password reset; Google sign-in only if configured on both platforms |
| FR-003 | P0 | D/N | Optional age/gender with skip; don't infer limits from demographic fields |
| FR-004 | P0 | D/N | Let user pick distracting apps; reflect native authorized selection, not fabricated installed-app data |
| FR-005 | P0 | D/N | Let user select at least one redirection activity or custom activity |
| FR-006 | P0 | V/D | Permission screen explains scopes and supports Allow/Not now and recovery after revocation |
| FR-007 | P0 | D/N | Suggested plan uses selected apps/hobbies; estimates visibly illustrative; offer Accept vs Set up on my own |
| FR-008 | P0 | D/N | Persist resumable onboarding steps and progress; onboarding status does not falsely imply active restrictions |
| FR-009 | P1 | D/N | Profile edit, age and gender editors, selected-app and activity editors from Settings |

### 6.2 Protection, allowances and nudges

| ID | Prio | Status | Requirement and acceptance criteria |
|---|---|---|---|
| FR-010 | P0 | V (iOS) | Native monitoring is independent of main React Native process; offline-capable and tolerant of termination/restart |
| FR-011 | P0 | V (iOS), U (Android) | Selected apps can be shielded/otherwise intervened on using OS-supported, policy-compliant APIs |
| FR-012 | P0 | V (generic iOS) | Show meaningful native pause/intervention without network-dependent rendering |
| FR-013 | P0 | D/N | Manual active days, active hours, apps, and sessions/day × minutes/session are editable and validated |
| FR-014 | P0 | D/N | Explicit session-state semantics and accounting; no duplicate events; correct midnight and overlap logic |
| FR-015 | P0 | D/N | Intentional pause displays correct context; "Quit Now" vs "Open anyway" actions use supported OS semantics |
| FR-016 | P0 | D/N | Session-end shield restricts according to policy; 10-minute extension (example) has deterministic expiration if supported |
| FR-017 | P0 | D/N | Multiple restriction reasons compose correctly; removing one cannot clear another active reason |
| FR-018 | P0 | D/N | Permission denial/revocation, failure and unsupported platform behaviors show accurate status and recovery steps |
| FR-019 | P1 | D/N | Five-minute-before-threshold recommendation, if supported by platform monitoring/warning semantics |
| FR-020 | P1 | D/N | Personalized message references chosen activity and known context; safe generic offline fallback |
| FR-021 | P1 | D/N | App/session settings can change mid-cycle; state and monitoring are reconciled atomically |

### 6.3 Quests and recommendations

| ID | Prio | Status | Requirement and acceptance criteria |
|---|---|---|---|
| FR-022 | P1 | D/N | Home transient recommendation can be accepted or skipped without silently creating a permanent quest |
| FR-023 | P1 | D/N | Quests list displays selected-interest suggestions (Gym, Reading examples), recurrence and duration |
| FR-024 | P1 | D/N | User can accept, personalize, create, edit, cancel a quest with title, activity, start/end, repeat, weekdays |
| FR-025 | P1 | D/N | Quest app restrictions activate and end correctly even when app is terminated, within platform capabilities |
| FR-026 | P1 | D/N | Recurrences and overlapping quests are deterministic; offline edits reconcile correctly |
| FR-027 | P1 | D/N | Completion distinguishes scheduled end, user-confirmed done, and genuinely verified completion |

### 6.4 Engagement, home, history, settings

| ID | Prio | Status | Requirement and acceptance criteria |
|---|---|---|---|
| FR-028 | P1 | D/N | Home: Dino mood/health, feed/credits, weekly time/progress card, current streak, recommendation card |
| FR-029 | P1 | D/N | Dino renders authentic supplied vector variations; mood bands 0–25, 26–50, 51–75, 76–100%, based on defined score model |
| FR-030 | P1 | D/N | Event-based reward credits tracked with ledger/idempotency; design examples +5 pause, +20 stop, +30 early nudge, +50 home quest, −10 feed are **illustrative**, not a universal policy |
| FR-031 | P1 | D/N | History "turn-offs" based on uniquely accepted quit events, not generic blocked attempts |
| FR-032 | P1 | D/N | Usage/time stats display source, range and measurement completeness; no fabricated figures |
| FR-033 | P1 | D/N | Show progress narrative and percentage comparisons only where baseline/current data are comparable |
| FR-034 | P1 | D/N | Profile settings, activities, apps, days, hours, app sessions, save states and errors |
| FR-035 | P2 | D | Google/Apple Calendar connections displayed in Figma; integration optional and permission-dependent |
| FR-036 | P2 | CONCEPT | AI-generated personalized nudges after deterministic system works; never a dependency for enforcement |
| FR-037 | P2 | CONCEPT | App shuffle / hardware integrations: separately scoped, no iOS Home Screen manipulation claim |

### 6.5 Navigation map / Figma mapping

**Canonical navigation:** Floating bottom navigation with Home, Quests, History, Settings; onboarding/auth outside tab navigator. Reuse exact Figma composition and spacing rather than substituting stock UI.

| Screen/group | Figma frame ID | Navigation intent |
|---|---|---|
| Landing pages | `1:2`, `6:34`, `6:71` | Launch → auth |
| Signup / Login | `18:2`, `27:59` | Auth flows |
| Gender / Age | `27:113`, `48:79` | Onboarding 1–2/7 |
| Most-used apps / Hobbies | `48:81`, `50:83` | Onboarding 3–4/7 |
| Permission / Plan loading / Plan | `50:85`, `52:690`, `50:87` | Onboarding 5–6/7 |
| Manual plan + expanded states | `10556:120`, `10596:1767`, `10596:1861`, `10596:1968`, `10596:2062` | Alternate setup path |
| Congratulations | `50:89` | Onboarding 7/7 → Home |
| Home | `22:4` | Main tab |
| Dino states | `88:96` | Home component variants |
| Intentional pause / session-end / recommendation | `10514:168`, `65:91`, `76:69` | Native intervention/context-specific views |
| Quests + editors | `27:155`, `10487:126`, `10577:427` | Quests tab and edit flows |
| History summary/progress/time reclaimed | `27:153`, `10570:192`, `10570:193` | History tab and drill-down |
| Settings + expanded day/hour/session/gender | `27:157`, `10601:6315`, `10601:6513`, `10601:6690`, `10601:6146` | Settings tab |
| Settings app/activity/age selection | `10601:5968`, `10601:6057`, `10601:5908` | Settings drill-down |
| Visual stylebook | `10611:12784` | Design-system authority |

**Important Figma annotations:** Home recommendations are temporary, whereas Quests are saved or scheduled. Intentional-pause quit is shown as +5 and stopping a session-ended scroll as +20. Do not infer different rewards from the visual treatment alone.

## 7. Design requirements (from Figma visual stylebook)

**Reference frame:** 393 px mobile baseline; follow safe-area requirements and proportional layouts rather than hardcoding all screen heights.

| Role | Token | Guidance |
|---|---|---|
| Primary action green | `#33C659` | CTAs, selection, progress |
| Success green | `#0B9968` | Positive data, checkboxes, reward badges |
| Warm text | `#3D2800` | Main everyday-app foreground |
| Warm canvas | `#FFF1DD` | Home, Quests, History, Settings |
| Raised card | `#FFFAF2` | Everyday cards |
| Warm card header | `#FFD8A1` | Recommendation cards |
| Dark canvas | `#222222` | Onboarding, auth, personal plan |
| Dark card | `#2A2A2A` | Onboarding surfaces |
| Floating nav | `#1A1A1A` | Nav background |
| Dividers | `#E8DCC8` | Warm boundaries |
| Card outline | `#E8D5B0` | Recommendation borders |
| Mascot palette | `#248D40`, `#9CEAAE`, etc. | Illustration-only colors, do not redefine action tokens |
| Font | Space Grotesk 300/400/500/700 | No synthetic 600 weight; preserve original vector icons |

Other measured patterns: onboarding primary CTA 345×52 with radius 10, floating bottom bar 353×62 radius 31, search row 353×48 radius 14, recommendation card 361 wide radius 24, standard settings row 353×56 radius 14. These are reference specimens, **not a universal sizing rule**. Accessible hit targets >=44×44 pt wherever practical; audit contrast, font scaling, keyboard, screen readers and reduced motion.

Open states **not defined by Figma**: all loading/error/empty/disabled/pressed states, validation, offline messaging, accessibility focus, long-text behavior. Agents must propose these to match the existing visual language.

## 8. User-facing behavior and copy principles

1. Warm, direct, supportive; small actions reduce effort to return to focus. No guilt or humiliating peer comparisons by default.
2. Do not imply app activity proves a user was viewing short-form video specifically or that a user read/exercised unless verified.
3. Examples of allowed copy: "Opened out of habit? You chose this time for reading." / "Want to use your planned time or return to your goal?"
4. Always explain why a permission is needed, when a shield is active, and what overrides do.
5. "Earn credits" must describe observable actions and verifiable evidence accurately.
6. User can reconfigure or disable self-imposed plans; never imply the system permanently owns their device.
7. No account-level age/gender-based restriction algorithms, despite those optional form fields.
8. Where OS features differ, use understandable feature-availability explanations rather than pretending identical behavior.

## 9. Non-functional requirements

| ID | Priority | Requirement / acceptance |
|---|---|---|
| NFR-001 | P0 | **Offline-first enforcement:** restrictions, cached messages, pending events operate without FastAPI/Supabase connectivity |
| NFR-002 | P0 | **No false protection:** UI may say "Active" only if native authorization and configuration install have been confirmed |
| NFR-003 | P0 | **Crash resilience:** already-active iOS system-managed monitoring persists independently of app JS lifecycle; test signed builds |
| NFR-004 | P0 | **No stale locks:** releasing one reason only removes that reason; clean recovery on disable/revoke/uninstall/update as feasible |
| NFR-005 | P0 | **Privacy minimization:** avoid raw app usage uploads, anonymous browsing profiles, PII in analytics; respect native data access limits |
| NFR-006 | P0 | **Security:** authenticated endpoints, RLS for any direct Supabase access, no service keys in mobile, encrypted storage of secrets |
| NFR-007 | P0 | **Auditability:** event IDs, config versions, cause/reason codes, native error categories; no duplicated rewards |
| NFR-008 | P1 | **Accessibility:** VoiceOver/TalkBack, contrast, Dynamic Type, large targets, reduced motion |
| NFR-009 | P1 | **Performance:** monitor realistic device responsiveness; don't block opening shield on network/AI/JS startup |
| NFR-010 | P1 | **Observability:** capture monitoring setup failures, extension failures, sync backlog and app lifecycle separately |
| NFR-011 | P1 | **Cross-platform consistency:** same user-visible policy vocabulary and core data definitions, platform capability flags |
| NFR-012 | P0 | **Cost control:** stay within free quotas by default, no always-on servers unless justified, budget alerts and backups |
| NFR-013 | P1 | **Scalability:** modular monolith API, pooled DB connections, event batching, idempotent writes, capacity monitoring |

Latency/SLO numerical targets are **[DECISION]**; agents must instrument baseline and propose thresholds before release, rather than invent a promised SLA.

## 10. Platform parity contract

| Capability | iOS | Android | Requirement for user-visible product |
|---|---|---|---|
| Select controlled apps | FamilyActivityPicker (native tokens) | Usage data/package selection under permitted APIs | Same conceptual flow; platform-specific permission UI |
| Detect usage | DeviceActivity monitoring | UsageStatsManager + permitted background mechanism | State correct within each OS's constraints |
| Present intervention | ManagedSettingsUI shields/extensions | Policy-compliant overlay/notification/other approved UX | Same intervention *intent*, potentially different affordances |
| Enforce block | ManagedSettings shield | **Not equivalent by default**; prototype and validate | Don't claim unbreakable parity |
| Scheduled tasks | Native monitors/schedules | Native scheduler plus background constraints | Deterministic recurring policy where supported |
| Historical data | Screen Time report restrictions/privacy | Available usage stats subject to user permissions | Separate metric coverage and label unavailable states |
| AI suggestions | Cached server-optional | Cached server-optional | Never required for enforcement |

## 11. Delivery phases and gates

**Phase 1A — iOS native feasibility:** team reports core proof verified. **Exit gate:** authorization/selection, threshold, shield+nudge, termination, offline, restart, signed-build behavior, and release/recovery all pass applicable P0 tests. This is not a request to rebuild existing Swift functionality.

**Phase 1B — Android native feasibility:** open; prototype app usage, permissions, compliant interventions, background/boot behavior on real devices, and a truthful capability matrix. Must not block development of shared UI/backend.

**Phase 2 — Cross-platform app:** implement Figma navigation, auth, onboarding, plans, FastAPI, data model, iOS Swift adapter, Android adapter (or explicit limited-capability state), core tracking and regression tests.

**Phase 3 — Full Figma scope:** quests, custom schedules, overlapping rules, reward ledger/Dino, history, configuration editors, reliability, analytics, accessibility, production integration.

**Phase 4 — Experimentation/scale:** AI copy personalization behind feature flag, calendar connections, paid infrastructure when necessary, experiments; hardware separately.

**End-of-phase sign-off criteria:** Build works from existing source, physical-device behavior documented, E2E acceptance tests for relevant `FR-*` requirements, errors/permissions handled, no invented stats, platform limitations disclosed, and a reproducible release build.

## 12. Release acceptance scenarios

| Scenario | Reqs | Pass conditions |
|---|---|---|
| AC-01 First-run | FR-001–008 | User finishes setup or defers permission without claiming active protection |
| AC-02 Terminated app | FR-010–012 | Monitoring and supported native intervention continue with main app terminated |
| AC-03 Session expiry | FR-013–017 | Correct threshold and shield; override does not silently remove another rule |
| AC-04 Offline restriction | FR-010/020, NFR-001 | Works without backend; uses cached/generic prompt |
| AC-05 Edit active plan | FR-013/021 | Reconciles native schedule idempotently, no ghost monitoring |
| AC-06 Quest overlap | FR-024–027, FR-017 | End one quest, other restriction reason remains |
| AC-07 App permission revoked | FR-006/018 | Accurate status; recovery with fresh selection and no crash |
| AC-08 History accuracy | FR-031–033 | Mock metrics never render as production data |
| AC-09 Duplicate event | FR-030, NFR-007 | At-least-once sync yields one ledger reward |
| AC-10 Android parity | FR-011/012 | Compliant, tested Android alternative is explicitly documented |
| AC-11 Existing users | NFR-003/004 | Upgrade preserves existing iOS data and monitoring where possible |
| AC-12 Accessibility | NFR-008 | Logical focus, readable labels and functional control sizing |

## 13. Founder decision register — don't let AI agents guess

| Decision ID | Open question | Recommended default **[PROPOSED]** | Required before |
|---|---|---|---|
| PD-01 | Are the “2×15-minute sessions” per selected app, per group, or global? | Combined allowance for selected distracting apps, unless team specifies per-app | Session-engine production coding |
| PD-02 | What starts/ends a session? Does a five-minute interruption count as one? | Explicitly define state machine; inactivity grace configurable | Timer logic |
| PD-03 | Does “Open anyway” consume a session, extend one, or create a bonus? Maximum extensions? | Bounded +10 minutes, no reward, never overrides quest block | Shield action coding |
| PD-04 | Do quests hard-block during the activity even with unused allowance? | Yes; active quest precedence | Restriction coordinator |
| PD-05 | What counts as completing a quest? | User-confirmed, visibly labeled self-reported | Rewards/history |
| PD-06 | What exactly awards +5/+20/+30/+50 and costs −10? | Do not hardcode Figma example amounts until approved | Ledger implementation |
| PD-07 | What is Dino health? | Computed from verified meaningful events, not moral worth | Home/Dino implementation |
| PD-08 | Does the app support the “Feed” feature? | Display only after behavior and credit cost defined | Home implementation |
| PD-09 | Does onboarding require login? | Support account creation but graceful permission deferral | Auth |
| PD-10 | Is Google sign-in required for V1 on both platforms? | Confirm provider configuration; avoid fake button | Auth release |
| PD-11 | Which usage metrics are legally/technically available per OS? | Capability map, show unavailable as unavailable | History/analytics |
| PD-12 | Should the life-years forecast exist? | Omit until reviewed; never infer from gender | History release |
| PD-13 | Are Calendar connections launch-critical? | No, feature-flagged | Settings release |
| PD-14 | What Android intervention model will Play permit? | Prove with signed prototype and policy review first | Android release |
| PD-15 | Migration from existing iOS app architecture? | Reuse Swift code and production app identity; no rewrite without audit | RN integration |
| PD-16 | Default voice/tone of nudges? | Supportive, opt-in stronger tone later | Personalization |
| PD-17 | Age range and app availability? | Confirm minimum age, privacy and store rating | Publishing |

Agents should record answers in a machine-readable ADR/decision log, update the PRD/TSD after approval, and add regression tests for each resolved policy.

## 14. Research, privacy and ethics notes

- Survey and interview results describe a campus convenience sample; don't generalize prevalence to all students.
- Distinguish qualitative quotes, quantitative counts, and observed app behavior.
- Avoid designing intentionally guilt-inducing notifications without user controls and safety evaluation; older ideation includes aggressive/ego-based copy, while the newer Figma uses a warmer tone.
- Instrument capability and consent: iOS privacy restrictions can limit raw per-app analytics; never claim precise screen-time reduction unavailable to the product.
- Users must be able to see what data is collected, revoke optional permissions, delete their account, and disable voluntary protection in a safe and understandable way.

## 15. Source and reading list

**Internal source materials:** `Report.pdf`, `Problem Board.pdf`, `Survey on Productivity FOR COLLEGE.xlsx`, `figma_export/DEMO.pdf` (older demo, **not** current app scope); design file linked above. Research stats come from the early spreadsheet/report; current company totals and iOS status are team-reported in this conversation.

**External technical constraints (verified 2026-10-28):**
- Apple Family Controls: https://developer.apple.com/documentation/familycontrols
- Apple DeviceActivityMonitor: https://developer.apple.com/documentation/deviceactivity/deviceactivitymonitor
- Apple DeviceActivityCenter: https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter
- Apple ManagedSettingsUI: https://developer.apple.com/documentation/managedsettingsui
- Apple Family Controls distribution entitlement: https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement
- Android UsageStatsManager: https://developer.android.com/reference/android/app/usage/UsageStatsManager
- Android Google Play Accessibility policy: https://support.google.com/googleplay/android-developer/answer/10964491

---

**PRD implementation rule:** If a user-visible decision is absent from this document and Figma, implement a clearly labeled fallback and request a product decision in the issue. **Do not silently invent product behavior.**
