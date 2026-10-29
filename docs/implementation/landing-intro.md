# First-launch introduction — AUTH-10a / FR-001

## User-approved slice

The user requested only the three Figma introduction screens first, with easy scrolling, automatic progression by the fifth upward gesture if necessary, and presentation only for first-time users on first launch. This intentionally splits the introduction from AUTH-10's preference questions. It does not resolve the remaining demographic, Auth, plan or native-policy questions.

Figma file: `ukmD2ZidJ9UR2XxUkvdPoJ`; frames `1:2`, `6:34`, `6:71`. Original asset nodes: white arrow `6:18`, muted arrow `6:53`, dinosaur `39:16`. Local assets and their provenance/hashes are recorded in `apps/mobile/assets/intro/manifest.json`. No temporary asset URLs are used at runtime.

## Behavior

- Two scrolling sections precede the welcome screen. Progress normally advances at 160 points of accumulated upward movement, often one or two ordinary swipes. Five intentional gestures of at least 8 points advance a section regardless of accumulated distance. Taps, downward movement, horizontal-dominant input and non-finite values do not count.
- A gesture advances at most one section. Excess movement is not carried into the next section. Native uses completed PanResponder gestures; web coalesces each wheel burst before applying progress and also supports touch and focused keyboard input. No timing gate drops intentional gestures after a section change.
- Reduced-motion and screen-reader users get explicit Continue controls. Skip is always available during the scrolling sections. No scrolling speed is required, and the challenge never gates access to signup.
- A device-local `disconnect.intro-seen.v1` flag is saved on first display, not after registration. Closing midway therefore does not replay the intro on a later launch. It is not account identity, onboarding completion or native protection state. No credential or account data is stored in this flag.
- Returning launches and the final SIGN UP/Skip actions open the existing signup placeholder. Actual account creation remains unavailable and explicitly labeled as such. No second Auth store or route guard was introduced.
- Storage operations have a 2.5-second bound and single-flight writes. Failure shows Retry and Continue without saving; it never silently claims persistence or traps navigation. Unknown stored values safely show the intro again.
- The welcome screen uses the original 151×136 dinosaur and 151×48 signup geometry at the 393×852 reference. Smaller/large-type layouts use a scrollable final story with action clearance. The intro does not alter the imported Swift project.

## Implementation boundary

`src/features/intro` contains presentation, platform input adapters, a pure progress controller and a small injectable storage boundary. Root and welcome routes compose the same introduction. Existing fonts/tokens/safe-area setup are reused. SDK-compatible AsyncStorage and LinearGradient were added, with manifest and root lock updated together.

The shared Jest/React Native Testing Library harness uses separate native-component and web-input projects. Vitest retains portable `.test.ts`; Jest owns `.test.tsx`/`.native.test.ts` with disjoint discovery. Test doubles stay beside tests outside routes and are never imported by release screens. This is a bounded harness increment, not completion of all RN-01 shared form primitives.

## Validation completed

- `npm run check`: TypeScript source/contracts consumers, ESLint, 20 Vitest cases, 16 Jest cases, Ruff and 3 API pytest cases passed (39 runtime test cases total).
- `npm run mobile:export`: static web export passed. Development Metro watching hit this machine's watcher limit, so live browser checks used the exported bundle served locally.
- Browser: 393×852 reference and 320×568 short phone; original artwork and button geometry; reduced-motion Continue through all three screens; keyboard focus/Skip; signup destination; a subsequent root visit skipping the intro; no captured browser errors. Storage failure/retry/timeouts, wheel bursts and five-light-gesture progression are covered by automated tests. Real device touch remains unverified; the browser session exposed the reduced-motion path.
- `python3 scripts/verify_ios_import.py`: all 80 retained legacy source/configuration files match the provided source hashes. The legacy import is shared by `main` and `landing-page`; the intro remains on `landing-page` only.

The local check environment used Node 24.13.0/npm 11.6.2 and managed Python 3.12.16. npm/Expo/uv caches were redirected into this chat's scratch workspace to respect filesystem permissions; no global runtime settings were changed.

## Still unverified

Signed iOS/Android builds, real touch gestures, VoiceOver/TalkBack, Dynamic Type, device storage/reinstall behavior and native integration remain separate acceptance work. The imported iOS app is still a standalone SwiftUI host; no React Native host conversion, bridge, entitlement, signing or native policy change is included. Before an upgrade for existing App Store users, connect the audited legacy onboarding state so established users are not mistaken for new users merely because the new JS flag is absent. Real Auth, preference steps, saved plans, rewards and measurements are outside this slice. The full AUTH-10 and RN-01 parts remain open.
