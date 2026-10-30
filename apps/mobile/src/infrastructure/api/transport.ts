import type { ApiFetch } from './types';
/** Browser/server Fetch. Metro selects the explicit Expo native implementation. */
export const defaultApiFetch: ApiFetch = (url, init) => globalThis.fetch(url, init);
