# suono-effetto-cura-benedizione

> Una cura, una benedizione: una triade che sale piano, un luccichio in cima su una nota che il seme sceglie.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-cura-benedizione.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-cura-benedizione.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.54 (minima fra due semi 0.00), 29 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.50 | 7-7 | 6 | -27.1..-26.4 | 0.46 | 0 % | 9.6 | 0.00 | 1 % | 12/12 |
| 4, 5, 6 | pulito | 0.50 | 7-7 | 6 | -27.1..-26.4 | 0.36 | 0 % | 6.9 | 0.01 | 1 % | 12/12 |
| 7, 8, 9 | pulito | 0.50 | 7-7 | 7 | -26.6..-26.6 | 0.37 | 0 % | 6.9 | 0.01 | 1 % | 12/12 |
| 10, 11, 12 | pulito | 0.55 | 7-7 | 6 | -26.9..-26.6 | 0.35 | 0 % | 6.5 | 0.01 | 1 % | 12/12 |
| 13, 14, 15 | pulito | 0.48 | 7-7 | 6 | -26.9..-26.1 | 0.45 | 0 % | 10.8 | 0.00 | 0 % | 12/12 |
| 16, 17, 18 | pulito | 0.59 | 7-7 | 6 | -26.9..-26.6 | 0.36 | 0 % | 7.0 | 0.01 | 1 % | 12/12 |
| 19, 20, 21 | pulito | 0.48 | 7-7 | 6 | -26.9..-26.6 | 0.39 | 0 % | 7.7 | 0.01 | 1 % | 12/12 |
| 22, 23, 24 | pulito | 0.43 | 7-7 | 7 | -26.8..-26.6 | 0.35 | 0 % | 6.9 | 0.01 | 0 % | 12/12 |
| 25, 26, 27 | pulito | 0.57 | 7-7 | 7 | -26.6..-26.5 | 0.60 | 0 % | 6.3 | 0.01 | 1 % | 12/12 |
| 28, 29, 30 | pulito | 0.55 | 7-7 | 6 | -26.7..-26.5 | 0.63 | 0 % | 6.3 | 0.01 | 1 % | 12/12 |

## Rapporto completo: Suono: suono-effetto-cura-benedizione (semi 1, 2, 3)

12 passi, 1 battuta, ciclo di 1.50 s a 120 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: G dorian (root 55); swing 0.00, cutoff 7000 Hz, space 0.65.
Tracce: y0 lead 0.50, y1 pad 0.70.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: . . . . d5 . G5~2 A#5~2 . . . .
  y1 pad: G3~12 . A#3~10 . D4~8 . G4~6 . . . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | 42 % | 7 | G3..A#5 (27 semitoni) | 100 % | 50 % | G pentatonic_minor (0.88) | 0.82 | 0 % | 12/12 |
| 2 | 7 | 50 % | 6 | G3..G5 (24 semitoni) | 100 % | 52 % | G pentatonic_minor (0.88) | 0.82 | 0 % | 12/12 |
| 3 | 7 | 42 % | 7 | G3..A#5 (27 semitoni) | 100 % | 50 % | G pentatonic_minor (0.87) | 0.82 | 1 % | 12/12 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 3 | 0 | 3 | 3 | D5..A#5 (8 semitoni) | 25 % | 1.7 | 12/12 |
| 1 | y1 pad | 4 | 0 | 4 | 4 | G3..G4 (12 semitoni) | 33 % | 9.0 | 12/12 |
| 2 | y0 lead | 3 | 0 | 3 | 2 | D5..G5 (5 semitoni) | 25 % | 1.3 | 12/12 |
| 2 | y1 pad | 4 | 0 | 4 | 4 | G3..G4 (12 semitoni) | 33 % | 9.0 | 12/12 |
| 3 | y0 lead | 3 | 0 | 3 | 3 | E5..A#5 (6 semitoni) | 17 % | 1.7 | 12/12 |
| 3 | y1 pad | 4 | 0 | 4 | 4 | G3..G4 (12 semitoni) | 33 % | 9.0 | 12/12 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.50; y0 0.87, y1 0.00.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.50 s | -9.0 | 0.36 | -26.4 | 17.4 | 0.00 % | 0 % | 0.00 s | 11.2 | 727 | 0.00 |
| 2 | 1.50 s | -10.6 | 0.30 | -27.1 | 16.4 | 0.00 % | 0 % | 0.00 s | 9.6 | 694 | 0.00 |
| 3 | 1.50 s | -6.9 | 0.46 | -26.5 | 19.6 | 0.00 % | 0 % | 0.00 s | 13.2 | 729 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 21 % | 32 % | 41 % | 6 % | 0 % | 0 % |
| 2 | 0 % | 23 % | 29 % | 42 % | 6 % | 0 % | 0 % |
| 3 | 0 % | 21 % | 30 % | 43 % | 6 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 12×2×14, 22 nodi, 22 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, G=Ghost, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: S 34, N 6, G 1.
 #2 line 0 1 0 → 0 1 0 N: ×1, 1 celle x0 y1 z0, passi 1
  .→N 1: x0 y1 z0
 #3 line 2 1 2 → 2 1 2 N: ×1, 1 celle x2 y1 z2, passi 2
  .→N 1: x2 y1 z2
 #4 line 4 1 4 → 4 1 4 N: ×1, 1 celle x4 y1 z4, passi 3
  .→N 1: x4 y1 z4
 #5 line 6 1 7 → 6 1 7 T: ×1, 1 celle x6 y1 z7, passi 4
  .→T 1: x6 y1 z7
 #6 line 6 1 6 → 6 1 6 T: ×1, 1 celle x6 y1 z6, passi 5
  .→T 1: x6 y1 z6
 #7 one T → N passi=1: ×1, 1 celle x6 y1 z7, passi 6
  T→N 1: x6 y1 z7
 #8 all T → .: ×1, 1 celle x6 y1 z6, passi 7
  T→. 1: x6 y1 z6
 #9 all N........... → NSSSSSSSSSSS: ×1, 11 celle x1-11 y1 z0, passi 8
  .→S 11: x1-11 y1 z0
 #10 all N......... → NSSSSSSSSS: ×1, 9 celle x3-11 y1 z2, passi 9
  .→S 9: x3-11 y1 z2
 #11 all N....... → NSSSSSSS: ×1, 7 celle x5-11 y1 z4, passi 10
  .→S 7: x5-11 y1 z4
 #12 all N..... → NSSSSS: ×1, 5 celle x7-11 y1 z7, passi 11
  .→S 5: x7-11 y1 z7
 #13 line 6 0 7 → 9 0 7 U: ×1, 4 celle x6-9 y0 z7, passi 12
  .→U 4: x6-9 y0 z7
 #14 line 6 0 9 → 9 0 9 U: ×1, 4 celle x6-9 y0 z9, passi 13
  .→U 4: x6-9 y0 z9
 #15 line 7 0 11 → 9 0 11 U: ×1, 3 celle x7-9 y0 z11, passi 14
  .→U 3: x7-9 y0 z11
 #16 one U → N passi=2: ×2, 2 celle x6-7 y0 z7-9, passi 15-16
  U→N 2: x6 y0 z7; x7 y0 z9
 #17 all U → .: ×1, 9 celle x6-9 y0 z7-11, passi 17
  U→. 9: x7-9 y0 z7; x7-9 y0 z11; x8-9 y0 z9; x6 y0 z9
 #18 all N. → NS: ×1, 2 celle x7-8 y0 z7-9, passi 18
  .→S 2: x7 y0 z7; x8 y0 z9
 #19 line 4 0 4 → 4 0 4 V: ×1, 1 celle x4 y0 z4, passi 19
  .→V 1: x4 y0 z4
 #20 line 5 0 5 → 5 0 5 V: ×1, 1 celle x5 y0 z5, passi 20
  .→V 1: x5 y0 z5
 #21 one V → G passi=1: ×1, 1 celle x4 y0 z4, passi 21
  V→G 1: x4 y0 z4
 #22 all V → .: ×1, 1 celle x5 y0 z5, passi 22
  V→. 1: x5 y0 z5
```
