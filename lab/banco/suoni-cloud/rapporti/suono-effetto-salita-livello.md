# suono-effetto-salita-livello

> Un traguardo: un rullo che cresce, una fanfara che sale per la triade e si posa in alto su un accordo pieno, coi piatti. Una battuta.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-salita-livello.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-salita-livello.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.41 (minima fra due semi 0.09), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.45 | 21-22 | 12 | -22.0..-21.7 | 1.13 | 2 % | 14.7 | 0.01 | 3 % | 16/16 |
| 4, 5, 6 | pulito | 0.43 | 21-22 | 11 | -22.1..-21.7 | 1.13 | 2 % | 14.7 | 0.01 | 2 % | 16/16 |
| 7, 8, 9 | pulito | 0.45 | 21-22 | 11 | -22.3..-22.0 | 1.16 | 2 % | 14.8 | 0.01 | 2 % | 16/16 |
| 10, 11, 12 | pulito | 0.42 | 22-22 | 11 | -22.1..-22.0 | 1.15 | 3 % | 14.1 | 0.01 | 0 % | 16/16 |
| 13, 14, 15 | pulito | 0.37 | 21-22 | 11 | -22.0..-21.9 | 1.12 | 2 % | 14.9 | 0.01 | 3 % | 16/16 |
| 16, 17, 18 | pulito | 0.38 | 22-22 | 11 | -22.1..-21.8 | 1.15 | 3 % | 14.3 | 0.00 | 0 % | 16/16 |
| 19, 20, 21 | pulito | 0.46 | 21-22 | 11 | -22.2..-22.1 | 1.17 | 3 % | 18.2 | 0.01 | 2 % | 16/16 |
| 22, 23, 24 | pulito | 0.35 | 22-22 | 11 | -22.1..-21.8 | 1.15 | 2 % | 14.6 | 0.01 | 0 % | 16/16 |
| 25, 26, 27 | pulito | 0.45 | 21-22 | 11 | -22.1..-21.7 | 1.14 | 2 % | 15.0 | 0.01 | 0 % | 16/16 |
| 28, 29, 30 | pulito | 0.42 | 21-21 | 11 | -22.0..-21.7 | 1.12 | 2 % | 18.4 | 0.01 | 2 % | 16/16 |

## Rapporto completo: Suono: suono-effetto-salita-livello (semi 1, 2, 3)

16 passi, 1 battuta, ciclo di 1.88 s a 128 bpm.
Dichiarata: G dorian (root 55); swing 0.00, cutoff 8000 Hz, space 0.50.
Tracce: y0 lead 0.55, y1 pad 0.55, y2 bass 0.60, y3 bass 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: G4~2 . A#4~2 . D5~2 . E5~2 . G5!~5 . . . . g5 G5 .
  y1 pad: . . . . . . . . G3~8+A#3~8+D4~8+F4~8 . . . . . . .
  y2 bass: D3~4 . . . A#2~4 . . . K+G2!~8 . . . . . . .
  y3 bass: C C . . . C . . K+O . . . . H . H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 22 | 63 % | 12 | G2..G5 (36 semitoni) | 100 % | 44 % | G pentatonic_minor (0.92) | 0.87 | 2 % | 16/16 |
| 2 | 22 | 50 % | 12 | G2..A#5 (39 semitoni) | 100 % | 55 % | G pentatonic_minor (0.86) | 0.82 | 3 % | 16/16 |
| 3 | 21 | 56 % | 12 | G2..A#5 (39 semitoni) | 100 % | 32 % | G pentatonic_minor (0.96) | 0.89 | 0 % | 16/16 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 7 | 0 | 7 | 5 | G4..G5 (12 semitoni) | 44 % | 2.1 | 16/16 |
| 1 | y1 pad | 4 | 0 | 4 | 4 | G3..F4 (10 semitoni) | 6 % | 8.0 | 16/16 |
| 1 | y2 bass | 3 | 1 | 4 | 3 | G2..D3 (7 semitoni) | 19 % | 5.3 | 16/16 |
| 1 | y3 bass | 0 | 7 | 7 | 0 | - | 38 % | 0.0 | 16/16 |
| 2 | y0 lead | 7 | 0 | 7 | 6 | G4..A#5 (15 semitoni) | 38 % | 2.1 | 16/16 |
| 2 | y1 pad | 4 | 0 | 4 | 4 | G3..G4 (12 semitoni) | 6 % | 8.0 | 16/16 |
| 2 | y2 bass | 3 | 1 | 4 | 3 | G2..D3 (7 semitoni) | 19 % | 5.3 | 16/16 |
| 2 | y3 bass | 0 | 7 | 7 | 0 | - | 38 % | 0.0 | 16/16 |
| 3 | y0 lead | 6 | 0 | 6 | 5 | G4..A#5 (15 semitoni) | 38 % | 2.5 | 16/16 |
| 3 | y1 pad | 4 | 0 | 4 | 4 | G3..F4 (10 semitoni) | 6 % | 8.0 | 16/16 |
| 3 | y2 bass | 3 | 1 | 4 | 3 | G2..D3 (7 semitoni) | 19 % | 5.3 | 16/16 |
| 3 | y3 bass | 0 | 7 | 7 | 0 | - | 38 % | 0.0 | 16/16 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.45; y0 0.45, y1 0.27, y2 0.27, y3 0.59.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.88 s | -0.2 | 1.13 | -22.0 | 21.8 | 0.00 % | 2 % | 0.02 s | 14.7 | 514 | 0.01 |
| 2 | 1.88 s | -0.2 | 1.13 | -21.9 | 21.8 | 0.00 % | 2 % | 0.02 s | 20.3 | 492 | 0.00 |
| 3 | 1.88 s | -0.2 | 1.09 | -21.7 | 21.5 | 0.00 % | 2 % | 0.02 s | 18.6 | 510 | 0.01 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 2 % | 66 % | 13 % | 15 % | 2 % | 2 % | 1 % |
| 2 | 2 % | 66 % | 13 % | 14 % | 2 % | 2 % | 1 % |
| 3 | 2 % | 67 % | 13 % | 14 % | 2 % | 2 % | 1 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 16×4×16, 47 nodi, 48 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore), M=Scelta (marcatore).
Alla fine: S 50, N 10, H 3, C 3, A 2, K 1, G 1.
#2-3 line×2: 2 celle x0-4 y3 z2, passi 1-2
  .→C 2: x0 y3 z2; x4 y3 z2
#4-5 line×2: 2 celle x6-7 y3 z2, passi 3-4
  .→C 2: x6-7 y3 z2
 #6 line 1 3 2 → 7 3 2 T: ×1, 7 celle x1-7 y3 z2, passi 5
  .→T 4: x1-3 y3 z2; x5 y3 z2
  C→T 3: x6-7 y3 z2; x4 y3 z2
 #7 one T → C passi=2: ×2, 2 celle x1-5 y3 z2, passi 6-7
  T→C 2: x1 y3 z2; x5 y3 z2
 #8 all T → .: ×1, 5 celle x2-7 y3 z2, passi 8
  T→. 5: x2-4 y3 z2; x6-7 y3 z2
#9-10 line×2: 2 celle x8 y3 z0-4, passi 9-10
  .→K 1: x8 y3 z0
  .→H 1: x8 y3 z4
 #11 line 10 3 1 → 15 3 1 U: ×1, 6 celle x10-15 y3 z1, passi 11
  .→U 6: x10-15 y3 z1
 #12 one U → H passi=2: ×2, 2 celle x13-15 y3 z1, passi 12-13
  U→H 2: x13 y3 z1; x15 y3 z1
 #13 all U → .: ×1, 4 celle x10-14 y3 z1, passi 14
  U→. 4: x10-12 y3 z1; x14 y3 z1
#14-15 line×2: 2 celle x0-2 y0 z0-2, passi 15-16
  .→N 2: x0 y0 z0; x2 y0 z2
#16-17 line×2: 2 celle x4-6 y0 z4-5, passi 17-18
  .→N 1: x4 y0 z4
  .→V 1: x6 y0 z5
 #18 line 6 0 6 → 6 0 6 V: ×1, 1 celle x6 y0 z6, passi 19
  .→V 1: x6 y0 z6
 #19 one V → N passi=1: ×1, 1 celle x6 y0 z5, passi 20
  V→N 1: x6 y0 z5
 #20 all V → .: ×1, 1 celle x6 y0 z6, passi 21
  V→. 1: x6 y0 z6
#21-22 line×2: 2 celle x8 y0 z7-9, passi 22-23
  .→P 2: x8 y0 z7; x8 y0 z9
 #23 one P → A passi=1: ×1, 1 celle x8 y0 z7, passi 24
  P→A 1: x8 y0 z7
 #24 all P → .: ×1, 1 celle x8 y0 z9, passi 25
  P→. 1: x8 y0 z9
 #25 all N. → NS: ×1, 4 celle x1-7 y0 z0-5, passi 26
  .→S 4: x1 y0 z0; x3 y0 z2; x5 y0 z4; x7 y0 z5
 #26 all A...... → ASSSSSS: ×1, 6 celle x9-14 y0 z7, passi 27
  .→S 6: x9-14 y0 z7
 #27 line 13 0 4 → 13 0 4 M: ×1, 1 celle x13 y0 z4, passi 28
  .→M 1: x13 y0 z4
 #28 line 13 0 7 → 13 0 7 M: ×1, 1 celle x13 y0 z7, passi 29
  S→M 1: x13 y0 z7
 #29 line 14 0 9 → 14 0 9 M: ×1, 1 celle x14 y0 z9, passi 30
  .→M 1: x14 y0 z9
 #30 one M → G passi=1: ×1, 1 celle x13 y0 z7, passi 31
  M→G 1: x13 y0 z7
 #31 all M → .: ×1, 2 celle x13-14 y0 z4-9, passi 32
  M→. 2: x13 y0 z4; x14 y0 z9
 #32 line 8 1 0 → 8 1 0 N: ×1, 1 celle x8 y1 z0, passi 33
  .→N 1: x8 y1 z0
 #33 line 8 1 2 → 8 1 2 N: ×1, 1 celle x8 y1 z2, passi 34
  .→N 1: x8 y1 z2
 #34 line 8 1 4 → 8 1 4 N: ×1, 1 celle x8 y1 z4, passi 35
```
