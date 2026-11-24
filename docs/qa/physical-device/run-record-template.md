# Physical-device run record — TEMPLATE

Copy this file; do not replace the template with one tester's results. Suggested destination: `docs/integration_notes/physical_<android-or-ios>_<YYYY-MM-DD>_<run>.md`.

## Run identity

- Tester / reviewer:
- Platform / model / OS (no serial/UDID):
- Date and time zone:
- Branch / source commit / dirty delta:
- Version / build / package or bundle ID:
- Artifact and embedded-JS hash / sanitized inspection reference:
- Signing verified / activation gate status:
- API environment / transport (no secrets):
- Supabase project label (no keys):
- Disposable account labels A/B/F (no email/password/token):
- Harmless target labels T1/T2:
- Existing installation/replacement decision and preserved data:
- Original permissions / text / display / network / battery policy:
- Baseline installed native revision/count/deadline / existing rules:
- Readiness blockers:

## Case ledger

Every case starts NOT RUN. For each executed case append its detailed result below, not only a check mark. Delete the other platform's rows in the copied record if useful. Shared P00 and P08 apply to both.

| Case | Status | Evidence / timestamp | Defect / blocker / owner | Final-candidate retest |
|---|---|---|---|---|
| P00 readiness | NOT RUN | | | |
| A00.1 | NOT RUN | | | |
| A00.2 | NOT RUN | | | |
| A00.3 | NOT RUN | | | |
| A00.4 | NOT RUN | | | |
| A00.5 | NOT RUN | | | |
| A01.1 | NOT RUN | | | |
| A01.2 | NOT RUN | | | |
| A01.3 | NOT RUN | | | |
| A01.4 | NOT RUN | | | |
| A01.5 | NOT RUN | | | |
| A01.6 | NOT RUN | | | |
| A01.7 | NOT RUN | | | |
| A01.8 | NOT RUN | | | |
| A02.1 | NOT RUN | | | |
| A02.2 | NOT RUN | | | |
| A02.3 | NOT RUN | | | |
| A02.4 | NOT RUN | | | |
| A02.5 | NOT RUN | | | |
| A02.6 | NOT RUN | | | |
| A03.1 | NOT RUN | | | |
| A03.2 | NOT RUN | | | |
| A03.3 | NOT RUN | | | |
| A03.4 | NOT RUN | | | |
| A03.5 | NOT RUN | | | |
| A03.6 | NOT RUN | | | |
| A04.1 | NOT RUN | | | |
| A04.2 | NOT RUN | | | |
| A04.3 | NOT RUN | | | |
| A04.4 | NOT RUN | | | |
| A04.5 | NOT RUN | | | |
| A04.6 | NOT RUN | | | |
| A04.7 | NOT RUN | | | |
| A04.8 | NOT RUN | | | |
| A04.9 | NOT RUN | | | |
| A05.1 | NOT RUN | | | |
| A05.2 | NOT RUN | | | |
| A05.3 | NOT RUN | | | |
| A05.4 | NOT RUN | | | |
| A05.5 | NOT RUN | | | |
| A05.6 | NOT RUN | | | |
| A06.1 | NOT RUN | | | |
| A06.2 | NOT RUN | | | |
| A06.3 | NOT RUN | | | |
| A06.4 | NOT RUN | | | |
| A06.5 | NOT RUN | | | |
| A06.6 | NOT RUN | | | |
| A06.7 | NOT RUN | | | |
| A06.8 | NOT RUN | | | |
| A06.9 | NOT RUN | | | |
| A07.1 | NOT RUN | | | |
| A07.2 | NOT RUN | | | |
| A07.3 | NOT RUN | | | |
| A07.4 | NOT RUN | | | |
| I00.1 | NOT RUN | | | |
| I00.2 | NOT RUN | | | |
| I00.3 | NOT RUN | | | |
| I00.4 | NOT RUN | | | |
| I00.5 | NOT RUN | | | |
| I01.1 | NOT RUN | | | |
| I01.2 | NOT RUN | | | |
| I01.3 | NOT RUN | | | |
| I01.4 | NOT RUN | | | |
| I01.5 | NOT RUN | | | |
| I01.6 | NOT RUN | | | |
| I01.7 | NOT RUN | | | |
| I02.1 | NOT RUN | | | |
| I02.2 | NOT RUN | | | |
| I02.3 | NOT RUN | | | |
| I02.4 | NOT RUN | | | |
| I02.5 | NOT RUN | | | |
| I02.6 | NOT RUN | | | |
| I03.1 | NOT RUN | | | |
| I03.2 | NOT RUN | | | |
| I03.3 | NOT RUN | | | |
| I03.4 | NOT RUN | | | |
| I03.5 | NOT RUN | | | |
| I03.6 | NOT RUN | | | |
| I03.7 | NOT RUN | | | |
| I04.1 | NOT RUN | | | |
| I04.2 | NOT RUN | | | |
| I04.3 | NOT RUN | | | |
| I04.4 | NOT RUN | | | |
| I04.5 | NOT RUN | | | |
| I04.6 | NOT RUN | | | |
| I04.7 | NOT RUN | | | |
| I05.1 | NOT RUN | | | |
| I05.2 | NOT RUN | | | |
| I05.3 | NOT RUN | | | |
| I05.4 | NOT RUN | | | |
| I05.5 | NOT RUN | | | |
| I05.6 | NOT RUN | | | |
| I06.1 | NOT RUN | | | |
| I06.2 | NOT RUN | | | |
| I06.3 | NOT RUN | | | |
| I06.4 | NOT RUN | | | |
| I06.5 | NOT RUN | | | |
| I06.6 | NOT RUN | | | |
| I06.7 | NOT RUN | | | |
| I06.8 | NOT RUN | | | |
| I06.9 | NOT RUN | | | |
| I07.1 | NOT RUN | | | |
| I07.2 | NOT RUN | | | |
| I07.3 | NOT RUN | | | |
| I07.4 | NOT RUN | | | |
| P08 joint sign-off | NOT RUN | | | |

## Detailed case result — copy per case

- Case ID / V IDs / guide stage:
- Candidate hash / phone / run time and zone:
- Preconditions (owner, permission, selection, saved vs installed revision, network):
- Exact steps and synthetic input values:
- Expected result:
- Actual result / PASS, FAIL, BLOCKED, DEFERRED, N/A:
- Sanitized recording/screenshot reference and action timestamp:
- Before/after account data and installed native state:
- Side effects / cleanup performed:
- Defect ID, severity, assignee and blocked dependent cases:
- Fix source commit / rebuilt artifact:
- Retest steps/result/evidence (retain original failure):

## Timing evidence — repeat for each timing case

| Case / target | Reason(s) / native revision | Session count before→after | Start time | Requested elapsed deadline | Native callback time if safely observable | Shield actually observed time | Drift | Foreground / network / host state | Result |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | NOT RUN |

Record clock/zone and stopwatch duration. Native callback and shield timestamps are separate. If unavailable, say so. Do not infer an exact-time pass from checking the app after expiry. No raw boot/identity signals or native tokens in evidence.

## A→B→A state evidence

| Checkpoint | Visible account label | Saved draft/quest/wallet label | Active native owner label / revision | Count / deadline retained? | Explicit claim or Apply? | Expected/actual |
|---|---|---|---|---|---|---|
| A before logout | | | | | | |
| A logged out | | | | | | |
| B before claim | | | | | | |
| B claim canceled | | | | | | |
| B claim confirmed | | | | | | |
| A returned without Apply | | | | | | |

Do not store raw account IDs, lease handles, app tokens or credential-bearing payloads here.

## Defect and retest queue

| ID | Failure / affected V IDs | Severity / owner | Reproduction and evidence | Fix commit / candidate | Retest and regression result | Open/closed |
|---|---|---|---|---|---|---|
| | | | | | | |

Priority order: credential/privacy or account separation → lost/unexpected protection → timing/budget/duplicate money-like credits → persistence/auth → layout/usability. Stop dependent tests while a blocking failure is open; continue independent work.

## Cleanup and platform sign-off

- Synthetic plans/quests stopped? Retained intentionally active rules and owner:
- Original permissions, text, network and battery settings restored?
- Task-created USB mapping/servers removed or intentional owner assigned?
- App/account data preserved; no unapproved uninstall/deletion performed?
- Required cases passed / failed / blocked / not run:
- Deferred long-duration/accessibility/store cases, owners and dates:
- Capability differences requiring explicit product decision:
- Platform acceptance: OPEN / SCOPED PASS (scope and exact artifact):
- Tester signature/date:
- Other-platform/shared reviewer signature/date:
- Joint VERIFY-C06 status and links:

A SCOPED PASS does not certify all devices, hosted deletion, missing product features or store distribution. Do not sign iPhone enforcement accepted while its activation gate is still off.
