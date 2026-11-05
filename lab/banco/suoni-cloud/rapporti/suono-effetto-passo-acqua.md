# suono-effetto-passo-acqua

> Un passo nell'acqua: lo sciacquio del piede, due gocce che ricadono su altezze che il seme sceglie.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-passo-acqua.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-passo-acqua.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.74 (minima fra due semi 0.00), 29 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.73 | 7-7 | 3 | -28.6..-28.5 | 0.51 | 36 % | 12.8 | 0.00 | 0 % | 8/8 |
| 4, 5, 6 | pulito | 0.59 | 7-7 | 2 | -28.8..-28.1 | 0.39 | 23 % | 12.1 | 0.00 | 0 % | 8/8 |
| 7, 8, 9 | pulito | 0.70 | 7-7 | 3 | -28.8..-28.5 | 0.41 | 24 % | 12.9 | 0.00 | 0 % | 8/8 |
| 10, 11, 12 | pulito | 0.77 | 6-7 | 2 | -30.0..-28.6 | 0.40 | 26 % | 12.7 | 0.00 | 0 % | 8/8 |
| 13, 14, 15 | pulito | 0.85 | 6-7 | 2 | -30.4..-28.6 | 0.41 | 29 % | 12.8 | 0.00 | 0 % | 8/8 |
| 16, 17, 18 | pulito | 0.60 | 7-7 | 3 | -28.8..-28.6 | 0.37 | 26 % | 19.5 | 0.00 | 0 % | 8/8 |
| 19, 20, 21 | pulito | 0.81 | 6-7 | 2 | -30.5..-28.5 | 0.50 | 29 % | 12.0 | 0.00 | 0 % | 8/8 |
| 22, 23, 24 | pulito | 0.72 | 7-7 | 2 | -28.8..-27.7 | 0.45 | 25 % | 13.8 | 0.00 | 0 % | 8/8 |
| 25, 26, 27 | pulito | 0.67 | 7-7 | 2 | -28.8..-28.2 | 0.40 | 25 % | 13.4 | 0.00 | 0 % | 8/8 |
| 28, 29, 30 | pulito | 0.86 | 7-7 | 2 | -28.5..-27.3 | 0.40 | 20 % | 12.4 | 0.00 | 0 % | 8/8 |

## Rapporto completo: Suono: suono-effetto-passo-acqua (semi 1, 2, 3)

8 passi, 1 battuta, ciclo di 0.80 s a 150 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: D pentatonic_minor (root 62); swing 0.00, cutoff 7000 Hz, space 0.55.
Tracce: y0 lead 0.50, y1 bass 0.70.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: a5 . . . g6+a6 G6+A6 . .
  y1 bass: O . H . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | 50 % | 3 | A5..A6 (12 semitoni) | 100 % | 0 % | A pentatonic_minor (0.60) | 0.46 | 0 % | 8/8 |
| 2 | 7 | 63 % | 3 | C6..G6 (7 semitoni) | 100 % | 43 % | G pentatonic_minor (0.84) | 0.58 | 0 % | 8/8 |
| 3 | 7 | 50 % | 3 | A5..G6 (10 semitoni) | 100 % | 43 % | G hirajoshi (0.84) | 0.67 | 0 % | 8/8 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 5 | 0 | 5 | 3 | A5..A6 (12 semitoni) | 38 % | 1.0 | 8/8 |
| 1 | y1 bass | 0 | 2 | 2 | 0 | - | 25 % | 0.0 | 8/8 |
| 2 | y0 lead | 5 | 0 | 5 | 3 | C6..G6 (7 semitoni) | 50 % | 1.0 | 8/8 |
| 2 | y1 bass | 0 | 2 | 2 | 0 | - | 25 % | 0.0 | 8/8 |
| 3 | y0 lead | 5 | 0 | 5 | 3 | A5..G6 (10 semitoni) | 50 % | 1.0 | 8/8 |
| 3 | y1 bass | 0 | 2 | 2 | 0 | - | 25 % | 0.0 | 8/8 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.73; y0 0.80, y1 0.44.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.80 s | -5.8 | 0.51 | -28.5 | 22.6 | 0.00 % | 36 % | 0.10 s | 34.5 | 2155 | 0.00 |
| 2 | 0.80 s | -8.1 | 0.40 | -28.6 | 20.5 | 0.00 % | 20 % | 0.04 s | 12.8 | 2089 | 0.00 |
| 3 | 0.80 s | -7.9 | 0.40 | -28.6 | 20.7 | 0.00 % | 20 % | 0.04 s | 15.7 | 2003 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 0 % | 1 % | 81 % | 1 % | 17 % | 1 % |
| 2 | 0 % | 0 % | 0 % | 78 % | 6 % | 13 % | 2 % |
| 3 | 0 % | 0 % | 1 % | 79 % | 6 % | 12 % | 2 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 8×2×10, 17 nodi, 17 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: S=Sustain, G=Ghost, H=Hi-hat, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: G 3, H 2, S 2.
 #2 line 0 1 4 → 0 1 4 H: ×1, 1 celle x0 y1 z4, passi 1
  .→H 1: x0 y1 z4
 #3 line 1 1 1 → 1 1 1 T: ×1, 1 celle x1 y1 z1, passi 2
  .→T 1: x1 y1 z1
 #4 line 2 1 1 → 2 1 1 T: ×1, 1 celle x2 y1 z1, passi 3
  .→T 1: x2 y1 z1
 #5 line 2 1 4 → 2 1 4 T: ×1, 1 celle x2 y1 z4, passi 4
  .→T 1: x2 y1 z4
 #6 one T → H passi=1: ×1, 1 celle x2 y1 z1, passi 5
  T→H 1: x2 y1 z1
 #7 all T → .: ×1, 2 celle x1-2 y1 z1-4, passi 6
  T→. 2: x1 y1 z1; x2 y1 z4
 #8 line 1 0 5 → 6 0 5 U: ×1, 6 celle x1-6 y0 z5, passi 7
  .→U 6: x1-6 y0 z5
 #9 line 2 0 7 → 6 0 7 U: ×1, 5 celle x2-6 y0 z7, passi 8
  .→U 5: x2-6 y0 z7
 #10 line 1 0 8 → 5 0 8 U: ×1, 5 celle x1-5 y0 z8, passi 9
  .→U 5: x1-5 y0 z8
 #11 one U → G passi=2: ×2, 2 celle x4 y0 z7-8, passi 10-11
  U→G 2: x4 y0 z7-8
 #12 all U → .: ×1, 14 celle x1-6 y0 z5-8, passi 12
  U→. 14: x1-6 y0 z5; x2-3 y0 z7-8; x5-6 y0 z7; x1 y0 z8; +1 scatole, 1 celle
 #13 all G. → GS: ×1, 2 celle x5 y0 z7-8, passi 13
  .→S 2: x5 y0 z7-8
 #14 line 0 0 3 → 0 0 3 V: ×1, 1 celle x0 y0 z3, passi 14
  .→V 1: x0 y0 z3
 #15 line 0 0 4 → 0 0 4 V: ×1, 1 celle x0 y0 z4, passi 15
  .→V 1: x0 y0 z4
 #16 one V → G passi=1: ×1, 1 celle x0 y0 z3, passi 16
  V→G 1: x0 y0 z3
 #17 all V → .: ×1, 1 celle x0 y0 z4, passi 17
  V→. 1: x0 y0 z4
```
