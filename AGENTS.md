# AGENTS.md — RUNE

> **Unica fonte di verità per gli agenti** (Claude Code, Gemini CLI, chiunque altro).
> Leggi questo file e `docs/` prima di qualsiasi lavoro. Ogni decisione architetturale va
> registrata qui **e** in un ADR in `docs/adr/` (stesso commit).

## Visione in breve

RUNE è un gioco 2D top-down, a grafica semplice e contenuti ricchissimi, in cui il mondo è generato
da IA in ogni aspetto tranne il kernel, ed è fatto del proprio codice sorgente. Il giocatore vive in
un cerchio di simulazione; un **tappeto** compensa ogni suo passo e lo riporta al centro. Attorno,
ferma e **invisibile finché il tappeto lo tiene**, c'è la **corona**: il codice sorgente dell'universo,
un archivio di stanze (cartelle) e oggetti (file) dove si vedono lavorare gli agenti.
Un **Concilio di agenti** su Google Gemini scrive storia, ambienti, oggetti, persone e il loro codice,
e dipinge a lotti tile e sprite. Nel terreno brillano **rune**: token Lua veri, una per casella. Ciò che è
scritto sul tappeto **si esegue**: componendo frasi il giocatore può rompere la simulazione, o uscirne e
riscriverla. Alcune rune sono anche **magia**: pronunciate (T) diventano incantesimi.

Design doc originale: [`docs/design.md`](docs/design.md). Decisioni: [`docs/adr/`](docs/adr/README.md).

## Regole inviolabili

1. **Il kernel non è mai modificabile da Lua.** Il kernel è TypeScript in `src/kernel/`. Il codice
   dell'universo gira in ambienti Lua che non vedono `_G`, `debug`, `load`, `os`, `io`, `package`.
   Tutto ciò che Lua può toccare passa da `Host` (`src/kernel/sandbox.ts`).
2. **Tutto il generato passa dal validatore** (`src/kernel/validator.ts`): piani dei luoghi,
   programmi di layout (eseguiti di prova su bozze reali), oggetti, manifest, codice (compilazione, API
   esistente, caricamento di prova). L'invalido torna, con il motivo, all'agente responsabile.
   **L'IA non rompe mai il gioco**; se un modulo generato fallisce a runtime, l'Ingegnere lo ripara.
3. **Il giocatore può rompere il gioco.** Il suo input non si blocca: si isola (fault), si mostra
   (glitch), si garantisce il rollback. La riparazione automatica non tocca file modificati da lui.
4. **Stato nei componenti, logica stateless.** Hot reload = sostituzione delle funzioni.
5. **Ogni contenuto è un modulo autosufficiente** con `manifest.json`; il manifest dei moduli
   generati lo assembla il kernel (forma garantita). Gli oggetti stanno in pacchetti di dati.
6. **Ogni universo è un repository.** Si committano solo stati validi; `R` torna all'ultimo valido.
7. **Il kernel è il pavimento**: sopravvive a NaN, nil, cicli infiniti, binding recisi. Le API del
   `Host` validano gli input e restituiscono `undefined` (mai `null`).
8. **La corona è nascosta finché il tappeto funziona** (ADR-0009).
9. **La chiave API non arriva mai al browser**: passa dal proxy di Vite (`server/geminiProxy.ts`).
10. **Collisione e grafica sono la stessa griglia**: ciò che sembra invalicabile lo è; ogni luogo è
    connesso (varchi + sentieri scavati dal kernel).
11. **Testo abbondante, immagini poche e riusate**: contenuti come dati (economici); immagini a lotti.

## Stack

- **Vite 5 + TypeScript 5** (strict), Canvas 2D per il mondo, DOM per HUD/pannelli.
- **Lua 5.4 via wasmoon** (WebAssembly), sandbox gestita dal kernel.
- **Google Gemini**: `gemini-2.5-flash-lite` (testo) e `gemini-2.5-flash-image` (immagini), in
  `universe/universe.json → ai` con i budget (`maxText`, `maxImages`, `maxForges`, `maxPacks`, `animation`).
- **Vitest** in Node con modelli offline (`MockModels`): kernel, Concilio e layout testabili headless.
- Persistenza: `localStorage` (repository), IndexedDB (immagini e piani dei luoghi).

## Comandi

```bash
npm install          # dipendenze
npm run dev          # gioco su http://localhost:5173 (proxy Gemini; hot reload anche di universe/)
npm test             # test (kernel, Concilio offline, MarkovJunior, layout, validatore, contenuti, sandbox)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + build (npx vite preview la serve, proxy incluso)
```

`.env`: `GEMINI_API_KEY=...` (ignorato da git). Senza chiave o con `?offline`: modelli locali, texture e
ostacoli procedurali. URL: `?skip` salta intro e Genesi; `?dev&teleport=46,0` porta oltre il tappeto.
In console del browser: `window.rune` è il kernel (`.feed()`, `.models.usage`, `.content`).

## Struttura

```
server/geminiProxy.ts   proxy /api/gemini → Google, chiave da .env
src/
  main.ts               bootstrap: modelli, kernel, renderer, UI, loop a 60 Hz
  kernel/               IL PAVIMENTO — mai scrivibile da Lua
    kernel.ts           orchestratore: tick, luoghi, oggetti, contenitori, azioni (anche libere), effetti, magia, chat, Fucina, Genesi, rollback
    corona.ts           la corona come archivio: cartelle = stanze dell'anello, file = oggetti
    archive.ts          gli agenti del Concilio come figure nella corona
    mj.ts               motore di riscrittura stile MarkovJunior
    layout.ts           bozza → varchi → programma → sentieri garantiti → edifici
    content.ts          registro di oggetti, ricette, bottino, ambienti
    art.ts              ArtDirector: coda di lavori grafici entro il budget
    ai/                 models.ts, gemini.ts, mock.ts
    agents/             council.ts, cartography.ts, forge.ts, genesis.ts, minds.ts, content.ts, atelier.ts, effects.ts
    ecs.ts, sandbox.ts, prelude.lua, validator.ts, runes.ts, repo.ts, universe.ts,
    inventory.ts, assets.ts, imaging.ts, bundle.ts, faults.ts, events.ts, input.ts, rng.ts, types.ts
  render/               renderer.ts (tile, transizioni, ostacoli, tetti, animazioni), imagetools.ts, glitch.ts
  ui/                   hud.ts, inventory.ts (contenitori, ricette), actions.ts, chat.ts, feed.ts, genesis.ts, editor.ts, console.ts
universe/
  universe.json         nome, seme, raggio, chunk (18), modelli e budget
  world/                bible.json (memoria del Narratore), style.md, atelier.json (coppie few-shot)
  prompts/              theme.md, agents/<agente>.md
  modules/<id>/         manifest.json (+ logic.lua): sistemi, terreni, ambienti, pacchetti di oggetti, mobili, persone,
                        effetti (core.effects), fuoco (sys.fire), rune magiche e incantesimi (magic.runes, magic.spells)
tests/  docs/
```

## Il Concilio (ADR-0008, 0011, 0012, 0013, 0014, 0016)

| Agente | Fa |
|---|---|
| Narratore | bibbia; concetti dei moduli; individui dietro ogni NPC; chat nel personaggio; pacchetti di oggetti, ricette, bottino; oggetti citati; "Esamina"; combinazioni; giudica le azioni libere; dà nome agli incantesimi nuovi |
| Cartografo | terreni (con strati) e ambienti (programmi di riscrittura) alla Genesi; per ogni luogo: ambiente, nome, cosa c'è dentro e fuori, rune |
| Artista | guida di stile; texture seamless (4/immagine), ostacoli, sprite few-shot, camminate, icone (16/immagine) |
| Fisico | fisica di moduli, terreni e oggetti (pesi, pile, effetti) |
| Ingegnere | logic.lua (`on_act`, `on_use`, `on_action`…); ripara il codice che fallisce |
| Arbitro | coerenza tra narrativa, aspetto, fisica e codice; rimanda all'agente responsabile |

Registro: `kernel.feed()`, pannello Concilio (`G`) e console. Nella corona gli agenti sono figure che vanno
al file su cui lavorano, parlano tra loro, e con `E` ci si parla (possono passare richieste alla Fucina).

**Luogo** (18×18): bozza Lua continua (`g p t w r`) → piano del Cartografo (ambiente, cose `dentro`/
`fuori`/`ovunque`, oggetti `a_terra`, rune) → layout (varchi deterministici, programma con bordo
congelato, sentieri garantiti, edifici) → cose su celle raggiungibili, bottino `terreno`, rune su tratti
liberi. Il chunk (0,0) ha sempre `x`, `speed = speed` e la runa magica `luce`.

**Fucina**: concetto (tipo, contesto, aspetto, comandi, azioni, contenitore, cose portate, persona,
unicità) → fisica → codice → Arbitro → validatore → commit → bibbia; lo sprite (few-shot) e la camminata
li fa poi l'ArtDirector. **Genesi**: bibbia → stile → terreni (Fisico) → Arbitro → ambienti (provati) →
pacchetto di oggetti → cast (5 npc diversi, 5 oggetti/mobili, 2 strumenti) → commit; poi l'Artista dipinge.

## Architettura del gioco

- **Spazi, tappeto, corona** (ADR-0004, 0009): cerchio fermo in (0,0), tappeto con offset; `coronaRevealed()`.
- **Rune** (ADR-0002, 0015): un token per runa, una casella per runa (glifo), righe orizzontali eseguite ogni
  tick; binding `x y speed carpet time`. Rare; quelle del tappeto solo a ≥ 3 chunk dall'origine.
- **Magia** (ADR-0015): rune magiche `luce fuoco acqua terra vita scudo vento`; `T` pronuncia quelle in mano
  in ordine; incantesimi noti in `spells`, nuovi nominati una volta dal Narratore; costano energia.
- **Effetti** (ADR-0014): insieme chiuso (`messaggio bisogni crea_oggetto consuma distruggi apri contenitore
  terreno fuoco luce scudo spingi evoca`), validati dal kernel, applicati da `core.effects`. Usati da
  azioni libere («Altro…»), azioni imparate (`actions[].effects`) e incantesimi. Terreno cambiato persistente.
- **Giorno e notte** (ADR-0015): `daylight()`, giornata di 10 minuti; luce dai componenti `luce`.
- **Corona** (ADR-0009, 0016): archivio; stanze per cartella, file come libri/cristalli/pergamene/tavolette.
- **Mappa** (ADR-0011): tile con texture, strati `ground floor wall door liquid vegetation rock`, tetti.
- **Contenuti** (ADR-0012): `ItemDef` in pacchetti; bottino per tag; contenitori; ricette; bisogni
  (`needs` sul giocatore, `sys.needs`); uso generico in `core.items`; menu azioni (`E`).
- **Personaggi** (ADR-0010, 0013, 0017): tipo + individuo (`identity`), `mind` (memoria, umore, modo), azioni
  `segui resta vaga dai nessuna`, oggetti citati → `wanted`. Al massimo 2 dello stesso tipo nel mondo
  caricato; nuovi tipi forgiati esplorando (`ai.maxCast`); abiti e statura variano per individuo.

### Manifest (`src/kernel/types.ts`)
`id`, `name`, `kind` (`system | entity | item | player | generator | data`), `logic`, `order`,
`appearance` (`glyph`, `color`, `imagePrompt`, `sprite`, `scale`, `frames` per direzione), `physics`
(`solid`, `radius`, `pushable`, `mass`, `friction`, `speed`), `components`, `singleton`, `persist`,
`interaction` (`talk | read | lua`), `actions` (`id`, `label`, `requires`, `effects`), `container` (`size`, `loot`),
`spawn`, `persona`, `unique`, `inventory` (id di oggetti), `item`, `context`, `lore`, `tags`, `drops`,
`origin`; generatori: `tiles` (`name`, `color`, `solid`, `layer`, `indoor`, `speed`, `texture`, `sprites`),
`roof`; dati: `items`, `recipes`, `loot`, `layouts`, `fragments`, `runes`, `spells`.

### API Lua — l'unica disponibile, il validatore rifiuta il resto
`ecs.each/get/set/spawn/destroy/first`; `world.free/free_real/tile/speed_at/spawn/player/player_pos/
nearest/has_tag/break_entity/say/speak/set_tile/open/make_container`; `inventory.add/remove/count/equipped`; `items.find/def`;
`input.held`; `bus.emit`; `log`; `hash`; `math string table utf8 pairs pcall…`.
Hook: `update(dt)` (sistemi), `generate_chunk`, `on_spawn(id)`, `on_interact(id, user)`,
`on_act(id, user, action)`, `on_use(user, item)`, `on_action(user, target, item)`; `core.items.use(user, item)`;
`core.effects.apply(target, user, effect, x, y)`. Componenti noti: `luce {raggio, accesa, colore}`, `fuoco {raggio}`,
`effimero {fino}` (sparisce a tempo), `scudo {fino}`.

## Convenzioni

- Documentazione, UI, prompt degli agenti e testi di gioco in **italiano**; identificatori e commenti
  TypeScript in **inglese**; commenti Lua dell'universo in **italiano**. Prompt di immagine in inglese.
- File in LF (`.gitattributes`). Su Windows niente `Get-Content`/`Set-Content` di PowerShell 5.1 sui sorgenti.
- Nuova API per Lua: `Host` + `prelude.lua` + `LUA_API` nel validatore + prompt dell'Ingegnere + questo file.
- Nuovo compito per un agente: schema Gemini + risposta in `MockModels` + voce nel registro.
- Prima di consegnare: `npm test` e `npm run typecheck` verdi.

## Costi e prestazioni

- Testo per mondo: Genesi ~60 chiamate; poi 1 per luogo, 1-2 per individuo, ~4 per pacchetto di oggetti.
- Immagini per mondo: ~3 texture, 1-2 ostacoli, 1-2 per tipo di personaggio o oggetto (sprite +
  camminata), 1 ogni 16 icone. Nessuna immagine per luogo.
- Misurato (Genesi + ~20 luoghi + l'Artista che dipinge tutto + una chat): 127 chiamate di testo, 25 immagini
  (12 texture in 3 immagini, 9 sprite con 4 camminate, 87 icone in 6 fogli), ~5 minuti.
- Tick ≈ 5 ms in Node con ~100 entità (`sys.wander` il più costoso); budget di istruzioni Lua ~1.5×.
- Lezione ricorrente: i modelli non contano caratteri né caselle. Il kernel ripara le forme (griglie,
  regole dei programmi, nomi nelle ricette) e posiziona le cose; si scarta solo ciò che non si capisce.

## Stato e prossimi passi

Fatto: kernel, sandbox, rune (una per casella, rare), tappeto, corona nascosta e organizzata come archivio
con il Concilio che vi lavora, versionamento, Concilio su Gemini, mappe a tile senza cuciture con layout a
regole e connettività garantita, interni con tetti, contenuti come dati (pacchetti, bottino, contenitori,
ricette, bisogni), menu delle azioni con azioni libere giudicate dal Concilio e imparate dagli oggetti,
effetti, magia e incantesimi, fuoco, giorno e notte, individui con abiti propri, varietà di persone,
oggetti citati, Atelier few-shot con camminate, icone a fogli, riparazione automatica, test.

Prossimi passi suggeriti:
1. Persistenza dello stato del mondo (inventario, contenitori aperti, individui incontrati).
2. Notte con conseguenze (NPC che dormono, creature notturne); luce delle lanterne impugnate.
3. Personaggi con iniziativa (orari, mestieri, scambi tra loro) e quest generate.
4. Port più ampio di MarkovJunior (campi, WFC) per interni complessi; interni come zone separate.
5. Multiplayer come visita dei repository altrui; poi fork/merge.
