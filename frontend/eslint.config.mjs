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
      // Bypasses the strict plugin checks for state updates inside useEffect
      "react-hooks/set-state-in-effect": "off",
      // Turns off the explicit type matching requirements for 'any' types
      "@typescript-eslint/no-explicit-any": "off",
      // Downgrades unused variable blockers into standard visual warnings
      "@typescript-eslint/no-unused-vars": "warn",
    }
  }
];

export default eslintConfig;