# Mobile account/session authority

The official Supabase SDK owns password sign-in, credential persistence/refresh and
local sign-out. The landing-page SessionController projects AuthSessionPort
snapshots without tokens. createAppRuntime wires it to the API and account scope.
The existing API/session scope fences every request and the account controller
replaces private caches/forms at identity generation changes. Root composes this
through AppSessionBoundary; Settings has explicit local sign-out. A refresh does
not remount/discard drafts; sign-out intent does invalidate them immediately.

Configure only EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
plus EXPO_PUBLIC_API_BASE_URL in ignored apps/mobile/.env. Never put service-role,
database, access or refresh credentials in public Expo variables. Native credentials
use project-scoped, serialized SecureStore. Web uses project-scoped tab
sessionStorage with a separate SDK channel per instance. Storage failures lock private routes, and
clearing the device session is the explicit recovery action. Native Android main
manifest and Expo plugin both reference supported credential backup exclusions.

The shared app uses the project-scoped session key and asks users to sign in
again if their only credential is from the old unscoped shared build. Startup
does not import that key, choose a session by email, or read the standalone
Swift pilot's credentials. Explicit native sign-out retires the exact old shared
session, verifier and user keys, with readback before logout completion.
Interrupted link cancellation only clears the canonical flow. An unreadable
pending callback keeps private access locked until explicit session cleanup.
A matched signup name is an optional 24-hour local suggestion in Settings.
The profile is updated through a confirmed revision-checked save.
Supabase callback is synchronous and never
awaits another SDK call while its internal lock may be held. Foreground lifecycle
alone starts SDK auto-refresh; ordinary token acquisition is fenced before/after.

Run npm run check for port, real installed-SDK and iOS/Android preset root tests.
Actual managed-account phone and signed platform acceptance are separate records.
Reference: https://supabase.com/docs/guides/auth/quickstarts/react-native and
https://supabase.com/docs/reference/javascript/auth-onauthstatechange .
