# suono-effetto-allarme-sirena

> Un allarme: due note che si alternano strette, su e giù come una sirena, con un colpo a ogni giro; il seme sceglie le due note e dove batte.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-allarme-sirena.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-allarme-sirena.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.68 (minima fra due semi 0.20), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.49 | 9-9 | 2 | -24.2..-24.2 | 0.65 | 40 % | 35.7 | 0.00 | 0 % | 12/12 |
| 4, 5, 6 | pulito | 0.60 | 9-9 | 2 | -24.2..-24.2 | 0.64 | 40 % | 36.0 | 0.00 | 0 % | 12/12 |
| 7, 8, 9 | pulito | 0.44 | 9-9 | 2 | -24.2..-24.2 | 0.65 | 36 % | 36.1 | 0.00 | 0 % | 12/12 |
| 10, 11, 12 | pulito | 0.65 | 9-9 | 2 | -24.3..-24.2 | 0.65 | 40 % | 38.2 | 0.00 | 0 % | 12/12 |
| 13, 14, 15 | pulito | 0.67 | 9-9 | 2 | -24.2..-24.2 | 0.65 | 38 % | 38.3 | 0.00 | 0 % | 12/12 |
| 16, 17, 18 | pulito | 0.77 | 9-9 | 2 | -24.3..-24.2 | 0.64 | 38 % | 36.5 | 0.00 | 0 % | 12/12 |
| 19, 20, 21 | pulito | 0.67 | 9-9 | 2 | -24.2..-24.2 | 0.65 | 40 % | 38.4 | 0.00 | 0 % | 12/12 |
| 22, 23, 24 | pulito | 0.71 | 9-9 | 2 | -24.2..-24.2 | 0.65 | 40 % | 35.6 | 0.00 | 0 % | 12/12 |
| 25, 26, 27 | pulito | 0.77 | 9-9 | 2 | -24.2..-24.2 | 0.65 | 38 % | 36.0 | 0.00 | 0 % | 12/12 |
| 28, 29, 30 | pulito | 0.71 | 9-9 | 2 | -24.3..-24.2 | 0.65 | 38 % | 38.0 | 0.00 | 0 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-allarme-sirena (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.20 s a 150 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A harmonic_minor (root 57); swing 0.00, cutoff 7000 Hz, space 0.25.
Tracce: y0 lead 0.50, y1 bass 0.65.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: A5!~3 . . E5~3 . . A5~3 . . E5~3 . .
  y1 bass: K . . . H . . H . C H .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 9 | 58 % | 2 | E5..A5 (5 semitoni) | 100 % | 54 % | A pentatonic_minor (0.82) | 0.78 | 0 % | 12/12 |
| 2 | 9 | 58 % | 2 | E5..A5 (5 semitoni) | 100 % | 54 % | A pentatonic_minor (0.82) | 0.78 | 0 % | 12/12 |
| 3 | 9 | 50 % | 2 | E5..A5 (5 semitoni) | 100 % | 54 % | A pentatonic_minor (0.82) | 0.78 | 0 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 4 | 0 | 4 | 2 | E5..A5 (5 semitoni) | 33 % | 3.0 | 6/12 |
| 1 | y1 bass | 0 | 5 | 5 | 0 | - | 42 % | 0.0 | 12/12 |
| 2 | y0 lead | 4 | 0 | 4 | 2 | E5..A5 (5 semitoni) | 33 % | 3.0 | 6/12 |
| 2 | y1 bass | 0 | 5 | 5 | 0 | - | 42 % | 0.0 | 12/12 |
| 3 | y0 lead | 4 | 0 | 4 | 2 | E5..A5 (5 semitoni) | 33 % | 3.0 | 6/12 |
| 3 | y1 bass | 0 | 5 | 5 | 0 | - | 33 % | 0.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.49; y0 0.00, y1 0.74.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.20 s | -3.7 | 0.65 | -24.2 | 20.5 | 0.00 % | 40 % | 0.12 s | 38.5 | 1040 | 0.00 |
| 2 | 1.20 s | -3.9 | 0.64 | -24.2 | 20.3 | 0.00 % | 38 % | 0.12 s | 38.3 | 1051 | 0.00 |
| 3 | 1.20 s | -3.9 | 0.64 | -24.2 | 20.4 | 0.00 % | 34 % | 0.12 s | 35.7 | 1075 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 2 % | 23 % | 17 % | 47 % | 5 % | 5 % | 1 % |
| 2 | 2 % | 23 % | 17 % | 47 % | 5 % | 5 % | 1 % |
| 3 | 2 % | 23 % | 17 % | 46 % | 5 % | 5 % | 1 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×2×12, 21 nodi, 22 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 8, H 3, N 3, K 1, C 1, A 1.
 #2 line 0 0 6 → 0 0 6 T: ×1, 1 celle x0 y0 z6, passi 1
  .→T 1: x0 y0 z6
 #3 line 0 0 7 → 0 0 7 T: ×1, 1 celle x0 y0 z7, passi 2
  .→T 1: x0 y0 z7
 #4 one T → A passi=1: ×1, 1 celle x0 y0 z7, passi 3
  T→A 1: x0 y0 z7
 #5 all T → .: ×1, 1 celle x0 y0 z6, passi 4
  T→. 1: x0 y0 z6
 #6 line 3 0 4 → 3 0 4 U: ×1, 1 celle x3 y0 z4, passi 5
  .→U 1: x3 y0 z4
 #7 line 3 0 5 → 3 0 5 U: ×1, 1 celle x3 y0 z5, passi 6
  .→U 1: x3 y0 z5
 #8 one U → N passi=1: ×1, 1 celle x3 y0 z4, passi 7
  U→N 1: x3 y0 z4
 #9 all U → .: ×1, 1 celle x3 y0 z5, passi 8
  U→. 1: x3 y0 z5
 #10 all A...... → ASS...N: ×1, 3 celle x1-6 y0 z7, passi 9
  .→S 2: x1-2 y0 z7
  .→N 1: x6 y0 z7
 #11 all N...... → NSS...N: ×1, 3 celle x4-9 y0 z4, passi 10
  .→S 2: x4-5 y0 z4
  .→N 1: x9 y0 z4
 #12 all N.. → NSS: ×1, 4 celle x7-11 y0 z4-7, passi 11
  .→S 4: x10-11 y0 z4; x7-8 y0 z7
 #13 line 0 1 0 → 0 1 0 K: ×1, 1 celle x0 y1 z0, passi 12
  .→K 1: x0 y1 z0
 #14 line 6 1 2 → 6 1 2 V: ×1, 1 celle x6 y1 z2, passi 13
  .→V 1: x6 y1 z2
 #15 line 6 1 0 → 6 1 0 V: ×1, 1 celle x6 y1 z0, passi 14
  .→V 1: x6 y1 z0
 #16 line 9 1 2 → 9 1 2 V: ×1, 1 celle x9 y1 z2, passi 15
  .→V 1: x9 y1 z2
 #17 one V → C passi=1: ×1, 1 celle x9 y1 z2, passi 16
  V→C 1: x9 y1 z2
 #18 all V → .: ×1, 2 celle x6 y1 z0-2, passi 17
  V→. 2: x6 y1 z0; x6 y1 z2
 #19 line 1 1 1 → 11 1 1 P: ×1, 11 celle x1-11 y1 z1, passi 18
  .→P 11: x1-11 y1 z1
 #20 one P → H passi=3: ×3, 3 celle x4-10 y1 z1, passi 19-21
  P→H 3: x4 y1 z1; x7 y1 z1; x10 y1 z1
 #21 all P → .: ×1, 8 celle x1-11 y1 z1, passi 22
  P→. 8: x1-3 y1 z1; x5-6 y1 z1; x8-9 y1 z1; x11 y1 z1
```
