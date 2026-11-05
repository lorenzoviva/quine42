# suono-effetto-fuoco-scoppiettante

> Un fuoco che scoppietta: un tepore basso che resta, schiocchi brevi e scintille acute dove il seme vuole. Una battuta che gira.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-fuoco-scoppiettante.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-fuoco-scoppiettante.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.83 (minima fra due semi 0.67), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.81 | 16-16 | 7 | -30.2..-30.0 | 0.41 | 11 % | 15.6 | 0.00 | 1 % | 16/16 |
| 4, 5, 6 | pulito | 0.80 | 16-16 | 6 | -30.1..-29.9 | 0.35 | 10 % | 14.4 | 0.00 | 0 % | 16/16 |
| 7, 8, 9 | pulito | 0.81 | 16-16 | 6 | -30.1..-30.0 | 0.38 | 12 % | 14.3 | 0.00 | 1 % | 16/16 |
| 10, 11, 12 | pulito | 0.78 | 16-16 | 5 | -30.1..-30.0 | 0.40 | 11 % | 14.2 | 0.00 | 0 % | 16/16 |
| 13, 14, 15 | pulito | 0.84 | 16-16 | 6 | -30.1..-29.9 | 0.45 | 13 % | 15.6 | 0.00 | 2 % | 16/16 |
| 16, 17, 18 | pulito | 0.86 | 16-16 | 6 | -30.1..-30.0 | 0.36 | 11 % | 11.1 | 0.00 | 1 % | 16/16 |
| 19, 20, 21 | pulito | 0.84 | 16-16 | 6 | -30.2..-29.9 | 0.40 | 11 % | 13.1 | 0.00 | 2 % | 16/16 |
| 22, 23, 24 | pulito | 0.86 | 16-16 | 6 | -30.1..-29.8 | 0.49 | 10 % | 14.3 | 0.00 | 1 % | 16/16 |
| 25, 26, 27 | pulito | 0.80 | 16-16 | 6 | -30.1..-29.9 | 0.39 | 12 % | 14.9 | 0.00 | 1 % | 16/16 |
| 28, 29, 30 | pulito | 0.81 | 16-16 | 7 | -30.2..-30.0 | 0.44 | 9 % | 11.4 | 0.00 | 2 % | 16/16 |

## Rapporto completo: Suono: suono-effetto-fuoco-scoppiettante (semi 1, 2, 3)

16 passi, 1 battuta, ciclo di 2.50 s a 96 bpm.
Dichiarata: A dorian (root 45); swing 0.00, cutoff 6000 Hz, space 0.50.
Tracce: y0 lead 0.42, y1 pad 0.50, y2 bass 0.60.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: . A4 A4 . . . . . . . . . b4+e5 . c5 c5
  y1 pad: A2~15+E3~15 . . . . . . . C3~8 . . . . . . .
  y2 bass: . . . H . . C H H . . C . . H H

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 16 | 69 % | 7 | A2..E5 (31 semitoni) | 100 % | 40 % | A hirajoshi (0.91) | 0.85 | 1 % | 16/16 |
| 2 | 16 | 63 % | 7 | A2..E5 (31 semitoni) | 100 % | 40 % | A pentatonic_minor (0.86) | 0.80 | 0 % | 16/16 |
| 3 | 16 | 63 % | 8 | A2..E5 (31 semitoni) | 100 % | 40 % | A pentatonic_minor (0.85) | 0.80 | 0 % | 16/16 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 6 | 0 | 6 | 4 | A4..E5 (7 semitoni) | 31 % | 1.0 | 16/16 |
| 1 | y1 pad | 3 | 0 | 3 | 3 | A2..E3 (7 semitoni) | 13 % | 12.7 | 16/16 |
| 1 | y2 bass | 0 | 7 | 7 | 0 | - | 44 % | 0.0 | 16/16 |
| 2 | y0 lead | 6 | 0 | 6 | 4 | G4..E5 (9 semitoni) | 38 % | 1.0 | 16/16 |
| 2 | y1 pad | 3 | 0 | 3 | 3 | A2..E3 (7 semitoni) | 13 % | 12.7 | 16/16 |
| 2 | y2 bass | 0 | 7 | 7 | 0 | - | 38 % | 0.0 | 16/16 |
| 3 | y0 lead | 6 | 0 | 6 | 5 | G4..E5 (9 semitoni) | 31 % | 1.0 | 16/16 |
| 3 | y1 pad | 3 | 0 | 3 | 3 | A2..E3 (7 semitoni) | 13 % | 12.7 | 16/16 |
| 3 | y2 bass | 0 | 7 | 7 | 0 | - | 44 % | 0.0 | 16/16 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.81; y0 0.94, y1 0.33, y2 0.83.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2.50 s | -9.7 | 0.33 | -30.0 | 20.3 | 0.00 % | 8 % | 0.09 s | 15.6 | 839 | 0.00 |
| 2 | 2.50 s | -7.6 | 0.41 | -30.2 | 22.5 | 0.00 % | 11 % | 0.14 s | 19.8 | 840 | 0.00 |
| 3 | 2.50 s | -8.9 | 0.36 | -30.0 | 21.1 | 0.00 % | 5 % | 0.05 s | 18.7 | 892 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 45 % | 23 % | 23 % | 3 % | 5 % | 1 % |
| 2 | 0 % | 47 % | 25 % | 20 % | 3 % | 5 % | 1 % |
| 3 | 0 % | 46 % | 22 % | 21 % | 4 % | 6 % | 1 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 16×3×12, 25 nodi, 33 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, G=Ghost, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), P=Scelta (marcatore), M=Scelta (marcatore).
Alla fine: S 35, N 5, H 5, G 4, C 2.
 #2 line 0 1 0 → 0 1 0 N: ×1, 1 celle x0 y1 z0, passi 1
  .→N 1: x0 y1 z0
 #3 line 0 1 4 → 0 1 4 N: ×1, 1 celle x0 y1 z4, passi 2
  .→N 1: x0 y1 z4
 #4 line 8 1 2 → 8 1 2 T: ×1, 1 celle x8 y1 z2, passi 3
  .→T 1: x8 y1 z2
 #5 line 8 1 1 → 8 1 1 T: ×1, 1 celle x8 y1 z1, passi 4
  .→T 1: x8 y1 z1
 #6 line 8 1 3 → 8 1 3 T: ×1, 1 celle x8 y1 z3, passi 5
  .→T 1: x8 y1 z3
 #7 one T → N passi=1: ×1, 1 celle x8 y1 z2, passi 6
  T→N 1: x8 y1 z2
 #8 all T → .: ×1, 2 celle x8 y1 z1-3, passi 7
  T→. 2: x8 y1 z1; x8 y1 z3
 #9 all N.............. → NSSSSSSSSSSSSSS: ×1, 28 celle x1-14 y1 z0-4, passi 8
  .→S 28: x1-14 y1 z0; x1-14 y1 z4
 #10 all N....... → NSSSSSSS: ×1, 7 celle x9-15 y1 z2, passi 9
  .→S 7: x9-15 y1 z2
 #11 line 0 2 1 → 15 2 1 U: ×1, 16 celle x0-15 y2 z1, passi 10
  .→U 16: x0-15 y2 z1
 #12 one U → H passi=5: ×5, 5 celle x3-15 y2 z1, passi 11-15
  U→H 5: x7-8 y2 z1; x14-15 y2 z1; x3 y2 z1
 #13 all U → .: ×1, 11 celle x0-13 y2 z1, passi 16
  U→. 11: x9-13 y2 z1; x0-2 y2 z1; x4-6 y2 z1
 #14 line 1 2 2 → 15 2 2 V: ×1, 15 celle x1-15 y2 z2, passi 17
  .→V 15: x1-15 y2 z2
 #15 one V → C passi=2: ×2, 2 celle x6-11 y2 z2, passi 18-19
  V→C 2: x6 y2 z2; x11 y2 z2
 #16 all V → .: ×1, 13 celle x1-15 y2 z2, passi 20
  V→. 13: x1-5 y2 z2; x7-10 y2 z2; x12-15 y2 z2
 #17 line 0 0 6 → 15 0 6 P: ×1, 16 celle x0-15 y0 z6, passi 21
  .→P 16: x0-15 y0 z6
 #18 line 0 0 8 → 15 0 8 P: ×1, 16 celle x0-15 y0 z8, passi 22
  .→P 16: x0-15 y0 z8
 #19 line 0 0 9 → 15 0 9 P: ×1, 16 celle x0-15 y0 z9, passi 23
  .→P 16: x0-15 y0 z9
 #20 line 0 0 11 → 15 0 11 P: ×1, 16 celle x0-15 y0 z11, passi 24
  .→P 16: x0-15 y0 z11
 #21 one P → G passi=4: ×4, 4 celle x12-15 y0 z8-11, passi 25-28
  P→G 4: x14-15 y0 z9; x12 y0 z8; x12 y0 z11
 #22 all P → .: ×1, 60 celle x0-15 y0 z6-11, passi 29
  P→. 60: x0-11 y0 z8-9; x0-15 y0 z6; x0-11 y0 z11; x13-15 y0 z8; +2 scatole, 5 celle
 #23 line 0 0 7 → 15 0 7 M: ×1, 16 celle x0-15 y0 z7, passi 30
  .→M 16: x0-15 y0 z7
 #24 one M → N passi=2: ×2, 2 celle x1-2 y0 z7, passi 31-32
  M→N 2: x1-2 y0 z7
 #25 all M → .: ×1, 14 celle x0-15 y0 z7, passi 33
  M→. 14: x3-15 y0 z7; x0 y0 z7
```
