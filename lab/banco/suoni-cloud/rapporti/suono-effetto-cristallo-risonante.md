# suono-effetto-cristallo-risonante

> Un cristallo che risuona: tre rintocchi acuti su una scala antica, ognuno lungo, e un alone di pad sotto. Il seme sceglie le note.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-cristallo-risonante.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-cristallo-risonante.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.64 (minima fra due semi 0.00), 24 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.55 | 5-5 | 5 | -26.3..-26.2 | 0.40 | 0 % | 15.2 | 0.01 | 11 % | 12/12 |
| 4, 5, 6 | pulito | 0.66 | 5-5 | 5 | -26.2..-26.2 | 0.40 | 2 % | 12.0 | 0.01 | 15 % | 12/12 |
| 7, 8, 9 | pulito | 0.55 | 5-5 | 5 | -26.3..-26.2 | 0.39 | 0 % | 14.4 | 0.01 | 16 % | 12/12 |
| 10, 11, 12 | pulito | 0.74 | 5-5 | 5 | -26.4..-26.1 | 0.39 | 0 % | 15.8 | 0.01 | 11 % | 12/12 |
| 13, 14, 15 | pulito | 0.41 | 5-5 | 5 | -26.3..-26.1 | 0.39 | 2 % | 15.1 | 0.00 | 0 % | 12/12 |
| 16, 17, 18 | pulito | 0.75 | 5-5 | 5 | -26.3..-26.1 | 0.42 | 0 % | 15.8 | 0.01 | 16 % | 12/12 |
| 19, 20, 21 | pulito | 0.74 | 5-5 | 5 | -26.3..-26.2 | 0.41 | 0 % | 12.5 | 0.01 | 16 % | 12/12 |
| 22, 23, 24 | pulito | 0.69 | 5-5 | 5 | -26.2..-26.1 | 0.41 | 0 % | 16.1 | 0.01 | 0 % | 12/12 |
| 25, 26, 27 | pulito | 0.57 | 5-5 | 5 | -26.2..-26.2 | 0.39 | 1 % | 15.0 | 0.00 | 11 % | 12/12 |
| 28, 29, 30 | pulito | 0.69 | 5-5 | 5 | -26.5..-26.1 | 0.39 | 2 % | 15.3 | 0.01 | 11 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-cristallo-risonante (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.80 s a 100 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A hirajoshi (root 57); swing 0.00, cutoff 12000 Hz, space 0.75.
Tracce: y0 lead 0.45, y1 pad 0.55.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: E6!~4 . . . A6~4 . . B5~4 . . . .
  y1 pad: A4~11+E5~11 . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5 | 25 % | 5 | A4..A6 (24 semitoni) | 100 % | 43 % | A hirajoshi (0.83) | 0.83 | 0 % | 12/12 |
| 2 | 5 | 25 % | 5 | A4..A6 (24 semitoni) | 100 % | 43 % | A hirajoshi (0.77) | 0.77 | 11 % | 12/12 |
| 3 | 5 | 25 % | 5 | A4..A6 (24 semitoni) | 100 % | 43 % | A hirajoshi (0.77) | 0.77 | 11 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 3 | 0 | 3 | 3 | B5..A6 (10 semitoni) | 25 % | 4.0 | 12/12 |
| 1 | y1 pad | 2 | 0 | 2 | 2 | A4..E5 (7 semitoni) | 8 % | 11.0 | 12/12 |
| 2 | y0 lead | 3 | 0 | 3 | 3 | B5..A6 (10 semitoni) | 25 % | 4.0 | 12/12 |
| 2 | y1 pad | 2 | 0 | 2 | 2 | A4..C5 (3 semitoni) | 8 % | 11.0 | 12/12 |
| 3 | y0 lead | 3 | 0 | 3 | 3 | B5..A6 (10 semitoni) | 25 % | 4.0 | 12/12 |
| 3 | y1 pad | 2 | 0 | 2 | 2 | A4..C5 (3 semitoni) | 8 % | 11.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.55; y0 0.60, y1 0.44.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.80 s | -8.3 | 0.38 | -26.2 | 17.9 | 0.00 % | 0 % | 0.00 s | 19.3 | 1473 | 0.00 |
| 2 | 1.80 s | -7.9 | 0.40 | -26.2 | 18.3 | 0.00 % | 0 % | 0.00 s | 15.2 | 1497 | 0.00 |
| 3 | 1.80 s | -8.2 | 0.39 | -26.3 | 18.0 | 0.00 % | 0 % | 0.00 s | 19.5 | 1500 | 0.01 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 0 % | 11 % | 78 % | 6 % | 5 % | 1 % |
| 2 | 0 % | 0 % | 10 % | 78 % | 6 % | 5 % | 1 % |
| 3 | 0 % | 0 % | 11 % | 77 % | 6 % | 5 % | 1 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×2×14, 24 nodi, 23 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 29, N 4, A 1.
 #2 line 0 0 7 → 0 0 7 T: ×1, 1 celle x0 y0 z7, passi 1
  .→T 1: x0 y0 z7
 #3 line 0 0 9 → 0 0 9 T: ×1, 1 celle x0 y0 z9, passi 2
  .→T 1: x0 y0 z9
 #4 line 0 0 8 → 0 0 8 T: ×1, 1 celle x0 y0 z8, passi 3
  .→T 1: x0 y0 z8
 #5 one T → A passi=1: ×1, 1 celle x0 y0 z8, passi 4
  T→A 1: x0 y0 z8
 #6 all T → .: ×1, 2 celle x0 y0 z7-9, passi 5
  T→. 2: x0 y0 z7; x0 y0 z9
 #7 line 3 0 10 → 3 0 10 U: ×1, 1 celle x3 y0 z10, passi 6
  .→U 1: x3 y0 z10
 #8 line 3 0 11 → 3 0 11 U: ×1, 1 celle x3 y0 z11, passi 7
  .→U 1: x3 y0 z11
 #9 line 4 0 10 → 4 0 10 U: ×1, 1 celle x4 y0 z10, passi 8
  .→U 1: x4 y0 z10
 #10 one U → N passi=1: ×1, 1 celle x4 y0 z10, passi 9
  U→N 1: x4 y0 z10
 #11 all U → .: ×1, 2 celle x3 y0 z10-11, passi 10
  U→. 2: x3 y0 z10-11
 #12 line 7 0 12 → 7 0 12 V: ×1, 1 celle x7 y0 z12, passi 11
  .→V 1: x7 y0 z12
 #13 line 7 0 13 → 7 0 13 V: ×1, 1 celle x7 y0 z13, passi 12
  .→V 1: x7 y0 z13
 #14 line 8 0 12 → 8 0 12 V: ×1, 1 celle x8 y0 z12, passi 13
  .→V 1: x8 y0 z12
 #15 one V → N passi=1: ×1, 1 celle x7 y0 z13, passi 14
  V→N 1: x7 y0 z13
 #16 all V → .: ×1, 2 celle x7-8 y0 z12, passi 15
  V→. 2: x7-8 y0 z12
 #17 all A... → ASSS: ×1, 3 celle x1-3 y0 z8, passi 16
  .→S 3: x1-3 y0 z8
 #18 all N... → NSSS: ×1, 6 celle x5-10 y0 z10-13, passi 17
  .→S 6: x5-7 y0 z10; x8-10 y0 z13
 #19 line 0 1 5 → 0 1 5 N: ×1, 1 celle x0 y1 z5, passi 18
  .→N 1: x0 y1 z5
 #20 line 0 1 7 → 0 1 7 P: ×1, 1 celle x0 y1 z7, passi 19
  .→P 1: x0 y1 z7
 #21 line 0 1 8 → 0 1 8 P: ×1, 1 celle x0 y1 z8, passi 20
  .→P 1: x0 y1 z8
 #22 one P → N passi=1: ×1, 1 celle x0 y1 z8, passi 21
  P→N 1: x0 y1 z8
 #23 all P → .: ×1, 1 celle x0 y1 z7, passi 22
  P→. 1: x0 y1 z7
 #24 all N.......... → NSSSSSSSSSS: ×1, 20 celle x1-10 y1 z5-8, passi 23
  .→S 20: x1-10 y1 z5; x1-10 y1 z8
```
