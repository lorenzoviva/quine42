# suono-futuristico-tensione-pericolo

> Futuristico, il pericolo: una batteria in dodici sopra un basso in sedici, la poliritmia che si sfalsa, allarmi frigi nel lead.

Sorgente: `lab/banco/suoni-cloud/futuristico/suono-futuristico-tensione-pericolo.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/futuristico/suono-futuristico-tensione-pericolo.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.74 (minima fra due semi 0.51), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.75 | 212-222 | 18 | -22.6..-21.4 | 1.07 | 10 % | 13.8 | 0.01 | 24 % | 96/96 |
| 4, 5, 6 | pulito | 0.64 | 214-236 | 17 | -22.1..-19.8 | 1.17 | 11 % | 14.8 | 0.00 | 31 % | 96/96 |
| 7, 8, 9 | pulito | 0.70 | 208-231 | 21 | -21.3..-21.0 | 1.04 | 11 % | 14.9 | 0.01 | 24 % | 96/96 |
| 10, 11, 12 | pulito | 0.75 | 208-227 | 17 | -21.8..-21.1 | 1.12 | 12 % | 14.8 | 0.01 | 26 % | 96/96 |
| 13, 14, 15 | pulito | 0.72 | 217-222 | 21 | -22.3..-21.0 | 1.04 | 9 % | 13.8 | 0.00 | 16 % | 96/96 |
| 16, 17, 18 | pulito | 0.77 | 215-222 | 19 | -22.1..-20.1 | 1.03 | 10 % | 13.7 | 0.01 | 36 % | 96/96 |
| 19, 20, 21 | pulito | 0.73 | 213-232 | 19 | -22.4..-20.4 | 1.11 | 9 % | 13.9 | 0.01 | 32 % | 96/96 |
| 22, 23, 24 | pulito | 0.75 | 208-223 | 18 | -22.0..-20.5 | 1.05 | 10 % | 14.5 | 0.00 | 21 % | 96/96 |
| 25, 26, 27 | pulito | 0.79 | 207-224 | 21 | -22.3..-20.7 | 1.05 | 10 % | 13.7 | 0.00 | 23 % | 96/96 |
| 28, 29, 30 | pulito | 0.73 | 209-228 | 19 | -21.9..-20.5 | 1.06 | 12 % | 14.7 | 0.01 | 33 % | 96/96 |

## Rapporto completo: Suono: suono-futuristico-tensione-pericolo (semi 1, 2, 3)

96 passi, 6 battute, ciclo di 9.60 s a 150 bpm.
Dichiarata: F# phrygian (root 42); swing 0.00, cutoff 5500 Hz, space 0.28.
Tracce: y0 lead 0.42, y1 pad 0.40, y2 bass 0.60, y3 bass 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: . . . F#4 . B4!~3 . . B4!~3 . . B4 F#4 E4 D4 E4!
  y1 pad: F#2~4+G2~4+C#3~4 . . . . . . . F#2~4+G2~4+C#3~4 . . . . . . .
  y2 bass: K+F#1! F#1 . F#1 K+F#1! F#1 . F#1 K+F#1! F#1 . G1 K+F#1! F#1 . G1
  y3 bass: K . H K . H C . H C . H K . H C
battuta 2:
  y0 lead: . F#4~2 . G4 . A4 . . F#4 . . G4~2 . . . .
  y1 pad: G2~4+A2~4+D3~4 . . . . . . . G2~4+A2~4+D3~4 . . . . . . .
  y2 bass: G1! G1 . G1 G1! G1 . G1 G1! G1 . A1 G1! G1 . A1
  y3 bass: . H K . H C . H K . H C . H K .
battuta 3:
  y0 lead: A4 B4! . A4~2 . . . B4 . . F#4 . . C#5 A4 .
  y1 pad: . . . . G2~4+D3~4 . . . . . . . G2~4+D3~4 . . .
  y2 bass: G1! . G1 G1 . G1 G1 . G1! . G1 G1 . D2 D2 .
  y3 bass: H C . H K . H C . H K . H C . H
battuta 4:
  y0 lead: . . B4 A4 B4 F#4~2 . G4 F#4 A4! G4!~3 . . . . G4
  y1 pad: . . . . A2~4+E3~4 . . . . . . . A2~4+E3~4 . . .
  y2 bass: A1! A1 . A1 A1! A1 . A1 A1! A1 . B1 A1! A1 . B1
  y3 bass: K . H K . H C . H C . H K . H K
battuta 5:
  y0 lead: . . A4 B4!~3 . . B4~2 . C#5~2 . F#4~2 . . . G4 F#4
  y1 pad: . . . . G2~4+D3~4 . . . . . . . G2~4+D3~4 . . .
  y2 bass: G1! G1 . G1 G1! G1 . G1 G1! G1 . A1 G1! G1 . A1
  y3 bass: . H C . H C . H K H H C H H K H
battuta 6:
  y0 lead: C#5! A4! G4~2 . A4~2 . . B4!~3 . . . . . . B4 .
  y1 pad: F#2~4+G2~4+C#3~4 . . . . . . . F#2~4+G2~4+C#3~4 . . . . . . .
  y2 bass: K+F#1! F#1 . F#1 K+F#1! F#1 . F#1 K+F#1! F#1 . G1 K+F#1! F#1 . G1
  y3 bass: H C C C K . H C . H K . H C . H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 218 | 98 % | 18 | F#1..C#5 (43 semitoni) | 100 % | 20 % | F# phrygian (0.61) | 0.61 | 24 % | 96/96 |
| 2 | 222 | 97 % | 19 | F#1..C#5 (43 semitoni) | 100 % | 25 % | F# phrygian (0.72) | 0.72 | 20 % | 96/96 |
| 3 | 212 | 97 % | 23 | F#1..C#5 (43 semitoni) | 100 % | 12 % | F# phrygian (0.59) | 0.59 | 11 % | 96/96 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 42 | 0 | 8 5 7 9 7 6 | 7 | D4..C#5 (11 semitoni) | 44 % | 1.5 | 96/96 |
| 1 | y1 pad | 30 | 0 | 6 6 4 4 4 6 | 6 | F#2..E3 (10 semitoni) | 13 % | 4.0 | 96/96 |
| 1 | y2 bass | 70 | 8 | 16 12 10 12 12 16 | 5 | F#1..D2 (8 semitoni) | 73 % | 1.0 | 96/96 |
| 1 | y3 bass | 0 | 68 | 11 10 11 11 13 12 | 0 | - | 71 % | 0.0 | 96/96 |
| 2 | y0 lead | 42 | 0 | 4 9 10 4 8 7 | 6 | E4..C#5 (9 semitoni) | 44 % | 1.5 | 96/96 |
| 2 | y1 pad | 30 | 0 | 6 4 4 6 6 4 | 8 | F#2..F#3 (12 semitoni) | 13 % | 4.0 | 96/96 |
| 2 | y2 bass | 68 | 6 | 12 12 16 12 12 10 | 6 | F#1..F#2 (12 semitoni) | 71 % | 1.0 | 96/96 |
| 2 | y3 bass | 0 | 76 | 12 16 12 15 10 11 | 0 | - | 79 % | 0.0 | 96/96 |
| 3 | y0 lead | 38 | 0 | 6 9 4 9 6 4 | 11 | F#3..C#5 (19 semitoni) | 40 % | 1.3 | 96/96 |
| 3 | y1 pad | 28 | 0 | 4 6 4 6 4 4 | 6 | F#2..E3 (10 semitoni) | 13 % | 4.0 | 96/96 |
| 3 | y2 bass | 68 | 2 | 12 10 12 12 12 12 | 6 | F#1..D2 (8 semitoni) | 71 % | 1.0 | 96/96 |
| 3 | y3 bass | 0 | 76 | 11 10 11 16 16 12 | 0 | - | 79 % | 0.0 | 96/96 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.75; y0 0.98, y1 0.89, y2 0.80, y3 0.37.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 9.60 s | -0.2 | 1.07 | -21.4 | 21.3 | 0.00 % | 10 % | 0.06 s | 15.0 | 263 | 0.00 |
| 2 | 9.60 s | -0.2 | 1.03 | -21.5 | 21.3 | 0.00 % | 8 % | 0.10 s | 14.4 | 293 | 0.01 |
| 3 | 9.60 s | -0.2 | 1.07 | -22.6 | 22.4 | 0.00 % | 10 % | 0.06 s | 13.8 | 288 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 9 % | 79 % | 6 % | 3 % | 1 % | 1 % | 0 % |
| 2 | 9 % | 79 % | 5 % | 4 % | 1 % | 2 % | 0 % |
| 3 | 11 % | 79 % | 3 % | 3 % | 1 % | 2 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 96×4×16, 37 nodi, 119 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: N 110, S 109, H 34, A 32, C 18, K 16.
#2-23 line×22: 1162 celle x0-95 y0-3 z0-15, passi 1-22
  .→W 1152: x0-95 y2 z4-15
  .→D 8: x0 y3 z0; x12 y3 z0; x24 y3 z0; x36 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
 #24 one ****************. T**************** → ****************T R**************** (+4): ×5, 10 celle x0-80 y2 z0-2, passi 23-27
   r1 ****************. T************… → ****************T R************… ×2; r2 T**************** *************… → R**************** *************… ×2; r3 T***************. → R***************T ×1; r4 ****************. *************… → ****************T *************… ×0; r5 T**************** *************… → R**************** *************… ×0
  .→R 4: x16 y2 z1; x32 y2 z1; x64 y2 z1; x48 y2 z2
  T→R 1: x0 y2 z0
  .→T 1: x80 y2 z0
 #25 all T → R: ×1, 1 celle x80 y2 z0, passi 28
  T→R 1: x80 y2 z0
 #26 all W → .: ×1, 1152 celle x0-95 y2 z4-15, passi 29
  W→. 1152: x0-95 y2 z4-15
 #27 all ./R → X/Y: ×1, 12 celle x0-80 y1-2 z0-2, passi 30
  .→X 6: x0 y1 z0; x80 y1 z0; x16 y1 z1; x32 y1 z1; +2 scatole, 2 celle
  R→Y 6: x0 y2 z0; x80 y2 z0; x16 y2 z1; x32 y2 z1; +2 scatole, 2 celle
 #28 one ....****....**** **************** *************… → NSSS****NSSS**** **************** *************… (+1): ×6, 123 celle x0-91 y1 z0-6, passi 31-36
   r1 ....****....**** **************… → NSSS****NSSS**** **************… ×3; r2 ****....****.... **************… → ****NSSS****NSSS **************… ×3
  .→S 90: x1-3 y1 z0-1; x9-11 y1 z0-1; x81-83 y1 z0-1; x89-91 y1 z0-1; +20 scatole, 66 celle
  .→N 27: x8 y1 z0-1; x88 y1 z0-1; x24 y1 z1-2; x0 y1 z1; +20 scatole, 20 celle
  X→N 3: x0 y1 z0; x80 y1 z0; x16 y1 z1
  X→. 3: x32 y1 z1; x64 y1 z1; x48 y1 z2
 #29 one ***********.***. Y.*...*...**..** → ***********N***N AN*NAN*NAN**AN** (+1): ×6, 70 celle x0-95 y2 z0-5, passi 37-42
   r1 ***********.***. Y.*...*...**..… → ***********N***N AN*NAN*NAN**AN… ×5; r2 *************..* **************… → *************NN* **************… ×1
  .→N 48: x34-35 y2 z1; x37-38 y2 z1; x42-43 y2 z1; x45-46 y2 z5; +40 scatole, 40 celle
  .→A 16: x4 y2 z0; x8 y2 z0; x12 y2 z0; x84 y2 z0; +12 scatole, 12 celle
  Y→A 6: x0 y2 z0; x80 y2 z0; x16 y2 z1; x32 y2 z1; +2 scatole, 2 celle
 #30 one ***.*****.** **.**.**.**. D*****.***** → ***C*****C** **H**H**H**H K*****K***** (+2): ×8, 68 celle x0-95 y3 z0-2, passi 43-50
   r1 ***.*****.** **.**.**.**. D****… → ***C*****C** **H**H**H**H K****… ×4; r2 ******.**.** **.**.**.**. D**.*… → ******C**C** **H**H**H**H K**K*… ×3; r3 ***.*****... *..*..*..*** D****… → ***C*****CCC *HH*HH*HH*** K****… ×1
  .→H 34: x73-74 y3 z1; x76-77 y3 z1; x79-80 y3 z1; x2 y3 z1; +27 scatole, 27 celle
  .→C 18: x81-83 y3 z2; x6 y3 z2; x9 y3 z2; x15 y3 z2; +12 scatole, 12 celle
  D→K 8: x0 y3 z0; x12 y3 z0; x24 y3 z0; x36 y3 z0; +4 scatole, 4 celle
  .→K 8: x3 y3 z0; x18 y3 z0; x30 y3 z0; x42 y3 z0; +4 scatole, 4 celle
 #31 one *. M* → *M N* (+7): ×63, 145 celle x0-95 y0 z5-15, passi 51-113
   r1 *. M* → *M N* ×9; r2 M* *. → N* *M ×11; r3 **. M.* → **M NS* ×9; r4 M... → ASSM ×5; r5 *. ** ** M* → *M ** ** N* ×4; r6 M* ** ** *. → N* ** ** *M ×4; r7 M.. → .*M ×13; r8 M. → .M ×8
 parte 1/4, passi 51-65:
  .→N 8: x14 y0 z5; x13 y0 z6; x15 y0 z6; x3 y0 z7; +4 scatole, 4 celle
  .→S 5: x6-7 y0 z10; x9-10 y0 z10; x18 y0 z7
  .→A 2: x5 y0 z10; x8 y0 z10
  M→. 1: x0 y0 z7
  .→M 1: x21 y0 z9
 parte 2/4, passi 66-81:
  .→N 7: x24 y0 z12; x42 y0 z12; x27 y0 z13; x32 y0 z14; +3 scatole, 3 celle
  .→S 2: x28 y0 z13; x36 y0 z14
  M→N 1: x21 y0 z9
  .→M 1: x45 y0 z11
 parte 3/4, passi 82-97:
  .→N 10: x63 y0 z8; x57 y0 z9; x66 y0 z9; x53 y0 z12; +6 scatole, 6 celle
  .→S 3: x59-60 y0 z8; x54 y0 z12
  .→A 1: x58 y0 z8
  .→M 1: x67 y0 z10
  M→N 1: x45 y0 z11
 parte 4/4, passi 98-113:
  .→N 10: x70 y0 z10; x72 y0 z11; x80 y0 z11; x74 y0 z12; +6 scatole, 6 celle
  .→S 9: x68-69 y0 z10; x88-89 y0 z15; x71 y0 z10; x73 y0 z11; +3 scatole, 3 celle
```
