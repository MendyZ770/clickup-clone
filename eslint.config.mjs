import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: ["src/generated/**", "node_modules/**", ".next/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default eslintConfig;
