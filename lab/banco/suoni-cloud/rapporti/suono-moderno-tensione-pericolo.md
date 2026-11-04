# suono-moderno-tensione-pericolo

> Moderno, il pericolo: mezzo tempo pesante, hi-hat a raffica, un basso lungo che trema e un richiamo frigio.

Sorgente: `lab/banco/suoni-cloud/moderno/suono-moderno-tensione-pericolo.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-tensione-pericolo.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.64 (minima fra due semi 0.54), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.61 | 178-186 | 21 | -23.4..-23.1 | 1.13 | 26 % | 28.9 | 0.00 | 19 % | 128/128 |
| 4, 5, 6 | pulito | 0.64 | 181-191 | 19 | -23.8..-22.5 | 1.24 | 28 % | 28.1 | 0.00 | 18 % | 128/128 |
| 7, 8, 9 | pulito | 0.66 | 164-174 | 20 | -22.8..-22.3 | 1.08 | 26 % | 29.9 | 0.00 | 24 % | 128/128 |
| 10, 11, 12 | pulito | 0.63 | 164-187 | 18 | -24.0..-21.9 | 1.08 | 28 % | 28.5 | 0.00 | 34 % | 128/128 |
| 13, 14, 15 | pulito | 0.61 | 172-179 | 20 | -24.2..-22.5 | 1.13 | 28 % | 28.1 | 0.00 | 13 % | 128/128 |
| 16, 17, 18 | pulito | 0.64 | 166-184 | 19 | -22.4..-22.0 | 1.07 | 24 % | 25.2 | 0.01 | 32 % | 128/128 |
| 19, 20, 21 | pulito | 0.62 | 160-180 | 18 | -23.2..-22.9 | 1.08 | 27 % | 28.5 | 0.00 | 22 % | 128/128 |
| 22, 23, 24 | pulito | 0.63 | 161-182 | 18 | -23.8..-22.4 | 1.09 | 27 % | 28.0 | 0.00 | 9 % | 128/128 |
| 25, 26, 27 | pulito | 0.65 | 170-177 | 18 | -23.3..-22.2 | 1.12 | 25 % | 28.2 | 0.00 | 41 % | 128/128 |
| 28, 29, 30 | pulito | 0.66 | 174-186 | 20 | -23.3..-22.2 | 1.08 | 28 % | 28.1 | 0.00 | 32 % | 128/128 |

## Rapporto completo: Suono: suono-moderno-tensione-pericolo (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 13.71 s a 140 bpm.
Dichiarata: E phrygian (root 40); swing 0.00, cutoff 4000 Hz, space 0.30.
Tracce: y0 lead 0.42, y1 pad 0.40, y2 bass 0.65, y3 bass 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: E4 F4 E4 . . F4!~2 . . . . . . . G4~2 . .
  y1 pad: E2~4+F2~4+B2~4 . . . . . . . . . . . . . . .
  y2 bass: K+E1!~6 . . . . . . . K+E1!~6 . . . . . . .
  y3 bass: K . H . H H H . C . H H K . H H
battuta 2:
  y0 lead: . . . . . . . . . . . . . D4 E4 .
  y1 pad: . . . . . . . . F2~8+G2~8+C3~8 . . . . . . .
  y2 bass: F1!~3 . . . F1!~3 . . . . . F1!~5 . . . . .
  y3 bass: K . H H H . H H C . H H H H H H
battuta 3:
  y0 lead: . . . . . . . . . F4 . . E4~3 . . E4
  y1 pad: . . . . . . . . F2~8+G2~8+C3~8 . . . . . . .
  y2 bass: F1!~6 . . . . . . . F1!~6 . . . . . . .
  y3 bass: K . H H H H H H C . H . H H K H
battuta 4:
  y0 lead: F4~3 . . F4~3 . . F4~2 . . . . . . . C4 .
  y1 pad: G2~8+D3~8 . . . . . . . . . . . . . . .
  y2 bass: G1!~3 . . . G1!~3 . . . . . G1!~5 . . . . .
  y3 bass: K . H H H . H H C . H H H H H H
battuta 5:
  y0 lead: . . . . . D4!~2 . E4!~2 . . . . . . . B3
  y1 pad: . . . . . . . . F2~8+G2~8+C3~8 . . . . . . .
  y2 bass: F1!~6 . . . . . . . F1!~6 . . . . . . .
  y3 bass: K . H H H . H H C . H H H H H H
battuta 6:
  y0 lead: A3 . . G3! A3! B3 C4!~2 . . . D4 . . E4!~2 . F4
  y1 pad: E2~8+B2~8 . . . . . . . . . . . . . . .
  y2 bass: K+E1!~3 . . . K+E1!~3 . . . . . K+E1!~5 . . . . .
  y3 bass: K . H H H . H H C . H H H H H H
battuta 7:
  y0 lead: G4 . . F4 E4~2 . B3 A3! B3 . . . . . . A3~2
  y1 pad: A2~4+B2~4+E3~4 . . . . . . . . . . . . . . .
  y2 bass: A1!~10 . . . . . . . . . . . B1~4 . . .
  y3 bass: K . H H H . H H C . H H H H H H
battuta 8:
  y0 lead: . . . . . . . E3 . . . . F3 . . .
  y1 pad: . . . . . . . . G2~8+A2~8+D3~8 . . . . . . .
  y2 bass: G1!~6 . . . . . . . G1!~6 . . . . . . .
  y3 bass: K . H . H H H . C . H H K . H H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 180 | 83 % | 22 | E1..G4 (39 semitoni) | 100 % | 20 % | E phrygian (0.66) | 0.66 | 11 % | 128/128 |
| 2 | 186 | 82 % | 21 | E1..B4 (43 semitoni) | 100 % | 20 % | E phrygian (0.64) | 0.64 | 19 % | 128/128 |
| 3 | 178 | 80 % | 21 | E1..G4 (39 semitoni) | 100 % | 20 % | E phrygian (0.62) | 0.62 | 8 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 34 | 0 | 5 2 3 4 3 8 7 2 | 10 | E3..G4 (15 semitoni) | 27 % | 1.4 | 128/128 |
| 1 | y1 pad | 22 | 0 | 3 3 3 2 3 2 3 3 | 8 | E2..E3 (12 semitoni) | 6 % | 6.9 | 128/128 |
| 1 | y2 bass | 19 | 5 | 4 3 2 3 2 6 2 2 | 5 | E1..B1 (7 semitoni) | 15 % | 5.0 | 128/128 |
| 1 | y3 bass | 0 | 100 | 11 13 13 13 13 13 13 11 | 0 | - | 78 % | 0.0 | 128/128 |
| 2 | y0 lead | 41 | 0 | 5 7 5 3 3 3 7 8 | 9 | F3..B4 (18 semitoni) | 32 % | 1.4 | 128/128 |
| 2 | y1 pad | 23 | 0 | 3 3 3 3 3 3 3 2 | 8 | E2..E3 (12 semitoni) | 6 % | 5.9 | 128/128 |
| 2 | y2 bass | 19 | 5 | 4 2 6 3 3 2 2 2 | 4 | E1..A1 (5 semitoni) | 15 % | 5.1 | 128/128 |
| 2 | y3 bass | 0 | 98 | 10 13 13 10 13 13 13 13 | 0 | - | 77 % | 0.0 | 128/128 |
| 3 | y0 lead | 40 | 0 | 6 8 4 5 3 3 5 6 | 10 | E3..G4 (15 semitoni) | 31 % | 1.5 | 128/128 |
| 3 | y1 pad | 21 | 0 | 2 3 3 3 2 2 3 3 | 8 | E2..E3 (12 semitoni) | 6 % | 5.1 | 128/128 |
| 3 | y2 bass | 18 | 4 | 3 2 2 3 2 6 2 2 | 4 | E1..A1 (5 semitoni) | 14 % | 5.7 | 128/128 |
| 3 | y3 bass | 0 | 95 | 13 13 13 13 10 10 13 10 | 0 | - | 74 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.61; y0 0.97, y1 0.86, y2 0.77, y3 0.22.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 13.71 s | -0.2 | 1.07 | -23.1 | 22.9 | 0.00 % | 26 % | 0.09 s | 29.6 | 113 | 0.00 |
| 2 | 13.71 s | -0.2 | 1.08 | -23.1 | 23.0 | 0.00 % | 23 % | 0.14 s | 28.9 | 139 | 0.00 |
| 3 | 13.71 s | -0.2 | 1.13 | -23.4 | 23.2 | 0.00 % | 25 % | 0.15 s | 28.9 | 117 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 36 % | 59 % | 3 % | 1 % | 0 % | 0 % | 0 % |
| 2 | 35 % | 57 % | 5 % | 2 % | 1 % | 0 % | 0 % |
| 3 | 33 % | 62 % | 2 % | 2 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 37 nodi, 116 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: S 221, H 81, N 49, A 26, K 11, C 8.
#2-6 line×5: 386 celle x0-127 y0-2 z0-7, passi 1-5
  .→W 384: x0-127 y2 z4-6
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#7-10 line×4: 512 celle x0-127 y2 z7-10, passi 6-9
  .→W 512: x0-127 y2 z7-10
#11-23 line×13: 648 celle x0-127 y2-3 z0-15, passi 10-22
  .→W 640: x0-127 y2 z11-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #24 one ****************. T**************** → ****************T R**************** (+3): ×7, 14 celle x0-112 y2 z0-3, passi 23-29
   r1 ****************. T************… → ****************T R************… ×2; r2 T**************** *************… → R**************** *************… ×3; r3 T***************. → R***************T ×1; r4 ****************. *************… → ****************T *************… ×1
  .→R 6: x80 y2 z0; x16 y2 z1; x32 y2 z1; x64 y2 z1; +2 scatole, 2 celle
  T→R 1: x0 y2 z0
  .→T 1: x112 y2 z2
 #25 all T → R: ×1, 1 celle x112 y2 z2, passi 30
  T→R 1: x112 y2 z2
 #26 all W → .: ×1, 1536 celle x0-127 y2 z4-15, passi 31
  W→. 1536: x0-127 y2 z4-15
 #27 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-3, passi 32
  .→X 8: x0 y1 z0; x80 y1 z0; x16 y1 z1; x32 y1 z1; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x80 y2 z0; x16 y2 z1; x32 y2 z1; +4 scatole, 4 celle
 #28 one ........******** **************** *************… → NSSSSSSS******** **************** *************… (+2): ×8, 156 celle x0-127 y1 z0-7, passi 33-40
   r1 ........******** **************… → NSSSSSSS******** **************… ×2; r2 ********........ **************… → ********NSSSSSSS **************… ×4; r3 ....************ **************… → NSSS************ **************… ×2
  .→S 130: x25-31 y1 z1-2; x41-47 y1 z1-2; x73-79 y1 z1-2; x121-127 y1 z2-3; +12 scatole, 74 celle
  .→N 18: x24 y1 z1-2; x40 y1 z1-2; x72 y1 z1-2; x120 y1 z2-3; +10 scatole, 10 celle
  X→N 4: x0 y1 z0; x80 y1 z0; x48 y1 z2; x96 y1 z3
  X→. 4: x16 y1 z1; x32 y1 z1; x64 y1 z1; x112 y1 z2
 #29 one ************.... Y.........****** → ************NSSS ASSSSSSSSS****** (+2): ×8, 95 celle x0-125 y2 z0-4, passi 41-48
   r1 ************.... Y.........****… → ************NSSS ASSSSSSSSS****… ×1; r2 Y.....**......** → ASSSSS**ASSSSS** ×4; r3 Y..*...***.....* → ASS*ASS***ASSSS* ×3
  .→S 76: x97-105 y2 z3; x1-5 y2 z0; x9-13 y2 z0; x33-37 y2 z1; +15 scatole, 52 celle
  .→A 10: x8 y2 z0; x84 y2 z0; x90 y2 z0; x20 y2 z1; +6 scatole, 6 celle
  Y→A 8: x0 y2 z0; x80 y2 z0; x16 y2 z1; x32 y2 z1; +4 scatole, 4 celle
  .→N 1: x108 y2 z4
 #30 one ********.******* **...*..**...... D************… → ********C******* **HHH*HH**HHHHHH K************… (+3): ×8, 100 celle x0-127 y3 z0-2, passi 49-56
   r1 ********.******* **...*..**....… → ********C******* **HHH*HH**HHHH… ×5; r2 ********.******* **.*...***..**… → ********C******* **H*HHH***HH**… ×2; r3 ********.******* **......**.*..… → ********C******* **HHHHHH**H*HH… ×1; r4 ********.******* **.*.*****.*..… → ********C******* **H*H*****H*HH… ×0
  .→H 81: x26-31 y3 z1; x34-39 y3 z1; x58-63 y3 z1; x74-79 y3 z1; +23 scatole, 57 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→C 8: x8 y3 z2; x24 y3 z2; x40 y3 z2; x56 y3 z2; +4 scatole, 4 celle
  .→K 3: x12 y3 z0; x46 y3 z0; x124 y3 z0
 #31 one *. M* → *M N* (+6): ×55, 125 celle x0-127 y0 z0-9, passi 57-111
   r1 *. M* → *M N* ×14; r2 M* *. → N* *M ×8; r3 M... → NSSM ×3; r4 **. M.* → **M AS* ×4; r5 M.* *** *** **. → NS* *** *** **M ×5; r6 M.. → .*M ×12; r7 M...... → .*****M ×9
 parte 1/4, passi 57-69:
  .→N 5: x29 y0 z6; x2 y0 z7; x30 y0 z7; x1 y0 z8; +1 scatole, 1 celle
  .→S 2: x6 y0 z8; x14 y0 z9
  M→N 1: x0 y0 z7
  .→A 1: x5 y0 z8
  .→M 1: x33 y0 z8
 parte 2/4, passi 70-83:
  .→S 9: x45-46 y0 z7; x49-50 y0 z8; x52-53 y0 z8; x70 y0 z6; +2 scatole, 2 celle
  .→N 8: x62 y0 z5; x44 y0 z7; x47 y0 z7; x71 y0 z7; +4 scatole, 4 celle
  .→M 1: x73 y0 z4
  .→A 1: x69 y0 z6
  M→. 1: x33 y0 z8
 parte 3/4, passi 84-97:
  .→N 8: x83 y0 z2; x80 y0 z3; x84 y0 z3; x79 y0 z4; +4 scatole, 4 celle
  .→A 2: x86 y0 z5; x93 y0 z7
```
