# ADR-0075 — Il lessico di QUINE42

Data: 2026-10-29 · Stato: accettato (task T65 del backlog) · Estende ADR-0025 (due tavoli) e il canone delle rune (T07).

## Contesto
L'autore vuole usanze, saluti, modi di dire e buone maniere costanti in ogni universo, qualunque l'ambientazione (borgo, città moderna,
steampunk, stelle): una società credibile, non lontana dalla nostra ma diversa, che faccia guardare da fuori le nostre stranezze, con
poche parole sostituite (appunti in `docs/userchats/idee-costumi-parole-etc.md`). Decisioni (risposte in `docs/pipeline/domande/T65.md`):
un file del seme che ogni universo eredita e il Narratore arricchisce di **pochi** termini senza contraddirlo; la prima versione la
propone l'agente del task (15-20 voci); al più 5-6 parole sostituite, le stesse ovunque, spiegate dal contesto e mai da un glossario.

## Decisione
1. **`universe/world/lessico.md`** (seme): «Parole che si dicono così» (`- **parola / forme**: …`: bonombo, macico, lerpio, pagosso,
   Ciok Ciok), «Saluti e buone maniere», «Usanze», «Modi di dire» (18 voci in tutto) e «Come si usa» (le regole per chi scrive). Gli
   universi vecchi lo ricevono da `upgradeFromSeed` come ogni file nuovo del seme.
2. **Va con ogni compito narrativo**, come il canone: `lexiconSummary` (`agents/council.ts`) nel contesto del Narratore e dell'Arbitro,
   anche nei compiti con il `focus` del grafo, dopo il canone (nella parte che la cache serve). Il prompt del Narratore dice di usarlo
   in dialoghi, cose e bibbia, adattato all'epoca, senza spiegarlo.
3. **Le usanze dell'universo**: la Genesi chiede nella bibbia `usanze` (al più `OWN_CUSTOMS` = 3); `cleanBible` tiene solo quelle che
   non rompono la quarta parete, non spiegano il lessico e non ridefiniscono una sua parola («bonombo: …»). `lexiconSummary` le aggiunge
   come «Usanze di questo mondo». Il lessico del seme non lo riscrive nessun agente.
4. **Mai un glossario nel mondo**: `glossaryBreak(text, words)` (`fourthwall.ts`, parole da `lexiconWords`/`wordsOf`) trova chi traduce
   una parola del lessico («bonombo» significa…, lerpio vuol dire…, «macico», cioè…, la parola pagosso). `metaBreak(text, words)` lo
   controlla dopo la quarta parete: bibbia della Genesi, concetti della Fucina, individui, trame (`reviewPlot(plot, people, words)`),
   revisione della quarta parete all'avvio. Ciò che lo fa torna al Narratore con il motivo o si toglie, come il meta-gioco.

## Conseguenze
- Ogni chiamata del Narratore e dell'Arbitro porta ~850 token in più, fissi (serviti dalla cache); il test di T13 misura il risparmio
  del grafo senza contarli.
- Le parole del lessico si cambiano solo nel seme; chi le cambia cambia il modo di parlare di ogni universo.
- Il controllo del glossario guarda solo le forme vicine alla parola: una spiegazione più larga la vede l'Arbitro, non le espressioni.
