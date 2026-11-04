# suono-fantasy-citta-locanda

> Fantasy, la locanda: una giga saltellante, il basso che fa zum-pa, un tamburello che non sta mai fermo.

Sorgente: `lab/banco/suoni-cloud/fantasy/suono-fantasy-citta-locanda.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/fantasy/suono-fantasy-citta-locanda.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.74 (minima fra due semi 0.56), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.72 | 344-352 | 23 | -23.1..-22.6 | 1.03 | 8 % | 18.7 | 0.00 | 10 % | 128/128 |
| 4, 5, 6 | pulito | 0.75 | 344-355 | 24 | -22.8..-22.4 | 0.99 | 7 % | 18.0 | 0.00 | 20 % | 128/128 |
| 7, 8, 9 | pulito | 0.79 | 325-345 | 22 | -23.3..-22.5 | 1.06 | 10 % | 19.6 | 0.01 | 18 % | 128/128 |
| 10, 11, 12 | pulito | 0.75 | 331-351 | 23 | -23.7..-22.6 | 1.14 | 9 % | 18.1 | 0.01 | 14 % | 128/128 |
| 13, 14, 15 | pulito | 0.74 | 345-354 | 22 | -22.5..-22.2 | 1.06 | 8 % | 19.2 | 0.00 | 8 % | 128/128 |
| 16, 17, 18 | pulito | 0.81 | 330-346 | 20 | -23.7..-22.5 | 1.18 | 8 % | 18.7 | 0.01 | 11 % | 128/128 |
| 19, 20, 21 | pulito | 0.76 | 337-360 | 19 | -23.0..-22.2 | 1.05 | 10 % | 18.4 | 0.00 | 19 % | 128/128 |
| 22, 23, 24 | pulito | 0.77 | 333-365 | 23 | -23.1..-22.2 | 1.05 | 7 % | 11.9 | 0.00 | 13 % | 128/128 |
| 25, 26, 27 | pulito | 0.77 | 346-357 | 23 | -23.4..-22.3 | 1.05 | 9 % | 16.5 | 0.01 | 19 % | 128/128 |
| 28, 29, 30 | pulito | 0.75 | 356-358 | 21 | -23.2..-22.7 | 1.13 | 9 % | 18.2 | 0.00 | 16 % | 128/128 |

## Rapporto completo: Suono: suono-fantasy-citta-locanda (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 16.27 s a 118 bpm.
Dichiarata: G dorian (root 55); swing 0.22, cutoff 4400 Hz, space 0.25.
Tracce: y0 lead 0.55, y1 pad 0.40, y2 bass 0.60, y3 bass 0.50.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: G5 A#5~2 . A5 A#5 G5 F5 E5 D5 E5! . . . F5~3 . .
  y1 pad: . . G3~2+A#3~2+D4~2 . . . G3~2+A#3~2+D4~2 . C4+E4+G4 . . . C4+E4+G4 . . .
  y2 bass: K+G2! . . D3 G2 . D3 . C3! . . G3 C3 . G3 .
  y3 bass: K H H C H H K H H C H H H C H H
battuta 2:
  y0 lead: F5 E5! C5! A4~2 . G4!~3 . . G4~3 . . G4 A4 A#4 D5~2 .
  y1 pad: . . C4+E4+G4 . . . C4+E4+G4 . . . G3+A#3+D4 . . . G3+A#3+D4 .
  y2 bass: C3! . G3 . C3 . G3 . K+G2! . D3 . G2 . D3 .
  y3 bass: K H H C H H K H H C H H H C H H
battuta 3:
  y0 lead: E5 C5~2 . A#4~2 . . C5~2 . D5~3 . . D5~2 . E5 D5 E5
  y1 pad: . . D4+F4+A4 . . . D4+F4+A4 . . . D4~2+F4~2+A4~2 . . . D4~2+F4~2+A4~2 .
  y2 bass: D3! . A3 . D3 . A3 . D3! . A3 . D3 . A3 .
  y3 bass: K . H C . H K . H C . H K C H H
battuta 4:
  y0 lead: . . . . D5~3 . . . D5! A#4 C5~3 . . C5 D5~2 .
  y1 pad: . . G3~2+A#3~2+D4~2 . . . G3~2+A#3~2+D4~2 . D4+F4+A4 . . . D4+F4+A4 . . .
  y2 bass: K+G2! . D3 . G2 . D3 . D3! . . A3 D3 . A3 .
  y3 bass: K H H C H H K H H C H H H C H H
battuta 5:
  y0 lead: C5~2 . A#4~2 . A4~2 . G4 A4~2 . . . . G4 . A4 A#4~2
  y1 pad: . . A3~2+C4~2+E4~2 . . . A3~2+C4~2+E4~2 . . . D4+F4+A4 . . . D4+F4+A4 .
  y2 bass: A2! . . E3 A2 . E3 . D3! . . A3 D3 . A3 .
  y3 bass: K . H C . H K . H C . H K C H H
battuta 6:
  y0 lead: . C5 A#4! A4~2 . G4!~2 . A4~2 . A#4 C5 . A4~2 . G4 A4
  y1 pad: . . E4+G4+A#4 . . . E4+G4+A#4 . A#3+D4+F4 . . . A#3+D4+F4 . . .
  y2 bass: E3! . A#3 . G3 . A#3 . A#2! . F3 . A#3 . F3 .
  y3 bass: K H H C H H K H H C H H H C H H
battuta 7:
  y0 lead: G4~3 . . G4~3 . . G4 . A4~2 . G4!~3 . . G4 A4 .
  y1 pad: E4+G4+A#4 . . . E4+G4+A#4 . . . . . D4+F4+A4 . . . D4+F4+A4 .
  y2 bass: E3! . A#3 . E3 . A#3 . D3! . A3 . D3 . A3 .
  y3 bass: K H H C H H K H H C H H H C H H
battuta 8:
  y0 lead: A#4 A4 . . . A#4~2 . . C5 A4 C5~2 . A#4~2 . C5 .
  y1 pad: A3+C4+E4 . . . A3+C4+E4 . . . . . A3+C4+E4 . . . A3+C4+E4 .
  y2 bass: A2! . E3 . A2 . E3 . A2! . E3 . A2 . E3 .
  y3 bass: K . H C . H K . H C . H K C H H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 347 | 98 % | 24 | G2..A#5 (39 semitoni) | 100 % | 20 % | G dorian (0.91) | 0.91 | 9 % | 128/128 |
| 2 | 344 | 97 % | 26 | G2..D6 (43 semitoni) | 100 % | 13 % | G dorian (0.85) | 0.85 | 8 % | 128/128 |
| 3 | 352 | 98 % | 23 | G2..A5 (38 semitoni) | 100 % | 21 % | G dorian (0.92) | 0.92 | 10 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 68 | 0 | 10 10 9 6 8 10 7 8 | 10 | G4..A#5 (15 semitoni) | 53 % | 1.6 | 128/128 |
| 1 | y1 pad | 96 | 0 | 12 12 12 12 12 12 12 12 | 10 | G3..A#4 (15 semitoni) | 25 % | 1.3 | 128/128 |
| 1 | y2 bass | 64 | 3 | 9 9 8 9 8 8 8 8 | 10 | G2..A#3 (15 semitoni) | 50 % | 1.0 | 128/128 |
| 1 | y3 bass | 0 | 116 | 16 16 12 16 12 16 16 12 | 0 | - | 91 % | 0.0 | 128/128 |
| 2 | y0 lead | 66 | 0 | 6 8 8 9 8 7 9 11 | 10 | A#4..D6 (16 semitoni) | 52 % | 1.4 | 128/128 |
| 2 | y1 pad | 96 | 0 | 12 12 12 12 12 12 12 12 | 10 | G3..A#4 (15 semitoni) | 25 % | 1.5 | 128/128 |
| 2 | y2 bass | 64 | 2 | 9 9 8 8 8 8 8 8 | 11 | G2..D4 (19 semitoni) | 50 % | 1.0 | 128/128 |
| 2 | y3 bass | 0 | 116 | 12 16 16 12 16 16 12 16 | 0 | - | 91 % | 0.0 | 128/128 |
| 3 | y0 lead | 72 | 0 | 8 10 10 7 8 7 11 11 | 9 | G4..A5 (14 semitoni) | 56 % | 1.3 | 128/128 |
| 3 | y1 pad | 96 | 0 | 12 12 12 12 12 12 12 12 | 10 | G3..A#4 (15 semitoni) | 25 % | 1.5 | 128/128 |
| 3 | y2 bass | 64 | 4 | 9 10 8 8 8 8 8 9 | 10 | G2..A#3 (15 semitoni) | 50 % | 1.0 | 128/128 |
| 3 | y3 bass | 0 | 116 | 16 12 16 12 12 16 16 16 | 0 | - | 91 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.72; y0 0.97, y1 0.80, y2 0.84, y3 0.26.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 16.27 s | -0.2 | 0.99 | -22.6 | 22.4 | 0.00 % | 8 % | 0.07 s | 20.8 | 344 | 0.00 |
| 2 | 16.27 s | -0.3 | 0.99 | -23.1 | 22.8 | 0.00 % | 8 % | 0.07 s | 19.8 | 521 | 0.00 |
| 3 | 16.27 s | -0.2 | 1.03 | -23.1 | 22.9 | 0.00 % | 7 % | 0.07 s | 18.7 | 370 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 1 % | 56 % | 25 % | 16 % | 1 % | 0 % | 0 % |
| 2 | 1 % | 52 % | 17 % | 24 % | 5 % | 0 % | 0 % |
| 3 | 1 % | 59 % | 21 % | 16 % | 3 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 35 nodi, 167 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: N 204, H 73, S 63, A 24, C 24, K 19.
#2-21 line×20: 1290 celle x0-127 y0-3 z0-15, passi 1-20
  .→W 1280: x0-127 y2 z6-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#22-23 one×1, all×1: 31 celle x0-120 y2 z0-5, passi 21-36
  .→R 15: x24 y2 z0; x48 y2 z0; x64 y2 z1; x112 y2 z1; +11 scatole, 11 celle
  T→R 1: x0 y2 z0
 #24 all W → .: ×1, 1280 celle x0-127 y2 z6-15, passi 37
  W→. 1280: x0-127 y2 z6-15
#25-26 all×1, one×1: 163 celle x0-126 y1-2 z0-9, passi 38-54
  .→N 96: x2 y1 z0; x6 y1 z0; x26 y1 z0; x30 y1 z0; +92 scatole, 92 celle
  .→S 24: x3 y1 z0; x7 y1 z0; x51 y1 z0; x55 y1 z0; +20 scatole, 20 celle
  R→Y 16: x0 y2 z0; x24 y2 z0; x48 y2 z0; x64 y2 z1; +12 scatole, 12 celle
 #27 one **.***.* ******** ******** ******** Y***.*** → **N***N* ******** ******** ******** A***N*** (+2): ×16, 64 celle x0-126 y2 z0-12, passi 55-70
   r1 **.***.* ******** ******** ****… → **N***N* ******** ******** ****… ×9; r2 ***.**.* ******** ******** ****… → ***N**N* ******** ******** ****… ×5; r3 ****.*** ******** ******** **.*… → ****N*** ******** ******** **N*… ×2
  .→N 48: x4 y2 z0; x28 y2 z0; x52 y2 z0; x68 y2 z1; +44 scatole, 44 celle
  Y→A 16: x0 y2 z0; x24 y2 z0; x48 y2 z0; x64 y2 z1; +12 scatole, 12 celle
 #28 one ***.*****.***.** *..*..*..*...*.. D*****.******… → ***C*****C***C** *HH*HH*HH*HHH*HH K*****K******… (+2): ×8, 116 celle x0-127 y3 z0-2, passi 71-78
   r1 ***.*****.***.** *..*..*..*...*… → ***C*****C***C** *HH*HH*HH*HHH*… ×5; r2 ***.*****.***.** **.**.**.**.**… → ***C*****C***C** **H**H**H**H**… ×3; r3 ***.*****.**..** *.**.**.**.***… → ***C*****C**CC** *H**H**H**H***… ×0
  .→H 73: x10-12 y3 z1; x26-28 y3 z1; x58-60 y3 z1; x90-92 y3 z1; +36 scatole, 61 celle
  .→C 24: x3 y3 z2; x9 y3 z2; x13 y3 z2; x19 y3 z2; +20 scatole, 20 celle
  .→K 11: x6 y3 z0; x22 y3 z0; x38 y3 z0; x44 y3 z0; +7 scatole, 7 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #29 one *. M* → *M N* (+8): ×80, 199 celle x0-127 y0 z0-9, passi 79-158
   r1 *. M* → *M N* ×18; r2 M* *. → N* *M ×10; r3 **. M.* → **M NS* ×9; r4 M.* **. → NS* **M ×12; r5 *. ** M* → *M ** N* ×3; r6 M* ** *. → N* ** *M ×7; r7 M... → NSSM ×9; r8 M. → .M ×8; r9 M... → .**M ×4
 parte 1/4, passi 79-98:
  .→N 18: x21 y0 z0; x24 y0 z0; x27 y0 z0; x19 y0 z1; +14 scatole, 14 celle
  .→S 8: x22-23 y0 z0; x25-26 y0 z0; x14-15 y0 z6; x20 y0 z1; +1 scatole, 1 celle
  .→M 1: x30 y0 z4
  M→N 1: x0 y0 z7
 parte 2/4, passi 99-118:
  .→N 15: x35 y0 z2; x57 y0 z2; x33 y0 z3; x38 y0 z3; +11 scatole, 11 celle
  .→S 12: x59-60 y0 z3; x41-42 y0 z4; x53-54 y0 z4; x36 y0 z2; +5 scatole, 5 celle
  .→M 1: x64 y0 z3
  M→N 1: x30 y0 z4
 parte 3/4, passi 119-138:
  .→N 16: x70 y0 z0; x76 y0 z0; x85 y0 z0; x94 y0 z0; +12 scatole, 12 celle
  .→S 9: x86 y0 z0; x69 y0 z1; x72 y0 z1; x84 y0 z1; +5 scatole, 5 celle
  .→M 1: x95 y0 z1
  M→N 1: x64 y0 z3
 parte 4/4, passi 139-158:
  .→N 15: x96 y0 z0; x99 y0 z0; x102 y0 z0; x106 y0 z0; +11 scatole, 11 celle
  .→S 10: x97-98 y0 z0; x100-101 y0 z0; x107-108 y0 z0; x105 y0 z1; +3 scatole, 3 celle
  M→N 1: x95 y0 z1
  .→M 1: x127 y0 z4
#30-31 all×1, one×1: 9 celle x9-127 y0 z0-5, passi 159-167
  N→A 8: x21 y0 z0; x85 y0 z0; x106 y0 z0; x82 y0 z2; +4 scatole, 4 celle
  M→. 1: x127 y0 z4
Senza effetto (non hanno mai cambiato una cella):
#32 all X → .: in quel momento nella griglia non c'erano celle "X"
#33 all Y → .: in quel momento nella griglia non c'erano celle "Y"
#34 all Z → .: in quel momento nella griglia non c'erano celle "Z"
#35 all D → .: in quel momento nella griglia non c'erano celle "D"
```
