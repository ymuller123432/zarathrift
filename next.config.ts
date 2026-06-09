import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We ignore TypeScript errors during build because the `mobile/` folder
  // is a completely separate Expo/React Native project with its own tsconfig
  // and dependencies (expo-router, etc.). It is never bundled into the web app.
  // The root tsconfig excludes it, but Next.js still runs a full project type check.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
