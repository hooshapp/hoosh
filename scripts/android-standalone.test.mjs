import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validatePublicConfig,
  buildEnvironment,
} from './android-standalone.mjs';
const config = {
  EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test',
  EXPO_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic_only',
};
test('accepts explicit hosted HTTPS and the two native loopback development hosts', () => {
  for (const origin of [
    'https://api.example.test',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ]) {
    assert.equal(
      validatePublicConfig({ ...config, EXPO_PUBLIC_API_BASE_URL: origin })
        .EXPO_PUBLIC_API_BASE_URL,
      origin,
    );
  }
});
test('rejects missing, remote cleartext, credential-bearing and non-origin API values', () => {
  for (const value of [
    '',
    'http://192.0.2.1:8000',
    'https://person:private@api.example.test',
    'https://api.example.test/v1',
    'https://api.example.test?credential=private',
    ' https://api.example.test',
    'file:///tmp/api',
  ]) {
    assert.throws(() =>
      validatePublicConfig({ ...config, EXPO_PUBLIC_API_BASE_URL: value }),
    );
  }
});
test('rejects invalid Auth hosts and every privileged or user-token role', () => {
  for (const value of [
    'http://fixture.supabase.co',
    'https://other.example.test',
    'https://fixture.supabase.co/auth/v1',
  ]) {
    assert.throws(() =>
      validatePublicConfig({ ...config, EXPO_PUBLIC_SUPABASE_URL: value }),
    );
  }
  for (const role of ['service_role', 'authenticated', null]) {
    const token = `e30.${Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url')}.synthetic`;
    assert.throws(() =>
      validatePublicConfig({
        ...config,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: token,
      }),
    );
  }
  for (const value of [
    'sb_secret_synthetic_private',
    'sb_publishable_',
    'sb_publishable_ has spaces',
    'not-a-key',
  ]) {
    assert.throws(() =>
      validatePublicConfig({
        ...config,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: value,
      }),
    );
  }
});
test('accepts a legacy anon configuration without treating it as JWT verification', () => {
  const key = `e30.${Buffer.from(JSON.stringify({ role: 'anon', iss: 'supabase' })).toString('base64url')}.synthetic`;
  assert.equal(
    validatePublicConfig({
      ...config,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
    }).EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    key,
  );
});
test('bundler environment includes only reviewed public fields and prevents implicit dotenv loading', () => {
  const env = buildEnvironment(
    {
      PATH: '/synthetic',
      EXPO_PUBLIC_UNREVIEWED_SECRET: 'must-not-inline',
      EXPO_PUBLIC_API_BASE_URL: 'https://old.example.test',
      EXPO_NO_DOTENV: '0',
    },
    config,
  );
  assert.equal(env.EXPO_PUBLIC_UNREVIEWED_SECRET, undefined);
  assert.equal(env.EXPO_PUBLIC_API_BASE_URL, config.EXPO_PUBLIC_API_BASE_URL);
  assert.equal(env.EXPO_NO_DOTENV, '1');
  assert.equal(env.NODE_ENV, 'production');
  assert.equal(env.PATH, '/synthetic');
});
test('validation errors never echo an input credential or origin', () => {
  const secret = 'private_input_that_must_stay_local';
  assert.throws(
    () =>
      validatePublicConfig({
        ...config,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret,
      }),
    (error) => !error.message.includes(secret),
  );
});

test('keeps reviewed provider switches in packaged builds and defaults missing switches off', () => {
  const flags = [
    'EXPO_PUBLIC_APPLE_NATIVE_ENABLED',
    'EXPO_PUBLIC_APPLE_OAUTH_ENABLED',
    'EXPO_PUBLIC_GOOGLE_ENABLED',
  ];
  for (const flag of flags) assert.equal(validatePublicConfig(config)[flag], 'false');
  const env = buildEnvironment({ EXPO_PUBLIC_GOOGLE_ENABLED: 'false' }, {
    ...config,
    EXPO_PUBLIC_APPLE_OAUTH_ENABLED: 'true',
    EXPO_PUBLIC_GOOGLE_ENABLED: 'true',
  });
  assert.equal(env.EXPO_PUBLIC_GOOGLE_ENABLED, 'true');
  assert.equal(env.EXPO_PUBLIC_APPLE_OAUTH_ENABLED, 'true');
  assert.equal(env.EXPO_PUBLIC_APPLE_NATIVE_ENABLED, 'false');
});

test('rejects ambiguous provider switches without echoing their contents', () => {
  for (const value of ['', '1', 'TRUE', ' true ', 'private_input']) {
    assert.throws(() => validatePublicConfig({ ...config, EXPO_PUBLIC_GOOGLE_ENABLED: value }),
      error => error.message === 'Use true or false for public provider switches.');
  }
});
