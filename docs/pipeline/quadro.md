# Il quadro

> La pagina che l'orchestratore tiene aggiornata e che chi lo sostituisce legge per prima (`docs/pipeline/orchestra.md`).
> Il diario degli eventi è in [`orchestrazione.md`](orchestrazione.md).

Aggiornato il 30/10/2026, avvio dell'epoca 3 dell'orchestratore (gemini: argon sceso al 9 % settimanale, sotto il 10 %).

## Le priorità dell'autore

1. Il multigiocatore (T43-T45) prima del resto.
2. Il nuovo ambiente della pipeline (questo) e l'interfaccia web (**T69**, fatta e integrata in `3d`).
3. Contenere i crediti: Argon è al `9 %` settimanale (non lanciare nulla su Argon); l'autore ha chiesto di aspettare il completamento e l'integrazione di **T71** (tramite **T72**) per riavviare lo script della pipeline.

## In corso

- **T72** (urgente, `gemini`, priorità 0, stima 1 %, approvato): integrare **T71** (soglie settimanali per Argon, `ESITO: fatto` su `task/T71`) con **T69** in `tools/pipeline/pipeline.mjs` (unico file in conflitto su `integra T71`). **Appena T72 finisce:** eseguire `integra T72` e poi `integra T71` (che pulisce worktree e branch di T71), e avvisare subito l'autore così può riavviare `node tools/pipeline/pipeline.mjs orchestra`.
- **Interrotti su richiesta dell'autore (NON riprendere su Argon):** **T45a**, **T45b**, **T45c** e **T68b** (erano stati deviati su Argon quando Claude si è fermato; T68b risulta `fallito (codice 1)` per l'interruzione). Aspettano indicazioni dell'autore dopo il riavvio dello script o il reset di Claude delle `07:00 UTC`.
- **Sospesi su Claude fino alle 07:00 UTC (`08:00` locali):** **T70** (priorità 0, integrazione di T53b con il salto di T56b), **T44c** (priorità 3), **T44b** (priorità 4, blocca T45d/T45e/T45f), **T52** e **T54**; anche **T51** (che ha già una sessione Claude di T51a) aspetta Claude.
- **T53b** (strutture su più piani) è finito e verificato nel browser dall'agente, ma aspetta **T70** per risolvere i conflitti con **T56b** (il salto, già integrato, ADR-0080). Quando T70 è finito: `integra T70`, poi `integra T53b` (toglie worktree e branch).

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
