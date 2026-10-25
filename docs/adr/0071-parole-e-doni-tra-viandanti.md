# ADR-0071 — Parole e doni tra viandanti

Data: 2026-10-25 · Stato: accettato (task T43a del backlog) · Fase 3 di ADR-0050 (il multiplayer); estende ADR-0058 (il kernel sul
server) e ADR-0059 (il client sottile).

## Contesto
Il piano del multigiocatore («Interazioni tra giocatori»): gli scambi di oggetti e la chat tra avatar vicini (fumetti) ci sono sempre,
qualunque cosa la partita dica di PvP e di «Altro…»; la quarta parete vale per il Concilio, non per le persone vere. Fin qui il server
rifiutava ogni azione su un altro viandante (`outOfReach`), e i fumetti dei viandanti viaggiavano (`OtherView.testo`) senza che niente li
scrivesse.

## Decisione
1. **Nel menu di un altro viandante** (`kernel.otherWanderer`: nel kernel che li tiene il registro, nello specchio l'entità `remote`)
   ci sono «Parla» e un «Dai <cosa>» per ogni tasca piena della barra rapida (`dai:<tasca>`, le prime `HOTBAR`): ciò che si ha a portata
   di mano, anche ciò che non si impugna (una borsa). Il resto (Esamina, «Altro…») arriva con T43b. `nearest` dello specchio trova anche
   le entità `remote`, così `E` davanti a un viandante apre il suo menu.
2. **Le parole** (`dici {viandante, testo}` → `kernel.sayTo`): al più `SAY_MAX` (140) caratteri, a chi è entro `HEAR` (8) caselle, entrambi
   nel mondo (`inWorld`). Diventano il fumetto di chi parla, che ogni client vicino vede già; chi ascolta le riceve anche come avviso.
   Nessun filtro della quarta parete e nessun agente: niente costa.
3. **I doni** (`dai {viandante, slot, quanti}` → `kernel.giveTo`): entro `GIVE_REACH` (3) caselle, `quanti` della tasca (tutta, se manca),
   dove andrebbe se l'altro la raccogliesse (`give`: borse comprese); una borsa con un contenuto va intera in una tasca vuota. Senza
   posto, o troppo lontano, non si muove nulla. La frase di chi dà dimentica le rune che non ha più (`syncHand`). Uno scambio sono due doni:
   niente accettazione né trattativa per ora.
4. **Gli avvisi.** Il kernel annuncia `wanderer:said` e `wanderer:gave`; il server mette un avviso (`Notice {tipo, da, nome, testo}`) nella
   coda di chi li riceve e lo manda con il prossimo `aggiorna` (`avvisi`). Il client sottile lo mostra nei messaggi e, per le parole, nella
   chat aperta con chi parla (`ui:heard`); il proprio fumetto lo mette da sé, quando il server risponde.

## Conseguenze
- Due giocatori possono parlarsi e passarsi le cose in ogni partita; il master in god mode può riceverle e darle (non è un danno).
- Un dono non chiede il consenso di chi riceve: lo si vede subito nell'inventario e negli avvisi. Se servirà, una conferma si aggiunge al
  protocollo senza cambiare `giveTo`.
- `tests/between.test.ts` (2 test con tre client sottili): parole sentite da chi è vicino e non da chi è lontano, il fumetto da tutte e due
  le parti, niente filtro, rifiuti; dono di parte di una pila e dal menu, la borsa delle rune intera con la runa (e la frase che la
  dimentica), troppo lontano, niente posto, tasca inesistente.
