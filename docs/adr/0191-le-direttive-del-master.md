# ADR-0191 — Le direttive del master: `world/campaign.md` a sezioni nelle richieste del Concilio, scritte dal master e dal Referente, con la sola quarta parete locale

Data: 2026-11-14 · Stato: **accettato** (T374, step 43) · Riferimenti: [ADR-0188](0188-la-campagna-del-master.md) punto 4 (la via E dello
studio [`campagna-master.md`](../design/campagna-master.md), § 4), D54.5 (autore, 13/11: la via di mezzo), ADR-0025 (i due tavoli),
ADR-0102 (chi può scrivere), ADR-0109 (gli elenchi di ciò che esce), ADR-0157 (le decisioni chiuse), ADR-0161 (`cleanText`), ADR-0165 (la
lingua delle richieste), ADR-0186 (la cache esplicita dell'Attore)

## Contesto

ADR-0188 propone che il master dica agli agenti **come** fare il mondo da qui in avanti («niente draghi», «i nomi in lingua d'oïl», «le case
di pietra a nord») in un file solo a sezioni per competenza, iniettato nella parte stabile delle richieste. L'autore l'ha accettato con la via
di mezzo sulla quarta parete (D54.5): le direttive scritte dal master non passano da Jev, `metaBreak` locale sempre, Jev `text.fourthwall`
una manopola negli universi privati. Restavano da decidere la forma del file, chi legge che cosa, come un testo del master entra nelle
richieste senza diventare meta-gioco negli agenti, e come lo scrive il Referente.

## Decisione

1. **Il file** è `world/campaign.md`, nella lingua del mondo, con sei sezioni: `## Per tutti`, `## Narratore`, `## Cartografo`,
   `## Scultore e Artista`, `## Ingegnere e Fisico`, `## Musicista`. Un titolo vale in ognuna delle quattro lingue del mondo e per il suo id
   (`all`, `narrator`, `cartographer`, `sculptor-artist`, `engineer-physicist`, `musician`); il titolo `#` del file e i commenti HTML non
   arrivano a nessuno. Tetti: 4.000 caratteri per sezione, 12.000 per il file. Il validatore (`readCampaign`) rifiuta una sezione che
   nessuno legge, una sezione ripetuta, il testo fuori da una sezione e ciò che supera i tetti; un file scritto lo stesso (l'editor lo
   permette, regola 3) arriva tagliato alle prime righe di ogni sezione entro i tetti.
2. **Chi legge che cosa** (`campaignSectionsFor`): ogni agente «Per tutti» e la sua sezione (lo Scultore e l'Artista la loro comune, così
   l'Ingegnere e il Fisico); l'Arbitro e il Referente tutto; l'Attore solo «Per tutti» (interpreta, non inventa fatti); le decisioni chiuse
   niente: `Council.decide` porta lo stato del mondo, mai il contesto degli agenti. Il blocco (`campaignPrompt`) sta in `Council.context`
   dopo il riassunto della partita e prima di ciò che l'agente sa, nella parte stabile che la cache implicita (e quella esplicita
   dell'Attore) serve; un'intestazione inglese, le righe nella lingua del mondo (ADR-0165); niente righe, niente blocco.
3. **La quarta parete è locale, sempre** (D54.5): ogni riga del file passa da `metaBreak` con le parole del lessico e la lingua del mondo;
   una riga che la rompe resta fuori dalle richieste (non si cancella: è il testo del master, regola 3) e il registro del Concilio lo dice una
   volta, e solo il master lo sente; l'editor lo dice salvando. Il testo del master non va a Jev (D45.3, D54.5).
4. **Il Referente** ha l'incarico `directive` accanto a `rule`: capisce la sezione (`section` nello schema, un id; una sezione ignota vale
   «Per tutti») e riscrive la direttiva in una riga nei termini del mondo. Il kernel (`Kernel.addDirective`) la scrive solo per il master
   (`isMaster`: da soli sempre; in una partita di molti il master parla al Concilio solo sul suo ramo), la pulisce come un testo di un
   giocatore (`cleanText`: una riga, niente `<` né `>`, niente caratteri invisibili, al più 300 caratteri; spostato in
   `src/kernel/cleantext.ts`, leggero, così il validatore lo legge senza il motore delle carte), la passa da `metaBreak`, la appende alla
   sua sezione con il giorno del mondo (`- (giorno 3) …`), dentro i tetti, in un commit del kernel. Una direttiva che rompe la quarta parete
   torna al Referente **una volta** col motivo; se resta, non entra, il motivo arriva al master e la mancanza è scritta (`invalid`).
5. **Fuori dal mondo**: il file non è in `playerFiles` né in `publicFiles` (regola 8f), non è una carta e non è nel grafo; lo scrive il
   Concilio solo per conto del Referente (`world/` è già in `councilMayWrite`); in una partita di molti va sul ramo del master e nel mondo
   quando pubblica, con il validatore.
6. **La misura** è `lab/scripts/prompt-tokens.ts --campaign`: una Genesi offline e i primi luoghi con una campagna di circa 900 token (o
   `--file`), ogni richiesta controllata (46/46 con le sezioni giuste), il costo per agente e nell'ora della lobby: circa 180.000 token
   l'ora, 0,064 $ pieni (4,5 % di un'ora a Flash-Lite, lo Scultore, l'Artista e il Musicista ai loro modelli) e 0,021 $ con la cache
   implicita al 75 %.
7. **La manopola di Jev** `text.fourthwall` negli universi privati (D54.5) non è qui: l'universo privato nasce con T366, e con esso la
   manopola che il suo master può spegnere; oggi la direttiva non passa da `Council.fourthWall` in nessun universo.
8. **La versione**: kernel 0.7.1; un universo senza `world/campaign.md` è quello di prima, nessuna migrazione.

## Alternative considerate

- **Le righe che rompono la quarta parete come errore del validatore**: il master non potrebbe salvare il suo file senza «Scrivi
  comunque», e un universo resterebbe senza commit per una parola. Scartata: si isola, si dice, non si blocca (regola 3).
- **Jev sulle direttive**: è il testo libero di chi gioca (D45.3) e l'autore l'ha escluso (D54.5).
- **Il file nel seme con le sezioni vuote**: ogni universo avrebbe preso un file nuovo dal seme. Scartata: l'editor mostra il file anche
  quando manca, con il modello delle sezioni nella lingua del mondo (`campaignTemplate`), e un universo che non lo scrive non cambia.
- **Riformulare a ogni rifiuto finché passa**: chiamate senza fine. Scartata: un solo rinvio, poi il motivo al master.

## Conseguenze

- `AGENTS.md`: la tabella del Concilio (il Referente scrive le direttive), l'indice (`#concilio`), la struttura (`campaign.ts`,
  `cleantext.ts`, `world/campaign.md`); `docs/architettura-dettagli.md#concilio`; il glossario («Direttive del master»); la voce V-036 del
  registro della sicurezza (`tests/sicurezza/direttive.test.ts`).
- Il testo del master che il filtro non prende arriva agli agenti: il master lo vede nel file e lo corregge; la quarta parete sui testi
  che il Concilio scrive (T350) resta a valle.
