# Mobile account/session authority — RN09B-D02

The official Supabase SDK owns password sign-in, credential persistence/refresh and
local sign-out. session.ts projects AuthSessionPort snapshots without tokens.
The existing API/session scope fences every request and the account controller
replaces private caches/forms at identity generation changes. Root composes this
through AppSessionBoundary; Settings has explicit local sign-out. A refresh does
not remount/discard drafts; sign-out intent does invalidate them immediately.

Configure only EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
plus EXPO_PUBLIC_API_BASE_URL in ignored apps/mobile/.env. Never put service-role,
database, access or refresh credentials in public Expo variables. Native credentials
use SecureStore; web is memory-only. Storage failures lock private routes, and
clearing the device session is the explicit recovery action. Native Android main
manifest and Expo plugin both reference supported credential backup exclusions.

Existing-account password login is integrated; broader signup/provider/redirect/
onboarding flow remains Anisha’s work. No Auth admin/project setting or account
creation/deletion is performed here. Supabase callback is synchronous and never
awaits another SDK call while its internal lock may be held. Foreground lifecycle
alone starts SDK auto-refresh; ordinary token acquisition is fenced before/after.

Run npm run check for port, real installed-SDK and iOS/Android preset root tests.
Actual managed-account phone and signed platform acceptance are separate records.
Reference: https://supabase.com/docs/guides/auth/quickstarts/react-native and
https://supabase.com/docs/reference/javascript/auth-onauthstatechange .
