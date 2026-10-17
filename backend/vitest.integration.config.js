import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['__tests__/integration/**/*.test.js'],
        setupFiles: ['./__tests__/setup.integration.js'],
        testTimeout: 60000,
        hookTimeout: 300000,
        // Tests share one Postgres schema (app_test) — run files one at a time
        // so one file's beforeAll (drop schema + migrate) can't clobber another
        // file's fixtures mid-run.
        fileParallelism: false,
        forceExit: true,
    },
});
