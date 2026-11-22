# ADR-0250 — Ogni oggetto ha un uso: il Narratore lo dà, il validatore lo vuole, il mondo lo dice

Data: 2026-11-22 · Stato: accettato (task T489 del backlog, richiesta dell'autore del 21/11 dopo la prima run, T457) ·
Riferimenti: ADR-0025 (niente meta-gioco), ADR-0130 (le mancanze), ADR-0140 (i mestieri come programmi), ADR-0147 (le imprese),
ADR-0180 (ciò che si indossa), ADR-0244 (la riparazione degli universi di prima, lo stesso schema), il rapporto
`lab/banco/run-1/oggetti.md`

## Contesto

Nella prima run (`orichalcum`, 18 minuti) il mondo si è riempito di oggetti che non si capiva come usare né combinare. Il rapporto di
T489 (`lab/scripts/oggetti-uso.ts`) lo misura: su 520 oggetti generati, **321 (62 %) non hanno nessun uso** che il kernel sappia fare;
nella run 273 su 382 (71 %). Quasi tutti vengono da `content.define` (`items.citati`: ciò che una persona porta, nomina, trova a terra),
288 su 379: il Narratore li definisce uno per volta, con categoria, peso ed etichette, senza ricette né azioni. I pacchetti
(`content.items`) hanno le ricette accanto e stanno meglio (una trentina senza uso su 137). Un uso c'era e non si vedeva: 25 oggetti
servono a un'azione di una cosa o di una persona del mondo, ma niente lo diceva dove li si tiene; la scheda «Crea» elencava tutte le
ricette del mondo, anche di cose mai viste; «Usa» su una materia rispondeva «non si usa così».

## Decisione

1. **Gli usi sono letti dai dati** (`src/kernel/itemuse.ts`, puro: `usesOf(def, world)`), mai chiesti a un modello. Un oggetto si usa
   se: si consuma con effetti (`core.items`: si mangia, si beve, si usa su di sé, si assorbe; la bombola si respira dove il mondo conta il
   respiro), si accende (categoria `light`), è una borsa (`container`), si indossa su una zona del corpo (ADR-0180) o entra in un posto
   di una scheda di una meccanica (per il suo posto, o per categoria o etichetta solo con un bonus che la meccanica legga), ha un'azione
   propria con effetti o un modulo che reagisce (`on_use`, `on_action`), un'azione del mondo lo chiede (`requires` di una cosa, di un
   terreno o di un oggetto, per id o per etichetta), taglia ciò che si abbatte (`taglio` e `tagliabile`), entra in una ricetta (consumato
   o come attrezzo), un mestiere ci lavora (`with`, o lo prende e lo mangia: non ciò che fa e porta), un cantiere lo prende, una missione lo
   aspetta. Uscire da una ricetta non è un uso: è come lo si ottiene (`madeBy`). Il ruolo (cibo, attrezzo, capo, contenitore, chiave,
   materia) è del rapporto, non un uso: il kernel non ha serrature, e una chiave serve finché un'azione del mondo la chiede.
2. **La decorazione è un segno** (`ItemDef.decoration`): un oggetto da tenere (un ornamento, un ricordo, una lettera). Il Narratore lo
   dichiara (`use: decoration`), il kernel lo scrive sugli oggetti di prima senza uso. Un uso trovato dopo (una ricetta imparata con
   «Altro…», un'azione) vince sul segno: le parole dicono l'uso.
3. **Il Narratore dà l'uso quando definisce un oggetto** (`content.define` e `content.items`): lo schema chiede `use` fra quelli che
   il kernel sa fare (`DECLARED_USES`: `consume`, `wear`, `light`, `bag`, `action`, `craft`, `decoration`) con ciò che lo regge
   (`effects`, `slot`, `container`, `action` con effetti di un insieme chiuso, `recipe` con ciò che si fa e le altre cose, coi nomi
   esatti). Il prompt dice la regola (`useRule`), i posti addosso del mondo e fino a 40 cose che una ricetta può nominare; ciò che una
   ricetta fa e non esiste il Narratore lo definisce nella stessa risposta. Il mestiere non è un uso dichiarabile: il Narratore non scrive
   i programmi dei mestieri, e un oggetto che un mestiere usa lo dice il programma; dichiararlo sarebbe un'etichetta, non un uso.
4. **Il validatore rifiuta col motivo un oggetto senza uso** (`Validator.validateItemUses`, `useError`): il motivo dice ciò che manca
   all'uso dichiarato («dice craft ma non entra in nessuna ricetta»). Un'azione di sole parole non è un uso (come per «Altro…»: si impara
   solo ciò che ha un effetto oltre il messaggio). Un oggetto con un uso regge anche se quello dichiarato è caduto. Solo per ciò che il
   Concilio scrive ora: gli oggetti di prima non si rifiutano mai al caricamento.
5. **Il ritorno al Narratore, una volta** (`introduceItems`): ciò che il validatore rifiuta torna al Narratore con i motivi in una seconda
   `content.define`; ciò che ancora non ha un uso resta fuori, con una mancanza (ADR-0130), e con lui le ricette in cui era; ma ciò che il
   viandante ha fatto o ricevuto (`keep`: una fabbricazione, una combinazione, ciò che nasce da un'azione, una ricompensa, una cosa
   affidata) resta, da tenere: il suo gesto non si blocca (regola 3). In un pacchetto ciò che non ha uso esce, con le ricette e il bottino
   in cui era, finché il resto regge (`dropRefused`); il Narratore sente il perché.
6. **Gli universi esistenti** (`markDecorations`): all'avvio il kernel marca `decoration: true` gli oggetti dei pacchetti dell'universo
   senza uso, in un commit suo («riparazione: N oggetti da tenere»), senza chiamate; non quelli del seme (`seed.json`: hanno i loro usi e
   il seme li aggiorna), non in uno specchio, sul banco o in un universo di sola lettura. Idempotente.
7. **Il mondo lo dice, in parole del mondo** (`useWords`): l'inventario sotto la descrizione, «Esamina» su un oggetto a terra dopo ciò
   che il Narratore vede (al Narratore va anche l'uso, perché la descrizione ne mostri un segno), «Usa» su ciò che `core.items` non usa
   (la risposta del seme «non si usa così» diventa ciò che ci si fa). Mai una parola del gioco: niente «ricetta», «modulo», «categoria».
8. **Le combinazioni si leggono dove si tiene l'oggetto**, non in un elenco del mondo:
   - la scheda «Crea» mostra solo le ricette che ciò che si porta apre (un ingrediente o un attrezzo nella borsa), con ciò che manca
     («ti manca: Ago»), le pronte prima (`Kernel.recipes().opened`);
   - nell'inventario un oggetto dice ciò che con lui si fa e con che cosa, con ciò che si ha già («Ago (ce l’hai)»), e un bottone
     «Fai …» per una ricetta pronta;
   - un oggetto preso (a terra o da un contenitore) che completa una ricetta fa pensare il viandante: «Con X e Y potresti fare: Z.», una
     volta a sessione per ricetta (`hintRecipes`). Una ricetta si scopre così, tenendo le cose.
9. **Il seme regge la regola**: ogni suo oggetto ha un uso (le ricette del secchio, della lanterna e della torcia, nuova; il sacco è una
   borsa da 4), gli stivali, i dadi e la lettera sono da tenere. Il generico di MockAiModels dà un uso a ogni oggetto.

## Conseguenze

- Il contratto non cambia: `decoration` è un campo in più, facoltativo, di un oggetto; il kernel sale a 0.10.25.
- Una `content.define` costa qualche centinaio di token in più (la regola, i posti, 40 nomi, lo schema dell'uso); un oggetto rifiutato
  costa una seconda chiamata per i soli rifiutati.
- La scheda «Crea» non mostra più le ricette di cose che non si portano: un mondo si scopre tenendo le cose.
- Sicurezza: nessuna superficie nuova (niente rotte, messaggi del protocollo, API Lua o file nuovi; un campo in più nei pacchetti che il
  Concilio già scrive; il testo del Narratore passa dal validatore degli effetti come quello di «Altro…»).
- Non fatto: le serrature (una chiave che apre un contenitore chiuso), un «Dai» generico alle persone, i mestieri che il Narratore
  potrebbe legare a un oggetto: compiti futuri, se il mondo li chiede.
