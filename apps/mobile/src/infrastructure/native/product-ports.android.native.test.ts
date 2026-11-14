import type { QuestDeviceSpec } from './quest-device';
import type { ProductNativePort } from './product-ports';

const mockQuestApply = jest.fn(async (..._args: unknown[]) => ({
  receipt: 'native-ack',
}));
let mockWeekly = true;
const mockRead = jest.fn(async (..._args: unknown[]) => null);
jest.mock('expo', () => ({
  requireOptionalNativeModule: () => ({
    ...(mockWeekly
      ? {
          scheduleRead: mockRead,
          schedulePreview: mockRead,
          scheduleApply: mockRead,
          interventionCancel: mockRead,
        }
      : {}),
    questRead: mockRead,
    questApply: mockQuestApply,
    questCancel: mockRead,
    interventionOpen: mockRead,
    interventionRelease: mockRead,
    interventionReviewAccess: mockRead,
    interventionEndOwner: mockRead,
    interventionClaimOwner: mockRead,
    interventionProtectionRead: mockRead,
    selectionBegin: mockRead,
    selectionPick: mockRead,
    selectionCommit: mockRead,
    selectionRelease: mockRead,
    selectionEndOwner: mockRead,
    selectionRead: mockRead,
  }),
}));
let productNativePort: ProductNativePort | null;
beforeAll(() => {
  ({ productNativePort } = jest.requireActual('./product-ports.android'));
});
it('serializes nullable metadata before Expo converts arguments and preserves native acknowledgement', async () => {
  const spec = {
    policy: null,
    enabled: false,
    versions: [{ effectiveUntil: null }],
  } as unknown as QuestDeviceSpec & { questId: string };
  expect(
    await productNativePort!.questApply('owner', 'handle', 2, spec),
  ).toEqual({ receipt: 'native-ack' });
  expect(mockQuestApply).toHaveBeenCalledWith(
    'owner',
    'handle',
    2,
    JSON.stringify(spec),
  );
  expect(spec.policy).toBeNull();
});
it('refuses an oversized payload before native dispatch', async () => {
  const spec = { questId: 'x'.repeat(65537) } as QuestDeviceSpec & {
    questId: string;
  };
  await expect(
    productNativePort!.questApply('owner', 'handle', 0, spec),
  ).rejects.toThrow('device limit');
  expect(mockQuestApply).not.toHaveBeenCalled();
});
it('keeps other product operations bound to the actual module', async () => {
  await productNativePort!.selectionRead('fixture-owner');
  expect(mockRead).toHaveBeenCalledWith('fixture-owner');
});

it('exposes the real weekly methods without changing their arguments or receiver', async () => {
  await productNativePort!.scheduleRead!('fixture-owner');
  await productNativePort!.schedulePreview!({ weekdays: [] } as never);
  await productNativePort!.scheduleApply!(
    'fixture-owner',
    'handle',
    1,
    2,
    3,
    {} as never,
  );
  await productNativePort!.interventionCancel!(
    'fixture-owner',
    'handle',
    2,
    null,
  );
  expect(mockRead.mock.calls).toEqual([
    ['fixture-owner'],
    [{ weekdays: [] }],
    ['fixture-owner', 'handle', 1, 2, 3, {}],
    ['fixture-owner', 'handle', 2, null],
  ]);
});
it('older bridges retain quest and selection methods without pretending weekly support', () => {
  mockWeekly = false;
  let old: ProductNativePort | null = null;
  jest.isolateModules(() => {
    old = jest.requireActual('./product-ports.android').productNativePort;
  });
  expect(old).not.toBeNull();
  expect(old!.questApply).toEqual(expect.any(Function));
  expect(old!.scheduleRead).toBeUndefined();
  expect(old!.scheduleApply).toBeUndefined();
  mockWeekly = true;
});
