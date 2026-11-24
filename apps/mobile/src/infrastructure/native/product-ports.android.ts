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
const methods = [
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
] as const satisfies readonly (keyof AndroidBridge)[];

type RequiredMethod = (typeof methods)[number];
type ConnectedBridge = Partial<AndroidBridge> & Pick<AndroidBridge, RequiredMethod>;

function hasProductMethods(bridge: Partial<AndroidBridge> | null): bridge is ConnectedBridge {
  return bridge !== null && methods.every((key) => typeof bridge[key] === 'function');
}
function connectedPort(): ProductNativePort | null {
  if (!hasProductMethods(nativeModule)) return null;
  const bridge = nativeModule;
  return {
    onboardingBaselineRead: bridge.onboardingBaselineRead?.bind(bridge),
    budgetCapabilities: bridge.budgetCapabilities?.bind(bridge),
    questRead: bridge.questRead.bind(bridge),
    questCancel: bridge.questCancel.bind(bridge),
    interventionOpen: bridge.interventionOpen.bind(bridge),
    interventionRelease: bridge.interventionRelease.bind(bridge),
    interventionReviewAccess: bridge.interventionReviewAccess.bind(bridge),
    interventionEndOwner: bridge.interventionEndOwner.bind(bridge),
    interventionClaimOwner: bridge.interventionClaimOwner.bind(bridge),
    interventionProtectionRead: bridge.interventionProtectionRead.bind(bridge),
    selectionBegin: bridge.selectionBegin.bind(bridge),
    selectionPick: bridge.selectionPick.bind(bridge),
    selectionCommit: bridge.selectionCommit.bind(bridge),
    selectionRelease: bridge.selectionRelease.bind(bridge),
    selectionEndOwner: bridge.selectionEndOwner.bind(bridge),
    selectionRead: bridge.selectionRead.bind(bridge),
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
  };
}
export const productNativePort = connectedPort();
