import { fireEvent, render, screen } from '@testing-library/react-native';

import DateField from './DateField';
import { Keyboard, Platform } from 'react-native';
import { findAllInTree } from '../../tests/support/testTraversal';

jest.mock('hooks/useTheme', () => ({
  useColors: () => ({ colors: { gray400: '#9CA3AF' } }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: View };
});

it('only shows an independent clear button for a selected, editable date', async () => {
  const onClear = jest.fn();
  const onChange = jest.fn();
  const { rerender } = await render(
    <DateField label="Expiry date (optional)" value={null} onChange={onChange} onClear={onClear} />,
  );

  expect(screen.queryByLabelText('Clear expiry date')).toBeNull();

  await rerender(
    <DateField
      label="Expiry date (optional)"
      value={new Date(2027, 9, 3)}
      onChange={onChange}
      onClear={onClear}
    />,
  );

  await fireEvent.press(screen.getByLabelText('Clear expiry date'));
  expect(onClear).toHaveBeenCalledTimes(1);
  expect(onChange).not.toHaveBeenCalled();

  await rerender(
    <DateField label="Expiry date (optional)" value={new Date(2027, 9, 3)} onClear={onClear} disabled />,
  );
  expect(screen.queryByLabelText('Clear expiry date')).toBeNull();
});

it('passes the latest allowed day to the native picker and commits the chosen date', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  const onChange = jest.fn();
  const maximumDate = new Date(2026, 9, 17, 12);
  await render(<DateField label="Date paid" value={maximumDate} maximumDate={maximumDate} onChange={onChange} />);
  await fireEvent.press(screen.getByLabelText('Date paid'));
  expect(dismiss).toHaveBeenCalled();
  const picker = findAllInTree(screen.root!, (item) => item.props.mode === 'date')[0];
  expect(picker.props.maximumDate).toEqual(maximumDate);
  const selected = new Date(2026, 9, 5, 12);
  await fireEvent(picker, 'change', { type: 'set' }, selected);
  if (Platform.OS === 'ios') await fireEvent.press(screen.getByText('Done'));
  expect(onChange).toHaveBeenCalledWith(selected);
  dismiss.mockRestore();
});
