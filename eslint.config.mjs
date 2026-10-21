import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Login/logout change the auth cookie, so these deliberately do a full page load rather than a client-side navigation.
    files: ['src/admin/**'],
    rules: { '@next/next/no-location-assign-relative-destination': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'content/**']),
]);
