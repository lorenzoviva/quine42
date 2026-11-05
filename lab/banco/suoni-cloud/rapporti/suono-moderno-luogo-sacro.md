# suono-moderno-luogo-sacro

> Moderno, un luogo sacro in città: un pad che respira, un arpeggio luccicante in sedicesimi lontani, nessuna cassa.

Sorgente: `lab/banco/suoni-cloud/moderno/suono-moderno-luogo-sacro.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-luogo-sacro.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.86 (minima fra due semi 0.55), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.86 | 139-146 | 24 | -24.6..-24.4 | 0.72 | 6 % | 14.7 | 0.01 | 6 % | 128/128 |
| 4, 5, 6 | pulito | 0.82 | 144-160 | 23 | -24.7..-24.2 | 0.67 | 6 % | 12.2 | 0.00 | 12 % | 128/128 |
| 7, 8, 9 | pulito | 0.92 | 135-160 | 21 | -24.7..-24.5 | 0.64 | 7 % | 12.3 | 0.02 | 10 % | 128/128 |
| 10, 11, 12 | pulito | 0.90 | 148-158 | 24 | -24.7..-24.3 | 0.64 | 7 % | 12.1 | 0.00 | 11 % | 128/128 |
| 13, 14, 15 | pulito | 0.83 | 153-156 | 22 | -24.5..-24.4 | 0.63 | 5 % | 12.3 | 0.01 | 9 % | 128/128 |
| 16, 17, 18 | pulito | 0.90 | 148-160 | 21 | -24.6..-24.3 | 0.63 | 6 % | 11.3 | 0.01 | 7 % | 128/128 |
| 19, 20, 21 | pulito | 0.89 | 130-161 | 23 | -24.8..-24.2 | 0.64 | 7 % | 12.4 | 0.01 | 9 % | 128/128 |
| 22, 23, 24 | pulito | 0.92 | 147-161 | 22 | -24.8..-24.5 | 0.65 | 10 % | 12.1 | 0.01 | 13 % | 128/128 |
| 25, 26, 27 | pulito | 0.89 | 148-175 | 22 | -24.4..-24.1 | 0.53 | 4 % | 11.9 | 0.01 | 12 % | 128/128 |
| 28, 29, 30 | pulito | 0.90 | 151-173 | 23 | -24.6..-24.0 | 0.62 | 7 % | 11.8 | 0.00 | 10 % | 128/128 |

## Rapporto completo: Suono: suono-moderno-luogo-sacro (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 29.09 s a 66 bpm.
Dichiarata: D dorian (root 50); swing 0.00, cutoff 5000 Hz, space 0.78.
Tracce: y0 lead 0.38, y1 pad 0.60, y2 lead 0.24, y3 bass 0.48.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: D5!~6 . . . . . E5~6 . . . . . D5~6 . . .
  y1 pad: D3~16+F3~16+A3~16+C4~16 . . . . . . . . . . . . . . .
  y2 lead: D4 . A4 . D5 . F5 . A5 . F5 . D5 . A4 .
  y3 bass: K+D2!~8 . . . . . . . A2~8 . . . . . . .
battuta 2:
  y0 lead: . . . . . . . . . . E5~4 . . . . .
  y1 pad: G3~16+B3~16+D4~16 . . . . . . . . . . . . . . .
  y2 lead: G4 . D5 . G5 . D5 . F5 . D5 . G5 . D5 .
  y3 bass: G2!~16 . . . . . . . . . . . . . . .
battuta 3:
  y0 lead: . . G5~4 . . . D5~6 . . . . . . . . .
  y1 pad: F3~16+A3~16+C4~16 . . . . . . . . . . . . . . .
  y2 lead: F4 . C5 . F5 . A5 . E5 . A5 . F5 . C5 .
  y3 bass: F2!~16 . . . . . . . . . . . . . . .
battuta 4:
  y0 lead: . . . . E5~6 . . . . . F5!~6 . . . . .
  y1 pad: B3~16+D4~16+F4~16+A4~16 . . . . . . . . . . . . . . .
  y2 lead: B4 . F5 . D5 . F5 . A5 . F5 . D5 . F5 .
  y3 bass: B2!~16 . . . . . . . . . . . . . . .
battuta 5:
  y0 lead: . . . . . . . . G5~4 . . . E5~6 . . .
  y1 pad: E3~16+G3~16+B3~16+D4~16 . . . . . . . . . . . . . . .
  y2 lead: E5 B4 G4 E4 G4 B4 E5 G5 E5 B4 G4 E4 . . . .
  y3 bass: E2!~16 . . . . . . . . . . . . . . .
battuta 6:
  y0 lead: . . F5~6 . . . . . . . . . . . . .
  y1 pad: A3~16+C4~16+E4~16+G4~16 . . . . . . . . . . . . . . .
  y2 lead: A4 E5 A5 E5 A5 E5 A4 E5 A5 E5 G5 E5 A5 E5 C5 E5
  y3 bass: A2!~16 . . . . . . . . . . . . . . .
battuta 7:
  y0 lead: E5~6 . . . . . . . . . D5~6 . . . . .
  y1 pad: D3~16+F3~16+A3~16 . . . . . . . . . . . . . . .
  y2 lead: D4 . A4 . D5 . F5 . A5 . F5 . D5 . A4 .
  y3 bass: K+D2!~16 . . . . . . . . . . . . . . .
battuta 8:
  y0 lead: . . . . . . . . A5~4 . . . . . . .
  y1 pad: A3~16+C4~16+E4~16+G4~16 . . . . . . . . . . . . . . .
  y2 lead: A4 E5 A5 E5 A5 E5 A4 E5 A5 E5 G5 E5 A5 E5 C5 E5
  y3 bass: A2!~8 . . . . . . . E3~8 . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 139 | 66 % | 25 | D2..A5 (43 semitoni) | 100 % | 19 % | D dorian (0.96) | 0.96 | 5 % | 128/128 |
| 2 | 146 | 70 % | 24 | D2..A5 (43 semitoni) | 100 % | 19 % | D dorian (0.91) | 0.91 | 6 % | 128/128 |
| 3 | 142 | 66 % | 24 | D2..A5 (43 semitoni) | 100 % | 27 % | D dorian (0.97) | 0.97 | 3 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 14 | 0 | 3 1 2 2 2 1 2 1 | 5 | D5..A5 (7 semitoni) | 11 % | 5.4 | 128/128 |
| 1 | y1 pad | 29 | 0 | 4 3 3 4 4 4 3 4 | 12 | D3..A4 (19 semitoni) | 6 % | 16.0 | 128/128 |
| 1 | y2 lead | 84 | 0 | 8 8 8 8 12 16 8 16 | 12 | D4..A5 (19 semitoni) | 66 % | 1.0 | 128/128 |
| 1 | y3 bass | 10 | 2 | 3 1 1 1 1 1 2 2 | 7 | D2..E3 (14 semitoni) | 8 % | 12.8 | 128/128 |
| 2 | y0 lead | 16 | 0 | 3 2 3 3 1 1 2 1 | 5 | B4..F5 (6 semitoni) | 13 % | 5.6 | 128/128 |
| 2 | y1 pad | 29 | 0 | 3 4 4 3 4 4 4 3 | 11 | D3..G4 (17 semitoni) | 6 % | 16.0 | 128/128 |
| 2 | y2 lead | 88 | 0 | 8 12 8 12 8 8 16 16 | 11 | D4..A5 (19 semitoni) | 69 % | 1.0 | 128/128 |
| 2 | y3 bass | 11 | 2 | 2 1 3 1 1 2 1 2 | 6 | D2..F3 (15 semitoni) | 9 % | 11.6 | 128/128 |
| 3 | y0 lead | 16 | 0 | 2 3 1 2 3 3 0 2 | 8 | E4..G5 (15 semitoni) | 13 % | 5.6 | 128/128 |
| 3 | y1 pad | 26 | 0 | 3 3 4 3 4 3 3 3 | 9 | D3..E4 (14 semitoni) | 6 % | 16.0 | 128/128 |
| 3 | y2 lead | 84 | 0 | 8 8 12 16 8 12 8 12 | 11 | D4..A5 (19 semitoni) | 66 % | 1.0 | 128/128 |
| 3 | y3 bass | 12 | 4 | 2 2 3 1 2 2 1 3 | 6 | D2..D3 (12 semitoni) | 9 % | 10.7 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.86; y0 0.92, y1 0.63, y2 0.92, y3 0.76.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 29.09 s | -2.8 | 0.72 | -24.6 | 21.7 | 0.00 % | 4 % | 0.11 s | 15.7 | 526 | 0.00 |
| 2 | 29.09 s | -4.8 | 0.61 | -24.4 | 19.6 | 0.00 % | 3 % | 0.12 s | 14.7 | 497 | 0.01 |
| 3 | 29.09 s | -4.3 | 0.61 | -24.5 | 20.2 | 0.00 % | 6 % | 0.16 s | 18.2 | 400 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 45 % | 19 % | 32 % | 4 % | 0 % | 0 % |
| 2 | 0 % | 46 % | 19 % | 31 % | 3 % | 0 % | 0 % |
| 3 | 0 % | 56 % | 20 % | 21 % | 3 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×18, 29 nodi, 73 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore).
Alla fine: S 615, N 127, A 10.
#2-6 line×5: 386 celle x0-127 y0-3 z0-8, passi 1-5
  .→W 384: x0-127 y3 z6-8
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z7
#7-8 line×2: 256 celle x0-127 y3 z9-10, passi 6-7
  .→W 256: x0-127 y3 z9-10
#9-10 line×2: 256 celle x0-127 y3 z11-12, passi 8-9
  .→W 256: x0-127 y3 z11-12
#11-12 line×2: 256 celle x0-127 y3 z13-14, passi 10-11
  .→W 256: x0-127 y3 z13-14
#13-15 line×3: 384 celle x0-127 y3 z15-17, passi 12-14
  .→W 384: x0-127 y3 z15-17
 #16 one ****************. ***************** ***********… → ****************T ***************** ***********… (+5): ×7, 14 celle x0-112 y3 z0-5, passi 15-21
   r1 ****************. *************… → ****************T *************… ×3; r2 T**************** *************… → R**************** *************… ×0; r3 ****************. *************… → ****************T *************… ×1; r4 T**************** *************… → R**************** *************… ×2; r5 ****************. T************… → ****************T R************… ×0; r6 T**************** *************… → R**************** *************… ×1
  .→R 6: x96 y3 z0; x64 y3 z1; x32 y3 z2; x16 y3 z3; +2 scatole, 2 celle
  T→R 1: x0 y3 z0
  .→T 1: x112 y3 z4
 #17 all T → R: ×1, 1 celle x112 y3 z4, passi 22
  T→R 1: x112 y3 z4
 #18 all W → .: ×1, 1536 celle x0-127 y3 z6-17, passi 23
  W→. 1536: x0-127 y3 z6-17
 #19 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-5, passi 24
  .→X 8: x0 y1 z0; x96 y1 z0; x64 y1 z1; x32 y1 z2; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x96 y2 z0; x64 y2 z1; x32 y2 z2; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x96 y3 z0; x64 y3 z1; x32 y3 z2; +4 scatole, 4 celle
 #20 one ................ **************** .............… → NSSSSSSSSSSSSSSS **************** NSSSSSSSSSSSS… (+1): ×8, 464 celle x0-127 y1 z0-11, passi 25-32
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ................ **************… → NSSSSSSSSSSSSSSS **************… ×3
  .→S 435: x1-15 y1 z0; x97-111 y1 z0; x65-79 y1 z1; x1-15 y1 z2; +25 scatole, 375 celle
  .→N 21: x0 y1 z2; x96 y1 z2; x64 y1 z3; x0 y1 z4; +17 scatole, 17 celle
  X→N 8: x0 y1 z0; x96 y1 z0; x64 y1 z1; x32 y1 z2; +4 scatole, 4 celle
 #21 one **********.***** **************** ***.*****.*.*… → **********N***** **************** ***N*****N*N*… (+2): ×8, 85 celle x0-127 y2 z0-16, passi 33-40
   r1 **********.***** **************… → **********N***** **************… ×2; r2 ********.******* **************… → ********N******* **************… ×5; r3 *******.******** **************… → *******N******** **************… ×1
  .→N 77: x67 y2 z1; x75 y2 z1; x66 y2 z3; x68 y2 z3; +73 scatole, 73 celle
  Z→N 7: x0 y2 z0; x96 y2 z0; x32 y2 z2; x16 y2 z3; +3 scatole, 3 celle
  Z→. 1: x64 y2 z1
 #22 one Y............... → ASSSSSSSSSSSSSSS (+1): ×8, 128 celle x0-127 y3 z0-8, passi 41-48
   r1 Y............... → ASSSSSSSSSSSSSSS ×6; r2 ********........ **************… → ********NSSSSSSS **************… ×2
  .→S 118: x97-111 y3 z0; x65-79 y3 z1; x33-47 y3 z2; x17-31 y3 z3; +6 scatole, 58 celle
  Y→A 8: x0 y3 z0; x96 y3 z0; x64 y3 z1; x32 y3 z2; +4 scatole, 4 celle
  .→N 2: x8 y3 z4; x120 y3 z8
 #23 one ******. M.....* → ******M NSSSSS* (+5): ×22, 106 celle x0-124 y0 z7-15, passi 49-70
   r1 ******. M.....* → ******M NSSSSS* ×6; r2 M.....* ******. → NSSSSS* ******M ×4; r3 ****. ***** M...* → ****M ***** NSSS* ×3; r4 M...* ***** ****. → NSSS* ***** ****M ×1; r5 M........ → .*******M ×4; r6 M.... → .***M ×4
  .→S 62: x1-5 y0 z7; x13-17 y0 z7; x7-11 y0 z8; x39-43 y0 z12; +10 scatole, 42 celle
  .→N 13: x12 y0 z7; x6 y0 z8; x26 y0 z8; x34 y0 z10; +9 scatole, 9 celle
  M→N 1: x0 y0 z7
  .→M 1: x124 y0 z13
 #24 all M → .: ×1, 1 celle x124 y0 z13, passi 71
  M→. 1: x124 y0 z13
 #25 one N/*/*/* → A/*/*/* passi=2: ×2, 2 celle x0-58 y0 z7-14, passi 72-73
  N→A 2: x0 y0 z7; x58 y0 z14
Senza effetto (non hanno mai cambiato una cella):
#26 all X → .: in quel momento nella griglia non c'erano celle "X"
#27 all Y → .: in quel momento nella griglia non c'erano celle "Y"
#28 all Z → .: in quel momento nella griglia non c'erano celle "Z"
#29 all D → .: in quel momento nella griglia non c'erano celle "D"
```
