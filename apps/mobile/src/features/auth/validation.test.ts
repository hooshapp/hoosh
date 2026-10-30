import { describe, expect, it } from 'vitest';
import { validateAuthForm } from './validation';

const valid = { name: 'Alex', email: 'alex@example.test', password: 'a long password' };
describe('auth form validation', () => {
  it('requires a name only for signup', () => {
    expect(validateAuthForm('sign-up', { ...valid, name: '  ' }).name).toBeTruthy();
    expect(validateAuthForm('sign-in', { ...valid, name: '' })).toEqual({});
  });
  it.each(['', 'alex', 'alex@', 'alex @example.test', 'alex@example'])('rejects malformed email %s', email => {
    expect(validateAuthForm('sign-up', { ...valid, email }).email).toBeTruthy();
  });
  it('accepts surrounding email whitespace without mutating the form values', () => {
    const values = { ...valid, email: ' alex@example.test ' };
    expect(validateAuthForm('sign-up', values)).toEqual({});
    expect(values.email).toBe(' alex@example.test ');
  });
  it('requires a password for either screen', () => {
    for (const mode of ['sign-in', 'sign-up'] as const) {
      expect(validateAuthForm(mode, { ...valid, password: '' }).password).toBeTruthy();
    }
  });
  it('applies the proposed minimum only to new passwords and does not trim passwords', () => {
    expect(validateAuthForm('sign-up', { ...valid, password: '1234567' }).password).toBeTruthy();
    expect(validateAuthForm('sign-up', { ...valid, password: '12345678' })).toEqual({});
    expect(validateAuthForm('sign-in', { ...valid, password: 'short' })).toEqual({});
    expect(validateAuthForm('sign-up', { ...valid, password: ' abcdef ' })).toEqual({});
  });
});
