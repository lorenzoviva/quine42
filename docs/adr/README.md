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
| [0011](0011-tile-e-layout-markovjunior.md) | Mappe a tile e layout con regole stile MarkovJunior | accettato; la resa è sostituita da 0040 |
| [0012](0012-contenuti-guidati-dai-dati.md) | Contenuti guidati dai dati: oggetti, bottino, ricette, bisogni, azioni | accettato |
| [0013](0013-atelier-e-individui.md) | L'Atelier (immagini in contesto) e gli NPC come individui | accettato; l'Atelier è sostituito da 0040 |
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
| [0025](0025-due-tavoli.md) | Due tavoli: il Concilio è il Dungeon Master, dentro il mondo niente meta-gioco | accettato; supera le «crepe» |
| [0026](0026-meccaniche-morte-trascendenza.md) | Meccaniche nuove (stati), morte, trascendenza, camminate valide | accettato |
| [0027](0027-studi-neon-e-atlante.md) | Studi neon-punk, sala del Concilio, atlante navigabile | accettato |
| [0028](0028-meccaniche-con-interfacce.md) | Meccaniche con interfacce: il Concilio aggiunge pannelli (slot, barre, pulsanti) | accettato |
| [0029](0029-menu-delle-caselle.md) | Menu contestuale delle caselle, azioni imparate dal terreno | accettato |
| [0030](0030-prospettiva-tre-quarti-e-scontorno.md) | Prospettiva 3/4 e scontorno delle immagini (perché il magenta) | sostituito da 0040 |
| [0031](0031-laboratorio-voxel.md) | Laboratorio voxel: MarkovJunior 3D fotografato in 3/4 (fuori dal gioco) | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0032](0032-scala-fotogrammi-strutture.md) | Laboratorio voxel: scala unica, fotogrammi dal modello, strutture a blocchi | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0033](0033-protocollo-blocchi-wfc.md) | Laboratorio voxel: protocollo tra i due scultori (catalogo, varianti, zone), WFC a bit, foto per blocchi | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0034](0034-strutture-alla-markovjunior.md) | Laboratorio voxel: strutture scritte come gli esempi di MarkovJunior (crescita, contorno, dettaglio sulla struttura intera) | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0035](0035-commissione-dei-blocchi.md) | Laboratorio voxel: l'Architetto commissiona i blocchi (pianta prima, configurazioni, vuoti di tipo diverso) | sostituito da 0038 (il laboratorio è di MarkovJunior) |
| [0036](0036-markovjunior-alla-lettera-in-3d.md) | Laboratorio voxel: MarkovJunior alla lettera (XML), modelli interi, sandbox 3D; Gemini 3.1 contro 3.8 | accettato; il formato è quello del gioco (0038) |
| [0037](0037-passaggio-al-3d.md) | Si passa al 3D: modelli MarkovJunior come asset, spazio a scale, via il 2D (attuazione nello step 9) | accettato |
| [0038](0038-laboratorio-di-markovjunior.md) | MarkovJunior nel gioco (src/mj), il laboratorio diventa il laboratorio di MarkovJunior | accettato |
| [0039](0039-registro-dei-consumi.md) | Registro dei consumi, prezzi in un file, ragionamento low, niente ripetizioni dopo un tempo scaduto | accettato |
| [0040](0040-il-gioco-in-3d.md) | Il gioco è 3D: renderer three.js, niente immagini | accettato |
| [0041](0041-asset-come-programmi.md) | Gli asset sono programmi MarkovJunior (libreria models/, forme, semi); collisione dai voxel; azioni come regole | accettato |
| [0042](0042-scultore-e-artista.md) | Lo Scultore nel Concilio (per classe, programmi indipendenti, revisione), l'Artista giudica le foto | accettato |

Modello: copia un ADR esistente, numero successivo, stato `proposto` → `accettato`.
