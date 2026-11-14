# Standalone Android evidence

Ishmum,2026-11-14. Read [sanitized evidence](evidence.json), the
[runbook](../../../qa/android-standalone.md) and latest
[Plan04 notes](../../plan_04_react_native_integration_notes.md).

The APK is a real optimized non-debuggable release, signed separately with the
existing local Android debug certificate for internal installation only. Embedded
Hermes/fonts, native registry/definitions and signed-out startup were actually
verified. APK/mapping hashes identify the exact build. Keys, APKs, mappings, public
config values, raw device logs/XML and screenshots are not committed.

Native6 is actual owned-emulator release instrumentation;553/803/682 are separate
automated counts. No managed account, permission/claim/install, user phone,
TalkBack, backend/DDL or store acceptance is implied. Emulator/network cleanup
verified. Source HEAD/dirty fields retain honest pre-commit build provenance.
