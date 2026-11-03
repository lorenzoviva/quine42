# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-03T02:58:44.969Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 53 %, 5 ore 77 %; tetto 2, slot 1 (task in programma 26), esaurimento previsto 2026-11-05T04:19:47.088Z, reset 2026-11-05T16:00:00.000Z (letto da /usage il 2026-11-03T02:58:15.668Z)
  - session, 5h: 77 % residuo, reset 2026-11-03T04:30:00.000Z
  - week (all models), settimana: 53 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 8 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-04T09:13:38.824Z, reset 2026-11-05T17:37:53.000Z (letto da /usage il 2026-11-03T02:57:29.230Z)
  - Gemini Models, settimana: 8 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-03T07:57:29.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-04T18:44:35.000Z (letto da /usage il 2026-11-03T02:57:29.230Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z
- **fable**: settimana 53 %, 5 ore 77 %; tetto 1, slot 1 (task in programma 1), esaurimento previsto 2026-11-05T14:33:06.769Z, reset 2026-11-05T15:59:00.000Z (letto da /usage il 2026-11-03T02:57:26.590Z)
  - session, 5h: 77 % residuo, reset 2026-11-03T04:29:00.000Z
  - week (all models), settimana: 53 % residuo, reset 2026-11-05T15:59:00.000Z
  - week (Fable), settimana: 93 % residuo, reset 2026-11-05T15:59:00.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T179** La traccia di un programma MarkovJunior, in testo — ESITO: fatto — traccia in testo di un programma MarkovJunior (`src/mj/trace.ts`, ADR-0117), predefinita (b) differenze fra nodi con tetto 4000: su `conferma/moderna/1` 3799 token stimati, 3405 reali; griglia identica con e senza traccia; `banco-strutture --seconda --traccia` disponibile, non provato con una chiamata vera. — claude, 3 %

## Pronti, in ordine di priorità (1)

- **T206** Integrare T179 — claude, 1 %

## Da approvare (provider e stima proposti) (10)

- **T45f** Il server su Google Cloud — claude, 6 %
- **T88** Spendere i crediti che avanzano generando l'universo con gli abbonamenti — claude, 4 %
- **T89a** Cartone: fasce e interruttore — claude, 3 %
- **T106** Tema pop art / retro arcade: applicazione alle interfacce in-game — claude, 4 %
- **T152** Le ambientazioni della Genesi: medievale, steampunk, moderna, futuristica — claude, 5 %
- **T158** L'Attore nello studio — claude, 3 %
- **T175** Un tetto alla cache delle forme nel browser — claude, 4 %
- **T180** Il banco misura varianza e scala — claude, 3 %
- **T183** Le interfacce di simulazione complesse: una prova dell'espressività del kernel — claude, 9 %
- **T186** Sul sito: spazio, pirati e cowboy «coming soon» — claude, 1 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (26)

- **T89b** Cartone: contorni dagli id di cosa e parte — claude, 6 % (aspetta T89a)
- **T89c** Cartone: luce tinta e prospettiva aerea — claude, 3 % (aspetta T89a)
- **T89d** Cartone: lo stile nei dati e le foto dei modelli — claude, 3 % (aspetta T89b)
- **T89e** Cartone: laboratorio, prestazioni, togliere la prova — claude, 4 % (aspetta T89a)
- **T156** Il prompt nuovo nello Scultore del gioco — claude, 5 % (aspetta T182)
- **T181** I pattern di MarkovJunior e il metodo del cantiere: programmi di riferimento — fable, 10 % (aspetta T179, T180)
- **T182** Il prompt procedurale delle strutture — claude, 8 % (aspetta T181)
- **T187** Il glossario con le scelte dell'autore — claude, 1 % (aspetta T179)
- **T188** R1: `Building` → `Lot` — claude, 1 % (aspetta T187)
- **T189** R2: `Models` → `AiModels`, `kernel.ai` — claude, 2 % (aspetta T188)
- **T190** R3: `player…` → `wanderer…` — claude, 2 % (aspetta T189)
- **T191** R4: `Place` → `ChunkInfo`, `PlaceView` → `ChunkView` — claude, 2 % (aspetta T190)
- **T192** R5: `hand` → `phrase` nel TypeScript — claude, 1 % (aspetta T191)
- **T193** R6: `Thing…` → `Entity…` — claude, 2 % (aspetta T192)
- **T194** R7: l'italiano nel TypeScript — claude, 1 % (aspetta T193)
- **T195** R8: `CardUses`, `UsageLog` — claude, 1 % (aspetta T194)
- **T196** R9: `Floor` → `Storey` — claude, 2 % (aspetta T195)
- **T197** R10: le caselle → `…Tiles` — claude, 1 % (aspetta T196)
- **T198** R11: `LayoutDef` → `EnvironmentDef` — claude, 1 % (aspetta T197)
- **T199** R12: `TileDef` → `TerrainDef` — claude, 1 % (aspetta T198)
- **T200** R13: i commenti, «multiplayer» e `slot` — claude, 1 % (aspetta T199)
- **T201** R15: nel sito «universo», non «reame» — claude, 1 % (aspetta T200)
- **T202** R16: `Person` → `Individual` — claude, 2 % (aspetta T201)
- **T203** R17: `SizeTier`, `GameSetup`, `liaison` — claude, 2 % (aspetta T202)
- **T204** R14: `AGENTS.md` con i nomi del glossario — claude, 1 % (aspetta T203)
- **T205** La prova delle rinomine nel gioco — claude, 2 % (aspetta T204)

## In attesa dell'autore (3)

- **T153** Generare gli universi steampunk, moderno e futuristico — claude, 2 %
- **T184** Le ambientazioni spazio, pirati, cowboy — claude, 2 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude, 2 %
