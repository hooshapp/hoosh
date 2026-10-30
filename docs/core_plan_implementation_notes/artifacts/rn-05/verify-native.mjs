import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const bundleRoot = process.argv[2] ?? '/tmp/hoosh-rn05-client';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const assetHash = digest(
  fs.readFileSync(path.join(root, 'apps/mobile/assets/account/settings-avatar.svg')),
);
function entries(map) {
  return [
    ...(map.sources ?? []).map((source, index) => [source, map.sourcesContent?.[index]]),
    ...(map.sections ?? []).flatMap((section) => entries(section.map)),
  ];
}
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
const runtime = fs
  .readdirSync(path.join(root, 'apps/mobile/src/features/account'))
  .filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes('.test.'))
  .map((name) => `apps/mobile/src/features/account/${name}`);
const report = {
  part: 'RN-05 consumer preparation',
  parentCommit: '610f570',
  node: process.version,
  liveAcceptance: false,
  assetSha256: assetHash,
  runtimeSourceSha256: Object.fromEntries(
    runtime.map((file) => [file, digest(fs.readFileSync(path.join(root, file)))]),
  ),
  bundles: {},
};
for (const platform of ['ios', 'android']) {
  const bundle = fs.readFileSync(path.join(bundleRoot, `${platform}.js`));
  const sources = entries(
    JSON.parse(fs.readFileSync(path.join(bundleRoot, `${platform}.map`), 'utf8')),
  );
  for (const file of runtime) {
    const found = sources.filter(([source]) => source.endsWith(`/${file}`));
    assert.equal(found.length, 1, `${platform}: ${file}`);
    assert.equal(
      found[0][1],
      fs.readFileSync(path.join(root, file), 'utf8'),
      `${platform}: stale ${file}`,
    );
  }
  assert(sources.some(([source]) => source.endsWith('/infrastructure/api/transport.native.ts')));
  assert(!sources.some(([source]) => /\.test\.|\/__tests__\//.test(source)));
  for (const marker of [
    'RN05_ACCOUNT_SPECIMEN_ONLY',
    'fixture@example.test',
    'RN03_TEST_ONLY_AUTH',
    'RAW_SDK_SECRET',
  ])
    assert(!bundle.includes(marker), `${platform}: leaked ${marker}`);
  const copied = files(path.join(bundleRoot, `${platform}-assets`)).filter(
    (file) => digest(fs.readFileSync(file)) === assetHash,
  );
  assert.equal(copied.length, 1, `${platform}: original avatar missing/duplicated`);
  report.bundles[platform] = {
    bytes: bundle.length,
    sha256: digest(bundle),
    sourceMapEntries: sources.length,
    originalAvatarBytesPresent: true,
    testFixtureSources: 0,
    executedOnDevice: false,
  };
}
fs.writeFileSync(
  new URL('native-results.json', import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  'Both direct native consumers match current sources, include the original avatar, and exclude test fixtures.',
);
