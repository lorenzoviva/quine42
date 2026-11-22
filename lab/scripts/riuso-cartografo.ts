// T495: the Cartographer on real Gemini over a copy in memory of a universe on the disk: new places planned with the structures of the world
// offered (ADR-0247), every other call on the local models; how many of their structures are worn again, how many are new concepts.
//   npx vite-node lab/scripts/riuso-cartografo.ts -- <universo> --root <cartella col .env> [--luoghi 20] [--ora 60] [--tetto 0.3] [--modello gemini-3.1-flash-lite] [--json f]
// `--ora` is `ai.newStructuresPerHour` (60: the ceiling does not bind, what the Cartographer chooses by itself; 0: only the world's). The world's
// time does not run, so the hour is the whole run. The key is read from <root>/.env, sent only to Google, never printed nor written. `--tetto`
// is in dollars on this run's calls: past it no other place is asked. Nothing is written in the universe (the plans stay in memory).
import fs from 'node:fs';
import path from 'node:path';
import { Kernel } from '../../src/kernel/kernel';
import { memoryStore } from '../../src/kernel/repo';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { MemoryChunks } from '../../src/kernel/chunks';
import { emptyUsage, type AiModels, type TextCall } from '../../src/kernel/ai/models';
import { callCost, UsageLog, type CallRecord } from '../../src/kernel/ai/usage';
import { reusableOf } from '../../src/kernel/reuse';
import { direct, readKey } from './gemini';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, def?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const dir = path.resolve(args[0]);
const root = path.resolve(opt('--root', '.')!);
const places = Number(opt('--luoghi', '20'));
const hour = Number(opt('--ora', '60'));
const ceiling = Number(opt('--tetto', '0.3'));
const model = opt('--modello', 'gemini-3.1-flash-lite')!;

// --- The universe, in memory: its text files, its plans in a store of memory ---
const files: Record<string, string> = {};
const walk = (d: string, rel = '') => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || (rel === '' && e.name === 'maps')) continue;
    const p = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(p, r);
    else files[r] = fs.readFileSync(p, 'utf8');
  }
};
walk(dir);
const cfg = JSON.parse(files['universe.json']);
cfg.ai = { ...cfg.ai, newStructuresPerHour: hour, maxText: 2000 };
files['universe.json'] = JSON.stringify(cfg, null, 2);
const chunks = new MemoryChunks();
const planned = new Set<string>();
for (const f of fs.existsSync(path.join(dir, 'maps')) ? fs.readdirSync(path.join(dir, 'maps')) : []) {
  const m = /^(.+)_(\d+)_([0-9a-f]+)_(-?\d+)_(-?\d+)\.json$/.exec(f);
  if (!m) continue;
  await chunks.save(`${m[1]}:${m[2]}:${m[3]}:${m[4]},${m[5]}`, JSON.parse(fs.readFileSync(path.join(dir, 'maps', f), 'utf8')));
  planned.add(`${m[4]},${m[5]}`);
}

// --- The models: the plans to Gemini, the rest local ---
const ledger = new UsageLog();
const records: CallRecord[] = [];
const gemini = direct(model, readKey(root), ledger, { thinking: (cfg.ai.thinking as 'low') ?? 'low', max: places * 4 });
gemini.onCall = (r) => {
  ledger.record(r);
  records.push(r);
};
const spent = () => records.reduce((s, r) => s + (callCost(r) ?? 0), 0);
const local = Object.assign(new MockAiModels(), { latency: 0 });
class Router implements AiModels {
  readonly name = 'banco';
  readonly world = undefined;
  readonly usage = emptyUsage();
  limits = { text: Infinity };
  textModel = model;
  decide(call: unknown) {
    return local.decide(call as never);
  }
  text(call: TextCall): Promise<string> {
    this.usage.text++;
    return call.task === 'chunk.plan' ? gemini.text(call) : local.text(call);
  }
}
const k = await Kernel.boot({ files, store: memoryStore(), ai: new Router(), chunks });

// --- New places: around the places the universe has, the nearest rings first ---
const xs = [...planned].map((p) => p.split(',').map(Number));
const far = Math.max(...xs.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
const rows: Array<{ place: string; name: string; environment: string; fresh: boolean; structures: Array<{ concept: string; size?: string; seed?: number; worn: boolean }> }> = [];
let asked = 0;
outer: for (let d = 1; d <= far + 6; d++) {
  for (let cx = -d; cx <= d; cx++)
    for (const cy of [-d, d]) {
      for (const [x, y] of [[cx, cy], [cy, cx]]) {
        if (rows.length >= places || spent() >= ceiling) break outer;
        const key = `${x},${y}`;
        if (planned.has(key)) continue;
        planned.add(key);
        const known = k.reusable();
        const fresh = k.newStructureAllowed();
        const before = records.length;
        const how = await k.planAhead(x, y);
        asked += records.length - before;
        const ch = k.chunks.get(key);
        // Only a place the Cartographer planned (not the open sea, nor a fallback of the kernel).
        if (how !== 'nuovo' || records.length === before || !ch?.plan) continue;
        rows.push({ place: key, name: ch.plan.place.name, environment: ch.plan.layout, fresh, structures: (ch.plan.structures ?? []).map((s) => ({ concept: s.concept, ...(s.size ? { size: s.size } : {}), ...(s.seed !== undefined ? { seed: s.seed } : {}), worn: !!reusableOf(known, s.concept) })) });
        const r = rows[rows.length - 1];
        console.log(`${key} «${r.name}» (${r.environment})${fresh ? '' : ' [solo quelle del mondo]'}: ${r.structures.map((s) => `${s.worn ? '♻' : '✚'} ${s.concept}${s.size ? ` (${s.size})` : ''}`).join('; ') || 'nessuna struttura'}`);
      }
    }
}
const all = rows.flatMap((r) => r.structures);
const worn = all.filter((s) => s.worn).length;
const out = { universe: path.basename(dir), model, newStructuresPerHour: hour, known: k.reusable().length, places: rows.length, calls: asked, usd: spent(), structures: all.length, worn, fresh: all.length - worn, placesWithFresh: rows.filter((r) => r.structures.some((s) => !s.worn)).length, rows };
console.log(`\n${out.places} luoghi del Cartografo (${out.calls} chiamate, ${out.usd.toFixed(3)} $), ${out.known} strutture del mondo offerte: ${out.structures} strutture nei piani, ${worn} riusate, ${out.fresh} concetti nuovi (${out.placesWithFresh} luoghi su ${out.places} con un concetto nuovo)`);
const json = opt('--json');
if (json) fs.writeFileSync(json, JSON.stringify(out, null, 1) + '\n');
process.exit(0);
