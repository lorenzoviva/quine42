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
| [0008](0008-concilio-degli-agenti-e-gemini.md) | Il Concilio degli agenti e Google Gemini | accettato; la pittura per chunk è sostituita da 0011 |
| [0009](0009-corona-nascosta.md) | La corona è davvero nascosta finché il tappeto ti tiene | accettato |
| [0010](0010-oggetti-inventario-personaggi.md) | Oggetti, inventario e personaggi simulati | accettato |
| [0011](0011-tile-e-layout-markovjunior.md) | Mappe a tile e layout con regole stile MarkovJunior | accettato |
| [0012](0012-contenuti-guidati-dai-dati.md) | Contenuti guidati dai dati: oggetti, bottino, ricette, bisogni, azioni | accettato |
| [0013](0013-atelier-e-individui.md) | L'Atelier (immagini in contesto) e gli NPC come individui | accettato |
| [0014](0014-azioni-libere-ed-effetti.md) | Azioni libere («Altro…») e il motore degli effetti | accettato |
| [0015](0015-rune-magia-giorno-notte.md) | Una runa per casella, magia, incantesimi, giorno e notte | accettato |
| [0016](0016-corona-archivio-e-concilio.md) | La corona come archivio, il Concilio in carne e ossa | accettato |
| [0017](0017-varieta-delle-persone.md) | Varietà delle persone | accettato |
| [0018](0018-rune-oggetto-mana-borse.md) | Rune come oggetti, frase, mana e cristalli, borse nell'inventario | accettato |
| [0019](0019-decisioni-regole.md) | Le decisioni del Concilio diventano regole | accettato |
| [0020](0020-societa-degli-npc.md) | La società degli NPC | accettato |
| [0021](0021-due-repository.md) | Due repository: il kernel (seme) e l'universo (su disco) | accettato |
| [0022](0022-corona-studio-e-referente.md) | La corona come studio, il Referente, il viandante trasceso | accettato; sostituisce la disposizione di 0016 |
| [0023](0023-geografia-atlante-timbri.md) | Geografia: biomi, atlante, timbri di strutture | accettato |
| [0024](0024-vita-degli-npc.md) | La vita degli NPC: attività, dialoghi, ricordi, trame, famiglia | accettato |

Modello: copia un ADR esistente, numero successivo, stato `proposto` → `accettato`.
