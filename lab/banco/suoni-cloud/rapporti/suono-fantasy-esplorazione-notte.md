# suono-fantasy-esplorazione-notte

> Fantasy, di notte all'aperto: una lira che pizzica poche note lontane, un bordone pentatonico, niente tamburi.

Sorgente: `lab/banco/suoni-cloud/fantasy/suono-fantasy-esplorazione-notte.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/fantasy/suono-fantasy-esplorazione-notte.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza media fra i 30 semi 0.87 (minima fra due semi 0.71, soglia 0,05), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.88 | 65-76 | 18 | -25.3..-24.9 | 0.72 | 13 % | 24.6 | 0.01 | 0 % | 128/128 |
| 4, 5, 6 | pulito | 0.86 | 69-77 | 15 | -25.2..-24.9 | 0.66 | 14 % | 22.7 | 0.01 | 0 % | 128/128 |
| 7, 8, 9 | pulito | 0.91 | 73-82 | 17 | -25.4..-24.6 | 0.75 | 13 % | 24.5 | 0.00 | 0 % | 128/128 |
| 10, 11, 12 | pulito | 0.89 | 77-82 | 17 | -25.1..-24.8 | 0.65 | 12 % | 19.6 | 0.00 | 0 % | 128/128 |
| 13, 14, 15 | pulito | 0.86 | 67-74 | 18 | -25.7..-25.3 | 0.70 | 13 % | 23.3 | 0.04 | 0 % | 128/128 |
| 16, 17, 18 | pulito | 0.86 | 66-69 | 18 | -25.9..-25.3 | 0.71 | 12 % | 23.4 | 0.03 | 0 % | 128/128 |
| 19, 20, 21 | pulito | 0.89 | 65-74 | 17 | -25.3..-24.8 | 0.68 | 12 % | 26.0 | 0.01 | 0 % | 128/128 |
| 22, 23, 24 | pulito | 0.87 | 69-76 | 16 | -25.3..-24.8 | 0.69 | 13 % | 22.2 | 0.01 | 0 % | 128/128 |
| 25, 26, 27 | pulito | 0.89 | 79-83 | 17 | -25.1..-24.9 | 0.70 | 11 % | 23.3 | 0.04 | 0 % | 128/128 |
| 28, 29, 30 | pulito | 0.84 | 72-76 | 15 | -25.3..-24.9 | 0.76 | 14 % | 24.4 | 0.01 | 0 % | 128/128 |

## Rapporto completo: Suono: suono-fantasy-esplorazione-notte (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 32.00 s a 60 bpm.
Dichiarata: A pentatonic_minor (root 45); swing 0.00, cutoff 1900 Hz, space 0.75.
Tracce: y0 lead 0.45, y1 pad 0.60, y2 lead 0.30, y3 bass 0.50.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: C5~3 . . . . . . . . . . a4 A4 G4~3 . .
  y1 pad: A2~16+D3~16+G3~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . G4 . . . . . A4 . . . . .
  y3 bass: K+A1!~12 . . . . . . . . . . . E2~4 . . .
battuta 2:
  y0 lead: . . . . A4~2 . . . . . D5~3 . . E5!~3 . .
  y1 pad: D3~16+G3~16+C4~16 . . . . . . . . . . . . . . .
  y2 lead: G5 . . . . . . . C5 . . . . . . .
  y3 bass: D2!~8 . . . . . . . D2~8 . . . . . . .
battuta 3:
  y0 lead: D5~3 . . C5~3 . . D5~3 . . . . . . E5~3 . .
  y1 pad: D3~16+G3~16 . . . . . . . . . . . . . . .
  y2 lead: G5 . . . . . . . C5 . . . . . . .
  y3 bass: D2!~8 . . . . . . . D2~8 . . . . . . .
battuta 4:
  y0 lead: D5~3 . . . . . . C5~6 . . . . . . . .
  y1 pad: A2~10+G3~10 . . . . . . . . . D3~6+G3~6 . . . . .
  y2 lead: . . . . . . . . . . . . A4 . . .
  y3 bass: K+A1!~12 . . . . . . . . . . . E2~4 . . .
battuta 5:
  y0 lead: . C5~6 . . . . . C5~3 . . . . . . D5~3 .
  y1 pad: E3~16+A3~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . . . . . . . . . E5 . . .
  y3 bass: E2!~16 . . . . . . . . . . . . . . .
battuta 6:
  y0 lead: . E5~3 . . G5~2 . . . . . C6~3 . . A5!~3 . .
  y1 pad: E3~16+A3~16+D4~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . . . A4 . . . D5 . . . A5 .
  y3 bass: E2!~16 . . . . . . . . . . . . . . .
battuta 7:
  y0 lead: G5~2 . . . . . . . . . . . . . . .
  y1 pad: D3~16+G3~16+C4~16 . . . . . . . . . . . . . . .
  y2 lead: G5 . . . . . . . C5 . . . . . . .
  y3 bass: D2!~16 . . . . . . . . . . . . . . .
battuta 8:
  y0 lead: . . . . . . . . . . C6~3 . . a4 A4 .
  y1 pad: E3~16+A3~16+D4~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . D5 . . . . . E5 . . . . .
  y3 bass: E2!~16 . . . . . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 76 | 30 % | 18 | A1..C6 (51 semitoni) | 100 % | 21 % | A pentatonic_minor (0.81) | 0.81 | 0 % | 128/128 |
| 2 | 65 | 27 % | 18 | A1..G5 (46 semitoni) | 100 % | 19 % | D pentatonic_minor (0.81) | 0.64 | 0 % | 128/128 |
| 3 | 75 | 30 % | 20 | A1..A5 (48 semitoni) | 100 % | 27 % | D dorian (0.83) | 0.79 | 0 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 24 | 0 | 4 3 4 2 3 4 1 3 | 8 | G4..C6 (17 semitoni) | 19 % | 2.8 | 128/128 |
| 1 | y1 pad | 23 | 0 | 3 3 2 4 2 3 3 3 | 7 | A2..D4 (17 semitoni) | 7 % | 14.6 | 128/128 |
| 1 | y2 lead | 15 | 0 | 2 2 2 1 1 3 2 2 | 7 | G4..A5 (14 semitoni) | 12 % | 1.0 | 128/128 |
| 1 | y3 bass | 12 | 2 | 3 2 2 3 1 1 1 1 | 3 | A1..E2 (7 semitoni) | 9 % | 10.7 | 128/128 |
| 2 | y0 lead | 17 | 0 | 3 2 2 3 1 2 3 1 | 9 | A3..E5 (19 semitoni) | 13 % | 3.2 | 128/128 |
| 2 | y1 pad | 19 | 0 | 3 2 2 3 2 3 2 2 | 6 | A2..A3 (12 semitoni) | 6 % | 16.0 | 128/128 |
| 2 | y2 lead | 17 | 0 | 2 2 2 2 2 2 2 3 | 6 | G4..G5 (12 semitoni) | 13 % | 1.0 | 128/128 |
| 2 | y3 bass | 10 | 2 | 2 2 2 1 1 2 1 1 | 3 | A1..D2 (5 semitoni) | 8 % | 12.8 | 128/128 |
| 3 | y0 lead | 18 | 0 | 5 2 2 2 0 1 3 3 | 7 | A3..C5 (15 semitoni) | 14 % | 3.3 | 128/128 |
| 3 | y1 pad | 24 | 0 | 3 3 2 2 4 3 4 3 | 8 | A2..D4 (17 semitoni) | 8 % | 13.3 | 128/128 |
| 3 | y2 lead | 17 | 0 | 3 2 2 2 3 2 2 1 | 7 | D4..A5 (19 semitoni) | 13 % | 1.0 | 128/128 |
| 3 | y3 bass | 13 | 3 | 3 1 2 3 2 2 1 2 | 5 | A1..G2 (10 semitoni) | 10 % | 9.8 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.88; y0 0.96, y1 0.77, y2 0.98, y3 0.76.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 32.00 s | -2.9 | 0.72 | -24.9 | 22.0 | 0.00 % | 9 % | 0.42 s | 24.6 | 456 | 0.00 |
| 2 | 32.00 s | -3.2 | 0.69 | -25.3 | 22.1 | 0.00 % | 13 % | 0.43 s | 27.7 | 343 | 0.01 |
| 3 | 32.00 s | -3.6 | 0.66 | -25.3 | 21.7 | 0.00 % | 10 % | 0.55 s | 26.3 | 311 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 7 % | 45 % | 12 % | 35 % | 1 % | 0 % | 0 % |
| 2 | 11 % | 52 % | 16 % | 21 % | 1 % | 0 % | 0 % |
| 3 | 13 % | 52 % | 19 % | 16 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×14, 27 nodi, 84 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore).
Alla fine: S 474, N 60, A 10, G 2.
#2-6 line×5: 386 celle x0-127 y0-3 z0-6, passi 1-5
  .→W 384: x0-127 y3 z4-6
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z6
#7-13 line×7: 896 celle x0-127 y3 z7-13, passi 6-12
  .→W 896: x0-127 y3 z7-13
 #14 one ****************. ***************** T**********… → ****************T ***************** R**********… (+6): ×7, 14 celle x0-112 y3 z0-3, passi 13-19
   r1 ****************. *************… → ****************T *************… ×1; r2 T**************** *************… → R**************** *************… ×1; r3 ****************. T************… → ****************T R************… ×1; r4 T**************** *************… → R**************** *************… ×1; r5 ****************. *************… → ****************T *************… ×1; r6 T**************** *************… → R**************** *************… ×0; r7 T***************. → R***************T ×2
  .→R 6: x48 y3 z0; x16 y3 z2; x32 y3 z2; x96 y3 z2; +2 scatole, 2 celle
  T→R 1: x0 y3 z0
  .→T 1: x112 y3 z3
 #15 all T → R: ×1, 1 celle x112 y3 z3, passi 20
  T→R 1: x112 y3 z3
 #16 all W → .: ×1, 1280 celle x0-127 y3 z4-13, passi 21
  W→. 1280: x0-127 y3 z4-13
 #17 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-3, passi 22
  .→X 8: x0 y1 z0; x48 y1 z0; x16 y1 z2; x32 y1 z2; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x48 y2 z0; x16 y2 z2; x32 y2 z2; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x48 y3 z0; x16 y3 z2; x32 y3 z2; +4 scatole, 4 celle
 #18 one ................ **************** .............… → NSSSSSSSSSSSSSSS **************** NSSSSSSSSSSSS… (+2): ×8, 336 celle x0-127 y1 z0-7, passi 23-30
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ................ **************… → NSSSSSSSSSSSSSSS **************… ×2; r3 ................ **************… → NSSSSSSSSSNSSSSS **************… ×1
  .→S 313: x1-15 y1 z0; x1-15 y1 z2; x17-31 y1 z2; x33-47 y1 z2; +19 scatole, 253 celle
  .→N 15: x0 y1 z2; x58 y1 z2; x0 y1 z4; x16 y1 z4; +11 scatole, 11 celle
  X→N 8: x0 y1 z0; x48 y1 z0; x16 y1 z2; x32 y1 z2; +4 scatole, 4 celle
 #19 one **********.***** ****.*********** *************… → **********N***** ****N*********** *************… (+3): ×8, 23 celle x0-122 y2 z0-10, passi 31-38
   r1 **********.***** ****.*********… → **********N***** ****N*********… ×2; r2 .*************** **************… → N*************** **************… ×3; r3 **************.* **************… → **************N* **************… ×1; r4 ************.*** **************… → ************N*** **************… ×2
  .→N 15: x4 y2 z4; x10 y2 z5; x60 y2 z5; x86 y2 z5; +11 scatole, 11 celle
  Z→. 8: x0 y2 z0; x48 y2 z0; x16 y2 z2; x32 y2 z2; +4 scatole, 4 celle
 #20 one Y............... → ASSSSSSSSSSSSSSS (+2): ×8, 128 celle x0-127 y3 z0-3, passi 39-46
   r1 Y............... → ASSSSSSSSSSSSSSS ×4; r2 Y............... → ASSSSSSSNSSSSSSS ×2; r3 ************.... **************… → ************NSSS **************… ×2
  .→S 116: x97-111 y3 z2; x65-79 y3 z3; x81-95 y3 z3; x113-127 y3 z3; +8 scatole, 56 celle
  Y→A 8: x0 y3 z0; x48 y3 z0; x16 y3 z2; x32 y3 z2; +4 scatole, 4 celle
  .→N 4: x24 y3 z2; x40 y3 z2; x12 y3 z3; x60 y3 z3
 #21 one ***. M..* → ***M NSS* (+7): ×35, 115 celle x0-127 y0 z4-12, passi 47-81
   r1 ***. M..* → ***M NSS* ×8; r2 M..* ***. → NSS* ***M ×7; r3 M...... → NSSSSSM ×2; r4 **. *** M.* → **M *** NS* ×3; r5 M...* ***** ****. → NSSS* ***** ****M ×0; r6 M.... → .***M ×11; r7 M........ → .*******M ×2; r8 M.* **. → GS* **M ×2
 parte 1/4, passi 47-54:
  .→S 8: x14-15 y0 z4; x1-2 y0 z6; x27-28 y0 z7; x12 y0 z5; +1 scatole, 1 celle
  .→N 3: x13 y0 z4; x20 y0 z5; x26 y0 z7
  .→G 1: x11 y0 z5
  M→N 1: x0 y0 z6
  .→M 1: x29 y0 z8
 parte 2/4, passi 55-63:
  .→S 17: x56-60 y0 z6; x36-37 y0 z6; x33-34 y0 z7; x39-40 y0 z7; +3 scatole, 6 celle
  .→N 6: x35 y0 z6; x55 y0 z6; x32 y0 z7; x38 y0 z7; +2 scatole, 2 celle
  .→M 1: x61 y0 z6
  M→N 1: x29 y0 z8
 parte 3/4, passi 64-72:
  .→S 14: x66-70 y0 z6; x72-73 y0 z6; x79-80 y0 z7; x82-83 y0 z8; +2 scatole, 3 celle
  .→N 6: x65 y0 z6; x71 y0 z6; x78 y0 z7; x81 y0 z8; +2 scatole, 2 celle
  M→. 1: x61 y0 z6
  .→M 1: x93 y0 z10
 parte 4/4, passi 73-81:
  .→S 6: x94-95 y0 z10; x123-124 y0 z11; x97 y0 z9; x126 y0 z12
  .→N 2: x96 y0 z9; x122 y0 z11
  M→N 1: x93 y0 z10
  .→M 1: x127 y0 z11
```
