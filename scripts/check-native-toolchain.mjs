import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platform = process.argv[2] ?? 'all';
if (!['ios', 'android', 'all'].includes(platform)) throw new Error('Choose ios, android, or all');
let ready = true;
function report(ok, message) {
  console.log(`${ok ? 'PASS' : 'NEEDS SETUP'}: ${message}`);
  ready &&= ok;
}
if (platform !== 'android') {
  const result = spawnSync('xcodebuild', ['-version'], { encoding: 'utf8' });
  const match = result.stdout?.match(/Xcode (\d+)\.(\d+)/);
  const supported = result.status === 0 && match && (Number(match[1]) > 26 || (Number(match[1]) === 26 && Number(match[2]) >= 4));
  report(Boolean(supported), `Expo SDK 58 needs Xcode 26.4+; detected ${match?.[0] ?? 'no usable Xcode'}. DEVELOPER_DIR may select a separate installation.`);
}
if (platform !== 'ios') {
  const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? join(root, '.native-dev/toolchains/android/sdk');
  const platforms = join(sdk, 'platforms');
  const installed = existsSync(platforms) ? readdirSync(platforms) : [];
  report(installed.some(name => /^android-37(?:\.0)?$/.test(name)), 'Android SDK platform 37 / 37.0 required.');
  report(existsSync(join(sdk, 'build-tools/37.0.0/aapt2')), 'Android build tools 37.0.0 required.');
  report(existsSync(join(sdk, 'ndk/27.1.12297006/source.properties')), 'Android NDK 27.1.12297006 required.');
  report(existsSync(join(sdk, 'platform-tools/adb')), 'Android platform tools required.');
}
process.exitCode = ready ? 0 : 1;
