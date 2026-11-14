// The game of a universe (ADR-0053): what is chosen before the Genesis and never changed after —
// the mode, how punishing death is, PvP, «Altro…» between players. The Council builds on it (an
// ability the death can take away, a treasure worth the risk), so it goes with its requests as a
// principle; on death the Narrator turns the level into what is lost and where one wakes up.

import type { GameSetup } from './types';
import { internalName } from './internalNames';

/** The levels of the death, from 0 to 4: what the Council reads, what the Genesis screen shows. */
export const DEATH_LEVELS: ReadonlyArray<{ nome: string; testo: string }> = [
  { nome: 'nessuna', testo: 'ci si rialza dove si è caduti, con tutto ciò che si porta: resta solo il ricordo' },
  { nome: 'lieve', testo: 'si riapre gli occhi nella piazza con ciò che si porta; al più si perde una cosa sola, la più fragile' },
  { nome: 'media', testo: 'si riapre gli occhi nella piazza e si perde una parte di ciò che si porta (le cose di valore, le provviste)' },
  { nome: 'dura', testo: 'si riapre gli occhi nella piazza senza niente di ciò che si portava, e senza le condizioni di prima' },
  { nome: 'spietata', testo: 'si perde tutto: ciò che si porta, le condizioni, i vantaggi conquistati; nessuna abilità o progresso del viandante deve sopravvivere alla morte' },
];

/** The game of today: one player, death as hard as it was before the choice existed. */
export const DEFAULT_GAME_SETUP: GameSetup = { mode: 'single', death: 3, pvp: false, freeActionsBetweenPlayers: true };

export const deathLevel = (p: GameSetup) => DEATH_LEVELS[p.death] ?? DEATH_LEVELS[DEFAULT_GAME_SETUP.death];

/** The same levels as the Council reads them (T310: the prompts are English; the Genesis screen shows DEATH_LEVELS). */
const DEATH_RULES: readonly string[] = [
  'none: one gets up where one fell, with everything one carries: only the memory remains',
  'light: one opens one\'s eyes again in the square with what one carries; at most one thing is lost, the most fragile',
  'medium: one opens one\'s eyes again in the square and loses part of what one carries (the valuables, the provisions)',
  'hard: one opens one\'s eyes again in the square with nothing of what one carried, and without the conditions of before',
  'ruthless: everything is lost: what one carries, the conditions, the advantages won; no ability or progress of the wanderer may survive death',
];

/** The punishment of a level of the death as the Council reads it: «hard (3 of 4): …». */
export function deathRule(level: number): string {
  const i = DEATH_RULES[level] !== undefined ? level : DEFAULT_GAME_SETUP.death;
  const [name, text] = DEATH_RULES[i].split(/: (.*)/s);
  return `${name} (${i} of 4): ${text}`;
}

/**
 * Whether a universe's `partita.modalita`, as read, is a game of many (T307b): `multiplayer`, or `multigiocatore` of a universe of the
 * contract 0.2 not ported yet (a server reads universe.json before any kernel boots it: such a game must not look like a game alone).
 */
export const isMultiplayer = (modalita: unknown): boolean => typeof modalita === 'string' && internalName('partita', modalita) === 'multiplayer';

/** The game as a principle of the Council: with every task of who builds on it. */
export function gameSetupSummary(p: GameSetup): string {
  return [
    '## The game (chosen before the Genesis, it never changes)',
    `- Death is ${deathRule(p.death)}. What you introduce (abilities, treasures, bonds, mechanics) must stay consistent with this punishment.`,
    p.mode === 'multiplayer'
      ? `- Several wanderers play. Between them: ${p.pvp ? 'they can hurt each other' : 'they cannot hurt each other'}; ${p.freeActionsBetweenPlayers ? '"Altro…" (a free action) can be done on another wanderer too' : '"Altro…" (a free action) is not done on another wanderer'}.`
      : '- One plays alone: a single wanderer.',
  ].join('\n');
}

/** What death costs when the Narrator is silent (offline, or the call failed): the level, literally. */
export interface DeathVerdict {
  story: string;
  /** The wanderer loses everything they carry (and their conditions). */
  loseAll: boolean;
  /** Where they wake up: where they fell, or the square (ids since T310b, `ripartenza`). */
  restart: 'here' | 'square';
  /** Effects of the closed set (validated by the kernel): what else is lost. */
  effects: unknown[];
}

export function fallbackDeath(level: number, carried: Array<{ name: string; count: number }>): DeathVerdict {
  switch (level) {
    case 0:
      return { story: 'Ti rialzi nel punto della caduta. Hai ancora tutto con te.', loseAll: false, restart: 'here', effects: [] };
    case 1:
      return { story: 'Riapri gli occhi nella piazza. Le tue cose sono ancora con te.', loseAll: false, restart: 'square', effects: [] };
    case 2:
      return {
        story: 'Riapri gli occhi nella piazza. Metà di ciò che portavi è andata perduta.',
        loseAll: false,
        restart: 'square',
        effects: carried.filter((c) => c.count >= 2).map((c) => ({ type: 'consume', item: c.name, quantity: Math.floor(c.count / 2) })),
      };
    case 4:
      return { story: 'Riapri gli occhi nella piazza. Non ti resta niente, nemmeno ciò che avevi imparato a essere.', loseAll: true, restart: 'square', effects: [] };
    default:
      return { story: 'Riapri gli occhi nella piazza. È un nuovo giorno, e una nuova vita.', loseAll: true, restart: 'square', effects: [] };
  }
}
