// Two tables, as in Dungeons & Dragons (ADR-0025): the Council is the Dungeon Master, outside the
// world; inside, the wanderer and the people live a world that is real to them. The principles below
// go with every request to the Council; the filter catches content that breaks the fourth wall anyway.

/** Sent with every request to the Council (kernel text: it holds whatever the universe says). */
export const COUNCIL_PRINCIPLES = `## Principi del Concilio (il kernel li garantisce)
Due tavoli, come in Dungeons & Dragons. Il Concilio è il Dungeon Master: sta fuori dal mondo, lo crea e
lo fa evolvere. Dentro il mondo ci sono il viandante e le persone: per loro il mondo è reale.
- Niente meta-gioco nei contenuti (persone, oggetti, luoghi, dialoghi, testi, trame): mai codice,
  simulazioni, programmi, computer, giochi, giocatori, agenti, Concilio, «crepe della realtà», bordi del
  mondo misurati, mondi che si ripetono o si riavviano. Le stranezze del mondo hanno spiegazioni del
  mondo (magia, leggende, dei, superstizioni).
- Mestieri e ruoli concreti (fornaio, guardia, pastore, guaritrice, mercante, brigante, mago di
  villaggio), mai custodi della realtà, censori delle identità, archivisti del mondo, misuratori di anomalie.
- Il Concilio fa evolvere il gioco, non lo censura: ciò che ha senso nel mondo (un cavallo sellato, una
  barca, un'arma, un rituale) va reso possibile con oggetti, azioni, effetti, stati e codice, con
  conseguenze coerenti. Niente doppioni di ciò che esiste già.`;

/** Words that, inside the world, only the Dungeon Master's table should know. */
const META_RE =
  /\b(simulazion\w*|simulat[oa]|codic[ei] (?:del mondo|sorgente)|programm[ai]\b|algoritm\w*|computer|glitch|pixel|render\w*|server|kernel|debug|bug\b|loop\b|riavvi\w*|matrice del|giocator\w*|meta-?gioco|quarta parete|concilio degli agenti|crep[ae] (?:della|nella) realt\w*|tessuto della realt\w*|ancorare la realt\w*|realt[aà] (?:si|è) (?:instabil\w*|finta|falsa)|censor[ei] delle identit\w*|custod[ei] (?:della realt\w*|dei registri del mondo)|archivista supremo|misurator[ei] di (?:ombre|anomalie)|anomali[ae] del mondo|44 passi|quarantaquattro passi|bordo del (?:mondo|regno)[^.]{0,30}passi)/i;

/** Whether a text breaks the fourth wall (what it says, for the feedback). */
export function metaBreak(text: string): string | undefined {
  const m = META_RE.exec(text);
  return m ? m[0] : undefined;
}
