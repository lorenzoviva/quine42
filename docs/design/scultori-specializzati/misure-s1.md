# Il prompt dello Scultore, richiesta per richiesta (T458)

Scritto da `npx vite-node lab/scripts/prompt-tokens.ts -- --scultore --conta --universi ../step8.2A-lab3d/universes --md docs/design/scultori-specializzati/misure-s1.md --json docs/design/scultori-specializzati/misure-s1.json` il 2026-11-21, kernel 0.10.15: nessuna chiamata ai modelli (`countTokens` è gratis). Lo studio è [`../scultori-specializzati.md`](../scultori-specializzati.md).

Token: countTokens di Gemini (gemini-3.1-flash-lite). Risorse di models/ nella richiesta (tileset, campioni, regole da file): 0.

### Le richieste, una per tipo

| tipo | specialità | modello (Google, oggi) | sistema | di cui ruolo | di cui esempi | principi, lingua, stile | richiesta | non serve | quota del totale | esempi della libreria |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| pebble | landscaper | gemini-3.1-flash-lite | 6551 | 5207 | 637 | 708 | 47 | 2109 | 32 % | pebble |
| rock | landscaper | gemini-3.1-flash-lite | 6632 | 5207 | 718 | 708 | 56 | 2109 | 32 % | rock |
| bush | landscaper | gemini-3.1-flash-lite | 6522 | 5207 | 608 | 708 | 53 | 2113 | 32 % | bush |
| tree | landscaper | gemini-3.1-flash-lite | 6918 | 5207 | 1004 | 708 | 50 | 2102 | 30 % | tree |
| object | joiner | gemini-3.1-flash-lite | 6208 | 5207 | 294 | 708 | 44 | 2111 | 34 % | forbici |
| object-tinted | joiner | gemini-3.1-flash-lite | 6208 | 5207 | 294 | 708 | 71 | 2043 | 33 % | forbici |
| object-worn | tailor | gemini-3.1-flash-lite | 6208 | 5207 | 294 | 708 | 72 | 1608 | 26 % | forbici |
| furniture | joiner | gemini-3.1-flash-lite | 7160 | 5207 | 1246 | 708 | 50 | 2114 | 29 % | furniture |
| person | figurist | gemini-3.8-flash | 7236 | 5207 | 1322 | 708 | 58 | 2012 | 28 % | person |
| animal | figurist | gemini-3.8-flash | 7172 | 5207 | 1258 | 708 | 47 | 2011 | 28 % | animal |
| beast | figurist | gemini-3.8-flash | 8687 | 5207 | 2773 | 708 | 50 | 2017 | 23 % | beast |
| monument | mason | gemini-4-argon | 7175 | 5207 | 1261 | 708 | 55 | 2110 | 29 % | monument |
| building | mason | gemini-4-argon | 8039 | 5207 | 2125 | 708 | 55 | 2106 | 26 % | building |
| structure-medium | mason | gemini-4-argon | 8039 | 5207 | 2125 | 708 | 77 | 2033 | 25 % | building |
| structure-large | architect | gemini-4-argon | 5603 | 4895 | 0 | 708 | 1358 | 0 | 0 % | — |
| structure-fort | architect | gemini-4-argon | 5603 | 4895 | 0 | 708 | 1619 | 0 | 0 % | — |
| vessel | coachbuilder | gemini-4-argon | 6985 | 5207 | 1071 | 708 | 334 | 1625 | 22 % | vessel |
| action | actions | gemini-3.1-flash-lite | 5915 | 5207 | 0 | 708 | 1461 | 3175 | 43 % | — |

### Le parti del prompt generale (prima di `<!-- strutture -->`)

| parte | token | chi la usa |
|---|---:|---|
| intro | 153 | tutti |
| class:pebble | 43 | pebble |
| class:rock | 43 | rock |
| class:bush | 39 | bush |
| class:tree | 50 | tree |
| class:object | 41 | object, object-tinted, object-worn |
| class:furniture | 38 | furniture |
| class:person | 52 | person |
| class:animal | 53 | animal |
| class:beast | 47 | beast |
| class:monument | 42 | monument |
| class:building | 46 | building |
| class:structure | 58 | structure-medium |
| class:vessel | 69 | vessel |
| sizes | 61 | structure-medium |
| coordinates | 189 | tutti |
| program.limbs | 60 | person, animal, beast |
| palette | 411 | pebble, rock, bush, tree, object, object-tinted, object-worn, furniture, person, animal, beast, monument, building, structure-medium, vessel |
| program | 254 | tutti |
| patterns | 220 | tutti |
| nodes | 662 | tutti |
| look.field | 42 | pebble, rock, bush, tree, object, object-tinted, object-worn, furniture, person, animal, beast, monument, building, structure-medium, vessel |
| look.observe | 38 | pebble, rock, bush, tree, object, object-tinted, object-worn, furniture, person, animal, beast, monument, building, structure-medium, vessel |
| look.wfc | 45 | nessuno |
| look.convchain | 45 | nessuno |
| look.import | 44 | nessuno |
| look.children | 470 | tutti |
| colour | 68 | object-tinted |
| sculpt.people | 28 | person, animal, beast |
| sculpt | 532 | pebble, rock, bush, tree, object, object-tinted, object-worn, furniture, person, animal, beast, monument, building, structure-medium, vessel |
| showcase | 219 | nessuno |
| traps | 97 | tutti |
| worn | 503 | object-worn |
| vessels | 458 | vessel |
| **prompt generale** | **5207** | |

### Il prompt delle strutture che crescono a regole (dopo `<!-- strutture -->`)

| sezione | token |
|---|---:|
| intro | 140 |
| What matters most: the composition comes from the concept | 239 |
| The measure of «done well»: the reference fort | 288 |
| The method: three levels, one program | 584 |
| A. The composition (the plan, a cell a third of a tile) | 1199 |
| What fits: the size decides what is built, not how big | 665 |
| B. The heights: columns by steps | 526 |
| C. The full scale: the doors, the parts, the facades | 869 |
| What the game checks on every seed, at both sizes | 182 |
| How to answer, block by block | 212 |
| **prompt delle strutture** | **4895** |

Principi del Concilio 507, blocco «Lingua» 128, contesto dello Scultore (guida di stile della Genesi offline) 73 token.

### Il risparmio togliendo ciò che non serve

Ripartizione del lavoro dello Scultore (modelli scolpiti negli universi veri, aurora, mesa, neapolis, orichalcum, sidera): pebble 0, rock 2, bush 0, tree 7, object 3, object-tinted 84, object-worn 4, furniture 100, person 75, animal 1, beast 0, monument 27, building 71, structure-medium 5, structure-large 49, structure-fort 0, vessel 0; 1.91 chiamate a modello. Un'ora della lobby (HOUR, manopole a 1): 51 chiamate di «Modelli nuovi», 26.5 modelli. La Genesi offline chiede 11 modelli (object 1, person 1, furniture 1, object-tinted 4, tree 2, rock 2).

| via | $ a chiamata (media pesata) | token tolti a chiamata (media) | $ per Genesi | $ per ora di gioco | quota della spesa dello Scultore l’ora | gli esempi di oggi, $ l’ora | lo Scultore l’ora nella stima della lobby, $ |
|---|---:|---:|---:|---:|---:|---:|---:|
| Google, oggi | 0.0007 | 1697 | 0.0071 | 0.034 | 2 % | 0.025 | 1.589 |
| Google, dall’1/12 | 0.0010 | 1697 | 0.0071 | 0.051 | 2 % | 0.041 | 2.746 |
| OpenRouter, dall’1/12 | 0.0010 | 1697 | 0.0071 | 0.051 | 2 % | 0.041 | 2.746 |

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

### Le specialità: ciò che tengono del prompt di oggi

| specialità | richieste | ruolo di oggi | ne tiene | ne lascia |
|---|---|---:|---:|---:|
| landscaper | pebble, rock, bush, tree | 5207 | 3243 | 1964 |
| joiner | object, object-tinted, furniture | 5207 | 3215 | 1992 |
| tailor | object-worn | 5207 | 3612 | 1595 |
| figurist | person, animal, beast | 5207 | 3308 | 1899 |
| mason | monument, building, structure-medium | 5207 | 3275 | 1932 |
| architect | structure-large, structure-fort | 4895 | 4895 | 0 |
| coachbuilder | vessel | 5207 | 3595 | 1612 |
| actions | action | 5207 | 2045 | 3162 |

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
