# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, prima del primo avvio di `pipeline.mjs orchestra` (scritto dalla sessione di Claude Code che lo ha costruito).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline (questo): da qui in poi la pipeline si lancia dallo script; l'interfaccia web viene dopo
   (T69, su Argon, non prioritaria).
3. Contenere i crediti: le correzioni urgenti su chi ne ha (Argon, Gemini) quando Claude è basso.

## In corso

- **T53b** (strutture su più piani) è finito e verificato nel browser dall'agente, ma `integra T53b` si è fermato sui conflitti con
  il salto di T56b (5 file di codice): la risoluzione è **T70** (claude, priorità 0, approvato), il primo lavoro di questo ambiente.
  Quando T70 è finito: `integra T70`, poi `integra T53b` (toglie worktree e branch).
- **T56b** (il salto) è integrato (ADR-0080): Spazio salta casse e acqua stretta; in multigiocatore e nella corona resta `E`
  (il messaggio `salta` del protocollo è annotato nel backlog come lavoro a parte).

## Da fare appena possibile

- **Pianificare le risposte dell'autore** (le domande hanno tutte risposta):
  - `domande/T51.md`: T51b con un **automa cellulare del kernel** (opzione 1); MarkovJunior resta per generare.
  - `domande/T52.md`: sotterranei come parti sotterranee delle strutture (b), forse poi anche (c), mai (a) da sola: la
    profondità del terreno generata con lo stesso meccanismo del Cartografo su X e Y, poche caselle sotto la più profonda
    visibile. Nella corona l'edificio seminterrato cambia solo fuori (dentro può essere diverso, è un luogo mistico).
  - `domande/T54.md`: la taglia massima è **Gargantuesca**; il castello «importante» di oggi diventa **Enorme**; stessa scala per
    creature e strutture; Enorme una per zona (56 × 56 luoghi), Gargantuesca una ogni 4 × 4 zone (serve un nome per quest'area,
    non «regione», che è dell'atlante).
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache, anche IndexedDB, di
  `circuito-3D` sugli scaffali della corona, ora che ha 30 s per finire), T56b (l'arco del salto e l'ombra: l'agente ha visto solo la
  scena, poi l'estensione di Chrome si è scollegata), T53b quando finisce. I difetti della verifica di T44a e T43c sono già in **T44c**.
- **Da approvare dall'autore**: T44c (correzioni del profilo e della morte, priorità 3), T44b (account), T45a, T45b, T45c, T68b;
  dopo di loro T45d, T45e, T45f, T68c.
- **T69** (interfaccia web della pipeline): l'autore l'ha chiesta su Argon, non prioritaria. Approvala tu (`approva T69`) quando il
  nuovo ambiente è in uso e i suoi file (`.pipeline/orchestra/`) non cambiano più.

## Da sapere

- Il 30/10 sono stati corretti, fuori dalla pipeline: lo sfarfallio del bagliore (`aaacca6`: valori predefiniti degli attributi
  di WebGL, da `379636a`) e il tempo di `circuito-3D` (`32f2949`: `tempo` per modello in `models/index.json`, 30 s).
- Con tre agenti al lavoro i test vanno in timeout (l'avvio del kernel oltre 10 s): un test che fallisce nella suite intera e
  passa da solo non è un difetto del task.
- `docs/plans/multiplayer.md` è in `docs/archivio/3-to-do-backlog/plans/` (T66) ma è ancora il piano del multigiocatore.
- `docs/img/3d/corona2.png` non è committato e nessuno lo usa: chiedere all'autore.
