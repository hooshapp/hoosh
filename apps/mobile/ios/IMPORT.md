# Existing iOS source — preserved for reuse

Owner-confirmed source: `pre-main` at `a5fb309dc3728427d756bac4088524aa38f158ca`, imported on 2026-10-29. The existing user commits placed the Swift project here; this completion keeps that location and preserves every native source/configuration byte, relative path and production identifier.

`../../../docs/architecture/existing-ios-audit.md` records source relationships, reuse opportunities and gaps. The original checkout was not changed. Its one preexisting xcuserdata modification was excluded. No old Git history, credentials, node_modules, caches or build output were copied. Firebase client configuration is not a service-account key; private server secrets remain outside source.

The tracked shared workspace and SwiftPM `Package.resolved` are retained. The two-line original root README and original ignore policy are preserved as `LEGACY_README.md` and `LEGACY.gitignore`; the shared monorepo README and ignore rules remain authoritative at the root. Firebase function source/configuration, screenshots and the existing bundle verifier keep their original root paths.

Run `python3 scripts/verify_ios_import.py` from the repository root to verify SHA-256 integrity against the manifest. Future native edits must intentionally update the provenance/manifest rather than silently changing this baseline.

Open `DisconnectApp.xcodeproj` for the standalone SwiftUI app. It has not been converted into a React Native host: seven targets, original App Group, entitlements and package dependencies remain. Do not run clean prebuild over it. Signed builds, physical-device behavior, current Firebase delivery/billing and the React Native bridge are separate validation steps.

The legacy Firebase function uses its own Node 20 package/lock file outside the new npm workspace. Do not deploy it automatically. Existing Firebase identity, bypass defaults and estimated savings do not define the new Supabase, session, quest or measured-History contracts.
