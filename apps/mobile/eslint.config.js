const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', '.next/*'],
  },
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './tsconfig.json',
          ],
        },
      },
    },
    rules: {
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
    },
  },
]);
