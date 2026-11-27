import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { openOAuthBrowser } from '@/infrastructure/auth/oauth-browser';
import type { IOSGoogleCalendarAction, IOSGoogleCalendarStatus } from './ios-selection-device';

const clientID = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID ?? '';
const clientPrefix = /^([a-z0-9-]+)\.apps\.googleusercontent\.com$/.exec(clientID)?.[1];
export const directGoogleCalendarAvailable = !!clientPrefix;
const redirect = `com.googleusercontent.apps.${clientPrefix}:/oauth2redirect`;
const calendarScope = 'https://www.googleapis.com/auth/calendar.events.readonly';
const tasksScope = 'https://www.googleapis.com/auth/tasks.readonly';
const keychain = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
type TimedEvent = { startsAt: number; endsAt: number; title?: string };
type CalendarContext = { events: TimedEvent[]; tasks: string[] };
type Publish = (context: CalendarContext, replaceSynced?: boolean) => Promise<void>;

async function googleFetch(url: string, options: RequestInit) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 12000);
  try {
    const response = await fetch(url, { ...options, signal: abort.signal });
    return { response, body: await response.json() };
  } finally {
    clearTimeout(timeout);
  }
}

async function token(params: Record<string, string>, scope: string) {
  const { response, body } = await googleFetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, client_id: clientID }).toString(),
  });
  if (body?.error === 'invalid_grant') return null;
  if (!response.ok || typeof body?.access_token !== 'string' ||
      (typeof body.scope === 'string' && !body.scope.split(' ').includes(scope))) {
    throw new Error('Google authorization failed');
  }
  return { access: body.access_token as string, refresh: typeof body.refresh_token === 'string' ? body.refresh_token : undefined };
}

async function* googleItems(url: string, access: string, params: URLSearchParams) {
  do {
    const { response, body } = await googleFetch(`${url}?${params}`, {
      headers: { Authorization: `Bearer ${access}` },
      redirect: 'error',
    });
    if (!response.ok) throw new Error('Google calendar or task data could not be read');
    yield* body.items ?? [];
    if (typeof body.nextPageToken !== 'string' || !body.nextPageToken ||
        params.get('pageToken') === body.nextPageToken) return;
    params.set('pageToken', body.nextPageToken);
  } while (true);
}

function titleForNudge(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const title = raw.replace(/[\s\p{Cc}\p{Cf}]+/gu, ' ').trim();
  return Array.from(title).slice(0, 100).join('') || undefined;
}

async function timedEvents(access: string): Promise<TimedEvent[]> {
  const now = Date.now();
  const end = now + 24 * 3600_000;
  const params = new URLSearchParams({
    timeMin: new Date(now).toISOString(),
    timeMax: new Date(end).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    fields: 'items(summary,start(dateTime),end(dateTime)),nextPageToken',
  });
  const events: TimedEvent[] = [];
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  for await (const item of googleItems(url, access, params)) {
    const startsAt = Date.parse(item.start?.dateTime ?? '');
    const endsAt = Date.parse(item.end?.dateTime ?? '');
    if (startsAt < end && endsAt > now && startsAt < endsAt) {
      events.push({ startsAt, endsAt, title: titleForNudge(item.summary) });
      if (events.length === 8) break;
    }
  }
  return events;
}

async function unfinishedTasks(access: string): Promise<string[]> {
  const base = 'https://tasks.googleapis.com/tasks/v1';
  const lists = new URLSearchParams({ fields: 'items(id),nextPageToken', maxResults: '100' });
  const date = new Date();
  const today = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
  const dated = new Set<string>();
  const undated = new Set<string>();
  for await (const list of googleItems(`${base}/users/@me/lists`, access, lists)) {
    if (typeof list.id !== 'string' || !list.id) continue;
    const params = new URLSearchParams({
      showCompleted: 'false', showDeleted: 'false', showHidden: 'false', maxResults: '100',
      fields: 'items(title,status,due),nextPageToken',
    });
    for await (const item of googleItems(`${base}/lists/${encodeURIComponent(list.id)}/tasks`, access, params)) {
      const title = titleForNudge(item.title);
      if (!title || item.status !== 'needsAction') continue;
      // Google exposes a task's scheduled date without its time.
      if (typeof item.due !== 'string') {
        if (undated.size < 8) undated.add(title);
      } else if (item.due.slice(0, 10) <= today) {
        dated.add(title);
        if (dated.size === 8) return [...dated];
      }
    }
  }
  return [...new Set([...dated, ...undated])].slice(0, 8);
}

function connected(events: TimedEvent[], tasks: 'off' | 'connected' | 'unavailable'): IOSGoogleCalendarStatus {
  const now = Date.now();
  const upcoming = events.find(event => event.startsAt > now);
  return {
    status: 'connected',
    calendarLabel: 'Google Calendar',
    ...(upcoming ? { nextEventStartsAt: upcoming.startsAt } : {}),
    ...(events.some(event => event.startsAt <= now && now < event.endsAt) ? { activeEvent: true } : {}),
    tasks,
  };
}

async function authorize(scope: string) {
  const verifier = (await Crypto.getRandomBytesAsync(32)).reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
  const state = Crypto.randomUUID();
  const challenge = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const params = new URLSearchParams({
    client_id: clientID, redirect_uri: redirect, response_type: 'code', scope,
    state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account consent',
    access_type: 'offline',
  });
  const callback = await openOAuthBrowser(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, redirect);
  if (!callback) return null;
  const [target, query] = callback.split('?');
  const result = new URLSearchParams(query);
  if (target !== redirect || result.get('state') !== state) throw new Error('Invalid Google Calendar callback');
  if (result.get('error') === 'access_denied') return null;
  const code = result.get('code');
  if (!code) throw new Error('Google authorization failed');
  const auth = await token({ grant_type: 'authorization_code', code, redirect_uri: redirect, code_verifier: verifier }, scope);
  if (!auth?.refresh) throw new Error('Google connection could not be saved');
  return { access: auth.access, refresh: auth.refresh };
}

const operations = new Map<string, Promise<IOSGoogleCalendarStatus>>();

export async function directGoogleCalendar(
  owner: string,
  action: IOSGoogleCalendarAction,
  publish: Publish,
): Promise<IOSGoogleCalendarStatus> {
  if (!directGoogleCalendarAvailable) return { status: 'off' };
  const pending = operations.get(owner);
  if (pending) {
    if (action === 'status') return pending;
    await pending.catch(() => undefined);
    return directGoogleCalendar(owner, action, publish);
  }
  const run = async (): Promise<IOSGoogleCalendarStatus> => {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${clientID}:${owner}`);
    const key = `hoosh.google-calendar.${hash}`;
    const tasksKey = `${key}.tasks`;
    const empty = { events: [], tasks: [] };
    if (action === 'disconnect') {
      await SecureStore.deleteItemAsync(key, keychain);
      await SecureStore.deleteItemAsync(tasksKey, keychain);
      await publish(empty, true);
      return { status: 'off' };
    }
    if (action === 'choose' || action === 'connect') {
      const auth = await authorize(calendarScope);
      if (!auth) return { status: 'off' };
      const events = await timedEvents(auth.access);
      await SecureStore.setItemAsync(key, auth.refresh, keychain);
      try {
        await publish({ events, tasks: [] }, true);
      } catch (error) {
        await SecureStore.deleteItemAsync(key, keychain);
        throw error;
      }
      return connected(events, 'off');
    }
    const refresh = (value: string, scope: string) => token({ grant_type: 'refresh_token', refresh_token: value }, scope);
    const calendarKey = await SecureStore.getItemAsync(key, keychain);
    if (!calendarKey) return { status: 'off' };
    const auth = await refresh(calendarKey, calendarScope);
    if (!auth) {
      await SecureStore.deleteItemAsync(key, keychain);
      await SecureStore.deleteItemAsync(tasksKey, keychain);
      await publish(empty);
      return { status: 'off' };
    }
    const events = await timedEvents(auth.access);
    let tasks: string[] = [];
    let tasksStatus: NonNullable<IOSGoogleCalendarStatus['tasks']> = 'off';
    if (action === 'disconnect_tasks') {
      await SecureStore.deleteItemAsync(tasksKey, keychain);
    } else if (action === 'connect_tasks') {
      const authorization = await authorize(tasksScope);
      if (authorization) {
        tasks = await unfinishedTasks(authorization.access);
        await SecureStore.setItemAsync(tasksKey, authorization.refresh, keychain);
        tasksStatus = 'connected';
      }
    } else {
      const saved = await SecureStore.getItemAsync(tasksKey, keychain);
      if (saved) {
        try {
          const refreshed = await refresh(saved, tasksScope);
          if (refreshed) {
            tasks = await unfinishedTasks(refreshed.access);
            tasksStatus = 'connected';
          } else {
            await SecureStore.deleteItemAsync(tasksKey, keychain);
          }
        } catch {
          tasksStatus = 'unavailable';
        }
      }
    }
    await publish({ events, tasks });
    return connected(events, tasksStatus);
  };
  const operation = run();
  operations.set(owner, operation);
  try {
    return await operation;
  } finally {
    if (operations.get(owner) === operation) operations.delete(owner);
  }
}
