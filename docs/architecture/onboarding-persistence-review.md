# Follow-on onboarding persistence review

Prepared by Ishmum under API-10, 2026-11-02. **Review checklist, not an approved
extension or implemented endpoint.** Anisha owns Auth/onboarding/iOS; Ishmum owns
shared main-app UI/Android/backend/product persistence. Review jointly after the
real identity/profile handoff. No PM question is answered by this document.

## Existing executable boundary

The only profile data are user_id, display_name, revision and server timestamps.
GET is nonmutating; row existence or a nullable name proves no onboarding,
authorization, app selection, installed plan or active protection state. PATCH
requires raw string/explicit null and expected revision; the API canonicalizes it.
Auth metadata is not a second canonical name store. Identity uses verified UUID,
never email. All device enforcement remains independent of cloud/JS availability.

For a signup name, hold an operation-local draft until the resulting account is
verified. Bind it to that exact account/generation; a restored unrelated session
must not inherit it. Read the current profile and require a deliberate save or
reviewed account-bound submission, not blind expected-0 replay. Preserve the draft
on conflict/offline/failure. After an ambiguous response, refetch and reconcile.
Name persistence does not complete onboarding or install native restrictions.

## Contract questions before the next plan

| Boundary | Review / evidence needed | Owner |
|---|---|---|
| Identity and draft scope | Exact signup result/UUID, generation invalidation, cancellation and late-response rejection; clear or isolate on account changes | Anisha Auth; Ishmum consumer |
| Local resume | Which steps/drafts persist locally, what is account-bound, expiry/erasure rules, interrupted signup and shared-device behavior | Anisha onboarding; joint privacy review |
| Display-name write | Raw input/null semantics, missing profile versus failed query, current revision, explicit submit/conflict and response-loss behavior | Existing API-08/09; joint RN-07 integration |
| Demographics/eligibility | Q19/PD-17 answers, necessity/consent/skip/retention and launch eligibility; no age/gender inference | PM answers; Anisha flow and Ishmum later schema |
| Selected apps / permission | Real platform capability/authorization and locally owned opaque selection; permission revocation/denial and reselection | Anisha iOS, Ishmum Android |
| Activities / custom input | Approved taxonomy/limits/versioning, edit semantics and cross-device needs; no generic profile JSON blob | Joint product/schema review |
| Plans and schedules | PD-01–04 session/overlap/override policy, timezone/DST, revisions, validation and local installation acknowledgement | PM decisions; Ishmum API/Android, Anisha iOS |
| Completion | Define separately: draft entered, server accepted, native authorized, plan installed, UI flow completed; specify authoritative owner and recovery for each | Joint review before any completion endpoint |
| Offline and failures | No 503-as-absence/sign-out, no fake permission/saved state, account-scoped reconciliation, no blind mutation replay | Joint clients/backend |
| Account lifecycle | Sign-out privacy versus retained native restrictions; deletion/outbox/in-flight work and retention need a later explicit lifecycle contract | Joint Auth/native/backend |

Do not send iOS selection tokens, raw installed-app/usage inventories, credentials
or unreviewed demographics to FastAPI as a shortcut. Coarse authorized summaries
can be proposed later only with a concrete purpose and reviewed platform/privacy
boundary. A server boolean cannot stand in for current OS permission or installed
native revision. A draft cannot stand in for a committed profile or plan.

## Exit criteria for a follow-on implementation plan

1. Anisha's real session/root producer and RN-07 consumer use the existing generated
   API shapes and same-account validation; record web/native outcomes separately.
2. Record the necessary PM answers under their existing IDs. Leave unresolved
   session/reward/measurement policy open; avoid collecting unused information.
3. Specify exact fields, types, validation, revisions, ownership, privacy/retention,
   error/retry/idempotency behavior and migration/recovery. One Alembic history.
4. Specify local draft lifetime and transitions across signup, restore, sign-out,
   account replacement, offline operation and server conflict/ambiguous save.
5. Specify actual native permission/installation evidence independently of cloud
   acceptance; cover denial, revoked permission and termination/restart behavior.
6. Divide the agreed scope into reviewable commits and update the relevant plans
   and implementation notes. No new onboarding tables/routes are created here.
