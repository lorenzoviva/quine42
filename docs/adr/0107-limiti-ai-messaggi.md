# ADR-0107 — I limiti ai messaggi

Stato: accettato (T129, V-011; 02/11/2026). Modifica ADR-0058 (ciò che il server fa dei messaggi di un client).

## Contesto

`inbox` non aveva tetto: un client poteva mandare messaggi a piacere, ognuno di quelli che chiamano il modello diventava una chiamata, e il testo arrivava al Narratore fino ai 256 KB del
WebSocket (tagliato solo per `agente`). Il kit di T137 lo ha misurato: 600 messaggi su 600 serviti. Con le chiamate di uno solo si consumano i budget del mondo (`ai.maxText`), che sono di tutti.

## Decisione

In `src/session/server.ts`, con i numeri in `LIMITS`, tutti ben sopra ciò che il gioco manda (20 passi al secondo e qualche azione):

- **Ritmo per viandante**, all'arrivo del messaggio (`hear`), prima che entri in `inbox`: 60 messaggi al secondo, 120 di colpo. Il credito è del viandante, non del collegamento: rientrare non lo riempie.
  Ciò che è oltre riceve un `esito` con il motivo; un passo perso non riceve niente, lo rimedia il passo dopo.
- **Un ritmo più stretto per ciò che può chiamare i modelli** (`heavy`: `chat altro pronuncia agente`, `fabbrica` senza ricetta, `azione` per `leggi esamina parla`, e `profilo`, che scrive lo stato):
  uno ogni due secondi, 20 di colpo. Il resto (raccogliere, aprire, spostare, una ricetta nota) non conta qui.
- **Una coda per pagante** (`startWaiting`): di quei messaggi al più 2 per viandante in corso, gli altri aspettano, al più 8; chi riempie la sua coda non fa aspettare nessun altro, chi se ne va non paga
  ciò che aspettava. Una raccolta non passa dalla coda: non aspetta mai una chiacchierata. Di un messaggio il pagante è chi lo manda (`payerOf`), e lo è anche per le spese comuni che causa: il ritmo vale per lui.
- **Lunghezza massima**: 500 caratteri per il testo verso il Concilio (i campi del gioco ne fanno passare 160-300), 2000 per `agente` come prima, 64 per il nome con cui si entra. Il di più si taglia.
- **Chi non smette viene chiuso**: i rifiuti si accumulano e svaniscono al ritmo di 60 al secondo; oltre 600 il collegamento si chiude con un `rifiuto`, così nemmeno i rifiuti costano all'infinito.
- In `server/session.ts` ciò che arriva mentre il mondo si apre si tiene al più per 16 messaggi.

Il credito torna con `tick(dt)`, come quello dei passi: niente orologio nel server di sessione, e i test sono deterministici.

## Alternative

- **Contare le chiamate vere al modello** invece dei messaggi: è più esatto, ma la chiamata si conosce solo dopo aver cominciato, e un budget a posteriori non ferma una raffica.
- **Far passare dalla coda ogni azione**: più semplice, ma una raccolta aspetterebbe la risposta di una chiacchierata, e il client, che l'ha già mostrata, tornerebbe indietro.
- **Lo stesso ritmo per tutti i messaggi**: o è stretto e si sente camminando, o è largo e non difende i modelli.
- **Il master senza limiti**: i numeri non si sentono nemmeno da lui, e una regola in meno.

## Conseguenze

- Un giocatore con crediti può ancora chiedere una chiamata ogni due secondi, che paga lui; senza crediti o da anonimo usa i modelli locali (ADR-0081), che non toccano i budget. Più stretto di così si sentirebbe giocando; un budget per viandante è un'altra decisione.
- Sul numero di account non c'è limite: chi ha molti account ha molti crediti di ritmo. Gli anonimi non arrivano ai modelli; gli altri pagano.
- Il peso in byte non è contato: fino a 60 messaggi al secondo da 256 KB si leggono e si scartano. Abbassare `MAX_MESSAGE` non si può finché il ramo del master viaggia intero; se pesa, si conta in `server/session.ts`.
- Un messaggio nuovo che può chiamare i modelli va in `heavy`, e il suo testo passa da `words`.
