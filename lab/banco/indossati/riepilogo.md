# Banco degli indossati: le misure

Scritto da `npx vite-node lab/scripts/indossati.ts`: non a mano. Il commento è in [`../indossati.md`](../indossati.md).

## Tempi e memoria, l'abito intero (mantello, corazza, elmo)

Mediane sui semi (viandante 1-8, lupo 1-4), tre esecuzioni ciascuno. «Zone» si fa una volta per forma del corpo; «cambio» è il lavoro della via a ogni vestizione; «mesh» le mesh che la vestizione rifà (B e C: il corpo intero con gli arti; A: nessuna, quelle dei pezzi si fanno una volta per oggetto).

| corpo | via | zone ms | cambio ms | mesh ms | byte nuovi per chi si veste | mesh disegnate | voxel aggiunti | voxel ricolorati | voxel attraversati | distanza media dal corpo | voxel a 3 o più dal corpo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| viandante | A | 2.9 | 0.9 | 0 | 0 (nudo 364.8 KB) | 7 | 685 | 0 | 330 | 1.2 | 11 % |
| viandante | B | 2.9 | 4.7 | 6.9 | 413.2 KB (nudo 364.8 KB) | 4 | 688 | 0 | 0 | 1.1 | 2 % |
| viandante | C | 2.8 | 0.7 | 5.7 | 372.9 KB (nudo 364.8 KB) | 4 | 64 | 446 | 0 | 0.2 | 0 % |
| lupo | A | 7.3 | 3.9 | 0 | 0 (nudo 785.8 KB) | 9 | 2643 | 0 | 632 | 2.7 | 44 % |
| lupo | B | 7.5 | 10 | 17.1 | 953.7 KB (nudo 785.8 KB) | 6 | 1680 | 0 | 0 | 1.8 | 23 % |
| lupo | C | 6.9 | 2 | 13.9 | 785.8 KB (nudo 785.8 KB) | 6 | 0 | 884 | 0 | 0 | 0 % |

## Per oggetto

| oggetto | programma a terra (caratteri) | sezione `<worn>` (B, caratteri) | programma indossato (A, caratteri) | A: tempo del programma indossato | A: mesh indossata (una per tutti) | C: colori presi |
|---|---|---|---|---|---|---|
| Mantello | 838 | 821 | 1299 | 2.7 ms | 150.2 KB, 4.3 ms | #7a2e3a, #c9a23a |
| Corazza | 1107 | 926 | 1060 | 1.6 ms | 163.9 KB, 4.2 ms | #8f9aa6, #7a4a2a |
| Elmo | 1133 | 1010 | 1284 | 1.9 ms | 160.6 KB, 4.1 ms | #a3acb6, #c9a23a |

## Lo Scultore

Una cosa semplice costa due programmi su `gemini-3.1-flash-lite` e due giudizi dell'Artista su `gemini-3.5-flash`, con i pesi della stima oraria (`src/kernel/coefficients.ts`): 0.0193 $ a modello. Sezione `<worn>` media: 263 token in uscita.

| via | modelli in più per oggetto da indossare | $ in più per oggetto | 10 oggetti | 30 oggetti | 100 oggetti |
|---|---|---|---|---|---|
| A | 1 | 0.0195 | 0.195 | 0.584 | 1.948 |
| B | 0 | 0.0009 | 0.009 | 0.028 | 0.094 |
| C | 0 | 0.0000 | 0.000 | 0.000 | 0.000 |

## I corpi generati: l'abito intero

Ogni figura del seme che cammina (seme 1) e le creature del Cantiere 8 (non i veicoli). Zone: voxel di testa, busto, schiena; «collo» dice come è stata trovata la testa (`rig`: la palette la nomina; `narrowing`: la fetta più stretta; `share`: una quota del corpo). Per ogni via: voxel aggiunti / ricolorati / attraversati, distanza media dal corpo.

| corpo | da | classe | in piedi | collo | testa | busto | schiena | A | B | C |
|---|---|---|---|---|---|---|---|---|---|---|
| viandante | seme | person | sì | narrowing | 814 | 754 | 397 | 1083/0/272, 1.7 | 812/0/0, 1.2 | 74/554/0, 0.4 |
| contadina | seme | person | sì | narrowing | 532 | 1181 | 635 | 1026/0/194, 1.8 | 880/0/0, 1.1 | 60/550/0, 0.1 |
| person | seme | person | sì | narrowing | 858 | 1009 | 559 | 806/0/414, 1 | 840/0/0, 1.5 | 77/472/0, 0.4 |
| animal | seme | animal | no | rig | 251 | 375 | 213 | 404/0/131, 1.4 | 426/0/0, 1.2 | 0/284/0, 0 |
| beast | seme | beast | no | narrowing | 1382 | 2539 | 1313 | 2302/0/624, 2.4 | 1680/0/0, 1.8 | 0/884/0, 0 |
| corona-gerboa | seme | person | sì | rig | 1484 | 1186 | 610 | 2733/0/837, 3.3 | 1414/0/0, 1.4 | 48/696/0, 0.2 |
| corona-gerboa-narrator | seme | person | sì | rig | 2014 | 1144 | 546 | 2981/0/889, 2.8 | 1561/0/0, 1.4 | 44/904/0, 0.1 |
| corona-gerboa-cartographer | seme | person | sì | rig | 1922 | 1174 | 564 | 2834/0/885, 3 | 1547/0/0, 1.4 | 44/908/0, 0.1 |
| corona-gerboa-artist | seme | person | sì | rig | 1825 | 1120 | 546 | 2889/0/903, 3.2 | 1511/0/0, 1.4 | 44/816/0, 0.1 |
| corona-gerboa-musician | seme | person | sì | rig | 1825 | 1120 | 546 | 2889/0/903, 3.2 | 1511/0/0, 1.4 | 44/816/0, 0.1 |
| corona-gerboa-sculptor | seme | person | sì | rig | 1798 | 1200 | 580 | 2844/0/875, 3 | 1635/0/0, 1.5 | 66/847/0, 0.2 |
| corona-gerboa-physicist | seme | person | sì | rig | 1792 | 1188 | 628 | 3549/0/922, 3.1 | 1702/0/0, 1.4 | 40/876/0, 0.1 |
| corona-gerboa-engineer | seme | person | sì | rig | 1754 | 1168 | 561 | 3284/0/785, 3.4 | 1545/0/0, 1.5 | 66/795/0, 0.2 |
| corona-gerboa-arbiter | seme | person | sì | rig | 1976 | 1071 | 549 | 3915/0/844, 3.3 | 1674/0/0, 1.4 | 8/858/0, 0 |
| corona-gerboa-liaison | seme | person | sì | rig | 1664 | 1358 | 682 | 2826/0/888, 3.1 | 1508/0/0, 1.4 | 66/784/0, 0.2 |
| corona-gerboa-actor | seme | person | sì | rig | 2138 | 1510 | 766 | 5995/0/888, 4.7 | 1767/0/0, 1.4 | 66/915/0, 0.2 |
| cervo-reale | cantiere 8 | beast | no | narrowing | 377 | 1487 | 662 | 1545/0/168, 2.4 | 1205/0/0, 1.8 | 0/658/0, 0 |
| lupo-dei-boschi | cantiere 8 | beast | no | narrowing | 478 | 1378 | 596 | 2189/0/272, 3.8 | 1149/0/0, 1.6 | 0/668/0, 0 |
| cinghiale-corazzato | cantiere 8 | beast | no | share | 780 | 2518 | 1276 | 2477/0/345, 2.8 | 1635/0/0, 1.8 | 0/926/0, 0 |
| golem-runico | cantiere 8 | person | sì | share | 486 | 1333 | 752 | 859/0/388, 1.3 | 910/0/0, 1.2 | 152/591/0, 0.4 |
| automa-sentinella | cantiere 8 | person | sì | narrowing | 118 | 1251 | 681 | 1111/0/259, 2.3 | 979/0/0, 2.2 | 28/437/0, 0.2 |
| segugio-ottone | cantiere 8 | beast | no | share | 458 | 2407 | 1142 | 2706/0/357, 3.3 | 1575/0/0, 2.1 | 0/860/0, 0 |
| ragno-meccanico | cantiere 8 | beast | no | narrowing | 444 | 2311 | 1190 | 990/0/547, 1.3 | 874/0/0, 1.3 | 0/772/0, 0 |
| cane-randagio | cantiere 8 | animal | sì | share | 95 | 328 | 151 | 378/0/14, 2.4 | 293/0/0, 1.1 | 8/174/0, 0 |
| gatto-urbano | cantiere 8 | animal | no | share | 76 | 190 | 76 | 205/0/52, 1.6 | 250/0/0, 1.6 | 0/121/0, 0 |
| drone-esapode | cantiere 8 | beast | no | narrowing | 32 | 1561 | 834 | 3792/0/412, 3.4 | 1016/0/0, 1.6 | 0/643/0, 0 |
| xenofauna-cristallina | cantiere 8 | beast | no | narrowing | 460 | 1624 | 860 | 2294/0/309, 2.9 | 1385/0/0, 2 | 0/758/0, 0 |
