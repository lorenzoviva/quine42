# suono-fantasy-tensione-pericolo

> Fantasy, il pericolo: tamburi di guerra frigi, un basso che batte ottavi sul semitono, corni che pungono.

Sorgente: `lab/banco/suoni-cloud/fantasy/suono-fantasy-tensione-pericolo.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/fantasy/suono-fantasy-tensione-pericolo.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza media fra i 30 semi 0.81 (minima fra due semi 0.64, soglia 0,05), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.80 | 208-237 | 24 | -21.2..-21.1 | 1.12 | 11 % | 23.5 | 0.00 | 14 % | 128/128 |
| 4, 5, 6 | pulito | 0.84 | 222-241 | 20 | -21.4..-20.8 | 1.25 | 13 % | 19.7 | 0.01 | 11 % | 128/128 |
| 7, 8, 9 | pulito | 0.81 | 240-251 | 21 | -21.2..-20.3 | 1.20 | 11 % | 21.9 | 0.00 | 11 % | 128/128 |
| 10, 11, 12 | pulito | 0.83 | 223-249 | 20 | -21.5..-19.7 | 1.22 | 14 % | 24.9 | 0.01 | 18 % | 128/128 |
| 13, 14, 15 | pulito | 0.81 | 208-236 | 22 | -21.6..-20.2 | 1.15 | 12 % | 23.3 | 0.01 | 12 % | 128/128 |
| 16, 17, 18 | pulito | 0.82 | 232-253 | 18 | -20.6..-20.4 | 1.13 | 12 % | 23.8 | 0.00 | 13 % | 128/128 |
| 19, 20, 21 | pulito | 0.81 | 226-248 | 22 | -21.0..-20.4 | 1.12 | 12 % | 19.2 | 0.00 | 10 % | 128/128 |
| 22, 23, 24 | pulito | 0.80 | 231-266 | 19 | -21.3..-20.5 | 1.20 | 11 % | 22.4 | 0.00 | 6 % | 128/128 |
| 25, 26, 27 | pulito | 0.78 | 238-243 | 20 | -21.9..-20.1 | 1.33 | 13 % | 23.9 | 0.01 | 9 % | 128/128 |
| 28, 29, 30 | pulito | 0.79 | 224-245 | 21 | -21.1..-20.4 | 1.19 | 11 % | 21.9 | 0.01 | 14 % | 128/128 |

## Rapporto completo: Suono: suono-fantasy-tensione-pericolo (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 14.55 s a 132 bpm.
Dichiarata: E phrygian (root 40); swing 0.00, cutoff 3200 Hz, space 0.30.
Tracce: y0 lead 0.50, y1 pad 0.45, y2 bass 0.62, y3 bass 0.70.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: E4 F4 E4 . . F4~2 . E4 F4~2 . . . . E4 F4 G4
  y1 pad: . . E2~2+G2~2+B2~2 . . . E2~2+G2~2+B2~2 . . . . . E2~4+G2~4+B2~4 . . .
  y2 bass: K+E1! . E1 E1 . E1 E1 . K+E1! . E1 E1 . F1 F1 .
  y3 bass: K K . . C . . . K K . . C C C C
battuta 2:
  y0 lead: D4 . F4 . . E4~2 . F4 G4~2 . A4~2 . B4!~3 . . B4
  y1 pad: F2~4+C3~4 . . . . . . . F2~4+C3~4 . . . . . . .
  y2 bass: F1!~2 . . . F1~2 . . . G1~2 . . . F1~2 . . .
  y3 bass: K K . . C . . . K K . . C C C C
battuta 3:
  y0 lead: E4 . F4~2 . E4~2 . B4 E4 B4! A4 B4 E4 F4 G4~2 . F4
  y1 pad: F2~4+C3~4 . . . . . . . F2~4+C3~4 . . . . . . .
  y2 bass: F1! . F1 F1 . F1 F1 . F1! . F1 F1 . G1 G1 .
  y3 bass: K . . K C . . . K . K . C . . .
battuta 4:
  y0 lead: G4 . A4!~3 . . A4 G4~2 . A4~2 . . . G4~2 . F4~2 .
  y1 pad: G2~8+B2~8+D3~8 . . . . . . . . . . . . . . .
  y2 bass: G1!~2 . . . G1~2 . . . A1~2 . . . G1~2 . . .
  y3 bass: K K . . C . . . K K . . C C C C
battuta 5:
  y0 lead: G4~2 . A4 G4 A4! . E4! F4 A4 B4 . . E4 . B4 .
  y1 pad: . . F2~2+A2~2+C3~2 . . . F2~2+A2~2+C3~2 . . . . . F2~4+A2~4+C3~4 . . .
  y2 bass: F1! . F1 F1 . F1 F1 . F1! . F1 F1 . G1 G1 .
  y3 bass: K . . . C . . K . . K . C . K .
battuta 6:
  y0 lead: . A4 G4~2 . . . F4~2 . E4 B3! A3~2 . B3 . . .
  y1 pad: E2~4+B2~4 . . . . . . . E2~4+B2~4 . . . . . . .
  y2 bass: K+E1!~2 . . . E1~2 . . . F1~2 . . . E1~2 . . .
  y3 bass: K . . . C . . K . . K . C . K .
battuta 7:
  y0 lead: F3 G3 F3~2 . G3 . . F3! . . E3 F3!~3 . . F3 E3~2
  y1 pad: . . A2~2+C3~2+E3~2 . . . A2~2+C3~2+E3~2 . . . . . A2~4+C3~4+E3~4 . . .
  y2 bass: A1! . A1 . A1 . B1 . A1! . A1 . A1 . B1 .
  y3 bass: K . . K C . . . K . K . C . . .
battuta 8:
  y0 lead: . F3 G3 B3 . A3 B3 D4~2 . C4 . . D4~2 . E4! .
  y1 pad: G2~4+D3~4 . . . . . . . G2~4+D3~4 . . . . . . .
  y2 bass: G1! . G1 G1 . G1 G1 . G1! . G1 G1 . A1 A1 .
  y3 bass: K . . K C . . . K . K . C . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 237 | 85 % | 24 | E1..B4 (43 semitoni) | 100 % | 17 % | E phrygian (0.76) | 0.76 | 14 % | 128/128 |
| 2 | 208 | 80 % | 24 | E1..B4 (43 semitoni) | 100 % | 16 % | E phrygian (0.87) | 0.87 | 6 % | 128/128 |
| 3 | 217 | 82 % | 24 | E1..B4 (43 semitoni) | 100 % | 16 % | E phrygian (0.82) | 0.82 | 7 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 71 | 0 | 9 8 12 7 10 7 9 9 | 12 | E3..B4 (19 semitoni) | 55 % | 1.4 | 128/128 |
| 1 | y1 pad | 46 | 0 | 9 4 4 3 9 4 9 4 | 8 | E2..E3 (12 semitoni) | 14 % | 3.5 | 128/128 |
| 1 | y2 bass | 60 | 3 | 12 4 10 4 10 5 8 10 | 5 | E1..B1 (7 semitoni) | 47 % | 1.2 | 128/128 |
| 1 | y3 bass | 0 | 57 | 9 9 6 9 6 6 6 6 | 0 | - | 45 % | 0.0 | 128/128 |
| 2 | y0 lead | 61 | 0 | 11 10 6 7 6 6 6 9 | 12 | E3..B4 (19 semitoni) | 48 % | 1.5 | 128/128 |
| 2 | y1 pad | 35 | 0 | 4 3 4 4 4 4 9 3 | 8 | E2..E3 (12 semitoni) | 12 % | 4.3 | 128/128 |
| 2 | y2 bass | 58 | 3 | 12 8 5 4 10 10 4 8 | 5 | E1..B1 (7 semitoni) | 45 % | 1.2 | 128/128 |
| 2 | y3 bass | 0 | 51 | 9 6 6 6 6 6 6 6 | 0 | - | 40 % | 0.0 | 128/128 |
| 3 | y0 lead | 67 | 0 | 9 11 12 7 7 5 8 8 | 12 | E3..B4 (19 semitoni) | 52 % | 1.5 | 128/128 |
| 3 | y1 pad | 39 | 0 | 3 3 9 4 3 9 4 4 | 8 | E2..E3 (12 semitoni) | 12 % | 4.3 | 128/128 |
| 3 | y2 bass | 60 | 3 | 10 8 8 4 10 5 10 8 | 5 | E1..B1 (7 semitoni) | 47 % | 1.1 | 128/128 |
| 3 | y3 bass | 0 | 48 | 6 6 6 6 6 6 6 6 | 0 | - | 38 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.80; y0 0.97, y1 0.90, y2 0.70, y3 0.47.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 14.55 s | -0.2 | 1.11 | -21.1 | 20.9 | 0.00 % | 9 % | 0.08 s | 23.5 | 195 | 0.00 |
| 2 | 14.55 s | -0.2 | 1.10 | -21.1 | 20.9 | 0.00 % | 11 % | 0.10 s | 26.4 | 155 | 0.00 |
| 3 | 14.55 s | -0.2 | 1.12 | -21.2 | 21.0 | 0.00 % | 10 % | 0.08 s | 24.0 | 167 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 8 % | 78 % | 9 % | 4 % | 1 % | 0 % | 0 % |
| 2 | 8 % | 84 % | 4 % | 3 % | 1 % | 0 % | 0 % |
| 3 | 8 % | 81 % | 7 % | 4 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 37 nodi, 154 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: N 155, S 152, K 32, C 25, A 22.
#2-23 line×22: 1546 celle x0-127 y0-3 z0-15, passi 1-22
  .→W 1536: x0-127 y2 z4-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#24-25 one×1, all×1: 15 celle x0-112 y2 z0-3, passi 23-30
  .→R 7: x80 y2 z0; x16 y2 z1; x32 y2 z1; x64 y2 z1; +3 scatole, 3 celle
  T→R 1: x0 y2 z0
 #26 all W → .: ×1, 1536 celle x0-127 y2 z4-15, passi 31
  W→. 1536: x0-127 y2 z4-15
 #27 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-3, passi 32
  .→X 8: x0 y1 z0; x80 y1 z0; x16 y1 z1; x32 y1 z1; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x80 y2 z0; x16 y2 z1; x32 y2 z1; +4 scatole, 4 celle
 #28 one **..**..****.... **************** **..**..****.… → **NS**NS****NSSS **************** **NS**NS****N… (+2): ×8, 163 celle x0-123 y1 z0-7, passi 33-40
   r1 **..**..****.... **************… → **NS**NS****NSSS **************… ×3; r2 ....****....**** **************… → NSSS****NSSS**** **************… ×4; r3 ........******** **************… → NSSSSSSS******** **************… ×1
  .→S 114: x49-55 y1 z2; x49-55 y1 z4; x49-55 y1 z6; x13-15 y1 z0; +42 scatole, 90 celle
  .→N 41: x2 y1 z0; x6 y1 z0; x12 y1 z0; x88 y1 z0; +37 scatole, 37 celle
  X→N 5: x80 y1 z0; x16 y1 z1; x32 y1 z1; x48 y1 z2; +1 scatole, 1 celle
  X→. 3: x0 y1 z0; x64 y1 z1; x96 y1 z3
 #29 one ******.*******.* Y*.*.***.*.*.*** → ******N*******N* A*N*N***A*N*N*** (+2): ×8, 72 celle x0-126 y2 z0-4, passi 41-48
   r1 ******.*******.* Y*.*.***.*.*.*… → ******N*******N* A*N*N***A*N*N*… ×1; r2 *************..* Y*..*..*.*..**… → *************NN* A*NN*NN*A*NN**… ×4; r3 ********..****** Y.**..******..… → ********NS****** AS**NS******NS… ×3
  .→N 47: x2-3 y2 z0; x5-6 y2 z0; x10-11 y2 z0; x13-14 y2 z1; +27 scatole, 39 celle
  .→S 12: x81 y2 z0; x85 y2 z0; x93 y2 z0; x17 y2 z1; +8 scatole, 8 celle
  Y→A 8: x0 y2 z0; x80 y2 z0; x16 y2 z1; x32 y2 z1; +4 scatole, 4 celle
  .→A 5: x8 y2 z0; x40 y2 z1; x72 y2 z1; x120 y2 z2; +1 scatole, 1 celle
 #30 one ****.*******.*** **************** D**.****.*.**… → ****C*******C*** **************** K**K****K*K**… (+3): ×8, 57 celle x0-124 y3 z0-2, passi 49-56
   r1 ****.*******.*** **************… → ****C*******C*** **************… ×3; r2 ****.*******.*.. **************… → ****C*******C*CC **************… ×0; r3 ****.*******.*** **************… → ****C*******C*** **************… ×2; r4 ****.*******.... **************… → ****C*******CCCC **************… ×3
  .→C 25: x12-15 y3 z2; x28-31 y3 z2; x60-63 y3 z2; x4 y3 z2; +12 scatole, 12 celle
  .→K 24: x8-9 y3 z0; x24-25 y3 z0; x56-57 y3 z0; x1 y3 z0; +17 scatole, 17 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #31 one *. M* → *M N* (+8): ×91, 208 celle x0-127 y0 z0-15, passi 57-147
   r1 *. M* → *M N* ×25; r2 M* *. → N* *M ×15; r3 **. M.* → **M NS* ×10; r4 M.* **. → NS* **M ×10; r5 M... → ASSM ×3; r6 *. ** M* → *M ** N* ×3; r7 M* ** ** *. → N* ** ** *M ×5; r8 M.. → .*M ×10; r9 M. → .M ×10
 parte 1/4, passi 57-78:
  .→N 14: x16 y0 z6; x2 y0 z7; x7 y0 z7; x13 y0 z7; +10 scatole, 10 celle
  .→S 7: x29-30 y0 z11; x22 y0 z7; x6 y0 z8; x9 y0 z8; +2 scatole, 2 celle
  M→N 1: x0 y0 z7
  .→A 1: x28 y0 z11
  .→M 1: x31 y0 z11
 parte 2/4, passi 79-101:
  .→N 18: x41 y0 z10; x38 y0 z11; x40 y0 z11; x42 y0 z11; +14 scatole, 14 celle
  .→S 9: x51-52 y0 z15; x37 y0 z12; x35 y0 z13; x63 y0 z13; +4 scatole, 4 celle
  M→N 1: x31 y0 z11
  .→M 1: x64 y0 z14
  .→A 1: x50 y0 z15
 parte 3/4, passi 102-124:
  .→N 16: x90 y0 z3; x89 y0 z4; x92 y0 z4; x88 y0 z7; +12 scatole, 12 celle
  .→S 4: x91 y0 z3; x87 y0 z8; x83 y0 z9; x65 y0 z14
  .→M 1: x94 y0 z1
  M→N 1: x64 y0 z14
 parte 4/4, passi 125-147:
  .→N 17: x106 y0 z0; x111 y0 z0; x96 y0 z1; x98 y0 z1; +13 scatole, 13 celle
  .→S 6: x108-109 y0 z1; x112 y0 z0; x99 y0 z1; x120 y0 z6; +1 scatole, 1 celle
  M→. 1: x94 y0 z1
  .→A 1: x107 y0 z1
  .→M 1: x127 y0 z8
#32-33 all×1, one×1: 7 celle x40-127 y0 z1-15, passi 148-154
```
