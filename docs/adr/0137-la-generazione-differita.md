# ADR-0137 — La generazione differita: un universo generato prima, senza browser, solo dagli abbonamenti

Data: 2026-11-05 · Stato: accettato · Riferimenti: ADR-0077, ADR-0106 (la coda e il suo isolamento), ADR-0102 (chi scrive), ADR-0110 (il gettone dei mondi), ADR-0122/0136 (la fila delle scritture), T88, T153, T207

## Contesto

La coda degli abbonamenti prende solo i compiti lenti; il resto va alle API, e sul server dei mondi di molti la coda non c'è: una partita
multigiocatore senza API non genera i luoghi nuovi. L'autore (T207) vuole poter generare un universo prima che qualcuno lo giochi, in alta
qualità, solo con gli abbonamenti. Ciò che è già pronto non ha bisogno delle API.

## Decisione

- **Un comando locale**: `npm run genera -- <universo> [--partita singola|multigiocatore] [--tema <id> | --testo "…"] [--luoghi n] [--modelli n] [--brani n] [--tetto %]`
  (`tools/generazione/genera.ts`). Apre l'universo con l'archivio dentro il suo processo (`universeHandler` su loopback, porta effimera, lo stesso
  codice e gli stessi controlli del server: percorsi ammessi, git solo da `server/git.ts`), presentandosi come un mondo del server
  (`worldToken`, buono per quell'universo soltanto), e lo fa girare in un `Kernel` senza DOM, come i test. Mai sul server di produzione: non è
  nella sua build e rifiuta `NODE_ENV=production`.
- **I passi**, uno alla volta, in quest'ordine: la Genesi (se serve, con la partita scelta all'avvio), i luoghi a spirale da `(0, 0)` (`spiral`,
  anello dopo anello) con gli individui dietro i loro personaggi (`Kernel.planAhead`, `Kernel.peopleOf`: pianifica senza un viandante vicino e
  fuori dalla quota di luoghi al minuto, perché qui il tempo del mondo non scorre), poi i modelli che mancano (`ModelDirector.make`) e i brani
  degli ambienti (`ScoreDirector.make`). Ogni passo passa dal validatore e dal filtro della quarta parete come in gioco: sono le stesse funzioni.
- **Ogni compito alla coda** (`DeferredModels`): tutti, anche quelli veloci che in gioco vanno alle API, al provider della tabella (`deferredTable`:
  l'abbonamento per tutti, salvo gli agenti che `universe.json → ai.agenti` manda alle API di proposito). Un compito che andrebbe alle API
  **ferma il comando**: la chiamata non parte, quelle dopo nemmeno, il passo non si scrive. Le richieste vanno direttamente nella cartella della coda
  (`diskQueueFetch`, `universes/.coda/`), che il processo di `npm run abbonamento` serve con la CLI isolata: l'isolamento di ADR-0106 non cambia.
- **Solo stati validi** (`StepGate`, `StepChunks`): i commit e i piani di un passo restano in mano al comando e arrivano all'universo solo quando il
  passo finisce valido, nell'ordine in cui sono nati; un commit che l'archivio rifiuta ferma il comando. Un passo fermato a metà (un compito fuori
  coda, Ctrl+C due volte, un processo ucciso) non lascia nulla: il disco resta al passo prima.
- **Si riprende da lì**: ciò che è fatto lo dice lo stato dell'universo (la Genesi c'è, i piani dei luoghi ci sono) e il file del progresso,
  fuori dall'universo come i saldi (`universes/.generazione/<nome>.json`: passi fatti, tetto, partita, consumo della settimana). Un Ctrl+C ferma dopo
  il passo in corso.
- **Il tetto**: una percentuale della settimana dell'abbonamento per universo (`--tetto`, predefinito 10 %), scritta nel file del progresso e
  **riletta prima di ogni passo** (l'autore la può cambiare mentre gira). Il consumo si misura dal contatore settimanale della CLI (`claude -p /usage`,
  letto come la pipeline, `parseUsage`): a ogni passo si somma ciò che il contatore è salito; la prima lettura di un'esecuzione fissa solo il punto
  di partenza (ciò che si usa tra due esecuzioni non è di questo universo); una settimana nuova riparte da zero. Un contatore che non si legge
  ferma il comando: un tetto senza misura non è un tetto.
- **Mai con un mondo acceso** (`server/generation.ts`): il server, accendendo un mondo di molti, scrive `universes/.accesi/<nome>.json` con il suo
  pid e lo toglie quando il mondo si ferma o si arrende; il comando prende `universes/.generazione/<nome>.lock`. Ognuno scrive il suo segno e poi
  guarda quello dell'altro, così di due partenze insieme una vede l'altra; un segno di un processo che non c'è più non conta. `worldRefusal` rifiuta
  di accendere un universo che si sta generando; due generazioni dello stesso universo non partono.

### Le scelte che T207 lasciava aperte

- **Il modello per l'alta qualità**: quello predefinito della CLI dell'abbonamento (la richiesta della coda non ne nomina uno, ADR-0077), nessuna
  revisione in più: con un abbonamento una revisione costa finestra, e il tetto la pagherebbe. Le revisioni restano quelle del gioco (lo Scultore ne
  fa una per figure e strutture).
- **Quanti luoghi**: 25 (il 5 × 5 attorno al centro) se non si dice altro; modelli e brani fino ai limiti dell'universo (`ai.maxModels`, `ai.maxBrani`).
- **Chi paga e chi è titolare**: nessuno paga in crediti. I crediti sono per le API; qui il master spende il suo abbonamento, a zero dollari nel
  registro dei consumi (`abbonamento-claude`). Per questo il comando toglie al Concilio il controllo dei crediti, che in una partita di molti senza
  collegati manderebbe ogni spesa comune ai modelli locali. Le carte hanno i titolari di sempre: la Genesi è `comune`, un luogo è di chi l'ha chiesto,
  cioè del viandante del kernel (`io`, il master).

## Chi cammina oltre ciò che è stato generato

In un mondo di molti senza API (offline), i luoghi oltre la spirale li pianificano i modelli locali, come oggi: piani di ripiego, coerenti con gli
ambienti della Genesi ma poveri; niente vuoto e niente spesa. Con la chiave, oltre la spirale si torna alle API come sempre.

## Scartato

- **Passare dalla route `/api/coda`**: servirebbe un server acceso e il suo segreto; il comando è un processo di questa macchina come quello che serve la coda.
- **Committare a metà passo**: un passo fermato lascerebbe nel disco una Genesi senza oggetti, un luogo senza individui.
- **Contare i token per il tetto**: la CLI non dice il prezzo in percentuale della settimana; il contatore di `/usage` sì.

## Limiti

- Il contatore settimanale conta anche ciò che l'autore fa con lo stesso abbonamento mentre il comando gira: il tetto è prudente, non preciso.
- Una partita in singola gira nel browser e non lascia segni: il comando non la vede. Non generare un universo che si sta giocando da soli.
- I compiti che il master ha spento con le manopole (coefficienti a zero) vanno ai modelli locali come in gioco: è ciò che il master ha chiesto.
- Non provato con la CLI vera in questa sessione: il costo di un luogo resta da misurare.
