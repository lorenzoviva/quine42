# suono-effetto-dialogo-saluto

> Qualcuno saluta: due sillabe cantate, su e giù, come una voce; il seme sceglie l'intervallo e se c'è una terza sillaba.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-dialogo-saluto.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-dialogo-saluto.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.63 (minima fra due semi 0.00), 20 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.61 | 6-6 | 4 | -25.6..-25.6 | 0.39 | 13 % | 21.4 | 0.00 | 15 % | 8/8 |
| 4, 5, 6 | pulito | 0.58 | 6-6 | 5 | -25.6..-25.5 | 0.40 | 13 % | 31.0 | 0.00 | 11 % | 8/8 |
| 7, 8, 9 | pulito | 0.43 | 6-6 | 5 | -25.5..-25.3 | 0.40 | 3 % | 21.9 | 0.00 | 4 % | 8/8 |
| 10, 11, 12 | pulito | 0.74 | 6-6 | 4 | -25.6..-25.4 | 0.41 | 10 % | 21.6 | 0.00 | 18 % | 8/8 |
| 13, 14, 15 | pulito | 0.58 | 6-6 | 4 | -25.4..-25.3 | 0.41 | 13 % | 30.9 | 0.00 | 11 % | 8/8 |
| 16, 17, 18 | pulito | 0.69 | 6-6 | 5 | -25.6..-25.4 | 0.41 | 10 % | 30.7 | 0.00 | 10 % | 8/8 |
| 19, 20, 21 | pulito | 0.80 | 6-6 | 4 | -25.5..-25.3 | 0.41 | 13 % | 21.9 | 0.00 | 11 % | 8/8 |
| 22, 23, 24 | pulito | 0.48 | 6-6 | 5 | -25.6..-25.4 | 0.41 | 13 % | 31.3 | 0.00 | 0 % | 8/8 |
| 25, 26, 27 | pulito | 0.71 | 6-6 | 4 | -25.5..-25.4 | 0.41 | 13 % | 21.6 | 0.00 | 18 % | 8/8 |
| 28, 29, 30 | pulito | 0.61 | 6-6 | 5 | -25.5..-25.4 | 0.41 | 13 % | 21.9 | 0.00 | 13 % | 8/8 |

## Rapporto completo: Suono: suono-effetto-dialogo-saluto (semi 1, 2, 3)

8 passi, 1 battuta, ciclo di 0.86 s a 140 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A dorian (root 57); swing 0.10, cutoff 5000 Hz, space 0.35.
Tracce: y0 lead 0.60, y1 pad 0.45.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: F#5~2 . D5~3 . . . f#5 F#5
  y1 pad: A3~7+C4~7 . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 50 % | 4 | A3..F#5 (21 semitoni) | 100 % | 31 % | A dorian (0.64) | 0.64 | 15 % | 8/8 |
| 2 | 6 | 50 % | 5 | A3..F#5 (21 semitoni) | 100 % | 31 % | A dorian (0.78) | 0.78 | 0 % | 8/8 |
| 3 | 6 | 50 % | 5 | A3..F#5 (21 semitoni) | 100 % | 31 % | A dorian (0.62) | 0.62 | 11 % | 8/8 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 4 | 0 | 4 | 2 | D5..F#5 (4 semitoni) | 50 % | 1.8 | 8/8 |
| 1 | y1 pad | 2 | 0 | 2 | 2 | A3..C4 (3 semitoni) | 13 % | 7.0 | 8/8 |
| 2 | y0 lead | 4 | 0 | 4 | 3 | D5..F#5 (4 semitoni) | 50 % | 1.8 | 8/8 |
| 2 | y1 pad | 2 | 0 | 2 | 2 | A3..E4 (7 semitoni) | 13 % | 7.0 | 8/8 |
| 3 | y0 lead | 4 | 0 | 4 | 3 | C5..F#5 (6 semitoni) | 50 % | 1.8 | 8/8 |
| 3 | y1 pad | 2 | 0 | 2 | 2 | A3..C4 (3 semitoni) | 13 % | 7.0 | 8/8 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.61; y0 0.67, y1 0.44.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.86 s | -8.4 | 0.38 | -25.6 | 17.1 | 0.00 % | 3 % | 0.02 s | 21.4 | 797 | 0.00 |
| 2 | 0.86 s | -8.2 | 0.39 | -25.6 | 17.4 | 0.00 % | 10 % | 0.08 s | 30.7 | 779 | 0.00 |
| 3 | 0.86 s | -8.4 | 0.38 | -25.6 | 17.1 | 0.00 % | 13 % | 0.09 s | 32.4 | 716 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 5 % | 23 % | 63 % | 8 % | 0 % | 0 % |
| 2 | 0 % | 5 % | 23 % | 67 % | 5 % | 0 % | 0 % |
| 3 | 0 % | 7 % | 23 % | 66 % | 4 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 8×2×10, 24 nodi, 23 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, G=Ghost, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 16, N 4, G 1.
 #2 line 0 0 4 → 0 0 4 T: ×1, 1 celle x0 y0 z4, passi 1
  .→T 1: x0 y0 z4
 #3 line 0 0 5 → 0 0 5 T: ×1, 1 celle x0 y0 z5, passi 2
  .→T 1: x0 y0 z5
 #4 one T → N passi=1: ×1, 1 celle x0 y0 z5, passi 3
  T→N 1: x0 y0 z5
 #5 all T → .: ×1, 1 celle x0 y0 z4, passi 4
  T→. 1: x0 y0 z4
 #6 all N. → NS: ×1, 1 celle x1 y0 z5, passi 5
  .→S 1: x1 y0 z5
 #7 line 2 0 6 → 2 0 6 U: ×1, 1 celle x2 y0 z6, passi 6
  .→U 1: x2 y0 z6
 #8 line 2 0 7 → 2 0 7 U: ×1, 1 celle x2 y0 z7, passi 7
  .→U 1: x2 y0 z7
 #9 line 2 0 3 → 2 0 3 U: ×1, 1 celle x2 y0 z3, passi 8
  .→U 1: x2 y0 z3
 #10 one U → N passi=1: ×1, 1 celle x2 y0 z3, passi 9
  U→N 1: x2 y0 z3
 #11 all U → .: ×1, 2 celle x2 y0 z6-7, passi 10
  U→. 2: x2 y0 z6-7
 #12 all N.. → NSS: ×1, 2 celle x3-4 y0 z3, passi 11
  .→S 2: x3-4 y0 z3
 #13 line 5 0 4 → 5 0 4 V: ×1, 1 celle x5 y0 z4, passi 12
  .→V 1: x5 y0 z4
 #14 line 5 0 2 → 5 0 2 V: ×1, 1 celle x5 y0 z2, passi 13
  .→V 1: x5 y0 z2
 #15 line 6 0 5 → 6 0 5 V: ×1, 1 celle x6 y0 z5, passi 14
  .→V 1: x6 y0 z5
 #16 one V → G passi=1: ×1, 1 celle x6 y0 z5, passi 15
  V→G 1: x6 y0 z5
 #17 all V → .: ×1, 2 celle x5 y0 z2-4, passi 16
  V→. 2: x5 y0 z2; x5 y0 z4
 #18 all G. → GS: ×1, 1 celle x7 y0 z5, passi 17
  .→S 1: x7 y0 z5
 #19 line 0 1 0 → 0 1 0 N: ×1, 1 celle x0 y1 z0, passi 18
  .→N 1: x0 y1 z0
 #20 line 0 1 2 → 0 1 2 P: ×1, 1 celle x0 y1 z2, passi 19
  .→P 1: x0 y1 z2
 #21 line 0 1 4 → 0 1 4 P: ×1, 1 celle x0 y1 z4, passi 20
  .→P 1: x0 y1 z4
 #22 one P → N passi=1: ×1, 1 celle x0 y1 z2, passi 21
  P→N 1: x0 y1 z2
 #23 all P → .: ×1, 1 celle x0 y1 z4, passi 22
  P→. 1: x0 y1 z4
 #24 all N...... → NSSSSSS: ×1, 12 celle x1-6 y1 z0-2, passi 23
  .→S 12: x1-6 y1 z0; x1-6 y1 z2
```
