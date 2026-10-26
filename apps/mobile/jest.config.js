/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // The shared-input regression tests exercise the installed HeroUI patch rather
  // than a stub. Keep Expo's exclusions, allowing this ESM package through Babel.
  transformIgnorePatterns: require('jest-expo/jest-preset').transformIgnorePatterns.map(
    (pattern) => pattern.replace('/node_modules/(?!', '/node_modules/(?!heroui-native/|'),
  ),
  // Shared pure logic is tested here because CI only runs the mobile suite.
  roots: [
    '<rootDir>',
    '<rootDir>/../../packages/i18n',
    '<rootDir>/../../packages/passport',
    '<rootDir>/../../packages/utils',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
    '^constants/(.*)$': '<rootDir>/constants/$1',
    '^assets/(.*)$': '<rootDir>/assets/$1',
  },
};
