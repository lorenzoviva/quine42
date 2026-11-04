# suono-effetto-scoperta-segreto

> Un segreto trovato: quattro note che salgono a sorpresa, l'ultima sospesa su un accordo che si apre; il seme cambia la strada.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-scoperta-segreto.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-scoperta-segreto.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.46 (minima fra due semi 0.00), 20 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.17 | 7-7 | 7 | -25.0..-24.9 | 0.53 | 2 % | 22.2 | 0.01 | 0 % | 14/14 |
| 4, 5, 6 | pulito | 0.43 | 7-7 | 7 | -25.0..-24.8 | 0.54 | 1 % | 21.3 | 0.01 | 0 % | 14/14 |
| 7, 8, 9 | pulito | 0.44 | 7-7 | 7 | -25.0..-24.8 | 0.54 | 2 % | 21.3 | 0.01 | 0 % | 14/14 |
| 10, 11, 12 | pulito | 0.57 | 7-7 | 7 | -25.0..-24.8 | 0.54 | 2 % | 21.3 | 0.01 | 0 % | 14/14 |
| 13, 14, 15 | pulito | 0.30 | 7-7 | 7 | -25.0..-24.9 | 0.50 | 1 % | 21.7 | 0.01 | 0 % | 14/14 |
| 16, 17, 18 | pulito | 0.59 | 7-7 | 7 | -25.0..-25.0 | 0.53 | 1 % | 21.4 | 0.01 | 0 % | 14/14 |
| 19, 20, 21 | pulito | 0.31 | 7-7 | 7 | -25.0..-25.0 | 0.53 | 2 % | 21.4 | 0.01 | 0 % | 14/14 |
| 22, 23, 24 | pulito | 0.55 | 7-7 | 7 | -24.9..-24.8 | 0.54 | 1 % | 21.3 | 0.01 | 0 % | 14/14 |
| 25, 26, 27 | pulito | 0.55 | 7-7 | 7 | -25.1..-24.9 | 0.53 | 3 % | 21.9 | 0.01 | 0 % | 14/14 |
| 28, 29, 30 | pulito | 0.54 | 7-7 | 7 | -25.1..-24.8 | 0.54 | 1 % | 21.3 | 0.01 | 0 % | 14/14 |

## Rapporto completo: Suono: suono-effetto-scoperta-segreto (semi 1, 2, 3)

14 passi, 1 battuta, ciclo di 1.59 s a 132 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: E dorian (root 52); swing 0.00, cutoff 6500 Hz, space 0.55.
Tracce: y0 lead 0.60, y1 pad 0.65.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: B4~2 . D5~2 . E5~2 . B5!~7 . . . . . . .
  y1 pad: . . . . . . E3~8+A3~8+B3~8 . . . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | 29 % | 7 | E3..B5 (31 semitoni) | 100 % | 26 % | E pentatonic_minor (0.77) | 0.70 | 0 % | 14/14 |
| 2 | 7 | 29 % | 7 | E3..B5 (31 semitoni) | 100 % | 26 % | E pentatonic_minor (0.84) | 0.77 | 0 % | 14/14 |
| 3 | 7 | 29 % | 7 | E3..B5 (31 semitoni) | 100 % | 26 % | E pentatonic_minor (0.84) | 0.77 | 0 % | 14/14 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 4 | 0 | 4 | 4 | B4..B5 (12 semitoni) | 29 % | 3.3 | 14/14 |
| 1 | y1 pad | 3 | 0 | 3 | 3 | E3..B3 (7 semitoni) | 7 % | 8.0 | 14/14 |
| 2 | y0 lead | 4 | 0 | 4 | 4 | B4..B5 (12 semitoni) | 29 % | 3.3 | 14/14 |
| 2 | y1 pad | 3 | 0 | 3 | 3 | E3..B3 (7 semitoni) | 7 % | 8.0 | 14/14 |
| 3 | y0 lead | 4 | 0 | 4 | 4 | B4..B5 (12 semitoni) | 29 % | 3.3 | 14/14 |
| 3 | y1 pad | 3 | 0 | 3 | 3 | E3..B3 (7 semitoni) | 7 % | 8.0 | 14/14 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.17; y0 0.00, y1 0.33.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.59 s | -5.5 | 0.53 | -25.0 | 19.5 | 0.00 % | 1 % | 0.01 s | 22.2 | 1107 | 0.00 |
| 2 | 1.59 s | -5.5 | 0.53 | -24.9 | 19.5 | 0.00 % | 2 % | 0.02 s | 22.4 | 1085 | 0.01 |
| 3 | 1.59 s | -5.5 | 0.53 | -24.9 | 19.5 | 0.00 % | 2 % | 0.02 s | 22.4 | 1085 | 0.01 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 15 % | 27 % | 47 % | 6 % | 5 % | 0 % |
| 2 | 0 % | 17 % | 26 % | 47 % | 5 % | 5 % | 0 % |
| 3 | 0 % | 17 % | 26 % | 47 % | 5 % | 5 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 14×2×14, 24 nodi, 23 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore).
Alla fine: S 30, N 6, A 1.
 #2 line 0 0 4 → 0 0 4 N: ×1, 1 celle x0 y0 z4, passi 1
  .→N 1: x0 y0 z4
 #3 line 2 0 5 → 2 0 5 T: ×1, 1 celle x2 y0 z5, passi 2
  .→T 1: x2 y0 z5
 #4 line 2 0 6 → 2 0 6 T: ×1, 1 celle x2 y0 z6, passi 3
  .→T 1: x2 y0 z6
 #5 one T → N passi=1: ×1, 1 celle x2 y0 z6, passi 4
  T→N 1: x2 y0 z6
 #6 all T → .: ×1, 1 celle x2 y0 z5, passi 5
  T→. 1: x2 y0 z5
 #7 line 4 0 7 → 4 0 7 U: ×1, 1 celle x4 y0 z7, passi 6
  .→U 1: x4 y0 z7
 #8 line 4 0 8 → 4 0 8 U: ×1, 1 celle x4 y0 z8, passi 7
  .→U 1: x4 y0 z8
 #9 one U → N passi=1: ×1, 1 celle x4 y0 z7, passi 8
  U→N 1: x4 y0 z7
 #10 all U → .: ×1, 1 celle x4 y0 z8, passi 9
  U→. 1: x4 y0 z8
 #11 all N. → NS: ×1, 3 celle x1-5 y0 z4-7, passi 10
  .→S 3: x1 y0 z4; x3 y0 z6; x5 y0 z7
 #12 line 6 0 11 → 6 0 11 V: ×1, 1 celle x6 y0 z11, passi 11
  .→V 1: x6 y0 z11
 #13 line 6 0 9 → 6 0 9 V: ×1, 1 celle x6 y0 z9, passi 12
  .→V 1: x6 y0 z9
 #14 line 6 0 10 → 6 0 10 V: ×1, 1 celle x6 y0 z10, passi 13
  .→V 1: x6 y0 z10
 #15 one V → A passi=1: ×1, 1 celle x6 y0 z11, passi 14
  V→A 1: x6 y0 z11
 #16 all V → .: ×1, 2 celle x6 y0 z9-10, passi 15
  V→. 2: x6 y0 z9-10
 #17 all A...... → ASSSSSS: ×1, 6 celle x7-12 y0 z11, passi 16
  .→S 6: x7-12 y0 z11
 #18 line 6 1 0 → 6 1 0 N: ×1, 1 celle x6 y1 z0, passi 17
  .→N 1: x6 y1 z0
 #19 line 6 1 4 → 6 1 4 N: ×1, 1 celle x6 y1 z4, passi 18
  .→N 1: x6 y1 z4
 #20 line 6 1 2 → 6 1 2 P: ×1, 1 celle x6 y1 z2, passi 19
  .→P 1: x6 y1 z2
 #21 line 6 1 3 → 6 1 3 P: ×1, 1 celle x6 y1 z3, passi 20
  .→P 1: x6 y1 z3
 #22 one P → N passi=1: ×1, 1 celle x6 y1 z3, passi 21
  P→N 1: x6 y1 z3
 #23 all P → .: ×1, 1 celle x6 y1 z2, passi 22
  P→. 1: x6 y1 z2
 #24 all N....... → NSSSSSSS: ×1, 21 celle x7-13 y1 z0-4, passi 23
  .→S 21: x7-13 y1 z3-4; x7-13 y1 z0
```
