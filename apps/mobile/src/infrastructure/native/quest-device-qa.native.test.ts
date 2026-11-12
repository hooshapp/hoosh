import { connect } from '../../../dev/profile/runtime';

const A = '00000000-0000-4000-8000-000000000001';
let mockPort: object | null;
jest.mock('@/infrastructure/native/product-ports', () => ({
  get productNativePort() {
    return mockPort;
  },
}));
let response: unknown;
let fetcher: jest.SpyInstance;
beforeEach(() => {
  response = { user_id: A, email: null };
  mockPort = { interventionClaimOwner: jest.fn(), questApply: jest.fn() };
  fetcher = jest.spyOn(global, 'fetch').mockImplementation(
    async () =>
      ({
        ok: true,
        json: async () => response,
      }) as Response,
  );
});
afterEach(() => fetcher.mockRestore());
it('keeps the existing profile QA connection non-native unless explicitly requested', async () => {
  const runtime = await connect('synthetic-fixture-credential', 1);
  expect(runtime.nativeOwner).toBeNull();
  expect(mockPort).toEqual({
    interventionClaimOwner: expect.any(Function),
    questApply: expect.any(Function),
  });
  expect(
    (mockPort as { questApply: jest.Mock }).questApply,
  ).not.toHaveBeenCalled();
});
it('verifies identity before exposing a separate QA owner and never claims or installs on connect', async () => {
  const runtime = await connect('synthetic-fixture-credential', 3, true);
  expect(fetcher).toHaveBeenCalledWith(
    'http://127.0.0.1:8765/v1/me',
    expect.any(Object),
  );
  expect(runtime.nativeOwner).toMatchObject({
    owner: `qa-quest:${A}`,
    generation: 3,
  });
  expect(
    (mockPort as { interventionClaimOwner: jest.Mock }).interventionClaimOwner,
  ).not.toHaveBeenCalled();
  expect(
    (mockPort as { questApply: jest.Mock }).questApply,
  ).not.toHaveBeenCalled();
});
it.each([
  ['ERR_INTERVENTION_INVALID', 'ERR_INTERVENTION_INVALID'],
  ['private.app.identity', 'ERR_UNAVAILABLE'],
])(
  'logs only bounded native error codes in the isolated QA host: %s',
  async (code, expected) => {
    const log = jest.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const failure = Object.assign(
        new Error('private native payload must not be printed'),
        { code },
      );
      (mockPort as { questApply: jest.Mock }).questApply.mockRejectedValue(
        failure,
      );
      const runtime = await connect('synthetic-fixture-credential', 1, true);
      await expect(
        runtime.nativeOwner!.port.questApply(
          `qa-quest:${A}`,
          'fixture-handle',
          0,
          {} as never,
        ),
      ).rejects.toBe(failure);
      expect(log.mock.calls).toEqual([
        ['RN09B_DEVICE_QA_ONLY native quest write rejected', expected],
      ]);
    } finally {
      log.mockRestore();
    }
  },
);
it('rejects a missing native bridge rather than claiming a quest-device connection', async () => {
  mockPort = null;
  await expect(
    connect('synthetic-fixture-credential', 1, true),
  ).rejects.toThrow('Quest device bridge is unavailable in this build.');
});
it.each([
  null,
  { user_id: 'default-owner', email: null },
  { user_id: A },
  { user_id: A, email: 1 },
])(
  'rejects invalid API identity before native binding: %j',
  async (identity) => {
    response = identity;
    await expect(
      connect('synthetic-fixture-credential', 1, true),
    ).rejects.toThrow('Invalid identity.');
    expect(
      (mockPort as { interventionClaimOwner: jest.Mock })
        .interventionClaimOwner,
    ).not.toHaveBeenCalled();
  },
);
