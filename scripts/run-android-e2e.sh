#!/usr/bin/env bash
# =============================================================================
# run-android-e2e.sh
# Android E2E test runner for Bingo Musical.
#
# Steps:
#   1. Validate prerequisites (APK exists, maestro installed)
#   2. Start emulator if not already running
#   3. Wait for emulator to boot
#   4. Install APK
#   5. Run all Maestro flows in e2e/maestro/
#   6. Tear down emulator (only if we started it)
#   7. Exit with Maestro's exit code
#
# Usage:
#   bash scripts/run-android-e2e.sh
#
# Prerequisites:
#   - Run scripts/setup-android-emulator.sh first
#   - Build APK: cd android && ./gradlew assembleDebug
#   - Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID before Gradle build for BuildConfig
#
# Environment variables:
#   ANDROID_HOME              Path to Android SDK (default: ~/Android/Sdk)
#   EMULATOR_BOOT_TIMEOUT     Seconds to wait for emulator boot (default: 300)
# =============================================================================

set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$HOME/.maestro/bin:$PATH"

AVD_NAME="bingo_musical_avd"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
EMULATOR_BOOT_TIMEOUT="${EMULATOR_BOOT_TIMEOUT:-300}"  # seconds

# ── Validate prerequisites ────────────────────────────────────────────────────
if [[ ! -f "$APK_PATH" ]]; then
  echo "[e2e] ERROR: APK not found at $APK_PATH"
  echo "[e2e] Build it first:"
  echo "  cd android && NEXT_PUBLIC_SPOTIFY_CLIENT_ID=\$NEXT_PUBLIC_SPOTIFY_CLIENT_ID ./gradlew assembleDebug"
  exit 1
fi

if ! command -v maestro &>/dev/null; then
  echo "[e2e] ERROR: maestro not found. Run:"
  echo "  bash scripts/setup-android-emulator.sh"
  exit 1
fi

# ── Start emulator if not running ────────────────────────────────────────────
EMULATOR_RUNNING=false
if adb devices | grep -q "emulator"; then
  echo "[e2e] Emulator already running."
  EMULATOR_RUNNING=true
else
  echo "[e2e] Starting emulator $AVD_NAME (headless)..."
  nohup emulator -avd "$AVD_NAME" -no-window -no-audio -gpu swiftshader_indirect \
    > /tmp/emulator.log 2>&1 &
  EMULATOR_PID=$!
  echo "[e2e] Emulator PID: $EMULATOR_PID"
fi

# ── Wait for boot ─────────────────────────────────────────────────────────────
echo "[e2e] Waiting for emulator to boot (timeout: ${EMULATOR_BOOT_TIMEOUT}s)..."
SECONDS_WAITED=0
until adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do
  if [[ $SECONDS_WAITED -ge $EMULATOR_BOOT_TIMEOUT ]]; then
    echo "[e2e] ERROR: Emulator boot timed out after ${EMULATOR_BOOT_TIMEOUT}s"
    echo "[e2e] Check /tmp/emulator.log for details."
    exit 1
  fi
  sleep 5
  SECONDS_WAITED=$((SECONDS_WAITED + 5))
done
echo "[e2e] Emulator ready (${SECONDS_WAITED}s)."
sleep 3  # Allow system services to settle before installing APK

# ── Install APK ───────────────────────────────────────────────────────────────
echo "[e2e] Installing APK from $APK_PATH..."
adb install -r "$APK_PATH"
echo "[e2e] APK installed."

# ── Run Maestro flows ─────────────────────────────────────────────────────────
echo "[e2e] Running Maestro E2E flows from e2e/maestro/..."
EXIT_CODE=0
maestro test e2e/maestro/ || EXIT_CODE=$?

# ── Cleanup ───────────────────────────────────────────────────────────────────
if [[ "$EMULATOR_RUNNING" == "false" ]]; then
  echo "[e2e] Shutting down emulator..."
  adb emu kill || true
fi

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "[e2e] All Maestro flows PASSED."
else
  echo "[e2e] One or more Maestro flows FAILED (exit code $EXIT_CODE)."
  echo "[e2e] Screenshots are saved to the working directory by Maestro."
fi
exit $EXIT_CODE
