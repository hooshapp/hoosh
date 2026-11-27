# Disconnect mobile

Run commands from the repository root; use the single root npm lockfile.

```bash
npm ci
npm run mobile:web
npm run mobile
npm run check
npm run mobile:ui
```

See [the root README](../../README.md) for setup, current limitations, ownership, and native integration requirements. Auth and onboarding routes are placeholders; the preview enters Home without authenticating. Add guards only alongside a real auth/onboarding state model.

Shared fields/buttons/screen states, controlled busy handling, test discovery and the isolated specimen workflow are documented in [the component README](src/components/ui/README.md). Anisha can reuse these primitives; their form controllers still own validation, submission, cancellation and safe error mapping.

RN-02 supplies the [floating navigation contract](src/components/navigation/README.md) and [original asset provenance](assets/README.md). Navigation uses locally bundled Figma SVGs. RN-09a adds a Home presentation consumer, but the actual route has no health/metric producer and selects no Dino artwork. Quests, History and Settings now compose source-aligned presentation with unavailable data; isolated developer examples exercise supported ready states. The font dependency provides Space Grotesk; no font binaries are copied into this repository.

Native source is not ignored by Git. Preserve the released iOS project when integrating it; do not generate a replacement identity or discard extension targets.

RN-03 provides the [account-scoped HTTP boundary](src/infrastructure/api/README.md). Compose it with Anisha's real AuthSessionPort during coordinated RN-04/05 integration; this producer is not connected to the placeholder screens yet.

RN-04 provides [account query scopes, guarded mutations and lifecycle adapters](src/infrastructure/query/README.md). Its public-port tests run independently of live Auth. Root composition remains Anisha’s coordinated change; native Expo Network linking/device acceptance is still required.

RN-05 has a prepared [account region](src/features/account/README.md), with an original Settings avatar and verified-identity consumer. It is tested with isolated doubles, not connected to placeholder Settings. Real Auth/API/generated types and guarded root wiring are still required. The developer UI gallery includes a clearly labeled presentation-only account specimen.

RN-07 adds a controlled [profile editor UI](src/features/account/PROFILE_UI.md). Run `npm run mobile:ui` and scroll to “Profile editor — UI-only Figma example” to edit the local Jordan Rivera sample. It resets on reload; Auth/API/profile persistence and live route wiring remain deferred in the original plan and notes.

RN-08 provides [protection status presentation](src/features/protection/README.md) with a bounded read-only consumer. `npm run mobile:ui` includes “Device protection — simulated evidence only”. Real native adapters, foreground/route integration, permission/setup actions and signed-device acceptance remain tracked as RN08-D01–D06.

RN-09a composes the [Home cards](src/features/home/README.md) in the real Home route with unavailable values and disabled/omitted product actions. `npm run mobile:ui` includes “Home — presentation-only Figma example” for the original sample and state matrix. RN-09b/c/d cover the remaining three tab bodies; RN09-D01–D06 track approved policy, live producers and device acceptance.

RN-09a–h independent main-screen and detail/editor UI is implemented. See [UI coverage](../../docs/qa/rn09-ui-coverage.md) and Plan 04 notes for exact scope, commits, source adaptations and remaining live/device acceptance. Actual saves, account data, native selection/protection and measured outcomes remain unavailable until their producers are integrated.

RN-10a refreshes 61 same-node originals from the Figma icon pack (16 earlier captures
changed); 10 other context originals remain valid. RN-10b adds a separate
[Expo Go UI QA project](dev/native/README.md). Run `npm run mobile:qa:android` from
the repository root and scan its QR to interact with populated shared components
and local drafts on a phone. This is separate from the actual app on port 8081;
its ordinary routes retain unavailable values. RN-10c records physical Pixel 8 Pro / Android 16 checks; see the QA record for
remaining TalkBack and signed-build/platform acceptance.

### Direct Google Calendar on iPhone

Direct connection is enabled by an iOS OAuth client for the signed app's bundle
identifier. In that Google Cloud project, enable the Google Calendar API, add
the Calendar events read-only scope to the consent screen, and enroll any test
accounts while the project is in testing. For the signed build, set
`EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID` to the public iOS client ID and
`HOOSH_GOOGLE_CALENDAR_REDIRECT_SCHEME` to the iOS URL scheme shown beside it in
Google Cloud. The callback uses that scheme with the `/oauth2redirect` path.
Both values identify the client and neither is a client secret.

The setting uses Google's consent screen and reads the primary calendar. For
optional Google Tasks reminders, also enable the Google Tasks API and add
`https://www.googleapis.com/auth/tasks.readonly` to the project's OAuth data
access. Users can choose **Connect Google Tasks** from the connected Google
Calendar row in Settings and authorize read-only access separately.

Hoosh keeps refresh tokens in device-only Keychain storage. The Screen Time
extension reads a small local snapshot of event titles and times and eligible
unfinished task titles. Calendar and task snapshots refresh when Hoosh comes
to the foreground. Without the iOS client configuration, Settings offers the
device-synced Google Calendar.
