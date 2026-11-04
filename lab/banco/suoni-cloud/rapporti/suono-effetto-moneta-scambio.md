# suono-effetto-moneta-scambio

> Una moneta che passa di mano: due note brillanti in fretta, la seconda più alta; il seme sceglie il salto e un tintinnio in coda.

Sorgente: `lab/banco/suoni-cloud/effetti/suono-effetto-moneta-scambio.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/effetti/suono-effetto-moneta-scambio.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.60 (minima fra due semi 0.00), 15 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.40 | 4-4 | 2 | -26.4..-26.2 | 0.37 | 12 % | 23.4 | 0.01 | 0 % | 6/6 |
| 4, 5, 6 | pulito | 0.44 | 4-4 | 2 | -26.4..-26.3 | 0.39 | 12 % | 23.6 | 0.01 | 0 % | 6/6 |
| 7, 8, 9 | pulito | 0.40 | 4-4 | 2 | -26.3..-26.2 | 0.40 | 12 % | 23.1 | 0.01 | 0 % | 6/6 |
| 10, 11, 12 | pulito | 0.73 | 4-4 | 2 | -26.3..-26.1 | 0.40 | 12 % | 23.1 | 0.00 | 0 % | 6/6 |
| 13, 14, 15 | pulito | 0.44 | 4-4 | 2 | -26.4..-26.3 | 0.39 | 12 % | 23.5 | 0.00 | 0 % | 6/6 |
| 16, 17, 18 | pulito | 0.64 | 4-4 | 2 | -26.4..-26.4 | 0.39 | 12 % | 23.6 | 0.01 | 0 % | 6/6 |
| 19, 20, 21 | pulito | 0.73 | 4-4 | 2 | -26.4..-26.3 | 0.39 | 12 % | 23.4 | 0.00 | 0 % | 6/6 |
| 22, 23, 24 | pulito | 0.49 | 4-4 | 2 | -26.5..-26.4 | 0.39 | 12 % | 23.4 | 0.01 | 0 % | 6/6 |
| 25, 26, 27 | pulito | 0.64 | 4-4 | 2 | -26.5..-26.2 | 0.39 | 12 % | 23.1 | 0.01 | 0 % | 6/6 |
| 28, 29, 30 | pulito | 0.67 | 4-4 | 2 | -26.5..-26.2 | 0.39 | 12 % | 23.1 | 0.01 | 0 % | 6/6 |

## Rapporto completo: Suono: suono-effetto-moneta-scambio (semi 1, 2, 3)

6 passi, 1 battuta, ciclo di 0.51 s a 176 bpm (meno di una battuta: un effetto, non si misura come un brano).
Dichiarata: E dorian (root 64); swing 0.00, cutoff 12000 Hz, space 0.40.
Tracce: y0 lead 0.55, y1 bass 0.50.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
  y0 lead: C#6 E6!~4 . . . .
  y1 bass: H . . . O .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 4 | 50 % | 2 | C#6..E6 (3 semitoni) | 100 % | 85 % | E dorian (0.62) | 0.62 | 0 % | 6/6 |
| 2 | 4 | 50 % | 2 | C#6..E6 (3 semitoni) | 100 % | 85 % | E dorian (0.62) | 0.62 | 0 % | 6/6 |
| 3 | 4 | 50 % | 2 | C#6..E6 (3 semitoni) | 100 % | 85 % | E dorian (0.62) | 0.62 | 0 % | 6/6 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 2 | 0 | 2 | 2 | C#6..E6 (3 semitoni) | 33 % | 2.5 | 6/6 |
| 1 | y1 bass | 0 | 2 | 2 | 0 | - | 33 % | 0.0 | 6/6 |
| 2 | y0 lead | 2 | 0 | 2 | 2 | C#6..E6 (3 semitoni) | 33 % | 2.5 | 6/6 |
| 2 | y1 bass | 0 | 2 | 2 | 0 | - | 33 % | 0.0 | 3/6 |
| 3 | y0 lead | 2 | 0 | 2 | 2 | C#6..E6 (3 semitoni) | 33 % | 2.5 | 6/6 |
| 3 | y1 bass | 0 | 2 | 2 | 0 | - | 33 % | 0.0 | 6/6 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.40; y0 0.00, y1 0.67.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.51 s | -8.6 | 0.37 | -26.2 | 17.6 | 0.00 % | 12 % | 0.03 s | 23.4 | 2317 | 0.01 |
| 2 | 0.51 s | -8.6 | 0.37 | -26.4 | 17.8 | 0.00 % | 12 % | 0.03 s | 24.0 | 1979 | 0.01 |
| 3 | 0.51 s | -8.6 | 0.37 | -26.4 | 17.8 | 0.00 % | 12 % | 0.03 s | 23.8 | 1977 | 0.01 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 0 % | 0 % | 74 % | 11 % | 9 % | 6 % |
| 2 | 0 % | 0 % | 0 % | 77 % | 11 % | 9 % | 3 % |
| 3 | 0 % | 0 % | 0 % | 77 % | 11 % | 9 % | 3 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 6×2×12, 17 nodi, 16 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, H=Hi-hat, T=Scelta (marcatore), U=Scelta (marcatore), V=Scelta (marcatore).
Alla fine: S 3, H 2, N 1, A 1.
 #2 line 0 0 4 → 0 0 4 T: ×1, 1 celle x0 y0 z4, passi 1
  .→T 1: x0 y0 z4
 #3 line 0 0 5 → 0 0 5 T: ×1, 1 celle x0 y0 z5, passi 2
  .→T 1: x0 y0 z5
 #4 one T → N passi=1: ×1, 1 celle x0 y0 z5, passi 3
  T→N 1: x0 y0 z5
 #5 all T → .: ×1, 1 celle x0 y0 z4, passi 4
  T→. 1: x0 y0 z4
 #6 line 1 0 7 → 1 0 7 U: ×1, 1 celle x1 y0 z7, passi 5
  .→U 1: x1 y0 z7
 #7 line 1 0 8 → 1 0 8 U: ×1, 1 celle x1 y0 z8, passi 6
  .→U 1: x1 y0 z8
 #8 line 1 0 9 → 1 0 9 U: ×1, 1 celle x1 y0 z9, passi 7
  .→U 1: x1 y0 z9
 #9 one U → A passi=1: ×1, 1 celle x1 y0 z7, passi 8
  U→A 1: x1 y0 z7
 #10 all U → .: ×1, 2 celle x1 y0 z8-9, passi 9
  U→. 2: x1 y0 z8-9
 #11 all A... → ASSS: ×1, 3 celle x2-4 y0 z7, passi 10
  .→S 3: x2-4 y0 z7
 #12 line 0 1 1 → 0 1 1 H: ×1, 1 celle x0 y1 z1, passi 11
  .→H 1: x0 y1 z1
 #13 line 2 1 1 → 2 1 1 V: ×1, 1 celle x2 y1 z1, passi 12
  .→V 1: x2 y1 z1
 #14 line 3 1 1 → 3 1 1 V: ×1, 1 celle x3 y1 z1, passi 13
  .→V 1: x3 y1 z1
 #15 line 4 1 4 → 4 1 4 V: ×1, 1 celle x4 y1 z4, passi 14
  .→V 1: x4 y1 z4
 #16 one V → H passi=1: ×1, 1 celle x4 y1 z4, passi 15
  V→H 1: x4 y1 z4
 #17 all V → .: ×1, 2 celle x2-3 y1 z1, passi 16
  V→. 2: x2-3 y1 z1
```
