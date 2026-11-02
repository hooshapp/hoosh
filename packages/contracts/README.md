# Shared contracts

This type-only package gives auth, shared UI, Android, and iOS a common boundary.
Import with `import type { ... } from '@disconnect/contracts'`.

- `AuthIdentity`, `AuthSnapshot`, `AuthSessionPort`: Anisha owns the only session
  manager. Ishmum consumes its immutable state/subscription, current token provider
  and single-flight revalidation. Generation changes invalidate private work;
  routine token refresh does not change generation. No raw tokens in snapshots.
- `AuthUnavailableError`: structural typed failure, implemented at runtime by Auth.
  `AccessTokenProvider` returns null only for known signed-out state; unavailability
  rejects. Session state never fabricates successful credentials.
- `AuthAccountActions`, `SignOutResult`: Anisha implements current-session sign-out
  separately. Local erasure and remote revocation certainty are distinct; a local
  storage failure rejects and keeps private UI locked.
- `ProtectionIntegration`: only a connected native bridge exposes `ProtectionService`.
  Connection does not mean OS permission or installed rules. No adapter is registered.
- `ProtectionService`: draft native policy port from TSD §3, implemented later by
  Anisha (Swift) and Ishmum (Kotlin). An `active` status requires authorized permission
  and a numeric installed revision; adapters must still validate actual device state.
- `HealthResponse`: the currently implemented public API response.

There is no approved session allocator, plan policy, quest lifecycle, or reward formula here. Resolve the corresponding PM questions before adding those production contracts. Ishmum and Anisha review shared-contract changes and integrate them into `main` early. These types contain no React, Supabase SDK, runtime adapter, or production fixture selector.

The adopted [HTTP contract](HTTP_API.md) and synthetic [fixtures](fixtures/http-v1.json)
specify identity and profile reads (implemented) and revisioned saves (implemented in API-09). API-05 generates HTTP
types from Pydantic/FastAPI OpenAPI; no duplicate handwritten HTTP schemas now.

`npm run typecheck --workspace @disconnect/contracts` checks source and
[compile-only consumers](type-tests/interfaces.typecheck.ts), including exhaustive
state handling and rejected impossible states. Fixtures/type tests are outside
mobile routes/imports. See [handoff and release-isolation rules](../../docs/architecture/foundation-handoffs.md).


## Implemented HTTP authority — API-05

FastAPI/Pydantic models are executable authority for implemented `/healthz`,
`/v1/me` and `GET/PATCH /v1/profile`, plus shared safe errors. `openapi/foundation.openapi.json` and
`src/http.generated.ts` are committed together. The public entry exports type-only
`paths`, `operations`, `components`, `HealthResponse`, `MeResponse`, `ProfileView`,
`ProfileResponse`, `ProfilePatch`, `ProfileSavedResponse`, `ApiErrorEnvelope`
and `ApiErrorCode`. Auth/native domain ports remain handwritten and type-only.

From the repository root:

```sh
npm run api:generate
npm run api:check-contracts
npm run typecheck
```

Export imports pure application assembly, never `main.app`, settings construction,
network clients or database setup. Its unavailable provider cannot return a user.
The [private generator workspace](../api-codegen/README.md) isolates its TypeScript 5
peer without changing the TypeScript 6 application. CI checks drift and the shared
fixtures against both Pydantic and exported JSON Schema. Reserved profile error
shapes are now consumed by API-09 revisioned PATCH. API-08 validates nullable GET
successes; API-09 adds strict input and a nonnullable saved-profile response.
Raw draft names have no misleading maxLength; the server canonicalizes once and
bounds normalized code points independently of raw body bytes. Generated types do not replace runtime response/subject validation.
