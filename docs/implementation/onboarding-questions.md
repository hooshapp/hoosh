# Onboarding questions and Screen Time prompt

**Status:** React Native UI and local preference flow implemented on `landing-page`; native authorization bridge source is now wired; signed device validation, protection, and AI plan integration remain pending. See [authorization bridge](screen-time-authorization.md).

## Scope and design source

This increment implements the five Figma frames in the requested order:

| Order | Screen | Figma node |
|---|---|---|
| 1 | Gender | `27:113` |
| 2 | Age | `48:79` |
| 3 | Most-used apps | `48:81` |
| 4 | Hobbies / activities | `50:83` |
| 5 | Screen Time permission | `50:85` |

The screen UI lives in `apps/mobile/src/features/onboarding/OnboardingQuestions.tsx`; account-scoped draft and answer storage is in `draft.ts`. The Expo route redirects signed-out users to auth and sends signed-in users to onboarding until this question flow is complete.

## Current behavior

- Age is selected from 18–80 and gender/avatar selection is required, including the neutral “Other” avatar. These answers are stored in the account-scoped local draft and completed answers. The owner requires signup eligibility to be enforced before account creation, and later Settings edits; neither is implemented yet. Signup currently precedes these questions, local data does not sync across devices, and no demographic-driven plan generation exists.
- The age screen supports direct wheel scrolling and tapping a visible age. Back/Next controls are stacked as in Figma.
- The app screen starts with Instagram and Snapchat selected, requires 2–4 choices to continue, and offers the six Figma choices. Users can replace the defaults.
- The hobbies screen starts with Gym and Reading, supports the six Figma cards and custom activities (up to 12 total, 40 characters each), and allows custom items to be removed. Pressing Next includes a typed custom activity even if the plus button was not pressed.
- Preferences and in-progress step are saved in AsyncStorage under keys scoped to the signed-in account. A resumed user sees their saved step. Switching accounts cannot load another account's draft. Storage failure has an explicit retry state.
- Completion stores age, avatar/gender choice, app choices, hobbies, schema version, and the last observed `screenTimeAccess` status locally; it marks this question flow complete for the account and routes to tabs. A future app launch can resume without repeating these questions.
- Skip is disabled on age and avatar/gender. Skipping the permission step proceeds without implying permission was granted.

## Safety and product boundaries

- `PD-17` is partially resolved: see Q19 for the owner's eligibility and collection decisions. Privacy, storage, retention and the specific role of demographics in personalization remain to be designed and reviewed; do not infer demographic-based restrictions or unsupported claims.
- The permission page calls the local native authorization module where available. iOS uses Family Controls and Android uses Usage Access settings. Web/missing-module builds show unavailable. Authorization does not activate protection. See [implementation and build gates](screen-time-authorization.md).
- This increment does not train an AI model or generate a plan. App and hobby preferences are local inputs only. Any future AI service must use an explicitly designed data contract and consent boundary; device enforcement must stay independent of AI/network availability per the architecture plan.
- Onboarding completion and actual Screen Time authorization/protection are distinct states. Do not represent a completed questionnaire as protected.
- The source-only SwiftUI project in `apps/mobile/ios` is not a React Native host. Keep it intact; do not run Expo prebuild into that directory. Native integration needs a separately planned, tested bridge.

## Validation performed

- Automated mobile validation: typecheck, lint, Jest/Vitest suites passed (12 Vitest files / 87 tests; 11 Jest suites / 53 tests).
- Expo web export completed to a temporary directory; all 26 routes exported.
- Live local web preview exercised the five questions in order, app screen default/range state, custom hobby addition, permission disclosure, and the “Allow” unavailable message. “Not now” completed the flow and opened Home.
- An isolated Expo iOS prebuild succeeded in `/private/tmp`; a simulator build could not be completed because CocoaPods is unavailable and installing it in the temporary environment failed against the system Ruby 2.6 headers. The existing Xcode project remains the legacy SwiftUI app, so it is not evidence of a React Native iOS build.
- No signed-device Screen Time picker, authorization, monitoring, or restriction behavior was tested. No AI plan generation was tested or implemented.

Re-run `npm run typecheck`, `npm run lint`, and `npm test` from `apps/mobile` after changes. Native acceptance must be tracked separately from web/UI validation.
