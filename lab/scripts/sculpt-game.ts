// The game's Sculptor and Artist against Gemini, with the kernel's usage ledger: what a model costs when the
// game asks for it (step 9, F6). Writes the programs and the photographs the Artist saw to lab/out/sculpt-game.
// npx vite-node lab/scripts/sculpt-game.ts -- [--root H:/projects/rune] [--max 16]
//
// The key is read from <root>/.env and sent only to Google; it is never printed.

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { tallyLine } from '../../src/kernel/ai/usage';
import { checkProgram, views, type SculptRequest } from '../../src/kernel/agents/sculptor';
import { classOf } from '../../src/mj/classes';
import { direct, readKey } from './gemini';
import { UsageLedger } from '../../src/kernel/ai/usage';

const argv = process.argv.slice(2);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const root = path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..'));
const key = readKey(root);
const models = direct('gemini-3.1-flash-lite', key, new UsageLedger(), { max: Number(opt('max') ?? 16) });
const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), models });
k.council.onFeed = (e) => console.log(`  [${e.from}${e.to ? ` → ${e.to}` : ''}] ${e.kind}: ${e.text.slice(0, 160)}`);
const out = path.resolve('lab/out/sculpt-game');
fs.mkdirSync(out, { recursive: true });

const requests: SculptRequest[] = [
  { id: 'forma-bottiglia', nome: 'bottiglia (forma comune degli oggetti)', aspetto: 'una bottiglia di vetro o di coccio con il tappo, come tante nel mondo (vino, olio, acqua)', classe: 'oggetto', tinta: true },
  { id: 'npc-mugnaio', nome: 'Mugnaio', aspetto: 'un mugnaio robusto con il grembiule infarinato, un berretto di lana e le maniche rimboccate', classe: 'persona' },
];

for (const req of requests) {
  console.log(`\n== ${req.nome} (${req.classe})`);
  const t0 = Date.now();
  const ok = await k.sculpting.make(req);
  const xml = k.repo.working[`models/${req.id}.xml`];
  console.log(`   ${ok ? 'fatto' : 'NON riuscito'} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (xml) {
    fs.writeFileSync(path.join(out, `${req.id}.xml`), xml);
    const checked = checkProgram(xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), classOf(req.classe)!);
    if (!checked.error) fs.writeFileSync(path.join(out, `${req.id}.png`), Buffer.from(views(checked).split(',')[1], 'base64'));
    console.log(`   ${xml.split('\n')[0]}`);
  }
}

console.log(`\nConsumi: ${tallyLine(k.usage.session)}`);
for (const [m, t] of Object.entries(k.usage.sessionByModel)) console.log(`  ${m}: ${tallyLine(t)}`);
for (const r of k.usage.tasks()) console.log(`  ${r.model} · ${r.task}: ${tallyLine(r.tally)}`);
fs.writeFileSync(path.join(out, 'consumi.json'), k.usage.toJson());
