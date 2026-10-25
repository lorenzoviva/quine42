// Cloning a universe with another master (T42d, ADR-0068): the master of a game of many never changes
// (ADR-0065); who wants another one copies the universe — the same world, the same history, the same cards —
// into a new one whose `partita.master` is someone else. The cards stay with who wrote and paid for them
// (`autore`, `pagante`); whose they are (`titolare`) stays too, unless the clone hands the old master's cards to
// the new one. Pure functions: the store copies the repository on disk and commits what they return.

// Light on purpose: the store on the dev server imports it, without the validator nor the engines.
import type { Carta } from './cards';
import { SOLO, validWandererId } from './wanderers';
import type { FileMap } from './types';

/** A universe's name: a folder of `universes/` (as the store wants it). */
export const UNIVERSE_NAME_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

export interface CloneOptions {
  /** The new universe's name. */
  nome: string;
  /** The new master's wanderer id. */
  master: string;
  /** Whose the old master's cards become: theirs still (default), or the new master's. */
  titolari?: 'restano' | 'master';
}

const parse = (src: string | undefined): any => {
  try {
    return JSON.parse(src ?? 'null');
  } catch {
    return null;
  }
};

const indentOf = (src: string) => /\n( +)"/.exec(src)?.[1].length ?? 2;

const isCarta = (c: any): c is Carta => !!c && typeof c === 'object' && typeof c.autore === 'string' && typeof c.pagante === 'string' && typeof c.titolare === 'string';

/** The files where cards live: manifests, the library's index, people, plots, rules, the places' cards. */
const cardFile = (path: string) => /^modules\/[^/]+\/manifest\.json$/.test(path) || ['models/index.json', 'world/people.json', 'world/plots.json', 'world/rules.json', 'world/carte.json'].includes(path);

/** Every card whose `titolare` is `from` becomes `to`'s; who wrote it and who paid for it stay. Returns the files it rewrote. */
export function passCards(files: FileMap, from: string, to: string): FileMap {
  const out: FileMap = {};
  for (const path of Object.keys(files).sort()) {
    if (!cardFile(path)) continue;
    const data = parse(files[path]);
    let changed = false;
    const walk = (o: unknown) => {
      if (!o || typeof o !== 'object') return;
      if (isCarta(o) && o.titolare === from) {
        o.titolare = to;
        changed = true;
      }
      for (const v of Object.values(o)) walk(v);
    };
    walk(data);
    if (changed) out[path] = JSON.stringify(data, null, indentOf(files[path])) + '\n';
  }
  return out;
}

/**
 * What a clone changes in the copied files: its name and its master in universe.json (the rest of the game stays as
 * it was chosen at the Genesis), and the old master's cards if they pass. Throws with the reason when it cannot be.
 */
export function cloneChanges(files: FileMap, opts: CloneOptions): { changes: FileMap; from: string } {
  if (!UNIVERSE_NAME_RE.test(opts.nome)) throw new Error(`nome non valido: ${opts.nome}`);
  if (!validWandererId(opts.master)) throw new Error(`viandante non valido: ${opts.master}`);
  const raw = parse(files['universe.json']) ?? {};
  const game = raw.partita && typeof raw.partita === 'object' ? raw.partita : {};
  if (game.modalita !== 'multigiocatore') throw new Error('solo un universo in multigiocatore ha un master da cambiare');
  // As repairPartita reads it: a master that is not a wanderer id is the one who plays alone.
  const from: string = validWandererId(game.master) ? game.master : SOLO;
  if (from === opts.master) throw new Error(`«${opts.master}» è già il master di questo universo`);
  const changes: FileMap = { ...(opts.titolari === 'master' ? passCards(files, from, opts.master) : {}) };
  changes['universe.json'] = JSON.stringify({ ...raw, name: opts.nome, partita: { ...game, master: opts.master } }, null, 2) + '\n';
  return { changes, from };
}
