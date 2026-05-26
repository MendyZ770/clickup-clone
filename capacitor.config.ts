import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.done.app",
  appName: "Done",
  webDir: "public",
  server: {
    url: "https://clickup-clone-three.vercel.app",
    allowNavigation: [
      "clickup-clone-three.vercel.app",
      "*.vercel.app",
    ],
    cleartext: false,
  },
  // NOTE: Pour le Play Store, une migration vers Trusted Web Activity (TWA)
  // via @bubblewrap/cli est recommandée plutôt qu'un wrapper WebView Capacitor
  // pur (moins de risque de rejet Google). Voir docs/PLAY_STORE_STRATEGY.md.
  // NOTE: les secrets de signing release sont configurés dans
  // ~/.gradle/gradle.properties ou via variables d'environnement
  // lors du build Gradle (voir BUILD_APK.md).
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#a855f7",
    },
  },
};

export default config;
