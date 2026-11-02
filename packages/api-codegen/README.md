# API contract build tool

Private build-only workspace; never import it from mobile/runtime code. Root
`npm run api:generate` first exports the environment-free FastAPI schema, then runs
this pinned `openapi-typescript` 7.13.0 generator. `api:check-contracts` compares both
outputs without modifying them and fails on drift. Only repository-local schema
references are accepted; there is no arbitrary URL/schema input or network client.

The generator declares a TypeScript 5 peer. It is isolated here with 5.9.3; the app
and contracts remain on TypeScript 6.0.3. Do not bypass peer resolution, downgrade
the app compiler, create another lockfile or add a second runtime HTTP client.
Fresh filtered `npm ci --workspace @disconnect/api-codegen --include-workspace-root=false`
and the check command were verified independently of the existing node_modules.

`foundation.openapi.json` and `http.generated.ts` are one reviewed change. Run
`npm run api:generate`, inspect both and commit them together. Never hand-edit the
output or add unimplemented profile paths. Compile-only consumer cases live under
`packages/contracts/type-tests` and validate with the app's TypeScript 6 compiler.
Generated TypeScript does not validate arbitrary network JSON; keep runtime
response validation/account checks in the existing client.

Scoped npm audit on 2026-11-01 reports three moderate findings in the build-only
openapi-typescript → Redocly → minimatch chain (no high/critical in this workspace).
The registry suggests a generator major downgrade; it was not forced. Inputs are
only the trusted local exported schema, external references are rejected, and the
tool is absent from application runtime imports. Track a compatible upstream fix;
these findings are not a claim that the entire existing mobile dependency tree is
clean. See Plan 03 notes/evidence for exact observed counts and limits.
