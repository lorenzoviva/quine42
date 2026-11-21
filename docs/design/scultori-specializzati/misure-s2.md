# Il prompt dello Scultore, richiesta per richiesta (T458, T468)

Scritto da `npx vite-node lab/scripts/prompt-tokens.ts -- --scultore --conta --universi ../step8.2A-lab3d/universes --prima docs/design/scultori-specializzati/misure-s1.json --md docs/design/scultori-specializzati/misure-s2.md --json docs/design/scultori-specializzati/misure-s2.json` il 2026-11-21, kernel 0.10.16: nessuna chiamata ai modelli (`countTokens` è gratis). Lo studio è [`../scultori-specializzati.md`](../scultori-specializzati.md).

Token: countTokens di Gemini (gemini-3.1-flash-lite). Risorse di models/ nella richiesta (tileset, campioni, regole da file): 0.

### Le richieste, una per tipo

| tipo | specialità | modello (Google, oggi) | sistema | di cui ruolo | di cui sezione | di cui esempi | principi, lingua, stile | richiesta | non serve | quota del totale | sistema prima | differenza | esempi della libreria |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| pebble | landscaper | gemini-3.1-flash-lite | 4408 | 2856 | 208 | 637 | 708 | 47 | 132 | 3 % | 6551 | -2143 | pebble |
| rock | landscaper | gemini-3.1-flash-lite | 4489 | 2856 | 208 | 718 | 708 | 56 | 132 | 3 % | 6632 | -2143 | rock |
| bush | landscaper | gemini-3.1-flash-lite | 4379 | 2856 | 208 | 608 | 708 | 53 | 136 | 3 % | 6522 | -2143 | bush |
| tree | landscaper | gemini-3.1-flash-lite | 4775 | 2856 | 208 | 1004 | 708 | 50 | 125 | 3 % | 6918 | -2143 | tree |
| object | joiner | gemini-3.1-flash-lite | 4029 | 2856 | 172 | 294 | 708 | 44 | 105 | 3 % | 6208 | -2179 | forbici |
| object-tinted | joiner | gemini-3.1-flash-lite | 4029 | 2856 | 172 | 294 | 708 | 71 | 38 | 1 % | 6208 | -2179 | forbici |
| object-worn | tailor | gemini-3.1-flash-lite | 4503 | 2856 | 646 | 294 | 708 | 72 | 67 | 1 % | 6208 | -1705 | forbici |
| furniture | joiner | gemini-3.1-flash-lite | 4981 | 2856 | 172 | 1246 | 708 | 50 | 108 | 2 % | 7160 | -2179 | furniture |
| person | figurist | gemini-3.8-flash | 5149 | 2856 | 264 | 1322 | 708 | 58 | 100 | 2 % | 7236 | -2087 | person |
| animal | figurist | gemini-3.8-flash | 5085 | 2856 | 264 | 1258 | 708 | 47 | 99 | 2 % | 7172 | -2087 | animal |
| beast | figurist | gemini-3.8-flash | 6600 | 2856 | 264 | 2773 | 708 | 50 | 105 | 2 % | 8687 | -2087 | beast |
| monument | mason | gemini-4-argon | 5064 | 2856 | 240 | 1261 | 708 | 55 | 165 | 3 % | 7175 | -2111 | monument |
| building | mason | gemini-4-argon | 5928 | 2856 | 240 | 2125 | 708 | 55 | 161 | 3 % | 8039 | -2111 | building |
| structure-medium | mason | gemini-4-argon | 5928 | 2856 | 240 | 2125 | 708 | 77 | 88 | 1 % | 8039 | -2111 | building |
| structure-large | architect | gemini-4-argon | 5603 | 4895 | 0 | 0 | 708 | 1358 | 0 | 0 % | 5603 | 0 | — |
| structure-fort | architect | gemini-4-argon | 5603 | 4895 | 0 | 0 | 708 | 1619 | 0 | 0 % | 5603 | 0 | — |
| vessel | coachbuilder | gemini-4-argon | 5185 | 2856 | 551 | 1071 | 708 | 334 | 0 | 0 % | 6985 | -1800 | vessel |
| action | actions | gemini-3.1-flash-lite | 2352 | 1473 | 172 | 0 | 708 | 1461 | 173 | 5 % | 5915 | -3563 | — |

### Le parti del nucleo, delle sezioni e del prompt dell’Architetto

| dove | parte | token | chi la legge e la usa |
|---|---|---:|---|
| nucleo | intro | 153 | tutti quelli che la leggono (15) |
| nucleo | coordinates | 189 | tutti quelli che la leggono (15) |
| nucleo | program | 94 | tutti quelli che la leggono (15) |
| nucleo | palette | 411 | tutti quelli che la leggono (15) |
| nucleo | palette.colours | 168 | tutti quelli che la leggono (15) |
| nucleo | patterns | 220 | tutti quelli che la leggono (15) |
| nucleo | nodes | 726 | tutti quelli che la leggono (15) |
| nucleo | look.field | 42 | tutti quelli che la leggono (15) |
| nucleo | look.observe | 38 | tutti quelli che la leggono (15) |
| nucleo | look.children | 195 | tutti quelli che la leggono (15) |
| nucleo | sculpt | 532 | tutti quelli che la leggono (15) |
| nucleo | traps | 96 | tutti quelli che la leggono (15) |
| sezione landscaper | class:pebble | 43 | pebble (su 4: pebble, rock, bush, tree) |
| sezione landscaper | class:rock | 43 | rock (su 4: pebble, rock, bush, tree) |
| sezione landscaper | class:bush | 39 | bush (su 4: pebble, rock, bush, tree) |
| sezione landscaper | class:tree | 50 | tree (su 4: pebble, rock, bush, tree) |
| sezione landscaper | trade:landscaper | 34 | tutti quelli che la leggono (4) |
| sezione joiner | class:object | 41 | object, object-tinted (su 4: object, object-tinted, furniture, action) |
| sezione joiner | class:furniture | 38 | furniture (su 4: object, object-tinted, furniture, action) |
| sezione joiner | trade:joiner | 27 | object, object-tinted, furniture (su 4: object, object-tinted, furniture, action) |
| sezione joiner | colour | 67 | object-tinted (su 4: object, object-tinted, furniture, action) |
| sezione tailor | class:object | 41 | tutti quelli che la leggono (1) |
| sezione tailor | trade:tailor | 37 | tutti quelli che la leggono (1) |
| sezione tailor | worn | 503 | tutti quelli che la leggono (1) |
| sezione tailor | colour | 67 | nessuno (su 1: object-worn) |
| sezione figurist | class:person | 52 | person (su 3: person, animal, beast) |
| sezione figurist | class:animal | 53 | animal (su 3: person, animal, beast) |
| sezione figurist | class:beast | 47 | beast (su 3: person, animal, beast) |
| sezione figurist | program.limbs | 61 | tutti quelli che la leggono (3) |
| sezione figurist | sculpt.people | 28 | tutti quelli che la leggono (3) |
| sezione figurist | trade:figurist | 24 | tutti quelli che la leggono (3) |
| sezione mason | class:monument | 42 | monument (su 3: monument, building, structure-medium) |
| sezione mason | class:building | 46 | building (su 3: monument, building, structure-medium) |
| sezione mason | class:structure | 58 | structure-medium (su 3: monument, building, structure-medium) |
| sezione mason | sizes | 61 | structure-medium (su 3: monument, building, structure-medium) |
| sezione mason | trade:mason | 34 | tutti quelli che la leggono (3) |
| architect | intro | 140 | tutti quelli che la leggono (2) |
| architect | What matters most: the composition comes from the concept | 239 | tutti quelli che la leggono (2) |
| architect | The measure of «done well»: the reference fort | 288 | tutti quelli che la leggono (2) |
| architect | The method: three levels, one program | 584 | tutti quelli che la leggono (2) |
| architect | A. The composition (the plan, a cell a third of a tile) | 1199 | tutti quelli che la leggono (2) |
| architect | What fits: the size decides what is built, not how big | 665 | tutti quelli che la leggono (2) |
| architect | B. The heights: columns by steps | 526 | tutti quelli che la leggono (2) |
| architect | C. The full scale: the doors, the parts, the facades | 869 | tutti quelli che la leggono (2) |
| architect | What the game checks on every seed, at both sizes | 182 | tutti quelli che la leggono (2) |
| architect | How to answer, block by block | 212 | tutti quelli che la leggono (2) |
| sezione coachbuilder | class:vessel | 69 | tutti quelli che la leggono (1) |
| sezione coachbuilder | trade:coachbuilder | 25 | tutti quelli che la leggono (1) |
| sezione coachbuilder | vessels | 458 | tutti quelli che la leggono (1) |
| nucleo delle azioni | intro | 153 | tutti quelli che la leggono (1) |
| nucleo delle azioni | coordinates | 189 | tutti quelli che la leggono (1) |
| nucleo delle azioni | program | 94 | tutti quelli che la leggono (1) |
| nucleo delle azioni | patterns | 220 | tutti quelli che la leggono (1) |
| nucleo delle azioni | nodes | 726 | tutti quelli che la leggono (1) |
| nucleo delle azioni | traps | 96 | tutti quelli che la leggono (1) |
| **nucleo** | | **2856** | ogni mestiere tranne l’Architetto |
| **nucleo delle azioni** | | **1473** | le azioni |
| **sezione landscaper** (Paesaggista) | | **208** | |
| **sezione joiner** (Mobiliere) | | **172** | |
| **sezione tailor** (Sarto) | | **646** | |
| **sezione figurist** (Figurinista) | | **264** | |
| **sezione mason** (Capomastro) | | **240** | |
| **sezione coachbuilder** (Carrozziere) | | **551** | |
| **prompt dell’Architetto** | | **4895** | le strutture che crescono a regole |

Principi del Concilio 507, blocco «Lingua» 128, contesto dello Scultore (guida di stile della Genesi offline) 73 token.

### Il risparmio

Ripartizione del lavoro dello Scultore (modelli scolpiti negli universi veri, aurora, mesa, neapolis, orichalcum, sidera): pebble 0, rock 2, bush 0, tree 7, object 3, object-tinted 84, object-worn 4, furniture 100, person 75, animal 1, beast 0, monument 27, building 71, structure-medium 5, structure-large 49, structure-fort 0, vessel 0; 1.91 chiamate a modello. Un'ora della lobby (HOUR, manopole a 1): 51 chiamate di «Modelli nuovi», 26.5 modelli. La Genesi offline chiede 11 modelli (object 1, furniture 1, object-tinted 4, person 1, tree 2, rock 2). «Tolti rispetto a prima»: il sistema di ogni richiesta contro quello di `docs/design/scultori-specializzati/misure-s1.json`.

| via | ciò che non serve ancora, $ a chiamata (media pesata) | token che non servono ancora, a chiamata | token tolti rispetto a prima, a chiamata | $ tolti a chiamata | $ tolti per Genesi | $ tolti per ora di gioco | $ per ora di gioco di ciò che non serve | quota della spesa dello Scultore l’ora | gli esempi, $ l’ora | lo Scultore l’ora nella stima della lobby, $ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Google, oggi | 0.0000 | 83 | 1755 | 0.0007 | 0.0073 | 0.035 | 0.0021 | 0 % | 0.025 | 1.589 |
| Google, dall’1/12 | 0.0001 | 83 | 1755 | 0.0010 | 0.0073 | 0.052 | 0.0034 | 0 % | 0.041 | 2.746 |
| OpenRouter, dall’1/12 | 0.0001 | 83 | 1755 | 0.0010 | 0.0073 | 0.052 | 0.0034 | 0 % | 0.041 | 2.746 |

### Gli esempi di ogni richiesta, nel seme e negli universi veri (T467)

Prima: i primi due programmi della famiglia, quelli a mano davanti. Dopo (`examplesFor`): un modello a mano del seme della classe (il generico per primo, nella scatola della richiesta) e, se c’è, il migliore dell’universo della stessa classe, taglia e densità con voto ≥ 6 (il voto fra parentesi). Ogni cella: gli esempi, poi i token della loro sezione.

| tipo | seme, prima | seme, dopo | aurora, prima | aurora, dopo | mesa, prima | mesa, dopo | neapolis, prima | neapolis, dopo | orichalcum, prima | orichalcum, dopo | sidera, prima | sidera, dopo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pebble | pebble + rock: 1346 | pebble: 637 | pebble + rock: 1346 | pebble: 637 | pebble + rock: 1346 | pebble: 637 | pebble + rock: 1346 | pebble: 637 | pebble + rock: 1346 | pebble: 637 | pebble + rock: 1346 | pebble: 637 |
| rock | rock + masso-muschioso: 1394 | rock: 718 | rock + masso-muschioso: 1394 | rock: 718 | rock + masso-muschioso: 1394 | rock: 718 | rock + masso-muschioso: 1394 | rock: 718 | rock + masso-muschioso: 1394 | rock: 718 | rock + sidera-cristallo: 1994 | rock: 718 |
| bush | bush + cespuglio-con-bacche: 1226 | bush: 608 | bush + cespuglio-con-bacche: 1226 | bush: 608 | bush + cespuglio-con-bacche: 1226 | bush: 608 | bush + cespuglio-con-bacche: 1226 | bush: 608 | bush + cespuglio-con-bacche: 1226 | bush: 608 | bush + sidera-felce-spirale: 1999 | bush: 608 |
| tree | tree + quercia: 2229 | tree: 1004 | tree + quercia: 2229 | tree: 1004 | tree + quercia: 2229 | tree + terreno-cactus-fitti (6): 2917 | tree + quercia: 2229 | tree: 1004 | tree + quercia: 2229 | tree: 1004 | tree + sidera-albero-vetro: 2574 | tree: 1004 |
| object | object + forbici: 933 | forbici: 294 | object + forbici: 509 | object: 224 | object + forbici: 933 | forbici + shape-tool (7): 732 | object + forbici: 933 | forbici + shape-blade (7): 755 | object + forbici: 933 | chiave-inglese + shape-bottle (7): 1656 | circuito-3D + corona-drone: 10.351 | sidera-drone + shape-blade (6): 1821 |
| object-tinted | object + forbici: 933 | forbici: 294 | object + forbici: 509 | object: 224 | object + forbici: 933 | forbici + shape-tool (7): 732 | object + forbici: 933 | forbici + shape-blade (7): 755 | object + forbici: 933 | chiave-inglese + shape-bottle (7): 1656 | circuito-3D + corona-drone: 10.351 | sidera-drone + shape-blade (6): 1821 |
| object-worn | object + forbici: 933 | forbici: 294 | object + forbici: 509 | object: 224 | object + forbici: 933 | forbici: 294 | object + forbici: 933 | forbici: 294 | object + forbici: 933 | chiave-inglese: 1228 | circuito-3D + corona-drone: 10.351 | sidera-drone: 1198 |
| furniture | barile + falo: 2340 | furniture: 1246 | barile + falo: 2340 | furniture + letto (7): 2090 | barile + falo: 2340 | furniture + obj-branda-da-ferroviere (6): 2390 | barile + falo: 2340 | furniture + banco-officina (6): 2412 | barile + falo: 2340 | furniture + valvola-manometro (6): 2143 | corona-lampione + furniture: 12.636 | furniture + sidera-estrattore-plasma (6): 2465 |
| person | viandante + contadina: 5308 | person: 1322 | viandante + person: 3723 | person + contadina (6): 2770 | viandante + contadina: 5308 | person + npc-cestaia (6): 3518 | viandante + contadina: 5308 | person + neapolis-cittadino (6): 2417 | viandante + contadina: 5308 | person + npc-fuochista (6): 3412 | corona-gerboa-musician + person: 6789 | person + sidera-colono (6): 2334 |
| animal | animal + viandante: 3659 | animal: 1258 | animal + viandante: 3659 | animal: 1258 | animal + npc-fumo (5): 2796 | animal: 1258 | animal + viandante: 3659 | animal: 1258 | animal + viandante: 3659 | animal: 1258 | animal + corona-gerboa-musician: 6725 | animal: 1258 |
| beast | beast + animal: 4022 | beast: 2773 | beast + animal: 4022 | beast: 2773 | beast + animal: 4022 | beast: 2773 | beast + animal: 4022 | beast: 2773 | beast + animal: 4022 | beast: 2773 | beast + animal: 4022 | beast: 2773 |
| monument | monument + corona-totem: 6682 | monument: 1261 | monument + corona-totem: 6682 | monument: 1261 | monument + corona-totem: 6682 | monument: 1261 | monument + lampione: 1661 | monument: 1261 | monument + telegrafo-pneumatico: 3660 | monument: 1261 | monument + sidera-camera-equilibrio: 2871 | monument: 1261 |
| building | pozzo + building: 4379 | building: 2125 | building + pozzo (6): 3376 | building + pozzo (6): 3376 | pozzo + building: 4379 | building: 2125 | pozzo + building: 4379 | building: 2125 | pozzo + building: 4379 | building + caldaia-vapore (7): 3515 | building + sidera-cupola: 4254 | building + casa-comune-building-052c7ac8 (6): 3914 |
| structure-medium | structure + fattoria: 6317 | building: 2125 | structure + fattoria: 6317 | building: 2125 | structure + fattoria: 6317 | building: 2125 | structure + fattoria: 6317 | building + struttura-bistrot-medium (7): 6733 | structure + fattoria: 6317 | building + obj-argano-a-vapore-d-ormegg (6): 7164 | structure + part-stair: 5484 | building: 2125 |
| structure-large | — | — | — | — | — | — | — | — | — | — | — | — |
| structure-fort | — | — | — | — | — | — | — | — | — | — | — | — |
| vessel | vessel + capsule: 2014 | vessel: 1071 | — | — | — | — | — | — | — | — | — | — |

| via | seme, prima | seme, dopo | aurora, prima | aurora, dopo | mesa, prima | mesa, dopo | neapolis, prima | neapolis, dopo | orichalcum, prima | orichalcum, dopo | sidera, prima | sidera, dopo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Google, oggi, gli esempi in $ l’ora | 0.075 | 0.025 | 0.060 | 0.041 | 0.075 | 0.039 | 0.064 | 0.035 | 0.068 | 0.049 | 0.100 | 0.044 |
| Google, dall’1/12, gli esempi in $ l’ora | 0.116 | 0.041 | 0.096 | 0.063 | 0.116 | 0.054 | 0.095 | 0.052 | 0.103 | 0.074 | 0.133 | 0.070 |
| OpenRouter, dall’1/12, gli esempi in $ l’ora | 0.116 | 0.041 | 0.096 | 0.063 | 0.116 | 0.054 | 0.095 | 0.052 | 0.103 | 0.074 | 0.133 | 0.070 |
| token di esempi a chiamata (media pesata) | 2528 | 936 | 2084 | 1491 | 2526 | 1646 | 2279 | 1514 | 2378 | 1972 | 7161 | 1943 |

### Le specialità: ciò che leggono

| specialità | richieste | ruolo e sezione | di cui non serve (la richiesta che ne usa meno) | ruolo di prima | differenza |
|---|---|---:|---:|---:|---:|
| landscaper (Paesaggista) | pebble, rock, bush, tree | 3064 | 136 | 5207 | -2143 |
| joiner (Mobiliere) | object, object-tinted, furniture | 3028 | 108 | 5207 | -2179 |
| tailor (Sarto) | object-worn | 3502 | 67 | 5207 | -1705 |
| figurist (Figurinista) | person, animal, beast | 3120 | 105 | 5207 | -2087 |
| mason (Capomastro) | monument, building, structure-medium | 3096 | 165 | 5207 | -2111 |
| architect (Architetto) | structure-large, structure-fort | 4895 | 0 | 4895 | 0 |
| coachbuilder (Carrozziere) | vessel | 3407 | 0 | 5207 | -1800 |
| actions (le azioni) | action | 1645 | 173 | 5207 | -3562 |

### I candidati del few-shot

| esempio | caratteri | token |
|---|---:|---:|
| il forte dell’autore, intero (forte-handmade.xml) | 25.949 | 10.354 |
| il forte: il ciclo che allarga il mastio (<markov> con l’uscita z) | 329 | 131 |
| il forte: il cortile a bracci che si fermano a caso (il primo <markov>) | 352 | 118 |
| il forte: i piani del mastio, uno dopo l’altro finché il 50 % lo ferma | 2865 | 1125 |
| il forte: le viste in testo (forte-v1-viste.txt) | 14.445 | 2894 |
| riferimento del banco: forte.xml | 24.768 | 9652 |
| riferimento del banco: palazzina.xml | 25.820 | 10.283 |
| riferimento del banco: tempio.xml | 14.389 | 6453 |
| riferimento del banco: cantiere.xml | 9076 | 3758 |
| riferimento del banco: cantina.xml | 10.876 | 4503 |
| la villetta offline (MOCK_STRUCTURE_PROGRAM) | 12.494 | 4441 |
| parte del seme: part-battlements.xml | 1991 | 743 |
| parte del seme: part-cellar.xml | 8651 | 4408 |
| parte del seme: part-door.xml | 1989 | 707 |
| parte del seme: part-slits.xml | 2096 | 817 |
| parte del seme: part-stair.xml | 6228 | 2797 |

### I migliori degli universi per voto dell’Artista (un esempio per classe)

| classe | modello | universo | voto | autore | token |
|---|---|---|---:|---|---:|
| building | caldaia-vapore | orichalcum | 7 | claude-opus-5-5 | 1391 |
| furniture | letto | aurora | 7 | claude-opus-5-5 | 845 |
| object | shape-blade | neapolis | 7 | gemini-3.1-flash-lite | 462 |
| structure | struttura-bistrot-medium | neapolis | 7 | gemini-4-argon | 4609 |
| person | contadina | aurora | 6 | claude-opus-5-5 | 1449 |
| tree | terreno-cactus-fitti | mesa | 6 | gemini-3.1-flash-lite | 1914 |
| animal | npc-fumo | mesa | 5 | gemini-3.8-flash | 1539 |
| rock | terreno-parete-di-canyon | mesa | 5 | gemini-3.1-flash-lite | 652 |

Modelli con un voto: 211; il voto medio 5.1, da 7 in su 12.

Classi del gioco: pebble, rock, bush, tree, object, furniture, person, animal, beast, monument, building, structure, vessel.
