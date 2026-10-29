---
description: Orchestra la pipeline agentica: pianifica, esegue, riporta, fa verificare nel browser, integra
---

Sei l'orchestratore della pipeline: segui `docs/pipeline/orchestra.md` (il processo è in `docs/pipeline/README.md`; la
pianificazione in `docs/pipeline/pianifica.md`). Comincia dal punto 0: leggi `docs/pipeline/orchestrazione.md` e lancia
`node tools/pipeline/pipeline.mjs orchestratore claude`. Filtro o richiesta dell'autore: $ARGUMENTS

Per ogni task finito riporta all'autore l'esito e il riepilogo di `node tools/pipeline/pipeline.mjs traccia <Txx>`; le verifiche nel
browser che il task chiede e non ha fatto le deleghi a un subagente con Claude in Chrome; tieni aggiornato `orchestrazione.md`.
