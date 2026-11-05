# suono-effetto-porta-pesante

> Una porta pesante si apre: i cardini cigolano su un semitono grave, il legno geme, il battente sbatte contro il muro.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-porta-pesante.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-porta-pesante.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.44 (minima fra due semi 0.00), 12 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.56 | 6-6 | 4 | -25.5..-25.4 | 0.64 | 36 % | 31.8 | 0.00 | 0 % | 12/12 |
| 4, 5, 6 | pulito | 0.48 | 6-6 | 4 | -25.5..-25.4 | 0.70 | 36 % | 31.4 | 0.00 | 0 % | 12/12 |
| 7, 8, 9 | pulito | 0.19 | 6-6 | 4 | -25.5..-25.5 | 0.46 | 34 % | 31.9 | 0.00 | 44 % | 12/12 |
| 10, 11, 12 | pulito | 0.48 | 6-6 | 4 | -25.5..-25.4 | 0.63 | 39 % | 31.8 | 0.00 | 44 % | 12/12 |
| 13, 14, 15 | pulito | 0.48 | 6-6 | 4 | -25.5..-25.4 | 0.67 | 38 % | 31.8 | 0.00 | 44 % | 12/12 |
| 16, 17, 18 | pulito | 0.48 | 6-6 | 4 | -25.5..-25.5 | 0.46 | 33 % | 31.6 | 0.00 | 0 % | 12/12 |
| 19, 20, 21 | pulito | 0.61 | 6-6 | 4 | -25.5..-25.4 | 0.72 | 39 % | 31.9 | 0.00 | 44 % | 12/12 |
| 22, 23, 24 | pulito | 0.33 | 6-6 | 4 | -25.5..-25.5 | 0.67 | 35 % | 31.9 | 0.00 | 44 % | 12/12 |
| 25, 26, 27 | pulito | 0.36 | 6-6 | 4 | -25.5..-25.4 | 0.63 | 36 % | 31.8 | 0.00 | 0 % | 12/12 |
| 28, 29, 30 | pulito | 0.43 | 6-6 | 4 | -25.5..-25.4 | 0.72 | 35 % | 31.8 | 0.00 | 44 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-porta-pesante (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.88 s a 96 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: D phrygian (root 38); swing 0.00, cutoff 2200 Hz, space 0.45.
Tracce: y0 bass 0.80, y1 pad 0.60, y2 lead 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 bass: F1!~3 . . G1~4 . . . . . . . .
  y1 pad: . D2~6+A2~6 . . . . . . . . . .
  y2 lead: . . . . . . . . C . K .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 | 42 % | 4 | F1..A2 (16 semitoni) | 100 % | 26 % | D pentatonic_minor (0.90) | 0.81 | 0 % | 12/12 |
| 2 | 6 | 33 % | 4 | F1..A2 (16 semitoni) | 100 % | 26 % | D pentatonic_minor (0.90) | 0.81 | 0 % | 12/12 |
| 3 | 6 | 33 % | 4 | F1..A2 (16 semitoni) | 100 % | 26 % | D pentatonic_minor (0.90) | 0.81 | 0 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 bass | 2 | 0 | 2 | 2 | F1..G1 (2 semitoni) | 17 % | 3.5 | 12/12 |
| 1 | y1 pad | 2 | 0 | 2 | 2 | D2..A2 (7 semitoni) | 8 % | 6.0 | 12/12 |
| 1 | y2 lead | 0 | 2 | 2 | 0 | - | 17 % | 0.0 | 12/12 |
| 2 | y0 bass | 2 | 0 | 2 | 2 | F1..G1 (2 semitoni) | 17 % | 3.5 | 12/12 |
| 2 | y1 pad | 2 | 0 | 2 | 2 | D2..A2 (7 semitoni) | 8 % | 6.0 | 12/12 |
| 2 | y2 lead | 0 | 2 | 2 | 0 | - | 8 % | 0.0 | 12/12 |
| 3 | y0 bass | 2 | 0 | 2 | 2 | F1..G1 (2 semitoni) | 17 % | 3.5 | 12/12 |
| 3 | y1 pad | 2 | 0 | 2 | 2 | D2..A2 (7 semitoni) | 8 % | 6.0 | 12/12 |
| 3 | y2 lead | 0 | 2 | 2 | 0 | - | 8 % | 0.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.56; y0 0.44, y1 0.00, y2 0.89.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.88 s | -6.8 | 0.46 | -25.5 | 18.7 | 0.00 % | 32 % | 0.24 s | 31.8 | 134 | 0.00 |
| 2 | 1.88 s | -4.5 | 0.59 | -25.4 | 20.9 | 0.00 % | 36 % | 0.33 s | 38.3 | 122 | 0.00 |
| 3 | 1.88 s | -3.8 | 0.64 | -25.4 | 21.6 | 0.00 % | 32 % | 0.31 s | 40.3 | 134 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 35 % | 60 % | 2 % | 3 % | 0 % | 0 % | 0 % |
| 2 | 39 % | 56 % | 2 % | 2 % | 0 % | 0 % | 0 % |
| 3 | 36 % | 59 % | 2 % | 3 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×3×8, 21 nodi, 20 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: S 15, N 3, K 1, A 1, C 1.
 #2 line 0 0 2 → 0 0 2 A: ×1, 1 celle x0 y0 z2, passi 1
  .→A 1: x0 y0 z2
 #3 line 3 0 1 → 3 0 1 T: ×1, 1 celle x3 y0 z1, passi 2
  .→T 1: x3 y0 z1
 #4 line 4 0 3 → 4 0 3 T: ×1, 1 celle x4 y0 z3, passi 3
  .→T 1: x4 y0 z3
 #5 line 3 0 3 → 3 0 3 T: ×1, 1 celle x3 y0 z3, passi 4
  .→T 1: x3 y0 z3
 #6 one T → N passi=1: ×1, 1 celle x3 y0 z3, passi 5
  T→N 1: x3 y0 z3
 #7 all T → .: ×1, 2 celle x3-4 y0 z1-3, passi 6
  T→. 2: x3 y0 z1; x4 y0 z3
 #8 all A.. → ASS: ×1, 2 celle x1-2 y0 z2, passi 7
  .→S 2: x1-2 y0 z2
 #9 all N... → NSSS: ×1, 3 celle x4-6 y0 z3, passi 8
  .→S 3: x4-6 y0 z3
 #10 line 1 1 0 → 1 1 0 N: ×1, 1 celle x1 y1 z0, passi 9
  .→N 1: x1 y1 z0
 #11 line 1 1 4 → 1 1 4 N: ×1, 1 celle x1 y1 z4, passi 10
  .→N 1: x1 y1 z4
 #12 all N..... → NSSSSS: ×1, 10 celle x2-6 y1 z0-4, passi 11
  .→S 10: x2-6 y1 z0; x2-6 y1 z4
 #13 line 8 2 0 → 8 2 0 U: ×1, 1 celle x8 y2 z0, passi 12
  .→U 1: x8 y2 z0
 #14 line 9 2 0 → 9 2 0 U: ×1, 1 celle x9 y2 z0, passi 13
  .→U 1: x9 y2 z0
 #15 line 10 2 0 → 10 2 0 U: ×1, 1 celle x10 y2 z0, passi 14
  .→U 1: x10 y2 z0
 #16 one U → K passi=1: ×1, 1 celle x10 y2 z0, passi 15
  U→K 1: x10 y2 z0
 #17 all U → .: ×1, 2 celle x8-9 y2 z0, passi 16
  U→. 2: x8-9 y2 z0
 #18 line 8 2 2 → 8 2 2 V: ×1, 1 celle x8 y2 z2, passi 17
  .→V 1: x8 y2 z2
 #19 line 9 2 2 → 9 2 2 V: ×1, 1 celle x9 y2 z2, passi 18
  .→V 1: x9 y2 z2
 #20 one V → C passi=1: ×1, 1 celle x8 y2 z2, passi 19
  V→C 1: x8 y2 z2
 #21 all V → .: ×1, 1 celle x9 y2 z2, passi 20
  V→. 1: x9 y2 z2
```
