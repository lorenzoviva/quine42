# La lingua interna: l'inglese, e le rune in latino (T306, step 42)

> Stato: **decisa** dall'autore (D34, 05/11 sera), ADR-0153; **T307a fatto** (contratto `0.2.0`, ADR-0155: la simulazione e le rune latine, la migrazione `0.1 → 0.2`); **T307b fatto** (contratto `0.3.0`, ADR-0158: la società e il Concilio, la migrazione `0.2 → 0.3`); **T308a fatto** (contratto `0.4.0`, ADR-0159: i campi e i percorsi dei file dell’universo, la migrazione `0.3 → 0.4`); **T308b fatto** (contratto `0.5.0`, ADR-0163: il filo e Lua, la migrazione `0.4 → 0.5`); **T309 fatto** (kernel `0.5.1`: i commenti del Lua e degli XML del seme); **T310 fatto** (kernel `0.5.2`, ADR-0165: i prompt in inglese, il blocco «Lingua», la quarta parete in italiano e inglese); **T310b fatto** (contratto `0.7.0`, ADR-0189: i campi degli schemi in inglese, il tipo di legame come id, i valori che restavano, la migrazione `0.6 → 0.7`; lo `0.6` è di T342, i simboli dei programmi). Questo documento è il piano: la tabella completa di ciò che cambia nome,
> dominio per dominio, e i task che la applicano. La stessa tabella, come dato, è `src/kernel/internalNames.ts` (`INTERNAL_NAMES`);
> `tests/internal-names.test.ts` controlla che non abbia doppioni né collisioni e che copra i valori del codice; le tabelle qui sotto
> le riscrive `npx vite-node lab/scripts/lingua-interna.ts` (con `-- --misura` conta anche i file che ogni passo tocca).
> Il progetto delle quattro lingue, di cui questa è la premessa, è in [`lingue.md`](lingue.md); le cifre in [`lingue-censimento.md`](lingue-censimento.md).

## 1. Che cosa ha deciso l'autore

- **Le lingue: C** ([`lingue.md`](lingue.md) §2). Il mondo ha **una lingua per universo**, scelta alla Genesi e fissa (oggi l'italiano per
  tutti; la scelta la porta T239, in Fase III); l'interfaccia è nella lingua del viandante.
- **Subito, prima della beta, l'inglese come lingua interna**: la comunità dello sviluppo agentico deve poter leggere il repository.
  Diventano inglesi i valori che il codice confronta, i nomi di campo su disco, i percorsi dell'universo, i messaggi del protocollo, i nomi
  che Lua vede, i commenti di Lua e degli XML, i prompt del Concilio.
- **I token delle rune magiche in latino** (`lux`, `ignis`, `aqua`, `terra`, `vita`, `scutum`, `ventus`), uguali in ogni lingua. I token
  di codice (`x`, `speed`, `=`) restano Lua.
- **I prompt in inglese** (P2 di `lingue.md` §4), con un blocco «Lingua» che dice in che lingua scrivere il testo del mondo.
- **Il filtro della quarta parete** su tre lingue: quella del mondo, l'italiano e l'inglese (§4 di `lingue.md`).
- **La documentazione resta italiana** (a parte il sottoinsieme in inglese di `lingue.md` §9, in Fase III).

## 2. La regola: che cosa è interno e che cosa è del mondo

**Interno** (inglese, uguale in ogni universo): ciò che un programma confronta o legge per nome.

- i **valori** dei domini chiusi: classi, taglie, effetti, categorie, momenti, attività, comportamenti, stati, agenti, coefficienti…;
- i **nomi di campo** dei file dell'universo, dei messaggi, dei componenti;
- i **percorsi** dell'universo (`world/players/`) e le cartelle del server fuori dagli universi (`universes/.balances/`);
- i **nomi che Lua vede**: componenti, l'API (`world.venture`), gli eventi del bus (`death`);
- i **commenti** del Lua e degli XML del seme (T309) e i **prompt** (T310);
- i **token delle rune magiche**, che però sono **latini**: sono parole del mondo e del codice insieme, e il latino non è la lingua di
  nessun viandante, così ognuno le scrive uguali, come scrive `speed`.

**Del mondo** (nella lingua del suo universo, oggi l'italiano): ciò che qualcuno legge.

- la bibbia, i nomi e le storie degli individui, i ricordi, le battute, le trame, le missioni, il canone (le righe, non i token), il lessico;
- i **nomi** delle cose: `name` di moduli, oggetti, terreni, ambienti, rune («Sowilo»), incantesimi («Lume»), modelli;
- la parola di un legame («madre»), il mestiere di un individuo («fornaia»), le direzioni nei testi («a nord-est»);
- le parole inventate del lessico (`bonombo`, `macico`), uguali in ogni lingua come già dice `lingue.md` §3.

**Ciò che il Concilio ha già scritto negli universi salvati e che solo il suo modulo legge resta com'è**: le azioni di un modulo
generato (`on_act` le riceve per id), i componenti che un modulo si è dato (`tratti`, `opinioni` di `neapolis`), gli ambienti e gli id di
oggetti, modelli e moduli scritti dal Cartografo, dalla Fucina, dallo Scultore. Sono contenuto: funzionano in qualunque lingua perché solo
chi li ha scritti li legge. Nel **seme** invece cambiano anche questi dove il kernel li nomina (`sys.lavoro` → `sys.work`, `obj.letto` →
`obj.bed`, i modelli generici delle classi).

Un **terreno** oggi è insieme id e testo (`tileCode` del validatore lo cerca per nome): diventa un `id` interno più il `name` nella lingua
del mondo; `world.find_tile`, `matura.in` e il validatore cercano prima l'id, poi il nome.

## 3. Contratti e migrazioni

Ogni passo di codice cambia il contratto con gli universi (ADR-0136) e registra la sua migrazione in `MIGRATIONS`
(`src/kernel/migrations.ts`, l'impalcatura di T302, ADR-0152). **Un contratto per passo**: un universo salvato tra due passi è coerente con
il suo contratto, ogni migrazione è una funzione pura con il suo test, e la catena le applica tutte a un universo della `0.1`.

| passo | contratto | migrazione | che cosa |
|---|---|---|---|
| T307a | `0.2.0` | `0.1 → 0.2` | la simulazione del mondo: classi, taglie, effetti e i loro campi, categorie, forme, terreni, ambienti, timbri, azioni, **rune in latino**, pannelli, casi |
| T307b | `0.3.0` | `0.2 → 0.3` | la società e il Concilio: momenti, «dove», attività, specie, legami, mestieri e moduli del seme, comportamenti, imprese, trame, suoni, parti, agenti (e i file dei loro prompt), classi dello Scultore, coefficienti, carte e grafo, modalità, valori del solo TypeScript |
| T308a | `0.4.0` | `0.3 → 0.4` | i file dell'universo: i nomi di campo di ogni file e i percorsi (`world/giocatori/` → `world/players/`…), con `paths.ts` e `files.ts` |
| T308b | `0.5.0` | `0.4 → 0.5` | il filo e Lua: messaggi del protocollo, i loro campi, i componenti e i loro campi, l'API Lua, gli eventi del bus |
| T342 | `0.6.0` | `0.5 → 0.6` | (non di questo piano, ADR-0175) i simboli dei programmi MarkovJunior: una cifra da sola diventa `#` e la cifra |
| T310b | `0.7.0` | `0.6 → 0.7` | i valori che gli schemi del Concilio elencavano ancora in italiano: dove sta una cosa in un piano, il tipo di un ambiente, i modi della mente, i posti e i bonus delle cose, i ruoli dei timbri, i comandi di uno strumento; il tipo di ogni legame come id (`kind`); i campi delle risposte (`campi-risposte`, non su disco) |

Come migra un universo salvato:

1. **I dati** (JSON dell'universo, piani, indice dei modelli, manifest): la migrazione cambia ogni valore e ogni campo che la tabella nomina,
   solo dove il campo è quello del dominio (una `classe` in `appearance`, non la parola «grande» in una descrizione), e rinomina i file.
   Deterministica: gli stessi file danno gli stessi file. I campi che un kernel di domani conosce e questo no restano (come `unknownFields`).
2. **Il Lua** dei moduli generati: la migrazione riscrive solo le **stringhe letterali** che stanno dove il kernel le legge (il nome di un
   componente in `ecs.get/set/each/first`, il `tipo` di una tabella passata a `core.effects.apply`, un evento di `bus.emit`, una chiave
   del magazzino) e i nomi dell'API (`world.impresa`). Poi il modulo passa dal validatore (compilazione, API, caricamento di prova): se
   non passa resta com'era e diventa un guasto, che l'Ingegnere ripara (regola 2: l'IA non rompe il gioco). Ciò che il giocatore ha scritto
   non si ripara da solo (regola 3): resta com'era, col guasto.
3. **Le rune**: i token cambiano nel canone, nelle formule (`terra fuoco` → `terra ignis`), negli incantesimi del Concilio
   (`magic.spells`), nelle rune a terra dei piani e nelle rune incise e tenute dai viandanti (`hand.tokens`, gli oggetti `rune:<token>`).
4. **Il seme** (`universe/`) si riscrive direttamente in ogni passo (è immutabile per gli universi, non per il kernel); `upgradeFromSeed`
   porta il seme nuovo solo a un universo già migrato. I quattro universi di `lab/banco/universi-cloud/` li installa
   `npm run universi:cloud` già migrati, con le stesse funzioni.
5. **Per un contratto il validatore accetta anche il valore italiano** e lo riporta all'interno (una riparazione, come `repairGameSetup`),
   finché T310 non cambia i prompt: il Concilio di oggi scrive ancora «`tipo: luce`», e non deve rompersi. Dopo T310 la riparazione resta
   un contratto ancora, poi si toglie.
6. **Prova**: per ogni passo, `valmora` o gli universi del 20/10 (come T183, T205) e i quattro di `lab/banco/universi-cloud/` si aprono
   migrati senza guasti; 400 tick offline sul seme senza fault.

## 4. Il piano dei task, verificato sul codice

`npx vite-node lab/scripts/lingua-interna.ts -- --misura` conta i file di `src`, `tests`, `universe`, `server` e `site` che citano tra
apici un valore italiano dei domini di ogni passo (per difetto le parole più comuni, `nome`, `testo`, contano anche dove non sono il campo:
è un tetto, non la cifra esatta):

| task | file | di cui test | di cui seme (`universe/`) | di cui `src/` |
|---|---:|---:|---:|---:|
| T307a | 241 | 100 | 83 | 49 |
| T307b | 311 | 128 | 72 | 87 |
| T308a | 265 | 110 | 63 | 74 |
| T308b | 272 | 112 | 71 | 69 |

T307 come era scritto (tutti i valori insieme) toccava ≈ 400 file, T308 ≈ 380: troppo per un task, e ognuno in conflitto con tutti.
**Il piano è in sei task**, tutti **da soli** (nessun altro task su `src/`, `universe/`, `tests/` in corso), nell'ordine:

1. **T307a** — i valori della simulazione e le rune in latino, contratto `0.2.0`, migrazione `0.1 → 0.2` con la riscrittura del Lua
   (punto 2 sopra: la scrive questo task, gli altri la estendono) e la riparazione dei valori italiani nel validatore. Browser: `?skip&offline`,
   un universo salvato prima si apre migrato, una runa latina pronunciata funziona (è la verifica che T307 chiedeva).
   **Fatto** (ADR-0155): `MIGRATIONS[0]` con `migratePlan` (i piani, idempotente, a ogni lettura), `luaFor0_2` solo nei moduli del Concilio,
   `seed.json` che segue la migrazione, `prepareUniverse` in ogni caricamento; gli schemi del Concilio elencano ancora i valori italiani
   (`italianValues`) e il validatore li ripara; i quattro universi del laboratorio restano `0.1` sul disco e si leggono portati.
2. **T307b** — i valori della società e del Concilio, contratto `0.3.0`: rinomina anche `prompts/agents/<agente>.md`, i moduli
   `lavoro.*` → `job.*` e `sys.lavoro` → `sys.work`, i modelli `corona-gerboa-<agente>` e `suono-*` del seme.
   **Fatto** (ADR-0158): `MIGRATIONS[1]` con i file che cambiano nome con ciò che nominano (moduli del seme e il loro magazzino, prompt,
   programmi sonori del seme, gerboa), i dati campo per campo, il Lua del Concilio dove il kernel legge un valore (`luaFor0_3`),
   `migratePlan` sulle cose dei piani; tre domini nuovi: `esiti-lavoro` (gli esiti di `sys.work`, da T314), `suoni-seme` (gli id dei
   programmi sonori del seme), `viandante-solo` (`io → me`, spostato a T308a: è un file dei viandanti, un timbro di ogni carta e la
   chiave dei saldi fuori dall'universo); in più `impresa → venture` fra i «dove» dei compiti e `qualunque → any` fra i mestieri dei ruoli.
   Le stanze dello studio (`persone`, `luoghi`, `galleria`) e i tipi degli archi del grafo non sono nella tabella e restano.
3. **T308a** — i campi e i percorsi dei file dell'universo, contratto `0.4.0`: `paths.ts` (`allowedPath`, `councilMayWrite`), `files.ts`
   (`playerFiles`, `publicFiles`, `UNIVERSE_FIELDS`), le letture di sito e server; la suite di sicurezza (`paths.ts`, `files.ts`); le cartelle
   del server fuori dagli universi (`.saldi` → `.balances`…) con la lettura del nome vecchio finché c'è; `quine:fila:` letta anche col nome vecchio.
   **Fatto** (ADR-0159): `MIGRATIONS[2]` con i campi **per forma di file** (`FIELD_SHAPES`, `internalFields`: quali chiavi italiane di
   quale oggetto, così `posto` è `slot`, `workplace` o `spot` e i componenti restano a T308b), i timbri `carta` → `card` ovunque
   (`internalCardsIn`), `io` → `me` (`internalSoloIn`, anche il file `world/players/me.json`), i percorsi (`internalPath`), `suolo` → `soil`
   negli XML; lo stato di prima di T245a portato (`importanti` → `rares.huge`, `viandante` → il file di `me`). Ogni lettura accetta anche i
   campi di prima, e il server porta in memoria ciò che legge dal disco (`portedFiles`, `pathsBefore`); le cartelle del server in
   `server/folders.ts`, spostate la prima volta che servono; la fila del browser in `quine:owed:`, quella di prima presa e portata. Voci
   aggiunte alla tabella: `regole`, `trame`, `nome`, `voci`, `volte`, `primo`, `ultimo` (i contenitori dei file e le mancanze), `entita` (il
   posto di lavoro e la cosa da usare); l'`azione` di un compito di mestiere è `action` (l'id di un'azione), non `activity`. Restano: gli
   schemi del Concilio con i campi italiani (T310), i campi del grafo, dei componenti e dei messaggi (T308b), il contenuto dei saldi.
4. **T308b** — il filo e Lua, contratto `0.5.0`: protocollo (client e server insieme, nessun dato da migrare), componenti, API Lua
   (`Host`, `prelude.lua`, `LUA_API`, prompt dell'Ingegnere, `AGENTS.md`), eventi del bus. Browser: singola e due schede in multigiocatore.
   **Fatto** (ADR-0163): `MIGRATIONS[3]` con i manifest (`internalManifest0_5`: componenti, `singleton`, `persist`, i campi dei pannelli, i casi), gli
   stati dei viandanti, il magazzino di `sys.work` (`deposit:`) e il Lua del Concilio (`luaFor0_5`: i nomi in `ecs.*`, i campi dove la tabella
   del componente si costruisce o si legge su ciò che `ecs` ha dato, l'API, l'evento `death`); i campi **per componente** (`COMPONENT_FIELDS`).
   Voci aggiunte alla tabella: `compiti`, `impresa_posto`, `concetto`, `classe`, `taglia`, gli stati `velocita`/`peso`/`luce`, il salto
   `da`/`a`/`alto`, il cantiere `titolo`/`stato`/`manca`/`squadra`, `morto`, `fame`/`sete` dell'evento; `fino` diventa `expires` e non `until`,
   parola riservata di Lua (il dominio vieta ora le parole riservate). Restano: il canale dei mondi (`worldwire.ts`), le rotte HTTP, lo stato
   privato di `sys.work` nel suo `work`, gli eventi del bus che solo il TypeScript ascolta.
5. **T309** — i commenti di Lua e XML, invariato: non cambia contratto (sale `Z`); il controllo di identità (token Lua uguali, albero XML
   senza commenti uguale, voxel uguali). Si fa dopo i passi di codice perché i commenti nominano i valori nuovi.
   **Fatto** (kernel `0.5.1`): ≈ 2.000 commenti diversi (≈ 27.000 parole) di `universe/modules/*/logic.lua`, `universe/models/*.xml` e
   `lab/mjx/official/`, tradotti a unità (le righe di commento che si seguono sono una frase sola) con `tools/lingua/cli.ts` (`estrai`,
   `applica`, `confronta <ref>`); lo stesso testo è cambiato anche nelle copie dei programmi sotto `lab/` (le copie restano copie), tranne `lab/banco/universi-cloud/`: sono universi di un contratto prima, e la migrazione riconosce i file del seme di allora dalla loro impronta (`seed.json`), commenti compresi. Il
   codice è lo stesso file per file (`confronta`: token Lua, albero XML senza commenti), i voxel anche (`tests/mj-engine-determinism.test.ts`);
   `tests/seed-comments.test.ts` tiene inglesi i commenti del seme (un commento può citare ciò che il mondo dice: «…», "…"). I testi di
   un'insegna o di un'animazione (`"SALA DEL CONCILIO"`, `"delibera"`) restano come sono: sono il mondo. `prelude.lua` era già inglese.
   In TypeScript: le poche righe italiane di `src/` (`graph.ts`, `cards.ts`, `server.ts`) e `site/sessioni.ts`. Restano italiani i
   commenti dei test (`tests/`), della pipeline (`tools/pipeline/`) e dei programmi del laboratorio che non sono copie del seme.
6. **T310** — i prompt in inglese e il blocco «Lingua», invariato; in più: toglie (dopo un contratto) la riparazione dei valori italiani del
   punto 5, e aggiunge allo schema del Narratore il tipo di legame come id (`legami`), così `society.ts` non indovina più dalla parola.
   **Fatto in parte** (kernel `0.5.2`, ADR-0165): i ruoli di `prompts/agents/`, `theme.md` e le quattro ambientazioni, `COUNCIL_PRINCIPLES`, i
   frammenti degli agenti e ciò che il kernel compone per un prompt in inglese; la lingua del mondo (`universe.json → language`, `it` se
   manca) e il blocco «Lingua» dopo i principi (`src/kernel/language.ts`); gli id degli schemi interni (`internalValues`), e interni anche i
   campi degli effetti e degli elementi dei pannelli; la quarta parete sulla lingua del mondo, l'italiano e l'inglese, con le frasi di prova e
   venti frasi innocue per lingua (`tests/fourthwall-languages.test.ts`). La riparazione dei valori italiani resta: si toglie un contratto dopo.
   Misura (`lab/scripts/prompt-tokens.ts`): testi fissi −6,9 %, richieste di una Genesi offline −3,3 %; prova a pagamento (≈ 0,07 $): nessun
   testo del mondo in inglese. Il resto è T310b (punto 7).
7. **T310b** — i campi degli schemi del Concilio in inglese, il tipo di legame come id, i valori che restavano, contratto `0.7.0`.
   **Fatto** (ADR-0189): ogni schema di `src/kernel/agents/*.ts` e del kernel nomina i campi in inglese (`say`, `title`, `beats`, `possible`,
   `story`…), con i tipi che li leggono e le risposte di `MockAiModels`; una tabella sola, `campi-risposte`, che `Council.ask` applica a ogni
   risposta a ogni profondità (`internalAnswer`), così una risposta coi campi di prima legge uguale (tre parole restano a ciascun lettore
   perché cambiano senso fra schemi: `storia`, `oggetti`, `tag`). Il tipo di legame come id: `Relation.kind` (`RELATION_KINDS`), scritto dallo
   schema del Narratore accanto alla parola del mondo (`family[].kind`, `bond_kind`) e dal kernel quando ripara la società; i lettori
   (`relationKind`, `relationProblem`, `greeting`…) leggono il `kind` e, senza, la parola italiana come ripiego. Dodici domini nuovi
   (`dove-piano`, `tipi-ambiente`, `direzioni`, `tipi-fucina`, `azioni-npc`, `incarichi`, `posti`, `ruoli-timbri`, `interazioni`, `comandi`,
   `ripartenza`, `bonus`) con la migrazione `0.6 → 0.7` (`MIGRATIONS[5]`: i piani, i manifest, il Lua del Concilio dove il kernel legge
   un valore con `luaFor0_7`, `world/people.json`); gli id degli slot di un pannello sono parole del modulo e restano. Le espressioni
   regolari di `lingue.md` §5: un id dove c'è uno schema, tabelle in italiano e inglese dove no (`guessClass`, `forge.ts`, `defaultCodes`,
   `normName`, l'atlante); quelle sui testi generati (le trame, le rune, le attività come ripiego) restano italiane fino a T239. La
   riparazione dei valori italiani di 0.1-0.3 resta un contratto ancora (si toglie con lo 0.8).

Le stime di T307 (8 %) e T308 (6 %) si dividono a metà fra a e b; il backlog le rinumera quando integra.

## 5. Ciò che resta fuori

- **Il testo del mondo** (§2): resta nella lingua dell'universo; tradurlo è T239 (Fase III).
- **L'interfaccia** (UI del gioco, sito, messaggi del kernel al viandante): resta italiana; i dizionari per lingua sono T239.
- **Gli indirizzi**: `/api/viandante`, `/api/crediti`, `/api/coda`, `?universo=`, `?viandante=`, `?classica`, `window.rune`, le chiavi di
  `localStorage` del sito e del profilo (`quine:sito:reame`, `rune:profilo:`), l'ancora `#reami`. Sono l'interfaccia (link, profili dei
  browser, abitudini): li cambierà T239 con un reindirizzamento, se servirà. `quine:fila:` invece è un formato interno e passa con T308a.
- **Le espressioni regolari che leggono testo** (le 83 di `lingue.md` §5): T310b ha messo un id dove c'è uno schema e tabelle it/en dove no;
  quelle sui testi generati (trame, rune, attività come ripiego, modelli offline) restano italiane fino a T239.
- **I contenuti scritti dal Concilio negli universi salvati** che solo il loro modulo legge (§2), e gli id di oggetti e modelli che il
  kernel non nomina.
- **Le stringhe del Lua del seme che nessun TypeScript legge** fuori dagli esiti di `sys.work` (che hanno il loro dominio, T307b): i nomi
  delle variabili e delle funzioni locali, i messaggi al viandante; i commenti li porta T309.
- **I nomi italiani del laboratorio** (`lab/`): le cartelle e i programmi di prova seguono i passi solo dove i test li leggono.
- **La documentazione** e gli ADR, che sono storia.

## 6. Le tabelle

Le voci: **905 tra valori, campi e percorsi** in 57 domini (il totale per passo è nell’ultima riga della prima tabella). Una voce con lo stesso nome a sinistra
e a destra resta com'è (è già inglese o latina: `lava`, `dungeon`, `terra`, `vita`, `studio`, `persona`); un campo che cambia senso tra due
oggetti dello stesso file ha due domini (`posto`: la tasca nei casi del banco, il posto di lavoro nei mestieri, il posto dell'impresa, il
posto di un pannello sul filo).

<!-- tabelle: inizio (lab/scripts/lingua-interna.ts) -->

| dominio | genere | voci | tocca | task (contratto) |
|---|---|---:|---|---|
| [Classi dei modelli](#classi) | valori | 12 | disco, prompt | T307a (0.2) |
| [Animazioni delle classi](#animazioni) | valori | 2 | solo codice | T307a (0.2) |
| [Taglie (D&D)](#taglie) | valori | 6 | disco, prompt | T307a (0.2) |
| [Effetti (`tipo`)](#effetti) | valori | 19 | disco, Lua, prompt | T307a (0.2) |
| [Campi degli effetti](#campi-effetti) | campi | 21 | disco, Lua, prompt | T307a (0.2) |
| [Categorie degli oggetti](#categorie) | valori | 11 | disco, prompt | T307a (0.2) |
| [Forme degli oggetti (gli id `forma-…` dei modelli)](#impronte) | valori | 31 | disco, prompt | T307a (0.2) |
| [Nomi dei terreni del seme (diventano id con l’etichetta italiana)](#terreni) | valori | 24 | disco, Lua, prompt | T307a (0.2) |
| [Ambienti del seme (layout)](#ambienti) | valori | 20 | disco, prompt | T307a (0.2) |
| [Timbri delle strutture](#timbri) | valori | 12 | prompt, solo codice | T307a (0.2) |
| [Azioni del seme (`actions[].id`) e dei programmi (`<action name>`)](#azioni-seme) | valori | 8 | disco, Lua | T307a (0.2) |
| [Token delle rune magiche (in latino)](#rune) | valori | 7 | disco, Lua, prompt | T307a (0.2) |
| [Elementi delle rune (`element`)](#elementi) | valori | 7 | disco, prompt | T307a (0.2) |
| [Elementi dei pannelli (`ui.elementi[].tipo`)](#pannelli) | valori | 4 | disco, prompt | T307a (0.2) |
| [Passi e direzioni dei casi del banco](#passi-banco) | valori | 8 | disco, prompt | T307a (0.2) |
| [Momenti del giorno](#momenti) | valori | 4 | disco, Lua, prompt | T307b (0.3) |
| [«Dove» della routine](#dove) | valori | 5 | disco, Lua, prompt | T307b (0.3) |
| [Attività degli individui](#attivita) | valori | 14 | disco, filo, Lua, prompt | T307b (0.3) |
| [Specie e genere](#specie) | valori | 4 | disco, prompt | T307b (0.3) |
| [Tipi di legame (solo codice: la parola del legame è testo del mondo)](#legami) | valori | 25 | solo codice | T307b (0.3) |
| [Mestieri del seme e i loro moduli](#mestieri) | valori | 13 | disco, Lua, prompt | T307b (0.3) |
| [Comportamenti dei mestieri (`fa`)](#comportamenti) | valori | 14 | disco, Lua, prompt | T307b (0.3) |
| [Id dei moduli del seme che il kernel nomina](#moduli-seme) | valori | 18 | disco, Lua, prompt | T307b (0.3) |
| [Tipi e stati delle imprese](#imprese) | valori | 11 | disco, Lua, prompt | T307b (0.3) |
| [Stati delle trame e delle missioni, tipi di obiettivo](#trame) | valori | 8 | disco, prompt | T307b (0.3) |
| [Usi dei suoni e nomi degli effetti sonori](#suoni) | valori | 12 | disco, prompt | T307b (0.3) |
| [Parti dei modelli (`part`) e viste delle foto](#parti) | valori | 8 | disco, prompt | T307b (0.3) |
| [Agenti del Concilio (`AgentId`)](#agenti) | valori | 10 | disco, filo, prompt | T307b (0.3) |
| [Classi dello Scultore (`ai.scultori`)](#classi-scultore) | valori | 6 | disco, filo | T307b (0.3) |
| [Coefficienti di generazione](#coefficienti) | valori | 19 | disco, filo | T307b (0.3) |
| [Tipi delle carte e dei nodi del grafo](#carte) | valori | 15 | disco, filo | T307b (0.3) |
| [Modalità della partita, esiti delle mancanze](#partita) | valori | 6 | disco, filo | T307b (0.3) |
| [Valori che solo il TypeScript confronta](#solo-codice) | valori | 53 | solo codice | T307b (0.3) |
| [Esiti dei compiti di `sys.work` e i loro motivi](#esiti-lavoro) | valori | 10 | Lua | T307b (0.3) |
| [Id dei programmi sonori del seme](#suoni-seme) | valori | 46 | disco | T307b (0.3) |
| [L’id del viandante della partita singola](#viandante-solo) | valori | 1 | disco, filo | T308a (0.4) |
| [Campi di `universe.json`](#campi-universe) | campi | 17 | disco, filo | T308a (0.4) |
| [Campi dei manifest (aspetto, terreni, pannelli, casi, mestieri)](#campi-manifest) | campi | 48 | disco, Lua, prompt | T308a (0.4) |
| [Campi dei programmi di mestiere che cambiano senso](#campi-mestieri) | campi | 1 | disco, Lua | T308a (0.4) |
| [Campi di `world/rules.json`](#campi-regole) | campi | 7 | disco, filo | T308a (0.4) |
| [Campi di `world/people.json`](#campi-persone) | campi | 30 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/plots.json`](#campi-trame) | campi | 25 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/bible.json`](#campi-bibbia) | campi | 10 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/atlas.json`](#campi-atlante) | campi | 6 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/stato.json`](#campi-stato) | campi | 8 | disco | T308a (0.4) |
| [Campi di `world/giocatori/<id>.json`](#campi-viandante) | campi | 9 | disco, filo | T308a (0.4) |
| [Campi di `world/imprese.json`](#campi-imprese) | campi | 37 | disco, Lua, filo | T308a (0.4) |
| [Campi delle carte, dei consumi e delle mancanze](#campi-carte) | campi | 27 | disco, filo | T308a (0.4) |
| [Campi dei piani dei luoghi (`maps/*.json`)](#campi-piani) | campi | 15 | disco, filo | T308a (0.4) |
| [Campi di `models/index.json` e attributi dei programmi](#campi-modelli) | campi | 17 | disco, prompt | T308a (0.4) |
| [Percorsi dell’universo e del server](#percorsi) | percorsi | 17 | disco, filo | T308a (0.4) |
| [Messaggi del protocollo (`t`)](#messaggi) | valori | 31 | filo | T308b (0.5) |
| [Operazioni e stati sul filo](#valori-filo) | valori | 24 | filo | T308b (0.5) |
| [Campi dei messaggi](#campi-filo) | campi | 53 | filo | T308b (0.5) |
| [Componenti visibili a Lua](#componenti) | valori | 16 | disco, filo, Lua, prompt | T308b (0.5) |
| [Campi dei componenti](#campi-componenti) | campi | 34 | filo, Lua, prompt | T308b (0.5) |
| [Nomi dell’API Lua, eventi del bus, chiavi del magazzino](#api-lua) | valori | 6 | Lua, prompt | T308b (0.5) |
| [«Dove» di una cosa in un piano (dentro o fuori i lotti)](#dove-piano) | valori | 3 | disco, filo, prompt | T310b (0.7) |
| [Tipi di ambiente (all’aperto, al chiuso, misto)](#tipi-ambiente) | valori | 3 | disco, prompt | T310b (0.7) |
| [Direzioni della bussola](#direzioni) | valori | 9 | prompt, solo codice | T310b (0.7) |
| [Tipi di ciò che la Fucina crea](#tipi-fucina) | valori | 3 | prompt, solo codice | T310b (0.7) |
| [Azioni di un individuo in un dialogo e modi della sua mente (`mind.mode`)](#azioni-npc) | valori | 6 | disco, Lua, prompt | T310b (0.7) |
| [Incarichi del Referente e interventi della sessione del Concilio](#incarichi) | valori | 12 | prompt, solo codice | T310b (0.7) |
| [Posti degli oggetti (dove si indossano o si impugnano)](#posti) | valori | 10 | disco, Lua, filo, prompt | T310b (0.7) |
| [Ruoli dei codici di un timbro (`codes`)](#ruoli-timbri) | valori | 9 | disco, prompt | T310b (0.7) |
| [Interazioni di un concetto della Fucina](#interazioni) | valori | 4 | prompt, solo codice | T310b (0.7) |
| [Comandi di uno strumento (`item.controls`)](#comandi) | valori | 2 | disco, prompt | T310b (0.7) |
| [Dove si riapre gli occhi dopo la morte](#ripartenza) | valori | 2 | prompt, solo codice | T310b (0.7) |
| [Bonus di una cosa indossata o impugnata](#bonus) | valori | 6 | disco, Lua, prompt | T310b (0.7) |
| [Campi delle risposte del Concilio (gli schemi delle richieste)](#campi-risposte) | campi | 164 | prompt | T310b (0.7) |
| **totale** | | **1165** | | T307a: 192 · T307b: 301 · T308a: 275 · T308b: 164 · T310b: 233 |

<a id="classi"></a>
### Classi dei modelli (`classi`)

- **Dove si legge**: `src/mj/classes.ts (CLASSES)`, `models/index.json → classe`, `manifest → appearance.classe`, `prompt dello Scultore`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2
- **Nota**: il modello generico di una classe ha il suo id (`models/persona.xml`): si rinomina con la classe

| italiano | interno |
|---|---|
| `sasso` | `pebble` |
| `roccia` | `rock` |
| `cespuglio` | `bush` |
| `albero` | `tree` |
| `oggetto` | `object` |
| `mobile` | `furniture` |
| `persona` | `person` |
| `animale` | `animal` |
| `bestia` | `beast` |
| `monumento` | `monument` |
| `edificio` | `building` |
| `grande` | `structure` |

<a id="animazioni"></a>
### Animazioni delle classi (`animazioni`)

- **Dove si legge**: `src/mj/classes.ts (AssetClass.animation)`, `src/mj/rig.ts`
- **Tocca**: solo codice · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `camminata` | `walk` |
| `vento` | `wind` |

<a id="taglie"></a>
### Taglie (D&D) (`taglie`)

- **Dove si legge**: `src/mj/classes.ts (SIZE_TIERS, RARE_SIZES)`, `manifest → appearance.taglia`, `models/index.json → taglia`, `maps/*.json → strutture[].taglia`, `world/stato.json → rari (chiavi)`, `world/imprese.json → taglia`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `minuscola` | `tiny` |
| `piccola` | `small` |
| `media` | `medium` |
| `grande` | `large` |
| `enorme` | `huge` |
| `gargantuesca` | `gargantuan` |

<a id="effetti"></a>
### Effetti (`tipo`) (`effetti`)

- **Dove si legge**: `src/kernel/types.ts (EFFECT_TYPES)`, `src/kernel/validator.ts`, `core.effects (logic.lua)`, `manifest → items[].effects, actions[].effects, spells`, `world/rules.json`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `messaggio` | `message` |
| `bisogni` | `needs` |
| `crea_oggetto` | `create_item` |
| `consuma` | `consume` |
| `distruggi` | `destroy` |
| `apri` | `open` |
| `contenitore` | `container` |
| `terreno` | `terrain` |
| `rilievo` | `relief` |
| `fuoco` | `fire` |
| `luce` | `light` |
| `scudo` | `shield` |
| `spingi` | `push` |
| `evoca` | `summon` |
| `legame` | `bond` |
| `ricordo` | `memory` |
| `nascita` | `birth` |
| `stato` | `state` |
| `togli_stato` | `remove_state` |

<a id="campi-effetti"></a>
### Campi degli effetti (`campi-effetti`)

- **Dove si legge**: `src/kernel/types.ts (Effect)`, `src/kernel/validator.ts`, `core.effects (logic.lua)`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2
- **Nota**: i nomi dei bisogni sono già inglesi nel componente `needs`: l’effetto prende gli stessi

| italiano | interno |
|---|---|
| `tipo` | `type` |
| `fame` | `hunger` |
| `sete` | `thirst` |
| `energia` | `energy` |
| `salute` | `health` |
| `oggetto` | `item` |
| `quantita` | `quantity` |
| `capienza` | `capacity` |
| `bottino` | `loot` |
| `a` | `to` |
| `da` | `from` |
| `raggio` | `radius` |
| `durata` | `duration` |
| `forza` | `force` |
| `modulo` | `module` |
| `legame` | `bond` |
| `testo` | `text` |
| `peso` | `weight` |
| `nome` | `name` |
| `velocita` | `speed` |
| `luce` | `light` |

<a id="categorie"></a>
### Categorie degli oggetti (`categorie`)

- **Dove si legge**: `src/kernel/types.ts (ITEM_CATEGORIES)`, `src/kernel/kernel.ts`, `src/ui/inventory.ts`, `manifest → items[].category`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `cibo` | `food` |
| `bevanda` | `drink` |
| `medicina` | `medicine` |
| `attrezzo` | `tool` |
| `arma` | `weapon` |
| `materiale` | `material` |
| `luce` | `light` |
| `vestiario` | `clothing` |
| `contenitore` | `container` |
| `magia` | `magic` |
| `varie` | `misc` |

<a id="impronte"></a>
### Forme degli oggetti (gli id `forma-…` dei modelli) (`impronte`)

- **Dove si legge**: `src/kernel/modeldirector.ts (ITEM_SHAPES, itemShapeModel)`, `models/index.json`, `manifest → items[].model`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2
- **Nota**: `forma` è il prefisso: `forma-sacco` → `shape-sack`

| italiano | interno |
|---|---|
| `forma` | `shape` |
| `sacco` | `sack` |
| `bottiglia` | `bottle` |
| `vaso` | `jar` |
| `cesto` | `basket` |
| `frutto` | `fruit` |
| `pane` | `bread` |
| `formaggio` | `cheese` |
| `attrezzo` | `tool` |
| `lama` | `blade` |
| `arco` | `bow` |
| `gemma` | `gem` |
| `cristallo` | `crystal` |
| `libro` | `book` |
| `pergamena` | `scroll` |
| `abito` | `garment` |
| `cappello` | `hat` |
| `scarpe` | `shoes` |
| `anello` | `ring` |
| `moneta` | `coin` |
| `erba` | `herb` |
| `fiore` | `flower` |
| `fungo` | `mushroom` |
| `pietra` | `stone` |
| `legna` | `firewood` |
| `carne` | `meat` |
| `pesce` | `fish` |
| `chiave` | `key` |
| `candela` | `candle` |
| `lanterna` | `lantern` |
| `corda` | `rope` |

<a id="terreni"></a>
### Nomi dei terreni del seme (diventano id con l’etichetta italiana) (`terreni`)

- **Dove si legge**: `universe/modules/world.terrain (tiles[].name)`, `src/kernel/validator.ts (tileCode)`, `src/kernel/kernel.ts`, `prompt del Cartografo`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2
- **Nota**: oggi il nome è insieme id e testo; il terreno prende un `id` e il `name` resta il testo del mondo (`world.find_tile` e `matura.in` cercano l’id, poi il nome)

| italiano | interno |
|---|---|
| `prato` | `meadow` |
| `sentiero` | `path` |
| `bosco` | `forest` |
| `acqua` | `water` |
| `roccia` | `rock` |
| `muro` | `wall` |
| `pavimento di legno` | `wooden_floor` |
| `porta` | `door` |
| `campo arato` | `plowed_field` |
| `sabbia` | `sand` |
| `giungla` | `jungle` |
| `mare` | `sea` |
| `montagna` | `mountain` |
| `neve` | `snow` |
| `muro di pietra` | `stone_wall` |
| `muro di mattoni` | `brick_wall` |
| `parete di paglia` | `straw_wall` |
| `staccionata` | `fence` |
| `ponte levatoio` | `drawbridge` |
| `pavimento di pietra` | `stone_floor` |
| `lava` | `lava` |
| `campo seminato` | `sown_field` |
| `grano maturo` | `ripe_wheat` |
| `ceppaia` | `stump` |

<a id="ambienti"></a>
### Ambienti del seme (layout) (`ambienti`)

- **Dove si legge**: `universe/modules/world.layouts (layouts)`, `maps/*.json → layout`, `world/atlas.json → ambiente`, `models/index.json → suono.ambienti`, `src/kernel/stamps.ts`, `src/audio/director.ts`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2
- **Nota**: gli ambienti scritti dal Cartografo negli universi salvati sono contenuto: restano come sono

| italiano | interno |
|---|---|
| `borgo` | `village` |
| `borgo_mattoni` | `brick_village` |
| `bosco` | `woods` |
| `campi` | `fields` |
| `capanne` | `huts` |
| `caserma` | `barracks` |
| `castello` | `castle` |
| `deserto` | `desert` |
| `dungeon` | `dungeon` |
| `fortezza` | `fortress` |
| `giungla` | `jungle` |
| `lago` | `lake` |
| `locanda` | `inn` |
| `maneggio` | `stables` |
| `montagne` | `mountains` |
| `piramide` | `pyramid` |
| `rovine` | `ruins` |
| `tana_drago` | `dragon_lair` |
| `tempio` | `temple` |
| `torre_mago` | `wizard_tower` |

<a id="timbri"></a>
### Timbri delle strutture (`timbri`)

- **Dove si legge**: `src/kernel/stamps.ts (STAMP_SHAPES)`, `prompt del Cartografo`
- **Tocca**: prompt, solo codice · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `casa` | `house` |
| `castello` | `castle` |
| `fortezza` | `fortress` |
| `torre` | `tower` |
| `tempio` | `temple` |
| `piramide` | `pyramid` |
| `capanne` | `huts` |
| `recinto` | `pen` |
| `caserma` | `barracks` |
| `dungeon` | `dungeon` |
| `tana` | `lair` |
| `pozzo` | `well` |

<a id="azioni-seme"></a>
### Azioni del seme (`actions[].id`) e dei programmi (`<action name>`) (`azioni-seme`)

- **Dove si legge**: `universe/modules/*/manifest.json (actions)`, `universe/models/*.xml (<action>)`, `logic.lua (on_act)`, `FormComp.done`
- **Tocca**: disco, Lua · **lingua**: inglese · **task**: T307a, contratto 0.2
- **Nota**: le azioni che il Concilio ha scritto negli universi salvati restano: le legge solo il loro modulo

| italiano | interno |
|---|---|
| `ascolta` | `listen` |
| `attingi` | `draw` |
| `dormi` | `sleep` |
| `fruga` | `search` |
| `moneta` | `coin` |
| `raccogli` | `gather` |
| `apri` | `open` |
| `chiudi` | `close` |

<a id="rune"></a>
### Token delle rune magiche (in latino) (`rune`)

- **Dove si legge**: `universe/modules/magic.runes (runes, spells)`, `universe/world/canone.md`, `src/kernel/magic.ts`, `src/kernel/kernel.ts (STARTER_RUNES)`, `rune:<token> dei frammenti`
- **Tocca**: disco, Lua, prompt · **lingua**: latino · **task**: T307a, contratto 0.2
- **Già usati, da non prendere**: `x`, `y`, `speed`, `carpet`, `time`, `world`, `ecs`, `inventory`, `items`, `input`, `bus`, `ui`, `math`, `string`, `table`, `utf8`, `log`, `hash`, `pairs`, `ipairs`, `pcall`, `print`, `self`, `and`, `or`, `not`, `nil`, `true`, `false`, `end`, `do`, `if`, `then`, `else`, `for`, `in`, `local`, `function`, `return`, `while`, `repeat`, `until`, `break`, `goto`
- **Nota**: le formule seguono i token (`terra fuoco` → `terra ignis`); il nome della runa (Sowilo) e dell’incantesimo (Lume) sono testo del mondo

| italiano | interno |
|---|---|
| `luce` | `lux` |
| `fuoco` | `ignis` |
| `acqua` | `aqua` |
| `terra` | `terra` |
| `vita` | `vita` |
| `scudo` | `scutum` |
| `vento` | `ventus` |

<a id="elementi"></a>
### Elementi delle rune (`element`) (`elementi`)

- **Dove si legge**: `universe/modules/magic.runes (runes[].element)`, `src/kernel/magic.ts (validateNewRune)`, `world/canone.md`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `luce` | `light` |
| `fuoco` | `fire` |
| `acqua` | `water` |
| `terra` | `earth` |
| `vita` | `life` |
| `protezione` | `protection` |
| `aria` | `air` |

<a id="pannelli"></a>
### Elementi dei pannelli (`ui.elementi[].tipo`) (`pannelli`)

- **Dove si legge**: `src/kernel/types.ts (UiElement)`, `src/ui/inventory.ts`, `manifest → ui`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `slot` | `slot` |
| `barra` | `bar` |
| `testo` | `text` |
| `pulsante` | `button` |

<a id="passi-banco"></a>
### Passi e direzioni dei casi del banco (`passi-banco`)

- **Dove si legge**: `src/kernel/types.ts (BenchStep, BenchWay)`, `src/kernel/bench.ts`, `manifest → casi[].passi`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307a, contratto 0.2

| italiano | interno |
|---|---|
| `togli` | `remove` |
| `pulsante` | `button` |
| `attendi` | `wait` |
| `cammina` | `walk` |
| `su` | `up` |
| `giu` | `down` |
| `sinistra` | `left` |
| `destra` | `right` |

<a id="momenti"></a>
### Momenti del giorno (`momenti`)

- **Dove si legge**: `src/kernel/npc/society.ts (DAY_PHASES)`, `world/people.json → routine[].quando`, `world/plots.json → tappe[].momento`, `models/index.json → suono.momenti`, `manifest → mestieri[].giornata (chiavi)`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `mattina` | `morning` |
| `giorno` | `day` |
| `sera` | `evening` |
| `notte` | `night` |

<a id="dove"></a>
### «Dove» della routine (`dove`)

- **Dove si legge**: `src/kernel/npc/society.ts (WHERES)`, `world/people.json → routine[].dove`, `world/plots.json → tappe[].dove`, `manifest → mestieri[].giornata[].dove, percorso`, `componente mestiere (i posti)`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: `impresa` è il posto di un compito di mestiere (il cantiere, T307b); i posti `casella:<codice>` ed `entita:<tag>` restano finché T308a non cambia i campi

| italiano | interno |
|---|---|
| `casa` | `home` |
| `lavoro` | `work` |
| `piazza` | `square` |
| `in giro` | `about` |
| `impresa` | `venture` |

<a id="attivita"></a>
### Attività degli individui (`attivita`)

- **Dove si legge**: `src/kernel/npc/society.ts (ACTIVITIES)`, `world/people.json → routine[].azione`, `componente attivita.tipo`, `src/render/entities.ts`
- **Tocca**: disco, filo, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `dorme` | `sleep` |
| `zappa` | `hoe` |
| `lavora` | `work` |
| `cucina` | `cook` |
| `mangia` | `eat` |
| `prega` | `pray` |
| `commercia` | `trade` |
| `pattuglia` | `patrol` |
| `chiacchiera` | `chat` |
| `legge` | `read` |
| `pesca` | `fish` |
| `taglia_legna` | `chop_wood` |
| `pascola` | `graze` |
| `passeggia` | `stroll` |

<a id="specie"></a>
### Specie e genere (`specie`)

- **Dove si legge**: `src/kernel/npc/society.ts (Species, Gender)`, `world/people.json → specie, genere`, `src/kernel/graph.ts`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `persona` | `person` |
| `animale` | `animal` |
| `maschio` | `male` |
| `femmina` | `female` |

<a id="legami"></a>
### Tipi di legame (solo codice: la parola del legame è testo del mondo) (`legami`)

- **Dove si legge**: `src/kernel/npc/society.ts (KINDS, Between)`
- **Tocca**: solo codice · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: `legame` resta la parola nella lingua del mondo («madre»); T310 aggiunge il tipo come id nello schema

| italiano | interno |
|---|---|
| `genitore` | `parent` |
| `figlio` | `child` |
| `fratello` | `sibling` |
| `coniuge` | `spouse` |
| `fidanzato` | `betrothed` |
| `nonno` | `grandparent` |
| `zio` | `uncle_or_aunt` |
| `nipote` | `grandchild_or_nephew` |
| `cugino` | `cousin` |
| `cognato` | `sibling_in_law` |
| `suocero` | `parent_in_law` |
| `genero` | `child_in_law` |
| `maestro` | `mentor` |
| `apprendista` | `apprentice` |
| `padrone` | `owner` |
| `servo` | `servant` |
| `animale` | `pet` |
| `amico` | `friend` |
| `rivale` | `rival` |
| `vicino` | `neighbor` |
| `collega` | `colleague` |
| `conoscente` | `acquaintance` |
| `stessa` | `same` |
| `persone` | `people` |
| `tutti` | `all` |

<a id="mestieri"></a>
### Mestieri del seme e i loro moduli (`mestieri`)

- **Dove si legge**: `universe/modules/lavoro.* (mestieri[].id)`, `src/kernel/npc/jobs.ts (matchJob)`, `world/people.json → mestiere (via matchJob)`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: il mestiere di un individuo (`mestiere`) è testo del mondo; `matchJob` lo lega all’id

| italiano | interno |
|---|---|
| `boscaiolo` | `woodcutter` |
| `contadino` | `farmer` |
| `cuoco` | `cook` |
| `fabbro` | `smith` |
| `guardia` | `guard` |
| `impiegato` | `clerk` |
| `mercante` | `merchant` |
| `oste` | `innkeeper` |
| `pastore` | `shepherd` |
| `pescatore` | `fisher` |
| `sacerdote` | `priest` |
| `scrivano` | `scribe` |
| `qualunque` | `any` |

<a id="comportamenti"></a>
### Comportamenti dei mestieri (`fa`) (`comportamenti`)

- **Dove si legge**: `src/kernel/npc/jobs.ts (JOB_BEHAVIOURS)`, `universe/modules/sys.lavoro/logic.lua`, `manifest → mestieri[].giornata[].fa`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `vai` | `go` |
| `prendi` | `take` |
| `porta` | `carry` |
| `trasforma` | `transform` |
| `raccogli` | `gather` |
| `produci` | `produce` |
| `usa` | `use` |
| `costruisci` | `build` |
| `pattuglia` | `patrol` |
| `riposa` | `rest` |
| `mangia` | `eat` |
| `prega` | `pray` |
| `chiacchiera` | `chat` |
| `aspetta` | `wait` |

<a id="moduli-seme"></a>
### Id dei moduli del seme che il kernel nomina (`moduli-seme`)

- **Dove si legge**: `universe/modules/<id>/`, `src/kernel/kernel.ts (sys.lavoro)`, `world/people.json → tipo`, `maps/*.json → objects[].module`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: gli id degli oggetti (`item.cristallo-magico`), dei modelli e dei moduli scritti dal Concilio sono contenuto: restano

| italiano | interno |
|---|---|
| `sys.lavoro` | `sys.work` |
| `lavoro.boscaiolo` | `job.woodcutter` |
| `lavoro.contadino` | `job.farmer` |
| `lavoro.cuoco` | `job.cook` |
| `lavoro.fabbro` | `job.smith` |
| `lavoro.guardia` | `job.guard` |
| `lavoro.impiegato` | `job.clerk` |
| `lavoro.mercante` | `job.merchant` |
| `lavoro.oste` | `job.innkeeper` |
| `lavoro.pastore` | `job.shepherd` |
| `lavoro.pescatore` | `job.fisher` |
| `lavoro.sacerdote` | `job.priest` |
| `lavoro.scrivano` | `job.scribe` |
| `item.forbici` | `item.scissors` |
| `obj.banco` | `obj.counter` |
| `obj.cassa` | `obj.chest` |
| `obj.credenza` | `obj.cupboard` |
| `obj.letto` | `obj.bed` |

<a id="imprese"></a>
### Tipi e stati delle imprese (`imprese`)

- **Dove si legge**: `src/kernel/npc/ventures.ts (VENTURE_TYPES, VentureState)`, `world/imprese.json → tipo, stato`, `il pannello del cantiere`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `costruzione` | `construction` |
| `raccolto` | `harvest` |
| `festa` | `feast` |
| `ricerca` | `research` |
| `bonifica` | `reclamation` |
| `viaggio` | `journey` |
| `elezione` | `election` |
| `in corso` | `active` |
| `attesa` | `waiting` |
| `ferma` | `stopped` |
| `finita` | `finished` |

<a id="trame"></a>
### Stati delle trame e delle missioni, tipi di obiettivo (`trame`)

- **Dove si legge**: `src/kernel/npc/plots.ts (Plot, Quest)`, `world/plots.json`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `attiva` | `active` |
| `chiusa` | `closed` |
| `offerta` | `offered` |
| `accettata` | `accepted` |
| `compiuta` | `completed` |
| `porta` | `bring` |
| `vai` | `go` |
| `parla` | `talk` |

<a id="suoni"></a>
### Usi dei suoni e nomi degli effetti sonori (`suoni`)

- **Dove si legge**: `src/mj/sound.ts (SoundPurpose)`, `src/audio/director.ts (SOUND_CUES)`, `models/index.json → suono.uso, suono.effetti`, `prompt del Musicista`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: gli id dei programmi sonori del seme (`suono-musica-pietra`) seguono: `sound-music-stone`; quelli del Musicista negli universi salvati restano

| italiano | interno |
|---|---|
| `musica` | `music` |
| `effetto` | `effect` |
| `runa` | `rune` |
| `oggetto` | `item` |
| `arpeggio` | `arpeggio` |
| `incantesimo` | `spell` |
| `guasto` | `fault` |
| `ritorno` | `rollback` |
| `soglia` | `threshold` |
| `salto` | `jump` |
| `morte` | `death` |
| `oltre` | `beyond` |

<a id="parti"></a>
### Parti dei modelli (`part`) e viste delle foto (`parti`)

- **Dove si legge**: `src/mj/engine.ts (PARTS)`, `src/mj/rig.ts`, `universe/models/*.xml (part=)`, `src/mj/photo.ts (VIEWS)`, `prompt dell’Artista`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `gamba` | `leg` |
| `braccio` | `arm` |
| `testa` | `head` |
| `coda` | `tail` |
| `fronte` | `front` |
| `destra` | `right` |
| `retro` | `back` |
| `sinistra` | `left` |

<a id="agenti"></a>
### Agenti del Concilio (`AgentId`) (`agenti`)

- **Dove si legge**: `src/kernel/agents/council.ts (AgentId)`, `prompts/agents/<agente>.md`, `world/consumi.json`, `universe.json → ai.agenti`, `models corona-gerboa-<agente>`
- **Tocca**: disco, filo, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `narratore` | `narrator` |
| `cartografo` | `cartographer` |
| `artista` | `artist` |
| `scultore` | `sculptor` |
| `fisico` | `physicist` |
| `ingegnere` | `engineer` |
| `arbitro` | `arbiter` |
| `referente` | `liaison` |
| `attore` | `actor` |
| `musicista` | `musician` |

<a id="classi-scultore"></a>
### Classi dello Scultore (`ai.scultori`) (`classi-scultore`)

- **Dove si legge**: `src/kernel/universe.ts (SCULPTOR_CLASSES)`, `universe.json → ai.scultori, ai.minimi.scultori`, `src/ui/lobby.ts`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `semplice` | `simple` |
| `figura` | `figure` |
| `struttura` | `structure` |
| `importante` | `important` |
| `artista` | `artist` |
| `musicista` | `musician` |

<a id="coefficienti"></a>
### Coefficienti di generazione (`coefficienti`)

- **Dove si legge**: `src/kernel/coefficients.ts (COEFFICIENT_KEYS)`, `universe.json → ai.coefficienti (chiavi)`, `src/ui/lobby.ts`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `sessioni` | `sessions` |
| `dialoghi` | `dialogues` |
| `trame` | `plots` |
| `revisioni` | `reviews` |
| `modelli` | `models` |
| `persone` | `people` |
| `abitanti` | `inhabitants` |
| `pacchetti` | `packs` |
| `cose` | `entities` |
| `brani` | `pieces` |
| `luoghi` | `chunks` |
| `parole` | `words` |
| `sguardi` | `looks` |
| `azioni` | `actions` |
| `magia` | `magic` |
| `morte` | `death` |
| `riparazioni` | `repairs` |
| `studio` | `studio` |
| `vite` | `lives` |

<a id="carte"></a>
### Tipi delle carte e dei nodi del grafo (`carte`)

- **Dove si legge**: `src/kernel/cards.ts (CardKind)`, `src/kernel/graph.ts (NodeType)`, `world/carte.json`, `world/grafo.json`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `modulo` | `module` |
| `oggetto` | `item` |
| `ambiente` | `environment` |
| `incantesimo` | `spell` |
| `runa` | `rune` |
| `ricetta` | `recipe` |
| `modello` | `model` |
| `luogo` | `chunk` |
| `persona` | `individual` |
| `trama` | `plot` |
| `regola` | `rule` |
| `tipo` | `kind` |
| `regione` | `region` |
| `struttura` | `structure` |
| `fatto` | `fact` |

<a id="partita"></a>
### Modalità della partita, esiti delle mancanze (`partita`)

- **Dove si legge**: `src/kernel/types.ts (GameSetup.modalita)`, `universe.json → partita.modalita`, `src/kernel/shortfalls.ts (ShortfallOutcome)`, `world/mancanze.json`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: l’id del viandante della partita singola (`io`) passa con T308a (dominio `viandante-solo`): è il nome di un file dei viandanti e la chiave dei saldi fuori dall’universo

| italiano | interno |
|---|---|
| `singola` | `single` |
| `multigiocatore` | `multiplayer` |
| `rifiuto` | `refusal` |
| `invalido` | `invalid` |
| `errore` | `error` |
| `guasto` | `fault` |

<a id="solo-codice"></a>
### Valori che solo il TypeScript confronta (`solo-codice`)

- **Dove si legge**: `src/kernel/corona.ts (ItemKind, ShowcaseSource, ShowcaseDevice, FileLook)`, `src/kernel/chain.ts (StationKind)`, `src/kernel/screens.ts (ScreenField, AlertLevel)`, `src/kernel/situation.ts (OperationKind)`, `src/kernel/bible.ts (BibleSection)`, `src/mj/trace.ts (TraceForm)`, `src/kernel/placing.ts (SpotFailure)`, `src/mj/soundanalysis.ts (SOUND_DEFECTS)`
- **Tocca**: solo codice · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Già usati, da non prendere**: `file`, `sprite`, `tile`, `layout`, `screen`, `up`, `down`, `exit`, `desk`, `portal`, `table`, `atlas`, `showcase`, `prev`, `next`, `less`, `more`, `console`, `silos`
- **Nota**: `screen` c’è già (`ItemKind`): il dispositivo `schermo` diventa `display`

| italiano | interno |
|---|---|
| `grafo` | `graph` |
| `situazione` | `situation` |
| `parete` | `wall` |
| `stazione` | `station` |
| `banco` | `bench` |
| `leggio` | `lectern` |
| `lastra` | `slab` |
| `tornio` | `lathe` |
| `rune` | `runes` |
| `persone` | `people` |
| `cose` | `entities` |
| `oggetti` | `items` |
| `luoghi` | `chunks` |
| `schermo` | `display` |
| `stampante` | `printer` |
| `plastico` | `diorama` |
| `libro` | `book` |
| `cristallo` | `crystal` |
| `pergamena` | `scroll` |
| `tavoletta` | `tablet` |
| `nucleo` | `core` |
| `sistema` | `system` |
| `meccanica` | `mechanic` |
| `tempo` | `time` |
| `registro` | `feed` |
| `costi` | `costs` |
| `verde` | `green` |
| `ambra` | `amber` |
| `rossa` | `red` |
| `viandante` | `wanderer` |
| `giocatore` | `player` |
| `luogo` | `chunk` |
| `trama` | `plot` |
| `missione` | `quest` |
| `prologo` | `prologue` |
| `personaggi` | `characters` |
| `fatti` | `facts` |
| `misteri` | `mysteries` |
| `nodi` | `nodes` |
| `sezioni` | `sections` |
| `differenze` | `diffs` |
| `scatole` | `boxes` |
| `nessun-piano` | `no-shelf` |
| `alto` | `high` |
| `lontano` | `far` |
| `pieno` | `full` |
| `occupato` | `taken` |
| `vuoto` | `empty` |
| `piatto` | `flat` |
| `ripetitivo` | `repetitive` |
| `stonato` | `off_key` |
| `fuori volume` | `off_volume` |
| `giuntura` | `seam` |

<a id="esiti-lavoro"></a>
### Esiti dei compiti di `sys.work` e i loro motivi (`esiti-lavoro`)

- **Dove si legge**: `universe/modules/sys.work/logic.lua (B.*, M.update)`, `componente lavoro.motivo`
- **Tocca**: Lua · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: un esito è `done`, `ongoing` o `failed:<motivo>` (`failed:missing:item.grano`); lo legge solo il Lua del seme, e il motivo resta nel componente `lavoro` (T314)

| italiano | interno |
|---|---|
| `finito` | `done` |
| `continua` | `ongoing` |
| `fallito` | `failed` |
| `nessuna via` | `no_way` |
| `non ci arriva` | `unreachable` |
| `comportamento sconosciuto` | `unknown_behaviour` |
| `nessun posto` | `no_place` |
| `manca` | `missing` |
| `il deposito è pieno` | `deposit_full` |
| `nessuna cosa da usare` | `nothing_to_use` |

<a id="suoni-seme"></a>
### Id dei programmi sonori del seme (`suoni-seme`)

- **Dove si legge**: `universe/models/suono-*.xml`, `models/index.json`, `src/kernel/agents/composer.ts (EXAMPLES)`, `tests/fixtures/mj-engine-hashes.json`
- **Tocca**: disco · **lingua**: inglese · **task**: T307b, contratto 0.3
- **Nota**: i programmi sonori che il Musicista ha scritto negli universi salvati restano; i suoi nuovi nascono `sound-<uso>-<nome>`. La classe `suono` dell’indice resta (T308a)

| italiano | interno |
|---|---|
| `suono-architettura-frattale` | `sound-fractal-architecture` |
| `suono-effetto-allarme-sirena` | `sound-effect-siren-alarm` |
| `suono-effetto-arpeggio` | `sound-effect-arpeggio` |
| `suono-effetto-cristallo-risonante` | `sound-effect-resonant-crystal` |
| `suono-effetto-cura-benedizione` | `sound-effect-healing-blessing` |
| `suono-effetto-dialogo-saluto` | `sound-effect-greeting` |
| `suono-effetto-esplosione-crollo` | `sound-effect-explosion-collapse` |
| `suono-effetto-forgia-martello` | `sound-effect-forge-hammer` |
| `suono-effetto-fuoco-scoppiettante` | `sound-effect-crackling-fire` |
| `suono-effetto-guasto` | `sound-effect-fault` |
| `suono-effetto-incantesimo` | `sound-effect-spell` |
| `suono-effetto-meccanismo-leva` | `sound-effect-lever-mechanism` |
| `suono-effetto-moneta-scambio` | `sound-effect-coin-trade` |
| `suono-effetto-morte` | `sound-effect-death` |
| `suono-effetto-morte-v2` | `sound-effect-death-v2` |
| `suono-effetto-oggetto` | `sound-effect-item` |
| `suono-effetto-passo-acqua` | `sound-effect-water-step` |
| `suono-effetto-passo-metallo` | `sound-effect-metal-step` |
| `suono-effetto-porta-pesante` | `sound-effect-heavy-door` |
| `suono-effetto-ritorno` | `sound-effect-rollback` |
| `suono-effetto-runa` | `sound-effect-rune` |
| `suono-effetto-salita-livello` | `sound-effect-level-up` |
| `suono-effetto-salto` | `sound-effect-jump` |
| `suono-effetto-scarica-elettrica` | `sound-effect-electric-discharge` |
| `suono-effetto-scoperta-segreto` | `sound-effect-secret-found` |
| `suono-effetto-soglia` | `sound-effect-threshold` |
| `suono-effetto-teletrasporto` | `sound-effect-teleport` |
| `suono-effetto-vapore-pressione` | `sound-effect-steam-pressure` |
| `suono-effetto-veleno-danno` | `sound-effect-poison-damage` |
| `suono-effetto-vento-alta-quota` | `sound-effect-high-wind` |
| `suono-fantasy-citta-locanda` | `sound-fantasy-town-inn` |
| `suono-fantasy-esplorazione-giorno` | `sound-fantasy-exploration-day` |
| `suono-fantasy-esplorazione-notte` | `sound-fantasy-exploration-night` |
| `suono-fantasy-luogo-sacro` | `sound-fantasy-sacred-place` |
| `suono-fantasy-sotterraneo-abisso` | `sound-fantasy-abyss-dungeon` |
| `suono-fantasy-tensione-pericolo` | `sound-fantasy-danger-tension` |
| `suono-fuga-cellulare` | `sound-cellular-fugue` |
| `suono-musica-notte` | `sound-music-night` |
| `suono-musica-oltre` | `sound-music-beyond` |
| `suono-musica-pastorale` | `sound-music-pastoral` |
| `suono-musica-pietra` | `sound-music-stone` |
| `suono-musica-profondo` | `sound-music-deep` |
| `suono-musica-selva` | `sound-music-woods` |
| `suono-musica-tramonto` | `sound-music-sunset` |
| `suono-scontro-finale` | `sound-final-battle` |
| `suono-sentiero-melodico` | `sound-melodic-path` |

<a id="viandante-solo"></a>
### L’id del viandante della partita singola (`viandante-solo`)

- **Dove si legge**: `src/kernel/wanderers.ts (SOLO)`, `world/giocatori/io.json`, `universe.json → partita.master`, `carta → autore, pagante, titolare`, `universes/.saldi/<nome>.json`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: spostato da T307b (che aveva `io` fra le modalità): cambia con i percorsi dei viandanti (`world/giocatori/` → `world/players/`) e con le cartelle dei saldi, che T308a porta insieme leggendo anche il nome vecchio

| italiano | interno |
|---|---|
| `io` | `me` |

<a id="campi-universe"></a>
### Campi di `universe.json` (`campi-universe`)

- **Dove si legge**: `src/kernel/types.ts (UniverseConfig, AiConfig, GameSetup)`, `src/kernel/coefficients.ts (ActorConfig)`, `src/kernel/heritage.ts`, `src/session/files.ts (UNIVERSE_FIELDS)`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `partita` | `game` |
| `modalita` | `mode` |
| `morte` | `death` |
| `altroTraGiocatori` | `freeActionsBetweenPlayers` |
| `rilievo` | `relief` |
| `mare` | `sea` |
| `eredita` | `heritage` |
| `copia` | `copy` |
| `scultori` | `sculptors` |
| `agenti` | `agents` |
| `coefficienti` | `coefficients` |
| `minimi` | `minimums` |
| `tetto` | `cap` |
| `attore` | `actor` |
| `acceso` | `on` |
| `modello` | `model` |
| `maxBrani` | `maxPieces` |

<a id="campi-manifest"></a>
### Campi dei manifest (aspetto, terreni, pannelli, casi, mestieri) (`campi-manifest`)

- **Dove si legge**: `src/kernel/types.ts (Manifest, Appearance, TerrainDef, UiPanel, BenchCase)`, `src/kernel/npc/jobs.ts (JobProgram, JobTask)`, `src/kernel/validator.ts`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: `posto` è la tasca di un oggetto di prova nei casi e il posto di lavoro nei mestieri (`workplace`): i due stanno in oggetti diversi; qui la tasca

| italiano | interno |
|---|---|
| `aspetto` | `look` |
| `classe` | `class` |
| `taglia` | `size` |
| `matura` | `ripens` |
| `dopo` | `after` |
| `titolo` | `title` |
| `descrizione` | `description` |
| `elementi` | `elements` |
| `tipo` | `type` |
| `etichetta` | `label` |
| `accetta` | `accepts` |
| `campo` | `field` |
| `colore` | `color` |
| `casi` | `cases` |
| `racconto` | `story` |
| `terreno` | `terrain` |
| `viandante` | `wanderer` |
| `componenti` | `components` |
| `oggetti` | `items` |
| `cose` | `entities` |
| `modulo` | `module` |
| `passi` | `steps` |
| `durata` | `duration` |
| `guarda` | `watch` |
| `righe` | `lines` |
| `nome` | `name` |
| `posto` | `slot` |
| `categoria` | `category` |
| `secondi` | `seconds` |
| `verso` | `toward` |
| `oggetto` | `item` |
| `azione` | `action` |
| `mestieri` | `jobs` |
| `nomi` | `names` |
| `giornata` | `day` |
| `fa` | `does` |
| `dove` | `where` |
| `da` | `from` |
| `a` | `to` |
| `casella` | `tile` |
| `lascia` | `drop` |
| `con` | `with` |
| `quante` | `count` |
| `posa` | `pose` |
| `dice` | `says` |
| `percorso` | `route` |
| `persona` | `persona` |
| `entita` | `entity` |

<a id="campi-mestieri"></a>
### Campi dei programmi di mestiere che cambiano senso (`campi-mestieri`)

- **Dove si legge**: `src/kernel/npc/jobs.ts (JobProgram.posto)`
- **Tocca**: disco, Lua · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: l’`azione` di un compito è l’id di un’azione della cosa, `action` come nei casi (`campi-manifest`); la `posa` è l’attività

| italiano | interno |
|---|---|
| `posto` | `workplace` |

<a id="campi-regole"></a>
### Campi di `world/rules.json` (`campi-regole`)

- **Dove si legge**: `src/kernel/types.ts (Rule)`, `src/kernel/kernel.ts`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `regole` | `rules` |
| `chiave` | `key` |
| `testo` | `text` |
| `possibile` | `possible` |
| `racconto` | `story` |
| `effetti` | `effects` |
| `carta` | `card` |

<a id="campi-persone"></a>
### Campi di `world/people.json` (`campi-persone`)

- **Dove si legge**: `src/kernel/npc/society.ts (People, Individual, Relation, RoutineStep, Memory, IndividualSheet)`, `src/kernel/agents/minds.ts`
- **Tocca**: disco, filo, prompt · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `persone` | `people` |
| `attesi` | `expected` |
| `di` | `of` |
| `nome` | `name` |
| `legame` | `bond` |
| `specie` | `species` |
| `genere` | `gender` |
| `tipo` | `kind` |
| `mestiere` | `job` |
| `eta` | `age` |
| `famiglia` | `family` |
| `storia` | `story` |
| `luogo` | `place` |
| `origine` | `origin` |
| `persona` | `persona` |
| `aspetto` | `look` |
| `porta` | `carries` |
| `indossa` | `wears` |
| `ricordi` | `memories` |
| `legameViandante` | `wandererBond` |
| `scheda` | `sheet` |
| `testo` | `text` |
| `impronta` | `fingerprint` |
| `viandante` | `wanderer` |
| `quando` | `when` |
| `fa` | `does` |
| `dove` | `where` |
| `azione` | `activity` |
| `con` | `with` |
| `peso` | `weight` |

<a id="campi-trame"></a>
### Campi di `world/plots.json` (`campi-trame`)

- **Dove si legge**: `src/kernel/npc/plots.ts (Plot, Beat, Quest)`
- **Tocca**: disco, filo, prompt · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `titolo` | `title` |
| `mistero` | `mystery` |
| `coinvolti` | `involved` |
| `tappe` | `beats` |
| `missione` | `quest` |
| `inizio` | `start` |
| `stato` | `state` |
| `giorno` | `day` |
| `momento` | `moment` |
| `chi` | `who` |
| `dove` | `where` |
| `cosa` | `what` |
| `battuta` | `line` |
| `indizio` | `clue` |
| `fatto` | `done` |
| `da` | `from` |
| `testo` | `text` |
| `obiettivo` | `goal` |
| `ricompensa` | `reward` |
| `viandante` | `wanderer` |
| `tipo` | `type` |
| `oggetto` | `item` |
| `a` | `to` |
| `luogo` | `place` |
| `trame` | `plots` |

<a id="campi-bibbia"></a>
### Campi di `world/bible.json` (`campi-bibbia`)

- **Dove si legge**: `src/kernel/agents/council.ts (Bible, readBible)`, `src/kernel/bible.ts`
- **Tocca**: disco, filo, prompt · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: `crepe` è delle bibbie vecchie (ADR-0025): la migrazione lo toglie

| italiano | interno |
|---|---|
| `titolo` | `title` |
| `tono` | `tone` |
| `sintesi` | `summary` |
| `storia` | `history` |
| `luoghi` | `places` |
| `personaggi` | `characters` |
| `fatti` | `facts` |
| `misteri` | `mysteries` |
| `usanze` | `customs` |
| `crepe` | `cracks` |

<a id="campi-atlante"></a>
### Campi di `world/atlas.json` (`campi-atlante`)

- **Dove si legge**: `src/kernel/atlas.ts (Atlas, Region)`
- **Tocca**: disco, filo, prompt · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `regioni` | `regions` |
| `nome` | `name` |
| `descrizione` | `description` |
| `ambiente` | `environment` |
| `centro` | `center` |
| `raggio` | `radius` |

<a id="campi-stato"></a>
### Campi di `world/stato.json` (`campi-stato`)

- **Dove si legge**: `src/kernel/kernel.ts (STATE_FIELDS)`, `src/kernel/placing.ts (PlacedRecord)`
- **Tocca**: disco · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: `importanti` e `viandante` sono di prima di T245a: la migrazione li porta in `rari` e in `world/players/me.json`

| italiano | interno |
|---|---|
| `consumati` | `consumed` |
| `contenitori` | `containers` |
| `forme` | `forms` |
| `rari` | `rares` |
| `ora` | `time` |
| `importanti` | `important` |
| `viandante` | `wanderer` |
| `posati` | `placed` |

<a id="campi-viandante"></a>
### Campi di `world/giocatori/<id>.json` (`campi-viandante`)

- **Dove si legge**: `src/kernel/kernel.ts (WANDERER_FIELDS)`, `src/kernel/wanderers.ts (WandererState, Profile)`, `src/session/files.ts (playerFiles)`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: `crediti` non si scrive più (ADR-0104): la migrazione lo toglie; l’id del viandante solo `io` diventa `me`

| italiano | interno |
|---|---|
| `nome` | `name` |
| `profilo` | `profile` |
| `seme` | `seed` |
| `tinta` | `tint` |
| `presentazione` | `introduction` |
| `stati` | `states` |
| `trasceso` | `transcended` |
| `anonimo` | `anonymous` |
| `crediti` | `credits` |

<a id="campi-imprese"></a>
### Campi di `world/imprese.json` (`campi-imprese`)

- **Dove si legge**: `src/kernel/npc/ventures.ts (Venture, VenturePhase, VentureRole, VentureMember, VentureTask)`
- **Tocca**: disco, Lua, filo · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `imprese` | `ventures` |
| `titolo` | `title` |
| `tipo` | `type` |
| `stato` | `state` |
| `luogo` | `chunk` |
| `posto` | `spot` |
| `lotto` | `lot` |
| `origine` | `origin` |
| `modello` | `model` |
| `concetto` | `concept` |
| `classe` | `class` |
| `taglia` | `size` |
| `seme` | `seed` |
| `fasi` | `phases` |
| `nome` | `name` |
| `materiali` | `materials` |
| `lavoro` | `work` |
| `stadio` | `stage` |
| `ruoli` | `roles` |
| `ruolo` | `role` |
| `mestiere` | `job` |
| `quanti` | `count` |
| `portati` | `brought` |
| `lavorato` | `worked` |
| `squadra` | `team` |
| `inizio` | `start` |
| `ultimo` | `last` |
| `fine` | `end` |
| `scade` | `expires` |
| `compito` | `task` |
| `casella` | `tile` |
| `oggetto` | `item` |
| `lascia` | `drop` |
| `durata` | `duration` |
| `posa` | `pose` |
| `nato_da` | `born_from` |
| `carta` | `card` |

<a id="campi-carte"></a>
### Campi delle carte, dei consumi e delle mancanze (`campi-carte`)

- **Dove si legge**: `src/kernel/cards.ts (CardStamp, CardsFile, Received)`, `src/kernel/heritage.ts (CardOrigin)`, `src/kernel/ai/usage.ts (UsageFile, CallRecord)`, `src/kernel/shortfalls.ts (ShortfallNote)`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: `carta` sta in quasi ogni file del Concilio (piani, regole, trame, imprese): la migrazione lo cambia ovunque. `nome` è delle carte dei luoghi, `voci`, `volte`, `primo` e `ultimo` di `world/shortfalls.json`

| italiano | interno |
|---|---|
| `carta` | `card` |
| `autore` | `author` |
| `pagante` | `payer` |
| `titolare` | `holder` |
| `origini` | `origins` |
| `universo` | `universe` |
| `impronta` | `fingerprint` |
| `utilizzi` | `uses` |
| `luoghi` | `chunks` |
| `trame` | `plots` |
| `allaNascita` | `atBirth` |
| `quota` | `share` |
| `ricevuto` | `received` |
| `prezzi` | `prices` |
| `giorni` | `days` |
| `paganti` | `payers` |
| `chi` | `who` |
| `richiesta` | `request` |
| `agente` | `agent` |
| `compito` | `task` |
| `esito` | `outcome` |
| `motivo` | `reason` |
| `nome` | `name` |
| `voci` | `entries` |
| `volte` | `times` |
| `primo` | `first` |
| `ultimo` | `last` |

<a id="campi-piani"></a>
### Campi dei piani dei luoghi (`maps/*.json`) (`campi-piani`)

- **Dove si legge**: `src/kernel/agents/cartography.ts (ChunkPlan, PlannedHouse)`, `src/kernel/chunks.ts`, `src/session/protocol.ts (ChunkView)`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `strutture` | `structures` |
| `concetto` | `concept` |
| `taglia` | `size` |
| `giorni` | `days` |
| `stadi` | `stages` |
| `case` | `houses` |
| `origine` | `origin` |
| `modello` | `model` |
| `seme` | `seed` |
| `classe` | `class` |
| `stadio` | `stage` |
| `visto` | `seen` |
| `scavi` | `digs` |
| `acqua` | `water` |
| `carta` | `card` |

<a id="campi-modelli"></a>
### Campi di `models/index.json` e attributi dei programmi (`campi-modelli`)

- **Dove si legge**: `src/kernel/forms.ts (ModelInfo)`, `src/mj/sound.ts (SoundPurpose)`, `src/mj/model.ts (suolo)`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Già usati, da non prendere**: `ground`
- **Nota**: `suolo="E"` è un attributo degli XML (ADR-0135); `ground` c’è già (il primo strato di MarkovJunior): diventa `soil`, come nel codice

| italiano | interno |
|---|---|
| `classe` | `class` |
| `taglia` | `size` |
| `nome` | `name` |
| `autore` | `author` |
| `voto` | `score` |
| `tinta` | `tint` |
| `tempo` | `time` |
| `sotto` | `cellar` |
| `consigli` | `advice` |
| `problemi` | `problems` |
| `suono` | `sound` |
| `uso` | `use` |
| `ambienti` | `environments` |
| `momenti` | `moments` |
| `oltre` | `beyond` |
| `effetti` | `effects` |
| `suolo` | `soil` |

<a id="percorsi"></a>
### Percorsi dell’universo e del server (`percorsi`)

- **Dove si legge**: `src/kernel/paths.ts (allowedPath, councilMayWrite)`, `src/session/files.ts`, `src/kernel/*.ts (le costanti dei file)`, `server/*.ts`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4
- **Nota**: `prompts/agents/<agente>.md` segue gli id degli agenti (T307b); `quine:fila:` è la chiave di `localStorage` (T265), letta anche col nome vecchio

| italiano | interno |
|---|---|
| `world/giocatori/` | `world/players/` |
| `world/imprese.json` | `world/ventures.json` |
| `world/magazzino/` | `world/stores/` |
| `world/stato.json` | `world/state.json` |
| `world/consumi.json` | `world/usage.json` |
| `world/mancanze.json` | `world/shortfalls.json` |
| `world/carte.json` | `world/cards.json` |
| `world/grafo.json` | `world/graph.json` |
| `world/canone.md` | `world/canon.md` |
| `world/lessico.md` | `world/lexicon.md` |
| `universes/.cestino/` | `universes/.trash/` |
| `universes/.saldi/` | `universes/.balances/` |
| `universes/.coda/` | `universes/.queue/` |
| `universes/.accesi/` | `universes/.running/` |
| `universes/.generazione/` | `universes/.generation/` |
| `universes/.spesa-gemini.json` | `universes/.gemini-spend.json` |
| `quine:fila:` | `quine:owed:` |

<a id="messaggi"></a>
### Messaggi del protocollo (`t`) (`messaggi`)

- **Dove si legge**: `src/session/protocol.ts (ClientMsg, ServerMsg)`, `src/session/server.ts (LIMITS)`, `src/session/thin.ts`, `src/session/client.ts`
- **Tocca**: filo · **lingua**: inglese · **task**: T308b, contratto 0.5
- **Nota**: `card` (T296, ADR-0172: il master toglie una carta portata) nasce inglese; `carta` è solo la parola del concetto, nessun client l’ha mandata

| italiano | interno |
|---|---|
| `entra` | `join` |
| `profilo` | `profile` |
| `passo` | `step` |
| `tasti` | `keys` |
| `frase` | `phrase` |
| `incidi` | `inscribe` |
| `pronuncia` | `cast` |
| `azione` | `action` |
| `altro` | `other` |
| `chat` | `chat` |
| `dici` | `say` |
| `dai` | `give` |
| `oggetto` | `item` |
| `contenitore` | `container` |
| `fabbrica` | `craft` |
| `pannello` | `panel` |
| `casella` | `tile` |
| `ramo` | `branch` |
| `pubblica` | `publish` |
| `segui` | `follow` |
| `agente` | `agent` |
| `ricarica` | `recharge` |
| `ingresso` | `welcome` |
| `aggiorna` | `update` |
| `correzione` | `correction` |
| `esito` | `result` |
| `rifiuto` | `refusal` |
| `mondo` | `world` |
| `concilio` | `council` |
| `file` | `file` |
| `carta` | `card` |

<a id="valori-filo"></a>
### Operazioni e stati sul filo (`valori-filo`)

- **Dove si legge**: `src/session/protocol.ts (ItemOp, contenitore.op, pannello.op, mondo.stato, Notice)`
- **Tocca**: filo · **lingua**: inglese · **task**: T308b, contratto 0.5

| italiano | interno |
|---|---|
| `usa` | `use` |
| `impugna` | `wield` |
| `posa` | `put_down` |
| `sposta` | `move` |
| `in_borsa` | `to_bag` |
| `da_borsa` | `from_bag` |
| `azione` | `action` |
| `apri` | `open` |
| `prendi` | `take` |
| `metti` | `put` |
| `togli` | `remove` |
| `pulsante` | `button` |
| `fermo` | `stopped` |
| `ripreso` | `resumed` |
| `ripartito` | `restarted` |
| `dici` | `say` |
| `dai` | `give` |
| `altro` | `other` |
| `morte` | `death` |
| `crediti` | `credits` |
| `qui` | `here` |
| `piazza` | `square` |
| `finiti` | `exhausted` |
| `tetto` | `cap` |

<a id="campi-filo"></a>
### Campi dei messaggi (`campi-filo`)

- **Dove si legge**: `src/session/protocol.ts`, `src/session/files.ts`, `src/session/thin.ts`
- **Tocca**: filo · **lingua**: inglese · **task**: T308b, contratto 0.5
- **Nota**: `posto` (il posto di un pannello) diventa `socket` perché nello stesso messaggio c’è già `slot` (la tasca)

| italiano | interno |
|---|---|
| `ora` | `time` |
| `stati` | `states` |
| `crediti` | `credits` |
| `campi` | `fields` |
| `nome` | `name` |
| `descrizione` | `description` |
| `lotti` | `lots` |
| `mare` | `sea` |
| `scavi` | `digs` |
| `acqua` | `water` |
| `testo` | `text` |
| `presentazione` | `introduction` |
| `profilo` | `profile` |
| `tetto` | `cap` |
| `regolazioni` | `settings` |
| `tenuti` | `held` |
| `entita` | `entity` |
| `azione` | `action` |
| `viandante` | `wanderer` |
| `quanti` | `count` |
| `verso` | `toward` |
| `borsa` | `bag` |
| `ricetta` | `recipe` |
| `unisci` | `combine` |
| `pannello` | `panel` |
| `posto` | `socket` |
| `agente` | `agent` |
| `riparato` | `repaired` |
| `riparati` | `repaired` |
| `motivo` | `reason` |
| `anonimo` | `anonymous` |
| `commissione` | `fee` |
| `concilio` | `council` |
| `ramo` | `branch` |
| `forma` | `form` |
| `stato` | `state` |
| `luoghi` | `chunks` |
| `cose` | `entities` |
| `viandanti` | `wanderers` |
| `giocatori` | `players` |
| `via` | `gone` |
| `partiti` | `departed` |
| `avvisi` | `notices` |
| `fatto` | `done` |
| `messaggi` | `messages` |
| `dialoghi` | `dialogues` |
| `contenitore` | `container` |
| `voci` | `entries` |
| `apri` | `open` |
| `tipo` | `type` |
| `da` | `from` |
| `perso` | `lost` |
| `dove` | `where` |

<a id="componenti"></a>
### Componenti visibili a Lua (`componenti`)

- **Dove si legge**: `src/session/protocol.ts (ENTITY_PARTS)`, `src/kernel/kernel.ts`, `src/render/entities.ts`, `logic.lua (ecs.get/set/each)`, `prompt dell’Ingegnere`
- **Tocca**: disco, filo, Lua, prompt · **lingua**: inglese · **task**: T308b, contratto 0.5
- **Già usati, da non prendere**: `pos`, `form`, `identity`, `pickup`, `module`, `origin`, `inventory`, `container`, `body`, `mind`, `chunk`, `rune`, `glyph`, `player`, `remote`, `needs`, `slots`, `wander`, `carpet`, `interact`, `hand`

| italiano | interno |
|---|---|
| `luce` | `light` |
| `fuoco` | `fire` |
| `effimero` | `ephemeral` |
| `scudo` | `shield` |
| `meta` | `goal` |
| `stati` | `states` |
| `attivita` | `activity` |
| `posato` | `placed` |
| `struttura` | `structure` |
| `salto` | `jump` |
| `lavoro` | `work` |
| `carico` | `load` |
| `mestiere` | `job` |
| `cantiere` | `worksite` |
| `raccolto` | `harvested` |
| `frugato` | `searched` |

<a id="campi-componenti"></a>
### Campi dei componenti (`campi-componenti`)

- **Dove si legge**: `src/kernel/kernel.ts`, `universe/modules/*/logic.lua`, `src/render/entities.ts`
- **Tocca**: filo, Lua, prompt · **lingua**: inglese · **task**: T308b, contratto 0.5
- **Già usati, da non prendere**: `and`, `break`, `do`, `else`, `elseif`, `end`, `false`, `for`, `function`, `goto`, `if`, `in`, `local`, `nil`, `not`, `or`, `repeat`, `return`, `then`, `true`, `until`, `while`
- **Nota**: per componente: `luce {raggio, accesa, colore, daStato}`, `fuoco {raggio}`, `effimero {fino}`, `scudo {fino, spento}`, ogni stato di `stati {velocita, peso, luce, fino}`, `attivita {tipo, ferma}`, `struttura {concetto, classe, taglia, stadio}`, `salto {da, a, alto}`, `lavoro {fase, giorno, impresa, passo, motivo, fino}`, `mestiere {fase, giorno, luogo, compiti, impresa, impresa_posto}` (i compiti con i campi dei programmi dei mestieri), `cantiere {titolo, fase, stato, manca, squadra}`, `raccolto` e `frugato {si}`, `player {passo}`, `needs {morto}`; `fame` e `sete` sono i campi dell’evento `death`. `fino` diventa `expires` e non `until`, parola riservata di Lua. Lo stato privato di `sys.work` nel suo `lavoro` (`fatti`, `tappa`, `arrivato`…) lo legge solo il suo Lua e resta

| italiano | interno |
|---|---|
| `raggio` | `radius` |
| `accesa` | `lit` |
| `colore` | `color` |
| `daStato` | `fromState` |
| `fino` | `expires` |
| `spento` | `off` |
| `tipo` | `kind` |
| `ferma` | `still` |
| `stadio` | `stage` |
| `fase` | `phase` |
| `giorno` | `day` |
| `impresa` | `venture` |
| `passo` | `step` |
| `motivo` | `reason` |
| `si` | `yes` |
| `luogo` | `chunk` |
| `compiti` | `tasks` |
| `impresa_posto` | `venture_spot` |
| `concetto` | `concept` |
| `classe` | `class` |
| `taglia` | `size` |
| `velocita` | `speed` |
| `peso` | `weight` |
| `luce` | `light` |
| `da` | `from` |
| `a` | `to` |
| `alto` | `peak` |
| `titolo` | `title` |
| `stato` | `state` |
| `manca` | `missing` |
| `squadra` | `team` |
| `fame` | `hunger` |
| `sete` | `thirst` |
| `morto` | `dead` |

<a id="api-lua"></a>
### Nomi dell’API Lua, eventi del bus, chiavi del magazzino (`api-lua`)

- **Dove si legge**: `src/kernel/validator.ts (LUA_API)`, `src/kernel/sandbox.ts (Host)`, `src/kernel/prelude.lua`, `universe/modules/sys.needs/logic.lua`, `universe/modules/sys.work/logic.lua`, `prompt dell’Ingegnere`
- **Tocca**: Lua, prompt · **lingua**: inglese · **task**: T308b, contratto 0.5
- **Nota**: `cantiere` è il pannello di `sys.work` e `porta` il suo pulsante; `deposito:` la chiave del deposito di un luogo nel magazzino di `sys.work`; il resto dell’API (hook, `world.player`) è già inglese

| italiano | interno |
|---|---|
| `world.impresa` | `world.venture` |
| `world.impresa_porta` | `world.venture_bring` |
| `morte` | `death` |
| `deposito:` | `deposit:` |
| `cantiere` | `worksite` |
| `porta` | `bring` |

<a id="dove-piano"></a>
### «Dove» di una cosa in un piano (dentro o fuori i lotti) (`dove-piano`)

- **Dove si legge**: `src/kernel/agents/cartography.ts (Where, WHERE)`, `src/kernel/kernel.ts (placeEntities)`, `maps/*.json → objects[].where, fresh[].where`
- **Tocca**: disco, filo, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: non è il «dove» della routine (`dove`, T307b): quello dice un posto della vita di un individuo, questo se una cosa sta dentro i lotti o fuori

| italiano | interno |
|---|---|
| `dentro` | `inside` |
| `fuori` | `outside` |
| `ovunque` | `anywhere` |

<a id="tipi-ambiente"></a>
### Tipi di ambiente (all’aperto, al chiuso, misto) (`tipi-ambiente`)

- **Dove si legge**: `src/kernel/types.ts (EnvironmentDef.environment)`, `src/kernel/agents/cartography.ts`, `manifest → layouts[].environment`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7

| italiano | interno |
|---|---|
| `esterno` | `outdoor` |
| `interno` | `indoor` |
| `misto` | `mixed` |

<a id="direzioni"></a>
### Direzioni della bussola (`direzioni`)

- **Dove si legge**: `src/kernel/atlas.ts (COMPASS, direction, directionVector)`, `src/kernel/agents/cartography.ts (REGION_SCHEMA)`
- **Tocca**: prompt, solo codice · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: nel testo del mondo la direzione si dice nella sua lingua (`directionWord`); il Cartografo la scrive come id

| italiano | interno |
|---|---|
| `nord` | `north` |
| `nord-est` | `north-east` |
| `est` | `east` |
| `sud-est` | `south-east` |
| `sud` | `south` |
| `sud-ovest` | `south-west` |
| `ovest` | `west` |
| `nord-ovest` | `north-west` |
| `qui` | `here` |

<a id="tipi-fucina"></a>
### Tipi di ciò che la Fucina crea (`tipi-fucina`)

- **Dove si legge**: `src/kernel/agents/forge.ts (Concept.type, ForgeRequest.kind)`, `src/kernel/agents/genesis.ts (CastEntry.type)`, `src/kernel/kernel.ts (forgeModule)`
- **Tocca**: prompt, solo codice · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: un `item` va nell’inventario (`kind: item` del manifest), un `object` sta nel mondo; i prefissi degli id (`npc.`, `obj.`, `item.`) non cambiano

| italiano | interno |
|---|---|
| `npc` | `npc` |
| `oggetto` | `object` |
| `strumento` | `item` |

<a id="azioni-npc"></a>
### Azioni di un individuo in un dialogo e modi della sua mente (`mind.mode`) (`azioni-npc`)

- **Dove si legge**: `src/kernel/agents/minds.ts (NPC_ACTIONS)`, `src/kernel/npc/model.ts (Mind.mode)`, `universe/modules/sys.follow, sys.wander, sys.work (logic.lua)`, `manifest → components.mind.mode, cases`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: `wander`, `follow` e `stay` sono anche i modi della mente che Lua legge (`mind.mode`)

| italiano | interno |
|---|---|
| `nessuna` | `none` |
| `segui` | `follow` |
| `resta` | `stay` |
| `vaga` | `wander` |
| `dai` | `give` |
| `missione` | `quest` |

<a id="incarichi"></a>
### Incarichi del Referente e interventi della sessione del Concilio (`incarichi`)

- **Dove si legge**: `src/kernel/agents/minds.ts (REFERENTE_SCHEMA)`, `src/kernel/agents/effects.ts (SESSION_SCHEMA, councilSession)`, `src/kernel/kernel.ts (liaison, councilSession)`
- **Tocca**: prompt, solo codice · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: `oggetto` del Referente è uno strumento (`item`, come lo crea la Fucina), `cosa` una cosa del mondo (`object` per la Fucina)

| italiano | interno |
|---|---|
| `nessuno` | `none` |
| `oggetti` | `items` |
| `abitante` | `inhabitant` |
| `cosa` | `thing` |
| `meccanica` | `mechanic` |
| `runa` | `rune` |
| `oggetto` | `item` |
| `personaggio` | `character` |
| `ambiente` | `environment` |
| `regola` | `rule` |
| `riscolpisci` | `resculpt` |
| `musica` | `music` |

<a id="posti"></a>
### Posti degli oggetti (dove si indossano o si impugnano) (`posti`)

- **Dove si legge**: `src/kernel/agents/content.ts (ITEM_SCHEMA.slot)`, `src/kernel/wearing.ts (SLOT_ZONES)`, `src/mj/hold.ts (SLOT_MOUNTS)`, `manifest → items[].slot, ui.elements[].accepts`, `prompt dell’Ingegnere`
- **Tocca**: disco, Lua, filo, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: gli id degli slot di un pannello (`ui.elements[].id`) sono parole del modulo, come le sue azioni: non cambiano; cambiano i posti delle cose e ciò che uno slot accetta

| italiano | interno |
|---|---|
| `testa` | `head` |
| `corpo` | `torso` |
| `gambe` | `legs` |
| `piedi` | `feet` |
| `mani` | `hands` |
| `arma` | `weapon` |
| `scudo` | `shield` |
| `anello` | `ring` |
| `collo` | `neck` |
| `schiena` | `back` |

<a id="ruoli-timbri"></a>
### Ruoli dei codici di un timbro (`codes`) (`ruoli-timbri`)

- **Dove si legge**: `src/kernel/stamps.ts (StampCodes, STAMP_ROLES)`, `src/kernel/mj.ts (stamp)`, `manifest → layouts[].program (stamp.codes)`, `prompt del Cartografo`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7

| italiano | interno |
|---|---|
| `muro` | `wall` |
| `pavimento` | `floor` |
| `porta` | `door` |
| `acqua` | `water` |
| `ponte` | `bridge` |
| `terreno` | `ground` |
| `strada` | `road` |
| `roccia` | `rock` |
| `recinto` | `fence` |

<a id="interazioni"></a>
### Interazioni di un concetto della Fucina (`interazioni`)

- **Dove si legge**: `src/kernel/agents/forge.ts (Concept.interaction)`
- **Tocca**: prompt, solo codice · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: nel manifest diventano `interaction.type` (`talk`, `read`, `lua`), già inglesi

| italiano | interno |
|---|---|
| `parla` | `talk` |
| `leggi` | `read` |
| `usa` | `use` |
| `nessuna` | `none` |

<a id="comandi"></a>
### Comandi di uno strumento (`item.controls`) (`comandi`)

- **Dove si legge**: `src/kernel/agents/forge.ts (Concept.controls[].action, requiredHooks)`, `manifest → item.controls (chiavi)`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7

| italiano | interno |
|---|---|
| `usa` | `use` |
| `azione` | `action` |

<a id="ripartenza"></a>
### Dove si riapre gli occhi dopo la morte (`ripartenza`)

- **Dove si legge**: `src/kernel/agents/effects.ts (DEATH_SCHEMA)`, `src/kernel/gameSetup.ts (fallbackDeath)`, `src/kernel/kernel.ts`
- **Tocca**: prompt, solo codice · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: le stesse parole dell’avviso sul filo (`valori-filo`)

| italiano | interno |
|---|---|
| `qui` | `here` |
| `piazza` | `square` |

<a id="bonus"></a>
### Bonus di una cosa indossata o impugnata (`bonus`)

- **Dove si legge**: `src/kernel/agents/content.ts (ITEM_SCHEMA.bonus)`, `src/kernel/kernel.ts (item_bonus)`, `manifest → items[].bonus (chiavi)`, `Lua: items.bonus(id, nome)`, `prompt dell’Ingegnere`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T310b, contratto 0.7

| italiano | interno |
|---|---|
| `difesa` | `defense` |
| `attacco` | `attack` |
| `velocita` | `speed` |
| `peso` | `weight` |
| `luce` | `light` |
| `calore` | `warmth` |

<a id="campi-risposte"></a>
### Campi delle risposte del Concilio (gli schemi delle richieste) (`campi-risposte`)

- **Dove si legge**: `src/kernel/agents/*.ts (gli schemi)`, `src/kernel/ai/mock.ts`, `src/kernel/agents/council.ts (ask: internalAnswer)`
- **Tocca**: prompt · **lingua**: inglese · **task**: T310b, contratto 0.7
- **Nota**: una tabella sola per ogni risposta, letta a ogni profondità (`internalAnswer`): la stessa parola italiana vale lo stesso in ogni schema. Tre non ci sono perché cambiano senso: `storia` è `history` nella bibbia e `story` in una persona, `oggetti` sono `items` di un pacchetto e `objects` di un piano, `tag` è l’elenco `tags` di una cosa e il `tag` di una voce di bottino; li legge ciascun lettore

| italiano | interno |
|---|---|
| `nome` | `name` |
| `descrizione` | `description` |
| `testo` | `text` |
| `titolo` | `title` |
| `racconto` | `story` |
| `possibile` | `possible` |
| `dice` | `say` |
| `azione` | `action` |
| `oggetto` | `item` |
| `umore` | `mood` |
| `oggetti_citati` | `mentioned` |
| `ricordo` | `memory` |
| `importanza` | `weight` |
| `legame` | `bond` |
| `scheda` | `sheet` |
| `risposta` | `reply` |
| `incarico` | `task` |
| `richiesta` | `request` |
| `bersaglio` | `target` |
| `rifiuto` | `refusal` |
| `richiesta_fucina` | `forge_request` |
| `battute` | `lines` |
| `chi` | `who` |
| `ricordo_a` | `memory_a` |
| `ricordo_b` | `memory_b` |
| `mistero` | `mystery` |
| `coinvolti` | `involved` |
| `tappe` | `beats` |
| `giorno` | `day` |
| `momento` | `moment` |
| `dove` | `where` |
| `cosa` | `what` |
| `battuta` | `line` |
| `indizio` | `clue` |
| `missione` | `quest` |
| `da` | `from` |
| `tipo` | `type` |
| `a` | `to` |
| `luogo` | `place` |
| `ricompensa` | `reward` |
| `categoria` | `category` |
| `peso` | `weight` |
| `pila` | `stack` |
| `effetti` | `effects` |
| `fame` | `hunger` |
| `sete` | `thirst` |
| `energia` | `energy` |
| `salute` | `health` |
| `impugnabile` | `equippable` |
| `contenitore` | `container` |
| `posto` | `slot` |
| `aspetto` | `look` |
| `forma` | `shape` |
| `correzioni` | `fixes` |
| `nota` | `note` |
| `approvato` | `approved` |
| `problemi` | `problems` |
| `agente` | `agent` |
| `problema` | `problem` |
| `ricette` | `recipes` |
| `ingredienti` | `inputs` |
| `quantita` | `quantity` |
| `attrezzi` | `tools` |
| `risultato` | `result` |
| `bottino` | `loot` |
| `tabella` | `table` |
| `voci` | `entries` |
| `porta` | `carries` |
| `indossa` | `wears` |
| `mestiere` | `job` |
| `genere` | `gender` |
| `eta` | `age` |
| `famiglia` | `family` |
| `quando` | `when` |
| `fa` | `does` |
| `ambiente` | `environment` |
| `modulo` | `module` |
| `a_terra` | `ground` |
| `nuovi` | `fresh` |
| `concetto` | `concept` |
| `rune` | `runes` |
| `strutture` | `structures` |
| `taglia` | `size` |
| `ambienti` | `environments` |
| `programma_json` | `program_json` |
| `direzione` | `direction` |
| `distanza` | `distance` |
| `raggio` | `radius` |
| `usa_ambiente` | `reuse` |
| `nuovi_terreni` | `new_terrains` |
| `codice` | `code` |
| `colore` | `color` |
| `strato` | `layer` |
| `solido` | `solid` |
| `interno` | `indoor` |
| `regione` | `region` |
| `tono` | `tone` |
| `sintesi` | `summary` |
| `luoghi` | `places` |
| `personaggi` | `characters` |
| `fatti` | `facts` |
| `misteri` | `mysteries` |
| `usanze` | `customs` |
| `stile` | `style` |
| `forme` | `shapes` |
| `luce` | `light` |
| `regole` | `rules` |
| `protagonista` | `protagonist` |
| `case_comuni` | `common_houses` |
| `terreni` | `terrains` |
| `velocita` | `speed` |
| `tetto` | `roof` |
| `moduli` | `modules` |
| `classe` | `class` |
| `contesto` | `context` |
| `rarita` | `rarity` |
| `interazione` | `interaction` |
| `comandi` | `controls` |
| `unico` | `unique` |
| `azioni` | `actions` |
| `etichetta` | `label` |
| `richiede` | `requires` |
| `capienza` | `capacity` |
| `spingibile` | `pushable` |
| `massa` | `mass` |
| `attrito` | `friction` |
| `impilabile` | `stackable` |
| `max_pila` | `max_stack` |
| `equipaggiabile` | `equippable` |
| `componenti_json` | `components_json` |
| `spiegazione` | `reason` |
| `ripetibile` | `repeatable` |
| `serve` | `requires` |
| `costo` | `cost` |
| `runa_nuova` | `new_rune` |
| `glifo` | `glyph` |
| `elemento` | `element` |
| `canone` | `canon` |
| `valutazione` | `assessment` |
| `intervento` | `action` |
| `perde_tutto` | `lose_all` |
| `ripartenza` | `restart` |
| `viandante_json` | `wanderer_json` |
| `passi` | `steps` |
| `verso` | `toward` |
| `secondi` | `seconds` |
| `durata` | `duration` |
| `guarda` | `watch` |
| `righe` | `lines` |
| `pannello` | `panel` |
| `elementi` | `elements` |
| `accetta` | `accepts` |
| `campo` | `field` |
| `logica` | `logic` |
| `casi` | `cases` |
| `voto` | `score` |
| `riconoscibile` | `recognizable` |
| `consigli` | `advice` |
| `programma` | `program` |
| `uso` | `use` |
| `momenti` | `moments` |
| `effetto` | `effect` |
| `ritira` | `withdraw` |
| `motivo` | `reason` |

<!-- tabelle: fine -->
