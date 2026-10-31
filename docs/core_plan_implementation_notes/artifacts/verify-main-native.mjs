import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const part = process.argv[2];
if (!['rn-09b', 'rn-09c', 'rn-09d', 'rn-09h'].includes(part)) throw new Error('Choose rn-09b/c/d/h.');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, `apps/mobile/.expo/${part}-native`);
const { runtime } = await import(`./${part}/browser-config.mjs`);
const files = [
  'src/components/ui/button-surface.tsx',
  'src/components/ui/design-artwork.tsx',
  ...runtime,
].map((file) => `apps/mobile/${file}`);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const meta = JSON.parse(fs.readFileSync(path.join(output, 'metadata.json'), 'utf8'));
const report = {
  part,
  node: process.version,
  signedDeviceAcceptance: false,
  liveIntegration: false,
  runtimeSourceSha256: Object.fromEntries(
    files.map((file) => [file, digest(fs.readFileSync(path.join(root, file)))]),
  ),
  bundles: {},
};
for (const platform of ['ios', 'android']) {
  const bundle = path.join(output, meta.fileMetadata[platform].bundle);
  const map = JSON.parse(fs.readFileSync(`${bundle}.map`, 'utf8'));
  for (const file of files) {
    const indices = map.sources.flatMap((name, i) => (name.endsWith(`/${file}`) ? [i] : []));
    assert.equal(indices.length, 1, `Missing ${file}`);
    assert.equal(
      map.sourcesContent[indices[0]],
      fs.readFileSync(path.join(root, file), 'utf8'),
      `Stale ${file}`,
    );
  }
  assert(
    !map.sources.some((name) =>
      /\.test\.|\/__tests__\/|\/dev\/ui\/|\/infrastructure\/api\/|\/account-surface\./.test(name),
    ),
  );
  const bytes = fs.readFileSync(bundle);
  report.bundles[platform] = {
    bytes: bytes.length,
    sha256: digest(bytes),
    sourceMapEntries: map.sources.length,
    fixtureOrPrivateApiSources: 0,
    executedOnDevice: false,
  };
}
fs.writeFileSync(
  new URL(`./${part}/native-results.json`, import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(`${part}: final native application sources match; no fixtures/private API consumers.`);
