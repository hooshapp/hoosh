# RN09B-D04b latest-APK Android evidence

Owner Ishmum,2026-11-12. [Structured record](evidence.json),
[runbook](../../../qa/quest-lifecycle.md),
[implementation notes](../../plan_04_react_native_integration_notes.md).

This is bounded independent Android debug acceptance, using generated local HTTP
accounts and only the synthetic target. It does not test managed Auth/iOS or a
signed release. Runtime code is unchanged from `37152fd`.

- `emulator-reboot.png`: latest APK native pause after acknowledged installation,
  emulator reboot, API/Metro reverse removal and host JS unopened.
- `emulator-process-expiry.png`: native pause after actual process kill/restart and
  allowance expiry, without reopening host JS or the target.

Phone observations are sanitized in JSON. Personal status-bar images stay private;
no raw inventory, user identifiers, passwords, tokens or baseline archives belong
in this folder. The installed phone APK hash matches the build. Actual shared UI
covers overlap, active update, cancellation, offline Stop/online recovery and50
credits exactly once. Owner confirms TalkBack labels/Open anyway and confirmation
focus return. Font2.0 editor/confirmation/native controls were inspected/exercised.

Activity/font recreation loses only the QA host's memory connection; explicit
same-fixture reconnection preserved native rules. Development Router linking warning
cleared on cold relaunch. Force-stop unbound the service: persisted rules are not
continued-enforcement evidence. Post-end target observation with unbound service
does not prove automatic end dismissal. Recheck setup on recovery.

Phone baseline restored and member digests/settings/reverse matched; SDK credentials
excluded. Manual fixture users/private manifest/API removed, task Metro stopped,
Compose stopped with volume retained. No push/merge/deployment or hosted mutation.
Joint SDK/Auth, Anisha iOS and signed/store acceptance remain separate gates.
