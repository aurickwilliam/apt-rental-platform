import { fireEvent, render, screen } from '@testing-library/react-native';

import UploadId from './upload-id';
import { useVerificationStore, initialVerificationState } from '@/stores/useVerificationStore';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { textPrimary: '#333333', primary: '#376BF5', white: '#FFFFFF' },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));

// heroui-native ESM stub, matching the convention used elsewhere.
jest.mock('heroui-native', () => {
  const { View, Text, TouchableOpacity } = require('react-native');

  const ButtonRoot = ({ children, onPress, isDisabled, ...rest }: any) => (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} {...rest}>
      {children}
    </TouchableOpacity>
  );
  const ButtonLabel = ({ children }: any) => <Text>{children}</Text>;

  const CardRoot = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
  const Passthrough = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
  const TextPassthrough = ({ children, ...rest }: any) => <Text {...rest}>{children}</Text>;

  const ControlFieldRoot = ({ children, onSelectedChange }: any) => (
    <TouchableOpacity onPress={onSelectedChange}>{children}</TouchableOpacity>
  );

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
    CloseButton: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
    Card: Object.assign(CardRoot, {
      Header: Passthrough,
      Body: Passthrough,
      Footer: Passthrough,
      Title: TextPassthrough,
      Description: TextPassthrough,
    }),
    Checkbox: () => null,
    ControlField: Object.assign(ControlFieldRoot, { Indicator: Passthrough }),
    Label: Object.assign(Passthrough, { Text: TextPassthrough }),
  };
});

// UploadDocumentField relies on BottomSheet (reanimated) — stub with a
// minimal field exposing testable affordances, matching this file's needs.
jest.mock('@/components/inputs/UploadDocumentField', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ label, acceptedFileMimeTypes }: any) => (
      <View>
        <Text>{label}</Text>
        <Text testID={`accepted-mime-types-${label}`}>
          {JSON.stringify(acceptedFileMimeTypes)}
        </Text>
      </View>
    ),
  };
});

describe('UploadId conditional rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVerificationStore.setState({ ...initialVerificationState });
  });

  it('renders neither capture cards nor UploadDocumentFields when documentFormat is null (Req 1.1)', () => {
    render(<UploadId />);

    expect(screen.queryByText('Capture with camera')).toBeNull();
    expect(screen.queryByText('Front of ID:')).toBeNull();
    expect(screen.queryByText('Back of ID:')).toBeNull();
  });

  it('renders capture cards with no gallery/file picker affordance when documentFormat is physical (Req 1.5, 2.1)', () => {
    useVerificationStore.setState({ documentFormat: 'physical' });
    render(<UploadId />);

    expect(screen.getAllByText('Capture with camera')).toHaveLength(2);
    expect(screen.queryByText('Add document')).toBeNull();
  });

  it('tapping the front capture card navigates to live-capture with field=front', () => {
    useVerificationStore.setState({ documentFormat: 'physical' });
    render(<UploadId />);

    const cards = screen.getAllByText('Capture with camera');
    fireEvent.press(cards[0]);

    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/live-capture?field=front');
  });

  it('tapping the back capture card navigates to live-capture with field=back', () => {
    useVerificationStore.setState({ documentFormat: 'physical' });
    render(<UploadId />);

    const cards = screen.getAllByText('Capture with camera');
    fireEvent.press(cards[1]);

    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/live-capture?field=back');
  });

  it('renders UploadDocumentFields bound to frontResult/backResult with acceptedFileMimeTypes=["application/pdf"] when documentFormat is digital (Req 1.6, 4.1)', () => {
    useVerificationStore.setState({ documentFormat: 'digital' });
    render(<UploadId />);

    expect(screen.getByText('Front of ID:')).toBeTruthy();
    expect(screen.getByText('Back of ID:')).toBeTruthy();
    expect(screen.getByTestId('accepted-mime-types-Front of ID:').props.children).toBe(
      JSON.stringify(['application/pdf']),
    );
    expect(screen.getByTestId('accepted-mime-types-Back of ID:').props.children).toBe(
      JSON.stringify(['application/pdf']),
    );
  });

  it('switching documentFormat from physical to digital clears a camera-kind result, preserving the Format/Result Invariant (Req 5.4)', () => {
    useVerificationStore.setState({
      documentFormat: 'physical',
      frontResult: { kind: 'camera', asset: { uri: 'file://front.jpg', width: 100, height: 63 } },
      backResult: { kind: 'camera', asset: { uri: 'file://back.jpg', width: 100, height: 63 } },
    });
    render(<UploadId />);

    fireEvent.press(screen.getByText('Digital Document'));

    expect(useVerificationStore.getState().documentFormat).toBe('digital');
    expect(useVerificationStore.getState().frontResult).toBeNull();
    expect(useVerificationStore.getState().backResult).toBeNull();
  });

  it('switching documentFormat from digital to physical clears an image/file-kind result, preserving the Format/Result Invariant (Req 5.4)', () => {
    useVerificationStore.setState({
      documentFormat: 'digital',
      frontResult: { kind: 'file', asset: { uri: 'file://front.pdf', name: 'front.pdf' } as any },
      backResult: { kind: 'image', asset: { uri: 'file://back.jpg', width: 100, height: 63 } as any },
    });
    render(<UploadId />);

    fireEvent.press(screen.getByText('Physical ID'));

    expect(useVerificationStore.getState().documentFormat).toBe('physical');
    expect(useVerificationStore.getState().frontResult).toBeNull();
    expect(useVerificationStore.getState().backResult).toBeNull();
  });
});
