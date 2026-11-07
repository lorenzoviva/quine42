// The bench of what is worn (T289, lab/banco/indossati.md): the zones of a body, the frame of a zone, the three ways (A, B, C) on
// the wanderer and on the wolf, and the zones of every figure of the seed and of the creatures of Cantiere 8.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rootTag } from '../../src/kernel/forms';
import { boxOf, classOf } from '../../src/mj/classes';
import { colorTable } from '../../src/mj/mesh';
import { compileMjx } from '../../src/mj/model';
import { FORM_LIMITS, runMjx } from '../../src/mj/run';
import { CATALOGO } from '../banco/fauna-biomi-cloud/catalogo';
import { figureMeshes, itemsFrom, measure } from '../banco/indossati/bench';
import { bodyOf, coordsOf, turnBack, turnUp } from '../banco/indossati/body';
import { dress, ITEMS, PAD, padded, prepare, splitWorn, WAYS, type Dressed } from '../banco/indossati/ways';

const VPT = 20;
const index = JSON.parse(readFileSync('universe/models/index.json', 'utf8')) as Record<string, { class: string }>;

function grid(xml: string, cls: string, seed = 1): Dressed {
  const own = /\ssize="/.test(rootTag(xml));
  const m = compileMjx(xml, own ? {} : { size: boxOf(classOf(cls)!) });
  const r = runMjx(m, seed, { limits: FORM_LIMITS, deadline: 8_000 });
  return { grid: r.grid, palette: m.program.palette };
}
const seedBody = (id: string, seed = 1) => grid(readFileSync(`universe/models/${id}.xml`, 'utf8'), index[id].class, seed);

const dir = 'lab/banco/indossati/items';
const items = itemsFrom(Object.fromEntries(readdirSync(dir).map((f) => [f, readFileSync(join(dir, f), 'utf8')])));
const prepared = prepare(items);

describe('le zone di un corpo', () => {
  it('il viandante sta in piedi: la testa sopra il collo, il busto sotto, la schiena dietro', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const d = seedBody('viandante', seed);
      const b = bodyOf(d.grid, d.palette, VPT);
      expect(b.upright).toBe(true);
      const { head, torso, back } = b.zones;
      expect(head && torso && back).toBeTruthy();
      expect(head!.min[2]).toBeGreaterThan(torso!.max[2]);
      expect(b.neck.at).toBe(torso!.max[2]);
      // The back is the rear half of the torso: it looks toward -y.
      expect(back!.max[1]).toBeLessThan(torso!.max[1]);
      // The staff is not the head: no head voxel is a lone piece of its slice beside the hood.
      expect(head!.max[0] - head!.min[0]).toBeLessThanOrEqual(17);
    }
  });

  it('il lupo sta a quattro zampe: la testa davanti, la schiena sopra', () => {
    for (const seed of [1, 2, 3, 4]) {
      const d = seedBody('beast', seed);
      const b = bodyOf(d.grid, d.palette, VPT);
      expect(b.upright).toBe(false);
      const { head, torso, back } = b.zones;
      expect(head!.min[1]).toBeGreaterThan(torso!.max[1]);
      const mean = (cells: number[], a: number) => cells.reduce((s, c) => s + coordsOf(d.grid, c)[a], 0) / cells.length;
      expect(mean(back!.cells, 2)).toBeGreaterThan(mean(torso!.cells, 2));
    }
  });

  it('una testa nominata dalla palette è quella (il gatto, il gerboa)', () => {
    for (const id of ['animal', 'corona-gerboa']) {
      const d = seedBody(id);
      const b = bodyOf(d.grid, d.palette, VPT);
      expect(b.neck.found).toBe('rig');
      const heads = b.limbs.filter((l) => l.part === 'head');
      expect(new Set(b.zones.head!.cells)).toEqual(new Set(heads.sort((a, c) => c.cells.length - a.cells.length)[0].cells));
    }
  });

  it('la luce sulla coda è della coda: il busto del lupo non sale fin dove arriva la coda alzata', () => {
    const d = seedBody('beast', 1);
    const b = bodyOf(d.grid, d.palette, VPT);
    const tail = b.limbs.find((l) => l.part === 'tail')!;
    const tailTop = Math.max(...tail.cells.map((c) => coordsOf(d.grid, c)[2]));
    expect(b.zones.torso!.max[2]).toBeLessThan(tailTop);
  });

  it('ogni figura del seme e ogni creatura del Cantiere 8 ha testa, busto e schiena', () => {
    const vehicles = new Set(['locomotiva-vapore', 'furgone-consegne', 'motocicletta-stradale', 'rover-esplorazione']);
    const specs = [
      ...Object.entries(index)
        .filter(([, i]) => ['person', 'animal', 'beast'].includes(i.class))
        .map(([id, i]) => ({ name: id, xml: readFileSync(`universe/models/${id}.xml`, 'utf8'), cls: i.class })),
      ...CATALOGO.filter((v) => v.collezione === 'creature-veicoli' && ['person', 'animal', 'beast'].includes(v.classe) && !vehicles.has(v.nome)).map((v) => ({
        name: v.nome,
        xml: readFileSync(join('lab/banco/fauna-biomi-cloud', v.collezione, v.ambientazione, `${v.nome}.xml`), 'utf8'),
        cls: v.classe,
      })),
    ];
    expect(specs.length).toBeGreaterThanOrEqual(25);
    for (const s of specs) {
      const d = grid(s.xml, s.cls);
      const b = bodyOf(d.grid, d.palette, VPT);
      for (const z of ['head', 'torso', 'back'] as const) expect(b.zones[z]?.cells.length ?? 0, `${s.name}: ${z}`).toBeGreaterThan(0);
    }
  });
});

describe('il sistema di una zona', () => {
  it('girare e tornare indietro è la stessa griglia; in piedi, la schiena del lupo guarda verso -y', () => {
    const d = seedBody('beast', 1);
    const up = turnUp(d.grid);
    expect([up.X, up.Y, up.Z]).toEqual([d.grid.X, d.grid.Z, d.grid.Y]);
    const back = turnBack(up);
    expect([back.X, back.Y, back.Z]).toEqual([d.grid.X, d.grid.Y, d.grid.Z]);
    expect(back.cells).toEqual(d.grid.cells);
    // A voxel high on the back (large z) is toward -y once turned; one at the front (large y) is high.
    const at = (x: number, y: number, z: number) => x + y * d.grid.X + z * d.grid.X * d.grid.Y;
    const i = at(3, 5, d.grid.Z - 2);
    const turnedAt = (x: number, y: number, z: number) => x + (d.grid.Z - 1 - z) * up.X + y * up.X * up.Y;
    expect(up.cells[turnedAt(3, 5, d.grid.Z - 2)]).toBe(d.grid.cells[i]);
    expect(coordsOf(up, turnedAt(3, 5, d.grid.Z - 2))).toEqual([3, 1, 5]);
  });
});

describe('le tre vie', () => {
  it('la sezione <worn> si separa dal programma a terra, anche se un commento la nomina', () => {
    const xml = readFileSync(join(dir, 'helmet.xml'), 'utf8');
    const s = splitWorn(xml);
    expect(s.zone).toBe('head');
    expect(s.worn).toMatch(/^<!-- Worn:[\s\S]*<\/worn>$/);
    expect(s.ground).not.toMatch(/<worn zone=/);
    expect(() => compileMjx(s.ground)).not.toThrow();
    expect(items.map((i) => i.id).sort()).toEqual([...ITEMS].sort());
    for (const it of items) {
      expect(it.worn && it.wornProgram).toBeTruthy();
      expect(prepared.clip[it.id] && prepared.mesh[it.id]).toBeTruthy();
      expect(prepared.colors[it.id]!.length).toBe(2);
    }
  });

  it('sul viandante: A e B aggiungono, C ricolora; il corpo fuori dalle zone non cambia; niente si scrive due volte', () => {
    const base = seedBody('viandante', 2);
    const bare = padded(base, PAD);
    const colors = colorTable(bare.grid.alphabet, bare.palette);
    for (const way of WAYS) {
      const { dressed, body, changes } = dress(base, VPT, ['cloak', 'cuirass', 'helmet'], way, prepared);
      expect(changes.map((c) => c.item)).toEqual(['cloak', 'cuirass', 'helmet']);
      const zone = new Set([...body.zones.head!.cells, ...body.zones.torso!.cells, ...body.zones.back!.cells]);
      let removed = 0;
      let outside = 0;
      for (let i = 0; i < dressed.grid.cells.length; i++) {
        const was = bare.grid.cells[i];
        const now = dressed.grid.cells[i];
        if (colors[was] && !zone.has(i) && now !== was && way !== 'A') outside++;
        if (colors[was] && !dressed.palette[dressed.grid.alphabet[now]]?.color) removed++;
      }
      // B and C write the body only where its zones are; A's meshes go over what they cover, like a mesh of their own.
      expect(outside, way).toBe(0);
      expect(removed, way).toBe(0);
      const added = changes.reduce((s, c) => s + c.added, 0);
      const recoloured = changes.reduce((s, c) => s + c.recoloured, 0);
      if (way === 'C') {
        expect(recoloured).toBeGreaterThan(300);
        // Only the fall of the cloak adds voxels.
        expect(changes.filter((c) => c.item !== 'cloak').every((c) => c.added === 0)).toBe(true);
      } else {
        expect(added).toBeGreaterThan(400);
        expect(recoloured).toBe(0);
      }
    }
  });

  it('vestirsi è deterministico, e il lupo si veste in tutte e tre le vie', () => {
    for (const way of WAYS) {
      const a = dress(seedBody('beast', 1), VPT, ['cloak', 'cuirass', 'helmet'], way, prepared).dressed;
      const b = dress(seedBody('beast', 1), VPT, ['cloak', 'cuirass', 'helmet'], way, prepared).dressed;
      expect(a.grid.cells).toEqual(b.grid.cells);
      expect(a.grid.alphabet.length).toBeGreaterThan(seedBody('beast', 1).grid.alphabet.length);
    }
  });

  it('le misure: A non rifà mesh e aggiunge mesh da disegnare; C ha i vertici del corpo nudo, salvo la caduta del mantello', () => {
    const base = seedBody('beast', 1);
    const a = measure('lupo', 1, base, VPT, ['cloak', 'cuirass', 'helmet'], 'A', prepared, 1).measure;
    const c = measure('lupo', 1, base, VPT, ['cloak', 'cuirass', 'helmet'], 'C', prepared, 1).measure;
    expect(a.meshBytes).toBe(0);
    expect(a.meshes).toBe(1 + figureMeshes(base, VPT).limbs.length + 3);
    // On all fours the cloak does not fall: C changes colours only, and the meshes weigh what they weighed.
    expect(c.added).toBe(0);
    expect(c.meshBytes).toBe(c.bareBytes);
    expect(c.gap.mean).toBe(0);
    // A rigid mesh on a body it was not written for stands off it.
    expect(a.gap.mean).toBeGreaterThan(2);
  });
});
