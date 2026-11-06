// T273: the structures of Claude Cloud in the four universes, on the real Kernel with the offline models (MockAiModels), as the installation
// leaves them (`componi`: the files, the maps, the seed's upgrade the browser would apply):
//   npx vite-node lab/banco/universi-cloud/strumenti/verifica-strutture.ts            all four
//   npx vite-node lab/banco/universi-cloud/strumenti/verifica-strutture.ts -- aurora  one
// The wanderer goes to each planned place (the carpet's offset, as a saved game is loaded), the world ticks (at least 600 ticks in all),
// and then: no fault seen; every structure standing on a lot is the model its plan names, from the library (no `wanted`: the ModelDirector
// never asks the Sculptor), and its form is built (the program runs in its library box, the cellar under the ground) with voxels in it.
// It writes what it saw in lab/banco/universi-cloud/verifica-strutture.json (beside the universes, not in one).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Kernel } from '../../../../src/kernel/kernel';
import { memoryStore } from '../../../../src/kernel/repo';
import { MockAiModels } from '../../../../src/kernel/ai/mock';
import type { Form } from '../../../../src/kernel/forms';
import { negozioMappe } from './carica';
import { luogoDi, PROGETTO, strutture, UNIVERSI } from './cloud';
import { componi } from './installa';

const DT = 1 / 60;
const TICKS = 600;
const settle = (ms = 10) => new Promise((r) => setTimeout(r, ms));
const solo = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const report: Record<string, unknown> = {};
let falliti = 0;

for (const u of UNIVERSI) {
  if (solo.length && !solo.includes(u.nome)) continue;
  const t0 = Date.now();
  const { files, maps: raw } = componi(u);
  const maps = Object.fromEntries(Object.entries(raw).map(([p, text]) => [p.slice(5, -5), JSON.parse(text)]));
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), chunks: negozioMappe(files, maps) });
  const S = k.config.chunkSize;
  const problemi: string[] = [];
  const fault = new Set<string>();
  let ticks = 0;
  const tick = async (n = 1) => {
    for (let i = 0; i < n; i++) {
      k.tick(DT);
      ticks++;
      for (const f of k.faults.list()) fault.add(`${f.key}: ${f.message}`);
    }
    await settle(5);
  };
  const luoghi = Object.keys(maps).map((n) => luogoDi(files, n)!).filter(Boolean);
  // Every structure of a place, on its lot, while the wanderer is there (the places far away are let go): the model its plan names, from the library.
  const viste: Array<{ cx: number; cy: number; luogo: string; concetto: string; modello: string; taglia?: string; voxel: number; cantina: number; ms: number }> = [];
  const forms: Array<Promise<void>> = [];
  const visti = new Set<number>();
  const guarda = (key: string) => {
    for (const id of k.ecs.query('structure', 'form', 'chunk')) {
      if ((k.ecs.get(id, 'chunk') as { key: string }).key !== key || visti.has(id)) continue;
      visti.add(id);
      const s = k.ecs.get(id, 'structure') as { concept: string; model?: string; size?: string };
      const form = k.ecs.get(id, 'form') as { model: string; seed: number; wanted?: string };
      const [cx, cy] = key.split(',').map(Number);
      const luogo = (k.chunks.get(key) as any)?.place?.name ?? '?';
      if (form.wanted) problemi.push(`(${key}) «${s.concept}» vuole ${form.wanted}`);
      if (!s.model?.startsWith('struttura-')) continue;
      if (form.model !== s.model) problemi.push(`(${key}) «${s.concept}» è ${form.model}, non ${s.model}`);
      const t = Date.now();
      forms.push(
        (async () => {
          let f: Form | undefined = k.forms.get(form.model, form.seed);
          while (f && f.status === 'pending') {
            await settle(20);
            f = k.forms.get(form.model, form.seed);
          }
          const voxel = f?.result ? f.result.grid.cells.reduce((n, v) => n + (v ? 1 : 0), 0) : 0;
          if (f?.status !== 'ready' || !voxel) problemi.push(`(${key}) «${s.concept}»: la forma non c'è (${f?.status ?? 'nessuna'}${f?.error ? `: ${f.error}` : ''})`);
          viste.push({ cx, cy, luogo, concetto: s.concept, modello: form.model, ...(s.size ? { taglia: s.size } : {}), voxel, cantina: f?.base ?? 0, ms: Date.now() - t });
        })(),
      );
    }
  };
  for (const [cx, cy] of luoghi) {
    const c = k.carpet()!;
    const p = k.wandererPos();
    c.ox = cx * S + S / 2 - p.x;
    c.oy = cy * S + S / 2 - p.y;
    for (let i = 0; i < 60 && (k.chunks.get(`${cx},${cy}`) as any)?.stage !== 'planned'; i++) await tick(1);
    await tick(4);
    if ((k.chunks.get(`${cx},${cy}`) as any)?.stage !== 'planned') problemi.push(`(${cx}, ${cy}) non si carica`);
    guarda(`${cx},${cy}`);
  }
  await Promise.all(forms);
  if (ticks < TICKS) await tick(TICKS - ticks);
  for (let i = 0; i < 10; i++) await settle(20);
  await tick(1);
  // Every structure of the theme's catalogue is somewhere in the world.
  const modelli = new Set(viste.map((v) => v.modello));
  for (const s of strutture(u.tema)) if (!modelli.has(s.id)) problemi.push(`${s.id} non sta su nessun lotto`);
  for (const s of strutture(u.tema).filter((s) => s.cantina)) {
    const v = viste.find((x) => x.modello === s.id);
    if (v && !v.cantina) problemi.push(`${s.id}: la cantina non c'è`);
  }
  if (fault.size) problemi.push(...[...fault].map((f) => `fault: ${f}`));
  viste.sort((a, b) => Math.hypot(a.cx, a.cy) - Math.hypot(b.cx, b.cy) || a.cy - b.cy || a.cx - b.cx);
  report[u.nome] = { tick: ticks, luoghi: luoghi.length, strutture: viste, fault: [...fault], esito: problemi.length ? problemi : 'verde', secondi: Math.round((Date.now() - t0) / 1000) };
  console.log(`== ${u.nome}: ${viste.length} strutture costruite in ${luoghi.length} luoghi, ${ticks} tick, ${fault.size} fault${problemi.length ? `\n  ✗ ${problemi.join('\n  ✗ ')}` : ' — verde'}`);
  for (const v of viste) console.log(`  (${v.cx}, ${v.cy}) ${v.luogo}: ${v.concetto} → ${v.modello}${v.taglia ? ` (${v.taglia})` : ''}, ${v.voxel} voxel${v.cantina ? `, cantina ${v.cantina}` : ''}, ${v.ms} ms`);
  if (problemi.length) falliti++;
}
if (!solo.length) writeFileSync(join(PROGETTO, 'lab/banco/universi-cloud/verifica-strutture.json'), JSON.stringify(report, null, 1) + '\n');
process.exit(falliti ? 1 : 0);
