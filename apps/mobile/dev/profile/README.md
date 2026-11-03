# Live profile device QA

This separate Expo Go entry exercises the production RN-07 profile consumer,
account scopes, HTTP client and real FastAPI/Supabase profile persistence. Its
operator credential adapter is **not Anisha's Auth SDK**, onboarding, refresh,
sign-out or an application M1/M2 acceptance substitute. No user/token is in source,
environment bundles, browser storage or production imports. Export isolation checks
the `RN07_DEVICE_QA_ONLY` marker. Never ship this project.

1. Start the ordinary configured development API on loopback port 8765:
   `uv run --project services/api uvicorn app.main:app --app-dir services/api --host 127.0.0.1 --port 8765 --no-access-log`.
2. Run `npm run mobile:qa:profile`. Connect an authorized, unlocked Android phone.
3. Run `adb reverse tcp:8091 tcp:8091` and `adb reverse tcp:8765 tcp:8765`.
   Open `exp://127.0.0.1:8091` in Expo Go. Use a compatible installed Expo Go.
4. Enter a current, approved development-account access token in the secure field.
   Connect verifies it at the real `/v1/me` before creating the developer credential
   port. The token stays only in process memory. Never put it in a URL, command
   shown in chat, screenshot, committed file or `EXPO_PUBLIC_*` variable.
5. Open live Settings. Edit/save, reload, explicitly clear, discard, and check server
   validation. Have a second client advance the revision while this form is dirty;
   Save must show conflict. Review latest must preserve the draft and require
   **Keep my edits** or **Use latest profile**. Neither decision sends a write.
6. To test a lost response, return to QA controls and press **Lose next save
   response**. This forwards one actual PATCH, discards its response and throws a
   network error. Save must become unconfirmed. **Check latest profile** must GET
   before either explicit choice; there must be no automatic write replay.
7. Test hardware Back while dirty, keyboard, foreground/reconnect and offline
   Save. Disconnect the QA account before entering B's token. No A draft or response
   may appear in B. Reconnect with a fresh token when expired; this adapter does
   not silently refresh credentials.
8. Restore original names with revision-checked writes, preserving independent
   edits. Record revision advancement rather than pretending the test changed
   nothing. Disconnect QA, stop only task-owned servers and remove the two task
   reverse mappings. Do not clear Expo Go/user data or change Auth settings.

The real Settings route also mounts the same `ProfileSurface` when it is inside
Anisha's `AccountDataProvider`. Until that root exists, it keeps its neutral preview.
Physical Expo Go runs do not prove standalone signing, iOS, assistive speech or
native protection. See the Plan 04 notes for actual results and unfinished checks.
