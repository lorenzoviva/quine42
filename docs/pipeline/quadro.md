# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, avvio epoca 9 dell'orchestratore (gemini).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline e l'interfaccia web (**T69**, integrata in `3d` e attiva su `http://localhost:4242`).
3. Argon utilizzato con moderazione: massimo 1 task alla volta (`capOf` garantisce 1 task sotto soglia, 7 % settimanale residuo).

## Stato e decisioni

- **Decisioni prese**:
  - **Script della pipeline riavviato dall'autore**: attive le soglie settimanali Argon (`finestra5h: false`) e l'interfaccia web locale su `http://localhost:4242`.
  - **Argon riattivato (1 task alla volta)**: riallineato il worktree `t45a` a `3d` e lanciato **T45a** su Argon (stima 5%, priorità 5, approvato, test headless).
  - **T45b, T45c, T68b**: restano interrotti/in attesa; nessun altro task partirà su Argon finché T45a è in corso.
- **Cosa si aspetta**:
  1. Completamento ed esito di **T45a** su Argon (in corso).
  2. Il reset della sessione di 5 ore di Claude alle `07:00 UTC` (`08:00` locali).
- **Intenzioni al reset di Claude / prossimi passi**:
  1. Completare **T70** (integrazione T53b con salto T56b, priorità 0 su Claude), poi `integra T70` e `integra T53b`.
  2. Procedere con **T44c** (priorità 3) e **T44b** (priorità 4, che sblocca T45d/e/f).
  3. Al termine di T45a, valutare il budget residuo di Argon prima di assegnare T45b (stima 6%).

## Task sospesi e in attesa

- **In corso su Argon (max 1):** **T45a** (priorità 5, crediti e spese comuni, in esecuzione nel worktree `t45a`).
- **Sospesi su Claude fino alle 07:00 UTC (`08:00` locali):** **T70** (priorità 0), **T44c** (priorità 3), **T44b** (priorità 4), **T52**, **T54** e **T51**.
- **Interrotti in attesa:** **T45b**, **T45c**, **T68b**.
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
