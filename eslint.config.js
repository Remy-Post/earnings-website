import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".shots", "node_modules"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  { files: ["**/*.test.{ts,tsx}"], rules: { "@typescript-eslint/no-non-null-assertion": "off" } },
  { files: ["src/**/*.{ts,tsx}"], extends: [reactHooks.configs.flat.recommended], languageOptions: { globals: globals.browser } },
  { files: ["scripts/**/*.mjs", "*.js"], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ["public/**/*.js"], languageOptions: { globals: globals.browser } },
);
