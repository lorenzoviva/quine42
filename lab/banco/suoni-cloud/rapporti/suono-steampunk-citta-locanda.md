# suono-steampunk-citta-locanda

> Steampunk, la birreria: un organetto da fiera che gira, l'oom-pa del basso, piatti di latta e bicchieri.

Sorgente: `lab/banco/suoni-cloud/steampunk/suono-steampunk-citta-locanda.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/steampunk/suono-steampunk-citta-locanda.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.79 (minima fra due semi 0.61), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.82 | 374-382 | 26 | -22.6..-22.1 | 1.04 | 7 % | 20.7 | 0.01 | 9 % | 128/128 |
| 4, 5, 6 | pulito | 0.80 | 381-399 | 20 | -23.4..-21.5 | 1.06 | 6 % | 12.8 | 0.00 | 13 % | 128/128 |
| 7, 8, 9 | pulito | 0.81 | 378-389 | 25 | -23.0..-22.2 | 1.04 | 8 % | 18.0 | 0.00 | 9 % | 128/128 |
| 10, 11, 12 | pulito | 0.83 | 369-378 | 23 | -22.4..-21.7 | 0.97 | 7 % | 19.9 | 0.00 | 13 % | 128/128 |
| 13, 14, 15 | pulito | 0.77 | 367-381 | 25 | -22.5..-22.2 | 1.03 | 7 % | 18.9 | 0.00 | 9 % | 128/128 |
| 16, 17, 18 | pulito | 0.80 | 369-383 | 25 | -22.5..-21.9 | 0.99 | 8 % | 19.4 | 0.00 | 8 % | 128/128 |
| 19, 20, 21 | pulito | 0.78 | 375-384 | 22 | -22.3..-22.0 | 1.03 | 7 % | 18.5 | 0.00 | 9 % | 128/128 |
| 22, 23, 24 | pulito | 0.81 | 369-380 | 23 | -22.4..-21.8 | 1.00 | 8 % | 18.3 | 0.00 | 12 % | 128/128 |
| 25, 26, 27 | pulito | 0.80 | 368-388 | 23 | -22.8..-21.9 | 0.97 | 6 % | 18.2 | 0.00 | 14 % | 128/128 |
| 28, 29, 30 | pulito | 0.79 | 375-392 | 23 | -22.8..-21.9 | 1.14 | 7 % | 19.9 | 0.00 | 16 % | 128/128 |

## Rapporto completo: Suono: suono-steampunk-citta-locanda (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 15.24 s a 126 bpm.
Dichiarata: D dorian (root 50); swing 0.25, cutoff 5000 Hz, space 0.30.
Tracce: y0 lead 0.50, y1 pad 0.40, y2 lead 0.28, y3 bass 0.60, y4 bass 0.48.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: D5 C5~2 . E5 D5 A5~2 . F5 E5! F5~2 . . F5 . G5 A5
  y1 pad: . . D3+F3+A3 . . . D3+F3+A3 . . . G3+B3+D4 . . . G3+B3+D4 .
  y2 lead: A5 F5 D5 . F5 . . . . . G5 . . . D5 .
  y3 bass: K+D2! . A2 . D2 . A2 . G2! . G3 . D3 . G3 .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 2:
  y0 lead: B5~2 . G5~2 . G5 F5~2 . D5 E5~2 . G5 . F5~2 . D5 A5
  y1 pad: . . G3+B3+D4 . . . G3+B3+D4 . . . D3+F3+A3 . . . D3+F3+A3 .
  y2 lead: . . G5 . . . D5 . A5 F5 D5 . F5 . . .
  y3 bass: G2! . G3 . D3 . G3 . K+D2! . A2 . D2 . A2 .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 3:
  y0 lead: G5 . . F5 E5~2 . G5 F5~2 . A5 . G5 A5~2 . F5!~2 .
  y1 pad: . . A3+C4+E4 . . . A3+C4+E4 . . . A3+C4+E4 . . . A3+C4+E4 .
  y2 lead: G5 E5 A5 . E5 . . . A5 . E5 . G5 . E5 .
  y3 bass: A2! . E3 . A2 . E3 . A2! . E3 . A2 . E3 .
  y4 bass: K . H H C . H . K . H H C C H .
battuta 4:
  y0 lead: A5!~2 . A5! D5~2 . D5 E5 F5 G5~2 . E5~2 . . . . A5~2
  y1 pad: . . D3+F3+A3 . D3+F3+A3 . D3+F3+A3 . . . A3+C4+E4 . A3+C4+E4 . A3+C4+E4 .
  y2 lead: A5 F5 D5 . F5 . . . A5 . E5 . G5 . E5 .
  y3 bass: K+D2! . A2 . D2 . A2 . A2! . A3 . E3 . A3 .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 5:
  y0 lead: . E5 F5 G5~2 . . . . E5~2 . G5~2 . . E5 F5~2 .
  y1 pad: . . E3+G3+B3 . E3+G3+B3 . E3+G3+B3 . . . A3~2+C4~2+E4~2 . . . A3+C4+E4 .
  y2 lead: E5 . G5 . D5 . G5 . A5 . E5 . G5 . E5 .
  y3 bass: E2! . B2 B2 E2 . B2 . A2! . A3 . E3 . A3 .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 6:
  y0 lead: A5 . . B5 . . A5~2 . F5~2 . D5~2 . . . G5~2 .
  y1 pad: . . G3~2+B3~2+D4~2 . . . G3+B3+D4 . . . D3+F3+A3 . D3+F3+A3 . D3+F3+A3 .
  y2 lead: . . G5 . . . D5 . D5 . F5 . A5 . F5 .
  y3 bass: G2! . G3 . D3 . G3 . K+D2! . A2 A2 D2 . A2 .
  y4 bass: K . H . C . H . K . H . C . H H
battuta 7:
  y0 lead: D5~2 . . . . G5 F5 E5~2 . C5! B4 A4 B4~2 . . D5
  y1 pad: . . G3~2+B3~2+D4~2 . . . G3+B3+D4 . . . F3+A3+C4 . F3+A3+C4 . F3+A3+C4 .
  y2 lead: . . G5 . . . D5 . . . F5 . . . A5 .
  y3 bass: G2! . D3 . G2 . D3 . F2! . C3 C3 F2 . C3 .
  y4 bass: K . H H C . H . K . H H C C H .
battuta 8:
  y0 lead: . . E5 . D5~2 . D5 C5 B4!~2 . D5 E5 D5 A5~2 . .
  y1 pad: . . B3+D4+F4 . . . B3+D4+F4 . . . E3+G3+B3 . . . E3+G3+B3 .
  y2 lead: A5 F5 D5 . F5 . . . E5 . G5 . D5 . G5 .
  y3 bass: B2! . F3 . B2 . F3 . E2! . B2 . E2 . B2 .
  y4 bass: K . H . C . H . K K H . C . O .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 382 | 81 % | 26 | D2..B5 (45 semitoni) | 100 % | 18 % | D dorian (0.92) | 0.92 | 7 % | 128/128 |
| 2 | 374 | 85 % | 26 | D2..B5 (45 semitoni) | 100 % | 21 % | D dorian (0.96) | 0.96 | 9 % | 128/128 |
| 3 | 380 | 84 % | 27 | D2..B5 (45 semitoni) | 100 % | 24 % | D dorian (0.94) | 0.94 | 7 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 70 | 0 | 11 10 9 9 7 6 9 9 | 9 | A4..B5 (14 semitoni) | 55 % | 1.4 | 128/128 |
| 1 | y1 pad | 111 | 0 | 12 12 12 18 15 15 15 12 | 10 | D3..F4 (15 semitoni) | 29 % | 1.1 | 128/128 |
| 1 | y2 lead | 54 | 0 | 6 6 8 8 8 6 4 8 | 5 | D5..A5 (7 semitoni) | 42 % | 1.0 | 128/128 |
| 1 | y3 bass | 67 | 4 | 9 9 8 9 9 10 9 8 | 12 | D2..A3 (19 semitoni) | 52 % | 1.0 | 128/128 |
| 1 | y4 bass | 0 | 76 | 9 9 11 9 9 9 11 9 | 0 | - | 59 % | 0.0 | 128/128 |
| 2 | y0 lead | 64 | 0 | 7 11 9 7 8 7 8 7 | 13 | D4..B5 (21 semitoni) | 50 % | 1.4 | 128/128 |
| 2 | y1 pad | 111 | 0 | 12 15 18 12 12 15 12 15 | 9 | D3..F4 (15 semitoni) | 29 % | 1.2 | 128/128 |
| 2 | y2 lead | 54 | 0 | 8 8 8 6 8 6 4 6 | 5 | D5..A5 (7 semitoni) | 42 % | 1.0 | 128/128 |
| 2 | y3 bass | 65 | 4 | 9 9 8 8 9 9 9 8 | 10 | D2..G3 (17 semitoni) | 51 % | 1.0 | 128/128 |
| 2 | y4 bass | 0 | 76 | 9 9 9 11 9 9 11 9 | 0 | - | 59 % | 0.0 | 128/128 |
| 3 | y0 lead | 74 | 0 | 11 8 11 9 11 8 8 8 | 10 | G4..B5 (16 semitoni) | 58 % | 1.4 | 128/128 |
| 3 | y1 pad | 111 | 0 | 12 15 15 12 12 15 12 18 | 10 | D3..F4 (15 semitoni) | 29 % | 1.1 | 128/128 |
| 3 | y2 lead | 54 | 0 | 8 8 4 8 6 6 6 8 | 5 | D5..A5 (7 semitoni) | 42 % | 1.0 | 128/128 |
| 3 | y3 bass | 65 | 4 | 9 10 9 8 8 8 8 9 | 10 | D2..F3 (15 semitoni) | 51 % | 1.0 | 128/128 |
| 3 | y4 bass | 0 | 72 | 9 9 9 9 9 9 9 9 | 0 | - | 56 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.82; y0 0.98, y1 0.83, y2 0.95, y3 0.91, y4 0.21.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 15.24 s | -0.2 | 1.04 | -22.5 | 22.3 | 0.00 % | 6 % | 0.07 s | 20.8 | 415 | 0.00 |
| 2 | 15.24 s | -0.2 | 1.01 | -22.6 | 22.4 | 0.00 % | 7 % | 0.06 s | 21.9 | 367 | 0.01 |
| 3 | 15.24 s | -1.0 | 0.89 | -22.1 | 21.1 | 0.00 % | 5 % | 0.05 s | 20.7 | 379 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 60 % | 14 % | 21 % | 3 % | 0 % | 0 % |
| 2 | 1 % | 64 % | 15 % | 16 % | 3 % | 0 % | 0 % |
| 3 | 1 % | 64 % | 13 % | 19 % | 3 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×5×18, 38 nodi, 192 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore), D=Battuta (marcatore).
Alla fine: N 280, H 41, S 40, A 22, C 18, K 17.
#2-23 line×22: 1546 celle x0-127 y0-4 z0-17, passi 1-22
  .→W 1536: x0-127 y3 z6-17
  .→D 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z7
#24-25 one×1, all×1: 31 celle x0-120 y3 z0-5, passi 23-38
  .→R 15: x24 y3 z0; x48 y3 z0; x88 y3 z0; x64 y3 z1; +11 scatole, 11 celle
  T→R 1: x0 y3 z0
 #26 all W → .: ×1, 1536 celle x0-127 y3 z6-17, passi 39
  W→. 1536: x0-127 y3 z6-17
 #27 all ././R → X/Z/Y: ×1, 48 celle x0-120 y1-3 z0-5, passi 40
  .→X 16: x0 y1 z0; x24 y1 z0; x48 y1 z0; x88 y1 z0; +12 scatole, 12 celle
  .→Z 16: x0 y2 z0; x24 y2 z0; x48 y2 z0; x88 y2 z0; +12 scatole, 12 celle
  R→Y 16: x0 y3 z0; x24 y3 z0; x48 y3 z0; x88 y3 z0; +12 scatole, 12 celle
 #28 one **.***.* ******** **.***.* ******** X*.***.* → **N***N* ******** **N***N* ******** .*N***N* (+2): ×16, 136 celle x0-126 y1 z0-9, passi 41-56
   r1 **.***.* ******** **.***.* ****… → **N***N* ******** **N***N* ****… ×8; r2 **.*.*.* ******** **.*.*.* ****… → **N*N*N* ******** **N*N*N* ****… ×5; r3 **..**.* ******** **..**.* ****… → **NS**N* ******** **NS**N* ****… ×3
  .→N 111: x2 y1 z0; x6 y1 z0; x26 y1 z0; x30 y1 z0; +107 scatole, 107 celle
  X→. 16: x0 y1 z0; x24 y1 z0; x48 y1 z0; x88 y1 z0; +12 scatole, 12 celle
  .→S 9: x83 y1 z3; x99 y1 z3; x75 y1 z4; x83 y1 z5; +5 scatole, 5 celle
#29-30 one×2: 137 celle x0-126 y2-3 z0-16, passi 57-88
  .→N 105: x90-91 y3 z4; x66-67 y3 z5; x106-107 y3 z6; x10 y2-3 z10; +95 scatole, 97 celle
  Z→. 16: x0 y2 z0; x24 y2 z0; x48 y2 z0; x88 y2 z0; +12 scatole, 12 celle
  Y→A 16: x0 y3 z0; x24 y3 z0; x48 y3 z0; x88 y3 z0; +12 scatole, 12 celle
 #31 one ****.*******.*** **.***.***.***.. D*******.****… → ****C*******C*** **H***H***H***HH K*******K****… (+2): ×8, 76 celle x0-126 y4 z0-4, passi 89-96
   r1 ****.*******.*** **.***.***.***… → ****C*******C*** **H***H***H***… ×5; r2 **************.* **************… → **************H* **************… ×1; r3 ****.*******..** **..**.***..**… → ****C*******CC** **HH**H***HH**… ×2
  .→H 41: x14-15 y4 z1; x30-31 y4 z1; x34-35 y4 z1; x42-43 y4 z1; +28 scatole, 33 celle
  .→C 18: x44-45 y4 z2; x108-109 y4 z2; x4 y4 z2; x12 y4 z2; +12 scatole, 12 celle
  .→K 9: x120-121 y4 z0; x8 y4 z0; x24 y4 z0; x40 y4 z0; +4 scatole, 4 celle
  D→K 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
 #32 one *. M* → *M N* (+7): ×89, 209 celle x0-127 y0 z4-17, passi 97-185
   r1 *. M* → *M N* ×17; r2 M* *. → N* *M ×19; r3 **. *** M.* → **M *** NS* ×12; r4 M.* *** **. → NS* *** **M ×14; r5 M.. → NSM ×5; r6 M. → .M ×12; r7 M.. → .*M ×7; r8 *. ** ** ** M* → *M ** ** ** N* ×3
 parte 1/4, passi 97-118:
  .→N 18: x1 y0 z6; x4 y0 z7; x3 y0 z8; x7 y0 z9; +14 scatole, 14 celle
  .→S 8: x2 y0 z6; x6 y0 z11; x25 y0 z13; x10 y0 z14; +4 scatole, 4 celle
  M→N 1: x0 y0 z7
  .→M 1: x30 y0 z12
 parte 2/4, passi 119-140:
  .→N 18: x36 y0 z8; x35 y0 z9; x39 y0 z9; x46 y0 z9; +14 scatole, 14 celle
  .→S 8: x37 y0 z8; x40 y0 z9; x47 y0 z9; x45 y0 z11; +4 scatole, 4 celle
  .→M 1: x62 y0 z11
  M→N 1: x30 y0 z12
 parte 3/4, passi 141-162:
  .→N 15: x94 y0 z10; x63 y0 z11; x90 y0 z12; x96 y0 z12; +11 scatole, 11 celle
  .→S 10: x95 y0 z10; x64 y0 z11; x91 y0 z12; x97 y0 z12; +6 scatole, 6 celle
  .→M 1: x98 y0 z10
  M→. 1: x62 y0 z11
 parte 4/4, passi 163-185:
  .→N 17: x107 y0 z4; x106 y0 z5; x108 y0 z5; x120 y0 z5; +13 scatole, 13 celle
  .→S 5: x109 y0 z5; x121 y0 z5; x117 y0 z7; x104 y0 z8; +1 scatole, 1 celle
  M→. 1: x98 y0 z10
  .→M 1: x127 y0 z13
#33-34 all×1, one×1: 7 celle x8-127 y0 z5-13, passi 186-192
  N→A 6: x120 y0 z5; x105 y0 z6; x46 y0 z9; x48 y0 z11; +2 scatole, 2 celle
  M→. 1: x127 y0 z13
Senza effetto (non hanno mai cambiato una cella):
#35 all X → .: in quel momento nella griglia non c'erano celle "X"
```
