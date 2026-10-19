# ADR-0006 — Versionamento dell'universo

Data: 2026-10-19 · Stato: accettato

## Contesto
Ogni giocatore ha il proprio universo con una storia di commit; il rollback all'ultimo stato valido
deve essere sempre possibile.

## Decisione
- `Repo` (`src/kernel/repo.ts`): snapshot completi dei file dell'universo (piccoli: decine di KB), in
  `localStorage` sotto `rune:repo:<nome>`, massimo 120 commit (la genesi resta sempre).
- `working` = file caricati (può essere sporco e rotto); `HEAD` = ultimo commit valido.
- Si committa solo quando lo stato è valido: salvataggio dall'editor senza errori di validazione né
  fault di caricamento; moduli dell'agente validati. "Scrivi comunque" scrive senza committare.
- **Rollback**: rune incise dal giocatore → in mano; `working = HEAD`; sandbox azzerata (override e
  binding recisi spariscono); moduli ricaricati; componenti di player e singleton ai default del manifest
  tranne i campi `persist` (es. offset del tappeto e contenuto della mano); fault azzerati.
- Checkout di un commit qualsiasi dalla console (F2 → Commit).
- Se i file su disco cambiano (hash diverso da quello registrato), al boot diventano un nuovo commit;
  in dev l'HMR di Vite fa lo stesso a caldo.
- Export/import dell'intero repository in JSON (F2 → Universo): base per "visitare" universi altrui.

## Conseguenze
- Lo stato del mondo (entità, rune incise, offset) non è ancora persistito fra sessioni: solo i file.
- Fork/merge e multiplayer restano fuori scope; il formato JSON del repo è il punto di partenza.
