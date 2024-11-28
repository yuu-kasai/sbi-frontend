// app.config.ts
import { ExpoConfig } from "@expo/config";

const config: ExpoConfig = {
  name: "sbi",
  slug: "your-app-slug", // プロジェクト名をケバブケースで
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "your.bundle.identifier",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "your.package.name",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  },
};

export default config;
