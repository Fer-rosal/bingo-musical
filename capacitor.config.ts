// Type-only import - the actual CapacitorConfig type definition is from Capacitor docs
// In practice, this will be typed by @capacitor/cli when installed
type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    iosScheme?: string;
    url?: string;
  };
  plugins?: {
    [key: string]: unknown;
  };
};

const config: CapacitorConfig = {
  // ARCHITECT_NOTE: Capacitor requires Java package format (no dashes). com.bingo-musical.app
  // is invalid on Android. Using com.bingomusical.app as the canonical package name, matching
  // the Kotlin source package. Flagging for Architect review.
  appId: process.env.NEXT_PUBLIC_CAPACITOR_ANDROID_APP_ID || 'com.bingomusical.app',
  appName: 'Bingo Musical',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // WebView loads from the deployed app URL so server-side API routes keep working.
    // Set NEXT_PUBLIC_APP_URL in .env.local for local dev (e.g. http://localhost:3000).
    url: process.env.NEXT_PUBLIC_APP_URL,
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
