// What leaves the server of a universe, and to whom: pure functions on its files, light on purpose (the store on the dev
// server imports them, without the kernel). `playerFiles` is what a player's client draws and walks with (T41); `publicFiles`
// is what anyone who is not the master may read over HTTP (T120, ADR-0102). Both are lists of what goes, not of what stays (T130, ADR-0109).

import { ATLAS_FILE } from '../kernel/atlas';
import { CARDS_FILE } from '../kernel/cards';
import { RELIEF_PATH } from '../kernel/relief';
import type { FileMap } from '../kernel/types';
import { PER_WANDERER } from '../kernel/wanderers';
import type { FileChanges } from './protocol';

/** What a client reads of `universe.json`. Not `ai` (budgets, models, providers), not the theme's path, not the heritage. */
const UNIVERSE_FIELDS = ['name', 'seed', 'circleRadius', 'chunkSize', 'rilievo'];
const GAME_FIELDS = ['modalita', 'morte', 'pvp', 'altroTraGiocatori', 'master'];
/** What the lobby and the site's pages show of `ai`, and what the hourly estimate reads (`publicFiles` only). Not `provider`, `agenti`, `thinking`, `timeout`. */
const LOBBY_AI_FIELDS = ['textModel', 'scultori', 'coefficienti', 'minimi', 'maxText', 'maxForges', 'maxPacks', 'maxCast', 'maxModels', 'attore'];

/**
 * What a client reads of a manifest. An entity in the world reaches it from the server (form, body, menu: `ENTITY_PARTS`), so
 * what spawns it is not here: `spawn`, `interaction`, `container`, `inventory`, `loot`, `layouts`, `fragments`, `drops`; nor what only the
 * Council reads: `persona`, `lore`, `context`, `prompts`, `origin`; nor `casi`. A field added to `Manifest` stays home until it is
 * named here. `carta` is on the list because anyone may read it (`publicFiles`, ADR-0102). `ui` is whole: it is the panel drawn.
 */
const MANIFEST_FIELDS = ['id', 'name', 'kind', 'version', 'description', 'order', 'physics', 'tags', 'item', 'roof', 'ui', 'carta'];
/** Only for the modules that make up the client's own wanderer and carpet: the others' entities come from the server. */
const OWN_FIELDS = ['components', 'singleton', 'persist'];
const APPEARANCE_FIELDS = ['glyph', 'color', 'model', 'classe', 'taglia'];
const ITEM_FIELDS = ['id', 'name', 'description', 'category', 'weight', 'stack', 'tags', 'glyph', 'color', 'model', 'equippable', 'effects', 'container', 'module', 'bonus', 'slot', 'carta'];
const TILE_FIELDS = ['name', 'color', 'solid', 'speed', 'description', 'layer', 'indoor', 'model'];
const RECIPE_FIELDS = ['id', 'name', 'inputs', 'tools', 'output', 'carta'];
const RUNE_FIELDS = ['name', 'glyph', 'color', 'element', 'description', 'carta'];
const SPELL_FIELDS = ['name', 'description', 'cost', 'carta'];
const LAYOUT_FIELDS = ['name', 'description', 'carta'];

/** The fields of an object that are named here. */
function only(o: unknown, keys: string[]): Record<string, unknown> {
  const from = o && typeof o === 'object' ? (o as Record<string, unknown>) : {};
  return Object.fromEntries(keys.filter((k) => from[k] !== undefined).map((k) => [k, from[k]]));
}

/** A JSON object, or undefined if the text is not one. */
function parsed(text: string | undefined): Record<string, unknown> | undefined {
  if (text === undefined) return undefined;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

type Fields = Record<string, unknown>;
const eachOf = (list: unknown, fn: (e: Fields) => unknown) => (Array.isArray(list) ? list.map((e) => fn(e ?? {})) : undefined);
const eachValue = (o: unknown, fn: (e: Fields) => unknown) => (o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fn((v ?? {}) as Fields)])) : undefined);

/** An action of a menu: its label, and which effects it has (the inventory shows its button then), never what they say. */
function actionShown(a: Fields): Fields {
  return { ...only(a, ['id', 'label', 'requires']), ...(Array.isArray(a.effects) ? { effects: a.effects.map((e) => only(e, ['tipo'])) } : {}) };
}

function withActions(o: Fields, fields: string[]): Fields {
  const actions = eachOf(o.actions, actionShown);
  return { ...only(o, fields), ...(actions ? { actions } : {}) };
}

function manifestShown(m: Fields, logic: boolean): Fields {
  const own = m.kind === 'player' || PER_WANDERER.has(String(m.id));
  const parts: Array<[string, unknown]> = [
    ['logic', logic ? m.logic : undefined],
    ['appearance', m.appearance === undefined ? undefined : only(m.appearance, APPEARANCE_FIELDS)],
    ['actions', eachOf(m.actions, actionShown)],
    ['items', eachOf(m.items, (it) => withActions(it, ITEM_FIELDS))],
    ['tiles', eachValue(m.tiles, (t) => withActions(t, TILE_FIELDS))],
    ['recipes', eachOf(m.recipes, (r) => only(r, RECIPE_FIELDS))],
    ['runes', eachValue(m.runes, (r) => only(r, RUNE_FIELDS))],
    ['spells', eachValue(m.spells, (s) => only(s, SPELL_FIELDS))],
  ];
  return { ...only(m, MANIFEST_FIELDS), ...(own ? only(m, OWN_FIELDS) : {}), ...Object.fromEntries(parts.filter(([, v]) => v !== undefined)) };
}

/** The settings a client reads, with these fields of `ai` if any. A file that cannot be read says nothing. */
function configShown(text: string | undefined, fields: string[], aiFields: string[] = []): string | undefined {
  const raw = parsed(text);
  if (!raw) return undefined;
  const ai = only(raw.ai, aiFields);
  return JSON.stringify({ ...only(raw, fields), ...(raw.partita !== undefined ? { partita: only(raw.partita, GAME_FIELDS) } : {}), ...(Object.keys(ai).length ? { ai } : {}) }, null, 2) + '\n';
}

/** Whether a file outside the modules and the settings is one a player's client has, as it is. */
const shownWhole = (path: string) => path === ATLAS_FILE || path === RELIEF_PATH || path.startsWith('models/');

/**
 * The files a player's client gets (T41, T130): what it draws and walks with. Of `universe.json` and of the modules' manifests
 * only the fields named above; the models, the relief and the atlas; the code only of the systems the client runs itself
 * (`PER_WANDERER`). Prompts, the bible, the rules, the people and their memories, the plots, the graph, the cards, the costs and
 * the other wanderers stay on the server: they are the studio's, the master's.
 */
export function playerFiles(files: FileMap): FileMap {
  const out: FileMap = {};
  for (const [path, text] of Object.entries(files)) {
    if (shownWhole(path)) out[path] = text;
    if (path === 'universe.json') {
      const shown = configShown(text, UNIVERSE_FIELDS);
      if (shown !== undefined) out[path] = shown;
    }
    if (!/^modules\/[^/]+\/manifest\.json$/.test(path)) continue;
    // Unreadable: it is the server's fault, and its text may be anything. The client goes without that module.
    const m = parsed(text);
    if (!m) continue;
    const dir = path.slice(0, -'manifest.json'.length);
    const logic = typeof m.logic === 'string' && PER_WANDERER.has(String(m.id)) && files[dir + m.logic] !== undefined;
    if (logic) out[dir + m.logic] = files[dir + m.logic];
    out[path] = JSON.stringify(manifestShown(m, logic), null, 2) + '\n';
  }
  return out;
}

/**
 * What a player's client gets of the files that changed (T42b), as `playerFiles` gives them: a module goes again whole (its
 * manifest without code, its code only for `PER_WANDERER`), a file gone goes as null if it is one a client would have.
 */
export function playerChanges(files: FileMap, changed: string[]): FileChanges {
  const dirOf = (p: string) => /^modules\/[^/]+\//.exec(p)?.[0];
  const dirs = new Set<string>();
  const subset: FileMap = {};
  for (const p of changed) {
    const d = dirOf(p);
    if (d) dirs.add(d);
    else if (files[p] !== undefined) subset[p] = files[p];
  }
  for (const [p, v] of Object.entries(files)) if (dirs.has(dirOf(p) ?? '')) subset[p] = v;
  const out: FileChanges = { ...playerFiles(subset) };
  for (const p of changed) if (files[p] === undefined && (dirOf(p) || p === 'universe.json' || shownWhole(p))) out[p] = null;
  return out;
}

/** A list inside a JSON file, each entry cut down to these fields; undefined if the file is not there or not readable. */
function cutDown(text: string | undefined, list: string, keys: string[]): string | undefined {
  if (text === undefined) return undefined;
  try {
    const entries = JSON.parse(text)?.[list];
    return JSON.stringify({ [list]: (Array.isArray(entries) ? entries : []).map((e) => only(e, keys)) });
  } catch {
    return undefined;
  }
}

/**
 * What anyone who is not the master may read of a universe over HTTP: what a player's client gets, and what the site's pages
 * and the lobby show of it. The cards with who holds them and what they are called, an individual's trade but not their story or
 * memories, a plot's title but not its steps, the world's one-line concept, an environment's name but not its program, of `ai`
 * what the lobby shows. No code, no prompts, no balances, no ledgers.
 */
export function publicFiles(files: FileMap): FileMap {
  const out = playerFiles(files);
  const config = configShown(files['universe.json'], [...UNIVERSE_FIELDS, 'eredita'], LOBBY_AI_FIELDS);
  if (config !== undefined) out['universe.json'] = config;
  for (const path of Object.keys(out)) {
    if (!path.endsWith('/manifest.json')) continue;
    const layouts = eachValue(parsed(files[path])?.layouts, (l) => only(l, LAYOUT_FIELDS));
    if (layouts) out[path] = JSON.stringify({ ...JSON.parse(out[path]), layouts }, null, 2) + '\n';
  }
  if (files[CARDS_FILE] !== undefined) out[CARDS_FILE] = files[CARDS_FILE];
  const cut: Array<[string, string | undefined]> = [
    ['world/people.json', cutDown(files['world/people.json'], 'persone', ['nome', 'tipo', 'origine', 'mestiere', 'carta'])],
    ['world/plots.json', cutDown(files['world/plots.json'], 'trame', ['id', 'titolo', 'carta'])],
    ['world/rules.json', cutDown(files['world/rules.json'], 'regole', ['chiave', 'testo', 'carta'])],
  ];
  for (const [path, text] of cut) if (text !== undefined) out[path] = text;
  if (files['world/bible.json'] !== undefined) {
    try {
      out['world/bible.json'] = JSON.stringify(only(JSON.parse(files['world/bible.json']), ['concetto', 'tema']));
    } catch {
      /* unreadable: nothing to say of the world */
    }
  }
  return out;
}
