import { fetch } from 'expo/fetch';
import type { ApiFetch } from './types';
/** Keep redirect/abort semantics even if the app opts out of Expo's global fetch. */
export const defaultApiFetch: ApiFetch = fetch;
