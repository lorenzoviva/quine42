// What is worn shows on the body (T290, ADR-0180): the way the author chose on the bench of T289, C + B. The zones of every body of
// the seed; way C (the kernel's colours) for every thing, also those of today; way B (the thing's `<worn>` section) where it has one,
// with C when it fails; the dressed body made by the worker's own function, with the bare body's rig; the kernel's wearing in the
// three zones (head, torso, back), its marks following the things and saved with them; the wire (`OtherView.worn`, the ids only);
// the validator and the Sculptor.

import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { MockAiModels } from '../src/kernel/ai/mock';
import { Council } from '../src/kernel/agents/council';
import { checkProgram, describe as describeRequest, sculpt, sculptorRole } from '../src/kernel/agents/sculptor';
import { bundledFiles } from '../src/kernel/bundle';
import { Forms, InlineRunner, runForm, type Form, type FormRequest, type FormResult, type FormRunner } from '../src/kernel/forms';
import { moveSlot, removeItem, takeFromSlot, type Inventory } from '../src/kernel/inventory';
import { Kernel } from '../src/kernel/kernel';
import { memoryStore } from '../src/kernel/repo';
import type { ItemDef } from '../src/kernel/types';
import { modelErrors } from '../src/kernel/validator';
import { readWorn, wornItems, wornSlots, wornZoneOf } from '../src/kernel/wearing';
import { classOf } from '../src/mj/classes';
import type { PaletteEntry } from '../src/mj/engine';
import { colorTable } from '../src/mj/mesh';
import { compileMjx } from '../src/mj/model';
import { FORM_LIMITS, runMjx } from '../src/mj/run';
import { backgroundOf, bodyOf, dressBody, mainColors, PAD, paddedIndex, trialBodies, WORN_ZONES, wornProgram, wornSections, withoutWorn, type WornPiece, type WornZone } from '../src/mj/worn';
import { dressedFor, wornBy } from '../src/render/dressed';
import { Entities, Wanderer } from '../src/render/entities';
import { dressMeshes, formMeshes } from '../src/render/formmeshes';
import { WorkerRunner } from '../src/render/forms';
import { heldBy } from '../src/render/held';
import { geoOf } from '../src/render/models';
import { fakeLink, type ServerMsg } from '../src/session/protocol';
import { SessionClient } from '../src/session/client';
import { SessionServer } from '../src/session/server';
import { ThinClient } from '../src/session/thin';
import { DT, develop } from './world';

const fixture = (name: string) => readFileSync(`tests/fixtures/worn/${name}.xml`, 'utf8');
/** The three things of the bench of T289, as the Sculptor would write them: on the ground, and their `<worn>` section. */
const THINGS = { head: fixture('elmo'), torso: fixture('corazza'), back: fixture('mantello') } as const;

const forms = new Forms(new InlineRunner());
forms.load(bundledFiles);

async function formOf(model: string, seed = 1): Promise<Form> {
  const f = await forms.wait(model, seed);
  expect(f?.status, model).toBe('ready');
  return f!;
}

/** A thing of the bench run as the game runs it: its grid, its palette, its colours and its worn program for its zone. */
function thing(zone: WornZone): { piece: WornPiece; grid: FormResult['grid']; palette: Record<string, PaletteEntry> } {
  const xml = THINGS[zone];
  const m = compileMjx(xml);
  const r = runMjx(m, 1, { limits: FORM_LIMITS, deadline: 8_000 });
  const program = wornProgram(xml, zone, { background: backgroundOf(xml)!, palette: m.program.palette });
  return { piece: { zone, colors: mainColors(r.grid, m.program.palette), ...(program ? { program } : {}) }, grid: r.grid, palette: m.program.palette };
}

/** Every visible voxel of a grid as `index → colour`. */
function visible(g: FormResult['grid'], palette: Record<string, PaletteEntry>): Map<number, string> {
  const colors = colorTable(g.alphabet, palette);
  const out = new Map<number, string>();
  g.cells.forEach((c, i) => {
    if (colors[c]) out.set(i, palette[g.alphabet[c]]!.color!);
  });
  return out;
}

// --- The zones and the ways, on the bodies of the seed ---------------------------------------------------------------------------

describe('the zones of a body', () => {
  it('every person and animal of the seed has a head, a torso and a back; people stand, cat and wolf are on all fours', async () => {
    const bodies: Array<[string, number, boolean]> = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((s): [string, number, boolean] => ['viandante', s, true]),
      ['contadina', 1, true],
      ['person', 1, true],
      ['corona-gerboa', 1, true],
      ['animal', 1, false],
      ['beast', 1, false],
    ];
    for (const [model, seed, upright] of bodies) {
      const f = await formOf(model, seed);
      const b = bodyOf(f.result!.grid, f.result!.palette);
      expect(b.upright, `${model} ${seed}`).toBe(upright);
      for (const z of WORN_ZONES) expect(b.zones[z]?.cells.length, `${model} ${seed} ${z}`).toBeGreaterThan(20);
      // The head is above the torso standing, ahead of it on all fours.
      const [h, t] = [b.zones.head!, b.zones.torso!];
      if (upright) expect(h.max[2]).toBeGreaterThan(t.max[2]);
      else expect(h.max[1]).toBeGreaterThan(t.max[1]);
    }
  }, 60_000);

  it('the two bodies the validator tries a section on have their zones too, one standing and one on all fours', () => {
    const [standing, prone] = trialBodies().map((t) => bodyOf(t.grid, t.palette));
    expect(standing.upright).toBe(true);
    expect(prone.upright).toBe(false);
    for (const b of [standing, prone]) for (const z of WORN_ZONES) expect(b.zones[z]?.cells.length).toBeGreaterThan(4);
  });
});

describe('the ways: B where the thing has a section, C for everything else', () => {
  it('C recolours the zone in the two main colours of the thing, adds only the fall of a cloak standing, takes nothing away', async () => {
    const f = await formOf('viandante', 2);
    const bare = { grid: f.result!.grid, palette: f.result!.palette };
    const pieces = WORN_ZONES.map((z) => ({ ...thing(z).piece, program: undefined }));
    const d = dressBody(bare, pieces);
    expect(d.changes.map((c) => `${c.zone}:${c.way}`)).toEqual(['back:C', 'torso:C', 'head:C']);
    // The same centre, the same floor: the body moved into a larger box by PAD on every side and above.
    expect([d.grid.X, d.grid.Y, d.grid.Z]).toEqual([bare.grid.X + 2 * PAD, bare.grid.Y + 2 * PAD, bare.grid.Z + PAD]);
    const before = visible(bare.grid, bare.palette);
    const after = visible(d.grid, d.palette);
    for (const i of before.keys()) expect(after.has(paddedIndex(bare.grid, i))).toBe(true);
    const added = d.changes.reduce((n, c) => n + c.added, 0);
    expect(added).toBe(d.changes.find((c) => c.zone === 'back')!.added);
    expect(after.size).toBe(before.size + added);
    expect(d.changes.every((c) => c.recoloured > 30)).toBe(true);
    // The helmet's iron is on the head now.
    const iron = thing('head').piece.colors[0].color;
    expect([...after.values()].filter((c) => c === iron).length).toBeGreaterThan(30);
  });

  it('B runs the thing\'s rules on the body: the helmet, the cuirass and the cloak take their own shape, never over the rest of the body', async () => {
    for (const [model, seed] of [['viandante', 2], ['beast', 1], ['animal', 1], ['corona-gerboa', 1]] as const) {
      const f = await formOf(model, seed);
      const bare = { grid: f.result!.grid, palette: f.result!.palette };
      const d = dressBody(bare, WORN_ZONES.map((z) => thing(z).piece));
      expect(d.changes.map((c) => `${c.zone}:${c.way}`), model).toEqual(['back:B', 'torso:B', 'head:B']);
      for (const c of d.changes) expect(c.added, `${model} ${c.zone}`).toBeGreaterThan(50);
      // What is not a zone of the body keeps its colour: limbs, a thing put on before (`o`), are never written.
      const body = bodyOf(d.grid, d.palette);
      const zoneCells = new Set(WORN_ZONES.flatMap((z) => body.zones[z]?.cells ?? []));
      const before = visible(bare.grid, bare.palette);
      const after = visible(d.grid, d.palette);
      for (const [i, color] of before) {
        const j = paddedIndex(bare.grid, i);
        expect(after.has(j)).toBe(true);
        if (!zoneCells.has(j)) expect(after.get(j), `${model} ${i}`).toBe(color);
      }
    }
  }, 60_000);

  it('B falls back to C when the section does not compile, writes nothing, or the thing has none for that zone', async () => {
    const f = await formOf('viandante', 1);
    const bare = { grid: f.result!.grid, palette: f.result!.palette };
    const helmet = thing('head').piece;
    const broken = { ...helmet, program: helmet.program!.replace('<all>', '<all><box at="1 1 1" size="2 2 2" color="I"/>') };
    const idle = { ...helmet, program: helmet.program!.replace(/<worn[\s\S]*$/, '').replace(/<all>[\s\S]*<\/sequence>/, '<all in="o" out="I"/>\n</sequence>') };
    const cases: Array<[WornPiece, string]> = [
      [broken, 'error'],
      [idle, 'nothing'],
    ];
    for (const [piece, fault] of cases) {
      const d = dressBody(bare, [piece]);
      expect(d.changes[0].way, fault).toBe('C');
      expect(d.changes[0].fault).toBe(fault);
      expect(d.changes[0].recoloured).toBeGreaterThan(30);
    }
    // A cloak has no section for the head: worn there it is C.
    expect(wornProgram(THINGS.back, 'head', { background: 'B', palette: compileMjx(THINGS.back).program.palette })).toBeUndefined();
    // A thing whose own letters are the kernel's cannot have a section.
    const greedy = THINGS.head.replace('values="BIDGRK"', 'values="BIDGRKz"');
    expect(() => wornProgram(greedy, 'head', { background: 'B', palette: compileMjx(greedy).program.palette })).toThrow(/z o r m/);
  });

  it('the section does not change the thing on the ground: the program compiles and runs as without it, beside its root or inside it', () => {
    for (const xml of Object.values(THINGS)) {
      const plain = withoutWorn(xml);
      expect(wornSections(plain)).toEqual([]);
      const a = runMjx(compileMjx(xml), 1, { limits: FORM_LIMITS });
      const b = runMjx(compileMjx(plain), 1, { limits: FORM_LIMITS });
      expect([...a.grid.cells]).toEqual([...b.grid.cells]);
      // Inside the root, as an action would be: the same.
      const inside = xml.replace(/<\/sequence>\s*([\s\S]*)$/, (_, rest: string) => `${rest.replace(/<!--[\s\S]*?-->/g, '')}\n</sequence>`);
      expect(wornSections(inside)).toHaveLength(1);
      expect([...runMjx(compileMjx(inside), 1, { limits: FORM_LIMITS }).grid.cells]).toEqual([...a.grid.cells]);
    }
  });

  it('a thing without a model is worn in its pack\'s colour (the generic one tinted), and two colours that are shades are one', async () => {
    const f = await forms.wait('object', 1, '#5a6a8a');
    const colors = mainColors(f!.result!.grid, f!.result!.palette);
    expect(colors[0].color).toBe('#5a6a8a');
    const shade = { grid: { X: 3, Y: 1, Z: 1, cells: new Uint8Array([1, 1, 2]), alphabet: ['.', 'A', 'D'] }, palette: { A: { color: '#a3acb6' }, D: { color: '#6e7681' } } };
    expect(mainColors(shade.grid, shade.palette).map((c) => c.color)).toEqual(['#a3acb6']);
  });
});

describe('the dressed meshes, as the worker makes them', () => {
  it('the dressed figure has the bare one\'s limbs round the same joints: what it holds stays in its hand', async () => {
    const f = await formOf('viandante', 2);
    const req = forms.request('viandante', 2)!;
    const bare = formMeshes(runForm({ ...req, rig: true }), { ...req, rig: true });
    const dressed = dressMeshes({ grid: f.result!.grid, palette: f.result!.palette, vpt: f.vpt, seed: 2, pieces: WORN_ZONES.map((z) => thing(z).piece) });
    expect(dressed.limbs.map((l) => [l.part, l.phase])).toEqual(bare.limbs.map((l) => [l.part, l.phase]));
    dressed.limbs.forEach((l, i) => l.joint.forEach((v, a) => expect(v).toBeCloseTo(bare.limbs[i].joint[a], 9)));
    // Each limb is the same voxels: the same number of triangles.
    dressed.limbs.forEach((l, i) => expect(l.mesh.indices.length).toBe(bare.limbs[i].mesh.indices.length));
    expect(dressed.body.indices.length).toBeGreaterThan(bare.body.indices.length);
    expect(dressed.frames).toEqual([]);
    expect(dressed.changes.map((c) => c.way)).toEqual(['B', 'B', 'B']);
  });

  it('the runner keeps a dressed figure under its key and makes it once; without workers it dresses here', async () => {
    const f = await formOf('viandante', 3);
    const runner = new WorkerRunner(0);
    const req = { grid: f.result!.grid, palette: f.result!.palette, vpt: f.vpt, seed: 3, pieces: [thing('back').piece] };
    const [a, b] = await Promise.all([runner.dress('k', req), runner.dress('k', req)]);
    expect(a).toBe(b);
    expect(await runner.dress('k', req)).toBe(a);
    expect(runner.dressedBytes).toBeGreaterThan(100_000);
    // The body it was made from is untouched.
    expect(f.result!.grid.cells.length).toBe(f.result!.grid.X * f.result!.grid.Y * f.result!.grid.Z);
  });

  it('a worker dresses on its own message, and gives the buffers back with the meshes', async () => {
    const sent: Array<{ id: number; dress?: unknown; req?: FormRequest }> = [];
    const transfers: unknown[][] = [];
    let worker: Worker | undefined;
    const runner = new WorkerRunner(1, undefined, () => (worker = { postMessage: (m: { id: number }, t: unknown[]) => (sent.push(m), transfers.push(t)), terminate() {} } as unknown as Worker));
    const f = await formOf('viandante', 4);
    const asked = runner.dress('k4', { grid: f.result!.grid, palette: f.result!.palette, vpt: f.vpt, seed: 4, pieces: [thing('head').piece] });
    await new Promise((r) => setTimeout(r, 5));
    expect(sent).toHaveLength(1);
    expect(sent[0].dress).toBeDefined();
    // The grid goes as a copy: the form keeps its own.
    expect(transfers[0]).toHaveLength(1);
    expect(transfers[0][0]).not.toBe(f.result!.grid.cells.buffer);
    const meshes = dressMeshes(sent[0].dress as Parameters<typeof dressMeshes>[0]);
    worker!.onmessage!({ data: { id: sent[0].id, dressed: true, ok: true, meshes } } as MessageEvent);
    expect(await asked).toBe(meshes);
    expect(runner.busy).toBe(0);
  });
});

// --- The kernel: putting on and taking off ---------------------------------------------------------------------------------------

const ITEMS: ItemDef[] = [
  { id: 'item.elmo-prova', name: 'Elmo di ferro', description: 'Un elmo.', category: 'clothing', weight: 2, stack: 1, tags: [], glyph: 'Ʌ', color: '#a3acb6', slot: 'testa', model: 'elmo-prova' },
  { id: 'item.corazza-prova', name: 'Corazza', description: 'Una corazza.', category: 'clothing', weight: 6, stack: 1, tags: [], glyph: 'Ʌ', color: '#8f9aa6', slot: 'corpo', model: 'corazza-prova' },
  { id: 'item.mantello-prova', name: 'Mantello rosso', description: 'Un mantello.', category: 'clothing', weight: 1, stack: 1, tags: [], glyph: 'Ʌ', color: '#7a2e3a', slot: 'schiena', model: 'mantello-prova' },
  { id: 'item.berretto-prova', name: 'Berretto', description: 'Un berretto di lana.', category: 'clothing', weight: 0.2, stack: 1, tags: [], glyph: 'Ʌ', color: 'hsl(30 50% 40%)', slot: 'head' },
];

function filesWithThings(base = bundledFiles): Record<string, string> {
  const index = JSON.parse(base['models/index.json']);
  const pack = { id: 'items.prova', name: 'Prova', kind: 'data', version: '0.1.0', origin: 'agente', items: ITEMS };
  return {
    ...base,
    'modules/items.prova/manifest.json': JSON.stringify(pack, null, 2),
    'models/elmo-prova.xml': THINGS.head,
    'models/corazza-prova.xml': THINGS.torso,
    'models/mantello-prova.xml': THINGS.back,
    'models/index.json': JSON.stringify({ ...index, 'elmo-prova': { class: 'object', name: 'Elmo' }, 'corazza-prova': { class: 'object', name: 'Corazza' }, 'mantello-prova': { class: 'object', name: 'Mantello' } }),
  };
}

const slotOf = (k: Kernel, item: string) => k.inventory().slots.findIndex((s) => s?.item === item);

describe('where a thing goes', () => {
  it('by its place, as the packs write it and in English; a garment without one by the words of its name', () => {
    const def = (over: Partial<ItemDef>) => ({ name: 'Cosa', category: 'misc', ...over }) as ItemDef;
    expect(wornZoneOf(def({ slot: 'testa' }))).toBe('head');
    expect(wornZoneOf(def({ slot: 'Corpo' }))).toBe('torso');
    expect(wornZoneOf(def({ slot: 'schiena' }))).toBe('back');
    expect(wornZoneOf(def({ slot: 'back' }))).toBe('back');
    for (const slot of ['piedi', 'mani', 'gambe', 'anello', 'arma', 'scudo', 'collo']) expect(wornZoneOf(def({ slot, category: 'clothing' })), slot).toBeUndefined();
    const garment = (name: string) => wornZoneOf(def({ name, category: 'clothing' }));
    expect(garment('Mantello di lana')).toBe('back');
    expect(garment('Mantello con cappuccio')).toBe('back');
    expect(garment('Cappuccio di feltro')).toBe('head');
    expect(garment("Elmo d'ottone")).toBe('head');
    expect(garment('Tunica di lino')).toBe('torso');
    expect(garment('Corazza di cuoio')).toBe('torso');
    expect(garment('Leather cloak')).toBe('back');
    expect(garment('Iron helmet')).toBe('head');
    expect(garment('Stivali di cuoio')).toBeUndefined();
    // Not a garment: a sword named like a hat is not worn.
    expect(wornZoneOf(def({ name: 'Cappello', category: 'weapon' }))).toBeUndefined();
    expect(wornZoneOf(undefined)).toBeUndefined();
  });

  it('the seed\'s cloak is worn on the back and its boots are not (yet): today\'s things, without anything sculpted again', () => {
    const items = JSON.parse(bundledFiles['modules/items.base/manifest.json']).items as ItemDef[];
    expect(wornZoneOf(items.find((i) => i.id === 'item.mantello'))).toBe('back');
    expect(wornZoneOf(items.find((i) => i.id === 'item.stivali'))).toBeUndefined();
  });
});

describe('the marks of what is worn, in an inventory', () => {
  const inv = (): Inventory => ({ slots: [{ item: 'a', count: 1 }, { item: 'b', count: 1 }, null, { item: 'c', count: 2 }], equipped: null, worn: { head: 0, back: 1 } });
  const spec = () => ({ stackable: true, maxStack: 5, weight: 1, equippable: false });

  it('follow their thing when it moves, go when its slot empties, are kept last when things are taken', () => {
    const a = inv();
    moveSlot(a, 0, 2, spec);
    expect(a.worn).toEqual({ head: 2, back: 1 });
    moveSlot(a, 1, 2, spec);
    expect(a.worn).toEqual({ head: 1, back: 2 });
    takeFromSlot(a, 2);
    expect(a.worn).toEqual({ head: 1 });
    takeFromSlot(a, 1);
    expect(a.worn).toBeUndefined();
    // Two stacks of the same thing: the worn one is taken last; merged whole, the mark goes with it.
    const b: Inventory = { slots: [{ item: 'c', count: 1 }, { item: 'c', count: 1 }], equipped: null, worn: { torso: 0 } };
    expect(removeItem(b, 'c', 1)).toBe(1);
    expect(b.worn).toEqual({ torso: 0 });
    b.slots[1] = { item: 'c', count: 1 };
    moveSlot(b, 0, 1, spec);
    expect(b.worn).toEqual({ torso: 1 });
  });

  it('are read without trusting them: only whole indices of slots that hold a thing of that zone', () => {
    const zoneOf = (item: string) => ({ a: 'head', b: 'back', c: 'torso' } as Record<string, WornZone>)[item];
    expect(wornSlots(inv(), zoneOf)).toEqual({ head: 0, back: 1 });
    expect(wornItems(inv(), zoneOf)).toEqual({ head: 'a', back: 'b' });
    for (const worn of [{ head: 1 }, { head: 0.5 }, { head: -1 }, { head: 9 }, { head: '0' }, { torso: 2 }, 'tutto', null]) expect(wornSlots({ ...inv(), worn }, zoneOf), JSON.stringify(worn)).toEqual({});
    for (const bad of [undefined, null, 'x', { slots: 'niente', worn: { head: 0 } }]) expect(wornItems(bad, zoneOf)).toEqual({});
    expect(readWorn({ head: 'item.elmo', torso: 7, back: '', piedi: 'item.stivali' })).toEqual({ head: 'item.elmo' });
    expect(readWorn({ head: 'x'.repeat(500) })!.head).toHaveLength(120);
    for (const bad of [undefined, 'item', ['item'], {}]) expect(readWorn(bad)).toBeUndefined();
  });
});

describe('the wanderer puts on and takes off', () => {
  let k: Kernel;
  beforeAll(async () => {
    k = await Kernel.boot({ files: filesWithThings(), store: memoryStore(), ai: new MockAiModels() });
    k.bus.on('ui:message', (m: { text: string }) => said.push(m.text));
    for (const d of ITEMS) expect(k.content.get(d.id), d.id).toBeDefined();
  }, 120_000);
  const said: string[] = [];

  it('a helmet, a cuirass and a cloak in their three zones; another helmet takes the place of the first; worn again it comes off', () => {
    for (const d of ITEMS) k.give(d.id, 1);
    k.give('item.mantello', 1);
    k.wearSlot(slotOf(k, 'item.elmo-prova'));
    k.wearSlot(slotOf(k, 'item.corazza-prova'));
    k.wearSlot(slotOf(k, 'item.mantello-prova'));
    expect(k.outfit()).toEqual({ head: 'item.elmo-prova', torso: 'item.corazza-prova', back: 'item.mantello-prova' });
    expect(said.at(-1)).toMatch(/Indossi Mantello rosso sulla schiena/);
    // The cap goes on the head, the helmet comes off but stays in the inventory.
    k.wearSlot(slotOf(k, 'item.berretto-prova'));
    expect(k.outfit().head).toBe('item.berretto-prova');
    expect(slotOf(k, 'item.elmo-prova')).toBeGreaterThanOrEqual(0);
    // Double click (use) on what is worn takes it off; on the seed's cloak, which has no place, puts it on its back.
    k.useSlot(slotOf(k, 'item.berretto-prova'));
    expect(k.outfit().head).toBeUndefined();
    k.useSlot(slotOf(k, 'item.mantello'));
    expect(k.outfit().back).toBe('item.mantello');
    // What is not worn says so, and nothing changes.
    k.give('item.pane', 1);
    const before = JSON.stringify(k.inventory().worn);
    k.wearSlot(slotOf(k, 'item.pane'));
    expect(JSON.stringify(k.inventory().worn)).toBe(before);
    expect(said.at(-1)).toMatch(/non si indossa/);
  });

  it('a worn thing moved keeps being worn; dropped or given, it is not any more; held in hand, it comes off', () => {
    const at = slotOf(k, 'item.corazza-prova');
    const free = k.inventory().slots.findIndex((s, i) => !s && i > at);
    k.moveSlot(at, free);
    expect(k.outfit().torso).toBe('item.corazza-prova');
    expect(k.inventory().worn?.torso).toBe(free);
    k.dropSlot(free);
    expect(k.outfit().torso).toBeUndefined();
    // A thing one can both hold and wear: taken in hand it comes off.
    const both: ItemDef = { ...ITEMS[0], id: 'item.elmo-impugnabile', equippable: true };
    k.content.items.set(both.id, both);
    k.give(both.id, 1);
    k.wearSlot(slotOf(k, both.id));
    expect(k.outfit().head).toBe(both.id);
    k.equipSlot(slotOf(k, both.id));
    expect(k.outfit().head).toBeUndefined();
    expect(k.inventory().equipped).toBe(slotOf(k, both.id));
    k.wearSlot(slotOf(k, both.id));
    expect(k.inventory().equipped).toBeNull();
    expect(k.outfit().head).toBe(both.id);
  });

  it('is saved with the inventory and comes back as it was; a mark that no longer holds is let go of', async () => {
    k.wearSlot(slotOf(k, 'item.elmo-prova'));
    const outfit = k.outfit();
    expect(Object.keys(outfit).length).toBeGreaterThanOrEqual(2);
    expect(k.saveState()).toBe(true);
    const files = k.repo.head().files;
    const saved = JSON.parse(files['world/players/me.json']);
    expect(saved.inventory.worn).toEqual(k.inventory().worn);
    // A file written by hand: a mark on an empty slot, one on a thing of another zone.
    const empty = saved.inventory.slots.findIndex((s: unknown) => !s);
    saved.inventory.worn = { ...saved.inventory.worn, torso: empty };
    const again = await Kernel.boot({ files: { ...files, 'world/players/me.json': JSON.stringify(saved) }, store: memoryStore(), ai: new MockAiModels() });
    expect(again.outfit()).toEqual(outfit);
    expect(again.inventory().worn).toEqual(k.inventory().worn);
  }, 120_000);
});

// --- The renderer, in Node: the worker's meshes, three.js objects without a screen ------------------------------------------------

/** The worker's work in this thread for figures and things: the grid and the meshes. No `dress`: the renderer dresses here. */
class Meshing implements FormRunner {
  runs = 0;
  private inline = new InlineRunner();
  constructor(private drawn: Set<string>) {}
  async run(q: FormRequest): Promise<FormResult> {
    if (!q.model || !this.drawn.has(q.model)) return this.inline.run(q);
    this.runs++;
    const r = runForm(q);
    const { model: _m, finished: _f, ...result } = r;
    return { ...result, meshes: formMeshes(r, q) };
  }
}

const bodyMesh = (root: THREE.Object3D): THREE.Mesh => {
  let found: THREE.Mesh | undefined;
  root.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh && o.parent && !o.parent.userData.limb) found = o as THREE.Mesh;
  });
  return found!;
};

describe('the renderer', () => {
  let k: Kernel;
  let runner: Meshing;
  beforeAll(async () => {
    runner = new Meshing(new Set(['viandante', 'person', 'object', 'elmo-prova', 'corazza-prova', 'mantello-prova', 'forbici']));
    k = await Kernel.boot({ files: filesWithThings(), store: memoryStore(), ai: new MockAiModels(), forms: runner });
    await develop(k);
    for (const d of ITEMS) {
      const look = k.itemLook(d.id);
      await k.forms.wait(look.model, look.seed, look.tint);
    }
    const look = k.itemLook('item.mantello');
    await k.forms.wait(look.model, look.seed, look.tint);
  }, 120_000);

  it('the wanderer wears its outfit on its body, by B for the things of the bench and C for the seed\'s cloak; taken off, its own body again', async () => {
    const scene = new THREE.Scene();
    const w = new Wanderer(scene);
    const fc = k.ecs.get(k.wandererEntity, 'form');
    const f = (await k.forms.wait(fc.model, fc.seed, fc.tint))!;
    w.update(k, DT, 0);
    const bare = geoOf(f)!.body;
    expect(bodyMesh(w.view.root).geometry).toBe(bare);
    for (const d of ITEMS.slice(0, 3)) {
      k.give(d.id, 1);
      k.wearSlot(slotOf(k, d.id));
    }
    const runs = runner.runs;
    w.update(k, DT, 0.1);
    const dressed = dressedFor(k, f, fc, wornBy(k, k.wandererEntity))!;
    expect(dressed).toBeDefined();
    expect(bodyMesh(w.view.root).geometry).toBe(dressed.geo.body);
    expect(dressed.geo.body.getAttribute('position').count).toBeGreaterThan(bare.getAttribute('position').count);
    // Dressing runs no program: the worker's work is the dressing alone.
    expect(runner.runs).toBe(runs);
    // The limbs are the bare body's, with their hands: the shears go in the right hand, dressed or not.
    expect(w.view.limbs.filter((l) => l.hand).length).toBe(geoOf(f)!.limbs.filter((l) => l.part === 'arm').length);
    k.give('item.scissors', 1);
    k.equipSlot(slotOf(k, 'item.scissors'));
    const look = k.itemLook('item.scissors');
    await k.forms.wait(look.model, look.seed, look.tint);
    w.update(k, DT, 0.2);
    expect(w.view.holding?.holder).toBeDefined();
    expect(heldBy(k, k.wandererEntity)).toBe('item.scissors');
    // The same outfit is the same body; the seed's cloak instead of the bench's: another one, by C.
    w.update(k, DT, 0.3);
    expect(bodyMesh(w.view.root).geometry).toBe(dressed.geo.body);
    k.give('item.mantello', 1);
    k.wearSlot(slotOf(k, 'item.mantello'));
    w.update(k, DT, 0.4);
    const second = bodyMesh(w.view.root).geometry;
    expect(second).not.toBe(dressed.geo.body);
    // Everything off: the form's own body, the same geometry as before.
    for (const z of WORN_ZONES) {
      const at = k.inventory().worn?.[z];
      if (at !== undefined) k.wearSlot(at);
    }
    w.update(k, DT, 0.5);
    expect(bodyMesh(w.view.root).geometry).toBe(bare);
    k.inventory().equipped = null;
  });

  it('another figure with marks of its own is dressed too; a mark written badly by Lua dresses nothing and breaks nothing', async () => {
    const at = k.wandererPos();
    const view = new Entities(k, new THREE.Group());
    const inv = (worn: unknown) => ({ slots: [{ item: 'item.mantello-prova', count: 1 }, null], equipped: null, worn });
    const someone = k.ecs.spawn({ pos: { x: at.x + 2, y: at.y }, glyph: { ch: 'p', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: 'Prova' }, form: { model: 'person', seed: 1, yaw: 0 }, inventory: inv({ back: 0 }) });
    const odd = k.ecs.spawn({ pos: { x: at.x + 3, y: at.y }, glyph: { ch: 'p', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: 'Strano' }, form: { model: 'person', seed: 1, yaw: 0 }, inventory: inv({ back: '0', head: 7 }) });
    const f = (await k.forms.wait('person', 1))!;
    expect(wornBy(k, someone)).toEqual({ back: 'item.mantello-prova' });
    expect(wornBy(k, odd)).toEqual({});
    expect(() => view.update(DT, 0)).not.toThrow();
    expect(bodyMesh(view.views.get(someone)!.root).geometry).not.toBe(geoOf(f)!.body);
    expect(bodyMesh(view.views.get(odd)!.root).geometry).toBe(geoOf(f)!.body);
    k.ecs.destroy(someone);
    k.ecs.destroy(odd);
  });

  it('sixty figures in the same outfit share one dressed body, and a frame costs about what it did bare', async () => {
    const at = k.wandererPos();
    const group = new THREE.Group();
    const view = new Entities(k, group);
    const ids = Array.from({ length: 60 }, (_, i) => k.ecs.spawn({ pos: { x: at.x + (i % 10) * 0.7 - 3, y: at.y + Math.floor(i / 10) * 0.7 + 2 }, glyph: { ch: 'p', color: '#fff' }, body: { r: 0.3, solid: false }, identity: { name: `P${i}` }, form: { model: 'person', seed: 1, yaw: 0 }, inventory: { slots: [{ item: 'item.corazza-prova', count: 1 }], equipped: null } }));
    await k.forms.wait('person', 1);
    const time = (n: number) => {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) view.update(DT, i * DT);
      return (performance.now() - t0) / n;
    };
    view.update(DT, 0);
    time(5);
    const bare = Math.min(time(20), time(20));
    for (const id of ids) k.ecs.get(id, 'inventory').worn = { torso: 0 };
    view.update(DT, 0);
    time(5);
    const dressed = Math.min(time(20), time(20));
    const bodies = new Set(ids.map((id) => bodyMesh(view.views.get(id)!.root).geometry));
    expect(bodies.size).toBe(1);
    // Within noise of the bare frame, generously: the outfit is read, the body is not made again.
    expect(dressed).toBeLessThan(bare * 3 + 1);
    for (const id of ids) k.ecs.destroy(id);
  }, 60_000);
});

// --- Two wanderers: what goes on the wire -----------------------------------------------------------------------------------------

async function bootMany(): Promise<Kernel> {
  const cfg = JSON.parse(bundledFiles['universe.json']);
  const files = { ...bundledFiles, 'universe.json': JSON.stringify({ ...cfg, game: { mode: 'multiplayer', death: 3 } }, null, 2) };
  return Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
}

async function thin(server: SessionServer, id: string, heard: ServerMsg[] = []): Promise<ThinClient> {
  const { server: s, client: c } = fakeLink();
  c.onMessage((m) => heard.push(m));
  server.connect(s);
  const session = new SessionClient(c, { id });
  await session.ready;
  const k = await Kernel.boot({ files: session.files, store: memoryStore(), ai: new MockAiModels(), mirror: true });
  return new ThinClient(k, session);
}

function frames(server: SessionServer, clients: ThinClient[], n: number) {
  for (let i = 0; i < n; i++) {
    for (const c of clients) {
      c.k.tick(DT);
      c.frame(DT);
    }
    server.tick(DT);
  }
}

async function settle(server: SessionServer, clients: ThinClient[]) {
  for (let i = 0; i < 6; i++) {
    frames(server, clients, 3);
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe('two wanderers', () => {
  it('what one wears the other sees on her body, at once on her own client, and nothing else of what she carries', async () => {
    const k = await bootMany();
    const server = new SessionServer(k);
    const anna = await thin(server, 'anna');
    const heard: ServerMsg[] = [];
    const bruno = await thin(server, 'bruno', heard);
    for (let i = 0; i < 60; i++) {
      frames(server, [anna, bruno], 1);
      await new Promise((r) => setTimeout(r, 10));
    }
    k.as('anna', () => {
      k.give('item.mantello', 1);
      k.give('item.coltello', 1);
    });
    frames(server, [anna, bruno], 6);
    const slot = anna.k.inventory().slots.findIndex((s) => s?.item === 'item.mantello');
    expect(slot).toBeGreaterThanOrEqual(0);
    // She puts on the cloak by using it, as with a double click: her own client shows it at once.
    anna.k.useSlot(slot);
    expect(wornBy(anna.k, anna.k.wandererEntity)).toEqual({ back: 'item.mantello' });
    await settle(server, [anna, bruno]);
    expect(k.as('anna', () => k.outfit())).toEqual({ back: 'item.mantello' });
    const her = () => bruno.k.ecs.query('remote').find((e) => bruno.k.ecs.get(e, 'remote').id === 'anna')!;
    expect(her()).toBeDefined();
    expect(wornBy(bruno.k, her())).toEqual({ back: 'item.mantello' });
    // On the wire: the ids by zone, and of what she carries nothing else.
    const views = heard.flatMap((m) => (m.t === 'update' || m.t === 'welcome' ? (m.wanderers ?? []) : [])).filter((w) => w.id === 'anna');
    expect(views[views.length - 1].worn).toEqual({ back: 'item.mantello' });
    for (const v of views) expect(Object.keys(v).every((key) => ['id', 'name', 'x', 'y', 'facing', 'form', 'text', 'introduction', 'held', 'worn'].includes(key)), JSON.stringify(v)).toBe(true);
    expect(JSON.stringify(views)).not.toContain('item.coltello');
    // She takes it off, with the button: it leaves her body for Bruno too.
    anna.k.wearSlot(slot);
    expect(wornBy(anna.k, anna.k.wandererEntity)).toEqual({});
    await settle(server, [anna, bruno]);
    expect(wornBy(bruno.k, her())).toEqual({});
    expect(k.as('anna', () => k.outfit())).toEqual({});
  }, 120_000);
});

// --- The validator and the Sculptor ----------------------------------------------------------------------------------------------

describe('the validator and the Sculptor', () => {
  const box: [number, number, number] = [12, 12, 12];
  const validate = (path: string, xml: string, size?: [number, number, number]) => modelErrors(path, xml, 8_000, size);

  it('a model with good sections passes; a broken section goes back with its reason', () => {
    for (const [zone, xml] of Object.entries(THINGS)) expect(validate(`models/x-${zone}.xml`, xml, box)).toEqual([]);
    const bad: Array<[string, RegExp]> = [
      [THINGS.head.replace('zone="head"', 'zone="piedi"'), /non è una zona/],
      [THINGS.head + '\n<worn zone="head"><all in="[rm] z" out="I z"/></worn>', /una sola sezione per zona/],
      [THINGS.head.replace('<all>', '<all><box at="1 1 1" size="2 2 2" color="I"/>'), /non va qui/],
      [THINGS.head.replace(/<worn zone="head">[\s\S]*<\/worn>/, '<worn zone="head"><all in="o" out="I"/></worn>'), /non scrivono niente/],
      [THINGS.head.replace(/<worn zone="head">[\s\S]*<\/worn>/, '<worn zone="head"><all in="[rm]z" out="3z"/></worn>'), /cifra/],
    ];
    for (const [xml, why] of bad) {
      expect(validate('models/x.xml', xml, box).join('; '), why.source).toMatch(why);
    }
    // Before the root, it is not where the kernel looks for the box.
    const before = THINGS.head.replace(/([\s\S]*?)(<sequence[\s\S]*<\/sequence>)([\s\S]*)/, '$3\n$1$2');
    expect(validate('models/x.xml', before, box).join('; ')).toMatch(/va dopo il programma/);
  });

  it('the Sculptor knows what is worn: the role says how, the request says where, its checks try the section', () => {
    const role = sculptorRole(bundledFiles);
    expect(role).toContain('## Worn things');
    expect(role).toContain('<worn zone="head|torso|back">');
    expect(sculptorRole(bundledFiles, true)).not.toContain('Worn things');
    const cls = classOf('object')!;
    expect(describeRequest({ id: 'elmo', nome: 'Elmo', aspetto: 'un elmo', classe: 'object', worn: 'head' }, cls)).toContain('<worn zone="head">');
    expect(describeRequest({ id: 'masso', nome: 'Masso', aspetto: 'un masso', classe: 'object' }, cls)).not.toContain('worn');
    expect(checkProgram(THINGS.head, cls).error).toBeUndefined();
    expect(checkProgram(THINGS.head.replace('zone="head"', 'zone="coda"'), cls).error).toMatch(/non è una zona/);
  });

  it('offline, the Sculptor writes the section of a thing worn, and it passes', async () => {
    const council = new Council(new MockAiModels(), () => ({ files: bundledFiles, palette: {}, catalog: [] }));
    const r = await sculpt(council, { id: 'cappuccio-prova', nome: 'Cappuccio', aspetto: 'un cappuccio di lana', classe: 'object', worn: 'head' }, undefined, { semplici: 1, revisione: false, giudizio: false });
    expect(r?.xml).toMatch(/<worn zone="head">/);
    expect(validate('models/cappuccio-prova.xml', r!.xml)).toEqual([]);
    const m = compileMjx(withoutWorn(r!.xml), { size: [20, 20, 20] });
    const program = wornProgram(r!.xml, 'head', { background: backgroundOf(r!.xml)!, palette: m.program.palette });
    const f = await formOf('viandante', 1);
    const d = dressBody({ grid: f.result!.grid, palette: f.result!.palette }, [{ zone: 'head', colors: [{ color: '#888888' }], program }]);
    expect(d.changes[0].way).toBe('B');
  });

  it('the models the director asks for say where a thing is worn: its own model, and the common shape of hats', async () => {
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels() });
    k.content.items.set('item.elmo-nuovo', { ...ITEMS[0], id: 'item.elmo-nuovo', model: 'elmo-nuovo' });
    k.content.items.set('item.cuffia', { ...ITEMS[3], id: 'item.cuffia', model: 'shape-hat' });
    k.content.items.set('item.tunica', { ...ITEMS[1], id: 'item.tunica', model: 'shape-garment' });
    const asked = k.sculpting.missing();
    expect(asked.find((r) => r.id === 'elmo-nuovo')?.worn).toBe('head');
    expect(asked.find((r) => r.id === 'shape-hat')?.worn).toBe('head');
    expect(asked.find((r) => r.id === 'shape-garment')?.worn).toBeUndefined();
  }, 120_000);
});
