import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.done.app",
  appName: "Done",
  webDir: "public",
  server: {
    url: "https://clickup-clone-three.vercel.app?v=5",
    allowNavigation: ["*"],
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: "./android/app/done.keystore",
      keystorePassword: "donedone",
      keystoreAlias: "done",
      keystoreAliasPassword: "donedone",
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#a855f7",
    },
  },
};

export default config;
