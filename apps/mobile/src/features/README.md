# Feature boundaries

- Auth and onboarding: teammate owns routes in `src/app/(auth)` and `src/app/(onboarding)`, session persistence, token access, and resumable onboarding.
- Main app: you own routes in `src/app/(tabs)`, quests/history/settings behavior, and server data integration.
- Keep route files small as features grow; place domain logic and feature components here.
- Auth supplies the shared `AccessTokenProvider` to `createApiClient`. The HTTP client never implements its own login or refresh logic.
- Plan authoring in onboarding and Settings must reuse the same approved schema and validation. That policy contract is not finalized by this scaffold.
- Native rule/session state remains authoritative in Swift/Kotlin; do not duplicate timers in feature stores.

Both developers review shared contracts and root routing changes. Development fixtures must stay explicit and must never imply authenticated accounts, installed restrictions, or measured progress in production.
