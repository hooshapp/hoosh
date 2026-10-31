# Quests presentation — RN-09b

QuestsScreen/QuestCard implement the source `27:155` list and custom-quest action
using the shared Screen/Button, original artwork and warm recipes. A copied original
`icon pack/` pencil (`10498:94`, 14×14) and the existing exact check SVG (16×16 in a
20×20 slot) keep source bounds. Existing navigation/OS status bars remain owned by
Router/OS. No earlier asset is rewired. Reading badge/secondary copy use the RN-10
accessible palette; targets grow/wrap and stay at least 44 px.

The real route supplies unavailableQuests with no actions. Suggestions and saved
records are separate typed display collections, each with ready/loading/error/
unavailable; ready empty suggestions get their own empty state. No fixture fallback,
inferred interest, app catalog or optimistic acceptance exists. Saved records only
appear from the separately supplied collection. An empty saved collection is hidden
in the source suggestion view, not converted from accepted UI intent.

Callbacks receive suggestion IDs; missing handlers disable their buttons. The
owning controller holds busy through the whole operation, catches errors, handles
uncertain writes and owns serialization/idempotency. onCreate/onPersonalize are
entry intents only; the screen contains no editor schema, recurrence calculation,
native enforcement or persistence. Retry is an explicit read-error handler only.
Restriction notices require approved actual capability/install semantics. None is
rendered in the unavailable route; example notices are visibly simulated.

Run `npm run mobile:ui`, section “Quests — presentation-only Figma example”, for nine
isolated states. All controls change only a notice; no quest/credits/apps change.
The readonly Figma session is `26dd22ea-c87c-4b6c-a571-5e74d6eff5e8`. The plan/notes
record browser, native JS compilation and test evidence separately from live/device
acceptance. Keep future private producers within RN-04's keyed account subtree.

Pending **RN09B-D01–D04**: approved quest/editor/recurrence API and persistence;
actual Auth/account-scoped reads/mutations/error recovery; PM/native restriction,
completion and reward rules; signed-device/accessibility validation. These do not
prevent this independent presentation, but its callbacks are not integration proof.
