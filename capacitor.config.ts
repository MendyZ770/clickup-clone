import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl = "https://clickup-clone-three.vercel.app";
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || productionUrl;

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return productionUrl;
  }
}

const config: CapacitorConfig = {
  appId: "com.done.app",
  appName: "Done",
  webDir: "public",
  server: {
    url: serverUrl,
    // Aucune origine supplémentaire : la WebView reste limitée à l'origine de
    // l'app. Pour tester sur téléphone, définir CAPACITOR_SERVER_URL puis
    // relancer `npx cap sync android` (ne jamais committer d'URL ngrok).
    allowNavigation: [],
    cleartext: originOf(serverUrl).startsWith("http://"),
    // Page locale embarquée dans l'APK quand le serveur est injoignable.
    errorPath: "index.html",
  },
  // NOTE: Pour le Play Store, une migration vers Trusted Web Activity (TWA)
  // via @bubblewrap/cli est recommandée plutôt qu'un wrapper WebView Capacitor
  // pur (moins de risque de rejet Google). Voir docs/PLAY_STORE_STRATEGY.md.
  // NOTE: les secrets de signing release sont configurés dans
  // ~/.gradle/gradle.properties ou via variables d'environnement
  // lors du build Gradle (voir BUILD_APK.md).
  // NOTE: aucun bloc `plugins` déclaré : @capacitor/splash-screen n'est pas
  // installé. Si la fonctionnalité Splash Screen devient nécessaire, ajouter
  // d'abord `npm i @capacitor/splash-screen` puis re-déclarer la config ici.
};

export default config;
