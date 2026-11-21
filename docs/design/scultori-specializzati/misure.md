# Il prompt dello Scultore, richiesta per richiesta (T458)

Scritto da `npx vite-node lab/scripts/prompt-tokens.ts -- --scultore --conta --universi ../step8.2A-lab3d/universes --md docs/design/scultori-specializzati/misure.md --json docs/design/scultori-specializzati/misure.json` il 2026-11-21, kernel 0.10.13: nessuna chiamata ai modelli (`countTokens` è gratis). Lo studio è [`../scultori-specializzati.md`](../scultori-specializzati.md).

Token: countTokens di Gemini (gemini-3.1-flash-lite). Risorse di models/ nella richiesta (tileset, campioni, regole da file): 0.

### Le richieste, una per tipo

| tipo | specialità | modello (Google, oggi) | sistema | di cui ruolo | di cui esempi | principi, lingua, stile | richiesta | non serve | quota del totale | esempi della libreria |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| pebble | landscaper | gemini-3.1-flash-lite | 7260 | 5207 | 1346 | 708 | 47 | 2109 | 29 % | pebble, rock |
| rock | landscaper | gemini-3.1-flash-lite | 7308 | 5207 | 1394 | 708 | 56 | 2109 | 29 % | rock, masso-muschioso |
| bush | landscaper | gemini-3.1-flash-lite | 7140 | 5207 | 1226 | 708 | 53 | 2113 | 29 % | bush, cespuglio-con-bacche |
| tree | landscaper | gemini-3.1-flash-lite | 8143 | 5207 | 2229 | 708 | 50 | 2102 | 26 % | tree, quercia |
| object | joiner | gemini-3.1-flash-lite | 6847 | 5207 | 933 | 708 | 44 | 2111 | 31 % | object, forbici |
| object-tinted | joiner | gemini-3.1-flash-lite | 6847 | 5207 | 933 | 708 | 71 | 2043 | 30 % | object, forbici |
| object-worn | tailor | gemini-3.1-flash-lite | 6847 | 5207 | 933 | 708 | 72 | 1608 | 23 % | object, forbici |
| furniture | joiner | gemini-3.1-flash-lite | 8254 | 5207 | 2340 | 708 | 50 | 2114 | 25 % | barile, falo |
| person | figurist | gemini-3.8-flash | 11.222 | 5207 | 5308 | 708 | 58 | 2012 | 18 % | viandante, contadina |
| animal | figurist | gemini-3.8-flash | 9573 | 5207 | 3659 | 708 | 47 | 2011 | 21 % | animal, viandante |
| beast | figurist | gemini-3.8-flash | 9936 | 5207 | 4022 | 708 | 50 | 2017 | 20 % | beast, animal |
| monument | mason | gemini-4-argon | 12.596 | 5207 | 6682 | 708 | 55 | 2110 | 17 % | monument, corona-totem |
| building | mason | gemini-4-argon | 10.293 | 5207 | 4379 | 708 | 55 | 2106 | 20 % | pozzo, building |
| structure-medium | mason | gemini-4-argon | 12.231 | 5207 | 6317 | 708 | 77 | 2033 | 17 % | structure, fattoria |
| structure-large | architect | gemini-4-argon | 5603 | 4895 | 0 | 708 | 1358 | 0 | 0 % | — |
| structure-fort | architect | gemini-4-argon | 5603 | 4895 | 0 | 708 | 1619 | 0 | 0 % | — |
| vessel | coachbuilder | gemini-4-argon | 7928 | 5207 | 2014 | 708 | 334 | 1625 | 20 % | vessel, capsule |
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
| Google, oggi | 0.0007 | 1697 | 0.0071 | 0.034 | 2 % | 0.075 | 1.589 |
| Google, dall’1/12 | 0.0010 | 1697 | 0.0071 | 0.051 | 2 % | 0.116 | 2.746 |
| OpenRouter, dall’1/12 | 0.0010 | 1697 | 0.0071 | 0.051 | 2 % | 0.116 | 2.746 |

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
