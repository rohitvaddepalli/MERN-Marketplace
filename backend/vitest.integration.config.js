import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['__tests__/integration/**/*.test.js'],
        setupFiles: ['./__tests__/setup.integration.js'],
        testTimeout: 60000,
        hookTimeout: 300000,
        forceExit: true,
    },
});
