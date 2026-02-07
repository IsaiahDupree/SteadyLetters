import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Include both unit and live tests, but live tests use describe.skip to prevent
    // accidental execution without THANKS_IO_LIVE_TEST=true AND THANKS_IO_API_KEY set
    include: ['tests/unit/**/*.test.tsx', 'tests/unit/**/*.test.ts', 'tests/live/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
