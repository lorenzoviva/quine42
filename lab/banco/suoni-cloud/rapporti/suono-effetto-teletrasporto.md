# suono-effetto-teletrasporto

> Un teletrasporto: un arpeggio velocissimo che sale e svanisce in un accordo sospeso; il seme sceglie i gradini e la cima.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-teletrasporto.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-teletrasporto.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.75 (minima fra due semi 0.15), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.79 | 12-13 | 11 | -20.5..-20.2 | 0.48 | 0 % | 14.7 | 0.02 | 33 % | 14/14 |
| 4, 5, 6 | pulito | 0.82 | 11-13 | 10 | -20.6..-20.1 | 0.57 | 0 % | 14.5 | 0.02 | 36 % | 14/14 |
| 7, 8, 9 | pulito | 0.81 | 10-14 | 9 | -20.7..-20.0 | 0.57 | 0 % | 14.1 | 0.01 | 23 % | 14/14 |
| 10, 11, 12 | pulito | 0.67 | 11-11 | 9 | -20.4..-20.2 | 0.53 | 0 % | 18.8 | 0.01 | 37 % | 14/14 |
| 13, 14, 15 | pulito | 0.59 | 13-13 | 11 | -20.6..-20.4 | 0.49 | 0 % | 14.1 | 0.01 | 25 % | 14/14 |
| 16, 17, 18 | pulito | 0.69 | 12-13 | 10 | -20.3..-20.1 | 0.51 | 0 % | 14.6 | 0.01 | 21 % | 14/14 |
| 19, 20, 21 | pulito | 0.61 | 12-12 | 10 | -20.4..-20.1 | 0.62 | 0 % | 15.7 | 0.01 | 33 % | 14/14 |
| 22, 23, 24 | pulito | 0.68 | 13-13 | 11 | -20.5..-20.2 | 0.47 | 0 % | 14.4 | 0.01 | 30 % | 14/14 |
| 25, 26, 27 | pulito | 0.84 | 11-14 | 11 | -20.4..-20.1 | 0.53 | 0 % | 11.2 | 0.01 | 21 % | 14/14 |
| 28, 29, 30 | pulito | 0.73 | 12-14 | 10 | -20.4..-20.3 | 0.52 | 0 % | 12.2 | 0.02 | 26 % | 14/14 |

## Rapporto completo: Suono: suono-effetto-teletrasporto (semi 1, 2, 3)

14 passi, 1 battuta, ciclo di 1.19 s a 176 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: E hirajoshi (root 52); swing 0.00, cutoff 9000 Hz, space 0.70.
Tracce: y0 lead 0.50, y1 pad 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: E4~9 F#4~9 C5~9 E5~9 G5~9 E6~9 F#6 E5 F#5!~6 . . . . .
  y1 pad: E3~9+G3~9 . . . C4~9 . . . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 12 | 64 % | 11 | E3..F#6 (38 semitoni) | 100 % | 40 % | E hirajoshi (0.77) | 0.77 | 20 % | 14/14 |
| 2 | 13 | 71 % | 11 | E3..F#6 (38 semitoni) | 100 % | 33 % | E hirajoshi (0.94) | 0.94 | 20 % | 14/14 |
| 3 | 13 | 71 % | 11 | E3..F#6 (38 semitoni) | 100 % | 22 % | E hirajoshi (0.74) | 0.74 | 33 % | 14/14 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 9 | 0 | 9 | 8 | E4..F#6 (26 semitoni) | 64 % | 6.9 | 14/14 |
| 1 | y1 pad | 3 | 0 | 3 | 3 | E3..C4 (8 semitoni) | 14 % | 9.0 | 14/14 |
| 2 | y0 lead | 10 | 0 | 10 | 8 | E4..F#6 (26 semitoni) | 71 % | 5.8 | 14/14 |
| 2 | y1 pad | 3 | 0 | 3 | 3 | E3..C4 (8 semitoni) | 14 % | 9.0 | 14/14 |
| 3 | y0 lead | 10 | 0 | 10 | 9 | E4..F#6 (26 semitoni) | 71 % | 5.8 | 14/14 |
| 3 | y1 pad | 3 | 0 | 3 | 3 | E3..F#4 (14 semitoni) | 14 % | 9.0 | 14/14 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.79; y0 0.84, y1 0.60.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.19 s | -6.3 | 0.48 | -20.2 | 13.9 | 0.00 % | 0 % | 0.00 s | 15.8 | 883 | 0.01 |
| 2 | 1.19 s | -6.5 | 0.47 | -20.5 | 14.0 | 0.00 % | 0 % | 0.00 s | 14.7 | 759 | 0.02 |
| 3 | 1.19 s | -7.3 | 0.43 | -20.4 | 13.1 | 0.00 % | 0 % | 0.00 s | 15.3 | 677 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 14 % | 25 % | 54 % | 6 % | 1 % | 0 % |
| 2 | 0 % | 14 % | 33 % | 46 % | 6 % | 1 % | 0 % |
| 3 | 0 % | 18 % | 38 % | 39 % | 4 % | 1 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 14×2×14, 16 nodi, 22 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, T=Scelta (marcatore), U=Scelta (marcatore), M=Scelta (marcatore).
Alla fine: S 77, N 11, A 1.
 #2 line 0 0 0 → 0 0 0 M: ×1, 1 celle x0 y0 z0, passi 1
  .→M 1: x0 y0 z0
 #3 one *. M. → *M N. (+2): ×8, 16 celle x0-8 y0 z0-13, passi 2-9
   r1 *. M. → *M N. ×5; r2 *. ** M. → *M ** N. ×1; r3 *. ** ** M. → *M ** ** N. ×2
  .→N 7: x1 y0 z1; x2 y0 z4; x3 y0 z5; x4 y0 z7; +3 scatole, 3 celle
  M→N 1: x0 y0 z0
  .→M 1: x8 y0 z13
 #4 all M → A: ×1, 1 celle x8 y0 z13, passi 10
  M→A 1: x8 y0 z13
 #5 all A..... → ASSSSS: ×1, 5 celle x9-13 y0 z13, passi 11
  .→S 5: x9-13 y0 z13
 #6 line 0 1 0 → 0 1 0 N: ×1, 1 celle x0 y1 z0, passi 12
  .→N 1: x0 y1 z0
 #7 line 0 1 3 → 0 1 3 T: ×1, 1 celle x0 y1 z3, passi 13
  .→T 1: x0 y1 z3
 #8 line 0 1 2 → 0 1 2 T: ×1, 1 celle x0 y1 z2, passi 14
  .→T 1: x0 y1 z2
 #9 line 4 1 5 → 4 1 5 U: ×1, 1 celle x4 y1 z5, passi 15
  .→U 1: x4 y1 z5
 #10 line 4 1 4 → 4 1 4 U: ×1, 1 celle x4 y1 z4, passi 16
  .→U 1: x4 y1 z4
 #11 line 5 1 6 → 5 1 6 U: ×1, 1 celle x5 y1 z6, passi 17
  .→U 1: x5 y1 z6
 #12 one T → N passi=1: ×1, 1 celle x0 y1 z2, passi 18
  T→N 1: x0 y1 z2
 #13 all T → .: ×1, 1 celle x0 y1 z3, passi 19
  T→. 1: x0 y1 z3
 #14 one U → N passi=1: ×1, 1 celle x4 y1 z4, passi 20
  U→N 1: x4 y1 z4
 #15 all U → .: ×1, 2 celle x4-5 y1 z5-6, passi 21
  U→. 2: x4 y1 z5; x5 y1 z6
 #16 all N........ → NSSSSSSSS: ×1, 72 celle x1-13 y0-1 z0-10, passi 22
  .→S 72: x1-8 y0-1 z0; x2-9 y0 z1; x1-8 y1 z2; x3-10 y0 z4; +4 scatole, 32 celle
```
