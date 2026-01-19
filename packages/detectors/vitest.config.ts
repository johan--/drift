import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],
    passWithNoTests: false,
    testTimeout: 30000,
    hookTimeout: 10000,
  },
});
