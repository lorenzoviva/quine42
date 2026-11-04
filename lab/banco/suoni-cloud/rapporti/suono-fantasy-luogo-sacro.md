# suono-fantasy-luogo-sacro

> Fantasy, il luogo sacro: un canto dorico per gradi vicini su quinte vuote, una campana che risponde, nessun tamburo.

Sorgente: `lab/banco/suoni-cloud/fantasy/suono-fantasy-luogo-sacro.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/fantasy/suono-fantasy-luogo-sacro.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza media fra i 30 semi 0.86 (minima fra due semi 0.64, soglia 0,05), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.84 | 79-81 | 20 | -24.6..-24.4 | 0.75 | 6 % | 19.4 | 0.02 | 8 % | 128/128 |
| 4, 5, 6 | pulito | 0.86 | 75-80 | 22 | -24.8..-24.0 | 0.65 | 6 % | 19.0 | 0.01 | 11 % | 128/128 |
| 7, 8, 9 | pulito | 0.90 | 70-79 | 19 | -24.5..-24.3 | 0.64 | 6 % | 18.7 | 0.01 | 13 % | 128/128 |
| 10, 11, 12 | pulito | 0.85 | 73-75 | 19 | -24.5..-24.1 | 0.73 | 9 % | 22.0 | 0.00 | 8 % | 128/128 |
| 13, 14, 15 | pulito | 0.82 | 73-82 | 18 | -24.5..-23.8 | 0.71 | 6 % | 18.3 | 0.01 | 3 % | 128/128 |
| 16, 17, 18 | pulito | 0.89 | 70-88 | 17 | -24.6..-24.1 | 0.71 | 7 % | 19.8 | 0.02 | 12 % | 128/128 |
| 19, 20, 21 | pulito | 0.87 | 74-81 | 24 | -24.5..-24.1 | 0.68 | 7 % | 21.8 | 0.01 | 11 % | 128/128 |
| 22, 23, 24 | pulito | 0.87 | 75-84 | 20 | -24.5..-23.8 | 0.69 | 4 % | 18.8 | 0.00 | 19 % | 128/128 |
| 25, 26, 27 | pulito | 0.83 | 69-83 | 21 | -24.9..-24.3 | 0.67 | 9 % | 22.1 | 0.01 | 8 % | 128/128 |
| 28, 29, 30 | pulito | 0.91 | 74-78 | 16 | -24.7..-24.2 | 0.63 | 8 % | 23.7 | 0.01 | 10 % | 128/128 |

## Rapporto completo: Suono: suono-fantasy-luogo-sacro (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 35.56 s a 54 bpm.
Dichiarata: C dorian (root 48); swing 0.00, cutoff 2600 Hz, space 0.80.
Tracce: y0 lead 0.50, y1 pad 0.62, y2 lead 0.28, y3 bass 0.48.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: A4~4 . . . . . . . . . . . . . . .
  y1 pad: C3~16+G3~16+C4~16 . . . . . . . . . . . . . . .
  y2 lead: C5 . . . . . . . G4 . . . . . . .
  y3 bass: K+C2!~16 . . . . . . . . . . . . . . .
battuta 2:
  y0 lead: G4~4 . . . F4~2 . D#4~8 . . . . . . . D#4~2 .
  y1 pad: F3~16+C4~16+F4~16 . . . . . . . . . . . . . . .
  y2 lead: F5 . . . . . . . . . . . . . . .
  y3 bass: F2!~16 . . . . . . . . . . . . . . .
battuta 3:
  y0 lead: D4~4 . . . D#4~4 . . . D4~4 . . . C4~2 . D4~4 .
  y1 pad: G3~16+D4~16+G4~16 . . . . . . . . . . . . . . .
  y2 lead: G5 . . . . . . . D5 . . . . . . .
  y3 bass: G2!~8 . . . . . . . D3~8 . . . . . . .
battuta 4:
  y0 lead: . . D#4~8 . . . . . . . D#4~4 . . . D4~4 .
  y1 pad: D3~16+A3~16+D4~16 . . . . . . . . . . . . . . .
  y2 lead: D5 . . . . . . . A4 . . . . . . .
  y3 bass: D2!~8 . . . . . . . A2~8 . . . . . . .
battuta 5:
  y0 lead: . . . . . . C4~2 . D4~2 . C4~4 . . . D4~4 .
  y1 pad: D#3~8+A#3~8 . . . . . . . D#3~8+A#3~8+D#4~8 . . . . . . .
  y2 lead: D#5 . . . . . . . . . . . . . . .
  y3 bass: D#2!~16 . . . . . . . . . . . . . . .
battuta 6:
  y0 lead: . . D#4!~2 . D4~4 . . . D#4~4 . . . F4!~4 . . .
  y1 pad: F3~8+C4~8 . . . . . . . F3~8+C4~8+F4~8 . . . . . . .
  y2 lead: F5 . . . . . . . C5 . . . . . . .
  y3 bass: F2!~16 . . . . . . . . . . . . . . .
battuta 7:
  y0 lead: D#4~2 . D4~2 . . . . . C4~8 . . . . . . .
  y1 pad: C3~16+D#3~16+G3~16 . . . . . . . . . . . . . . .
  y2 lead: C5 . . . . . . . G4 . . . . . . .
  y3 bass: K+C2!~8 . . . . . . . G2~8 . . . . . . .
battuta 8:
  y0 lead: . . . . C4~8 . . . . . . . C4~2 . . .
  y1 pad: F3~16+C4~16+F4~16 . . . . . . . . . . . . . . .
  y2 lead: F5 . . . . . . . C5 . . . . . . .
  y3 bass: F2!~16 . . . . . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 81 | 26 % | 24 | C2..G5 (43 semitoni) | 100 % | 25 % | C dorian (0.81) | 0.81 | 8 % | 128/128 |
| 2 | 79 | 26 % | 20 | C2..G5 (43 semitoni) | 100 % | 27 % | C dorian (0.76) | 0.76 | 2 % | 128/128 |
| 3 | 80 | 27 % | 21 | C2..G5 (43 semitoni) | 100 % | 33 % | C dorian (0.86) | 0.86 | 3 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 26 | 0 | 1 4 5 3 4 4 3 2 | 6 | C4..A4 (9 semitoni) | 20 % | 3.9 | 128/128 |
| 1 | y1 pad | 28 | 0 | 3 3 3 3 5 5 3 3 | 12 | C3..G4 (19 semitoni) | 8 % | 13.1 | 128/128 |
| 1 | y2 lead | 14 | 0 | 2 1 2 2 1 2 2 2 | 7 | G4..G5 (12 semitoni) | 11 % | 1.0 | 128/128 |
| 1 | y3 bass | 11 | 2 | 2 1 2 2 1 1 3 1 | 7 | C2..D3 (14 semitoni) | 9 % | 11.6 | 128/128 |
| 2 | y0 lead | 25 | 0 | 3 2 4 5 4 2 5 0 | 7 | C4..A#4 (10 semitoni) | 20 % | 3.4 | 128/128 |
| 2 | y1 pad | 34 | 0 | 3 5 3 5 5 3 5 5 | 9 | C3..G4 (19 semitoni) | 10 % | 10.1 | 128/128 |
| 2 | y2 lead | 10 | 0 | 2 1 1 1 1 1 2 1 | 5 | G4..G5 (12 semitoni) | 8 % | 1.0 | 128/128 |
| 2 | y3 bass | 8 | 2 | 2 1 2 1 1 1 1 1 | 4 | C2..G2 (7 semitoni) | 6 % | 16.0 | 128/128 |
| 3 | y0 lead | 25 | 0 | 1 3 1 3 4 6 4 3 | 4 | G4..C5 (5 semitoni) | 20 % | 3.6 | 128/128 |
| 3 | y1 pad | 28 | 0 | 3 3 5 3 5 3 3 3 | 9 | C3..F4 (17 semitoni) | 8 % | 13.1 | 128/128 |
| 3 | y2 lead | 11 | 0 | 2 2 1 1 1 2 1 1 | 7 | G4..G5 (12 semitoni) | 9 % | 1.0 | 128/128 |
| 3 | y3 bass | 12 | 4 | 3 1 2 1 3 1 2 3 | 5 | C2..D3 (14 semitoni) | 9 % | 10.7 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.84; y0 0.99, y1 0.77, y2 0.76, y3 0.75.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 35.56 s | -2.5 | 0.75 | -24.4 | 21.9 | 0.00 % | 6 % | 0.49 s | 26.3 | 354 | 0.01 |
| 2 | 35.56 s | -3.0 | 0.71 | -24.6 | 21.7 | 0.00 % | 2 % | 0.22 s | 19.4 | 371 | 0.02 |
| 3 | 35.56 s | -3.9 | 0.64 | -24.4 | 20.5 | 0.00 % | 5 % | 0.49 s | 20.7 | 476 | 0.01 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 45 % | 38 % | 15 % | 1 % | 0 % | 0 % |
| 2 | 1 % | 46 % | 37 % | 16 % | 1 % | 0 % | 0 % |
| 3 | 1 % | 45 % | 33 % | 19 % | 2 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 27 nodi, 80 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore).
Alla fine: S 533, N 69, A 10.
#2-6 line×5: 386 celle x0-127 y0-3 z0-8, passi 1-5
  .→W 384: x0-127 y3 z6-8
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z5
#7-8 line×2: 256 celle x0-127 y3 z9-10, passi 6-7
  .→W 256: x0-127 y3 z9-10
#9-10 line×2: 256 celle x0-127 y3 z11-12, passi 8-9
  .→W 256: x0-127 y3 z11-12
#11-13 line×3: 384 celle x0-127 y3 z13-15, passi 10-12
  .→W 384: x0-127 y3 z13-15
 #14 one ****************. ***************** ***********… → ****************T ***************** ***********… (+5): ×7, 14 celle x0-112 y3 z0-4, passi 13-19
   r1 ****************. *************… → ****************T *************… ×2; r2 T**************** *************… → R**************** *************… ×2; r3 ****************. *************… → ****************T *************… ×0; r4 T**************** *************… → R**************** *************… ×0; r5 T**************** *************… → R**************** *************… ×0; r6 ****************. T************… → ****************T R************… ×3
  .→R 6: x96 y3 z0; x48 y3 z1; x64 y3 z2; x16 y3 z3; +2 scatole, 2 celle
  T→R 1: x0 y3 z0
  .→T 1: x112 y3 z3
 #15 all T → R: ×1, 1 celle x112 y3 z3, passi 20
  T→R 1: x112 y3 z3
 #16 all W → .: ×1, 1280 celle x0-127 y3 z6-15, passi 21
  W→. 1280: x0-127 y3 z6-15
 #17 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-4, passi 22
  .→X 8: x0 y1 z0; x96 y1 z0; x48 y1 z1; x64 y1 z2; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x96 y2 z0; x48 y2 z1; x64 y2 z2; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x96 y3 z0; x48 y3 z1; x64 y3 z2; +4 scatole, 4 celle
 #18 one ................ **************** *************… → NSSSSSSSSSSSSSSS **************** *************… (+2): ×8, 368 celle x0-127 y1 z0-11, passi 23-30
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ********........ **************… → ********NSSSSSSS **************… ×2; r3 ................ **************… → NSSSSSSSSSSSSSSS **************… ×1
  .→S 340: x1-15 y1 z0; x97-111 y1 z0; x49-63 y1 z1; x97-111 y1 z2; +24 scatole, 280 celle
  .→N 20: x72 y1 z2; x96 y1 z2; x88 y1 z3; x0 y1 z4; +16 scatole, 16 celle
  X→N 8: x0 y1 z0; x96 y1 z0; x48 y1 z1; x64 y1 z2; +4 scatole, 4 celle
 #19 one .*************** **************** *************… → N*************** **************** *************… (+2): ×8, 22 celle x0-120 y2 z0-11, passi 31-38
   r1 .*************** **************… → N*************** **************… ×2; r2 .*************** **************… → N*************** **************… ×6; r3 ********.******* **************… → ********N******* **************… ×0
  .→N 14: x8 y2 z4; x104 y2 z4; x56 y2 z5; x0 y2 z7; +10 scatole, 10 celle
  Z→. 8: x0 y2 z0; x96 y2 z0; x48 y2 z1; x64 y2 z2; +4 scatole, 4 celle
 #20 one Y............... → ASSSSSSSSSSSSSSS (+1): ×8, 128 celle x0-127 y3 z0-8, passi 39-46
   r1 Y............... → ASSSSSSSSSSSSSSS ×5; r2 ********........ **************… → ********NSSSSSSS **************… ×3
  .→S 117: x1-15 y3 z0; x65-79 y3 z2; x17-31 y3 z3; x81-95 y3 z3; +7 scatole, 57 celle
  Y→A 8: x0 y3 z0; x96 y3 z0; x48 y3 z1; x64 y3 z2; +4 scatole, 4 celle
  .→N 3: x104 y3 z4; x56 y3 z5; x40 y3 z8
 #21 one ****. M...* → ****M NSSS* (+7): ×31, 138 celle x0-126 y0 z0-5, passi 47-77
   r1 ****. M...* → ****M NSSS* ×6; r2 M...* ****. → NSSS* ****M ×7; r3 **. M.* → **M NS* ×3; r4 M.* **. → NS* **M ×6; r5 M........ → NSSSSSSSM ×4; r6 M.....* ******. → NSSSSS* ******M ×0; r7 M.... → .***M ×4; r8 M........ → .*******M ×1
  .→S 76: x105-111 y0 z0; x117-123 y0 z0; x23-29 y0 z2; x51-57 y0 z2; +22 scatole, 48 celle
  .→N 25: x44 y0 z0; x70 y0 z0; x74 y0 z0; x104 y0 z0; +21 scatole, 21 celle
  .→M 1: x126 y0 z1
  M→N 1: x0 y0 z5
 #22 all M → .: ×1, 1 celle x126 y0 z1, passi 78
  M→. 1: x126 y0 z1
 #23 one N/*/*/* → A/*/*/* passi=2: ×2, 2 celle x82-92 y0 z2-3, passi 79-80
  N→A 2: x82 y0 z2; x92 y0 z3
Senza effetto (non hanno mai cambiato una cella):
#24 all X → .: in quel momento nella griglia non c'erano celle "X"
#25 all Y → .: in quel momento nella griglia non c'erano celle "Y"
#26 all Z → .: in quel momento nella griglia non c'erano celle "Z"
#27 all D → .: in quel momento nella griglia non c'erano celle "D"
```
