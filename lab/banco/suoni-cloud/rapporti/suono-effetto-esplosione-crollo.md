# suono-effetto-esplosione-crollo

> Un'esplosione e il crollo: il botto grave, il rullante che si spacca, poi i calcinacci che cadono dove il seme vuole.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-esplosione-crollo.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-esplosione-crollo.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.56 (minima fra due semi 0.27), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.60 | 13-13 | 4 | -20.8..-20.8 | 0.92 | 33 % | 24.7 | 0.00 | 0 % | 12/12 |
| 4, 5, 6 | pulito | 0.40 | 13-13 | 4 | -20.8..-20.8 | 0.94 | 32 % | 32.4 | 0.00 | 0 % | 12/12 |
| 7, 8, 9 | pulito | 0.52 | 13-13 | 4 | -20.8..-20.8 | 0.97 | 32 % | 31.1 | 0.01 | 0 % | 12/12 |
| 10, 11, 12 | pulito | 0.53 | 13-13 | 4 | -20.8..-20.8 | 0.95 | 27 % | 25.4 | 0.01 | 0 % | 12/12 |
| 13, 14, 15 | pulito | 0.58 | 13-13 | 4 | -20.8..-20.8 | 0.95 | 35 % | 28.3 | 0.00 | 0 % | 12/12 |
| 16, 17, 18 | pulito | 0.55 | 13-13 | 4 | -20.9..-20.8 | 0.99 | 27 % | 25.3 | 0.00 | 0 % | 12/12 |
| 19, 20, 21 | pulito | 0.61 | 13-13 | 4 | -20.9..-20.8 | 0.99 | 32 % | 35.2 | 0.01 | 0 % | 12/12 |
| 22, 23, 24 | pulito | 0.58 | 13-13 | 4 | -20.8..-20.8 | 0.95 | 31 % | 34.8 | 0.01 | 0 % | 12/12 |
| 25, 26, 27 | pulito | 0.52 | 13-13 | 4 | -20.8..-20.8 | 0.97 | 32 % | 29.0 | 0.00 | 0 % | 12/12 |
| 28, 29, 30 | pulito | 0.55 | 13-13 | 4 | -20.9..-20.8 | 0.99 | 38 % | 25.1 | 0.00 | 0 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-esplosione-crollo (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.64 s a 110 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A phrygian (root 33); swing 0.00, cutoff 3000 Hz, space 0.50.
Tracce: y0 bass 0.85, y1 pad 0.55, y2 bass 0.70.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 bass: K+A0!~8 . . . . . . . . . . .
  y1 pad: A1~7+D2~7 E2~7 . . . . . . . . . .
  y2 bass: C+O . . . K+H . K+H+C . . . . H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 13 | 42 % | 4 | A0..E2 (19 semitoni) | 100 % | 63 % | A pentatonic_minor (0.78) | 0.73 | 0 % | 12/12 |
| 2 | 13 | 50 % | 4 | A0..A2 (24 semitoni) | 100 % | 82 % | A pentatonic_minor (0.66) | 0.62 | 0 % | 12/12 |
| 3 | 13 | 58 % | 4 | A0..A2 (24 semitoni) | 100 % | 82 % | A pentatonic_minor (0.66) | 0.62 | 0 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 bass | 1 | 1 | 2 | 1 | A0 | 8 % | 8.0 | 12/12 |
| 1 | y1 pad | 3 | 0 | 3 | 3 | A1..E2 (7 semitoni) | 17 % | 7.0 | 12/12 |
| 1 | y2 bass | 0 | 8 | 8 | 0 | - | 33 % | 0.0 | 12/12 |
| 2 | y0 bass | 1 | 1 | 2 | 1 | A0 | 8 % | 8.0 | 12/12 |
| 2 | y1 pad | 3 | 0 | 3 | 3 | A1..A2 (12 semitoni) | 17 % | 7.0 | 12/12 |
| 2 | y2 bass | 0 | 8 | 8 | 0 | - | 42 % | 0.0 | 12/12 |
| 3 | y0 bass | 1 | 1 | 2 | 1 | A0 | 8 % | 8.0 | 12/12 |
| 3 | y1 pad | 3 | 0 | 3 | 3 | A1..A2 (12 semitoni) | 17 % | 7.0 | 12/12 |
| 3 | y2 bass | 0 | 8 | 8 | 0 | - | 50 % | 0.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.60; y0 0.00, y1 0.33, y2 0.76.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.64 s | -0.7 | 0.92 | -20.8 | 20.1 | 0.00 % | 33 % | 0.21 s | 39.7 | 122 | 0.00 |
| 2 | 1.64 s | -1.2 | 0.87 | -20.8 | 19.6 | 0.00 % | 20 % | 0.20 s | 32.9 | 114 | 0.00 |
| 3 | 1.64 s | -0.7 | 0.92 | -20.8 | 20.1 | 0.00 % | 19 % | 0.09 s | 24.7 | 123 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 31 % | 66 % | 1 % | 1 % | 0 % | 0 % | 0 % |
| 2 | 32 % | 65 % | 1 % | 1 % | 0 % | 0 % | 0 % |
| 3 | 31 % | 66 % | 1 % | 1 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×3×8, 22 nodi, 24 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 25, H 4, N 3, K 2, C 2, A 1.
 #2 line 0 0 0 → 0 0 0 A: ×1, 1 celle x0 y0 z0, passi 1
  .→A 1: x0 y0 z0
 #3 all A....... → ASSSSSSS: ×1, 7 celle x1-7 y0 z0, passi 2
  .→S 7: x1-7 y0 z0
 #4 line 0 2 2 → 0 2 2 C: ×1, 1 celle x0 y2 z2, passi 3
  .→C 1: x0 y2 z2
 #5 line 0 2 4 → 0 2 4 H: ×1, 1 celle x0 y2 z4, passi 4
  .→H 1: x0 y2 z4
 #6 line 0 1 0 → 0 1 0 N: ×1, 1 celle x0 y1 z0, passi 5
  .→N 1: x0 y1 z0
 #7 line 0 1 3 → 0 1 3 N: ×1, 1 celle x0 y1 z3, passi 6
  .→N 1: x0 y1 z3
 #8 line 1 1 4 → 1 1 4 T: ×1, 1 celle x1 y1 z4, passi 7
  .→T 1: x1 y1 z4
 #9 line 2 1 7 → 2 1 7 T: ×1, 1 celle x2 y1 z7, passi 8
  .→T 1: x2 y1 z7
 #10 line 1 1 2 → 1 1 2 T: ×1, 1 celle x1 y1 z2, passi 9
  .→T 1: x1 y1 z2
 #11 one T → N passi=1: ×1, 1 celle x1 y1 z4, passi 10
  T→N 1: x1 y1 z4
 #12 all T → .: ×1, 2 celle x1-2 y1 z2-7, passi 11
  T→. 2: x1 y1 z2; x2 y1 z7
 #13 all N...... → NSSSSSS: ×1, 18 celle x1-7 y1 z0-4, passi 12
  .→S 18: x1-6 y1 z0; x1-6 y1 z3; x2-7 y1 z4
 #14 line 2 2 1 → 11 2 1 U: ×1, 10 celle x2-11 y2 z1, passi 13
  .→U 10: x2-11 y2 z1
 #15 one U → H passi=3: ×3, 3 celle x4-11 y2 z1, passi 14-16
  U→H 3: x4 y2 z1; x6 y2 z1; x11 y2 z1
 #16 all U → .: ×1, 7 celle x2-10 y2 z1, passi 17
  U→. 7: x7-10 y2 z1; x2-3 y2 z1; x5 y2 z1
 #17 line 3 2 0 → 10 2 0 V: ×1, 8 celle x3-10 y2 z0, passi 18
  .→V 8: x3-10 y2 z0
 #18 one V → K passi=2: ×2, 2 celle x4-6 y2 z0, passi 19-20
  V→K 2: x4 y2 z0; x6 y2 z0
 #19 all V → .: ×1, 6 celle x3-10 y2 z0, passi 21
  V→. 6: x7-10 y2 z0; x3 y2 z0; x5 y2 z0
 #20 line 4 2 2 → 10 2 2 P: ×1, 7 celle x4-10 y2 z2, passi 22
  .→P 7: x4-10 y2 z2
 #21 one P → C passi=1: ×1, 1 celle x6 y2 z2, passi 23
  P→C 1: x6 y2 z2
 #22 all P → .: ×1, 6 celle x4-10 y2 z2, passi 24
  P→. 6: x7-10 y2 z2; x4-5 y2 z2
```
