/// <reference types="vitest" />
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite';
import { GeminiGate, geminiProxy } from './server/geminiProxy';
import { hideUniverses } from './server/hidden';
import { securityHeaders } from './server/csp';
import { universeStore, universesPerAccount } from './server/universeStore';
import { newSecret } from './server/access';
import { sessionServer, getActiveWorld } from './server/session';
import { accountRoute, accountSettings } from './server/account';
import { stripeRoute, stripeSettings } from './server/stripe';
import { queueWanted, subscriptionQueue } from './server/subscriptionQueue';
import { wandererRoute } from './server/wanderer';
import { testWorkers } from './server/testWorkers';
import { walletRoute } from './server/wallet';
import { grantCapOf, platformFeeOf } from './server/ledger';
import { videoFolder, videoRoute } from './server/video';
import { betaGuide, guidePage, labsOn } from './server/betaGuide';
import { handmadeRoute } from './server/handmade';
import { inlineChecker } from './server/programCheck';
import { siteSkins } from './server/skins';
import { serverPath } from './server/folders';

export default defineConfig(({ mode }) => {
  // '' prefix: read every variable, but only server-side. Nothing without VITE_ reaches the client.
  const env = loadEnv(mode, process.cwd(), '');
  // Accounts (T44b): on only with FIREBASE_PROJECT_ID; the browser asks /api/account how to sign in.
  const accounts = accountSettings(env);
  const universesDir = path.resolve(process.cwd(), 'universes');
  // The only holder of the key (T123): models on a list, a daily cap; the route for the browser, `direct()` for the worlds of many.
  const gemini = new GeminiGate({ apiKey: env.GEMINI_API_KEY, dailyCap: env.GEMINI_TETTO_GIORNALIERO, universesDir, ledgerFile: serverPath(universesDir, 'geminiSpend') });
  // How the worlds of this process prove themselves to the store (T120, ADR-0102): only in memory, a new one at every start.
  const internal = newSecret();
  return {
    // Universes live next to the kernel, each a git repository of its own (ignored by the kernel's).
    // The multiplayer games (T38): each world in a process of its own (T127, ADR-0110), clients over /api/session.
    // The subscriptions' queue (T68): the slow requests on disk until a process using the CLIs serves them; off unless asked (ADR-0106).
    plugins: [
      // The pages' policy, on every answer (T132, ADR-0111).
      securityHeaders(accounts.config),
      // Before the routes: what lives in universes/ reaches a browser only through the routes below (T130, ADR-0109).
      hideUniverses(process.cwd(), universesDir),
      geminiProxy(gemini),
      universeStore(universesDir, { accounts, internal, quota: universesPerAccount(env.QUINE_UNIVERSI_PER_ACCOUNT) }),
      accountRoute(accounts),
      stripeRoute({
        settings: stripeSettings(env),
        accounts,
        universesDir,
        getActiveWorld,
      }),
      // The site's profile page (T102): the account's wanderer, their profile and credits.
      wandererRoute({ accounts, universesDir, getActiveWorld }),
      // The site's credits page (T105): the account's balance and their lines of the two ledgers.
      walletRoute({ accounts, universesDir, getActiveWorld, platformFee: platformFeeOf(env) }),
      // The handmade cards (T293, ADR-0161): only with `laboratori` in site/beta.json, read at every request; the programs checked here (only this machine listens).
      handmadeRoute({ accounts, universesDir, labs: () => labsOn(process.cwd()), checker: inlineChecker() }),
      sessionServer(accounts, gemini.direct(), internal, { universesDir, grantCap: grantCapOf(env, !!accounts?.verify), platformFee: platformFeeOf(env) }, Number(env.QUINE_MONDO_MEMORIA) || undefined, Number(env.QUINE_MONDI_MASSIMI) || undefined),
      subscriptionQueue(serverPath(path.resolve(process.cwd(), 'universes'), 'queue'), { enabled: queueWanted(env) }),
      // The site's videos, from the same folder as in production (T244, ADR-0131), and the instructions of the beta: what is off never reaches the build.
      videoRoute({ folder: videoFolder(env), accounts }),
      betaGuide(process.cwd()),
      // The site's skins, each a folder of site/skins/ (T283, ADR-0145).
      siteSkins(process.cwd()),
    ],
    // Writing a universe must not reload the page (dev server watches the project folder).
    // In a worktree of the pipeline node_modules is a junction to another folder (T44c): wasmoon's glue.wasm is served
    // from its real path, outside the root, so it must be allowed too.
    // No CORS (V-029): the game and the site are of this origin, and by default Vite lets a page on any other port of this machine read the project's files.
    preview: { cors: false },
    server: { cors: false, port: 5173, watch: { ignored: ['**/universes/**'] }, fs: { allow: [searchForWorkspaceRoot(process.cwd()), realModules()], deny: FS_DENY } },
    // wasmoon is UMD: pre-bundled, the browser can import it in dev (its glue.wasm comes by URL, `wasmUri`).
    optimizeDeps: { include: ['wasmoon'] },
    // The MarkovJunior lab has its dedicated pages: the sandbox (/lab/3d/), the model editor (/lab/editor/) and the SoundLab (/lab/suono/).
    build: {
      rollupOptions: {
        input: {
          main: path.resolve('index.html'),
          lab3d: path.resolve('lab/3d/index.html'),
          labEditor: path.resolve('lab/editor/index.html'),
          labSuono: path.resolve('lab/suono/index.html'),
          site: path.resolve('site/index.html'),
          sessioni: path.resolve('site/sessioni.html'),
          carte: path.resolve('site/carte.html'),
          notizie: path.resolve('site/notizie.html'),
          siteProfilo: path.resolve('site/profilo.html'),
          sitePagamenti: path.resolve('site/pagamenti.html'),
          ...guidePage(process.cwd()),
        },
      },
    },
    // The session's tests boot several kernels each: with the whole suite in parallel they take longer than the default 5 s,
    // and a `beforeEach` that boots one takes longer than the default 10 s of a hook even on an idle machine (T118).
    // Under the pipeline at most one worker per physical core (T118, ADR-0088); by hand vitest's default.
    // The forms on disk (ADR-0108): each test file has its own modules, and would pay its first boot; only here, never in the game or on the server.
    // Every temporary folder of a run lives in one that goes away with it (T177).
    test: { environment: 'node', include: ['tests/**/*.test.ts', 'lab/**/*.test.ts'], globalSetup: ['tests/setup/suite-temp.ts'], setupFiles:['tests/setup/forms-disk.ts', 'tests/setup/relief-memo.ts'], testTimeout: 60000, hookTimeout: 60000, ...testWorkers(process.env) },
  };
});

/** Vite's own list (setting it replaces it), universes/ and the programs of the worlds: also for what asks for a file without passing from the middlewares (T130). */
const FS_DENY = ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/universes/**', '**/.quine-mondo/**'];

/** Where node_modules really is (a junction in the pipeline's worktrees). */
function realModules(): string {
  const dir = path.resolve(process.cwd(), 'node_modules');
  try {
    return fs.realpathSync(dir);
  } catch {
    return dir;
  }
}
