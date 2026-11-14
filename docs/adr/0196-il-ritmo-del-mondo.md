# ADR-0196 — Il ritmo del mondo: la manopola del master che scende soltanto, la pausa che trattiene ciò che il mondo fa da sé

Data: 2026-11-14 · Stato: **accettato** (T373, step 43; applica ADR-0188 punto 3, D54.3 e D54.4) · Riferimenti:
[`docs/design/campagna-master.md`](../design/campagna-master.md) § 3 e § 7 punti 5-6, ADR-0110 (i mondi senza segreti), ADR-0107 (i ritmi per
viandante), ADR-0133 (le regolazioni si fissano entrando), ADR-0194 (`universes/.campaign/`)

## Contesto

ADR-0188 (punto 3) ha deciso il ritmo del mondo: `pace`, `normal`, `slow` o `hold`, una manopola del master che scende soltanto, l'eccezione scritta a
ADR-0133. D54.3: la pausa ferma ciò che il mondo fa da sé (i dialoghi fra individui, le trame, le sessioni; i luoghi nuovi restano bozze) e lascia le
risposte ai viandanti. D54.4: l'HUD dice «il mondo è in pausa: il master lo sta scrivendo». Restava da dire come, dove si tiene, chi lo cambia.

## Decisione

1. **Una funzione pura** (`src/kernel/worldPace.ts`): `WorldPace { mode, placesPerMinute? }`; `readPace` ripara ciò che arriva (un modo ignoto è
   `normal`, i luoghi al minuto solo per `slow`, interi nella scala della lobby); `placesPerMinute(pace, lobby)` è al più la lobby (`slow` senza numero:
   4; `hold`: 0); `paceGap` allunga le pause dello Scultore e del Musicista (`slow`: il doppio, almeno 60 secondi del mondo, perché a coefficiente 1 la
   pausa è 0) e non le accorcia mai. Nessuna funzione alza ciò che la lobby ha fissato: è il «solo verso il basso».
2. **Il kernel** tiene il ritmo in memoria, mai nell'universo (`worldPace`, `paceHeld`, `pacedGap`). `setPace(raw, by)` solo per il master
   (`isMaster`; uno specchio rifiuta: lo decide il mondo); `applyPace(raw, quiet)` per ciò che arriva da dove si tiene, con `pace` sul bus quando cambia
   (non `quiet`). La quota dei luoghi nuovi (`chunkQuota`) è `placesPerMinute(pace, lobby)`, con la lobby infinita da soli: da soli `slow` ha un
   tetto, la lobby no. In `hold` la quota è 0, quindi `pumpDevelopment` pianifica solo i luoghi che l'universo ha già (il piano su disco: niente
   chiamate) e lascia bozze gli altri (`held`, «il mondo è in pausa, resta abbozzato» nel registro); un luogo noto torna senza ciò che chiederebbe
   (`introduceItems`, `forgeForChunk` e i battiti di `growContent`, `growCast`, `holdSession`), che si rifà quando torna dopo. Fermi anche il
   `ModelDirector`, lo `ScoreDirector`, le sessioni del Concilio, i pacchetti non chiesti, e nella società (`NpcHost.paused`) gli individui nuovi, le
   trame (le tappe e le trame nuove: le tappe dovute nel frattempo accadono al primo sguardo dopo), i dialoghi fra individui. Ciò che è in volo finisce.
   Le risposte a ciò che un viandante fa (parlare, «Altro…», «Esamina», fabbricare, incantare, il Referente) continuano. **«Normale» riprende da
   dove sono i giocatori**: le bozze più vicine a un viandante per prime, come sempre (`pumpDevelopment` ordina per distanza).
3. **Il filo**: il messaggio `pace` del client (`mode`, `placesPerMinute`), solo del master, con un ritmo suo (`LIMITS.paceRate` 0,2 al secondo,
   `paceBurst` 4) oltre a quello di ogni messaggio; la risposta dice il ritmo come il mondo l'ha preso. Ogni client riceve `pace` nel `welcome`
   quando non è normale e nell'`update` quando cambia (`SessionClient.pace`); il client sottile lo mette nello specchio (`applyPace(…, true)`) e,
   per il master, `setPace` diventa il messaggio.
4. **Dove si tiene**: `universes/.campaign/<nome>.json → pace` (ADR-0194), solo se non è normale; lo scrive solo il server, riparato e sotto il
   lucchetto, toccando solo quel campo (`keepPace`); un file illeggibile dà normale (`keptPace`: un mondo non si ferma per un file rotto). Il mondo lo
   riceve **per valore**: all'avvio (`WorldOpen.pace`, chiesto a ogni avvio) e dalla rotta (`WorldCalls.setPace`). Quando il master lo cambia sul
   filo, il mondo lo dice al server (il messaggio `pace` del canale), che lo tiene: il processo del mondo non apre mai il file (regola 8g). Un mondo
   compromesso può al più fermare o rallentare sé stesso.
5. **La rotta** `GET|POST /api/universe/<nome>/pace` (per il sito, T377): solo il master di un universo di molti (`owns`), mai il token del mondo,
   solo JSON e 4 KiB come `guests`, sotto `HEAVY`; un universo privato a chi non lo vede risponde come un nome che non c'è. Scrive il file e lo dice
   al mondo acceso (`tellPace`). Da soli il ritmo è del kernel del browser e non si tiene: una ricarica riapre la lobby.
6. **Dove si cambia**: la console del master (scheda «Concilio») e la Direzione (accanto ai luoghi in coda) hanno la stessa riga
   (`src/ui/pace.ts`): «Ritmo del mondo: normale · lento · in pausa», con ciò che vuol dire. Non passa dal Referente: è un comando del kernel.
7. **Ciò che vedono i giocatori**: nel mondo nulla (regola 0: la bozza è ciò che si vede già mentre il Cartografo scrive); l'HUD, fuori dal mondo,
   una striscia finché dura: «Il mondo è in pausa: il master lo sta scrivendo» (al master: «i luoghi nuovi restano abbozzati finché non lo riprendi»).
8. **ADR-0133 con l'eccezione**: a partita in corso il master può rallentare o fermare ciò che il mondo fa da sé, mai accelerarlo oltre la lobby.
   Le manopole, i modelli, i budget e `ai` restano della lobby; `pace` non è in `ai` e non è in `universe.json`.

## Alternative scartate

- **La pausa in `generationHeld`**: è della lobby e della Genesi, e ferma anche il salvataggio dello stato (`saveState`) e ciò che chiede il
  viandante (gli incantesimi nuovi). Scartata: un campo a parte, letto dove il mondo fa da sé.
- **In pausa nessun luogo, nemmeno quelli noti**: i giocatori vedrebbero sparire i villaggi che il master ha già scritto. Scartata: un luogo con il
  piano su disco torna, senza chiamate.
- **Il server che legge il messaggio `pace` sul socket, prima del mondo**: dovrebbe capire il protocollo e sapere chi è il master del mondo acceso.
  Scartata: lo decide il mondo, che lo dice al server col solo valore, riparato da chi lo tiene.
- **Spostare l'inizio delle trame della durata della pausa**: le tappe sono giorni del mondo, che in pausa scorre. Scartata per ora: le tappe dovute
  accadono al primo sguardo dopo la pausa.

## Conseguenze

- `AGENTS.md`: la regola 8b-bis dice l'eccezione; la struttura nomina `worldPace.ts` e `src/ui/pace.ts`; l'indice (`#lobby`, `#multigiocatore`).
  `docs/architettura-dettagli.md` (`#lobby`), il glossario («Ritmo del mondo», l'omonimo «ritmo»), il registro della sicurezza (V-039).
- Il sito (la pagina della sessione) usa la rotta in T377; l'atlante del master che mostra i luoghi trattenuti e la regione `trattenuta` sono di T375.
- Kernel 0.7.7 (Z: nessun formato dell'universo cambia; il protocollo ha un messaggio e un campo in più, facoltativi).
