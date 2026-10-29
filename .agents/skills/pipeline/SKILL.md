---
name: pipeline
description: Lancia la pipeline agentica di QUINE42 (fasi 1-4): to-do → backlog → stime e provider → piano. Usala quando l'autore chiede di lanciare la pipeline o di pianificare il to-do.
---

# Pipeline

Segui `docs/pipeline/pianifica.md` (il processo è in `docs/pipeline/README.md`). Se l'autore ha scritto qualcosa dopo
`/pipeline`, è il filtro: lavora solo sulle richieste o sui task che indica.

Alla fine, se l'autore lo chiede, lancia l'esecuzione: `node tools/pipeline/pipeline.mjs esegui` (con `--sempre` resta attiva e
riprende da sola quando arrivano task nuovi o si resettano i limiti). Per ogni task finito riporta all'autore l'esito e il riepilogo di `node tools/pipeline/pipeline.mjs traccia <Txx>`.
