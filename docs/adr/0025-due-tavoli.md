# ADR-0025 — Due tavoli: il Concilio è il Dungeon Master, dentro il mondo niente meta-gioco

Data: 2026-10-20 · Stato: accettato; supera le «crepe» di ADR-0008 e del design originale

## Contesto
Nell'universo erano nati NPC come «Censore delle Identità», «Archivista Supremo», «Misuratore di Ombre»:
il Concilio mescolava la propria realtà (codice, simulazione, registri del mondo) con quella simulata.
La causa erano i prompt: tema, bibbia e schede chiedevano esplicitamente «crepe della simulazione»;
anche il cartello dei 44 passi rompeva la finzione. L'autore chiarisce: il gioco ha due tavoli, come
Dungeons & Dragons — il Dungeon Master (il Concilio, o il giocatore quando fa il DM) e i giocatori che
vivono il mondo — e non vanno mischiati.

## Decisione
- **Principi del Concilio** (`src/kernel/fourthwall.ts`, nel kernel: valgono qualunque cosa dica
  l'universo), inviati con ogni richiesta: niente meta-gioco nei contenuti; stranezze spiegate dentro
  il mondo (magia, leggende); mestieri concreti, mai ruoli astratti; il Concilio fa evolvere il gioco e
  non lo censura; niente doppioni.
- Prompt riscritti: tema, ruolo del Narratore (sezione «Due tavoli»), Arbitro (obietta alla rottura della
  quarta parete e ai doppioni, non alle idee nuove), Cartografo, Fisico, Ingegnere, Artista; Genesi
  (la bibbia ha `misteri`, non più `crepe`), individui, Fucina, chat degli NPC («sei una persona del tuo
  mondo»), trame (misteri del mondo).
- **Filtro** (`metaBreak`): un concetto della Fucina o un individuo che rompe la quarta parete, o un
  doppione per nome, viene richiesto di nuovo con il motivo.
- **Revisione** (`reviewFourthWall`, una volta per universo): l'Arbitro rivede i moduli creati prima e
  ritira quelli fuori dal mondo e i doppioni (file rimossi, bibbia ripulita; la storia git li conserva).
- Il cartello indica i luoghi vicini; i fatti degli NPC non contengono più la distanza dal bordo.

## Conseguenze
- Dentro il mondo tutto è reale per chi ci vive; il codice, il Concilio e lo studio restano nella corona.

## Aggiornamento (23/10/2026, T09): allusioni e doppioni
L'analisi dell'autore (`docs/userchats/to-do-2026-10-22.md`) ha trovato rotture più sottili, travestite da
leggenda: chi torna sempre in piazza (il tappeto), il re sotto il lago che osserva ogni viandante (il giocatore),
il confine del bosco che nessuno supera (il mondo finito), un «simbolo luminoso» nel terreno che fa le veci delle
rune (un doppione che inventa comportamenti).
- La Genesi non invita più al mistero né racconta la leggenda della piazza: tema e bibbia del seme semplici, le rune
  come dice il canone (T08), 2-4 leggende della gente «mai sul mondo stesso».
- I principi del Concilio nominano questi esempi e vietano i doppioni degli elementi del gioco; il filtro
  (`metaBreak`) li riconosce, e `bibleBreaks`/`cleanBible` lo applicano alla bibbia (la Genesi la chiede di nuovo,
  poi la ripulisce); le trame nuove si chiedono di nuovo una volta, poi si scartano.
- La revisione ha un marcatore con versione (`revisione|quarta-parete-2`): gli universi già rivisti vengono rivisti
  di nuovo, con la bibbia intera (anche `misteri`) e le trame (quelle che rompono la parete si tolgono).
