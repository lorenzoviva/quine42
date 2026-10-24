/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { geminiProxy } from './server/geminiProxy';
import { universeStore } from './server/universeStore';
import { sessionServer } from './server/session';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only server-side. Nothing without VITE_ reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Universes live next to the kernel, each a git repository of its own (ignored by the kernel's).
    // The games of many (T38): their worlds run in this process, one per universe, clients over /api/session.
    plugins: [geminiProxy(env.GEMINI_API_KEY), universeStore(path.resolve(process.cwd(), 'universes')), sessionServer()],
    // Writing a universe must not reload the page (dev server watches the project folder).
    server: { port: 5173, watch: { ignored: ['**/universes/**'] } },
    // wasmoon is UMD: pre-bundled, the browser can import it in dev (its glue.wasm comes by URL, `wasmUri`).
    optimizeDeps: { include: ['wasmoon'] },
    // The MarkovJunior lab's sandbox (lab/3d) is a second page on the same server: /lab/3d/.
    build: { rollupOptions: { input: { main: path.resolve('index.html'), lab3d: path.resolve('lab/3d/index.html') } } },
    test: { environment: 'node', include: ['tests/**/*.test.ts', 'lab/**/*.test.ts'] },
  };
});
