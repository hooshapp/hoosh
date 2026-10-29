import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const assetsRoot = fileURLToPath(new URL('../apps/mobile/assets/', import.meta.url));
const manifest = JSON.parse(await readFile(join(assetsRoot, 'manifest.json'), 'utf8'));
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0)
  throw new Error('The design asset manifest must contain the original asset inventory.');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const navigationHashes = new Set();
for (const asset of manifest.assets) {
  const bytes = await readFile(join(assetsRoot, asset.file));
  if (!bytes.length || bytes.length !== asset.sizeBytes || digest(bytes) !== asset.sha256)
    throw new Error(`Original Figma bytes changed: ${asset.file}`);
  const root = bytes.toString('utf8').match(/<svg\b[^>]*>/)?.[0];
  for (const key of ['width', 'height', 'viewBox']) {
    if (!root?.includes(`${key}="${asset[key]}"`))
      throw new Error(`Original SVG bounds changed: ${asset.file} (${key})`);
  }
  if (asset.usage === 'navigation') navigationHashes.add(asset.sha256);
}

async function svgFiles(directory) {
  const groups = await Promise.all(
    (await readdir(directory, { withFileTypes: true })).map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? svgFiles(path) : path.endsWith('.svg') ? [path] : [];
    }),
  );
  return groups.flat();
}

if (process.argv.includes('--export')) {
  const exportRoot = fileURLToPath(new URL('../apps/mobile/dist/', import.meta.url));
  for (const path of await svgFiles(exportRoot))
    navigationHashes.delete(digest(await readFile(path)));
  if (navigationHashes.size)
    throw new Error(
      `${navigationHashes.size} original navigation assets are absent from the app export.`,
    );
}
console.log(
  `Design assets passed: ${manifest.assets.length} original local SVGs${process.argv.includes('--export') ? ', including all navigation assets in the app export' : ''}.`,
);
