# ADR-0254 — La primitiva degli automi cellulari (D3: due celle per lato di casella)

Data: 2026-11-23 · Stato: accettato (task T482 del backlog, la riga 9 dello studio di T459, `docs/design/terreno-3d.md` § 5.5–5.6; decisione D67 **D3** dell'autore del 21/11) · Estende ADR-0250 (punto 5: gli automi del kernel), ADR-0224 (la natura del mondo, la fisica come dati), ADR-0235 (il Fisico a mondo acceso), ADR-0196 (il ritmo del mondo) · Sicurezza: V-048 (`docs/sicurezza/registro.md`)

## Contesto

Lo studio di T459 (§ 5.5–5.6) progetta la primitiva degli automi cellulari del kernel per campi fisici e discreti sulla finestra dei luoghi caricati (`flow`, `wind`, `diffuse`, `table`, `rules` in MarkovJunior), con parametri come dati scritti dal Fisico entro un carico statico fisso e un'API Lua a soli eventi (`world.field`, `world.field_add`). L'autore, con **D3** (21/11, `docs/pipeline/domande/T459.md`), ha scelto le famiglie fisiche (`flow`) **a due celle per lato di casella** (`cell: 0.5`, quattro celle per casella) nel kernel invece di una sola. A quella risoluzione la sola acqua sui 6 × 5 luoghi (108 × 90 caselle = 38 880 celle) costa 1,21 ms a tick (misurato in T459), rendendo stretto il bilancio di 1,5 ms a tick pensato per una cella per casella: tetto di celle per automa e carico fisso vanno rimisurati e rifatti su D3.

## Decisione

1. **La primitiva del kernel (`src/kernel/automata.ts`)**: cinque famiglie deterministiche, pure e senza orologio (buffer tipizzati `Float32Array`/`Uint8Array`, aritmetica IEEE, caso solo da `hash32` o `Stepper` seminato dal seme del mondo):
   - `flow` (tubi virtuali O'Brien-Hodgins / Mei et al.): `cell` `0.5 | 1` (**predefinito `0.5`**, due celle per lato di casella, D3), `hz` 1–60 (predefinito 60), `gravity` (0,5–20), `damp` (0,5–0,999), `sources` (terreni a livello costante), `walls`, `level`; percorso veloce senza controllo dei muri quando il campo non ne ha; quantità conservata entro 1e−6 nei bacini chiusi.
   - `wind` (reticolo di Boltzmann D2Q9 BGK): `cell` `1 | 2 | 3` (predefinito `3`), `hz` 1–10 (predefinito 10), `tau` (0,52–2), `prevailing` (`|u| ≤ 0,08`), `layerHeight` (0–32), `obstacles`.
   - `diffuse` (scalare che si diffonde, decade e si fa portare dal vento o dalla corrente con advezione upwind stabile in passata separata): `cell` `0.5 | 1 | 2 | 3` (predefinito `1`), `hz` 1–10 (predefinito 10), `rate` (0–0,24), `decay` (0–0,5), `sources`, `walls`, `advect` (id di un automa `wind` o `flow`), `advectScale` (0–2).
   - `table` (stati discreti 2–16 su vicinato di Moore, compilati in tabelle piatte `Uint8Array` + `Float32Array` di `states × 9`, caso da `hash32(seed, worldCellX, worldCellY, step)`): `cell` `0.5 | 1 | 2` (predefinito `1`), `hz` 1–10 (predefinito 10), `states`, `counted`, `rules`, `initial`, `walls`.
   - `rules` (uscita programmatica in MarkovJunior su uno `Stepper` persistente, ADR-0164): `cell` `0.5 | 1 | 2` (predefinito `1`), `hz` 1–10 (predefinito 10), `program` XML con `symmetry="(xy)"` sulla radice, soli nodi `sequence|markov|convolution|prl|all|one`, 2–16 stati, nessun `<import>` né `field|observe|search` né pattern 3D, entro `WORLD_NODE_LIMITS`, `steps` 1–4 passi per passo dell'automa. `Stepper.setCell` aggiorna censimento e log in O(1) sulle scritture esterne.
2. **Tetti e bilancio del carico rimisurati per D3**:
   - Misurati sulla finestra di riferimento `REF_WINDOW` (6 × 5 luoghi = 108 × 90 = 9 720 caselle) sull'implementazione reale (`src/kernel/automata.ts`, Node 22):

     | famiglia | `cell` | celle | mediana (p95) per passo | ns / cella | ms / tick (60 Hz) | peso statico (`NS_PER_CELL`) |
     |---|---:|---:|---|---:|---:|---:|
     | `flow` (D3) | 0,5 | 38 880 | 1,244 ms (1,440) | 32,0 | 1,244 (60 Hz) | 35 ns → 1,361 ms/tick |
     | `flow` | 1 | 9 720 | 0,309 ms (0,537) | 31,8 | 0,309 (60 Hz) | 35 ns → 0,340 ms/tick |
     | `wind` | 3 | 1 080 | 0,116 ms (0,215) | 107,7 | 0,019 (10 Hz) | 100 ns → 0,018 ms/tick |
     | `wind` | 1 | 9 720 | 1,037 ms (1,966) | 106,6 | 0,173 (10 Hz) | 100 ns → 0,162 ms/tick |
     | `diffuse` | 1 | 9 720 | 0,101 ms (0,203) | 10,4 | 0,017 (10 Hz) | 10 ns → 0,016 ms/tick |
     | `diffuse` | 0,5 | 38 880 | 0,399 ms (0,432) | 10,3 | 0,067 (10 Hz) | 10 ns → 0,065 ms/tick |
     | `table` | 1 | 9 720 | 0,200 ms (0,367) | 20,6 | 0,033 (10 Hz) | 42 ns → 0,068 ms/tick |
     | `rules` | 1 | 9 720 | 0,339 ms (0,556) | 34,9 | 0,057 (10 Hz) | 65 ns → 0,105 ms/tick |

   - **Tetto di celle per finestra** (`MAX_CELLS_PER_AUTOMATON`): **48 000** celle (copre 7 × 5 = 35 luoghi a due celle per lato di casella = 45 360 celle, con margine fino a 37 luoghi). In multigiocatore i luoghi caricati lontani sono raggruppati in finestre separate (`clusterChunks`, al più `MAX_WINDOWS_PER_AUTOMATON = 4`), così due viandanti distanti non allocano il mare fra loro; allo spostamento della finestra lo stato delle celle sovrapposte si conserva.
   - **Tetto di automi**: `MAX_AUTOMATA = 6`.
   - **Bilancio del carico fisso (`LOAD_BUDGET_MS`)**: portato da 1,5 ms/tick (D1) a **2,0 ms/tick** a 60 Hz (120 ms/s, il 12 % del frame di 16,7 ms), calcolato staticamente da `Σ refCells × hz × steps × NS_PER_CELL / (1e6 × 60)` al caricamento e alla validazione, **mai a tempo di orologio** (il determinismo resta intatto). Le cinque famiglie insieme ai predefiniti D3 pesano 1,57 ms/tick statici (1,37 ms/tick misurati in mediana) e lasciano spazio anche a un secondo `flow` a 1 cella/casella (1,91 ms/tick), mentre due `flow` pieni a `cell: 0.5` (2,72 ms/tick) sono rifiutati.
3. **Passi esatti e ritmo del mondo**: l'avanzamento nel tick del kernel usa un accumulatore intero esatto contro `TICK_HZ = 60` (`accum += hz`), senza derive in virgola mobile. Quando il ritmo del mondo è in pausa (`pace.mode === 'hold'`, ADR-0196), `automata.tick(true)` ferma tutti gli automi.
4. **Dati nella natura e Fisico (`physics.automaton`)**: gli automi stanno in `universe.json → nature.automata` (omesso quando vuoto: gli universi esistenti e `water.ts` restano invariati, nessuna migrazione). `repairNature` li ripara in sicurezza (`repairAutomata`), `keptNature` li lascia passare insieme alla gravità (`RESHAPED_NATURE`). Il Fisico li dichiara, li regola o li rimuove su richiesta del Referente (incarico `automaton`, compito `physics.automaton`, manopola `studio` in `CENSUS`): validati senza tagliare (`validateAutomaton`), un rifiuto torna al Fisico una volta coi motivi, accettati vanno in `universe.json` per mano del kernel (`writeCommanded`) in un commit del Concilio; in molti solo sul ramo del master.
5. **API Lua e sicurezza (V-048)**:
   - `world.field(id, x, y)` legge un campione come copia fresca (`{depth, surface, vx, vy}` per `flow`, `{vx, vy}` per `wind`, un numero per `diffuse`, `table`, `rules`, `nil` fuori finestra o assente).
   - `world.field_add(id, x, y, amount, amount_y?)` deposita sorgenti/pozzi (o imposta uno stato discreto / aggiunge una raffica) su eventi: tipi e numeri finiti controllati (`NaN`/`Infinity` ignorati), coordinate fuori finestra ignorate (niente allocazioni), rifiutata sugli specchi (`mirror`), e limitata per automa da `FIELD_ADD_LIMITS` (tetto per chiamata, `maxCallsPerTick = 64` e tetto cumulativo per tick: `flow` ±2 / 8, `wind` 0,04 / 0,4, `diffuse` ±10 / 50, discreti 64).

## Conseguenze

- **Aggiuntivo e inerte sugli universi senza automi**: il contratto resta `0.10` (kernel `0.10.30`). Senza `nature.automata`, `AutomataEngine` non alloca nulla, non gira nel tick e `water.ts` continua identico.
- **Determinismo verificato byte per byte**: `tests/automi.test.ts` confronta i buffer binari di due motori indipendenti e due `Kernel` completi con tutte e cinque le famiglie insieme (compresa la diffusione portata dal vento) e con semi diversi.
- **Pronto per A1 e A2**: A1 collegherà `flow` (D3) a sorgenti della bozza, nuoto, scafi e scavi; A2 collegherà `wind` alle vele, al fogliame e al filo dei client.
- **Sicurezza**: aggiunta la voce `V-048` in `docs/sicurezza/registro.md`, `tools/sicurezza/catalogo.mjs` (`UNCOVERED`) e `tests/sicurezza/automi.test.ts`.

## Alternative scartate

- **Tenere il bilancio a 1,5 ms/tick con D3**: con `flow` a 2 celle per casella (1,24 ms/tick misurati, 1,36 ms/tick statici), le cinque famiglie insieme (1,57 ms/tick statici) non ci starebbero.
- **Un tetto a tempo (deadline in ms) durante il tick**: romperebbe il determinismo fra macchine diverse (server e client divergerebbero).
- **Automi scritti in Lua**: 34–155 volte più cari (T459 § 1.5) e spezzati a metà passo dal budget di istruzioni della sandbox.
