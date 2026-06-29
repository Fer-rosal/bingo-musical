package com.bingomusical.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

/**
 * MainActivity — entry point for the Bingo Musical Android app.
 *
 * Registers native Capacitor plugins before the bridge initialises.
 * SpotifySDKPlugin is registered here so the JS layer can call:
 *   Capacitor.Plugins.SpotifySDK.connect() / play() / pause() / etc.
 */
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register SpotifySDK plugin BEFORE calling super.onCreate()
        // so Capacitor bridge discovers it during initialization
        registerPlugin(SpotifySDKPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
