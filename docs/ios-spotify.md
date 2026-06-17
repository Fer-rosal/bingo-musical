# iOS Spotify Native Integration

Native Spotify playback on iOS via Capacitor + SpotifyiOS App Remote SDK.
Mirrors the Android implementation (`android/app/src/main/.../SpotifySDKPlugin.kt`).

## Requirements

- macOS + Xcode (iOS build cannot be done on Linux)
- Physical iOS device (Simulator cannot run Spotify)
- Spotify app installed and user logged in on the device
- Node 18+

## One-time setup

```bash
npm run setup:ios-native
```

The script handles steps 1–3 automatically. Steps A–G in the script output are manual Xcode operations.

## Architecture

```
iOS Spotify app
      ↑ App Remote SDK (SPTAppRemote)
SpotifySDKPlugin.swift          ← scripts/ios-native/SpotifySDKPlugin.swift
      ↑ Capacitor bridge
lib/spotify/capacitor-bridge.ts  ← JS plugin interface (shared with Android)
      ↑
useSpotifyPlayback hook          ← React hook used by host page
```

The `detectPlatform()` function in `capacitor-bridge.ts` returns `'ios'` when running inside a Capacitor iOS app. The bridge then activates the native `SpotifySDK` Capacitor plugin instead of falling back to the web OAuth flow.

## Authentication flow (iOS vs Android)

| | Android | iOS |
|---|---|---|
| Auth initiation | `SpotifyAppRemote.connect()` | `SPTAppRemote.authorizeAndPlayURI("")` |
| Redirect back | Intent filter (AndroidManifest) | URL scheme (Info.plist CFBundleURLTypes) |
| Token delivery | `onConnected` callback | `application(_:open:url:options:)` in AppDelegate |
| Connection delegate | `Connector.ConnectionListener` | `SPTAppRemoteDelegate` |

iOS requires an extra step: Spotify redirects to `bingo-musical://callback` after auth, the AppDelegate captures it, broadcasts a `SpotifyCallbackURL` notification, and the plugin handles it to complete the connection.

## Info.plist keys

See `scripts/ios-native/Info.plist.additions.xml` for the exact XML to add:

| Key | Value | Purpose |
|---|---|---|
| `LSApplicationQueriesSchemes` | `["spotify"]` | Check if Spotify is installed |
| `CFBundleURLSchemes` | `["bingo-musical"]` | Receive auth callback from Spotify |
| `SPOTIFY_CLIENT_ID` | `$(SPOTIFY_CLIENT_ID)` | Read by plugin at runtime |

## Spotify Dashboard

Register `bingo-musical://callback` as a redirect URI in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) under your app settings.

## Building

```bash
npm run build          # build Next.js (Capacitor uses server.url, not local files)
npm run build:ios      # npx cap sync ios — copies web assets and updates native project
npx cap open ios       # open Xcode
```

Build and run on a **physical device** — Simulator does not support the Spotify app.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `SPOTIFY_CLIENT_ID not set` | Add `SPOTIFY_CLIENT_ID` to Xcode Build Settings (User-Defined) |
| `Spotify app not installed` | Install Spotify on the device and log in |
| `bingo-musical://` not handled | Verify `CFBundleURLSchemes` in Info.plist and `bingo-musical://callback` in Spotify Dashboard |
| Build fails: `No such module SpotifyiOS` | Framework not linked — check Build Settings → Other Linker Flags → `-ObjC` |
| App does not reconnect on foreground | `applicationDidBecomeActive` should call `appRemote.connect()` — verify AppDelegate additions |
| Simulator: connect always fails | Physical device required; Simulator cannot run Spotify |
