/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { geminiProxy } from './server/geminiProxy';
import { universeStore } from './server/universeStore';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only server-side. Nothing without VITE_ reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Universes live next to the kernel, each a git repository of its own (ignored by the kernel's).
    plugins: [geminiProxy(env.GEMINI_API_KEY), universeStore(path.resolve(process.cwd(), 'universes'))],
    // Writing a universe must not reload the page (dev server watches the project folder).
    server: { port: 5173, watch: { ignored: ['**/universes/**'] } },
    optimizeDeps: { exclude: ['wasmoon'] },
    // The voxel lab (lab/, experimental) is a second page on the same server: /lab/.
    build: { rollupOptions: { input: { main: path.resolve('index.html'), lab: path.resolve('lab/index.html') } } },
    test: { environment: 'node', include: ['tests/**/*.test.ts', 'lab/**/*.test.ts'] },
  };
});
