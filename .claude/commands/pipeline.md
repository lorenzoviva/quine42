---
description: Pianifica la pipeline a mano (to-do → backlog → stime): di solito la orchestra lo script, `pipeline.mjs orchestra`
---

La pipeline si lancia di solito dallo script: `node tools/pipeline/pipeline.mjs orchestra` (ADR-0079, `docs/pipeline/README.md`),
che ha il suo orchestratore e la sua chat. Se l'autore ti chiede di lanciarla, diglielo e non lanciarla da qui: un `esegui` che
gira in questa sessione si ferma con lei.

Qui, se l'autore lo chiede, fai a mano le fasi 1-4: segui `docs/pipeline/pianifica.md` (e le regole di `docs/pipeline/orchestra.md`:
leggi il quadro `docs/pipeline/quadro.md`, deleghi il lavoro come task, non lo fai). Filtro o richiesta dell'autore: $ARGUMENTS
