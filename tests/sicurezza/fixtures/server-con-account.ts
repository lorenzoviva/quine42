// T134: the production server of `server/production.ts`, built and started as `server/serve.ts` starts it, in its own process. One thing differs: a token says
// its account (`vero-<uid>`, `anon-<uid>`), because a token of a real Firebase project cannot be made here. Arguments: the build, the world's program, the universes,
// and `--laboratori` for the labs' switch on (ADR-0161). It stops when its stdin closes, saving its worlds.

import { createProductionServer } from '../../../server/production';

const [dist, worldProgram, universesDir] = process.argv.slice(2);

const running = createProductionServer({
  env: process.env,
  dist,
  worldProgram,
  universesDir,
  labs: process.argv.includes('--laboratori'),
  accounts: {
    config: { projectId: 'prova', apiKey: 'pubblica', authDomain: 'prova.firebaseapp.com' },
    verify: async (t) => (t.startsWith('vero-') ? { uid: t.slice(5), anonymous: false } : t.startsWith('anon-') ? { uid: t.slice(5), anonymous: true } : undefined),
  },
  // Many requests from one address, which is what these proofs are. The rhythms have their test (`risorse.test.ts`).
  rates: { api: { burst: 100000, perSecond: 1000 }, heavy: { burst: 100000, perSecond: 1000 }, sockets: { burst: 1000, perSecond: 10 }, socketsAtOnce: 100 },
});

running.server.listen(0, '127.0.0.1', () => {
  const a = running.server.address();
  console.log(`in ascolto su 127.0.0.1:${a && typeof a === 'object' ? a.port : 0}`);
});

process.stdin.resume();
process.stdin.on('end', () => void running.stop().finally(() => process.exit(0)));
