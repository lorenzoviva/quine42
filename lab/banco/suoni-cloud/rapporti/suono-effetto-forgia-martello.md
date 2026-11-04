# suono-effetto-forgia-martello

> Il martello sull'incudine: due colpi, il primo pieno, il secondo più leggero; il ferro canta acuto e il seme sceglie la sua nota.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-forgia-martello.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-forgia-martello.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.40 (minima fra due semi 0.00), 15 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.25 | 7-7 | 4 | -24.5..-24.4 | 0.91 | 19 % | 27.0 | 0.00 | 0 % | 12/12 |
| 4, 5, 6 | pulito | 0.30 | 7-7 | 4 | -24.5..-24.4 | 0.92 | 19 % | 29.2 | 0.00 | 0 % | 12/12 |
| 7, 8, 9 | pulito | 0.25 | 7-7 | 4 | -24.4..-24.4 | 0.95 | 8 % | 25.3 | 0.00 | 0 % | 12/12 |
| 10, 11, 12 | pulito | 0.50 | 7-7 | 4 | -24.5..-24.4 | 0.94 | 19 % | 25.3 | 0.00 | 0 % | 12/12 |
| 13, 14, 15 | pulito | 0.30 | 7-7 | 4 | -24.8..-24.3 | 1.04 | 21 % | 29.9 | 0.00 | 0 % | 12/12 |
| 16, 17, 18 | pulito | 0.43 | 7-7 | 4 | -24.5..-24.4 | 0.91 | 19 % | 29.1 | 0.00 | 0 % | 12/12 |
| 19, 20, 21 | pulito | 0.50 | 7-7 | 4 | -24.4..-24.3 | 0.93 | 19 % | 25.3 | 0.00 | 0 % | 12/12 |
| 22, 23, 24 | pulito | 0.31 | 7-7 | 4 | -24.5..-24.4 | 0.93 | 19 % | 29.7 | 0.00 | 0 % | 12/12 |
| 25, 26, 27 | pulito | 0.43 | 7-7 | 4 | -24.5..-24.4 | 0.93 | 19 % | 27.1 | 0.00 | 0 % | 12/12 |
| 28, 29, 30 | pulito | 0.44 | 7-7 | 4 | -24.4..-24.4 | 0.96 | 19 % | 25.5 | 0.00 | 0 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-forgia-martello (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.50 s a 120 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A dorian (root 57); swing 0.00, cutoff 9000 Hz, space 0.40.
Tracce: y0 lead 0.55, y1 bass 0.70, y2 pad 0.30.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: A5!~5 . . . . . . G5~4 . . . .
  y1 bass: K+C . . . . . . C . . . .
  y2 pad: A3~10+E4~10 . . . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | 17 % | 4 | A3..A5 (24 semitoni) | 100 % | 57 % | A pentatonic_minor (0.82) | 0.77 | 0 % | 12/12 |
| 2 | 7 | 25 % | 4 | A3..A5 (24 semitoni) | 100 % | 57 % | A dorian (0.77) | 0.77 | 0 % | 12/12 |
| 3 | 7 | 25 % | 4 | A3..A5 (24 semitoni) | 100 % | 57 % | A pentatonic_minor (0.82) | 0.78 | 0 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 2 | 0 | 2 | 2 | G5..A5 (2 semitoni) | 17 % | 4.5 | 12/12 |
| 1 | y1 bass | 0 | 3 | 3 | 0 | - | 17 % | 0.0 | 12/12 |
| 1 | y2 pad | 2 | 0 | 2 | 2 | A3..E4 (7 semitoni) | 8 % | 10.0 | 12/12 |
| 2 | y0 lead | 2 | 0 | 2 | 2 | F#5..A5 (3 semitoni) | 17 % | 4.5 | 12/12 |
| 2 | y1 bass | 0 | 3 | 3 | 0 | - | 17 % | 0.0 | 12/12 |
| 2 | y2 pad | 2 | 0 | 2 | 2 | A3..E4 (7 semitoni) | 8 % | 10.0 | 12/12 |
| 3 | y0 lead | 2 | 0 | 2 | 2 | E5..A5 (5 semitoni) | 17 % | 4.5 | 12/12 |
| 3 | y1 bass | 0 | 3 | 3 | 0 | - | 17 % | 0.0 | 12/12 |
| 3 | y2 pad | 2 | 0 | 2 | 2 | A3..E4 (7 semitoni) | 8 % | 10.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.25; y0 0.67, y1 0.00, y2 0.00.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.50 s | -0.9 | 0.91 | -24.4 | 23.6 | 0.00 % | 9 % | 0.06 s | 27.0 | 1270 | 0.00 |
| 2 | 1.50 s | -1.4 | 0.85 | -24.5 | 23.1 | 0.00 % | 19 % | 0.18 s | 29.2 | 1241 | 0.00 |
| 3 | 1.50 s | -1.8 | 0.82 | -24.5 | 22.7 | 0.00 % | 19 % | 0.18 s | 29.7 | 1190 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 2 % | 27 % | 20 % | 34 % | 9 % | 6 % | 2 % |
| 2 | 2 % | 27 % | 20 % | 33 % | 9 % | 6 % | 2 % |
| 3 | 2 % | 27 % | 20 % | 38 % | 5 % | 6 % | 2 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×3×10, 22 nodi, 21 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: S 25, N 3, C 2, K 1, A 1.
 #2 line 0 1 0 → 0 1 0 K: ×1, 1 celle x0 y1 z0, passi 1
  .→K 1: x0 y1 z0
 #3 line 0 1 2 → 0 1 2 C: ×1, 1 celle x0 y1 z2, passi 2
  .→C 1: x0 y1 z2
 #4 line 6 1 2 → 6 1 2 T: ×1, 1 celle x6 y1 z2, passi 3
  .→T 1: x6 y1 z2
 #5 line 7 1 2 → 7 1 2 T: ×1, 1 celle x7 y1 z2, passi 4
  .→T 1: x7 y1 z2
 #6 one T → C passi=1: ×1, 1 celle x7 y1 z2, passi 5
  T→C 1: x7 y1 z2
 #7 all T → .: ×1, 1 celle x6 y1 z2, passi 6
  T→. 1: x6 y1 z2
 #8 line 0 0 7 → 0 0 7 U: ×1, 1 celle x0 y0 z7, passi 7
  .→U 1: x0 y0 z7
 #9 line 0 0 9 → 0 0 9 U: ×1, 1 celle x0 y0 z9, passi 8
  .→U 1: x0 y0 z9
 #10 line 0 0 8 → 0 0 8 U: ×1, 1 celle x0 y0 z8, passi 9
  .→U 1: x0 y0 z8
 #11 one U → A passi=1: ×1, 1 celle x0 y0 z7, passi 10
  U→A 1: x0 y0 z7
 #12 all U → .: ×1, 2 celle x0 y0 z8-9, passi 11
  U→. 2: x0 y0 z8-9
 #13 all A.... → ASSSS: ×1, 4 celle x1-4 y0 z7, passi 12
  .→S 4: x1-4 y0 z7
 #14 line 6 0 5 → 6 0 5 V: ×1, 1 celle x6 y0 z5, passi 13
  .→V 1: x6 y0 z5
 #15 line 7 0 6 → 7 0 6 V: ×1, 1 celle x7 y0 z6, passi 14
  .→V 1: x7 y0 z6
 #16 line 6 0 4 → 6 0 4 V: ×1, 1 celle x6 y0 z4, passi 15
  .→V 1: x6 y0 z4
 #17 one V → N passi=1: ×1, 1 celle x7 y0 z6, passi 16
  V→N 1: x7 y0 z6
 #18 all V → .: ×1, 2 celle x6 y0 z4-5, passi 17
  V→. 2: x6 y0 z4-5
 #19 all N... → NSSS: ×1, 3 celle x8-10 y0 z6, passi 18
  .→S 3: x8-10 y0 z6
 #20 line 0 2 0 → 0 2 0 N: ×1, 1 celle x0 y2 z0, passi 19
  .→N 1: x0 y2 z0
 #21 line 0 2 4 → 0 2 4 N: ×1, 1 celle x0 y2 z4, passi 20
  .→N 1: x0 y2 z4
 #22 all N......... → NSSSSSSSSS: ×1, 18 celle x1-9 y2 z0-4, passi 21
  .→S 18: x1-9 y2 z0; x1-9 y2 z4
```
