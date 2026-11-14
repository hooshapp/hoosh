import { requireOptionalNativeModule } from 'expo';
import type { ProductNativePort } from './product-ports';
type AndroidBridge = Omit<ProductNativePort, 'questApply'> & {
  questApply(
    owner: string,
    token: string,
    expected: number,
    metadataJson: string,
  ): Promise<unknown>;
};
const nativeModule =
  requireOptionalNativeModule<Partial<AndroidBridge>>('HooshUsage');
const methods: (keyof ProductNativePort)[] = [
  'questRead',
  'questApply',
  'questCancel',
  'interventionOpen',
  'interventionRelease',
  'interventionReviewAccess',
  'interventionEndOwner',
  'interventionClaimOwner',
  'interventionProtectionRead',
  'selectionBegin',
  'selectionPick',
  'selectionCommit',
  'selectionRelease',
  'selectionEndOwner',
  'selectionRead',
];
function connectedPort(): ProductNativePort | null {
  if (
    !nativeModule ||
    !methods.every((key) => typeof nativeModule[key] === 'function')
  )
    return null;
  const bridge = nativeModule as AndroidBridge;
  const bound = Object.fromEntries(
    methods.map((key) => [key, bridge[key]!.bind(bridge)]),
  );
  return {
    ...bound,
    // Weekly support is optional as a group: older installed bridges retain quests.
    ...(typeof bridge.scheduleRead === 'function' &&
    typeof bridge.schedulePreview === 'function' &&
    typeof bridge.scheduleApply === 'function' &&
    typeof bridge.interventionCancel === 'function'
      ? {
          scheduleRead: bridge.scheduleRead.bind(bridge),
          schedulePreview: bridge.schedulePreview.bind(bridge),
          scheduleApply: bridge.scheduleApply.bind(bridge),
          interventionCancel: bridge.interventionCancel.bind(bridge),
        }
      : {}),
    historyStop: bridge.historyStop?.bind(bridge),
    historyRead: bridge.historyRead?.bind(bridge),
    historyStart: bridge.historyStart?.bind(bridge),
    openUsageAccess: bridge.openUsageAccess?.bind(bridge),
    rewardsRead: bridge.rewardsRead?.bind(bridge),
    rewardsAck: bridge.rewardsAck?.bind(bridge),
    questApply(owner, token, expected, metadata) {
      const json = JSON.stringify(metadata);
      if (json.length > 65536)
        return Promise.reject(
          new Error('Quest metadata exceeds the device limit.'),
        );
      return bridge.questApply(owner, token, expected, json);
    },
  } as ProductNativePort;
}
export const productNativePort = connectedPort();
