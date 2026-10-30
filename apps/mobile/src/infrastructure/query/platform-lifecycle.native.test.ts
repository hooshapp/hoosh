import * as Network from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';

import { platformQueryLifecycle } from './platform-lifecycle.native';

jest.mock('expo-network', () => ({
  addNetworkStateListener: jest.fn(),
  getNetworkStateAsync: jest.fn(),
}));
const mockListener = jest.mocked(Network.addNetworkStateListener);
const mockRead = jest.mocked(Network.getNetworkStateAsync);
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
afterEach(() => jest.restoreAllMocks());

test('native focus follows AppState and removes the change listener', () => {
  const remove = jest.fn();
  let changed!: (state: AppStateStatus) => void;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    changed = listener;
    return { remove };
  });
  const notify = jest.fn();
  const stop = platformQueryLifecycle.focus(notify);
  changed('background');
  expect(notify).toHaveBeenLastCalledWith(false);
  changed('active');
  expect(notify).toHaveBeenLastCalledWith(true);
  stop();
  expect(remove).toHaveBeenCalledTimes(1);
});
test('native network listener wins over a late initial read and stops delivery after cleanup', async () => {
  const initial = deferred<Network.NetworkState>();
  mockRead.mockReturnValue(initial.promise);
  let changed!: (state: Network.NetworkState) => void;
  const remove = jest.fn();
  mockListener.mockImplementation((listener) => {
    changed = listener;
    return { remove };
  });
  const notify = jest.fn();
  const stop = platformQueryLifecycle.online(notify);
  changed({ isConnected: false });
  initial.resolve({ isConnected: true });
  await Promise.resolve();
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenLastCalledWith(false);
  stop();
  changed({ isConnected: true });
  expect(notify).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
});
test('a failed or unknown native reachability read never leaves queries permanently offline', async () => {
  mockListener.mockReturnValue({ remove: jest.fn() });
  mockRead.mockRejectedValue(new Error('network unavailable'));
  const notify = jest.fn();
  const stop = platformQueryLifecycle.online(notify);
  await Promise.resolve();
  await Promise.resolve();
  expect(notify).toHaveBeenLastCalledWith(true);
  stop();
});
test('native initial read is ignored after unmount', async () => {
  const initial = deferred<Network.NetworkState>();
  mockRead.mockReturnValue(initial.promise);
  mockListener.mockReturnValue({ remove: jest.fn() });
  const notify = jest.fn();
  const stop = platformQueryLifecycle.online(notify);
  stop();
  initial.resolve({ isConnected: false });
  await Promise.resolve();
  expect(notify).not.toHaveBeenCalled();
});
