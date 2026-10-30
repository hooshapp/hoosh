# Supabase development Auth setup

Observed/configured 2026-10-29 with the owner's signed-in dashboard. No secret keys,
passwords, test credentials or session tokens belong in this runbook.

- Organization: `hoosh` (`cikbfczbhzjmkpqddkjq`).
- Existing project: `eaisvwqfbgdkzdfmxkvm`; URL
  `https://eaisvwqfbgdkzdfmxkvm.supabase.co`; region `us-east-1`.
- The owner created/selected this project for the development setup. Supabase's
  default primary branch is labeled `main PRODUCTION`; this is not evidence that
  the mobile product is production-ready. No extra project or paid upgrade created.
- Dashboard observed: email provider and signup enabled; email confirmation on;
  Google off. Confirmation and provider choices were not loosened.
- Only the existing publishable client key was copied into ignored
  `apps/mobile/.env`. No database/service/secret key was requested or copied.
- Owner explicitly approved saving these callback settings in this chat. Reload
  confirmed Site URL `http://localhost:8090` and the three allowed entries:
  - `http://localhost:8090/auth/callback?flow=*`
  - `http://localhost:8081/auth/callback?flow=*`
  - `disconnect-dev://auth/callback?flow=*`
- The wildcard is limited to the generated flow ID query value. The app validates
  an exact known origin/scheme/path plus the initiating flow/verifier context.
  No broad production redirect wildcard or arbitrary return navigation is used.
- Web preview must use the same origin and tab that initiated the email request.
  `127.0.0.1`, another port, a new tab, or another device lacks that tab's verifier.
  After requests, open the email link back in the original app tab; do not paste
  authentication links/codes into chat. Native URI mapping remains unverified.

## Public backend trust metadata

Read-only public JWKS lookup succeeded at
`https://eaisvwqfbgdkzdfmxkvm.supabase.co/auth/v1/.well-known/jwks.json`.
Observed signing key: `kid=ef271d52-d88b-4556-a642-cf99cdc8fb00`, `alg=ES256`,
`kty=EC`, `crv=P-256`, `use=sig`. Keys can rotate; backend must use discovery/cache
and the agreed verifier contract. Expected issuer is
`https://eaisvwqfbgdkzdfmxkvm.supabase.co/auth/v1`. Audience `authenticated` remains
the planned value, pending observation from an actual development-user session.
No backend JWT verifier or `/v1/me` endpoint is implemented by this increment.

## Owner-assisted live acceptance

1. Open the local app signup preview and use an email you control. Its account is
   separate from the Supabase dashboard account. Enter its password directly;
   never share it in chat. Supabase's built-in test sender may restrict recipients;
   custom Gmail SMTP is now saved and a recovery request returned 200; actual inbox
   receipt/callback is not yet qualified.
2. Observe confirmation waiting, then open the latest email link in the original
   app tab/device. Confirm authenticated navigation without claiming native setup.
3. Reload, check Settings account identity, sign out, and verify private routes are
   inaccessible. Repeat with a second distinct disposable account for isolation.
4. Request recovery, open the link in the original context, update the password
   directly, then sign in again. Check expired/reused/mismatched links and offline
   paths without disabling confirmation.
5. Record exact browser/platform/build and outcomes in the QA document, with no
   passwords/tokens/callback query strings or real recipient addresses.

Project setup is partial until actual email/confirmation/recovery and test-user
signing behavior pass. Native and API integration have separate acceptance gates.


SMTP update: owner saved Gmail development SMTP directly. A fresh page confirmed
custom SMTP enabled, smtp.gmail.com:465 and a hidden stored password. One live app
recovery request returned 200 and matches the existing confirmed test user in
Auth logs. Inbox receipt and the recovery callback remain pending; see the
[social Auth runbook](social-auth-development.md). No SMTP secret was read/stored
by the agent.
