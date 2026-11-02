// What `npm run serve` starts (T133, ADR-0112), built into dist-server/server.mjs by tools/produzione/costruisci.ts: the environment is all it reads.
// QUINE_PORTA (or PORT, as Cloud Run says it), QUINE_HOST (only this machine unless told: 0.0.0.0 or ::), QUINE_UNIVERSI (the universes' folder).

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProductionServer, type ProductionServer } from './production';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const env = process.env;

let running: ProductionServer;
try {
  running = createProductionServer({
    env,
    dist: path.join(root, 'dist'),
    worldProgram: path.join(here, 'mondo', 'mondo.mjs'),
    universesDir: path.resolve(root, env.QUINE_UNIVERSI?.trim() || 'universes'),
  });
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

mkdirSync(path.resolve(root, env.QUINE_UNIVERSI?.trim() || 'universes'), { recursive: true });
const port = Number(env.QUINE_PORTA?.trim() || env.PORT?.trim() || 8080);
const host = env.QUINE_HOST?.trim() || '127.0.0.1';
running.server.on('error', (e) => {
  console.error(`il server di produzione non parte: ${e.message}`);
  process.exit(1);
});
running.server.listen(port, host, () => {
  const a = running.server.address();
  console.log(`server di produzione in ascolto su ${host}:${a && typeof a === 'object' ? a.port : port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void running.stop().finally(() => process.exit(0)));
}
