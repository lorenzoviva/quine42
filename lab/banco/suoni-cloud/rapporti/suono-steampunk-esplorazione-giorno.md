# suono-steampunk-esplorazione-giorno

> Steampunk, di giorno tra le officine: ingranaggi in ottavi regolari, un carillon che gira sulle radici, un ottone in contrappunto.

Sorgente: `lab/banco/suoni-cloud/steampunk/suono-steampunk-esplorazione-giorno.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/steampunk/suono-steampunk-esplorazione-giorno.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.75 (minima fra due semi 0.59), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.73 | 364-376 | 24 | -23.6..-22.3 | 1.13 | 5 % | 18.4 | 0.01 | 13 % | 128/128 |
| 4, 5, 6 | pulito | 0.76 | 360-384 | 23 | -22.8..-22.7 | 1.05 | 5 % | 17.3 | 0.03 | 16 % | 128/128 |
| 7, 8, 9 | pulito | 0.78 | 342-386 | 25 | -23.7..-22.4 | 1.10 | 5 % | 17.7 | 0.01 | 16 % | 128/128 |
| 10, 11, 12 | pulito | 0.79 | 380-416 | 23 | -22.6..-22.3 | 1.03 | 6 % | 18.0 | 0.01 | 17 % | 128/128 |
| 13, 14, 15 | pulito | 0.78 | 377-392 | 25 | -23.4..-22.0 | 1.12 | 4 % | 17.9 | 0.01 | 15 % | 128/128 |
| 16, 17, 18 | pulito | 0.78 | 371-401 | 25 | -22.9..-22.5 | 1.06 | 5 % | 17.1 | 0.02 | 15 % | 128/128 |
| 19, 20, 21 | pulito | 0.71 | 358-400 | 25 | -23.0..-21.9 | 1.13 | 7 % | 18.7 | 0.02 | 16 % | 128/128 |
| 22, 23, 24 | pulito | 0.76 | 366-397 | 24 | -22.7..-22.0 | 1.06 | 3 % | 15.6 | 0.03 | 21 % | 128/128 |
| 25, 26, 27 | pulito | 0.76 | 374-394 | 26 | -23.3..-22.4 | 1.05 | 4 % | 15.5 | 0.04 | 15 % | 128/128 |
| 28, 29, 30 | pulito | 0.75 | 376-382 | 25 | -23.3..-22.6 | 1.13 | 5 % | 16.6 | 0.04 | 16 % | 128/128 |

## Rapporto completo: Suono: suono-steampunk-esplorazione-giorno (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 17.78 s a 108 bpm.
Dichiarata: C harmonic_minor (root 48); swing 0.00, cutoff 4200 Hz, space 0.35.
Tracce: y0 lead 0.48, y1 pad 0.42, y2 lead 0.30, y3 bass 0.60, y4 bass 0.50, y5 pad 0.36.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: . . . . . . . . C5~2 . D5~2 . D#5~4 . . .
  y1 pad: C3~4+D#3~4+G3~4 . . . . . C3~4+D#3~4+G3~4 . . . . . C3~4+D#3~4+G3~4 . . .
  y2 lead: C5 . D#5 . G5 . D#5 . C5 . G4 . C5 . D#5 .
  y3 bass: K+C2! . G2 . C3 . G2 . K+C2! . G2 . C3 . G2 .
  y4 bass: K H . H C H . H K H . H C H . H
  y5 pad: . . . . . . . . F3~8 . . . . . . .
battuta 2:
  y0 lead: G5 F5~2 . D#5 F5~2 . D#5~4 . . . C5~2 . D5 D#5~2 . D5
  y1 pad: F3~4+G#3~4+C4~4 . . . . . F3~4+G#3~4+C4~4 . . . . . F3~4+G#3~4+C4~4 . . .
  y2 lead: F5 . C5 . D#5 . C5 . F5 . C5 . F5 . C5 .
  y3 bass: F2! . F2 . C3 . F2 . F2! . F2 . C3 . G#2 .
  y4 bass: K H K H C H . H K H . H C H C H
  y5 pad: D#3~4 . . . G3~4 . . . . . . . . . . .
battuta 3:
  y0 lead: C5~2 . B4~2 . . . . . . . C5! D5 . . . .
  y1 pad: G3~8+B3~8+D4~8 . . . . . . . G3~8+B3~8+D4~8 . . . . . . .
  y2 lead: G5 D5 F5 D5 G5 D5 F5 D5 G5 D5 F5 D5 G5 . . .
  y3 bass: G2! . D3 . G3 . D3 . G2! . D3 . G3 . D3 .
  y4 bass: K H . H C H . H K H . H C H . H
  y5 pad: D#3~4 . . . . . . . . . . . C3~8 . . .
battuta 4:
  y0 lead: . . C5~2 . B4~2 . G#4~2 . B4~2 . C5~2 . D5~2 . D#5 .
  y1 pad: D3~8+F3~8+G#3~8 . . . . . . . D3~8+F3~8+G#3~8 . . . . . . .
  y2 lead: C5 . F5 . D5 . G#4 . D5 . F5 . C5 . . .
  y3 bass: D2! . D2 . G#2 . D2 . D2! . D2 . G#2 . F2 .
  y4 bass: K H . H C H . H K H . H C H . H
  y5 pad: . . . . D3~8 . . . . . . . C3~8 . . .
battuta 5:
  y0 lead: . F5~2 . . . G5! C5~2 . D5~2 . D#5~2 . . . D5 .
  y1 pad: G#3~4+C4~4+D#4~4 . . . . . G#3~4+C4~4+D#4~4 . . . . . G#3~4+C4~4+D#4~4 . . .
  y2 lead: C5 . D#5 . G5 . D#5 . C5 . D#5 . C5 . D#5 .
  y3 bass: G#2! . D#3 . C3 . D#3 . G#2! . D#3 . C3 . D#3 .
  y4 bass: K H K H C H . H K H . H C H C H
  y5 pad: . . . . D3~8 . . . . . . . . . . .
battuta 6:
  y0 lead: . C5! D5~2 . . . . . . . C5 . . . . .
  y1 pad: F3+G#3+C4 . F3+G#3+C4 . . . F3+G#3+C4 . F3+G#3+C4 . . . F3+G#3+C4 . . .
  y2 lead: F5 C5 D#5 C5 F5 C5 D#5 C5 F5 C5 D#5 C5 F5 . . .
  y3 bass: F2! . F2 . C3 . F2 . F2! . F2 . C3 . G#2 .
  y4 bass: K H K H C H . H K H . H C H C H
  y5 pad: . . . . C3~8 . . . . . . . D3~8 . . .
battuta 7:
  y0 lead: . G5~2 . C5~4 . . . F5~2 . G5~2 . C5~4 . . . .
  y1 pad: C3~8+D#3~8+G3~8 . . . . . . . C3~8+D#3~8+G3~8 . . . . . . .
  y2 lead: C5 . D#5 . G5 . D#5 . C5 . G4 . C5 . D#5 .
  y3 bass: K+C2! . C2 . G2 . C2 . K+C2! . C2 . G2 . D#2 .
  y4 bass: K H . H C H . H K H . H C H . H
  y5 pad: . . . . D#3~4 . . . G3~8 . . . . . . .
battuta 8:
  y0 lead: . F5~2 . G5~2 . . . F5~2 . D#5! . . F5~2 . D#5 .
  y1 pad: D3~8+F3~8+G#3~8 . . . . . . . D3~8+F3~8+G#3~8 . . . . . . .
  y2 lead: D5 . F5 . C5 . F5 . D5 . G#4 . D5 . F5 .
  y3 bass: D2! . D2 . G#2 . D2 . D2! . D2 . G#2 . F2 .
  y4 bass: K H . H C H . H K H K H C . O .
  y5 pad: F3~4 . . . G#3~8 . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 366 | 98 % | 24 | C2..G5 (43 semitoni) | 100 % | 22 % | C harmonic_minor (0.87) | 0.87 | 13 % | 128/128 |
| 2 | 364 | 100 % | 26 | C2..G#5 (44 semitoni) | 100 % | 23 % | C harmonic_minor (0.93) | 0.93 | 12 % | 128/128 |
| 3 | 376 | 97 % | 24 | C2..G5 (43 semitoni) | 100 % | 26 % | C harmonic_minor (0.93) | 0.93 | 11 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 43 | 0 | 3 9 4 7 6 3 5 6 | 7 | G#4..G5 (11 semitoni) | 34 % | 1.9 | 128/128 |
| 1 | y1 pad | 66 | 0 | 9 9 6 6 9 15 6 6 | 10 | C3..D#4 (15 semitoni) | 17 % | 4.8 | 128/128 |
| 1 | y2 lead | 73 | 0 | 8 8 13 7 8 13 8 8 | 7 | G4..G5 (12 semitoni) | 57 % | 1.0 | 128/128 |
| 1 | y3 bass | 64 | 4 | 10 8 8 8 8 8 10 8 | 10 | C2..G3 (19 semitoni) | 50 % | 1.0 | 128/128 |
| 1 | y4 bass | 0 | 102 | 12 14 12 12 14 14 12 12 | 0 | - | 80 % | 0.0 | 128/128 |
| 1 | y5 pad | 14 | 0 | 1 2 2 2 1 2 2 2 | 6 | C3..G#3 (8 semitoni) | 11 % | 6.6 | 128/128 |
| 2 | y0 lead | 42 | 0 | 8 8 4 4 4 7 1 6 | 7 | B4..G#5 (9 semitoni) | 33 % | 2.2 | 128/128 |
| 2 | y1 pad | 69 | 0 | 6 9 6 15 15 6 6 6 | 10 | C3..D#4 (15 semitoni) | 18 % | 4.4 | 128/128 |
| 2 | y2 lead | 72 | 0 | 8 8 8 13 7 8 13 7 | 8 | G4..G5 (12 semitoni) | 56 % | 1.0 | 128/128 |
| 2 | y3 bass | 64 | 4 | 10 8 10 8 8 8 8 8 | 10 | C2..D#3 (15 semitoni) | 50 % | 1.1 | 128/128 |
| 2 | y4 bass | 0 | 100 | 12 12 12 14 12 12 12 14 | 0 | - | 78 % | 0.0 | 8/128 |
| 2 | y5 pad | 13 | 0 | 1 3 2 1 1 1 3 1 | 4 | C3..F3 (5 semitoni) | 10 % | 7.1 | 128/128 |
| 3 | y0 lead | 42 | 0 | 7 4 6 7 5 4 4 5 | 9 | C4..D5 (14 semitoni) | 33 % | 2.1 | 128/128 |
| 3 | y1 pad | 81 | 0 | 15 15 9 6 6 9 15 6 | 8 | C3..D#4 (15 semitoni) | 21 % | 3.2 | 128/128 |
| 3 | y2 lead | 66 | 0 | 8 7 7 13 7 8 8 8 | 7 | G4..G5 (12 semitoni) | 52 % | 1.0 | 128/128 |
| 3 | y3 bass | 64 | 6 | 10 8 10 8 8 8 10 8 | 9 | C2..F3 (17 semitoni) | 50 % | 1.1 | 128/128 |
| 3 | y4 bass | 0 | 100 | 12 12 12 12 14 12 14 12 | 0 | - | 78 % | 0.0 | 128/128 |
| 3 | y5 pad | 17 | 0 | 1 3 2 3 2 2 2 2 | 7 | D#3..D4 (11 semitoni) | 13 % | 6.8 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.73; y0 0.99, y1 0.80, y2 0.83, y3 0.86, y4 0.15, y5 0.90.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 17.78 s | -0.2 | 0.99 | -22.5 | 22.3 | 0.00 % | 3 % | 0.09 s | 18.6 | 363 | 0.01 |
| 2 | 17.78 s | -0.2 | 1.13 | -23.6 | 23.4 | 0.00 % | 5 % | 0.08 s | 18.4 | 349 | 0.00 |
| 3 | 17.78 s | -0.2 | 1.01 | -22.3 | 22.1 | 0.00 % | 3 % | 0.07 s | 20.0 | 285 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 62 % | 13 % | 22 % | 2 % | 0 % | 0 % |
| 2 | 1 % | 65 % | 12 % | 19 % | 2 % | 0 % | 0 % |
| 3 | 1 % | 68 % | 18 % | 12 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×6×18, 41 nodi, 144 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), Q=Testa del controcanto (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore), D=Battuta (marcatore).
Alla fine: S 365, N 240, H 63, A 20, K 20, C 19.
#2-24 line×23: 1547 celle x0-127 y0-5 z0-17, passi 1-23
  .→W 1536: x0-127 y3 z6-17
  .→D 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
  .→T 1: x0 y3 z0
  .→Q 1: x8 y5 z3
  .→M 1: x0 y0 z7
#25-26 one×1, all×1: 15 celle x0-112 y3 z0-5, passi 24-31
  .→R 7: x96 y3 z0; x48 y3 z1; x112 y3 z1; x16 y3 z3; +3 scatole, 3 celle
  T→R 1: x0 y3 z0
 #27 all W → .: ×1, 1536 celle x0-127 y3 z6-17, passi 32
  W→. 1536: x0-127 y3 z6-17
 #28 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-5, passi 33
  .→X 8: x0 y1 z0; x96 y1 z0; x48 y1 z1; x112 y1 z1; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x96 y2 z0; x48 y2 z1; x112 y2 z1; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x96 y3 z0; x48 y3 z1; x112 y3 z1; +4 scatole, 4 celle
 #29 one ....**....**.... **************** ....**....**.… → NSSS**NSSS**NSSS **************** NSSS**NSSS**N… (+2): ×8, 315 celle x0-127 y1 z0-9, passi 34-41
   r1 ....**....**.... **************… → NSSS**NSSS**NSSS **************… ×3; r2 ................ **************… → NSSSSSSSNSSSSSSS **************… ×4; r3 .*.***.*.***.*** **************… → N*N***N*N***N*** **************… ×1
  .→S 249: x97-103 y1 z0; x105-111 y1 z0; x49-55 y1 z1; x57-63 y1 z1; +47 scatole, 221 celle
  .→N 58: x6 y1 z0; x12 y1 z0; x104 y1 z0; x56 y1 z1; +54 scatole, 54 celle
  X→N 8: x0 y1 z0; x96 y1 z0; x48 y1 z1; x112 y1 z1; +4 scatole, 4 celle
#30-32 one×3: 247 celle x0-126 y2-4 z0-16, passi 42-65
  .→N 121: x10 y2-3 z4; x12 y2-3 z7; x74 y2-3 z9; x36 y2-3 z11; +111 scatole, 113 celle
  .→H 63: x1 y4 z1; x3 y4 z1; x5 y4 z1; x7 y4 z1; +59 scatole, 59 celle
  .→C 19: x4 y4 z2; x12 y4 z2; x20 y4 z2; x28 y4 z2; +15 scatole, 15 celle
  .→K 12: x8 y4 z0; x18 y4 z0; x24 y4 z0; x40 y4 z0; +8 scatole, 8 celle
  Z→. 8: x0 y2 z0; x96 y2 z0; x48 y2 z1; x112 y2 z1; +4 scatole, 4 celle
  Y→A 8: x0 y3 z0; x96 y3 z0; x48 y3 z1; x112 y3 z1; +4 scatole, 4 celle
  .→A 8: x8 y3 z0; x104 y3 z0; x56 y3 z1; x120 y3 z1; +4 scatole, 4 celle
  D→K 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
 #33 one **. M.* → **M NS* (+7): ×56, 150 celle x0-127 y0 z5-14, passi 66-121
   r1 **. M.* → **M NS* ×15; r2 M.* **. → NS* **M ×11; r3 *. M* → *M N* ×7; r4 M* *. → N* *M ×6; r5 ****. ***** M...* → ****M ***** NSSS* ×1; r6 M...* ***** ****. → NSSS* ***** ****M ×3; r7 M.. → .*M ×8; r8 M...... → .*****M ×5
 parte 1/4, passi 66-79:
  .→S 12: x13-15 y0 z9; x23-25 y0 z9; x9 y0 z7; x27 y0 z7; +4 scatole, 4 celle
  .→N 12: x8 y0 z7; x26 y0 z7; x10 y0 z8; x28 y0 z8; +8 scatole, 8 celle
  M→. 1: x0 y0 z7
  .→M 1: x32 y0 z7
 parte 2/4, passi 80-93:
  .→N 10: x54 y0 z5; x34 y0 z6; x52 y0 z6; x56 y0 z6; +6 scatole, 6 celle
  .→S 8: x55 y0 z5; x35 y0 z6; x53 y0 z6; x57 y0 z6; +4 scatole, 4 celle
  M→N 1: x32 y0 z7
  .→M 1: x65 y0 z10
 parte 3/4, passi 94-107:
  .→N 8: x69 y0 z11; x70 y0 z12; x81 y0 z12; x90 y0 z12; +4 scatole, 4 celle
  .→S 5: x66 y0 z10; x71 y0 z12; x73 y0 z13; x83 y0 z13; +1 scatole, 1 celle
  M→N 1: x65 y0 z10
  .→M 1: x97 y0 z11
 parte 4/4, passi 108-121:
  .→S 13: x100-102 y0 z12; x108-110 y0 z12; x104 y0 z10; x114 y0 z10; +5 scatole, 5 celle
  .→N 10: x121 y0 z9; x126 y0 z9; x103 y0 z10; x113 y0 z10; +6 scatole, 6 celle
  .→M 1: x127 y0 z8
  M→N 1: x97 y0 z11
#34-37 all×2, one×2: 118 celle x8-127 y0-5 z0-12, passi 122-144
  .→S 78: x45-51 y5 z0; x61-67 y5 z0; x85-91 y5 z0; x53-59 y5 z1; +10 scatole, 50 celle
  .→N 13: x44 y5 z0; x60 y5 z0; x84 y5 z0; x52 y5 z1; +9 scatole, 9 celle
  N→A 4: x42 y0 z7; x121 y0 z9; x69 y0 z11; x81 y0 z12
  Q→N 1: x8 y5 z3
```
