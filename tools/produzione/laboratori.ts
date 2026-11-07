// The production server with the labs of the players on or off, for the check in the browser (T294, ADR-0168): the build in `dist/` as it
// is, the program of the worlds built here in a temporary folder, an environment of fakes like the tests' (no key, no account: only this
// machine, the wanderer said by `?viandante=`), and a universe `prova` copied from the seed to fork from. Nothing of this repository's
// `universes/` is read or written. Ctrl+C stops it and removes the folder.
//
//   npm run build && npx vite-node tools/produzione/laboratori.ts -- --porta 4321 [--spenti]

import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildServer } from '../../server/buildServer';
import { createProductionServer } from '../../server/production';

const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--porta') + 1]) || 4321;
const labs = !args.includes('--spenti');
const root = process.cwd();
const work = mkdtempSync(path.join(os.tmpdir(), 'quine-laboratori-'));
const universes = path.join(work, 'universes');
const prova = path.join(universes, 'prova');
mkdirSync(path.join(prova, '.git'), { recursive: true });
cpSync(path.join(root, 'universe'), prova, { recursive: true });

const built = await buildServer(root, path.join(work, 'dist-server'));
const site = `http://127.0.0.1:${port}`;
const running = createProductionServer({
  // Fakes: what the production server wants to be there before it serves strangers. This one answers only this machine.
  env: { FIREBASE_PROJECT_ID: 'prova-laboratori', FIREBASE_API_KEY: 'finta', STRIPE_WEBHOOK_SECRET: 'whsec_finto', QUINE_ORIGINI: `${site},http://localhost:${port}` },
  dist: path.join(root, 'dist'),
  worldProgram: built.world,
  universesDir: universes,
  accounts: { config: {} },
  labs,
});
running.server.listen(port, '127.0.0.1', () => console.log(`laboratori ${labs ? 'accesi' : 'spenti'}: ${site}/site/laboratori.html · ${site}/lab/editor/ (universi in ${universes})`));
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () =>
    void running.stop().finally(() => {
      rmSync(work, { recursive: true, force: true });
      process.exit(0);
    }),
  );
