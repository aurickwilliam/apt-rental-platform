const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

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

module.exports = withNativeWind(config, { input: './app/global.css' });
