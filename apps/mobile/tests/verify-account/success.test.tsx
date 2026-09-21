import { fireEvent, render, screen } from '@testing-library/react-native';

import Success from '@/app/(auth)/verify-account/success';
import { initialVerificationState, useVerificationStore } from '@/stores/useVerificationStore';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { textPrimary: '#333333', primary: '#376BF5', success: '#22C55E' },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockReplace = jest.fn();
const mockAddListener = jest.fn();
const mockDispatch = jest.fn();
let latestBeforeRemoveHandler: ((e: { preventDefault: () => void }) => void) | null = null;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace }),
  useNavigation: () => ({
    addListener: (...args: any[]) => mockAddListener(...args),
    dispatch: (...args: any[]) => mockDispatch(...args),
  }),
}));

let mockProfile: { role: string } | null = { role: 'tenant' };
jest.mock('hooks/auth', () => ({
  useProfile: () => ({ profile: mockProfile, loading: false, refetch: jest.fn() }),
}));

jest.mock('constants/images', () => ({
  IMAGES: { userCheck: 'user-check.png' },
}));

// HeroUI Native ESM stub, matching the convention used elsewhere.
jest.mock('heroui-native', () => {
  const { Text, TouchableOpacity } = require('react-native');

  const ButtonRoot = ({ children, onPress, isDisabled, ...rest }: any) => (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} {...rest}>
      {children}
    </TouchableOpacity>
  );
  const ButtonLabel = ({ children }: any) => <Text>{children}</Text>;

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
  };
});

describe('Success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestBeforeRemoveHandler = null;
    mockProfile = { role: 'tenant' };
    mockAddListener.mockImplementation((_event: string, handler: any) => {
      latestBeforeRemoveHandler = handler;
      return jest.fn();
    });
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
    });
  });

  function fireBeforeRemove() {
    const preventDefault = jest.fn();
    latestBeforeRemoveHandler?.({ preventDefault });
    return preventDefault;
  }

  it('renders the submitted state and resets the verification session on mount', () => {
    render(<Success />);

    expect(screen.getByText('Verification Submitted')).toBeTruthy();
    expect(screen.getByText('Go to Profile')).toBeTruthy();
    expect(useVerificationStore.getState()).toEqual(
      expect.objectContaining(initialVerificationState),
    );
  });

  it('blocks back navigation while on the terminal screen', () => {
    render(<Success />);

    expect(mockAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));

    const preventDefault = fireBeforeRemove();
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('routes tenants to the tenant profile and allows leaving', () => {
    render(<Success />);

    fireEvent.press(screen.getByText('Go to Profile'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/(tenant)/profile');

    const preventDefault = fireBeforeRemove();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('routes landlords to the landlord profile', () => {
    mockProfile = { role: 'landlord' };
    render(<Success />);

    fireEvent.press(screen.getByText('Go to Profile'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/(landlord)/profile');
  });
});
