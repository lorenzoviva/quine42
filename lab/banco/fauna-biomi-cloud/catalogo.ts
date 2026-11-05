// The catalogue of Cantiere 8: sixty programs in three collections, five per setting. Each entry knows its class (the box the game gives it),
// what it is and which random choices make its seeds differ; the program itself is written by `xml()` in the collection's file.

import { CREATURE_VEICOLI } from './creature-veicoli';
import { FLORA_GEOLOGIA } from './flora-geologia';
import { MONUMENTI_ROVINE } from './monumenti-rovine';

export type Ambientazione = 'fantasy' | 'steampunk' | 'moderno' | 'futuristico';

export interface Voce {
  collezione: 'creature-veicoli' | 'flora-geologia' | 'monumenti-rovine';
  ambientazione: Ambientazione;
  nome: string;
  titolo: string;
  /** A class of `src/mj/classes.ts`: its box is the one the game runs the program in. */
  classe: string;
  descrizione: string;
  /** The random choices, in words. */
  procedura: string;
}

export interface Definizione extends Voce {
  xml: () => string;
}

export const DEFINIZIONI: Definizione[] = [...CREATURE_VEICOLI, ...FLORA_GEOLOGIA, ...MONUMENTI_ROVINE];
export const CATALOGO: Voce[] = DEFINIZIONI.map(({ xml: _, ...v }) => v);
