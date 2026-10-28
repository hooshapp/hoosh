# Shared contracts

This type-only package gives auth, shared UI, Android, and iOS a common boundary.
Import with `import type { ... } from '@disconnect/contracts'`.

- `AccessTokenProvider`: the auth owner supplies a current access token to the API client.
- `ProtectionService`: draft native port from TSD §3. Each platform supplies its own implementation and capability evidence.
- `HealthResponse`: the currently implemented public API response.

There is no approved session allocator, plan policy, quest lifecycle, or reward formula here. Resolve the corresponding PM questions before adding those production contracts. Changes to shared contracts should be reviewed by both developers and reach `main` early.

Future HTTP types should be generated from FastAPI OpenAPI once product endpoints exist. Avoid manually maintaining competing HTTP schemas in Python and TypeScript.
