// Run after the direct producer exports described in the RN-04 implementation notes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const bundleRoot = process.argv[2] ?? '/tmp/hoosh-rn04-client';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
function sources(map) {
  return [...(map.sources ?? []), ...(map.sections ?? []).flatMap((section) => sources(section.map))];
}
const runtimeFiles = fs.readdirSync(path.join(root, 'apps/mobile/src/infrastructure/query'))
  .filter((name) => /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name))
  .map((name) => `apps/mobile/src/infrastructure/query/${name}`);
const results = { plan: 'RN-04', parentCommit: '0741758', node: process.version,
  runtimeSourceSha256: Object.fromEntries(runtimeFiles.map((file) => [file, sha256(fs.readFileSync(path.join(root, file)))])),
  bundles: {}, limitations: ['Static JS compilation only; no installed/signed device execution.',
    'App root does not compose this producer yet; real Auth/API integration remains pending.'] };
for (const platform of ['ios', 'android']) {
  const bytes = fs.readFileSync(path.join(bundleRoot, `${platform}.js`));
  const entries = sources(JSON.parse(fs.readFileSync(path.join(bundleRoot, `${platform}.map`), 'utf8')));
  const required = ['account-controller.ts', 'account-data-provider.tsx', 'query-lifecycle-boundary.tsx',
    'platform-lifecycle.native.ts', 'transport.native.ts', '/node_modules/expo-network/', '/node_modules/@tanstack/'];
  for (const fragment of required) assert(entries.some((file) => file.includes(fragment)), `${platform}: missing ${fragment}`);
  const fixtures = entries.filter((file) => /\.test\.|\/__tests__\//.test(file));
  assert.equal(fixtures.length, 0);
  for (const marker of ['RN03_TEST_ONLY_AUTH', 'DO_NOT_EXPOSE_RAW_SERVER_COPY', 'A private draft'])
    assert(!bytes.includes(marker), `${platform}: leaked ${marker}`);
  results.bundles[platform] = { bytes: bytes.length, sha256: sha256(bytes), sourceMapEntries: entries.length,
    selectedSources: entries.filter((file) => file.includes('/infrastructure/query/') || file.includes('/expo-network/build/')),
    testOrFixtureSources: fixtures.length, executedOnDevice: false };
}
const artifact = new URL('bundle-results.json', import.meta.url);
fs.writeFileSync(artifact, `${JSON.stringify(results, null, 2)}\n`);
console.log('RN-04 direct native source graph and fixture isolation passed for iOS and Android.');
