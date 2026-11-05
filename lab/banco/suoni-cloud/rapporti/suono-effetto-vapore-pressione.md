# suono-effetto-vapore-pressione

> Una valvola sotto pressione: il soffio che si stringe in colpi sempre più fitti, un fischio che sale di semitono e scappa.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-vapore-pressione.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-vapore-pressione.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.42 (minima fra due semi 0.00), 28 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.46 | 12-12 | 6 | -27.2..-26.3 | 0.46 | 13 % | 22.2 | 0.01 | 17 % | 12/12 |
| 4, 5, 6 | pulito | 0.47 | 12-12 | 6 | -27.3..-26.4 | 0.46 | 17 % | 21.8 | 0.01 | 15 % | 12/12 |
| 7, 8, 9 | pulito | 0.41 | 12-12 | 6 | -27.4..-26.3 | 0.46 | 15 % | 22.0 | 0.00 | 17 % | 12/12 |
| 10, 11, 12 | pulito | 0.42 | 12-12 | 6 | -26.5..-26.3 | 0.46 | 5 % | 21.7 | 0.01 | 15 % | 12/12 |
| 13, 14, 15 | pulito | 0.47 | 12-12 | 6 | -26.4..-26.3 | 0.46 | 5 % | 21.9 | 0.01 | 15 % | 12/12 |
| 16, 17, 18 | pulito | 0.50 | 12-12 | 6 | -26.5..-26.3 | 0.50 | 5 % | 11.9 | 0.01 | 17 % | 12/12 |
| 19, 20, 21 | pulito | 0.36 | 12-12 | 6 | -27.3..-26.3 | 0.46 | 12 % | 13.1 | 0.01 | 17 % | 12/12 |
| 22, 23, 24 | pulito | 0.43 | 12-12 | 6 | -27.3..-26.3 | 0.46 | 15 % | 22.2 | 0.01 | 17 % | 12/12 |
| 25, 26, 27 | pulito | 0.46 | 12-12 | 6 | -27.2..-26.3 | 0.53 | 17 % | 21.9 | 0.01 | 17 % | 12/12 |
| 28, 29, 30 | pulito | 0.46 | 12-12 | 6 | -26.4..-26.3 | 0.52 | 5 % | 21.9 | 0.01 | 17 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-vapore-pressione (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.36 s a 132 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: E harmonic_minor (root 52); swing 0.00, cutoff 9000 Hz, space 0.40.
Tracce: y0 lead 0.55, y1 bass 0.60, y2 pad 0.40.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: . . B4~2 . C5~2 . D#5~2 . . G5! . .
  y1 bass: H H . H H . . H O . . .
  y2 pad: E3~11+G3~11 . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 12 | 75 % | 6 | E3..G5 (27 semitoni) | 100 % | 34 % | E hirajoshi (0.74) | 0.73 | 8 % | 12/12 |
| 2 | 12 | 67 % | 6 | E3..F#5 (26 semitoni) | 100 % | 29 % | E hirajoshi (0.80) | 0.76 | 17 % | 12/12 |
| 3 | 12 | 75 % | 6 | E3..E5 (24 semitoni) | 100 % | 49 % | E hirajoshi (0.79) | 0.77 | 8 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 4 | 0 | 4 | 4 | B4..G5 (8 semitoni) | 33 % | 1.8 | 12/12 |
| 1 | y1 bass | 0 | 6 | 6 | 0 | - | 50 % | 0.0 | 12/12 |
| 1 | y2 pad | 2 | 0 | 2 | 2 | E3..G3 (3 semitoni) | 8 % | 11.0 | 12/12 |
| 2 | y0 lead | 4 | 0 | 4 | 4 | B4..F#5 (7 semitoni) | 33 % | 2.5 | 12/12 |
| 2 | y1 bass | 0 | 6 | 6 | 0 | - | 50 % | 0.0 | 12/12 |
| 2 | y2 pad | 2 | 0 | 2 | 2 | E3..G3 (3 semitoni) | 8 % | 11.0 | 12/12 |
| 3 | y0 lead | 4 | 0 | 4 | 4 | B4..E5 (5 semitoni) | 33 % | 2.5 | 12/12 |
| 3 | y1 bass | 0 | 6 | 6 | 0 | - | 50 % | 0.0 | 12/12 |
| 3 | y2 pad | 2 | 0 | 2 | 2 | E3..G3 (3 semitoni) | 8 % | 11.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.46; y0 0.40, y1 0.58, y2 0.00.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.36 s | -6.7 | 0.46 | -27.2 | 20.5 | 0.00 % | 13 % | 0.08 s | 26.5 | 1159 | 0.00 |
| 2 | 1.36 s | -7.0 | 0.45 | -26.3 | 19.3 | 0.00 % | 5 % | 0.05 s | 22.2 | 1130 | 0.01 |
| 3 | 1.36 s | -6.7 | 0.46 | -26.4 | 19.7 | 0.00 % | 5 % | 0.05 s | 22.2 | 1044 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 14 % | 28 % | 49 % | 3 % | 4 % | 3 % |
| 2 | 0 % | 11 % | 31 % | 46 % | 5 % | 4 % | 2 % |
| 3 | 0 % | 11 % | 31 % | 48 % | 4 % | 3 % | 2 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×3×12, 28 nodi, 28 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, H=Hi-hat, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 23, H 6, N 5, A 1.
 #2 line 0 1 1 → 0 1 1 H: ×1, 1 celle x0 y1 z1, passi 1
  .→H 1: x0 y1 z1
 #3 line 5 1 1 → 5 1 1 H: ×1, 1 celle x5 y1 z1, passi 2
  .→H 1: x5 y1 z1
 #4 line 7 1 1 → 7 1 1 H: ×1, 1 celle x7 y1 z1, passi 3
  .→H 1: x7 y1 z1
 #5 line 1 1 1 → 6 1 1 P: ×1, 6 celle x1-6 y1 z1, passi 4
  .→P 5: x1-4 y1 z1; x6 y1 z1
  H→P 1: x5 y1 z1
 #6 one P → H passi=3: ×3, 3 celle x1-4 y1 z1, passi 5-7
  P→H 3: x3-4 y1 z1; x1 y1 z1
 #7 all P → .: ×1, 3 celle x2-6 y1 z1, passi 8
  P→. 3: x5-6 y1 z1; x2 y1 z1
 #8 line 8 1 4 → 8 1 4 T: ×1, 1 celle x8 y1 z4, passi 9
  .→T 1: x8 y1 z4
 #9 line 9 1 4 → 9 1 4 T: ×1, 1 celle x9 y1 z4, passi 10
  .→T 1: x9 y1 z4
 #10 line 10 1 4 → 10 1 4 T: ×1, 1 celle x10 y1 z4, passi 11
  .→T 1: x10 y1 z4
 #11 one T → H passi=1: ×1, 1 celle x8 y1 z4, passi 12
  T→H 1: x8 y1 z4
 #12 all T → .: ×1, 2 celle x9-10 y1 z4, passi 13
  T→. 2: x9-10 y1 z4
 #13 line 2 0 4 → 2 0 4 N: ×1, 1 celle x2 y0 z4, passi 14
  .→N 1: x2 y0 z4
 #14 line 4 0 5 → 4 0 5 N: ×1, 1 celle x4 y0 z5, passi 15
  .→N 1: x4 y0 z5
 #15 line 6 0 6 → 6 0 6 N: ×1, 1 celle x6 y0 z6, passi 16
  .→N 1: x6 y0 z6
 #16 line 8 0 7 → 8 0 7 U: ×1, 1 celle x8 y0 z7, passi 17
  .→U 1: x8 y0 z7
 #17 line 8 0 8 → 8 0 8 U: ×1, 1 celle x8 y0 z8, passi 18
  .→U 1: x8 y0 z8
 #18 line 9 0 9 → 9 0 9 U: ×1, 1 celle x9 y0 z9, passi 19
  .→U 1: x9 y0 z9
 #19 one U → A passi=1: ×1, 1 celle x9 y0 z9, passi 20
  U→A 1: x9 y0 z9
 #20 all U → .: ×1, 2 celle x8 y0 z7-8, passi 21
  U→. 2: x8 y0 z7-8
 #21 all N. → NS: ×1, 3 celle x3-7 y0 z4-6, passi 22
  .→S 3: x3 y0 z4; x5 y0 z5; x7 y0 z6
 #23 line 0 2 0 → 0 2 0 N: ×1, 1 celle x0 y2 z0, passi 23
  .→N 1: x0 y2 z0
 #24 line 0 2 4 → 0 2 4 V: ×1, 1 celle x0 y2 z4, passi 24
  .→V 1: x0 y2 z4
 #25 line 0 2 2 → 0 2 2 V: ×1, 1 celle x0 y2 z2, passi 25
  .→V 1: x0 y2 z2
 #26 one V → N passi=1: ×1, 1 celle x0 y2 z2, passi 26
  V→N 1: x0 y2 z2
 #27 all V → .: ×1, 1 celle x0 y2 z4, passi 27
  V→. 1: x0 y2 z4
 #28 all N.......... → NSSSSSSSSSS: ×1, 20 celle x1-10 y2 z0-2, passi 28
  .→S 20: x1-10 y2 z0; x1-10 y2 z2
Senza effetto (non hanno mai cambiato una cella):
#22 all A... → ASSS: le celle cercate c'erano, ma mai disposte come nel pattern
```
