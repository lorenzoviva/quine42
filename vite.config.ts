/// <reference types="vitest" />
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite';
import { geminiProxy } from './server/geminiProxy';
import { universeStore } from './server/universeStore';
import { sessionServer } from './server/session';
import { subscriptionQueue } from './server/subscriptionQueue';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only server-side. Nothing without VITE_ reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Universes live next to the kernel, each a git repository of its own (ignored by the kernel's).
    // The games of many (T38): their worlds run in this process, one per universe, clients over /api/session.
    // The subscriptions' queue (T68): the slow requests on disk until a process using the CLIs serves them.
    plugins: [
      geminiProxy(env.GEMINI_API_KEY),
      universeStore(path.resolve(process.cwd(), 'universes')),
      sessionServer(),
      subscriptionQueue(path.resolve(process.cwd(), 'universes', '.coda')),
    ],
    // Writing a universe must not reload the page (dev server watches the project folder).
    // In a worktree of the pipeline node_modules is a junction to another folder (T44c): wasmoon's glue.wasm is served
    // from its real path, outside the root, so it must be allowed too.
    server: { port: 5173, watch: { ignored: ['**/universes/**'] }, fs: { allow: [searchForWorkspaceRoot(process.cwd()), realModules()] } },
    // wasmoon is UMD: pre-bundled, the browser can import it in dev (its glue.wasm comes by URL, `wasmUri`).
    optimizeDeps: { include: ['wasmoon'] },
    // The MarkovJunior lab has two dedicated pages: the sandbox (/lab/3d/) and the model editor (/lab/editor/).
    build: {
      rollupOptions: {
        input: {
          main: path.resolve('index.html'),
          lab3d: path.resolve('lab/3d/index.html'),
          labEditor: path.resolve('lab/editor/index.html'),
        },
      },
    },
    // The session's tests boot several kernels each: with the whole suite in parallel they take longer than the default 5 s.
    test: { environment: 'node', include: ['tests/**/*.test.ts', 'lab/**/*.test.ts'], testTimeout: 60000 },
  };
});

/** Where node_modules really is (a junction in the pipeline's worktrees). */
function realModules(): string {
  const dir = path.resolve(process.cwd(), 'node_modules');
  try {
    return fs.realpathSync(dir);
  } catch {
    return dir;
  }
}
