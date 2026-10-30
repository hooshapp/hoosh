# Home presentation — RN-09a

`HomeScreen` composes the Home `22:4` card layout with the existing `Screen`,
Space Grotesk, local original SVGs and shared controlled `Button`. The actual
`(tabs)/index.tsx` route supplies `unavailableHome`: it makes no API/native calls,
selects no Dino mood and enables no Feed/recommendation action. It keeps an honest
protection-unavailable card, independent of Home statistics. Other tab bodies are
still placeholders. RN-09b/c/d track Quests, History and Settings respectively.

## Display inputs and authority

`HomeModel` is a local presentation shape, **not an approved endpoint, scoring
algorithm, reward policy or persisted quest schema**. Each region receives explicit
`ready`, `loading`, `error` or `unavailable` inputs; recommendations also distinguish
an actual successful `empty` result. There is no fallback to sample data or zero.
`validateHomeDisplay` rejects invalid numerical values and incomplete labels for
each region independently. These are defensive display checks; future HTTP/native
producers still validate their own wire responses and account ownership.

- Dino percentage and artwork must be supplied together by an approved scorer.
  The UI never calculates a score, maps mood bands, or selects happy artwork when
  the score is unknown. No approved neutral/unscored illustration exists, so the
  unavailable card has text instead. A failed source image leaves its semantic
  values intact and shows an illustration-unavailable label; decorative failures
  disappear without a replacement glyph. There is no automatic image retry loop.
- Credits, Feed cost, recommendation rewards and streaks require approved policy
  and authoritative values. No default balance, price, streak formula or reward
  amount exists in runtime code. Feed requires ready health/cost/balance, sufficient
  displayed credits and an explicit handler. This is UI gating, not authorization
  for a transaction. The real producer must reconcile current balance/policy and
  handle uncertain writes and idempotency before enabling it.
- Weekly hours require a period label, date-range label, source and coverage.
  The source/coverage line is visible below the streak. Display guards preserve
  legitimate supplied zeroes and fractional hours; they do not calculate saved
  time from usage, guesses or a comparison baseline. Stale/unavailable data must be
  projected accordingly by the future producer; this UI has no freshness clock.
- The original seven filled streak dots appear only with explicitly supplied
  recent-week completion evidence. A seven-day count alone never selects them.
- A recommendation remains temporary. Its ID, text and optional reward/installation
  notice are supplied inputs. An app list does not prove future restrictions.
  Omit unapproved reward/restriction text. Skip/Accept delegate an intent for that
  ID; they never create a persisted quest, grant credits, mark completion or install
  a rule. Real acceptance/cancellation semantics must be agreed before wiring.

## Controller contract

Optional `onFeed`, `onOpenHistory`, `onAcceptRecommendation` and
`onSkipRecommendation` expose only supported actions. Missing mutation handlers
disable the corresponding button; missing History navigation omits the arrow.
`feeding` and `recommendationBusy` are controlled by the owning controller for the
whole operation. The shared button rejects duplicate taps on the same control in
one turn; cross-action serialization and server/native idempotency remain the
controller's job. Catch asynchronous errors there, render a safe outcome, preserve
uncertain states and adopt only confirmed results. The screen performs no optimistic
debit, save, removal or success transition.

Mount live private Home producers inside RN-04's keyed account/generation subtree
when Auth is ready; cancel/ignore departing-account work and clear private state.
Do not retain A's statistics/recommendation or show them during B's bootstrap.
No private Home cache/store or root Auth/provider change is added here.

`protection` is a separate optional presentation slot. Wire RN-08's actual native
read consumer through its owner when RN08-D01–D06 are satisfied. Never infer active
protection, permission, selected apps or native installed revision from a Home
score, profile/API acknowledgment, completed quest or button press.

## Source layout and deliberate adaptations

Read-only Figma session `6e843e23-fbc5-4280-8931-aba6891fbef6` inspected full Home
`22:4` context and screenshot. At a 393 px screen/content frame: 16 px side insets,
196/149 px upper cards with a 16 px gutter, 210 px Dino card, 40 px credits pill,
158 px weekly card, 18 px gap to the recommendation, and 12 px to the 66 px streak.
Card radii are the source 28/24/20 px, rather than a new global recipe. Source
assets retain their exact bounds and layers; see [asset provenance](../../../assets/README.md).

The OS owns the status bar and safe areas; RN does not draw Figma's static iPhone
status-bar component. `Screen` reserves the real measured floating navigation and
bottom inset. Preview images are component evidence, not signed-device captures.
The content stacks below 300 px of **measured content width**, or at native font
scale above 1.3; the recommendation header/actions also stack. Cards grow/scroll
with content instead of clipping to a fixed 393×852 canvas.

Feed and History targets are at least 44 px instead of the source's 31/28 px fills.
The health fill follows the supplied percentage; the source example uses a fixed
85 px fill inside a wider track while labeling it 85%. Measurement provenance is
an intentional addition. Unknown/error/loading/empty states, safe unsupported copy
and disabled actions are adaptations because the source only shows ready examples.
Native VoiceOver/TalkBack, contrast/font and SVG-renderer acceptance remain RN-10
and platform checks; browser reflow does not certify them.

## Preview, tests and remaining work

Run `npm run mobile:ui` and find **Home — presentation-only Figma example**.
Its nine states include the exact illustrative 85%, 240 credits, 5 hours, seven-day
streak and reading recommendation. Every capture includes **Simulated Home — no
account or device connected**. Preview buttons change only an explanatory notice;
no synthetic account, fake native service or successful transaction exists. The
sample lives under `dev/ui/` and release export guards reject its markers.

Root `npm run check` covers display guards, actual route unavailability, optional
handlers, controlled busy, absent claims, failed assets and responsive/native-font
inputs. The [implementation record](../../../../../docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md)
contains actual results, browser/native export evidence and file/line changes.

Original plan and notes track **RN09-D01–D06**: approved scoring/rewards/streak
producers; valid usage/insights measurements; temporary recommendation lifecycle;
real native status/actions; account-scoped live wiring; signed-device/accessibility
acceptance. RN-09a completes this bounded Home presentation increment only.
