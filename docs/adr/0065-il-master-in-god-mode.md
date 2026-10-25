# ADR-0065 — Il master in god mode, visibile solo nel mondo

Data: 2026-10-25 · Stato: accettato (task T42a del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0057 (rune per
ruolo) e ADR-0058 (il kernel sul server).

## Contesto
Il piano del multigiocatore (`docs/plans/multiplayer.md`, «Il master») vuole che chi crea l'universo di molti ne resti il master,
giri per il mondo con il suo viandante, visibile agli altri, in **god mode**: non muore, non ha bisogni, non subisce danni né
effetti dei giocatori; quando esce con la runa del Concilio il suo avatar sparisce per gli altri finché non torna nel mondo.
Con T37 il kernel sa chi è il master (`partita.master`, fisso come tutta la partita: `keepGame`); `sys.needs` però consuma i
bisogni di ogni viandante e annuncia la morte (`lua:morte`), gli effetti mirati (`spingi distruggi apri contenitore`) toccano
qualunque corpo, e il server mandava a ogni client tutti i viandanti vicini nelle coordinate del tappeto, anche il master sul
viale del campus (che, letto nello spazio del tappeto, può cadere accanto a un giocatore).

## Decisione
1. **God mode** (`kernel.godMode(id)`): vero solo in multigiocatore e per il master. In singola nessuno è un dio (chi gioca
   resta mortale fino alla corona, ADR-0026).
2. **Bisogni pieni**: dopo i sistemi di ogni tick `keepGods` rimette fame, sete, energia e salute del master a 100 (il mana no:
   è una risorsa della magia, non un bisogno). Il codice del mondo non cambia: il pavimento corregge dopo di lui.
3. **Non muore**: la morte annunciata da Lua passa da `spareGods`, che rimette in piedi i dèi e chiama `die` solo se a morire
   è un giocatore. `die` resta com'è (la chiamano anche i test e la morte dei giocatori, che è di T43).
4. **Nessuno lo tocca**: `applyEffects` su un corpo che è il viandante di un dio diverso da chi agisce lascia passare solo
   `messaggio`. Gli effetti che tornano su chi agisce (bisogni, stati, scudo) restano di chi agisce; il fuoco e il resto del
   mondo che toccano la salute sono coperti dal punto 2. Il master agisce sugli altri come su qualunque cosa.
5. **Visibile solo nel mondo** (`kernel.inWorld(id)`): un viandante è nel mondo degli altri se è sul suo tappeto (non in
   `offCarpet`), dentro il cerchio e non in un interno. Il server manda agli altri solo i viandanti nel mondo; chi esce finisce
   in `partiti` e torna quando rientra nel cerchio.

## Conseguenze
- `tests/master.test.ts`: il master affamato non muore e ha i bisogni pieni, un giocatore sì; in singola si muore; gli effetti
  di un giocatore sul master arrivano solo come parole; il master sul viale non si vede anche con un giocatore accanto nello
  spazio del tappeto, e si rivede tornato nel cerchio.
- Restano di T42: il ramo `master` e la pubblicazione (T42b), i giocatori dalla corona (T42c), il clone con un altro master (T42d).
