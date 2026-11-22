// The fingerprint of the places' meshes (T486): every place the seed's offline kernel loads in a few spots (the start, the place with the
// most relief near it, a coast), each one built as the renderer builds it (`buildChunk`), hashed byte by byte: the children of its group in
// order, what each is (mesh or instances, material, shadows, order, userData), every attribute of its geometry (name, size, array type,
// bytes), the bounding sphere, the instances' matrices. Twice for each place: with the terrains' models ready (their instances) and
// without (the stand-ins). Also a cellar at 16 voxels a tile (a hole on sub-cells, T415), an islet in the sea (the water, the foam, T451)
// and a land over the void (the slab, T445). What changes the meshes changes the fingerprint: run it before and after a change that should
// not (the mesh in a worker, T486). No calls, nothing written but `--json`:
//
//   npx vite-node lab/scripts/impronta-terreno.ts -- [--json f.json] [--luoghi]
//
// `--luoghi` prints the fingerprint of every place, not only the whole.

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { bundledFiles } from '../../src/kernel/bundle';
import { Kernel } from '../../src/kernel/kernel';
import { MockAiModels } from '../../src/kernel/ai/mock';
import { memoryStore } from '../../src/kernel/repo';
import { InlineRunner, runForm, type FormComp, type FormRequest, type FormResult, type FormRunner } from '../../src/kernel/forms';
import { formMeshes } from '../../src/render/formmeshes';
import { buildChunk } from '../../src/render/terrain';

const argv = process.argv.slice(2);
const opt = (k: string) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The house with a cellar of tests/cellar.test.ts at 16 voxels a tile: its cellar's edges are not on the tiles' edges.
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  `  <box at="${(x0 + x1) / 2} ${(y0 + y1) / 2} ${z0}" size="${x1 - x0 + 1} ${y1 - y0 + 1} ${z1 - z0 + 1}" color="S"/>`;
const stair = Array.from({ length: 5 }, (_, i) => box(30 + 8 * i, 37 + 8 * i, 40, 59, 0, 19 - 3 * (i + 1)));
const HOUSE = `<sequence values="BS" name="Casa con cantina">
  <color symbol="S" value="8a8070" name="pietra"/>
${[box(20, 79, 20, 79, 0, 1), box(20, 21, 20, 79, 0, 19), box(78, 79, 20, 79, 0, 19), box(22, 77, 20, 21, 0, 19), box(22, 77, 78, 79, 0, 19),
  box(22, 29, 22, 77, 18, 19), box(70, 77, 22, 77, 18, 19), box(30, 69, 22, 39, 18, 19), box(30, 69, 60, 77, 18, 19), ...stair].join('\n')}
</sequence>`;
const index = JSON.parse(bundledFiles['models/index.json']!);
index['cantina-impronta'] = { class: 'structure', name: 'casa con cantina', sotto: 1 };
const files = { ...bundledFiles, 'models/cantina-impronta.xml': HOUSE, 'models/index.json': JSON.stringify(index) };

/** The models of the terrains (trees, rocks) with their meshes, as the browser's worker makes them: in Node the forms have only their grid. */
const terrainModels = new Set<string>(
  Object.values(JSON.parse(bundledFiles['modules/world.terrain/manifest.json']!).tiles as Record<string, { model?: string }>).flatMap((t) => (t.model ? [t.model] : [])),
);
class Meshing implements FormRunner {
  private inline = new InlineRunner();
  async run(q: FormRequest): Promise<FormResult> {
    if (!q.model || !terrainModels.has(q.model)) return this.inline.run(q);
    const r = runForm(q);
    const { model: _m, finished: _f, ...result } = r;
    return { ...result, meshes: formMeshes(r, q) };
  }
}

const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), forms: new Meshing() });
const S = k.config.chunkSize;

/** Ticks until every loaded place is planned (or a minute), and the set of the loaded ones has stayed the same for a while. */
async function settle(): Promise<void> {
  let last = '', still = 0;
  for (let i = 0; i < 2400; i++) {
    k.tick(1 / 60);
    await sleep(5);
    const now = [...k.chunks.values()].map((c) => `${c.key}:${c.stage}:${c.version}`).sort().join('|');
    const done = [...k.chunks.values()].every((c) => c.stage === 'planned' || c.held);
    still = now === last ? still + 1 : 0;
    last = now;
    if (done && still >= 40) return;
  }
}

/** Every terrain's model ready, its three seeds (the instances on its tiles). */
async function modelsReady(): Promise<void> {
  for (const t of Object.values(k.palette)) if (t.model) for (let s = 1; s <= 3; s++) await k.forms.wait(t.model, s);
  k.tick(1 / 60);
}

const sha = (bytes: ArrayBufferView | string) =>
  createHash('sha256').update(typeof bytes === 'string' ? bytes : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)).digest('hex').slice(0, 16);
/** The materials by the order they are first seen: the same modules make the same objects, run after run. */
const materials = new Map<THREE.Material, number>();
const materialOf = (m: THREE.Material | THREE.Material[]) =>
  (Array.isArray(m) ? m : [m]).map((x) => (materials.get(x) ?? materials.set(x, materials.size).get(x)!) + ':' + x.type).join('+');

function geometryPrint(g: THREE.BufferGeometry): string {
  const parts = Object.entries(g.attributes).map(([name, a]) => {
    const at = a as THREE.BufferAttribute;
    return `${name}/${at.itemSize}/${at.normalized ? 'n' : ''}${at.array.constructor.name}/${at.count}/${sha(at.array as ArrayBufferView)}`;
  });
  const s = g.boundingSphere;
  return `${parts.join(',')}|${g.index ? sha(g.index.array as ArrayBufferView) : '-'}|${g.groups.length}|${s ? `${s.center.toArray().join(',')},${s.radius}` : '-'}`;
}

/** What a place's group is, byte by byte. */
function groupPrint(group: THREE.Group): string {
  const lines = [`group ${group.position.toArray().join(',')}`];
  for (const o of group.children) {
    const m = o as THREE.Mesh;
    const common = `${o.type} ${materialOf(m.material)} cast=${m.castShadow} receive=${m.receiveShadow} order=${o.renderOrder} ${JSON.stringify(o.userData)} depth=${!!m.customDepthMaterial}`;
    if (o instanceof THREE.InstancedMesh) {
      const s = o.boundingSphere;
      lines.push(`${common} count=${o.count} matrices=${sha(o.instanceMatrix.array as Float32Array)} sphere=${s ? `${s.center.toArray().join(',')},${s.radius}` : '-'} geometry=${geometryPrint(o.geometry)}`);
    } else lines.push(`${common} ${geometryPrint(m.geometry)}`);
  }
  return lines.join('\n');
}

const prints = new Map<string, string>();
const times: number[] = [];
/** Every loaded place, with the terrains' models (as they are now) and without them (the stand-ins). */
function printAll(stage: string): void {
  for (const ch of [...k.chunks.values()].sort((a, b) => a.cx - b.cx || a.cy - b.cy)) {
    const t0 = performance.now();
    const view = buildChunk(k, ch);
    times.push(performance.now() - t0);
    prints.set(`${stage} ${ch.key} modelli`, sha(groupPrint(view.group)));
    // Without the models: the stand-ins of trees and rocks (the palette's entries for a moment as if they had none).
    const kept = Object.entries(k.palette).filter(([, t]) => t.model).map(([code, t]) => [code, t.model] as const);
    for (const [code] of kept) delete k.palette[code]!.model;
    try {
      prints.set(`${stage} ${ch.key} senza`, sha(groupPrint(buildChunk(k, ch).group)));
    } finally {
      for (const [code, model] of kept) k.palette[code]!.model = model;
    }
  }
}

const carpet = k.carpet()!;
const goTo = async (cx: number, cy: number) => {
  carpet.active = false;
  Object.assign(k.wandererPos(), { x: 0, y: 0 });
  carpet.ox = cx * S + S / 2;
  carpet.oy = cy * S + S / 2;
  await settle();
  await modelsReady();
};

// 1. The start, with the cellar near it.
await settle();
await modelsReady();
carpet.active = false;
let spot: [number, number] | undefined;
for (let y = -20; y <= 20 && !spot; y++)
  for (let x = -20; x <= 20 && !spot; x++) {
    let ok = true;
    const g = k.groundAt(x + 0.5, y + 0.5);
    for (let dy = -2; dy <= 2 && ok; dy++)
      for (let dx = -2; dx <= 2 && ok; dx++) ok = k.free(x + dx + 0.5, y + dy + 0.5, 0.45) && k.groundAt(x + dx + 0.5, y + dy + 0.5) === g && !!k.chunkAt(x + dx, y + dy)?.plan;
    if (ok) spot = [x + 0.5, y + 0.5];
  }
if (spot) {
  const id = k.spawnModuleEntity(k.modules.get('object.well')!, spot[0], spot[1], undefined, 'impronta#cantina');
  Object.assign(k.ecs.get(id, 'form') as FormComp, { model: 'cantina-impronta', seed: 1, yaw: 0 });
  k.ecs.set(id, 'structure', {});
  await k.forms.wait('cantina-impronta', 1);
  k.tick(1 / 60);
}
const holes = [...k.chunks.values()].reduce((n, c) => n + k.holesIn(c).size, 0);
printAll('partenza');

// 2. An islet in the sea and a land over the void, on two places of the start (their neighbours see them across the edge).
const liquid = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'liquid')!;
const land = Object.keys(k.palette).find((c) => k.palette[c]!.layer === 'ground' && !k.palette[c]!.solid)!;
const [a, b] = [...k.chunks.values()].filter((c) => c.stage === 'planned' && !k.holesIn(c).size).sort((x, y) => x.cx - y.cx || x.cy - y.cy);
if (a && b) {
  a.tiles = Array.from({ length: S * S }, (_, i) => (i % S >= 7 && i % S < 11 && Math.floor(i / S) >= 7 && Math.floor(i / S) < 11 ? land : liquid)).join('');
  a.version++;
  k.palette['~'] ??= { id: 'void', name: 'vuoto', color: '#000000', solid: true, layer: 'void' } as (typeof k.palette)[string];
  b.tiles = Array.from({ length: S * S }, (_, i) => (Math.abs((i % S) - S / 2) + Math.abs(Math.floor(i / S) - S / 2) < 6 ? land : '~')).join('');
  b.version++;
  printAll('isola e vuoto');
}

// 3. The place with the most relief near the start (T459: (−2, −4)), and a coast farther on.
await goTo(-2, -4);
printAll('rilievo');
await goTo(6, 3);
printAll('costa');

const whole = sha([...prints].map(([key, p]) => `${key} ${p}`).join('\n'));
const median = [...times].sort((x, y) => x - y)[Math.floor(times.length / 2)] ?? 0;
console.log(`impronta delle mesh dei luoghi: ${whole}`);
const differ = [...prints].filter(([key, p]) => key.endsWith(' modelli') && prints.get(key.replace(/ modelli$/, ' senza')) !== p).length;
console.log(`${prints.size} mesh (${prints.size / 2} luoghi con e senza i modelli dei terreni, ${differ} con alberi e rocce dei modelli), ${holes} caselle sopra una cantina, buildChunk mediana ${median.toFixed(2)} ms`);
if (argv.includes('--luoghi')) for (const [key, p] of prints) console.log(`${p}  ${key}`);
const out = opt('json');
if (out) writeFileSync(out, JSON.stringify({ whole, places: Object.fromEntries(prints), holes, medianMs: median }, null, 1));
process.exit(0);
