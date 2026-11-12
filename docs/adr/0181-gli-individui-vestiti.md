# ADR-0181 — Gli individui vestiti: gli abiti dalla scheda del Narratore o dal mestiere, senza una chiamata in più

Data: 2026-11-12 · Stato: accettato (task T353 del backlog) · Riferimenti: D47.4 (autore, 10/11), ADR-0180 (ciò che si indossa si vede),
ADR-0166 (l'NPC come oggetto), ADR-0109 (ciò che esce, a elenco), ADR-0140 (i mestieri), ADR-0136 (la versione del kernel), regola 8f

## Contesto

T290 veste il viandante (e gli altri viandanti, sul filo) con la via C + B scelta dall'autore: i segni `worn` dell'inventario, il corpo
rifatto nel worker. Il renderer vestiva già **qualunque entità** con segni nel suo inventario, ma nessuna fonte li dava agli individui, e
sul filo `EntityView` non li portava. L'autore ha chiesto (D47.4) che gli individui si vestano **dalla scheda del Narratore o dal
mestiere**, con i costi fermi: nessuna chiamata in più se basta il mestiere.

Il Narratore scrive già, una volta per individuo, la scheda di `npc.individuate` (nome, persona, aspetto, ciò che porta, mestiere,
famiglia, routine), e il kernel riempie da lì le tasche dell'individuo (`carries`, in `world/people.json`); ciò che il mondo non ha
ancora lo definisce con una chiamata di `content.define` (`introduceItems`).

## Decisione

1. **La scheda dice gli abiti.** `npc.individuate` ha il campo `indossa` (0–3 nomi di capi per testa, busto e schiena, i comuni che
   esistono quando vanno bene, altrimenti nuovi; un animale niente, qualunque cosa dica la scheda): è la **stessa chiamata** di prima.
   I nomi che il mondo non ha entrano con `introduceItems` **nella stessa chiamata** che definiva ciò che l'individuo porta (le due
   liste unite). La scelta della scheda resta nel registro: `world/people.json → wears` (`indossa` nella tabella dei nomi interni),
   accanto a `carries`; `Identity.wearing` sull'entità.
2. **Il mestiere veste il resto, senza chiamate.** Per ogni zona che la scheda lascia nuda, `outfitOf` (`src/kernel/npc/outfits.ts`,
   puro, dalla faccia `npc/model.ts`) sceglie fra i capi del mondo **uno del mestiere**: un capo è di un mestiere se una parola del suo
   nome, della descrizione o dei tag comincia con una radice del mestiere (`tradeStems`: le parole di almeno quattro lettere del
   mestiere, normalizzate come `matchJob`, tagliate a 4–7 lettere, così «contadina», «contadino» e «contadini» sono una radice sola);
   fra più capi decide un hash del nome dell'individuo e della zona, quindi la stessa persona veste sempre lo stesso capo e non tutti lo
   stesso. Un mestiere senza capi nel mondo non veste: la gente non è tutta nello stesso mantello. Il seme ha due capi di mestiere
   (`items.base`): il cappello di paglia (testa; contadini e pastori) e il grembiule di cuoio (busto; fabbri e fornai).
3. **I segni sono quelli dell'inventario** (`dressInventory` in `src/kernel/wearing.ts`): il capo nella tasca in cui sta o aggiunto (il
   grembiule che non portava), il segno sulla zona; nient'altro cambia. Il renderer li legge come legge quelli del viandante (`wornBy`,
   T290): nessun codice nuovo per disegnare. Veste `People.dress`, dopo l'identità, anche per chi è **già nel registro** (incontrato di
   nuovo, dopo che un luogo è stato lasciato e rivisto): da `wears` e dal mestiere, senza chiamate. Chi era nel registro prima di questo
   contratto non ha `wears`: lo veste il mestiere.
4. **Il filo** (regola 8f): `EntityView.worn` porta zona → id dei capi dell'individuo (`wornItems`, letti come li legge il kernel), e
   dell'inventario nient'altro; il client sottile lo mette nel componente `worn` dell'entità specchio (`readWorn`: solo le tre zone,
   testi tagliati), che `wornBy` legge dopo `remote.worn` e prima dei segni dell'inventario. Un capo che il client non conosce non si vede.
5. **La porta** `NpcHost` ha `wornZone(item)` (`Kernel.wornZone`): la zona di un capo la decide il kernel, come per il viandante.
6. **Offline** il Narratore (`MockAiModels`) nomina un capo comune per individuo, uno fra quelli del mondo che hanno una parola di capo
   nel nome, e definisce come `clothing` col suo posto un capo che qualcuno nomina (`content.define`).
7. Sale `Z`: kernel **0.6.5**. Gli universi della 0.6 restano buoni: un campo facoltativo nel registro delle persone e nella scheda, un
   campo nuovo sul filo, due oggetti nel pacchetto del seme.

## Alternative scartate

- **Una chiamata al Narratore per vestire** (una scheda degli abiti): costa come un'individuazione in più per persona; la scheda che
  c'è già dice tutto ciò che serve, e il mestiere copre il resto gratis.
- **Un capo generico per tutti** (il mantello del seme a chi non ha niente): sessanta persone nello stesso mantello; meglio nudi dove il
  mondo non ha ancora un capo del mestiere, come prima.
- **Un componente a parte per gli abiti degli individui**: il renderer, il filo, il salvataggio con l'inventario e i doni passano già
  dai segni dell'inventario (ADR-0180); un secondo modo di vestirsi sullo stesso corpo.
- **Vestire dal programma del mestiere** (`jobs` con un campo `wears`): i programmi dei mestieri sono pochi e del seme; i capi li
  scrive il Narratore nei pacchetti, con il mestiere nel nome o nei tag, e il confronto per radice li trova senza un campo in più.
- **Persistere anche la scelta del mestiere**: è derivata e deterministica (hash del nome); scriverla costerebbe un commit per persona
  e invecchierebbe quando il mondo ha capi nuovi.

## Conseguenze

- `tests/vestire-individui.test.ts`: le radici dei mestieri e i capi di un mestiere; la scheda prima (uno per zona), il mestiere per le
  zone nude, lo stesso individuo sempre uguale e non tutti uguali, niente per un mestiere senza capi; `dressInventory`; nel kernel: un
  individuo della scheda (il capo nominato addosso, `wears` nel registro, dopo la distruzione e il ritorno con la stessa origine lo stesso
  abito e nessuna chiamata), uno del mestiere (il fabbro del registro col grembiule del seme, la tessitrice senza, il gatto niente, zero
  chiamate), un abitante vestito dal tick senza che nessuno gli parli; sul filo: il client vede zona → id, mai il resto dell'inventario,
  e tolto se ne va. `tests/npc-architecture.test.ts` resta verde: `outfits.ts` importa solo i dati e `wearing.ts`.
- **Nel browser** (build, `vite preview`, `?skip&offline`, Claude in Chrome; catture in `docs/catture/T353/`): gli abitanti del seme
  vicino al viandante, individuati dal tick, con il mantello, il cappello di paglia o il grembiule addosso (via C: i colori del capo sulla
  zona), ognuno il suo.
- **Costo**: zero chiamate in più. `indossa` aggiunge poche decine di token alla scheda; un capo nuovo nominato dal Narratore entra con
  la chiamata che c'era per ciò che l'individuo porta. Il mestiere costa un confronto di parole su trenta capi, una volta per
  individuazione. Il corpo vestito si fa nel worker come per i viandanti (ADR-0180): una volta per forma e capi, condiviso: gli abitanti
  con lo stesso corpo e lo stesso abito sono una geometria sola.
- **Ciò che manca**: gli individui non si cambiano (un capo dato loro non si indossa; chi veste è l'individuazione); gambe, piedi e mani
  come per il viandante; la scheda dell'Attore (`npc.sheet`) non dice gli abiti; la via B per gli individui dipende dai capi che lo
  Scultore scolpirà con la sezione `<worn>`.
- Sicurezza: nessuna superficie nuova. `EntityView.worn` esce solo come tre testi di id letti come il kernel li legge; il client li
  legge con `readWorn`. Nulla entra dal client.
