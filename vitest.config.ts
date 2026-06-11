import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // react-native-mmkv imports react-native (Flow syntax) which Vite cannot
      // parse — substitute an in-memory store for the node test environment.
      'react-native-mmkv': resolve(__dirname, 'src/__tests__/helpers/mmkvStub.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/stores/__tests__/setup.ts'],
    // React Native uses Flow which rolldown (Vite's SSR parser) cannot parse.
    // Exclude tests that transitively import React Native modules from the node environment.
    exclude: [
      // AR service imports native ARCoreModule which binds to native code
      'src/__tests__/services/arService.test.ts',
    ],
  },
});