# suono-futuristico-esplorazione-giorno

> Futuristico, di giorno su un altro pianeta: un arpeggio di cristallo in tre contro quattro, pad larghi, una batteria elettronica leggera.

Sorgente: `lab/banco/suoni-cloud/futuristico/suono-futuristico-esplorazione-giorno.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/futuristico/suono-futuristico-esplorazione-giorno.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.77 (minima fra due semi 0.55), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.78 | 201-217 | 20 | -23.7..-22.9 | 0.96 | 7 % | 18.0 | 0.00 | 31 % | 128/128 |
| 4, 5, 6 | pulito | 0.77 | 199-204 | 21 | -23.8..-23.3 | 1.03 | 6 % | 15.5 | 0.00 | 33 % | 128/128 |
| 7, 8, 9 | pulito | 0.80 | 191-203 | 20 | -23.9..-22.9 | 0.94 | 6 % | 16.9 | 0.01 | 38 % | 128/128 |
| 10, 11, 12 | pulito | 0.79 | 208-214 | 20 | -23.1..-22.4 | 0.99 | 4 % | 16.6 | 0.01 | 28 % | 128/128 |
| 13, 14, 15 | pulito | 0.73 | 185-205 | 20 | -23.3..-23.2 | 0.94 | 6 % | 17.1 | 0.00 | 42 % | 128/128 |
| 16, 17, 18 | pulito | 0.78 | 191-199 | 21 | -24.0..-22.8 | 1.00 | 7 % | 18.1 | 0.00 | 27 % | 128/128 |
| 19, 20, 21 | pulito | 0.80 | 191-214 | 19 | -23.9..-22.3 | 0.99 | 7 % | 16.5 | 0.00 | 38 % | 128/128 |
| 22, 23, 24 | pulito | 0.79 | 191-202 | 21 | -23.8..-23.2 | 0.98 | 6 % | 16.6 | 0.00 | 33 % | 128/128 |
| 25, 26, 27 | pulito | 0.77 | 202-210 | 20 | -24.2..-23.2 | 0.99 | 8 % | 18.3 | 0.00 | 38 % | 128/128 |
| 28, 29, 30 | pulito | 0.81 | 203-209 | 21 | -24.1..-22.9 | 0.97 | 5 % | 16.2 | 0.00 | 48 % | 128/128 |

## Rapporto completo: Suono: suono-futuristico-esplorazione-giorno (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 16.00 s a 120 bpm.
Dichiarata: E hirajoshi (root 52); swing 0.00, cutoff 7000 Hz, space 0.50.
Tracce: y0 lead 0.40, y1 pad 0.48, y2 lead 0.28, y3 bass 0.58, y4 bass 0.45.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: F#5 C6~2 . E6~2 . C6~2 . B5~2 . G5~4 . . . C6~2 . B5~2
  y1 pad: E3~16+G3~16+C4~16 . . . . . . . . . . . . . . .
  y2 lead: C6 . . G5 . . E5 . . G5 . . C6 . . B5
  y3 bass: K+E2! . . . E2 . . . K+E2! . . . G2 . . .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 2:
  y0 lead: . G5~4 . . . C6~4 . . . G5~4 . . . C6~2 . .
  y1 pad: G3~8+C4~8+F#4~8 . . . . . . . B3~8+E4~8 . . . . . . .
  y2 lead: G5 . . C6 . . F#6 . . C6 . . G5 . . C6
  y3 bass: G2! . . G2 . . G2 . G2! . . G2 . . C3 .
  y4 bass: K . . . C . . . K . K . C . . .
battuta 3:
  y0 lead: . . . E6~2 . . . . . . . . . F#6~2 . E6~2
  y1 pad: F#3~8+B3~8+E4~8 . . . . . . . G3~8+C4~8 . . . . . . .
  y2 lead: F#5 . . B5 . . E6 . . B5 . . F#5 . . B5
  y3 bass: F#2! . . . F#2 . . . F#2! . . . B2 . . .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 4:
  y0 lead: . C6 E5~2 . . . . . . . F#5!~2 . . . E5~2 .
  y1 pad: B3~16+E4~16+G4~16 . . . . . . . . . . . . . . .
  y2 lead: E5 . . E6 . . B5 . . E6 . . E5 . . F#6
  y3 bass: B2! . . . B2 . . . B2! . . . E3 . . .
  y4 bass: K . . . C . . . K . K . C . . .
battuta 5:
  y0 lead: . . F#5~2 . . . . . E5~4 . . . E6~2 . . .
  y1 pad: C4~16+F#4~16+B4~16 . . . . . . . . . . . . . . .
  y2 lead: C6 . . F#6 . . F#5 . . F#6 . . C6 . . F#6
  y3 bass: C3! . . C3 . . C3 . C3! . . C3 . . F#3 .
  y4 bass: K . . . C . . . K . K . C . . .
battuta 6:
  y0 lead: . . F#6~4 . . . C6~4 . . . G5~2 . F#5~2 . . .
  y1 pad: B3~8+E4~8+G4~8 . . . . . . . C4~8+F#4~8 . . . . . . .
  y2 lead: B5 . . E6 . . E5 . . E6 . . B5 . . E6
  y3 bass: B2! . . . B2 . . . B2! . . . E3 . . .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 7:
  y0 lead: G5!~2 . . . B5~2 . C6~4 . . . G5~2 . . . B5! F#6
  y1 pad: F#3~16+B3~16+E4~16 . . . . . . . . . . . . . . .
  y2 lead: E6 . . B5 . . F#5 . . B5 . . E6 . . C6
  y3 bass: F#2! . . . F#2 . . . F#2! . . . B2 . . .
  y4 bass: K . . . C . . H K . . . C . O .
battuta 8:
  y0 lead: . . . . G5~4 . . . . . . . . . E5 .
  y1 pad: B3~16+E4~16+G4~16 . . . . . . . . . . . . . . .
  y2 lead: B5 . . E6 . . E5 . . E6 . . B5 . . E6
  y3 bass: B2! . . B2 . . B2 . B2! . . B2 . . E3 .
  y4 bass: K . . . C . . . K . K . C . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 205 | 77 % | 21 | E2..F#6 (50 semitoni) | 100 % | 23 % | E hirajoshi (0.97) | 0.97 | 21 % | 128/128 |
| 2 | 217 | 77 % | 21 | E2..F#6 (50 semitoni) | 100 % | 24 % | E hirajoshi (0.95) | 0.95 | 19 % | 128/128 |
| 3 | 201 | 72 % | 20 | E2..F#6 (50 semitoni) | 100 % | 19 % | E hirajoshi (0.83) | 0.83 | 31 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 34 | 0 | 8 4 3 4 3 4 6 2 | 7 | E5..F#6 (14 semitoni) | 27 % | 2.4 | 128/128 |
| 1 | y1 pad | 30 | 0 | 3 5 5 3 3 5 3 3 | 9 | E3..B4 (19 semitoni) | 9 % | 12.0 | 128/128 |
| 1 | y2 lead | 48 | 0 | 6 6 6 6 6 6 6 6 | 7 | E5..F#6 (14 semitoni) | 38 % | 1.0 | 128/128 |
| 1 | y3 bass | 38 | 2 | 6 6 4 4 6 4 4 6 | 7 | E2..F#3 (14 semitoni) | 30 % | 1.0 | 128/128 |
| 1 | y4 bass | 0 | 53 | 9 5 9 5 5 9 6 5 | 0 | - | 41 % | 0.0 | 128/128 |
| 2 | y0 lead | 33 | 0 | 3 7 3 4 6 3 2 5 | 8 | C5..F#6 (18 semitoni) | 26 % | 2.2 | 128/128 |
| 2 | y1 pad | 32 | 0 | 5 5 3 3 5 5 3 3 | 8 | E3..G4 (15 semitoni) | 9 % | 11.0 | 128/128 |
| 2 | y2 lead | 50 | 0 | 6 6 6 6 6 8 6 6 | 7 | E5..F#6 (14 semitoni) | 39 % | 1.0 | 128/128 |
| 2 | y3 bass | 38 | 6 | 6 4 6 4 8 4 6 6 | 6 | E2..E3 (12 semitoni) | 30 % | 1.0 | 128/128 |
| 2 | y4 bass | 0 | 58 | 5 9 9 6 6 9 9 5 | 0 | - | 45 % | 0.0 | 128/128 |
| 3 | y0 lead | 33 | 0 | 2 6 5 3 5 2 4 6 | 7 | E5..F#6 (14 semitoni) | 26 % | 2.6 | 128/128 |
| 3 | y1 pad | 26 | 0 | 3 3 3 3 3 5 3 3 | 8 | E3..B4 (19 semitoni) | 7 % | 14.5 | 128/128 |
| 3 | y2 lead | 50 | 0 | 6 6 6 6 6 6 6 8 | 7 | E5..F#6 (14 semitoni) | 39 % | 1.0 | 128/128 |
| 3 | y3 bass | 40 | 4 | 6 4 6 4 8 6 4 6 | 6 | E2..F#3 (14 semitoni) | 31 % | 1.0 | 128/128 |
| 3 | y4 bass | 0 | 48 | 5 5 5 5 9 5 5 9 | 0 | - | 38 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.78; y0 0.96, y1 0.71, y2 0.88, y3 0.82, y4 0.47.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 16.00 s | -0.4 | 0.96 | -23.7 | 23.3 | 0.00 % | 4 % | 0.10 s | 18.0 | 528 | 0.00 |
| 2 | 16.00 s | -0.3 | 0.96 | -22.9 | 22.6 | 0.00 % | 4 % | 0.09 s | 18.0 | 457 | 0.00 |
| 3 | 16.00 s | -0.8 | 0.91 | -23.1 | 22.3 | 0.00 % | 7 % | 0.21 s | 21.9 | 485 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 57 % | 13 % | 24 % | 3 % | 1 % | 0 % |
| 2 | 1 % | 66 % | 9 % | 19 % | 2 % | 2 % | 0 % |
| 3 | 1 % | 62 % | 10 % | 21 % | 3 % | 1 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×5×16, 37 nodi, 118 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore), D=Battuta (marcatore).
Alla fine: S 377, N 131, K 20, A 19, H 17, C 16.
#2-22 line×21: 1418 celle x0-127 y0-4 z0-15, passi 1-21
  .→W 1408: x0-127 y3 z5-15
  .→D 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z6
#23-24 one×1, all×1: 15 celle x0-112 y3 z0-4, passi 22-29
  .→R 7: x32 y3 z1; x96 y3 z1; x16 y3 z2; x48 y3 z3; +3 scatole, 3 celle
  T→R 1: x0 y3 z0
 #25 all W → .: ×1, 1408 celle x0-127 y3 z5-15, passi 30
  W→. 1408: x0-127 y3 z5-15
 #26 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-4, passi 31
  .→X 8: x0 y1 z0; x32 y1 z1; x96 y1 z1; x16 y1 z2; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x32 y2 z1; x96 y2 z1; x16 y2 z2; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x32 y3 z1; x96 y3 z1; x16 y3 z2; +4 scatole, 4 celle
 #27 one ................ **************** .............… → NSSSSSSSSSSSSSSS **************** NSSSSSSSSSSSS… (+1): ×8, 360 celle x0-127 y1 z0-8, passi 32-39
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ........******** ********......… → NSSSSSSS******** ********NSSSSS… ×3
  .→S 330: x1-15 y1 z0; x97-111 y1 z1; x1-15 y1 z2; x49-63 y1 z3; +26 scatole, 270 celle
  .→N 22: x0 y1 z2; x40 y1 z2; x24 y1 z3; x32 y1 z3; +18 scatole, 18 celle
  X→N 8: x0 y1 z0; x32 y1 z1; x96 y1 z1; x16 y1 z2; +4 scatole, 4 celle
 #28 one ******.********* **************** ***.*****.***… → ******N********* **************** ***N*****N***… (+2): ×8, 56 celle x0-127 y2 z0-13, passi 40-47
   r1 ******.********* **************… → ******N********* **************… ×5; r2 .***********.*** **************… → N***********N*** **************… ×3; r3 ***.*****.****** **************… → ***N*****N****** **************… ×0
  .→N 48: x95-96 y2 z10; x6 y2 z5; x32 y2 z6; x44 y2 z6; +43 scatole, 43 celle
  Z→. 8: x0 y2 z0; x32 y2 z1; x96 y2 z1; x16 y2 z2; +4 scatole, 4 celle
#29-30 one×2: 91 celle x0-126 y3-4 z0-6, passi 48-63
  .→N 22: x4 y3 z0; x36 y3 z1; x100 y3 z1; x12 y3 z2; +18 scatole, 18 celle
  .→H 17: x14-15 y4 z1; x46-47 y4 z1; x94-95 y4 z1; x2 y4 z1; +10 scatole, 10 celle
  .→C 16: x4 y4 z2; x12 y4 z2; x20 y4 z2; x28 y4 z2; +12 scatole, 12 celle
  .→K 12: x8 y4 z0; x24 y4 z0; x26 y4 z0; x40 y4 z0; +8 scatole, 8 celle
  Y→A 8: x0 y3 z0; x32 y3 z1; x96 y3 z1; x16 y3 z2; +4 scatole, 4 celle
  .→A 8: x8 y3 z0; x40 y3 z1; x104 y3 z1; x24 y3 z2; +4 scatole, 4 celle
  D→K 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
 #31 one **. M.* → **M NS* (+6): ×51, 149 celle x0-127 y0 z6-15, passi 64-114
   r1 **. M.* → **M NS* ×10; r2 M.* **. → NS* **M ×10; r3 ****. ***** M...* → ****M ***** NSSS* ×3; r4 M...* ***** ****. → NSSS* ***** ****M ×6; r5 *. ** ** M* → *M ** ** N* ×5; r6 M.... → .***M ×6; r7 M.. → .*M ×11
 parte 1/4, passi 64-75:
  .→S 19: x10-12 y0 z7; x18-20 y0 z7; x26-28 y0 z7; x22-24 y0 z9; +7 scatole, 7 celle
  .→N 11: x9 y0 z7; x17 y0 z7; x25 y0 z7; x7 y0 z8; +7 scatole, 7 celle
  M→N 1: x0 y0 z6
  .→M 1: x31 y0 z10
 parte 2/4, passi 76-88:
  .→N 7: x49 y0 z9; x35 y0 z10; x47 y0 z10; x45 y0 z11; +3 scatole, 3 celle
  .→S 6: x36 y0 z10; x48 y0 z10; x46 y0 z11; x51 y0 z12; +2 scatole, 2 celle
  M→. 1: x31 y0 z10
  .→M 1: x64 y0 z13
 parte 3/4, passi 89-101:
  .→S 14: x87-89 y0 z9; x83-85 y0 z11; x73-75 y0 z12; x93 y0 z6; +4 scatole, 4 celle
  .→N 8: x92 y0 z6; x90 y0 z7; x96 y0 z7; x86 y0 z9; +4 scatole, 4 celle
  .→M 1: x98 y0 z8
  M→. 1: x64 y0 z13
 parte 4/4, passi 102-114:
  .→S 8: x103-105 y0 z9; x117-119 y0 z14; x107 y0 z7; x101 y0 z8
  .→N 7: x106 y0 z7; x100 y0 z8; x110 y0 z8; x102 y0 z9; +3 scatole, 3 celle
  M→. 1: x98 y0 z8
  .→M 1: x127 y0 z15
#32-33 all×1, one×1: 4 celle x58-127 y0 z7-15, passi 115-118
  N→A 3: x96 y0 z7; x110 y0 z8; x58 y0 z13
  M→. 1: x127 y0 z15
```
