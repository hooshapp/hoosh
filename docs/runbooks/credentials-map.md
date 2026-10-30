# Hoosh configuration and credential locations

This inventory lists names and locations only. Never paste credential values into
this document, source code, commits or chat.

## Mobile configuration

The current development app uses `apps/mobile/.env`. A second `.env.local` is
not required. Both filenames are ignored by Git. Use one local configuration
file to avoid confusing overrides. `.env.example` is the shareable template.

All current mobile variables are public configuration bundled into the app:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project endpoint |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key; never substitute a service-role or secret key |
| `EXPO_PUBLIC_API_BASE_URL` | Development backend endpoint |
| `EXPO_PUBLIC_GOOGLE_ENABLED` | Enables the configured development Google flow |
| `EXPO_PUBLIC_APPLE_NATIVE_ENABLED` | Enables native Apple UI when the device supports it; signed-device acceptance is separate |
| `EXPO_PUBLIC_APPLE_OAUTH_ENABLED` | Enables the configured Apple browser flow |

An ignored file prevents accidental Git tracking; it does not make an
`EXPO_PUBLIC_` value secret after bundling.

## Private credentials

| Credential | Where it belongs | Mobile env? |
| --- | --- | --- |
| Google OAuth client secret | Supabase Authentication → Providers → Google | No |
| Apple OAuth client-secret JWT | Supabase Authentication → Providers → Apple | No |
| Apple private signing key (`.p8`) | Secure owner-controlled storage outside the repository; currently downloaded locally | No |
| Gmail app password | Supabase Authentication → SMTP settings | No |
| Supabase service-role/secret key or database password | Approved server-only secret store if future backend work requires it; not needed for mobile sign-in | No |
| Personal Google/Apple passwords and verification codes | Enter directly into the provider's login page | No |

Apple's client-secret JWT was generated locally from the `.p8`, with its
signature checked. Its temporary local file has owner-only access. The pasted
JWT is stored in Supabase, not in the app. The `.p8` is needed for future
rotation; retain it securely. The current JWT expires April 28, 2027 at 16:26 UTC;
replace it before then. Do not rely on a temporary JWT file as a backup.

Public Apple identifiers are recorded in `social-auth-development.md`; they are
configuration identifiers, not passwords. The provider dashboards remain the
source of truth for saved credentials. If a credential is lost, rotate it through
its provider rather than attempting to recover it from logs or chat.
