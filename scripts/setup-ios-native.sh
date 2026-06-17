#!/usr/bin/env bash
# ── setup-ios-native.sh ───────────────────────────────────────────────────────
# One-time setup for the Capacitor iOS platform + Spotify native SDK.
# Must run on macOS with Xcode installed.
# Usage: npm run setup:ios-native
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

log() { echo "[setup-ios] $*"; }
die() { echo "[setup-ios] ERROR: $*" >&2; exit 1; }

# ── 0. macOS guard ────────────────────────────────────────────────────────────
[[ "$(uname)" == "Darwin" ]] || die "This script must run on macOS (Xcode required)"

command -v xcodebuild &>/dev/null || die "Xcode not found — install from the App Store"
command -v node &>/dev/null       || die "Node not found"
command -v npm &>/dev/null        || die "npm not found"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_NATIVE_DIR="$SCRIPT_DIR/ios-native"

cd "$PROJECT_ROOT"

# ── 1. Install @capacitor/ios ─────────────────────────────────────────────────
if ! node -e "require('@capacitor/ios')" 2>/dev/null; then
    log "Installing @capacitor/ios..."
    npm install @capacitor/ios@"$(node -p "require('./package.json').dependencies['@capacitor/core']")"
else
    log "@capacitor/ios already installed"
fi

# ── 2. Add iOS platform ───────────────────────────────────────────────────────
if [[ ! -d "$PROJECT_ROOT/ios" ]]; then
    log "Adding Capacitor iOS platform..."
    npx cap add ios
else
    log "ios/ directory already exists — skipping cap add ios"
fi

# ── 3. Copy SpotifySDKPlugin.swift ────────────────────────────────────────────
PLUGIN_DST="$PROJECT_ROOT/ios/App/App/SpotifySDKPlugin.swift"
if [[ ! -f "$PLUGIN_DST" ]]; then
    log "Copying SpotifySDKPlugin.swift..."
    cp "$IOS_NATIVE_DIR/SpotifySDKPlugin.swift" "$PLUGIN_DST"
else
    log "SpotifySDKPlugin.swift already present — skipping copy"
fi

# ── 4. Manual steps ───────────────────────────────────────────────────────────
cat <<'EOF'

[setup-ios] ── Manual steps remaining (cannot be scripted) ─────────────────

STEP A — Download SpotifyiOS.framework
  1. Go to https://github.com/spotify/ios-sdk/releases
  2. Download the latest SpotifyiOS.xcframework (or .framework) zip
  3. Unzip it into ios/App/

STEP B — Link the framework in Xcode
  1. Open ios/App/App.xcworkspace in Xcode
  2. Select the App target → General → Frameworks, Libraries, and Embedded Content
  3. Click + → Add Files → choose SpotifyiOS.xcframework
  4. Set "Embed" to "Embed & Sign"
  5. In Build Settings → Other Linker Flags → add -ObjC

STEP C — Add Info.plist keys
  Open ios/App/App/Info.plist as Source Code and paste the contents of:
    scripts/ios-native/Info.plist.additions.xml
  into the root <dict>.

STEP D — Set SPOTIFY_CLIENT_ID build variable
  Xcode → App target → Build Settings → + → Add User-Defined Setting
  Name: SPOTIFY_CLIENT_ID
  Value (all configs): your Spotify Client ID

STEP E — Update AppDelegate.swift
  Follow the instructions in scripts/ios-native/AppDelegate.additions.swift
  to add the Spotify URL callback handler.

STEP F — Register redirect URI in Spotify Dashboard
  https://developer.spotify.com/dashboard → your app → Edit Settings
  Add redirect URI: bingo-musical://callback

STEP G — Sync and run
  npm run build:ios          # npx cap sync ios
  npx cap open ios           # opens Xcode
  # Build and run on a physical device (Simulator cannot run Spotify)

EOF
