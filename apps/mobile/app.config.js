// Dynamic Expo config — reads EXPO_PUBLIC_GOOGLE_MAPS_API_KEY at prebuild time.
// Replaces the static app.json which used a literal "${...}" placeholder that Expo never interpolates.

// Expo CLI loads .env automatically before evaluating this file, but a bare `node app.config.js`
// (e.g. quick validation) does not — so load it ourselves if present.
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath) && !process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim().replace(/^['"]|['"]$/g, '');
      if (!(k in process.env) && k.startsWith('EXPO_PUBLIC_')) process.env[k] = v;
    }
  }
} catch {}

/**
 * Returns the Google Maps key from env (inlined at prebuild) or from Constants.extra
 * (EAS secrets injected as extra). Fail fast when missing so native never bakes a
 * garbage literal that produces blank tiles.
 */
function resolveGoogleMapsKey() {
  const raw =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    // Fallback for EAS where secrets may surface via extra (defensive)
    undefined;
  const key = typeof raw === 'string' ? raw.trim() : '';
  // During local dev without a key we still allow prebuild to succeed with a
  // placeholder — the JS-side isGoogleMapsEnabled() gate falls back gracefully.
  // For production builds, require the key.
  if (!key && process.env.EAS_BUILD === 'true') {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY — set it in apps/mobile/.env (local) or as an EAS secret (remote). ' +
        'The Maps SDK will render blank tiles without it.',
    );
  }
  return key;
}

const googleMapsKey = resolveGoogleMapsKey();

/**
 * Returns the google-services.json path. Local dev uses the gitignored
 * `./google-services.json`; EAS Build only uploads git-tracked files, so remote
 * builds use the GOOGLE_SERVICES_JSON file secret (EAS exposes file secrets as
 * the path to the uploaded file).
 */
function resolveGoogleServicesFile() {
  if (process.env.GOOGLE_SERVICES_JSON) return process.env.GOOGLE_SERVICES_JSON;
  return './google-services.json';
}

const googleServicesFile = resolveGoogleServicesFile();

module.exports = {
  expo: {
    name: 'APT',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.aurickwilliam.apt',
      supportsTablet: true,
      icon: {
        dark: './assets/icons/ios/ios-dark.png',
        light: './assets/icons/ios/ios-light.png',
        tinted: './assets/icons/ios/ios-tinted.png',
      },
      config: {
        googleMapsApiKey: googleMapsKey,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'APT uses your camera to capture a clear photo of your ID for identity verification.',
        NSPhotoLibraryUsageDescription: 'APT accesses your photo library so you can upload a digital copy of your ID.',
        NSLocationWhenInUseUsageDescription:
          'APT uses your location to show nearby apartments on the map and to pin your property\u2019s exact location.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'APT uses your location to show nearby apartments on the map.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#376BF5',
        foregroundImage: './assets/icons/android/adaptive-icon.png',
      },
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'pan',
      package: 'com.aurickwilliam.apt',
      googleServicesFile,
      permissions: ['android.permission.CAMERA', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: googleMapsKey,
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/logo.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/icons/splash/splash-icon-light.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#376BF5',
          dark: {
            image: './assets/icons/splash/splash-icon-dark.png',
            backgroundColor: '#ffffff',
          },
        },
      ],
      'expo-font',
      'expo-image',
      [
        'expo-notifications',
        {
          color: '#376BF5',
          defaultChannel: 'default',
          sounds: [],
        },
      ],
      '@maplibre/maplibre-react-native',
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: googleMapsKey,
          androidGoogleMapsApiKey: googleMapsKey,
        },
      ],
      '@react-native-community/datetimepicker',
      'expo-web-browser',
      'expo-video',
      [
        'expo-camera',
        {
          cameraPermission: 'APT uses your camera to capture a clear photo of your ID for identity verification.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: '77aa8e10-d0f8-4f0c-8323-33d7d7fb31eb',
      },
    },
  },
};
