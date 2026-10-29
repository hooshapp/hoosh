import { screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { RouteButton } from './route-button';

it('preserves actual Router navigation and link semantics with the shared presentation', async () => {
  await renderRouter({
    index: () => <RouteButton href="/(tabs)/settings" label="Open destination" />,
    '(tabs)/settings': () => <Text>Destination reached</Text>,
  });
  await userEvent.press(screen.getByRole('link', { name: 'Open destination' }));
  expect(await screen.findByText('Destination reached')).toBeVisible();
  expect(screen).toHavePathname('/settings');
});
