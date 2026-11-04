# suono-effetto-scarica-elettrica

> Una scarica elettrica: lampi di note seghettate in sedicesimi su altezze impazzite, il crepitio, il colpo finale.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-scarica-elettrica.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-scarica-elettrica.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.72 (minima fra due semi 0.40), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.76 | 12-12 | 3 | -23.2..-23.0 | 0.98 | 30 % | 20.2 | 0.00 | 0 % | 10/10 |
| 4, 5, 6 | pulito | 0.63 | 12-12 | 3 | -23.3..-23.1 | 0.64 | 24 % | 21.1 | 0.00 | 100 % | 10/10 |
| 7, 8, 9 | pulito | 0.71 | 12-12 | 3 | -23.7..-23.0 | 1.06 | 23 % | 20.5 | 0.00 | 0 % | 10/10 |
| 10, 11, 12 | pulito | 0.69 | 12-12 | 3 | -23.0..-22.8 | 0.94 | 28 % | 19.8 | 0.00 | 0 % | 10/10 |
| 13, 14, 15 | pulito | 0.76 | 12-12 | 3 | -23.9..-23.0 | 1.09 | 22 % | 21.5 | 0.00 | 100 % | 10/10 |
| 16, 17, 18 | pulito | 0.71 | 12-12 | 3 | -23.2..-23.1 | 0.85 | 29 % | 25.4 | 0.00 | 25 % | 10/10 |
| 19, 20, 21 | pulito | 0.76 | 12-12 | 3 | -23.2..-23.0 | 1.00 | 24 % | 22.9 | 0.00 | 0 % | 10/10 |
| 22, 23, 24 | pulito | 0.73 | 12-12 | 3 | -23.1..-22.9 | 0.93 | 29 % | 19.2 | 0.00 | 100 % | 10/10 |
| 25, 26, 27 | pulito | 0.70 | 12-12 | 4 | -23.2..-23.0 | 0.92 | 35 % | 22.0 | 0.00 | 0 % | 10/10 |
| 28, 29, 30 | pulito | 0.75 | 12-12 | 3 | -23.1..-22.9 | 0.88 | 27 % | 17.8 | 0.00 | 100 % | 10/10 |

## Rapporto completo: Suono: suono-effetto-scarica-elettrica (semi 1, 2, 3)

10 passi, 1 battuta, ciclo di 0.79 s a 190 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: E phrygian (root 52); swing 0.00, cutoff 11000 Hz, space 0.30.
Tracce: y0 lead 0.50, y1 bass 0.65.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: B4!+G5! . B5! E5!+B5! . . . . . .
  y1 bass: C H . H . . H K+H+C . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 12 | 60 % | 4 | B4..B5 (12 semitoni) | 100 % | 20 % | E pentatonic_minor (0.74) | 0.68 | 0 % | 10/10 |
| 2 | 12 | 80 % | 3 | C5..G5 (7 semitoni) | 100 % | 20 % | C pentatonic_minor (0.71) | 0.44 | 0 % | 10/10 |
| 3 | 12 | 90 % | 3 | B4..G5 (8 semitoni) | 100 % | 20 % | E pentatonic_minor (0.77) | 0.71 | 0 % | 10/10 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 5 | 0 | 5 | 4 | B4..B5 (12 semitoni) | 30 % | 1.0 | 10/10 |
| 1 | y1 bass | 0 | 7 | 7 | 0 | - | 50 % | 0.0 | 10/10 |
| 2 | y0 lead | 5 | 0 | 5 | 3 | C5..G5 (7 semitoni) | 40 % | 1.0 | 10/10 |
| 2 | y1 bass | 0 | 7 | 7 | 0 | - | 50 % | 0.0 | 10/10 |
| 3 | y0 lead | 5 | 0 | 5 | 3 | B4..G5 (8 semitoni) | 30 % | 1.0 | 10/10 |
| 3 | y1 bass | 0 | 7 | 7 | 0 | - | 60 % | 0.0 | 10/10 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.76; y0 0.93, y1 0.59.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.79 s | -0.2 | 0.98 | -23.0 | 22.8 | 0.00 % | 30 % | 0.07 s | 31.9 | 1341 | 0.00 |
| 2 | 0.79 s | -3.9 | 0.64 | -23.1 | 19.2 | 0.00 % | 19 % | 0.04 s | 24.2 | 1107 | 0.00 |
| 3 | 0.79 s | -6.1 | 0.50 | -23.2 | 17.1 | 0.00 % | 24 % | 0.06 s | 20.2 | 958 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 3 % | 64 % | 8 % | 10 % | 3 % | 4 % | 7 % |
| 2 | 3 % | 59 % | 13 % | 11 % | 5 % | 4 % | 5 % |
| 3 | 2 % | 60 % | 14 % | 11 % | 5 % | 3 % | 4 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 10×2×12, 17 nodi, 23 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: A=Accento, K=Kick, H=Hi-hat, C=Rullante, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: A 5, H 4, C 2, K 1.
 #2 line 0 0 4 → 6 0 4 T: ×1, 7 celle x0-6 y0 z4, passi 1
  .→T 7: x0-6 y0 z4
 #3 line 0 0 7 → 6 0 7 T: ×1, 7 celle x0-6 y0 z7, passi 2
  .→T 7: x0-6 y0 z7
 #4 line 0 0 9 → 6 0 9 T: ×1, 7 celle x0-6 y0 z9, passi 3
  .→T 7: x0-6 y0 z9
 #5 line 0 0 11 → 6 0 11 T: ×1, 7 celle x0-6 y0 z11, passi 4
  .→T 7: x0-6 y0 z11
 #6 line 0 0 5 → 6 0 5 T: ×1, 7 celle x0-6 y0 z5, passi 5
  .→T 7: x0-6 y0 z5
 #7 one T → A passi=5: ×5, 5 celle x0-3 y0 z4-11, passi 6-10
  T→A 5: x2-3 y0 z11; x0 y0 z4; x3 y0 z7; x0 y0 z9
 #8 all T → .: ×1, 30 celle x0-6 y0 z4-11, passi 11
  T→. 30: x1-6 y0 z4-5; x1-6 y0 z9; x0-2 y0 z7; x4-6 y0 z7; +3 scatole, 6 celle
 #9 line 0 1 1 → 7 1 1 U: ×1, 8 celle x0-7 y1 z1, passi 12
  .→U 8: x0-7 y1 z1
 #10 one U → H passi=4: ×4, 4 celle x1-7 y1 z1, passi 13-16
  U→H 4: x6-7 y1 z1; x1 y1 z1; x3 y1 z1
 #11 all U → .: ×1, 4 celle x0-5 y1 z1, passi 17
  U→. 4: x4-5 y1 z1; x0 y1 z1; x2 y1 z1
 #12 line 0 1 2 → 0 1 2 C: ×1, 1 celle x0 y1 z2, passi 18
  .→C 1: x0 y1 z2
 #13 line 7 1 2 → 7 1 2 V: ×1, 1 celle x7 y1 z2, passi 19
  .→V 1: x7 y1 z2
 #14 line 8 1 2 → 8 1 2 V: ×1, 1 celle x8 y1 z2, passi 20
  .→V 1: x8 y1 z2
 #15 one V → C passi=1: ×1, 1 celle x7 y1 z2, passi 21
  V→C 1: x7 y1 z2
 #16 all V → .: ×1, 1 celle x8 y1 z2, passi 22
  V→. 1: x8 y1 z2
 #17 line 7 1 0 → 7 1 0 K: ×1, 1 celle x7 y1 z0, passi 23
  .→K 1: x7 y1 z0
```
