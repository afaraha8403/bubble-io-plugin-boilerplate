import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // Bubble-specific globals
        instance: "readonly",
        properties: "readonly",
        context: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Bubble specific warnings
      "no-restricted-syntax": [
        "warn",
        {
          "selector": "CallExpression[callee.object.name='document'][callee.property.name='write']",
          "message": "Do not mutate the document directly. Use instance.canvas in elements."
        }
      ]
    }
  }
];
