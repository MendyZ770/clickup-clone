import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.done.app",
  appName: "Done",
  webDir: "public",
  server: {
    url: "https://clickup-clone-three.vercel.app",
    allowNavigation: ["*"],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
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
