// The launcher of the home (T233): what the panel that starts the game says, from what the server answers. Pure and light: no DOM, no
// sign-in, no three.js, so the landing carries only this, and the pages with an account take the universe they remember from here too.
// It reads only what the site already asks (`/api/universe`, `/api/session`): no route of its own.

import { UNIVERSE_NAME_RE } from '../src/kernel/paths';

/** The site remembers the universe (the landing, the profile, the credits, the labs). */
export const UNIVERSE_KEY = 'quine:sito:reame';

/** At most so many universes in the panel's list, and so many rows of those being played: a launcher, not the sessions' hub. */
export const LAUNCH_LIMITS = { universes: 144, live: 5 } as const;

export function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function store(key: string, value: string | undefined): void {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* a browser that keeps nothing: the page asks again */
  }
}

/** The universe to show: the one in the address, the last one seen, or the first. */
export function pickUniverse(universes: string[], asked: string | null, last: string | null): string | undefined {
  if (asked && universes.includes(asked)) return asked;
  if (last && universes.includes(last)) return last;
  return universes[0];
}

/** A universe being played, and by how many. */
export interface LiveUniverse {
  name: string;
  clients: number;
}

/** What the panel shows. */
export interface Launch {
  /** Whether the server answered with its universes. */
  online: boolean;
  /** The universes to choose from: those being played first, the most crowded first, then the others as the server lists them. */
  universes: string[];
  chosen?: string;
  /** The universes with someone in them now. */
  live: LiveUniverse[];
  /** How many wanderers are in a universe now, all together. */
  playing: number;
  /** Where GIOCA leads. */
  href: string;
}

/** The names in `/api/universe`'s answer, or undefined if the server keeps no universes (or did not answer). Only what is a name. */
export function readUniverses(body: unknown): string[] | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const { available, universes } = body as { available?: unknown; universes?: unknown };
  if (available !== true) return undefined;
  if (!Array.isArray(universes)) return [];
  const names = universes.filter((n): n is string => typeof n === 'string' && UNIVERSE_NAME_RE.test(n));
  return [...new Set(names)].slice(0, LAUNCH_LIMITS.universes);
}

/** The worlds in `/api/session`'s answer that have someone in them; a field that is not what it should be counts as nothing. */
export function readSessions(body: unknown): LiveUniverse[] {
  const sessions = body && typeof body === 'object' ? (body as { sessions?: unknown }).sessions : undefined;
  if (!Array.isArray(sessions)) return [];
  const out = new Map<string, number>();
  for (const s of sessions) {
    if (!s || typeof s !== 'object') continue;
    const { name, active, clients } = s as { name?: unknown; active?: unknown; clients?: unknown };
    if (typeof name !== 'string' || !UNIVERSE_NAME_RE.test(name) || active === false) continue;
    const n = typeof clients === 'number' && Number.isFinite(clients) ? Math.min(Math.max(0, Math.floor(clients)), 9999) : 0;
    if (n > 0) out.set(name, Math.max(out.get(name) ?? 0, n));
  }
  return [...out].map(([name, clients]) => ({ name, clients }));
}

/** Where the game opens a universe; without one, the game as it starts. */
export function playHref(universe?: string): string {
  return universe ? `../index.html?${new URLSearchParams({ universo: universe })}` : '../index.html';
}

/**
 * The panel from the two answers. `universes` undefined: the server did not answer, the game starts in this browser. A universe being
 * played that the list does not name is not shown: what the panel offers is what the server keeps.
 */
export function launchOf(universes: string[] | undefined, sessions: LiveUniverse[], asked: string | null, last: string | null): Launch {
  if (!universes) return { online: false, universes: [], live: [], playing: 0, href: playHref() };
  const known = new Set(universes);
  const live = sessions.filter((s) => known.has(s.name)).sort((a, b) => b.clients - a.clients || (a.name < b.name ? -1 : 1));
  const first = live.map((s) => s.name);
  const ordered = [...first, ...universes.filter((n) => !first.includes(n))];
  const chosen = pickUniverse(ordered, asked, last);
  return {
    online: true,
    universes: ordered,
    chosen,
    live: live.slice(0, LAUNCH_LIMITS.live),
    playing: live.reduce((sum, s) => sum + s.clients, 0),
    href: playHref(chosen),
  };
}

/** The line under the panel's button: how many universes, and how many wanderers in them now. */
export function launchNote(launch: Launch): string {
  if (!launch.online) return 'Il server non risponde: il gioco parte in questo browser.';
  const n = launch.universes.length;
  if (!n) return 'Ancora nessun universo su questo server.';
  const kept = `${n} ${n === 1 ? 'universo' : 'universi'} su questo server`;
  if (!launch.playing) return `${kept}.`;
  return `${kept}, ${launch.playing} ${launch.playing === 1 ? 'viandante' : 'viandanti'} in gioco ora.`;
}
