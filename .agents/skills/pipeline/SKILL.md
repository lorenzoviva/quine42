---
name: pipeline
description: Pianifica a mano la pipeline agentica di QUINE42 (to-do → backlog → stime e provider). Di solito la pipeline la orchestra lo script `node tools/pipeline/pipeline.mjs orchestra`, che ha il suo orchestratore e la sua chat. Usala quando l'autore chiede di pianificare il to-do da Antigravity.
---

# Pipeline

La pipeline si lancia di solito dallo script: `node tools/pipeline/pipeline.mjs orchestra --agente argon` per orchestrare con Gemini 4
Argon (ADR-0079, `docs/pipeline/README.md`). Se l'autore ti chiede di lanciarla, diglielo e non lanciarla da qui.

Qui, se l'autore lo chiede, fai a mano le fasi 1-4: segui `docs/pipeline/pianifica.md` con le regole di `docs/pipeline/orchestra.md`
(leggi il quadro `docs/pipeline/quadro.md`, deleghi il lavoro come task, non lo fai). Se l'autore ha scritto qualcosa dopo `/pipeline`,
è il filtro o la richiesta.
