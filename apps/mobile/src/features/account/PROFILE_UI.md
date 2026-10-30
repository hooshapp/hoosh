# RN-07 profile UI preparation

**UI only.** Ishmum explicitly requested this split so frontend work can continue
without Auth/backend integration. RN-07's real M2 completion remains pending.
The current Settings/root routes are unchanged. No sample profile is installed in
production, and no GET/PATCH, database, storage or Auth service is created here.

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
  limit or client-owned authoritative validation. A future controller maps approved
  server validation codes to the fixed field-error presentation.
- The host controls dirty/busy for the full operation. Unchanged/missing-handler
  saves are disabled. Saving locks input and mutable actions. Conflict and
  unconfirmed states block Save until the host reconciles actual authoritative data.
- Review/check buttons appear only when a real callback is supplied. The form
  neither fetches latest values nor overwrites the draft. Actual conflict and
  uncertain-save resolution is deferred, despite the prepared presentation.
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

## Deferred integration checklist

The original [RN-07 plan](../../../../../docs/core_plan/04_react_native_integration.md#rn-07--minimal-profile-readupdate-integration)
and [implementation notes](../../../../../docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-07-ui-preparation--controlled-display-name-editor)
track the same remaining work:

1. API-05 generated schemas and API-06–09 profile persistence: actual authenticated
   GET/PATCH, absent profile vs null name, expected revisions and no direct mobile CRUD.
2. Canonical snapshot/revision separate from raw/clear draft, real create/update,
   server-returned normalized values, strict field ownership and server validation.
3. Real 409 latest-profile review and deliberate resolution; no blind overwrite,
   automatic revision substitution or retry. The current review button is only a hook.
4. Real uncertain-save reconciliation via authoritative GET before a deliberate
   new write; no offline queue or automatic mutation replay.
5. RN-04/05 ownership/generation guards, cancellation and keyed form lifetime;
   real Settings/detail routes, dirty-navigation handling and Auth integration.
6. Any durable/offline draft behavior only after its shared storage/ownership
   contract exists. No localStorage, AsyncStorage or persisted query cache now.
7. Actual restart/reload persistence, two-account race/authorization/conflict tests,
   web/native M2 acceptance, keyboard and physical-device assistive testing.

UI tests and preview simulations prove none of these server/Auth/device outcomes.
Another agent should implement these items in later RN-07 integration commits,
preserving this UI-only history rather than marking it complete retroactively.

RN-10 confirmation accessibility: opening focuses Keep name; cancel returns to
Remove display name; staging clear focuses the field. Only explicit intents move
focus, and status updates do not. The purpose is announced through the existing
native announcement helper. Compose account headers and the editor under one
scroll owner when wiring Settings; the developer specimen now does this for long
names. Actual keyboard/VoiceOver/TalkBack acceptance remains in
[RN-10 QA](../../../../../docs/qa/mobile-accessibility.md).
