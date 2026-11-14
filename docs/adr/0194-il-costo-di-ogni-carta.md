# ADR-0194 — Il costo di ogni carta e il server che l'ha misurato

Data: 2026-11-14 · Stato: accettato · Riferimenti: ADR-0056 (le carte), ADR-0084 (l'eredità dei cloni), ADR-0170 (le carte portate),
ADR-0184 (la open beta), ADR-0193 (OpenRouter e il costo detto); [`docs/design/open-beta.md`](../design/open-beta.md) § 4 e § 6 riga 5;
T365 (step 43); D49 (la rendita delle carte in Fase VI solo dall'uso reale)

## Contesto

Perché in Fase V una carta si possa pesare per ciò che è costata e per quanto è usata, la carta deve sapere quanto è costata. Oggi
`world/usage.json` somma per giorno, modello, compito e pagante, non per carta; e da T362 una chiamata via OpenRouter dice il suo costo
(`CallRecord.usd`). Il § 4 dello studio chiede anche **di quale storia fidarsi**: in Fase VI conta solo quella scritta su un server
dell'autore (o su uno che lui riconosce); quella di un disco altrui è un dato dichiarato.

Le chiamate non portano l'id della carta che faranno: un contenuto nasce da più chiamate di più agenti (la Fucina: concetto, fisica,
codice, revisione), e alcune richieste dello stesso tipo girano insieme (le forge della Genesi, i luoghi pianificati attorno al viandante).

## Decisione

1. **Il timbro di una carta ha due campi in più**, facoltativi: `usd` (i dollari delle chiamate che l'hanno fatta, al milionesimo) e
   `server` (l'origine del server il cui mondo l'ha fatta). `allCards` li mostra, `readCards` li tiene per le carte dei luoghi; si leggono
   senza fidarsi (`costFields`: un numero finito ≥ 0, un'origine `https://…` o `http://` solo per questa macchina), il resto non c'è.
2. **Quali chiamate fanno una carta** (`CARD_MAKERS` in `cards.ts`): il compito con cui il kernel timbra (`commitContent`, `cardChunk`,
   `recordRule`) → i compiti delle chiamate che fanno quel contenuto (`forge.concept` ← concetto, codice, fisica, revisione; `model.sculpt`
   ← scultura e giudizio dell'Artista; `items.citati` ← `content.define`…). Una chiamata di un compito fuori elenco (una chat, una guardia,
   una revisione, una sessione del Concilio, la quarta parete) non fa carte: i suoi dollari sono del mondo, non di una carta. Ogni compito
   delle chiamate sta in un gruppo solo ed è un compito del censimento (un test lo tiene).
3. **Il costo di una chiamata** è `callCost`: ciò che il fornitore ha detto (OpenRouter), altrimenti il listino. Si aggiunge al gruppo
   quando arriva (`Kernel.called`, accanto al registro dei consumi e all'addebito), anche per le decisioni chiuse di Jev (`model.reuse`).
4. **La divisione** (`CardCosts`): un timbro prende la sua parte del gruppo e la divide tra le carte che firma nello stesso commit
   (`stampFiles` firma tutto prima di scrivere e chiama `settle`). La sua parte è tutto ciò che il gruppo ha in attesa quando le richieste
   vengono una alla volta; dove girano insieme (la Fucina, i luoghi) ogni richiesta dice quando comincia e quando finisce (`begin`), e un
   timbro prende ciò che è in attesa diviso per le richieste ancora aperte, la sua compresa. Un tentativo che non ha fatto niente lascia
   le sue chiamate alle carte successive del gruppo: la somma delle carte è la somma delle chiamate che hanno fatto carte. Nessuna chiamata
   del gruppo, nessun `usd`: il seme, un universo di prima, una regola del kernel, i modelli locali (che non dicono niente).
5. **La provenienza** la dice solo il server: il server di produzione passa al mondo di molti la prima delle sue `QUINE_ORIGINI`
   (`SessionOptions.server` → `WorldOptions.server` → `WorldOpen.server` sul canale → `openUniverse` → `KernelOptions.server`); il ramo del
   master la eredita. Un kernel nel browser (la partita da soli) o in `npm run dev` non la scrive: la sua storia è dichiarata, non contata.
6. **Ciò che viaggia** tiene ciò che diceva: un clone tiene i timbri com'erano (catena allungata, ADR-0084), una carta portata (ADR-0170)
   tiene `usd` e `server` dell'universo da cui viene, letti con `costFields`. Il loro costo resta quello misurato dove sono nate, e il
   server lo dice. L'impronta del contenuto non cambia (`contentText` salta il timbro) e le quote nemmeno.

## Alternative considerate

- **L'id della carta su ogni chiamata** (un ambito che il Concilio porta da una richiesta alle sue chiamate): esatto anche per le
  richieste parallele, ma ogni flusso che crea contenuti (Fucina, luoghi, modelli, suoni, pacchetti, Genesi, giudizi) dovrebbe portarlo
  fino a `Council.ask`, e senza un contesto asincrono nel browser non c'è un modo implicito. Rimandato: se in Fase V la divisione non
  basta, si comincia dalla Fucina.
- **Tutto ciò che è in attesa al primo timbro**: con le forge della Genesi la prima carta prendeva il costo di tre e le altre niente.
  Scartata per le richieste parallele; resta il comportamento dei gruppi che vanno uno alla volta.
- **Il costo nel registro delle carte** (`world/cards.json` accanto agli utilizzi): il timbro va dove va la carta (un clone, una carta
  portata), il registro no. Scelto il timbro; le carte dei luoghi stanno comunque in `world/cards.json`.
- **Un `server` scritto dal browser** (`location.origin`): chi gioca da solo scrive i file del suo universo attraverso lo store e può
  scrivere ciò che vuole; una provenienza che il client dichiara non distingue niente. Scartato.

## Conseguenze

- `src/kernel/cards.ts` (`CardStamp.usd`, `server`, `CARD_MAKERS`, `CardCosts`, `costFields`, `stampFiles` con `settle`), `kernel.ts`
  (`called`, `priceCards`, `begin` nella Fucina e nei luoghi, `KernelOptions.server`), `bring.ts`, il filo del server fino al mondo.
  Kernel 0.7.5: nessun formato cambia (due campi facoltativi nei timbri).
- Approssimato: richieste parallele dello stesso gruppo si dividono in parti uguali ciò che è in attesa, non ciò che ciascuna ha speso.
- Sicurezza: nessuna superficie nuova. L'origine del server è già pubblica e arriva al mondo per valore, come la commissione; i campi letti
  da un universo passano da `costFields`. Un master che riscrive i file del suo universo può riscrivere anche questi: è il punto 2 del § 4
  dello studio, che la Fase VI dovrà chiudere (solo la storia di un server dell'autore conta).
