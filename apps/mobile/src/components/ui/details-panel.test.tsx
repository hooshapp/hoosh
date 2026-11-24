import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { DetailsPanel } from './details-panel';
function Draft() {
  const [value, setValue] = useState('');
  return <TextInput accessibilityLabel="Private draft" value={value} onChangeText={setValue} />;
}
it('keeps secondary controls out of initial traversal and preserves an opened draft across collapse', async () => {
  await render(<DetailsPanel title="Details" description="Saved preferences"><Draft /></DetailsPanel>);
  expect(screen.getByRole('button', { name: 'Details' }).props.accessibilityState.expanded).toBe(false);
  expect(screen.queryByLabelText('Private draft')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Details' }));
  await fireEvent.changeText(screen.getByLabelText('Private draft'), 'Unsaved choice');
  await fireEvent.press(screen.getByRole('button', { name: 'Details' }));
  expect(screen.queryByLabelText('Private draft')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Details' }));
  expect(screen.getByLabelText('Private draft')).toHaveDisplayValue('Unsaved choice');
  expect(screen.getByRole('button', { name: 'Details' }).props.accessibilityState.expanded).toBe(true);
});
