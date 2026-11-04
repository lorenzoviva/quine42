# suono-steampunk-esplorazione-notte

> Steampunk, di notte: un carillon solo che rallenta, il ticchettio di un orologio da torre, vapore basso sotto i lampioni.

Sorgente: `lab/banco/suoni-cloud/steampunk/suono-steampunk-esplorazione-notte.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/steampunk/suono-steampunk-esplorazione-notte.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.72 (minima fra due semi 0.51), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.71 | 126-132 | 22 | -25.5..-25.4 | 0.86 | 10 % | 22.6 | 0.01 | 11 % | 128/128 |
| 4, 5, 6 | pulito | 0.67 | 127-128 | 20 | -25.7..-25.1 | 0.79 | 10 % | 24.7 | 0.01 | 13 % | 128/128 |
| 7, 8, 9 | pulito | 0.81 | 122-130 | 20 | -25.5..-25.1 | 0.79 | 11 % | 21.6 | 0.01 | 16 % | 128/128 |
| 10, 11, 12 | pulito | 0.69 | 116-119 | 20 | -25.8..-25.5 | 0.67 | 16 % | 25.1 | 0.01 | 13 % | 128/128 |
| 13, 14, 15 | pulito | 0.74 | 119-127 | 18 | -25.3..-25.1 | 0.79 | 13 % | 25.6 | 0.01 | 12 % | 128/128 |
| 16, 17, 18 | pulito | 0.70 | 125-129 | 20 | -25.5..-25.3 | 0.78 | 14 % | 27.0 | 0.01 | 9 % | 128/128 |
| 19, 20, 21 | pulito | 0.75 | 119-128 | 22 | -25.8..-25.4 | 0.79 | 12 % | 22.2 | 0.02 | 14 % | 128/128 |
| 22, 23, 24 | pulito | 0.71 | 118-122 | 21 | -25.7..-25.3 | 0.79 | 12 % | 22.9 | 0.03 | 13 % | 128/128 |
| 25, 26, 27 | pulito | 0.76 | 128-129 | 22 | -25.6..-25.4 | 0.62 | 12 % | 24.6 | 0.01 | 10 % | 128/128 |
| 28, 29, 30 | pulito | 0.79 | 124-128 | 20 | -25.4..-25.3 | 0.66 | 12 % | 24.5 | 0.01 | 12 % | 128/128 |

## Rapporto completo: Suono: suono-steampunk-esplorazione-notte (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 26.67 s a 72 bpm.
Dichiarata: A harmonic_minor (root 45); swing 0.00, cutoff 2600 Hz, space 0.60.
Tracce: y0 lead 0.40, y1 pad 0.50, y2 lead 0.34, y3 bass 0.50, y4 bass 0.40.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: . . . . . . . . . . . . . . . .
  y1 pad: A2~8+C3~8 . . . . . . . C3~8+E3~8 . . . . . . .
  y2 lead: C5 . . . A4 . . . E4 . . . C4 . . .
  y3 bass: K+A1!~16 . . . . . . . . . . . . . . .
  y4 bass: H . . . H . . . H . . . H . . .
battuta 2:
  y0 lead: G#4!~4 . . . . . . . A4~2 . . . . . . .
  y1 pad: D3~8+F3~8 . . . . . . . F3~8+A3~8 . . . . . . .
  y2 lead: D5 . . E5 . . D5 . . . . . . . . .
  y3 bass: D2!~16 . . . . . . . . . . . . . . .
  y4 bass: H . . . H . . . H . . . H . H .
battuta 3:
  y0 lead: . . . . . . B4~4 . . . C5~4 . . . D5~4 .
  y1 pad: C3~16+E3~16+G#3~16 . . . . . . . . . . . . . . .
  y2 lead: E5 . . . C5 . . . G#4 . . . E4 . . .
  y3 bass: C2!~8 . . . . . . . G#2~8 . . . . . . .
  y4 bass: H . . . H . . . H . . . H . . .
battuta 4:
  y0 lead: . . . . . . C5~2 . . . . . B4~4 . . .
  y1 pad: D3~16+F3~16+A3~16 . . . . . . . . . . . . . . .
  y2 lead: D5 . . A4 . . D5 . . A4 . . D5 . . .
  y3 bass: D2!~8 . . . . . . . A2~8 . . . . . . .
  y4 bass: H . . . H . . . H . . . H . . .
battuta 5:
  y0 lead: A4~4 . . . B4~2 . . . . . A4~4 . . . . .
  y1 pad: E3~16+G#3~16+B3~16 . . . . . . . . . . . . . . .
  y2 lead: B4 . . . E5 . . . B4 . . . G#4 . . .
  y3 bass: E2!~16 . . . . . . . . . . . . . . .
  y4 bass: H . . . H . . . H . . . H . H .
battuta 6:
  y0 lead: . . . . . . B4~4 . . . C5~4 . . . D5~2 .
  y1 pad: D3~16+F3~16+A3~16 . . . . . . . . . . . . . . .
  y2 lead: A4 . . . D5 . . . A4 . . . F4 . . .
  y3 bass: D2!~8 . . . . . . . A2~8 . . . . . . .
  y4 bass: K . . . H . . . H . . . H . . .
battuta 7:
  y0 lead: C5~4 . . . . . . . . . . . B4~2 . . .
  y1 pad: A2~16+C3~16+E3~16 . . . . . . . . . . . . . . .
  y2 lead: A4 . . B4 . . A4 . . . . . . . . .
  y3 bass: K+A1!~16 . . . . . . . . . . . . . . .
  y4 bass: H . . . H . . . H . . . H . H .
battuta 8:
  y0 lead: . . A4!~2 . G#4~2 . F4~4 . . . E4~4 . . . . .
  y1 pad: D3~8+F3~8 . . . . . . . F3~8+A3~8 . . . . . . .
  y2 lead: D5 . . A4 . . D5 . . A4 . . D5 . . .
  y3 bass: D2!~16 . . . . . . . . . . . . . . .
  y4 bass: H . . . H . . . H . . . H . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 126 | 42 % | 22 | A1..E5 (43 semitoni) | 100 % | 26 % | A harmonic_minor (0.88) | 0.88 | 5 % | 128/128 |
| 2 | 132 | 48 % | 23 | A1..E5 (43 semitoni) | 100 % | 18 % | A harmonic_minor (0.87) | 0.87 | 11 % | 128/128 |
| 3 | 127 | 41 % | 24 | A1..E5 (43 semitoni) | 100 % | 18 % | A harmonic_minor (0.88) | 0.88 | 10 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 19 | 0 | 0 2 3 2 3 3 2 4 | 7 | E4..D5 (10 semitoni) | 15 % | 3.3 | 128/128 |
| 1 | y1 pad | 27 | 0 | 4 4 3 3 3 3 3 4 | 8 | A2..B3 (14 semitoni) | 9 % | 12.4 | 128/128 |
| 1 | y2 lead | 32 | 0 | 4 3 4 5 4 4 3 5 | 9 | C4..E5 (16 semitoni) | 25 % | 1.0 | 128/128 |
| 1 | y3 bass | 11 | 2 | 2 1 2 2 1 2 2 1 | 6 | A1..A2 (12 semitoni) | 9 % | 11.6 | 128/128 |
| 1 | y4 bass | 0 | 35 | 4 5 4 4 5 4 5 4 | 0 | - | 27 % | 0.0 | 128/128 |
| 2 | y0 lead | 20 | 0 | 2 2 2 5 2 2 4 1 | 7 | A3..G#4 (11 semitoni) | 16 % | 3.3 | 128/128 |
| 2 | y1 pad | 27 | 0 | 4 4 3 3 4 3 3 3 | 9 | A2..B3 (14 semitoni) | 9 % | 12.4 | 128/128 |
| 2 | y2 lead | 36 | 0 | 5 5 5 3 5 5 5 3 | 7 | E4..E5 (12 semitoni) | 28 % | 1.0 | 128/128 |
| 2 | y3 bass | 13 | 2 | 3 2 1 2 2 1 2 2 | 6 | A1..B2 (14 semitoni) | 10 % | 9.8 | 128/128 |
| 2 | y4 bass | 0 | 34 | 4 4 4 5 4 4 5 4 | 0 | - | 27 % | 0.0 | 128/128 |
| 3 | y0 lead | 15 | 0 | 3 1 3 1 1 3 1 2 | 7 | A3..G#4 (11 semitoni) | 12 % | 3.3 | 128/128 |
| 3 | y1 pad | 27 | 0 | 4 4 3 3 3 3 4 3 | 9 | A2..B3 (14 semitoni) | 9 % | 12.4 | 128/128 |
| 3 | y2 lead | 34 | 0 | 5 5 4 4 5 3 3 5 | 9 | C4..E5 (16 semitoni) | 27 % | 1.0 | 128/128 |
| 3 | y3 bass | 12 | 3 | 2 1 3 2 1 3 1 2 | 6 | A1..B2 (14 semitoni) | 9 % | 10.7 | 128/128 |
| 3 | y4 bass | 0 | 36 | 5 4 4 5 4 5 5 4 | 0 | - | 28 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.71; y0 0.99, y1 0.63, y2 0.87, y3 0.82, y4 0.19.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 26.67 s | -4.1 | 0.62 | -25.4 | 21.3 | 0.00 % | 7 % | 0.24 s | 22.6 | 376 | 0.00 |
| 2 | 26.67 s | -4.4 | 0.60 | -25.5 | 21.1 | 0.00 % | 8 % | 0.34 s | 24.4 | 310 | 0.01 |
| 3 | 26.67 s | -1.3 | 0.86 | -25.5 | 24.1 | 0.00 % | 10 % | 0.39 s | 25.2 | 269 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 8 % | 51 % | 19 % | 21 % | 1 % | 0 % | 0 % |
| 2 | 8 % | 56 % | 20 % | 14 % | 0 % | 0 % | 0 % |
| 3 | 13 % | 57 % | 17 % | 12 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×5×14, 35 nodi, 96 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore), D=Battuta (marcatore).
Alla fine: S 469, N 79, H 34, A 10, K 1.
#2-20 line×19: 1162 celle x0-127 y0-4 z0-13, passi 1-19
  .→W 1152: x0-127 y3 z5-13
  .→D 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z6
#21-22 one×1, all×1: 15 celle x0-112 y3 z0-4, passi 20-27
  .→R 7: x96 y3 z0; x32 y3 z2; x16 y3 z3; x48 y3 z3; +3 scatole, 3 celle
  T→R 1: x0 y3 z0
 #23 all W → .: ×1, 1152 celle x0-127 y3 z5-13, passi 28
  W→. 1152: x0-127 y3 z5-13
 #24 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-4, passi 29
  .→X 8: x0 y1 z0; x96 y1 z0; x32 y1 z2; x16 y1 z3; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x96 y2 z0; x32 y2 z2; x16 y2 z3; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x96 y3 z0; x32 y3 z2; x16 y3 z3; +4 scatole, 4 celle
 #25 one ................ **************** .............… → NSSSSSSSSSSSSSSS **************** NSSSSSSSSSSSS… (+1): ×8, 336 celle x0-127 y1 z0-8, passi 30-37
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ********........ **************… → ********NSSSSSSS **************… ×3
  .→S 309: x97-111 y1 z0; x33-47 y1 z2; x97-111 y1 z2; x49-63 y1 z3; +23 scatole, 249 celle
  .→N 19: x0 y1 z2; x8 y1 z2; x96 y1 z2; x8 y1 z4; +15 scatole, 15 celle
  X→N 8: x0 y1 z0; x96 y1 z0; x32 y1 z2; x16 y1 z3; +4 scatole, 4 celle
 #26 one ***.************ **************** .*****.*****.… → ***N************ **************** N*****N*****N… (+2): ×8, 40 celle x0-124 y2 z0-13, passi 38-45
   r1 ***.************ **************… → ***N************ **************… ×2; r2 .*************** **************… → N*************** **************… ×4; r3 ***.************ .*****.*******… → ***N************ N*****N*******… ×2
  .→N 32: x12 y2 z2; x8 y2 z4; x44 y2 z4; x92 y2 z5; +28 scatole, 28 celle
  Z→. 8: x0 y2 z0; x96 y2 z0; x32 y2 z2; x16 y2 z3; +4 scatole, 4 celle
 #27 one ********........ **************** *************… → ********NSSSSSSS **************** *************… (+1): ×8, 128 celle x0-127 y3 z0-7, passi 46-53
   r1 ********........ **************… → ********NSSSSSSS **************… ×3; r2 Y............... → ASSSSSSSSSSSSSSS ×5
  .→S 117: x1-15 y3 z0; x97-111 y3 z0; x17-31 y3 z3; x113-127 y3 z3; +7 scatole, 57 celle
  Y→A 8: x0 y3 z0; x96 y3 z0; x32 y3 z2; x16 y3 z3; +4 scatole, 4 celle
  .→N 3: x40 y3 z6; x56 y3 z7; x88 y3 z7
 #28 one .***.***.***.*** D*************** → H***H***H***H*** .*************** (+2): ×8, 42 celle x0-124 y4 z0-1, passi 54-61
   r1 .***.***.***.*** D*************… → H***H***H***H*** .*************… ×4; r2 .***.***.***.*.* D*************… → H***H***H***H*H* .*************… ×3; r3 ****.***.***.*** D*************… → ****H***H***H*** K*************… ×1
  .→H 34: x0 y4 z1; x4 y4 z1; x8 y4 z1; x12 y4 z1; +30 scatole, 30 celle
  D→. 7: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +3 scatole, 3 celle
  D→K 1: x80 y4 z0
 #29 one ****. M...* → ****M NSSS* (+5): ×32, 107 celle x0-126 y0 z3-10, passi 62-93
   r1 ****. M...* → ****M NSSS* ×7; r2 M...* ****. → NSSS* ****M ×5; r3 **. M.* → **M NS* ×1; r4 M.* **. → NS* **M ×6; r5 M.... → .***M ×10; r6 M........ → .*******M ×3
 parte 1/4, passi 62-69:
  .→S 4: x17-19 y0 z6; x25 y0 z7
  .→N 2: x16 y0 z6; x24 y0 z7
  M→. 1: x0 y0 z6
  .→M 1: x38 y0 z8
 parte 2/4, passi 70-77:
  .→S 16: x65-67 y0 z7; x39-41 y0 z8; x61-63 y0 z8; x43-45 y0 z9; +2 scatole, 4 celle
  .→N 5: x64 y0 z7; x60 y0 z8; x42 y0 z9; x54 y0 z9; +1 scatole, 1 celle
  M→N 1: x38 y0 z8
  .→M 1: x68 y0 z8
 parte 3/4, passi 78-85:
  .→S 11: x75-77 y0 z7; x87-89 y0 z8; x91-93 y0 z9; x69 y0 z8; +1 scatole, 1 celle
  .→N 4: x74 y0 z7; x86 y0 z8; x90 y0 z9; x94 y0 z10
  M→N 1: x68 y0 z8
  .→M 1: x96 y0 z9
 parte 4/4, passi 86-93:
  .→S 12: x123-125 y0 z4; x119-121 y0 z5; x97-99 y0 z9; x117 y0 z6; +2 scatole, 2 celle
  .→N 5: x122 y0 z4; x118 y0 z5; x116 y0 z6; x114 y0 z7; +1 scatole, 1 celle
  .→M 1: x126 y0 z3
  M→N 1: x96 y0 z9
#30-31 all×1, one×1: 3 celle x16-126 y0 z3-7, passi 94-96
```
