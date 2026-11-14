/** Build the real release app; sign only a separate INTERNAL copy with the local debug key. */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mobile = join(root, 'apps/mobile');
const publicNames = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
];
const PACKAGE = 'com.hoosh.disconnect.dev';
function stop(message) {
  throw new Error(message);
}
export function validatePublicConfig(values) {
  const result = Object.fromEntries(
    publicNames.map((key) => [key, values[key] ?? '']),
  );
  const origin = (value) => {
    if (!value || /[\s\u0000-\u001f\u007f]/.test(value))
      stop('Invalid public configuration; use plain origins.');
    let url;
    try {
      url = new URL(value);
    } catch {
      stop('Invalid public configuration; use plain origins.');
    }
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      stop('Invalid public configuration; use plain origins.');
    return url;
  };
  const api = origin(result.EXPO_PUBLIC_API_BASE_URL);
  if (
    api.protocol !== 'https:' &&
    !(
      api.protocol === 'http:' &&
      ['127.0.0.1', 'localhost'].includes(api.hostname)
    )
  )
    stop(
      'Use HTTPS for the API, or explicit loopback HTTP for internal development.',
    );
  const auth = origin(result.EXPO_PUBLIC_SUPABASE_URL);
  if (
    auth.protocol !== 'https:' ||
    !/^[a-z0-9_-]{1,64}\.supabase\.co$/.test(auth.hostname)
  )
    stop('Use the existing hosted development Supabase HTTPS origin.');
  const key = result.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key || /\s/.test(key))
    stop('Configure only the public publishable or legacy anon key.');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    try {
      const parts = key.split('.');
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (
        parts.length !== 3 ||
        claims.role !== 'anon' ||
        claims.iss !== 'supabase'
      )
        throw new Error();
    } catch {
      stop('Configure only the public publishable or legacy anon key.');
    }
  }
  return result;
}
export function buildEnvironment(parent, config) {
  const env = Object.fromEntries(
    Object.entries(parent).filter(([key]) => !key.startsWith('EXPO_PUBLIC_')),
  );
  return {
    ...env,
    ...validatePublicConfig(config),
    NODE_ENV: 'production',
    EXPO_NO_DOTENV: '1',
    EXPO_NO_TELEMETRY: '1',
  };
}
function run(command, args, env, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    shell: false,
    stdio: capture
      ? ['ignore', 'pipe', 'pipe']
      : ['ignore', 'inherit', 'inherit'],
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    stop(
      `Standalone step failed: ${basename(command)}. Inspect the local build log; no APK accepted.`,
    );
  return result.stdout;
}
function buildTools(sdk) {
  const directories = readdirSync(join(sdk, 'build-tools')).filter((value) =>
    /^\d+\.\d+\.\d+$/.test(value),
  );
  directories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const dir = directories.at(-1);
  if (!dir) stop('Install the configured Android SDK build tools.');
  return join(sdk, 'build-tools', dir);
}
export function inspectApk(apk, tools, env) {
  run(join(tools, 'apksigner'), ['verify', '--verbose', apk], env, true);
  run(join(tools, 'zipalign'), ['-c', '-P', '16', '4', apk], env, true);
  const badging = run(
    join(tools, 'aapt2'),
    ['dump', 'badging', apk],
    env,
    true,
  ).toString();
  if (
    !badging.includes(`package: name='${PACKAGE}'`) ||
    badging.includes('application-debuggable')
  )
    stop('Unexpected package or debuggable standalone app.');
  const files = run('/usr/bin/unzip', ['-Z1', apk], env, true)
    .toString()
    .split('\n');
  if (
    !files.includes('assets/index.android.bundle') ||
    !files.some((name) => /lib\/arm64-v8a\/libhermes.*\.so$/.test(name)) ||
    !files.some((name) => /\.(?:ttf|otf)$/.test(name))
  )
    stop(
      'Standalone APK is missing embedded JavaScript, Hermes or font assets.',
    );
  const bundle = run(
    '/usr/bin/unzip',
    ['-p', apk, 'assets/index.android.bundle'],
    env,
    true,
  );
  // Hermes bytecode magic, little endian. A textual Metro loader is not an embedded release.
  if (
    bundle.length < 1000 ||
    bundle.subarray(0, 8).toString('hex') !== 'c61fbc03c103191f'
  )
    stop('Embedded Hermes bytecode was not found.');
  const forbidden = [
    'RN10_NATIVE_QA_ONLY',
    'RN07_DEVICE_QA_ONLY',
    'RN09_APP_JOURNEY_QA_ONLY',
    'RN09B_DEVICE_QA_ONLY',
    'disconnect-ui-specimens',
  ];
  // Hermes stores adjacent strings without text delimiters; do not treat that as a secret-token scanner.
  // Actual public-field/key validation happens before bundling and dotenv/public-env overrides are disabled.
  if (forbidden.some((marker) => bundle.includes(Buffer.from(marker))))
    stop('Developer-only content is present in the bundle.');
  const manifest = run(
    join(tools, 'aapt2'),
    ['dump', 'xmltree', '--file', 'AndroidManifest.xml', apk],
    env,
    true,
  ).toString();
  if (
    !manifest.includes(
      'expo.modules.hooshusage.InterventionAccessibilityService',
    ) ||
    !manifest.includes('android.permission.PACKAGE_USAGE_STATS')
  )
    stop('Native protection registration is missing.');
  const minimum = Number(/minSdkVersion:'(\d+)'/.exec(badging)?.[1]);
  const target = Number(/targetSdkVersion:'(\d+)'/.exec(badging)?.[1]);
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(target) || minimum < 1 || target < minimum)
    stop('Installed Android SDK metadata could not be confirmed.');
  return {
    package_id: PACKAGE,
    min_sdk: minimum,
    target_sdk: target,
    debuggable: false,
    hermes_bytecode: true,
    embedded_bundle_bytes: bundle.length,
    packaged_font_count: files.filter((name) => /\.(?:ttf|otf)$/.test(name))
      .length,
    native_abis: [
      ...new Set(
        files
          .filter((name) => /^lib\/[^/]+\//.test(name))
          .map((name) => name.split('/')[1]),
      ),
    ],
    native_protection_manifest: true,
    signature_verified: true,
    alignment_16k_verified: true,
  };
}
export function main(args = process.argv.slice(2)) {
  let envFile = join(mobile, '.env');
  let checkOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check-config') checkOnly = true;
    else if (args[i] === '--env-file' && args[i + 1])
      envFile = resolve(args[++i]);
    else
      stop(
        'Usage: npm run mobile:android:standalone -- [--check-config] [--env-file PATH]',
      );
  }
  const fromFile = existsSync(envFile)
    ? parseEnv(readFileSync(envFile, 'utf8'))
    : {};
  const config = validatePublicConfig({
    ...fromFile,
    ...Object.fromEntries(
      publicNames
        .filter((key) => process.env[key] !== undefined)
        .map((key) => [key, process.env[key]]),
    ),
  });
  const env = buildEnvironment(process.env, config);
  if (checkOnly) {
    console.log(
      'Standalone public configuration passed; no credential values printed.',
    );
    return;
  }
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  if (!sdk || !env.JAVA_HOME)
    stop('Set JAVA_HOME to JDK17 and ANDROID_HOME to the existing SDK.');
  const tools = buildTools(sdk);
  const keystore = join(homedir(), '.android/debug.keystore');
  if (!existsSync(keystore))
    stop(
      'Run the existing Android debug build once to create its local debug certificate.',
    );
  const gradle = join(mobile, 'android/gradlew');
  const flags = [
    '-p',
    join(mobile, 'android'),
    '-PreactNativeArchitectures=arm64-v8a',
    '--max-workers=4',
    '--console=plain',
  ];
  // .env changes are not Gradle file inputs. Always rebundle before native assembly.
  run(
    gradle,
    [...flags, ':app:createBundleReleaseJsAndAssets', '--rerun-tasks'],
    env,
  );
  run(gradle, [...flags, ':app:assembleRelease'], env);
  const output = join(mobile, 'android/app/build/outputs/standalone');
  mkdirSync(output, { recursive: true });
  const temp = mkdtempSync(join(output, '.internal-'));
  try {
    const unsigned = join(
      mobile,
      'android/app/build/outputs/apk/release/app-release-unsigned.apk',
    );
    const aligned = join(temp, 'aligned.apk'),
      signed = join(temp, 'disconnect-standalone.apk');
    run(
      join(tools, 'zipalign'),
      ['-P', '16', '-f', '4', unsigned, aligned],
      env,
    );
    run(
      join(tools, 'apksigner'),
      [
        'sign',
        '--ks',
        keystore,
        '--ks-key-alias',
        'androiddebugkey',
        '--ks-pass',
        'pass:android',
        '--key-pass',
        'pass:android',
        '--out',
        signed,
        aligned,
      ],
      env,
      true,
    );
    const report = {
      built_at: new Date().toISOString(),
      distribution:
        'INTERNAL ONLY; local Android debug certificate; not store signing',
      ...inspectApk(signed, tools, env),
      mapping_sha256: createHash('sha256')
        .update(
          readFileSync(
            join(
              mobile,
              'android/app/build/outputs/mapping/release/mapping.txt',
            ),
          ),
        )
        .digest('hex'),
      apk_sha256: createHash('sha256')
        .update(readFileSync(signed))
        .digest('hex'),
      api_transport: config.EXPO_PUBLIC_API_BASE_URL.startsWith('https:')
        ? 'https'
        : 'internal_loopback_http',
      managed_account_acceptance: 'pending',
      native_runtime_acceptance: 'not established by packaging',
      source_commit: run('git', ['rev-parse', 'HEAD'], env, true)
        .toString()
        .trim(),
      source_worktree_dirty: Boolean(
        run('git', ['status', '--porcelain', '--untracked-files=no'], env, true)
          .toString()
          .trim(),
      ),
    };
    renameSync(signed, join(output, 'disconnect-standalone.apk'));
    writeFileSync(
      join(temp, 'build-report.json'),
      JSON.stringify(report, null, 2) + '\n',
      { mode: 0o600 },
    );
    renameSync(
      join(temp, 'build-report.json'),
      join(output, 'build-report.json'),
    );
    console.log(
      `Standalone internal APK: ${join(output, 'disconnect-standalone.apk')}`,
    );
    console.log(
      'Embedded Hermes/assets, signature, native registration and alignment passed. Store signing and account journeys remain pending.',
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Standalone build stopped.',
    );
    process.exitCode = 1;
  }
}
