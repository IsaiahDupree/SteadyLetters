import { defineConfig } from 'vitest/config';
import path from 'path';

// Separate config for live tests to avoid interference with unit test config
export default defineConfig({
  test: {
    // Live tests don't use jsdom since they make real HTTP calls
    environment: 'node',
    globals: true,
    // Only include live tests
    include: ['tests/live/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
