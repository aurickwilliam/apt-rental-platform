import { fireEvent, render, screen } from '@testing-library/react-native';

import TutorialOverlay from './TutorialOverlay';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('heroui-native', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  function Button({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
    return <Pressable accessibilityRole="button" onPress={onPress}>{children}</Pressable>;
  }
  function Label({ children }: { children: React.ReactNode }) {
    return <Text>{children}</Text>;
  }
  Button.Label = Label;
  return { Button };
});
jest.mock('./targetRegistry', () => ({
  measureTutorialTarget: jest.fn(() => Promise.resolve(null)),
}));

const step = {
  id: 'tenant-explore' as const,
  title: 'Find an apartment',
  description: 'Browse listings.',
  targetKey: 'tab-search',
  mobileTab: 'search',
};

function setup(overrides: Partial<React.ComponentProps<typeof TutorialOverlay>> = {}) {
  const handlers = { onNext: jest.fn(), onBack: jest.fn(), onSkip: jest.fn() };
  render(<TutorialOverlay step={step} stepIndex={1} stepCount={4} {...handlers} {...overrides} />);
  return handlers;
}

describe('TutorialOverlay', () => {
  it('shows the progress, title and description', () => {
    setup();
    expect(screen.getByText('Step 2 of 4')).toBeTruthy();
    expect(screen.getByText('Find an apartment')).toBeTruthy();
    expect(screen.getByText('Browse listings.')).toBeTruthy();
  });

  it('wires Next, Back and Skip Tutorial', () => {
    const handlers = setup();
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Back'));
    fireEvent.press(screen.getByText('Skip Tutorial'));
    expect(handlers.onNext).toHaveBeenCalledTimes(1);
    expect(handlers.onBack).toHaveBeenCalledTimes(1);
    expect(handlers.onSkip).toHaveBeenCalledTimes(1);
  });

  it('offers Finish on the last step and no Back on the first', () => {
    setup({ stepIndex: 3 });
    expect(screen.getByText('Finish')).toBeTruthy();
  });

  it('has no Back button on the first step', () => {
    setup({ stepIndex: 0 });
    expect(screen.queryByText('Back')).toBeNull();
  });
});
