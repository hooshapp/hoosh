import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const report = { project: 'Disconnect UI QA', physicalDevice: false, platforms: {} };
for (const platform of ['android', 'ios']) {
  const response = await fetch('http://127.0.0.1:8090', {
    headers: { 'expo-platform': platform, accept: 'application/expo+json' },
  });
  assert.equal(response.status, 200);
  const manifest = await response.json();
  assert.equal(manifest.extra.expoClient.name, report.project);
  const bundle = await fetch(manifest.launchAsset.url);
  assert.equal(bundle.status, 200);
  const bytes = Buffer.from(await bundle.arrayBuffer());
  assert(bytes.includes(Buffer.from('RN10_NATIVE_QA_ONLY')));
  report.platforms[platform] = {
    runtimeVersion: manifest.runtimeVersion,
    bundleStatus: bundle.status,
    bundleBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sourceExamplesIncludedOnlyHere: true,
    executedOnDevice: false,
  };
}
await writeFile(
  new URL('./qa-bundle-results.json', import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log('Both native QA bundles served successfully. No device execution is implied.');
