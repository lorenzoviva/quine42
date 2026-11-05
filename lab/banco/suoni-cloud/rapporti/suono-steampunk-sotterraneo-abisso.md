# suono-steampunk-sotterraneo-abisso

> Steampunk, le caldaie sotto la città: pistoni lenti e pesanti, sfiati di vapore, un basso che stride nel ferro.

Sorgente: `lab/banco/suoni-cloud/steampunk/suono-steampunk-sotterraneo-abisso.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/steampunk/suono-steampunk-sotterraneo-abisso.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.73 (minima fra due semi 0.50), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.74 | 93-97 | 16 | -24.3..-23.8 | 0.97 | 14 % | 28.9 | 0.01 | 15 % | 128/128 |
| 4, 5, 6 | pulito | 0.77 | 82-102 | 13 | -24.5..-23.3 | 0.97 | 18 % | 29.0 | 0.01 | 13 % | 128/128 |
| 7, 8, 9 | pulito | 0.71 | 85-93 | 16 | -24.3..-23.6 | 0.93 | 17 % | 30.8 | 0.00 | 15 % | 128/128 |
| 10, 11, 12 | pulito | 0.75 | 92-95 | 13 | -24.2..-24.0 | 0.97 | 18 % | 30.1 | 0.01 | 28 % | 128/128 |
| 13, 14, 15 | pulito | 0.70 | 83-97 | 15 | -24.7..-23.7 | 0.97 | 15 % | 27.4 | 0.01 | 19 % | 128/128 |
| 16, 17, 18 | pulito | 0.72 | 97-100 | 12 | -23.6..-23.3 | 0.96 | 18 % | 28.9 | 0.01 | 6 % | 128/128 |
| 19, 20, 21 | pulito | 0.74 | 91-95 | 16 | -24.2..-24.0 | 0.97 | 21 % | 27.5 | 0.04 | 20 % | 128/128 |
| 22, 23, 24 | pulito | 0.76 | 85-90 | 15 | -24.4..-24.1 | 0.97 | 20 % | 31.6 | 0.01 | 11 % | 128/128 |
| 25, 26, 27 | pulito | 0.75 | 92-107 | 16 | -24.1..-23.7 | 0.97 | 19 % | 27.9 | 0.00 | 21 % | 128/128 |
| 28, 29, 30 | pulito | 0.76 | 99-101 | 16 | -24.0..-23.2 | 0.99 | 16 % | 29.1 | 0.01 | 15 % | 128/128 |

## Rapporto completo: Suono: suono-steampunk-sotterraneo-abisso (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 22.86 s a 84 bpm.
Dichiarata: C phrygian (root 36); swing 0.00, cutoff 1900 Hz, space 0.65.
Tracce: y0 lead 0.40, y1 pad 0.55, y2 bass 0.62, y3 bass 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: G3~4 . . . G#3~4 . . . . . . . . . . .
  y1 pad: C2~16+G2~16 . . . . . . . . . . . . . . .
  y2 bass: K+C1!~6 . . . . . . . C#1~4 . . . . . . .
  y3 bass: K . . K . . K . C . . . . . . .
battuta 2:
  y0 lead: G3~2 . F3~4 . . . . . . . . . D#3~4 . . .
  y1 pad: C#2~8+D#2~8 . . . . . . . C#2~8+G#2~8 . . . . . . .
  y2 bass: C#1! . . C#1! . . C#1! . . . . . C#1 . . .
  y3 bass: K . . K . . . . C . . . . . O .
battuta 3:
  y0 lead: . . . . . . . . F3!~4 . . . G3~4 . . .
  y1 pad: F2~16+C3~16 . . . . . . . . . . . . . . .
  y2 bass: F1!~3 . . . F1!~3 . . . . . . . F1!~2 . . .
  y3 bass: K . . K . . . . C . . . . . O .
battuta 4:
  y0 lead: . . . . . . . . . . . . . . . .
  y1 pad: D#2~16 . . . . . . . . . . . . . . .
  y2 bass: D#1!~6 . . . . . . . F1~4 . . . . . . .
  y3 bass: K . . K . . . . C . . . . . O .
battuta 5:
  y0 lead: G#3~4 . . . G3!~4 . . . G#3~2 . A#3~4 . . . C4~2 .
  y1 pad: C#2~16+G#2~16 . . . . . . . . . . . . . . .
  y2 bass: C#1! . . C#1! . . C#1! . . . . . C#1 . . .
  y3 bass: K . . K . . . . C . . . . . O .
battuta 6:
  y0 lead: C#4~2 . . . . . . . D#4~4 . . . F4~4 . . .
  y1 pad: D#2~16+A#2~16 . . . . . . . . . . . . . . .
  y2 bass: D#1! . . D#1! . . D#1! . . . . . D#1 . . .
  y3 bass: K . . K . . . . C . . . . . O .
battuta 7:
  y0 lead: . . . . G4~2 . . . . . . . F4~4 . . .
  y1 pad: C#2~16+G#2~16 . . . . . . . . . . . . . . .
  y2 bass: C#1!~6 . . . . . . . D#1~4 . . . . . . .
  y3 bass: K . . K . . K . C . . . . . . .
battuta 8:
  y0 lead: G4~4 . . . F4~4 . . . D#4~4 . . . F4~2 . . .
  y1 pad: D#2~16+A#2~16 . . . . . . . . . . . . . . .
  y2 bass: D#1!~6 . . . . . . . F1~4 . . . . . . .
  y3 bass: K . . K . . K . C . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 94 | 38 % | 22 | C1..G4 (43 semitoni) | 100 % | 11 % | A# dorian (0.67) | 0.67 | 10 % | 128/128 |
| 2 | 93 | 38 % | 19 | C1..D#4 (39 semitoni) | 100 % | 23 % | C phrygian (0.76) | 0.76 | 15 % | 128/128 |
| 3 | 97 | 38 % | 16 | C1..A#3 (34 semitoni) | 100 % | 15 % | C phrygian (0.64) | 0.64 | 3 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 21 | 0 | 2 3 2 0 5 3 2 4 | 10 | D#3..G4 (16 semitoni) | 16 % | 3.4 | 128/128 |
| 1 | y1 pad | 17 | 0 | 2 4 2 1 2 2 2 2 | 8 | C2..C3 (12 semitoni) | 7 % | 14.1 | 128/128 |
| 1 | y2 bass | 23 | 1 | 3 4 3 2 4 4 2 2 | 4 | C1..F1 (5 semitoni) | 18 % | 2.6 | 128/128 |
| 1 | y3 bass | 0 | 32 | 4 4 4 4 4 4 4 4 | 0 | - | 25 % | 0.0 | 128/128 |
| 2 | y0 lead | 18 | 0 | 3 3 3 1 2 1 1 4 | 6 | G3..D#4 (8 semitoni) | 14 % | 3.4 | 128/128 |
| 2 | y1 pad | 17 | 0 | 2 1 4 4 2 2 1 1 | 8 | C2..C3 (12 semitoni) | 8 % | 12.2 | 128/128 |
| 2 | y2 bass | 24 | 4 | 3 3 7 4 4 2 3 2 | 5 | C1..G1 (7 semitoni) | 19 % | 2.4 | 128/128 |
| 2 | y3 bass | 0 | 30 | 4 3 4 4 4 3 4 4 | 0 | - | 23 % | 0.0 | 128/128 |
| 3 | y0 lead | 19 | 0 | 2 3 3 3 4 1 0 3 | 5 | D#3..A#3 (7 semitoni) | 15 % | 3.2 | 128/128 |
| 3 | y1 pad | 17 | 0 | 1 1 4 1 4 2 2 2 | 7 | C2..A#2 (10 semitoni) | 8 % | 12.2 | 128/128 |
| 3 | y2 bass | 24 | 6 | 6 3 3 4 2 2 3 7 | 4 | C1..F1 (5 semitoni) | 19 % | 2.5 | 128/128 |
| 3 | y3 bass | 0 | 31 | 4 4 4 4 3 4 4 4 | 0 | - | 24 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.74; y0 0.96, y1 0.85, y2 0.86, y3 0.28.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 22.86 s | -0.3 | 0.97 | -24.3 | 24.0 | 0.00 % | 13 % | 0.47 s | 29.5 | 177 | 0.01 |
| 2 | 22.86 s | -0.3 | 0.97 | -24.0 | 23.7 | 0.00 % | 14 % | 0.32 s | 29.8 | 154 | 0.00 |
| 3 | 22.86 s | -0.3 | 0.97 | -23.8 | 23.5 | 0.00 % | 13 % | 0.17 s | 28.9 | 124 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 29 % | 54 % | 10 % | 7 % | 0 % | 0 % | 0 % |
| 2 | 29 % | 58 % | 8 % | 6 % | 0 % | 0 % | 0 % |
| 3 | 33 % | 62 % | 1 % | 4 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 37 nodi, 91 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: S 311, N 43, K 19, A 18, C 8, H 5.
#2-6 line×5: 386 celle x0-127 y0-2 z0-6, passi 1-5
  .→W 384: x0-127 y2 z4-6
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z4
#7-8 line×2: 256 celle x0-127 y2 z7-8, passi 6-7
  .→W 256: x0-127 y2 z7-8
#9-10 line×2: 256 celle x0-127 y2 z9-10, passi 8-9
  .→W 256: x0-127 y2 z9-10
#11-12 line×2: 256 celle x0-127 y2 z11-12, passi 10-11
  .→W 256: x0-127 y2 z11-12
#13-23 line×11: 392 celle x0-127 y2-3 z0-15, passi 12-22
  .→W 384: x0-127 y2 z13-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #24 one ****************. T**************** → ****************T R**************** (+4): ×7, 14 celle x0-112 y2 z0-3, passi 23-29
   r1 ****************. T************… → ****************T R************… ×3; r2 T**************** *************… → R**************** *************… ×3; r3 T***************. → R***************T ×0; r4 ****************. *************… → ****************T *************… ×1; r5 T**************** *************… → R**************** *************… ×0
  .→R 6: x16 y2 z1; x64 y2 z1; x96 y2 z1; x48 y2 z2; +2 scatole, 2 celle
  T→R 1: x0 y2 z0
  .→T 1: x112 y2 z2
 #25 all T → R: ×1, 1 celle x112 y2 z2, passi 30
  T→R 1: x112 y2 z2
 #26 all W → .: ×1, 1536 celle x0-127 y2 z4-15, passi 31
  W→. 1536: x0-127 y2 z4-15
 #27 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-3, passi 32
  .→X 8: x0 y1 z0; x16 y1 z1; x64 y1 z1; x96 y1 z1; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x16 y2 z1; x64 y2 z1; x96 y2 z1; +4 scatole, 4 celle
 #28 one ................ **************** *************… → NSSSSSSSSSSSSSSS **************** *************… (+2): ×8, 240 celle x0-127 y1 z0-7, passi 33-40
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×6; r2 ********........ **************… → ********NSSSSSSS **************… ×1; r3 X............... → NSSSSSSSSSSSSSSS ×1
  .→S 223: x1-15 y1 z0; x65-79 y1 z1; x97-111 y1 z1; x49-63 y1 z2; +12 scatole, 163 celle
  .→N 9: x24 y1 z1; x16 y1 z2; x0 y1 z4; x24 y1 z5; +5 scatole, 5 celle
  X→N 8: x0 y1 z0; x16 y1 z1; x64 y1 z1; x96 y1 z1; +4 scatole, 4 celle
 #29 one Y..*...*****..** → ASS*ASS*****AS** (+2): ×8, 60 celle x0-123 y2 z0-3, passi 41-48
   r1 Y..*...*****..** → ASS*ASS*****AS** ×1; r2 ********....**** Y.....********… → ********NSSS**** ASSSSS********… ×4; r3 Y**.**.*****.*** → A**A**A*****N*** ×3
  .→S 37: x1-5 y2 z0; x97-101 y2 z1; x49-53 y2 z2; x113-117 y2 z2; +7 scatole, 17 celle
  Y→A 8: x0 y2 z0; x16 y2 z1; x64 y2 z1; x96 y2 z1; +4 scatole, 4 celle
  .→A 8: x19 y2 z1; x22 y2 z1; x67 y2 z1; x70 y2 z1; +4 scatole, 4 celle
  .→N 7: x8 y2 z1; x28 y2 z1; x76 y2 z1; x92 y2 z2; +3 scatole, 3 celle
 #30 one **************.* **************** ********.****… → **************H* **************** ********C****… (+2): ×8, 32 celle x0-120 y3 z0-4, passi 49-56
   r1 **************.* **************… → **************H* **************… ×5; r2 ********.******* **************… → ********C******* **************… ×3; r3 ************.*** **************… → ************H*** **************… ×0
  .→K 11: x3 y3 z0; x6 y3 z0; x19 y3 z0; x35 y3 z0; +7 scatole, 7 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→C 8: x8 y3 z2; x24 y3 z2; x40 y3 z2; x56 y3 z2; +4 scatole, 4 celle
  .→H 5: x30 y3 z4; x46 y3 z4; x62 y3 z4; x78 y3 z4; +1 scatole, 1 celle
 #31 one ****. M...* → ****M NSSS* (+5): ×32, 115 celle x0-126 y0 z2-11, passi 57-88
   r1 ****. M...* → ****M NSSS* ×10; r2 M...* ****. → NSSS* ****M ×5; r3 **. M.* → **M NS* ×4; r4 M.* **. → NS* **M ×2; r5 M...... → .*****M ×5; r6 M.... → .***M ×6
 parte 1/4, passi 57-64:
  .→S 13: x29-31 y0 z2; x19-21 y0 z3; x1-3 y0 z4; x5-7 y0 z5; +1 scatole, 1 celle
  .→N 4: x28 y0 z2; x18 y0 z3; x16 y0 z4; x4 y0 z5
  .→M 1: x32 y0 z3
  M→N 1: x0 y0 z4
 parte 2/4, passi 65-72:
  .→S 9: x41-43 y0 z3; x45-47 y0 z4; x65-67 y0 z5
  .→N 3: x40 y0 z3; x44 y0 z4; x64 y0 z5
  M→. 1: x32 y0 z3
  .→M 1: x68 y0 z4
 parte 3/4, passi 73-80:
  .→S 15: x69-71 y0 z4; x75-77 y0 z6; x89-91 y0 z9; x93-95 y0 z10; +3 scatole, 3 celle
```
