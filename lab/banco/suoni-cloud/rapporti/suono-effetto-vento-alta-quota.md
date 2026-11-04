# suono-effetto-vento-alta-quota

> Il vento in cima ai monti: un fischio lungo che ondeggia fra poche note, raffiche di soffio sparse, un bordone sotto. Un ciclo di due battute.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-vento-alta-quota.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-vento-alta-quota.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.84 (minima fra due semi 0.66), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.83 | 22-24 | 5 | -26.1..-26.0 | 0.56 | 18 % | 23.4 | 0.01 | 0 % | 32/32 |
| 4, 5, 6 | pulito | 0.83 | 22-25 | 7 | -26.1..-26.0 | 0.57 | 16 % | 20.9 | 0.02 | 0 % | 32/32 |
| 7, 8, 9 | pulito | 0.82 | 22-24 | 6 | -26.0..-25.9 | 0.55 | 17 % | 24.0 | 0.02 | 0 % | 32/32 |
| 10, 11, 12 | pulito | 0.88 | 20-24 | 6 | -26.1..-25.9 | 0.54 | 18 % | 21.3 | 0.00 | 0 % | 32/32 |
| 13, 14, 15 | pulito | 0.80 | 23-26 | 6 | -26.0..-25.9 | 0.55 | 15 % | 17.0 | 0.03 | 0 % | 32/32 |
| 16, 17, 18 | pulito | 0.88 | 23-24 | 5 | -26.0..-26.0 | 0.55 | 11 % | 23.0 | 0.01 | 0 % | 32/32 |
| 19, 20, 21 | pulito | 0.82 | 23-27 | 6 | -25.9..-25.9 | 0.57 | 11 % | 18.3 | 0.00 | 0 % | 32/32 |
| 22, 23, 24 | pulito | 0.87 | 23-23 | 8 | -26.0..-26.0 | 0.57 | 14 % | 22.6 | 0.00 | 0 % | 32/32 |
| 25, 26, 27 | pulito | 0.84 | 22-25 | 5 | -26.1..-25.9 | 0.55 | 11 % | 23.3 | 0.04 | 0 % | 32/32 |
| 28, 29, 30 | pulito | 0.85 | 23-25 | 7 | -26.0..-25.9 | 0.55 | 9 % | 24.0 | 0.01 | 0 % | 32/32 |

## Rapporto completo: Suono: suono-effetto-vento-alta-quota (semi 1, 2, 3)

32 passi, 2 battute, ciclo di 6.67 s a 72 bpm.
Dichiarata: D pentatonic_minor (root 50); swing 0.00, cutoff 5500 Hz, space 0.75.
Tracce: y0 pad 0.55, y1 bass 0.60, y2 bass 0.50.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 pad: . . . F4~2 . D4~3 . . . . . F4~2 . D4~3 . .
  y1 bass: K+D2!~16 . . . . . . . . . . . . . . .
  y2 bass: . . . . . . O . . H+O . . . . . .
battuta 2:
  y0 pad: C4~2 . D4~2 . F4~3 . . D4~3 . . C4~4 . . . . .
  y1 bass: D2~16+A2~16 . . . . . . . . . . . . . . .
  y2 bass: . . O O H . . . O . H . H . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 22 | 47 % | 5 | D2..F4 (27 semitoni) | 100 % | 63 % | D pentatonic_minor (0.83) | 0.83 | 0 % | 32/32 |
| 2 | 24 | 50 % | 7 | D2..C5 (34 semitoni) | 100 % | 51 % | D pentatonic_minor (0.91) | 0.91 | 0 % | 32/32 |
| 3 | 24 | 53 % | 5 | D2..A4 (31 semitoni) | 100 % | 48 % | D pentatonic_minor (0.91) | 0.91 | 0 % | 32/32 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 pad | 9 | 0 | 4 5 | 3 | C4..F4 (5 semitoni) | 28 % | 2.7 | 32/32 |
| 1 | y1 bass | 3 | 1 | 2 2 | 2 | D2..A2 (7 semitoni) | 6 % | 16.0 | 32/32 |
| 1 | y2 bass | 0 | 9 | 3 6 | 0 | - | 25 % | 0.0 | 32/32 |
| 2 | y0 pad | 11 | 0 | 5 6 | 5 | D4..C5 (10 semitoni) | 34 % | 2.5 | 32/32 |
| 2 | y1 bass | 3 | 1 | 2 2 | 2 | D2..A2 (7 semitoni) | 6 % | 16.0 | 32/32 |
| 2 | y2 bass | 0 | 9 | 4 5 | 0 | - | 28 % | 0.0 | 32/32 |
| 3 | y0 pad | 11 | 0 | 7 4 | 3 | F4..A4 (4 semitoni) | 34 % | 2.5 | 32/32 |
| 3 | y1 bass | 3 | 1 | 2 2 | 2 | D2..A2 (7 semitoni) | 6 % | 16.0 | 32/32 |
| 3 | y2 bass | 0 | 9 | 3 6 | 0 | - | 25 % | 0.0 | 32/32 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.83; y0 0.93, y1 0.00, y2 0.91.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6.67 s | -5.4 | 0.54 | -26.1 | 20.7 | 0.00 % | 18 % | 0.27 s | 30.8 | 163 | 0.00 |
| 2 | 6.67 s | -5.1 | 0.56 | -26.0 | 20.9 | 0.00 % | 10 % | 0.16 s | 23.4 | 181 | 0.01 |
| 3 | 6.67 s | -5.3 | 0.54 | -26.0 | 20.7 | 0.00 % | 15 % | 0.33 s | 25.1 | 185 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 87 % | 8 % | 4 % | 0 % | 0 % | 0 % |
| 2 | 0 % | 86 % | 8 % | 5 % | 0 % | 0 % | 0 % |
| 3 | 0 % | 86 % | 9 % | 5 % | 0 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 32×3×12, 18 nodi, 34 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, H=Hi-hat, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore), M=Scelta (marcatore).
Alla fine: S 60, N 11, H 9, A 1.
 #2 line 0 1 0 → 0 1 0 A: ×1, 1 celle x0 y1 z0, passi 1
  .→A 1: x0 y1 z0
 #3 line 16 1 0 → 16 1 0 N: ×1, 1 celle x16 y1 z0, passi 2
  .→N 1: x16 y1 z0
 #4 line 16 1 3 → 16 1 3 T: ×1, 1 celle x16 y1 z3, passi 3
  .→T 1: x16 y1 z3
 #5 line 16 1 2 → 16 1 2 T: ×1, 1 celle x16 y1 z2, passi 4
  .→T 1: x16 y1 z2
 #6 one T → N passi=1: ×1, 1 celle x16 y1 z3, passi 5
  T→N 1: x16 y1 z3
 #7 all T → .: ×1, 1 celle x16 y1 z2, passi 6
  T→. 1: x16 y1 z2
 #8 all A............... → ASSSSSSSSSSSSSSS: ×1, 15 celle x1-15 y1 z0, passi 7
  .→S 15: x1-15 y1 z0
 #9 all N............... → NSSSSSSSSSSSSSSS: ×1, 30 celle x17-31 y1 z0-3, passi 8
  .→S 30: x17-31 y1 z0; x17-31 y1 z3
 #10 line 0 0 6 → 0 0 6 M: ×1, 1 celle x0 y0 z6, passi 9
  .→M 1: x0 y0 z6
 #11 one **. M.. → **M NS. (+5): ×11, 37 celle x0-30 y0 z4-6, passi 10-20
   r1 **. M.. → **M NS. ×2; r2 M.. **. → NS. **M ×2; r3 M.... → NSSSM ×1; r4 ***. M... → ***M NSS. ×1; r5 M... ***. → NSS. ***M ×3; r6 M... → ...M ×2
  .→S 15: x27-29 y0 z4; x6-7 y0 z5; x14-15 y0 z5; x24-25 y0 z5; +5 scatole, 6 celle
  .→N 9: x16 y0 z4; x26 y0 z4; x5 y0 z5; x13 y0 z5; +5 scatole, 5 celle
  .→M 1: x30 y0 z4
  M→. 1: x0 y0 z6
 #12 all M → .: ×1, 1 celle x30 y0 z4, passi 21
  M→. 1: x30 y0 z4
 #13 line 1 2 4 → 31 2 4 U: ×1, 31 celle x1-31 y2 z4, passi 22
  .→U 31: x1-31 y2 z4
 #14 one U → H passi=5: ×5, 5 celle x6-24 y2 z4, passi 23-27
  U→H 5: x18-19 y2 z4; x6 y2 z4; x9 y2 z4; x24 y2 z4
 #15 all U → .: ×1, 26 celle x1-31 y2 z4, passi 28
  U→. 26: x10-17 y2 z4; x25-31 y2 z4; x1-5 y2 z4; x20-23 y2 z4; +1 scatole, 2 celle
 #16 line 0 2 1 → 31 2 1 V: ×1, 32 celle x0-31 y2 z1, passi 29
  .→V 32: x0-31 y2 z1
 #17 one V → H passi=4: ×4, 4 celle x9-28 y2 z1, passi 30-33
  V→H 4: x9 y2 z1; x20 y2 z1; x26 y2 z1; x28 y2 z1
 #18 all V → .: ×1, 28 celle x0-31 y2 z1, passi 34
  V→. 28: x10-19 y2 z1; x0-8 y2 z1; x21-25 y2 z1; x29-31 y2 z1; +1 scatole, 1 celle
```
