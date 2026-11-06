// The migration 0.3 → 0.4 (T308a, ADR-0153, ADR-0159): the fields and the paths of the universe's files. A universe of 0.3 — also one
// born in a game of many, with its players, its cards and its payers — opens ported, the same files giving the same files: every field
// of the table file by file and object by object, the cards' stamps wherever they are, the wanderer alone (`io` → `me`, also the name
// of their file), the paths of the world, the attribute `suolo` of the programs; the plans are ported as they are read; the state of
// before T245a goes where it goes; what the Council still writes with the Italian fields of its schemas is read with those of 0.4; the
// server's folders beside the universes take their English names, the old one moved the first time it is asked for.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { bundledFiles } from '../src/kernel/bundle';
import { internalFields, internalPath } from '../src/kernel/internalNames';
import { migratePlanRecord, migrateUniverse, MIGRATIONS, pathsBefore, portedFiles } from '../src/kernel/migrations';
import { prepareUniverse, SEED_FILE } from '../src/kernel/universes';
import { checkKernelVersion } from '../src/kernel/version';
import { hashStr, hex } from '../src/kernel/rng';
import { readPeople } from '../src/kernel/society';
import { readPlots } from '../src/kernel/plots';
import { readVentures } from '../src/kernel/ventures';
import { readShortfalls } from '../src/kernel/shortfalls';
import { readCards } from '../src/kernel/cards';
import { readWandererState, SOLO } from '../src/kernel/wanderers';
import { readConfig } from '../src/kernel/universe';
import { readAtlas } from '../src/kernel/atlas';
import { readBible } from '../src/kernel/agents/council';
import { validateJobProgram } from '../src/kernel/jobs';
import { compileMjx } from '../src/mj/model';
import { serverName, serverPath } from '../server/folders';
import { ledgerOf } from '../server/ledger';
import { gameIn } from '../server/access';
import type { ChunkPlan } from '../src/kernel/agents/cartography';
import type { FileMap } from '../src/kernel/types';
import { boot } from './world';

/** The kernel of the contract 0.4: the chain stops there. */
const TO_0_4 = '0.4.0';
const json = (s: string | undefined) => JSON.parse(s ?? 'null');
const write = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const h = (s: string) => hex(hashStr(s));
const card = (autore: string, pagante: string, titolare: string) => ({ autore, pagante, titolare });

/** A universe of the contract 0.3 born in a game of many: its master `io`, the wanderers `io` and `anna`, as the kernel of 0.3 saved it. */
function universe03(): FileMap {
  const files: FileMap = {
    'universe.json': write({
      name: 'vecchio', kernel: '0.3.4', kernels: { from: '0.3' }, seed: 7,
      partita: { modalita: 'multiplayer', morte: 2, pvp: false, altroTraGiocatori: true, master: 'io' },
      rilievo: { mare: 1 }, eredita: { base: 0.1, copia: 0.4 },
      ai: { textModel: 'gemini-3.1-flash-lite', scultori: { simple: 'gemini-3.1-flash-lite' }, agenti: { narrator: 'claude' }, coefficienti: { plots: 0.5 }, minimi: { tetto: 2, scultori: { structure: 'gemini-3.8-flash' } }, attore: { acceso: true, modello: 'gemini-3.8-flash' }, maxBrani: 3 },
    }),
    'modules/npc.oste/manifest.json': write({
      id: 'npc.oste', name: 'Oste', kind: 'entity', origin: 'agente',
      appearance: { glyph: 'o', color: '#aa8844', model: 'person', aspetto: 'grembiule sporco', classe: 'person', taglia: 'medium' },
      carta: { ...card('narrator', 'io', 'io'), origini: [{ titolare: 'bruno', universo: 'prima', impronta: [1, 2] }] },
    }),
    'modules/mech.equip/manifest.json': write({
      id: 'mech.equip', name: 'Equipaggiamento', kind: 'system', logic: 'logic.lua',
      ui: { id: 'equip', titolo: 'Equip', descrizione: 'ciò che porti', elementi: [{ tipo: 'slot', id: 'testa', etichetta: 'Testa', accetta: ['elmo'] }, { tipo: 'bar', campo: 'difesa.valore', colore: '#ff0000' }] },
      casi: [{ titolo: 'Un elmo', racconto: 'si mette', viandante: { componenti: { needs: { health: 10 } }, oggetti: [{ nome: 'Elmo', posto: 'testa', categoria: 'clothing' }] }, cose: [{ modulo: 'obj.chest', x: 1, y: 0, componenti: { luce: { raggio: 2 } } }], passi: [{ tipo: 'slot', slot: 'testa', oggetto: 'Elmo' }, { tipo: 'wait', secondi: 1 }, { tipo: 'walk', verso: 'up', secondi: 1 }], durata: 3, guarda: ['difesa.valore'], righe: [2] }],
    }),
    'modules/mech.equip/logic.lua': 'local M = {}\nfunction M.update() end\nreturn M\n',
    'modules/job.vasaio/manifest.json': write({
      id: 'job.vasaio', name: 'Il vasaio', kind: 'data',
      mestieri: [{ id: 'vasaio', nomi: ['vasaio'], posto: { casella: 'm' }, giornata: { morning: [{ fa: 'go', dove: 'casella:m' }, { fa: 'gather', casella: 'g', lascia: 'm', oggetto: 'item.grano', quante: 2, durata: 8, posa: 'hoe', dice: 'Si comincia.' }], day: [{ fa: 'carry', oggetto: 'item.grano', a: 'entita:forno' }, { fa: 'use', dove: 'entita:forno', azione: 'cuoci' }], evening: [{ fa: 'patrol', percorso: ['square', 'casella:m'] }], night: [{ fa: 'rest' }] } }],
    }),
    'modules/world.terrain/manifest.json': write({ id: 'world.terrain', name: 'Terreno', kind: 'generator', tiles: { g: { id: 'meadow', name: 'prato', color: '#00aa00', solid: false }, m: { id: 'field', name: 'campo', color: '#aa8800', solid: false, matura: { dopo: 3, in: 'u' } } } }),
    'models/index.json': write({
      person: { classe: 'person', nome: 'Persona', autore: 'a mano' },
      'struttura-forno': { classe: 'structure', taglia: 'huge', sotto: 1, voto: 8, consigli: ['bene'], problemi: [], tinta: 'C', tempo: 4, carta: card('sculptor', 'comune', 'anna') },
      'sound-music-stone': { classe: 'suono', nome: 'Pietra', suono: { uso: 'music', ambienti: ['castle'], momenti: ['morning'], oltre: true } },
    }),
    'models/struttura-forno.xml': '<sequence values="BEX" size="9 9 9" suolo="E" ground="X"><one in="B" out="E" steps="1"/></sequence>\n',
    'models/person.xml': '<sequence values="BG" size="3 3 3"><one in="B" out="G" steps="1"/></sequence>\n',
    'world/people.json': write({
      persone: [
        { nome: 'Ada', specie: 'person', genere: 'female', tipo: 'npc.villager', mestiere: 'fornaia', eta: 'adulta', storia: 's', luogo: 'Piazza', origine: '0,0#o0', aspetto: 'a', porta: ['pane'], persona: 'Sei Ada.',
          famiglia: [{ nome: 'Viandante', legame: 'amica', viandante: 'io' }, { nome: 'Bruno', legame: 'sorella' }],
          routine: [{ quando: 'morning', fa: 'impasta', dove: 'work', azione: 'cook' }],
          ricordi: [{ quando: 'giorno 1', testo: 'ha aiutato', con: 'Viandante', viandante: 'io', peso: 2 }],
          scheda: { testo: 'Sei Ada.', impronta: 'x1' }, carta: card('narrator', 'io', 'io') },
      ],
      attesi: [{ nome: 'Nessuno', legame: 'fratello', di: 'Ada' }],
    }),
    'world/plots.json': write({ trame: [{ id: 't1', titolo: 'Il pane', mistero: 'm', coinvolti: ['Ada'], tappe: [{ giorno: 0, momento: 'day', chi: 'Ada', dove: 'square', cosa: 'aspetta', battuta: 'Eccoti.', indizio: 'farina', fatto: false }], inizio: 2, stato: 'active', missione: { da: 'Ada', testo: 'porta', obiettivo: { tipo: 'bring', oggetto: 'Mela', a: 'Ada', luogo: 'Piazza' }, ricompensa: 'Pane', stato: 'accepted', viandante: 'io' }, carta: card('narrator', 'comune', 'anna') }] }),
    'world/bible.json': write({ titolo: 'Valle', tono: 't', sintesi: 's', storia: 'h', luoghi: ['Piazza'], personaggi: ['Ada'], fatti: ['f'], misteri: ['m'], usanze: ['u'], crepe: ['una crepa'] }),
    'world/atlas.json': write({ regioni: [{ id: 'borgo', nome: 'Borgo', descrizione: 'd', ambiente: 'village', centro: [0, 0], raggio: 2 }] }),
    'world/rules.json': write({ regole: [{ chiave: 'azione|canto', testo: 'cantare', possibile: true, racconto: 'canta', effetti: ['light'], carta: card('narrator', 'io', 'io') }] }),
    'world/stato.json': write({ consumati: ['a'], contenitori: { k: { inv: { slots: [] }, filled: true } }, forme: { 'casa#1': ['open'] }, rari: { huge: { '0,0': '1,1' } }, ora: 120, posati: [{ item: 'item.pane', count: 1, x: 1, y: 1, z: 0, yaw: 0 }] }),
    'world/giocatori/io.json': write({ nome: 'Io', profilo: { nome: 'Io', seme: 2, tinta: '#3060c0', presentazione: 'ciao' }, stati: {}, trasceso: true, crediti: 9, needs: { hunger: 10 } }),
    'world/giocatori/anna.json': write({ nome: 'Anna', anonimo: true, profilo: { nome: 'Anna' } }),
    'world/imprese.json': write({ imprese: [{ id: 'i1', titolo: 'Il forno', tipo: 'construction', stato: 'active', luogo: '0,0', posto: { x: 1, y: 1 }, lotto: 0, origine: '0,0#s0', modello: 'struttura-forno', concetto: 'il forno', classe: 'structure', taglia: 'huge', seme: 1, yaw: 0, fasi: [{ nome: 'platea', materiali: { 'item.ciocco': 4 }, lavoro: 200, stadio: 0.2 }], ruoli: [{ ruolo: 'capomastro', mestiere: 'smith', quanti: 1 }], portati: { 'item.ciocco': 1 }, lavorato: 10, squadra: [{ nome: 'Ada', ruolo: 'capomastro' }], inizio: 1, ultimo: 2, scade: 9, compito: { casella: 'u', oggetto: 'item.grano', lascia: 'm', durata: 8, posa: 'hoe' }, nato_da: 'regola:ricostruzione', carta: { autore: 'kernel' } }] }),
    'world/carte.json': write({ utilizzi: { 'model:struttura-forno': { luoghi: 2, trame: 1, prompt: 3 } }, luoghi: { '0,0': { nome: 'Piazza', ...card('cartographer', 'io', 'io') } }, allaNascita: { 'model:struttura-forno': { luoghi: 1, trame: 0, prompt: 0 } } }),
    'world/consumi.json': write({ prezzi: '2026-10-22', giorni: { '2026-11-01': { m: { t: { calls: 1 } } } }, paganti: { '2026-11-01': { io: { calls: 1 }, anna: { calls: 2 } } } }),
    'world/mancanze.json': write({ voci: [{ richiesta: 'un drago', chi: ['io', 'anna'], agente: 'narrator', compito: 'forge.concept', esito: 'refusal', motivo: 'no', volte: 2, primo: '2026-11-01', ultimo: '2026-11-02' }] }),
    'world/magazzino/sys.work.json': write({ 'deposito:0:0': { 'item.grano': 3 } }),
    'world/grafo.json': write({ nodes: [], links: [] }),
    'world/canone.md': '# Canone\n',
    'world/lessico.md': '# Lessico\n',
  };
  return files;
}

describe('the migration 0.3 → 0.4: a universe of 0.3 born among many, file by file', () => {
  const before = universe03();
  // The step 0.3 → 0.4 alone: the chain goes on to 0.5 (T308b, migration-0.5.test.ts).
  const { files, applied } = migrateUniverse(before, TO_0_4);

  it('is the third migration of the chain, it says what it does, and the universe runs on this kernel', () => {
    expect(MIGRATIONS.map((m) => `${m.from}→${m.to}`)).toEqual(['0.1→0.2', '0.2→0.3', '0.3→0.4', '0.4→0.5']);
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatch(/^0\.3→0\.4: /);
    const cfg = json(files['universe.json']);
    expect(cfg).toMatchObject({ kernel: TO_0_4, kernels: { from: '0.4' } });
    expect(checkKernelVersion(cfg.kernel, TO_0_4, cfg.kernels).ok).toBe(true);
  });

  it('is deterministic, and a ported universe stays as it is', () => {
    expect(migrateUniverse(universe03(), TO_0_4).files).toEqual(files);
    expect(migrateUniverse(files, TO_0_4).applied).toEqual([]);
    const again = MIGRATIONS[2].migrate(files);
    for (const p of Object.keys(files)) expect(again[p], p).toBe(files[p]);
  });

  it('moves the files of the world to their English paths; `io` is `me` also in the name of their file', () => {
    const paths = Object.keys(files).sort();
    for (const p of ['world/players/me.json', 'world/players/anna.json', 'world/state.json', 'world/ventures.json', 'world/cards.json', 'world/usage.json', 'world/shortfalls.json', 'world/stores/sys.work.json', 'world/graph.json', 'world/canon.md', 'world/lexicon.md'])
      expect(paths, p).toContain(p);
    expect(paths.filter((p) => /giocatori|stato\.json|imprese|carte\.json|consumi|mancanze|magazzino|grafo|canone|lessico/.test(p))).toEqual([]);
    expect(internalPath('world/giocatori/io.json')).toBe('world/players/me.json');
    expect(internalPath('world/giocatori/anna.json')).toBe('world/players/anna.json');
    expect(internalPath('modules/x/manifest.json')).toBe('modules/x/manifest.json');
  });

  it('universe.json: the game, the relief, the heritage, ai and its minimums; the master `me`', () => {
    const cfg = json(files['universe.json']);
    expect(cfg.game).toEqual({ mode: 'multiplayer', death: 2, pvp: false, freeActionsBetweenPlayers: true, master: 'me' });
    expect(cfg.relief).toEqual({ sea: 1 });
    expect(cfg.heritage).toEqual({ base: 0.1, copy: 0.4 });
    expect(cfg.ai).toMatchObject({ sculptors: { simple: 'gemini-3.1-flash-lite' }, agents: { narrator: 'claude' }, coefficients: { plots: 0.5 }, minimums: { cap: 2, sculptors: { structure: 'gemini-3.8-flash' } }, actor: { on: true, model: 'gemini-3.8-flash' }, maxPieces: 3 });
    expect(Object.keys(cfg).filter((k) => ['partita', 'rilievo', 'eredita'].includes(k))).toEqual([]);
    expect(readConfig(files).config.game).toMatchObject({ mode: 'multiplayer', master: 'me' });
    expect(gameIn(files['universe.json'])).toEqual({ many: true, master: 'me' });
    // Read by the server before it is ported, a game of 0.3 is the same game.
    expect(gameIn(before['universe.json'])).toEqual({ many: true, master: 'me' });
  });

  it('the manifests: the look, the card and its origins, the panel, the cases, the programs of the trades and their places', () => {
    const oste = json(files['modules/npc.oste/manifest.json']);
    expect(oste.appearance).toEqual({ glyph: 'o', color: '#aa8844', model: 'person', look: 'grembiule sporco', class: 'person', size: 'medium' });
    expect(oste.card).toEqual({ author: 'narrator', payer: 'me', holder: 'me', origins: [{ holder: 'bruno', universe: 'prima', fingerprint: [1, 2] }] });
    const equip = json(files['modules/mech.equip/manifest.json']);
    expect(equip.ui).toEqual({ id: 'equip', title: 'Equip', description: 'ciò che porti', elements: [{ type: 'slot', id: 'testa', label: 'Testa', accepts: ['elmo'] }, { type: 'bar', field: 'difesa.valore', color: '#ff0000' }] });
    expect(equip.cases[0]).toEqual({
      title: 'Un elmo', story: 'si mette',
      wanderer: { components: { needs: { health: 10 } }, items: [{ name: 'Elmo', slot: 'testa', category: 'clothing' }] },
      // The components of a thing are Lua's (T308b): their names stay.
      entities: [{ module: 'obj.chest', x: 1, y: 0, components: { luce: { raggio: 2 } } }],
      steps: [{ type: 'slot', slot: 'testa', item: 'Elmo' }, { type: 'wait', seconds: 1 }, { type: 'walk', toward: 'up', seconds: 1 }],
      duration: 3, watch: ['difesa.valore'], lines: [2],
    });
    const job = json(files['modules/job.vasaio/manifest.json']).jobs[0];
    expect(job).toMatchObject({ id: 'vasaio', names: ['vasaio'], workplace: { tile: 'm' } });
    expect(job.day.morning).toEqual([{ does: 'go', where: 'tile:m' }, { does: 'gather', tile: 'g', drop: 'm', item: 'item.grano', count: 2, duration: 8, pose: 'hoe', says: 'Si comincia.' }]);
    expect(job.day.day).toEqual([{ does: 'carry', item: 'item.grano', to: 'entity:forno' }, { does: 'use', where: 'entity:forno', action: 'cuoci' }]);
    expect(job.day.evening).toEqual([{ does: 'patrol', route: ['square', 'tile:m'] }]);
    const world = { codes: new Set(['g', 'm']), items: new Set(['item.grano']) };
    expect(validateJobProgram(job, world).errors).toEqual([]);
    expect(json(files['modules/world.terrain/manifest.json']).tiles.m.ripens).toEqual({ after: 3, in: 'u' });
  });

  it('the index of the models and the attribute of the ground of a program', () => {
    const index = json(files['models/index.json']);
    expect(index.person).toEqual({ class: 'person', name: 'Persona', author: 'a mano' });
    expect(index['struttura-forno']).toEqual({ class: 'structure', size: 'huge', cellar: 1, score: 8, advice: ['bene'], problems: [], tint: 'C', time: 4, card: { author: 'sculptor', payer: 'comune', holder: 'anna' } });
    expect(index['sound-music-stone']).toEqual({ class: 'suono', name: 'Pietra', sound: { use: 'music', environments: ['castle'], moments: ['morning'], beyond: true } });
    expect(files['models/struttura-forno.xml']).toContain(' soil="E" ');
    expect(files['models/struttura-forno.xml']).not.toContain('suolo');
    // The same program reads the same with either attribute (the Sculptor still writes `suolo` until T310).
    expect(compileMjx(files['models/struttura-forno.xml'], { base: 2 }).program.soil).toBe(compileMjx(before['models/struttura-forno.xml'], { base: 2 }).program.soil);
  });

  it('people, plots, bible, atlas, rules: every field, the wanderer `me` where a field holds a wanderer', () => {
    const ada = json(files['world/people.json']).people[0];
    expect(ada).toMatchObject({ name: 'Ada', species: 'person', gender: 'female', kind: 'npc.villager', job: 'fornaia', age: 'adulta', story: 's', place: 'Piazza', origin: '0,0#o0', look: 'a', carries: ['pane'], persona: 'Sei Ada.' });
    expect(ada.family).toEqual([{ name: 'Viandante', bond: 'amica', wanderer: 'me' }, { name: 'Bruno', bond: 'sorella' }]);
    expect(ada.routine).toEqual([{ when: 'morning', does: 'impasta', where: 'work', activity: 'cook' }]);
    expect(ada.memories).toEqual([{ when: 'giorno 1', text: 'ha aiutato', with: 'Viandante', wanderer: 'me', weight: 2 }]);
    expect(ada.sheet).toEqual({ text: 'Sei Ada.', fingerprint: 'x1' });
    expect(ada.card).toEqual({ author: 'narrator', payer: 'me', holder: 'me' });
    expect(json(files['world/people.json']).expected).toEqual([{ name: 'Nessuno', bond: 'fratello', of: 'Ada' }]);
    const plot = json(files['world/plots.json']).plots[0];
    expect(plot).toMatchObject({ title: 'Il pane', mystery: 'm', involved: ['Ada'], start: 2, state: 'active', card: { author: 'narrator', payer: 'comune', holder: 'anna' } });
    expect(plot.beats).toEqual([{ day: 0, moment: 'day', who: 'Ada', where: 'square', what: 'aspetta', line: 'Eccoti.', clue: 'farina', done: false }]);
    expect(plot.quest).toEqual({ from: 'Ada', text: 'porta', goal: { type: 'bring', item: 'Mela', to: 'Ada', place: 'Piazza' }, reward: 'Pane', state: 'accepted', wanderer: 'me' });
    // The old bibles' cracks are gone (ADR-0025).
    expect(json(files['world/bible.json'])).toEqual({ title: 'Valle', tone: 't', summary: 's', history: 'h', places: ['Piazza'], characters: ['Ada'], facts: ['f'], mysteries: ['m'], customs: ['u'] });
    expect(json(files['world/atlas.json'])).toEqual({ regions: [{ id: 'borgo', name: 'Borgo', description: 'd', environment: 'village', center: [0, 0], radius: 2 }] });
    expect(json(files['world/rules.json'])).toEqual({ rules: [{ key: 'azione|canto', text: 'cantare', possible: true, story: 'canta', effects: ['light'], card: { author: 'narrator', payer: 'me', holder: 'me' } }] });
  });

  it('the state, the wanderers (never their credits), the ventures, the cards, the usage, the shortfalls, the stores', () => {
    expect(json(files['world/state.json'])).toEqual({ consumed: ['a'], containers: { k: { inv: { slots: [] }, filled: true } }, forms: { 'casa#1': ['open'] }, rares: { huge: { '0,0': '1,1' } }, time: 120, placed: [{ item: 'item.pane', count: 1, x: 1, y: 1, z: 0, yaw: 0 }] });
    expect(json(files['world/players/me.json'])).toEqual({ name: 'Io', profile: { name: 'Io', seed: 2, tint: '#3060c0', introduction: 'ciao' }, states: {}, transcended: true, needs: { hunger: 10 } });
    expect(json(files['world/players/anna.json'])).toEqual({ name: 'Anna', anonymous: true, profile: { name: 'Anna' } });
    const v = json(files['world/ventures.json']).ventures[0];
    expect(v).toMatchObject({ title: 'Il forno', type: 'construction', state: 'active', chunk: '0,0', spot: { x: 1, y: 1 }, lot: 0, origin: '0,0#s0', model: 'struttura-forno', concept: 'il forno', class: 'structure', size: 'huge', seed: 1, brought: { 'item.ciocco': 1 }, worked: 10, start: 1, last: 2, expires: 9, born_from: 'regola:ricostruzione', card: { author: 'kernel' } });
    expect(v.phases).toEqual([{ name: 'platea', materials: { 'item.ciocco': 4 }, work: 200, stage: 0.2 }]);
    expect(v.roles).toEqual([{ role: 'capomastro', job: 'smith', count: 1 }]);
    expect(v.team).toEqual([{ name: 'Ada', role: 'capomastro' }]);
    expect(v.task).toEqual({ tile: 'u', item: 'item.grano', drop: 'm', duration: 8, pose: 'hoe' });
    expect(json(files['world/cards.json'])).toEqual({ uses: { 'model:struttura-forno': { chunks: 2, plots: 1, prompt: 3 } }, chunks: { '0,0': { name: 'Piazza', author: 'cartographer', payer: 'me', holder: 'me' } }, atBirth: { 'model:struttura-forno': { chunks: 1, plots: 0, prompt: 0 } } });
    expect(json(files['world/usage.json'])).toEqual({ prices: '2026-10-22', days: { '2026-11-01': { m: { t: { calls: 1 } } } }, payers: { '2026-11-01': { me: { calls: 1 }, anna: { calls: 2 } } } });
    expect(json(files['world/shortfalls.json'])).toEqual({ entries: [{ request: 'un drago', who: ['me', 'anna'], agent: 'narrator', task: 'forge.concept', outcome: 'refusal', reason: 'no', times: 2, first: '2026-11-01', last: '2026-11-02' }] });
    expect(files['world/stores/sys.work.json']).toBe(before['world/magazzino/sys.work.json']);
    // The kernel reads them as they are.
    expect(readWandererState(files, SOLO)).toMatchObject({ name: 'Io', profile: { tint: '#3060c0' }, transcended: true });
    expect(readVentures(files['world/ventures.json'])[0]).toMatchObject({ chunk: '0,0', team: [{ name: 'Ada' }] });
    expect(readCards(files).chunks['0,0']).toMatchObject({ name: 'Piazza', holder: 'me' });
    expect(readShortfalls(files['world/shortfalls.json'])[0]).toMatchObject({ who: ['me', 'anna'], times: 2 });
  });

  it('a state of before T245a: its important structures are the Huge ones, its wanderer is `me`\'s own file', () => {
    const old = universe03();
    delete old['world/giocatori/io.json'];
    old['world/stato.json'] = write({ importanti: { '5,5': '5,5' }, rari: { huge: { '0,0': '1,1' } }, viandante: { nome: 'Io', crediti: 3, needs: { hunger: 1 } }, ora: 4 });
    const out = migrateUniverse(old, TO_0_4).files;
    expect(json(out['world/state.json'])).toEqual({ rares: { huge: { '5,5': '5,5', '0,0': '1,1' } }, time: 4 });
    expect(json(out['world/players/me.json'])).toEqual({ name: 'Io', needs: { hunger: 1 } });
  });

  it('seed.json follows: a file of the seed the universe kept as it was stays the seed\'s under its new path', () => {
    const u = universe03();
    u[SEED_FILE] = JSON.stringify({ 'world/canone.md': h(u['world/canone.md']), 'world/lessico.md': 'cambiato' }, null, 1) + '\n';
    const seed = json(migrateUniverse(u, TO_0_4).files[SEED_FILE]);
    expect(Object.keys(seed).sort()).toEqual(['world/canon.md', 'world/lexicon.md']);
    expect(seed['world/canon.md']).toBe(h(u['world/canone.md']));
    expect(seed['world/lexicon.md']).toBe('cambiato');
  });

  it('a universe that has both the old path and the new one keeps the new one', () => {
    const u = universe03();
    u['world/state.json'] = write({ time: 9 });
    expect(json(migrateUniverse(u, TO_0_4).files['world/state.json'])).toEqual({ time: 9 });
  });

  it('prepareUniverse: the chain (0.3 → 0.4 → 0.5), then the seed of today', () => {
    const out = prepareUniverse(universe03(), bundledFiles);
    expect(out.applied).toHaveLength(2);
    expect(out.files['world/canon.md']).toBeDefined();
    expect(out.changes['world/stato.json']).toBeNull();
    expect(out.changes['world/giocatori/io.json']).toBeNull();
  });
});

describe('the plans of the places, as the kernel reads them', () => {
  const plan = {
    place: { name: 'Qui', description: 'qui' }, layout: 'village', objects: [], ground: [], fresh: [], runes: [],
    strutture: [{ concetto: 'il forno', taglia: 'huge' }], giorni: { a: 1 }, stadi: { '0,0#s0': 0.5 }, visto: 3, scavi: { '1': 2 }, acqua: {},
    case: [{ origine: '1,1', x: 1, y: 1, modello: 'm', seme: 1, yaw: 0, classe: 'building', concetto: 'casa', stadio: 0.5 }],
    carta: card('cartographer', 'io', 'io'),
  } as unknown as ChunkPlan;

  it('are ported by every migration, idempotently, and a plan of today is the same object', () => {
    const rec = migratePlanRecord({ plan });
    expect(rec.plan).toMatchObject({ structures: [{ concept: 'il forno', size: 'huge' }], days: { a: 1 }, stages: { '0,0#s0': 0.5 }, seen: 3, digs: { '1': 2 }, water: {}, card: { author: 'cartographer', payer: 'me', holder: 'me' } });
    expect(rec.plan.houses).toEqual([{ origin: '1,1', x: 1, y: 1, model: 'm', seed: 1, yaw: 0, class: 'building', concept: 'casa', stage: 0.5 }]);
    expect(Object.keys(rec.plan).filter((k) => ['strutture', 'giorni', 'stadi', 'case', 'visto', 'scavi', 'acqua', 'carta'].includes(k))).toEqual([]);
    expect(migratePlanRecord(rec)).toBe(rec);
  });
});

describe('what the Council still writes with the Italian fields of its schemas, until T310', () => {
  it('reads with the fields of 0.4: people, plots, the bible, the atlas, a program of a trade', () => {
    const files = universe03();
    expect(readPeople(files).people[0]).toMatchObject({ name: 'Ada', family: [{ name: 'Viandante', bond: 'amica' }, { name: 'Bruno', bond: 'sorella' }] });
    expect(readPlots(files)[0]).toMatchObject({ title: 'Il pane', beats: [{ who: 'Ada' }] });
    expect(readBible(files)).toMatchObject({ title: 'Valle', places: ['Piazza'] });
    expect(readBible(files)).not.toHaveProperty('crepe');
    expect(readAtlas(files).regions[0]).toMatchObject({ name: 'Borgo', center: [0, 0] });
    const raw = json(files['modules/job.vasaio/manifest.json']).mestieri[0];
    expect(validateJobProgram(raw, { codes: new Set(['g', 'm']), items: new Set(['item.grano']) }).program?.workplace).toEqual({ tile: 'm' });
    expect(internalFields('panelElement', { tipo: 'slot', etichetta: 'Testa' })).toEqual({ type: 'slot', label: 'Testa' });
  });
});

describe('what reads a universe on the disk without opening it (the site\'s routes, the tools)', () => {
  it('reads the paths of before and ports them in memory', () => {
    expect(pathsBefore(['world/players/me.json', 'world/state.json', 'universe.json'])).toEqual(['world/players/me.json', 'world/giocatori/io.json', 'world/state.json', 'world/stato.json', 'universe.json']);
    const few: FileMap = { 'universe.json': universe03()['universe.json'], 'world/giocatori/io.json': universe03()['world/giocatori/io.json'] };
    expect(readWandererState(portedFiles(few), SOLO)).toMatchObject({ name: 'Io', transcended: true });
  });
});

describe('the server\'s folders beside the universes', () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const r of roots) rmSync(r, { recursive: true, force: true });
  });
  const dir = () => {
    const r = mkdtempSync(path.join(os.tmpdir(), 'quine-cartelle-'));
    roots.push(r);
    return r;
  };

  it('have English names; an old folder is moved, once, with what it holds', () => {
    expect([serverName('trash'), serverName('balances'), serverName('queue'), serverName('running'), serverName('generation'), serverName('geminiSpend')]).toEqual(['.trash', '.balances', '.queue', '.running', '.generation', '.gemini-spend.json']);
    const root = dir();
    mkdirSync(path.join(root, '.coda'));
    writeFileSync(path.join(root, '.coda', 'x.richiesta.json'), '{}');
    expect(serverPath(root, 'queue')).toBe(path.join(root, '.queue'));
    expect(existsSync(path.join(root, '.coda'))).toBe(false);
    expect(readFileSync(path.join(root, '.queue', 'x.richiesta.json'), 'utf8')).toBe('{}');
    // A new one there already wins: the old one stays where it is.
    const other = dir();
    mkdirSync(path.join(other, '.queue'));
    mkdirSync(path.join(other, '.coda'));
    expect(serverPath(other, 'queue')).toBe(path.join(other, '.queue'));
    expect(existsSync(path.join(other, '.coda'))).toBe(true);
  });

  it('a ledger of before keeps its balances: the folder moves, and the wanderer alone of before (`io`) is `me`', () => {
    const root = dir();
    mkdirSync(path.join(root, '.saldi'));
    mkdirSync(path.join(root, 'vecchio'));
    writeFileSync(path.join(root, '.saldi', 'vecchio.json'), JSON.stringify({ saldi: { io: 4, anna: 2 }, eventi: { e1: { eventId: 'e1', wandererId: 'io', crediti: 4, timestamp: 1 } }, ricariche: [] }));
    const ledger = ledgerOf(root, 'vecchio');
    expect(ledger.balance('me')).toBe(4);
    expect(ledger.balance('anna')).toBe(2);
    expect(ledger.balance('io')).toBe(0);
    expect(ledger.payment('e1')).toMatchObject({ wandererId: 'me' });
    expect(existsSync(path.join(root, '.balances', 'vecchio.json'))).toBe(true);
    expect(existsSync(path.join(root, '.saldi'))).toBe(false);
  });
});

describe('the seed of 0.4', () => {
  it('runs 400 ticks offline without faults', async () => {
    const k = await boot();
    for (let i = 0; i < 400; i++) k.tick(1 / 60);
    expect(k.faults.list().map((f) => `${f.key}: ${f.message}`)).toEqual([]);
    expect(Object.keys(bundledFiles).filter((p) => /^world\/(giocatori|stato|imprese|carte|consumi|mancanze|magazzino|grafo|canone|lessico)\b/.test(p))).toEqual([]);
  });
});
