# Plan05 — Combined normal-app verification

## Current checkpoint — INT-VERIFY-C01, November22

- Branch `integration/shared-product`, parent `ed263cc`. Earlier C06 short-swipe
  repair remains staged/uncommitted; preserve it. User retains commits/pushes.
- User authorized doing simulator-capable checks and moving into other integration
  while physical tests wait. BASE-C04 composition seams already passed (`b4db69a`);
  Plan05 permits C01 independently. **C01 readiness passed; whole app not accepted.**
- Current rerun:118 component cases (47root+9provider+3setup on each preset) and88
  portable Auth/account/client recovery cases passed. Reused existing fixtures and
  interruption points. No runtime dependency, native source or backend change.
- Public config guard, current local health/private401 gates and loopback listeners
  passed. Mobile/backend development project/issuer/audience/ES256 alignment checked
  without printing values; public JWKS HTTPS certificate validation passed.
- Compact installed JS/source matches current sanitized simulator receipt. Original
  signed-in B simulator unchanged. User reports intro scrolling worked; physical
  feel/reliability still pending. No phone queried/modified.
- Preserve the active manual API/PG17 fixture. No schema/reset suite, hosted mutation,
  credential extraction, test identity creation/deletion or native permission action.
- V01–V24 now have a shared evidence/status manifest. Partial rows are `running`,
  absent live checks stay pending, V22–V24 deferrals remain explicit. C06/physical
  acceptance is not relabeled complete to advance integration numbering.
- Next: VERIFY-C02/C03 independent Auth/setup work and available simulator checks;
  exact Android packaged journey separately; iOS signed journey waits for spare
  phone and reachable API. Full VERIFY-C06 cannot pass before required platform work.

## INT-VERIFY-C01 — Readiness and fixture inventory

Changed:
- `docs/integration_notes/artifacts/verify-c01-readiness.json`: source/runtime hashes,
  existing fixture inventory, current test/config/environment results, V01–V24 and
  safe cleanup state. No real identities/secrets.
- `docs/qa/combined-app-verification.md`: actual repeat commands, fixture/fault scopes,
  manual-vs-automated limits and active manual-DB protection rule.
- `docs/integration_plan/05_combined_app_verification.md`: C01 prepared/independent
  status and concrete QA/manifest links; C02–C06 acceptance stays open.
- `docs/qa/ios-c06-simulator.md` and Plan04 notes: owner-reported simulator intro pass
  and explicit physical-feel recheck, not real Screen Time acceptance.
- This notes file: current checkpoint, per-file record, evidence and next step.

Existing harness inventory includes normal-root integration, account/provider and
Auth/client recovery; guarded profile/settings/quest/rewards/History/recommendation
HTTP/PG suites; iOS product inspector/native runner; Android standalone/optimized
smoke, native instrumentation and pure-engine scripts. Existing QA runbooks and
core Plan03/04/source Auth handoffs were consulted. No new test dashboard or second
framework; historical reports are explicitly separated from current execution.

The118 current component tests mount normal production routes with synthetic SDK,
API and native ports. The88 unit cases do not use managed accounts. Those tests
accept fixture seams only, not real provider, secure-store, OS permission or native
intervention behavior. Existing fixture A/B have differing settings/credit data;
profile/quest distinctions remain in their existing guarded parent harnesses.
No DB suite rerun against the still-running manual API. Migration0007/287DB remains
previous C06 evidence, not a fresh count. Physical iPhone acceptance remains deferred.

Validation: both commands passed; public config guard passed; JSON/24-ID/status,
source-hash and path-reference checks plus Git whitespace checks passed. Local
logs/reports under `/tmp/hoosh-verify-c01-*`; committed manifest is redacted. All
intended files staged for owner review; no commit/push or remote branch operation.
