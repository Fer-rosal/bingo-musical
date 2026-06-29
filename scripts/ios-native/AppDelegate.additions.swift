// AppDelegate.additions.swift
// Merge these changes into ios/App/App/AppDelegate.swift after `npx cap add ios`.
//
// The generated AppDelegate already has `application(_:open:url:options:)`.
// Replace that method with the version below, then add the import and the
// Notification.Name extension at the bottom.
//
// ── STEP 1: Add import at top of AppDelegate.swift ─────────────────────────
//
//   import SpotifyiOS
//
// ── STEP 2: Replace application(_:open:url:options:) ───────────────────────
//
//   The generated method looks like:
//
//     func application(_ app: UIApplication, open url: URL,
//                      options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
//         return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
//     }
//
//   Replace it with:

import UIKit
import Capacitor
import SpotifyiOS

// Place this in AppDelegate, replacing the existing open-url handler:
extension AppDelegate {
    func application(_ app: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Forward Spotify auth callback to SpotifySDKPlugin via NotificationCenter
        if url.scheme == "bingo-musical" {
            NotificationCenter.default.post(name: .spotifyCallback, object: url)
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }
}

// ── STEP 3: Add Notification.Name extension ─────────────────────────────────
// (Already defined in SpotifySDKPlugin.swift — do NOT duplicate it here.
//  Swift will find the extension from either file in the same module.)

// ── WHY THIS PATTERN ────────────────────────────────────────────────────────
// The Spotify iOS SDK calls application(_:open:url:options:) on the AppDelegate
// when the user finishes auth in the Spotify app and is redirected back via the
// bingo-musical:// URL scheme. We broadcast it as a Notification so
// SpotifySDKPlugin can pick it up without AppDelegate importing Capacitor internals.
