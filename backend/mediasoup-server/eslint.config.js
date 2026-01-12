import eslintPluginTs from "@typescript-eslint/eslint-plugin";
import eslintParserTs from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: eslintParserTs,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": eslintPluginTs,
    },
    rules: {
      ...eslintPluginTs.configs.recommended.rules,
    },
  },
  eslintConfigPrettier,
];
