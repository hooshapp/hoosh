import { beforeEach, expect, it, jest } from '@jest/globals';
import { requireOptionalNativeModule } from 'expo';
import { getScreenTimeAuthorization, requestScreenTimeAuthorization } from './authorization';
jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
const read = jest.fn<() => Promise<string>>();
const request = jest.fn<() => Promise<string>>();
beforeEach(() => {
  jest.mocked(requireOptionalNativeModule).mockReturnValue({ getAuthorization: read, requestAuthorization: request });
  read.mockResolvedValue('not_requested');
  request.mockResolvedValue('not_requested');
});
it('does not turn opening settings into authorization', async () => {
  expect(await requestScreenTimeAuthorization()).toBe('not_requested');
  read.mockResolvedValue('authorized');
  expect(await getScreenTimeAuthorization()).toBe('authorized');
  read.mockResolvedValue('denied');
  expect(await getScreenTimeAuthorization()).toBe('denied');
});
it('returns unavailable when the development build lacks the module', async () => {
  jest.mocked(requireOptionalNativeModule).mockReturnValue(null);
  expect(await requestScreenTimeAuthorization()).toBe('unavailable');
});
it('rejects unexpected bridge status instead of assuming success', async () => {
  read.mockResolvedValue('active');
  expect(await getScreenTimeAuthorization()).toBe('error');
});
