import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disables the strict validation checking state updates inside useEffect
      "react-hooks/set-state-in-effect": "off",
      // Turns off the strict requirement blocking the use of 'any' type references
      "@typescript-eslint/no-explicit-any": "off",
      // Prevents unused variable warnings from breaking the integration pipeline
      "@typescript-eslint/no-unused-vars": "warn",
    }
  }
];

export default eslintConfig;