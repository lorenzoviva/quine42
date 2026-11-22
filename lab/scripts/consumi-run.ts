// T488: what the first run of the beta (T457) paid for and what the wanderer saw of it, from the run's universe on disk, read only:
//   npx vite-node lab/scripts/consumi-run.ts -- <cartella dell'universo> [--tag prima-della-run-1] [--giorno 2026-11-21] [--json f]
// The kernel does not keep the wanderer's path; it is rebuilt from what the universe has: the position and the world's time of every «salvataggio
// della partita» commit after the tag, and between two of them the places where something was taken (`state.json → consumed`, in the order it
// was taken: an origin is `<cx>,<cy>#…`), at their middle. A save exactly at (0, 0) after another far away is the respawn after a death: no walk
// between. A stretch whose save says «al timone» is sailed (the camera at `HELM_VIEW`). Reached: the places the path crosses. Seen: the places
// the camera's rectangle touches along it (`fitView` at the camera's distance, 16:9, the camera not turned). The plans added after the tag are
// the Cartographer's (with a card) or the kernel's (the open sea, no call); the items defined are the ones the run added to `items.citati`,
// seen if a seen place's plan names them on the ground; the models, the run's entries of models/index.json.
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { HELM_VIEW, ZOOM } from '../../src/render/camera';
import { inReachOf, REACH, type Reach } from '../../src/kernel/reach';

const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (name: string, def?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const dir = path.resolve(args[0] ?? '.');
const tag = opt('--tag', 'prima-della-run-1')!;
const day = opt('--giorno', '2026-11-21')!;
const S = 18;
const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', maxBuffer: 1e9 });
const at = (rev: string, file: string) => JSON.parse(git('show', `${rev}:${file}`));

// --- The path ---
type Point = { x: number; y: number; t?: number; helm: boolean; jump?: boolean; why: string };
const saves = git('log', '--reverse', '--format=%h', `${tag}..HEAD`, '--grep=salvataggio della partita').trim().split('\n').filter(Boolean);
const start = at(tag, 'world/state.json');
const path0: Point[] = [{ x: 0, y: 0, t: start.time, helm: false, why: 'arrivo' }];
let consumedBefore: string[] = start.consumed ?? [];
for (const c of saves) {
  const me = at(c, 'world/players/me.json');
  const st = at(c, 'world/state.json');
  const helm = Object.keys(me.states ?? {}).includes('al timone');
  const consumed: string[] = st.consumed ?? [];
  const fresh = consumed.filter((o) => !consumedBefore.includes(o));
  consumedBefore = consumed;
  const places: string[] = [];
  for (const o of fresh) {
    const place = o.split('#')[0];
    if (places[places.length - 1] !== place) places.push(place);
  }
  for (const p of places) {
    const [cx, cy] = p.split(',').map(Number);
    path0.push({ x: cx * S + S / 2, y: cy * S + S / 2, helm, why: `preso in ${p}` });
  }
  const prev = path0[path0.length - 1];
  const respawn = me.pos.x === 0 && me.pos.y === 0 && Math.hypot(prev.x, prev.y) > S;
  path0.push({ x: me.pos.x, y: me.pos.y, t: st.time, helm, jump: respawn, why: respawn ? 'rinato' : 'salvataggio' });
}

/** The place of a point of the world. */
const placeOf = (x: number, y: number) => `${Math.floor(x / S)},${Math.floor(y / S)}`;
/** The camera's rectangle at a distance (as `Renderer.fitView`, 16:9, not turned): half its sides in tiles. */
const rect = (distance: number) => ({ w: Math.ceil(distance * 2.4 * (16 / 9)) / 2, h: Math.ceil(distance * 2.2) / 2 });
const walkView = rect(ZOOM.max);
const helmView = rect(HELM_VIEW);
const reached = new Set<string>();
const seen = new Set<string>();
const loadedOld = new Set<string>();
const near = new Map<number, Set<string>>();
const RADII = [0, 6, 9, 18];
for (const r of RADII) near.set(r, new Set());
let walked = 0, sailed = 0;
const mark = (x: number, y: number, helm: boolean) => {
  reached.add(placeOf(x, y));
  const v = helm ? helmView : walkView;
  for (let cy = Math.floor((y - v.h) / S); cy <= Math.floor((y + v.h) / S); cy++) for (let cx = Math.floor((x - v.w) / S); cx <= Math.floor((x + v.w) / S); cx++) seen.add(`${cx},${cy}`);
  // What the kernel loaded (and so planned) before T488: the rectangle and a place more on every side (`wantChunks`).
  for (let cy = Math.floor((y - v.h) / S) - 1; cy <= Math.floor((y + v.h) / S) + 1; cy++) for (let cx = Math.floor((x - v.w) / S) - 1; cx <= Math.floor((x + v.w) / S) + 1; cx++) loadedOld.add(`${cx},${cy}`);
  // The places whose square is within r tiles of the wanderer.
  for (const r of RADII)
    for (let cy = Math.floor((y - r) / S); cy <= Math.floor((y + r) / S); cy++)
      for (let cx = Math.floor((x - r) / S); cx <= Math.floor((x + r) / S); cx++) {
        const dx = Math.max(cx * S - x, 0, x - (cx + 1) * S), dy = Math.max(cy * S - y, 0, y - (cy + 1) * S);
        if (Math.hypot(dx, dy) <= r) near.get(r)!.add(`${cx},${cy}`);
      }
};
for (let i = 0; i < path0.length; i++) {
  const b = path0[i];
  const a = i > 0 ? path0[i - 1] : b;
  if (b.jump || i === 0) {
    mark(b.x, b.y, b.helm);
    continue;
  }
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (b.helm) sailed += len;
  else walked += len;
  for (let s = 0; s <= Math.ceil(len); s++) mark(a.x + ((b.x - a.x) * s) / Math.max(1, Math.ceil(len)), a.y + ((b.y - a.y) * s) / Math.max(1, Math.ceil(len)), b.helm);
}

// --- The reach of T488 on the same path ---
// Times between two saves spread over the stretch by its length; a walker at every quarter of a second, its pace the stretch's.
const timed: Array<Point & { t: number }> = [];
for (let i = 0, j = 0; i < path0.length; i = j) {
  for (j = i + 1; j < path0.length && path0[j].t === undefined; j++);
  if (j >= path0.length) break;
  const legs: number[] = [];
  for (let m = i + 1; m <= j; m++) legs.push(path0[m].jump ? 0 : Math.hypot(path0[m].x - path0[m - 1].x, path0[m].y - path0[m - 1].y));
  const len = legs.reduce((a, b) => a + b, 0);
  let acc = 0;
  if (i === 0) timed.push({ ...path0[0], t: path0[0].t! });
  for (let m = i + 1; m <= j; m++) {
    acc += legs[m - i - 1];
    timed.push({ ...path0[m], t: path0[i].t! + (len ? (acc / len) * (path0[j].t! - path0[i].t!) : path0[j].t! - path0[i].t!) });
  }
}
const reachVariants: Array<[string, Reach]> = [
  ['T488', REACH],
  ['vicino 6', { ...REACH, near: 6 }],
  ['vicino 0', { ...REACH, near: 0 }],
  ['vicino 18', { ...REACH, near: 18 }],
];
const inReachSets = reachVariants.map(() => new Set<string>());
for (let i = 1; i < timed.length; i++) {
  const a = timed[i - 1], b = timed[i];
  if (b.jump) continue;
  const dt = Math.max(1e-6, b.t - a.t);
  const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
  for (let t = a.t; t <= b.t; t += 0.25) {
    const f = (t - a.t) / dt;
    const w = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, vx, vy };
    const pcx = Math.floor(w.x / S), pcy = Math.floor(w.y / S);
    for (let cy = pcy - 4; cy <= pcy + 4; cy++) for (let cx = pcx - 4; cx <= pcx + 4; cx++) reachVariants.forEach(([, r], n) => inReachOf(w, cx, cy, S, r) && inReachSets[n].add(`${cx},${cy}`));
  }
}

// --- The plans ---
const status = git('diff', '--name-status', tag, 'HEAD', '--', 'maps').trim().split('\n').filter(Boolean).map((l) => l.split('\t'));
type Plan = { place: { name: string }; layout: string; ground?: string[]; structures?: Array<{ concept: string } | string>; card?: { usd?: number }; fresh?: unknown[] };
const plans = new Map<string, { plan: Plan; added: boolean }>();
for (const [s, f] of status) {
  const m = f.match(/_(-?\d+)_(-?\d+)\.json$/);
  if (!m) continue;
  const rec = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
  plans.set(`${m[1]},${m[2]}`, { plan: rec.plan, added: s === 'A' });
}
const added = [...plans].filter(([, p]) => p.added);
const cart = added.filter(([, p]) => p.plan.layout);
const sea = added.filter(([, p]) => !p.plan.layout);
const count = (keys: Iterable<string>, set: Set<string>) => [...keys].filter((k) => set.has(k)).length;
const cartKeys = cart.map(([k]) => k);

// --- The items defined ---
const itemsNow = JSON.parse(await fs.readFile(path.join(dir, 'modules/items.citati/manifest.json'), 'utf8')).items as Array<{ id: string; name: string; model?: string }>;
const itemsBefore = new Set((at(tag, 'modules/items.citati/manifest.json').items as Array<{ id: string }>).map((i) => i.id));
const defined = itemsNow.filter((i) => !itemsBefore.has(i.id));
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const groundIn = new Map<string, string[]>();
for (const [key, p] of plans) for (const g of p.plan.ground ?? []) groundIn.set(norm(g), [...(groundIn.get(norm(g)) ?? []), key]);
const me = JSON.parse(await fs.readFile(path.join(dir, 'world/players/me.json'), 'utf8'));
const carried = new Set<string>((me.inventory?.slots ?? []).filter(Boolean).map((s: { item: string }) => s.item));
let definedSeen = 0, definedReached = 0, definedNowhere = 0;
for (const d of defined) {
  const where = groundIn.get(norm(d.name)) ?? [];
  if (!where.length) definedNowhere++;
  if (where.some((k) => seen.has(k))) definedSeen++;
  if (where.some((k) => reached.has(k)) || carried.has(d.id)) definedReached++;
}

// --- The models ---
const modelsNow = JSON.parse(await fs.readFile(path.join(dir, 'models/index.json'), 'utf8')) as Record<string, { class?: string; size?: string; author?: string; name?: string }>;
const modelsBefore = at(tag, 'models/index.json') as Record<string, unknown>;
const newModels = Object.entries(modelsNow).filter(([id]) => !modelsBefore[id]);
const structureRows = newModels
  .filter(([, i]) => i.class === 'structure')
  .map(([id, i]) => {
    const where = [...plans].filter(([, p]) => (p.plan.structures ?? []).some((s) => norm(typeof s === 'string' ? s : s.concept) === norm(i.name ?? ''))).map(([k]) => k);
    return { id, name: i.name ?? id, author: i.author ?? '', where, seen: where.some((k) => seen.has(k)), reached: where.some((k) => reached.has(k)) };
  });

// --- The calls ---
const usage = JSON.parse(await fs.readFile(path.join(dir, 'world/usage.json'), 'utf8'));
const calls: Array<{ model: string; task: string; calls: number; usd: number }> = [];
for (const [model, byTask] of Object.entries(usage.days?.[day] ?? {}) as Array<[string, Record<string, { calls?: number; usd?: number }>]>)
  for (const [task, r] of Object.entries(byTask)) if (r && typeof r === 'object' && r.calls) calls.push({ model, task, calls: r.calls, usd: r.usd ?? 0 });
calls.sort((a, b) => b.usd - a.usd);
const total = calls.reduce((s, c) => s + c.usd, 0);
const seconds = (path0[path0.length - 1].t ?? 0) - (path0[0].t ?? 0);

const out = {
  minutes: seconds / 60,
  usd: total,
  path: { points: path0.length, walked: Math.round(walked), sailed: Math.round(sailed) },
  places: { added: added.length, cartographer: cart.length, sea: sea.length, cartographerUsd: cart.reduce((s, [, p]) => s + (p.plan.card?.usd ?? 0), 0), reached: reached.size, seen: seen.size, cartReached: count(cartKeys, reached), cartSeen: count(cartKeys, seen), cartInOldLoad: count(cartKeys, loadedOld), reach: Object.fromEntries(reachVariants.map(([name], n) => [name, { all: inReachSets[n].size, cart: count(cartKeys, inReachSets[n]), reached: count(reached, inReachSets[n]) }])), near: Object.fromEntries(RADII.map((r) => [r, { all: near.get(r)!.size, cart: count(cartKeys, near.get(r)!) }])) },
  items: { defined: defined.length, seen: definedSeen, reached: definedReached, nowhere: definedNowhere, carried: carried.size },
  models: newModels.map(([id, i]) => ({ id, class: i.class, author: i.author })),
  structures: structureRows,
  calls,
};
const json = opt('--json');
if (json) await fs.writeFile(json, JSON.stringify(out, null, 1));
// The path with its times, for the walk of `sessione-cammino.ts`.
const walk = opt('--percorso');
if (walk) await fs.writeFile(walk, JSON.stringify({ from: `${path.basename(dir)} ${tag}..HEAD`, seconds, points: timed.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, t: Math.round((p.t - timed[0].t) * 10) / 10, ...(p.helm ? { helm: true } : {}), ...(p.jump ? { jump: true } : {}), why: p.why })) }, null, 1) + '\n');

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');
const lines = [
  `Run di ${out.minutes.toFixed(1)} minuti del mondo, ${total.toFixed(2)} $ nel registro dell'universo (${day}).`,
  `Il percorso ricostruito: ${path0.length} punti, ${out.path.walked} caselle a piedi, ${out.path.sailed} al timone.`,
  '',
  `| | luoghi |`,
  `|---|---|`,
  `| pianificati nella run | ${added.length} (${cart.length} dal Cartografo, ${out.places.cartographerUsd.toFixed(3)} $ nelle carte; ${sea.length} mare aperto del kernel) |`,
  `| del Cartografo dentro ciò che il kernel caricava (vista + un luogo) | ${out.places.cartInOldLoad} (${pct(out.places.cartInOldLoad, cart.length)}: la ricostruzione regge) |`,
  `| del Cartografo visti (nel rettangolo della camera) | ${out.places.cartSeen} (${pct(out.places.cartSeen, cart.length)}) |`,
  `| del Cartografo raggiunti (attraversati dal percorso) | ${out.places.cartReached} (${pct(out.places.cartReached, cart.length)}) |`,
  ...RADII.map((r) => `| del Cartografo entro ${r} caselle dal percorso | ${out.places.near[r].cart} (${pct(out.places.near[r].cart, cart.length)}) |`),
  '',
  `Il raggio di T488 sullo stesso percorso (\`src/kernel/reach.ts\`: vicino ${REACH.near} caselle, ${REACH.ahead} s di via davanti fino a ${REACH.aheadMax} caselle, ${REACH.side} di lato): i luoghi che sarebbero stati in raggio.`,
  '',
  '| regola | luoghi in raggio | di quelli che il Cartografo pianificò | raggiunti coperti |',
  '|---|---|---|---|',
  ...reachVariants.map(([name], n) => `| ${name} | ${inReachSets[n].size} | ${count(cartKeys, inReachSets[n])} | ${count(reached, inReachSets[n])} di ${reached.size} |`),
  '',
  `Oggetti definiti (\`content.define\`): ${defined.length}; nominati a terra in un luogo visto ${definedSeen} (${pct(definedSeen, defined.length)}), in un luogo raggiunto o nella borsa ${definedReached} (${pct(definedReached, defined.length)}); ${definedNowhere} senza un piano che li nomini; nella borsa alla fine ${carried.size} tipi.`,
  '',
  `Modelli nuovi: ${newModels.length} (${newModels.filter(([, i]) => i.class === 'structure').length} strutture).`,
  '',
  '| struttura | autore | luoghi che la chiedono | vista | raggiunta |',
  '|---|---|---|---|---|',
  ...structureRows.map((s) => `| ${s.name} | ${s.author} | ${s.where.join(' ') || '—'} | ${s.seen ? 'sì' : 'no'} | ${s.reached ? 'sì' : 'no'} |`),
  '',
  '| modello | compito | chiamate | $ |',
  '|---|---|---|---|',
  ...calls.map((c) => `| ${c.model} | ${c.task} | ${c.calls} | ${c.usd.toFixed(3)} |`),
];
console.log(lines.join('\n'));
