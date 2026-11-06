# ADR-0155 — Un universo fuori dall'intervallo dei kernel si legge soltanto: niente arriva al suo repository, il Concilio non chiama i modelli

Data: 2026-11-06 · Stato: accettato (task T312 del backlog) · Riferimenti: ADR-0136 (la versione del kernel), ADR-0137 (un guasto invalida il codice, non i dati), ADR-0152 (l'intervallo dei kernel), T302

## Contesto

Con ADR-0152 un universo fuori dall'intervallo `kernels` si apre in piedi con il guasto `universe:kernel`: niente commit del codice, dello stato né della versione. Ma nella verifica di T302 il Concilio (modelli locali) ha committato cinque contenuti sulla copia `vecchio` (kernel 0.0.4): ogni agente committa da sé (`commitContent`, `repo.commit(…, 'agent')`, l'atlante all'avvio, le riparazioni), e il guasto fermava solo chi lo guardava. Con la chiave, quei contenuti sarebbero costati e non dovevano essere salvati.

## Decisione

1. **Un predicato solo, `Kernel.readOnly()`**: il motivo del guasto `universe:kernel` se è aperto, altrimenti `undefined`. Un kernel specchio (il client sottile, il kernel sul ramo del master) non è mai in sola lettura: il suo repository è contabilità in memoria, e decide il mondo che rispecchia.
2. **Il repository** (`Repo.readOnly`, `src/kernel/repo.ts`): finché dice un motivo `commit()` non fa niente e risponde la HEAD com'è (senza `beforeCommit`, senza backend, senza `persist`), per chiunque lo chieda: Concilio, viandante, stato, magazzini, editor, pubblicazione. Il backend che il repository tiene (`attach` lo avvolge) non scrive commit, rami (`branch`), pubblicazioni dei rami (`merge`) né ritorni a un commit di una sessione prima (`checkout`, che sul disco è un commit «ritorno a …»); leggere (`listMaps`, `readBranch`), ripartire dal seme (`reset`, che mette l'universo nel cestino) e clonare passano. Il punto è uno perché ogni scrittura del kernel sull'universo passa da `Repo` o dal suo backend.
3. **I piani dei luoghi** (`SealedChunks`, `src/kernel/chunks.ts`): l'archivio del kernel è sempre avvolto; in sola lettura un piano nuovo resta in memoria per la sessione, così un luogo rivisto non si ripianifica, e non arriva a `maps/`.
4. **Il Concilio non chiama i modelli** (`Council.readOnly`, in `Council.write`, da cui passa ogni chiamata): in sola lettura ogni compito va ai modelli locali, come senza crediti, e il registro lo dice («questo universo si legge soltanto, i modelli locali»). Nessuna spesa per contenuti che non si salvano; il mondo resta giocabile, gli individui rispondono.
5. **Il pannello dell'anomalia lo dice**: il motivo del guasto finisce con «sola lettura: niente si salva nel repository, il Concilio usa i modelli locali» (`READ_ONLY_WORDS`), e il messaggio all'apertura aggiunge «Si legge soltanto: niente si salva».
6. **Il sito**: `/api/viandante` (POST) a mondo spento committa il profilo da sé con git; su un universo fuori intervallo risponde 409 (`runsOnThisKernel`, `src/kernel/version.ts`, che ora usa anche `upgradeFromSeed`). A mondo acceso il profilo va nel kernel, che non lo committa.

## Alternative scartate

- **Un controllo per agente** (`commitContent`, `ModelDirector`, `ScoreDirector`, Fucina, Genesi…): ogni agente nuovo l'avrebbe dimenticato, come è successo.
- **Fermare le scritture solo in `UniverseClient`** (la fila, ADR-0122): senza server l'universo vive nel `localStorage` del `Repo` e nell'IndexedDB dei piani, che non ci passano; e il repository in memoria avrebbe avuto commit che il disco non ha, così un commit dopo la chiusura del guasto avrebbe portato solo l'ultima differenza.
- **Commit in memoria, solo non sul disco**: stessa divergenza fra HEAD e disco; meglio che la HEAD resti quella del disco.
- **Rifiutare sul server** (`server/universeStore.ts`): il server non conosce la versione del kernel che scrive e una scrittura rifiutata in fila si perde con un avviso; il kernel sa già del guasto.

## Conseguenze

- `KERNEL_VERSION` `0.1.14`: gli universi della `0.1` restano buoni.
- Ciò che il mondo fa durante la sessione resta nei file di lavoro e si vede (contenuti dei modelli locali, piani in memoria); una ricarica lo perde. Se il guasto si chiude nella sessione (il master corregge `universe.json` dall'editor), il commit dopo porta tutto ciò che è nei file di lavoro.
- Resta scrivibile: ripartire dal seme (il cestino), clonare in un universo nuovo, i saldi (fuori dall'universo, ADR-0104), le scritture lasciate in fila da una pagina prima (si scrivono prima di leggere l'universo, quando il kernel non è ancora acceso), e i piani che un universo prende da un vecchio IndexedDB alla prima lettura (`UniverseChunks.load`, legacy).
- Sicurezza: nessuna superficie nuova; una rotta (`/api/viandante`) risponde 409 in un caso in più.
