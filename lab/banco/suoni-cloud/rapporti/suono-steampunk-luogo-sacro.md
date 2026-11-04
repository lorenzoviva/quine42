# suono-steampunk-luogo-sacro

> Steampunk, la cattedrale delle macchine: un organo a vapore con accordi di settima, un pedale lento, un corale che risponde.

Sorgente: `lab/banco/suoni-cloud/steampunk/suono-steampunk-luogo-sacro.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/steampunk/suono-steampunk-luogo-sacro.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.84 (minima fra due semi 0.66), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.86 | 89-98 | 19 | -24.3..-24.0 | 0.69 | 5 % | 18.5 | 0.01 | 14 % | 128/128 |
| 4, 5, 6 | pulito | 0.82 | 79-90 | 21 | -24.1..-24.0 | 0.77 | 4 % | 20.1 | 0.01 | 8 % | 128/128 |
| 7, 8, 9 | pulito | 0.87 | 79-89 | 22 | -24.3..-24.1 | 0.70 | 1 % | 19.5 | 0.02 | 14 % | 128/128 |
| 10, 11, 12 | pulito | 0.86 | 80-90 | 20 | -24.4..-24.1 | 0.70 | 3 % | 19.4 | 0.01 | 11 % | 128/128 |
| 13, 14, 15 | pulito | 0.83 | 81-91 | 21 | -24.6..-23.9 | 0.65 | 3 % | 18.1 | 0.02 | 15 % | 128/128 |
| 16, 17, 18 | pulito | 0.88 | 85-98 | 20 | -24.3..-24.0 | 0.68 | 3 % | 18.5 | 0.01 | 16 % | 128/128 |
| 19, 20, 21 | pulito | 0.83 | 84-94 | 22 | -24.2..-24.1 | 0.76 | 4 % | 18.8 | 0.01 | 12 % | 128/128 |
| 22, 23, 24 | pulito | 0.87 | 85-97 | 20 | -24.4..-23.9 | 0.73 | 5 % | 21.9 | 0.02 | 17 % | 128/128 |
| 25, 26, 27 | pulito | 0.86 | 83-88 | 21 | -24.4..-24.2 | 0.67 | 6 % | 18.1 | 0.01 | 16 % | 128/128 |
| 28, 29, 30 | pulito | 0.91 | 90-93 | 20 | -24.3..-24.0 | 0.65 | 4 % | 20.1 | 0.01 | 20 % | 128/128 |

## Rapporto completo: Suono: suono-steampunk-luogo-sacro (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 32.00 s a 60 bpm.
Dichiarata: G dorian (root 43); swing 0.00, cutoff 3000 Hz, space 0.75.
Tracce: y0 lead 0.42, y1 pad 0.60, y2 bass 0.55, y3 pad 0.36.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: G4~4 . . . F4~8 . . . . . . . F4~4 . . .
  y1 pad: G2~16+A#2~16+D3~16+F3~16 . . . . . . . . . . . . . . .
  y2 bass: K+G1!~8 . . . . . . . D2~8 . . . . . . .
  y3 pad: . . . . . . . . . . . . . . . .
battuta 2:
  y0 lead: E4~2 . . . . . . . . . D4!~2 . . . . .
  y1 pad: C3~16+E3~16+G3~16+A#3~16 . . . . . . . . . . . . . . .
  y2 bass: C2!~16 . . . . . . . . . . . . . . .
  y3 pad: A#3~8 . . . . . . . A3~8 . . . . . . .
battuta 3:
  y0 lead: C4~4 . . . D4~4 . . . C4~4 . . . A#3~4 . . .
  y1 pad: A2~8+C3~8+E3~8 . . . . . . . A2~8+C3~8+E3~8+G3~8 . . . . . . .
  y2 bass: A1!~16 . . . . . . . . . . . . . . .
  y3 pad: G3~16 . . . . . . . . . . . . . . .
battuta 4:
  y0 lead: A3!~2 . G3~4 . . . A3~4 . . . . . . . G3~4 .
  y1 pad: D3~16+F3~16+A3~16+C4~16 . . . . . . . . . . . . . . .
  y2 bass: D2!~8 . . . . . . . A2~8 . . . . . . .
  y3 pad: G3~16 . . . . . . . . . . . . . . .
battuta 5:
  y0 lead: . . . . . . . . . . A3~4 . . . A#3~2 .
  y1 pad: G2~16+D3~16+G3~16 . . . . . . . . . . . . . . .
  y2 bass: K+G1!~8 . . . . . . . D2~8 . . . . . . .
  y3 pad: G3~8 . . . . . . . A3~16 . . . . . . .
battuta 6:
  y0 lead: C4~4 . . . A#3~4 . . . A3~2 . A#3~4 . . . A3~2 .
  y1 pad: C3~8+E3~8+G3~8 . . . . . . . C3~8+E3~8+G3~8+A#3~8 . . . . . . .
  y2 bass: C2!~8 . . . . . . . G2~8 . . . . . . .
  y3 pad: . . . . . . . . A3~16 . . . . . . .
battuta 7:
  y0 lead: A#3~4 . . . . . . . A3~8 . . . . . . .
  y1 pad: G2~16+A#2~16+D3~16+F3~16 . . . . . . . . . . . . . . .
  y2 bass: K+G1!~8 . . . . . . . D2~8 . . . . . . .
  y3 pad: . . . . . . . . A3~8 . . . . . . .
battuta 8:
  y0 lead: A3~4 . . . A#3~4 . . . C4~4 . . . A#3~2 . . .
  y1 pad: C3~16+E3~16+G3~16+A#3~16 . . . . . . . . . . . . . . .
  y2 bass: C2!~8 . . . . . . . G2~8 . . . . . . .
  y3 pad: A#3~8 . . . . . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 89 | 24 % | 19 | G1..G4 (36 semitoni) | 100 % | 26 % | G dorian (0.92) | 0.92 | 7 % | 128/128 |
| 2 | 98 | 28 % | 22 | G1..C5 (41 semitoni) | 100 % | 18 % | G dorian (0.83) | 0.83 | 14 % | 128/128 |
| 3 | 90 | 29 % | 23 | G1..C5 (41 semitoni) | 100 % | 22 % | G dorian (0.91) | 0.91 | 13 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 26 | 0 | 3 2 4 4 2 5 2 4 | 8 | G3..G4 (12 semitoni) | 20 % | 3.8 | 128/128 |
| 1 | y1 pad | 37 | 0 | 4 4 7 4 3 7 4 4 | 11 | G2..C4 (17 semitoni) | 8 % | 13.0 | 128/128 |
| 1 | y2 bass | 14 | 3 | 3 1 1 2 3 2 3 2 | 6 | G1..A2 (14 semitoni) | 11 % | 9.1 | 128/128 |
| 1 | y3 pad | 9 | 0 | 0 2 1 1 2 1 1 1 | 3 | G3..A#3 (3 semitoni) | 7 % | 11.6 | 128/128 |
| 2 | y0 lead | 29 | 0 | 6 3 2 2 4 6 4 2 | 7 | D4..C5 (10 semitoni) | 23 % | 3.7 | 128/128 |
| 2 | y1 pad | 47 | 0 | 4 7 4 7 7 4 7 7 | 10 | G2..D4 (19 semitoni) | 10 % | 10.0 | 128/128 |
| 2 | y2 bass | 10 | 2 | 3 1 2 1 1 1 2 1 | 6 | G1..A#2 (15 semitoni) | 8 % | 12.8 | 128/128 |
| 2 | y3 pad | 10 | 0 | 0 2 1 1 1 2 2 1 | 5 | F3..C4 (7 semitoni) | 8 % | 9.6 | 128/128 |
| 3 | y0 lead | 26 | 0 | 5 3 1 3 3 4 4 3 | 6 | E4..C5 (8 semitoni) | 20 % | 4.1 | 128/128 |
| 3 | y1 pad | 36 | 0 | 4 3 7 4 7 4 3 4 | 10 | G2..C4 (17 semitoni) | 8 % | 12.9 | 128/128 |
| 3 | y2 bass | 13 | 3 | 3 2 3 1 2 2 1 2 | 7 | G1..G2 (12 semitoni) | 10 % | 9.8 | 128/128 |
| 3 | y3 pad | 12 | 0 | 0 2 2 2 2 2 1 1 | 5 | G3..D4 (7 semitoni) | 9 % | 8.7 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.86; y0 0.95, y1 0.82, y2 0.72, y3 0.93.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 32.00 s | -3.9 | 0.64 | -24.3 | 20.4 | 0.00 % | 5 % | 0.30 s | 22.1 | 229 | 0.01 |
| 2 | 32.00 s | -3.8 | 0.64 | -24.0 | 20.2 | 0.00 % | 1 % | 0.17 s | 19.2 | 358 | 0.01 |
| 3 | 32.00 s | -3.2 | 0.69 | -24.1 | 20.9 | 0.00 % | 2 % | 0.23 s | 18.5 | 359 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 13 % | 67 % | 10 % | 9 % | 0 % | 0 % | 0 % |
| 2 | 12 % | 46 % | 24 % | 16 % | 1 % | 0 % | 0 % |
| 3 | 15 % | 47 % | 22 % | 15 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 29 nodi, 85 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, M=Testa della melodia (marcatore), Q=Testa del controcanto (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore).
Alla fine: S 724, N 76, A 10.
#2-7 line×6: 387 celle x0-127 y0-3 z0-9, passi 1-6
  .→W 384: x0-127 y2 z6-8
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
  .→Q 1: x16 y3 z9
#8-9 line×2: 256 celle x0-127 y2 z9-10, passi 7-8
  .→W 256: x0-127 y2 z9-10
#10-11 line×2: 256 celle x0-127 y2 z11-12, passi 9-10
  .→W 256: x0-127 y2 z11-12
#12-14 line×3: 384 celle x0-127 y2 z13-15, passi 11-13
  .→W 384: x0-127 y2 z13-15
 #15 one ****************. ***************** ***********… → ****************T ***************** ***********… (+5): ×7, 14 celle x0-112 y2 z0-4, passi 14-20
   r1 ****************. *************… → ****************T *************… ×4; r2 T**************** *************… → R**************** *************… ×1; r3 ****************. *************… → ****************T *************… ×0; r4 T**************** *************… → R**************** *************… ×1; r5 ****************. *************… → ****************T *************… ×0; r6 T**************** *************… → R**************** *************… ×1
  .→R 6: x64 y2 z0; x96 y2 z0; x32 y2 z1; x16 y2 z3; +2 scatole, 2 celle
  T→R 1: x0 y2 z0
  .→T 1: x112 y2 z3
 #16 all T → R: ×1, 1 celle x112 y2 z3, passi 21
  T→R 1: x112 y2 z3
 #17 all W → .: ×1, 1280 celle x0-127 y2 z6-15, passi 22
  W→. 1280: x0-127 y2 z6-15
 #18 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-4, passi 23
  .→X 8: x0 y1 z0; x64 y1 z0; x96 y1 z0; x32 y1 z1; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x64 y2 z0; x96 y2 z0; x32 y2 z1; +4 scatole, 4 celle
 #19 one ................ **************** .............… → NSSSSSSSSSSSSSSS **************** NSSSSSSSSSSSS… (+2): ×8, 480 celle x0-127 y1 z0-10, passi 24-31
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ********........ **************… → ********NSSSSSSS **************… ×2; r3 ................ **************… → NSSSSSSSSSSSSSSS **************… ×1
  .→S 443: x1-15 y1 z0; x65-79 y1 z0; x97-111 y1 z0; x1-15 y1 z2; +33 scatole, 383 celle
  .→N 29: x40 y1 z1; x0 y1 z2; x96 y1 z2; x32 y1 z3; +25 scatole, 25 celle
  X→N 8: x0 y1 z0; x64 y1 z0; x96 y1 z0; x32 y1 z1; +4 scatole, 4 celle
 #20 one Y............... → ASSSSSSSSSSSSSSS (+2): ×8, 128 celle x0-127 y2 z0-8, passi 32-39
   r1 Y............... → ASSSSSSSSSSSSSSS ×2; r2 ********........ **************… → ********NSSSSSSS **************… ×6; r3 ************.... **************… → ************NSSS **************… ×0
  .→S 114: x33-47 y2 z1; x17-31 y2 z3; x1-7 y2 z0; x65-71 y2 z0; +10 scatole, 70 celle
  Y→A 8: x0 y2 z0; x64 y2 z0; x96 y2 z0; x32 y2 z1; +4 scatole, 4 celle
  .→N 6: x8 y2 z4; x72 y2 z4; x104 y2 z4; x88 y2 z7; +2 scatole, 2 celle
 #21 one ****. M...* → ****M NSSS* (+5): ×33, 138 celle x0-126 y0 z0-7, passi 40-72
   r1 ****. M...* → ****M NSSS* ×6; r2 M...* ****. → NSSS* ****M ×11; r3 M........ → NSSSSSSSM ×2; r4 **. M.* → **M NS* ×4; r5 M.* **. → NS* **M ×3; r6 M.... → .***M ×7
 parte 1/4, passi 40-47:
  .→S 15: x5-11 y0 z6; x13-15 y0 z6; x1-3 y0 z7; x27 y0 z4; +1 scatole, 1 celle
  .→N 4: x26 y0 z4; x16 y0 z5; x4 y0 z6; x12 y0 z6
  .→M 1: x32 y0 z3
  M→N 1: x0 y0 z7
 parte 2/4, passi 48-55:
  .→S 19: x51-53 y0 z0; x55-57 y0 z1; x45-47 y0 z2; x33-35 y0 z3; +3 scatole, 7 celle
  .→N 6: x50 y0 z0; x48 y0 z1; x54 y0 z1; x44 y0 z2; +2 scatole, 2 celle
  .→M 1: x62 y0 z0
  M→N 1: x32 y0 z3
 parte 3/4, passi 56-63:
  .→S 14: x63-65 y0 z0; x75-77 y0 z1; x85-87 y0 z2; x81-83 y0 z3; +2 scatole, 2 celle
  .→N 5: x74 y0 z1; x88 y0 z1; x78 y0 z2; x84 y0 z2; +1 scatole, 1 celle
  M→N 1: x62 y0 z0
  .→M 1: x90 y0 z2
 parte 4/4, passi 64-72:
  .→S 24: x105-111 y0 z1; x113-115 y0 z1; x91-93 y0 z2; x97-99 y0 z2; +4 scatole, 8 celle
  .→N 7: x94 y0 z1; x104 y0 z1; x112 y0 z1; x96 y0 z2; +3 scatole, 3 celle
  M→N 1: x90 y0 z2
  .→M 1: x126 y0 z3
 #22 all M → .: ×1, 1 celle x126 y0 z3, passi 73
```
