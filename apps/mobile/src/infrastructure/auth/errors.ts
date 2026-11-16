import type { AuthUnavailableError as ErrorContract } from '@disconnect/contracts';

export class AuthCancelledError extends Error { readonly name = 'AuthCancelledError'; }

export class AuthUnavailableError extends Error implements ErrorContract {
  readonly name = 'AuthUnavailableError' as const;
  constructor(readonly reason: ErrorContract['reason'], readonly retryable = true) {
    super(`Authentication is unavailable (${reason}).`);
  }
}

/** Never show raw provider errors: they may contain account details or URLs. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthCancelledError) return 'Sign-in was canceled. You can try again.';
  if (error instanceof AuthUnavailableError) {
    if (error.reason === 'configuration') return 'Authentication setup is incomplete. Please try again after the development project is configured.';
    if (error.reason === 'storage') return 'Unable to access secure session storage. Please retry or restart the app.';
    return 'Your session could not be verified. Check your connection and try again.';
  }
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  switch (code) {
    case 'invalid_credentials': return 'Email or password is incorrect.';
    case 'email_not_confirmed': return 'Confirm your email before logging in.';
    case 'weak_password': return 'Your password does not meet the account security requirements.';
    case 'validation_failed': return 'Review your account details and try again.';
    case 'email_address_not_authorized': return 'Development email delivery is not configured for this address. Use an approved test address or configure email delivery.';
    case 'signup_disabled': case 'email_provider_disabled': return 'Email account access is not enabled for this project yet.';
    case 'provider_disabled': case 'unsupported_provider': case 'oauth_provider_not_supported': return 'This sign-in provider is not available yet. Please use email or try again later.';
    case 'over_request_rate_limit': case 'over_email_send_rate_limit': return 'Too many attempts. Please wait before trying again.';
    case 'user_already_exists': case 'email_exists': return 'Check your email for the next step, or log in if you already have an account.';
    default: return 'Unable to complete this request. Check your connection and try again.';
  }
}
