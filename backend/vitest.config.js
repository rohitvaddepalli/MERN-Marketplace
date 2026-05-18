import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['__tests__/unit/**/*.test.js'],
        exclude: ['__tests__/integration/**'],
        setupFiles: ['./__tests__/setup.unit.js'],
        testTimeout: 30000,
        forceExit: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            // Target: >80% — raised to 70% after error.test.js + asyncHandler.test.js additions.
            // Increase to 80 once integration coverage is included via --coverage flag.
            threshold: {
                branches: 70,
                functions: 70,
                lines: 70,
                statements: 70,
            },
        },
    },
});
