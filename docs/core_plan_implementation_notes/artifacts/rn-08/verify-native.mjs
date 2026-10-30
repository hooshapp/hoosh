import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const bundleRoot = process.argv[2] ?? '/tmp/hoosh-rn08-ui';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
function entries(map) {
  return [
    ...(map.sources ?? []).map((source, index) => [source, map.sourcesContent?.[index]]),
    ...(map.sections ?? []).flatMap((section) => entries(section.map)),
  ];
}
const runtime = ['status-model.ts', 'protection-status.tsx', 'use-protection-status.ts'].map(
  (name) => `apps/mobile/src/features/protection/${name}`,
);
const report = {
  part: 'RN-08 presentation/read-consumer preparation',
  parentCommit: '5790302',
  node: process.version,
  liveNativeAcceptance: false,
  runtimeSourceSha256: Object.fromEntries(
    runtime.map((file) => [file, digest(fs.readFileSync(path.join(root, file)))]),
  ),
  bundles: {},
};
for (const platform of ['ios', 'android']) {
  const bytes = fs.readFileSync(path.join(bundleRoot, `${platform}.js`));
  const sources = entries(
    JSON.parse(fs.readFileSync(path.join(bundleRoot, `${platform}.map`), 'utf8')),
  );
  for (const file of runtime) {
    const found = sources.filter(([source]) => source.endsWith(`/${file}`));
    assert.equal(found.length, 1, `${platform}: missing ${file}`);
    assert.equal(
      found[0][1],
      fs.readFileSync(path.join(root, file), 'utf8'),
      `${platform}: stale ${file}`,
    );
  }
  assert(!sources.some(([source]) => /\.test\.|\/__tests__\//.test(source)));
  assert(
    !sources.some(
      ([source]) =>
        source.includes('/infrastructure/api/') ||
        source.includes('/infrastructure/query/') ||
        source.includes('/features/account/'),
    ),
  );
  for (const marker of [
    'RN08_PROTECTION_SPECIMEN_ONLY',
    'RN08_TEST_DEVICE_ONLY',
    'RN08_PREVIEW_REASON_ONLY',
    'RAW_NATIVE_SECRET',
  ])
    assert(!bytes.includes(marker), `${platform}: leaked ${marker}`);
  report.bundles[platform] = {
    bytes: bytes.length,
    sha256: digest(bytes),
    sourceMapEntries: sources.length,
    testFixtureSources: 0,
    privateApiOrAccountSources: 0,
    executedOnDevice: false,
  };
}
fs.writeFileSync(
  new URL('native-results.json', import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  'Both native producer graphs match final sources and exclude example/test/account/API imports.',
);
