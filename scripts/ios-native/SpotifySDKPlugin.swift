// SpotifySDKPlugin.swift
// Capacitor native plugin for iOS — mirrors android/app/src/main/.../SpotifySDKPlugin.kt
//
// Install location (after `npx cap add ios`):
//   ios/App/App/SpotifySDKPlugin.swift
//
// Requires SpotifyiOS.framework linked in the Xcode project (see docs/ios-spotify.md).
// Method return shapes MUST match the TypeScript interface in lib/spotify/capacitor-bridge.ts:
//   connect        → { connected: boolean, spotifyVersion?: string }
//   play           → { playing: boolean, trackId: string }
//   pause          → { paused: boolean }
//   resume         → { playing: boolean }
//   skipNext       → { skipped: boolean }
//   getCurrentTrack → { trackId?: string, isPlaying: boolean, position?: number }

import Foundation
import Capacitor
import SpotifyiOS

@objc(SpotifySDKPlugin)
public class SpotifySDKPlugin: CAPPlugin, SPTAppRemoteDelegate, SPTAppRemotePlayerStateDelegate {

    private var appRemote: SPTAppRemote?
    // ponytail: stored reference keeps the call alive through async Spotify auth redirect
    private var pendingConnectCall: CAPPluginCall?

    // Read from Info.plist key SPOTIFY_CLIENT_ID (set via Xcode Build Settings → User-Defined)
    private lazy var clientID: String = {
        Bundle.main.infoDictionary?["SPOTIFY_CLIENT_ID"] as? String ?? ""
    }()

    private let redirectURI = URL(string: "bingo-musical://callback")!

    override public func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSpotifyCallback(_:)),
            name: .spotifyCallback,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // Reconnect when app returns to foreground (Spotify may have disconnected)
    @objc private func handleAppBecomeActive() {
        guard let remote = appRemote, !remote.isConnected else { return }
        remote.connect()
    }

    // Disconnect when app goes to background — required by Spotify App Remote SDK
    @objc private func handleAppResignActive() {
        guard let remote = appRemote, remote.isConnected else { return }
        remote.disconnect()
    }

    // Called by AppDelegate after Spotify redirects back via bingo-musical://callback
    @objc private func handleSpotifyCallback(_ notification: Notification) {
        guard let url = notification.object as? URL,
              let params = appRemote?.authorizationParameters(from: url) else { return }

        if let token = params[SPTAppRemoteAccessTokenKey] as? String {
            appRemote?.connectionParameters.accessToken = token
            appRemote?.connect()
        } else if let errorDesc = params[SPTAppRemoteErrorDescriptionKey] as? String {
            NSLog("SpotifySDKPlugin: auth error from Spotify: %@", errorDesc)
            pendingConnectCall?.reject("Spotify auth failed: \(errorDesc)", "CONNECTION_FAILED")
            pendingConnectCall = nil
        }
    }

    // MARK: - Plugin Methods

    @objc func connect(_ call: CAPPluginCall) {
        guard !clientID.isEmpty else {
            call.reject("SPOTIFY_CLIENT_ID not set in Info.plist", "CONNECTION_FAILED")
            return
        }

        // Keep call alive until Spotify redirects back and appRemoteDidEstablishConnection fires
        call.keepAlive = true
        pendingConnectCall = call

        let config = SPTConfiguration(clientID: clientID, redirectURL: redirectURI)
        let remote = SPTAppRemote(configuration: config, logLevel: .debug)
        remote.delegate = self
        appRemote = remote

        // Must run on main thread — opens Spotify app for auth then returns via URL scheme
        DispatchQueue.main.async { remote.authorizeAndPlayURI("") }
    }

    @objc func play(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else {
            call.reject("Spotify not connected", "NOT_CONNECTED")
            return
        }
        guard let trackId = call.getString("trackId"), !trackId.isEmpty else {
            call.reject("trackId is required", "INVALID_ARGUMENT")
            return
        }

        let contextUri = call.getString("contextUri")
        let uri = (contextUri?.isEmpty == false) ? contextUri! : "spotify:track:\(trackId)"

        remote.playerAPI?.play(uri) { _, error in
            if let error = error {
                NSLog("SpotifySDKPlugin: play error: %@", error.localizedDescription)
                call.reject("Playback failed", "PLAYBACK_FAILED")
                return
            }
            call.resolve(["playing": true, "trackId": trackId])
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else {
            call.reject("Spotify not connected", "NOT_CONNECTED")
            return
        }

        remote.playerAPI?.pause { _, error in
            if let error = error {
                NSLog("SpotifySDKPlugin: pause error: %@", error.localizedDescription)
                call.reject("Pause failed", "PLAYBACK_FAILED")
                return
            }
            call.resolve(["paused": true])
        }
    }

    @objc func resume(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else {
            call.reject("Spotify not connected", "NOT_CONNECTED")
            return
        }

        remote.playerAPI?.resume { _, error in
            if let error = error {
                NSLog("SpotifySDKPlugin: resume error: %@", error.localizedDescription)
                call.reject("Resume failed", "PLAYBACK_FAILED")
                return
            }
            call.resolve(["playing": true])
        }
    }

    @objc func skipNext(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else {
            call.reject("Spotify not connected", "NOT_CONNECTED")
            return
        }

        remote.playerAPI?.skip(toNext: { _, error in
            if let error = error {
                NSLog("SpotifySDKPlugin: skipNext error: %@", error.localizedDescription)
                call.reject("Skip failed", "PLAYBACK_FAILED")
                return
            }
            call.resolve(["skipped": true])
        })
    }

    @objc func getCurrentTrack(_ call: CAPPluginCall) {
        guard let remote = appRemote, remote.isConnected else {
            call.reject("Spotify not connected", "NOT_CONNECTED")
            return
        }

        remote.playerAPI?.getPlayerState { result, error in
            if let error = error {
                NSLog("SpotifySDKPlugin: getCurrentTrack error: %@", error.localizedDescription)
                call.reject("Failed to get player state", "PLAYBACK_FAILED")
                return
            }

            guard let state = result as? SPTAppRemotePlayerState else {
                call.resolve(["isPlaying": false])
                return
            }

            var res: JSObject = ["isPlaying": !state.isPaused]
            if let track = state.track {
                res["trackId"] = track.uri.replacingOccurrences(of: "spotify:track:", with: "")
                res["position"] = state.playbackPosition
            }
            call.resolve(res)
        }
    }

    // MARK: - SPTAppRemoteDelegate

    public func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
        appRemote.playerAPI?.delegate = self
        pendingConnectCall?.resolve(["connected": true])
        pendingConnectCall = nil
    }

    public func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
        if let error = error {
            NSLog("SpotifySDKPlugin: disconnected: %@", error.localizedDescription)
        }
    }

    public func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
        let msg = error?.localizedDescription ?? "Unknown error"
        NSLog("SpotifySDKPlugin: connection failed: %@", msg)

        let msgLower = msg.lowercased()
        if msgLower.contains("not installed") || msgLower.contains("not found") || msgLower.contains("spotify") {
            pendingConnectCall?.reject("Spotify app not installed", "APP_NOT_INSTALLED")
        } else {
            pendingConnectCall?.reject("Failed to connect to Spotify", "CONNECTION_FAILED")
        }
        pendingConnectCall = nil
    }

    // MARK: - SPTAppRemotePlayerStateDelegate

    public func playerStateDidChange(_ playerState: SPTAppRemotePlayerState) {
        // State changes are handled per-call; no persistent subscription needed
    }
}

// MARK: - Notification name shared with AppDelegate.additions.swift
extension Notification.Name {
    static let spotifyCallback = Notification.Name("SpotifyCallbackURL")
}
