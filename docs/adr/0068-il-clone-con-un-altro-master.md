# ADR-0068 — Il clone con un altro master

Data: 2026-10-25 · Stato: accettato (task T42d del backlog) · Fase 2 di ADR-0050 (il multiplayer); estende ADR-0021 (due
repository), ADR-0056 (le carte), ADR-0065 (il master) e ADR-0066 (il ramo del master).

## Contesto
Il master di un universo in multigiocatore è chi lo ha creato e non cambia (`partita.master`, fisso con la partita: `keepGame`).
Il piano dice che per cambiare master si clona l'universo; le carte restano a chi le ha generate (`carta.autore`, `pagante`),
mentre per il titolare il task lasciava due strade: resta, o passa al nuovo master.

## Decisione
1. **Un clone è un universo nuovo** in `universes/<nome>/`, copia intera della cartella dell'universo: la storia git, i luoghi
   (`maps/`, anche quelli non ancora committati), i viandanti (`world/giocatori/`), le carte, i consumi. Lo stesso seme: è lo
   stesso mondo. Un commit in più (`clone di «…»: il master è <id> (prima <id>)`) cambia in `universe.json` solo `name` e
   `partita.master`; il resto della partita resta com'era stato scelto alla Genesi.
2. **Il ramo del vecchio master non passa** (`refs/heads/rami/*` tolti): ciò che provava senza pubblicarlo è suo. Si clona il
   principale, come lo vedono i giocatori.
3. **Le carte**: `autore` e `pagante` non cambiano mai; il **titolare resta** (predefinito: la collezione di ogni viandante è la
   stessa nei due universi). Facoltativo (`titolari: 'master'`): le carte del vecchio master, comprese le comuni estratte a lui,
   passano al nuovo; quelle degli altri restano. Gli utilizzi (`world/carte.json → utilizzi`) restano com'erano.
4. **Dove**: `cloneChanges` / `passCards` in `src/kernel/clone.ts` (funzioni pure, senza il validatore: le importa il server di
   Vite); `cloneUniverse` in `server/universeStore.ts` con `POST /api/universe/<nome>/clone {nome, master, titolari}`; il sorgente
   non si tocca, un nome già preso o un master uguale al vecchio si rifiutano, un errore a metà toglie la copia.
   `UniverseClient.clone` (dopo i commit in volo); nella console del master in multigiocatore (scheda «Universo») «Clona con un
   altro master» (`Console.onClone`, collegato da `main.ts`). Solo un universo in multigiocatore ha un master da cambiare.

## Conseguenze
- `tests/clone.test.ts`: il clone ha lo stesso mondo, un altro nome e un altro master, le stesse carte; le carte del vecchio master
  possono passare al nuovo senza cambiare autore e pagante; i rifiuti; il kernel del clone ha il nuovo master in god mode e il
  vecchio come giocatore (la runa del Concilio la sposta `councilStock`); su disco storia, luoghi e viandanti passano, il ramo no,
  il sorgente resta com'era.
- Il vecchio master nel clone è un giocatore come gli altri: il suo stato in `world/giocatori/` resta. Se il nuovo master non ha
  mai giocato nell'universo, entra con uno stato nuovo.
- «Usato in un'altra storia» (domanda 2 del piano) ora ha un caso concreto: un clone. Contare gli utilizzi tra universi diversi
  resta di T45.
