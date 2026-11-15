# Android compact/older-runtime layout evidence

RN10-D02/D05, Ishmum. Runtime checks 2026-11-14; finalized 2026-11-15.
These are unmodified screenshots from fresh
owned emulators and the isolated **Disconnect UI QA** project. All data and typed
names are synthetic. No personal phone, account sign-in, API, real app inventory,
native installation or TalkBack session is represented.

- `quest-heading-before.png` / `quest-heading-after.png`: same Android 11/API 30,
  360×640dp, system text 2.0. Full-width quest heading avoids the unnecessary
  middle-of-word break while preserving enlarged type and Back.
- `keyboard-before.png` / `keyboard-after.png`: same Android 16/API 36,320×568dp,
  system text 2.0 and software keyboard. The full QA footer consumed the form
  viewport; its compact IME mode restores the focused input above the keyboard.
  The visible name is local sample text; this is not a saved profile.
- `compact-confirmation.png`: actual native dirty-exit modal at API 36/text 2.0.
  Keep editing, Android Back, explicit Discard, and separate Keep quest were
  exercised without assistive speech. It does not prove real Router removal.
- `older-history-ready.png`: repaired normal-text Progress example on API 30.
  Its 80% value is a validated synthetic fixture, not a user's measured history.

The developer-tool gear and QA footer are test chrome. Viewport cropping while
scrolling is not a claim of intrinsic content clipping. `evidence.json` records
runtime/source hashes, completed matrices, checks and cleanup; the linked QA
record explains boundaries. Raw XML, logs, APKs, temporary AVDs and full captures
remain outside Git. No credentials, keys, tokens or personal app lists are included.

See [the QA record](../../../qa/android-layout-coverage.md) and
[implementation ledger](../../plan_04_react_native_integration_notes.md).
