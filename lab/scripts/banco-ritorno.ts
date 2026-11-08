// What the Sculptor would get back after a block (T337, `lab/banco/blocchi.ts`), for a program already written: no model is called.
//
//   npx vite-node lab/scripts/banco-ritorno.ts -- --xml programma.xml --bersaglio rocca [--semi 1,2,3] [--finale] [--taglia gargantuan]

import fs from 'node:fs';
import type { SizeTier } from '../../src/mj/classes';
import { bersaglio } from '../banco/bersagli';
import { ritorno } from '../banco/blocchi';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (k: string) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const file = opt('xml');
const b = bersaglio(opt('bersaglio') ?? 'rocca');
if (!file || !b) throw new Error('--xml programma.xml --bersaglio <id>');
const taglia = opt('taglia') as SizeTier | undefined;
const t0 = Date.now();
const r = ritorno(fs.readFileSync(file, 'utf8'), taglia ? { ...b, taglia } : b, {
  semi: (opt('semi') ?? '1,2,3').split(',').map(Number),
  finale: args.includes('--finale'),
  ...(opt('tetto') ? { tetto: Number(opt('tetto')) } : {}),
});
console.log(r.testo);
console.log(`\n(${Date.now() - t0} ms, ${Math.round(r.testo.length / 3.5)} token stimati)`);
