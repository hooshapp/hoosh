# Account server-state boundary (RN-04)

Ishmum supplies this producer. Anisha supplies `AuthSessionPort` and authors the
coordinated root integration. The current app still enters placeholder Home;
**no real Auth provider, guard, identity/profile screen or root wiring is added here**.
The producer and adapters have deterministic tests and native JS compilation,
not live Auth/private API or signed-device acceptance.

## Compose at the shared integration boundary

Create one stable API client and controller per Auth producer/API environment,
not per render, request or token refresh. Replacing the environment replaces the
controller and private subtree. Never create a second Supabase client/SDK listener.

```tsx
// Inside the future composition module owned with Anisha; real auth is injected.
const api = createApiClient({ baseUrl: configuredApiOrigin, auth });
const accountData = createAccountDataController(auth, api);

<QueryLifecycleBoundary>
  <AccountDataProvider controller={accountData} fallback={<AccountStartupOrSignedOut />}>
    <PrivateAccountFeatures />
  </AccountDataProvider>
</QueryLifecycleBoundary>
```

Imports come from `../api/client`, `./account-controller`,
`./account-data-provider` and `./query-lifecycle-boundary`. The fallback is supplied
by the owning Auth/navigation integration; this package neither redirects nor
decides production login/guest policy. It can use `useAccountData()` to read the
safe availability projection. Never place private drafts, selections, success
messages or toasts above this provider's keyed subtree. Global toast systems need
a separately scoped owner; this package cannot clear external state it does not own.

Use one controller/provider boundary for an account feature tree. Subscription
reference counting also tolerates repeated consumers/effects. Final unsubscribe
retires the scope, clears its memory, and detaches Auth; remount creates a fresh
scope. `getServerSnapshot` is always accountless for SSR. No cache hydration,
persistence, background mutation queue or native-rule cleanup exists.

## Ownership and availability

- A settled `signed_in` UUID/generation creates its own QueryClient. Actual account,
  generation, bootstrap restart, signed-out or signing-out transitions synchronously
  retire it, abort work and clear both caches. A fresh keyed QueryClientProvider
  remounts forms even for a fast return to the same UUID. Cleanup never waits for
  sign-out network/storage success and never writes Auth's generation.
- Routine token/email changes retain the scope. `refreshing`, credential unavailable,
  and top-level unavailable at the same generation retain existing same-user data
  and drafts, but disable/cancel protected work. A different unavailable generation
  clears the old owner. Restored readiness invalidates active reads for refetch.
- `useAccountData().availability` distinguishes startup/signed-out/signing-out,
  `auth_unavailable`, `api_unavailable`, `api_paused`, `recovering` and `ready`.
  These describe account data access, not internet or installed protection.
- Query cache notifications expose the HTTP client's sustained-401 gate. Automatic
  focus/reconnect, token rotation and ordinary refetch cannot reopen it. Bind
  `controller.recoverSession()` only to deliberate user recovery; HTTP owns the
  one revalidation + one identity verification probe. Success invalidates reads.
  This function does not own account actions or sign out on 503.

## Read data once through Query

```tsx
const identity = useAccountQuery(['identity'], ({ api, signal }) =>
  api.request('/v1/me', { signal, decode: decodeIdentity }),
);
```

`decodeIdentity` is the RN-03 canonical runtime validator; API-05 will supply the
OpenAPI-generated response types. RN-05 owns the actual identity query component;
this example does not implement it. Use `['profile']` plus only relevant revision/
filter parameters for later profile queries. The helper prefixes every key with
`['account', UUID]`; never add tokens, email or unrelated draft values to keys.
Generation is isolated by the client itself. Two observers of a key share its read.

The query AbortSignal is linked to an account-owned controller and must reach the
HTTP request. Account/readiness loss also aborts work. Ownership is rechecked
immediately before work and adoption, even if an Auth notification was missed.
A producer ignoring its signal cannot deliver late data; it still must use RN-03
so real transport/deadlines bound its work. Keep query functions free of UI effects.

Initial data is absent and the first failure gets a retry/error state. With a prior
successful value, a failed background refresh retains that same-user value: inspect
`data`, `isFetching`, `isError`, `error`, `isPaused` and account availability to show
an honest stale/offline/failure notice. Do not render a full-screen first-load
spinner merely because `status` is error with data still present. Do not use
cross-account placeholder/previous/initial data. UI copy belongs to the feature.

Reads are fresh for 30 seconds. Memory retention lasts only for the owning scope
(`gcTime: Infinity`), then explicit teardown clears it. This avoids detached
observers creating five-minute timers between synchronous privacy cleanup and
React unmount. Keep query cardinality bounded; future large/infinite feeds need
explicit retention limits. There is no disk persistence or cross-session reuse.

Query adds **one** extra attempt for retryable network/timeout/503 failures, with a
1-second delay, or a valid 429 hint up to 60 seconds. It never shortens a longer
cooldown or adds retries for other known HTTP failures/raw exceptions. HTTP alone
owns its separate bounded 401 handshake. No screen retry loops. Retrying remains
subject to current ownership, readiness, online/focus state and the HTTP gate;
retiring/pausing a scope cancels a sleeping retry too.

## Mutations and UI effects

`useAccountMutation({ execute, onSuccess, onError })` exposes `submit(variables)`,
`isPending`, `data`, `error`, and `reset`. Use a controlled busy/disabled Button for
the full operation. A ref additionally prevents same-turn duplicate submissions.
There are no per-submit callbacks or `mutateAsync` escape hatch.

- `execute(variables, { api, signal, account })` is transport only. Forward the
  signal into RN-03; do not navigate, set drafts or toast from inside it.
- `onSuccess`/`onError` run only for the still-current scope. They must be synchronous
  UI/cache effects. For external asynchronous orchestration, capture the scope and
  call `scope.commit(() => effect())` **after each await**. An arbitrary callback
  that awaits and then mutates global state cannot be made safe by a wrapper.
- Writes have zero automatic retries and `networkMode: 'always'`, with a separate
  pre-dispatch online check that fails offline. They never enter an offline replay
  queue or resume after another user signs in. HTTP still decides actual reachability.
- Aborting cannot undo a server commit. A cancelled write whose producer started
  conservatively reports `requestMayHaveCommitted`; RN-03 also flags uncertain
  dispatched writes. Future profile controllers must reconcile authoritative state
  before retrying an uncertain write. Do not automatically roll back the server.
- Clearing a QueryClient cannot cancel a native restriction or transfer local native
  events to the next user. The unresolved PM/native ownership policy still gates release.

`scope.read/write/commit/client` are low-level integration/test tools, not alternate
screen fetching paths. Imperative calls must obey the same ownership and callback
rules. Do not use raw TanStack hooks/options to override the shared retry, gate,
placeholder, mutation replay or cross-account behavior.

## Platform events and checks

`QueryLifecycleBoundary` installs one reference-counted process-wide focus/online
owner, with exact cleanup. It is separate from Auth's refresh owner. Native uses
AppState and SDK-compatible `expo-network` only; initial asynchronous network reads
cannot overwrite a later event or publish after unmount. Unknown/failed reachability
is optimistic rather than an indefinite offline lock. Known disconnected or
unreachable is offline; a connected hint does not prove API availability.

Browser/SSR uses visibility and actual online/offline events; it does not import
Expo Network or trust a potentially stale initial `navigator.onLine` value to
permanently block requests. Conflicting lifecycle owners fail explicitly. One event
owner can serve multiple scoped QueryClients; it never calls Auth revalidation.

Run root `npm run check` and `npm run mobile:export`. Native mocks test lifecycle
semantics under both platform presets; they are not OS networking/device acceptance.
Direct native compilation is recorded separately because app routes do not yet
import this producer. Anisha must integrate/autolink Expo Network in an audited
native build; no Xcode, entitlement, signing, prebuild or native source change is
part of this commit. Sources: [TanStack native integration](https://tanstack.com/query/latest/docs/framework/react/react-native),
[query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation),
[Expo Network SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/network/).
