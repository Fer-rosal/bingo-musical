#!/usr/bin/env bash
# =============================================================================
# setup-android-emulator.sh
# Idempotent setup script for Android development environment.
#
# Installs:
#   - Android SDK cmdline-tools
#   - SDK packages: platform-tools, platforms;android-33, build-tools;33.0.2,
#                   emulator, system-images;android-33;google_apis;x86_64
#   - AVD: bingo_musical_avd (Pixel 6, API 33, x86_64)
#   - Maestro E2E test runner
#
# Safe to re-run — all steps are guarded by existence checks.
#
# Usage:
#   bash scripts/setup-android-emulator.sh
#
# Disk space required: ~8 GB for system image + ~500 MB for APK artifacts.
# Ensure at least 15 GB free before running.
# =============================================================================

set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
CMDLINE_TOOLS_DIR="$ANDROID_HOME/cmdline-tools/latest"
MAESTRO_VERSION="1.38.1"

echo "[setup] ANDROID_HOME=$ANDROID_HOME"
mkdir -p "$ANDROID_HOME"

# ── Install cmdline-tools if not present ──────────────────────────────────────
if [[ ! -f "$CMDLINE_TOOLS_DIR/bin/sdkmanager" ]]; then
  echo "[setup] Downloading Android cmdline-tools..."
  TMP=$(mktemp -d)
  curl -fsSL "$CMDLINE_TOOLS_URL" -o "$TMP/cmdline-tools.zip"
  unzip -q "$TMP/cmdline-tools.zip" -d "$TMP"
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  mv "$TMP/cmdline-tools" "$CMDLINE_TOOLS_DIR"
  rm -rf "$TMP"
  echo "[setup] cmdline-tools installed."
else
  echo "[setup] cmdline-tools already installed — skipping."
fi

export PATH="$CMDLINE_TOOLS_DIR/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# ── Accept licenses ───────────────────────────────────────────────────────────
yes | sdkmanager --licenses > /dev/null 2>&1 || true

# ── Install SDK packages ──────────────────────────────────────────────────────
# Using google_apis (not google_apis_playstore) intentionally:
#   - Avoids Google Play license complexity
#   - Faster emulator boot
#   - Spotify cannot be installed, which is expected — tests use the fallback path
sdkmanager --install \
  "platform-tools" \
  "platforms;android-33" \
  "build-tools;33.0.2" \
  "emulator" \
  "system-images;android-33;google_apis;x86_64" \
  2>&1 | grep -E '^(Warning|Error|\[)' || true

# ── Create AVD ────────────────────────────────────────────────────────────────
AVD_NAME="bingo_musical_avd"
if ! avdmanager list avd | grep -q "$AVD_NAME"; then
  echo "[setup] Creating AVD $AVD_NAME..."
  echo "no" | avdmanager create avd \
    --name "$AVD_NAME" \
    --package "system-images;android-33;google_apis;x86_64" \
    --device "pixel_6" \
    --force
  echo "[setup] AVD created."
else
  echo "[setup] AVD $AVD_NAME already exists — skipping."
fi

# ── Install Maestro ───────────────────────────────────────────────────────────
if ! command -v maestro &>/dev/null; then
  echo "[setup] Installing Maestro $MAESTRO_VERSION..."
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  echo "[setup] Maestro installed. Add ~/.maestro/bin to your PATH."
else
  echo "[setup] Maestro already installed — skipping."
fi

echo ""
echo "[setup] Done. Add to your shell profile:"
echo "  export ANDROID_HOME=$ANDROID_HOME"
echo "  export PATH=\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator:\$HOME/.maestro/bin:\$PATH"
