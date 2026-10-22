// Two tables, as in Dungeons & Dragons (ADR-0025): the Council is the Dungeon Master, outside the
// world; inside, the wanderer and the people live a world that is real to them. The principles below
// go with every request to the Council; the filter catches content that breaks the fourth wall anyway.

import type { Bible } from './agents/council';

/** Sent with every request to the Council (kernel text: it holds whatever the universe says). */
export const COUNCIL_PRINCIPLES = `## Principi del Concilio (il kernel li garantisce)
Due tavoli, come in Dungeons & Dragons. Il Concilio è il Dungeon Master: sta fuori dal mondo, lo crea e
lo fa evolvere. Dentro il mondo ci sono il viandante e le persone: per loro il mondo è reale.
- Niente meta-gioco nei contenuti (persone, oggetti, luoghi, dialoghi, testi, trame, fatti, leggende): mai
  codice, simulazioni, programmi, computer, giochi, giocatori, agenti, Concilio, «crepe della realtà», bordi
  del mondo misurati, mondi che si ripetono o si riavviano.
- Nemmeno allusioni travestite da leggenda. Il mondo non sa di essere un gioco, quindi nessuno racconta che:
  chi cammina troppo torna sempre in piazza o non si perde mai; qualcuno o qualcosa (un re sotto il lago, la
  luna, un dio) osserva ogni viandante; un confine (il bosco, la valle, il regno) non si può superare o fa
  tornare sui propri passi; il mondo finisce, si ripete, ricomincia o esiste solo per chi lo guarda.
- Niente doppioni degli elementi del gioco. Le rune sono una cosa sola, quella del canone: nessun altro
  «simbolo luminoso», «glifo», «lettera di luce» o «scritta che brilla» nel terreno, e nessun comportamento
  delle rune che il canone non dice. Lo stesso per ciò che esiste già (oggetti, persone, incantesimi).
- Mestieri e ruoli concreti (fornaio, guardia, pastore, guaritrice, mercante, brigante, mago di
  villaggio), mai custodi della realtà, censori delle identità, archivisti del mondo, misuratori di anomalie.
- Storie semplici e concrete, fatte di persone: amori, debiti, mestieri, furti, feste, rivalità, viaggi,
  bestie, magia delle rune come la dice il canone. Il mistero non è un obbligo.
- Il Concilio fa evolvere il gioco, non lo censura: ciò che ha senso nel mondo (un cavallo sellato, una
  barca, un'arma, un rituale) va reso possibile con oggetti, azioni, effetti, stati e codice, con
  conseguenze coerenti.`;

/** Words that, inside the world, only the Dungeon Master's table should know. */
const META_RE = new RegExp(
  [
    // code, simulation, the Council's table
    String.raw`simulazion\w*|simulat[oa]|codic[ei] (?:del mondo|sorgente)|programm[ai]\b|algoritm\w*|computer|glitch|pixel|render\w*|server|kernel|debug|bug\b|loop\b|riavvi\w*|matrice del|giocator\w*|meta-?gioco|quarta parete|concilio degli agenti`,
    // reality that cracks, abstract roles
    String.raw`crep[ae] (?:della|nella) realt\w*|tessuto della realt\w*|ancorare la realt\w*|realt[aà] (?:si|è) (?:instabil\w*|finta|falsa)|censor[ei] delle identit\w*|custod[ei] (?:della realt\w*|dei registri del mondo)|archivista supremo|misurator[ei] di (?:ombre|anomalie)|anomali[ae] del mondo`,
    // the measured edge, the world that repeats
    String.raw`44 passi|quarantaquattro passi|bordo del (?:mondo|regno)[^.]{0,30}passi|(?:il )?mondo (?:si ripete|ricomincia|si riavvia)`,
    // the carpet that brings you back to the square
    String.raw`(?:torna\w*|ritrov\w*|riport\w*|ricondu\w*) sempre[^.]{0,20}\bin piazza|si ritrova(?:no)? in piazza|chi cammina troppo|non (?:far |lascia )?perder(?:e|si) nessuno`,
    // someone watching every wanderer
    String.raw`(?:osserv|sorvegli|spi|guard)\w* (?:ogni|ciascun|tutti i) viandant\w*`,
    // borders nobody crosses
    String.raw`nessun viandante[^.]{0,40}(?:superar|oltrepassar|attraversar|uscir)\w*|confin\w* invalicabil\w*|senza tornare sui (?:suoi|propri) passi`,
    // other glowing signs in the ground, doubles of the runes
    String.raw`(?:simbol|segn|glif|letter|scritt)\w* luminos\w*|lettere (?:di luce|che affiorano)|glif\w* (?:di luce|che brilla\w*)`,
  ].map((p) => String.raw`\b(?:${p})`).join('|'),
  'i',
);

/** Whether a text breaks the fourth wall (what it says, for the feedback). */
export function metaBreak(text: string): string | undefined {
  const m = META_RE.exec(text);
  return m ? m[0] : undefined;
}

/** The bible's lines that break the fourth wall (as «line» → what breaks it). */
export function bibleBreaks(b: Bible): string[] {
  return [b.tono, b.sintesi, b.storia ?? '', ...(b.personaggi ?? []), ...(b.fatti ?? []), ...(b.misteri ?? [])]
    .flatMap((l) => {
      const m = metaBreak(l);
      return m ? [`«${l.slice(0, 120)}» («${m}»)`] : [];
    });
}

/** The bible without the lines of lists that break the fourth wall (and without the old «crepe»). */
export function cleanBible(b: Bible): Bible {
  const keep = (ls?: string[]) => (ls ?? []).filter((l) => !metaBreak(l));
  const { crepe: _, ...rest } = b;
  return { ...rest, personaggi: keep(b.personaggi), fatti: keep(b.fatti), misteri: keep(b.misteri) };
}
