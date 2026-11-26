// T513: whether the buildings with an interior of a universe on the disk are walked as the world wears them: every structure of its
// plans that wears a model with an interior (`models/index.json → interior`), at the seed of its place (ADR-0247) or at 1..4, bare and
// furnished: the storeys reached, the rooms of the ground floor a body stands in and the walk from the door does not reach (a room with no
// door into it, `closedRoomErrors`), the storeys over the ground, the rooms the Scenografo's furniture shuts to who walks (a piece in front of
// the door); then the models to sculpt again, with the command that puts them in the Sculptor's queue (`--rigenera modelli --tipi`).
//   npx vite-node lab/scripts/interni-percorsi.ts -- universes/<nome> [--solo id,…] [--semi 1,2,3] [--json f]
// No calls, writes nothing in the universe.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { aboveGround, FormCache, Forms, InlineRunner, runForm, storeysOf, walkIn } from '../../src/kernel/forms';
import { closedRoomErrors } from '../../src/mj/check';
import { reusableStructures } from '../../src/kernel/reuse';
import { roomsReached } from '../../src/kernel/interior';
import type { FileMap } from '../../src/kernel/types';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dir = path.resolve(args.find((a, k) => !a.startsWith('--') && !args[k - 1]?.startsWith('--')) ?? 'universe');
const only = opt('--solo')?.split(',');
const given = opt('--semi')?.split(',').map(Number);

const files: Record<string, string> = {};
for (const f of await fs.readdir(path.join(dir, 'models'))) files[`models/${f}`] = await fs.readFile(path.join(dir, 'models', f), 'utf8');
const forms = new Forms(new InlineRunner(new FormCache()));
forms.load(files as FileMap);
const index = JSON.parse(files['models/index.json'] ?? '{}') as Record<string, { interior?: unknown; name?: string }>;
const reusable = reusableStructures(files as FileMap, () => true, () => 0, true);
const modelOf = (concept: string, size?: string) => {
  const s = reusable.find((r) => r.concept.toLowerCase() === concept.toLowerCase());
  return s?.entries.find((e) => e.size === (size ?? 'large'))?.id;
};

// The seeds the plans wear each model at.
const seeds = new Map<string, Set<number>>();
const maps = await fs.readdir(path.join(dir, 'maps')).catch(() => [] as string[]);
for (const f of maps) {
  const j = JSON.parse(await fs.readFile(path.join(dir, 'maps', f), 'utf8'));
  for (const s of (j.plan ?? j).structures ?? []) {
    const id = s.model ?? (s.concept ? modelOf(s.concept, s.size) : undefined);
    if (!id || !index[id]?.interior || typeof s.seed !== 'number') continue;
    (seeds.get(id) ?? seeds.set(id, new Set()).get(id)!).add(s.seed);
  }
}
const out: unknown[] = [];
const broken = new Set<string>();
for (const id of Object.keys(index).filter((k) => index[k].interior)) {
  if (only && !only.includes(id)) continue;
  const list = given ?? [...new Set([1, 2, 3, 4, ...(seeds.get(id) ?? [])])].sort((a, b) => a - b);
  for (const seed of list) {
    const q = forms.request(id, seed);
    if (!q) continue;
    const t0 = performance.now();
    let row: Record<string, unknown>;
    try {
      const bare = runForm({ ...q, interior: undefined });
      const furnished = q.interior ? runForm(q) : undefined;
      const base = q.base ?? 0;
      const w0 = walkIn(bare.grid, bare.palette, q.vpt, base, bare.model.actions, seed);
      const r0 = roomsReached(w0, q.vpt, base);
      // On foot (no jumps): the rooms the Scenografo's furniture shuts to who does not jump over it.
      let shut: number[] = [];
      if (furnished && furnished.grid !== bare.grid) {
        const f0 = walkIn(bare.grid, bare.palette, q.vpt, base, bare.model.actions, seed, { jumps: false });
        const f1 = walkIn(furnished.grid, furnished.palette, q.vpt, base, bare.model.actions, seed, { jumps: false });
        const on = (w: typeof f0, r: (typeof r0.rooms)[number]) => r.cells.some(([i, z]) => w.reached(i % w.g.X, Math.floor(i / w.g.X), z));
        shut = r0.rooms.filter((r) => on(f0, r) && !on(f1, r)).map((r) => r.area);
      }
      const storeys = aboveGround(storeysOf(w0, q.vpt), base, q.vpt).length;
      const closed = closedRoomErrors(r0.rooms);
      row = { id, seed, rooms: r0.rooms.map((r) => r.area), closed: r0.rooms.filter((r) => !r.reached).map((r) => r.area), storeys, pieces: furnished?.furniture?.length ?? 0, shut };
      if (closed.length || storeys < 2 || shut.length) broken.add(id);
    } catch (e) {
      row = { id, seed, error: (e as Error).message };
      broken.add(id);
    }
    out.push(row);
    console.log(`${id} seme ${seed}: ${JSON.stringify(row)} (${Math.round(performance.now() - t0)} ms)`);
  }
}
console.log(
  broken.size
    ? `\nda rifare (una stanza a terra chiusa, meno di due piani, una stanza che i mobili chiudono): ${[...broken].join(', ')}\nnella coda dello Scultore: npm run genera -- ${path.basename(dir)} --rigenera modelli --tipi ${[...broken].join(',')}`
    : '\nogni edificio arredato si percorre',
);
const json = opt('--json');
if (json) await fs.writeFile(json, JSON.stringify({ universe: path.basename(dir), rows: out }, null, 1) + '\n');
