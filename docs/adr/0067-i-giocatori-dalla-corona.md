# ADR-0067 — I giocatori dalla corona

Data: 2026-10-25 · Stato: accettato (task T42c del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0058 (il kernel
sul server), ADR-0061 (il client del giocatore) e ADR-0065 (il master).

## Contesto
Il piano del multigiocatore vuole che il master, dalla corona, veda dove sono i giocatori collegati (nel tavolo della situazione
della Direzione e nell'atlante dell'Ufficio dei luoghi) e possa seguirne uno con la camera senza uscire dalla corona. Ma lo
specchio del master sa solo ciò che il server gli manda: i luoghi, le cose e i viandanti entro `near` (24 caselle) dal suo
viandante, che nello studio sta lontano da tutti; e il renderer disegna la simulazione attorno al viandante del kernel.

## Decisione
1. **L'elenco dei giocatori** (`giocatori: PlayerSpot[]`, `{id, nome, x, y}` nello spazio del mondo): solo al master, nell'`ingresso`
   e negli `aggiorna` quando cambia; tutti i client collegati nel mondo (`inWorld`) tranne lui. Un giocatore non lo riceve mai.
2. **`kernel.players()`**: nello specchio del master ciò che il server dice (`kernel.connected`, riempito da `ThinClient`); in un
   kernel che tiene i viandanti (il server) il suo registro, tranne chi agisce e chi non è nel mondo; in singola nessuno.
   `situation()` ne fa operazioni `giocatore` (viola, `who` = l'id) sul loro chunk; `atlasView()` li porta nell'atlante.
3. **Seguire** (`segui {id?}`, solo il master, solo un giocatore collegato): il server manda al master luoghi, cose e viandanti
   attorno al giocatore seguito invece che attorno a lui (`Client.watch`); smette senza `id`, quando il giocatore esce dal mondo o
   si scollega. Nello specchio `kernel.follow(id?)`, `kernel.watching`, `kernel.watched()` (la sua entità `remote`).
4. **La vista che segue**: il renderer sposta la simulazione in modo che il giocatore seguito stia al centro (`Renderer.offset()`),
   punta la camera su di lui, nasconde la corona e il viandante del master, usa la luce del mondo; il kernel del master non
   cambia (posizione, tappeto, zona: resta nello studio). Esc o «Torna» sull'insegna in alto la lasciano.
5. Il pannello della situazione ha la sezione «Giocatori collegati» con «Segui»; l'atlante un punto viola col nome e un pulsante
   per giocatore. In singola non c'è nulla di questo (`kernel.follow` non esiste).

## Conseguenze
- `tests/watch.test.ts`: la situazione e l'atlante dello specchio del master elencano i giocatori sul loro chunk e li seguono
  quando si spostano, un giocatore non riceve l'elenco; il master che segue riceve i luoghi attorno al giocatore e resta dov'è;
  solo il master segue, e solo un giocatore collegato.
- Mentre segue, il master non vede ciò che ha vicino (nello studio non c'è mondo). Il menu delle caselle sulla vista seguita
  manda azioni che il server rifiuta (fuori portata): il master guarda, non agisce a distanza.
