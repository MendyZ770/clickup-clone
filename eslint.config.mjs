import next from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      "src/generated/**",
      "node_modules/**",
      ".next/**",
      "android/**",
      "apk/**",
      "ios/**",
      "public/sw.js",
      "public/workbox-*.js",
      "public/worker-*.js",
      "public/fallback-*.js",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  ...next,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default eslintConfig;
