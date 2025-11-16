try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  require('dotenv').config();
} catch (error) {
  if (error && error.code !== 'MODULE_NOT_FOUND') {
    console.warn('Failed to load .env file:', error);
  }
}

export default ({ config }) => ({
  ...config,
  name: 'MSML Lifestyle',
  slug: 'msml-lifestyle-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'msml',
  userInterfaceStyle: 'automatic',
  jsEngine: 'hermes',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#010915',
  },
  assetBundlePatterns: ['**/*'],
  updates: {
    fallbackToCacheTimeout: 0,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.msml.lifestyle',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#010915',
    },
    package: 'com.msml.lifestyle',
  },
  web: {
    favicon: './assets/icon.png',
  },
  plugins: ['expo-secure-store', 'expo-font', 'expo-web-browser'],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000',
    webAppOrigin: process.env.EXPO_PUBLIC_WEB_APP_ORIGIN || 'http://localhost:4000',
  },
});
