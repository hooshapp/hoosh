import { requireOptionalNativeModule } from 'expo';
import type { ProductNativePort } from './product-ports';
const nativeModule = requireOptionalNativeModule<Partial<ProductNativePort>>('HooshUsage');
const methods: (keyof ProductNativePort)[] = ['questRead', 'questApply', 'questCancel', 'interventionOpen', 'interventionRelease',
  'interventionReviewAccess', 'interventionEndOwner', 'interventionClaimOwner', 'interventionProtectionRead',
  'selectionBegin', 'selectionPick', 'selectionCommit', 'selectionRelease', 'selectionEndOwner', 'selectionRead'];
export const productNativePort: ProductNativePort | null = nativeModule && methods.every((key) => typeof nativeModule[key] === 'function') ? nativeModule as ProductNativePort : null;
