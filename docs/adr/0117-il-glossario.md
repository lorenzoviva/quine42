# ADR-0117 — Il glossario: un nome per ogni concetto

Data: 2026-11-03 · Stato: accettato (task T178 del backlog) · Riferimenti: ADR-0025 (i due tavoli), ADR-0043 (lotti e strutture), ADR-0092 (le taglie), ADR-0072 (la pipeline)

## Contesto

Richiesta dell'autore: una nomenclatura ufficiale, gli stessi concetti chiamati allo stesso modo, nel codice in inglese. Il censimento lo
conferma e aggiunge una cosa: i sinonimi (`hand`/`phrase`, `place`/`chunk`, `thing`/`entity`, `player`/`wanderer`) sono solo metà del
problema. L'altra metà sono gli **omonimi**: due tipi `Building` diversi (`layout.ts`, `corona.ts`), `model` per i programmi e per Gemini,
«reame» per 4 × 4 zone nel kernel e per un universo nel sito, «piano», `floor`, `Ledger`, «sessione», `cast`.

Molti nomi inoltre non sono solo nomi: stanno negli universi su disco, sul filo, nel Lua generato.

## Decisione

1. **`docs/glossario.md` è la fonte dei nomi.** Per ogni concetto: il nome italiano (il titolo), `Inglese`, `Definizione`, `Dove vive`,
   `Da non usare`, e `Fermo` dove serve. In fondo gli omonimi, le scelte dubbie, le rinomine proposte. Un concetto nuovo ha una voce nello stesso commit.
2. **Il nome ufficiale nel codice è uno che esiste già**: il glossario non inventa nomi, e `tests/glossario.test.ts` controlla che ogni nome in
   inglese stia in `src/` o `server/`, che i file di `Dove vive` esistano, che ogni voce abbia i suoi campi. Un nome nuovo entra nel glossario con la rinomina che lo crea.
3. **I dati restano come sono.** Campi JSON degli universi, componenti, API Lua, effetti, valori di `AgentId`, compiti, messaggi del protocollo e
   indirizzi non sono stile ma formato: si cambiano solo con una migrazione. L'API Lua e i dati in italiano non si propone di cambiarli affatto.
4. **Il lavoro nuovo usa i nomi ufficiali; ciò che c'è resta** finché un task di rinomina non lo cambia. Nessuna rinomina in questo task: vanno in
   conflitto con tutto, si fanno con pochi task in corso, una per task, quando l'autore ha deciso.
5. **Gli ADR non si riscrivono**: sono storia. Si aggiorna `AGENTS.md`.
6. **Il censimento è ripetibile**: `node tools/glossario/glossario.mjs` riscrive `docs/glossario-censimento.md` dai sinonimi del glossario.

## Conseguenze

- La confusione non sparisce con questo commit: il codice dice ancora `playerPos`. Il glossario dice dove si vuole arrivare, e quanto costa (le rinomine R1-R15).
- Restano eccezioni dichiarate alla convenzione «identificatori in inglese»: nomi propri (`corona`, `master`), e quelli per cui l'inglese è peggio (`Taglia`, `Partita`).
- Il test non controlla che i sinonimi spariscano: finché le rinomine non sono fatte fallirebbe sempre. Una volta fatte, si può aggiungere.
- Un termine tecnico nei prompt è un costo solo se il modello lo porta dentro il mondo: lì vale la quarta parete (ADR-0025), non il glossario.
