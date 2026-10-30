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

RN-02 supplies the [floating navigation contract](src/components/navigation/README.md) and [original asset provenance](assets/README.md). Navigation uses locally bundled Figma SVGs; the four Dino variants are inventory-only until a real Home consumer is approved. Screen bodies retain truthful feature placeholders. The font dependency provides Space Grotesk; no font binaries are copied into this repository.

Native source is not ignored by Git. Preserve the released iOS project when integrating it; do not generate a replacement identity or discard extension targets.

RN-03 provides the [account-scoped HTTP boundary](src/infrastructure/api/README.md). Compose it with Anisha's real AuthSessionPort during coordinated RN-04/05 integration; this producer is not connected to the placeholder screens yet.

RN-04 provides [account query scopes, guarded mutations and lifecycle adapters](src/infrastructure/query/README.md). Its public-port tests run independently of live Auth. Root composition remains Anisha’s coordinated change; native Expo Network linking/device acceptance is still required.

RN-05 has a prepared [account region](src/features/account/README.md), with an original Settings avatar and verified-identity consumer. It is tested with isolated doubles, not connected to placeholder Settings. Real Auth/API/generated types and guarded root wiring are still required. The developer UI gallery includes a clearly labeled presentation-only account specimen.

RN-07 adds a controlled [profile editor UI](src/features/account/PROFILE_UI.md). Run `npm run mobile:ui` and scroll to “Profile editor — UI-only Figma example” to edit the local Jordan Rivera sample. It resets on reload; Auth/API/profile persistence and live route wiring remain deferred in the original plan and notes.

RN-08 provides [protection status presentation](src/features/protection/README.md) with a bounded read-only consumer. `npm run mobile:ui` includes “Device protection — simulated evidence only”. Real native adapters, foreground/route integration, permission/setup actions and signed-device acceptance remain tracked as RN08-D01–D06.
