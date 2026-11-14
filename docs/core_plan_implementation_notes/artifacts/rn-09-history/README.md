# RN09-D02 / RN09C-D01–D02 evidence

Read [acceptance](../../../qa/history-measurement.md),
[measurement policy](../../../architecture/history-measurement.md) and the latest
Plan04 notes. `evidence.json` contains sanitized counts/booleans only. No account
UUID, device serial, token, password, package inventory, raw event stream or native
backup is committed. PNGs show actual product History in the isolated QA host;
the floating gear belongs to that developer host, not the signed product UI.

- `history-consent.png`: actual native Start/Restart disclosure before collection.
- `history-recovered.png`: actual seven-day retained baseline after cold host
  reconnect, with comparison correctly unavailable because it overlaps the baseline.
- `history-stopped.png`: collection stopped while usage access was revoked; server
  summaries retained. Original phone permission/files/settings were restored later.

The native source is an estimate with retained witnesses. These captures are not
real later7/28day comparison, managed Auth SDK, iOS, signed/store or TalkBack proof.
Synthetic42day HTTP fixtures verify arithmetic/restart/isolation separately.
