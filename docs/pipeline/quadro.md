# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, epoca 5 dell'orchestratore (gemini).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d`).
3. Contenere i crediti: Argon è all'`8 %` settimanale (NON lanciare né riprendere nulla su Argon); **T71** e **T72** sono completati e integrati in `3d`. L'autore può ora riavviare lo script della pipeline.

## Stato e decisioni

- **Decisioni prese**:
  - **T71 e T72 integrati in `3d`**: risolto il conflitto di merge tra T71 e T69 in `tools/pipeline/pipeline.mjs`. Soglie settimanali Argon attive (`finestra5h: false`), 42/42 test passati e typecheck verde. Worktree e branch di T71 e T72 rimossi.
  - **Argon protetto**: fermati e non ripresi su Argon **T45a**, **T45b**, **T45c** e **T68b**. Nessun task è in esecuzione su Argon.
- **Cosa si aspetta**:
  1. Il riavvio dello script da parte dell'autore (`node tools/pipeline/pipeline.mjs orchestra`).
  2. Il reset della sessione di 5 ore di Claude alle `07:00 UTC` (`08:00` locali).
- **Intenzioni al reset / ripresa**:
  1. Completare **T70** (integrazione T53b con salto T56b, priorità 0 su Claude), poi integrare T70 e T53b.
  2. Procedere con **T44c** (priorità 3) e **T44b** (priorità 4, che sblocca T45d/e/f).
  3. Riprendere i task interrotti del multigiocatore (**T45a**, **T45b**, **T45c**) e **T68b** su Claude (o Gemini dove opportuno), mai su Argon.

## Task sospesi e in attesa

- **Sospesi su Claude fino alle 07:00 UTC (`08:00` locali):** **T70** (priorità 0), **T44c** (priorità 3), **T44b** (priorità 4), **T52**, **T54** e **T51**.
- **Interrotti su richiesta dell'autore:** **T45a**, **T45b**, **T45c**, **T68b** (in attesa di ripresa su Claude/Gemini dopo le 08:00).
- **T53b** (strutture su più piani) è finito e verificato nel browser, ma aspetta **T70** per risolvere i conflitti con **T56b**. Quando T70 è finito: `integra T70`, poi `integra T53b`.

## Da fare appena possibile

- **Pianificate (30/10) le risposte dell'autore**: T51b (automa cellulare del kernel), T52a (progetto dei sotterranei come parti
  sotterranee delle strutture, profondità generata come X e Y; T52c la Sala sistemi seminterrata solo fuori), T54 (Gargantuesca
  la massima, il castello di oggi Enorme; Gargantuesca una per **reame** = 4 × 4 zone, nome scelto da me, da confermare). Tutti e
  tre approvati, priorità 50, dietro il multigiocatore (che aspetta le approvazioni dell'autore).
- **Verifiche nel browser** (un task di verifica su `claude`, che ha `--chrome`): T64 (le varianti in cache, anche IndexedDB, di
  `circuito-3D` sugli scaffali della corona, ora che ha 30 s per finire), T56b (l'arco del salto e l'ombra: l'agente ha visto solo la
  scena, poi l'estensione di Chrome si è scollegata), T69 (l'interfaccia web della pipeline: verificata dall'agente via HTTP reale, manca la vista nel browser), T53b quando finisce. I difetti della verifica di T44a e T43c sono già in **T44c**.
- **Approvati dall'autore (30/10)**: T44b, T44c, T45a, T45b, T45c, T68b, T69; restano bloccati da dipendenze T45d, T45e, T45f, T68c.

## Da sapere

- Il 30/10 sono stati corretti, fuori dalla pipeline: lo sfarfallio del bagliore (`aaacca6`: valori predefiniti degli attributi
  di WebGL, da `379636a`) e il tempo di `circuito-3D` (`32f2949`: `tempo` per modello in `models/index.json`, 30 s).
- Con tre agenti al lavoro i test vanno in timeout (l'avvio del kernel oltre 10 s): un test che fallisce nella suite intera e
  passa da solo non è un difetto del task.
- `docs/plans/multiplayer.md` è in `docs/archivio/3-to-do-backlog/plans/` (T66) ma è ancora il piano del multigiocatore.
