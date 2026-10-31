# Feature boundaries

- Auth and onboarding: Anisha owns Supabase Auth/project/provider/email/redirect/test-account setup (SB-01–03), plus routes in `src/app/(auth)` and `src/app/(onboarding)`, session persistence, token access, and resumable onboarding.
- Main app: Ishmum owns routes in `src/app/(tabs)`, quests/history/settings behavior, and server data integration.
- [Home presentation](home/README.md) is RN-09a: the real route composes original cards with explicit unavailable inputs, while illustrative outcomes stay in the isolated developer specimen. RN-09b/c/d add Quests/History/Settings presentation; live policy/data/native/account wiring remains pending.
- Keep route files small as features grow; place domain logic and feature components here.
- Auth supplies the full shared `AuthSessionPort` to one stable `createApiClient` instance per environment/producer. RN-03 uses snapshots/generation as well as fresh tokens, delegates bounded revalidation to Auth, and never implements login, refresh or sign-out. Read [the HTTP client contract](../infrastructure/api/README.md) before RN-04/05 wiring.
- Account features use the [RN-04 query/provider contract](../infrastructure/query/README.md). Keep private forms/toasts within its keyed subtree, forward signals through RN-03, and use guarded synchronous mutation callbacks. Root Auth/guard wiring stays coordinated with Anisha.
- Plan authoring in onboarding and Settings must reuse the same approved schema and validation. That policy contract is not finalized by this scaffold.
- Native rule/session state remains authoritative in Swift/Kotlin; do not duplicate timers in feature stores.

Ishmum and Anisha review shared contracts and root routing changes. Development fixtures must stay explicit and must never imply authenticated accounts, installed restrictions, or measured progress in production.

The [account consumer](account/README.md) is prepared for RN-05 but not routed into the current app. It consumes the shared ports; real Auth/guards, protected API identity and generated types must land before live acceptance. Never install a synthetic session to enable the region in release.

[Protection presentation](protection/README.md) consumes the shared native read contract independently of Auth/API. Only fresh matching native evidence may yield an active claim; simulated evidence stays outside app routes. Native adapters/actions, lifecycle wiring and account/native ownership remain separate work.

[Quests presentation](quests/README.md) implements RN-09b. Suggested and saved
records stay distinct; the real route uses unavailable inputs. New source icons
are copied unchanged from the user's original pack. Editors/lifecycle and live
Auth/backend/native actions remain separate gated work.

[History](history/README.md) requires metric evidence and comparison eligibility; [Settings](settings/README.md) reuses account/profile UI with explicit availability and supported owner callbacks. Actual routes contain no sample identity, plan or outcomes. Read each feature’s deferred IDs before wiring producers.
