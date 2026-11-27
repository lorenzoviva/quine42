# ADR-0270 — I semi per classe sui terreni e nella copertura

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T552 (C8 di [`docs/design/terreno-ricco.md`](../design/terreno-ricco.md), § 5 e § 7)
- **Estende**: ADR-0037 (un programma per tipo, le istanze sono semi), ADR-0108 (la cache delle forme), ADR-0242 (la mesh dei luoghi in un
  worker), ADR-0269 (la copertura dei terreni)

## Contesto

I modelli dei terreni (`TerrainDef.model`: boschi e rocce) prendevano tre semi fissi (`TILE_SEEDS = 3` in `src/render/terrainmesh.ts` e
`src/render/terrain.ts`, `SEEDS.tree = 3` e `SEEDS.rock = 3` in `src/kernel/forms.ts`), e i modelli di copertura (`cover`) quattro
(`SEEDS.cover = 4`). Un ciuffo della copertura costa 1-2 ms nel worker, un albero 35-127 ms, e i semi si calcolano una volta e restano
nella cache delle forme del browser (ADR-0108): aumentare i semi per classe riduce la ripetizione visibile su migliaia di istanze di
copertura e nei boschi.

## Decisione

1. **Semi per classe in `SEEDS`** (`src/kernel/forms.ts`): `tree` e `rock` passano da 3 a **4**; `cover` passa da 4 a **8** (`bush` e
   `pebble` restano a 3; un modello con `ModelInfo.seeds` proprio continua a vincere in `Forms.seedsOf`).
2. **Semi per modello anche per i terreni** (`src/render/terrain.ts`, `src/render/terrainmesh.ts`): `tileForms` chiede `k.forms.seedsOf(t.model)`
   come `coverForms` già fa per la copertura, chiedendo tutti i semi insieme così il pool dei worker li calcola in parallelo; `ChunkSource`
   e `ChunkInput` portano `tileSeeds` (codice → numero di semi pronti) e `place` sceglie `h % seeds` (`TILE_SEEDS` passa a 4 come ripiego
   quando una sorgente dice solo `ready`); `chunkView` verifica che il seme stia nella lista pronta.
3. **La cache delle forme** (`src/render/forms.ts`, ADR-0108): nessun cambio a `FORMS_DB_VERSION` (6), perché le griglie e le mesh dei semi
   precedenti (1-3 per alberi/rocce, 1-4 per copertura) sono identiche; i semi nuovi entrano sotto le loro chiavi (`seed` è in `formKey` e
   `formCacheKey`) nei tetti esistenti (`FORM_ENTRIES` 4096, `FORM_MEMORY_BYTES` 128 MB, `FORM_DISK_BYTES` 4 GB) e alla ricarica tornano da
   IndexedDB senza rieseguire i programmi.
4. **L'impronta del seme** (`lab/scripts/impronta-terreno.ts`): `modelsReady` attende `k.forms.seedsOf(t.model)` semi anche per i modelli
   dei terreni; l'impronta passa da `9afb6ebffa73d7f7` a `c7fa6196dd6de0c8` (75 luoghi con alberi/rocce e copertura; ogni «senza» e ogni
   luogo nudo restano identici byte per byte).

## Conseguenze

- I boschi e le rocce di ogni universo guadagnano un quarto seme, e ogni tipo di copertura passa a otto semi (cambia l'aspetto dei luoghi,
  non lo stato né il filo).
- Kernel `0.10.44`: `SEEDS` e `tileSeeds` sono compatibili con tutti gli universi `0.10` e nessuna migrazione serve.
