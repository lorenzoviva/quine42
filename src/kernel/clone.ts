// Cloning a universe with another master (T42d, ADR-0068): the master of a multiplayer game never changes
// (ADR-0065); who wants another one copies the universe — the same world, the same history, the same cards —
// into a new one whose `partita.master` is someone else. The cards stay with who wrote and paid for them
// (`autore`, `pagante`); whose they are (`titolare`) stays too, unless the clone hands the old master's cards to
// the new one. Every card gets one more link in its chain of origins (T45c, ADR-0084: who held it and what it was), and
// the uses it had are kept apart (`allaNascita` in world/cards.json): what the clone owes along the chain is counted
// from there. Pure functions: the store copies the repository on disk and commits what they return.

// Light on purpose: the store on the dev server imports it, without the validator nor the engines.
import type { CardStamp } from './cards';
import { contentText, fingerprint, readOrigins } from './heritage';
import { UNIVERSE_NAME_RE } from './paths';
import { SOLO, validWandererId } from './wanderers';
import type { FileMap } from './types';
import { internalFields } from './internalNames';

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

const isCardStamp = (c: any): c is CardStamp => !!c && typeof c === 'object' && typeof c.author === 'string' && typeof c.payer === 'string' && typeof c.holder === 'string';

/** The files where cards live: manifests, the library's index, people, plots, rules, the places' cards. */
const cardFile = (path: string) => /^modules\/[^/]+\/manifest\.json$/.test(path) || ['models/index.json', 'world/people.json', 'world/plots.json', 'world/rules.json', 'world/cards.json'].includes(path);

/** Every card whose `holder` is `from` becomes `to`'s; who wrote it and who paid for it stay. Returns the files it rewrote. */
export function passCards(files: FileMap, from: string, to: string): FileMap {
  const out: FileMap = {};
  for (const path of Object.keys(files).sort()) {
    if (!cardFile(path)) continue;
    const data = parse(files[path]);
    let changed = false;
    const walk = (o: unknown) => {
      if (!o || typeof o !== 'object') return;
      if (isCardStamp(o) && o.holder === from) {
        o.holder = to;
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
 * Every card of the files remembers where it comes from: one more origin — its holder now, the universe, the
 * fingerprint of what holds it (a module with its code; a place, whose plan is never rewritten, by its name) — and
 * passes from `from` to `to` if given. The ledger keeps the uses so far apart. Returns the files it rewrote.
 */
export function inheritCards(files: FileMap, universo: string, from?: string, to?: string): FileMap {
  const out: FileMap = {};
  for (const path of Object.keys(files).sort()) {
    if (!cardFile(path)) continue;
    const data = parse(files[path]);
    if (!data || typeof data !== 'object') continue;
    let changed = false;
    const link = (c: CardStamp, content: string) => {
      c.origins = [...readOrigins(c.origins), { holder: c.holder, universe: universo, fingerprint: fingerprint(content) }];
      if (from !== undefined && to !== undefined && c.holder === from) c.holder = to;
      changed = true;
    };
    if (path === 'world/cards.json') {
      for (const c of Object.values((data.chunks ?? {}) as Record<string, CardStamp & { name?: string }>)) if (isCardStamp(c)) link(c, String(c.name ?? ''));
      const born: Record<string, Record<string, number>> = {};
      for (const [id, u] of Object.entries((data.uses ?? {}) as Record<string, Record<string, number>>)) born[id] = { ...u };
      data.atBirth = born;
      changed = true;
    } else {
      const logic = /^modules\/[^/]+\/manifest\.json$/.test(path) && typeof data.logic === 'string' ? files[path.replace(/manifest\.json$/, data.logic)] ?? '' : '';
      const walk = (o: unknown, root: boolean) => {
        if (!o || typeof o !== 'object') return;
        const c = (o as { card?: unknown }).card;
        if (isCardStamp(c)) link(c, contentText(o) + (root ? logic : ''));
        for (const [k, v] of Object.entries(o)) if (k !== 'card') walk(v, false);
      };
      walk(data, true);
    }
    if (changed) out[path] = JSON.stringify(data, null, indentOf(files[path])) + '\n';
  }
  return out;
}

/**
 * What a clone changes in the copied files: its name and its master in universe.json (the rest of the game stays as
 * it was chosen at the Genesis), one more origin on every card, and the old master's cards if they pass. Throws with
 * the reason when it cannot be.
 */
export function cloneChanges(files: FileMap, opts: CloneOptions): { changes: FileMap; from: string } {
  if (!UNIVERSE_NAME_RE.test(opts.nome)) throw new Error(`nome non valido: ${opts.nome}`);
  if (!validWandererId(opts.master)) throw new Error(`viandante non valido: ${opts.master}`);
  const raw = internalFields('config', parse(files['universe.json']) ?? {});
  const game = raw.game && typeof raw.game === 'object' ? raw.game : {};
  if (game.mode !== 'multiplayer') throw new Error('solo un universo in multigiocatore ha un master da cambiare');
  // As repairGameSetup reads it: a master that is not a wanderer id is the one who plays alone.
  const from: string = validWandererId(game.master) ? game.master : SOLO;
  if (from === opts.master) throw new Error(`«${opts.master}» è già il master di questo universo`);
  const changes: FileMap = inheritCards(files, typeof raw.name === 'string' ? raw.name : '', from, opts.titolari === 'master' ? opts.master : undefined);
  changes['universe.json'] = JSON.stringify({ ...raw, name: opts.nome, game: { ...game, master: opts.master } }, null, 2) + '\n';
  return { changes, from };
}
