/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
    '^constants/(.*)$': '<rootDir>/constants/$1',
    '^assets/(.*)$': '<rootDir>/assets/$1',
  },
};
