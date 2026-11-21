# Le misure in Node di T459 (2026-11-21)

Node v22.19.0, win32; i tempi sono in millisecondi, la mediana e il 95° percentile su più luoghi o passi.

## 1. Oggi: un livello per casella
300 luoghi (uno ogni cinque, su 18 × 18); gli ambienti del seme a turno nel layout.

| passo | mediana | p95 |
|---|---:|---:|
| la bozza (Lua del seme, nella sandbox) | 9.99 | 10.31 |
| il layout (programma dell'ambiente, connessione, nuoto) | 0.45 | 1.43 |
| i livelli del luogo (`chunkLevels`) | 0.06 | 0.11 |
| gli strati (`draftStrata`, 4 righe) | 0.08 | 0.18 |
| la mesh del luogo (`buildChunk`, 16 luoghi caricati) | 7.48 | 29.63 |

Mesh di un luogo: 1976 triangoli in mediana (p95 7224), 216 KB di buffer (senza le istanze di alberi e rocce). Ciò che il luogo tiene: caselle, strati e livelli, 2.2 KB. Sentieri scavati: 1.8 caselle a luogo.

## 2. A colonne (2.5D): il rilievo vero, la regola 10 sui gradini, gli strati in MarkovJunior
Gli stessi 300 luoghi; il rilievo con il luogo e l'anello attorno (400 caselle). Gli strati in MarkovJunior su 6 righe (`STRATA_XML`).

| passo | mediana | p95 |
|---|---:|---:|
| il rilievo vero (`trueRelief`, in TypeScript) | 0.22 | 0.79 |
| la regola 10 sui gradini, con le rampe (`stepGraph`) | 0.17 | 0.59 |
| gli strati in MarkovJunior, una cella a casella (18 × 18 × 7) | 2.12 | 3.43 |
| gli strati in MarkovJunior, 2 celle a casella (36 × 36 × 13) | 7.09 | 8.59 |
| gli strati in MarkovJunior, 4 celle a casella (72 × 72 × 25) | 55.35 | 82.33 |
| la mesh a colonne con le bande degli strati | 1.08 | 2.68 |

Mesh: 1268 triangoli in mediana (p95 1540), 137 KB. Ciò che il luogo tiene: caselle, 6 righe di strati, livelli e letto, 3.5 KB.
Il rilievo: livelli da -26 (il letto del mare più fondo) a 62 (15.5 caselle), massicci sul 41 % delle caselle. Fra due caselle aperte vicine: 152265 entro un gradino, 2245 entro un salto, 5401 entro un'arrampicata di 3 caselle, 471 oltre.
La regola 10 alla lettera (anche ogni enclave unita con una rampa): 0.89 rampe a luogo, 5.2 livelli mossi a luogo, 0 enclavi che nessuna rampa raggiunge.
La camera di 3/4 da sud: un corpo in piedi è nascosto dal terreno verso la camera sul 4.6 % delle caselle aperte col rilievo vero, sul 0.00 % con quello di oggi.
La regola 10: dal primo varco si raggiunge il 82.9 % delle caselle aperte; rampe scavate 0.48 a luogo (3.8 livelli mossi); sacche di 4 caselle o più divise da caselle solide (il layout di oggi le unisce con un sentiero) 0.85 a luogo; enclavi di 4 caselle o più divise da un dirupo 0.40 a luogo (120 in tutto, 2416 caselle): 58 col salto, 59 con un'arrampicata di 3 caselle, 3 oltre.

## 3. In voxel (3D): la grande scala dal kernel, il dettaglio in MarkovJunior
12 luoghi: i 10 con più dislivello (massicci, mare), uno di mezzo e la partenza; a 8 voxel per casella solo i primi due. Lo scatolo è alto quanto il luogo chiede: dal letto o dal suolo più basso meno 4 caselle di strati fino al punto più alto.

| voxel a casella | lato × altezza (mediana, max) | celle (mediana) | il programma MJ (mediana, p95, max) | con gli strati del kernel | i pavimenti 3D | mesh fusa: ms, triangoli (mediana, max), KB | una faccia a quad: ms, triangoli | la mesh dei modelli (`meshVoxels`): ms, triangoli |
|---:|---|---:|---|---:|---:|---|---|---|
| 1 | 18 × 22 (27) | 7128 | 4.1, 6.4, 6.4 | 2.4 | 0.1 | 3.4, 1274 (1716), 138 | 3.9, 2624 | — |
| 2 | 36 × 41 (52) | 53.136 | 24.9, 36.4, 36.4 | 16.8 | 0.2 | 14.8, 2714 (3554), 294 | 18.5, 9868 | — |
| 4 | 72 × 80 (102) | 414.720 | 322.3, 484.5, 484.5 | 224.1 | 1.6 | 109.2, 9392 (11000), 1018 | 112.9, 36634 | 123.0, 79066 |
| 8 | 144 × 202 (202) | 4.188.672 | 5732.6, 5732.6, 5732.6 | 3861.1 | 13.3 | 876.4, 40270 (40270), 4365 | — | — |

A 4 voxel per casella un luogo tiene 405 KB di voxel in mediana (un byte a voxel; 516 KB il più alto); i pavimenti 3D raggiunti dal primo varco sono il 36 % in media (le grotte e le terrazze no).

Il rilievo stesso in MarkovJunior, luogo per luogo (`Hills` su 72 × 72 × 48, i passi scalati all'area): 918 e 745 ms; oggi `Relief` fa le sue due piastrelle una volta per universo in 255 ms. Un programma per luogo ha i suoi bordi: due luoghi vicini non si incontrerebbero.

## 4. Il Lua per la grande scala
Il rumore del rilievo vero in Lua (wasmoon senza la sandbox del kernel, un hash di Lua 5.4): 7.53 ms a luogo restituito come tabella, 6.02 ms come stringa; la bozza di oggi (il generatore del seme, nella sandbox) 9.99 ms.

## 5. Gli automi cellulari
La finestra caricata: 108 × 90 caselle (6 × 5 luoghi, la camera più lontana), sulla costa del luogo con più dislivello. Millisecondi per passo (mediana, p95) e per secondo di gioco.

| automa | celle | ms per passo (mediana, p95) | passi al secondo | ms per secondo |
|---|---:|---|---:|---:|
| acqua a tubi virtuali, 1 cella per casella | 9720 | 0.340, 0.365 | 60 | 20.4 |
| acqua a tubi virtuali, 2 celle per casella | 38.880 | 1.210, 1.243 | 60 | 72.6 |
| acqua a tubi virtuali, 4 celle per casella | 155.520 | 4.491, 4.605 | 66 | 296.4 |
| vento D2Q9, una cella ogni 1 casella | 9720 | 0.870, 0.882 | 10 (60) | 8.7 (52.2) |
| vento D2Q9, una cella ogni 3 caselle | 1080 | 0.098, 0.100 | 10 (60) | 1.0 (5.9) |
| fumo che si spande (`diffuse`, la primitiva parametrica) | 9720 | 0.066, 0.095 | 10 | 0.7 |
| fuoco a tabella (la primitiva parametrica) | 9720 | 0.407, 0.663 | 10 | 4.1 |
| lo stesso in MarkovJunior (`convolution`, `Stepper`) | 9720 | 0.632, 0.957 | 10 | 6.3 |
| lo stesso in Lua, una chiamata a cella | 9720 | 62.9, 64.1 | 10 | 629 |
| lo stesso in Lua, il passo intero in Lua | 9720 | 13.8, 15.1 | 10 | 138 |
| l'acqua di oggi (`water.ts`), mentre si muove dopo uno scavo | — | 4.085, 5.963 | 100 | 408.5 |

L'acqua a tubi conserva la quantità: nella stessa finestra chiusa (senza mare) dopo 1000 passi lo scarto è -9.7e-8 (relativo); con il mare aperto la finestra ha perso il 29 % dell'acqua dei passi misurati: i laghi del rilievo vero non sono in piano (la superficie della bozza) e scendono al mare. L'acqua di oggi: uno scavo accanto a un lago di 600 caselle su un rilievo, ancora in moto dopo 3000 passi, 3538 caselle attive in mediana, 1.24 µs a casella attiva per passo (i tubi: 0.035 µs a cella).
