const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');
// Metro doesn't expose metro-config as a direct dependency of the app, so resolve
// it relative to expo (which depends on it) the same way react/react-native are
// resolved below.
const exclusionList = require(
  require.resolve('metro-config/private/defaults/exclusionList', {
    paths: [require.resolve('expo/package.json')],
  })
).default;

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo (needed for shared packages)
config.watchFolders = [monorepoRoot];

// Let Metro resolve from the mobile app's node_modules first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Exclude test-only files and test tooling from Metro's resolver. watchFolders
// includes the whole monorepo, so without this Metro tries to bundle *.test.ts(x)
// files and packages like @testing-library/react-native / fast-check, which use
// Node built-ins (e.g. `console`) in ways Metro's app-runtime resolver can't handle.
config.resolver.blockList = exclusionList([
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /\/node_modules\/@testing-library\/.*/,
  /\/node_modules\/\.pnpm\/@testing-library\+.*/,
  /\/node_modules\/fast-check\/.*/,
  /\/node_modules\/\.pnpm\/fast-check@.*/,
]);

// Force single copies of react and react-native (prevents duplicate React in monorepo)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react-native') {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './app/global.css',
  dtsFile: './uniwind-types.d.ts',
});