/** Explicit owned emulator only; inspect exact R8 artifact using a separate Java test runner. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args, capture = true) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    env: process.env,
    stdio: capture
      ? ['ignore', 'pipe', 'pipe']
      : ['ignore', 'inherit', 'inherit'],
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      'Standalone smoke step failed; inspect local tool/device setup. No data clear or permission change attempted.',
    );
  return result.stdout?.toString() ?? '';
}
try {
  if (
    process.argv.length !== 4 ||
    process.argv[2] !== '--emulator' ||
    !/^emulator-\d+$/.test(process.argv[3])
  )
    throw new Error(
      'Specify an already running owned emulator: --emulator emulator-5556. This command does not install on phones.',
    );
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdk || !process.env.JAVA_HOME)
    throw new Error('Set the existing ANDROID_HOME and JDK17 JAVA_HOME.');
  const android = join(root, 'apps/mobile/android');
  const output = join(android, 'app/build/outputs');
  const apk = join(output, 'standalone/disconnect-standalone.apk');
  const report = JSON.parse(
    readFileSync(join(output, 'standalone/build-report.json'), 'utf8'),
  );
  const mapping = readFileSync(join(output, 'mapping/release/mapping.txt'));
  const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
  if (
    sha(readFileSync(apk)) !== report.apk_sha256 ||
    sha(mapping) !== report.mapping_sha256
  )
    throw new Error(
      'APK/report/R8 mapping do not match. Rebuild the standalone artifact first.',
    );
  const classes = new Map(
    [...mapping.toString().matchAll(/^([^ #][^ ]*) -> ([^:]+):$/gm)].map(
      (match) => [match[1], match[2]],
    ),
  );
  const required = {
    provider: 'expo.modules.ExpoModulesPackageList',
    usage: 'expo.modules.hooshusage.HooshUsageModule',
    definition: 'expo.modules.kotlin.modules.ModuleDefinitionData',
    securestore: 'expo.modules.securestore.SecureStoreModule',
    fonts: 'expo.modules.font.FontLoaderModule',
  };
  const adb = join(sdk, 'platform-tools/adb'),
    target = ['-s', process.argv[3]];
  if (run(adb, [...target, 'get-state']).trim() !== 'device')
    throw new Error('The explicit owned emulator is unavailable.');
  if (run(adb, [...target, 'reverse', '--list']).trim())
    throw new Error(
      'Remove this owned emulator’s reverse mappings before the no-Metro check.',
    );
  run(
    join(android, 'gradlew'),
    [
      '-p',
      android,
      ':app:assembleDebugAndroidTest',
      '-PhooshStandaloneSmoke=true',
      '-PreactNativeArchitectures=arm64-v8a',
      '--max-workers=4',
      '--console=plain',
    ],
    false,
  );
  run(adb, [...target, 'install', '-r', apk]);
  run(adb, [
    ...target,
    'install',
    '-r',
    join(output, 'apk/androidTest/debug/app-debug-androidTest.apk'),
  ]);
  const args = [...target, 'shell', 'am', 'instrument', '-w'];
  for (const [key, name] of Object.entries(required)) {
    const renamed = classes.get(name);
    if (!renamed)
      throw new Error(
        'Required native class absent from the exact R8 mapping.',
      );
    args.push('-e', key, renamed);
  }
  args.push(
    'com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.StandaloneSmokeInstrumentation',
  );
  const result = run(adb, args);
  if (
    !result.includes('standaloneChecksPassed=6') ||
    !result.includes('INSTRUMENTATION_CODE: -1')
  )
    throw new Error(
      `Standalone native checks did not pass${/standaloneFailedCase=(\d+)/.exec(result)?.[1] ? '; case ' + /standaloneFailedCase=(\d+)/.exec(result)[1] : ''}.`,
    );
  console.log(
    'Six standalone native checks passed on the explicit emulator. Account/UI/offline journeys remain separate.',
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Standalone smoke stopped.',
  );
  process.exitCode = 1;
}
