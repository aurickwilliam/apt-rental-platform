/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Shared pure logic is tested here because CI only runs the mobile suite.
  roots: ['<rootDir>', '<rootDir>/../../packages/passport'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
    '^constants/(.*)$': '<rootDir>/constants/$1',
    '^assets/(.*)$': '<rootDir>/assets/$1',
  },
};
