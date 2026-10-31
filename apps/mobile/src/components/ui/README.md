# Shared UI primitives

RN-01 supplies small presentation components for Ishmum's main app and Anisha's
Auth/onboarding. Import components directly from their files. There is no form
schema framework, account store, API client, navigation guard or native protection
implementation in this directory.

## Components and ownership

- **`Screen`** provides an accessible heading, safe-area edges, a keyboard-aware
  scrolling container and the local warm/dark recipe. Existing `dark` callers still
  work; children inherit that presentation through `UiThemeProvider`.
  `header={null}` supports source compositions without a visible page heading;
  the scroll region retains its `title` as its accessible name. An optional custom
  header replaces the default heading/subtitle, and `contentStyle` sets source
  insets/flow. Computed bottom clearance is applied last so content styling cannot
  remove the real footer/safe-area reserve.
- **`Button`** is a controlled action with required `onPress`, optional `busy`,
  `busyLabel`, `disabled`, and `variant="primary" | "secondary"`. It blocks same-turn
  duplicate presses before React renders the controller's new busy state. Neutral
  secondary styling does not imply disabled behavior.
  `leadingVisual` / `trailingVisual` are decorative slots hidden from accessibility;
  `labelStyle` supports a source-specific label recipe. Keep the visible/accessibility
  label meaningful without those decorations. Defaults and busy/press guards remain
  the same; busy replaces decorations with the progress indicator and busy label.
- **`RouteButton`** keeps real Expo Router link semantics/navigation and reuses the
  internal `ButtonSurface` presentation. Action buttons do not implement routing.
- **`Field`** has a persistent required label, optional hint/error, raw value/change
  props and a forwarded native input ref. It preserves password bytes and Unicode;
  it never trims, normalizes, validates against HTTP schemas or saves values itself.
  The form decides when to validate, which error to show, and which input to focus.
- **`InlineStatus`** distinguishes `loading`, `saving`, `unavailable` and `error`.
  Loading/saving cannot receive retry actions. Error/unavailable notices only render
  a retry button when a real `onRetry` is provided; `retrying` controls its busy state.
- **`EmptyCard`** represents an actual empty result, with a secondary heading. Do not
  use it to hide service failures or fabricate a successful empty API response.

`ButtonSurface`, `ProgressIndicator`, `useAnnouncement` and `usePressGuard` are
implementation helpers. Consumers normally use the components above. The progress
indicator respects reduced-motion settings and is decorative; status text conveys
the meaning. iOS announcements are queued/deduplicated; Android/web use live regions.
Explicit ARIA attributes complement native accessibility props so web retains busy,
disabled, hidden-indicator and error-description semantics.

## Form/controller contract

The controller sets `busy` **synchronously at submission intent**, keeps it true
through the whole operation, catches/classifies failures, and clears it in `finally`.
The button does not refresh Auth, retry requests, swallow rejected promises, cancel
work or decide whether a save succeeded. Cancel requests/ignore stale account results
in the owning feature (RN-04/Auth), not inside a visual component.

For example, with an actual `onSave` supplied by the feature:

```tsx
async function handleSave() {
  setSaving(true);
  setError(undefined);
  try {
    await onSave(rawDraft);
  } catch {
    setError('The save could not be confirmed. Review the latest data.');
  } finally {
    setSaving(false);
  }
}

<Screen title="Account" dark bottomClearance={0}>
  <Field label="Display name" value={rawDraft} onChangeText={setRawDraft} />
  {error ? <InlineStatus state="error" message={error} /> : null}
  <Button label="Save changes" busyLabel="Saving…" busy={saving}
    onPress={() => { void handleSave(); }} />
</Screen>
```

For an uncertain profile write, the feature preserves the draft, refetches and reconciles; a retry control must not blindly replay a mutation. Never convert an API outage into signed-out/empty/protected state. A profile,
completed UI step or saved preference cannot prove installed native restrictions.
For profile names, follow the server-owned normalization contract; do not impose a
raw-input `maxLength: 80` or a separate JS trimming rule here.

## Layout and visual recipes

Figma references in file `ukmD2ZidJ9UR2XxUkvdPoJ`:

- [Primary action `10611:13017`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10611-13017): 52 px minimum height, 10 px radius, green action fill and 18 px bold label.
- [Dark secondary action `10611:13022`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10611-13022): 48 px minimum height and 10 px radius; enabled neutral styling.
- [Warm field reference `10611:13056`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10611-13056): warm field/label typography, 44 px minimum height and 16 px radius. This primitive is an editable text field, not the complete read-only quest editor with its pencil action; that asset/control is outside RN-01.
- [Dark field `10611:13082`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10611-13082): 48 px minimum height, 7 px radius, translucent white fill and Space Grotesk Light.

Use the existing Space Grotesk 300/400/500/700 families; do not synthesize weight 600.
Minimum heights and wrapping text allow controls to grow with content/font scaling.
Error colors, persistent Auth labels, focus outlines, busy/retry states and stronger
editable-field boundaries are intentional accessibility additions to incomplete
Figma states. Warm field outline `#9A8662` contrasts 3.17:1 with the warm canvas;
the dark outline contrasts 7.09:1 with the dark canvas. These are measured color
ratios, not a claim of complete WCAG or device acceptance. See
[W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

RN-02 connects `Screen` to the main navigator's measured floating-bar clearance.
Outside that provider, standalone screens reserve ordinary spacing plus the safe
inset. An explicit `bottomClearance` still overrides the provider for a different
overlapping footer; pass zero when intentionally reserving none. Do not add a second
tab reserve. See the [navigation geometry contract](../navigation/README.md).
`keyboardVerticalOffset` supports future visible headers. Avoid stacking another
keyboard-avoidance owner around the screen. Signed iOS/Android keyboard behavior
still requires device QA.

## Shared test and specimen commands

From the repository root:

```bash
npm run check
npm run test:unit --workspace @disconnect/mobile
npm run test:components --workspace @disconnect/mobile
npm run mobile:ui
npm run mobile:ui:build
npm run mobile:export
```

Jest runs `*.test.tsx` and `*.native.test.ts` in iOS and Android Expo presets; opposite
platform files named `*.android.native.test.ts` / `*.ios.native.test.ts` are excluded
from the other preset. Vitest owns portable `*.test.ts`, explicitly excludes native
tests and retains its default exclusions. New RNTL 14 tests must await rendering,
events and rerenders. Read the installed package's
`node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md` before
changing tests; this version uses Test Renderer, not deprecated react-test-renderer.

`mobile:ui` serves the developer-only specimens at `http://127.0.0.1:8091/` with
393 px / 320 px frames and a separate large-text layout stress mode. Large-text CSS
is a browser stress case, not native Dynamic Type evidence. The Vite entry lives in
`apps/mobile/dev/ui/`, outside Expo Router and the release import graph; it calls no
Auth/API/native service. Vite is already used by Vitest and is declared directly
for this isolated preview. It does not replace Expo/Metro for the app.
The specimen retains Figma's email/username placeholder for visual comparison;
the accepted Auth contract remains email-only. Feature forms own their actual copy.

Keep preview/test inputs out of `src/app`. Production exports must contain no
specimen routes or marker text. The root `mobile:export` command runs
`scripts/check-ui-preview-isolation.mjs` against the real Expo output and fails
if it finds the specimen markers or no real application export. Build outputs/fonts remain ignored; screenshots and
actual validation are recorded in the
[Plan 04 implementation notes](../../../../../docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

RN-10 adds an internal `focusControl` helper for explicit confirmation intents:
ordinary focus, then the installed RN public `sendAccessibilityEvent(..., 'focus')`
on native. Missing/detached targets are ignored without retrying into a new screen.
Status updates do not request focus. InlineStatus keeps errors as alerts and names
non-error web messages as status regions; queued native announcements remain
separate. [QA evidence and device limits](../../../../../docs/qa/mobile-accessibility.md)
are recorded independently of successful component/browser checks.

RN-09b shares fixed-bound decorative asset rendering through DesignArtwork;
HomeArtwork is a compatibility export with the same failure behavior. Button's
optional description supplies a wrapping secondary line in the same named action;
it is not decorative text. The default accessible name includes it unless an
explicit name/busy label is supplied. Existing button behavior remains controlled.

RN-09c History uses the shared Screen, controlled Button and fixed-bound DesignArtwork. Three new original-pack SVG copies and provenance are recorded in `assets/manifest.json`; evidence is under Plan 04 artifacts/rn-09c. No historical icon is rewired.
