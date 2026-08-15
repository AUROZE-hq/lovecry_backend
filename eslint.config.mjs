import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy / non-app artifacts that are not part of the Next.js runtime:
    "oldAbout.tsx", // binary/corrupt leftover
    "remove_bg.js", // one-off Node script, not app code
  ]),
]);

export default eslintConfig;
