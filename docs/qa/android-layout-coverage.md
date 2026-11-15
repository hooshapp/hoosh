# Android layout and input coverage — RN10-D02/D05

Owner Ishmum. Runtime checks: 2026-11-14; finalized after interruption: 2026-11-15.
Branch `task/react-native/android-layout-coverage`, base `515cf7d`.
**The requested bounded Android layout/input pass is complete.**
This is the existing isolated development host, with synthetic local examples,
not the normal signed-in root or a standalone release acceptance run.
Further TalkBack testing remains user-deferred. No account, API, native protection
installation or permission grant is needed for this pass.

## Runtime matrix

| Runtime | Physical emulated pixels / density | Logical portrait viewport | System text |
|---|---|---|---|
| Android 16 / API 36, ARM64 | 640×1136 / 320 dpi | 320×568 dp | 1.0 and 2.0 |
| Android 11 / API 30 Google APIs, ARM64 | 720×1280 / 320 dpi | 360×640 dp | default 1.0 and 2.0 |

Both are fresh task-owned AVDs, not the connected owner's phone. The API 30 image
was checked against Google's repository archive checksum. The existing native
debug APK loads the actual shared source through loopback Metro on port 8090. No native
source or package identity changes were required. The APK is the development
runtime, not an embedded copy of the separately loaded QA JavaScript.

The host has 25 entries: 19 presentation examples and six native diagnostics. Only
the presentation examples were opened. App journey, Weekly schedule, Android
interventions, Android probe, Android selection preview and Saved apps editor
were excluded. The presentation named Native selection is only the safe
unavailable-summary specimen; it does not open a real picker.

## Executed layout coverage

- All 19 presentation pages at normal text on both runtimes, with top/end scrolling:
  Home, Quests, Settings, History, Personalize, Custom quest, Edit quest, Age,
  Activities, Apps, Native selection, Gender, Days, Hours, Sessions, Progress,
  Time reclaimed, Profile and Original assets. Both inventory runs reached the
  final navigation assets. This is not a claim that every asset at every scroll
  position has a separate screenshot.
- API 30 at system text 2.0: 16 targeted pages, all the above except the duplicate
  Custom/Edit quest variants and the complete assets inventory. Inline
  Gender/Days/Hours/Sessions received explicit action-position captures rather
  than just Settings top/end captures.
- API 36 at system text 2.0: Home, Quests, Settings, History, Personalize, Hours,
  Sessions, Progress and Time reclaimed. Hours/Sessions action-position captures
  verify the inline controls in the middle of Settings. The narrow Hours scale
  labels wrap; Save labels and enlarged quest headings remain readable.
- API 30 enlarged long-text Home/Activities examples and Loading/Error/Unavailable/
  Busy on Quests/History/Settings/Profile: 16 bounded state presentations.
  Not every scenario has a distinct presentation; this is not live API evidence.
- Actual software keyboard and synthetic profile typing on both runtimes;
  custom-activity and quest-name entry on compact API 36. Dismissal/scroll reaches
  readable Save controls and the explicit local UI-intent notice. The footer
  returns after keyboard dismissal. No profile or preference is persisted.
- API 36 enlarged numeric duration entry (90 minutes), invalid time entry
  (`25:99`, Save disabled), dirty-exit Keep editing, Android Back keeping the
  draft, explicit Discard returning to the sample menu, and Cancel quest → Keep
  quest. These use real native keyboard/modal windows, not mocked input.

The original API 30 Ready detail captures exposed the mixed-unit sample defect.
After correction, both populated details were rerun at normal text; enlarged
details were checked on both runtimes. Personalize was also recaptured at the
same API 30 text setting after its heading fix. Earlier failure captures are
reproduction evidence, not accepted populated layouts.

Screenshots distinguish viewport cropping while scrolling from actual clipped
content. Portrait is configured; landscape support is not asserted. Enlarged
system text settings are recorded as settings, not a promise that every Android
version scales every glyph by the same pixel multiplier.

## Defects and corrections

1. **Ready history detail samples incorrectly showed unavailable.** The shared
   development sample mixed 750/150 minute numeric values with 10 saved hours. The
   production consistency guard correctly rejected it. Its detail comparison now
   uses 12.5/2.5 hours; displays and source-style example narrative remain samples.
   Two new real-component regression cases fail against the old fixture and pass
   for both platform projects after the fix. Production validation is unchanged.
2. **Large quest title split a word unnecessarily.** At API 30/360dp/text 2.0,
   horizontal Back/title composition displayed `Perso` / `nalize` / `quest`.
   Quest navigation now stacks above its full-width heading above fontScale 1.3.
   Standard text and the existing compact detail-header treatment stay intact.
3. **QA chrome consumed the software-keyboard viewport.** At API 36/320×568dp/
   text 2.0, the large fixed sample footer left no visible form/ScrollView when
   the actual IME opened. During presentation text entry it now compacts to a
   sample marker, then restores its controls on keyboard dismissal. Listener
   cleanup is explicit. Native diagnostic disclosures retain their full footer;
   production tab-bar behavior was not changed for a test-host problem.

The first input automation attempt hit a visible label, not its below-viewport
EditText; it is discarded. Corrected checks require the actual EditText and
Android's current `mInputShown` state. A cached IME-view flag can remain true
when the keyboard is hidden; it is not the current shown-state check. Captures
and input stop if the owned app is not foreground. Temporary host initializer/
reload errors encountered during the fix are not counted as accepted runs.

## Reproduce with the existing host

1. Start an owned emulator at one of the viewport/density combinations above.
   Save its original system font and IME-with-hardware-keyboard settings.
2. Install the existing Android debug development build. From the repo root:
   `npm exec -- expo start apps/mobile/dev/native --dev-client --localhost --port 8090`.
   Reverse only `tcp:8090` to that emulator and open the development client on
   `http://127.0.0.1:8090`. Verify **Disconnect UI QA** and its sample footer.
3. Select only the 19 presentation pages. Use State/Reset for local scenarios.
   Inspect normal and system `font_scale=2.0`, scrolling until final labels/actions
   are fully readable. Open inline editors in the middle of Settings explicitly.
4. Enable the emulator's software IME when its emulated hardware keyboard is
   configured. Tap the actual input; verify keyboard shown, field visibility,
   synthetic typing, scrolling/dismissal, retained draft and final UI-only action.
   Dismiss the keyboard to restore full QA controls. Never infer persistence
   from the host's explicit UI-intent notice.
5. Restore original font/IME settings, remove only the task's reverse mapping,
   stop the owned emulator and owned Metro process. Do not clear owner app data,
   install protection, change accounts or enable TalkBack for this scope.

## Final verification and limits

Mobile TypeScript passes; lint has zero errors and four pre-existing warnings.
`npm test --workspace @disconnect/mobile` passes 553 portable and 807 component
tests (two existing skips). The fixture regression first reproduced two Android
failures against the old sample, then passed all 14 focused cases across both
renderers; these 14 passed again after resuming. `npm run mobile:export` passes,
including preview isolation and all 71 original SVGs in the production export.
No dependencies, native permissions, Auth, database or deployment changed.

Cleanup: API 30 font/IME/accessibility/density baselines were verified restored,
its reverse mapping removed and emulator stopped. On resumption no emulator or
owned Metro remained running. API 36's shared temporary system image was missing,
so it could not restart to reverify its settings. Its fresh task-owned AVD and
definition were discarded instead; API 30's task AVD was also removed. Shared SDK
files and other AVDs were not removed. No personal phone/settings were touched.

See [sanitized screenshots and evidence](../core_plan_implementation_notes/artifacts/android-layout-coverage/README.md)
and the [per-file implementation ledger](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

Physical external keyboard, physical small/OEM devices,
minimum API 24, other Android releases, normal managed-account journeys, iOS,
store-signed/release UI and deferred speech matrices remain separate. This pass
does not close RN-10 or Plan04 as a whole.
