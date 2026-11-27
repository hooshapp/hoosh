import { afterEach, expect, it, vi } from 'vitest';

const { browser, storage } = vi.hoisted(() => ({ browser: vi.fn(), storage: new Map<string, string>() }));
vi.mock('@/infrastructure/auth/oauth-browser', () => ({ openOAuthBrowser: browser }));
vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
  digestStringAsync: async (_algorithm: string, input: string) => input.includes('owner-b') ? 'digest-b' : 'digest-a',
  getRandomBytesAsync: async () => new Uint8Array(32),
  randomUUID: () => 'expected-state',
}));
vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: async (key: string) => storage.get(key),
  setItemAsync: async (key: string, value: string) => { storage.set(key, value); },
  deleteItemAsync: async (key: string) => { storage.delete(key); },
}));

afterEach(() => {
  storage.clear();
  browser.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('connects through Google and refreshes a named event through its full time window', async () => {
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID', 'test-client.apps.googleusercontent.com');
  browser.mockImplementation(async (url: string, redirect: string) => {
    const params = new URL(url).searchParams;
    expect(params.get('code_challenge_method')).toBe('S256');
    expect(params.get('scope')).toBe('https://www.googleapis.com/auth/calendar.events.readonly');
    return `${redirect}?state=${params.get('state')}&code=test`;
  });
  let startsAt = Date.now() + 60_000;
  const endsAt = startsAt + 3600_000;
  const event = (start: number, end: number) => ({
    summary: 'Homework', start: { dateTime: new Date(start).toISOString() },
    end: { dateTime: new Date(end).toISOString() },
  });
  const request = vi.fn(async (url: string) => new Response(JSON.stringify(
    url.includes('/token') ? { access_token: 'access', refresh_token: 'refresh' }
      : { items: [event(startsAt - 7200_000, Date.now() - 60_000), event(startsAt, endsAt)] },
  )));
  vi.stubGlobal('fetch', request);
  const { directGoogleCalendar } = await import('./direct-google-calendar');
  const publish = vi.fn(async () => {});
  expect(await directGoogleCalendar('owner-a', 'choose', publish)).toEqual({
    status: 'connected', calendarLabel: 'Google Calendar', nextEventStartsAt: startsAt, tasks: 'off',
  });
  expect(publish).toHaveBeenLastCalledWith({ events: [{ startsAt, endsAt, title: 'Homework' }], tasks: [] }, true);
  expect(await directGoogleCalendar('owner-b', 'status', publish)).toEqual({ status: 'off' });
  startsAt = Date.now() - 60_000;
  expect(await directGoogleCalendar('owner-a', 'status', publish)).toEqual({
    status: 'connected', calendarLabel: 'Google Calendar', activeEvent: true, tasks: 'off',
  });
  expect(publish).toHaveBeenLastCalledWith({ events: [{ startsAt, endsAt, title: 'Homework' }], tasks: [] });
  expect(await directGoogleCalendar('owner-a', 'disconnect', publish)).toEqual({ status: 'off' });
  expect(publish).toHaveBeenLastCalledWith({ events: [], tasks: [] }, true);
  expect(storage.size).toBe(0);
});

it('fetches unfinished date-only and undated Google Tasks and clears them on completion', async () => {
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID', 'test-client.apps.googleusercontent.com');
  storage.set('hoosh.google-calendar.digest-a', 'calendar-refresh');
  browser.mockImplementation(async (url: string, redirect: string) => {
    const params = new URL(url).searchParams;
    expect(params.get('scope')).toBe('https://www.googleapis.com/auth/tasks.readonly');
    return `${redirect}?state=${params.get('state')}&code=test`;
  });
  let status = 'needsAction';
  vi.stubGlobal('fetch', vi.fn(async (rawUrl: string, options: RequestInit) => {
    const url = new URL(rawUrl);
    if (url.pathname === '/token') {
      const params = new URLSearchParams(String(options.body));
      const account = params.get('refresh_token') === 'calendar-refresh' ? 'calendar' : 'tasks';
      return Response.json({ access_token: account, refresh_token: `${account}-refresh` });
    }
    if (url.pathname.endsWith('/primary/events')) return Response.json({ items: [] });
    if (url.pathname.endsWith('/@me/lists')) {
      return Response.json(url.searchParams.has('pageToken')
        ? { items: [{ id: 'second' }] }
        : { items: [{ id: 'first/id' }], nextPageToken: 'next-list' });
    }
    expect(url.searchParams.get('showCompleted')).toBe('false');
    return Response.json({ items: url.pathname.includes('first%2Fid')
      ? [{ title: 'Submit essay', status, due: '2020-01-01T00:00:00.000Z' },
        { title: 'Future task', status: 'needsAction', due: '2099-01-01T00:00:00.000Z' }]
      : [{ title: 'Call the library', status }] });
  }));
  const { directGoogleCalendar } = await import('./direct-google-calendar');
  const publish = vi.fn(async () => {});
  expect(await directGoogleCalendar('owner-a', 'connect_tasks', publish)).toMatchObject({ status: 'connected', tasks: 'connected' });
  expect(publish).toHaveBeenLastCalledWith({ events: [], tasks: ['Submit essay', 'Call the library'] });
  expect(storage.get('hoosh.google-calendar.digest-a')).toBe('calendar-refresh');
  status = 'completed';
  expect(await directGoogleCalendar('owner-a', 'status', publish)).toMatchObject({ status: 'connected', tasks: 'connected' });
  expect(publish).toHaveBeenLastCalledWith({ events: [], tasks: [] });
  expect(await directGoogleCalendar('owner-a', 'disconnect_tasks', publish)).toMatchObject({ status: 'connected', tasks: 'off' });
  expect(storage.size).toBe(1);
});

it('rejects a callback with the wrong state without exchanging a code', async () => {
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_CALENDAR_IOS_CLIENT_ID', 'test-client.apps.googleusercontent.com');
  browser.mockImplementation(async (_url: string, redirect: string) => `${redirect}?state=wrong&code=test`);
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  const { directGoogleCalendar } = await import('./direct-google-calendar');
  await expect(directGoogleCalendar('owner-a', 'choose', vi.fn())).rejects.toThrow('Invalid Google Calendar callback');
  expect(request).not.toHaveBeenCalled();
  expect(storage.size).toBe(0);
});
