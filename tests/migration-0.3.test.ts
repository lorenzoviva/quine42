// The migration 0.2 → 0.3 (T307b, ADR-0153, ADR-0158): the internal language of society, work and the Council. A universe of 0.2 opens
// ported, the same files giving the same files: the seed's modules the kernel names and their stores, the prompts of the agents, the
// seed's sound programs and the gerboas change name with what they name; people, plots, ventures, programs of the trades, sounds,
// parts, cards, graph, shortfalls and universe.json change value field by field; the plans are ported as they are read; what the
// Council still writes in Italian is repaired; the seed runs 400 ticks offline without faults, and its people do their trades.
// The chain goes on to 0.4 (T308a, the fields and the paths): what is checked here is the step to 0.3, so the chain stops there
// (`TO_0_3`); the readers of today read the fields of 0.4.

import { describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { INTERNAL_NAMES, internalAnswer, internalCardId, internalJobProgram, internalModelId0_3 } from '../src/kernel/internalNames';
import { luaFor0_3, migratePlanRecord, migrateUniverse, MIGRATIONS } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE } from '../src/kernel/universes';
import { checkKernelVersion, KERNEL_VERSION } from '../src/kernel/version';
import { hashStr, hex } from '../src/kernel/rng';
import { readPeople } from '../src/kernel/npc/society';
import { plotFromRaw, readPlots } from '../src/kernel/npc/plots';
import { readVenture } from '../src/kernel/npc/ventures';
import { readShortfalls } from '../src/kernel/shortfalls';
import { soundPrograms } from '../src/mj/sound';
import { compileMjx } from '../src/mj/model';
import { repairGameSetup } from '../src/kernel/validator';
import { isMultiplayer } from '../src/kernel/gameSetup';
import { repairCoefficients } from '../src/kernel/coefficients';
import { repairMinimums } from '../src/kernel/universe';
import { validateJobProgram } from '../src/kernel/npc/jobs';
import { purposeOf } from '../src/kernel/agents/composer';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { FileMap } from '../src/kernel/types';
import { boot } from './world';

const h = (s: string) => hex(hashStr(s));
const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const ITALIAN = (id: string) => Object.entries(INTERNAL_NAMES.find((d) => d.id === id)!.names).filter(([it, en]) => it !== en).map(([it]) => it);
const write = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
/** The kernel of the contract 0.3: the chain of these tests stops there. */
const TO_0_3 = '0.3.0';
const PLANS_0_3 = MIGRATIONS.slice(0, 2);

/** The seed's sys.lavoro of 0.2, as a universe kept it: the seed's own (its hash is in seed.json). */
const OLD_WORK_MANIFEST = write({ id: 'sys.lavoro', name: 'Il lavoro', kind: 'system', logic: 'logic.lua', order: 28 });
const OLD_WORK_LUA = 'local M = {}\nfunction M.update() ecs.set(1, "attivita", { tipo = "lavora", ferma = true }) end\nreturn M\n';

/** A small universe of the contract 0.2, as the Council and the seed of then wrote it. */
function universe02(): FileMap {
  const files: FileMap = {
    'universe.json': write({
      name: 'vecchio', kernel: '0.2.1', kernels: { from: '0.2' }, seed: 7,
      partita: { modalita: 'multigiocatore', morte: 3, master: 'io' },
      ai: { textModel: 'gemini-3.1-flash-lite', scultori: { semplice: 'gemini-3.1-flash-lite', figura: 'gemini-3.8-flash', importanteFino: '2026-12-01' }, coefficienti: { trame: 0.5, vite: 1, cose: 0.25 }, agenti: { narratore: 'claude' }, minimi: { scultori: { struttura: 'gemini-3.8-flash' }, coefficienti: { dialoghi: 0.5 } } },
    }),
    'modules/sys.lavoro/manifest.json': OLD_WORK_MANIFEST,
    'modules/sys.lavoro/logic.lua': OLD_WORK_LUA,
    'modules/lavoro.contadino/manifest.json': write({
      id: 'lavoro.contadino', name: 'Il contadino', kind: 'data',
      mestieri: [{ id: 'contadino', nomi: ['contadino'], posto: { casella: 'm' }, giornata: { mattina: [{ fa: 'vai', dove: 'lavoro' }, { fa: 'trasforma', da: 'g', a: 'm', posa: 'zappa' }], giorno: [{ fa: 'porta', oggetto: 'item.grano', a: 'piazza' }], sera: [{ fa: 'pattuglia', percorso: ['piazza', 'casa'] }], notte: [{ fa: 'riposa' }] } }],
    }),
    'modules/obj.letto/manifest.json': write({ id: 'obj.letto', name: 'Letto', kind: 'entity', origin: 'esempio', appearance: { model: 'letto' } }),
    'modules/npc.oste/manifest.json': write({ id: 'npc.oste', name: 'Oste', kind: 'entity', origin: 'agente', logic: 'logic.lua', appearance: { model: 'corona-gerboa-narratore' }, carta: { autore: 'narratore', pagante: 'io', titolare: 'io', task: 'forge.concept' } }),
    'modules/npc.oste/logic.lua': [
      '-- "dorme" nel commento resta',
      'local M = {}',
      'function M.on_act(id, user, action)',
      '  ecs.set(id, "attivita", { tipo = "dorme", ferma = true })',
      '  local letto = world.nearest(0, 0, 4, "obj.letto")',
      '  if action == "dorme" then return "no" end',
      'end',
      'return M',
      '',
    ].join('\n'),
    'models/index.json': JSON.stringify({ 'suono-musica-pietra': { classe: 'suono', suono: { uso: 'musica', ambienti: ['castle'], momenti: ['mattina', 'giorno'] } }, 'suono-effetto-runa': { classe: 'suono', suono: { uso: 'effetto', effetti: ['runa', 'allarme-sirena'] } }, 'corona-gerboa-narratore': { classe: 'person' }, 'suono-x-mio': { classe: 'suono', suono: { uso: 'musica' } } }, null, 1) + '\n',
    'models/suono-musica-pietra.xml': '<sequence values="BG"><box at="1 1"/></sequence>\n',
    'models/suono-effetto-runa.xml': '<sequence values="BG"><box at="1 1"/></sequence>\n',
    'models/suono-x-mio.xml': '<sequence values="BG"><box at="1 1"/></sequence>\n',
    'models/corona-gerboa-narratore.xml': '<sequence values="BG"><color symbol="G" value="88cc88" part="testa"/><color symbol="L" value="884422" part="gamba"/><box at="1 1"/></sequence>\n',
    'prompts/agents/narratore.md': 'Sei il Narratore.\n',
    'prompts/agents/mio.md': 'mio\n',
    'world/magazzino/sys.lavoro.json': write({ 'deposito:0:0': { 'item.grano': 3 } }),
    'world/people.json': write({
      persone: [{ nome: 'Ada', specie: 'persona', genere: 'femmina', tipo: 'npc.villager', mestiere: 'contadina', famiglia: [{ nome: 'Viandante', legame: 'amica', viandante: 'io' }], routine: [{ quando: 'mattina', fa: 'ara', dove: 'lavoro', azione: 'zappa' }, { quando: 'notte', fa: 'dorme', dove: 'casa', azione: 'dorme' }] }],
      attesi: [],
    }),
    'world/plots.json': write({ trame: [{ id: 't1', titolo: 'T', mistero: 'm', coinvolti: ['Ada'], tappe: [{ giorno: 0, momento: 'sera', chi: 'Ada', dove: 'piazza', cosa: 'aspetta' }], inizio: 0, stato: 'attiva', missione: { da: 'Ada', testo: 'porta', obiettivo: { tipo: 'porta', oggetto: 'Mela', a: 'Ada' }, stato: 'accettata', viandante: 'io' } }] }),
    'world/imprese.json': write({ imprese: [{ id: 'i1', titolo: 'R', tipo: 'raccolto', stato: 'in corso', luogo: '0,0', posto: { x: 1, y: 1 }, fasi: [{ nome: 'f', materiali: {}, lavoro: 1, stadio: 1 }], ruoli: [{ ruolo: 'mietitore', mestiere: 'contadino', quanti: 1 }, { ruolo: 'manovale', mestiere: 'qualunque', quanti: 1 }], portati: {}, lavorato: 0, squadra: [], inizio: 0, ultimo: 0, nato_da: 'regola:raccolto', compito: { casella: 'u', oggetto: 'item.grano', lascia: 'm', durata: 8, posa: 'zappa' } }] }),
    'world/carte.json': JSON.stringify({ utilizzi: { 'modello:tree': { luoghi: 1, trame: 0, prompt: 2 }, 'persona:ada': { luoghi: 0, trame: 1, prompt: 0 }, 'luogo:0_0': { luoghi: 0, trame: 0, prompt: 1 } }, luoghi: { '0,0': { nome: 'Qui', autore: 'cartografo', pagante: 'io', titolare: 'io' } } }, null, 1) + '\n',
    'world/mancanze.json': JSON.stringify({ voci: [{ richiesta: 'una spada', chi: ['io'], agente: 'narratore', compito: 'action.judge', esito: 'rifiuto', motivo: 'no', volte: 1, primo: '2026-11-01', ultimo: '2026-11-01' }] }, null, 1) + '\n',
    'world/grafo.json': JSON.stringify({ directed: true, multigraph: true, graph: { schema_version: 1, nome: 'vecchio', hash: 'x' }, nodes: [{ id: 'luogo:0_0', label: 'Qui', tipo: 'luogo', source_file: 'maps/', cx: 0, cy: 0 }, { id: 'persona:ada', label: 'Ada', tipo: 'persona', source_file: 'world/people.json' }], links: [{ source: 'persona:ada', target: 'luogo:0_0', relation: 'abita', confidence: 'EXTRACTED', source_file: 'world/people.json' }] }, null, 1) + '\n',
    'world/stato.json': write({ contenitori: { k: { inv: { slots: [{ item: 'item.forbici', count: 1 }] } } } }),
  };
  files[SEED_FILE] = JSON.stringify({ 'modules/sys.lavoro/manifest.json': h(OLD_WORK_MANIFEST), 'modules/sys.lavoro/logic.lua': h(OLD_WORK_LUA), 'prompts/agents/narratore.md': h('Sei il Narratore.\n') }, null, 1) + '\n';
  return files;
}

describe('the migration 0.2 → 0.3: a universe of 0.2, file by file', () => {
  const before = universe02();
  const { files, applied } = migrateUniverse(before, TO_0_3);

  it('is the second migration of the chain, and it says what it does', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`)).toEqual(['0.1→0.2', '0.2→0.3', '0.3→0.4', '0.4→0.5', '0.5→0.6', '0.6→0.7']);
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatch(/^0\.2→0\.3: /);
    expect(json(files['universe.json'])).toMatchObject({ kernel: TO_0_3, kernels: { from: '0.3' } });
    expect(checkKernelVersion(json(files['universe.json']).kernel, TO_0_3, json(files['universe.json']).kernels).ok).toBe(true);
    expect(migrateUniverse(before).applied.map((a) => a.slice(0, 8))).toEqual(['0.2→0.3:', '0.3→0.4:', '0.4→0.5:', '0.5→0.6:', '0.6→0.7:']);
  });

  it('is deterministic: the same files give the same files, and a ported universe stays as it is', () => {
    expect(migrateUniverse(universe02(), TO_0_3).files).toEqual(files);
    expect(migrateUniverse(files, TO_0_3).applied).toEqual([]);
  });

  it('moves the seed\'s modules, their store, the prompts of the agents and the models the kernel names', () => {
    const paths = Object.keys(files);
    expect(paths).toContain('modules/sys.work/manifest.json');
    expect(paths).toContain('modules/job.farmer/manifest.json');
    expect(paths).toContain('modules/obj.bed/manifest.json');
    expect(paths).toContain('world/magazzino/sys.work.json');
    expect(paths).toContain('prompts/agents/narrator.md');
    expect(paths).toContain('prompts/agents/mio.md');
    expect(paths.filter((p) => p.startsWith('models/')).sort()).toEqual(['models/corona-gerboa-narrator.xml', 'models/index.json', 'models/sound-effect-rune.xml', 'models/sound-music-stone.xml', 'models/suono-x-mio.xml']);
    expect(paths.filter((p) => /sys\.lavoro|lavoro\.|obj\.letto|narratore\.md/.test(p))).toEqual([]);
    expect(json(files['modules/sys.work/manifest.json']).id).toBe('sys.work');
    expect(json(files['modules/obj.bed/manifest.json']).id).toBe('obj.bed');
  });

  it('ports the programs of the trades: id, moments, behaviours, places, poses', () => {
    const job = json(files['modules/job.farmer/manifest.json']).mestieri[0];
    expect(job.id).toBe('farmer');
    expect(Object.keys(job.giornata)).toEqual(['morning', 'day', 'evening', 'night']);
    expect(job.giornata.morning).toEqual([{ fa: 'go', dove: 'work' }, { fa: 'transform', da: 'g', a: 'm', posa: 'hoe' }]);
    expect(job.giornata.day).toEqual([{ fa: 'carry', oggetto: 'item.grano', a: 'square' }]);
    expect(job.giornata.evening).toEqual([{ fa: 'patrol', percorso: ['square', 'home'] }]);
    expect(job.giornata.night).toEqual([{ fa: 'rest' }]);
    expect(internalJobProgram(job)).toEqual(job);
  });

  it('ports people, plots, ventures, shortfalls; the wanderer of single play keeps its id (T308a)', () => {
    const ada = json(files['world/people.json']).persone[0];
    expect(ada).toMatchObject({ specie: 'person', genere: 'female', routine: [{ quando: 'morning', dove: 'work', azione: 'hoe' }, { quando: 'night', dove: 'home', azione: 'sleep' }] });
    expect(ada.famiglia[0].viandante).toBe('io');
    const plot = json(files['world/plots.json']).trame[0];
    expect(plot).toMatchObject({ stato: 'active', tappe: [{ momento: 'evening', dove: 'square' }], missione: { stato: 'accepted', obiettivo: { tipo: 'bring' }, viandante: 'io' } });
    const v = json(files['world/imprese.json']).imprese[0];
    expect(v).toMatchObject({ tipo: 'harvest', stato: 'active', ruoli: [{ mestiere: 'farmer' }, { mestiere: 'any' }], compito: { posa: 'hoe' }, nato_da: 'regola:raccolto' });
    expect(json(files['world/mancanze.json']).voci[0]).toMatchObject({ agente: 'narrator', esito: 'refusal', chi: ['io'] });
    expect(json(files['world/stato.json']).contenitori.k.inv.slots[0].item).toBe('item.scissors');
  });

  it('ports the sounds, the parts, the cards and the graph', () => {
    const index = json(files['models/index.json']);
    expect(Object.keys(index)).toEqual(['sound-music-stone', 'sound-effect-rune', 'corona-gerboa-narrator', 'suono-x-mio']);
    expect(index['sound-music-stone'].suono).toEqual({ uso: 'music', ambienti: ['castle'], momenti: ['morning', 'day'] });
    expect(index['sound-effect-rune'].suono).toEqual({ uso: 'effect', effetti: ['rune', 'allarme-sirena'] });
    expect(files['models/corona-gerboa-narrator.xml']).toContain('part="head"');
    expect(files['models/corona-gerboa-narrator.xml']).toContain('part="leg"');
    const cards = json(files['world/carte.json']);
    expect(Object.keys(cards.utilizzi)).toEqual(['model:tree', 'individual:ada', 'chunk:0_0']);
    expect(cards.luoghi['0,0'].autore).toBe('cartographer');
    const g = json(files['world/grafo.json']);
    expect(g.nodes.map((n: { id: string; tipo: string }) => `${n.tipo} ${n.id}`)).toEqual(['chunk chunk:0_0', 'individual individual:ada']);
    expect(g.links[0]).toMatchObject({ source: 'individual:ada', target: 'chunk:0_0', relation: 'abita' });
    expect(json(files['modules/npc.oste/manifest.json'])).toMatchObject({ appearance: { model: 'corona-gerboa-narrator' }, carta: { autore: 'narrator', pagante: 'io' } });
  });

  it('ports universe.json: the Sculptor\'s classes, the coefficients, the agents, the minimums, the mode', () => {
    const cfg = json(files['universe.json']);
    expect(cfg.ai.scultori).toEqual({ simple: 'gemini-3.1-flash-lite', figure: 'gemini-3.8-flash', importanteFino: '2026-12-01' });
    expect(cfg.ai.coefficienti).toEqual({ plots: 0.5, lives: 1, entities: 0.25 });
    expect(cfg.ai.agenti).toEqual({ narrator: 'claude' });
    expect(cfg.ai.minimi).toEqual({ scultori: { structure: 'gemini-3.8-flash' }, coefficienti: { dialogues: 0.5 } });
    expect(cfg.partita).toEqual({ modalita: 'multiplayer', morte: 3, master: 'io' });
  });

  it('ports the Lua of the Council\'s modules only where the kernel reads a value; the seed\'s takes the seed of 0.3', () => {
    const lua = files['modules/npc.oste/logic.lua'];
    expect(lua).toContain('-- "dorme" nel commento resta');
    expect(lua).toContain('ecs.set(id, "attivita", { tipo = "sleep", ferma = true })');
    expect(lua).toContain('world.nearest(0, 0, 4, "obj.bed")');
    expect(lua).toContain('if action == "dorme" then');
    expect(luaFor0_3(lua)).toBe(lua);
    // The seed's sys.lavoro, kept as the seed had it, is the seed's under its new name: the seed of 0.3 replaces it.
    const seed = json(files[SEED_FILE]);
    expect(seed['modules/sys.work/logic.lua']).toBe(h(files['modules/sys.work/logic.lua']));
    const out = prepareUniverse(universe02(), bundledFiles);
    expect(out.files['modules/sys.work/logic.lua']).toBe(bundledFiles['modules/sys.work/logic.lua']);
    expect(out.files['modules/sys.work/manifest.json']).toBe(bundledFiles['modules/sys.work/manifest.json']);
    expect(out.files['prompts/agents/narrator.md']).toBe(bundledFiles['prompts/agents/narrator.md']);
  });

  it('a universe that has the new path already keeps the new one', () => {
    const u = universe02();
    u['prompts/agents/narrator.md'] = 'il mio narratore\n';
    const out = migrateUniverse(u, TO_0_3).files;
    expect(out['prompts/agents/narrator.md']).toBe('il mio narratore\n');
    expect(out['prompts/agents/narratore.md']).toBeUndefined();
  });

  it('a universe of 0.1 makes the whole chain', () => {
    const u = universe02();
    u['universe.json'] = write({ ...json(u['universe.json']), kernel: '0.1.9', kernels: { from: '0.1' } });
    const out = migrateUniverse(u, TO_0_3);
    expect(out.applied.map((a) => a.slice(0, 8))).toEqual(['0.1→0.2:', '0.2→0.3:']);
    expect(json(out.files['universe.json']).kernels).toEqual({ from: '0.3' });
  });
});

describe('the plans of the places, as the kernel reads them', () => {
  const plan = { place: { name: 'Qui', description: 'qui' }, layout: 'village', objects: [{ module: 'obj.letto', x: 1, y: 1 }, { module: 'obj.banco-officina', x: 2, y: 2 }, { module: 'npc.villager', x: 3, y: 3 }], ground: [], fresh: [], runes: [] } as unknown as ChunkPlan;

  it('the seed\'s modules of their things by their internal ids, idempotently; a module of the Council stays', () => {
    const rec = migratePlanRecord({ plan }, PLANS_0_3);
    expect(rec.plan.objects.map((o) => o.module)).toEqual(['obj.bed', 'obj.banco-officina', 'npc.villager']);
    expect(migratePlanRecord(rec, PLANS_0_3)).toBe(rec);
  });
});

describe('what the Council still writes in Italian, until its prompts change (T310)', () => {
  it('people and plots read internal (and with the fields of 0.4, T308a); a plot of the Narrator too', () => {
    const files = universe02();
    expect(readPeople(files).people[0]).toMatchObject({ species: 'person', gender: 'female', routine: [{ when: 'morning', where: 'work', activity: 'hoe' }, { when: 'night', where: 'home', activity: 'sleep' }] });
    expect(readPlots(files)[0]).toMatchObject({ state: 'active', quest: { state: 'accepted', goal: { type: 'bring' } } });
    // The Narrator's answer with the fields of before reaches plotFromRaw through Council.ask (internalAnswer, T310b).
    const p = plotFromRaw(internalAnswer({ titolo: 'T', tappe: [{ chi: 'Ada', giorno: 1, momento: 'notte', dove: 'piazza', cosa: 'x' }], missione: { da: 'Ada', tipo: 'parla', a: 'Bruno' } }), 0, 't');
    expect(p).toMatchObject({ state: 'active', beats: [{ moment: 'night', where: 'square' }], quest: { state: 'offered', goal: { type: 'talk' } } });
  });

  it('a venture, a shortfall, a sound, a program of a trade, a part of a program', () => {
    expect(readVenture(json(universe02()['world/imprese.json']).imprese[0])).toMatchObject({ type: 'harvest', state: 'active', roles: [{ job: 'farmer' }, { job: 'any' }] });
    expect(readShortfalls(universe02()['world/mancanze.json'])[0]).toMatchObject({ outcome: 'refusal' });
    expect(soundPrograms(universe02()).map((p) => p.sound?.use)).toEqual(['music', 'effect', 'music']);
    const world = { codes: new Set(['g', 'm']), items: new Set(['item.grano']) };
    const raw = json(universe02()['modules/lavoro.contadino/manifest.json']).mestieri[0];
    // Read with the moments of 0.2 the day is empty: no task of it runs.
    expect(Object.values(validateJobProgram(raw, world).program!.day).flat()).toEqual([]);
    expect(validateJobProgram(internalJobProgram(raw), world).errors).toEqual([]);
    const model = compileMjx('<sequence values="BG" size="3 3 3"><color symbol="G" value="88cc88" part="gamba"/><one in="B" out="G" steps="1"/></sequence>');
    expect(model.program.palette.G?.part).toBe('leg');
  });

  it('the mode, the coefficients, the minimums; the server reads a game of many not ported yet as a game of many', () => {
    expect(repairGameSetup({ modalita: 'multigiocatore', master: 'io' })).toMatchObject({ mode: 'multiplayer', master: 'me' });
    expect(repairGameSetup({ modalita: 'singola' }).mode).toBe('single');
    expect(isMultiplayer('multigiocatore')).toBe(true);
    expect(isMultiplayer('multiplayer')).toBe(true);
    expect(isMultiplayer('singola')).toBe(false);
    expect(repairCoefficients({ trame: 0.5, vite: 1 })).toMatchObject({ plots: 0.5, lives: 1 });
    expect(repairMinimums({ scultori: { struttura: 'gemini-3.8-flash' }, coefficienti: { dialoghi: 0.5 } })).toEqual({ sculptors: { structure: 'gemini-3.8-flash' }, coefficients: { dialogues: 0.5 } });
  });

  it('the Musician\'s answer: its use and its moments', () => {
    const r = purposeOf({ use: 'musica', environments: ['castle'], moments: ['sera', 'notte'] }, { richiesta: 'x' }, { ambienti: ['castle'], effetti: ['rune'] });
    expect(r.suono).toEqual({ use: 'music', environments: ['castle'], moments: ['evening', 'night'] });
    expect(purposeOf({ use: 'effetto', effect: 'rune' }, { richiesta: 'x' }, { ambienti: ['castle'], effetti: ['rune'] }).suono).toEqual({ use: 'effect', effects: ['rune'] });
  });

  it('the ids of the cards and of the models', () => {
    expect(internalCardId('modello:albero')).toBe('model:albero');
    expect(internalCardId('tipo:npc-fabbro')).toBe('kind:npc-fabbro');
    expect(internalCardId('chunk:0_0')).toBe('chunk:0_0');
    expect(internalModelId0_3('suono-musica-selva')).toBe('sound-music-woods');
    expect(internalModelId0_3('corona-gerboa-referente')).toBe('corona-gerboa-liaison');
    expect(internalModelId0_3('corona-gerboa')).toBe('corona-gerboa');
    expect(internalModelId0_3('suono-x-mio')).toBe('suono-x-mio');
  });
});

describe('the seed of today (0.4: the values of 0.3 under the fields of 0.4)', () => {
  it('speaks the internal language in every domain of the step where the kernel reads a value', () => {
    const bad: string[] = [];
    for (const [p, text] of Object.entries(bundledFiles)) {
      if (/(^|\/)(sys\.lavoro|lavoro\.[a-z]+|obj\.(letto|cassa|banco|credenza)|item\.forbici)\//.test(p) || /suono-|corona-gerboa-(narratore|cartografo|artista|scultore|fisico|ingegnere|arbitro|referente|attore|musicista)\b|prompts\/agents\/(narratore|cartografo|artista|scultore|fisico|ingegnere|arbitro|referente|attore|musicista)\.md/.test(p)) bad.push(`percorso ${p}`);
      if (p.endsWith('.xml')) for (const m of text.matchAll(/part="([^"]+)"/g)) if (ITALIAN('parti').includes(m[1])) bad.push(`${p}: part ${m[1]}`);
      if (!p.endsWith('.json')) continue;
      const walk = (v: unknown, key?: string): void => {
        if (Array.isArray(v)) return v.forEach((x) => walk(x, key));
        if (typeof v === 'string') {
          if (key === 'does' && ITALIAN('comportamenti').includes(v)) bad.push(`${p}: does ${v}`);
          if (key === 'pose' && ITALIAN('attivita').includes(v)) bad.push(`${p}: pose ${v}`);
          if ((key === 'where' || key === 'route') && ITALIAN('dove').includes(v)) bad.push(`${p}: where ${v}`);
          if (key === 'use' && ITALIAN('suoni').includes(v)) bad.push(`${p}: use ${v}`);
          if (key === 'moments' && ITALIAN('momenti').includes(v)) bad.push(`${p}: moment ${v}`);
          if (key === 'mode' && ITALIAN('partita').includes(v)) bad.push(`${p}: mode ${v}`);
          return;
        }
        if (!v || typeof v !== 'object') return;
        for (const [k, x] of Object.entries(v)) {
          if (key === 'day' && ITALIAN('momenti').includes(k)) bad.push(`${p}: day ${k}`);
          walk(x, k);
        }
      };
      walk(JSON.parse(text));
    }
    expect(bad).toEqual([]);
    expect(json(bundledFiles['universe.json'])).toMatchObject({ kernel: KERNEL_VERSION, kernels: { from: '0.7' } });
  });

  it('sys.work says its outcomes in English, and the cases of the bench still point at its lines', () => {
    const lua = bundledFiles['modules/sys.work/logic.lua'];
    expect(lua).not.toMatch(/"(finito|continua)"|fallito:/);
    expect(lua).toContain('"failed:no_way"');
    const lines = lua.split('\n');
    for (const c of json(bundledFiles['modules/sys.work/manifest.json']).cases) for (const n of c.lines as number[]) expect(n, `${c.title}: riga ${n}`).toBeLessThanOrEqual(lines.length);
    // The same lines as before the rename: the cases of the bench cite them by number.
    expect(lines.length).toBe(366);
  });

  it('runs 400 ticks offline without faults, and its people with a trade are at work', async () => {
    const k = await boot();
    for (let i = 0; i < 400; i++) k.tick(1 / 60);
    expect(k.faults.list().map((f) => `${f.key}: ${f.message}`)).toEqual([]);
    const programs = k.jobPrograms().map((p) => p.id).sort();
    expect(programs).toEqual(['clerk', 'cook', 'farmer', 'fisher', 'guard', 'innkeeper', 'merchant', 'priest', 'scribe', 'shepherd', 'smith', 'woodcutter']);
    expect(programs.every((id) => /^[a-z]+$/.test(id))).toBe(true);
  });
});
