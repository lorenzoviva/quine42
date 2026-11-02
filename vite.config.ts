/// <reference types="vitest" />
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite';
import { GeminiGate, geminiProxy } from './server/geminiProxy';
import { universeStore } from './server/universeStore';
import { newSecret } from './server/access';
import { sessionServer, getActiveUniverseKernel } from './server/session';
import { accountRoute, accountSettings } from './server/account';
import { stripeRoute, stripeSettings } from './server/stripe';
import { queueWanted, subscriptionQueue } from './server/subscriptionQueue';
import { wandererRoute } from './server/wanderer';
import { testWorkers } from './server/testWorkers';
import { walletRoute } from './server/wallet';
import { grantCapOf } from './server/ledger';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only server-side. Nothing without VITE_ reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  // Accounts (T44b): on only with FIREBASE_PROJECT_ID; the browser asks /api/account how to sign in.
  const accounts = accountSettings(env);
  const universesDir = path.resolve(process.cwd(), 'universes');
  // The only holder of the key (T123): models on a list, a daily cap; the route for the browser, `direct()` for the worlds of many.
  const gemini = new GeminiGate({ apiKey: env.GEMINI_API_KEY, dailyCap: env.GEMINI_TETTO_GIORNALIERO, universesDir, ledgerFile: path.join(universesDir, '.spesa-gemini.json') });
  // How the worlds of this process prove themselves to the store (T120, ADR-0102): only in memory, a new one at every start.
  const internal = newSecret();
  return {
    // Universes live next to the kernel, each a git repository of its own (ignored by the kernel's).
    // The games of many (T38): their worlds run in this process, one per universe, clients over /api/session.
    // The subscriptions' queue (T68): the slow requests on disk until a process using the CLIs serves them; off unless asked (ADR-0106).
    plugins: [
      geminiProxy(gemini),
      universeStore(universesDir, { accounts, internal }),
      accountRoute(accounts),
      stripeRoute({
        settings: stripeSettings(env),
        accounts,
        universesDir,
        getActiveKernel: getActiveUniverseKernel,
      }),
      // The site's profile page (T102): the account's wanderer, their profile and credits.
      wandererRoute({ accounts, universesDir, getActiveKernel: getActiveUniverseKernel }),
      // The site's credits page (T105): the account's balance and their lines of the two ledgers.
      walletRoute({ accounts, universesDir, getActiveKernel: getActiveUniverseKernel }),
      sessionServer(accounts, gemini.direct(), internal, { universesDir, grantCap: grantCapOf(env, !!accounts?.verify) }),
      subscriptionQueue(path.resolve(process.cwd(), 'universes', '.coda'), { enabled: queueWanted(env) }),
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
          site: path.resolve('site/index.html'),
          sessioni: path.resolve('site/sessioni.html'),
          carte: path.resolve('site/carte.html'),
          siteProfilo: path.resolve('site/profilo.html'),
          sitePagamenti: path.resolve('site/pagamenti.html'),
        },
      },
    },
    // The session's tests boot several kernels each: with the whole suite in parallel they take longer than the default 5 s,
    // and a `beforeEach` that boots one takes longer than the default 10 s of a hook even on an idle machine (T118).
    // Under the pipeline at most one worker per physical core (T118, ADR-0088); by hand vitest's default.
    // The forms on disk (ADR-0108): each test file has its own modules, and would pay its first boot; only here, never in the game or on the server.
    test: { environment: 'node', include: ['tests/**/*.test.ts', 'lab/**/*.test.ts'], setupFiles: ['tests/setup/forms-disk.ts', 'tests/setup/relief-memo.ts'], testTimeout: 60000, hookTimeout: 60000, ...testWorkers(process.env) },
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
