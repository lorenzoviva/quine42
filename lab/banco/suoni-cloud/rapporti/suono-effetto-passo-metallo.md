# suono-effetto-passo-metallo

> Un passo su una grata di metallo: il colpo secco, la lamiera che vibra su un'altezza aspra e si spegne.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-passo-metallo.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-passo-metallo.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.58 (minima fra due semi 0.00), 22 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.57 | 5-5 | 2 | -29.4..-29.2 | 0.59 | 54 % | 35.8 | 0.00 | 0 % | 8/8 |
| 4, 5, 6 | pulito | 0.61 | 5-5 | 2 | -29.4..-29.2 | 0.60 | 64 % | 35.4 | 0.00 | 0 % | 8/8 |
| 7, 8, 9 | pulito | 0.41 | 5-5 | 2 | -29.7..-29.3 | 0.57 | 59 % | 34.1 | 0.00 | 0 % | 8/8 |
| 10, 11, 12 | pulito | 0.63 | 5-5 | 2 | -29.6..-29.1 | 0.52 | 57 % | 44.2 | 0.00 | 0 % | 8/8 |
| 13, 14, 15 | pulito | 0.55 | 5-5 | 2 | -29.4..-29.4 | 0.59 | 63 % | 33.5 | 0.00 | 0 % | 8/8 |
| 16, 17, 18 | pulito | 0.63 | 5-5 | 2 | -29.5..-29.2 | 0.60 | 54 % | 40.8 | 0.00 | 0 % | 8/8 |
| 19, 20, 21 | pulito | 0.63 | 5-5 | 2 | -29.5..-29.3 | 0.57 | 54 % | 43.9 | 0.00 | 0 % | 8/8 |
| 22, 23, 24 | pulito | 0.63 | 5-5 | 2 | -29.6..-29.3 | 0.57 | 57 % | 33.1 | 0.00 | 0 % | 8/8 |
| 25, 26, 27 | pulito | 0.41 | 5-5 | 2 | -29.5..-29.4 | 0.60 | 45 % | 39.8 | 0.00 | 0 % | 8/8 |
| 28, 29, 30 | pulito | 0.75 | 5-5 | 2 | -29.5..-29.1 | 0.57 | 50 % | 39.7 | 0.00 | 0 % | 8/8 |

## Rapporto completo: Suono: suono-effetto-passo-metallo (semi 1, 2, 3)

8 passi, 1 battuta, ciclo di 0.80 s a 150 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: G harmonic_minor (root 55); swing 0.00, cutoff 8000 Hz, space 0.40.
Tracce: y0 lead 0.55, y1 bass 0.70.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: G5!~2 . . . . d#5 . .
  y1 bass: H+C . . H . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5 | 38 % | 2 | D#5..G5 (4 semitoni) | 100 % | 84 % | G hirajoshi (0.65) | 0.62 | 0 % | 8/8 |
| 2 | 5 | 38 % | 2 | D#5..F#5 (3 semitoni) | 100 % | 0 % | F# dorian (0.62) | 0.07 | 0 % | 8/8 |
| 3 | 5 | 25 % | 2 | D#5..G5 (4 semitoni) | 100 % | 84 % | G hirajoshi (0.65) | 0.62 | 0 % | 8/8 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 2 | 0 | 2 | 2 | D#5..G5 (4 semitoni) | 25 % | 1.5 | 8/8 |
| 1 | y1 bass | 0 | 3 | 3 | 0 | - | 25 % | 0.0 | 8/8 |
| 2 | y0 lead | 2 | 0 | 2 | 2 | D#5..F#5 (3 semitoni) | 25 % | 1.5 | 8/8 |
| 2 | y1 bass | 0 | 3 | 3 | 0 | - | 25 % | 0.0 | 8/8 |
| 3 | y0 lead | 2 | 0 | 2 | 2 | D#5..G5 (4 semitoni) | 25 % | 1.5 | 8/8 |
| 3 | y1 bass | 0 | 3 | 3 | 0 | - | 25 % | 0.0 | 8/8 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.57; y0 0.78, y1 0.33.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.80 s | -5.7 | 0.54 | -29.4 | 23.7 | 0.00 % | 54 % | 0.16 s | 54.1 | 1731 | 0.00 |
| 2 | 0.80 s | -6.4 | 0.50 | -29.3 | 22.8 | 0.00 % | 36 % | 0.16 s | 44.3 | 2657 | 0.00 |
| 3 | 0.80 s | -4.6 | 0.59 | -29.2 | 24.6 | 0.00 % | 43 % | 0.10 s | 35.8 | 2489 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 2 % | 29 % | 46 % | 12 % | 8 % | 4 % |
| 2 | 0 % | 1 % | 25 % | 37 % | 11 % | 17 % | 8 % |
| 3 | 0 % | 1 % | 25 % | 40 % | 11 % | 16 % | 8 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 8×2×10, 18 nodi, 17 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: S=Sustain, A=Accento, G=Ghost, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: H 2, C 1, G 1, A 1, S 1.
 #2 line 0 1 2 → 0 1 2 C: ×1, 1 celle x0 y1 z2, passi 1
  .→C 1: x0 y1 z2
 #3 line 0 1 1 → 0 1 1 H: ×1, 1 celle x0 y1 z1, passi 2
  .→H 1: x0 y1 z1
 #4 line 2 1 1 → 2 1 1 T: ×1, 1 celle x2 y1 z1, passi 3
  .→T 1: x2 y1 z1
 #5 line 3 1 1 → 3 1 1 T: ×1, 1 celle x3 y1 z1, passi 4
  .→T 1: x3 y1 z1
 #6 line 4 1 4 → 4 1 4 T: ×1, 1 celle x4 y1 z4, passi 5
  .→T 1: x4 y1 z4
 #7 one T → H passi=1: ×1, 1 celle x3 y1 z1, passi 6
  T→H 1: x3 y1 z1
 #8 all T → .: ×1, 2 celle x2-4 y1 z1-4, passi 7
  T→. 2: x2 y1 z1; x4 y1 z4
 #9 line 0 0 7 → 0 0 7 U: ×1, 1 celle x0 y0 z7, passi 8
  .→U 1: x0 y0 z7
 #10 line 0 0 8 → 0 0 8 U: ×1, 1 celle x0 y0 z8, passi 9
  .→U 1: x0 y0 z8
 #11 line 0 0 6 → 0 0 6 U: ×1, 1 celle x0 y0 z6, passi 10
  .→U 1: x0 y0 z6
 #12 one U → A passi=1: ×1, 1 celle x0 y0 z7, passi 11
  U→A 1: x0 y0 z7
 #13 all U → .: ×1, 2 celle x0 y0 z6-8, passi 12
  U→. 2: x0 y0 z6; x0 y0 z8
 #14 all A. → AS: ×1, 1 celle x1 y0 z7, passi 13
  .→S 1: x1 y0 z7
 #15 line 3 0 4 → 5 0 4 V: ×1, 3 celle x3-5 y0 z4, passi 14
  .→V 3: x3-5 y0 z4
 #16 line 3 0 5 → 5 0 5 V: ×1, 3 celle x3-5 y0 z5, passi 15
  .→V 3: x3-5 y0 z5
 #17 one V → G passi=1: ×1, 1 celle x5 y0 z5, passi 16
  V→G 1: x5 y0 z5
 #18 all V → .: ×1, 5 celle x3-5 y0 z4-5, passi 17
  V→. 5: x3-5 y0 z4; x3-4 y0 z5
```
