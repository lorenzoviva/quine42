# suono-effetto-veleno-danno

> Un colpo subìto, un veleno che entra: un accento acido che scivola giù di semitono, un colpo nel petto, un gorgoglio storto.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-veleno-danno.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-veleno-danno.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.47 (minima fra due semi 0.00), 22 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.22 | 8-8 | 5 | -20.7..-20.7 | 0.86 | 26 % | 32.5 | 0.00 | 0 % | 10/10 |
| 4, 5, 6 | pulito | 0.36 | 8-8 | 4 | -20.7..-20.6 | 0.86 | 17 % | 34.5 | 0.00 | 63 % | 10/10 |
| 7, 8, 9 | pulito | 0.40 | 8-8 | 4 | -20.7..-20.6 | 0.91 | 25 % | 37.1 | 0.00 | 0 % | 10/10 |
| 10, 11, 12 | pulito | 0.54 | 8-8 | 4 | -20.7..-20.6 | 0.89 | 22 % | 37.0 | 0.00 | 41 % | 10/10 |
| 13, 14, 15 | pulito | 0.36 | 8-8 | 4 | -20.7..-20.6 | 0.92 | 19 % | 33.5 | 0.00 | 47 % | 10/10 |
| 16, 17, 18 | pulito | 0.50 | 8-8 | 4 | -20.7..-20.6 | 0.91 | 20 % | 33.6 | 0.00 | 41 % | 10/10 |
| 19, 20, 21 | pulito | 0.54 | 8-8 | 5 | -20.7..-20.6 | 0.93 | 25 % | 33.5 | 0.00 | 47 % | 10/10 |
| 22, 23, 24 | pulito | 0.39 | 8-8 | 4 | -20.7..-20.6 | 0.97 | 18 % | 32.5 | 0.00 | 0 % | 10/10 |
| 25, 26, 27 | pulito | 0.54 | 8-8 | 4 | -20.7..-20.6 | 0.88 | 18 % | 34.8 | 0.00 | 0 % | 10/10 |
| 28, 29, 30 | pulito | 0.50 | 8-8 | 5 | -20.7..-20.6 | 0.94 | 18 % | 32.6 | 0.00 | 0 % | 10/10 |

## Rapporto completo: Suono: suono-effetto-veleno-danno (semi 1, 2, 3)

10 passi, 1 battuta, ciclo di 1.14 s a 132 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: A phrygian (root 45); swing 0.00, cutoff 4200 Hz, space 0.35.
Tracce: y0 lead 0.55, y1 bass 0.80, y2 bass 0.70.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: G4!~2 . D4~3 . . C4~3 . . . .
  y1 bass: . K+A1!~3 . . . C2~4 . . . .
  y2 bass: K+C . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 | 40 % | 5 | A1..G4 (34 semitoni) | 100 % | 29 % | C dorian (0.70) | 0.61 | 0 % | 10/10 |
| 2 | 8 | 40 % | 5 | A1..G4 (34 semitoni) | 100 % | 29 % | A phrygian (0.69) | 0.69 | 0 % | 10/10 |
| 3 | 8 | 50 % | 5 | A1..G4 (34 semitoni) | 100 % | 44 % | A pentatonic_minor (0.78) | 0.71 | 0 % | 10/10 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 3 | 0 | 3 | 3 | C4..G4 (7 semitoni) | 30 % | 2.7 | 10/10 |
| 1 | y1 bass | 2 | 1 | 3 | 2 | A1..C2 (3 semitoni) | 20 % | 3.5 | 10/10 |
| 1 | y2 bass | 0 | 2 | 2 | 0 | - | 10 % | 0.0 | 10/10 |
| 2 | y0 lead | 3 | 0 | 3 | 3 | A#3..G4 (9 semitoni) | 30 % | 2.7 | 10/10 |
| 2 | y1 bass | 2 | 1 | 3 | 2 | A1..C2 (3 semitoni) | 20 % | 3.5 | 10/10 |
| 2 | y2 bass | 0 | 2 | 2 | 0 | - | 10 % | 0.0 | 10/10 |
| 3 | y0 lead | 3 | 0 | 3 | 3 | A3..G4 (10 semitoni) | 30 % | 2.7 | 10/10 |
| 3 | y1 bass | 2 | 1 | 3 | 2 | A1..C2 (3 semitoni) | 20 % | 3.5 | 10/10 |
| 3 | y2 bass | 0 | 2 | 2 | 0 | - | 10 % | 0.0 | 10/10 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.22; y0 0.50, y1 0.00, y2 0.00.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.14 s | -1.3 | 0.86 | -20.7 | 19.4 | 0.00 % | 25 % | 0.10 s | 37.8 | 178 | 0.00 |
| 2 | 1.14 s | -1.6 | 0.83 | -20.7 | 19.1 | 0.00 % | 26 % | 0.10 s | 38.0 | 173 | 0.00 |
| 3 | 1.14 s | -1.7 | 0.83 | -20.7 | 19.0 | 0.00 % | 18 % | 0.06 s | 32.5 | 171 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 16 % | 67 % | 12 % | 4 % | 0 % | 0 % | 0 % |
| 2 | 16 % | 72 % | 7 % | 4 % | 0 % | 0 % | 0 % |
| 3 | 16 % | 73 % | 7 % | 4 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 10×3×10, 27 nodi, 26 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, K=Kick, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 10, N 3, A 2, K 1, C 1.
 #2 line 0 2 0 → 0 2 0 K: ×1, 1 celle x0 y2 z0, passi 1
  .→K 1: x0 y2 z0
 #3 line 0 2 2 → 0 2 2 C: ×1, 1 celle x0 y2 z2, passi 2
  .→C 1: x0 y2 z2
 #4 line 0 0 5 → 0 0 5 T: ×1, 1 celle x0 y0 z5, passi 3
  .→T 1: x0 y0 z5
 #5 line 0 0 6 → 0 0 6 T: ×1, 1 celle x0 y0 z6, passi 4
  .→T 1: x0 y0 z6
 #6 one T → A passi=1: ×1, 1 celle x0 y0 z6, passi 5
  T→A 1: x0 y0 z6
 #7 all T → .: ×1, 1 celle x0 y0 z5, passi 6
  T→. 1: x0 y0 z5
 #8 all A. → AS: ×1, 1 celle x1 y0 z6, passi 7
  .→S 1: x1 y0 z6
 #9 line 2 0 4 → 2 0 4 U: ×1, 1 celle x2 y0 z4, passi 8
  .→U 1: x2 y0 z4
 #10 line 2 0 3 → 2 0 3 U: ×1, 1 celle x2 y0 z3, passi 9
  .→U 1: x2 y0 z3
 #11 line 3 0 4 → 3 0 4 U: ×1, 1 celle x3 y0 z4, passi 10
  .→U 1: x3 y0 z4
 #12 one U → N passi=1: ×1, 1 celle x2 y0 z3, passi 11
  U→N 1: x2 y0 z3
 #13 all U → .: ×1, 2 celle x2-3 y0 z4, passi 12
  U→. 2: x2-3 y0 z4
 #14 line 5 0 1 → 5 0 1 V: ×1, 1 celle x5 y0 z1, passi 13
  .→V 1: x5 y0 z1
 #15 line 5 0 2 → 5 0 2 V: ×1, 1 celle x5 y0 z2, passi 14
  .→V 1: x5 y0 z2
 #16 line 6 0 0 → 6 0 0 V: ×1, 1 celle x6 y0 z0, passi 15
  .→V 1: x6 y0 z0
 #17 one V → N passi=1: ×1, 1 celle x5 y0 z2, passi 16
  V→N 1: x5 y0 z2
 #18 all V → .: ×1, 2 celle x5-6 y0 z0-1, passi 17
  V→. 2: x6 y0 z0; x5 y0 z1
 #19 all N.. → NSS: ×1, 4 celle x3-7 y0 z2-3, passi 18
  .→S 4: x6-7 y0 z2; x3-4 y0 z3
 #20 line 1 1 0 → 1 1 0 A: ×1, 1 celle x1 y1 z0, passi 19
  .→A 1: x1 y1 z0
 #21 line 4 1 0 → 4 1 0 P: ×1, 1 celle x4 y1 z0, passi 20
  .→P 1: x4 y1 z0
 #22 line 5 1 2 → 5 1 2 P: ×1, 1 celle x5 y1 z2, passi 21
  .→P 1: x5 y1 z2
 #23 line 4 1 4 → 4 1 4 P: ×1, 1 celle x4 y1 z4, passi 22
  .→P 1: x4 y1 z4
 #24 one P → N passi=1: ×1, 1 celle x5 y1 z2, passi 23
  P→N 1: x5 y1 z2
 #25 all P → .: ×1, 2 celle x4 y1 z0-4, passi 24
  P→. 2: x4 y1 z0; x4 y1 z4
 #26 all A.. → ASS: ×1, 2 celle x2-3 y1 z0, passi 25
  .→S 2: x2-3 y1 z0
 #27 all N... → NSSS: ×1, 3 celle x6-8 y1 z2, passi 26
  .→S 3: x6-8 y1 z2
```
