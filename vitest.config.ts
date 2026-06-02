import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/stores/__tests__/setup.ts'],
    // React Native uses Flow which rolldown (Vite's SSR parser) cannot parse.
    // Exclude tests that transitively import React Native modules from the node environment.
    exclude: [
      'src/stores/__tests__/blueprintStore.test.ts',
      // AR service imports native ARCoreModule which binds to native code
      'src/__tests__/services/arService.test.ts',
    ],
  },
});