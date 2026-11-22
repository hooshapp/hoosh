import type { ProductNativePort } from './product-ports';
export type { ProductNativePort } from './product-ports';
/** The iOS C04 port is bound to the verified owner lease in native-owner-session.ios.
 * A global singleton must never create a competing lease or imply device activation. */
export const productNativePort: ProductNativePort | null = null;
