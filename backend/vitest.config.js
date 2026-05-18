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
            reporter: ['text', 'lcov'],
            threshold: {
                branches: 50,
                functions: 50,
                lines: 50,
                statements: 50,
            },
        },
    },
});
