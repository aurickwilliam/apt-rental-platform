const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    files: ['components/finance/**/*.tsx'],
    ignores: ['components/finance/**/*.test.tsx'],
    rules: {
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
    },
  },
  {
    ignores: ['dist/*', '.expo/*', '.next/*'],
  },
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/no-unresolved': ['error', {
        ignore: [
          '^components/',
          '^constants/',
          '^hooks/',
          '^assets/',
          '^@repo/',
        ],
      }],
      'import/no-duplicates': 'error',
    },
  },
]);
