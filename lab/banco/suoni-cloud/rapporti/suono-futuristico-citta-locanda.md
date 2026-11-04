# suono-futuristico-citta-locanda

> Futuristico, la cantina dello spazioporto: un groove storto e funky, una melodia che salta di ottava, un basso che rimbalza.

Sorgente: `lab/banco/suoni-cloud/futuristico/suono-futuristico-citta-locanda.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/futuristico/suono-futuristico-citta-locanda.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.77 (minima fra due semi 0.64), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.76 | 240-254 | 23 | -23.9..-23.3 | 0.93 | 18 % | 21.0 | 0.00 | 15 % | 128/128 |
| 4, 5, 6 | pulito | 0.78 | 244-253 | 23 | -23.7..-23.4 | 0.99 | 18 % | 21.3 | 0.00 | 10 % | 128/128 |
| 7, 8, 9 | pulito | 0.81 | 247-251 | 22 | -23.8..-23.5 | 0.93 | 18 % | 23.6 | 0.00 | 13 % | 128/128 |
| 10, 11, 12 | pulito | 0.79 | 247-253 | 23 | -24.2..-23.5 | 1.08 | 16 % | 21.4 | 0.01 | 10 % | 128/128 |
| 13, 14, 15 | pulito | 0.79 | 250-254 | 22 | -23.7..-23.1 | 0.99 | 19 % | 23.1 | 0.00 | 12 % | 128/128 |
| 16, 17, 18 | pulito | 0.76 | 244-253 | 23 | -24.0..-23.0 | 1.06 | 16 % | 22.4 | 0.00 | 10 % | 128/128 |
| 19, 20, 21 | pulito | 0.76 | 236-249 | 21 | -23.6..-23.2 | 0.94 | 19 % | 20.8 | 0.00 | 12 % | 128/128 |
| 22, 23, 24 | pulito | 0.77 | 241-252 | 25 | -24.3..-23.4 | 1.05 | 18 % | 22.0 | 0.00 | 13 % | 128/128 |
| 25, 26, 27 | pulito | 0.79 | 240-258 | 21 | -23.7..-23.3 | 0.92 | 17 % | 20.9 | 0.01 | 11 % | 128/128 |
| 28, 29, 30 | pulito | 0.83 | 241-249 | 24 | -23.9..-23.3 | 1.04 | 20 % | 22.2 | 0.00 | 16 % | 128/128 |

## Rapporto completo: Suono: suono-futuristico-citta-locanda (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 18.46 s a 104 bpm.
Dichiarata: D dorian (root 50); swing 0.20, cutoff 6500 Hz, space 0.35.
Tracce: y0 lead 0.44, y1 pad 0.40, y2 bass 0.62, y3 bass 0.52.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: D5 . . c5 B4 C5~3 . . C5~2 . F4!~3 . . F4 G4 F4
  y1 pad: . . . D3+F3+A3 . . . . . . D3~2+F3~2+A3~2 . . . . .
  y2 bass: K+D2! . . D2 D3 . . D2 . A2 . . D3 . A2 .
  y3 bass: K . H . C H . K . . H K C . O .
battuta 2:
  y0 lead: E4 . . . . D4~2 . . A4!~3 . . A4~2 . . . E5~2
  y1 pad: . . . G3+B3+D4 . . . . . . G3~2+B3~2+D4~2 . . . . .
  y2 bass: G2! . G3 . . G2 . D3 . G2 G3 . . D3 . B2
  y3 bass: K . H . C H . K . . H K C . O .
battuta 3:
  y0 lead: . D5 . . E5 F5 G5~3 . . . . G5~2 . A5 G5~3 .
  y1 pad: F3+A3+C4+E4 . . . . . F3+A3+C4+E4 . . . . . . . . .
  y2 bass: F2! . F3 . . F2 . C3 . F2 F3 . . C3 . A2
  y3 bass: K . H K C . H . . K H . C . H H
battuta 4:
  y0 lead: . . . . . . . . . G5~3 . . G5 . . .
  y1 pad: . . . B3+D4+F4 . . . . . . B3~2+D4~2+F4~2 . . . . .
  y2 bass: B2! . . B2 D3 . . B2 . F3 . . D3 . F3 .
  y3 bass: K . H K C . H . . K H . C . H H
battuta 5:
  y0 lead: A5 d5 . A5 G5~2 . . . . D5 . . E5 F5! . .
  y1 pad: . . E3+G3+B3 . . E3+G3+B3 . . . . E3+G3+B3 . . . . .
  y2 bass: E2! . . E2 E3 . . E2 . B2 . . E3 . B2 .
  y3 bass: K . H . C . H K . K H . C . H .
battuta 6:
  y0 lead: . . . . G5~2 . A5 . D5~3 . . . . D5~3 . .
  y1 pad: A3+C4+E4+G4 . . . . . A3+C4+E4+G4 . . . . . . . . .
  y2 bass: A2! . . A2 A3 . . A2 . E3 . . A3 . E3 .
  y3 bass: K . H . C . H K . K H . C . H .
battuta 7:
  y0 lead: D5 a5 G5~2 . C5! d5 C5! B4 . . a4 G4 f4 E4~3 . .
  y1 pad: . . . E3+G3+B3 . . . . . . E3~2+G3~2+B3~2 . . . . .
  y2 bass: E2! . . E2 E3 . . E2 . B2 . . E3 . B2 .
  y3 bass: K . H . C . H K . K H . C . H .
battuta 8:
  y0 lead: E4~2 . G4~3 . . . . G4 F4~2 . A4 B4~2 . . F5 .
  y1 pad: . . . A3+C4+E4 . . . . . . A3~2+C4~2+E4~2 . . . . .
  y2 bass: A2! . . A2 A3 . . A2 . E3 . . A3 . E3 .
  y3 bass: K . H . C . H K . K H . C . H .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 240 | 82 % | 26 | D2..A5 (43 semitoni) | 100 % | 15 % | E phrygian (0.86) | 0.83 | 7 % | 128/128 |
| 2 | 247 | 83 % | 25 | D2..A5 (43 semitoni) | 100 % | 21 % | D dorian (0.92) | 0.92 | 15 % | 128/128 |
| 3 | 254 | 84 % | 23 | D2..A5 (43 semitoni) | 100 % | 27 % | D dorian (0.93) | 0.93 | 6 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 52 | 0 | 9 5 7 2 7 4 11 7 | 12 | D4..A5 (19 semitoni) | 41 % | 1.6 | 128/128 |
| 1 | y1 pad | 55 | 0 | 6 6 8 6 9 8 6 6 | 11 | D3..G4 (17 semitoni) | 13 % | 1.3 | 128/128 |
| 1 | y2 bass | 58 | 1 | 8 8 8 7 7 7 7 7 | 12 | D2..A3 (19 semitoni) | 45 % | 1.0 | 128/128 |
| 1 | y3 bass | 0 | 74 | 9 9 10 10 9 9 9 9 | 0 | - | 58 % | 0.0 | 128/128 |
| 2 | y0 lead | 51 | 0 | 7 6 6 9 5 6 5 7 | 12 | D4..A5 (19 semitoni) | 40 % | 1.8 | 128/128 |
| 2 | y1 pad | 58 | 0 | 6 8 6 8 8 6 8 8 | 11 | D3..A4 (19 semitoni) | 13 % | 1.2 | 128/128 |
| 2 | y2 bass | 62 | 2 | 8 8 9 8 8 8 7 8 | 11 | D2..A3 (19 semitoni) | 48 % | 1.0 | 128/128 |
| 2 | y3 bass | 0 | 74 | 9 9 10 9 10 9 9 9 | 0 | - | 58 % | 0.0 | 32/128 |
| 3 | y0 lead | 56 | 0 | 8 6 4 9 7 5 9 8 | 9 | G4..A5 (14 semitoni) | 44 % | 1.4 | 128/128 |
| 3 | y1 pad | 58 | 0 | 6 9 8 6 8 6 9 6 | 8 | D3..F4 (15 semitoni) | 14 % | 1.2 | 128/128 |
| 3 | y2 bass | 61 | 4 | 8 7 10 8 9 8 8 7 | 9 | D2..G3 (17 semitoni) | 48 % | 1.0 | 128/128 |
| 3 | y3 bass | 0 | 75 | 9 9 10 9 9 10 10 9 | 0 | - | 59 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.76; y0 0.98, y1 0.85, y2 0.87, y3 0.24.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 18.46 s | -0.6 | 0.93 | -23.9 | 23.3 | 0.00 % | 17 % | 0.20 s | 24.1 | 458 | 0.00 |
| 2 | 18.46 s | -0.7 | 0.92 | -23.6 | 22.9 | 0.00 % | 18 % | 0.14 s | 23.4 | 405 | 0.00 |
| 3 | 18.46 s | -0.9 | 0.90 | -23.3 | 22.4 | 0.00 % | 15 % | 0.11 s | 21.0 | 395 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 60 % | 17 % | 18 % | 3 % | 1 % | 0 % |
| 2 | 1 % | 60 % | 20 % | 17 % | 2 % | 1 % | 0 % |
| 3 | 1 % | 68 % | 10 % | 17 % | 2 % | 1 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 35 nodi, 137 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: N 146, S 46, H 34, K 24, C 16, A 13, G 6.
#2-21 line×20: 1290 celle x0-127 y0-3 z0-15, passi 1-20
  .→W 1280: x0-127 y2 z6-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#22-23 one×1, all×1: 15 celle x0-112 y2 z0-5, passi 21-28
  .→R 7: x64 y2 z1; x96 y2 z1; x32 y2 z2; x16 y2 z3; +3 scatole, 3 celle
  T→R 1: x0 y2 z0
 #24 all W → .: ×1, 1280 celle x0-127 y2 z6-15, passi 29
  W→. 1280: x0-127 y2 z6-15
#25-26 all×1, one×1: 92 celle x0-123 y1-2 z0-10, passi 30-38
  .→N 55: x3 y1 z0; x10 y1 z0; x66 y1 z1; x69 y1 z1; +51 scatole, 51 celle
  .→S 15: x11 y1 z0; x107 y1 z1; x11 y1 z2; x27 y1 z3; +11 scatole, 11 celle
  R→Y 8: x0 y2 z0; x64 y2 z1; x96 y2 z1; x32 y2 z2; +4 scatole, 4 celle
 #27 one **.*******.***** **************** *************… → **N*******N***** **************** *************… (+2): ×8, 58 celle x0-126 y2 z0-12, passi 39-46
   r1 **.*******.***** **************… → **N*******N***** **************… ×2; r2 ****.*******.*** **************… → ****N*******N*** **************… ×6; r3 ***.******.***** **************… → ***N******N***** **************… ×0
  .→N 50: x3 y2 z0; x7 y2 z0; x67 y2 z1; x71 y2 z1; +46 scatole, 46 celle
  Y→A 8: x0 y2 z0; x64 y2 z1; x96 y2 z1; x32 y2 z2; +4 scatole, 4 celle
 #28 one ****.*******.*** **.***.***.***.* D******.*.***… → ****C*******C*** **H***H***H***H* K******K*K***… (+2): ×8, 74 celle x0-126 y3 z0-4, passi 47-54
   r1 ****.*******.*** **.***.***.***… → ****C*******C*** **H***H***H***… ×4; r2 ****.*******.*** **.***.***.***… → ****C*******C*** **H***H***H***… ×2; r3 **************.* **************… → **************H* **************… ×2
  .→H 34: x46-47 y3 z1; x62-63 y3 z1; x2 y3 z1; x5 y3 z1; +28 scatole, 28 celle
  .→K 16: x7 y3 z0; x11 y3 z0; x23 y3 z0; x27 y3 z0; +12 scatole, 12 celle
  .→C 16: x4 y3 z2; x12 y3 z2; x20 y3 z2; x28 y3 z2; +12 scatole, 12 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #29 one *. M* → *M N* (+8): ×77, 185 celle x0-127 y0 z0-15, passi 55-131
   r1 *. M* → *M N* ×14; r2 M* *. → N* *M ×11; r3 **. *** *** *** M.* → **M *** *** *** NS* ×4; r4 M.* *** *** *** **. → NS* *** *** *** **M ×4; r5 **. *** M.* → **M *** NS* ×3; r6 M... → NSSM ×10; r7 M.. → .*M ×19; r8 M. → .M ×6; r9 M* *. → G* *M ×6
 parte 1/4, passi 55-73:
  .→N 12: x21 y0 z0; x16 y0 z1; x10 y0 z2; x13 y0 z2; +8 scatole, 8 celle
  .→S 10: x11-12 y0 z2; x25-26 y0 z4; x6-7 y0 z6; x22 y0 z0; +3 scatole, 3 celle
  .→G 1: x3 y0 z6
  M→N 1: x0 y0 z7
  .→M 1: x33 y0 z12
 parte 2/4, passi 74-92:
  .→N 9: x46 y0 z10; x57 y0 z10; x60 y0 z10; x45 y0 z11; +5 scatole, 5 celle
  .→S 7: x47-48 y0 z10; x58-59 y0 z10; x39-40 y0 z15; x44 y0 z15
  .→M 1: x66 y0 z11
  M→N 1: x33 y0 z12
  .→G 1: x65 y0 z12
 parte 3/4, passi 93-111:
  .→N 10: x68 y0 z10; x67 y0 z11; x86 y0 z11; x73 y0 z12; +6 scatole, 6 celle
  .→S 6: x89-90 y0 z12; x94-95 y0 z12; x69 y0 z10; x85 y0 z15
  M→. 1: x66 y0 z11
  .→M 1: x97 y0 z11
 parte 4/4, passi 112-131:
  .→N 13: x109 y0 z1; x112 y0 z1; x120 y0 z2; x107 y0 z3; +9 scatole, 9 celle
  .→S 8: x110-111 y0 z1; x115-116 y0 z3; x113 y0 z1; x121 y0 z2; +2 scatole, 2 celle
  .→G 3: x108 y0 z2; x106 y0 z4; x101 y0 z7
  .→M 1: x127 y0 z10
  M→G 1: x97 y0 z11
#30-31 all×1, one×1: 6 celle x10-127 y0 z2-14, passi 132-137
  N→A 5: x10 y0 z2; x24 y0 z4; x100 y0 z6; x102 y0 z6; +1 scatole, 1 celle
  M→. 1: x127 y0 z10
Senza effetto (non hanno mai cambiato una cella):
#32 all X → .: in quel momento nella griglia non c'erano celle "X"
#33 all Y → .: in quel momento nella griglia non c'erano celle "Y"
#34 all Z → .: in quel momento nella griglia non c'erano celle "Z"
```
