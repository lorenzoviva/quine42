/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import { geminiProxy } from './server/geminiProxy';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only server-side. Nothing without VITE_ reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [geminiProxy(env.GEMINI_API_KEY)],
    server: { port: 5173 },
    optimizeDeps: { exclude: ['wasmoon'] },
    test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  };
});
