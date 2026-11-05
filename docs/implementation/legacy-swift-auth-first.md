# Legacy Swift: sign-in before onboarding

The owner subsequently simplified the pilot to name/email enrollment. See
[the current study flow](legacy-swift-study-enrollment.md). The password-first
implementation below is retained as a dated checkpoint and optional legacy path.

November 4, 2026. Implements the owner's requested ordering while retaining the
existing native SwiftUI design:

1. Signed out / fresh installation: existing-account sign-in.
2. Signed in without completed local setup: welcome, questionnaire and native app
   selection, then per-app daily allowance / session configuration.
3. Completed setup: dashboard. Settings permits later preference edits and sync.

`ContentView` now uses `NativeAppFlow` and resets navigation on account or setup
phase changes. A remembered Keychain session restores offline; cloud sync is a
separate operation and does not hold up protection or navigation. First sign-in on
the already-configured pilot phone adopts its existing setup instead of clearing
its plan. A fresh installation still needs onboarding. This increment uses the
existing Supabase email/password accounts; account creation/recovery remain in the
newer app. It does not add Google sign-in or change provider/confirmation settings.

## Local account isolation

`AccountWorkspace` archives account-owned App Group state locally. Switching to a
different account first validates its saved archive, then stops old native grants
and monitoring before restoring the target workspace. An account without a saved
workspace starts with no inherited answers, selection, usage or completed-setup
flag. Returning restores that account's local state. Invalid archives are rejected
without clearing the current data. Credentials remain in host-only Keychain;
archives never contain them. Research outbox ownership is independent and never
reassigned by archive restore. Legacy standard-default app selections/checkpoints
are migrated on first association and cannot leak through fallback reads to a new
account. Signing out keeps existing local protection, but stops event collection.

## Sync confirmation

Supabase writes require both the matching local workspace owner and completed
setup. Authenticated REST requests also require the expected account ID before
sending a payload, in addition to server RLS. The profile/plan is uploaded and read
back; the app compares both before reporting a verified sync. Queued events use
stable IDs and own-account uploads.

Settings shows Signed in separately from sync status and a Last verified sync
time. An authentication attempt never displays database success just because a
session was saved. Passwords are not logged or saved; failed sign-in is visible on
the form. Email fields/password fields are disabled while a request is pending.

## Validation and remaining phone tests

- Account-workspace Swift executable passed: fresh setup gate, preserving legacy
  setup, A/B isolation and restoration, retaining local selection/usage, separate
  research ownership, corrupt archive rejection/recovery.
- Signed iPhone build succeeded; shield/action/monitor embedding and signed
  entitlement checks passed; whitespace check passed.
- Installed and launched the auth-first build on the connected iPhone.
- Fresh device-route diagnostics and actual app-account sign-in / authenticated
  preference-and-plan readback are still being verified with the owner. No
  completed phone sync is claimed yet.
- Earlier live SQL RLS tests passed; see `services/api/sql/README.md`. No SQL was
  reapplied in this increment, and existing public profiles/grants remain unchanged.
- Timed custom-shield presentation at session end, away/locked usage pause,
  force-quit, reboot and midnight behavior remain physical-device acceptance work.

No uninstall, phone data reset, commit, push or release performed.
