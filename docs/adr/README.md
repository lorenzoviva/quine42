# Registro delle decisioni (ADR)

Ogni decisione architetturale ha un ADR: contesto, decisione, conseguenze. Un ADR non si riscrive:
se una decisione cambia, se ne scrive uno nuovo che sostituisce il precedente (e si aggiorna `AGENTS.md`).

| # | Titolo | Stato |
|---|--------|-------|
| [0001](0001-stack.md) | Stack: Vite + TypeScript + Canvas 2D + Lua 5.4 (wasmoon) | accettato |
| [0002](0002-grammatica-ed-esecuzione-delle-rune.md) | Grammatica ed esecuzione delle rune | accettato |
| [0003](0003-sandbox-moduli-e-pavimento.md) | Sandbox, moduli e il kernel come pavimento | accettato |
| [0004](0004-tappeto-spazi-e-corona.md) | Tappeto, spazi di coordinate e corona | accettato |
| [0005](0005-gateway-ia-e-validazione.md) | Gateway IA e validazione | sostituito da 0008 |
| [0006](0006-versionamento.md) | Versionamento dell'universo | accettato |
| [0007](0007-universo-di-prova-e-rottura.md) | Universo di prova, resa grafica e stato "rotto" | in parte sostituito da 0008 (resa a glifi) |
| [0008](0008-concilio-degli-agenti-e-gemini.md) | Il Concilio degli agenti e Google Gemini | accettato |
| [0009](0009-corona-nascosta.md) | La corona è davvero nascosta finché il tappeto ti tiene | accettato |
| [0010](0010-oggetti-inventario-personaggi.md) | Oggetti, inventario e personaggi simulati | accettato |

Modello: copia un ADR esistente, numero successivo, stato `proposto` → `accettato`.
