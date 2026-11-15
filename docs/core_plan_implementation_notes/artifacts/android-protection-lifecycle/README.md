# Optimized native lifecycle evidence

Ishmum, 2026-11-15; RN10-D06 / RN08-D06. Fresh owned Android 11/API 30 ARM64
emulator; exact existing internal R8 standalone APK. All target UI and native
state belong to a synthetic test-APK fixture. No personal phone/account or
real app inventory is represented. Six unmodified captures:

- `process-kill-allowance.png`: target usable after actual SIGKILL/service rebind;
  native state confirms same session/deadlines and daily count 1.
- `offline-reboot-pause.png`: old allowance deadline is still future, but a new
  OS boot requires a pause. Native daily count remains1; budget is not reset.
- `permission-revoked.png`: target usable after actual service revocation; native
  settings/history remain, enforcement does not.
- `permission-restored-offline.png`: pause returns after explicit re-enable and
  target reentry, without API, Metro, new revision or another allowance.
- `force-stopped.png`: target usable while the Hoosh package is stopped/unbound.
  Saved native rules are not continued protection.
- `explicit-recovery.png`: after explicit app launch and required access off/on,
  target reentry restores pause. This API 30 recovery is not a universal OEM promise.

`evidence.json` records original APK provenance, actual aggregate observations,
guard checks, Node/native/build results, limits, baseline restoration and AVD
removal. Queue retention is not backend delivery or awarded credit. Today’s
fixture occurrence ends within 45 minutes, but its weekly template recurs until
cleanup; the disposable AVD was removed. Raw logs/XML/state and APKs remain
outside Git. No test initializer is packaged in the app or accepted as production
Apply/disclosure/Auth; see [the runbook](../../../qa/android-protection-lifecycle.md)
and [per-file notes](../../plan_04_react_native_integration_notes.md).
