// The furniture of the cellar (T419, `docs/design/scenografo.md` § 10.4): the pieces of the class `furniture` the Scenografo's way of data
// puts in a cellar, tall enough that the kernel brings them up to its ceiling (a shelf, a rack) or low enough that their top is no floor (a
// cask). The game's Sculptor and Artist on Gemini, with the kernel's usage ledger: what each model costs when the game asks for it. Writes
// the programs, the entries of the library, the photographs the Artist saw and the costs to --out; the seed takes them by hand.
//
// npx vite-node lab/scripts/mobili-cantina.ts -- [--root H:/projects/rune] [--scultore gemini-3.8-flash] [--tetto 0.5] [--solo cellar-shelf] [--out lab/banco/scenografo/cantina/modelli]
//
// `--scultore` the model of the simple things (the game's own, 3.1 Flash-Lite, if not said).
//
// The key is read from <root>/.env and sent only to Google; it is never printed.

import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { bundledFiles } from '../../src/kernel/bundle';
import { memoryStore } from '../../src/kernel/repo';
import { tallyLine, UsageLog } from '../../src/kernel/ai/usage';
import { checkProgram, views, type SculptRequest } from '../../src/kernel/agents/sculptor';
import { classOf } from '../../src/mj/classes';
import { direct, readKey } from './gemini';

const argv = process.argv.slice(2);
const opt = (n: string) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);
const root = path.resolve(opt('root') ?? (fs.existsSync('.env') ? '.' : '../../..'));
const cap = Number(opt('tetto') ?? 0.5);
const only = opt('solo')?.split(',');
const out = path.resolve(opt('out') ?? 'lab/banco/scenografo/cantina/modelli');
const sculptor = opt('scultore');

/** The pieces: ids in English (ADR-0153), names in the world's language. */
export const CELLAR_FURNITURE: SculptRequest[] = [
  {
    id: 'cellar-shelf',
    nome: 'Scaffale della cantina',
    aspetto:
      'a tall wooden shelf of a cellar that goes from the floor up to the ceiling: four posts and four or five boards, with jars, bottles, small sacks and wheels of cheese on them; wide and shallow (one and a half tiles wide, half a tile deep), as tall as its box, made to stand against a wall; the posts stand on the floor (z=0) and every board is joined to them',
    classe: 'furniture',
    taglia: 'large',
  },
  {
    id: 'cellar-rack',
    nome: 'Rastrelliera delle botti',
    aspetto:
      'a tall wooden rack of a wine cellar that goes from the floor up to the ceiling: a frame of beams with small barrels lying on their side in two or three rows, one on top of the other, and bottles lying in the gaps; wide and shallow (one and a half tiles wide, half a tile deep), as tall as its box, made to stand against a wall; the frame stands on the floor (z=0), every barrel rests on a beam, wood and iron in plain colours',
    classe: 'furniture',
    taglia: 'large',
  },
  {
    id: 'cellar-cask',
    nome: 'Botte grande',
    aspetto:
      'a big wine cask lying on its side on a low wooden cradle, dark staves with iron hoops and a wooden tap on its front face; it fills its box in length and width, its top a little under the top of the box; the cradle stands on the floor (z=0) and the cask rests on it, every part joined to the others',
    classe: 'furniture',
  },
];

const key = readKey(root);
const models = direct('gemini-3.1-flash-lite', key, new UsageLog(), { max: 24 });
const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: models });
if (sculptor) k.config.ai.sculptors = { ...(k.config.ai.sculptors ?? {}), simple: sculptor };
// The kernel's own ledger: every call the Council makes, the Sculptor's and the Artist's.
const ledger = k.usage;
k.council.onFeed = (e) => console.log(`  [${e.from}${e.to ? ` → ${e.to}` : ''}] ${e.kind}: ${e.text.slice(0, 200)}`);
fs.mkdirSync(out, { recursive: true });

const report: Array<Record<string, unknown>> = [];
for (const req of CELLAR_FURNITURE.filter((r) => !only || only.includes(r.id))) {
  const spent = ledger.session.usd;
  if (spent >= cap) {
    console.log(`\nTetto di ${cap} $ raggiunto (${spent.toFixed(4)} $): ${req.id} non si chiede.`);
    break;
  }
  // Every commit reads the configuration again: the sculptor asked is said again before every model.
  if (sculptor) k.config.ai.sculptors = { ...(k.config.ai.sculptors ?? {}), simple: sculptor };
  console.log(`\n== ${req.nome} (${req.classe}${req.taglia ? `, ${req.taglia}` : ''})`);
  const before = spent;
  const t0 = Date.now();
  const ok = await k.sculpting.make(req);
  const s = (Date.now() - t0) / 1000;
  const xml = k.repo.working[`models/${req.id}.xml`];
  const entry = JSON.parse(k.repo.working['models/index.json'])[req.id];
  const usd = ledger.session.usd - before;
  console.log(`   ${ok ? 'fatto' : 'NON riuscito'} in ${s.toFixed(1)} s, ${usd.toFixed(4)} $`);
  if (xml) {
    fs.writeFileSync(path.join(out, `${req.id}.xml`), xml);
    const checked = checkProgram(xml.replace(/^\s*<!--[\s\S]*?-->\s*/, ''), classOf(req.classe)!, req.taglia);
    if (!checked.error) fs.writeFileSync(path.join(out, `${req.id}.png`), Buffer.from(views(checked).split(',')[1], 'base64'));
  }
  report.push({ id: req.id, ok, seconds: s, usd, entry });
}

console.log(`\nConsumi: ${tallyLine(ledger.session)}`);
for (const [m, t] of Object.entries(ledger.sessionByModel)) console.log(`  ${m}: ${tallyLine(t)}`);
for (const r of ledger.tasks()) console.log(`  ${r.model} · ${r.task}: ${tallyLine(r.tally)}`);
fs.writeFileSync(path.join(out, 'esito.json'), JSON.stringify({ sculptor: sculptor ?? 'gemini-3.1-flash-lite', report, total: ledger.session, byModel: ledger.sessionByModel }, null, 1) + '\n');
