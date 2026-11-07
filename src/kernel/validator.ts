// The validator: everything generated (by the Council or by the kernel) passes through here before it
// touches the universe. Invalid content is discarded and regenerated. The player is never
// validated against: the player is allowed to break the game.

import type { Sandbox } from './sandbox';
import type { Effect, FileMap, ItemDef, EnvironmentDef, Manifest, ModuleKind, GameSetup, TerrainDef } from './types';
import { DEATH_LEVELS, DEFAULT_GAME_SETUP, isMultiplayer } from './gameSetup';
import { SOLO, validWandererId } from './wanderers';
import { ITEM_CATEGORIES } from './types';
import type { ChunkPlan } from './agents/cartography';
import { lex, TOKEN_RE, tokenize } from './runes';
import { compile, writtenCodes, MjError } from './mj';
import { layout } from './layout';
import { analyse } from '../mj/check';
export { repairCoefficients, repairActor } from './coefficients';
export { repairMinimums } from './universe';
import { boxOf, classOf, CLASSES, sizeOf, SIZE_TIERS } from '../mj/classes';
import { Mj3Error } from '../mj/engine';
import { compileMjx, MJX_FILE_RE, mjxIncludes, patternText, type MjxFiles, type MjxModel } from '../mj/model';
import { FORM_LIMITS, MAX_FORM_TIME, MAX_FORM_XML, runMjx } from '../mj/run';
import { analyzeSound } from '../mj/soundanalysis';
import { reservedName } from './paths';
import { internalCardsIn, internalEffect, internalFields, internalManifest, internalManifest0_5, internalName, italianName, SOLO_BEFORE_0_4 } from './internalNames';

const KINDS: ModuleKind[] = ['system', 'entity', 'item', 'player', 'generator', 'data'];
const LAYERS = ['ground', 'floor', 'wall', 'door', 'liquid', 'vegetation', 'rock'];
const ID_RE = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/;
/**
 * The game of universe.json (ADR-0053), whatever it says: an unknown mode is single, the death a level
 * from 0 to 4 (the words of the plan, «molto» / «poco punitiva», or a level name, become one), the rest
 * booleans; what is missing is the game of today.
 */
export function repairGameSetup(raw: unknown): GameSetup {
  // The fields of the contract 0.3 (`modalita`, `morte`) read internal (T308a).
  const r = internalFields('game', (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>);
  const flag = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : v === 'sì' || v === 'si' || v === 'true' ? true : v === 'no' || v === 'false' ? false : d);
  let morte = DEFAULT_GAME_SETUP.death;
  if (typeof r.death === 'number' && Number.isFinite(r.death)) morte = Math.max(0, Math.min(DEATH_LEVELS.length - 1, Math.round(r.death)));
  else if (typeof r.death === 'string') {
    const t = r.death.trim().toLowerCase();
    const named = DEATH_LEVELS.findIndex((l) => l.nome === t);
    if (named >= 0) morte = named;
    else if (/^\d$/.test(t)) morte = Math.min(DEATH_LEVELS.length - 1, Number(t));
    else if (/\bmolto\b/.test(t)) morte = 4;
    else if (/\bpoco\b/.test(t)) morte = 1;
  }
  const modalita = isMultiplayer(r.mode) ? 'multiplayer' : 'single';
  // The master of before the contract 0.4 who played alone (`io`) is `me`.
  const master = r.master === SOLO_BEFORE_0_4 ? SOLO : r.master;
  return {
    mode: modalita,
    death: morte,
    pvp: flag(r.pvp, DEFAULT_GAME_SETUP.pvp),
    freeActionsBetweenPlayers: flag(r.freeActionsBetweenPlayers, DEFAULT_GAME_SETUP.freeActionsBetweenPlayers),
    // Alone, the one who plays is the master of everything; in a multiplayer game, who created it (T37).
    ...(modalita === 'multiplayer' ? { master: validWandererId(master) ? master : SOLO } : {}),
  };
}

/** Ids of the models of the library (`models/<id>.xml`). */
export const MODEL_RE = /^[a-z0-9][a-z0-9-]{0,40}$/i;

/**
 * A model of the library must compile, finish and build something that stands: what the front-end can
 * mend it mends (ADR-0036), the rest goes back with the line of the error.
 */
export function modelErrors(path: string, xml: string, time = 8_000, box?: [number, number, number], files?: MjxFiles): string[] {
  // The Musician's program was measured a moment ago: a piece costs up to two seconds on the page, and the answer would be the same.
  if (xml === lastCleanSound) return [];
  if (xml.length > MAX_FORM_XML) return [`${path}: programma troppo lungo (max ${MAX_FORM_XML} caratteri)`];
  time = Math.min(time, MAX_FORM_TIME);
  try {
    const size = /<(?!!)[a-z]+\b[^>]*\ssize="/i.test(xml) ? undefined : (box ?? boxOf(classOf('object')!));
    const self = /^models\/([^/]+)\.xml$/.exec(path)?.[1];
    const m = compileMjx(xml, { ...(size ? { size } : {}), ...(files && Object.keys(files).length ? { files, ...(self ? { self } : {}) } : {}) });
    if (m.sound) {
      const errors = soundErrors(path, m, time);
      if (!errors.length) lastCleanSound = xml;
      return errors;
    }
    const r = runMjx(m, 1, { deadline: time, limits: FORM_LIMITS });
    if (!r.finished) return [`${path}: il programma non finisce in ${Math.round(time / 1000)} secondi (ogni crescita deve avere steps; un programma lento scritto a mano può avere \`tempo\` in models/index.json)`];
    return analyse(r, m.program.palette, { grounded: true }).errors.map((e) => `${path}: ${e}`);
  } catch (e) {
    return [`${path}: ${e instanceof Mj3Error ? e.message : (e as Error).message}`];
  }
}

/** The longest rule file of models/ (T333). */
export const MAX_RULE_FILE = 100_000;

/**
 * A rule file of models/ (`<name>.txt`, T333, ADR-0171): a plain name, text of pattern cells only (letters, digits, `* / [ ]`, spaces), notes
 * after "#", at most one line "->". Whether its patterns fit a program is said when the program that reads it compiles.
 */
export function ruleFileErrors(path: string, text: string): string[] {
  const name = /^models\/([^/]+)\.txt$/.exec(path)?.[1];
  if (!name || !MJX_FILE_RE.test(name)) return [`${path}: un file di regole è models/<nome>.txt, con lettere, cifre e "-" nel nome`];
  if (text.length > MAX_RULE_FILE) return [`${path}: troppo lungo (max ${MAX_RULE_FILE} caratteri)`];
  const errors: string[] = [];
  let arrows = 0;
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*#/.test(line)) return;
    if (/^[ \t]*->[ \t]*$/.test(line)) return void arrows++;
    const bad = /[^A-Za-z0-9*/[\] \t]/.exec(line);
    if (bad) errors.push(`${path}: riga ${i + 1}: "${bad[0]}" non sta in un pattern (lettere, cifre, * / [ ] e spazi; le note dopo #)`);
  });
  if (arrows > 1) errors.push(`${path}: al più una riga "->" (fra in e out)`);
  if (!errors.length && text.split(/^[ \t]*->[ \t]*\r?$/m).some((part) => !patternText(part))) errors.push(`${path}: un pattern vuoto`);
  return errors.slice(0, 6);
}

/** The last sound program that passed: the measures are a pure function of the text. */
let lastCleanSound: string | undefined;

/** Three seeds: a program whose seeds do not differ goes back too. */
const SOUND_CHECK_SEEDS = [1, 2, 3];

/**
 * A sound program stands in no world: it must finish and pass the thresholds of the analysis (ADR-0123, ADR-0125). The Musician's and a
 * handmade card's alike (ADR-0161): `time` is for the three seeds together.
 */
export function soundErrors(path: string, m: Pick<MjxModel, 'program' | 'sound'>, time: number): string[] {
  const { issues } = analyzeSound(m, { seeds: SOUND_CHECK_SEEDS, frugal: true, deadline: time / SOUND_CHECK_SEEDS.length });
  return issues.map((i) => `${path}: suono ${italianName('solo-codice', i.defect)}: ${i.message}`);
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

/** The Lua API (prelude.lua): generated code may only call these. */
export const LUA_API: Record<string, string[]> = {
  ecs: ['each', 'get', 'set', 'spawn', 'destroy', 'first'],
  world: ['free', 'free_real', 'tile', 'speed_at', 'spawn', 'player', 'player_pos', 'nearest', 'has_tag', 'break_entity', 'say', 'speak', 'set_tile', 'open', 'make_container', 'store_get', 'store_set', 'wanderers', 'path', 'find_tile', 'act', 'venture', 'venture_bring'],
  inventory: ['add', 'remove', 'count', 'equipped'],
  input: ['held'],
  bus: ['emit'],
  items: ['find', 'def', 'bonus'],
  ui: ['slot'],
};

/** Calls to functions that do not exist, or to what the sandbox forbids: caught before anything runs. */
export function apiErrors(logic: string): string[] {
  const code = logic.replace(/--\[\[[\s\S]*?\]\]|--[^\n]*/g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  const errors = new Set<string>();
  for (const m of code.matchAll(/\b(ecs|world|inventory|input|bus|items|ui)\s*[.:]\s*([A-Za-z_]\w*)/g)) {
    if (!LUA_API[m[1]].includes(m[2])) errors.add(`${m[1]}.${m[2]} non esiste nell'API (disponibili: ${LUA_API[m[1]].join(', ')})`);
  }
  for (const m of code.matchAll(/\b(os|io|debug|package)\s*\.|\b(require|load|loadstring|dofile|setfenv|getmetatable)\s*\(/g)) errors.add(`${m[1] ?? m[2]} non è disponibile nella sandbox`);
  return [...errors];
}

/** Symbols a generated identity statement (`a = a`) may touch: writing them back changes nothing. */
export const IDENTITY_SAFE = new Set(['x', 'y', 'speed', 'carpet . strength', 'carpet . rate', 'carpet . active']);

export interface PlanVerdict {
  /** Fatal problems: the plan is discarded and requested again. */
  errors: string[];
  /** The plan with invalid parts removed (when there are no fatal errors). */
  plan: ChunkPlan;
  /** What was filtered out, for the log. */
  dropped: string[];
}

export class Validator {
  /** The time a model of the library may run (its `tempo` in the index), set by the kernel. */
  modelTime: (id: string) => number | undefined = () => undefined;
  /** The box a model without a `size` of its own runs in (its class at its size, ADR-0160), set by the kernel; else an object's. */
  modelBox: (id: string) => [number, number, number] | undefined = () => undefined;
  /** A file of models/ by its name there (`torre.xml`, `porta.txt`), for the programs that read others (T333), set by the kernel. */
  modelFile: (name: string) => string | undefined = () => undefined;

  constructor(private sandbox: Sandbox) {}

  parseManifest(path: string, src: string): { manifest?: Manifest; errors: string[] } {
    let m: any;
    try {
      // The values of the contract 0.2 the Council still writes in Italian (T307a), then the fields of 0.3 (`aspetto`, `casi`, T308a):
      // internal before anything reads them, and the components and panel fields of 0.4 (`luce`, `cantiere.titolo`, T308b). The values
      // first: their repair reads the fields of before.
      m = internalManifest0_5(internalCardsIn(internalFields('manifest', internalManifest(JSON.parse(src)))));
    } catch (e) {
      return { errors: [`${path}: JSON non valido (${(e as Error).message})`] };
    }
    const errors: string[] = [];
    const err = (s: string) => errors.push(`${path}: ${s}`);
    if (typeof m !== 'object' || m === null) return { errors: [`${path}: deve essere un oggetto`] };
    if (typeof m.id !== 'string' || !ID_RE.test(m.id) || reservedName(m.id)) err(`id non valido "${m.id}" (es. "npc.villager")`);
    if (typeof m.name !== 'string' || !m.name) err('name mancante');
    if (!KINDS.includes(m.kind)) err(`kind deve essere uno tra ${KINDS.join(', ')}`);
    if (m.logic !== undefined && typeof m.logic !== 'string') err('logic deve essere un percorso relativo');
    if (m.appearance) {
      if (typeof m.appearance.glyph !== 'string' || [...m.appearance.glyph].length !== 1) err('appearance.glyph deve essere un singolo carattere');
      if (typeof m.appearance.color !== 'string') err('appearance.color mancante');
      if (m.appearance.model !== undefined && (typeof m.appearance.model !== 'string' || !MODEL_RE.test(m.appearance.model))) err(`appearance.model deve essere l'id di un modello di models/ (es. "pino"): "${m.appearance.model}"`);
      if (m.appearance.class !== undefined && !classOf(m.appearance.class)) err(`appearance.class sconosciuta "${m.appearance.class}" (note: ${CLASSES.map((c) => c.id).join(', ')})`);
      if (m.appearance.size !== undefined && !sizeOf(m.appearance.size)) err(`appearance.size sconosciuta "${m.appearance.size}" (taglie: ${SIZE_TIERS.map((t) => t.id).join(', ')})`);
    }
    if (['entity', 'item', 'player'].includes(m.kind) && !m.appearance) err(`un modulo ${m.kind} richiede appearance`);
    if (m.physics) {
      for (const k of ['radius', 'mass', 'friction', 'speed'])
        if (m.physics[k] !== undefined && (typeof m.physics[k] !== 'number' || !Number.isFinite(m.physics[k]))) err(`physics.${k} deve essere un numero`);
      if (m.physics.radius !== undefined && (m.physics.radius < 0.1 || m.physics.radius > 0.6)) err('physics.radius deve stare tra 0.1 e 0.6');
    }
    if (m.spawn) {
      const s = m.spawn;
      if (!Array.isArray(s.tiles) || !s.tiles.every((t: unknown) => typeof t === 'string')) err('spawn.tiles deve essere una lista di codici tile');
      if (typeof s.chance !== 'number' || s.chance < 0 || s.chance > 1) err('spawn.chance deve essere in [0,1]');
      if (!Number.isInteger(s.max) || s.max < 0 || s.max > 16) err('spawn.max deve essere un intero 0..16');
    }
    if (m.takeable !== undefined && typeof m.takeable !== 'boolean') err('takeable deve essere true o false');
    // Only a thing of the world is taken (T292): not someone, not an item (it is one already), not what the world is made of.
    if (m.takeable === true && (m.kind !== 'entity' || m.persona !== undefined)) err('takeable vale solo per le cose del mondo (kind entity, senza persona)');
    if (m.interaction && !['talk', 'read', 'lua'].includes(m.interaction.type)) err('interaction.type deve essere talk, read o lua');
    if (m.interaction?.type === 'talk' && typeof m.persona !== 'string') err('un personaggio (talk) richiede "persona"');
    if (m.kind === 'item') {
      const it = m.item;
      if (!it || typeof it !== 'object') err('un modulo item richiede "item"');
      else {
        if (typeof it.stackable !== 'boolean' || typeof it.equippable !== 'boolean') err('item.stackable e item.equippable devono essere booleani');
        if (!Number.isInteger(it.maxStack) || it.maxStack < 1 || it.maxStack > 99) err('item.maxStack deve essere 1..99');
        if (typeof it.weight !== 'number' || it.weight < 0 || it.weight > 50) err('item.weight deve essere 0..50');
      }
    }
    if (m.tiles) {
      for (const [code, t] of Object.entries<any>(m.tiles)) {
        if (code.length !== 1 || code === '?' || code === '*' || code === '/' || code === '[' || code === ']') err(`codice tile "${code}" non valido`);
        if (typeof t.name !== 'string' || typeof t.solid !== 'boolean' || typeof t.color !== 'string' || !HEX_RE.test(t.color)) err(`tile "${code}" incompleta (name, color #rrggbb, solid)`);
        if (t.speed !== undefined && (typeof t.speed !== 'number' || t.speed < 0.2 || t.speed > 2)) err(`tile "${code}": speed fuori intervallo`);
        if (t.layer !== undefined && !LAYERS.includes(t.layer)) err(`tile "${code}": layer deve essere uno tra ${LAYERS.join(', ')}`);
      }
    }
    if (m.container && (!Number.isInteger(m.container.size) || m.container.size < 1 || m.container.size > 24 || typeof m.container.loot !== 'string')) err('container: size 1..24 e loot');
    if (m.actions && (!Array.isArray(m.actions) || m.actions.some((a: any) => typeof a?.id !== 'string' || typeof a?.label !== 'string'))) err('actions: lista di {id, label}');
    if (m.items) errors.push(...this.validateItems(m.items).map((e) => `${path}: ${e}`));
    if (m.fragments && !Array.isArray(m.fragments)) err('fragments deve essere una lista');
    if (m.cases && (!Array.isArray(m.cases) || m.cases.some((c: any) => typeof c?.title !== 'string' || !Array.isArray(c?.watch)))) err('cases: lista di {title, watch, …}');
    return errors.length ? { errors } : { manifest: m as Manifest, errors };
  }

  validateItems(items: unknown): string[] {
    if (!Array.isArray(items)) return ['items deve essere una lista'];
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const it of items as ItemDef[]) {
      const w = `oggetto ${it?.id}`;
      if (typeof it?.id !== 'string' || !/^item\.[a-z0-9-]+$/.test(it.id)) errors.push(`${w}: id non valido`);
      else if (seen.has(it.id)) errors.push(`${w}: id duplicato`);
      seen.add(it?.id);
      if (typeof it?.name !== 'string' || !it.name) errors.push(`${w}: name mancante`);
      if (!(ITEM_CATEGORIES as readonly string[]).includes(it?.category)) errors.push(`${w}: categoria sconosciuta`);
      if (typeof it?.weight !== 'number' || it.weight < 0 || it.weight > 50) errors.push(`${w}: weight 0..50`);
      if (!Number.isInteger(it?.stack) || it.stack < 1 || it.stack > 99) errors.push(`${w}: stack 1..99`);
      if (!Array.isArray(it?.tags)) errors.push(`${w}: tags`);
    }
    return errors.slice(0, 6);
  }

  checkLua(path: string, src: string): string[] {
    const e = this.sandbox.check(src, path);
    return e ? [e] : [];
  }

  validateFile(path: string, content: string, box?: [number, number, number]): string[] {
    if (path.endsWith('.lua')) return this.checkLua(path, content);
    if (/^models\/[^/]+\.xml$/.test(path)) {
      const id = path.slice('models/'.length, -'.xml'.length);
      return modelErrors(path, content, this.modelTime(id), box ?? this.modelBox(id), mjxIncludes(content, (f) => this.modelFile(f)));
    }
    if (/^models\/[^/]+\.txt$/.test(path)) return ruleFileErrors(path, content);
    if (path.endsWith('manifest.json')) return this.parseManifest(path, content).errors;
    if (path.endsWith('.json')) {
      try {
        JSON.parse(content);
        return [];
      } catch (e) {
        return [`${path}: JSON non valido (${(e as Error).message})`];
      }
    }
    return [];
  }

  /** A forged module: manifest shape, Lua that compiles, uses only the API and loads. */
  validateForged(manifest: Manifest, logic: string, existingIds: Set<string>, opts: { system?: boolean } = {}): string[] {
    const path = `modules/${manifest.id}/manifest.json`;
    const errors = [...this.parseManifest(path, JSON.stringify(manifest)).errors];
    if (existingIds.has(manifest.id)) errors.push(`id già esistente: ${manifest.id}`);
    // Systems only from the Forge of mechanics, and only with a panel (ADR-0028).
    if (manifest.kind !== 'entity' && manifest.kind !== 'item' && !(opts.system && manifest.kind === 'system' && manifest.ui)) errors.push(`la Fucina non può creare moduli di tipo ${manifest.kind}`);
    errors.push(...this.checkLua(`modules/${manifest.id}/logic.lua`, logic));
    errors.push(...apiErrors(logic));
    if (!errors.length) {
      // Dry load: the chunk must run and return a table, in a VM apart from the live universe.
      const err = this.sandbox.probe(logic, `modules/${manifest.id}/logic.lua`);
      if (err) errors.push(err);
    }
    return errors;
  }

  validateModuleFiles(files: FileMap, existingIds: Set<string>): string[] {
    const manifests = Object.keys(files).filter((p) => p.endsWith('/manifest.json'));
    if (manifests.length !== 1) return ['un modulo deve contenere esattamente un manifest.json'];
    const { manifest, errors } = this.parseManifest(manifests[0], files[manifests[0]]);
    if (!manifest) return errors;
    const logicPath = manifests[0].replace(/manifest\.json$/, manifest.logic ?? 'logic.lua');
    return this.validateForged(manifest, files[logicPath] ?? 'return {}', existingIds);
  }

  /** A rune line is valid generated code: it compiles, has no calls, statements only `a = a` on safe symbols. */
  runeErrors(line: string): string[] {
    const tokens = tokenize(line);
    if (!tokens.length) return ['vuota'];
    const bad = tokens.find((t) => !TOKEN_RE.test(t));
    if (bad) return [`token non valido "${bad}"`];
    if (tokens.includes('(')) return ['chiamate di funzione non ammesse'];
    const src = tokens.join(' ');
    const kind = this.sandbox.runeKind(src);
    if ('error' in kind) return [`non compila (${kind.error})`];
    if (kind.kind === 'stmt') {
      const m = /^(.+?) = (.+)$/.exec(src);
      if (!m || m[1] !== m[2] || !IDENTITY_SAFE.has(m[1])) return ['istruzione con effetti non ammessa'];
    }
    return [];
  }

  /**
   * A layout program must compile, write only known terrain, terminate, and leave a playable chunk on
   * real drafts (enough walkable ground once the kernel has carved its paths).
   */
  validateLayout(id: string, def: EnvironmentDef, palette: Record<string, TerrainDef>, drafts: string[][]): string[] {
    const errors: string[] = [];
    if (!def || typeof def.name !== 'string' || typeof def.description !== 'string') return [`${id}: name e description obbligatori`];
    try {
      compile(def.program);
    } catch (e) {
      return [`${id}: ${(e as Error).message}`];
    }
    const unknown = [...writtenCodes(def.program)].filter((c) => !palette[c] || c === '?');
    if (unknown.length) errors.push(`${id}: scrive codici inesistenti ${unknown.join(', ')}`);
    if (errors.length) return errors;
    drafts.forEach((draft, i) => {
      try {
        const r = layout(draft, palette, { cx: 100 + i, cy: -100, seed: 1, program: def.program, pathCode: 'p' });
        const open = (rows: string[]) => rows.join('').split('').filter((c) => palette[c]?.solid === false).length;
        // Judged against what the draft offered: a forest draft is allowed to stay mostly forest.
        const cells = draft.length * draft.length;
        const needed = Math.min(cells * 0.25, open(draft) * 0.5);
        if (open(r.grid) < needed) errors.push(`${id}: lascia troppo poco spazio calpestabile`);
        if (r.steps >= 4000) errors.push(`${id}: non termina (troppi passi): usa "steps"`);
      } catch (e) {
        errors.push(`${id}: ${e instanceof MjError ? e.message : (e as Error).message}`);
      }
    });
    return [...new Set(errors)];
  }

  /**
   * The Cartographer's plan: place and environment are essential (fatal); objects, runes and new
   * things that break a rule are dropped one by one, so nothing invalid ever enters the world.
   */
  validatePlan(plan: ChunkPlan, layouts: Set<string>, placeable: Set<string>): PlanVerdict {
    const errors: string[] = [];
    const dropped: string[] = [];
    // An environment of the seed by its Italian id of the contract 0.1 (T307a): the one it became.
    const named = internalName('ambienti', plan.layout ?? '');
    if (!layouts.has(plan.layout) && layouts.has(named)) plan = { ...plan, layout: named };
    if (!plan.place?.name || plan.place.name.length > 60) errors.push('luogo.nome mancante o troppo lungo');
    if (typeof plan.place?.description !== 'string' || plan.place.description.length > 300) errors.push('luogo.descrizione non valida');
    if (!layouts.has(plan.layout)) errors.push(`ambiente sconosciuto "${plan.layout}" (scegli tra: ${[...layouts].join(', ')})`);
    if (errors.length) return { errors, plan, dropped };
    const objects = plan.objects.filter((o) => {
      if (placeable.has(o.module)) return true;
      dropped.push(`oggetto ${o.module}: modulo inesistente o non posizionabile`);
      return false;
    });
    const runes = plan.runes
      .map((r) => lex(r).join(' '))
      .filter((line) => {
        const e = this.runeErrors(line);
        if (e.length) dropped.push(`runa «${line}»: ${e.join(', ')}`);
        return !e.length;
      });
    const fresh = plan.fresh.filter((f) => {
      const ok = f.concept.length >= 3 && f.concept.length <= 200;
      if (!ok) dropped.push(`nuovo «${f.concept}»: non valido`);
      return ok;
    });
    const strutture = (plan.structures ?? []).filter((s) => {
      const ok = s.concept.length >= 3 && s.concept.length <= 120;
      if (!ok) dropped.push(`struttura «${s.concept}»: non valida`);
      return ok;
    }).map((s) => {
      // A size that is not one of D&D's (ADR-0092) is dropped: the structure keeps its lot's.
      if (s.size === undefined || sizeOf(s.size)) return s;
      const size = sizeOf(internalName('taglie', s.size));
      if (size) return { ...s, size: size.id };
      dropped.push(`struttura «${s.concept}»: taglia «${s.size}» sconosciuta`);
      const { size: _, ...rest } = s;
      return rest;
    });
    return { errors, dropped, plan: { ...plan, objects, runes, fresh, structures: strutture, ground: plan.ground.filter((g) => g.trim().length >= 2 && g.length <= 60) } };
  }
}

export interface EffectContext {
  palette: Record<string, TerrainDef>;
  /** Item id by (fuzzy) name. */
  item: (name: string) => string | undefined;
  /** Summonable entity module id by id or name. */
  module: (name: string) => string | undefined;
  loot: Set<string>;
}

export interface EffectVerdict {
  effects: Effect[];
  dropped: string[];
  /** Items named by crea_oggetto that do not exist yet (the Narrator can define them, then validate again). */
  unknownItems: string[];
}

const num = (v: unknown, lo: number, hi: number, def: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
};

/**
 * Effects chosen by the Council, from the closed set: unknown types are dropped, numbers clamped,
 * names resolved to ids (items, modules, terrains). What remains is safe to apply. The Italian of the contract 0.1, which the
 * Council still writes until its prompts change (T310), is made internal first (`{tipo: 'luce'}` → `{type: 'light'}`, T307a).
 */
export function validateEffects(raw: unknown, ctx: EffectContext): EffectVerdict {
  const out: EffectVerdict = { effects: [], dropped: [], unknownItems: [] };
  const list = Array.isArray(raw) ? raw.slice(0, 8) : [];
  // A terrain by its code, its id or its name (in the language of the world), then by a name that holds the word.
  const tileCode = (v: unknown): string | undefined => {
    const s = String(v ?? '').trim();
    if (!s) return undefined;
    if (ctx.palette[s] && s !== '?') return s;
    const n = s.toLowerCase();
    const codes = Object.keys(ctx.palette).filter((c) => c !== '?');
    const id = internalName('terreni', n);
    return (
      codes.find((c) => ctx.palette[c].id === n || ctx.palette[c].id === id) ??
      codes.find((c) => ctx.palette[c].name.toLowerCase() === n) ??
      codes.find((c) => ctx.palette[c].name.toLowerCase().includes(n) || n.includes(ctx.palette[c].name.toLowerCase()))
    );
  };
  for (const r of list) {
    if (!r || typeof r !== 'object') continue;
    const e = internalEffect(r) as Record<string, unknown>;
    const type = String(e.type ?? '');
    switch (type) {
      case 'message':
        if (typeof e.text === 'string' && e.text.trim()) out.effects.push({ type, text: e.text.trim().slice(0, 300) });
        break;
      case 'needs': {
        const b: Effect & { type: 'needs' } = { type };
        for (const k of ['hunger', 'thirst', 'energy', 'health'] as const) if (e[k] !== undefined && e[k] !== null) b[k] = Math.round(num(e[k], -40, 40, 0));
        if (Object.keys(b).length > 1) out.effects.push(b);
        else out.dropped.push('bisogni senza variazioni');
        break;
      }
      case 'create_item':
      case 'consume': {
        const name = String(e.item ?? '').trim();
        const id = name ? ctx.item(name) : undefined;
        const quantity = Math.round(num(e.quantity, 1, type === 'create_item' ? 5 : 10, 1));
        if (id) out.effects.push({ type, item: id, quantity });
        else if (type === 'create_item' && name.length >= 2) out.unknownItems.push(name);
        else out.dropped.push(`${type}: «${name}» non esiste`);
        break;
      }
      case 'destroy':
      case 'open':
        out.effects.push({ type });
        break;
      case 'container': {
        const loot = typeof e.loot === 'string' && ctx.loot.has(e.loot) ? e.loot : ctx.loot.has('cassa') ? 'cassa' : [...ctx.loot][0];
        if (loot) out.effects.push({ type, capacity: Math.round(num(e.capacity, 2, 12, 6)), loot });
        else out.dropped.push('contenitore: nessuna tabella di bottino');
        break;
      }
      case 'terrain': {
        const to = tileCode(e.to);
        if (!to) {
          out.dropped.push(`terreno: «${String(e.to ?? '')}» non è un terreno`);
          break;
        }
        const from = e.from !== undefined && e.from !== null && e.from !== '' ? tileCode(e.from) : undefined;
        out.effects.push({ type, to, ...(from ? { from } : {}), radius: Math.round(num(e.radius, 0, 3, 1)) });
        break;
      }
      case 'relief': {
        const delta = Math.round(num(e.delta, -8, 8, 1));
        if (!delta) {
          out.dropped.push('rilievo senza variazione');
          break;
        }
        out.effects.push({ type, delta, radius: Math.round(num(e.radius, 0, 3, 1)) });
        break;
      }
      case 'fire':
      case 'light':
        out.effects.push({ type, radius: num(e.radius, 0.5, type === 'fire' ? 3 : 8, type === 'fire' ? 1 : 4), duration: num(e.duration, 2, type === 'fire' ? 30 : 300, type === 'fire' ? 10 : 60) });
        break;
      case 'shield':
        out.effects.push({ type, duration: num(e.duration, 2, 120, 20) });
        break;
      case 'push':
        out.effects.push({ type, force: num(e.force, 0.5, 10, 3) });
        break;
      case 'summon': {
        const id = ctx.module(String(e.module ?? ''));
        if (id) out.effects.push({ type, module: id });
        else out.dropped.push(`evoca: «${String(e.module ?? '')}» non esiste`);
        break;
      }
      case 'bond':
        if (typeof e.bond === 'string' && e.bond.trim()) out.effects.push({ type, bond: e.bond.trim().toLowerCase().slice(0, 30) });
        else out.dropped.push('legame senza legame');
        break;
      case 'memory':
        if (typeof e.text === 'string' && e.text.trim()) out.effects.push({ type, text: e.text.trim().slice(0, 200), weight: Math.round(num(e.weight, 1, 3, 2)) });
        break;
      case 'state': {
        const name = typeof e.name === 'string' ? e.name.trim().toLowerCase().slice(0, 30) : '';
        if (!name) {
          out.dropped.push('stato senza nome');
          break;
        }
        const st: Effect & { type: 'state' } = { type, name, duration: Math.round(num(e.duration, 0, 3600, 0)) };
        if (e.speed !== undefined) st.speed = num(e.speed, 0.3, 3, 1);
        if (e.weight !== undefined) st.weight = num(e.weight, -20, 60, 0);
        if (e.light !== undefined) st.light = num(e.light, 0, 8, 0);
        out.effects.push(st);
        break;
      }
      case 'remove_state':
        if (typeof e.name === 'string' && e.name.trim()) out.effects.push({ type, name: e.name.trim().toLowerCase().slice(0, 30) });
        break;
      case 'birth':
        out.effects.push({ type, ...(typeof e.name === 'string' && e.name.trim() ? { name: e.name.trim().slice(0, 30) } : {}) });
        break;
      default:
        out.dropped.push(`effetto sconosciuto «${type}»`);
    }
  }
  return out;
}

/** Names for the ids an effect points at (terrains, items, modules); the id itself when unknown. */
export interface EffectNames {
  tile(code: string): string | undefined;
  item(id: string): string | undefined;
  module(id: string): string | undefined;
}

/** What a (validated) effect does, in a few words: the Tower of Magic shows it under a spell (T22). */
export function describeEffect(e: Effect, names: EffectNames): string {
  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const radius = (r?: number) => (r ? `, raggio ${r}` : '');
  const lasting = (d?: number) => (d ? ` per ${d} s` : '');
  switch (e.type) {
    case 'message':
      return `un messaggio: «${e.text}»`;
    case 'needs':
      return ([['health', 'salute'], ['energy', 'energia'], ['hunger', 'fame'], ['thirst', 'sete']] as const).filter(([k]) => e[k]).map(([k, word]) => `${word} ${signed(e[k]!)}`).join(', ');
    case 'create_item':
      return `crea ${e.quantity ?? 1} × ${names.item(e.item) ?? e.item}`;
    case 'consume':
      return `consuma ${e.quantity ?? 1} × ${names.item(e.item) ?? e.item}`;
    case 'destroy':
      return 'distrugge ciò che ha davanti';
    case 'open':
      return 'apre ciò che ha davanti';
    case 'container':
      return `ne fa un contenitore${e.capacity ? ` da ${e.capacity} posti` : ''}`;
    case 'terrain':
      return `${e.from ? (names.tile(e.from) ?? e.from) : 'il terreno'} diventa ${names.tile(e.to) ?? e.to}${radius(e.radius)}`;
    case 'relief':
      return `${e.delta > 0 ? 'alza' : 'abbassa'} il terreno di ${Math.abs(e.delta)} ${Math.abs(e.delta) === 1 ? 'livello' : 'livelli'}${radius(e.radius)}`;
    case 'fire':
      return `fuoco${lasting(e.duration)}${radius(e.radius)}`;
    case 'light':
      return `luce${lasting(e.duration)}${radius(e.radius)}`;
    case 'shield':
      return `scudo${lasting(e.duration)}`;
    case 'push':
      return `spinge via${e.force ? ` (forza ${e.force})` : ''}`;
    case 'summon':
      return `evoca ${names.module(e.module) ?? e.module}`;
    case 'bond':
      return `diventa ${e.bond} di chi la pronuncia`;
    case 'memory':
      return `lascia un ricordo: «${e.text}»`;
    case 'birth':
      return `fa nascere ${e.name ?? 'qualcuno'}`;
    case 'state': {
      const what = [e.speed !== undefined && `velocità × ${e.speed}`, e.weight && `peso ${signed(e.weight)}`, e.light && `luce ${e.light}`].filter(Boolean).join(', ');
      return `stato «${e.name}»${what ? ` (${what})` : ''}${e.duration ? lasting(e.duration) : ' finché non si toglie'}`;
    }
    case 'remove_state':
      return `toglie lo stato «${e.name}»`;
  }
}
