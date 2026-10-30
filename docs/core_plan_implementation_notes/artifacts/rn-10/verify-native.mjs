import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const appRoot = path.join(root, 'apps/mobile/.expo/rn10-native');
const consumerRoot = process.argv[2] ?? '/tmp/hoosh-rn10-consumers';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const groups = {
  application: [
    'src/app/(tabs)/_layout.tsx',
    'src/components/navigation/main-tab-bar.tsx',
    'src/components/navigation/main-tab-panel.tsx',
    'src/components/ui/inline-status.tsx',
    'src/components/ui/use-announcement.ts',
    'src/design/tokens.ts',
    'src/features/home/home-overview.tsx',
    'src/features/home/home-recommendation.tsx',
  ],
  preparedConsumers: [
    'src/features/account/profile-form.tsx',
    'src/components/ui/focus-control.ts',
    'src/components/ui/inline-status.tsx',
    'src/components/ui/use-announcement.ts',
    'src/features/protection/protection-status.tsx',
    'src/infrastructure/query/lifecycle.ts',
    'src/infrastructure/query/platform-lifecycle.native.ts',
    'src/design/tokens.ts',
  ],
};
for (const key of Object.keys(groups))
  groups[key] = groups[key].map((file) => `apps/mobile/${file}`);
const runtime = [...new Set(Object.values(groups).flat())];
const metadata = JSON.parse(fs.readFileSync(path.join(appRoot, 'metadata.json'), 'utf8'));
function entries(map) {
  return [
    ...(map.sources ?? []).map((name, i) => [name, map.sourcesContent?.[i]]),
    ...(map.sections ?? []).flatMap((section) => entries(section.map)),
  ];
}
const report = {
  part: 'RN-10 shared UI and lifecycle hardening',
  parentCommit: 'ff75039',
  node: process.version,
  liveAuthProfileAcceptance: false,
  nativeAssistiveTechnologyTested: false,
  signedDeviceAcceptance: false,
  runtimeSourceSha256: Object.fromEntries(
    runtime.map((file) => [file, digest(fs.readFileSync(path.join(root, file)))]),
  ),
  exports: {},
};
for (const group of Object.keys(groups)) {
  report.exports[group] = {};
  for (const platform of ['ios', 'android']) {
    const file =
      group === 'application'
        ? path.join(appRoot, metadata.fileMetadata[platform].bundle)
        : path.join(consumerRoot, `${platform}.js`);
    const mapFile =
      group === 'application' ? `${file}.map` : path.join(consumerRoot, `${platform}.map`);
    const sources = entries(JSON.parse(fs.readFileSync(mapFile, 'utf8')));
    for (const source of groups[group]) {
      const found = sources.filter(([name]) => name.endsWith(`/${source}`));
      assert.equal(found.length, 1, `${group}/${platform}: missing ${source}`);
      assert.equal(
        found[0][1],
        fs.readFileSync(path.join(root, source), 'utf8'),
        `${group}/${platform}: stale ${source}`,
      );
    }
    assert(!sources.some(([name]) => /\.test\.|\/__tests__\/|\/dev\/ui\//.test(name)));
    assert(
      !sources.some(([name]) =>
        /\/infrastructure\/api\/|\/features\/account\/(api|account-surface|identity-query)\./.test(
          name,
        ),
      ),
    );
    const bytes = fs.readFileSync(file);
    report.exports[group][platform] = {
      bytes: bytes.length,
      sha256: digest(bytes),
      sourceMapEntries: sources.length,
      finalRuntimeSourcesVerified: groups[group].length,
      fixtureSources: 0,
      privateApiConsumerSources: 0,
      executedOnDevice: false,
    };
  }
}
fs.writeFileSync(
  new URL('native-results.json', import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  'All four native exports match final application/consumer sources; no fixtures or live-device acceptance.',
);
