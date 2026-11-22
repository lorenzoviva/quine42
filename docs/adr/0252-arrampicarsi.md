# ADR-0252 — Arrampicarsi, e il salto e l'arrampicata in molti fatti dal server

Data: 2026-11-22 · Stato: accettato (task T477 del backlog, la riga 4 dello studio di T459, R3, `docs/design/terreno-3d.md` § 3.5; la
risposta dell'autore del 21/11, D67 C1) · Estende ADR-0250 (il punto 3, i mezzi; `CLIMB` e `keptPass`), ADR-0080 (il salto), ADR-0058 e
ADR-0059 (il passo del server e il client sottile), ADR-0026 (gli stati) · Voce della sicurezza V-047

## Contesto

La regola 10 dei gradini (ADR-0250) dice che oltre mezza casella non si cammina, fino a una casella si salta e fino a tre «si arrampica chi
ha il mezzo», ma il mezzo non c'era: `CLIMB` era una costante, `keptPass` teneva in un luogo montuoso solo le enclavi raggiungibili col
salto, e in molti nemmeno il salto c'era (lo specchio del client non saltava: Spazio faceva ciò che fa `E`, e il server avrebbe rimesso il
viandante giù dal dirupo, perché il suo passo è la stessa collisione dei gradini). L'autore ha scelto (C1) un movimento del kernel con
l'attrezzo, fino a tre caselle, lento e faticoso, con lo stato che «Altro…» può dare.

## Decisione

1. **Il movimento** (`src/kernel/climb.ts`, puro; `Kernel.climbTo`, `climbOffer`, `climbTick`): da una casella a una accanto (un lato,
   non la diagonale) oltre un dirupo, più di `STEP` livelli e al più `CLIMB` (12, tre caselle), in salita («Arrampicati») e in discesa
   («Calati giù»). Il corpo va al piede della parete sulla casella bassa, sale o scende la parete, passa sulla casella oltre: tre tempi
   (`approach`, `climb`, `leave`), la parete 0,42 s a livello in salita e 0,25 in discesa per la gravità (fra la metà e il doppio della
   terra). Il componente `climb` del viandante lo tiene; il kernel porta il corpo come col salto, dopo i sistemi.
2. **Il mezzo**: la portata (in livelli) è la più grande fra il `bonus.climb` di ciò che si indossa o si impugna e il `climb` degli stati
   (`climbOf`, interi entro `CLIMB`; ciò che non è un numero vale 0). Nel seme la corda (`item.corda`) si impugna e dà 12. Uno stato che
   arrampica lo dà l'effetto `state` col campo nuovo `climb` (validato, interi 1-12), che il Narratore conosce (la guida degli effetti,
   lo schema) e che `core.effects` copia nello stato; il kernel lo scrive anche lui, così un `core.effects` di prima arrampica lo stesso.
   «Altro…: mi arrampico» su una casella oltre un dirupo dà lo stato e, se ora la portata basta, l'arrampicata comincia.
3. **Il menu della casella**: oltre un dirupo accanto al viandante il kernel mette «Arrampicati» o «Calati giù»; senza ciò che serve la voce
   resta spenta col motivo (`ClimbRefusal`: il mezzo, troppo alto oltre tre caselle, occupato, le mani impegnate da una cosa del mondo o
   oltre la portata, troppo stanco sotto 1 di energia, nessun posto in cima). Il kernel non lo propone dove si cammina (entro un gradino),
   sui piani di un modello né sul ponte di un veicolo.
4. **La fatica e la caduta**: sulla parete l'energia va (1 a livello in salita, 0,4 in discesa, per la gravità: come una lunga nuotata);
   a energia zero o a un colpo (la salute meno dell'ultima volta) o a una spinta il corpo torna al piede della parete
   (`fallFromClimb`), e il mondo lo dice. Nessun danno della caduta. Intanto niente salto, niente altra arrampicata, niente `E` né menu.
   Le persone non si arrampicano (vanno sulla rete).
5. **Il mondo ha l'arrampicata**: da qui `networkOf` e `draftRelief` passano `climb: true` (`keptPass`), così un luogo montuoso tiene le
   enclavi col valico fino a `CLIMB` (prima fino a `JUMP`), entro la sua quota. Col rilievo di oggi non cambia niente (nessuna enclave).
6. **In molti il server fa il salto e l'arrampicata** («controllati nel passo del server»): lo specchio del client salta e si arrampica da
   sé, come da soli, e lo dice al server: il salto col messaggio nuovo `jump {dx, dy}` (senza risposta), l'arrampicata con `tile` e
   l'azione `_climb` (`CLIMB_ACTION`), che risponde se è stata fatta. Il server li fa sul suo mondo, come quel viandante, con le sue regole
   e i mezzi che il viandante ha lì (`SessionServer.leap`, `Kernel.jump(dir)`, `climbTo`), e porta il corpo spostando il tappeto del
   viandante (`carryBody`: chi gioca da un suo client resta dov'è sul cerchio, come col passo). Finché porta il corpo (`carriedBody`) non
   prende nessun passo del client; tiene l'ultimo detto e, atterrato, lo confronta con dove lo ha e corregge se differiscono (`landed`).
   Rifiutato, il salto ha una correzione e l'arrampicata un esito falso, e lo specchio toglie la sua; lo specchio non manda passi mentre
   porta il corpo. Il salto e l'arrampicata guardano la zona del viandante che agisce (`inSim`), non quella del kernel.
7. **A schermo**: i piedi seguono la parete (`Kernel.climbing`), arti in moto, la camera non sale con la parete; chi guarda da un altro
   client vede chi salta o si arrampica scivolare dove il server lo ha, senza l'arco né la parete (niente di nuovo sul filo).

## Conseguenze

- **Inerte col rilievo di oggi**: nessun dislivello supera il gradino (ADR-0250), quindi nessuna voce «Arrampicati» e nessuna enclave in
  più; la corda impugnabile è l'unica cosa che si vede. Il salto in molti è nuovo per tutti gli universi: Spazio salta anche lì.
- **Col rialzo sintetico** di otto livelli (`lab/scripts/rete-gradini.ts -- --rialzo 8`, 327 luoghi): 318 rampe e 140 enclavi tenute,
  nessuna casella staccata (con la sola regola del salto, T474: 434 e 21).
- **Il contratto non cambia** (kernel 0.10.27): un campo facoltativo in più su un effetto e su un bonus, un componente del kernel, un
  messaggio dal client; nessun formato su disco cambia.
- **I test**: `tests/arrampicata.test.ts` (il modulo puro, il menu, la corda, la parete, la caduta, «Altro…», l'enclave montuosa di otto
  livelli, il salto e l'arrampicata in molti), `tests/sicurezza/salto-molti.test.ts` (V-047), `tests/rete-kernel.test.ts` (le persone
  non vanno su un'enclave; l'altopiano oltre la quota ha la rampa).
- **Non garantito**: che chi salta giù in una conca più profonda di un salto ne esca senza un mezzo (resta a R1 non farne); una parete fra
  due luoghi è come le altre, ma col rilievo di oggi non c'è; la caduta non fa male; il Narratore vero che dà lo stato `climb` (provato coi
  modelli locali).
- **Sicurezza**: V-047 (`docs/sicurezza/registro.md`).

## Alternative scartate

- **Solo i mezzi che c'erano** (C2: scavare gradini, posare una scala): la regola 10 avrebbe tenuto enclavi raggiungibili solo costruendo.
- **Il client che dice dove atterra**: il server dovrebbe fidarsi di un punto oltre un dirupo; li rifà lui sul suo mondo.
- **Il server senza la previsione del client**: chi salta aspetterebbe un giro di rete prima di staccarsi da terra.
- **L'arrampicata come scala posata** (una cosa con i pavimenti che salgono): resta un mezzo da costruire (`putCarried` non guarda la parete).
- **Un danno della caduta**: un dirupo di tre caselle diventerebbe una trappola mortale con un livello della morte alto; da decidere nel
  gioco col rilievo vero.
