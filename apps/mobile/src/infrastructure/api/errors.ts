export type ApiErrorKind =
  | 'configuration'
  | 'no_session'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'unavailable'
  | 'timeout'
  | 'network'
  | 'cancelled'
  | 'invalid_response';
const messages: Record<ApiErrorKind, string> = {
  configuration: 'The API connection is not configured correctly.',
  no_session: 'Sign-in is required for this request.',
  unauthorized: 'Your API access could not be verified. Try account recovery.',
  forbidden: 'This operation is not available for this account.',
  validation: 'Check the submitted information.',
  conflict: 'Your profile changed. Review the latest version before saving.',
  rate_limited: 'Too many requests. Try again later.',
  unavailable: 'The service is temporarily unavailable.',
  timeout: 'The request took too long.',
  network: 'The service could not be reached.',
  cancelled: 'The request was cancelled.',
  invalid_response: 'The service returned an unexpected response.',
};
const codeStatus = {
  AUTH_REQUIRED: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  PROFILE_CONFLICT: 409,
  REQUEST_TOO_LARGE: 413,
  VALIDATION_ERROR: 422,
  AUTH_UNAVAILABLE: 503,
  DEPENDENCY_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
} as const;
export type ApiErrorCode = keyof typeof codeStatus;
const fields = ['body', 'expected_revision', 'display_name'] as const;
const fieldCodes = [
  'required',
  'invalid_type',
  'blank',
  'too_long',
  'invalid_text',
  'out_of_range',
  'extra_field',
  'invalid_json',
] as const;
export type ValidationIssue = { field: (typeof fields)[number]; code: (typeof fieldCodes)[number] };
export type SafeErrorDetails = { current_revision: number } | { fields: ValidationIssue[] };
export type ApiErrorMetadata = {
  status?: number;
  code?: ApiErrorCode;
  requestId?: string;
  retryAfterMs?: number;
  details?: SafeErrorDetails;
  retryable?: boolean;
  recoveryPaused?: boolean;
  requestMayHaveCommitted?: boolean;
};
/** Only fixed copy/whitelisted metadata; no raw response, URL, token or cause. */
export class ApiError extends Error {
  readonly retryable: boolean;
  readonly status?: number;
  readonly code?: ApiErrorCode;
  readonly requestId?: string;
  readonly retryAfterMs?: number;
  readonly details?: SafeErrorDetails;
  readonly recoveryPaused: boolean;
  readonly requestMayHaveCommitted: boolean;
  constructor(
    public readonly kind: ApiErrorKind,
    metadata: ApiErrorMetadata = {},
  ) {
    super(messages[kind]);
    this.name = 'ApiError';
    this.status = metadata.status;
    this.code = metadata.code;
    this.requestId = metadata.requestId;
    this.retryAfterMs = metadata.retryAfterMs;
    this.details = metadata.details;
    this.retryable =
      metadata.retryable ?? ['network', 'timeout', 'unavailable', 'rate_limited'].includes(kind);
    this.recoveryPaused = metadata.recoveryPaused ?? false;
    this.requestMayHaveCommitted = metadata.requestMayHaveCommitted ?? false;
  }
}
export function safeRequestId(value: unknown): string | undefined {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : undefined;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function retryAfterMs(value: string | null, now: number): number | undefined {
  if (!value) return undefined;
  let delay: number;
  if (/^\d{1,10}$/.test(value)) delay = Number(value) * 1000;
  else if (
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)
  )
    delay = Date.parse(value) - now;
  else return undefined;
  // Never shorten a longer server cooldown into an earlier automatic retry.
  return Number.isFinite(delay) && delay <= 60_000 ? Math.max(0, delay) : undefined;
}
function safeDetails(code: ApiErrorCode | undefined, value: unknown): SafeErrorDetails | undefined {
  if (code !== 'PROFILE_CONFLICT' && code !== 'VALIDATION_ERROR') return undefined;
  if (!isRecord(value)) throw new Error();
  if (code === 'PROFILE_CONFLICT') {
    if (!Number.isSafeInteger(value.current_revision) || (value.current_revision as number) < 0)
      throw new Error();
    return { current_revision: value.current_revision as number };
  }
  if (!Array.isArray(value.fields) || value.fields.length < 1 || value.fields.length > 10)
    throw new Error();
  return {
    fields: value.fields.map((issue: unknown) => {
      if (
        !isRecord(issue) ||
        !fields.some((field) => field === issue.field) ||
        !fieldCodes.some((code) => code === issue.code)
      )
        throw new Error();
      return {
        field: issue.field as ValidationIssue['field'],
        code: issue.code as ValidationIssue['code'],
      };
    }),
  };
}
/** Unknown future codes remain failures; arbitrary server copy/details never escape. */
export function httpError(
  response: Response,
  body: unknown,
  now: number,
  paused = false,
): ApiError {
  const metadata: ApiErrorMetadata = {
    status: response.status,
    requestId: safeRequestId(response.headers.get('X-Request-ID')),
    recoveryPaused: paused,
  };
  try {
    if (!isRecord(body) || !isRecord(body.error)) throw new Error();
    const error = body.error;
    if (
      typeof error.code !== 'string' ||
      typeof error.message !== 'string' ||
      typeof error.retryable !== 'boolean' ||
      !safeRequestId(error.request_id)
    )
      throw new Error();
    const bodyId = safeRequestId(error.request_id);
    if (metadata.requestId && metadata.requestId !== bodyId) throw new Error();
    metadata.requestId ??= bodyId;
    if (Object.hasOwn(codeStatus, error.code)) {
      const code = error.code as ApiErrorCode;
      if (codeStatus[code] !== response.status) throw new Error();
      metadata.code = code;
      metadata.details = safeDetails(code, error.details);
    }
    const kinds: Record<number, ApiErrorKind> = {
      401: 'unauthorized',
      403: 'forbidden',
      409: 'conflict',
      413: 'validation',
      422: 'validation',
      429: 'rate_limited',
      500: 'unavailable',
      502: 'unavailable',
      503: 'unavailable',
      504: 'unavailable',
    };
    const kind = kinds[response.status] ?? 'invalid_response';
    metadata.retryable =
      kind === 'rate_limited' || ([502, 503, 504].includes(response.status) && error.retryable);
    if (response.status === 429) {
      metadata.retryAfterMs = retryAfterMs(response.headers.get('Retry-After'), now);
      metadata.retryable = metadata.retryAfterMs !== undefined;
    }
    return new ApiError(kind, metadata);
  } catch {
    return new ApiError('invalid_response', {
      status: metadata.status,
      requestId: metadata.requestId,
      recoveryPaused: paused,
    });
  }
}
export function authUnavailable(error: unknown): ApiError {
  const retryable =
    isRecord(error) && error.name === 'AuthUnavailableError' && typeof error.retryable === 'boolean'
      ? error.retryable
      : true;
  return new ApiError('unavailable', { retryable });
}
