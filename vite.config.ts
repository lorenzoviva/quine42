/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  optimizeDeps: { exclude: ['wasmoon'] },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
