// The cover of the terrains (T545, C1 of docs/design/terreno-ricco.md, ADR-0268): what grows or lies on the ground of a terrain, said by
// `TerrainDef.cover` (at most three kinds, 0-4 a tile) and read without trusting, scattered by a hash in the worker of the ground (never on
// paths, lots, doors, gates, under solid things or over a cellar), drawn as one InstancedMesh a form on the window under a cap; and open
// with the world on: the Council changes a terrain's cover with a commit, and one instance becomes a thing of the world (the stone the key
// lies under), kept in the place's plan and never drawn as cover again.

import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Kernel, type Chunk } from '../src/kernel/kernel';
import { bundledFiles } from '../src/kernel/bundle';
import { memoryStore } from '../src/kernel/repo';
import { MockAiModels } from '../src/kernel/ai/mock';
import { InlineRunner, runForm, type FormComp, type FormRequest, type FormResult, type FormRunner } from '../src/kernel/forms';
import { formMeshes } from '../src/render/formmeshes';
import {
  COVER_CAP,
  COVER_LIMITS,
  coverBudget,
  coverCount,
  coverErrors,
  coverInstance,
  coverOf,
  coverOnTile,
  keptOf,
  MAX_UNCOVERED,
  readCover,
  readUncovered,
  readUncoveredKeys,
  uncoveredKey,
} from '../src/kernel/cover';
import { Validator } from '../src/kernel/validator';
import { classOf } from '../src/mj/classes';
import { FORGE_CLASSES } from '../src/kernel/agents/forge';
import { buildChunk, chunkInput, coverForms, coverModels, coverReadiness } from '../src/render/terrain';
import { answerChunk, chunkArrays, COVER_STRIDE, inputSource, type ChunkArrays } from '../src/render/terrainmesh';
import { CoverLayer } from '../src/render/cover';

describe('la copertura dei terreni: il campo, la classe, lo spargimento (T545)', () => {
  it('si legge senza fidarsi: al più tre tipi, l’id di un programma, la densità 0-4 al suo passo, il primo di un programma', () => {
    expect(readCover([{ model: 'cover-tuft', density: 1.52 }])).toEqual([{ model: 'cover-tuft', density: 1.5 }]);
    expect(readCover([{ model: 'cover-tuft', density: 9 }])).toEqual([{ model: 'cover-tuft', density: COVER_LIMITS.density[1] }]);
    expect(readCover([{ model: 'a', density: 1 }, { model: 'a', density: 2 }, { model: 'b', density: 1 }, { model: 'c', density: 1 }, { model: 'd', density: 1 }])).toEqual([
      { model: 'a', density: 1 },
      { model: 'b', density: 1 },
      { model: 'c', density: 1 },
    ]);
    // What is not a kind is dropped; nothing left says none.
    expect(readCover([{ model: 'Bad Id', density: 1 }, { model: 'ok', density: NaN }, 'erba', null, { model: 'ok' }])).toBeNull();
    expect(readCover([{ model: 'a', density: 0 }, { model: 'b', density: -3 }])).toBeNull();
    expect(readCover([])).toBeNull();
    for (const bad of [undefined, null, 3, 'erba', { model: 'a', density: 1 }]) expect(readCover(bad), JSON.stringify(bad)).toBeUndefined();
  });

  it('cresce solo sulla terra che si cammina', () => {
    const cover = [{ model: 'cover-tuft', density: 1 }];
    expect(coverOf({ layer: 'ground', solid: false, cover })).toEqual(cover);
    expect(coverOf({ solid: false, cover })).toEqual(cover);
    for (const t of [{ layer: 'wall', solid: true }, { layer: 'floor', solid: false }, { layer: 'liquid', solid: true }, { layer: 'vegetation', solid: true }, { layer: 'rock', solid: true }, { layer: 'void', solid: true }, { layer: 'ground', solid: true }])
      expect(coverOf({ ...t, cover }), t.layer).toBeUndefined();
    expect(coverOf(undefined)).toBeUndefined();
  });

  it('il validatore vuole al più tre tipi, ognuno l’id di un programma e una densità fra 0 e 4, senza doppioni', () => {
    expect(coverErrors('g', undefined)).toEqual([]);
    expect(coverErrors('g', [])).toEqual([]);
    expect(coverErrors('g', [{ model: 'cover-tuft', density: 1.5 }])).toEqual([]);
    expect(coverErrors('g', 'erba')).toHaveLength(1);
    expect(coverErrors('g', [{ model: 'a', density: 1 }, { model: 'b', density: 1 }, { model: 'c', density: 1 }, { model: 'd', density: 1 }])).toHaveLength(1);
    expect(coverErrors('g', [{ model: 'a', density: 5 }])).toHaveLength(1);
    expect(coverErrors('g', [{ model: 'Erba!', density: 1 }])).toHaveLength(1);
    expect(coverErrors('g', [{ model: 'a', density: 1 }, { model: 'a', density: 2 }])).toHaveLength(1);
    const manifest = (cover: unknown) =>
      JSON.stringify({ id: 'world.prova', name: 'prova', kind: 'generator', tiles: { g: { name: 'prato', color: '#5a9e48', solid: false, layer: 'ground', cross: 'walk', cover } } });
    const v = new Validator({ check: () => undefined } as never);
    expect(v.parseManifest('modules/world.prova/manifest.json', manifest([{ model: 'cover-tuft', density: 2 }])).errors).toEqual([]);
    expect(v.parseManifest('modules/world.prova/manifest.json', manifest([{ model: 'cover-tuft', density: 7 }])).errors.join(' ')).toMatch(/cover\.density/);
  });

  it('la classe cover: la scatola del sasso, piegata dal vento; la Fucina non la offre', () => {
    const c = classOf('cover')!;
    expect(c.tiles).toEqual([0.5, 0.5, 0.4]);
    expect(c.animation).toBe('wind');
    expect(FORGE_CLASSES).not.toContain('cover');
    expect(FORGE_CLASSES).toContain('pebble');
  });

  it('lo spargimento è deterministico: la stessa casella dà le stesse istanze, dentro la casella, e un tipo in più non sposta gli altri', () => {
    const kinds = [{ model: 'cover-tuft', density: 1.5 }, { model: 'cover-stones', density: 0.3 }];
    const seeds = () => 4;
    const a = coverOnTile(kinds, 12, -7, seeds);
    expect(coverOnTile(kinds, 12, -7, seeds)).toEqual(a);
    for (const i of a) {
      expect(i.x).toBeGreaterThanOrEqual(12.12 - 1e-9);
      expect(i.x).toBeLessThanOrEqual(12.88 + 1e-9);
      expect(i.y).toBeGreaterThanOrEqual(-7 + 0.12 - 1e-9);
      expect(i.y).toBeLessThanOrEqual(-7 + 0.88 + 1e-9);
      expect(i.seed).toBeGreaterThanOrEqual(1);
      expect(i.seed).toBeLessThanOrEqual(4);
      expect(i.scale).toBeGreaterThanOrEqual(0.8);
      expect(i.scale).toBeLessThanOrEqual(1.2);
    }
    const more = coverOnTile([...kinds, { model: 'cover-shrub', density: 2 }], 12, -7, seeds);
    expect(more.filter((i) => i.model !== 'cover-shrub')).toEqual(a);
    // Denser: the instances of before stay where they were.
    const denser = coverOnTile([{ model: 'cover-tuft', density: 3 }], 12, -7, seeds);
    for (const i of a.filter((x) => x.model === 'cover-tuft')) expect(denser[i.n]).toEqual(i);
    // Where and how turned never depends on the seeds a program has (the thing an instance becomes stands where it stood).
    const { x, y, yaw } = coverInstance('cover-tuft', 3, 4, 1, 4);
    expect(coverInstance('cover-tuft', 3, 4, 1, 8)).toMatchObject({ x, y, yaw });
  });

  it('la densità è la media delle istanze per casella', () => {
    let n = 0;
    for (let r = 0; r < 60; r++) for (let c = 0; c < 60; c++) n += coverCount('cover-tuft', 1.3, c, r);
    expect(n / 3600).toBeGreaterThan(1.25);
    expect(n / 3600).toBeLessThan(1.35);
    for (let r = 0; r < 20; r++) expect(coverCount('x', 2, r, r)).toBe(2);
  });

  it('il tetto: i luoghi più vicini interi, quello che lo passa diradato, i più lontani niente', () => {
    expect(coverBudget([100, 100, 100], 250)).toEqual([100, 100, 50]);
    expect(coverBudget([100, 100, 100], 1000)).toEqual([100, 100, 100]);
    expect(coverBudget([100, 100], 0)).toEqual([0, 0]);
    let kept = 0;
    for (let i = 0; i < 100; i++) if (keptOf(i, 100, 37)) kept++;
    expect(kept).toBe(37);
    // Spread over the place, not its first rows.
    expect(keptOf(99, 100, 37)).toBe(true);
    expect(COVER_CAP).toBe(20_000);
  });

  it('le istanze promosse si leggono senza fidarsi: dal piano e dal filo', () => {
    const S = 18;
    const ok = { tile: 5, model: 'cover-stones', n: 0, module: 'object.stone', seed: 2 };
    expect(readUncovered([ok, ok, { ...ok, tile: 999 }, { ...ok, model: 'X Y' }, { ...ok, n: -1 }, { ...ok, seed: 0 }, { ...ok, module: '' }, 'x'], S)).toEqual([ok]);
    expect(readUncovered(Array.from({ length: 40 }, (_, i) => ({ ...ok, tile: i })), S)).toHaveLength(MAX_UNCOVERED);
    expect(readUncovered('niente', S)).toEqual([]);
    expect(readUncoveredKeys([uncoveredKey(5, 'cover-stones', 0), '5|cover-stones|0', '9999|a|0', 'x|y|z', 5, `1|${'a'.repeat(120)}|0`], S)).toEqual(['5|cover-stones|0']);
  });
});

/** The seed's kernel, with a stone that hides things (a thing the Forge would make), and the meshes of the covers as the browser's worker makes them. */
const STONE = { id: 'object.stone', name: 'Sasso', kind: 'entity', appearance: { glyph: 'o', color: '#888888', class: 'pebble' }, physics: { solid: false, radius: 0.2 } };
class Meshing implements FormRunner {
  private inline = new InlineRunner();
  async run(q: FormRequest): Promise<FormResult> {
    if (!q.model?.startsWith('cover-') && q.model !== 'cover-moss') return this.inline.run(q);
    const r = runForm(q);
    const { model: _m, finished: _f, ...result } = r;
    return { ...result, meshes: formMeshes(r, q) };
  }
}
const MOSS = `<sequence values="BM" size="10 10 2" name="Muschio"><color symbol="M" value="4f7a3a" name="muschio"/><ellipsoid at="5 5 0" size="6 6 1" color="M"/></sequence>`;

async function world(): Promise<Kernel> {
  const index = JSON.parse(bundledFiles['models/index.json']!);
  index['cover-moss'] = { class: 'cover', name: 'Muschio' };
  const files = { ...bundledFiles, 'modules/object.stone/manifest.json': JSON.stringify(STONE), 'models/cover-moss.xml': MOSS, 'models/index.json': JSON.stringify(index) };
  const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels(), forms: new Meshing() });
  // The places load at the first tick: until there are some, and every one is planned.
  for (let i = 0; i < 600 && !(k.chunks.size && [...k.chunks.values()].every((c) => c.stage === 'planned' || c.held)); i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 5));
  }
  for (const m of ['cover-tuft', 'cover-shrub', 'cover-stones', 'cover-wheat', 'cover-moss']) for (let s = 1; s <= k.forms.seedsOf(m); s++) await k.forms.wait(m, s);
  k.tick(1 / 60);
  return k;
}

/** The tile of the place of each instance of its cover arrays. */
function coverTiles(k: Kernel, ch: Chunk, a: ChunkArrays): number[] {
  const S = k.config.chunkSize;
  const out: number[] = [];
  for (let i = 0; i < (a.cover?.form.length ?? 0); i++) out.push(Math.floor(a.cover!.data[i * COVER_STRIDE + 2]!) * S + Math.floor(a.cover!.data[i * COVER_STRIDE]!));
  void ch;
  return out;
}

describe('la copertura nei luoghi del seme (T545)', () => {
  it('il seme la dà al prato, alla sabbia, ai campi e alla ceppaia, coi suoi programmi della classe cover', async () => {
    const k = await world();
    for (const code of ['g', 's', 'e', 'u', 'x']) {
      const kinds = k.coverKinds(code)!;
      expect(kinds.length, code).toBeGreaterThan(0);
      for (const c of kinds) expect(k.forms.classOf(c.model).id).toBe('cover');
    }
    for (const code of ['p', 't', 'w', 'h', 'f', 'm']) expect(k.coverKinds(code), code).toBeUndefined();
    for (const m of ['cover-tuft', 'cover-shrub', 'cover-stones', 'cover-wheat']) expect(coverForms(k, m), m).toBeDefined();
  });

  it('mai su sentieri, lotti, porte, varchi, sopra una cantina; il worker sparge le stesse istanze della pagina', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const path = 'p';
    let total = 0, lots = 0;
    for (const ch of k.chunks.values()) {
      const mask = k.coverMask(ch);
      for (let i = 0; i < S * S; i++) if (ch.tiles[i] === path) expect(mask[i], `${ch.key} sentiero ${i}`).toBe(1);
      for (const l of ch.lots)
        for (let r = l.y0; r <= l.y1; r++)
          for (let c = l.x0; c <= l.x1; c++) {
            expect(mask[r * S + c], `${ch.key} lotto`).toBe(1);
            lots++;
          }
      for (const i of k.holesIn(ch).keys()) expect(mask[i]).toBe(1);
      const a = chunkArrays(inputSource(chunkInput(k, ch)));
      const tiles = coverTiles(k, ch, a);
      for (const t of tiles) {
        expect(mask[t], `${ch.key} ${t}`).toBe(0);
        expect(k.coverKinds(ch.tiles[t]!), ch.tiles[t]).toBeDefined();
      }
      total += tiles.length;
      // The worker's copy, as postMessage sends it, scatters the same.
      const { answer } = answerChunk(1, structuredClone(chunkInput(k, ch)));
      if (!answer.ok) throw new Error(answer.error);
      expect(answer.arrays.cover).toEqual(a.cover);
      // The page, from the kernel, the same; and not in the place's group (the layer draws it).
      const view = buildChunk(k, ch);
      expect(view.cover).toEqual(a.cover);
      // And the kernel says the same instances (`coverAt`), tile by tile.
      const fromKernel = [...new Set(tiles)].reduce((n, t) => n + k.coverAt(ch.cx * S + (t % S), ch.cy * S + Math.floor(t / S)).length, 0);
      expect(fromKernel).toBe(tiles.length);
    }
    expect(total).toBeGreaterThan(500);
    void lots;
  });

  it('mai sotto una cosa solida ferma: la sua casella esce dalla copertura, e la mesh del luogo si rifà', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && [...c.tiles].some((t, i) => t === 'g' && !k.coverMask(c)[i] && k.coverAt(c.cx * S + (i % S), c.cy * S + Math.floor(i / S)).length))!;
    const i = [...ch.tiles].findIndex((t, j) => t === 'g' && !k.coverMask(ch)[j] && k.coverAt(ch.cx * S + (j % S), ch.cy * S + Math.floor(j / S)).length > 0);
    const x = ch.cx * S + (i % S), y = ch.cy * S + Math.floor(i / S);
    const stamp = k.coverStamp(ch);
    const chest = k.spawnModuleEntity(k.modules.get('obj.chest')!, x + 0.5, y + 0.5, ch.key, 'prova#cassa');
    for (let s = 1; s <= 4; s++) await k.forms.wait((k.ecs.get(chest, 'form') as FormComp).model, s);
    k.tick(1 / 60);
    expect(k.coverStamp(ch)).not.toBe(stamp);
    expect(k.coverMask(ch)[i]).toBe(1);
    expect(k.coverAt(x, y)).toEqual([]);
    expect(coverTiles(k, ch, chunkArrays(inputSource(chunkInput(k, ch))))).not.toContain(i);
  });

  it('la firma dei luoghi del renderer dice quali programmi della copertura sono pronti: un luogo fatto prima si rifà con la sua', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), forms: new Meshing() });
    const before = coverReadiness(k);
    expect(before.split(',').sort()).toEqual(['cover-shrub0', 'cover-stones0', 'cover-tuft0', 'cover-wheat0']);
    // Asked, they come (`coverForms` asks every seed of a program).
    for (const m of coverModels(k)) for (let s = 1; s <= k.forms.seedsOf(m); s++) await k.forms.wait(m, s);
    expect(coverReadiness(k)).not.toBe(before);
    expect(coverReadiness(k).split(',').every((x) => x.endsWith('1'))).toBe(true);
  });

  it('mai sopra una runa nel terreno: si legge, non si nasconde', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const runes = k.ecs.query('rune').map((id) => k.ecs.get(id, 'rune') as { col: number; row: number });
    expect(runes.length).toBeGreaterThan(0);
    for (const r of runes) {
      const ch = k.chunkAt(r.col, r.row);
      if (!ch) continue;
      expect(k.coverMask(ch)[(r.row - ch.cy * S) * S + (r.col - ch.cx * S)], `${r.col},${r.row}`).toBe(1);
      expect(k.coverAt(r.col, r.row)).toEqual([]);
    }
    // A rune written on a meadow tile: the tile loses its cover, and the place's signature says so.
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && [...c.tiles].some((_, i) => !k.coverMask(c)[i] && k.coverAt(c.cx * S + (i % S), c.cy * S + Math.floor(i / S)).length))!;
    const i = [...ch.tiles].findIndex((_, j) => !k.coverMask(ch)[j] && k.coverAt(ch.cx * S + (j % S), ch.cy * S + Math.floor(j / S)).length > 0);
    const col = ch.cx * S + (i % S), row = ch.cy * S + Math.floor(i / S);
    const stamp = k.coverStamp(ch);
    k.ecs.spawn({ rune: { token: 'lux', col, row, source: 'player' } });
    // As the kernel marks it when a rune is written (the runes are read again at the tick).
    (k as unknown as { runesDirty: boolean }).runesDirty = true;
    k.tick(1 / 60);
    expect(k.coverStamp(ch)).not.toBe(stamp);
    expect(k.coverAt(col, row)).toEqual([]);
  });

  it('lo strato della finestra: una InstancedMesh per forma, senza ombre, sotto il tetto coi luoghi più vicini interi', async () => {
    const k = await world();
    const views = [...k.chunks.values()].map((ch) => buildChunk(k, ch));
    const all = views.reduce((n, v) => n + (v.cover?.form.length ?? 0), 0);
    const layer = new CoverLayer();
    layer.sync(k, views, { x: 0, y: 0 });
    expect(layer.drawn).toBe(all);
    expect(layer.dropped).toBe(0);
    const meshes = layer.group.children as THREE.InstancedMesh[];
    expect(meshes.length).toBe(layer.forms);
    expect(meshes.reduce((n, m) => n + m.count, 0)).toBe(all);
    for (const m of meshes) {
      expect(m).toBeInstanceOf(THREE.InstancedMesh);
      expect(m.castShadow).toBe(false);
      expect(m.receiveShadow).toBe(true);
    }
    // Nothing changed: not made again.
    const first = meshes[0];
    layer.sync(k, views, { x: 0, y: 0 });
    expect(layer.group.children[0]).toBe(first);
    // Under a cap: at most the cap, the place of the wanderer whole.
    layer.cap = Math.floor(all / 3);
    layer.sync(k, views, { x: 0, y: 0 });
    expect(layer.drawn).toBeLessThanOrEqual(layer.cap);
    expect(layer.drawn + layer.dropped).toBe(all);
    const home = views.find((v) => v.key === '0,0');
    if (home?.cover) expect(layer.drawn).toBeGreaterThanOrEqual(Math.min(layer.cap, home.cover.form.length));
    layer.clear();
    expect(layer.group.children).toHaveLength(0);
  });
});

describe('la copertura aperta a mondo acceso (T545)', () => {
  it('il Concilio aggiunge un tipo a un terreno con un commit, entro i tetti; i luoghi la mostrano subito', async () => {
    const k = await world();
    const before = k.repo.log().length;
    const S = k.config.chunkSize;
    // A terrain of the ground one walks, on the loaded places, with room for a kind more.
    const open = (code: string) => [...k.chunks.values()].flatMap((ch) => [...ch.tiles].flatMap((t, i) => (t === code && !k.coverMask(ch)[i] ? [[ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)]] : [])));
    const code = Object.keys(k.palette).find((c) => c !== 'p' && k.palette[c]!.layer === 'ground' && !k.palette[c]!.solid && (k.coverKinds(c)?.length ?? 0) < 3 && open(c).length > 0)!;
    expect(code).toBeDefined();
    const name = k.palette[code]!.name;
    const kinds = [...(k.coverKinds(code) ?? []), { model: 'cover-moss', density: 1.5 }];
    const r = k.setCover(code, kinds);
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(k.repo.log().length).toBe(before + 1);
    expect(k.repo.head().message).toContain(`copertura di «${name}»`);
    expect(k.coverKinds(code)!.map((c) => c.model)).toContain('cover-moss');
    const manifest = JSON.parse(k.repo.working['modules/world.terrain/manifest.json']!);
    expect(manifest.tiles[code].cover).toEqual(kinds);
    expect(open(code).some(([x, y]) => k.coverAt(x!, y!).some((i) => i.model === 'cover-moss'))).toBe(true);
    // Another density, and none.
    expect(k.setCover(code, [{ model: 'cover-moss', density: 3 }]).ok).toBe(true);
    expect(k.coverKinds(code)).toEqual([{ model: 'cover-moss', density: 3 }]);
    expect(k.setCover(code, []).ok).toBe(true);
    expect(k.coverKinds(code)).toBeUndefined();
    expect(JSON.parse(k.repo.working['modules/world.terrain/manifest.json']!).tiles[code].cover).toEqual([]);
  });

  it('dal Referente al Cartografo: «sassolini sul prato» diventa la copertura del prato, con un commit; ciò che la libreria non ha no', async () => {
    const k = await world();
    const commits = k.repo.log().length;
    const r = await k.talkToAgent('liaison', 'più muschio sul campo arato, 2 a casella');
    expect(r.forged, r.forged).toMatch(/Su «campo arato» ora: Muschio 2 a casella/);
    expect(k.coverKinds('m')).toEqual([{ model: 'cover-moss', density: 2 }]);
    expect(k.repo.log().length).toBe(commits + 1);
    expect(k.feed().some((e) => e.task === 'referente.coordinate')).toBe(true);
    // A cover the library does not have: the Cartographer says so, nothing is written, the shortfall is noted.
    const no = await k.talkToAgent('liaison', 'una copertura di funghi giganti sul prato');
    expect(no.forged).toMatch(/Il Cartografo non lo fa/);
    expect(k.repo.log().length).toBe(commits + 1);
  }, 60_000);

  it('ciò che esce dai tetti o non è copertura torna col motivo, e niente si scrive', async () => {
    const k = await world();
    const before = k.repo.log().length;
    const refuse = (code: unknown, kinds: unknown, why: RegExp) => {
      const r = k.setCover(code, kinds);
      expect(r.ok, JSON.stringify(kinds)).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(why);
    };
    refuse('g', [{ model: 'a', density: 1 }, { model: 'b', density: 1 }, { model: 'c', density: 1 }, { model: 'd', density: 1 }], /al più 3/);
    refuse('g', [{ model: 'cover-tuft', density: 6 }], /density/);
    refuse('g', [{ model: 'cover-mai-scritto', density: 1 }], /libreria/);
    refuse('g', [{ model: 'tree', density: 1 }], /classe cover/);
    refuse('h', [{ model: 'cover-tuft', density: 1 }], /non cresce/);
    refuse('w', [{ model: 'cover-tuft', density: 1 }], /non cresce/);
    refuse('?!', [{ model: 'cover-tuft', density: 1 }], /nessun terreno/);
    refuse('g', k.coverKinds('g'), /niente cambia/);
    expect(k.repo.log().length).toBe(before);
  });

  it('un’istanza diventa una cosa del mondo: posata nel suo punto col suo aspetto, scritta nel piano, mai più disegnata come copertura', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && [...c.tiles].some((_, i) => !k.coverMask(c)[i] && k.coverAt(c.cx * S + (i % S), c.cy * S + Math.floor(i / S)).length))!;
    const tile = [...ch.tiles].findIndex((_, i) => !k.coverMask(ch)[i] && k.coverAt(ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)).length > 0);
    const x = ch.cx * S + (tile % S), y = ch.cy * S + Math.floor(tile / S);
    const list = k.coverAt(x, y);
    const target = list[list.length - 1]!;
    const arraysBefore = chunkArrays(inputSource(chunkInput(k, ch)));
    const version = ch.version;
    // Not a thing: an item, a system, nothing.
    expect(k.uncover(target.x, target.y, 'core.movement')).toBeUndefined();
    expect(k.uncover(target.x, target.y, 'non-esiste')).toBeUndefined();
    // Nor a person, nor a vehicle.
    expect(k.uncover(target.x, target.y, 'npc.villager')).toBeUndefined();
    expect(k.uncover(target.x, target.y, 'vehicle.capsule')).toBeUndefined();
    const id = k.uncover(target.x, target.y, 'object.stone')!;
    expect(id).toBeDefined();
    const pos = k.ecs.get(id, 'pos');
    expect(pos.x).toBeCloseTo(target.x, 6);
    expect(pos.y).toBeCloseTo(target.y, 6);
    const form = k.ecs.get(id, 'form') as FormComp;
    expect(form).toMatchObject({ model: target.model, seed: target.seed, yaw: target.yaw });
    expect(form.wanted).toBeUndefined();
    expect(k.ecs.get(id, 'module').id).toBe('object.stone');
    // In the plan, and the place is drawn again without it.
    expect(ch.version).toBe(version + 1);
    expect(readUncovered(ch.plan!.uncovered, S)).toEqual([{ tile, model: target.model, n: target.n, module: 'object.stone', seed: target.seed }]);
    expect(k.coverAt(x, y)).toEqual(list.slice(0, -1));
    const after = chunkArrays(inputSource(chunkInput(k, ch)));
    expect(after.cover!.form.length).toBe(arraysBefore.cover!.form.length - 1);
    expect(chunkInput(k, ch).uncovered).toEqual([uncoveredKey(tile, target.model, target.n)]);
    // Said by its program and number: the same instance cannot be taken twice.
    expect(k.uncover(x + 0.5, y + 0.5, 'object.stone', { model: target.model, n: target.n })).toBeUndefined();
  });

  it('alla ricarica del luogo la cosa è di nuovo lì, una volta sola', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && [...c.tiles].some((_, i) => !k.coverMask(c)[i] && k.coverAt(c.cx * S + (i % S), c.cy * S + Math.floor(i / S)).length))!;
    const tile = [...ch.tiles].findIndex((_, i) => !k.coverMask(ch)[i] && k.coverAt(ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)).length > 0);
    const x = ch.cx * S + (tile % S), y = ch.cy * S + Math.floor(tile / S);
    const [first] = k.coverAt(x, y);
    k.uncover(first!.x, first!.y, 'object.stone');
    // The things that were cover (the Cartographer of the local models may put stones of its own too).
    const stones = () => k.ecs.query('cover').filter((e) => k.ecs.get(e, 'module')?.id === 'object.stone');
    expect(stones()).toHaveLength(1);
    // The place laid out again from its plan (as at a load): its things are made again, the stone with them.
    (k as unknown as { applyPlan(c: Chunk, p: unknown): void }).applyPlan(ch, ch.plan!);
    expect(stones()).toHaveLength(1);
    const s = stones()[0]!;
    expect(k.ecs.get(s, 'pos').x).toBeCloseTo(first!.x, 6);
    expect((k.ecs.get(s, 'form') as FormComp).model).toBe(first!.model);
    expect(k.coverAt(x, y).some((i) => i.model === first!.model && i.n === first!.n)).toBe(false);
  });

  it('Lua legge la copertura di una casella e ne fa una cosa (world.cover_at, world.uncover)', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && [...c.tiles].some((_, i) => !k.coverMask(c)[i] && k.coverAt(c.cx * S + (i % S), c.cy * S + Math.floor(i / S)).length))!;
    const tile = [...ch.tiles].findIndex((_, i) => !k.coverMask(ch)[i] && k.coverAt(ch.cx * S + (i % S), ch.cy * S + Math.floor(i / S)).length > 0);
    const x = ch.cx * S + (tile % S), y = ch.cy * S + Math.floor(tile / S);
    const host = (k as unknown as { sandbox: { host: { cover_at(x: number, y: number): unknown; uncover(x: unknown, y: unknown, m: unknown, model?: unknown, n?: unknown): number | undefined } } }).sandbox.host;
    const seen = host.cover_at(x + 0.5, y + 0.5) as Array<{ model: string; n: number; x: number; y: number }>;
    expect(seen.length).toBe(k.coverAt(x, y).length);
    expect(Object.keys(seen[0]!).sort()).toEqual(['model', 'n', 'x', 'y']);
    const id = host.uncover(x + 0.5, y + 0.5, 'object.stone', seen[0]!.model, seen[0]!.n);
    expect(id).toBeDefined();
    expect(host.uncover(x + 0.5, y + 0.5, 'object.stone', 'cover-mai', 0)).toBeUndefined();
    // A nil of Lua comes as null: the nearest instance, as without it.
    if (seen.length > 1) expect(host.uncover(x + 0.5, y + 0.5, 'object.stone', null, null)).toBeDefined();
  });

  it('un mondo non scrive oltre il suo tetto di cose dalla copertura in un luogo', async () => {
    const k = await world();
    const S = k.config.chunkSize;
    const ch = [...k.chunks.values()].find((c) => c.stage === 'planned' && [...c.tiles].filter((t, i) => !k.coverMask(c)[i] && k.coverKinds(t)).length > MAX_UNCOVERED + 4)!;
    let made = 0;
    for (let i = 0; i < S * S && made <= MAX_UNCOVERED + 2; i++) {
      const x = ch.cx * S + (i % S), y = ch.cy * S + Math.floor(i / S);
      const [one] = k.coverAt(x, y);
      if (one && k.uncover(one.x, one.y, 'object.stone') !== undefined) made++;
      else if (one) break;
    }
    expect(made).toBe(MAX_UNCOVERED);
    expect(readUncovered(ch.plan!.uncovered, S)).toHaveLength(MAX_UNCOVERED);
  });
});
