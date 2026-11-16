import { describe, expect, it } from 'vitest';
import { callbackBase, parsePendingLink, validateCallback, type PendingLink } from './link-flow';

const id = '11111111-1111-4111-8111-111111111111';
function pending(): PendingLink {
  return { id, kind: 'recovery', createdAt: Date.now(), lastSentAt: Date.now(), phase: 'requested', email: 'a@example.test', redirectUrl: `http://localhost:8090/auth/callback?flow=${id}` };
}
describe('email callback context', () => {
  it('allows only deliberate development origins/scheme', () => {
    expect(callbackBase()).toBe('disconnect-dev://auth/callback');
    expect(callbackBase('http://localhost:8090')).toBe('http://localhost:8090/auth/callback');
    expect(() => callbackBase('https://untrusted.example')).toThrow();
  });
  it('accepts one matching code and ignores any untrusted return destination', () => {
    expect(validateCallback(`${pending().redirectUrl}&code=synthetic-code&next=https://evil.example`, pending())).toBe('synthetic-code');
  });
  it.each([
    `https://evil.example/auth/callback?flow=${id}&code=code`,
    `http://127.0.0.1:8090/auth/callback?flow=${id}&code=code`,
    `http://localhost:8090/other?flow=${id}&code=code`,
    `http://localhost:8090/auth/callback?flow=other&code=code`,
    `http://localhost:8090/auth/callback?flow=${id}&code=a&code=b`,
    `http://localhost:8090/auth/callback?flow=${id}&flow=${id}&code=a`,
    `http://localhost:8090/auth/callback?flow=${id}&code=a&error=denied`,
    `http://localhost:8090/auth/callback?flow=${id}#access_token=synthetic`,
  ])('rejects an untrusted or ambiguous callback', url => {
    expect(() => validateCallback(url, pending())).toThrow('Request a new link');
  });
  it('rejects absent, consumed, malformed and expired pending operations', () => {
    expect(() => validateCallback(`${pending().redirectUrl}&code=code`, null)).toThrow();
    expect(() => validateCallback(`${pending().redirectUrl}&code=code`, { ...pending(), phase: 'consuming' })).toThrow();
    expect(parsePendingLink('{')).toBeNull();
    expect(parsePendingLink(JSON.stringify({ ...pending(), createdAt: 1 }))).toBeNull();
    expect(parsePendingLink(JSON.stringify({ ...pending(), redirectUrl: 'https://evil.example' }))).toBeNull();
    expect(parsePendingLink(JSON.stringify(pending()))).toMatchObject({ id, kind: 'recovery' });
  });
});
