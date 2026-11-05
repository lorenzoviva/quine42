# suono-futuristico-sotterraneo-abisso

> Futuristico, il vuoto sotto la stazione: un bordone frigio che vibra, sonar radi nel profondo, una macchina che batte lontana.

Sorgente: `lab/banco/suoni-cloud/futuristico/suono-futuristico-sotterraneo-abisso.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/futuristico/suono-futuristico-sotterraneo-abisso.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.81 (minima fra due semi 0.63), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.78 | 68-74 | 17 | -25.4..-24.4 | 0.89 | 13 % | 26.0 | 0.02 | 12 % | 128/128 |
| 4, 5, 6 | pulito | 0.84 | 71-75 | 17 | -24.9..-24.7 | 0.89 | 13 % | 26.0 | 0.01 | 16 % | 128/128 |
| 7, 8, 9 | pulito | 0.78 | 75-85 | 17 | -24.6..-24.4 | 0.89 | 16 % | 25.9 | 0.02 | 18 % | 128/128 |
| 10, 11, 12 | pulito | 0.84 | 72-79 | 14 | -24.8..-24.3 | 0.89 | 18 % | 26.8 | 0.01 | 17 % | 128/128 |
| 13, 14, 15 | pulito | 0.75 | 73-84 | 18 | -24.9..-24.6 | 0.87 | 13 % | 25.4 | 0.01 | 16 % | 128/128 |
| 16, 17, 18 | pulito | 0.79 | 69-79 | 17 | -24.8..-24.5 | 0.93 | 15 % | 28.3 | 0.01 | 12 % | 128/128 |
| 19, 20, 21 | pulito | 0.83 | 75-78 | 18 | -25.1..-24.5 | 0.86 | 12 % | 25.9 | 0.00 | 8 % | 128/128 |
| 22, 23, 24 | pulito | 0.78 | 68-82 | 16 | -24.8..-24.6 | 0.89 | 16 % | 29.5 | 0.01 | 6 % | 128/128 |
| 25, 26, 27 | pulito | 0.86 | 78-80 | 15 | -25.0..-24.5 | 1.00 | 16 % | 26.4 | 0.01 | 15 % | 128/128 |
| 28, 29, 30 | pulito | 0.86 | 68-72 | 16 | -25.1..-24.8 | 0.89 | 13 % | 26.4 | 0.02 | 17 % | 128/128 |

## Rapporto completo: Suono: suono-futuristico-sotterraneo-abisso (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 43.64 s a 44 bpm.
Dichiarata: C phrygian (root 36); swing 0.00, cutoff 1600 Hz, space 0.80.
Tracce: y0 lead 0.40, y1 pad 0.60, y2 lead 0.32, y3 bass 0.60, y4 bass 0.45.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: G3~6 . . . . . . . . . . . . . F3~6 .
  y1 pad: C2~16+G2~16 . . . . . . . . . . . . . . .
  y2 lead: C4 . . . . . . . . . . . C4 . . .
  y3 bass: K+C1!~16 . . . . . . . . . . . . . . .
  y4 bass: K . . . . . . . . . . . . . . .
battuta 2:
  y0 lead: . . . . . . . . . . . . D#3~6 . . .
  y1 pad: C#2~16+G#2~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . D#4 . . . . . . . . . . .
  y3 bass: C#1!~16 . . . . . . . . . . . . . . .
  y4 bass: . . . . . . . . K . . . . . . .
battuta 3:
  y0 lead: . . . . . . . . . . F3~6 . . . . .
  y1 pad: C#2~16+G#2~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . D#4 . . . . . . . . . . .
  y3 bass: C#1!~16 . . . . . . . . . . . . . . .
  y4 bass: K . . . . . . . . . . . . . . .
battuta 4:
  y0 lead: . . . . . . . . D#3~6 . . . . . . .
  y1 pad: D#2~8+F2~8+A#2~8 . . . . . . . D#2~8+A#2~8 . . . . . . .
  y2 lead: . . . . F4 . . . . . . . . . . .
  y3 bass: D#1!~8 . . . . . . . . . . . F1~4 . . .
  y4 bass: K . . . . . . . . . K . . . . .
battuta 5:
  y0 lead: . . . . . . F3!~6 . . . . . G3!~6 . . .
  y1 pad: C2~16+G2~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . C#4 . . . . . . . . . . .
  y3 bass: K+C1!~16 . . . . . . . . . . . . . . .
  y4 bass: K . . . . . . . . . . . . . . .
battuta 6:
  y0 lead: . . G#3~6 . . . . . . . . . . . . .
  y1 pad: C#2~8+D#2~8+G#2~8 . . . . . . . C#2~8+G#2~8 . . . . . . .
  y2 lead: C#4 . . C#4 . . . . . . . . . . . .
  y3 bass: C#1!~16 . . . . . . . . . . . . . . .
  y4 bass: . . . . . . . . K . . . . . . .
battuta 7:
  y0 lead: . . . . . . . . a#3 A#3 . . . . . .
  y1 pad: C2~16+G2~16 . . . . . . . . . . . . . . .
  y2 lead: . . . . C#4 . . . . . . . . . . .
  y3 bass: K+C1!~16 . . . . . . . . . . . . . . .
  y4 bass: K . . . . . . . . . . . . . . .
battuta 8:
  y0 lead: . . A#3~4 . . . C#4~6 . . . . . d#4 D#4 . .
  y1 pad: C#2~16+G#2~16 . . . . . . . . . . . . . . .
  y2 lead: C#4 . . . . . . . . . . . C#4 . . .
  y3 bass: C#1!~16 . . . . . . . . . . . . . . .
  y4 bass: K . . . . . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 68 | 25 % | 20 | C1..F4 (41 semitoni) | 100 % | 24 % | C phrygian (0.68) | 0.68 | 2 % | 128/128 |
| 2 | 74 | 32 % | 17 | C1..F4 (41 semitoni) | 100 % | 17 % | C phrygian (0.71) | 0.71 | 12 % | 128/128 |
| 3 | 71 | 23 % | 19 | C1..F4 (41 semitoni) | 100 % | 8 % | D# dorian (0.62) | 0.48 | 3 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 14 | 0 | 2 1 1 1 2 1 2 4 | 7 | D#3..D#4 (12 semitoni) | 11 % | 4.4 | 128/128 |
| 1 | y1 pad | 22 | 0 | 2 2 2 5 2 5 2 2 | 7 | C2..A#2 (10 semitoni) | 8 % | 12.4 | 128/128 |
| 1 | y2 lead | 11 | 0 | 2 1 1 1 1 2 1 2 | 4 | C4..F4 (5 semitoni) | 9 % | 1.0 | 128/128 |
| 1 | y3 bass | 9 | 3 | 2 1 1 2 2 1 2 1 | 4 | C1..F1 (5 semitoni) | 7 % | 13.8 | 128/128 |
| 1 | y4 bass | 0 | 9 | 1 1 1 2 1 1 1 1 | 0 | - | 7 % | 0.0 | 128/128 |
| 2 | y0 lead | 20 | 0 | 3 2 2 4 3 5 1 0 | 5 | G3..C#4 (6 semitoni) | 16 % | 3.3 | 128/128 |
| 2 | y1 pad | 19 | 0 | 2 2 5 2 2 2 2 2 | 6 | C2..A#2 (10 semitoni) | 7 % | 13.9 | 128/128 |
| 2 | y2 lead | 10 | 0 | 2 1 1 1 2 1 1 1 | 4 | C4..F4 (5 semitoni) | 8 % | 1.0 | 128/128 |
| 2 | y3 bass | 14 | 2 | 3 2 2 1 2 2 2 2 | 4 | C1..F1 (5 semitoni) | 11 % | 7.4 | 128/128 |
| 2 | y4 bass | 0 | 9 | 1 1 1 1 1 1 2 1 | 0 | - | 7 % | 0.0 | 128/128 |
| 3 | y0 lead | 15 | 0 | 2 2 3 2 0 1 3 2 | 9 | D#3..F4 (14 semitoni) | 12 % | 5.7 | 128/128 |
| 3 | y1 pad | 25 | 0 | 2 5 5 2 2 5 2 2 | 7 | C2..A#2 (10 semitoni) | 9 % | 11.2 | 128/128 |
| 3 | y2 lead | 12 | 0 | 2 1 2 2 1 2 1 1 | 4 | C4..F4 (5 semitoni) | 9 % | 1.0 | 128/128 |
| 3 | y3 bass | 8 | 1 | 2 1 1 1 1 1 1 1 | 3 | C1..D#1 (3 semitoni) | 6 % | 16.0 | 128/128 |
| 3 | y4 bass | 0 | 10 | 1 1 2 1 1 1 2 1 | 0 | - | 8 % | 0.0 | 64/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.78; y0 0.94, y1 0.70, y2 0.84, y3 0.71, y4 0.63.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 43.64 s | -1.1 | 0.89 | -24.7 | 23.5 | 0.00 % | 13 % | 0.57 s | 27.8 | 143 | 0.02 |
| 2 | 43.64 s | -1.7 | 0.82 | -25.4 | 23.6 | 0.00 % | 13 % | 0.38 s | 26.0 | 160 | 0.00 |
| 3 | 43.64 s | -1.0 | 0.89 | -24.4 | 23.3 | 0.00 % | 13 % | 1.12 s | 31.5 | 169 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 42 % | 45 % | 7 % | 6 % | 0 % | 0 % | 0 % |
| 2 | 43 % | 41 % | 9 % | 7 % | 0 % | 0 % | 0 % |
| 3 | 38 % | 46 % | 9 % | 7 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×5×16, 39 nodi, 88 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore), D=Battuta (marcatore).
Alla fine: S 415, N 42, A 10, K 9, G 2.
#2-6 line×5: 386 celle x0-127 y0-3 z0-5, passi 1-5
  .→W 384: x0-127 y3 z3-5
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z4
#7-10 line×4: 512 celle x0-127 y3 z6-9, passi 6-9
  .→W 512: x0-127 y3 z6-9
#11-14 line×4: 512 celle x0-127 y3 z10-13, passi 10-13
  .→W 512: x0-127 y3 z10-13
#15-24 line×10: 264 celle x0-127 y3-4 z0-15, passi 14-23
  .→W 256: x0-127 y3 z14-15
  .→D 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
 #25 one ****************. T**************** → ****************T R**************** (+4): ×7, 14 celle x0-112 y3 z0-2, passi 24-30
   r1 ****************. T************… → ****************T R************… ×4; r2 T**************** *************… → R**************** *************… ×1; r3 ****************. *************… → ****************T *************… ×0; r4 T**************** *************… → R**************** *************… ×1; r5 T***************. → R***************T ×1
  .→R 6: x64 y3 z0; x96 y3 z0; x16 y3 z1; x32 y3 z1; +2 scatole, 2 celle
  T→R 1: x0 y3 z0
  .→T 1: x112 y3 z1
 #26 all T → R: ×1, 1 celle x112 y3 z1, passi 31
  T→R 1: x112 y3 z1
 #27 all W → .: ×1, 1664 celle x0-127 y3 z3-15, passi 32
  W→. 1664: x0-127 y3 z3-15
 #28 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-2, passi 33
  .→X 8: x0 y1 z0; x64 y1 z0; x96 y1 z0; x16 y1 z1; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x64 y2 z0; x96 y2 z0; x16 y2 z1; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x64 y3 z0; x96 y3 z0; x16 y3 z1; +4 scatole, 4 celle
 #29 one ................ **************** *************… → NSSSSSSSSSSSSSSS **************** *************… (+1): ×8, 272 celle x0-127 y1 z0-6, passi 34-41
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×6; r2 ................ **************… → NSSSSSSSNSSSSSSS **************… ×2
  .→S 250: x1-15 y1 z0; x65-79 y1 z0; x97-111 y1 z0; x17-31 y1 z1; +16 scatole, 190 celle
  .→N 14: x88 y1 z1; x56 y1 z2; x80 y1 z2; x48 y1 z3; +10 scatole, 10 celle
  X→N 8: x0 y1 z0; x64 y1 z0; x96 y1 z0; x16 y1 z1; +4 scatole, 4 celle
 #30 one .***********.*** **************** *************… → N***********N*** **************** *************… (+2): ×8, 19 celle x0-124 y2 z0-10, passi 42-49
   r1 .***********.*** **************… → N***********N*** **************… ×2; r2 ****.*********** **************… → ****N*********** **************… ×5; r3 .**.************ **************… → N**N************ **************… ×1
  .→N 11: x0 y2 z7; x12 y2 z7; x68 y2 z8; x80 y2 z8; +7 scatole, 7 celle
  Z→. 8: x0 y2 z0; x64 y2 z0; x96 y2 z0; x16 y2 z1; +4 scatole, 4 celle
 #31 one Y............... → ASSSSSSSSSSSSSSS (+1): ×8, 124 celle x0-127 y3 z0-3, passi 50-57
   r1 Y............... → ASSSSSSSSSSSSSSS ×7; r2 ************.... Y.......******… → ************NSSS ASSSSSSS******… ×1
  .→S 115: x1-15 y3 z0; x65-79 y3 z0; x97-111 y3 z0; x17-31 y3 z1; +5 scatole, 55 celle
  Y→A 8: x0 y3 z0; x64 y3 z0; x96 y3 z0; x16 y3 z1; +4 scatole, 4 celle
  .→N 1: x60 y3 z3
 #32 one D*************** → K*************** (+2): ×8, 11 celle x0-112 y4 z0, passi 58-65
   r1 D*************** → K*************** ×5; r2 D*******.******* → .*******K******* ×2; r3 D*********.***** → K*********K***** ×1
  D→K 6: x0 y4 z0; x32 y4 z0; x48 y4 z0; x64 y4 z0; +2 scatole, 2 celle
  .→K 3: x24 y4 z0; x58 y4 z0; x88 y4 z0
  D→. 2: x16 y4 z0; x80 y4 z0
 #33 one ******. M.....* → ******M NSSSSS* (+5): ×20, 90 celle x0-126 y0 z2-9, passi 66-85
   r1 ******. M.....* → ******M NSSSSS* ×6; r2 M.....* ******. → NSSSSS* ******M ×3; r3 ****. ***** M...* → ****M ***** NSSS* ×1; r4 M........ → .*******M ×8; r5 M.... → .***M ×0; r6 M.. → GSM ×2
  .→S 50: x29-33 y0 z2; x57-61 y0 z2; x15-19 y0 z3; x43-47 y0 z3; +8 scatole, 30 celle
  .→N 9: x28 y0 z2; x56 y0 z2; x14 y0 z3; x42 y0 z3; +5 scatole, 5 celle
  .→G 2: x104 y0 z6; x124 y0 z9
  M→N 1: x0 y0 z4
  .→M 1: x126 y0 z9
 #34 all M → .: ×1, 1 celle x126 y0 z9, passi 86
  M→. 1: x126 y0 z9
 #35 one N/*/*/*/* → A/*/*/*/* passi=2: ×2, 2 celle x70-76 y0 z3-4, passi 87-88
  N→A 2: x70 y0 z3; x76 y0 z4
Senza effetto (non hanno mai cambiato una cella):
#36 all X → .: in quel momento nella griglia non c'erano celle "X"
```
