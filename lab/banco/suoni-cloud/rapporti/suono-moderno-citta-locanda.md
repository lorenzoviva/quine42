# suono-moderno-citta-locanda

> Moderno, il locale: cassa in quattro, accordi di piano in levare, un basso che pompa le ottave, la voce di un synth.

Sorgente: `lab/banco/suoni-cloud/moderno/suono-moderno-citta-locanda.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-citta-locanda.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.70 (minima fra due semi 0.44), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.70 | 276-288 | 21 | -21.7..-21.2 | 1.08 | 16 % | 24.8 | 0.00 | 9 % | 128/128 |
| 4, 5, 6 | pulito | 0.69 | 270-294 | 21 | -21.0..-20.9 | 1.01 | 14 % | 24.1 | 0.01 | 9 % | 128/128 |
| 7, 8, 9 | pulito | 0.78 | 255-283 | 20 | -22.5..-22.1 | 1.16 | 18 % | 25.3 | 0.01 | 13 % | 128/128 |
| 10, 11, 12 | pulito | 0.78 | 282-288 | 22 | -22.8..-21.0 | 1.17 | 16 % | 25.8 | 0.00 | 11 % | 128/128 |
| 13, 14, 15 | pulito | 0.67 | 264-292 | 19 | -21.7..-20.2 | 0.99 | 16 % | 25.3 | 0.00 | 12 % | 128/128 |
| 16, 17, 18 | pulito | 0.72 | 274-281 | 19 | -21.5..-20.9 | 1.09 | 16 % | 24.6 | 0.00 | 8 % | 128/128 |
| 19, 20, 21 | pulito | 0.69 | 277-282 | 18 | -22.4..-20.6 | 1.08 | 17 % | 25.1 | 0.00 | 8 % | 128/128 |
| 22, 23, 24 | pulito | 0.73 | 271-280 | 20 | -22.0..-21.8 | 1.14 | 18 % | 25.2 | 0.00 | 9 % | 128/128 |
| 25, 26, 27 | pulito | 0.73 | 275-290 | 20 | -22.3..-21.0 | 1.09 | 15 % | 24.8 | 0.00 | 11 % | 128/128 |
| 28, 29, 30 | pulito | 0.74 | 276-282 | 21 | -22.2..-21.0 | 1.17 | 16 % | 25.4 | 0.00 | 11 % | 128/128 |

## Rapporto completo: Suono: suono-moderno-citta-locanda (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 15.74 s a 122 bpm.
Dichiarata: C dorian (root 48); swing 0.08, cutoff 6000 Hz, space 0.30.
Tracce: y0 lead 0.42, y1 pad 0.42, y2 bass 0.60, y3 bass 0.55.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: C5~2 . . . . . . . A#4~2 . A4! G4~3 . . A#4 A4~2
  y1 pad: . . C3+D#3+G3 . . . C3+D#3+G3 . . . C3+D#3+G3 . . . C3+D#3+G3 .
  y2 bass: K+C2! . C3 C2 . C2 C3 . K+C2! . C3 C2 . G2 C3 .
  y3 bass: K . H H K . H . K . H H K . O .
battuta 2:
  y0 lead: . A#4~2 . A4~2 . G4~2 . A4~2 . . . A#4 . . C5 .
  y1 pad: . . F3+A3+C4 . . . F3+A3+C4 . . . F3+A3+C4 . . . F3+A3+C4 .
  y2 bass: F2! . F3 . F2! . F3 . F2! . F3 . F2! . F3 .
  y3 bass: K . H H K . H . K . H H K . O .
battuta 3:
  y0 lead: . A#4~3 . . D5 D#5~2 . F5~3 . . C5~2 . D5!~2 . D#5 .
  y1 pad: . . D#3+G3+A#3+D4 . . . . . . . D#3+G3+A#3+D4 . . . . .
  y2 bass: D#2! . D#3 . D#2! . D#3 . D#2! . D#3 . D#2! . D#3 .
  y3 bass: K . H . K C H . K . H . K C H .
battuta 4:
  y0 lead: . F5 D#5~2 . D5~2 . D#5~3 . . C5 . . . . D5~3 .
  y1 pad: . . A3+C4+D#4 . . . A3+C4+D#4 . . . A3+C4+D#4 . . . A3+C4+D#4 .
  y2 bass: A2! . C3 A2 . A2 C3 . A2! . C3 A2 . D#3 C3 .
  y3 bass: K . H . K C H . K . H . K C H .
battuta 5:
  y0 lead: . F5~2 . D#5~2 . D5~2 . C5!~2 . . . . . . . G5~2
  y1 pad: . . D3+F3+A3 . . . D3+F3+A3 . . . D3+F3+A3 . . . D3+F3+A3 .
  y2 bass: D2! . D3 D2 . D2 D3 . D2! . D3 D2 . A2 D3 .
  y3 bass: K . H . K . H . K . H . K . H .
battuta 6:
  y0 lead: . F5 . . . . D#5~2 . F5~3 . . . . D5~2 . C5~3
  y1 pad: . . G3+A#3+D4+F4 . . . . . . . G3+A#3+D4+F4 . . . . .
  y2 bass: G2! . G3 G2 . G2 G3 . G2! . G3 G2 . D3 G3 .
  y3 bass: K . H . K . H . K . H . K . H .
battuta 7:
  y0 lead: . . D#5 D5! C5 A#4~3 . . G4~2 . A4 G4 . . F4 G4~2
  y1 pad: . . C3+D#3+G3 . . C3+D#3+G3 . . . . C3+D#3+G3 . . C3+D#3+G3 . .
  y2 bass: K+C2! . C3 C2 . C2 C3 . K+C2! . C3 C2 . G2 C3 .
  y3 bass: K . H . K . H . K . H . K . H .
battuta 8:
  y0 lead: . A4 A#4 . . . . . . . . . . . . .
  y1 pad: . . G3+A#3+D4 . . . G3+A#3+D4 . . . G3+A#3+D4 . . . G3+A#3+D4 .
  y2 bass: G2! . G3 G2 . G2 G3 . G2! . G3 G2 . D3 G3 .
  y3 bass: K . H . K . H . K . H . K . H .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 286 | 84 % | 25 | C2..G5 (43 semitoni) | 100 % | 21 % | C dorian (0.97) | 0.97 | 8 % | 128/128 |
| 2 | 276 | 77 % | 23 | C2..D#5 (39 semitoni) | 100 % | 26 % | C dorian (0.88) | 0.88 | 9 % | 128/128 |
| 3 | 288 | 78 % | 21 | C2..D5 (38 semitoni) | 100 % | 28 % | C dorian (0.88) | 0.88 | 7 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 46 | 0 | 6 6 7 6 5 5 9 2 | 9 | F4..G5 (14 semitoni) | 36 % | 1.8 | 128/128 |
| 1 | y1 pad | 88 | 0 | 12 12 8 12 12 8 12 12 | 11 | C3..F4 (17 semitoni) | 22 % | 1.0 | 128/128 |
| 1 | y2 bass | 76 | 4 | 12 8 8 10 10 10 12 10 | 11 | C2..G3 (19 semitoni) | 59 % | 1.0 | 128/128 |
| 1 | y3 bass | 0 | 72 | 10 10 10 10 8 8 8 8 | 0 | - | 56 % | 0.0 | 128/128 |
| 2 | y0 lead | 54 | 0 | 6 4 8 5 8 7 9 7 | 10 | C4..D#5 (15 semitoni) | 42 % | 1.6 | 128/128 |
| 2 | y1 pad | 76 | 0 | 12 8 12 8 12 8 8 8 | 11 | C3..G4 (19 semitoni) | 17 % | 1.0 | 128/128 |
| 2 | y2 bass | 68 | 10 | 12 8 12 10 8 12 8 8 | 10 | C2..F3 (17 semitoni) | 53 % | 1.0 | 128/128 |
| 2 | y3 bass | 0 | 68 | 8 8 10 8 10 8 8 8 | 0 | - | 53 % | 0.0 | 8/128 |
| 3 | y0 lead | 52 | 0 | 5 5 6 7 8 6 7 8 | 9 | C4..D5 (14 semitoni) | 41 % | 1.8 | 128/128 |
| 3 | y1 pad | 88 | 0 | 12 12 8 12 8 12 12 12 | 8 | C3..D#4 (15 semitoni) | 22 % | 1.0 | 128/128 |
| 3 | y2 bass | 66 | 8 | 12 10 8 10 12 8 6 8 | 9 | C2..F3 (17 semitoni) | 52 % | 1.0 | 128/128 |
| 3 | y3 bass | 0 | 74 | 10 8 10 10 8 10 10 8 | 0 | - | 58 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.70; y0 0.99, y1 0.69, y2 0.80, y3 0.17.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 15.74 s | -0.2 | 0.98 | -21.7 | 21.5 | 0.00 % | 11 % | 0.09 s | 24.8 | 191 | 0.00 |
| 2 | 15.74 s | -0.2 | 1.08 | -21.5 | 21.3 | 0.00 % | 16 % | 0.09 s | 25.7 | 155 | 0.00 |
| 3 | 15.74 s | -0.2 | 1.01 | -21.2 | 21.0 | 0.00 % | 14 % | 0.09 s | 25.2 | 168 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 84 % | 8 % | 6 % | 0 % | 0 % | 0 % |
| 2 | 2 % | 88 % | 7 % | 3 % | 0 % | 0 % | 0 % |
| 3 | 2 % | 85 % | 10 % | 3 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 35 nodi, 124 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: N 186, S 37, H 36, K 32, A 24, C 4.
#2-21 line×20: 1290 celle x0-127 y0-3 z0-15, passi 1-20
  .→W 1280: x0-127 y2 z6-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#22-23 one×1, all×1: 15 celle x0-112 y2 z0-5, passi 21-28
  .→R 7: x96 y2 z0; x64 y2 z1; x32 y2 z2; x16 y2 z3; +3 scatole, 3 celle
  T→R 1: x0 y2 z0
 #24 all W → .: ×1, 1280 celle x0-127 y2 z6-15, passi 29
  W→. 1280: x0-127 y2 z6-15
#25-26 all×1, one×1: 112 celle x0-126 y1-2 z0-10, passi 30-38
  .→N 88: x2 y1 z0; x6 y1 z0; x10 y1 z0; x14 y1 z0; +84 scatole, 84 celle
  R→Y 8: x0 y2 z0; x96 y2 z0; x64 y2 z1; x32 y2 z2; +4 scatole, 4 celle
 #27 one **.***.***.***.* **************** *************… → **N***N***N***N* **************** *************… (+2): ×8, 76 celle x0-126 y2 z0-12, passi 39-46
   r1 **.***.***.***.* **************… → **N***N***N***N* **************… ×2; r2 **.***.***.***.* **************… → **N***N***N***N* **************… ×6; r3 ******.********* **************… → ******N********* **************… ×0
  .→N 56: x3 y2 z0; x5 y2 z0; x11 y2 z0; x99 y2 z0; +52 scatole, 52 celle
  .→A 12: x8 y2 z0; x104 y2 z0; x72 y2 z1; x36 y2 z2; +8 scatole, 8 celle
  Y→A 8: x0 y2 z0; x96 y2 z0; x64 y2 z1; x32 y2 z2; +4 scatole, 4 celle
 #28 one **.***.***.***.* D***.***.***.*** → **H***H***H***H* K***K***K***K*** (+2): ×8, 72 celle x0-126 y3 z0-4, passi 47-54
   r1 **.***.***.***.* D***.***.***.*… → **H***H***H***H* K***K***K***K*… ×4; r2 *****.*******.** **.***.***.***… → *****C*******C** **H***H***H***… ×2; r3 **************.* **************… → **************H* **************… ×2
  .→H 36: x2-3 y3 z1; x10-11 y3 z1; x18-19 y3 z1; x26-27 y3 z1; +28 scatole, 28 celle
  .→K 24: x4 y3 z0; x8 y3 z0; x12 y3 z0; x20 y3 z0; +20 scatole, 20 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→C 4: x37 y3 z2; x45 y3 z2; x53 y3 z2; x61 y3 z2
 #29 one **. M.* → **M NS* (+7): ×65, 167 celle x0-127 y0 z3-15, passi 55-119
   r1 **. M.* → **M NS* ×10; r2 M.* **. → NS* **M ×11; r3 *. M* → *M N* ×7; r4 M* *. → N* *M ×10; r5 ***. **** M..* → ***M **** NSS* ×5; r6 M..* **** ***. → NSS* **** ***M ×3; r7 M.. → .*M ×16; r8 M.... → .***M ×3
 parte 1/4, passi 55-70:
  .→N 11: x11 y0 z4; x21 y0 z4; x10 y0 z5; x15 y0 z5; +7 scatole, 7 celle
  .→S 9: x12-13 y0 z4; x22 y0 z4; x16 y0 z5; x20 y0 z5; +4 scatole, 4 celle
  .→M 1: x31 y0 z6
  M→N 1: x0 y0 z7
 parte 2/4, passi 71-86:
  .→N 12: x33 y0 z6; x36 y0 z8; x37 y0 z9; x39 y0 z10; +8 scatole, 8 celle
  .→S 11: x34-35 y0 z6; x40-41 y0 z10; x55-56 y0 z14; x38 y0 z9; +4 scatole, 4 celle
  M→. 1: x31 y0 z6
  .→M 1: x62 y0 z13
 parte 3/4, passi 87-102:
  .→S 13: x96-97 y0 z7; x89-90 y0 z10; x63-64 y0 z13; x94 y0 z8; +6 scatole, 6 celle
  .→N 10: x95 y0 z7; x93 y0 z8; x86 y0 z9; x81 y0 z10; +6 scatole, 6 celle
  .→M 1: x98 y0 z9
  M→N 1: x62 y0 z13
 parte 4/4, passi 103-119:
  .→N 10: x110 y0 z3; x104 y0 z4; x107 y0 z4; x111 y0 z4; +6 scatole, 6 celle
  .→S 4: x102-103 y0 z6; x105 y0 z4; x112 y0 z4
  .→M 1: x127 y0 z7
  M→N 1: x98 y0 z9
#30-31 all×1, one×1: 5 celle x10-127 y0 z5-13, passi 120-124
  N→A 4: x10 y0 z5; x99 y0 z8; x71 y0 z12; x44 y0 z13
  M→. 1: x127 y0 z7
Senza effetto (non hanno mai cambiato una cella):
#32 all X → .: in quel momento nella griglia non c'erano celle "X"
#33 all Y → .: in quel momento nella griglia non c'erano celle "Y"
#34 all Z → .: in quel momento nella griglia non c'erano celle "Z"
#35 all D → .: in quel momento nella griglia non c'erano celle "D"
```
