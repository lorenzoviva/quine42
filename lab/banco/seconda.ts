// The second request of the bench (T173): what the game does with what is invalid, «it goes back, with the reason, to the agent responsible».
// An attempt that does not pass gets its own XML back, with the defects measured or, if the measures pass and the photos do not, the problems written
// by who judged them. The prompt stays the same: everything new is in the message.

import type { SizeTier } from '../../src/mj/classes';
import type { Perso, Piano, Porta } from './misure';

/** What each measure says, for who only reads the prompt and has never seen the bench. The numbers stay those of `SOGLIA`. */
export const SIGNIFICATO: Record<string, string> = {
  finisce: 'il programma non finisce nel tempo del gioco',
  valido: 'i controlli del gioco lo rifiutano',
  piani: 'i piani coperti a cui il corpo arriva a piedi, solo camminando sulle scale',
  testa: "l'altezza libera dal pavimento al soffitto, in caselle, per ogni piano raggiunto",
  stanze: 'le stanze raggiunte, contando come stanza ciò che resta chiudendo i passaggi stretti: arredi in mezzo e tratti isolati le fanno sparire',
  cantina: 'il pavimento sotto il suolo dove il corpo arriva, in caselle²',
  murato: 'il pavimento coperto dove il corpo starebbe e non arriva, a pezzi grandi come un piano, in rapporto a quello che raggiunge',
  porta: 'la porta sul davanti, con la strada dritta e scoperta fino al bordo',
  salti: 'i posti distinti dove il corpo atterra saltando, su pavimenti a cui arriva anche a piedi',
  materiali: 'le lettere con almeno lo 0,2 % dei voxel',
  dominante: 'la parte dei voxel che ha la lettera più usata',
  finestre: 'le finestre viste da fuori e i lati su cui stanno',
  dettagli: 'i pezzi piccoli di una lettera sulle quattro facciate, e i lati che ne hanno meno di 3',
  rumore: 'fra quei pezzi, i voxel isolati',
  sagoma: 'le altezze diverse della cima, ciascuna su almeno l’1,5 % della pianta',
  rilievo: 'la parte delle facciate fuori dal loro piano principale',
  ingombro: 'la parte della pianta della scatola occupata',
  statico: 'semi diversi danno lo stesso edificio: la forma deve dipendere dal seme',
  voxel: 'i voxel pieni in un seme solo, sul totale, mediana delle coppie di semi',
  pianta: 'le colonne occupate in un seme solo, sul totale, mediana delle coppie di semi',
  perimetro: 'la parte del contorno esterno lontana da quello di un altro seme',
  interno: 'il pavimento coperto raggiunto in un seme solo, sul totale',
  'piani e stanze': 'quante liste diverse di quote dei piani e di stanze per piano danno i semi',
  architetture: 'i semi che sono davvero un altro edificio',
  scatola: 'il programma deve usare la scatola che riceve, senza una size sua',
};

export interface Esame {
  /** The defects, as the measures give them; if the game refused it, its reason. */
  difetti: string[];
  piani?: Piano[];
  persi?: Perso[];
  porta?: Porta;
  /** The problems written by who looked at the photos. */
  problemi?: string;
  /** What the program did, node by node (`traceText`, T179), if the bench was asked for it. */
  traccia?: string;
}

export function rigaDifetto(d: string): string {
  // With variance (T182) a defect says first where it falls: `enorme (…), seme 3: piani: 1`, `varianza a grande: perimetro: 0`.
  const senza = d.replace(/^(?:.*?, seme \d+(?: e altri \d+)?|varianza a \S+): /, '');
  const senso = SIGNIFICATO[senza.slice(0, senza.indexOf(':'))];
  return `- ${d}${senso ? ` — ${senso}` : ''}`;
}

/** The message of the second request: the target again, its program, what is wrong with it, where. */
export function testoSeconda(bersaglio: string, xml: string, e: Esame): string {
  const fatti: string[] = [];
  if (e.piani?.length) fatti.push(`Piani raggiunti: ${e.piani.map((p) => `z=${p.z} (${Math.round(p.area * 10) / 10} caselle², ${p.stanze} stanze)`).join('; ')}.`);
  for (const p of e.persi ?? []) fatti.push(`Pavimento non raggiunto: z=${p.z}, x ${p.x0}-${p.x1}, y ${p.y0}-${p.y1}, ${Math.round(p.area * 10) / 10} caselle².`);
  if (e.porta) fatti.push(`Porta trovata a x=${e.porta.x}, y=${e.porta.y}${e.porta.libera ? '' : ', ostruita'}.`);
  return [
    bersaglio,
    '',
    'Hai già scritto questo programma:',
    '```xml',
    xml.trim(),
    '```',
    '',
    ...(e.difetti.length ? ['Il gioco lo ha provato, e non va:', ...e.difetti.map(rigaDifetto)] : []),
    ...(fatti.length && e.difetti.length ? ['', ...fatti] : []),
    ...(e.problemi?.trim() ? [...(e.difetti.length ? [''] : []), 'Chi ha guardato le foto ha scritto:', e.problemi.trim()] : []),
    ...(e.traccia?.trim() ? ['', 'Ecco cosa ha fatto il programma quando il gioco lo ha eseguito, nodo per nodo:', '```', e.traccia.trim(), '```'] : []),
    '',
    'Correggi questi difetti e lascia com’è tutto ciò che funziona. Rispondi con il programma intero, corretto.',
  ].join('\n');
}

/** What the bench wrote of an attempt, in `misure.json`. */
export interface Scheda {
  passa: boolean;
  difetti: Array<string | null>;
  misure?: { piani?: Piano[]; persi?: Perso[]; porta?: Porta };
  /** The first size and seed that did not hold (T182), where the trace looks. */
  caduta?: { taglia: SizeTier; seme: number };
}

/**
 * What goes back to the model, if anything: the defects if the measures fail, the judge's problems only if they pass.
 * An attempt that passes both has nothing to correct.
 */
export function daCorreggere(s: Scheda, problemi?: string): Esame | undefined {
  if (!s.passa) return { difetti: s.difetti.filter((d): d is string => !!d), ...(s.misure?.piani ? { piani: s.misure.piani } : {}), ...(s.misure?.persi ? { persi: s.misure.persi } : {}), ...(s.misure?.porta ? { porta: s.misure.porta } : {}) };
  return problemi?.trim() ? { difetti: [], problemi } : undefined;
}
