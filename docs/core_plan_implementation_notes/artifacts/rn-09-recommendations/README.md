# RN09-D03 recommendation evidence

Read [acceptance](../../../qa/home-recommendations.md),
[policy](../../../architecture/home-recommendations.md) and the latest Plan04 notes.
`evidence.json` records actual scopes/counts/booleans and PNG hashes, without tokens,
account UUIDs, device serials, raw inventory, native backups or credential URLs.

- `phone-offer.png`: current actual interest-template Home card before Accept.
- `phone-review.png`: physical phone accepted one-time quest editor; no schedule or
  initial reward. The date/native Apply step remains explicit.
- `phone-skip.png`: second isolated account's saved Skip/cooldown, no new quest/credit.
- `emulator-native-pause.png`: actual native intervention for the applied accepted
  recommendation, with only the synthetic target selected.
- `emulator-target-after-stop.png`: target visible without that intervention after
  confirmed Stop. Native/API account state was read separately, not inferred from PNG.

The floating gear belongs to the QA host. These are actual shared/native components,
not signed/root/managed-Auth acceptance. The manual fixture includes an unrelated
seed quest per account; accepted recommendation count delta is one, Skip delta zero.
No full20minute soak, AI generation or attested task completion is claimed. Phone/
emulator state restored, owned fixture users/servers cleaned, database stopped.
