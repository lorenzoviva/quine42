# AGENTS.md — RUNE

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).

## Visione in breve

RUNE è un gioco 2D top-down in cui il mondo è fatto del proprio codice sorgente. Il giocatore vive
in un cerchio di simulazione; un **tappeto** compensa ogni suo passo e lo riporta sempre al centro.
Attorno, ferma e invisibile, c'è la **corona**: il codice sorgente dell'universo, cella per cella.
Nel tappeto sono sparse **rune**: token Lua veri, legati a simboli veri (`x` è la posizione X globale
del giocatore). Ciò che è scritto sul tappeto **si esegue**. Componendo frasi con le rune il giocatore
può rompere la simulazione, oppure fermare il tappeto, camminare fino alla corona e riscrivere il gioco.

Design doc originale: [`docs/design.md`](docs/design.md). Decisioni: [`docs/adr/`](docs/adr/README.md).

## Regole inviolabili

1. **Il kernel non è mai modificabile da Lua.** Il kernel è TypeScript in `src/kernel/`. Il codice
   dell'universo (moduli e rune) gira in ambienti Lua che non vedono `_G`, `debug`, `load`, `os`, `io`,
   `package`, né il prelude del kernel. Tutto ciò che Lua può toccare passa da `Host` (`src/kernel/sandbox.ts`).
2. **Ogni contenuto generato passa dal validatore** (`src/kernel/validator.ts`) prima di toccare
   l'universo. Se è invalido viene scartato e rigenerato (max 3 tentativi, poi fallback sicuro).
   **L'IA non rompe mai il gioco.** Le rune generate sono già codice attivo: devono essere valide e
   innocue così come appaiono.
3. **Il giocatore può rompere il gioco.** Il suo input non si valida per bloccarlo: si isola
   l'errore (fault), lo si mostra (glitch) e si garantisce il rollback.
4. **Stato nei componenti, logica stateless.** Le entità sono id, i componenti sono dati (vivono nel
   kernel, `src/kernel/ecs.ts`), i sistemi Lua non tengono stato fra una chiamata e l'altra. Hot reload =
   sostituzione delle funzioni; il mondo resta intatto. Mai riavviare il runtime per ricaricare.
5. **Ogni contenuto è un modulo autosufficiente** con `manifest.json`; i moduli comunicano solo
   tramite componenti ed eventi, mai con dipendenze implicite.
6. **Ogni universo è un repository.** Si committano solo stati validi; il rollback all'ultimo commit
   valido è sempre possibile (tasto `R`).
7. **Il kernel è il pavimento**: deve sopravvivere a qualunque cosa faccia Lua (NaN, nil, cicli
   infiniti, binding recisi). Se aggiungi un'API al `Host`, valida gli input e restituisci `undefined`
   (mai `null`: wasmoon tratta il risultato come possibile Promise).

## Stack

- **Vite 5 + TypeScript 5** (strict), nessun framework UI: Canvas 2D per il mondo, DOM per HUD/editor/console.
- **Lua 5.4 via [wasmoon](https://github.com/ceifa/wasmoon)** (WebAssembly), sandbox gestita dal kernel.
- **Vitest** per i test (girano in Node con la stessa wasmoon: il kernel è testabile headless).
- Persistenza: `localStorage` (repository dell'universo).

## Comandi

```bash
npm install          # dipendenze
npm run dev          # gioco su http://localhost:5173 (hot reload anche dei file in universe/)
npm test             # tutti i test (kernel headless + sandbox + validatore + perf)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build di produzione in dist/
```

URL utili in dev: `?skip` salta l'intro; `?dev&teleport=46,0` ferma il tappeto e ti porta a quelle
coordinate reali (es. nella corona). In console del browser: `window.rune` è il kernel.

## Struttura

```
src/
  main.ts               bootstrap: kernel + renderer + UI + game loop (60 Hz fisso)
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, chunk, rune, interazioni, hot reload, rollback, agente
    ecs.ts              World: entità (id), componenti (dati), query
    sandbox.ts          host wasmoon; interfaccia Host (unica superficie toccabile da Lua)
    prelude.lua         lato Lua del kernel: ambiente U, binding, budget istruzioni, guarded()
    validator.ts        manifest, Lua, contenuti dei chunk, moduli generati
    runes.ts            token, estrazione delle righe di rune
    corona.ts           mappatura deterministica corona ↔ file sorgente
    repo.ts             versionamento: commit, checkout, restore, export/import
    universe.ts         scoperta moduli e universe.json
    bundle.ts           i file di universe/ come stringhe (import.meta.glob)
    faults.ts           registro delle anomalie
    events.ts, input.ts, rng.ts, types.ts
    gateway/            gateway IA: gateway.ts (interfacce), mock.ts (provider offline)
  render/               renderer.ts (glifi su canvas), glitch.ts
  ui/                   hud.ts, editor.ts (riscrittura dalla corona), console.ts (F2)
universe/               L'UNIVERSO DI PROVA — riscrivibile dal gioco
  universe.json         nome, seme, raggio del cerchio, dimensione chunk
  prompts/              tema e prompt di generazione (chunk, moduli)
  modules/<id>/         manifest.json + logic.lua
tests/                  vitest
docs/                   design doc, ADR, immagini
```

## Architettura

### Spazi e tappeto (ADR-0004)
- **Spazio reale**: il cerchio è centrato in (0,0) e non si muove mai. La corona è un anello in spazio
  reale da `R = circleRadius` in su. Il giocatore ha `pos` in spazio reale.
- **Spazio tappeto**: terreno, entità e rune hanno coordinate del tappeto. `reale = tappeto − offset`,
  con `offset = (carpet.ox, carpet.oy)`.
- Il sistema `core.carpet` sposta ogni tick il giocatore verso (0,0) e accumula lo stesso spostamento
  nell'offset: la posizione del giocatore sul tappeto non cambia, ma in spazio reale resta al centro.
- Fermare o rompere il tappeto (infiniti modi: `carpet . active = false`, `carpet . strength = 0`,
  `carpet . rate = 0`, `carpet = nil`, `carpet . strength = - 1`…) permette di raggiungere la corona.

### Rune (ADR-0002)
- Una runa è **un token Lua** (`carpet`, `.`, `=`, `0`, …) che occupa `token.length` celle su una riga.
- Rune che si toccano in orizzontale formano una **riga**; i token si uniscono con spazi
  (`carpet . active = false`).
- Ogni riga è compilata nell'ambiente `U` come espressione (`return <riga>`) o, se non lo è, come
  istruzione. Le righe **girano ogni tick** (le espressioni pure senza chiamate ogni 10 tick: non hanno effetti).
- Errore di compilazione o di esecuzione ⇒ fault `rune:<riga>:<col>` ⇒ glitch. Il fault sparisce
  appena la riga torna valida.
- Binding vivi (in `prelude.lua`): `x`, `y`, `speed` (giocatore, scrittura validata dal kernel),
  `carpet` (componente del tappeto; riassegnarlo recide il simbolo), `time` (sola lettura: riassegnarlo
  lo congela). Documentazione dei simboli per i tooltip: `SYMBOL_DOCS` in `kernel.ts`.

### Moduli (ADR-0003)
Manifest (`src/kernel/types.ts` → `Manifest`): `id` (`dominio.nome`), `name`, `kind`
(`system | entity | player | generator | data`), `logic`, `order` (sistemi), `appearance`
(`glyph`, `color`, `imagePrompt`), `physics`, `components` (default per ogni entità), `singleton`
(componenti di un'unica entità creata al boot, es. il tappeto), `persist` (campi `componente.campo`
mantenuti al rollback), `interaction` (`talk | read | lua`), `spawn` (`tiles`, `chance`, `max`),
`prompts`, `tiles` (palette del generatore), `fragments` (catalogo rune).

`logic.lua` restituisce una tabella `M` con funzioni opzionali:
`update(dt)` (sistemi), `generate_chunk(cx, cy, seed, size)` → stringa di `size²` codici tile
(generatori), `on_spawn(id)`, `on_interact(id)` → testo.

API Lua disponibile nei moduli e nelle rune: `ecs.each("a, b", fn(id, a, b))`, `ecs.get`, `ecs.spawn`,
`ecs.destroy`, `ecs.first`, `input.held(azione)`, `world.free(x, y, r)` (tappeto),
`world.free_real(x, y, r)` (reale), `world.tile(x, y)`, `bus.emit(nome, dati)`, `log(...)`/`print`,
`hash(a, b, c, d)` (deterministico, [0,1)), più `math`, `string`, `table`, `utf8` (copie), `pairs`, `pcall`…

### Sandbox e pavimento (ADR-0003)
- Un solo stato Lua; il prelude crea `U` (ambiente dell'universo) e gli ambienti dei moduli
  (`__index = U`). Le rune girano direttamente in `U`: possono riassegnare simboli globali e rompere i
  moduli che ne dipendono. È voluto.
- Ogni chiamata nel codice dell'universo passa da `guarded()`: `pcall` + budget di 2M istruzioni
  (`debug.sethook`); superato il budget, ogni istruzione successiva fallisce (un `pcall` in un ciclo
  non può ingoiarlo).
- Dopo ogni tick `sanitize()` ripristina posizione e tappeto se diventano non finiti, e trattiene il
  giocatore entro il bordo esterno della corona.

### Generazione IA (ADR-0005)
- `AIProvider` (`gateway/gateway.ts`): `generateChunk`, `generateText`, `generateModule`,
  `generateImage` (non usato: per ora tutto è glifo). Provider attuale: `MockProvider`
  (deterministico, offline, tema medievale). Sbaglia apposta il ~15% delle prime risposte per
  esercitare il percorso "scarta e rigenera".
- Ogni chunk (20×20 celle) genera il terreno in Lua (`world.terrain`), poi chiede al gateway luogo
  e rune; risposta validata, fino a 3 tentativi, poi fallback senza rune. Massimo 1 chunk nuovo per tick.
- Vincoli delle rune generate: token validi, compilano, nessuna chiamata di funzione, istruzioni solo
  identità su simboli sicuri (`speed = speed`), dentro il chunk con margine 1, su celle non solide,
  mai a contatto con altre righe.
- L'agente (console F2 → Agente, sbloccato dopo la prima uscita) genera moduli `entity` validati,
  committati e caricati a caldo.

### Versionamento (ADR-0006)
- `Repo` salva snapshot completi dei file dell'universo in `localStorage` (`rune:repo:<nome>`), max 120 commit.
- Si committa solo uno stato valido (editor con file valido e nessun fault di caricamento; agente).
- **Rollback** (`R`): le rune incise dal giocatore tornano in mano, i file tornano a HEAD, la sandbox
  si azzera (binding recisi ripristinati), i componenti di player e singleton tornano ai default del
  manifest tranne i campi `persist`.
- Se i file su disco (`universe/`) cambiano, al boot diventano un nuovo commit ("sincronizzato dal disco").

### Rendering e "rotto" (ADR-0007)
- Tutto è glifo monospazio su griglia; chunk prerenderizzati su canvas offscreen.
- Il cerchio è un clip; la corona si disegna solo quando entra nell'inquadratura.
- Rottura visibile: intensità = f(numero di fault) → tearing, scanline, ghost cromatico, glifi
  corrotti, rune rosse che tremano, rumore audio. Anche un mondo sano ogni tanto ha una crepa di 100 ms.

## Convenzioni

- Lingua: documentazione, UI e testi di gioco in **italiano**; identificatori e commenti TypeScript
  in **inglese**; commenti Lua dell'universo in **italiano** (finiscono nella corona: sono testo di gioco).
- TypeScript strict, niente `any` dove non serve (tollerato al confine con wasmoon).
- I file dell'universo usano LF. Attenzione su Windows: non riscrivere sorgenti con
  `Get-Content`/`Set-Content` di PowerShell 5.1 (corrompe l'UTF-8).
- Nuovo modulo: cartella `universe/modules/<dominio.nome>/` con `manifest.json` (+ `logic.lua`). Nessuna
  registrazione: il kernel scopre i moduli da solo. Aggiungi un test se introduce meccaniche.
- Nuova API per Lua: aggiungila a `Host` (TS) **e** al wrapper in `prelude.lua`, documentala qui.
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.

## Prestazioni (riferimento, Node)

Tick ≈ 3 ms con ~90 entità e ~45 righe di rune; `sys.wander` è il sistema più costoso (proxy JS↔Lua
per ogni campo). Generazione terreno ≈ 5–7 ms/chunk (per questo 1 chunk per tick). Il budget di
istruzioni costa ~1.5× sul codice Lua: è il prezzo del "non si blocca mai". `tests/perf.test.ts` stampa i tempi.

## Stato e prossimi passi

Fatto (iterazione 1): kernel completo, sandbox con hot reload, rune vive, tappeto, corona navigabile
con editor, validatore, versionamento, gateway mock, agente mock, HUD, console, glitch, audio, test.

Prossimi passi suggeriti:
1. Provider IA reali dietro `AIProvider` (testo/codice: LLM; immagini: inpainting dai bordi dei chunk).
2. Nella corona, spostare le rune-carattere direttamente (oggi si riscrive con l'editor).
3. Persistenza dello stato del mondo (rune incise, entità) oltre ai file.
4. Ridurre il costo dei proxy (`ecs.each` a lotti) per mondi più popolati.
5. Multiplayer come visita dei repository altrui; poi fork/merge.

Domande aperte del design doc e risposte provvisorie: vedi [ADR-0007](docs/adr/0007-universo-di-prova-e-rottura.md).
