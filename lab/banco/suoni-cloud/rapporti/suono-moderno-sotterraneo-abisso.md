# suono-moderno-sotterraneo-abisso

> Moderno, le gallerie della metropolitana: un battito industriale storto, metallo che risuona, un basso che pulsa lontano.

Sorgente: `lab/banco/suoni-cloud/moderno/suono-moderno-sotterraneo-abisso.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-sotterraneo-abisso.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.77 (minima fra due semi 0.58), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.75 | 121-130 | 15 | -24.3..-23.4 | 1.05 | 20 % | 30.3 | 0.00 | 43 % | 128/128 |
| 4, 5, 6 | pulito | 0.76 | 119-124 | 16 | -25.8..-24.2 | 1.15 | 22 % | 30.6 | 0.01 | 48 % | 128/128 |
| 7, 8, 9 | pulito | 0.80 | 119-132 | 16 | -24.2..-23.0 | 0.99 | 14 % | 26.8 | 0.01 | 39 % | 128/128 |
| 10, 11, 12 | pulito | 0.74 | 133-135 | 15 | -24.1..-22.8 | 1.06 | 16 % | 28.0 | 0.01 | 46 % | 128/128 |
| 13, 14, 15 | pulito | 0.78 | 112-129 | 15 | -24.4..-22.9 | 0.96 | 20 % | 31.6 | 0.01 | 57 % | 128/128 |
| 16, 17, 18 | pulito | 0.80 | 125-127 | 16 | -24.4..-22.8 | 1.14 | 23 % | 29.3 | 0.01 | 46 % | 128/128 |
| 19, 20, 21 | pulito | 0.76 | 120-128 | 16 | -23.9..-22.9 | 1.04 | 19 % | 30.8 | 0.01 | 30 % | 128/128 |
| 22, 23, 24 | pulito | 0.81 | 118-135 | 13 | -24.9..-22.2 | 1.09 | 19 % | 26.5 | 0.01 | 39 % | 128/128 |
| 25, 26, 27 | pulito | 0.74 | 122-136 | 12 | -23.7..-22.6 | 1.04 | 19 % | 30.4 | 0.01 | 25 % | 128/128 |
| 28, 29, 30 | pulito | 0.78 | 120-137 | 17 | -25.3..-22.8 | 1.14 | 21 % | 30.1 | 0.01 | 26 % | 128/128 |

## Rapporto completo: Suono: suono-moderno-sotterraneo-abisso (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 20.00 s a 96 bpm.
Dichiarata: D hirajoshi (root 38); swing 0.00, cutoff 2400 Hz, space 0.60.
Tracce: y0 lead 0.40, y1 pad 0.50, y2 bass 0.62, y3 bass 0.55.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: D4~2 . E4 A4~2 . F4~4 . . . . . . . e4 . .
  y1 pad: D2~16+A2~16 . . . . . . . . . . . . . . .
  y2 bass: K+D1!~2 . . . . . K+D1!~2 . . . . . K+D1! . . .
  y3 bass: K . . . O . K . . . . C . . . .
battuta 2:
  y0 lead: . . E4~2 . f4 f4 F4~2 . E4!~2 . . . . . . .
  y1 pad: E2~8 . . . . . . . E2~8+A#2~8 . . . . . . .
  y2 bass: E1!~2 . . . . . E1!~2 . . . . . E1! . . .
  y3 bass: K . . H . . K . . H . . C . . H
battuta 3:
  y0 lead: . . . . f4 F4!~4 . . . . . . . . . .
  y1 pad: E2~8 . . . . . . . E2~8+A#2~8 . . . . . . .
  y2 bass: E1!~2 . . . . . E1!~2 . . . . . E1! . . .
  y3 bass: K . . H . . K . . H . . C . . H
battuta 4:
  y0 lead: . E4~2 . . . . . F4~4 . . . . . . . E4~2
  y1 pad: F2~16+D3~16 . . . . . . . . . . . . . . .
  y2 bass: F1! . . F1! . . F1! . . . F1! . . F1! . .
  y3 bass: K . . H . . K . . H . . C . . H
battuta 5:
  y0 lead: . F4~2 . a4 . . . . . . . . A4~2 . A#4 .
  y1 pad: E2~16+A#2~16 . . . . . . . . . . . . . . .
  y2 bass: E1! . E1! . . . . . E1! . . E1! . . . .
  y3 bass: K . . H . . K . . H . . C . . H
battuta 6:
  y0 lead: . . . . . e5 E5~2 . D4~2 . e5 . . . . .
  y1 pad: D2~8 . . . . . . . D2~8+A2~8 . . . . . . .
  y2 bass: K+D1! . K+D1! . . . . . K+D1! . . K+D1! . . . .
  y3 bass: K . . H . . K . . H . . C . . H
battuta 7:
  y0 lead: . . . . . E5!~2 . . . . . . . . . .
  y1 pad: E2~16+A#2~16 . . . . . . . . . . . . . . .
  y2 bass: E1!~2 . . . . . E1!~2 . . . . . E1! . . .
  y3 bass: K . . . O . K . . . . C . . . .
battuta 8:
  y0 lead: . D4~2 . E4~2 . . . . . . . D4 F4~2 . e4 .
  y1 pad: D2~16+A2~16 . . . . . . . . . . . . . . .
  y2 bass: K+D1! . K+D1! . . . . . K+D1! . . K+D1! . . . .
  y3 bass: K . . . O . K . . . . C . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 130 | 59 % | 15 | D1..E5 (50 semitoni) | 100 % | 27 % | D hirajoshi (0.79) | 0.79 | 43 % | 128/128 |
| 2 | 121 | 54 % | 16 | D1..D5 (48 semitoni) | 100 % | 30 % | D hirajoshi (0.96) | 0.96 | 21 % | 128/128 |
| 3 | 124 | 55 % | 18 | D1..D5 (48 semitoni) | 100 % | 23 % | D hirajoshi (0.77) | 0.77 | 42 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 29 | 0 | 5 5 2 3 4 4 1 5 | 6 | D4..E5 (14 semitoni) | 23 % | 1.8 | 128/128 |
| 1 | y1 pad | 19 | 0 | 2 3 3 2 2 3 2 2 | 6 | D2..D3 (12 semitoni) | 9 % | 12.2 | 128/128 |
| 1 | y2 bass | 29 | 11 | 6 3 3 5 4 8 3 8 | 3 | D1..F1 (3 semitoni) | 23 % | 1.3 | 128/128 |
| 1 | y3 bass | 0 | 42 | 4 6 6 6 6 6 4 4 | 0 | - | 33 % | 0.0 | 128/128 |
| 2 | y0 lead | 20 | 0 | 9 1 1 1 3 2 0 3 | 5 | D4..D5 (12 semitoni) | 16 % | 1.8 | 128/128 |
| 2 | y1 pad | 19 | 0 | 3 3 2 2 2 3 2 2 | 7 | D2..E3 (14 semitoni) | 9 % | 12.2 | 128/128 |
| 2 | y2 bass | 31 | 7 | 6 5 8 4 3 3 4 5 | 4 | D1..A1 (7 semitoni) | 24 % | 1.2 | 128/128 |
| 2 | y3 bass | 0 | 44 | 6 7 4 6 6 7 4 4 | 0 | - | 34 % | 0.0 | 128/128 |
| 3 | y0 lead | 18 | 0 | 2 3 2 1 2 3 2 3 | 9 | F3..D5 (21 semitoni) | 14 % | 2.2 | 128/128 |
| 3 | y1 pad | 22 | 0 | 3 2 3 3 3 3 3 2 | 6 | D2..D3 (12 semitoni) | 11 % | 9.5 | 128/128 |
| 3 | y2 bass | 34 | 9 | 10 5 5 4 3 3 5 8 | 3 | D1..F1 (3 semitoni) | 27 % | 1.1 | 128/128 |
| 3 | y3 bass | 0 | 41 | 6 4 6 6 7 4 4 4 | 0 | - | 32 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.75; y0 0.96, y1 0.85, y2 0.80, y3 0.47.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 20.00 s | -0.2 | 1.05 | -23.7 | 23.5 | 0.00 % | 16 % | 0.22 s | 30.4 | 142 | 0.00 |
| 2 | 20.00 s | -0.2 | 1.04 | -24.3 | 24.1 | 0.00 % | 20 % | 0.37 s | 34.0 | 129 | 0.00 |
| 3 | 20.00 s | -0.4 | 0.96 | -23.4 | 23.1 | 0.00 % | 14 % | 0.25 s | 30.3 | 157 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 16 % | 76 % | 5 % | 3 % | 0 % | 0 % | 0 % |
| 2 | 17 % | 76 % | 3 % | 2 % | 0 % | 0 % | 0 % |
| 3 | 14 % | 77 % | 5 % | 4 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 37 nodi, 105 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: S 245, N 37, A 32, H 18, K 16, C 8, G 8.
#2-6 line×5: 386 celle x0-127 y0-2 z0-6, passi 1-5
  .→W 384: x0-127 y2 z4-6
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z5
#7-10 line×4: 512 celle x0-127 y2 z7-10, passi 6-9
  .→W 512: x0-127 y2 z7-10
#11-23 line×13: 648 celle x0-127 y2-3 z0-15, passi 10-22
  .→W 640: x0-127 y2 z11-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #24 one ****************. T**************** → ****************T R**************** (+4): ×7, 14 celle x0-112 y2 z0-2, passi 23-29
   r1 ****************. T************… → ****************T R************… ×3; r2 T**************** *************… → R**************** *************… ×3; r3 ****************. *************… → ****************T *************… ×0; r4 T**************** *************… → R**************** *************… ×0; r5 T***************. → R***************T ×1
  .→R 6: x80 y2 z0; x16 y2 z1; x32 y2 z1; x64 y2 z1; +2 scatole, 2 celle
  T→R 1: x0 y2 z0
  .→T 1: x112 y2 z0
 #25 all T → R: ×1, 1 celle x112 y2 z0, passi 30
  T→R 1: x112 y2 z0
 #26 all W → .: ×1, 1536 celle x0-127 y2 z4-15, passi 31
  W→. 1536: x0-127 y2 z4-15
 #27 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-2, passi 32
  .→X 8: x0 y1 z0; x80 y1 z0; x112 y1 z0; x16 y1 z1; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x80 y2 z0; x112 y2 z0; x16 y2 z1; +4 scatole, 4 celle
 #28 one ................ **************** *************… → NSSSSSSSSSSSSSSS **************** *************… (+1): ×8, 232 celle x0-127 y1 z0-5, passi 33-40
   r1 ................ **************… → NSSSSSSSSSSSSSSS **************… ×5; r2 ********........ **************… → ********NSSSSSSS **************… ×3
  .→S 213: x1-15 y1 z0; x113-127 y1 z0; x65-79 y1 z1; x97-111 y1 z1; +15 scatole, 153 celle
  .→N 11: x88 y1 z0; x24 y1 z1; x40 y1 z1; x0 y1 z3; +7 scatole, 7 celle
  X→N 8: x0 y1 z0; x80 y1 z0; x112 y1 z0; x16 y1 z1; +4 scatole, 4 celle
 #29 one Y**.**.***.**.** → A**A**A***A**A** (+2): ×8, 37 celle x0-123 y2 z0-2, passi 41-48
   r1 Y**.**.***.**.** → A**A**A***A**A** ×1; r2 Y.****..****.*** → AS****AS****A*** ×4; r3 Y*.*****.**.**** → A*A*****A**A**** ×3
  .→A 21: x6 y2 z0; x12 y2 z0; x82 y2 z0; x88 y2 z0; +17 scatole, 17 celle
  Y→A 8: x0 y2 z0; x80 y2 z0; x112 y2 z0; x16 y2 z1; +4 scatole, 4 celle
  .→S 8: x1 y2 z0; x7 y2 z0; x17 y2 z1; x23 y2 z1; +4 scatole, 4 celle
 #30 one ************.*** ***.*****.*****. D*****.******… → ************C*** ***H*****H*****H K*****K******… (+2): ×8, 42 celle x0-123 y3 z0-4, passi 49-56
   r1 ************.*** ***.*****.****… → ************C*** ***H*****H****… ×5; r2 ****.*********** **************… → ****H*********** **************… ×3; r3 ************.*** **.**.****.***… → ************C*** **H**H****H***… ×0
  .→H 18: x19 y3 z1; x25 y3 z1; x31 y3 z1; x35 y3 z1; +14 scatole, 14 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→K 8: x6 y3 z0; x22 y3 z0; x38 y3 z0; x54 y3 z0; +4 scatole, 4 celle
  .→C 8: x11 y3 z2; x28 y3 z2; x44 y3 z2; x60 y3 z2; +4 scatole, 4 celle
 #31 one **. M.* → **M NS* (+6): ×45, 114 celle x0-127 y0 z5-14, passi 57-101
   r1 **. M.* → **M NS* ×10; r2 M.* **. → NS* **M ×5; r3 *. ** M* → *M ** N* ×3; r4 M...* ****. → NSSS* ****M ×3; r5 M.... → .***M ×11; r6 M...... → .*****M ×5; r7 M. → GM ×8
 parte 1/4, passi 57-67:
  .→S 7: x6-8 y0 z7; x1 y0 z5; x19 y0 z6; x23 y0 z7; +1 scatole, 1 celle
  .→N 5: x2 y0 z6; x18 y0 z6; x5 y0 z7; x22 y0 z7; +1 scatole, 1 celle
  .→G 3: x20-21 y0 z7; x13 y0 z6
  M→N 1: x0 y0 z5
  .→M 1: x24 y0 z6
 parte 2/4, passi 68-78:
  .→S 8: x38-40 y0 z7; x56-58 y0 z7; x25 y0 z6; x50 y0 z6
  .→N 3: x49 y0 z6; x37 y0 z7; x55 y0 z7
  M→N 1: x24 y0 z6
  .→M 1: x63 y0 z6
  .→G 1: x36 y0 z7
 parte 3/4, passi 79-89:
  .→S 5: x64 y0 z6; x66 y0 z7; x77 y0 z8; x87 y0 z11; +1 scatole, 1 celle
  .→N 5: x65 y0 z7; x76 y0 z8; x78 y0 z9; x86 y0 z11; +1 scatole, 1 celle
  .→G 2: x67 y0 z8; x85 y0 z11
  M→N 1: x63 y0 z6
```
