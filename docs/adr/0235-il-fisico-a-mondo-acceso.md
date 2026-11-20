# ADR-0235 — Il Fisico a mondo acceso

Data: 2026-11-21 · Stato: accettato (task T452 del backlog; decisione dell'autore D64: il kernel accoglie quante più modifiche può) ·
Riferimenti: ADR-0224 (la fisica rimodellabile: questo ADR ne apre la «via del Fisico a mondo acceso»), ADR-0225 (il layout che nuota),
ADR-0226 (la gravità), ADR-0109 (ciò che il Concilio scrive, `councilMayWrite`), ADR-0042 (la Fucina), regole 1, 2, 7, 8b, 10 di `AGENTS.md`

## Contesto

ADR-0224 ha reso dati le primitive della fisica (`src/kernel/nature.ts`), ma le scrive solo il Fisico alla Genesi (`genesis.physics`); dopo,
un terreno cambiava solo per mano del kernel (le azioni imparate) e la natura del mondo era ferma come la partita. L'autore (D64) vuole che il
mondo si rimodelli il più possibile anche da acceso: «il fango non si attraversa più», «la palude si nuota», «la neve rallenta di più», «i corpi
pesano la metà». Il rischio è la regola 10: un terreno che smette di attraversarsi può dividere un luogo; e un luogo pianificato si ridispone
dal suo piano a ogni caricamento, quindi un modo di attraversare diverso può cambiargli le caselle.

## Decisione

1. **La via.** Il Referente ha un incarico nuovo, `physics`: una richiesta che cambia come i corpi vanno sul mondo (un terreno che si cammina,
   si nuota o non si attraversa più, il suo passo, quanto stanca nuotarlo, quanto è profonda la sua acqua, il peso di ogni corpo), anche una
   regola del mondo che lo dice: una regola che cambia la fisica diventa un dato, non un numero nel testo di una regola (ADR-0224 § 1). Il
   Fisico la riceve (`physics.reshape`, `src/kernel/agents/physicist.ts`, nel censimento con la manopola `studio`) con i terreni come il kernel
   li legge e ciò che di ognuno è fermo, e risponde coi soli terreni e campi che cambiano, la gravità se cambia, una nota nella lingua del mondo,
   o un rifiuto. In una partita di molti solo il master (come ogni richiesta al Concilio, sul suo ramo); da soli il viandante trasceso.
2. **Che cosa si rimodella**, letto senza fidarsi e **senza tagliare** (`src/kernel/reshape.ts`): un valore fuori dai tetti si rifiuta col
   motivo, perché il Fisico possa correggerlo; il pavimento resta `terrainPhysics` (regola 7).
   - di un terreno: `cross` (`walk`, `swim`, `none`), `speed` (a piedi 0,3-1,5, a nuoto 0,2-0,6), `fatigue` (1-6) e `depth` (`shallow`, `deep`,
     `reef`) solo dove si nuota, `air`. Il tile che esce dice la sua fisica intera, coerente (`solid` è ciò che non si cammina, un passo
     nell'intervallo del suo modo, niente fatica né profondità dove non si nuota);
   - fermo: lo strato (muri, vegetazione e roccia mai, pavimenti e porte sempre, si nuota solo un liquido e un liquido non si cammina); dei
     codici di base (`BASE_CODES`) come si attraversano e la profondità dell'acqua (`WATER_CODES`), l'aria; il vuoto; della natura tutto tranne
     la gravità (`RESHAPED_NATURE`): la geografia fa le bozze, il giorno è l'orologio del mondo (cambiarlo sposterebbe il numero del giorno di
     ogni piano e impresa), il cielo va con la geografia, il respiro non è aperto. Dei codici di base il passo sì, a differenza della Genesi:
     non cambia nessuna casella;
   - la gravità del mondo entro `NATURE_ACCEPTS.gravity` (0,2-2): il salto con lei non è mai più corto di quello della terra con cui il kernel
     verifica ciò che si raggiunge (ADR-0226), e lo stretto dell'arcipelago è misurato sul mare più faticoso e sul passo più pesante che i tetti
     permettono (`MAX_STRAIT`), quindi passo, fatica e gravità entro i tetti non toccano la regola 10.
3. **La regola 10.** Solo il modo di attraversare può sconnettere. Se un codice lo cambia (`crossingChanged`), `Kernel.crossingBreaks` guarda ogni
   luogo del mondo con la tavolozza di prima e con quella nuova:
   - un luogo caricato le cui caselle di adesso (anche quelle cambiate da un effetto) si dividerebbero (`walkGroups`, `splitBetween`: un corpo
     passa dove si cammina o si nuota) → «dividerebbe «X»»;
   - un luogo pianificato, caricato o sul disco (`plannedPlaces`), che il layout disporrebbe altrimenti (`laidWith`: la tavolozza di prova solo per
     quella chiamata): scaverebbe un sentiero dove il luogo era intero, o lascerebbe un sentiero che vi aveva scavato → «cambierebbe le caselle di
     «X»». Così un piano ridisposto al prossimo caricamento resta com'era, e le cose, le persone e le modifiche che stanno sulle sue caselle
     restano dove sono (le regole senza wipe di T183).
   Un kernel del ramo del master non ha i luoghi del mondo: lo chiede al mondo che rappresenta (`branchOf`). Ciò che sconnetterebbe o cambierebbe
   le caselle si rifiuta col motivo, che nomina i luoghi.
4. **Una volta indietro.** Ciò che il kernel rifiuta torna al Fisico una volta, coi motivi (come le direttive del master); ciò che resta rifiutato
   non entra, e i motivi vanno nella risposta del Referente e nelle mancanze (`world/shortfalls.json`, ADR-0130). Tutto o niente: una risposta
   con un terreno rifiutato non entra in parte.
5. **Il commit.** Accettato, un commit del Concilio: il manifest dei terreni (`modules/<generatore>/manifest.json`, in `councilMayWrite`) e, se
   cambia, la gravità in `universe.json` per mano del kernel (`writeCommanded`, che `fenceCouncil` lascia passare, come `setAi`). `keepNature`
   ora tiene dalla Genesi tutta la natura tranne la gravità (`keptNature`): un `universe.json` che dice un'altra gravità la porta, sia il commit
   del kernel sia il ramo pubblicato del master sia il file del server su un client. Il validatore prova il manifest prima di scriverlo; se il
   mondo si romperebbe, i file tornano com'erano.
6. **In molti.** Il master lo chiede sul suo ramo: il kernel del ramo fa il commit, il ramo prende i due file, e lo specchio del master li prende
   come il server li ha scritti (`writeCommanded` anche lì: la guardia del Concilio l'ha già fatta il server; senza, lo specchio scartava
   `universe.json`). Pubblicato, il mondo applica i file e ogni client li riceve per i campi che già escono (`TILE_FIELDS`: `cross`, `speed`,
   `fatigue`, `depth`, `air`; `UNIVERSE_FIELDS`: `nature`): il passo del server, la predizione del client e il salto usano la fisica nuova.
7. **Mai da Lua** (regola 1): nessuna API nuova; Lua legge come prima (`world.nature()`, `world.tile`, `world.speed_at`).

## Conseguenze

- Kernel **0.10.11** (lo stesso contratto: i formati e i campi non cambiano, si scrivono dati che c'erano già).
- Cose nuove: `src/kernel/reshape.ts` (`reshapedTerrain`, `reshapedGravity`, `keptNature`, `crossingChanged`, `reshapedWords`,
  `RESHAPED_TILE_FIELDS`, `RESHAPED_NATURE`, `MAX_RESHAPED`), `src/kernel/agents/physicist.ts` (`askReshape`, `RESHAPE_TASK`), `Kernel.reshapePhysics`,
  `Kernel.crossingBreaks`, l'incarico `physics` del Referente, `physics.reshape` nel censimento e nei modelli locali. `writeCommanded` è
  pubblico (lo specchio del master).
- Non fatto: l'«Altro…» del viandante che rimodella (resta il Narratore e le caselle, ADR-0224 § 1); la gravità e l'aria per regione (T446,
  T447 col master); un terreno nuovo a mondo acceso (resta della Fucina e del Cartografo, il Fisico lo rifiuta). Un cambio del modo di
  attraversare chiesto sul ramo è misurato sui luoghi del mondo quando lo si chiede: quelli pianificati fra la richiesta e la pubblicazione no
  (la pubblicazione è del master, regola 3).
- Sicurezza: nessuna superficie nuova. Chi può chiedere è chi parla col Concilio (il master in molti, `askOnBranch`); il testo passa dalla
  guardia del Referente (`text.guard`); i campi che escono ai client c'erano già; `keepNature` lascia passare la gravità di un universe.json, che
  scrivono solo il kernel e il master (il Concilio no, `fenceCouncil`; un giocatore no, il server non prende i suoi file); niente arriva a Lua.
