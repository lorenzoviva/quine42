// The game of a universe (ADR-0053): what is chosen before the Genesis and never changed after —
// the mode, how punishing death is, PvP, «Altro…» between players. The Council builds on it (an
// ability the death can take away, a treasure worth the risk), so it goes with its requests as a
// principle; on death the Narrator turns the level into what is lost and where one wakes up.

import type { Partita } from './types';

/** The levels of the death, from 0 to 4: what the Council reads, what the Genesis screen shows. */
export const DEATH_LEVELS: ReadonlyArray<{ nome: string; testo: string }> = [
  { nome: 'nessuna', testo: 'ci si rialza dove si è caduti, con tutto ciò che si porta: resta solo il ricordo' },
  { nome: 'lieve', testo: 'si riapre gli occhi nella piazza con ciò che si porta; al più si perde una cosa sola, la più fragile' },
  { nome: 'media', testo: 'si riapre gli occhi nella piazza e si perde una parte di ciò che si porta (le cose di valore, le provviste)' },
  { nome: 'dura', testo: 'si riapre gli occhi nella piazza senza niente di ciò che si portava, e senza le condizioni di prima' },
  { nome: 'spietata', testo: 'si perde tutto: ciò che si porta, le condizioni, i vantaggi conquistati; nessuna abilità o progresso del viandante deve sopravvivere alla morte' },
];

/** The game of today: one player, death as hard as it was before the choice existed. */
export const DEFAULT_PARTITA: Partita = { modalita: 'singola', morte: 3, pvp: false, altroTraGiocatori: true };

export const deathLevel = (p: Partita) => DEATH_LEVELS[p.morte] ?? DEATH_LEVELS[DEFAULT_PARTITA.morte];

/** The game as a principle of the Council: with every task of who builds on it. */
export function partitaSummary(p: Partita): string {
  const d = deathLevel(p);
  return [
    '## La partita (scelta prima della Genesi, non cambia più)',
    `- La morte è ${d.nome} (${p.morte} su 4): ${d.testo}. Ciò che introduci (abilità, tesori, legami, meccaniche) deve restare coerente con questa punizione.`,
    p.modalita === 'multigiocatore'
      ? `- Si gioca in più viandanti. Tra loro: ${p.pvp ? 'possono ferirsi' : 'non possono ferirsi'}; ${p.altroTraGiocatori ? '«Altro…» si può fare anche su un altro viandante' : '«Altro…» non si fa su un altro viandante'}.`
      : '- Si gioca da soli: un solo viandante.',
  ].join('\n');
}

/** What death costs when the Narrator is silent (offline, or the call failed): the level, literally. */
export interface DeathVerdict {
  story: string;
  /** The wanderer loses everything they carry (and their conditions). */
  loseAll: boolean;
  /** Where they wake up: where they fell, or the square. */
  restart: 'qui' | 'piazza';
  /** Effects of the closed set (validated by the kernel): what else is lost. */
  effects: unknown[];
}

export function fallbackDeath(level: number, carried: Array<{ name: string; count: number }>): DeathVerdict {
  switch (level) {
    case 0:
      return { story: 'Ti rialzi nel punto della caduta. Hai ancora tutto con te.', loseAll: false, restart: 'qui', effects: [] };
    case 1:
      return { story: 'Riapri gli occhi nella piazza. Le tue cose sono ancora con te.', loseAll: false, restart: 'piazza', effects: [] };
    case 2:
      return {
        story: 'Riapri gli occhi nella piazza. Metà di ciò che portavi è andata perduta.',
        loseAll: false,
        restart: 'piazza',
        effects: carried.filter((c) => c.count >= 2).map((c) => ({ tipo: 'consuma', oggetto: c.name, quantita: Math.floor(c.count / 2) })),
      };
    case 4:
      return { story: 'Riapri gli occhi nella piazza. Non ti resta niente, nemmeno ciò che avevi imparato a essere.', loseAll: true, restart: 'piazza', effects: [] };
    default:
      return { story: 'Riapri gli occhi nella piazza. È un nuovo giorno, e una nuova vita.', loseAll: true, restart: 'piazza', effects: [] };
  }
}
