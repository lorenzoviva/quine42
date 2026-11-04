# suono-moderno-esplorazione-notte

> Moderno, la città di notte: un groove pigro e trascinato, accordi di settima smorzati, un synth che pensa ad alta voce.

Sorgente: `lab/banco/suoni-cloud/moderno/suono-moderno-esplorazione-notte.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-esplorazione-notte.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.76 (minima fra due semi 0.56), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.76 | 146-148 | 20 | -24.8..-24.2 | 1.12 | 6 % | 22.4 | 0.00 | 0 % | 128/128 |
| 4, 5, 6 | pulito | 0.78 | 142-150 | 20 | -24.4..-23.8 | 1.00 | 8 % | 21.7 | 0.01 | 0 % | 128/128 |
| 7, 8, 9 | pulito | 0.76 | 141-150 | 20 | -24.5..-23.9 | 1.07 | 10 % | 22.6 | 0.00 | 0 % | 128/128 |
| 10, 11, 12 | pulito | 0.79 | 145-151 | 20 | -24.8..-23.9 | 1.07 | 11 % | 23.2 | 0.00 | 0 % | 128/128 |
| 13, 14, 15 | pulito | 0.72 | 151-153 | 18 | -24.3..-23.8 | 1.00 | 9 % | 22.3 | 0.00 | 0 % | 128/128 |
| 16, 17, 18 | pulito | 0.77 | 138-148 | 17 | -25.3..-23.9 | 1.10 | 12 % | 23.0 | 0.01 | 0 % | 128/128 |
| 19, 20, 21 | pulito | 0.81 | 143-154 | 19 | -24.7..-24.2 | 1.08 | 9 % | 21.4 | 0.00 | 0 % | 128/128 |
| 22, 23, 24 | pulito | 0.80 | 137-151 | 22 | -24.9..-24.3 | 1.02 | 10 % | 21.3 | 0.00 | 0 % | 128/128 |
| 25, 26, 27 | pulito | 0.78 | 136-147 | 17 | -24.6..-24.0 | 1.00 | 13 % | 22.1 | 0.01 | 0 % | 128/128 |
| 28, 29, 30 | pulito | 0.81 | 141-149 | 17 | -24.7..-24.1 | 1.01 | 8 % | 22.8 | 0.00 | 0 % | 128/128 |

## Rapporto completo: Suono: suono-moderno-esplorazione-notte (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 23.41 s a 82 bpm.
Dichiarata: A# pentatonic_minor (root 46); swing 0.30, cutoff 2200 Hz, space 0.55.
Tracce: y0 lead 0.44, y1 pad 0.50, y2 bass 0.58, y3 bass 0.50.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: c#5 A#4~2 . g#4 F4~3 . . . . . . . . . . .
  y1 pad: A#2~8+D#3~8+G#3~8 . . . . . . . A#2~8+D#3~8+G#3~8 . . . . . . .
  y2 bass: K+A#1!~6 . . . . . . . . F2 . D#2~2 . . . .
  y3 bass: K . . . C . . K . . K . C . . .
battuta 2:
  y0 lead: . C#4~2 . . . . . A#3~2 . C#4~3 . . . . F4~2 .
  y1 pad: D#3~8+G#3~8+C#4~8 . . . . . . . D#3~8+G#3~8+C#4~8 . . . . . . .
  y2 bass: D#2!~3 . . . . . . D#2 . . D#2!~2 . . . G#2 .
  y3 bass: K . . H C . . . . K . . C . H .
battuta 3:
  y0 lead: G#4~3 . . . . . . . . . . . . . . .
  y1 pad: C#3~16+F3~16+A#3~16+D#4~16 . . . . . . . . . . . . . . .
  y2 bass: C#2!~3 . . . . . . C#2 . . C#2!~2 . . . F2 .
  y3 bass: K . . H C . . . . K . . C . H .
battuta 4:
  y0 lead: . D#4 F4~2 . D#4! F4~2 . . . . . . . . . D#4~2
  y1 pad: F3~8+A#3~8+D#4~8 . . . . . . . F3~8+A#3~8+D#4~8 . . . . . . .
  y2 bass: F2!~6 . . . . . . . . C#3 . A#2~2 . . . .
  y3 bass: K . . . C . . K . . K . C . . .
battuta 5:
  y0 lead: . C#4 . . . . D#4~2 . . . . . . . F4~3 .
  y1 pad: G#3~8+C#4~8+F4~8 . . . . . . . G#3~8+C#4~8+F4~8 . . . . . . .
  y2 bass: G#2!~3 . . . . . . G#2 . . G#2!~2 . . . C#3 .
  y3 bass: K . . H C . . . . K . . C . H .
battuta 6:
  y0 lead: . A#4~2 . C#5~2 . . . D#5!~2 . C#5~2 . d#5 C#5!~3 . . .
  y1 pad: F3~8+A#3~8+D#4~8 . . . . . . . F3~8+A#3~8+D#4~8 . . . . . . .
  y2 bass: F2!~3 . . . . . . F2 . . F2!~2 . . . A#2 .
  y3 bass: K . . . C . . K . . K . C . . .
battuta 7:
  y0 lead: . . . . . F5 . . . . G#5~2 . . . . .
  y1 pad: C#3~16+F3~16+A#3~16+D#4~16 . . . . . . . . . . . . . . .
  y2 bass: C#2!~6 . . . . . . . . G#2 . F2~2 . . . .
  y3 bass: K . . . C . . K . . K . C . . .
battuta 8:
  y0 lead: F5~2 . . . G#5~2 . A#5 c#6 . . . . . . a#5 .
  y1 pad: F3~16+A#3~16+D#4~16+G#4~16 . . . . . . . . . . . . . . .
  y2 bass: F2!~3 . . . . . . F2 . . F2!~2 . . . A#2 .
  y3 bass: K . . H C . . . . K . . C . H .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 146 | 62 % | 22 | A#1..C#6 (51 semitoni) | 100 % | 20 % | A# pentatonic_minor (0.91) | 0.91 | 0 % | 128/128 |
| 2 | 148 | 62 % | 21 | A#1..A#5 (48 semitoni) | 100 % | 25 % | A# pentatonic_minor (0.82) | 0.82 | 0 % | 128/128 |
| 3 | 147 | 62 % | 20 | A#1..C#6 (51 semitoni) | 100 % | 18 % | A# pentatonic_minor (0.83) | 0.83 | 0 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 30 | 0 | 4 4 1 5 3 6 2 5 | 12 | A#3..C#6 (27 semitoni) | 23 % | 1.8 | 128/128 |
| 1 | y1 pad | 42 | 0 | 6 6 4 6 6 6 4 4 | 10 | A#2..G#4 (22 semitoni) | 10 % | 10.3 | 128/128 |
| 1 | y2 bass | 29 | 1 | 4 4 4 3 4 4 3 4 | 7 | A#1..C#3 (15 semitoni) | 23 % | 2.1 | 128/128 |
| 1 | y3 bass | 0 | 44 | 5 6 6 5 6 5 5 6 | 0 | - | 34 % | 0.0 | 128/128 |
| 2 | y0 lead | 30 | 0 | 3 3 4 1 3 5 7 4 | 8 | D#4..A#5 (19 semitoni) | 23 % | 2.0 | 128/128 |
| 2 | y1 pad | 42 | 0 | 4 6 6 6 6 4 6 4 | 9 | A#2..F4 (19 semitoni) | 10 % | 8.8 | 128/128 |
| 2 | y2 bass | 29 | 4 | 4 4 6 4 4 3 4 4 | 6 | A#1..A#2 (12 semitoni) | 23 % | 1.9 | 128/128 |
| 2 | y3 bass | 0 | 43 | 6 5 5 5 5 6 6 5 | 0 | - | 34 % | 0.0 | 128/128 |
| 3 | y0 lead | 32 | 0 | 5 8 4 3 1 5 3 3 | 7 | A#4..C#6 (15 semitoni) | 25 % | 1.9 | 128/128 |
| 3 | y1 pad | 42 | 0 | 4 6 6 6 4 4 6 6 | 8 | A#2..F4 (19 semitoni) | 10 % | 9.5 | 128/128 |
| 3 | y2 bass | 28 | 4 | 6 3 4 3 6 4 3 3 | 8 | A#1..D#3 (17 semitoni) | 22 % | 2.1 | 128/128 |
| 3 | y3 bass | 0 | 41 | 5 5 5 5 5 5 5 6 | 0 | - | 32 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.76; y0 0.98, y1 0.69, y2 0.90, y3 0.46.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 23.41 s | -0.2 | 0.97 | -24.6 | 24.4 | 0.00 % | 6 % | 0.13 s | 22.4 | 283 | 0.00 |
| 2 | 23.41 s | -0.2 | 1.00 | -24.2 | 24.0 | 0.00 % | 6 % | 0.13 s | 22.7 | 286 | 0.00 |
| 3 | 23.41 s | -0.2 | 1.12 | -24.8 | 24.7 | 0.00 % | 6 % | 0.14 s | 23.5 | 272 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 4 % | 67 % | 16 % | 12 % | 1 % | 0 % | 0 % |
| 2 | 8 % | 65 % | 11 % | 15 % | 2 % | 0 % | 0 % |
| 3 | 6 % | 71 % | 9 % | 13 % | 2 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 36 nodi, 112 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: S 448, N 80, K 20, A 16, C 16, H 8, G 5.
#2-22 line×21: 1418 celle x0-127 y0-3 z0-15, passi 1-21
  .→W 1408: x0-127 y2 z5-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z6
 #23 one ****************. ***************** T**********… → ****************T ***************** R**********… (+5): ×7, 14 celle x0-112 y2 z0-4, passi 22-28
   r1 ****************. *************… → ****************T *************… ×3; r2 T**************** *************… → R**************** *************… ×1; r3 ****************. *************… → ****************T *************… ×0; r4 T**************** *************… → R**************** *************… ×0; r5 ****************. T************… → ****************T R************… ×1; r6 T**************** *************… → R**************** *************… ×2
  .→R 6: x32 y2 z1; x96 y2 z1; x16 y2 z2; x48 y2 z3; +2 scatole, 2 celle
  T→R 1: x0 y2 z0
  .→T 1: x112 y2 z3
 #24 all T → R: ×1, 1 celle x112 y2 z3, passi 29
  T→R 1: x112 y2 z3
 #25 all W → .: ×1, 1408 celle x0-127 y2 z5-15, passi 30
  W→. 1408: x0-127 y2 z5-15
 #26 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-4, passi 31
  .→X 8: x0 y1 z0; x32 y1 z1; x96 y1 z1; x16 y1 z2; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x32 y2 z1; x96 y2 z1; x16 y2 z2; +4 scatole, 4 celle
 #27 one ................ **************** .............… → NSSSSSSSSSSSSSSS **************** NSSSSSSSSSSSS… (+2): ×8, 432 celle x0-127 y1 z0-9, passi 32-39
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×3; r2 ................ **************… → NSSSSSSSNSSSSSSS **************… ×5; r3 ........******** **************… → NSSSSSSS******** **************… ×0
  .→S 390: x33-47 y1 z1; x97-111 y1 z1; x33-47 y1 z3; x97-111 y1 z3; +38 scatole, 330 celle
  .→N 34: x8 y1 z0; x0 y1 z2; x8 y1 z2; x24 y1 z2; +30 scatole, 30 celle
  X→N 8: x0 y1 z0; x32 y1 z1; x96 y1 z1; x16 y1 z2; +4 scatole, 4 celle
 #28 one **************.* **************** Y..****.**..*… → **************N* **************** ASS****N**AS*… (+2): ×8, 62 celle x0-126 y2 z0-6, passi 40-47
   r1 **************.* **************… → **************N* **************… ×5; r2 *********.****** ***********..*… → *********N****** ***********NS*… ×3; r3 Y*****.***.***** → A*****A***N***** ×0
  .→S 33: x1-5 y2 z0; x97-101 y2 z1; x49-53 y2 z3; x33-34 y2 z1; +12 scatole, 16 celle
  .→N 16: x39 y2 z1; x11 y2 z2; x23 y2 z2; x9 y2 z3; +12 scatole, 12 celle
  Y→A 8: x0 y2 z0; x32 y2 z1; x96 y2 z1; x16 y2 z2; +4 scatole, 4 celle
  .→A 5: x42 y2 z1; x26 y2 z2; x90 y2 z3; x122 y2 z3; +1 scatole, 1 celle
 #29 one ****.*******.*** **************** D******.**.**… → ****C*******C*** **************** K******K**K**… (+2): ×8, 44 celle x0-126 y3 z0-2, passi 48-55
   r1 ****.*******.*** **************… → ****C*******C*** **************… ×4; r2 ****.*******.*** ***.**********… → ****C*******C*** ***H**********… ×4; r3 ****.*******.*** **************… → ****C*******C*** **************… ×0
  .→C 16: x4 y3 z2; x12 y3 z2; x20 y3 z2; x28 y3 z2; +12 scatole, 12 celle
  .→K 12: x7 y3 z0; x10 y3 z0; x25 y3 z0; x41 y3 z0; +8 scatole, 8 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→H 8: x19 y3 z1; x30 y3 z1; x35 y3 z1; x46 y3 z1; +4 scatole, 4 celle
 #30 one **. M.* → **M NS* (+7): ×53, 131 celle x0-127 y0 z0-11, passi 56-108
   r1 **. M.* → **M NS* ×8; r2 M.* **. → NS* **M ×7; r3 ***. **** M..* → ***M **** NSS* ×3; r4 M..* **** ***. → NSS* **** ***M ×2; r5 *. M* → *M N* ×5; r6 M.... → .***M ×13; r7 M.. → .*M ×10; r8 M* *. → G* *M ×5
 parte 1/4, passi 56-68:
  .→S 8: x26-27 y0 z1; x5-6 y0 z3; x24 y0 z0; x18 y0 z1; +2 scatole, 2 celle
  .→N 6: x23 y0 z0; x17 y0 z1; x25 y0 z1; x4 y0 z3; +2 scatole, 2 celle
  .→G 1: x3 y0 z4
  .→M 1: x32 y0 z4
  M→G 1: x0 y0 z6
 parte 2/4, passi 69-81:
  .→N 6: x65 y0 z1; x49 y0 z2; x52 y0 z2; x63 y0 z2; +2 scatole, 2 celle
  .→S 5: x33-34 y0 z4; x64 y0 z2; x51 y0 z3; x54 y0 z3
  .→M 1: x66 y0 z2
  M→N 1: x32 y0 z4
 parte 3/4, passi 82-94:
  .→S 9: x79-80 y0 z3; x93-94 y0 z6; x71 y0 z2; x82 y0 z5; +3 scatole, 3 celle
  .→N 7: x70 y0 z2; x78 y0 z3; x81 y0 z5; x83 y0 z6; +3 scatole, 3 celle
  M→. 1: x66 y0 z2
  .→G 1: x91 y0 z7
  .→M 1: x97 y0 z8
 parte 4/4, passi 95-108:
  .→N 5: x101 y0 z8; x112 y0 z8; x106 y0 z9; x116 y0 z9; +1 scatole, 1 celle
  .→S 3: x113 y0 z8; x107 y0 z9; x117 y0 z9
```
