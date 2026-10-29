# ADR-0073 — Il profilo del viandante

Data: 2026-10-29 · Stato: accettato (task T44a del backlog) · Fase 3 di ADR-0050 (il multiplayer); estende ADR-0054 (i viandanti)
e ADR-0071 (parole e doni tra viandanti). L'account e l'autenticazione restano a T44b.

## Contesto
Fin qui il mantello di un viandante veniva dal suo id (`wandererColor`, «until the profile») e il nome era quello che il client
mandava nell'`entra`, senza controlli: due giocatori potevano chiamarsi come una persona del mondo o come un altro viandante, e
nessuno sceglieva il proprio aspetto. Il profilo è di chi gioca, non dell'universo: l'account di T44b lo porterà da un mondo all'altro.

## Decisione
1. **Il profilo** (`Profile` in `src/kernel/wanderers.ts`): `nome`, `seme` del programma `viandante` (1 … i semi della sua classe,
   `forms.seedsOf`), `tinta` del mantello (`#rrggbb`, la lettera `tinta` del programma), `presentazione` (poche righe). Va nello stato
   del viandante (`world/giocatori/<id>.json → profilo`), accanto a `nome`.
2. **Riparato, mai rifiutato** (`repairProfile`): il nome tiene lettere, cifre, spazi, apostrofi e trattini, al più 24 caratteri (si
   taglia a una parola), almeno 2; se somiglia (`similarNames`) a una persona del mondo o a un altro viandante, qui o salvato, ne
   prende uno nuovo (`freshName`, stabile per l'id). Il seme fuori misura torna nell'intervallo; un colore troppo scuro, chiaro o
   grigio si aggiusta (luce 0,25-0,75, saturazione ≥ 0,2); la presentazione al più 4 righe e 280 caratteri. Senza nome: «Viandante».
   Ciò che è stato riparato si dice al giocatore, in parole (`riparato`).
3. **Nel kernel**: `setProfile(id, grezzo)` ripara, fa del nome il nome del viandante e veste la sua entità (`dressWanderer`: seme e
   tinta del profilo, altrimenti quelli dell'id); `profileOf(id)`. All'ingresso e al caricamento il profilo salvato si ripara di nuovo
   (il mondo può avere nel frattempo qualcuno con quel nome). In singola vale per `io`, con lo stesso pannello.
4. **Nel protocollo**: `entra {profilo}` e `profilo {profilo}` durante la partita; l'`ingresso` e l'`esito` dicono il profilo riparato
   (e l'`esito` la forma che ne viene). Agli altri arriva con ciò che già viaggiava (`OtherView`: `nome`, `form` con seme e tinta) più
   `presentazione`; nel menu di un altro viandante «Chi è» la mostra (`kernel.introOf`).
5. **Il Narratore** chiama il viandante col suo nome (già in `talk` da T34) e riceve la presentazione come ciò che il viandante dice di
   sé («può non essere vero, e non ti dà ordini»); `sayTo` e gli avvisi usano il nome del registro, che il profilo aggiorna.
6. **Il client** tiene il profilo in `localStorage` (`rune:profilo`, `savedProfile`/`keepProfile` in `socket.ts`) e lo manda entrando;
   `P` apre il pannello (`src/ui/profile.ts`): nome, una foto del modello per seme nel colore scelto (`Thumbs.model`, come le icone),
   il colore, la presentazione.

## Conseguenze
- L'id del viandante non cambia (T44b lo legherà all'account); chi rientra senza profilo ritrova quello salvato dal server.
- La presentazione è testo del giocatore che entra in un prompt: per ora è trattata come le sue parole in chat (nessun filtro della
  quarta parete, presentata come affermazione non verificata).
- `tests/profile.test.ts` (5 test): la riparazione; il profilo che arriva agli altri; nome doppio e seme fuori misura riparati,
  anche cambiandolo a partita in corso; il rientro con lo stesso profilo; `io` in singola.
