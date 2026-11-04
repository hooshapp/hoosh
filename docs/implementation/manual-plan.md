# Manual personal plan editor — AUTH-12 UI/local authoring slice

Implemented on `landing-page`, November 2, 2026; uncommitted. Requirements FR-007/008/013, NFR-002/008. This completes the five requested Figma presentations, not the production plan/enforcement contract.

## Source and screens

| Figma frame | Node |
|---|---|
| set up on my own | `10556:120` |
| Personal plan · Active Days expanded | `10596:1767` |
| Personal plan · Active Hours expanded | `10596:1861` |
| Personal plan · App Sessions expanded | `10596:1968` |
| Personal plan · Select Apps expanded | `10596:2062` |

`ManualPlanScreen.tsx` composes one accordion editor with four expanded states. Original full-frame SVG exports and icon crops are in `assets/onboarding/manual-plan`; the manifest records SHA-256 hashes and source IDs. Original calendar, clock, timer, app/pencil, info and chevron paths are used. Space Grotesk, charcoal cards and green selection styling use existing tokens. Controls have 44px minimum height, which intentionally increases the expanded controls' height relative to the compact Figma chips. The page scrolls rather than clipping on short displays.

## Actual behavior

- “Set up on my own” on the suggested-plan screen now opens this editor. Back returns to suggestion review and retains the manual draft. Only one section is expanded at a time.
- Days support individual toggles plus Weekdays, Every day and Weekends. At least one day is required.
- Hours default to 9:00 AM–10:00 PM. Text fields accept 12-hour AM/PM or 24-hour `HH:mm`, with noon/midnight handled explicitly. A two-handle slider works with pointer dragging and keyboard on web; native supplies PanResponder and accessibility increment/decrement actions. Native gestures still require device acceptance.
- The UI permits a same-day range only; the end must follow the start. Invalid typed times disable Save even if the hours panel is collapsed. Correct text or moving a slider recovers. This is a local editor validation boundary, not an approved overnight enforcement policy.
- Sessions support 1–4 per day and 5/10/15/30 minutes. The design's explanatory copy distinguishes planned app sessions from nudge duration. Defaults 2 × 15 are UI authoring defaults, not approved native accounting/override semantics.
- App choices match Figma: Instagram, TikTok, YouTube, Snapchat, Reddit and Facebook. X is also retained when selected in the existing questionnaire or restored manual draft. At least one app is required. The editor initializes from the user's actual earlier choices rather than imposing Figma's demonstration selection. These are preferences, not native picker tokens or installed-app detection.
- Changes auto-save into an account-scoped local draft. “Save my plan” validates, waits for queued draft writes, then writes the selected manual plan before opening congratulations. Read failures offer retry; draft and final write failures are explicit. A busy guard prevents duplicate saves; a pending-save screen prevents edits during a save. Unmounting suppresses late navigation.
- The questionnaire draft remembers whether the user chose manual or suggested setup. Completing onboarding copies the selected manual plan and apps into account-scoped saved answers. Choosing a suggestion instead does not silently apply an older manual record.

## Storage and scope

Local keys: `hoosh.manual-plan-draft.v1:<account UUID>` and `hoosh.manual-plan.v1:<account UUID>`. The versioned local model contains weekday indexes (Monday 0), clock minutes, sessions/day, minutes/session and app preferences. No credentials, native selection tokens, usage measurements, server revision or installed protection state are added. The local model is intentionally not added to the shared native/HTTP contracts: plan/API/native policy remains unapproved and unimplemented.

Questionnaire drafts now allow internal step 8 for the manual editor, while retaining existing version-1 draft compatibility. Steps 5–7 keep their prior loading/review/congratulations meaning. Manual settings persist separately from the questionnaire's app-choice count rules. Final completion does not claim protection is active.

No API/database/native entitlement/legacy Swift changes. Actual application of days, hours and app budgets, overnight/DST/time-zone behavior, native app selection, restriction overlap and server/Settings synchronization remain separate integration work. No production policy has been guessed from the Figma examples.

## Validation

- `npm run typecheck`, `npm run lint`, `npm test`: 116 Vitest + 66 Jest tests passed, including time parsing, schema validation, draft/account isolation, editor choices, invalid-time/empty-app guards, load/write retry, rapid-save single-flight, late unmount and complete manual-onboarding integration.
- `npm run mobile:export`: 26 routes exported with real production Auth guards intact.
- `services/api/.venv/bin/ruff check services/api`: passed. `services/api/.venv/bin/pytest services/api/tests`: 3 passed. Existing Python environment used because `uv` is absent from shell PATH.
- `git diff --check`: passed.
- Localhost: exported isolated QA copy using a synthetic Auth provider outside the repository, with the actual editor/source components. No release bypass was introduced. Compared all five states at 393×852; checked 320×568 scrolling, wrapped summaries, time-input bounds and no document horizontal overflow. Tested day preset selection, valid/invalid times, keyboard slider Home, pointer slider drag (10:00 AM → 11:48 AM), session/duration changes, Facebook selection, draft reload, keyboard Save → congratulations, reload there → final completion → actual Home. Final browser warning/error log empty.
- Screenshots for all five states saved with the chat outputs. Storage faults and lifecycle races were tested automatically, not by browser fault injection.

Signed iOS/Android builds, physical-device keyboard/gesture/accessibility behavior and real native enforcement were not tested in this increment, as requested. Real provider/account flows were not revalidated by the synthetic QA session.
