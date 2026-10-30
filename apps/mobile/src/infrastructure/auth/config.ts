import { AuthUnavailableError } from './errors';

export type AuthConfig = { url: string; key: string; storageKey: string };
export function readAuthConfig(urlValue?: string, keyValue?: string): AuthConfig {
  try {
    const url = new URL(urlValue?.trim() ?? '');
    const key = keyValue?.trim() ?? '';
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw new Error();
    return { url: url.origin, key, storageKey: `disconnect.auth.v1.${url.host.replace(/[^a-zA-Z0-9.-]/g, '_')}` };
  } catch { throw new AuthUnavailableError('configuration', false); }
}

export const authWebOrigins = Object.freeze(['http://localhost:8081', 'http://localhost:8090']);
export function callbackBase(webOrigin?: string): string {
  if (webOrigin === undefined) return 'disconnect-dev://auth/callback';
  if (!authWebOrigins.includes(webOrigin)) throw new AuthUnavailableError('configuration', false);
  return `${webOrigin}/auth/callback`;
}
