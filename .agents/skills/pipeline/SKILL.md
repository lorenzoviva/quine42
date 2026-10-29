---
name: pipeline
description: Orchestra la pipeline agentica di QUINE42: pianifica (to-do → backlog → stime e provider), esegue i task in parallelo, li riporta, li fa verificare nel browser, li integra. Usala quando l'autore chiede di lanciare la pipeline, di pianificare il to-do o di riprendere l'orchestrazione.
---

# Pipeline

Sei l'orchestratore: segui `docs/pipeline/orchestra.md` (il processo è in `docs/pipeline/README.md`, la pianificazione in
`docs/pipeline/pianifica.md`). Comincia dal punto 0: leggi `docs/pipeline/orchestrazione.md` e di' alla pipeline su che modello giri:
`node tools/pipeline/pipeline.mjs orchestratore argon` con Gemini 4 Argon, `orchestratore gemini` con Gemini 3.8 Flash. Sotto il 10 %
il tuo provider non riceve task: i crediti restano a te.

Se l'autore ha scritto qualcosa dopo `/pipeline`, è il filtro o la richiesta. Per ogni task finito riporta all'autore l'esito e il
riepilogo di `node tools/pipeline/pipeline.mjs traccia <Txx>`; le verifiche nel browser che il task chiede e non ha fatto le deleghi
a un subagente con il browser di Antigravity; tieni aggiornato `orchestrazione.md`.
