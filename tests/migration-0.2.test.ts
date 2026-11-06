// The migration 0.1 → 0.2 (T307a, ADR-0153, ADR-0155): the internal language of the world's simulation. A universe of 0.1 opens ported,
// the same files giving the same files; the Lua of the Council's modules is ported only where the kernel reads a value; the seed's files a
// universe kept as they were take the seed of 0.2 in the same load; the plans of the places are ported as they are read; what the Council
// still writes in Italian is repaired; a Latin rune pronounced works; and the seed runs 400 ticks offline without faults.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { internalEffect, internalManifest, INTERNAL_NAMES } from '../src/kernel/internalNames';
import { luaFor0_2, migratePlanRecord, migrateUniverse, MIGRATIONS } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE, seedHashes } from '../src/kernel/universes';
import { checkKernelVersion, KERNEL_VERSION } from '../src/kernel/version';
import { hashStr, hex } from '../src/kernel/rng';
import { Kernel } from '../src/kernel/kernel';
import { MockAiModels } from '../src/kernel/ai/mock';
import { memoryStore } from '../src/kernel/repo';
import { MemoryChunks } from '../src/kernel/chunks';
import { cleanPanel } from '../src/kernel/agents/mechanics';
import { cleanCases } from '../src/kernel/bench';
import { readStructure } from '../src/kernel/agents/cartography';
import { repairProgram } from '../src/kernel/mj';
import { validateEffects } from '../src/kernel/validator';
import { countItem } from '../src/kernel/inventory';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { FileMap } from '../src/kernel/types';
import { UNIVERSI, leggi, leggiDisco } from '../lab/banco/universi-cloud/strumenti/cloud';
import { negozioMappe } from '../lab/banco/universi-cloud/strumenti/carica';
import { boot, clearArea, develop, giveRunes } from './world';

const h = (s: string) => hex(hashStr(s));
const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const ITALIAN = (id: string) => Object.entries(INTERNAL_NAMES.find((d) => d.id === id)!.names).filter(([it, en]) => it !== en).map(([it]) => it);

/** A small universe of the contract 0.1, as the Council and the seed of then wrote it. */
function universe01(): FileMap {
  const effects = [{ tipo: 'luce', raggio: 4, durata: 60 }, { tipo: 'terreno', a: 'p', da: 'g', raggio: 1 }, { tipo: 'bisogni', salute: 10 }];
  return {
    'universe.json': JSON.stringify({ name: 'vecchio', kernel: '0.1.9', kernels: { from: '0.1' }, seed: 7 }, null, 2) + '\n',
    'modules/magic.runes/manifest.json': JSON.stringify({
      id: 'magic.runes', name: 'Rune', kind: 'data', description: 'l’ordine conta (terra fuoco non è fuoco terra)',
      runes: { luce: { name: 'Sowilo', glyph: 'ᛊ', color: '#ffe27a', element: 'luce', description: 'il sole' }, gelo: { name: 'Isa', glyph: 'ᛁ', color: '#ccddff', element: 'ghiaccio', description: 'il gelo' } },
      spells: { luce: { name: 'Lume', description: 'luce', cost: 4, effects: [effects[0]] }, 'terra fuoco': { name: 'Palla', description: 'fuoco', cost: 16, effects: [{ tipo: 'fuoco', raggio: 2, durata: 10 }] } },
    }, null, 2) + '\n',
    'modules/npc.fabbro/manifest.json': JSON.stringify({ id: 'npc.fabbro', name: 'Fabbro', kind: 'entity', origin: 'agente', logic: 'logic.lua', appearance: { glyph: 'F', color: '#aaaaaa', model: 'persona', classe: 'persona', taglia: 'grande' }, actions: [{ id: 'forgia', label: 'Forgia', effects }] }, null, 2) + '\n',
    'modules/npc.fabbro/logic.lua': [
      '-- una luce "luce" nel commento resta',
      'local M = {}',
      'function M.on_act(id, user, action)',
      '  local d = items.def(inventory.equipped(user))',
      '  if d and d.category == "luce" then ecs.set(user, "luce", { accesa = true }) end',
      '  if "arma" ~= d.category then return "no" end',
      '  core.effects.apply(id, user, { tipo = "fuoco", raggio = 2, durata = 5 })',
      '  return "fatto"',
      'end',
      'return M',
      '',
    ].join('\n'),
    'modules/mio.modulo/manifest.json': JSON.stringify({ id: 'mio.modulo', name: 'Mio', kind: 'system', logic: 'logic.lua' }, null, 2) + '\n',
    'modules/mio.modulo/logic.lua': 'local M = {}\nfunction M.update() if items.def("x") and items.def("x").category == "cibo" then end end\nreturn M\n',
    'modules/items.pacco/manifest.json': JSON.stringify({ id: 'items.pacco', name: 'Pacco', kind: 'data', items: [{ id: 'item.pane', name: 'Pane', description: '', category: 'cibo', weight: 1, stack: 5, tags: ['cucina'], glyph: 'o', color: '#ffcc88', model: 'forma-pane' }] }, null, 2) + '\n',
    'modules/world.terrain/manifest.json': JSON.stringify({ id: 'world.terrain', name: 'Terreni', kind: 'generator', tiles: { g: { name: 'prato', color: '#5a9e48', solid: false }, p: { name: 'sentiero', color: '#c7a76a', solid: false }, t: { name: 'bosco', model: 'albero', color: '#2c6a34', solid: true }, x: { name: 'ghiaia nera', color: '#333333', solid: false } } }, null, 2) + '\n',
    'modules/world.layouts/manifest.json': JSON.stringify({ id: 'world.layouts', name: 'Ambienti', kind: 'data', layouts: { borgo: { name: 'Borgo', description: 'case', environment: 'esterno', program: { type: 'sequence', children: [{ type: 'stamp', shape: 'casa' }, { type: 'markov', children: [{ type: 'stamp', shape: 'pozzo' }] }] } }, mio_ambiente: { name: 'Mio', description: 'mio', environment: 'esterno', program: { type: 'stamp', shape: 'torre' } } } }, null, 2) + '\n',
    'modules/sys.mecc/manifest.json': JSON.stringify({ id: 'sys.mecc', name: 'Mecc', kind: 'system', ui: { id: 'm', titolo: 'M', elementi: [{ tipo: 'barra', campo: 'needs.health' }, { tipo: 'pulsante', id: 'via' }] }, casi: [{ titolo: 'c', guarda: ['a.b'], durata: 1, passi: [{ tipo: 'cammina', verso: 'giu', secondi: 1 }, { tipo: 'pulsante', azione: 'via' }] }] }, null, 2) + '\n',
    'models/index.json': JSON.stringify({ albero: { classe: 'albero', nome: 'Pino' }, 'forma-pane': { classe: 'oggetto', nome: 'pane' }, 'casa-comune-edificio-0a1b2c3d': { classe: 'edificio', nome: 'Casa' }, 'suono-x': { classe: 'suono', suono: { uso: 'musica', ambienti: ['borgo', 'mio_ambiente'] } } }, null, 1) + '\n',
    'models/albero.xml': '<sequence values="BG"><box at="1 1"/></sequence>\n',
    'models/forma-pane.xml': '<sequence values="BG"><box at="1 1"/></sequence>\n',
    'models/casa-comune-edificio-0a1b2c3d.xml': '<sequence values="BG"><box at="1 1"/><action name="apri" label="Apri"><all/></action></sequence>\n',
    'world/stato.json': JSON.stringify({ rari: { enorme: { '0,0': '1,2' } }, forme: { 'casa#1': ['apri'] }, contenitori: { k: { inv: { slots: [{ item: 'rune:fuoco', count: 1 }] } } }, viandante: { hand: { tokens: ['luce', 'x', 'vento'] } } }, null, 1) + '\n',
    'world/giocatori/io.json': JSON.stringify({ inventory: { slots: [{ item: 'rune:scudo', count: 2 }, { item: 'item.pane', count: 1 }] }, hand: { tokens: ['acqua'] } }, null, 1) + '\n',
    'world/imprese.json': JSON.stringify({ imprese: [{ id: 'i1', classe: 'edificio', taglia: 'media', modello: 'casa-comune-edificio-0a1b2c3d' }] }, null, 1) + '\n',
    'world/rules.json': JSON.stringify({ regole: [{ chiave: 'k', testo: 't', possibile: true, racconto: 'r', effetti: ['forma', 'luce', 'ricetta: pane ×1'] }] }, null, 1) + '\n',
    'world/atlas.json': JSON.stringify({ regioni: [{ id: 'borgo', nome: 'Borgo', ambiente: 'borgo' }, { id: 'mia', nome: 'Mia', ambiente: 'mio_ambiente' }] }, null, 2) + '\n',
    'world/canone.md': '# Canone\n\n- terra fuoco è una palla di fuoco; «vento» spinge.\n- ᛁ Isa («gelo», ghiaccio): il gelo.\n',
    'world/carte.json': JSON.stringify({ utilizzi: { 'modello:albero': { luoghi: 1, trame: 0, prompt: 2 }, 'tipo:npc-fabbro': { luoghi: 3, trame: 0, prompt: 0 } } }, null, 1) + '\n',
  };
}

describe('the migration 0.1 → 0.2: a universe of 0.1, file by file', () => {
  const before = universe01();
  const { files, applied } = migrateUniverse(before);

  it('is the one migration, and it says what it does', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`)).toEqual(['0.1→0.2']);
    expect(applied).toHaveLength(1);
    expect(json(files['universe.json'])).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: '0.2' } });
    expect(checkKernelVersion(json(files['universe.json']).kernel, KERNEL_VERSION, json(files['universe.json']).kernels).ok).toBe(true);
  });

  it('ports the runes to Latin, the incantations, the effects and their fields; a rune of the Council keeps its token', () => {
    const m = json(files['modules/magic.runes/manifest.json']);
    expect(Object.keys(m.runes)).toEqual(['lux', 'gelo']);
    expect(m.runes.lux.element).toBe('light');
    expect(m.runes.gelo.element).toBe('ghiaccio');
    expect(Object.keys(m.spells)).toEqual(['lux', 'terra ignis']);
    expect(m.spells.lux.effects).toEqual([{ type: 'light', radius: 4, duration: 60 }]);
    expect(m.description).toContain('terra ignis non è ignis terra');
  });

  it('ports the look, the effects of the actions, the items, the terrains with their ids, the environments and their stamps', () => {
    const f = json(files['modules/npc.fabbro/manifest.json']);
    expect(f.appearance).toMatchObject({ model: 'person', classe: 'person', taglia: 'large' });
    expect(f.actions[0].id).toBe('forgia');
    expect(f.actions[0].effects).toEqual([{ type: 'light', radius: 4, duration: 60 }, { type: 'terrain', to: 'p', from: 'g', radius: 1 }, { type: 'needs', health: 10 }]);
    expect(json(files['modules/items.pacco/manifest.json']).items[0]).toMatchObject({ category: 'food', model: 'shape-bread' });
    const tiles = json(files['modules/world.terrain/manifest.json']).tiles;
    expect([tiles.g.id, tiles.p.id, tiles.t.id, tiles.x.id]).toEqual(['meadow', 'path', 'forest', undefined]);
    expect(tiles.g.name).toBe('prato');
    expect(tiles.t.model).toBe('tree');
    const layouts = json(files['modules/world.layouts/manifest.json']).layouts;
    expect(Object.keys(layouts)).toEqual(['village', 'mio_ambiente']);
    expect(JSON.stringify(layouts.village.program)).toBe(JSON.stringify({ type: 'sequence', children: [{ type: 'stamp', shape: 'house' }, { type: 'markov', children: [{ type: 'stamp', shape: 'well' }] }] }));
    expect(layouts.mio_ambiente.program.shape).toBe('tower');
    const sys = json(files['modules/sys.mecc/manifest.json']);
    expect(sys.ui.elementi.map((e: { tipo: string }) => e.tipo)).toEqual(['bar', 'button']);
    expect(sys.casi[0].passi).toEqual([{ tipo: 'walk', verso: 'down', secondi: 1 }, { tipo: 'button', azione: 'via' }]);
  });

  it('renames the models the kernel names, and their index, sounds and actions', () => {
    expect(Object.keys(files).filter((p) => p.startsWith('models/')).sort()).toEqual(['models/casa-comune-building-0a1b2c3d.xml', 'models/index.json', 'models/shape-bread.xml', 'models/tree.xml']);
    const index = json(files['models/index.json']);
    expect(Object.keys(index)).toEqual(['tree', 'shape-bread', 'casa-comune-building-0a1b2c3d', 'suono-x']);
    expect(index.tree.classe).toBe('tree');
    expect(index['suono-x'].suono.ambienti).toEqual(['village', 'mio_ambiente']);
    expect(files['models/casa-comune-building-0a1b2c3d.xml']).toContain('<action name="open" label="Apri">');
    expect(files['models/index.json']).toMatch(/^\{\n "tree"/);
  });

  it('ports the state, the wanderers, the ventures, the rules, the atlas, the canon and the cards', () => {
    const st = json(files['world/stato.json']);
    expect(st.rari).toEqual({ huge: { '0,0': '1,2' } });
    expect(st.forme['casa#1']).toEqual(['open']);
    expect(st.contenitori.k.inv.slots[0].item).toBe('rune:ignis');
    expect(st.viandante.hand.tokens).toEqual(['lux', 'x', 'ventus']);
    const io = json(files['world/giocatori/io.json']);
    expect(io.inventory.slots.map((s: { item: string }) => s.item)).toEqual(['rune:scutum', 'item.pane']);
    expect(io.hand.tokens).toEqual(['aqua']);
    expect(json(files['world/imprese.json']).imprese[0]).toMatchObject({ classe: 'building', taglia: 'medium', modello: 'casa-comune-building-0a1b2c3d' });
    expect(json(files['world/rules.json']).regole[0].effetti).toEqual(['forma', 'light', 'ricetta: pane ×1']);
    expect(json(files['world/atlas.json']).regioni.map((r: { id: string; ambiente: string }) => [r.id, r.ambiente])).toEqual([['borgo', 'village'], ['mia', 'mio_ambiente']]);
    expect(files['world/canone.md']).toBe('# Canone\n\n- terra ignis è una palla di fuoco; «ventus» spinge.\n- ᛁ Isa («gelo», ghiaccio): il gelo.\n');
    expect(Object.keys(json(files['world/carte.json']).utilizzi)).toEqual(['modello:tree', 'tipo:npc-fabbro']);
  });

  it('ports the Lua of the Council where the kernel reads a value, and leaves the player’s', () => {
    const lua = files['modules/npc.fabbro/logic.lua'];
    expect(lua).toContain('-- una luce "luce" nel commento resta');
    expect(lua).toContain('d.category == "light" then ecs.set(user, "luce", { accesa = true })');
    expect(lua).toContain('if "weapon" ~= d.category then');
    expect(lua).toContain('core.effects.apply(id, user, { type = "fire", radius = 2, duration = 5 })');
    expect(files['modules/mio.modulo/logic.lua']).toBe(before['modules/mio.modulo/logic.lua']);
  });

  it('is deterministic, and what is ported stays as it is', () => {
    expect(migrateUniverse(universe01()).files).toEqual(files);
    const again = MIGRATIONS[0].migrate(files);
    for (const p of Object.keys(files)) expect(again[p], p).toBe(files[p]);
  });
});

describe('the Lua of the Council, token by token', () => {
  it('replaces a value only where the kernel reads it, in a string, keeping quotes, comments and long strings', () => {
    expect(luaFor0_2("if x.category ~= 'vestiario' then end")).toBe("if x.category ~= 'clothing' then end");
    expect(luaFor0_2('local s = "luce" -- d.category == "luce"')).toBe('local s = "luce" -- d.category == "luce"');
    expect(luaFor0_2('local t = [[ d.category == "cibo" ]]')).toBe('local t = [[ d.category == "cibo" ]]');
    expect(luaFor0_2('return { tipo = "messaggio", testo = "ciao", nested = { tipo = "x", raggio = 1 } }')).toBe('return { type = "message", text = "ciao", nested = { tipo = "x", raggio = 1 } }');
    expect(luaFor0_2('return { tipo = "nessuno", raggio = 1 }')).toBe('return { tipo = "nessuno", raggio = 1 }');
    expect(luaFor0_2('ecs.set(u, "luce", { raggio = 3 })')).toBe('ecs.set(u, "luce", { raggio = 3 })');
  });
});

describe('seed.json after the migration', () => {
  it('a file the universe kept as the seed had it stays the seed’s, and takes the seed of 0.2; one it changed stays its own', () => {
    const old = universe01();
    const pristineEffects = 'local M = {}\nfunction M.apply(t, u, e) if e.tipo == "luce" then end end\nreturn M\n';
    const files: FileMap = {
      ...old,
      'modules/core.effects/manifest.json': bundledFiles['modules/core.effects/manifest.json'],
      'modules/core.effects/logic.lua': pristineEffects,
      'modules/core.items/manifest.json': bundledFiles['modules/core.items/manifest.json'],
      'modules/core.items/logic.lua': 'return {} -- mio\n',
    };
    files[SEED_FILE] = JSON.stringify({ 'modules/core.effects/logic.lua': h(pristineEffects), 'modules/core.items/logic.lua': h('return {}\n'), 'models/albero.xml': h(old['models/albero.xml']), 'models/persona.xml': 'cancellato' }, null, 1) + '\n';
    const out = prepareUniverse(files, bundledFiles);
    expect(out.applied).toHaveLength(1);
    expect(out.files['modules/core.effects/logic.lua']).toBe(bundledFiles['modules/core.effects/logic.lua']);
    expect(out.files['modules/core.items/logic.lua']).toBe('return {} -- mio\n');
    expect(out.files['models/tree.xml']).toBe(bundledFiles['models/tree.xml']);
    // A model of the seed the universe had deleted is not brought back under its new name.
    expect(out.files['models/person.xml']).toBeUndefined();
    expect(out.changes['models/albero.xml']).toBeNull();
    expect(out.updated).toContain('modules/core.effects/logic.lua');
  });
});

describe('the plans of the places, as the kernel reads them', () => {
  const plan = { place: { name: 'Qui', description: 'qui' }, layout: 'borgo', objects: [], ground: [], fresh: [], runes: ['x', 'fuoco', 'terra vento'], strutture: [{ concetto: 'il mulino', taglia: 'enorme' }, { concetto: 'casa' }], case: [{ origine: '1,1', x: 1, y: 1, modello: 'casa-comune-grande-0a1b2c3d', seme: 1, yaw: 0, classe: 'grande', concetto: 'casa', stadio: 0.5 }] } as unknown as ChunkPlan;

  it('are ported, idempotently, and a plan of today is the same object', () => {
    const rec = migratePlanRecord({ plan });
    expect(rec.plan).toMatchObject({ layout: 'village', runes: ['x', 'ignis', 'terra ventus'], strutture: [{ concetto: 'il mulino', taglia: 'huge' }, { concetto: 'casa' }] });
    expect(rec.plan.case?.[0]).toMatchObject({ classe: 'structure', modello: 'casa-comune-structure-0a1b2c3d' });
    expect(migratePlanRecord(rec)).toBe(rec);
    expect(migratePlanRecord({ plan: { ...plan, layout: 'mio_ambiente', runes: [], strutture: undefined, case: undefined } as unknown as ChunkPlan }).plan.layout).toBe('mio_ambiente');
  });

  it('a saved plan of an environment of the seed is applied, not planned again', async () => {
    const chunks = new MemoryChunks();
    const first = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
    await chunks.save(`${first.config.name}:${first.config.seed}:${(first as any).worldSignature()}:0,0`, { plan: { place: { name: 'Piazza di prima', description: 'una piazza' }, layout: 'borgo', objects: [], ground: [], fresh: [], runes: ['x'] } as unknown as ChunkPlan });
    const k = await Kernel.boot({ files: bundledFiles, store: memoryStore(), ai: new MockAiModels(), chunks });
    await develop(k);
    expect(k.chunks.get('0,0')?.place?.name).toBe('Piazza di prima');
    expect(k.chunks.get('0,0')?.plan?.layout).toBe('village');
  });
});

describe('what the Council still writes in Italian, until its prompts change (T310)', () => {
  const palette = bundledFiles['modules/world.terrain/manifest.json'] ? JSON.parse(bundledFiles['modules/world.terrain/manifest.json']).tiles : {};
  const ctx = { palette, item: (n: string) => (n === 'Pane' ? 'item.pane' : undefined), module: () => undefined, loot: new Set(['cassa']) };

  it('effects: the type and the fields of 0.1 become internal; a terrain by its id, its name or its code', () => {
    const v = validateEffects([{ tipo: 'luce', raggio: 3, durata: 10 }, { tipo: 'terreno', a: 'sentiero', raggio: 1 }, { type: 'terrain', to: 'water', radius: 0 }, { tipo: 'stato', nome: 'A cavallo', velocita: 1.5 }, { tipo: 'crea_oggetto', oggetto: 'Pane', quantita: 2 }], ctx);
    expect(v.dropped).toEqual([]);
    expect(v.effects).toEqual([{ type: 'light', radius: 3, duration: 10 }, { type: 'terrain', to: 'p', radius: 1 }, { type: 'terrain', to: 'w', radius: 0 }, { type: 'state', name: 'a cavallo', duration: 0, speed: 1.5 }, { type: 'create_item', item: 'item.pane', quantity: 2 }]);
    expect(internalEffect({ type: 'light', radius: 1 })).toEqual({ type: 'light', radius: 1 });
  });

  it('a manifest, a panel, the cases, a structure of a plan, a stamp', () => {
    const m = internalManifest({ id: 'x.y', appearance: { classe: 'animale', taglia: 'piccola', model: 'mobile' }, items: [{ category: 'vestiario', model: 'forma-cappello' }] });
    expect(m).toMatchObject({ appearance: { classe: 'animal', taglia: 'small', model: 'furniture' }, items: [{ category: 'clothing', model: 'shape-hat' }] });
    expect(cleanPanel({ titolo: 'P', elementi: [{ tipo: 'barra', campo: 'needs.health' }, { tipo: 'pulsante', id: 'Via' }] }, 'p').panel?.elementi.map((e) => e.tipo)).toEqual(['bar', 'button']);
    const { cases } = cleanCases([{ titolo: 'c', racconto: 'r', passi: [{ tipo: 'attendi', secondi: 1 }, { tipo: 'cammina', verso: 'sinistra', secondi: 1 }], guarda: ['a.b'] }], undefined, 10);
    expect(cases[0].passi).toEqual([{ tipo: 'wait', secondi: 1 }, { tipo: 'walk', verso: 'left', secondi: 1 }]);
    expect(readStructure({ concetto: 'il castello', taglia: 'Enorme' })).toEqual({ concetto: 'il castello', taglia: 'huge' });
    expect(repairProgram({ type: 'stamp', shape: 'castello' })).toEqual({ type: 'stamp', shape: 'castle' });
  });
});

describe('a Latin rune, pronounced', () => {
  it('lux lights, ignis burns; the Italian word is no longer a rune', async () => {
    const k = await boot();
    clearArea(k);
    k.needs()!.mana = 100;
    giveRunes(k, ['lux', 'ignis']);
    expect(k.composeRune('lux')).toBe(true);
    expect(await k.castSpell()).toBe(true);
    expect(k.ecs.query('luce', 'effimero').length).toBe(1);
    expect(k.composeRune('ignis')).toBe(true);
    expect(await k.castSpell()).toBe(true);
    expect(k.ecs.query('fuoco', 'effimero').length).toBe(1);
    expect(countItem(k.inventory(), 'rune:lux')).toBe(0);
    expect(k.content.runes.luce).toBeUndefined();
    expect(Object.keys(k.content.runes).sort()).toEqual(['aqua', 'ignis', 'lux', 'scutum', 'terra', 'ventus', 'vita']);
    expect(k.faults.list().filter((f) => /^(effect|module|rune):/.test(f.key))).toEqual([]);
  });
});

describe('the seed of 0.2', () => {
  it('speaks the internal language in every domain of the step: no Italian value is left where the kernel reads one', () => {
    const bad: string[] = [];
    const walk = (v: unknown, file: string, key?: string): void => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, file, key));
      if (!v || typeof v !== 'object') {
        if (typeof v !== 'string') return;
        if (key === 'classe' && ITALIAN('classi').includes(v)) bad.push(`${file}: classe ${v}`);
        if (key === 'taglia' && ITALIAN('taglie').includes(v)) bad.push(`${file}: taglia ${v}`);
        if (key === 'category' && ITALIAN('categorie').includes(v)) bad.push(`${file}: category ${v}`);
        if (key === 'type' && ITALIAN('effetti').includes(v)) bad.push(`${file}: type ${v}`);
        if (key === 'shape' && ITALIAN('timbri').includes(v)) bad.push(`${file}: shape ${v}`);
        if (key === 'element' && ITALIAN('elementi').includes(v)) bad.push(`${file}: element ${v}`);
        return;
      }
      for (const [k, x] of Object.entries(v)) {
        if (k === 'tipo' && typeof x === 'string' && ITALIAN('effetti').includes(x)) bad.push(`${file}: effetto ${x}`);
        walk(x, file, k);
      }
    };
    for (const [p, text] of Object.entries(bundledFiles)) if (p.endsWith('.json')) walk(JSON.parse(text), p);
    expect(bad).toEqual([]);
    const magic = JSON.parse(bundledFiles['modules/magic.runes/manifest.json']);
    expect(Object.keys(magic.runes)).toEqual(['lux', 'ignis', 'aqua', 'terra', 'vita', 'scutum', 'ventus']);
    expect(json(bundledFiles['universe.json'])).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: '0.2' } });
  });

  it('runs 400 ticks offline without faults', async () => {
    const k = await boot();
    for (let i = 0; i < 400; i++) k.tick(1 / 60);
    expect(k.faults.list().map((f) => `${f.key}: ${f.message}`)).toEqual([]);
  });
});

describe('the four universes of lab/banco/universi-cloud/, ported', () => {
  for (const u of UNIVERSI) {
    it(`${u.nome} opens on this kernel, deterministic, with no fault of the universe, of its modules or of an effect`, async () => {
      const a = leggi(u);
      const b = leggi(u);
      expect(a.files).toEqual(b.files);
      const disk = leggiDisco(u);
      const cfg = json(a.files['universe.json']);
      expect(checkKernelVersion(cfg.kernel, KERNEL_VERSION, cfg.kernels).ok).toBe(true);
      if (u.nome !== 'aurora') {
        expect(json(disk.files['universe.json']).kernel).toMatch(/^0\.1\./);
        // The seed's core.effects it had as the seed had it is the seed's of 0.2.
        expect(a.files['modules/core.effects/logic.lua']).toBe(bundledFiles['modules/core.effects/logic.lua']);
      }
      const k = await Kernel.boot({ files: a.files, store: memoryStore(), ai: new MockAiModels(), chunks: negozioMappe(a.files, a.maps) });
      for (let i = 0; i < 120; i++) k.tick(1 / 60);
      expect(k.faults.list().filter((f) => /^(universe|kernel|effect|module):/.test(f.key)).map((f) => `${f.key}: ${f.message}`)).toEqual([]);
      for (const rec of Object.values(a.maps)) expect(k.content.layouts[rec.plan.layout], `${u.nome}: ${rec.plan.layout}`).toBeDefined();
    }, 120_000);
  }
});

/** A universe really played, read and never written: universes/valmora (22nd of October) on this machine, if it is there. */
const VALMORA = [path.resolve(__dirname, '../universes/valmora'), path.resolve(__dirname, '../../../../universes/valmora')].find((p) => existsSync(path.join(p, 'universe.json')));

function readUniverse(root: string): { files: FileMap; maps: Record<string, { plan: ChunkPlan }> } {
  const files: FileMap = {};
  const walk = (rel: string) => {
    for (const name of readdirSync(path.join(root, rel))) {
      const p = rel ? `${rel}/${name}` : name;
      if (name === '.git' || p === 'assets' || p === 'maps') continue;
      if (statSync(path.join(root, p)).isDirectory()) walk(p);
      else files[p] = readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
    }
  };
  walk('');
  const maps = Object.fromEntries(readdirSync(path.join(root, 'maps')).map((m) => [m.replace(/\.json$/, ''), JSON.parse(readFileSync(path.join(root, 'maps', m), 'utf8'))]));
  return { files, maps };
}

describe('valmora, a universe really played of the contract 0.1', () => {
  it.skipIf(!VALMORA)('opens ported, the same twice, its magic in Latin, without faults of the universe', async () => {
    const { files, maps } = readUniverse(VALMORA!);
    const a = prepareUniverse(files, bundledFiles);
    const b = prepareUniverse(files, bundledFiles);
    expect(a.files).toEqual(b.files);
    expect(a.applied).toHaveLength(1);
    const runes = Object.keys(json(a.files['modules/magic.runes/manifest.json']).runes ?? {});
    expect(runes.filter((t) => ITALIAN('rune').includes(t))).toEqual([]);
    const chunks = new MemoryChunks();
    const prefix = Object.keys(maps)[0]?.split('_').slice(0, 3).join(':');
    for (const [name, rec] of Object.entries(maps)) {
      const [cx, cy] = name.split('_').slice(-2);
      await chunks.save(`${prefix}:${cx},${cy}`, rec);
    }
    const k = await Kernel.boot({ files: a.files, store: memoryStore(), ai: new MockAiModels(), chunks });
    for (let i = 0; i < 120; i++) k.tick(1 / 60);
    expect(k.faults.list().filter((f) => /^(universe|kernel|effect):/.test(f.key)).map((f) => `${f.key}: ${f.message}`)).toEqual([]);
    expect(seedHashes(bundledFiles)['universe.json']).toBeTruthy();
  }, 120_000);
});
