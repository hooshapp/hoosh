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

## Activity preferences (RN-09i)

The same isolated entry now opens the production Settings activity summary and
**Redirect Me To** editor. Run only against an approved development project with
migration `0002` applied. The migration must be coordinated separately; the mobile
consumer does not apply it or manage Auth. Follow the existing connection/token
steps above, then open **Redirect Me To** from live Settings.

- Verify missing row versus failed read; selecting nothing and pressing
  **Save activities** explicitly saves empty preferences. No GET creates a row.
- Edit built-in choices and raw custom text; save, reopen, discard and check
  authoritative validation. Deselecting Custom clears its saved text; toggling it
  before saving retains the raw input. The summary uses accepted data only.
- Advance the same settings revision from another client while dirty (including
  a plan-draft change). Save must conflict; **Check latest preferences** performs
  GET. **Keep my edits** requires a later Save; **Use latest preferences** discards
  the volatile draft. Neither review choice sends PATCH. Unselected sections
  must survive an activities-only save.
- Existing **Lose next save response** applies to the next PATCH, including
  activities. After an uncertain save or a failed latest read, no automatic replay
  is permitted. Restore access and deliberately review the latest preferences.
- Test offline edits/reconnect, dirty Back and account/generation replacement.
  Restore any modified preferences with revision checks; do not overwrite
  independent changes. No native rule, session or onboarding state is changed.

RN-09i has deterministic/component and Android Hermes compilation evidence only.
Hosted upgrade, real Auth/root, authenticated phone round trips, signing and
assistive speech are separate acceptance gates. Earlier user deferrals remain in
force. This QA credential adapter is still excluded from production exports.

## Non-enforcing plan drafts (RN-09j)

Under the same approved account, open **Draft days**, **Draft hours** or **Draft
sessions** from live Settings. Each view uses the same account query and settings
revision as activities. These screens store preferences only; the status reads
**Saved draft — not active** after a verified save. No native plan, authorization,
onboarding completion or session budget follows from it.

- Save and reopen days, one or both hours, timezone and nullable session values.
  Leave unset fields blank; no timezone is inferred. Use an IANA name or alias such
  as `America/New_York` or `US/Eastern`. Invalid raw timezone text must remain
  editable after authoritative server validation. Overnight ranges need explicit
  **Ends the next day**; equal or malformed entered times cannot save.
- Clear days, hours or either session field independently. Blank timezone means
  unset. **Clear entire plan draft** changes local intent first; **Save cleared
  draft** sends explicit section null. Confirm the activities remain unchanged.
- Keep the days editor dirty while another client changes hours or activities.
  Saving days must conflict against its original revision. Check latest, compare,
  then Keep my edits or Use latest draft. Keep requires another Save and replaces
  only this view's field group against the reviewed base: days; hours + timezone;
  or session count + minutes. Other fields/activities must survive. Clearing the
  whole draft is deliberately broader and clears all draft fields.
- Use the existing one-shot lost-response control, fail the latest read, restore
  access and review. No automatic rebase/replay or successful-save claim may
  precede verified read/acceptance. Check offline edits, dirty Back, duplicate
  taps, account changes and a same-user new session generation.
- Restore any modified test preferences with revision checks, preserving other
  clients' work. Keep every live token local; the operator adapter still does
  not refresh credentials or replace Anisha's Auth/root integration.

RN-09j deterministic/component tests cover the real shared query/forms with
synthetic account ports, including concurrent editors and a committed save whose
response is lost. Actual hosted/HTTP phone journeys, signing and assistive speech
remain unexecuted here. The hosted migration and earlier authenticated-phone/C
account-deletion deferrals are unchanged.
