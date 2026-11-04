# suono-effetto-meccanismo-leva

> Una leva tirata: gli scatti del cricchetto, poi il meccanismo che cade al suo posto con un tonfo e una nota di ferro.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-meccanismo-leva.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-meccanismo-leva.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.45 (minima fra due semi 0.00), 20 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.20 | 8-9 | 2 | -24.3..-23.3 | 1.42 | 65 % | 27.5 | 0.00 | 0 % | 12/12 |
| 4, 5, 6 | pulito | 0.41 | 8-9 | 2 | -24.8..-22.1 | 1.38 | 64 % | 28.1 | 0.00 | 0 % | 12/12 |
| 7, 8, 9 | pulito | 0.41 | 8-9 | 2 | -24.8..-21.6 | 1.33 | 64 % | 28.5 | 0.00 | 0 % | 12/12 |
| 10, 11, 12 | pulito | 0.54 | 8-8 | 2 | -24.7..-24.4 | 1.01 | 57 % | 34.0 | 0.00 | 0 % | 12/12 |
| 13, 14, 15 | pulito | 0.30 | 8-9 | 2 | -24.2..-23.6 | 1.47 | 59 % | 36.4 | 0.00 | 0 % | 12/12 |
| 16, 17, 18 | pulito | 0.54 | 8-8 | 2 | -24.7..-24.2 | 1.00 | 63 % | 29.1 | 0.00 | 0 % | 12/12 |
| 19, 20, 21 | pulito | 0.44 | 8-9 | 2 | -25.5..-23.6 | 1.48 | 67 % | 27.4 | 0.00 | 0 % | 12/12 |
| 22, 23, 24 | pulito | 0.51 | 8-9 | 2 | -24.9..-22.8 | 1.49 | 67 % | 27.8 | 0.00 | 0 % | 12/12 |
| 25, 26, 27 | pulito | 0.50 | 8-9 | 2 | -24.5..-23.3 | 1.42 | 64 % | 27.4 | 0.00 | 0 % | 12/12 |
| 28, 29, 30 | pulito | 0.56 | 8-9 | 2 | -24.6..-23.3 | 1.43 | 67 % | 28.4 | 0.00 | 0 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-meccanismo-leva (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.29 s a 140 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A harmonic_minor (root 45); swing 0.00, cutoff 5200 Hz, space 0.30.
Tracce: y0 bass 0.75, y1 lead 0.50, y2 bass 0.75.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 bass: . . . . . . C2!~4 . . . . .
  y1 lead: . . . . . . A4~4 . . . . .
  y2 bass: H H H . H . K+C . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 | 42 % | 2 | C2..A4 (33 semitoni) | 100 % | 32 % | C dorian (0.60) | 0.50 | 0 % | 12/12 |
| 2 | 9 | 42 % | 2 | A1..A4 (36 semitoni) | 100 % | 100 % | A pentatonic_minor (0.63) | 0.61 | 0 % | 12/12 |
| 3 | 8 | 42 % | 2 | C2..A4 (33 semitoni) | 100 % | 32 % | C dorian (0.60) | 0.50 | 0 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 bass | 1 | 0 | 1 | 1 | C2 | 8 % | 4.0 | 12/12 |
| 1 | y1 lead | 1 | 0 | 1 | 1 | A4 | 8 % | 4.0 | 12/12 |
| 1 | y2 bass | 0 | 6 | 6 | 0 | - | 42 % | 0.0 | 12/12 |
| 2 | y0 bass | 1 | 1 | 2 | 1 | A1 | 8 % | 4.0 | 12/12 |
| 2 | y1 lead | 1 | 0 | 1 | 1 | A4 | 8 % | 4.0 | 12/12 |
| 2 | y2 bass | 0 | 6 | 6 | 0 | - | 42 % | 0.0 | 12/12 |
| 3 | y0 bass | 1 | 0 | 1 | 1 | C2 | 8 % | 4.0 | 12/12 |
| 3 | y1 lead | 1 | 0 | 1 | 1 | A4 | 8 % | 4.0 | 12/12 |
| 3 | y2 bass | 0 | 6 | 6 | 0 | - | 42 % | 0.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.20; y0 0.67, y1 0.00, y2 0.00.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.29 s | -0.5 | 0.95 | -24.3 | 23.8 | 0.00 % | 60 % | 0.20 s | 27.7 | 312 | 0.00 |
| 2 | 1.29 s | -0.2 | 1.42 | -23.3 | 23.2 | 0.00 % | 65 % | 0.22 s | 27.8 | 175 | 0.00 |
| 3 | 1.29 s | -0.5 | 0.95 | -24.2 | 23.8 | 0.00 % | 59 % | 0.20 s | 27.5 | 323 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 5 % | 79 % | 10 % | 3 % | 1 % | 2 % | 0 % |
| 2 | 11 % | 83 % | 4 % | 1 % | 0 % | 1 % | 0 % |
| 3 | 5 % | 79 % | 10 % | 3 % | 1 % | 2 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×3×8, 25 nodi, 24 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 6, H 4, K 1, A 1, C 1, N 1.
 #2 line 0 2 1 → 0 2 1 H: ×1, 1 celle x0 y2 z1, passi 1
  .→H 1: x0 y2 z1
 #3 line 1 2 1 → 1 2 1 H: ×1, 1 celle x1 y2 z1, passi 2
  .→H 1: x1 y2 z1
 #4 line 2 2 1 → 2 2 1 H: ×1, 1 celle x2 y2 z1, passi 3
  .→H 1: x2 y2 z1
 #5 line 3 2 1 → 3 2 1 T: ×1, 1 celle x3 y2 z1, passi 4
  .→T 1: x3 y2 z1
 #6 line 4 2 1 → 4 2 1 T: ×1, 1 celle x4 y2 z1, passi 5
  .→T 1: x4 y2 z1
 #7 one T → H passi=1: ×1, 1 celle x4 y2 z1, passi 6
  T→H 1: x4 y2 z1
 #8 all T → .: ×1, 1 celle x3 y2 z1, passi 7
  T→. 1: x3 y2 z1
 #9 line 6 2 0 → 6 2 0 K: ×1, 1 celle x6 y2 z0, passi 8
  .→K 1: x6 y2 z0
 #10 line 6 2 2 → 6 2 2 U: ×1, 1 celle x6 y2 z2, passi 9
  .→U 1: x6 y2 z2
 #11 line 7 2 2 → 7 2 2 U: ×1, 1 celle x7 y2 z2, passi 10
  .→U 1: x7 y2 z2
 #12 one U → C passi=1: ×1, 1 celle x6 y2 z2, passi 11
  U→C 1: x6 y2 z2
 #13 all U → .: ×1, 1 celle x7 y2 z2, passi 12
  U→. 1: x7 y2 z2
 #14 line 6 0 0 → 6 0 0 V: ×1, 1 celle x6 y0 z0, passi 13
  .→V 1: x6 y0 z0
 #15 line 6 0 4 → 6 0 4 V: ×1, 1 celle x6 y0 z4, passi 14
  .→V 1: x6 y0 z4
 #16 line 6 0 2 → 6 0 2 V: ×1, 1 celle x6 y0 z2, passi 15
  .→V 1: x6 y0 z2
 #17 one V → A passi=1: ×1, 1 celle x6 y0 z2, passi 16
  V→A 1: x6 y0 z2
 #18 all V → .: ×1, 2 celle x6 y0 z0-4, passi 17
  V→. 2: x6 y0 z0; x6 y0 z4
 #19 all A... → ASSS: ×1, 3 celle x7-9 y0 z2, passi 18
  .→S 3: x7-9 y0 z2
 #20 line 6 1 4 → 6 1 4 P: ×1, 1 celle x6 y1 z4, passi 19
  .→P 1: x6 y1 z4
 #21 line 6 1 7 → 6 1 7 P: ×1, 1 celle x6 y1 z7, passi 20
  .→P 1: x6 y1 z7
 #22 line 7 1 2 → 7 1 2 P: ×1, 1 celle x7 y1 z2, passi 21
  .→P 1: x7 y1 z2
 #23 one P → N passi=1: ×1, 1 celle x6 y1 z7, passi 22
  P→N 1: x6 y1 z7
 #24 all P → .: ×1, 2 celle x6-7 y1 z2-4, passi 23
  P→. 2: x7 y1 z2; x6 y1 z4
 #25 all N... → NSSS: ×1, 3 celle x7-9 y1 z7, passi 24
  .→S 3: x7-9 y1 z7
```
