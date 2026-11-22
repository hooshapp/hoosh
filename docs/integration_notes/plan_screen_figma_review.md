# Plan screens — Figma review, November 20, 2026

Implemented on `integration/shared-product`; no commit or push performed.

## Design and production integration

Figma file: `ukmD2ZidJ9UR2XxUkvdPoJ`.

- Suggestion: `50:87` → `PlanSuggestionScreen` in `setup-draft.tsx`.
- Manual setup: `10556:120`; expanded controls `10596:1767`, `10596:1861` → `FigmaManualPlan`.
- Preparation: `52:690` → `PlanLoadingScreen` during actual submission work.
- Completion: `50:89` → `PlanCompletionScreen` after successful completion save in `setup-screen.tsx`; Let’s start opens Home.

Reused the app theme, fonts, artwork renderer and plan validation. Imported 31
original SVGs under `apps/mobile/assets/onboarding/plan/current`; manifest records
node provenance and SHA256. Asset checks verify unchanged bytes. No new dependency.

Manual day/time/session changes persist when switching accordions; invalid times
remain blocking even after collapse. Range handles support keyboard adjustment.
Accepting the displayed suggestion uses its own plan, even after editing and
leaving the manual alternative. Existing account scope, persistence, review and
native permission boundaries are retained.

## Verification

- 114 component tests passed across Android and iOS, including the normal app
  onboarding journey, plan editors and new plan interaction tests.
- 661 unit tests passed; TypeScript and focused lint passed.
- Expo web export and release preview-isolation checks passed.
- Original assets and integration snapshot integrity passed.
- Browser geometry at 393px: suggestion cards x24/y230, 345×112;
  collapsed manual Save x24/y638, 345×52. All current SVG artwork loaded.
- At 320px, suggestion and expanded hours had no horizontal overflow.
- Keyboard range adjustment updated the selected start time (540 → 541 minutes).

Local review: <http://127.0.0.1:8091/?view=plan>. Top buttons switch screens;
manual controls are interactive. This uses production components with explicitly
sample selections, without saving accounts or installing protection. Screenshots
are local QA files under `.native-dev/qa/figma-plan/` and are not committed.

## Deliberate limits and follow-up

Production does not invent selected app names, measured time savings or an AI
plan. Example Instagram/Snapchat cards and savings are labeled sample/illustrative
in the preview. Production uses the available selection count and starting draft.
Completion copy describes saved preferences, not unverified native activation.
The real account review/permission steps remain between drafting and completion.

The rule chart `10769:238` describes a shared daily cap; existing C04 native policy
is per-app. Reconcile that separately before claiming policy acceptance; this UI
change does not modify the native engine or AI rules.

Physical iPhone/Android permission, lifecycle and Screen Time acceptance remain
pending. iOS activation remains gated. Browser results do not prove device behavior.
