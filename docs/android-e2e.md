# Android E2E Testing Guide

End-to-end tests for the Bingo Musical Android app using a headless AVD emulator and Maestro.

## Prerequisites

- Linux (Ubuntu 22.04+) or macOS
- Java 17+ (`java -version`)
- Node.js 20+ and npm
- ~15 GB free disk space (Android SDK + AVD + APK)
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` set in your environment

## One-time setup

```bash
npm run setup:android-emulator
```

This script is idempotent — safe to re-run. It installs:
- Android SDK command-line tools
- SDK packages: `platform-tools`, `emulator`, `system-images;android-33;google_apis;x86_64`
- AVD named `bingo_musical_avd` (API 33, headless-compatible)
- [Maestro](https://maestro.mobile.dev/) test runner

## Build the APK

```bash
npm run build:android        # cap sync (run after next build)
npm run build:android:debug  # Gradle assembleDebug → android/app/build/outputs/apk/debug/app-debug.apk
```

## Run E2E tests

```bash
npm run test:android
```

This will:
1. Boot `bingo_musical_avd` headlessly (`-no-window -no-audio`)
2. Wait for the emulator to fully boot
3. Install the debug APK via `adb`
4. Run all Maestro flows in `e2e/maestro/`
5. Print results and tear down the emulator

Exit code is non-zero on any test failure.

## Test flows

| File | What it tests |
|------|---------------|
| `e2e/maestro/android-app-launch.yaml` | App launches, connect button is visible |
| `e2e/maestro/android-spotify-fallback.yaml` | No Spotify installed → status message + retry button appear |

## Happy path (requires physical device with Spotify)

The emulator-based tests cover the **fallback path** (Spotify not installed). The full happy path — native Spotify connection and song reveal — requires a physical Android device with the Spotify app installed.

To run on a physical device:
```bash
adb devices                # confirm device is listed
npx cap run android        # build + install + launch
```

Then test manually:
1. Tap "Connect to Spotify" → native Spotify should open and authorize
2. Navigate to host page → green "Connected via native Spotify" banner appears
3. Reveal a song → Spotify plays it natively

## OAuth deep link on emulator

For testing OAuth redirect flows on the emulator, fire the callback intent directly:
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "bingo-musical://callback?code=TEST&state=TEST"
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ANDROID_HOME not set` | Re-run `npm run setup:android-emulator`; open a new terminal |
| `emulator: not found` | Add `$ANDROID_HOME/emulator` to PATH |
| `adb: device offline` | Wait longer for boot; increase `wait_for_boot` timeout in `run-android-e2e.sh` |
| Gradle build fails | Ensure `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` is exported; run `npm run build:android` first |
| Maestro not found | Re-run setup script; check `~/.maestro/bin` is in PATH |
| App crashes on launch | Check `adb logcat` for missing env vars or Firebase config issues |

## Spotify SDK note

The native Spotify plugin uses the [Spotify App Remote SDK](https://developer.spotify.com/documentation/android).
The APK will connect to the native Spotify app — it does **not** stream audio itself.
The emulator tests intentionally skip Spotify connection (no Spotify app present) and validate only the fallback UI.
