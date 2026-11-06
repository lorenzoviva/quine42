# La lingua interna: l'inglese, e le rune in latino (T306, step 42)

> Stato: **decisa** dall'autore (D34, 05/11 sera), ADR-0153. Questo documento è il piano: la tabella completa di ciò che cambia nome,
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
2. **T307b** — i valori della società e del Concilio, contratto `0.3.0`: rinomina anche `prompts/agents/<agente>.md`, i moduli
   `lavoro.*` → `job.*` e `sys.lavoro` → `sys.work`, i modelli `corona-gerboa-<agente>` e `suono-*` del seme.
3. **T308a** — i campi e i percorsi dei file dell'universo, contratto `0.4.0`: `paths.ts` (`allowedPath`, `councilMayWrite`), `files.ts`
   (`playerFiles`, `publicFiles`, `UNIVERSE_FIELDS`), le letture di sito e server; la suite di sicurezza (`paths.ts`, `files.ts`); le cartelle
   del server fuori dagli universi (`.saldi` → `.balances`…) con la lettura del nome vecchio finché c'è; `quine:fila:` letta anche col nome vecchio.
4. **T308b** — il filo e Lua, contratto `0.5.0`: protocollo (client e server insieme, nessun dato da migrare), componenti, API Lua
   (`Host`, `prelude.lua`, `LUA_API`, prompt dell'Ingegnere, `AGENTS.md`), eventi del bus. Browser: singola e due schede in multigiocatore.
5. **T309** — i commenti di Lua e XML, invariato: non cambia contratto (sale `Z`); il controllo di identità (token Lua uguali, albero XML
   senza commenti uguale, voxel uguali). Si fa dopo i passi di codice perché i commenti nominano i valori nuovi.
6. **T310** — i prompt in inglese e il blocco «Lingua», invariato; in più: toglie (dopo un contratto) la riparazione dei valori italiani del
   punto 5, e aggiunge allo schema del Narratore il tipo di legame come id (`legami`), così `society.ts` non indovina più dalla parola.

Le stime di T307 (8 %) e T308 (6 %) si dividono a metà fra a e b; il backlog le rinumera quando integra.

## 5. Ciò che resta fuori

- **Il testo del mondo** (§2): resta nella lingua dell'universo; tradurlo è T239 (Fase III).
- **L'interfaccia** (UI del gioco, sito, messaggi del kernel al viandante): resta italiana; i dizionari per lingua sono T239.
- **Gli indirizzi**: `/api/viandante`, `/api/crediti`, `/api/coda`, `?universo=`, `?viandante=`, `?classica`, `window.rune`, le chiavi di
  `localStorage` del sito e del profilo (`quine:sito:reame`, `rune:profilo:`), l'ancora `#reami`. Sono l'interfaccia (link, profili dei
  browser, abitudini): li cambierà T239 con un reindirizzamento, se servirà. `quine:fila:` invece è un formato interno e passa con T308a.
- **Le espressioni regolari che leggono testo** (le 83 di `lingue.md` §5): le tocca T310, non i passi di codice.
- **I contenuti scritti dal Concilio negli universi salvati** che solo il loro modulo legge (§2), e gli id di oggetti e modelli che il
  kernel non nomina.
- **Gli `esito` di `sys.lavoro`** («finito», «manca») e altre stringhe interne del Lua del seme che nessun TypeScript legge: le trova e le
  traduce T307b leggendo `sys.lavoro`, senza voce qui finché non tocca il kernel.
- **I nomi italiani del laboratorio** (`lab/`): le cartelle e i programmi di prova seguono i passi solo dove i test li leggono.
- **La documentazione** e gli ADR, che sono storia.

## 6. Le tabelle

Le voci: **847 tra valori, campi e percorsi** in 54 domini (il totale per passo è nell’ultima riga della prima tabella). Una voce con lo stesso nome a sinistra
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
| [«Dove» della routine](#dove) | valori | 4 | disco, prompt | T307b (0.3) |
| [Attività degli individui](#attivita) | valori | 14 | disco, filo, Lua, prompt | T307b (0.3) |
| [Specie e genere](#specie) | valori | 4 | disco, prompt | T307b (0.3) |
| [Tipi di legame (solo codice: la parola del legame è testo del mondo)](#legami) | valori | 25 | solo codice | T307b (0.3) |
| [Mestieri del seme e i loro moduli](#mestieri) | valori | 12 | disco, Lua, prompt | T307b (0.3) |
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
| [Modalità della partita, esiti delle mancanze](#partita) | valori | 7 | disco, filo | T307b (0.3) |
| [Valori che solo il TypeScript confronta](#solo-codice) | valori | 53 | solo codice | T307b (0.3) |
| [Campi di `universe.json`](#campi-universe) | campi | 17 | disco, filo | T308a (0.4) |
| [Campi dei manifest (aspetto, terreni, pannelli, casi, mestieri)](#campi-manifest) | campi | 47 | disco, Lua, prompt | T308a (0.4) |
| [Campi dei programmi di mestiere che cambiano senso](#campi-mestieri) | campi | 2 | disco, Lua | T308a (0.4) |
| [Campi di `world/rules.json`](#campi-regole) | campi | 6 | disco, filo | T308a (0.4) |
| [Campi di `world/people.json`](#campi-persone) | campi | 29 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/plots.json`](#campi-trame) | campi | 24 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/bible.json`](#campi-bibbia) | campi | 10 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/atlas.json`](#campi-atlante) | campi | 6 | disco, filo, prompt | T308a (0.4) |
| [Campi di `world/stato.json`](#campi-stato) | campi | 8 | disco | T308a (0.4) |
| [Campi di `world/giocatori/<id>.json`](#campi-viandante) | campi | 9 | disco, filo | T308a (0.4) |
| [Campi di `world/imprese.json`](#campi-imprese) | campi | 37 | disco, Lua, filo | T308a (0.4) |
| [Campi delle carte, dei consumi e delle mancanze](#campi-carte) | campi | 22 | disco, filo | T308a (0.4) |
| [Campi dei piani dei luoghi (`maps/*.json`)](#campi-piani) | campi | 15 | disco, filo | T308a (0.4) |
| [Campi di `models/index.json` e attributi dei programmi](#campi-modelli) | campi | 17 | disco, prompt | T308a (0.4) |
| [Percorsi dell’universo e del server](#percorsi) | percorsi | 17 | disco, filo | T308a (0.4) |
| [Messaggi del protocollo (`t`)](#messaggi) | valori | 30 | filo | T308b (0.5) |
| [Operazioni e stati sul filo](#valori-filo) | valori | 24 | filo | T308b (0.5) |
| [Campi dei messaggi](#campi-filo) | campi | 53 | filo | T308b (0.5) |
| [Componenti visibili a Lua](#componenti) | valori | 16 | disco, filo, Lua, prompt | T308b (0.5) |
| [Campi dei componenti](#campi-componenti) | campi | 16 | filo, Lua, prompt | T308b (0.5) |
| [Nomi dell’API Lua, eventi del bus, chiavi del magazzino](#api-lua) | valori | 6 | Lua, prompt | T308b (0.5) |
| **totale** | | **847** | | T307a: 192 · T307b: 244 · T308a: 266 · T308b: 145 |

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

- **Dove si legge**: `src/kernel/society.ts (DAY_PHASES)`, `world/people.json → routine[].quando`, `world/plots.json → tappe[].momento`, `models/index.json → suono.momenti`, `manifest → mestieri[].giornata (chiavi)`
- **Tocca**: disco, Lua, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `mattina` | `morning` |
| `giorno` | `day` |
| `sera` | `evening` |
| `notte` | `night` |

<a id="dove"></a>
### «Dove» della routine (`dove`)

- **Dove si legge**: `src/kernel/society.ts (WHERES)`, `world/people.json → routine[].dove`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `casa` | `home` |
| `lavoro` | `work` |
| `piazza` | `square` |
| `in giro` | `about` |

<a id="attivita"></a>
### Attività degli individui (`attivita`)

- **Dove si legge**: `src/kernel/society.ts (ACTIVITIES)`, `world/people.json → routine[].azione`, `componente attivita.tipo`, `src/render/entities.ts`
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

- **Dove si legge**: `src/kernel/society.ts (Species, Gender)`, `world/people.json → specie, genere`, `src/kernel/graph.ts`
- **Tocca**: disco, prompt · **lingua**: inglese · **task**: T307b, contratto 0.3

| italiano | interno |
|---|---|
| `persona` | `person` |
| `animale` | `animal` |
| `maschio` | `male` |
| `femmina` | `female` |

<a id="legami"></a>
### Tipi di legame (solo codice: la parola del legame è testo del mondo) (`legami`)

- **Dove si legge**: `src/kernel/society.ts (KINDS, Between)`
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

- **Dove si legge**: `universe/modules/lavoro.* (mestieri[].id)`, `src/kernel/jobs.ts (matchJob)`, `world/people.json → mestiere (via matchJob)`
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

<a id="comportamenti"></a>
### Comportamenti dei mestieri (`fa`) (`comportamenti`)

- **Dove si legge**: `src/kernel/jobs.ts (JOB_BEHAVIOURS)`, `universe/modules/sys.lavoro/logic.lua`, `manifest → mestieri[].giornata[].fa`
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

- **Dove si legge**: `src/kernel/ventures.ts (VENTURE_TYPES, VentureState)`, `world/imprese.json → tipo, stato`, `il pannello del cantiere`
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

- **Dove si legge**: `src/kernel/plots.ts (Plot, Quest)`, `world/plots.json`
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

| italiano | interno |
|---|---|
| `io` | `me` |
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

- **Dove si legge**: `src/kernel/types.ts (Manifest, Appearance, TerrainDef, UiPanel, BenchCase)`, `src/kernel/jobs.ts (JobProgram, JobTask)`, `src/kernel/validator.ts`
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

<a id="campi-mestieri"></a>
### Campi dei programmi di mestiere che cambiano senso (`campi-mestieri`)

- **Dove si legge**: `src/kernel/jobs.ts (JobProgram.posto, JobTask.azione)`
- **Tocca**: disco, Lua · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `posto` | `workplace` |
| `azione` | `activity` |

<a id="campi-regole"></a>
### Campi di `world/rules.json` (`campi-regole`)

- **Dove si legge**: `src/kernel/types.ts (Rule)`, `src/kernel/kernel.ts`
- **Tocca**: disco, filo · **lingua**: inglese · **task**: T308a, contratto 0.4

| italiano | interno |
|---|---|
| `chiave` | `key` |
| `testo` | `text` |
| `possibile` | `possible` |
| `racconto` | `story` |
| `effetti` | `effects` |
| `carta` | `card` |

<a id="campi-persone"></a>
### Campi di `world/people.json` (`campi-persone`)

- **Dove si legge**: `src/kernel/society.ts (People, Individual, Relation, RoutineStep, Memory, IndividualSheet)`, `src/kernel/agents/minds.ts`
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

- **Dove si legge**: `src/kernel/plots.ts (Plot, Beat, Quest)`
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

- **Dove si legge**: `src/kernel/ventures.ts (Venture, VenturePhase, VentureRole, VentureMember, VentureTask)`
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
- **Nota**: `carta` sta in quasi ogni file del Concilio (piani, regole, trame, imprese): la migrazione lo cambia ovunque

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

| italiano | interno |
|---|---|
| `raggio` | `radius` |
| `accesa` | `lit` |
| `colore` | `color` |
| `daStato` | `fromState` |
| `fino` | `until` |
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

<a id="api-lua"></a>
### Nomi dell’API Lua, eventi del bus, chiavi del magazzino (`api-lua`)

- **Dove si legge**: `src/kernel/validator.ts (LUA_API)`, `src/kernel/sandbox.ts (Host)`, `src/kernel/prelude.lua`, `universe/modules/sys.needs/logic.lua`, `universe/modules/sys.lavoro/logic.lua`, `prompt dell’Ingegnere`
- **Tocca**: Lua, prompt · **lingua**: inglese · **task**: T308b, contratto 0.5
- **Nota**: `cantiere` è il pannello di `sys.lavoro` e `porta` il suo pulsante; il resto dell’API (hook, `world.player`) è già inglese

| italiano | interno |
|---|---|
| `world.impresa` | `world.venture` |
| `world.impresa_porta` | `world.venture_bring` |
| `morte` | `death` |
| `deposito:` | `deposit:` |
| `cantiere` | `worksite` |
| `porta` | `bring` |

<!-- tabelle: fine -->
