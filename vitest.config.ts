import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest configuration for the Drift monorepo.
 * Individual packages can extend this configuration.
 */
export default defineConfig({
  test: {
    // Global test settings
    globals: true,
    environment: 'node',

    // Include patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],

    // Pass when no tests are found (useful during initial setup)
    passWithNoTests: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/tests/**',
        '**/index.ts', // Barrel exports
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // Reporter configuration
    reporters: ['default'],

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Pool configuration for parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Type checking
    typecheck: {
      enabled: false, // Run separately via tsc
    },
  },
});
