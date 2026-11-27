# La documentazione a livelli

Studio di T524 (27/11/2026) · Decisione: [ADR-0266](../adr/0266-la-documentazione-a-livelli.md) · Domande: [`pipeline/domande/T524.md`](../pipeline/domande/T524.md)
· Segue [ADR-0120](../adr/0120-agents-nucleo-e-dettagli.md) (il nucleo e i dettagli) e [ADR-0045](../adr/0045-grafo-del-mondo.md) (graphify).

L'autore, il 26/11 ([`to-do-2026-11-26.md`](../userchats/to-do-2026-11-26.md), «La documentazione»): il progetto è cresciuto, i documenti degli
agenti sono dettagliati ma troppo lunghi da verificare a mano; serve una gerarchia, un documento ridotto per la panoramica e poi i dettagli,
anche per gli agenti; e perché non usavamo graphify. Qui: la mappa dei documenti di oggi (§ 1), la proposta a tre livelli con le regole per
tenerla coerente (§ 2), graphify rivalutato (§ 3), la catena che fa il resto (§ 4). Il primo pezzo è fatto: la
[panoramica](../panoramica.md), il livello 1, e i controlli che la tengono in piedi (`tests/documenti.test.ts`).

## 1. La mappa

Le misure sono del 27/11 (`npx vite-node tools/documenti/mappa.ts` le rifà). I token sono stimati, un token ogni 3,5 caratteri.

### 1.1 Quanto pesano e chi li legge

| Documento | Peso | Token stimati | Chi lo legge, e come |
|---|---:|---:|---|
| [`AGENTS.md`](../../AGENTS.md) | 161 KB, 462 righe | ~47 000 | **ogni sessione, intero**: `CLAUDE.md` e `GEMINI.md` lo importano; l'orchestratore a ogni epoca |
| [`architettura-dettagli.md`](../architettura-dettagli.md) | 412 KB, 2 383 righe, 40 sezioni | ~120 000 | la sezione dell'area del task |
| [`glossario.md`](../glossario.md) | 228 KB, 356 voci | ~66 000 | chi conia o cerca un nome; un test lo controlla |
| [`adr/`](../adr/README.md) | 266 file, 1,5 MB; l'indice 120 KB | ~458 000 | per numero |
| `plans/backlog.md` | 1,3 MB | ~390 000 | solo la pipeline e il pianificatore; un task riceve il suo blocco in `.pipeline-task.md` |
| [`pipeline/`](../pipeline/README.md) | il diario 662 KB, i consumi 356 KB, `modelli.md` 105 KB, il quadro 25 KB, README 32 KB | — | l'orchestratore e chi esegue un task |
| [`design/`](.) | 28 file, 775 KB | ~225 000 | uno studio quando un task ne nasce |
| [`lingua-interna.md`](../lingua-interna.md), [`fasi.md`](../fasi.md), [`sicurezza/`](../sicurezza/README.md), [`lancio/`](../lancio/piano.md), [`conversazioni.md`](../conversazioni.md) | 89, 14, 147, 76, 79 KB | — | chi tocca quell'area |
| tutto `docs/` | ~6,4 MB | ~1,8 milioni | nessuno |

Ogni task della pipeline (una quindicina al giorno) e ogni epoca dell'orchestratore (708 in un mese) parte dunque con ~47 000 token di
`AGENTS.md` prima di leggere il proprio compito. Nessun documento dà il quadro in pochi minuti: il più corto che lo tenti è il nucleo.

### 1.2 Come sono cresciuti

ADR-0120 aveva portato il nucleo a 37,9 KB il 3/11. In 24 giorni:

| Documento | 3/11 | 27/11 | |
|---|---:|---:|---|
| `AGENTS.md` | 37,9 KB | 164 KB | × 4,3, circa 5 KB al giorno; 105 commit nell'ultima settimana |
| `architettura-dettagli.md` | 69 KB | 422 KB | × 6 |
| `glossario.md` | 61 KB | 234 KB | × 3,8 |
| `adr/README.md` | 33 KB | 123 KB | × 3,7 |
| `plans/backlog.md` | 564 KB | 1 376 KB | × 2,4 |

Dove pesa il nucleo, per sezione: l'**indice dei sottosistemi** 54 KB, la **struttura** 39 KB, i **comandi** 27 KB, le **regole** 17 KB, il
protocollo 8 KB, il Concilio 8 KB, le convenzioni 6 KB, stack e visione 5 KB. L'indice doveva avere «una riga e un rimando» per sottosistema
(ADR-0120): oggi la riga dei lotti è di 7 900 caratteri, quelle di MarkovJunior e della fisica di 6 000, e dieci superano i 1 300. Il nucleo
cita 576 volte un ADR, 157 volte un task e ha 2 049 frammenti di codice: è diventato il riassunto di ogni task, non il contratto.

### 1.3 Dove si sovrappongono

- **L'indice del nucleo e i dettagli** dicono le stesse cose due volte, con parole diverse: le frasi di cinque parole in comune sono il 4 %.
  Non è una copia che si aggiorna da sola: sono due versioni dello stesso fatto, che si scostano.
- **I file e il loro ruolo** stanno in tre posti: la «Struttura» del nucleo, la colonna «File sorgente» dei dettagli, il «Dove vive» del glossario.
- **I comandi del laboratorio** (27 KB nel nucleo) sono raccontati per intero nel nucleo, nei README del laboratorio e spesso nei dettagli.
- **«Dove siamo»** sta in tre posti: il [quadro](../pipeline/quadro.md), le [fasi](../fasi.md) e la sezione «Stato e prossimi passi» dei
  dettagli, che è ferma allo step 9 (T07-T45).
- **[`docs/README.md`](../README.md)** descrive `docs/` com'era a T61 («ADR 0001 - 0072+», «T01 - T68+»): la mappa dei documenti è questa.
- **L'indice degli ADR** pesa 123 KB perché la colonna «Stato» racconta l'attuazione invece di dire lo stato.

### 1.4 Che cosa tiene

I riferimenti reggono meglio della forma: i 123 percorsi citati nel nucleo esistono tutti, dei 437 dei dettagli mancano 4 (due file della
beta che la build mette solo se ci sono, un rapporto che una prova scrive, `lab/out/`); nessun ADR sostituito è citato nel nucleo; i rimandi
`→ #sezione` del nucleo arrivano tutti. Quattro link dei dettagli sono scritti dalla radice del repository e non si aprono da un visore di
Markdown (sono nella sezione «Stato»). **Nessun controllo** guarda la lunghezza di un documento, e il solo limite scritto, «il quadro sotto le
75 righe», si rispetta con righe più lunghe: 60 righe, 25 KB.

### 1.5 Perché

La convenzione dice di aggiungere una riga all'indice per ogni sottosistema cambiato, e ogni task aggiunge la sua frase alla riga del suo
sottosistema invece di metterla nei dettagli; nessun task toglie. Il nucleo cresce quindi con il numero dei task, non con quello delle regole.
Una gerarchia tiene solo se (a) ogni livello ha un tetto misurato in caratteri, (b) è chiaro che cosa ci entra e che cosa no, (c) un test
fallisce quando la si rompe, e (d) ciò che cambia ogni giorno sta fuori dai livelli alti.

<a id="livelli"></a>
## 2. La proposta: tre livelli e i registri

| Livello | Documento | Tetto | Contiene | Non contiene | Chi lo legge |
|---|---|---|---|---|---|
| **1** | [`docs/panoramica.md`](../panoramica.md) | 10 000 caratteri, 120 righe (due pagine) | che cos'è il gioco, gli strati del codice, una riga per regola, un link per sottosistema, come si lavora, i livelli | versioni, task, crediti, nomi di funzioni | l'autore e ogni agente, per primo e intero |
| **2** | `AGENTS.md` (il nucleo) | proposta: 60 KB, ~17 000 token (D1) | le regole (la norma), lo stack, i comandi di `npm`, le cartelle, una riga per agente, l'indice a una riga, il manifest, l'API Lua, il protocollo, le convenzioni | la storia (task), l'elenco delle funzioni, gli script del laboratorio uno per uno | ogni sessione, intero |
| **3** | i dettagli per sottosistema, il glossario, la lingua interna, le fasi, gli studi, le guide, la sicurezza | nessuno: si legge una parte | tutto ciò che serve a lavorare su un'area | — | la parte che il task tocca |
| registri | ADR, backlog, diario e consumi della pipeline, domande, registro delle vulnerabilità, richieste dell'autore, archivio | nessuno | la storia, in ordine | — | si cercano; ognuno ha la sua sintesi (l'indice degli ADR, il quadro, `.pipeline-task.md`, `aperte.md`) |

Ogni livello riassume quello sotto e non dice niente che lì non ci sia. In caso di dubbio vince il livello più basso che lo dice per intero:
la regola nel nucleo, il meccanismo nei dettagli.

<a id="regole"></a>
### 2.1 Chi aggiorna che cosa

| Che cosa cambia | Che cosa si aggiorna | Chi lo controlla |
|---|---|---|
| un sottosistema (il caso comune) | la sua sezione di livello 3; nel nucleo niente, a meno che la sua riga dell'indice diventi falsa | la revisione; con P1 la lunghezza della riga |
| un sottosistema nuovo | una sezione di livello 3 con la sua ancora, una riga nell'indice del nucleo, **un link nella panoramica** | `tests/documenti.test.ts` |
| una regola inviolabile nuova o cambiata | il nucleo, un ADR, **la sua riga nella panoramica**, nello stesso ordine | `tests/documenti.test.ts` |
| un documento nuovo in cima a `docs/` | la sua voce in `DOC_LEVELS` (`tools/documenti/livelli.ts`) con il livello e chi lo legge | `tests/documenti.test.ts` |
| un nome nuovo | il glossario | `tests/glossario.test.ts` |
| uno stato (versione, task, crediti, fase) | il quadro, le fasi, il backlog; **mai** il livello 1, e con P5 nemmeno il nucleo | `tests/documenti.test.ts` (livello 1) |
| una decisione | un ADR e la sua riga nell'indice, con lo stato in poche parole | la revisione |
| la panoramica stessa | chi cambia il disegno d'insieme (uno strato, un modo di lavorare); l'autore la rilegge quando vuole | — |

### 2.2 I controlli

Fatti con questo task (`tests/documenti.test.ts`, funzioni in `tools/documenti/livelli.ts`):

- la panoramica sta nel suo tetto (caratteri e righe) e non dice un task né una versione;
- ogni suo link arriva a un file che esiste e, se è un Markdown, all'ancora che nomina;
- ogni regola inviolabile del nucleo ha la sua riga nella panoramica, nello stesso ordine, e nessuna in più;
- ogni sezione dei dettagli (`<a id>`) ha un link nella panoramica;
- il nucleo rimanda alla panoramica; ogni file e cartella in cima a `docs/` ha un livello.

Da fare nella catena: il tetto del nucleo **a cricchetto** (un numero nel test che i task della catena abbassano e nessun altro alza: chi
ha bisogno di spazio sposta qualcosa al livello 3), le righe dell'indice entro 300 caratteri, i link di tutti i documenti di livello 2 e 3,
niente numeri di task nel nucleo, il quadro misurato in caratteri.

### 2.3 Che cosa cambia per gli agenti

Oggi la panoramica si aggiunge e non toglie niente: il nucleo resta intero finché la catena non lo asciuga. Con il nucleo a 60 KB, ogni
sessione partirebbe con ~17 000 + 2 400 token invece di ~47 000, e il resto lo leggerebbe dove serve. La panoramica serve anche a un agente
che deve decidere *dove* guardare, prima di leggere una sezione intera dei dettagli.

## 3. Graphify, rivalutato

### 3.1 Allora

ADR-0045 (22/10) lo ha provato su una copia: 257 file, 12 secondi, nessun token, 3 158 nodi e 7 099 archi dal codice, letti con tree-sitter.
Le chiamate erano giuste; i 100 programmi XML non li leggeva, i manifest JSON diventavano alberi di chiavi, i documenti senza un modello erano
solo titoli, un ADR citato nel codice era un nodo diverso dall'ADR. La decisione: un grafo nativo per il gioco (`src/kernel/graph.ts`, che
c'è) e graphify facoltativo per lo sviluppo, fuori dal progetto, senza skill, MCP né hook, perché il repository era piccolo e `Grep` bastava.

### 3.2 Oggi

Il repository: 748 file di codice in `src/`, `server/`, `site/`, `tools/`, `lab/` (185 000 righe; `kernel.ts` da solo 14 000), 363 file di
test, 1 761 programmi XML, ~6,4 MB di documenti. Graphify oggi (dalla sua documentazione; **non provato qui**: non è installato, e ADR-0045
vuole il permesso dell'autore per eseguire codice esterno) è una skill per Claude Code e per altri agenti, Gemini CLI compreso; con
`graphify claude install` scrive regole in `CLAUDE.md` e mette un hook prima di ogni `Glob` e `Grep` perché l'agente legga il rapporto del
grafo; con `--watch` ricostruisce il codice dall'albero sintattico senza modelli; i documenti e le immagini li manda a un modello per
l'estrazione dei concetti. Strumenti simili (un grafo del codice da tree-sitter in SQLite, servito per MCP) promettono domande strutturali
(chi chiama, chi è chiamato) al posto delle catene di `Grep`.

### 3.3 Che cosa darebbe

- **Sul codice**: chi chiama chi, i nodi centrali, le comunità; utile per orientarsi in `kernel.ts` e prima di un refactor. Costa poco
  (secondi, nessun token), ma ogni worktree ha la sua cartella `graphify-out/` (ignorata da git) da ricostruire, e un hook che cambia come
  cercano cinque agenti di tre provider in parallelo spinge verso un grafo che in un worktree è vecchio. Oggi trovare il codice non è il
  problema misurato: le sezioni dei dettagli dicono i loro file, il glossario il «Dove vive» di ogni concetto, e i percorsi citati esistono.
- **Sui documenti**: la passata dei concetti chiede un modello su ~1,8 milioni di token per la prima costruzione, e poi sui file cambiati. Gli
  archi sono dedotti da un modello: l'autore non li può verificare più di quanto verifichi i documenti. Dà comunità e nodi centrali, non una
  pagina che si legge in cinque minuti; e non **controlla** niente: non sa dire che una regola del nucleo manca dalla panoramica, che un link è
  rotto, che una riga dell'indice è diventata un paragrafo.
- Ciò che l'autore chiede, il quadro e la coerenza, viene da un livello 1 scritto e corto e da controlli deterministici nei test: la stessa
  ragione per cui il grafo del gioco è nativo (ADR-0045, punto b).

### 3.4 Raccomandazione

Graphify resta facoltativo e fuori dal flusso degli agenti (niente hook, skill né MCP) finché una prova non dice che fa risparmiare: P6, con il
permesso dell'autore di installarlo, lo misura sul codice soltanto, su una copia, rifacendo tre task già chiusi con e senza il suo rapporto e
confrontando token e tempi (D4). Per i documenti, il grafo che serve è piccolo e nostro: i link, le regole, le sezioni e i livelli che
`tools/documenti/livelli.ts` legge, controllati dai test.

## 4. La catena

I task che fanno il resto, in ordine; il pianificatore li porta nel backlog dopo le risposte a [D/T524](../pipeline/domande/T524.md). Ogni
task che asciuga il nucleo **sposta e non riscrive**: il testo tolto finisce, uguale, nella sezione dei dettagli che gli corrisponde, e uno
script del task controlla che ogni frase tolta sia arrivata (le frasi di cinque parole).

| | Che cosa | Fatto quando | Dipende da | Stima |
|---|---|---|---|---|
| **P1** | L'indice del nucleo a una riga: ogni voce entro 300 caratteri, il resto nella sua sezione dei dettagli | ogni riga dell'indice ≤ 300 caratteri (test); nessuna frase persa; il nucleo sotto i 115 KB | D1 | claude, sforzo high, 3 % |
| **P2** | Comandi e struttura: nel nucleo i comandi di `npm` e una riga per famiglia di script, le cartelle con una riga; gli script uno per uno e i file uno per uno in due sezioni nuove dei dettagli (`#comandi`, `#struttura`) | il nucleo sotto i 75 KB; i link della panoramica alle due sezioni | P1 | claude, sforzo high, 3 % |
| **P3** | Le regole lunghe (le otto oltre 600 caratteri: 6, 8d, 8g, 8h, 8i, 8j, 9 con 2 000, 10 con quasi 5 000): la norma resta nel nucleo, l'elenco delle funzioni e dei casi va nella sezione del sottosistema | ogni regola ≤ 600 caratteri; la panoramica invariata; il nucleo ≤ 60 KB | D2, P2 | claude, sforzo extra, 3 % |
| **P4** | I dettagli in un file per sottosistema (`docs/architettura/<ancora>.md`); `architettura-dettagli.md` resta l'indice, e ogni ancora di prima porta al suo file | i link di prima arrivano; la panoramica, il nucleo e il censimento del glossario puntano ai file | D3 | claude, sforzo high, 3 % |
| **P5** | Il cricchetto e la pulizia: il tetto del nucleo nel test, niente task nel nucleo, i link dei livelli 2 e 3 controllati, il quadro in caratteri, «Stato e prossimi passi» sostituito da un rimando al quadro e alle fasi, `docs/README.md` ridotto all'archivio e alla mappa, l'indice degli ADR con lo stato in poche parole | i test dei livelli 2 e 3 verdi | P3, P4 | claude, sforzo high, 2 % |
| **P6** | La prova di graphify sul codice (se D4 la vuole): installato in un ambiente a parte con il permesso dell'autore, su una copia; tre task chiusi rifatti con e senza il rapporto del grafo | un rapporto con token, tempi e i casi in cui ha aiutato; la decisione nell'ADR | D4 | claude, sforzo high, 2 % + i tre task |
| **P7** | Chi carica che cosa: `CLAUDE.md` e `GEMINI.md` importano la panoramica prima del nucleo, `orchestra.md`, `pianifica.md` e il prompt dei task della pipeline la nominano | un task lanciato dalla pipeline legge la panoramica (la sua traccia lo dice) | D5, P3 | claude, sforzo medium, 1 % |

In tutto ~17 % senza la prova. P1-P3 cambiano solo documenti e un test: si possono fare uno dopo l'altro anche mentre altri task lavorano,
ma ognuno tocca `AGENTS.md` per intero e va integrato presto, prima che i task paralleli vi aggiungano righe.
