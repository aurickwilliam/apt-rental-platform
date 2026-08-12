import { fireEvent, render, screen } from '@testing-library/react-native';

import DocumentFormatSelector from './DocumentFormatSelector';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      primary: '#376BF5',
      textPrimary: '#333333',
    },
    isDark: false,
  }),
}));

// heroui-native ships ESM-only output that Jest's default
// transformIgnorePatterns does not transform. Stub the Card compound
// component with plain Views/Text, matching the convention already
// established in UploadDocumentField.test.tsx.
jest.mock('heroui-native', () => {
  const { View, Text } = require('react-native');

  const CardRoot = ({ children, ...rest }: { children: React.ReactNode }) => (
    <View {...rest}>{children}</View>
  );
  const Passthrough = ({ children, ...rest }: { children: React.ReactNode }) => (
    <View {...rest}>{children}</View>
  );
  const TextPassthrough = ({ children, ...rest }: { children: React.ReactNode }) => (
    <Text {...rest}>{children}</Text>
  );

  return {
    Card: Object.assign(CardRoot, {
      Header: Passthrough,
      Body: Passthrough,
      Footer: Passthrough,
      Title: TextPassthrough,
      Description: TextPassthrough,
    }),
  };
});

describe('DocumentFormatSelector', () => {
  it('calls onSelect("physical") when "Physical ID" is selected (Req 1.2)', () => {
    const onSelect = jest.fn();
    render(<DocumentFormatSelector value={null} onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Physical ID'));

    expect(onSelect).toHaveBeenCalledWith('physical');
  });

  it('calls onSelect("digital") when "Digital Document" is selected (Req 1.3)', () => {
    const onSelect = jest.fn();
    render(<DocumentFormatSelector value={null} onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Digital Document'));

    expect(onSelect).toHaveBeenCalledWith('digital');
  });

  it('calls onSelect with the newly selected value when re-selecting a different option after a value is already set (Req 1.7)', () => {
    const onSelect = jest.fn();
    render(<DocumentFormatSelector value="physical" onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Digital Document'));

    expect(onSelect).toHaveBeenCalledWith('digital');
  });

  it('renders both options as tappable regardless of the current value (Req 1.1)', () => {
    const onSelect = jest.fn();
    render(<DocumentFormatSelector value="digital" onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Physical ID'));
    fireEvent.press(screen.getByText('Digital Document'));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'physical');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'digital');
  });
});
