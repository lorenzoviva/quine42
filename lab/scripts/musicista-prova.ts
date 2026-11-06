// A trial of the Musician's prompt with the real model (T225): the Council's own `compose`, a few requests, every answer through the validator. No browser, no universe touched.
//   npx vite-node lab/scripts/musicista-prova.ts -- <root con .env> [--max 10] [--model gemini-3.8-flash]

import fs from 'node:fs';
import path from 'node:path';
import { compose, type ComposeRequest } from '../../src/kernel/agents/composer';
import { Council } from '../../src/kernel/agents/council';
import { UsageLog } from '../../src/kernel/ai/usage';
import { bundledFiles } from '../../src/kernel/bundle';
import { soundPrograms } from '../../src/mj/sound';
import { direct, readKey } from './gemini';

const args = process.argv.slice(2).filter((a) => a !== '--');
const flag = (n: string, d: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const root = args[0] ?? '.';
const model = flag('--model', 'gemini-3.8-flash');
const max = Number(flag('--max', '10'));

const ledger = new UsageLog();
const ai = direct(model, readKey(root), ledger, { max });
const council = new Council(ai, () => ({ files: bundledFiles, palette: {}, catalog: [] }));
council.onFeed = (e) => console.log(`  [${e.from}${e.to ? `→${e.to}` : ''}] ${e.kind}: ${e.text.slice(0, 220)}`);

const layouts = Object.keys(JSON.parse(bundledFiles['modules/world.layouts/manifest.json']).layouts);
const effetti = [...new Set(soundPrograms(bundledFiles).flatMap((p) => p.sound?.effects ?? []))];
const requests: ComposeRequest[] = [
  { richiesta: 'il brano della Forra Nera, che suona di giorno a chi cammina in questo ambiente', nome: 'Forra Nera', uso: 'music', ambienti: ['forra_nera'], momenti: ['morning', 'day'], contesto: 'una gola stretta tra pareti scure, con un torrente in fondo e rondini tra le rocce' },
  { richiesta: 'una musica allegra da locanda, di sera, con un flauto che scherza' },
  { richiesta: 'un rumore nuovo per quando si raccoglie un oggetto, più legnoso' },
];
const out = path.join('lab', 'out', 'musicista');
fs.mkdirSync(out, { recursive: true });
for (const [i, req] of requests.entries()) {
  console.log(`\n# ${req.richiesta}`);
  try {
    const t = Date.now();
    const r = await compose(council, req, { ambienti: [...layouts, ...(req.ambienti ?? [])], effetti, qui: 'bosco' }, model);
    console.log(r ? `  OK «${r.nome}» ${JSON.stringify(r.suono)} in ${r.calls} chiamate, ${Math.round((Date.now() - t) / 1000)} s` : '  NESSUN PROGRAMMA');
    if (r) fs.writeFileSync(path.join(out, `prova-${i}.xml`), r.xml);
  } catch (e) {
    console.log(`  fermo: ${(e as Error).message}`);
    break;
  }
}
console.log(`\nchiamate: ${ai.usage.text}`);
