import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      ENCRYPTION_KEY: '57815a6a32602e00d1b32c95d51b0c12977caf4bbd73150d2e07cb10406df6e2',
      SESSION_SECRET: 'test-session-secret-that-is-long-enough-32chars',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
