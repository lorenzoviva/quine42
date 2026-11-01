# ADR-0096 — L'effetto rilievo e la terraformazione

Data: 2026-11-01 · Stato: accettato (task T57c del backlog) · Estende ADR-0014 (le azioni libere e gli effetti) e ADR-0094 (il motore dell'acqua) · Riferimenti: ADR-0015 (la magia), ADR-0048 (il rilievo)

## Contesto
Con T57a le rune magiche si compongono come programmi ordinati (`SPELL_GUIDE`, `canone.md`), con esempi di incantesimi di D&D e di terraformazione. Con T51b il kernel ha introdotto `kernel.dig(col, row, delta)` e l'automa cellulare dell'acqua (`water.ts`, ADR-0094) per scavare e alzare il suolo a livelli interi tenendo conto del flusso d'acqua. Tuttavia, l'insieme chiuso degli effetti di ADR-0014 conosceva solo `terreno {a, da, raggio}` (che cambia il tipo di casella ma non l'altezza) e non offriva alcuno strumento per cambiare il livello del suolo.

## Decisione
1. **L'effetto nell'insieme chiuso**: si aggiunge `rilievo {delta, raggio}` agli effetti validati dal kernel (`Effect` in `types.ts`, `EFFECT_TYPES`). `delta` è un intero da -8 a +8 (positivo alza, negativo abbassa o scava); `raggio` da 0 a 3 (default 1). Se `delta` è 0 l'effetto è scartato come privo di variazioni.
2. **Applicazione da parte del kernel**: in `kernel.applyEffects`, l'effetto `rilievo` individua il centro d'azione (posizione del bersaglio se presente, coordinate `at`, oppure posizione sul tappeto del viandante) e chiama `kernel.dig(cx + dx, cy + dy, delta)` per ogni casella nel cerchio discreto `dx*dx + dy*dy <= r*r + r`.
3. **Persistenza e acqua**: le modifiche al suolo sono salvate nel piano del luogo (`plan.scavi`), persistono al ricaricamento del chunk e risvegliano l'automa dell'acqua (`WaterFlow`, ADR-0094): una conca scavata vicino a uno specchio d'acqua si riempie abbassando la sorgente, una terra alzata spinge l'acqua via.
4. **Terraformazione nel Concilio**: `SPELL_GUIDE`, il canone delle rune (`world/canone.md`) e i prompt degli agenti usano `rilievo` per gli esempi di terraformazione (`terra vento terra` solleva, `vento terra vento` abbassa). L'effetto è uno strumento del kernel, non un incantesimo predefinito: quali sequenze lo usano lo decide il Concilio o «Altro…».
5. **Nessuna API Lua nuova**: coerentemente con ADR-0094, Lua non riceve un'API `world.dig`: l'effetto `rilievo` viene gestito interamente dal kernel in TypeScript all'interno di `applyEffects`.

## Conseguenze
- Incantesimi e azioni libere possono modellare l'orografia del mondo in tempo reale.
- L'effetto è compatibile con la persistenza dei luoghi e con la fisica dell'acqua introdotta in T51b.
- Nessuna rottura della sandbox Lua né esposizione di nuove primitive non protette.
