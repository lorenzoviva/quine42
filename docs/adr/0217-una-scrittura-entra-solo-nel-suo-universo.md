# ADR-0217 — Una scrittura in fila entra solo nell'universo su cui è stata fatta

Data: 2026-11-18 · Stato: accettato · Riferimenti: ADR-0122 (la fila dei commit), ADR-0144 (la fila sopravvive alla pagina), ADR-0021 (due repository), T265, T273, T411, T421

## Contesto

Dal 06/11 `universes/neapolis` si apriva come «aurora», seme 1337, e i 19 luoghi con le strutture che T273 aveva installato (`maps/neapolis_1990_…`)
non si leggevano più (trovato da T411). Il commit `99e51ef`, «salvataggio della partita», un minuto e mezzo dopo la genesi di T273, aveva riscritto
`universe.json` con quello del seme (nome `aurora`, seme 1337, morte 3) e aggiunto le carte, il viandante e il grafo di un'altra partita: luoghi del
Cartografo dei modelli locali («Borgo Immobile», «Prato del Re Muto»). Dopo, la pagina, credendosi aurora, ha pianificato 105 luoghi `aurora_1337_…`
e il Narratore dei modelli locali vi ha messo 11 persone.

La causa è la fila delle scritture (ADR-0122, ADR-0144): vive nel `localStorage` sotto il **nome** dell'universo (`quine:owed:<nome>:<scheda>`) e la
pagina dopo la scrive **prima di leggere** l'universo. Una pagina aveva lasciato in fila un salvataggio per un neapolis di prima (nato dal seme,
quindi col nome `aurora` nel suo `universe.json`); quell'universo è stato sostituito su disco da quello di T273, e la pagina successiva ha scritto la
vecchia fila nel repository nuovo. Lo store non aveva modo di accorgersene: un commit è un insieme di file, e un nome vale l'altro. Lo stesso succede
a una scheda rimasta aperta mentre l'universo sotto di lei va nel cestino e ne nasce un altro con lo stesso nome. Il merge a tre vie col seme
(`upgradeFromSeed`) è stato escluso: il `seed.json` di neapolis aveva le impronte giuste.

## Decisione

- **Ogni scrittura in fila dice su quale universo è stata fatta**: `OwedWrite.base`, la testa del ramo principale che il client ha visto per ultima
  (da `load`, `create`, `commit`, `checkout`, `merge`; `reset` la dimentica). Una scrittura lasciata dalla pagina prima tiene la sua. Si salva con la
  fila; letta da lì, una base che non è un id di commit (`COMMIT_ID_RE`) si lascia cadere.
- **Lo store la prende solo nel repository che ha quel commit nella sua storia** (`madeHere` in `server/universeStore.ts`:
  `git merge-base --is-ancestor <base> HEAD`): `commit`, `branch` e `merge` con `base` nel corpo, il piano di un luogo (`PUT map/<chiave>`) con
  `?base=`. Altrimenti risponde 409 («la scrittura è di un universo che aveva questo nome prima»), che per la fila è un rifiuto: si scarta con un
  avviso e non ferma le scritture dopo, che sono della stessa pagina e verranno rifiutate allo stesso modo.
- **Un ritorno a un commit vecchio non cambia nulla**: `checkout` scrive un commit nuovo sopra la storia, e la base resta un antenato.
- **Senza base si scrive come prima**: una fila salvata prima di questo cambio, chi non ha letto l'universo, i processi che scrivono da sé.
- **neapolis riparato** con un commit nuovo nel suo repository (`b660e7d`, tag `prima-della-riparazione` sullo stato di prima): l'albero della genesi
  di T273 (`abe6feb`), perché tutto ciò che è stato scritto dopo veniva dalla partita che si credeva aurora o dalla migrazione di quei file; il kernel lo
  porta al suo contratto al primo caricamento. aurora, orichalcum e sidera, con lo stesso controllo, si aprono col loro nome e seme e leggono tutti i
  loro piani (`lab/scripts/controlla-universo.ts`).

## Scartato

- **La radice del repository come identità**: dal contratto 0.6 ogni universo nato dal seme di un contratto comincia dallo stesso commit (T295,
  `plantRoot`), quindi due universi con lo stesso nome nati uno dopo l'altro avrebbero la stessa radice.
- **Leggere l'universo prima di scrivere la fila e confrontare i nomi**: il nome in `universe.json` non identifica (un universo nato dal seme si chiama
  `aurora` qualunque sia la sua cartella), e scrivere dopo aver letto lascerebbe la pagina su uno stato che non ha ancora le sue scritture.
- **Un'intestazione al posto del campo**: ogni intestazione nuova passa dall'elenco del server di produzione (ADR-0112); un campo del corpo e un
  parametro no.

## Conseguenze

- Il costo è un `git merge-base` per scrittura con la base, dentro la fila dell'universo nel server: commit e piani non sono frequenti.
- Un universo nato dal seme sotto un altro nome ha ancora `aurora` e il seme 1337 nel suo `universe.json`: non è più una causa di danni, ma confonde
  chi legge il disco. Resta com'è (cambiarlo cambierebbe le chiavi dei piani degli universi che esistono).
- Due installazioni degli stessi file nello stesso secondo, con lo stesso autore e lo stesso messaggio, fanno lo stesso commit: per git sono lo stesso
  repository, e la fila vi entra. Un installatore vero scrive file diversi.
