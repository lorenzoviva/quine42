// What leaves the server of a universe, and to whom: pure functions on its files, light on purpose (the store on the dev
// server imports them, without the kernel). `playerFiles` is what a player's client draws and walks with (T41); `publicFiles`
// is what anyone who is not the master may read over HTTP (T120, ADR-0102).

import { ATLAS_FILE } from '../kernel/atlas';
import { CARDS_FILE } from '../kernel/cards';
import { RELIEF_PATH } from '../kernel/relief';
import type { FileMap } from '../kernel/types';
import { PER_WANDERER } from '../kernel/wanderers';
import type { FileChanges } from './protocol';

/**
 * The files a player's client gets (T41): what it draws and walks with. The universe's settings, the models, the
 * relief and the atlas; the modules' manifests without their code and their cases, but for the systems the client
 * runs itself (`PER_WANDERER`). Prompts, the bible, the rules, the people and their memories, the plots, the graph,
 * the cards, the costs and the other wanderers stay on the server: they are the studio's, the master's.
 */
export function playerFiles(files: FileMap): FileMap {
  const out: FileMap = {};
  for (const [path, text] of Object.entries(files)) {
    if (path === 'universe.json' || path === ATLAS_FILE || path === RELIEF_PATH || path.startsWith('models/')) out[path] = text;
    if (!/^modules\/[^/]+\/manifest\.json$/.test(path)) continue;
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(text);
    } catch {
      // Unreadable on the server too: the client fails on it the same way.
      out[path] = text;
      continue;
    }
    const dir = path.slice(0, -'manifest.json'.length);
    if (typeof m.logic === 'string' && PER_WANDERER.has(String(m.id)) && files[dir + m.logic] !== undefined) out[dir + m.logic] = files[dir + m.logic];
    else delete m.logic;
    delete m.casi;
    out[path] = JSON.stringify(m, null, 2) + '\n';
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
  for (const p of changed) if (files[p] === undefined && (dirOf(p) || p in playerFiles({ [p]: '' }))) out[p] = null;
  return out;
}

/** The fields of an object that are named here. */
function only(o: unknown, keys: string[]): Record<string, unknown> {
  const from = o && typeof o === 'object' ? (o as Record<string, unknown>) : {};
  return Object.fromEntries(keys.filter((k) => from[k] !== undefined).map((k) => [k, from[k]]));
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
 * and the lobby show of it. The cards with who holds them and what they are called, a person's trade but not their story or
 * memories, a plot's title but not its steps, the world's one-line concept. No code, no prompts, no balances, no ledgers.
 */
export function publicFiles(files: FileMap): FileMap {
  const out = playerFiles(files);
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
