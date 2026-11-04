# suono-steampunk-tensione-pericolo

> Steampunk, il pericolo: pistoni in sedicesimi, un basso che macina, accordi d'ottone in levare e una sirena di melodia.

Sorgente: `lab/banco/suoni-cloud/steampunk/suono-steampunk-tensione-pericolo.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/steampunk/suono-steampunk-tensione-pericolo.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.70 (minima fra due semi 0.42), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.71 | 365-376 | 24 | -20.9..-20.0 | 1.04 | 9 % | 14.6 | 0.00 | 19 % | 128/128 |
| 4, 5, 6 | pulito | 0.71 | 385-400 | 22 | -21.3..-20.5 | 1.19 | 10 % | 15.0 | 0.00 | 18 % | 128/128 |
| 7, 8, 9 | pulito | 0.72 | 391-413 | 20 | -20.8..-19.5 | 1.10 | 12 % | 15.8 | 0.00 | 23 % | 128/128 |
| 10, 11, 12 | pulito | 0.77 | 364-391 | 22 | -20.7..-19.5 | 1.04 | 9 % | 15.4 | 0.00 | 15 % | 128/128 |
| 13, 14, 15 | pulito | 0.59 | 368-374 | 24 | -21.0..-20.3 | 1.04 | 10 % | 14.7 | 0.00 | 15 % | 128/128 |
| 16, 17, 18 | pulito | 0.74 | 367-397 | 24 | -21.1..-20.6 | 1.09 | 10 % | 19.3 | 0.01 | 21 % | 128/128 |
| 19, 20, 21 | pulito | 0.75 | 378-394 | 23 | -20.8..-19.9 | 1.09 | 10 % | 15.9 | 0.00 | 21 % | 128/128 |
| 22, 23, 24 | pulito | 0.72 | 359-391 | 22 | -20.9..-20.3 | 1.05 | 10 % | 15.1 | 0.01 | 19 % | 128/128 |
| 25, 26, 27 | pulito | 0.72 | 360-396 | 24 | -20.4..-19.7 | 1.09 | 9 % | 16.0 | 0.00 | 17 % | 128/128 |
| 28, 29, 30 | pulito | 0.75 | 381-392 | 20 | -20.6..-19.7 | 1.06 | 10 % | 15.2 | 0.00 | 13 % | 128/128 |

## Rapporto completo: Suono: suono-steampunk-tensione-pericolo (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 13.33 s a 144 bpm.
Dichiarata: F harmonic_minor (root 41); swing 0.00, cutoff 3800 Hz, space 0.25.
Tracce: y0 lead 0.45, y1 pad 0.42, y2 bass 0.58, y3 bass 0.62.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: . . F4~2 . C4~2 . G3 F3~2 . G3 F3 G3!~2 . F3~2 . A#3~2
  y1 pad: . . F2~2+G#2~2+C3~2 . . . . . . . F2~2+G#2~2+C3~2 . . . . .
  y2 bass: K+F1! . F1 F1 K+F1! . F1 F1 K+F1! . G1 G1 K+F1! . F1 F1
  y3 bass: K H H H C H H H K H K H C H H H
battuta 2:
  y0 lead: . C4 . . C#4~2 . E4 F4~2 . E4~2 . C#4 E4 C#4 E4~2 .
  y1 pad: . . G2+A#2+C#3 . . . G2+A#2+C#3 . . . G2+A#2+C#3 . . . G2+A#2+C#3 .
  y2 bass: G1! . G1 G1 G1! . G1 G1 G1! . G#1 G#1 G1! . G1 G1
  y3 bass: K H K H C H K H K H K H C H C H
battuta 3:
  y0 lead: C#4 E4~2 . C#4 E4!~4 . . . E4~2 . C#4~2 . G4~2 . C5!~2 .
  y1 pad: . . C3~2+E3~2+G3~2 . . . . . . . C3~2+E3~2+G3~2 . . . . .
  y2 bass: C2! . C2 C2 C2! . C2 C2 C2! . C#2 C#2 C2! . C2 C2
  y3 bass: K H K H C H K H K H K H C H C H
battuta 4:
  y0 lead: . . F4!~4 . . . F4 G4!~2 . G#4~2 . . . A#4 G#4~2 .
  y1 pad: . . A#2+C#3+F3 . . . A#2+C#3+F3 . . . A#2+C#3+F3 . . . A#2+C#3+F3 .
  y2 bass: A#1! A#1 A#1 A#1 A#1! A#1 A#1 A#1 A#1! A#1 A#1 A#1 A#1! A#1 F2 A#1
  y3 bass: K H H H C H H H K H K H C H H H
battuta 5:
  y0 lead: . . A#4! G#4 G4~2 . G#4 A#4!~4 . . . A#4 G#4 . . A#4~2
  y1 pad: . . G#2~2+C3~2+E3~2 . . . . . . . G#2~2+C3~2+E3~2 . . . . .
  y2 bass: G#1! G#1 G#1 G#1 G#1! G#1 G#1 G#1 G#1! G#1 G#1 G#1 G#1! G#1 E2 G#1
  y3 bass: K H K H C H K H K H K H C H C H
battuta 6:
  y0 lead: . G#4 A#4~2 . G#4!~4 . . . . . . . G#4! G4 F4~2 .
  y1 pad: . . G2~2+A#2~2+C#3~2 . . . . . . . G2~2+A#2~2+C#3~2 . . . . .
  y2 bass: G1! . G1 G1 G1! . G1 G1 G1! . G#1 G#1 G1! . G1 G1
  y3 bass: K H H H C H H H K H K H C H H H
battuta 7:
  y0 lead: . . G4! . . F4~2 . G#4~2 . E4 F4 G4 F4!~4 . . .
  y1 pad: . . G#2+C3+E3 . . . G#2+C3+E3 . . . G#2+C3+E3 . . . G#2+C3+E3 .
  y2 bass: G#1! G#1 G#1 G#1 G#1! G#1 G#1 G#1 G#1! G#1 G#1 G#1 G#1! G#1 E2 G#1
  y3 bass: K H H H C H H H K H K H C H H H
battuta 8:
  y0 lead: F4 . . E4~2 . C#4~2 . E4~2 . A#3 . . C4 . . .
  y1 pad: . . A#2~2+C#3~2+F3~2 . . . . . . . A#2~2+C#3~2+F3~2 . . . . .
  y2 bass: A#1! . A#1 A#1 A#1! . A#1 A#1 A#1! . C2 C2 A#1! . A#1 A#1
  y3 bass: K H K H C H K H K H K H C H C H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 365 | 100 % | 25 | F1..C5 (43 semitoni) | 100 % | 15 % | F harmonic_minor (0.78) | 0.78 | 19 % | 128/128 |
| 2 | 376 | 100 % | 26 | F1..C5 (43 semitoni) | 100 % | 24 % | A# dorian (0.81) | 0.80 | 13 % | 128/128 |
| 3 | 368 | 100 % | 24 | F1..C5 (43 semitoni) | 100 % | 18 % | F harmonic_minor (0.91) | 0.91 | 11 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 59 | 0 | 9 9 8 6 8 6 7 6 | 11 | F3..C5 (19 semitoni) | 46 % | 1.7 | 128/128 |
| 1 | y1 pad | 66 | 0 | 6 12 6 12 6 6 12 6 | 9 | F2..G3 (14 semitoni) | 17 % | 1.5 | 128/128 |
| 1 | y2 bass | 108 | 4 | 16 12 12 16 16 12 16 12 | 8 | F1..F2 (12 semitoni) | 84 % | 1.0 | 128/128 |
| 1 | y3 bass | 0 | 128 | 16 16 16 16 16 16 16 16 | 0 | - | 100 % | 0.0 | 128/128 |
| 2 | y0 lead | 52 | 0 | 9 8 5 6 6 4 6 8 | 12 | F3..C5 (19 semitoni) | 41 % | 1.9 | 128/128 |
| 2 | y1 pad | 72 | 0 | 12 6 6 6 12 6 12 12 | 8 | F2..F3 (12 semitoni) | 19 % | 1.3 | 128/128 |
| 2 | y2 bass | 112 | 12 | 16 12 16 20 16 12 16 16 | 8 | F1..F2 (12 semitoni) | 88 % | 1.0 | 128/128 |
| 2 | y3 bass | 0 | 128 | 16 16 16 16 16 16 16 16 | 0 | - | 100 % | 0.0 | 128/128 |
| 3 | y0 lead | 50 | 0 | 6 8 8 5 5 7 6 5 | 8 | C4..C5 (12 semitoni) | 39 % | 1.8 | 128/128 |
| 3 | y1 pad | 78 | 0 | 12 12 6 6 6 12 12 12 | 9 | F2..G3 (14 semitoni) | 20 % | 1.2 | 128/128 |
| 3 | y2 bass | 108 | 4 | 14 16 16 12 16 14 12 12 | 8 | F1..G2 (14 semitoni) | 84 % | 1.0 | 128/128 |
| 3 | y3 bass | 0 | 128 | 16 16 16 16 16 16 16 16 | 0 | - | 100 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.71; y0 0.97, y1 0.74, y2 0.85, y3 0.33.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 13.33 s | -0.5 | 0.95 | -20.4 | 19.9 | 0.00 % | 8 % | 0.07 s | 15.1 | 181 | 0.00 |
| 2 | 13.33 s | -0.2 | 1.04 | -20.0 | 19.9 | 0.00 % | 9 % | 0.05 s | 15.5 | 150 | 0.00 |
| 3 | 13.33 s | -0.2 | 1.04 | -20.9 | 20.8 | 0.00 % | 9 % | 0.05 s | 14.6 | 175 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 7 % | 81 % | 7 % | 3 % | 1 % | 0 % | 0 % |
| 2 | 6 % | 87 % | 3 % | 2 % | 1 % | 0 % | 0 % |
| 3 | 6 % | 84 % | 6 % | 3 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 36 nodi, 134 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: N 190, H 76, S 72, A 43, K 32, C 20.
#2-22 line×21: 1418 celle x0-127 y0-3 z0-15, passi 1-21
  .→W 1408: x0-127 y2 z5-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#23-24 one×1, all×1: 15 celle x0-112 y2 z0-4, passi 22-29
  .→R 7: x16 y2 z1; x80 y2 z1; x64 y2 z2; x96 y2 z2; +3 scatole, 3 celle
  T→R 1: x0 y2 z0
 #25 all W → .: ×1, 1408 celle x0-127 y2 z5-15, passi 30
  W→. 1408: x0-127 y2 z5-15
#26-27 all×1, one×1: 120 celle x0-123 y1-2 z0-8, passi 31-39
  .→N 66: x2 y1 z0; x10 y1 z0; x18 y1 z1; x22 y1 z1; +62 scatole, 62 celle
  .→S 30: x3 y1 z0; x11 y1 z0; x83 y1 z1; x91 y1 z1; +26 scatole, 26 celle
  R→Y 8: x0 y2 z0; x16 y2 z1; x80 y2 z1; x64 y2 z2; +4 scatole, 4 celle
 #28 one **************.* **************** *************… → **************N* **************** *************… (+2): ×8, 108 celle x0-127 y2 z0-7, passi 40-47
   r1 **************.* **************… → **************N* **************… ×3; r2 **********..**** Y*...*...***.*… → **********NN**** A*NNA*NNA***A*… ×5; r3 ************.*.. **************… → ************N*NN **************… ×0
  .→N 76: x65-67 y2 z2; x69-71 y2 z2; x73-75 y2 z2; x97-99 y2 z2; +34 scatole, 64 celle
  .→A 24: x4 y2 z0; x8 y2 z0; x12 y2 z0; x20 y2 z1; +20 scatole, 20 celle
  Y→A 8: x0 y2 z0; x16 y2 z1; x80 y2 z1; x64 y2 z2; +4 scatole, 4 celle
 #29 one ****.*******.*** *...*...*.*.*... D*******.*.**… → ****C*******C*** *HHH*HHH*H*H*HHH K*******K*K**… (+2): ×8, 128 celle x0-127 y3 z0-2, passi 48-55
   r1 ****.*******.*** *...*...*.*.*.… → ****C*******C*** *HHH*HHH*H*H*H… ×4; r2 ****.*******.*.* *.*.*.*.*.*.*.… → ****C*******C*C* *H*H*H*H*H*H*H… ×4; r3 ****.*******.... *..**..**..***… → ****C*******CCCC *HH**HH**HH***… ×0
  .→H 76: x1-3 y3 z1; x5-7 y3 z1; x13-15 y3 z1; x49-51 y3 z1; +48 scatole, 64 celle
  .→K 24: x8 y3 z0; x10 y3 z0; x18 y3 z0; x22 y3 z0; +20 scatole, 20 celle
  .→C 20: x4 y3 z2; x12 y3 z2; x20 y3 z2; x28 y3 z2; +16 scatole, 16 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
 #30 one **. M.* → **M NS* (+7): ×72, 186 celle x0-127 y0 z0-15, passi 56-127
   r1 **. M.* → **M NS* ×10; r2 M.* **. → NS* **M ×9; r3 *. M* → *M N* ×14; r4 M* *. → N* *M ×13; r5 M.... → ASSSM ×5; r6 **. *** *** M.* → **M *** *** NS* ×3; r7 M.* *** *** **. → NS* *** *** **M ×5; r8 M.. → .*M ×13
 parte 1/4, passi 56-73:
  .→N 16: x7 y0 z0; x10 y0 z0; x13 y0 z0; x6 y0 z1; +12 scatole, 12 celle
  .→S 9: x8 y0 z0; x14 y0 z0; x12 y0 z1; x16 y0 z3; +5 scatole, 5 celle
  .→M 1: x29 y0 z5
  M→. 1: x0 y0 z7
 parte 2/4, passi 74-91:
  .→S 15: x37-39 y0 z6; x51-53 y0 z12; x43 y0 z5; x31 y0 z6; +7 scatole, 7 celle
  .→N 13: x32 y0 z5; x35 y0 z5; x42 y0 z5; x30 y0 z6; +9 scatole, 9 celle
  .→A 2: x36 y0 z6; x50 y0 z12
  M→N 1: x29 y0 z5
  .→M 1: x64 y0 z15
 parte 3/4, passi 92-109:
  .→N 12: x94 y0 z12; x68 y0 z13; x93 y0 z13; x67 y0 z14; +8 scatole, 8 celle
  .→S 10: x85-87 y0 z14; x72-74 y0 z15; x95 y0 z12; x69 y0 z13; +2 scatole, 2 celle
  .→A 2: x84 y0 z14; x71 y0 z15
  .→M 1: x96 y0 z13
  M→. 1: x64 y0 z15
 parte 4/4, passi 110-127:
  .→N 12: x121 y0 z3; x124 y0 z4; x117 y0 z5; x105 y0 z6; +8 scatole, 8 celle
  .→S 8: x109-111 y0 z7; x118 y0 z5; x116 y0 z6; x120 y0 z6; +2 scatole, 2 celle
  .→M 1: x127 y0 z3
  .→A 1: x108 y0 z7
  M→. 1: x96 y0 z13
#31-32 all×1, one×1: 7 celle x11-127 y0 z1-15, passi 128-134
  N→A 6: x11 y0 z1; x46 y0 z11; x55 y0 z13; x98 y0 z13; +2 scatole, 2 celle
  M→. 1: x127 y0 z3
Senza effetto (non hanno mai cambiato una cella):
#33 all X → .: in quel momento nella griglia non c'erano celle "X"
#34 all Y → .: in quel momento nella griglia non c'erano celle "Y"
```
