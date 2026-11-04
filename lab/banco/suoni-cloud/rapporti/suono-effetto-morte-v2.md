# suono-effetto-morte-v2

> Il viaggio finisce: un colpo sordo e tre note gravi che scendono; il seme sceglie la strada della discesa, dove cade il basso e l'eco che resta.

Sorgente: `lab/banco/suoni-cloud/suono-effetto-morte-v2.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/suono-effetto-morte-v2.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.67 (minima fra due semi 0.00), 28 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.72 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 17 % | 30.1 | 0.01 | 0 % | 16/16 |
| 4, 5, 6 | pulito | 0.63 | 7-7 | 5 | -23.8..-23.8 | 0.71 | 6 % | 29.4 | 0.01 | 0 % | 16/16 |
| 7, 8, 9 | pulito | 0.64 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 20 % | 33.1 | 0.01 | 0 % | 16/16 |
| 10, 11, 12 | pulito | 0.68 | 7-7 | 5 | -23.8..-23.8 | 0.71 | 19 % | 31.8 | 0.01 | 0 % | 16/16 |
| 13, 14, 15 | pulito | 0.64 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 13 % | 32.3 | 0.01 | 0 % | 16/16 |
| 16, 17, 18 | pulito | 0.63 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 10 % | 29.7 | 0.01 | 0 % | 16/16 |
| 19, 20, 21 | pulito | 0.73 | 7-7 | 5 | -23.9..-23.8 | 0.72 | 20 % | 32.8 | 0.01 | 0 % | 16/16 |
| 22, 23, 24 | pulito | 0.68 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 13 % | 29.8 | 0.01 | 0 % | 16/16 |
| 25, 26, 27 | pulito | 0.68 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 17 % | 32.9 | 0.01 | 0 % | 16/16 |
| 28, 29, 30 | pulito | 0.68 | 7-7 | 5 | -23.8..-23.8 | 0.72 | 13 % | 30.1 | 0.00 | 0 % | 16/16 |

## Rapporto completo: Suono: suono-effetto-morte-v2 (semi 1, 2, 3)

16 passi, 1 battuta, ciclo di 3.00 s a 80 bpm.
Dichiarata: G phrygian (root 43); swing 0.00, cutoff 2400 Hz, space 0.60.
Tracce: y0 pad 0.90, y1 bass 0.95.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 pad: G3~3 . . . . D#3~3 . . A#2!~6 . . . . . g#2 .
  y1 bass: K . . . . . . . . A#1~3 . . . K . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | 38 % | 5 | A#1..G3 (21 semitoni) | 100 % | 17 % | A# dorian (0.64) | 0.42 | 0 % | 16/16 |
| 2 | 7 | 38 % | 5 | A#1..F3 (19 semitoni) | 100 % | 0 % | C pentatonic_minor (0.77) | 0.19 | 0 % | 16/16 |
| 3 | 7 | 31 % | 5 | A#1..F3 (19 semitoni) | 100 % | 3 % | A# pentatonic_minor (0.68) | 0.40 | 0 % | 16/16 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 pad | 4 | 0 | 4 | 4 | G#2..G3 (11 semitoni) | 25 % | 3.3 | 16/16 |
| 1 | y1 bass | 1 | 2 | 3 | 1 | A#1 | 19 % | 3.0 | 16/16 |
| 2 | y0 pad | 4 | 0 | 4 | 4 | G#2..F3 (9 semitoni) | 25 % | 3.3 | 16/16 |
| 2 | y1 bass | 1 | 2 | 3 | 1 | A#1 | 19 % | 3.0 | 16/16 |
| 3 | y0 pad | 4 | 0 | 4 | 4 | G2..F3 (10 semitoni) | 25 % | 3.3 | 16/16 |
| 3 | y1 bass | 1 | 2 | 3 | 1 | A#1 | 19 % | 3.0 | 16/16 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.72; y0 0.90, y1 0.33.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 3.00 s | -2.9 | 0.72 | -23.8 | 20.9 | 0.00 % | 17 % | 0.15 s | 34.5 | 194 | 0.00 |
| 2 | 3.00 s | -3.0 | 0.71 | -23.8 | 20.8 | 0.00 % | 6 % | 0.08 s | 30.1 | 198 | 0.01 |
| 3 | 3.00 s | -3.0 | 0.71 | -23.8 | 20.8 | 0.00 % | 13 % | 0.14 s | 32.6 | 193 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 8 % | 83 % | 4 % | 6 % | 1 % | 0 % | 0 % |
| 2 | 8 % | 80 % | 5 % | 6 % | 1 % | 0 % | 0 % |
| 3 | 8 % | 82 % | 4 % | 6 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 16×2×9, 32 nodi, 31 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore), M=Scelta (marcatore).
Alla fine: S 11, N 3, K 2, G 1, A 1.
 #2 line 0 1 0 → 0 1 0 K: ×1, 1 celle x0 y1 z0, passi 1
  .→K 1: x0 y1 z0
 #3 line 12 1 0 → 12 1 0 P: ×1, 1 celle x12 y1 z0, passi 2
  .→P 1: x12 y1 z0
 #4 line 14 1 0 → 14 1 0 P: ×1, 1 celle x14 y1 z0, passi 3
  .→P 1: x14 y1 z0
 #5 line 13 1 0 → 13 1 0 P: ×1, 1 celle x13 y1 z0, passi 4
  .→P 1: x13 y1 z0
 #6 one P → K passi=1: ×1, 1 celle x13 y1 z0, passi 5
  P→K 1: x13 y1 z0
 #7 all P → .: ×1, 2 celle x12-14 y1 z0, passi 6
  P→. 2: x12 y1 z0; x14 y1 z0
 #8 line 0 0 6 → 0 0 6 T: ×1, 1 celle x0 y0 z6, passi 7
  .→T 1: x0 y0 z6
 #9 line 0 0 7 → 0 0 7 T: ×1, 1 celle x0 y0 z7, passi 8
  .→T 1: x0 y0 z7
 #10 one T → N passi=1: ×1, 1 celle x0 y0 z7, passi 9
  T→N 1: x0 y0 z7
 #11 all T → .: ×1, 1 celle x0 y0 z6, passi 10
  T→. 1: x0 y0 z6
 #12 line 4 0 5 → 4 0 5 U: ×1, 1 celle x4 y0 z5, passi 11
  .→U 1: x4 y0 z5
 #13 line 4 0 4 → 4 0 4 U: ×1, 1 celle x4 y0 z4, passi 12
  .→U 1: x4 y0 z4
 #14 line 5 0 5 → 5 0 5 U: ×1, 1 celle x5 y0 z5, passi 13
  .→U 1: x5 y0 z5
 #15 one U → N passi=1: ×1, 1 celle x5 y0 z5, passi 14
  U→N 1: x5 y0 z5
 #16 all U → .: ×1, 2 celle x4 y0 z4-5, passi 15
  U→. 2: x4 y0 z4-5
 #17 line 8 0 3 → 8 0 3 V: ×1, 1 celle x8 y0 z3, passi 16
  .→V 1: x8 y0 z3
 #18 line 8 0 2 → 8 0 2 V: ×1, 1 celle x8 y0 z2, passi 17
  .→V 1: x8 y0 z2
 #19 one V → A passi=1: ×1, 1 celle x8 y0 z2, passi 18
  V→A 1: x8 y0 z2
 #20 all V → .: ×1, 1 celle x8 y0 z3, passi 19
  V→. 1: x8 y0 z3
 #21 line 8 1 3 → 8 1 3 M: ×1, 1 celle x8 y1 z3, passi 20
  .→M 1: x8 y1 z3
 #22 line 8 1 1 → 8 1 1 M: ×1, 1 celle x8 y1 z1, passi 21
  .→M 1: x8 y1 z1
 #23 line 9 1 2 → 9 1 2 M: ×1, 1 celle x9 y1 z2, passi 22
  .→M 1: x9 y1 z2
 #24 one M → N passi=1: ×1, 1 celle x9 y1 z2, passi 23
  M→N 1: x9 y1 z2
 #25 all M → .: ×1, 2 celle x8 y1 z1-3, passi 24
  M→. 2: x8 y1 z1; x8 y1 z3
 #26 all N.. → NSS: ×1, 6 celle x1-11 y0-1 z2-7, passi 25
  .→S 6: x10-11 y1 z2; x6-7 y0 z5; x1-2 y0 z7
 #27 all A..... → ASSSSS: ×1, 5 celle x9-13 y0 z2, passi 26
  .→S 5: x9-13 y0 z2
 #28 line 14 0 1 → 14 0 1 T: ×1, 1 celle x14 y0 z1, passi 27
  .→T 1: x14 y0 z1
 #29 line 14 0 0 → 14 0 0 T: ×1, 1 celle x14 y0 z0, passi 28
  .→T 1: x14 y0 z0
```
