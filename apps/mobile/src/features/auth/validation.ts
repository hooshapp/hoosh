export type AuthMode = 'sign-up' | 'sign-in';
export type AuthValues = { name: string; email: string; password: string };
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;

/** UI checks only; the auth provider will own the final password policy. */
export function validateAuthForm(mode: AuthMode, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  if (mode === 'sign-up' && !values.name.trim()) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Enter your password.';
  else if (mode === 'sign-up' && values.password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}
