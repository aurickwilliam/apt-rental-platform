/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// jest-expo's preset `require('expo/src/winter')` installs the fetch family
// (fetch, Headers, Request, Response, URL, ...) as lazy global accessors in
// every test environment. First access requires ExpoFetchModule and
// expo-modules-core; when that first access happens late (an async tail after
// a suite finished), the require's warning escapes teardown ("Cannot log after
// tests are done") and its unresolved work can trip up whatever suite runs
// next in the worker - CI once blamed service/chat/chatCompression.test.ts
// for a TypeError its own file cannot reproduce (the handful of flaky
// parallel runs reproduced blame-shifting instead). Settle every
// lazy global once at setup: reading evaluates the accessor once (its warning
// lands in a live environment) and assigning back goes through the accessor's
// own setter, which replaces the getter with a plain value.
const EXPO_LAZY_GLOBALS = [
  'Headers',
  'Request',
  'Response',
  'fetch',
  'URL',
  'URLSearchParams',
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'DOMException',
  'structuredClone',
  '__ExpoImportMetaRegistry',
];

for (const name of EXPO_LAZY_GLOBALS) {
  try {
    const value = globalThis[name];
    if (value !== undefined) {
      globalThis[name] = value;
    }
  } catch {
    // Keep the original property (still lazy) if evaluation fails here;
    // behavior then matches the unpatched runtime.
  }
}

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

// expo-updates is native: tests get a disabled (development-style) stand-in.
jest.mock('expo-updates', () => ({
  isEnabled: false,
  isEmbeddedLaunch: true,
  updateId: null,
  channel: null,
  useUpdates: jest.fn(() => ({ isUpdatePending: false, isUpdateAvailable: false })),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

// The captcha WebView is native; screens only need it to render nothing.
jest.mock('react-native-webview', () => ({ WebView: () => null }));
