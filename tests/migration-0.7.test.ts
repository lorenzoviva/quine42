// The migration 0.6 → 0.7 (T310b, ADR-0189): the values the Council's schemas still listed in Italian take their internal names, and
// every bond of the registry gets its kind as an id. A universe of 0.6 opens ported: its plans (where a thing stands), its manifests
// (the type of an environment, the roles of the stamps' codes, the places and the bonuses of the things, the controls of a tool, the
// ways of the minds in its components and its cases, what its slots accept), the Lua of the Council's modules where the kernel reads a
// value (`mind.mode`, `items.bonus`), its people (`kind`); the player's Lua stays as it was (rule 3). The answers of the Council with the
// fields of before read the same (`internalAnswer`), and the seed is of the contract.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { INTERNAL_NAMES, internalAnswer, internalName } from '../src/kernel/internalNames';
import { luaFor0_7, migratePlanRecord, migrateUniverse, MIGRATIONS, portedProgram } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE } from '../src/kernel/universes';
import { checkKernelVersion, KERNEL_CONTRACT, KERNEL_VERSION } from '../src/kernel/version';
import { relationKind, reverseRelation } from '../src/kernel/npc/model';
import { COMPASS, direction, directionVector, directionWord } from '../src/kernel/atlas';
import { defaultCodes } from '../src/kernel/stamps';
import { hashStr, hex } from '../src/kernel/rng';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { FileMap } from '../src/kernel/types';

const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const write = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const h = (s: string) => hex(hashStr(s));

/** A Council module of 0.6: a cat that follows, and a mechanic that reads a bonus. */
const CAT_LUA = [
  '-- Un gatto che segue: "vaga" in un commento resta com\'è.',
  'local M = {}',
  'function M.update(dt)',
  '  ecs.each("mind", function(id, mind)',
  '    if mind.mode == "segui" then return end',
  '    if mind.mode ~= "resta" and mind.mood == "vaga" then mind.mode = "vaga" end',
  '    local t = { mode = "segui" }',
  '    local v = items.bonus(id, "difesa") + items.bonus(id, "luce")',
  '    local w = items.bonus(id, "attacco", "difesa")',
  '    local s = "segui"',
  '    return t, v, w, s',
  '  end)',
  'end',
  'return M',
].join('\n');

const CAT_LUA_0_7 = [
  '-- Un gatto che segue: "vaga" in un commento resta com\'è.',
  'local M = {}',
  'function M.update(dt)',
  '  ecs.each("mind", function(id, mind)',
  '    if mind.mode == "follow" then return end',
  '    if mind.mode ~= "stay" and mind.mood == "vaga" then mind.mode = "wander" end',
  '    local t = { mode = "follow" }',
  '    local v = items.bonus(id, "defense") + items.bonus(id, "light")',
  '    local w = items.bonus(id, "attack", "difesa")',
  '    local s = "segui"',
  '    return t, v, w, s',
  '  end)',
  'end',
  'return M',
].join('\n');

/** A universe of the contract 0.6: an environment with a stamp, a pack with a worn thing, a tool, a follower, a mechanic, people. */
function universe06(): FileMap {
  return {
    'universe.json': write({ name: 'vecchio', kernel: '0.6.12', kernels: { from: '0.6' }, seed: 7 }),
    'modules/world.ambienti/manifest.json': write({
      id: 'world.ambienti', name: 'Ambienti', kind: 'data', origin: 'cartografo',
      layouts: {
        rocca: { name: 'Rocca', description: 'una rocca', environment: 'misto', program: { type: 'sequence', children: [{ type: 'stamp', shape: 'castle', codes: { muro: 'b', ponte: 'z', recinto: 'h' } }, { type: 'prl', rules: [{ in: 'g', out: 't', p: 0.1 }] }] } },
        bosco: { name: 'Bosco', description: 'un bosco', environment: 'esterno', program: { type: 'prl', rules: [{ in: 'g', out: 't', p: 0.3 }] } },
        cripta: { name: 'Cripta', description: 'sotto', environment: 'interno', program: { type: 'stamp', shape: 'dungeon', codes: { roccia: 'k', wall: 'h' } } },
      },
    }),
    'modules/items.vesti/manifest.json': write({
      id: 'items.vesti', name: 'Vesti', kind: 'data', origin: 'narratore',
      items: [
        { id: 'item.elmo', name: 'Elmo', category: 'clothing', weight: 1, stack: 1, tags: [], slot: 'testa', bonus: { difesa: 3, velocita: 0.95, calore: 1 } },
        { id: 'item.scudo', name: 'Scudo', category: 'weapon', weight: 2, stack: 1, tags: [], slot: 'scudo' },
        { id: 'item.pane', name: 'Pane', category: 'food', weight: 0.3, stack: 5, tags: [] },
      ],
    }),
    'modules/item.coltello/manifest.json': write({ id: 'item.coltello', name: 'Coltello', kind: 'item', logic: 'logic.lua', origin: 'agente', item: { stackable: false, maxStack: 1, weight: 1, equippable: true, controls: { azione: 'taglia', usa: 'si affila' } } }),
    'modules/item.coltello/logic.lua': 'local M = {}\nreturn M\n',
    'modules/npc.gatto/manifest.json': write({
      id: 'npc.gatto', name: 'Gatto', kind: 'entity', logic: 'logic.lua', origin: 'agente', persona: 'Sei un gatto.', appearance: { glyph: 'G', color: '#ccc', class: 'animal' },
      components: { mind: { mode: 'vaga', mood: 'tranquillo', history: [] }, wander: { dx: 0, dy: 0, t: 0, speed: 1 } },
      cases: [{ title: 'Segue', story: 'il gatto segue', entities: [{ module: 'npc.gatto', x: 1, y: 0, components: { mind: { mode: 'segui', mood: 'curioso', history: [] } } }], wanderer: { components: { mind: { mode: 'resta' } } }, duration: 2, watch: ['0:mind.mode'] }],
    }),
    'modules/npc.gatto/logic.lua': CAT_LUA,
    'modules/mech.vesti/manifest.json': write({
      id: 'mech.vesti', name: 'Vesti', kind: 'system', logic: 'logic.lua', origin: 'engineer',
      ui: { id: 'vesti', title: 'Vesti', elements: [{ type: 'slot', id: 'testa', label: 'Testa', accepts: ['testa', 'clothing'] }, { type: 'slot', id: 'mano', label: 'Mano', accepts: ['arma', 'scudo', 'tool'] }, { type: 'text', label: 'Difesa', field: 'difesa.valore' }] },
      cases: [{ title: 'Elmo', story: 'si mette', wanderer: { items: [{ name: 'Elmo', slot: 'testa', bonus: { difesa: 3 } }] }, duration: 1, watch: ['difesa.valore'] }],
    }),
    'modules/mech.vesti/logic.lua': 'local M = {}\nfunction M.on_slot(user, slot, item, panel)\n  local d = items.bonus(item, "difesa")\n  return d\nend\nreturn M\n',
    // A module the player wrote: no origin. Their Lua is theirs; their data is read by the kernel and ported.
    'modules/mio.cane/manifest.json': write({ id: 'mio.cane', name: 'Cane', kind: 'entity', logic: 'logic.lua', persona: 'Sei un cane.', appearance: { glyph: 'C', color: '#a86', class: 'animal' }, components: { mind: { mode: 'segui', mood: 'felice', history: [] } } }),
    'modules/mio.cane/logic.lua': 'local M = {}\nfunction M.update(dt) local m = ecs.first("mind") if m and m.mode == "segui" then return end end\nreturn M\n',
    'world/people.json': write({
      people: [
        { name: 'Ada', kind: 'npc.villager', species: 'person', gender: 'female', job: 'fornaia', family: [{ name: 'Berta', bond: 'madre' }, { name: 'Tazio', bond: 'amica', kind: 'friend' }, { name: 'Viandante', bond: 'moglie', wanderer: 'me' }], routine: [] },
        { name: 'Berta', kind: 'npc.villager', species: 'person', gender: 'female', job: 'tessitrice', family: [{ name: 'Ada', bond: 'figlia' }], routine: [] },
      ],
      expected: [{ name: 'Tazio', bond: 'amico', of: 'Ada' }, { name: 'Nonna Ilde', bond: 'nipote', kind: 'grandchild_or_nephew', of: 'Berta' }],
    }),
  };
}

describe('the migration 0.6 → 0.7: a universe of 0.6, file by file', () => {
  const before = universe06();
  const { files, applied } = migrateUniverse(before);

  it('is the sixth migration of the chain, it says what it does, and the universe runs on this kernel', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`)).toEqual(['0.1→0.2', '0.2→0.3', '0.3→0.4', '0.4→0.5', '0.5→0.6', '0.6→0.7']);
    expect(KERNEL_CONTRACT).toBe('0.7');
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatch(/^0\.6→0\.7: .*dentro → inside/);
    const cfg = json(files['universe.json']);
    expect(cfg).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: '0.7' } });
    expect(checkKernelVersion(cfg.kernel, KERNEL_VERSION, cfg.kernels).ok).toBe(true);
    // Pure, and a universe of 0.7 stays as it is.
    expect(migrateUniverse(universe06()).files).toEqual(files);
    expect(migrateUniverse(files).applied).toEqual([]);
    expect(migrateUniverse(files).files).toBe(files);
  });

  it('the environments: their type, and the roles of their stamps\' codes (a role already internal stays)', () => {
    const layouts = json(files['modules/world.ambienti/manifest.json']).layouts;
    expect(Object.values(layouts).map((l: any) => l.environment)).toEqual(['mixed', 'outdoor', 'indoor']);
    expect(layouts.rocca.program.children[0].codes).toEqual({ wall: 'b', bridge: 'z', fence: 'h' });
    expect(layouts.rocca.program.children[1]).toEqual({ type: 'prl', rules: [{ in: 'g', out: 't', p: 0.1 }] });
    expect(layouts.cripta.program.codes).toEqual({ rock: 'k', wall: 'h' });
  });

  it('the things: their places and their bonuses; a tool\'s controls; what a panel\'s slots accept (the slots\' ids are the module\'s)', () => {
    const items = json(files['modules/items.vesti/manifest.json']).items;
    expect(items[0]).toMatchObject({ slot: 'head', bonus: { defense: 3, speed: 0.95, warmth: 1 } });
    expect(items[1].slot).toBe('shield');
    expect(items[2].slot).toBeUndefined();
    expect(json(files['modules/item.coltello/manifest.json']).item.controls).toEqual({ action: 'taglia', use: 'si affila' });
    const ui = json(files['modules/mech.vesti/manifest.json']).ui;
    expect(ui.elements[0]).toEqual({ type: 'slot', id: 'testa', label: 'Testa', accepts: ['head', 'clothing'] });
    expect(ui.elements[1].accepts).toEqual(['weapon', 'shield', 'tool']);
    expect(json(files['modules/mech.vesti/manifest.json']).cases[0].wanderer.items[0]).toEqual({ name: 'Elmo', slot: 'head', bonus: { defense: 3 } });
  });

  it('the minds: in the components a manifest gives and in its cases, the player\'s data too', () => {
    const cat = json(files['modules/npc.gatto/manifest.json']);
    expect(cat.components.mind.mode).toBe('wander');
    expect(cat.cases[0].entities[0].components.mind.mode).toBe('follow');
    expect(cat.cases[0].wanderer.components.mind.mode).toBe('stay');
    expect(cat.cases[0].watch).toEqual(['0:mind.mode']);
    expect(json(files['modules/mio.cane/manifest.json']).components.mind.mode).toBe('follow');
  });

  it('the Lua of the Council\'s modules where the kernel reads a value; the player\'s stays as it was', () => {
    expect(files['modules/npc.gatto/logic.lua']).toBe(CAT_LUA_0_7);
    expect(files['modules/mech.vesti/logic.lua']).toContain('items.bonus(item, "defense")');
    expect(files['modules/mio.cane/logic.lua']).toBe(before['modules/mio.cane/logic.lua']);
    expect(files['modules/item.coltello/logic.lua']).toBe(before['modules/item.coltello/logic.lua']);
    // Idempotent, and nothing else changes.
    expect(luaFor0_7(CAT_LUA_0_7)).toBe(CAT_LUA_0_7);
    expect(luaFor0_7('local x = "segui"\nreturn x')).toBe('local x = "segui"\nreturn x');
  });

  it('the people: every bond with its kind, the one that had it as it was, the awaited ones too', () => {
    const p = json(files['world/people.json']);
    expect(p.people[0].family).toEqual([
      { name: 'Berta', bond: 'madre', kind: 'parent' },
      { name: 'Tazio', bond: 'amica', kind: 'friend' },
      { name: 'Viandante', bond: 'moglie', wanderer: 'me', kind: 'spouse' },
    ]);
    expect(p.people[1].family).toEqual([{ name: 'Ada', bond: 'figlia', kind: 'child' }]);
    expect(p.expected).toEqual([{ name: 'Tazio', bond: 'amico', kind: 'friend', of: 'Ada' }, { name: 'Nonna Ilde', bond: 'nipote', kind: 'grandchild_or_nephew', of: 'Berta' }]);
  });

  it('the plans: where a thing and a new one stand, idempotent, on every plan read', () => {
    const plan = { place: { name: 'x', description: '' }, layout: 'bosco', objects: [{ module: 'obj.bed', where: 'dentro' }, { module: 'npc.gatto', where: 'fuori' }, { module: 'obj.well', where: 'anywhere' }], ground: [], fresh: [{ concept: 'un pozzo', where: 'ovunque', takeable: false }], runes: [] } as unknown as ChunkPlan;
    const once = migratePlanRecord({ plan }).plan;
    expect(once.objects.map((o) => o.where)).toEqual(['inside', 'outside', 'anywhere']);
    expect(once.fresh[0]).toEqual({ concept: 'un pozzo', where: 'anywhere', takeable: false });
    const record = { plan: once };
    expect(migratePlanRecord(record)).toBe(record);
  });

  it('seed.json follows, and a program alone (a handmade card of 0.6) carries over as it is', () => {
    const u = universe06();
    u[SEED_FILE] = JSON.stringify({ 'modules/items.vesti/manifest.json': h(u['modules/items.vesti/manifest.json']), 'modules/mio.cane/manifest.json': 'cambiato' }, null, 1) + '\n';
    const out = migrateUniverse(u).files;
    const seed = json(out[SEED_FILE]);
    expect(seed['modules/items.vesti/manifest.json']).toBe(h(out['modules/items.vesti/manifest.json']));
    expect(seed['modules/mio.cane/manifest.json']).toBe('cambiato');
    const xml = '<sequence values="BW"><one in="B" out="W"/></sequence>';
    expect(portedProgram(xml, '0.6')).toEqual({ xml, contract: '0.7' });
    expect(portedProgram('<sequence values="B1"><one in="B" out="1"/></sequence>', '0.5')).toEqual({ xml: '<sequence values="B#1"><one in="B" out="#1"/></sequence>', contract: '0.7' });
  });

  it('prepareUniverse: the chain, then the seed of today, which is of the contract', () => {
    const out = prepareUniverse(universe06(), bundledFiles);
    expect(out.applied).toHaveLength(1);
    expect(json(out.files['universe.json']).kernels).toEqual({ from: '0.7' });
    // The seed says the values of 0.7 everywhere the table names them.
    const layouts = json(bundledFiles['modules/world.layouts/manifest.json']).layouts as Record<string, { environment: string; program: unknown }>;
    expect(Object.values(layouts).every((l) => ['outdoor', 'indoor', 'mixed'].includes(l.environment))).toBe(true);
    expect(JSON.stringify(layouts)).not.toMatch(/"(muro|pavimento|porta|acqua|ponte|terreno|strada|roccia|recinto)":/);
    const items = json(bundledFiles['modules/items.base/manifest.json']).items as Array<{ slot?: string }>;
    expect(items.filter((i) => i.slot).map((i) => i.slot)).toEqual(['head', 'torso']);
    expect(json(bundledFiles['modules/item.scissors/manifest.json']).item.controls).toEqual({ action: expect.any(String) });
    for (const m of ['sys.follow', 'sys.wander', 'sys.work']) expect(bundledFiles[`modules/${m}/logic.lua`]).not.toMatch(/mind\.mode\s*[=~]=?\s*"(segui|vaga|resta)"/);
    expect(JSON.stringify(json(bundledFiles['modules/sys.follow/manifest.json']))).not.toContain('"segui"');
  });
});

describe('the readers of the contract 0.7', () => {
  it('internalAnswer: the fields of the schemas of before read as those of today, at any depth; the three that change meaning stay', () => {
    const r = internalAnswer({ titolo: 'x', tappe: [{ giorno: 1, chi: 'Ada', dove: 'square', cosa: 'y', battuta: 'z' }], missione: { da: 'Ada', testo: 't', tipo: 'bring', oggetto: 'pane', a: 'Berta' }, oggetti: [{ nome: 'Pane', tag: ['cucina'], storia: 's', effetti: { fame: 10 }, bonus: { difesa: 1 } }], effetti: [{ tipo: 'luce', raggio: 2 }] });
    // The keys only: a value of before (`luce`) is the validator's to repair (`internalEffect`), the bonuses' names the reader's.
    expect(r).toEqual({ title: 'x', beats: [{ day: 1, who: 'Ada', where: 'square', what: 'y', line: 'z' }], quest: { from: 'Ada', text: 't', type: 'bring', item: 'pane', to: 'Berta' }, oggetti: [{ name: 'Pane', tag: ['cucina'], storia: 's', effects: { hunger: 10 }, bonus: { difesa: 1 } }], effects: [{ type: 'luce', radius: 2 }] });
    // A key whose English name is there already gives way to it; what is not an object stays.
    expect(internalAnswer({ nome: 'a', name: 'b' })).toEqual({ name: 'b' });
    expect(internalAnswer('testo')).toBe('testo');
    expect(internalAnswer(['nome'])).toEqual(['nome']);
  });

  it('the fields of the answers agree with those of the files the answers become, and with the effects, where they share a word', () => {
    const answers = INTERNAL_NAMES.find((d) => d.id === 'campi-risposte')!.names;
    const clashes: string[] = [];
    // The files an answer is written into as it is (the bible, the plots, the people, the atlas, the rules) and the effects it carries.
    for (const id of ['campi-effetti', 'campi-bibbia', 'campi-trame', 'campi-persone', 'campi-atlante', 'campi-regole'])
      for (const [it, en] of Object.entries(INTERNAL_NAMES.find((d) => d.id === id)!.names)) if (Object.hasOwn(answers, it) && answers[it] !== en) clashes.push(`${id}: ${it} → ${en}, nelle risposte ${answers[it]}`);
    // `tipo` is the kind of an individual in its file and the type of a quest in its schema; `azione` the activity of a routine (the schema says `activity`, the reader takes both).
    expect(clashes.sort()).toEqual(['campi-persone: azione → activity, nelle risposte action', 'campi-persone: tipo → kind, nelle risposte type'].sort());
    for (const k of ['storia', 'oggetti', 'tag']) expect(answers[k]).toBeUndefined();
  });

  it('the values of the step T310b: every domain has its words and the table reads both ways', () => {
    for (const d of INTERNAL_NAMES.filter((x) => x.step === 'T310b' && x.kind === 'values')) expect(Object.keys(d.names).length, d.id).toBeGreaterThan(0);
    expect(internalName('dove-piano', 'dentro')).toBe('inside');
    expect(internalName('dove-piano', 'inside')).toBe('inside');
    expect(internalName('tipi-ambiente', 'misto')).toBe('mixed');
    expect(internalName('azioni-npc', 'vaga')).toBe('wander');
    expect(internalName('incarichi', 'riscolpisci')).toBe('resculpt');
    expect(internalName('incarichi', 'oggetto')).toBe('item');
    expect(internalName('posti', 'testa')).toBe('head');
    expect(internalName('ruoli-timbri', 'muro')).toBe('wall');
    expect(internalName('bonus', 'difesa')).toBe('defense');
    expect(internalName('ripartenza', 'piazza')).toBe('square');
    expect(internalName('tipi-fucina', 'strumento')).toBe('item');
  });

  it('the directions: ids in the code, words in the world, both read back', () => {
    expect(COMPASS).toEqual(['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']);
    expect(direction(0, 0)).toBe('here');
    expect(direction(0, -1)).toBe('north');
    expect(direction(1, 1)).toBe('south-east');
    expect(directionWord('north-east')).toBe('nord-est');
    expect(directionWord('here')).toBe('qui');
    expect(directionVector('nord')).toEqual(directionVector('north'));
    expect(directionVector('sud ovest')).toEqual([-1, 1]);
  });

  it('the bonds: the kind from the id when there is one, from the word (Italian) otherwise', () => {
    expect(relationKind({ bond: 'madre', kind: 'parent' })).toBe('parent');
    expect(relationKind({ bond: 'whatever', kind: 'sibling' })).toBe('sibling');
    expect(relationKind({ bond: 'madre', kind: 'nonsense' })).toBe('parent');
    expect(relationKind('nipote lontano')).toBe('grandchild_or_nephew');
    expect(relationKind('mother')).toBe('acquaintance');
    expect(reverseRelation({ bond: 'x', kind: 'parent' }, 'female')).toBe('figlia');
  });

  it('the roles of the stamps from the palette: by id, by the Italian name and by the English one', () => {
    const codes = defaultCodes({
      g: { name: 'prato', color: '#0f0', solid: false, layer: 'ground' },
      p: { name: 'sentiero', color: '#cc9', solid: false, layer: 'ground' },
      h: { name: 'muro', color: '#888', solid: true, layer: 'wall' },
      f: { name: 'pavimento', color: '#a86', solid: false, layer: 'floor', indoor: true },
      d: { name: 'porta', color: '#a40', solid: false, layer: 'door' },
      w: { name: 'acqua profonda', color: '#00f', solid: true, layer: 'liquid' },
      m: { id: 'moat', name: 'fossato', color: '#44a', solid: true, layer: 'liquid' },
      z: { name: 'drawbridge', color: '#852', solid: false, layer: 'floor' },
      s: { name: 'wooden fence', color: '#963', solid: true, layer: 'wall' },
    });
    expect(codes).toMatchObject({ wall: 'h', floor: 'f', door: 'd', water: 'm', bridge: 'z', ground: 'g', road: 'p', fence: 's' });
  });
});

describe('a universe of 0.6 opens on this kernel and its Council\'s code works', () => {
  it('the cat follows with the ways of 0.7, the things have their places, nothing faults', async () => {
    const files: FileMap = { ...bundledFiles, 'universe.json': write({ ...json(bundledFiles['universe.json']), kernel: '0.6.12', kernels: { from: '0.6' } }) };
    const old = universe06();
    for (const p of ['modules/npc.gatto/manifest.json', 'modules/npc.gatto/logic.lua', 'modules/items.vesti/manifest.json', 'world/people.json']) files[p] = old[p];
    const k = await Kernel.boot({ files, store: memoryStore(), ai: new MockAiModels() });
    expect(k.faults.has('universe:kernel')).toBe(false);
    expect(JSON.parse(k.files['universe.json']).kernels).toEqual({ from: '0.7' });
    for (let i = 0; i < 10; i++) k.tick(1 / 60);
    expect(k.faults.list().filter((f) => f.key.startsWith('module:npc.gatto'))).toEqual([]);
    expect(k.content.get('item.elmo')).toMatchObject({ slot: 'head', bonus: { defense: 3, speed: 0.95, warmth: 1 } });
    expect(k.modules.get('npc.gatto')!.manifest.components!.mind).toMatchObject({ mode: 'wander' });
  });
});
