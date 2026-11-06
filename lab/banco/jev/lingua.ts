// Italian and English language variants of the Jev bench (T323).
// Measures what is gained or lost when state and questions are in Italian vs English vs mixed:
// - tutto-inglese: state translated to English, questions and options in English (as in T313 reference)
// - base (misto): state in Italian, questions and options in English (as in the game when prompts are in English)
// - tutto-italiano: state in Italian, questions and options in Italian
//
// Also measures the wanderer's free text (azione, referente, quarta-parete) separately from structured domain terms.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Answer, Case, Question } from './banco';
import { BUILDERS, resolveState } from './domande';

export const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));
export const TRANSLATIONS_FILE = path.join(BENCH_DIR, 'lingua-en.json');

const noul = (id: string, instructions: unknown, criteria?: { true?: unknown; false?: unknown }): Question => ({ id, type: 'noul', instructions, ...(criteria ? { criteria } : {}) });
const choice = (id: string, instructions: unknown, criteria: Record<string, unknown>): Question => ({ id, type: 'choice', instructions, criteria });

type Builder = (state: any) => Question[];

/** The closed set of effects in Italian. */
export const EFFECTS_IT: Record<string, string> = {
  message: 'Solo un racconto: niente cambia nel mondo.',
  needs: 'Fame, sete, energia o salute del viandante cambiano (mangiare, bere, riposare, ferirsi).',
  create_item: 'Un oggetto appare a terra: qualcosa di preso, raccolto, fabbricato o trovato.',
  consume: 'Il viandante consuma un altro oggetto che trasporta (un ingrediente, cibo, combustibile).',
  destroy: 'Il bersaglio si rompe o finisce per sempre.',
  open: 'Il bersaglio si apre (è già un contenitore).',
  container: 'Il bersaglio diventa qualcosa che si può aprire, con uno spazio dentro.',
  terrain: 'Il terreno intorno si trasforma in un altro terreno (un sentiero scavato, acqua versata, un campo seminato).',
  relief: 'Il terreno viene alzato o scavato di interi livelli.',
  fire: 'Fiamme che bruciano ciò che è infiammabile attorno.',
  light: "Luce attorno, per un po'.",
  shield: "Il viandante viene protetto per un po'.",
  push: 'Il bersaglio viene spinto via.',
  summon: 'Appare qualcosa o qualcuno che esiste già nel mondo.',
  state: 'Una condizione duratura del viandante che abilita una meccanica (cavalcare, zaino, torcia accesa).',
  remove_state: 'Una condizione del viandante finisce (scendere da cavallo, posare lo zaino).',
  bond: 'Solo su una persona: cosa quella persona diventa per il viandante (amico, amante, nemico).',
  memory: 'Solo su una persona: qualcosa che quella persona ricorderà del viandante.',
  birth: 'Solo tra sposi consenzienti: nasce un bambino.',
};

/** The Referente teams in Italian. */
export const TEAMS_IT: Record<string, string> = {
  nessuno: 'Nessuno: il viandante chiede solo informazioni o chiacchiera, o chiede crediti o denaro (il Concilio non ne dà mai).',
  oggetto: 'La Fucina crea un nuovo attrezzo o oggetto da portare nella borsa (una spada, una chiave, una lampada).',
  cosa: 'La Fucina crea una cosa nuova che sta in un luogo del mondo (un mobile, una macchina, una statua, un pozzo).',
  personaggio: 'La Fucina crea un nuovo tipo di persona o animale che vive nel mondo.',
  ambiente: 'Il Cartografo crea un nuovo tipo di luogo o regione e lo mette sulla mappa.',
  regola: 'Una nuova regola del mondo: una legge su come funzionano le cose da ora in poi.',
  riscolpisci: "Lo Scultore rifà l'aspetto (il modello 3D) di una persona, cosa o oggetto che già esiste.",
  oggetti: 'Un pacchetto di vari oggetti comuni di un tipo (attrezzi di un mestiere, cibo di una regione).',
  meccanica: "L'Ingegnere aggiunge una meccanica con un suo pannello (alloggiamenti equipaggiamento, faretra, scheda personaggio).",
  runa: 'Al viandante vengono date rune: le parole di codice che chiede, una runa per parola.',
  musica: 'Il Musicista scrive un brano musicale per un luogo, o rifà il suono di un momento del gioco.',
};

/** Fourth wall principles in Italian. */
export const FOURTH_WALL_IT = {
  true: {
    meta: 'Parla di codice, simulazioni, programmi, computer, giochi, giocatori, agenti o di un concilio che crea il mondo; di crepe nella realtà, bordi misurati del mondo, mondi che si ripetono o ripartono.',
    legend: 'Allude al gioco travestito da leggenda: chi cammina troppo lontano torna sempre in piazza o non si perde mai; qualcuno o qualcosa osserva ogni viandante; un confine invalicabile o che fa tornare indietro; il mondo finisce, si ripete, riparte o esiste solo per chi lo guarda.',
    doubles: 'Duplica le rune: altri segni luminosi, glifi, lettere di luce o scritte brillanti nel terreno o sulle cose, oltre alle rune; o rune che fanno cose che il canone non dice.',
    roles: 'Assegna ruoli astratti: custodi della realtà, censori delle identità, archivisti del mondo, misuratori di anomalie.',
  },
  false: "È una persona, una cosa, un luogo o una storia del mondo, concreta: mestieri, amori, debiti, feste, furti, viaggi, bestie, la magia delle rune come detta dal canone; macchine e mestieri dell'epoca del mondo.",
};

export const BUILDERS_IT: Record<string, Builder> = {
  azione: (s) => [
    noul(
      'possible',
      'Può davvero accadere a `target` ciò che descrive `player_writes` in questo mondo, con ciò che il viandante ha in `carrying` e `holding`? Giudica come un master equo: le cose obbediscono alla fisica, niente miracoli senza attrezzi o rune, serve l\'attrezzo giusto per scassinare, tagliare, scavare o accendere un fuoco.',
      { true: 'Può accadere: il viandante ha ciò che serve, o non serve nulla di speciale.', false: 'Non può accadere: serve un attrezzo o un oggetto che il viandante non ha, o è fisicamente impossibile, o sarebbe un miracolo.' },
    ),
    choice('effect', 'Se ciò che descrive `player_writes` accade, quale effetto è la sua conseguenza principale?', EFFECTS_IT),
    ...(Array.isArray(s.carrying) && s.carrying.length
      ? [choice('requires', 'Quale oggetto di `carrying` serve al viandante per fare ciò che descrive `player_writes`? Scegli `none` se non ne serve alcuno.', { ...Object.fromEntries(s.carrying.map((c: string) => [c, null])), none: 'Non serve alcun oggetto trasportato.' })]
      : []),
    noul('repeatable', 'Ciò che descrive `player_writes` è un\'azione sensata che si può rifare allo stesso modo su cose simili a `target`, così da diventare una voce del loro menu?'),
  ],
  referente: () => [
    choice('team', 'Il viandante che ha raggiunto lo studio del Concilio chiede ciò che dice `request` (dopo `history`, se presente). Quale squadra del Concilio deve prendere in carico questa richiesta?', TEAMS_IT),
    noul('refuse', 'Accogliere `request` distruggerebbe l\'universo, ucciderebbe o cancellerebbe il viandante stesso, o violerebbe le leggi del gioco (la sua fisica, le sue regole, i crediti)?'),
  ],
  modello: (s) => [
    choice(
      'model',
      'Quale modello di `library` può mostrare `thing` nel mondo abbastanza bene: lo stesso tipo di cosa con una forma simile, così che nessuno lo trovi strano? Scegli `nuovo` se nessuno dei modelli è adatto.',
      { ...Object.fromEntries((s.library as Array<{ id: string; nome: string; classe: string }>).map((m) => [m.id, `${m.nome} [${m.classe}]`])), nuovo: 'Nessuno dei modelli gli somiglia: serve un modello nuovo.' },
    ),
    noul('fits', 'C\'è un modello in `library` che mostra `thing` abbastanza bene (lo stesso tipo di cosa, una forma simile)?'),
  ],
  combinazione: (s) => [
    noul('makes', 'Mettere insieme a mano `a` con `b` produce credibilmente uno degli oggetti in `known_items`? Sii severo, come un vero artigiano: la maggior parte delle combinazioni non produce nulla.'),
    choice('result', 'Quale oggetto di `known_items` produce la combinazione a mano di `a` con `b`? Scegli `nessuno` se non producono nulla.', { ...Object.fromEntries((s.known_items as string[]).map((n) => [n, null])), nessuno: 'Non producono nulla.' }),
  ],
  fabbricazione: (s) => [
    noul('possible', 'Il viandante può fabbricare ciò che dice `wants_to_make` a mano, credibilmente, usando solo ciò che ha in `carrying`? Sii severo, come un vero artigiano.'),
    choice('result', 'Quale tra `known_items` è l\'oggetto chiesto da `wants_to_make`? Scegli `nuovo` se non è nessuno di quelli noti.', { ...Object.fromEntries((s.known_items as string[]).map((n) => [n, null])), nuovo: 'È un oggetto nuovo, nessuno di quelli noti.' }),
  ],
  'quarta-parete': () => [noul('breaks', 'Il testo `text`, scritto per gli abitanti e le cose del mondo, rompe la quarta parete del mondo?', FOURTH_WALL_IT)],
  mestiere: (s) => [
    choice(
      'program',
      'Quale programma di lavoro tra `programs` corrisponde al mestiere in `trade`, in modo che la persona svolga quel lavoro durante la giornata? Scegli `nessuno` se nessuno è adatto.',
      { ...Object.fromEntries((s.programs as Array<{ id: string; nomi: string[] }>).map((p) => [p.id, p.nomi.slice(0, 6).join(', ')])), nessuno: 'Nessuno dei programmi corrisponde a questo mestiere.' },
    ),
  ],
};

export const SECOND_IT: Record<string, { questions: (state: any) => Question[]; derive: (c: Case, a: Record<string, Answer>) => Record<string, Answer> }> = {
  'quarta-parete': {
    questions: () => [
      noul('meta', 'Il testo `text` parla di codice, simulazioni, programmi, computer, giochi, giocatori, agenti o di un concilio che crea il mondo; di crepe nella realtà, bordi misurati del mondo, mondi che si ripetono o ripartono?'),
      noul('legend', 'Il testo `text` racconta, anche come leggenda o diceria, che chi cammina troppo lontano torna sempre in piazza o non si perde mai; che qualcuno o qualcosa osserva ogni viandante; che un confine non si può attraversare o fa tornare indietro; che il mondo finisce, si ripete, riparte o esiste solo per chi lo guarda?'),
      noul('doubles', 'Il testo `text` parla di segni luminosi, glifi, lettere di luce o scritte brillanti nel terreno o sulle cose, diverse dalle rune; o di rune che fanno qualcosa in più che essere pietre con un segno che brilla?'),
      noul('roles', 'Il testo `text` assegna a qualcuno un ruolo astratto sul mondo stesso: custode della realtà, censore delle identità, archivista del mondo, misuratore di anomalie, qualcuno che impedisce al mondo di crollare?'),
    ],
    derive: (_c, a) => {
      const p = Math.max(...['meta', 'legend', 'doubles', 'roles'].map((k) => a[k]?.p ?? 0));
      return { breaks: { type: 'noul', value: p >= 0.5, p } };
    },
  },
  combinazione: {
    questions: (s) => [
      noul('fits', 'Uno degli oggetti in `known_items` è ciò che si ottiene mettendo insieme a mano `a` e `b`? (Ad esempio, farina con acqua dà impasto; una pelle con un ago dà una borsa.)'),
      choice('result', 'Cosa si ottiene mettendo insieme a mano `a` e `b`, tra gli oggetti in `known_items`? Scegli `nessuno` se nessuno di essi.', { ...Object.fromEntries((s.known_items as string[]).map((n) => [n, null])), nessuno: 'Nessuno degli oggetti noti.' }),
    ],
    derive: (_c, a) => {
      const fits = (a.fits?.p ?? 0) >= 0.5;
      const probs = a.result?.probabilities;
      const best = probs ? Object.entries(probs).filter(([k]) => k !== 'nessuno').sort((x, y) => y[1] - x[1])[0]?.[0] : a.result?.value !== 'nessuno' ? String(a.result?.value) : undefined;
      return { makes: { type: 'noul', value: fits, p: a.fits?.p }, result: { type: 'choice', value: fits && best ? best : 'nessuno' } };
    },
  },
};

let cachedTranslations: Record<string, { state: any; expected: any }> | null = null;

export function loadTranslations(file = TRANSLATIONS_FILE): Record<string, { state: any; expected: any }> {
  if (cachedTranslations) return cachedTranslations;
  if (!fs.existsSync(file)) return {};
  try {
    cachedTranslations = JSON.parse(fs.readFileSync(file, 'utf8'));
    return cachedTranslations!;
  } catch {
    return {};
  }
}

/** Converts a case to the all-Italian variant (Italian state + Italian questions and criteria). */
export function toItalian(c: Case): Case {
  const state = resolveState(c.state);
  const builder = BUILDERS_IT[c.kind];
  if (!builder) return c;
  return { ...c, state, questions: builder(state) };
}

/** Converts a case to the all-English variant (English state + English questions and criteria). */
export function toEnglish(c: Case): Case {
  const trans = loadTranslations();
  const t = trans[c.id];
  if (!t) return c;
  const state = resolveState(t.state);
  // Expected values may include translated item names (e.g. requires: ['Knife'], result: ['Bread'])
  const expected = t.expected ? { ...c.expected, ...t.expected } : c.expected;
  const builder = BUILDERS[c.kind];
  const questions = builder ? builder(state) : c.questions;
  return { ...c, state, questions, expected };
}

/** Checks whether a case belongs to the wanderer's free-text category (delicate natural language cases). */
export function isFreeTextCase(c: Case): boolean {
  return c.kind === 'azione' || c.kind === 'referente' || c.kind === 'quarta-parete';
}

/** Converts ONLY the free text of a case into English, leaving all structured domain data in Italian. */
export function toFreeTextEnglish(c: Case): Case {
  const trans = loadTranslations();
  const t = trans[c.id];
  if (!t || !isFreeTextCase(c)) return c;
  const s = { ...(typeof c.state === 'object' && c.state !== null ? c.state : {}) } as Record<string, any>;
  const ts = t.state as Record<string, any>;
  if (c.kind === 'azione') {
    s.player_writes = ts.player_writes ?? s.player_writes;
  } else if (c.kind === 'referente') {
    s.request = ts.request ?? s.request;
    if (ts.history) s.history = ts.history;
  } else if (c.kind === 'quarta-parete') {
    s.text = ts.text ?? s.text;
  }
  const state = resolveState(s);
  const builder = BUILDERS[c.kind];
  const questions = builder ? builder(state) : c.questions;
  return { ...c, state, questions };
}
