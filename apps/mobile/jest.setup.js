/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Uniwind reads native appearance at import time. Tests get a controllable
// stand-in; override `useUniwind` / `Uniwind.setTheme` per test as needed.
jest.mock('uniwind', () => ({
  Uniwind: { setTheme: jest.fn(), currentTheme: 'light', hasAdaptiveThemes: true },
  useUniwind: jest.fn(() => ({ theme: 'light', hasAdaptiveThemes: true })),
}));

// Native keyboard module (ScreenWrapper's KeyboardAwareScrollView, root
// KeyboardProvider): use the library's own Jest mock.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
