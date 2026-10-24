# ADR-0054 — Il viandante con un id e lo stato per giocatore

Data: 2026-10-24 · Stato: accettato (task T34 del backlog) · Prepara la fase 1 di ADR-0050 (il multiplayer); estende
ADR-0020 (società), ADR-0024 (vita degli NPC) e ADR-0021 (due repository).

## Contesto
Fino a oggi c'era *un* viandante: un'entità (`kernel.playerId`), un blocco `viandante` in `world/stato.json`, e nella società
la persona «Viandante» (`famiglia: [{ nome: 'Viandante', … }]`, `legameViandante`, ricordi `con: 'Viandante'`); le missioni
accettate erano di chiunque giocasse. In multigiocatore (piano, tabella «oggi / in multigiocatore») ogni giocatore ha il suo
stato e le persone devono ricordare ciascuno per conto suo, e il Narratore deve sapere con chi parla.

## Decisione
1. **Un id stabile** per viandante (`src/kernel/wanderers.ts`): `io` in singola (`SOLO`), l'id dell'account in seguito (T44); un
   id è uno slug (`validWandererId`), perché nomina un file. Il nome predefinito è «Viandante» (`WANDERER_NAME`).
2. **Lo stato del giocatore in `world/giocatori/<id>.json`** (`WandererState`: `nome`, `inventory`, `needs`, `hand`, `stati`,
   `slots`, `trasceso` solo per `io`). `world/stato.json` resta lo stato del mondo (consumati, contenitori, forme, importanti,
   ora) e non porta più il viandante. `readWandererState` legge per `io` anche il blocco `viandante` di uno `stato.json` vecchio;
   il primo salvataggio lo sposta. La Genesi cancella anche `world/giocatori/`.
3. **Più viandanti nello stesso kernel**: il kernel tiene un registro (`wanderers()`); `io` è l'entità che l'input muove
   (`playerId`), gli altri entrano con `addWanderer(id, nome?)`, con un'entità loro e lo stato salvato per loro. Tutto ciò che
   oggi agisce su «il giocatore» (inventario, bisogni, frase, ricordi, legami, missioni) lo fa sul **viandante che agisce**
   (`wanderer()`); `as(id, fn)` fa agire un altro viandante, ed è **sincrono** apposta: lo scambio di `playerId` non attraversa
   mai un `await` (le parti asincrone, come `talk`, rientrano in `as` dopo ogni attesa). Se l'entità di un viandante sparisce,
   `as` la ricrea dal suo stato invece di agire su un altro. `saveState` scrive un file per viandante; `loadState` li legge.
4. **La società con l'id**: `Relation.viandante` e `Memory.viandante` dicono di quale viandante si tratta (`nome`/`con` restano
   il nome con cui la persona lo chiama). `readPeople` migra in lettura il registro vecchio («Viandante» e `legameViandante` →
   `io`); `legameViandante` non si scrive più. `bondWith(persona, id)` e `kernel.bondOf(nome)` danno il legame;
   `memoriesFor(ricordi, id)` i ricordi che vanno al Narratore: quelli con quel viandante e quelli con le altre persone, mai
   quelli con un altro viandante. `repairSociety` riconosce i legami con ogni viandante (`wandererOf`) e non li tratta come
   persone attese. Figli: il legame del figlio porta l'id del genitore viandante.
5. **Le missioni** hanno `Quest.viandante` (chi l'ha accettata; `io` se manca); `activeQuests(trame, id)` filtra; la missione
   compiuta ricompensa e fa ricordare chi l'aveva accettata.
6. **Il Narratore sa con chi parla**: `talk(id, testo, viandante?)` passa `NpcContext.wanderer` (il nome) e la cronologia della
   conversazione di quel viandante (`Turn.con`); con un nome diverso da «Viandante» il prompt dice «Parli con …».
7. **Il grafo** ha un nodo per viandante: `persona:viandante` per `io` (com'era), `persona:viandante-<id>` per gli altri
   (`wandererNode`), con `giocatore: <id>`; i legami e ciò che ciascuno porta puntano al suo nodo (`GRAPH_BUILD` 3).

## Conseguenze
- Un universo vecchio si carica uguale (test in `tests/wanderers.test.ts`); al primo salvataggio nasce `world/giocatori/io.json`.
- In singola nulla cambia per il giocatore: c'è solo `io`, che si chiama «Viandante», e i testi dicono ancora «il viandante».
- Gli altri viandanti sono per ora entità senza input né rendering dedicato: i messaggi del kernel vanno all'unico HUD, i sistemi
  Lua vedono solo `world.player()` (`io`). Li useranno il server (T38), il client (T39) e le interazioni tra giocatori (T43).
