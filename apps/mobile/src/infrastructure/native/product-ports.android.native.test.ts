import type { QuestDeviceSpec } from './quest-device';
import type { ProductNativePort } from './product-ports';

const mockQuestApply = jest.fn(async (..._args: unknown[]) => ({
  receipt: 'native-ack',
}));
const mockRead = jest.fn(async (..._args: unknown[]) => null);
jest.mock('expo', () => ({
  requireOptionalNativeModule: () => ({
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
