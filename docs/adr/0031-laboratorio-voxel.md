# ADR-0031 — Laboratorio voxel: MarkovJunior 3D fotografato in 3/4

Data: 2026-10-21 · Stato: sperimentale (fuori dal gioco)

## Contesto
Gli sprite dipinti dai modelli di immagine costano e non sono coerenti tra loro, tanto meno dopo il
passaggio al 3/4 (ADR-0030). L'autore chiede di verificare se gli agenti sanno scrivere programmi
MarkovJunior in 3D che costruiscano modelli sensati, da fotografare in 3/4 da quattro lati
([`docs/userchats/step8A.md`](../userchats/step8A.md)), senza integrare ancora nulla nel gioco.

## Decisione
- Tutto in `lab/`, pagina separata sullo stesso server (`/lab/`), che legge l'universo e non lo scrive;
  i risultati restano nel browser o in `lab/out/` (ignorata da git). Il kernel (`src/`) non cambia: il
  laboratorio ne riusa solo `Rng` e il livello dei modelli (`src/kernel/ai`).
- Motore proprio (`lab/mj3d/engine.ts`), non un'estensione di `src/kernel/mj.ts`: pattern 3D (strati
  separati da spazi), simmetrie `xy` (predefinita, la gravità resta) / `none` / `x` / `all`, nodi `one all
  prl sequence markov` come nel gioco, più `conv` e `path` di MarkovJunior e `shape` (primitive, come lo
  `stamp` del gioco), disattivabile per provare le sole regole.
- Rendering su buffer RGBA puri (stesso codice nel browser e in Node): faccia sopra + faccia frontale,
  sole a nord-ovest, ombra a sud-est, contorni; le quattro viste ruotano il modello.
- Due agenti di laboratorio, Scultore e Artista, con prompt in `lab/prompts/`; validazione e riparazione
  come per il resto del generato (l'invalido torna con il motivo).

## Esito della prova
Semplici e strutture: sì (con `gemini-3.8-flash` 17/17 e 7/7 validi al primo colpo, 11 e 4 approvati
dall'Artista); `gemini-3.1-flash-lite` scrive programmi validi ma forme più povere. Figure: non ancora
(sagome poco leggibili a 8×6×14). Dettagli in [`lab/README.md`](../../lab/README.md).

## Conseguenze
- Nessuna sul gioco. Integrarlo vorrà dire: l'ArtDirector sceglie voxel o immagine per tipo di asset, le
  viste diventano `frames`, il modello di testo dello Scultore è più forte di quello del Concilio.
- Per le figure serve uno scheletro parametrico del kernel con pose per rotazione delle parti.
- Per rimuoverlo: cancellare `lab/` e le righe che lo nominano in `vite.config.ts`, `tsconfig.json`,
  `.gitignore`.
