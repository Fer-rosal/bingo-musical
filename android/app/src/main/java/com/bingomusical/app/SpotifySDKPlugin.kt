package com.bingomusical.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import com.spotify.protocol.types.Track

/**
 * SpotifySDKPlugin — Capacitor native plugin for Android
 *
 * Implements the CapacitorSpotifyPlugin interface defined in lib/spotify/capacitor-bridge.ts.
 * Controls Spotify playback via the Spotify App Remote SDK (com.spotify.android:app-remote:0.8.0).
 *
 * Method return shapes MUST match the TypeScript interface exactly:
 *   connect  → { connected: boolean, spotifyVersion?: string }
 *   play     → { playing: boolean, trackId: string }
 *   pause    → { paused: boolean }
 *   resume   → { playing: boolean }
 *   skipNext → { skipped: boolean }
 *   getCurrentTrack → { trackId?: string, isPlaying: boolean, position?: number }
 */
@CapacitorPlugin(name = "SpotifySDK")
class SpotifySDKPlugin : Plugin() {

    private var spotifyAppRemote: SpotifyAppRemote? = null

    // SPOTIFY_CLIENT_ID is injected at Gradle build time from NEXT_PUBLIC_SPOTIFY_CLIENT_ID env var.
    // It is NOT hardcoded in source — see android/app/build.gradle buildConfigField.
    private val CLIENT_ID: String = BuildConfig.SPOTIFY_CLIENT_ID
    private val REDIRECT_URI = "bingo-musical://callback"

    /**
     * Connect to the Spotify app via App Remote SDK.
     *
     * On emulators without Spotify installed, onFailure is called immediately with
     * a message containing "CouldNotFindSpotifyApp". The bridge returns APP_NOT_INSTALLED
     * so the JS layer can set shouldFallback: true.
     *
     * Returns: { connected: true } on success
     * Rejects: "APP_NOT_INSTALLED" | "CONNECTION_FAILED"
     */
    @PluginMethod
    fun connect(call: PluginCall) {
        val connectionParams = ConnectionParams.Builder(CLIENT_ID)
            .setRedirectUri(REDIRECT_URI)
            .showAuthView(true)
            .build()

        SpotifyAppRemote.connect(
            context,
            connectionParams,
            object : Connector.ConnectionListener {
                override fun onConnected(appRemote: SpotifyAppRemote) {
                    spotifyAppRemote = appRemote
                    val ret = JSObject()
                    ret.put("connected", true)
                    call.resolve(ret)
                }

                override fun onFailure(throwable: Throwable) {
                    val message = throwable.message ?: "Unknown error"
                    // Log details server-side only — do not expose internals to client
                    bridge.activity.runOnUiThread {
                        android.util.Log.e("SpotifySDKPlugin", "connect onFailure: $message", throwable)
                    }
                    if (message.contains("AUTHENTICATION_SERVICE_UNAVAILABLE", ignoreCase = true) ||
                        message.contains("CouldNotFindSpotifyApp", ignoreCase = true) ||
                        message.contains("SpotifyDisconnectedException", ignoreCase = true)
                    ) {
                        call.reject("APP_NOT_INSTALLED", "Spotify app not installed")
                    } else {
                        call.reject("CONNECTION_FAILED", "Failed to connect to Spotify")
                    }
                }
            }
        )
    }

    /**
     * Play a track by trackId or contextUri.
     *
     * Input: { trackId: string, contextUri?: string }
     * Returns: { playing: true, trackId: string }
     * Rejects: "NOT_CONNECTED" | "INVALID_ARGUMENT" | "PLAYBACK_FAILED"
     */
    @PluginMethod
    fun play(call: PluginCall) {
        val remote = spotifyAppRemote
        if (remote == null || !remote.isConnected) {
            call.reject("NOT_CONNECTED", "Spotify not connected")
            return
        }

        val trackId = call.getString("trackId")
        if (trackId.isNullOrBlank()) {
            call.reject("INVALID_ARGUMENT", "trackId is required")
            return
        }

        val contextUri = call.getString("contextUri")
        val spotifyUri = if (!contextUri.isNullOrBlank()) contextUri else "spotify:track:$trackId"

        remote.playerApi.play(spotifyUri)
            .setResultCallback {
                val ret = JSObject()
                ret.put("playing", true)
                ret.put("trackId", trackId)
                call.resolve(ret)
            }
            .setErrorCallback { throwable ->
                android.util.Log.e("SpotifySDKPlugin", "play error: ${throwable.message}", throwable)
                call.reject("PLAYBACK_FAILED", "Playback failed")
            }
    }

    /**
     * Pause current playback.
     *
     * Returns: { paused: true }
     * Rejects: "NOT_CONNECTED" | "PLAYBACK_FAILED"
     */
    @PluginMethod
    fun pause(call: PluginCall) {
        val remote = spotifyAppRemote
        if (remote == null || !remote.isConnected) {
            call.reject("NOT_CONNECTED", "Spotify not connected")
            return
        }

        remote.playerApi.pause()
            .setResultCallback {
                val ret = JSObject()
                ret.put("paused", true)
                call.resolve(ret)
            }
            .setErrorCallback { throwable ->
                android.util.Log.e("SpotifySDKPlugin", "pause error: ${throwable.message}", throwable)
                call.reject("PLAYBACK_FAILED", "Pause failed")
            }
    }

    /**
     * Resume paused playback.
     *
     * Returns: { playing: true }
     * Rejects: "NOT_CONNECTED" | "PLAYBACK_FAILED"
     */
    @PluginMethod
    fun resume(call: PluginCall) {
        val remote = spotifyAppRemote
        if (remote == null || !remote.isConnected) {
            call.reject("NOT_CONNECTED", "Spotify not connected")
            return
        }

        remote.playerApi.resume()
            .setResultCallback {
                val ret = JSObject()
                ret.put("playing", true)
                call.resolve(ret)
            }
            .setErrorCallback { throwable ->
                android.util.Log.e("SpotifySDKPlugin", "resume error: ${throwable.message}", throwable)
                call.reject("PLAYBACK_FAILED", "Resume failed")
            }
    }

    /**
     * Skip to next track.
     *
     * Returns: { skipped: true }
     * Rejects: "NOT_CONNECTED" | "PLAYBACK_FAILED"
     */
    @PluginMethod
    fun skipNext(call: PluginCall) {
        val remote = spotifyAppRemote
        if (remote == null || !remote.isConnected) {
            call.reject("NOT_CONNECTED", "Spotify not connected")
            return
        }

        remote.playerApi.skipNext()
            .setResultCallback {
                val ret = JSObject()
                ret.put("skipped", true)
                call.resolve(ret)
            }
            .setErrorCallback { throwable ->
                android.util.Log.e("SpotifySDKPlugin", "skipNext error: ${throwable.message}", throwable)
                call.reject("PLAYBACK_FAILED", "Skip failed")
            }
    }

    /**
     * Get info about the currently playing track.
     *
     * Returns: { isPlaying: boolean, trackId?: string, position?: number }
     * Rejects: "NOT_CONNECTED" | "PLAYBACK_FAILED"
     */
    @PluginMethod
    fun getCurrentTrack(call: PluginCall) {
        val remote = spotifyAppRemote
        if (remote == null || !remote.isConnected) {
            call.reject("NOT_CONNECTED", "Spotify not connected")
            return
        }

        remote.playerApi.playerState
            .setResultCallback { state ->
                val track: Track? = state.track
                val ret = JSObject()
                ret.put("isPlaying", !state.isPaused)
                if (track != null) {
                    // Strip "spotify:track:" prefix to return only the track ID
                    ret.put("trackId", track.uri.removePrefix("spotify:track:"))
                    ret.put("position", state.playbackPosition)
                }
                call.resolve(ret)
            }
            .setErrorCallback { throwable ->
                android.util.Log.e("SpotifySDKPlugin", "getCurrentTrack error: ${throwable.message}", throwable)
                call.reject("PLAYBACK_FAILED", "Failed to get player state")
            }
    }

    /**
     * Disconnect from Spotify App Remote when the plugin is destroyed.
     * Called by Capacitor when the Activity is destroyed.
     */
    override fun handleOnDestroy() {
        SpotifyAppRemote.disconnect(spotifyAppRemote)
        spotifyAppRemote = null
        super.handleOnDestroy()
    }
}
