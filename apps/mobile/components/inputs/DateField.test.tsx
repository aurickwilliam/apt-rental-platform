import { fireEvent, render, screen } from '@testing-library/react-native';

import DateField from './DateField';

jest.mock('hooks/useTheme', () => ({
  useColors: () => ({ colors: { gray400: '#9CA3AF' } }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: View };
});

it('only shows an independent clear button for a selected, editable date', () => {
  const onClear = jest.fn();
  const onChange = jest.fn();
  const { rerender } = render(
    <DateField label="Expiry date (optional)" value={null} onChange={onChange} onClear={onClear} />,
  );

  expect(screen.queryByLabelText('Clear expiry date')).toBeNull();

  rerender(
    <DateField
      label="Expiry date (optional)"
      value={new Date(2027, 9, 3)}
      onChange={onChange}
      onClear={onClear}
    />,
  );

  fireEvent.press(screen.getByLabelText('Clear expiry date'));
  expect(onClear).toHaveBeenCalledTimes(1);
  expect(onChange).not.toHaveBeenCalled();

  rerender(
    <DateField label="Expiry date (optional)" value={new Date(2027, 9, 3)} onClear={onClear} disabled />,
  );
  expect(screen.queryByLabelText('Clear expiry date')).toBeNull();
});
