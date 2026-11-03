import type { ProfilePatch } from '@disconnect/contracts';
import { ApiError } from '../../infrastructure/api/errors';
import {
  decodeIdentity,
  decodeProfileResponse,
  decodeProfileSavedResponse,
} from '../../infrastructure/api/decoders';
import type { AccountOperation } from '../../infrastructure/query/account-scope';

/** All private requests use the captured account scope and its cancellation signal. */
export function readIdentity({ api, signal }: AccountOperation) {
  return api.request('/v1/me', { signal, decode: decodeIdentity });
}
export function readProfile({ api, signal }: AccountOperation) {
  return api.request('/v1/profile', { signal, decode: decodeProfileResponse });
}
export function saveProfile(patch: ProfilePatch, { api, signal }: AccountOperation) {
  return api.request('/v1/profile', {
    method: 'PATCH',
    json: patch,
    signal,
    decode: (value, context) => {
      const response = decodeProfileSavedResponse(value, context);
      if (response.profile.revision !== patch.expected_revision + 1)
        throw new ApiError('invalid_response');
      return response;
    },
  });
}
