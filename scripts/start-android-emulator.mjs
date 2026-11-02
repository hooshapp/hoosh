import { spawn } from 'node:child_process';
import { existsSync, openSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sdk = join(root, '.native-dev/toolchains/android/sdk');
const avds = join(root, '.native-dev/toolchains/android/avd');
const executable = join(sdk, 'emulator/emulator');
if (!existsSync(executable) || !existsSync(join(avds, 'Hoosh_API37.ini'))) {
  throw new Error('Local Android emulator or Hoosh_API37 device is missing. Follow docs/runbooks/native-development-builds.md.');
}
const log = openSync('/private/tmp/hoosh-emulator.log', 'a');
const child = spawn(executable, ['-avd', 'Hoosh_API37', '-no-snapshot', '-no-boot-anim'], {
  env: { ...process.env, ANDROID_HOME: sdk, ANDROID_AVD_HOME: avds },
  detached: true, stdio: ['ignore', log, log],
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.unref();
console.log('Starting Hoosh_API37. Local emulator log: /private/tmp/hoosh-emulator.log');
