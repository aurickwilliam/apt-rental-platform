// Hides the floating "Dev" button that expo-dev-menu overlays on debug builds.
// The dev menu is still reachable via shake / the dev server's `m` key.
const { withAndroidManifest, withInfoPlist } = require('expo/config-plugins');

const KEY = 'EXDevMenuShowFloatingActionButton';

module.exports = function withHiddenDevMenuButton(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults[KEY] = false;
    return cfg;
  });

  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app['meta-data'] = (app['meta-data'] ?? []).filter((m) => m.$['android:name'] !== KEY);
    app['meta-data'].push({ $: { 'android:name': KEY, 'android:value': 'false' } });
    return cfg;
  });
};
