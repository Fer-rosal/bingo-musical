import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure WebView compatibility for Capacitor Android builds
  reactStrictMode: true,
  // The output directory must match capacitor.config.ts webDir
  // (default: .next, but Capacitor expects 'out' for static export)
  // This can be customized per deployment
};

export default nextConfig;
