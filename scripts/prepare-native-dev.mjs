import { cp, mkdir, symlink, lstat, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { getConfig } = require('@expo/config');

// Separate Expo host: the archived SwiftUI project must never be prebuilt over.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'apps/mobile');
const destination = join(root, '.native-dev/mobile');
const platform = process.argv[2] ?? 'all';
if (!['ios', 'android', 'all'].includes(platform)) throw new Error('Choose ios, android, or all');
const excluded = new Set(['node_modules', 'dist', '.expo', '.env', '.env.local', '.env.development', '.env.development.local']);
await mkdir(destination, { recursive: true });
for (const name of ['package.json', 'app.config.ts', 'tsconfig.json', 'src', 'assets', 'modules']) {
  await cp(join(source, name), join(destination, name), {
    recursive: true,
    filter: path => !excluded.has(basename(path)),
  });
}
async function link(target, path) {
  try {
    const info = await lstat(path);
    if (!info.isSymbolicLink()) throw new Error(`Expected a symlink at ${path}; inspect it before continuing`);
    return;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await symlink(target, path);
}
await link(join(root, 'node_modules'), join(destination, 'node_modules'));
// Keep public development config local; never include .env in generated source.
for (const name of ['.env', '.env.local', '.env.development', '.env.development.local']) {
  try { await access(join(source, name)); }
  catch { continue; }
  await link(join(source, name), join(destination, name));
}
// Explicit development identities. They cannot replace the released application.
const config = getConfig(source).exp;
delete config._internal;
config.name = 'Hoosh Dev';
config.ios = { ...config.ios, bundleIdentifier: 'com.AnishaDasgupta.DisconnectApp.development' };
config.android = { ...config.android, package: 'ai.hoosh.development' };
await writeFile(join(destination, 'app.config.ts'), 'export default ' + JSON.stringify(config, null, 2) + ';\n');
const result = spawnSync(process.execPath, [join(root, 'node_modules/expo/bin/cli'), 'prebuild', '--no-install', '--platform', platform], {
  cwd: destination, stdio: 'inherit', env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Development host ready in ${destination}. Install native dependencies there, then build. Production signing and legacy extensions are not included.`);
