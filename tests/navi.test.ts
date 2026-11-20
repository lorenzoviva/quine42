// The Sculptor of the vessels (T440, `docs/design/acqua-spazio.md` § 1.6): the class `vessel` with its long boxes at 16 voxels a tile, what
// the kernel reads of a vessel's form (the waterline, the areas on every layer) and checks of it (the hull closed at the waterline, long,
// its bow narrowing toward large y; from Medium up a deck reached from where one boards and the helm on it), the boat the local models
// write for every box, the seed's generic, the request; in the kernel, the helm taken where the form marks it.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { toWorld } from '../src/kernel/vehicle';
import { entryBox, toLocal, vptOf, waterlineOf } from '../src/kernel/forms';
import { boxOf, classOf, densityFor, guessClass, SIZE_TIERS, tilesOf, VESSEL_TILES, VESSEL_VPT } from '../src/mj/classes';
import { columnAreasOf } from '../src/mj/areas';
import { compileMjx } from '../src/mj/model';
import { runMjx } from '../src/mj/run';
import { measureVessel, vesselErrors } from '../src/mj/vessel';
import { categoryOf, checkProgram, describe as describeRequest, examplesFor } from '../src/kernel/agents/sculptor';
import { GENERIC, modelSize } from '../src/kernel/modeldirector';
import { mockVesselProgram, mockVesselShape } from '../src/kernel/ai/mockVessel';
import type { FileMap } from '../src/kernel/types';

const V = classOf('vessel')!;
const SEED_VESSEL = bundledFiles['models/vessel.xml'].replace(/\r\n/g, '\n');

describe('the class vessel (T440)', () => {
  it('has long boxes of its own at 16 voxels a tile, at every size, and a generic in the seed', () => {
    expect(V.taglia).toBe('large');
    expect(tilesOf(V, 'medium')).toEqual([1, 2.5, 1]);
    expect(tilesOf(V)).toEqual([2.5, 6, 4]);
    expect(tilesOf(V, 'gargantuan')).toEqual([6, 16, 9]);
    for (const t of SIZE_TIERS) {
      expect(densityFor(V, t.id)).toBe(VESSEL_VPT);
      expect(boxOf(V, t.id)).toEqual(VESSEL_TILES[t.id].map((v) => Math.max(4, Math.round(v * 16))));
      // The library runs an entry in the box it was sculpted in: no density written, 16 read.
      expect(modelSize({ classe: 'vessel', taglia: t.id }).vpt).toBeUndefined();
      expect(vptOf({ class: 'vessel', ...modelSize({ classe: 'vessel', taglia: t.id }) })).toBe(16);
      expect(entryBox(V, modelSize({ classe: 'vessel', taglia: t.id }))).toEqual(boxOf(V, t.id));
    }
    expect(boxOf(V, 'gargantuan')).toEqual([96, 256, 144]);
    expect(GENERIC.has('vessel')).toBe(true);
    expect(JSON.parse(bundledFiles['models/index.json']).vessel.class).toBe('vessel');
    // A figure of the Sculptor's stronger models, like the structures; the library's vessels its examples.
    expect(categoryOf(V)).toBe('structure');
    expect(examplesFor(bundledFiles, 'vessel')[0]).toContain('waterline=');
  });

  it('is guessed from the words of a boat, in Italian and English', () => {
    expect(guessClass('Una barca da pesca').id).toBe('vessel');
    expect(guessClass('il galeone del re').id).toBe('vessel');
    expect(guessClass('a small sailing ship').id).toBe('vessel');
    expect(guessClass('una navata di pietra').id).not.toBe('vessel');
  });

  it('reads its areas on every layer: a helm of a few voxels over the hold is both', () => {
    const xml = `<sequence values="BHTO" size="20 20 10"><box at="9.5 9.5 0" size="20 20 1" color="O"/><box at="5 5 6" size="2 2 2" color="T"/><color symbol="O" value="7a5634" area="hold"/><color symbol="T" value="5a3a1e" area="helm"/></sequence>`;
    const r = runMjx(compileMjx(xml), 1);
    const a = columnAreasOf(r.grid, compileMjx(xml).program.palette, 10);
    expect(a.helm).toEqual([[0, 0]]);
    expect(a.hold).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
  });
});

describe('the checks of a vessel (T440)', () => {
  it('pass the boat of the local models at every size, and the seed generic is it at Large', () => {
    for (const t of SIZE_TIERS) {
      const xml = mockVesselProgram(boxOf(V, t.id));
      const c = checkProgram(xml, V, t.id);
      expect(c.error, t.id).toBeUndefined();
      const m = measureVessel(c.result!.grid, c.model!.program.palette, 16, waterlineOf(xml));
      expect(m.length).toBeGreaterThanOrEqual(2 * m.width);
      if (t.id !== 'tiny' && t.id !== 'small') expect(m.helmOnDeck).toBe(true);
    }
    expect(SEED_VESSEL.slice(SEED_VESSEL.indexOf('<sequence'))).toBe(mockVesselProgram(boxOf(V)).slice(mockVesselProgram(boxOf(V)).indexOf('<sequence')));
    expect(checkProgram(SEED_VESSEL, V).error).toBeUndefined();
    // The sails come and go as actions of the form.
    expect(compileMjx(SEED_VESSEL).actions.map((a) => a.name)).toEqual(['furl', 'hoist']);
  });

  it('say what a vessel lacks, in the words the Sculptor reads', () => {
    const boat = mockVesselProgram(boxOf(V));
    const err = (xml: string, t?: 'medium') => checkProgram(xml, V, t).error ?? '';
    expect(err(boat.replace(/ waterline="\d+"/, ''))).toMatch(/manca waterline/);
    expect(err(boat.replace(/ waterline="\d+"/, ' waterline="40"'))).toMatch(/dall'imbarco si cammina su 0 colonne|ponte/);
    expect(err(boat.replace(' area="helm"', ''))).toMatch(/manca il timone/);
    expect(err(boat.replace(' area="boarding"', ''))).toMatch(/manca l'imbarco/);
    // A hole in the side at the waterline: the sea comes into the hull, the deck is over nothing that floats.
    const wl = waterlineOf(boat);
    expect(err(boat.replace('\n  <color ', `\n  <box at="3 47.5 ${wl - 1}" size="12 8 1" color="B"/>\n  <color `))).toMatch(/non chiude/);
    // A barge: a box as long as the box and as wide, its bow as wide as its middle.
    const barge = `<sequence values="BHDGT" size="40 96 64" waterline="6"><box at="19.5 47.5 0" size="40 96 20" color="H"/><box at="19.5 47.5 20" size="40 96 1" color="D"/><box at="19.5 47.5 21" size="4 4 1" color="G"/><box at="19.5 10 21" size="2 2 6" color="T"/><color symbol="G" value="8a6a3a" area="boarding"/><color symbol="T" value="5a3a1e" area="helm"/></sequence>`;
    expect(err(barge)).toMatch(/la prua non si stringe/);
    expect(err(barge.replace('size="40 96 20"', 'size="40 60 20"').replace('size="40 96 1"', 'size="40 60 1"'))).toMatch(/almeno il doppio della larghezza/);
    // A small one floats and is shaped as a hull: no deck nor helm is asked of a toy.
    const toy = mockVesselProgram(boxOf(V, 'tiny')).replace(' area="helm"', '').replace(' area="boarding"', '');
    expect(checkProgram(toy, V, 'tiny').error).toBeUndefined();
    expect(vesselErrors({ waterline: 3, length: 0, width: 0, hull: 0, bow: 0, deck: 0, deckOverHull: 0, helmOnDeck: false, areas: {}, deckMask: new Uint8Array() }, 16)[0]).toMatch(/niente scafo/);
  });

  it('are in the request, with the numbers of its box', () => {
    const text = describeRequest({ id: 'nave-prova', nome: 'Brigantino', aspetto: 'due alberi, vele quadre', classe: 'vessel', taglia: 'huge' }, V);
    expect(text).toContain('box 64 × 160 × 96');
    expect(text).toMatch(/waterline="N"/);
    expect(text).toMatch(/area="helm"/);
    expect(describeRequest({ id: 'x', nome: 'Modellino', aspetto: 'un giocattolo', classe: 'vessel', taglia: 'tiny' }, V)).not.toMatch(/area="helm"/);
  });

  it('are answered offline with the boat of the box', async () => {
    const ai = new MockAiModels();
    for (const taglia of ['medium', 'gargantuan'] as const) {
      const raw = await ai.text({ task: 'model.sculpt', prompt: '', data: { classe: 'vessel', request: { nome: 'Barca', taglia } } } as never);
      expect(String(raw)).toContain(`size="${boxOf(V, taglia).join(' ')}"`);
    }
  });
});

/** The seed with a vessel module wearing the seed's generic boat (class `vessel`). */
const BOAT = 'veicolo.nave';
function withVessel(): FileMap {
  const manifest = {
    id: BOAT,
    name: 'Barca a vela',
    kind: 'entity',
    description: 'Una barca a vela.',
    appearance: { glyph: 'B', color: '#8a5a2b', model: 'vessel', class: 'vessel' },
    physics: { solid: true, radius: 0.5 },
    vehicle: { medium: 'water', speed: 3, accel: 2, turn: 1 },
  };
  return { ...bundledFiles, [`modules/${BOAT}/manifest.json`]: JSON.stringify(manifest, null, 1) };
}

async function harbour() {
  const k = await Kernel.boot({ files: withVessel(), store: memoryStore(), ai: new MockAiModels() });
  for (let i = 0; i < 120 && k.chunks.get('0,0')?.stage !== 'planned'; i++) {
    k.tick(1 / 60);
    await new Promise((r) => setTimeout(r, 25));
  }
  k.tick(1 / 60);
  k.carpet()!.active = false;
  const c = k.wandererCarpet();
  const x0 = Math.floor(c.x) + 2, y0 = Math.floor(c.y) + 3;
  const ground = Object.keys(k.palette).find((t) => t !== '?' && !k.palette[t].solid && (k.palette[t].layer ?? 'ground') === 'ground')!;
  for (let r = 0; r <= 8; r++) for (let col = 0; col <= 12; col++) expect(k.setTile(x0 + col, y0 + r, r >= 1 && r <= 7 && col >= 1 && col <= 11 ? 'o' : ground)).toBe(true);
  for (const id of k.ecs.query('pos')) {
    const p = k.ecs.get(id, 'pos');
    if (id !== k.wandererEntity && Math.abs(p.x - (x0 + 6.5)) < 14 && Math.abs(p.y - (y0 + 4.5)) < 12) k.ecs.destroy(id);
  }
  const boat = k.spawnModuleEntity(k.modules.get(BOAT)!, x0 + 6.5, y0 + 4.5);
  k.ecs.get(boat, 'vehicle').heading = Math.PI / 2;
  const fc = k.ecs.get(boat, 'form');
  fc.yaw = Math.PI / 2;
  await k.forms.wait(fc.model, fc.seed, fc.tint);
  k.tick(1 / 60);
  // Its deck over the water: more than a step, one climbs aboard from a quay or with a jump.
  const { deck, waterline } = mockVesselShape(boxOf(V));
  /** The wanderer on the deck at (lx, lz) tiles of the boat's own frame (the bow toward +lz). */
  const board = (lx: number, lz: number) => {
    const b = k.ecs.get(boat, 'pos');
    const [wx, wy] = toWorld(lx, lz, k.ecs.get(boat, 'vehicle').heading);
    const { ox, oy } = k.offset();
    Object.assign(k.wandererPos(), { x: b.x + wx - ox, y: b.y + wy - oy, z: k.groundAt(b.x, b.y) + (deck - waterline) / 16 });
    k.tick(1 / 60);
  };
  const onDeck = () => {
    const b = k.ecs.get(boat, 'pos'), w = k.wandererCarpet();
    return toLocal(w.x - b.x, w.y - b.y, k.ecs.get(boat, 'vehicle').heading);
  };
  const said: string[] = [];
  k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
  return { k, boat, board, onDeck, said };
}

describe('the helm where the form marks it (T440)', () => {
  it('floats on the generic boat’s waterline; the helm is taken aft, where it is, and not from the bow', async () => {
    const { k, boat, board, onDeck, said } = await harbour();
    const f = k.forms.ready('vessel', k.ecs.get(boat, 'form').seed)!;
    expect(f.vpt).toBe(16);
    expect(f.base).toBe(waterlineOf(SEED_VESSEL));
    // Forward of the mast, on the deck: aboard, but the helm is aft.
    board(0, 1.5);
    expect(k.aboard()).toBe(boat);
    const menu = k.actionsFor(boat).find((o) => o.id === 'helm')!;
    expect(menu.enabled).toBe(false);
    expect(menu.reason).toBe('Il timone è più in là.');
    expect(k.takeHelm(boat)).toBe(false);
    expect(said).toContain('Il timone è più in là.');
    // Aft, beside the wheel (16 voxels from the stern, a tile before the middle of the deck's first tiles).
    board(0.6, -1.7);
    expect(k.aboard()).toBe(boat);
    expect(onDeck()[1]).toBeLessThan(-1.5);
    expect(k.actionsFor(boat).find((o) => o.id === 'helm')!.enabled).toBe(true);
    await k.perform(boat, 'helm');
    expect(k.atHelm()).toBe(boat);
  }, 60_000);
});
