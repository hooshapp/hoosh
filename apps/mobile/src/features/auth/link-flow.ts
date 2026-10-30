import { authWebOrigins } from '../../infrastructure/auth/config';
export { callbackBase } from '../../infrastructure/auth/config';

export const LINK_MAX_AGE = 60 * 60 * 1000;
export type SocialProvider = 'apple' | 'google';
export type PendingLink = {
  id: string; kind: 'signup' | 'recovery' | 'oauth'; provider?: SocialProvider; createdAt: number; lastSentAt: number;
  redirectUrl: string; email: string; displayName?: string;
  phase: 'requested' | 'consuming' | 'recovery'; sessionKey?: string;
};
export type LinkState = { pending: PendingLink | null; processing: boolean; draftName: string | null };
export const INITIAL_LINK_STATE: LinkState = { pending: null, processing: false, draftName: null };

export function parsePendingLink(raw: string | null, now = Date.now()): PendingLink | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const p = value as Partial<PendingLink>;
    if (typeof p.id !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(p.id) ||
      !['signup', 'recovery', 'oauth'].includes(p.kind ?? '') || !['requested', 'consuming', 'recovery'].includes(p.phase ?? '') ||
      typeof p.createdAt !== 'number' || p.createdAt > now || now - p.createdAt > LINK_MAX_AGE ||
      typeof p.lastSentAt !== 'number' || p.lastSentAt < p.createdAt || p.lastSentAt > now + 5000 || typeof p.email !== 'string' || p.email.length > 320 ||
      typeof p.redirectUrl !== 'string' || (p.displayName !== undefined && (typeof p.displayName !== 'string' || p.displayName.length > 320)) ||
      (p.sessionKey !== undefined && typeof p.sessionKey !== 'string')) return null;
    if (p.kind === 'oauth' ? !['apple', 'google'].includes(p.provider ?? '') || p.email !== '' : p.provider !== undefined) return null;
    if (p.phase === 'recovery' && (p.kind !== 'recovery' || typeof p.sessionKey !== 'string' || !p.sessionKey || p.sessionKey.length > 256)) return null;
    const target = new URL(p.redirectUrl);
    const base = `${target.protocol}//${target.host}${target.pathname}`;
    if (base !== 'disconnect-dev://auth/callback' && !authWebOrigins.some(origin => base === `${origin}/auth/callback`)) return null;
    if (target.searchParams.get('flow') !== p.id || target.username || target.password || target.hash) return null;
    return p as PendingLink;
  } catch { return null; }
}

/** Canonical ordering makes Router and the system browser share one exchange. */
export function callbackKey(value: string): string {
  try { const url = new URL(value); url.searchParams.sort(); return url.toString(); }
  catch { return value; }
}
export function validateCallback(urlValue: string, pending: PendingLink | null): string {
  try {
    if (!pending || Date.now() - pending.createdAt > LINK_MAX_AGE || pending.phase !== 'requested') throw new Error();
    const url = new URL(urlValue); const expected = new URL(pending.redirectUrl);
    if (url.protocol !== expected.protocol || url.host !== expected.host || url.pathname !== expected.pathname ||
      url.username || url.password || url.hash || url.searchParams.getAll('flow').length !== 1 ||
      url.searchParams.get('flow') !== pending.id || url.searchParams.has('error') || url.searchParams.has('error_code') ||
      url.searchParams.getAll('code').length !== 1) throw new Error();
    const code = url.searchParams.get('code');
    if (!code || code.length > 2048 || !/^[A-Za-z0-9._~-]+$/.test(code)) throw new Error();
    return code;
  } catch { throw new Error('This link is expired or cannot be used here. Request a new link on this device.'); }
}
