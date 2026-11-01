# RN-10b — Android UI QA preparation and confirmation polish

Date: 2026-11-01. Owner: Ishmum. Parent: `ab7d855`. Branch:
`task/react-native/rn-10-android-icons`. The original-pack work is RN-10a.

## Observed results

- `npm run check`: passed TypeScript, ESLint, asset integrity, 250 portable tests,
  362 component tests across iOS/Android, Ruff and 3 API tests.
- Web app export: 38 JavaScript/HTML files free of developer markers; all 71
  original SVG assets verified. `--pack` also confirms 61 exact same-node copies.
- Final iOS/Android app Hermes exports: current component sources match source
  maps, with zero project-local developer/test/private API consumer sources.
- Native QA project: own TypeScript check passes; both Expo Go SDK 58 development
  bundles served HTTP 200 with the QA marker. They were not executed on a phone.
- Browser: nine interaction flows passed across local editors and real routes;
  seven confirmation checks passed at 393/320/280 px, 480 px viewport height,
  normal/24 px text, safe initial/return focus and Escape keeping the draft.
  No page errors or private API requests occurred.

An early component run hit a timeout in an unchanged protection test during a
long wall-clock gap; the final full run passed all 362. A new test initially used
an unavailable test-library query; it now uses the modal's stable test ID. Browser
validation exposed inherited off-screen gallery safe-area padding; the modal now
has its own provider. QA Metro initially did not watch new shared files outside
its nested project; the explicit root watch/dependency config fixes live refresh.
Final bundle requests passed after restarting Metro with that configuration.

**Physical Android acceptance remains pending:** `adb devices -l` found no
authorized device. There are no phone screenshots, spoken TalkBack observations,
native font/IME results or measured lifecycle results in this directory. RN10-D01,
D02, D06 and native D05 remain open; D03/D04 require real producers.

The PNGs are browser captures only. `native-results.json` is static app compilation
and exact-source evidence. `qa-bundle-results.json` is Metro compilation/serving.
`device-status.json` explicitly records the missing phone. Do not treat any of
these as signed-device or live account/protection acceptance.

## Reproduce

From the repository root, with the normal installed dependencies:

```sh
npm run check
npm run mobile:ui:build
npm run mobile:export
npm exec --workspace @disconnect/mobile -- expo export --platform ios --platform android --output-dir .expo/rn-10b-native --source-maps
node docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs rn-10b
npx --no-install tsc --noEmit --project apps/mobile/dev/native/tsconfig.json
```

In separate terminals, serve the built web gallery and actual app:

```sh
npm exec --workspace @disconnect/mobile -- vite preview --config dev/vite.config.mts --host 127.0.0.1 --port 8093
python3 -m http.server 8097 --bind 127.0.0.1 --directory apps/mobile/dist
```

Run `check-interactions.mjs` and `check-confirmations.mjs` from this directory with
Node. They require Playwright and Chrome; `PLAYWRIGHT_MODULE` may point to an
existing installation's absolute `index.mjs`. No Playwright dependency/lock change
was added to the app. Run `npm run mobile:qa:android` separately, then run
`check-qa-bundles.mjs` to repeat the compile-only checks.

For actual phone work, follow the [native QA runbook](../../../../apps/mobile/dev/native/README.md),
then append model/OS/build/font settings, exact observed results, fixes and redacted
phone captures to these notes. Test actual app Router Back/tabs separately from
the QA component launcher. Restore any changed system font settings afterward.
