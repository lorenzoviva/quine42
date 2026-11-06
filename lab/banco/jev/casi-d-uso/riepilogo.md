# Riepilogo delle misure di T325 (generato)

> Generato da `npx vite-node lab/scripts/jev-casi-d-uso.ts -- --rapporto` dalle misure (`misure/`) e dal registro (`consumi.jsonl`). La lettura è in [`../casi-d-uso.md`](../casi-d-uso.md).

## 1. La spesa di oggi: quanto delle richieste è contesto

Misura del 2026-11-06 (prezzi del 2026-10-22), token contati con countTokens di Gemini (3.26 caratteri a token), passeggiate di 24 luoghi in neapolis (190 chiamate, 81 moduli, 38 nel catalogo), orichalcum (203 chiamate, 81 moduli, 36 nel catalogo), sidera (208 chiamate, 82 moduli, 33 nel catalogo), valmora (132 chiamate, 139 moduli, 58 nel catalogo).

### Compito per compito: token in ingresso medi, per famiglia

| compito | agente | chiamate registrate | in ingresso | istruzioni fisse | contesto del mondo | contesto della cosa | richiesta | contesto | prefisso stabile |
|---|---|---|---|---|---|---|---|---|---|
| review.fourthwall | arbiter | 4 | 9508 | 1203 | 6331 | 0 | 1975 | 67 % | 7496 |
| content.items | narrator | 16 | 9405 | 2186 | 7221 | 0 | 0 | 77 % | 8157 |
| forge.concept | narrator | 26 | 9354 | 2163 | 7152 | 0 | 40 | 76 % | 8152 |
| player.death | narrator | 3 | 9354 | 2209 | 7052 | 58 | 35 | 76 % | 8630 |
| content.recipes | narrator | 16 | 9124 | 1934 | 7191 | 0 | 0 | 79 % | 8186 |
| model.sculpt | sculptor | 40 | 8997 | 8495 | 421 | 0 | 82 | 5 % | 4678 |
| content.define | narrator | 18 | 8781 | 2102 | 6622 | 0 | 60 | 75 % | 8197 |
| agent.chat | narrator | 4 | 8756 | 1782 | 6958 | 0 | 17 | 79 % | 8535 |
| plot.weave | narrator | 4 | 8714 | 2266 | 5202 | 1247 | 0 | 74 % | 5941 |
| action.judge | narrator | 12 | 8632 | 2865 | 5668 | 34 | 65 | 66 % | 6179 |
| npc.individuate | narrator | 25 | 8529 | 1983 | 4941 | 1555 | 52 | 76 % | 5762 |
| council.session | arbiter | 20 | 8042 | 1447 | 6218 | 379 | 0 | 82 % | 7362 |
| forge.review | arbiter | 26 | 7877 | 1295 | 6194 | 0 | 390 | 79 % | 7359 |
| npc.reply | actor | 24 | 7835 | 1745 | 5017 | 1062 | 14 | 78 % | 5581 |
| chunk.plan | cartographer | 189 | 7793 | 2882 | 4776 | 136 | 0 | 63 % | 5595 |
| cartographer.environment | cartographer | 4 | 7786 | 2846 | 4906 | 0 | 34 | 63 % | 5617 |
| content.review | arbiter | 16 | 7453 | 1240 | 6164 | 0 | 51 | 83 % | 7328 |
| text.examine | narrator | 24 | 7380 | 1600 | 5390 | 0 | 389 | 73 % | 6124 |
| npc.reply | narrator | 96 | 7358 | 2028 | 4644 | 675 | 14 | 72 % | 5762 |
| npc.sheet | narrator | 12 | 7131 | 1818 | 5040 | 275 | 0 | 75 % | 5941 |
| craft.judge | narrator | 8 | 6956 | 1647 | 5213 | 0 | 97 | 75 % | 5941 |
| craft.free | narrator | 8 | 6888 | 1860 | 4907 | 100 | 23 | 73 % | 5892 |
| npc.dialogue | narrator | 12 | 6679 | 1747 | 4816 | 119 | 0 | 74 % | 5762 |
| sound.compose | musician | 10 | 5597 | 5416 | 167 | 0 | 14 | 3 % | 2388 |
| rune.invent | narrator | 1 | 5592 | 2113 | 3479 | 0 | 0 | 62 % | 4765 |
| mechanic.design | engineer | 4 | 5454 | 4173 | 1257 | 0 | 24 | 23 % | 4163 |
| forge.code | engineer | 26 | 4597 | 3228 | 957 | 0 | 412 | 21 % | 4138 |
| referente.coordinate | liaison | 12 | 4398 | 1329 | 3006 | 43 | 20 | 69 % | 3844 |
| model.judge | artist | 31 | 2876 | 1166 | 462 | 0 | 1248 | 16 % | 1548 |
| forge.physics | physicist | 26 | 2807 | 1208 | 1216 | 0 | 384 | 43 % | 2283 |
| content.physics | physicist | 16 | 2460 | 1181 | 1186 | 0 | 94 | 48 % | 2253 |

### Le parti più grandi, compito per compito (token medi)

| compito | canone | lessico | bibbia | catalogo | grafo | regole | società | ruolo | compito (istruzioni) |
|---|---|---|---|---|---|---|---|---|---|
| review.fourthwall (arbiter) | 2351 | 1170 | 1011 | 0 | 0 | 538 | 0 | 588 | 0 |
| content.items (narrator) | 2351 | 1170 | 1281 | 1922 | 0 | 401 | 0 | 1000 | 84 |
| forge.concept (narrator) | 2351 | 1170 | 1255 | 1849 | 0 | 431 | 0 | 1000 | 8 |
| player.death (narrator) | 2701 | 1234 | 1385 | 1075 | 0 | 560 | 0 | 1000 | 161 |
| content.recipes (narrator) | 2351 | 1170 | 1299 | 1874 | 0 | 401 | 0 | 1000 | 138 |
| model.sculpt (sculptor) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3679 | 4238 |
| content.define (narrator) | 2351 | 1170 | 1280 | 1288 | 0 | 437 | 0 | 1000 | 0 |
| agent.chat (narrator) | 2376 | 1170 | 1366 | 1344 | 0 | 606 | 0 | 1000 | 137 |
| plot.weave (narrator) | 2351 | 1170 | 167 | 0 | 838 | 580 | 685 | 1000 | 325 |
| action.judge (narrator) | 2701 | 1234 | 198 | 298 | 769 | 371 | 0 | 1000 | 739 |
| npc.individuate (narrator) | 2351 | 1170 | 167 | 0 | 756 | 401 | 1448 | 1000 | 0 |
| council.session (arbiter) | 2351 | 1170 | 983 | 20 | 0 | 433 | 0 | 588 | 165 |
| forge.review (arbiter) | 2351 | 1170 | 981 | 0 | 0 | 431 | 0 | 588 | 50 |
| npc.reply (actor) | 2376 | 1170 | 167 | 0 | 652 | 556 | 0 | 640 | 265 |
| chunk.plan (cartographer) | 0 | 0 | 973 | 2819 | 0 | 0 | 0 | 1750 | 279 |
| cartographer.environment (cartographer) | 0 | 0 | 960 | 2962 | 0 | 0 | 0 | 1750 | 104 |
| content.review (arbiter) | 2351 | 1170 | 981 | 0 | 0 | 401 | 0 | 588 | 0 |
| text.examine (narrator) | 2701 | 1234 | 198 | 0 | 844 | 316 | 0 | 1000 | 0 |
| npc.reply (narrator) | 2351 | 1170 | 167 | 0 | 459 | 401 | 0 | 1000 | 188 |
| npc.sheet (narrator) | 2376 | 1170 | 167 | 0 | 675 | 556 | 0 | 1000 | 191 |
| craft.judge (narrator) | 2351 | 1170 | 167 | 655 | 194 | 580 | 0 | 1000 | 0 |
| craft.free (narrator) | 2351 | 1170 | 167 | 464 | 128 | 531 | 0 | 1000 | 94 |
| npc.dialogue (narrator) | 2351 | 1170 | 167 | 0 | 631 | 401 | 0 | 1000 | 60 |
| sound.compose (musician) | 0 | 0 | 167 | 0 | 0 | 0 | 0 | 1643 | 3012 |
| rune.invent (narrator) | 1300 | 976 | 75 | 0 | 292 | 744 | 0 | 1000 | 297 |
| mechanic.design (engineer) | 0 | 0 | 117 | 275 | 0 | 0 | 0 | 2603 | 173 |
| forge.code (engineer) | 0 | 0 | 117 | 0 | 0 | 0 | 0 | 2603 | 10 |
| referente.coordinate (liaison) | 0 | 0 | 960 | 1344 | 0 | 606 | 0 | 260 | 290 |
| model.judge (artist) | 0 | 0 | 41 | 0 | 0 | 0 | 0 | 508 | 0 |
| forge.physics (physicist) | 0 | 0 | 41 | 0 | 0 | 431 | 0 | 490 | 0 |
| content.physics (physicist) | 0 | 0 | 41 | 0 | 0 | 401 | 0 | 490 | 0 |

### Un'ora di gioco (le ipotesi di `HOUR`, ogni manopola a 1, l'Attore spento)

| compito | modello | chiamate l’ora | in ingresso | contesto | uscita | $ l’ora: senza cache / miste / calda | contesto $ l’ora: senza / miste / calda | uscita $ l’ora |
|---|---|---|---|---|---|---|---|---|
| chunk.plan | gemini-3.1-flash-lite | 40 | 7793 | 4912 | 964 | 0.1358 / 0.1056 / 0.0854 | 0.0491 / 0.0315 / 0.0197 | 0.0578 |
| npc.individuate | gemini-3.1-flash-lite | 72 | 8529 | 6496 | 2132 | 0.3838 / 0.3278 / 0.2904 | 0.1169 / 0.0763 / 0.0491 | 0.2303 |
| npc.dialogue | gemini-3.1-flash-lite | 45 | 6679 | 4935 | 500 † | 0.1089 / 0.0739 / 0.0505 | 0.0555 / 0.0301 / 0.0132 | 0.0338 |
| npc.reply | gemini-3.1-flash-lite | 20 | 7358 | 5319 | 842 | 0.0621 / 0.0465 / 0.0361 | 0.0266 / 0.0153 / 0.0078 | 0.0253 |
| text.examine | gemini-3.1-flash-lite | 8 | 7380 | 5390 | 500 † | 0.0208 / 0.0141 / 0.0097 | 0.0108 / 0.0059 / 0.0026 | 0.0060 |
| text.read * | gemini-3.1-flash-lite | 2 | 3500 | 0 | 500 † | 0.0033 / 0.0033 / 0.0033 | 0.0000 / 0.0000 / 0.0000 | 0.0015 |
| action.judge | gemini-3.1-flash-lite | 6 | 8632 | 5702 | 756 | 0.0198 / 0.0147 / 0.0114 | 0.0086 / 0.0048 / 0.0023 | 0.0068 |
| craft.free | gemini-3.1-flash-lite | 1 | 6888 | 5007 | 306 | 0.0022 / 0.0014 / 0.0009 | 0.0013 / 0.0007 / 0.0003 | 0.0005 |
| craft.judge | gemini-3.1-flash-lite | 1 | 6956 | 5213 | 503 | 0.0025 / 0.0017 / 0.0012 | 0.0013 / 0.0007 / 0.0003 | 0.0008 |
| forge.concept | gemini-3.1-flash-lite | 7.7 | 9354 | 7152 | 500 † | 0.0237 / 0.0152 / 0.0096 | 0.0137 / 0.0069 / 0.0024 | 0.0058 |
| forge.physics | gemini-3.1-flash-lite | 7.7 | 2807 | 1216 | 500 † | 0.0111 / 0.0088 / 0.0072 | 0.0023 / 0.0011 / 0.0002 | 0.0058 |
| forge.code | gemini-3.1-flash-lite | 7.7 | 4597 | 957 | 500 † | 0.0146 / 0.0103 / 0.0074 | 0.0018 / 0.0008 / 0.0002 | 0.0058 |
| forge.review | gemini-3.1-flash-lite | 7.7 | 7877 | 6194 | 500 † | 0.0208 / 0.0132 / 0.0082 | 0.0119 / 0.0055 / 0.0012 | 0.0058 |
| forge.fix * | gemini-3.1-flash-lite | 7.7 | 3500 | 0 | 500 † | 0.0125 / 0.0125 / 0.0125 | 0.0000 / 0.0000 / 0.0000 | 0.0058 |
| content.items | gemini-3.1-flash-lite | 4 | 9405 | 7221 | 500 † | 0.0124 / 0.0080 / 0.0051 | 0.0072 / 0.0037 / 0.0013 | 0.0030 |
| content.physics | gemini-3.1-flash-lite | 4 | 2460 | 1186 | 500 † | 0.0055 / 0.0042 / 0.0034 | 0.0012 / 0.0005 / 0.0001 | 0.0030 |
| content.review | gemini-3.1-flash-lite | 4 | 7453 | 6164 | 500 † | 0.0105 / 0.0065 / 0.0039 | 0.0062 / 0.0028 / 0.0006 | 0.0030 |
| content.recipes | gemini-3.1-flash-lite | 4 | 9124 | 7191 | 500 † | 0.0121 / 0.0077 / 0.0048 | 0.0072 / 0.0036 / 0.0012 | 0.0030 |
| content.define | gemini-3.1-flash-lite | 12 | 8781 | 6622 | 500 † | 0.0353 / 0.0221 / 0.0132 | 0.0199 / 0.0091 / 0.0020 | 0.0090 |
| council.session | gemini-3.1-flash-lite | 3.3 | 8042 | 6597 | 500 † | 0.0092 / 0.0059 / 0.0037 | 0.0055 / 0.0027 / 0.0009 | 0.0025 |
| plot.weave | gemini-3.1-flash-lite | 2 | 8714 | 6449 | 500 † | 0.0057 / 0.0041 / 0.0031 | 0.0031 / 0.0020 / 0.0012 | 0.0015 |
| model.sculpt | gemini-3.1-flash-lite | 26 | 8997 | 421 | 3000 † | 0.1755 / 0.1591 / 0.1481 | 0.0027 / 0.0013 / 0.0003 | 0.1170 |
| model.sculpt | gemini-3.8-flash | 19.5 | 8997 | 421 | 3000 † | 0.3510 / 0.3510 / 0.3510 | 0.0062 / 0.0062 / 0.0062 | 0.2194 |
| model.judge | gemini-3.5-flash | 45.5 | 2876 | 462 | 300 † | 0.1493 / 0.1208 / 0.1018 | 0.0158 / 0.0073 / 0.0016 | 0.0512 |
| sound.compose | gemini-3.8-flash | 5.4 | 5597 | 167 | 3000 † | 0.0828 / 0.0828 / 0.0828 | 0.0007 / 0.0007 / 0.0007 | 0.0603 |
| **in tutto** | | 363 | | | | **1.671 $ / 1.421 $ / 1.255 $** | **0.375 $ / 0.219 $ / 0.115 $** | **0.864 $** |

\* non registrato nella passeggiata: 3500 token, come la stima del gioco. † uscita non misurata: 500 token (3000 per i programmi), come la stima del gioco.

### Con l'Attore acceso: le righe che cambiano

| compito | modello | chiamate l’ora | in ingresso | contesto | uscita | $ l’ora: senza cache / miste / calda | contesto $ l’ora: senza / miste / calda | uscita $ l’ora |
|---|---|---|---|---|---|---|---|---|
| npc.reply (Attore) | gemini-3.8-flash | 20 | 7835 | 6079 | 110 | 0.1258 / 0.1258 / 0.1258 | 0.0912 / 0.0912 / 0.0912 | 0.0083 |
| npc.dialogue (Attore) | gemini-3.8-flash | 45 | 6679 | 4935 | 220 † | 0.2625 / 0.2625 / 0.2625 | 0.1666 / 0.1666 / 0.1666 | 0.0371 |
| npc.sheet | gemini-3.1-flash-lite | 55 | 7131 | 5315 | 500 † | 0.1393 / 0.0952 / 0.0658 | 0.0731 / 0.0407 / 0.0191 | 0.0413 |
| **in tutto** | | 120 | | | | **0.528 $ / 0.484 $ / 0.454 $** | **0.331 $ / 0.298 $ / 0.277 $** | **0.087 $** |

### Che cosa costa ogni parte in un'ora (Attore spento)

| parte | famiglia | token l’ora | $ l’ora senza cache | $ l’ora con la cache calda |
|---|---|---|---|---|
| ruolo | istruzioni fisse | 486425 | 0.1734 | 0.0717 |
| canone | contesto del mondo | 469497 | 0.1174 | 0.0117 |
| compito | istruzioni fisse | 233714 | 0.1078 | 0.1078 |
| principi | istruzioni fisse | 204213 | 0.0714 | 0.0168 |
| lessico | contesto del mondo | 232108 | 0.0580 | 0.0058 |
| catalogo | contesto del mondo | 160549 | 0.0401 | 0.0040 |
| immagini | richiesta | 50050 | 0.0375 | 0.0375 |
| bibbia | contesto del mondo | 119390 | 0.0312 | 0.0037 |
| societa | contesto della cosa | 105592 | 0.0264 | 0.0264 |
| grafo | contesto del mondo | 105329 | 0.0263 | 0.0263 |
| stile | contesto del mondo | 44626 | 0.0248 | 0.0080 |
| schema | istruzioni fisse | 76132 | 0.0213 | 0.0213 |
| regole | contesto del mondo | 84949 | 0.0212 | 0.0021 |
| terreni | contesto del mondo | 55304 | 0.0138 | 0.0014 |
| richiesta | richiesta | 28885 | 0.0114 | 0.0114 |
| partita | contesto del mondo | 19721 | 0.0049 | 0.0005 |
| stato | contesto della cosa | 17134 | 0.0043 | 0.0043 |
| persona | contesto della cosa | 11939 | 0.0030 | 0.0030 |
| atlante | contesto del mondo | 9600 | 0.0024 | 0.0002 |
| ricordi | contesto della cosa | 3680 | 0.0009 | 0.0009 |
| storia | contesto della cosa | 1909 | 0.0005 | 0.0005 |

## 2a. Le guardie sui testi del viandante

| modello | giuste | steers | meta | outside | explicit | nonsense | rotta giusta (soglia 0,7) | legittimi fermati | pericolosi passati | token in medi | $ per 1000 testi | ms mediana |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| jev-1.13.0 | 98 % | 60/63 | 59/63 | 63/63 | 63/63 | 63/63 | 59/63 | 0 | 2 | 860 | 0.0361 | 180 |
| jev-1.14.0 | 97 % | 58/63 | 59/63 | 63/63 | 63/63 | 63/63 | 58/63 | 0 | 3 | 860 | 0.0361 | 161 |
| gemini-3.1-flash-lite | 93 % | 54/63 | 53/63 | 61/63 | 63/63 | 63/63 | 52/63 | 2 | 0 | 611 | 0.3774 | 1242 |

## 2b. Le battute riusate

| modello | soglie (Choice / Noul) | decisioni giuste | riusi trovati | riusi sbagliati | riusi mancati | token in medi | $ per 1000 controlli | ms mediana |
|---|---|---|---|---|---|---|---|---|
| jev-1.13.0 | 0.5 / 0.5 | 43/46 | 21/24 | 0 | 3 | 1489 | 0.0625 | 171 |
| jev-1.13.0 | 0.5 / 0.7 | 39/46 | 17/24 | 0 | 7 | 1489 | 0.0625 | 171 |
| jev-1.13.0 | 0.7 / 0.8 | 39/46 | 17/24 | 0 | 7 | 1489 | 0.0625 | 171 |
| jev-1.14.0 | 0.5 / 0.5 | 43/46 | 21/24 | 0 | 3 | 1489 | 0.0625 | 172 |
| jev-1.14.0 | 0.5 / 0.7 | 38/46 | 16/24 | 0 | 8 | 1489 | 0.0625 | 172 |
| jev-1.14.0 | 0.7 / 0.8 | 35/46 | 13/24 | 0 | 11 | 1489 | 0.0625 | 172 |
| gemini-3.1-flash-lite | 0.5 / 0.5 | 45/46 | 23/24 | 0 | 1 | 1263 | 0.5571 | 1279 |
| gemini-3.1-flash-lite | 0.5 / 0.7 | 45/46 | 23/24 | 0 | 1 | 1263 | 0.5571 | 1279 |
| gemini-3.1-flash-lite | 0.7 / 0.8 | 45/46 | 23/24 | 0 | 1 | 1263 | 0.5571 | 1279 |

## 2c. Il contesto scelto da Jev

| compito | taglio | casi | token in: intero (in cache) → scelto | Jev legge | ragionamento: intero → scelto | $ a chiamata: intero misurato / a cache calda / senza cache | $ scelto + Jev | giudice Flash-Lite: intero/scelto/pari | giudice Jev | «rompe il mondo» medio (Flash-Lite): intero / scelto | controlli falliti: intero / scelto | righe tenute |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chunk.plan | largo | 6 | 6912 (1854) → 5666 | 2533 | 598 → 368 | 0.00276 / 0.00214 / 0.00317 | 0.00218 | 4/2/0 | 3/3/0 | 0.00 / 0.17 | 1 / 0 | catalog 14.0/39 |
| chunk.plan | stretto | 6 | 6912 (1854) → 5025 | 2533 | 598 → 618 | 0.00276 / 0.00214 / 0.00317 | 0.00253 | 4/2/0 | 4/2/0 | 0.17 / 0.67 | 1 / 2 | catalog 3.0/39 |
| npc.individuate | largo | 5 | 8715 (3360) → 4824 | 10934 | 1506 → 1526 | 0.00462 / 0.00443 / 0.00538 | 0.00480 | 3/2/0 | 2/3/0 | 0.40 / 0.20 | 0 / 0 | canon 16.2/94, lexicon 17.4/45, rules 5.0/6, graph 8.0/17, society 14.0/25 |
| npc.individuate | stretto | 5 | 8715 (3360) → 3166 | 10934 | 1506 → 345 | 0.00462 / 0.00443 / 0.00538 | 0.00257 | 5/0/0 | 4/1/0 | 0.20 / 0.80 | 0 / 1 | canon 2.0/94, lexicon 8.8/45, rules 2.0/6, graph 3.2/17, society 3.0/25 |
| npc.reply (Attore) | largo | 5 | 7719 (0) → 4075 | 8853 | 0 → 0 | 0.00620 / — / 0.00620 | 0.00382 | 3/2/0 | 3/2/0 | 0.00 / 0.00 | 0 / 0 | canon 10.4/93, lexicon 8.0/45, rules 2.8/7, graph 8.0/12 |
| npc.reply (Attore) | stretto | 5 | 7719 (0) → 3330 | 8853 | 0 → 0 | 0.00620 / — / 0.00620 | 0.00328 | 3/2/0 | 4/1/0 | 0.00 / 0.00 | 0 / 0 | canon 2.4/93, lexicon 3.0/45, rules 0.6/7, graph 3.0/12 |
| npc.reply (Narratore) | largo | 8 | 7822 (4790) → 4285 | 8879 | 670 → 430 | 0.00214 / 0.00194 / 0.00322 | 0.00235 | 2/6/0 | 3/5/0 | 0.00 / 0.00 | 1 / 0 | canon 11.8/92, lexicon 10.6/45, rules 3.3/6, graph 7.0/12 |
| npc.reply (Narratore) | stretto | 8 | 7822 (4790) → 3378 | 8879 | 670 → 423 | 0.00214 / 0.00194 / 0.00322 | 0.00210 | 5/3/0 | 3/5/0 | 0.00 / 0.00 | 1 / 0 | canon 1.4/92, lexicon 4.8/45, rules 0.0/6, graph 2.6/12 |

## La spesa delle prove

| fornitore | prova | chiamate | token in ingresso | dollari |
|---|---|---|---|---|
| gemini | battute | 46 | 58115 | 0.0256 |
| gemini | guardia | 63 | 38499 | 0.0238 |
| gemini | scelta | 120 | 691867 | 0.2677 |
| typesafe | battute | 92 | 136942 | 0.0058 |
| typesafe | guardia | 126 | 108386 | 0.0046 |
| typesafe | scelta | 96 | 691759 | 0.0291 |
| **typesafe** | in tutto | | | **0.0394** |
| **gemini** | in tutto | | | **0.3172** |
