// Plots: horizontal stories the Narrator weaves among people (in the manner of Westworld) — a
// mystery, the people involved, beats that happen on given days and moments of the day in given
// places, clues, and sometimes a request for the wanderer (a quest). They live in the universe
// (world/plots.json); the kernel plays the beats (people go there, say their line, remember it).

import type { FileMap } from './types';
import type { DayPhase } from './society';

export interface Beat {
  /** Day relative to the plot's start. */
  giorno: number;
  momento: DayPhase;
  chi: string;
  dove: string;
  cosa: string;
  battuta?: string;
  indizio?: string;
  fatto?: boolean;
}

export interface Quest {
  da: string;
  testo: string;
  obiettivo: { tipo: 'porta' | 'vai' | 'parla'; oggetto?: string; a?: string; luogo?: string };
  ricompensa?: string;
  stato: 'offerta' | 'accettata' | 'compiuta';
}

export interface Plot {
  id: string;
  titolo: string;
  mistero: string;
  coinvolti: string[];
  tappe: Beat[];
  missione?: Quest;
  /** Absolute day it started. */
  inizio: number;
  stato: 'attiva' | 'chiusa';
}

export const PLOTS_FILE = 'world/plots.json';

export function readPlots(files: FileMap): Plot[] {
  try {
    const p = JSON.parse(files[PLOTS_FILE] ?? '{}');
    return Array.isArray(p.trame) ? p.trame : [];
  } catch {
    return [];
  }
}

export function writePlots(plots: Plot[]): string {
  return JSON.stringify({ trame: plots.slice(-30) }, null, 2) + '\n';
}

/** What a person knows of the plots they are in: for their chat (hints, never confessions). */
export function secretsOf(plots: Plot[], name: string, day: number): string {
  const out: string[] = [];
  for (const p of plots) {
    if (p.stato !== 'attiva' || !p.coinvolti.includes(name)) continue;
    out.push(`- Trama «${p.titolo}»: ${p.mistero}`);
    for (const b of p.tappe) if (b.chi === name) out.push(`  · ${b.fatto ? 'hai già' : p.inizio + b.giorno > day ? 'dovrai' : 'devi'} ${b.cosa} (${b.dove}, ${b.momento})${b.indizio ? ` — indizio: ${b.indizio}` : ''}`);
    if (p.missione?.da === name && p.missione.stato === 'offerta') out.push(`  · Hai una richiesta per il viandante: ${p.missione.testo} (se te la chiede o se ti fidi, affidagliela con l'azione "missione")`);
  }
  return out.join('\n');
}

/** Quests the wanderer accepted and has not finished yet. */
export function activeQuests(plots: Plot[]): Array<{ plot: Plot; quest: Quest }> {
  return plots.filter((p) => p.missione?.stato === 'accettata').map((p) => ({ plot: p, quest: p.missione! }));
}
