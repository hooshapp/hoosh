# RN-05 account consumer preparation

**Status: prepared, not live RN-05 acceptance.** No real Auth producer/guard,
protected API identity endpoint or API-05 generated types exist in this checkout.
The current Settings route and development navigation links are unchanged. This
module does not make public Settings an authenticated screen or install a fixture
session. RN-05 stays incomplete until the real round trip is exercised.

## Integration handoff

Anisha supplies one actual AuthSessionPort and the AUTH-07 account-actions port.
In the coordinated composition module create a stable API client and account data
controller for that Auth producer/environment, as documented in the
[query boundary](../../infrastructure/query/README.md). Inside its private keyed
tree, the future Settings route can mount:

```tsx
<AccountSurface controller={accountData} actions={authAccountActions} />
```

The controller **must be the same instance used by AccountDataProvider**. Put only
the account region here; temporary API failure does not remove tab navigation,
other Settings sections, or native protection. The parent supplies ordinary Screen,
route guards and appropriate startup/signed-out fallback; no component implements
Supabase storage, token refresh, sign-out or routing. AUTH-07 must advance the
public generation/invalidate private work at sign-out intent, before I/O.

`actions` is optional until the real action producer exists; without it there is
no sign-out control. Its placement is a functional addition absent from Figma and
requires PM/design review before live integration. Local sign-out delegates once,
disables repeat taps, ignores late results after unmount/ownership changes, and
uses safe fixed failure copy. It never erases native restrictions or invents
successful credential removal; Auth owns successful navigation/storage recovery.

## Identity trust and presentation

- `readIdentity` calls only authenticated `/v1/me`, forwarding the account/query
  AbortSignal into RN-03 and using its strict same-subject runtime decoder.
  `/healthz` or the SDK's email cannot populate this view.
- The current return type is the existing canonical **AuthIdentity projection**,
  not a new handwritten wire DTO or replacement generator. API-05 must bind the
  read to the actual generated schema when that producer lands. Runtime subject
  validation remains necessary after generated types are available.
- `useIdentityQuery` shares `['account', UUID, 'identity']`. Invalid/protocol/mismatch
  errors immediately suppress old identity presentation and remove that cached
  identity result without automatic reset/refetch loops. Explicit Retry can rebuild
  it. Other same-user transient failures retain data with an honest stale notice.
- A successful response renders its actual email; null uses “Signed-in account”.
  “Your account” is a neutral heading, never a guessed name from an email or the
  design's example person. No UUID, tokens, raw error, user score or protection
  status is displayed. Email is selectable text and can wrap at narrow/large sizes.
- Startup/first load, refresh, offline, failed read, unavailable Auth/API and paused
  account recovery are distinct. Offline initial reads wait for reconnect. HTTP owns
  bounded 401 recovery; only a deliberate “Verify account access” press delegates
  to the controller's one identity verification probe. Focus/render never calls it.
- Account action hooks remain independent of protected server mutations so a paused
  or unavailable API does not block local sign-out. Their same-turn guard and
  mounted/scope checks prevent duplicate actions and stale busy/error updates.

## Design and validation boundaries

Figma `27:157`, profile card `10562:136`, text `10562:139–142`, artwork `10562:244`
were inspected read-only with high-fidelity contexts and renders. AccountHeader
preserves 20 px padding, 16 px gap, 64 px avatar/52 px original image, 20 px bold
heading with -0.4 tracking, 13 px medium email and 44 px minimum email row. It
reuses packaged fonts/colors, expo-image, RN-01 status/buttons and RN-04 ownership.
The original example name/email are intentionally replaced by truthful account
content. Status/retry and opt-in sign-out controls are engineering additions.

The isolated UI specimen renders synthetic **presentation props only**, outside
Router and without an Auth provider/API. It is not a real account or bypass. The
release isolation guard rejects its unique marker. Browser artifacts verify source
image decoding and effective bounds at 393/320/280 px, long email wrapping and
image-load failure; they do not prove VoiceOver, TalkBack or native SVG rendering.
See the persistent [RN-05 preparation notes](../../../../../docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md#rn-05-preparation--identity-consumer-and-account-region).

Before RN-05 can be marked complete:

1. Finish SB-03 and actual AUTH-01/02/03/07 producers, root guards and RN-04 wiring.
2. Implement API-04 `/v1/me` and API-05 generated schemas; bind this read to them.
3. Integrate this region into real Settings, removing development Auth/onboarding
   links together with the guard change. Review sign-out placement with PM/design.
4. Exercise disposable development sign-in, matching identity, null email, missing/
   invalid token, wrong API project, offline/503, account changes and sign-out during
   a request. Record safe web/native evidence; never store credentials in artifacts.
5. Execute native builds/device and Auth link/storage tests separately; a compiled
   bundle and deterministic Auth doubles do not satisfy live M1 acceptance.

RN-07 now supplies [controlled profile presentation](PROFILE_UI.md) independently. AccountHeader accepts an optional supplied validated display name; absent/null remains neutral. The sample name lives only in the isolated developer UI, and actual profile API/query/controller integration remains deferred.
