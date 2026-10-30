import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const exportRoot = path.resolve(root, process.argv[2] ?? 'apps/mobile/.expo/rn09-native');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const runtime = [
  'src/app/(tabs)/index.tsx',
  'src/design/home-assets.ts',
  'src/components/ui/screen.tsx',
  'src/components/ui/button-surface.tsx',
  ...[
    'home-artwork.tsx',
    'home-model.ts',
    'home-overview.tsx',
    'home-recommendation.tsx',
    'home-screen.tsx',
  ].map((name) => `src/features/home/${name}`),
].map((file) => `apps/mobile/${file}`);
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/mobile/assets/manifest.json'), 'utf8'),
);
const expectedAssets = manifest.assets.filter((asset) =>
  ['navigation', 'home-presentation'].includes(asset.usage),
);
const metadata = JSON.parse(fs.readFileSync(path.join(exportRoot, 'metadata.json'), 'utf8'));
const report = {
  part: 'RN-09a Home presentation',
  parentCommit: '71da2d5',
  node: process.version,
  fullExpoRouterApplication: true,
  liveDataAcceptance: false,
  signedDeviceAcceptance: false,
  runtimeSourceSha256: Object.fromEntries(
    runtime.map((file) => [file, digest(fs.readFileSync(path.join(root, file)))]),
  ),
  bundles: {},
};
for (const platform of ['ios', 'android']) {
  const bundle = metadata.fileMetadata[platform];
  const bytes = fs.readFileSync(path.join(exportRoot, bundle.bundle));
  const map = JSON.parse(fs.readFileSync(path.join(exportRoot, `${bundle.bundle}.map`), 'utf8'));
  for (const file of runtime) {
    const indices = map.sources.flatMap((source, index) =>
      source.endsWith(`/${file}`) ? [index] : [],
    );
    assert.equal(indices.length, 1, `${platform}: missing ${file}`);
    assert.equal(
      map.sourcesContent[indices[0]],
      fs.readFileSync(path.join(root, file), 'utf8'),
      `${platform}: stale ${file}`,
    );
  }
  assert(!map.sources.some((source) => /\.test\.|\/__tests__\/|\/dev\/ui\//.test(source)));
  assert(
    !map.sources.some((source) =>
      ['/infrastructure/api/', '/infrastructure/query/', '/features/account/'].some((part) =>
        source.includes(part),
      ),
    ),
  );
  const contents = map.sourcesContent.join('\n');
  for (const marker of [
    'RN09_HOME_SPECIMEN_ONLY',
    'RN09_HOME_TEST_ONLY',
    'RN09_FIGMA_RECOMMENDATION_ONLY',
    'RN09_LONG_RECOMMENDATION_ONLY',
  ])
    assert(!contents.includes(marker));
  const hashes = new Set(
    bundle.assets.map((asset) => digest(fs.readFileSync(path.join(exportRoot, asset.path)))),
  );
  for (const asset of expectedAssets)
    assert(hashes.has(asset.sha256), `${platform}: missing original ${asset.file}`);
  report.bundles[platform] = {
    bytes: bytes.length,
    sha256: digest(bytes),
    sourceMapEntries: map.sources.length,
    verifiedNavigationAndHomeAssets: expectedAssets.length,
    exampleOrTestSources: 0,
    privateApiOrAccountSources: 0,
    executedOnDevice: false,
  };
}
fs.writeFileSync(
  new URL('native-results.json', import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  'Both full Router/Hermes exports match final Home sources, retain original assets and exclude fixtures/private producers. Not signed/device acceptance.',
);
