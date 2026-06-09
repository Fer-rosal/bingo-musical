// Type-only import - the actual CapacitorConfig type definition is from Capacitor docs
// In practice, this will be typed by @capacitor/cli when installed
type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
  };
  plugins?: {
    [key: string]: unknown;
  };
};

const config: CapacitorConfig = {
  appId: process.env.NEXT_PUBLIC_CAPACITOR_ANDROID_APP_ID || 'com.bingo-musical.app',
  appName: 'Bingo Musical',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
    SpotifySDK: {
      // Spotify Android SDK native plugin configuration
      // This plugin must be implemented in android/app/src/main/kotlin
      redirectUrl: 'bingo-musical://callback',
    },
  },
};

export default config;
