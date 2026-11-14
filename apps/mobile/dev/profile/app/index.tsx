import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { connect, useRuntime } from '../runtime';

export default function Index() {
  const { runtime, install } = useRuntime();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const generation = useRef(0);
  const connectAccount = (nativeQuests: boolean) => {
    if (busy || !token) return;
    setBusy(true);
    setFailed(null);
    void connect(token, ++generation.current, nativeQuests)
      .then((next) => {
        setToken('');
        install(next);
      })
      .catch((error: unknown) => {
        setToken('');
        setFailed(
          error instanceof Error &&
            [
              'Token expired or invalid.',
              'API rejected verification.',
              'Invalid identity.',
              'Quest device bridge is unavailable in this build.',
            ].includes(error.message)
            ? error.message
            : 'Could not reach the local API.',
        );
      })
      .finally(() => setBusy(false));
  };
  return (
    <Screen title="Profile device QA">
      <View style={{ gap: 16 }}>
        <Text>
          RN07_DEVICE_QA_ONLY — Real API, operator token. This does not test the
          Auth SDK.
        </Text>
        <Text>
          Quest device QA uses a separate native owner namespace. Connect only
          verifies identity; claiming this device and installing protection
          require separate explicit actions.
        </Text>
        {runtime ? (
          <>
            <Button
              label="Open live Settings"
              onPress={() => router.push('./profile')}
            />
            <Button
              label="Open live Quests"
              onPress={() => router.push('./quests')}
            />
            <Button
              label="Open live History"
              onPress={() => router.push('./history')}
            />
            <Button
              label="Open live Home"
              onPress={() => router.push('./home')}
            />
            {runtime.nativeOwner ? (
              <Text>
                Quest device controls connected. Native actions are real;
                account/session setup remains QA only.
              </Text>
            ) : null}
            <Button
              label="Lose next save response"
              variant="secondary"
              onPress={() => runtime.dropNext()}
            />
            <Button
              label="Disconnect QA account"
              variant="secondary"
              onPress={() => install(null)}
            />
          </>
        ) : (
          <>
            <TextInput
              accessibilityLabel="Private access token"
              value={token}
              onChangeText={setToken}
              secureTextEntry
              autoCorrect={false}
              autoCapitalize="none"
              style={{ borderWidth: 1, padding: 12 }}
            />
            <Button
              label="Connect QA account"
              disabled={!token || busy}
              busy={busy}
              onPress={() => connectAccount(false)}
            />
            <Button
              label="Connect quest device QA"
              disabled={!token || busy}
              busy={busy}
              onPress={() => connectAccount(true)}
            />
            {failed ? <Text>{failed}</Text> : null}
          </>
        )}
      </View>
    </Screen>
  );
}
