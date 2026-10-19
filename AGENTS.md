# AGENTS.md — RUNE

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).

## Visione in breve

RUNE è un gioco 2D top-down in cui il mondo è generato da IA in ogni suo aspetto tranne il kernel, ed è
fatto del proprio codice sorgente. Il giocatore vive in un cerchio di simulazione; un **tappeto**
compensa ogni suo passo e lo riporta sempre al centro. Attorno, ferma e **invisibile finché il tappeto lo
tiene**, c'è la **corona**: il codice sorgente dell'universo. Il mondo (mappe dipinte, luoghi, oggetti,
strumenti, personaggi, il loro codice) lo scrive un **Concilio di agenti** su Google Gemini. Nel terreno
sono sparse **rune**: token Lua veri, legati a simboli veri (`x` è la posizione X globale del giocatore).
Ciò che è scritto sul tappeto **si esegue**. Componendo frasi con le rune il giocatore può rompere la
simulazione, o fermare il tappeto, raggiungere la corona e riscrivere il gioco.

Design doc originale: [`docs/design.md`](docs/design.md). Decisioni: [`docs/adr/`](docs/adr/README.md).

## Regole inviolabili

1. **Il kernel non è mai modificabile da Lua.** Il kernel è TypeScript in `src/kernel/`. Il codice
   dell'universo (moduli e rune) gira in ambienti Lua che non vedono `_G`, `debug`, `load`, `os`, `io`,
   `package`, né il prelude. Tutto ciò che Lua può toccare passa da `Host` (`src/kernel/sandbox.ts`).
2. **Tutto il generato passa dal validatore** (`src/kernel/validator.ts`) prima di toccare l'universo:
   piani dei chunk, griglie, rune, manifest, codice (compilazione, API esistente, caricamento di prova).
   Ciò che non è valido viene scartato e richiesto di nuovo, con il motivo, all'agente responsabile.
   **L'IA non rompe mai il gioco**; se un modulo generato fallisce comunque a runtime, l'Ingegnere lo ripara.
3. **Il giocatore può rompere il gioco.** Il suo input non si valida per bloccarlo: si isola l'errore
   (fault), lo si mostra (glitch) e si garantisce il rollback. La riparazione automatica non tocca mai
   un file modificato per ultimo dal giocatore.
4. **Stato nei componenti, logica stateless.** Entità = id, componenti = dati (nel kernel), sistemi Lua
   senza stato. Hot reload = sostituzione delle funzioni; mai riavviare il runtime per ricaricare.
5. **Ogni contenuto è un modulo autosufficiente** con `manifest.json`; i moduli comunicano solo tramite
   componenti ed eventi. Il manifest dei moduli generati lo assembla il kernel (forma garantita).
6. **Ogni universo è un repository.** Si committano solo stati validi; `R` torna all'ultimo commit valido.
7. **Il kernel è il pavimento**: sopravvive a qualunque cosa faccia Lua (NaN, nil, cicli infiniti,
   binding recisi). Le API del `Host` validano gli input e restituiscono `undefined` (mai `null`).
8. **La corona è nascosta finché il tappeto funziona**: niente bordo, niente codice disegnato, niente
   tooltip né console (ADR-0009).
9. **La chiave API non arriva mai al browser**: passa dal proxy di Vite (`server/geminiProxy.ts`).

## Stack

- **Vite 5 + TypeScript 5** (strict), nessun framework UI: Canvas 2D per il mondo, DOM per HUD/pannelli.
- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel.
- **Google Gemini**: `gemini-2.5-flash-lite` (testo: narrativa, chat, descrizioni, codice) e
  `gemini-2.5-flash-image` (mappe e sprite). Configurabili in `universe/universe.json → ai`.
- **Vitest** in Node con modelli offline (`MockModels`): kernel e Concilio testabili headless.
- Persistenza: `localStorage` (repository dell'universo), IndexedDB (immagini e luoghi generati).

## Comandi

```bash
npm install          # dipendenze
npm run dev          # gioco su http://localhost:5173 (con proxy Gemini; hot reload anche di universe/)
npm test             # test: kernel, Concilio (offline), validatore, inventario, client Gemini, sandbox
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build in dist/ (npx vite preview la serve, proxy incluso)
```

`.env` nella root: `GEMINI_API_KEY=...` (ignorato da git). Senza chiave o con `?offline` il gioco usa i
modelli offline: luoghi abbozzati (schizzo del layout), agenti con risposte locali.
URL utili: `?skip` salta intro e Genesi; `?dev&teleport=46,0` ferma il tappeto e porta a coordinate reali.
In console del browser: `window.rune` è il kernel.

## Struttura

```
server/geminiProxy.ts   proxy /api/gemini → Google, chiave da .env (dev e preview)
src/
  main.ts               bootstrap: modelli (Gemini o offline), kernel, renderer, UI, loop a 60 Hz
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, chunk, rune, oggetti, inventario, chat, Fucina, Genesi, rollback
    ai/                 models.ts (interfaccia, budget), gemini.ts (client), mock.ts (offline)
    agents/             council.ts (agenti, contesto condiviso, registro), cartography.ts (chunk),
                        forge.ts (moduli, combinazioni, riparazioni), genesis.ts, minds.ts (personaggi)
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, corona.ts, repo.ts, universe.ts,
    inventory.ts, assets.ts (IndexedDB), imaging.ts (interfaccia strumenti immagine), bundle.ts,
    faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (immagini dei chunk, sprite, rune, corona), imagetools.ts (canvas:
                        schizzi, ritagli, chroma-key), glitch.ts
  ui/                   hud.ts, inventory.ts, chat.ts, feed.ts (Concilio), genesis.ts, editor.ts, console.ts
universe/               L'UNIVERSO — riscrivibile dal gioco e dal Concilio
  universe.json         nome, seme, raggio, dimensione chunk (18), modelli e budget IA
  world/                bible.json (memoria del Narratore), style.md (guida dell'Artista)
  prompts/              theme.md, agents/<agente>.md (ruoli del Concilio)
  modules/<id>/         manifest.json + logic.lua
tests/                  vitest
docs/                   design doc, ADR, immagini
```

## Il Concilio (ADR-0008)

| Agente | Fa | Riceve come contesto |
|---|---|---|
| Narratore | bibbia, concetti dei moduli, personaggi in chat, testi da leggere, giudizio sulle combinazioni | bibbia completa, catalogo |
| Cartografo | piani dei chunk (griglia, luogo, oggetti, rune, cose nuove), terreni alla Genesi | bibbia, terreni, catalogo |
| Artista | guida di stile; dipinge chunk (schizzo + bordi dei vicini) e sprite | stile, tono |
| Fisico | fisica dei moduli e dei terreni; confronta il dipinto con la griglia (visione) | terreni, regole del motore |
| Ingegnere | logic.lua dei moduli; ripara il codice che fallisce | API Lua (nel suo prompt) |
| Arbitro | verifica la coerenza; rimanda i problemi all'agente responsabile | bibbia, stile, terreni |

Tutti gli scambi finiscono nel registro (`kernel.feed()`), visibile nel gioco (pannello Concilio, `G`) e
nella console. Il kernel interviene come agente "Kernel": scarta, ripara, approva i commit.

**Pipeline di un chunk** (18×18): bozza Lua continua (codici base `g p t w r`) → piano del Cartografo →
riparazione delle griglie quasi giuste → validazione (le posizioni sono intenzioni: il kernel le sposta
nella casella valida più vicina; si scartano solo codice e moduli invalidi) → oggetti e rune nel mondo →
pittura (max 2 alla volta, mai due vicini insieme) → rilievo del Fisico → cache. Il chunk (0,0) ha sempre
le rune `x`, `speed = speed`, `carpet . active`.

**Fucina**: concetto → fisica → codice → Arbitro → validatore/caricamento di prova → sprite → commit →
annotazione nella bibbia. Origini: `genesi`, `agente` (console), `cartografo` (cose nuove richieste da un
luogo, max `maxForges` per sessione), `combinazione` (inventario).

**Genesi**: al primo avvio con Gemini; il mondo resta sospeso (`generationHeld`) finché non è decisa. I
moduli di esempio (`origin: "esempio"`) vengono sostituiti; le costanti restano.

## Architettura del gioco

### Spazi, tappeto, corona (ADR-0004, ADR-0009)
- Spazio reale: il cerchio (raggio 44) è centrato in (0,0) e non si muove. Spazio tappeto: terreno,
  entità, rune. `reale = tappeto − offset`. `core.carpet` (Lua) riporta il giocatore al centro accumulando
  lo spostamento nell'offset. Fermarlo o romperlo permette di raggiungere la corona.
- `coronaRevealed()` è vero solo oltre il 45% del raggio: prima, il tappeto riempie la vista senza bordi.

### Rune (ADR-0002)
Un token Lua per runa; rune contigue sulla stessa riga = una riga di codice, eseguita ogni tick (le
espressioni pure ogni 10). Binding vivi: `x`, `y`, `speed`, `carpet`, `time`. Le rune generate vengono
normalizzate (`carpet.active` → `carpet . active`) e devono essere codice valido e innocuo.

### Oggetti, inventario, personaggi (ADR-0010)
- `entity` (nel mondo) e `item` (in inventario; a terra con `pickup`). Inventario: 24 slot, hotbar 1–6,
  pile, peso (capacità 20), slot impugnato (F → `on_action`), uso (`on_use`), trascinamento, posa,
  combinazione via Concilio.
- Personaggi: `persona` + `unique` nel manifest; chat libera; risposta nel personaggio + azione da un
  insieme chiuso (`segui`, `resta`, `vaga`, `dai`, `nessuna`) applicata dal kernel ed eseguita in Lua.

### Manifest (`src/kernel/types.ts`)
`id`, `name`, `kind` (`system | entity | item | player | generator | data`), `logic`, `order`,
`appearance` (`glyph`, `color`, `imagePrompt`, `sprite` = asset `img:…`, `scale`), `physics` (`solid`,
`radius`, `pushable`, `mass`, `friction`, `speed`), `components`, `singleton`, `persist`, `interaction`
(`talk | read | lua`), `spawn` (suggerimento per il Cartografo e fallback), `persona`, `unique`,
`inventory`, `item` (`stackable`, `maxStack`, `weight`, `equippable`, `controls`), `context`, `lore`,
`tags`, `drops`, `origin`, `tiles` (palette: `name`, `color` #rrggbb, `solid`, `speed`, `description`),
`fragments`.

### API Lua (prelude.lua) — l'unica disponibile, il validatore rifiuta il resto
`ecs.each/get/set/spawn/destroy/first`; `world.free/free_real/tile/speed_at/spawn/player/player_pos/
nearest/has_tag/break_entity/say/speak`; `inventory.add/remove/count/equipped`; `input.held`;
`bus.emit`; `log`/`print`; `hash`; più `math`, `string`, `table`, `utf8` (copie), `pairs`, `pcall`…
Hook dei moduli: `update(dt)` (solo sistemi), `generate_chunk(cx, cy, seed, size)`, `on_spawn(id)`,
`on_interact(id, user)`, `on_use(user, item)`, `on_action(user, target, item)`.

### Sandbox e pavimento (ADR-0003)
`guarded()` = `pcall` + budget di 2M istruzioni; `sanitize()` ripristina posizione e tappeto non finiti;
`Host.set` non tocca posizione, tappeto né i componenti centrali del giocatore.

### Versionamento (ADR-0006)
Snapshot dei file in `localStorage`; commit solo di stati validi (autori: `player`, `agent`, `dev`,
`genesis`); rollback; checkout; export/import; sincronizzazione dal disco. Le immagini stanno in
IndexedDB e i manifest le citano per hash.

## Convenzioni

- Lingua: documentazione, UI, prompt degli agenti e testi di gioco in **italiano**; identificatori e
  commenti TypeScript in **inglese**; commenti Lua dell'universo in **italiano** (finiscono nella corona).
- I prompt per il modello di immagini sono in inglese (più affidabili), con i contenuti in italiano.
- File dell'universo in LF (`.gitattributes`). Su Windows non riscrivere sorgenti con
  `Get-Content`/`Set-Content` di PowerShell 5.1 (corrompe l'UTF-8).
- Nuovo modulo scritto a mano: `universe/modules/<dominio.nome>/`; il kernel lo scopre da solo.
- Nuova API per Lua: `Host` (TS) **+** wrapper in `prelude.lua` **+** `LUA_API` nel validatore **+**
  prompt dell'Ingegnere **+** questo file.
- Nuovo compito per un agente: schema Gemini nella pipeline **+** risposta in `MockModels` (i test
  girano offline) **+** voce nel registro (`council.say`).
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.

## Costi e prestazioni (misurati)

- Genesi: ~1 minuto, ~40 chiamate di testo, ~7 immagini. Un chunk: 1 piano + 1 immagine (~5 s) + 1 rilievo.
  Una sessione di prova (Genesi + 24 chunk, ~15 dipinti, una chat): ~80 testi, ~22 immagini.
- I luoghi già generati non costano più nulla (cache IndexedDB; "Dimentica i luoghi" nella console).
- Tick ≈ 3 ms in Node con ~90 entità; il budget di istruzioni costa ~1.5× sul codice Lua.

## Stato e prossimi passi

Fatto: kernel, sandbox, rune, tappeto, corona nascosta e navigabile con editor, versionamento, Concilio
su Gemini (Genesi, chunk dipinti con continuità, Fucina con Arbitro, personaggi in chat, combinazioni,
riparazione automatica), inventario completo, fisica delle spinte, HUD, console, glitch, audio, test.

Prossimi passi suggeriti:
1. Persistenza dello stato del mondo (inventario, oggetti raccolti, memoria dei personaggi).
2. Personaggi con iniziativa (obiettivi periodici scelti dall'LLM, non solo in risposta alla chat).
3. Nella corona, spostare le rune-carattere direttamente (oggi si riscrive con l'editor).
4. Prefetch dei chunk nella direzione di marcia; ridurre il costo dei proxy JS↔Lua.
5. Multiplayer come visita dei repository altrui; poi fork/merge.
