# RN-07 profile editor and live consumer

**Current checkpoint (2026-11-02):** The original controlled UI now has a real
profile consumer. `useProfileEditor` and `ProfileSurface` use generated DTOs,
strict same-owner runtime decoding and the existing account scope. The Settings
route mounts it only inside the Auth owner's `AccountDataProvider`; the ordinary
root still awaits Anisha's Auth composition. No sample or private token is
installed in production. Full application M2 acceptance is still pending.

The existing `AccountSurface` remains the identity/recovery/sign-out consumer;
`ProfileSurface` supplies the Settings header/editor and deliberate API recovery.
Anisha can compose her account actions beside it. There is no second Auth SDK,
storage manager, native policy write or onboarding-completion side effect.

## Components and preview

`ProfileForm` is controlled presentation. Its host supplies `draft`, `dirty`,
`state`, `onDraftChange`, `onDiscard`, optional `onSave` and `onReviewLatest`.
Without an `onSave` callback, Save is disabled. The component never assumes a
resolved callback means persisted success, changes a canonical snapshot, starts
HTTP work or owns an account/session. It renders through the shared Field,
Button and InlineStatus controls using the existing warm recipe.

- Draft intent is `{ kind: 'text', value: rawString }` or `{ kind: 'clear' }`.
  This is a UI event model, **not** a wire DTO. Only explicit confirmed removal
  creates clear intent. Typing blank/whitespace text does not implicitly mean null.
- Values pass through unchanged: no JS trim, Unicode normalization, raw 80-code-unit
  limit or client-owned authoritative validation. The live controller maps approved
  server validation codes to the fixed field-error presentation.
- The host controls dirty/busy for the full operation. Unchanged/missing-handler
  saves are disabled. Saving locks input and mutable actions. Conflict and
  unconfirmed states block Save until the host reconciles actual authoritative data.
- Review/check buttons appear only when a real callback is supplied. The form
  neither fetches latest values nor overwrites the draft. The live consumer fetches authoritative latest data and offers explicit
  Keep my edits / Use latest profile decisions without writing automatically.
- Discard is an explicit callback. Confirmation for removing a name only stages
  clear intent; the host still must save it. Unsaved draft text stays local to the
  host; the form never persists it or attaches it to another account.

`AccountHeader` now accepts optional `displayName`, intended for an actual
validated profile value later. Missing/null keeps RN-05's neutral “Your account”.
Neither email parsing nor a default profile name is used. Existing avatar bounds
and identity behavior remain unchanged.

Run `npm run mobile:ui` and scroll to **Profile editor — UI-only Figma example**.
It supplies Jordan Rivera / jord@gmail.com from Figma and offers local edit,
discard, apply, clear and status-simulation controls. Every simulated update is
labeled as local only; refreshing resets the sample. No browser storage, timers,
Auth producer or private HTTP request is involved. The unique preview marker and
sample data stay outside the app import graph and are checked by export isolation.

The profile card comes from Figma `10562:136` inside Settings `27:157`, with action
recipes `10611:13017` and `10611:13022`. Its existing exact 52×52 avatar was verified
against the fresh source export; no new artwork was needed. There is no established
dedicated display-name editing frame, so this form is an engineering adaptation of
the approved display-name contract and existing controls, not a claim that the
entire Settings design or demographic editors are implemented. Do not add age,
gender, activities, calendar or plan fields under RN-07's minimal contract.

## Live data behavior and handoff

- GET distinguishes a missing row from a row whose display name is null. Revision
  zero is used only to create an absent row; saves always include the canonical
  expected revision and raw text or explicit null. The API owns Python stripping,
  Unicode validation and code-point limits. Success adopts its returned profile.
- Dirty drafts preserve their original base across background reads. Validation
  errors retain raw input. Duplicate saves and offline replay are blocked.
- Conflict and uncertain-write states block another save. A deliberate latest
  GET preserves the draft; **Keep my edits** rebases only after review and still
  requires Save. **Use latest profile** discards the draft. No uncertain result
  displays a saved badge. Discard during ambiguity also requires a latest read.
- Private forms live inside the provider's account/generation-keyed subtree.
  Abort and scope guards suppress stale account work. Navigation removal uses the
  existing dirty guard. Same-account drafts are volatile; no durable/offline
  storage contract, persisted query cache or automatic write queue is added.
- Invalid or wrong-owner profile responses quarantine the previous view and
  disable saving until a verified read succeeds. They do not initiate retry loops.
  Expired/paused account access has an explicit recovery button supplied through
  the existing controller, without creating session-management behavior here.
- The standalone [device QA entry](../../../dev/profile/README.md) exercises this
  same consumer against real API credentials, isolated from production imports.
  Its developer credential port does not establish Auth SDK acceptance.

Remaining: Anisha's real Auth/root/account-actions integration, authenticated
physical-device round trips with current tokens, app/API restart and two-account
journeys, iOS/signed-build/screen-reader checks, and the coordinated
[dedicated-account cascade](../../../../../docs/qa/profile-cascade-acceptance.md).
See the original RN-07 ledger and its implementation notes for actual validation.
The earlier UI-only commit remains historical preparation, not retroactive live
acceptance.

RN-10 confirmation accessibility: opening focuses Keep name; cancel returns to
Remove display name; staging clear focuses the field. Only explicit intents move
focus, and status updates do not. The purpose is announced through the existing
native announcement helper. Compose account headers and the editor under one
scroll owner when wiring Settings; the developer specimen now does this for long
names. Actual keyboard/VoiceOver/TalkBack acceptance remains in
[RN-10 QA](../../../../../docs/qa/mobile-accessibility.md).
