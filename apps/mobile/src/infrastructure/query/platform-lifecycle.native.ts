import * as Network from 'expo-network';
import { AppState } from 'react-native';

import { connectivityOnline, type QueryLifecycleSource } from './lifecycle';

export const platformQueryLifecycle: QueryLifecycleSource = {
  focus(notify) {
    let active = true;
    notify(AppState.currentState === null || AppState.currentState === 'active');
    const listener = AppState.addEventListener('change', (state) => {
      if (active) notify(state === 'active');
    });
    return () => {
      if (!active) return;
      active = false;
      listener.remove();
    };
  },
  online(notify) {
    let active = true;
    let version = 0;
    const listener = Network.addNetworkStateListener((state) => {
      version++;
      if (active) notify(connectivityOnline(state));
    });
    const initialVersion = version;
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active && version === initialVersion) notify(connectivityOnline(state));
      })
      .catch(() => {
        if (active && version === initialVersion) notify(true);
      });
    return () => {
      active = false;
      listener.remove();
    };
  },
};
