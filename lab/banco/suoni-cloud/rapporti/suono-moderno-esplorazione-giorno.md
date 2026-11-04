# suono-moderno-esplorazione-giorno

> Moderno, la città di giorno: cassa dritta leggera, hi-hat in levare, un basso sincopato e un synth che fischietta.

Sorgente: `lab/banco/suoni-cloud/moderno/suono-moderno-esplorazione-giorno.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/moderno/suono-moderno-esplorazione-giorno.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.73 (minima fra due semi 0.53), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.71 | 222-227 | 22 | -23.2..-22.1 | 1.06 | 12 % | 22.8 | 0.02 | 10 % | 128/128 |
| 4, 5, 6 | pulito | 0.78 | 214-236 | 23 | -22.9..-22.3 | 1.06 | 12 % | 26.1 | 0.00 | 9 % | 128/128 |
| 7, 8, 9 | pulito | 0.76 | 200-219 | 22 | -24.3..-22.8 | 1.17 | 16 % | 27.0 | 0.00 | 17 % | 128/128 |
| 10, 11, 12 | pulito | 0.73 | 208-219 | 22 | -23.1..-22.6 | 1.06 | 15 % | 25.6 | 0.00 | 11 % | 128/128 |
| 13, 14, 15 | pulito | 0.73 | 193-224 | 19 | -23.4..-22.2 | 1.06 | 18 % | 25.3 | 0.01 | 12 % | 128/128 |
| 16, 17, 18 | pulito | 0.73 | 211-224 | 20 | -23.6..-21.8 | 1.16 | 14 % | 25.6 | 0.01 | 3 % | 128/128 |
| 19, 20, 21 | pulito | 0.73 | 215-230 | 22 | -23.0..-22.4 | 1.06 | 13 % | 24.6 | 0.00 | 14 % | 128/128 |
| 22, 23, 24 | pulito | 0.76 | 213-220 | 22 | -23.8..-22.6 | 1.19 | 14 % | 24.8 | 0.00 | 12 % | 128/128 |
| 25, 26, 27 | pulito | 0.76 | 206-233 | 23 | -23.3..-22.5 | 1.09 | 14 % | 22.1 | 0.01 | 9 % | 128/128 |
| 28, 29, 30 | pulito | 0.76 | 210-220 | 19 | -23.0..-22.5 | 1.05 | 12 % | 21.7 | 0.00 | 14 % | 128/128 |

## Rapporto completo: Suono: suono-moderno-esplorazione-giorno (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 17.14 s a 112 bpm.
Dichiarata: A dorian (root 45); swing 0.10, cutoff 5200 Hz, space 0.35.
Tracce: y0 lead 0.48, y1 pad 0.42, y2 bass 0.62, y3 bass 0.55.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: A4~2 . . . g4 A4~2 . G4~3 . . G4 E4~3 . . E4~2 .
  y1 pad: . . A2~2+C3~2+E3~2 . . . A2~2+C3~2+E3~2 . . . A2~2+C3~2+E3~2 . . . . .
  y2 bass: K+A1! . A1 . . A1 . E2 . E2 . A1 . . A2 .
  y3 bass: K . H . K . H H K . H . K . H .
battuta 2:
  y0 lead: F#4~2 . E4~2 . D4~2 . E4~2 . . . F#4 . . . . A4~3
  y1 pad: . . D3~2+F#3~2+A3~2 . . . D3~2+F#3~2+A3~2 . . . D3~2+F#3~2+A3~2 . . . . .
  y2 bass: D2! . . D2 . . A2 . D2! . . . F#2 . D2 .
  y3 bass: K . H . . . H . K . H . . . H .
battuta 3:
  y0 lead: . . A4 . . C5 E5~2 . . . A4~2 . B4~2 . C5 A4!~3
  y1 pad: . . B2~2+D3~2+F#3~2 . . . B2~2+D3~2+F#3~2 . . . B2~2+D3~2+F#3~2 . . . . .
  y2 bass: B1! . . B1 . . F#2 . B1! . . . D2 . B1 .
  y3 bass: K . H . K . H H K . H . K . H .
battuta 4:
  y0 lead: . . A4 . . . . . . . . . . . . .
  y1 pad: . . E3~2+G3~2+B3~2 . . . E3~2+G3~2+B3~2 . . . E3~2+G3~2+B3~2 . . . . .
  y2 bass: E2! . E2 . . E2 . B2 . B2 . E2 . . E3 .
  y3 bass: K . H . K C H . K . H . K C H H
battuta 5:
  y0 lead: . . . . . C5!~2 . . . . . . . . . D5~2
  y1 pad: A2~6+C3~6+E3~6 . . . . . . . A2~6+C3~6+E3~6 . . . . . . .
  y2 bass: K+A1! . A1 . . A1 . E2 . E2 . A1 . . A2 .
  y3 bass: K . H . K . H H K . H . K . H .
battuta 6:
  y0 lead: . C5 A4 C5~2 . B4 . . . . E5~2 . . . A4!~2 .
  y1 pad: D3~6+F#3~6+A3~6 . . . . . . . D3~6+F#3~6+A3~6 . . . . . . .
  y2 bass: D2! . D2 . . D2 . A2 . A2 . D2 . . D3 .
  y3 bass: K . H . K . H H K . H . K . H .
battuta 7:
  y0 lead: B4~2 . A4 D5~3 . . . . D5 . . . . . . A4~3
  y1 pad: A2~6+C3~6+E3~6 . . . . . . . A2~6+C3~6+E3~6 . . . . . . .
  y2 bass: K+A1! . A1 . . A1 . E2 . E2 . A1 . . A2 .
  y3 bass: K . H . K . H . K . H . K . H .
battuta 8:
  y0 lead: . . . . A4 . . D5~2 . E5! . . c5 . . .
  y1 pad: . . D3~2+F#3~2+A3~2 . . . D3~2+F#3~2+A3~2 . . . D3~2+F#3~2+A3~2 . . . . .
  y2 bass: D2! . D2 . . D2 . A2 . A2 . D2 . . D3 .
  y3 bass: K . H . K . H . K . H . K . H .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 227 | 79 % | 23 | A1..E5 (43 semitoni) | 100 % | 31 % | A dorian (0.92) | 0.92 | 2 % | 128/128 |
| 2 | 226 | 80 % | 24 | A1..E5 (43 semitoni) | 100 % | 24 % | A dorian (0.93) | 0.93 | 9 % | 128/128 |
| 3 | 222 | 78 % | 22 | A1..E5 (43 semitoni) | 100 % | 25 % | A dorian (0.90) | 0.90 | 10 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 38 | 0 | 7 6 7 1 2 6 5 4 | 9 | D4..E5 (14 semitoni) | 30 % | 1.8 | 128/128 |
| 1 | y1 pad | 63 | 0 | 9 9 9 9 6 6 6 9 | 9 | A2..B3 (14 semitoni) | 16 % | 3.1 | 128/128 |
| 1 | y2 bass | 54 | 3 | 8 6 6 7 8 7 8 7 | 9 | A1..E3 (19 semitoni) | 42 % | 1.0 | 128/128 |
| 1 | y3 bass | 0 | 69 | 9 6 9 11 9 9 8 8 | 0 | - | 54 % | 0.0 | 128/128 |
| 2 | y0 lead | 45 | 0 | 7 6 5 5 4 6 7 5 | 9 | D4..E5 (14 semitoni) | 35 % | 1.6 | 128/128 |
| 2 | y1 pad | 54 | 0 | 4 9 4 9 9 9 4 6 | 9 | A2..C4 (15 semitoni) | 13 % | 5.1 | 128/128 |
| 2 | y2 bass | 50 | 5 | 8 6 8 6 6 7 6 8 | 8 | A1..C3 (15 semitoni) | 39 % | 1.0 | 128/128 |
| 2 | y3 bass | 0 | 72 | 9 9 8 9 9 11 8 9 | 0 | - | 56 % | 0.0 | 128/128 |
| 3 | y0 lead | 39 | 0 | 6 4 3 6 6 5 4 5 | 8 | E4..E5 (12 semitoni) | 30 % | 1.7 | 128/128 |
| 3 | y1 pad | 61 | 0 | 9 9 9 9 6 9 6 4 | 9 | A2..E4 (19 semitoni) | 16 % | 3.6 | 128/128 |
| 3 | y2 bass | 49 | 5 | 8 7 7 7 8 6 5 6 | 9 | A1..D3 (17 semitoni) | 38 % | 1.1 | 128/128 |
| 3 | y3 bass | 0 | 68 | 8 9 8 9 9 6 11 8 | 0 | - | 53 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.71; y0 0.99, y1 0.77, y2 0.86, y3 0.17.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 17.14 s | -0.2 | 1.06 | -23.2 | 23.1 | 0.00 % | 12 % | 0.12 s | 22.8 | 183 | 0.00 |
| 2 | 17.14 s | -0.2 | 1.00 | -22.1 | 21.9 | 0.00 % | 10 % | 0.11 s | 24.3 | 169 | 0.00 |
| 3 | 17.14 s | -0.2 | 1.01 | -22.4 | 22.2 | 0.01 % | 11 % | 0.11 s | 24.7 | 201 | 0.02 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 3 % | 82 % | 9 % | 5 % | 0 % | 0 % | 0 % |
| 2 | 4 % | 84 % | 7 % | 5 % | 0 % | 0 % | 0 % |
| 3 | 4 % | 80 % | 6 % | 9 % | 1 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×4×16, 35 nodi, 121 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, H=Hi-hat, C=Rullante, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), D=Battuta (marcatore).
Alla fine: S 164, N 139, H 37, K 30, A 14, C 2, G 2.
#2-21 line×20: 1290 celle x0-127 y0-3 z0-15, passi 1-20
  .→W 1280: x0-127 y2 z6-15
  .→D 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→T 1: x0 y2 z0
  .→M 1: x0 y0 z7
#22-23 one×1, all×1: 15 celle x0-112 y2 z0-4, passi 21-28
  .→R 7: x64 y2 z0; x96 y2 z0; x32 y2 z1; x16 y2 z3; +3 scatole, 3 celle
  T→R 1: x0 y2 z0
 #24 all W → .: ×1, 1280 celle x0-127 y2 z6-15, passi 29
  W→. 1280: x0-127 y2 z6-15
 #25 all ./R → X/Y: ×1, 16 celle x0-112 y1-2 z0-4, passi 30
  .→X 8: x0 y1 z0; x64 y1 z0; x96 y1 z0; x32 y1 z1; +4 scatole, 4 celle
  R→Y 8: x0 y2 z0; x64 y2 z0; x96 y2 z0; x32 y2 z1; +4 scatole, 4 celle
 #26 one ......**......** **************** ......**.....… → NSSSSS**NSSSSS** **************** NSSSSS**NSSSS… (+2): ×8, 203 celle x0-123 y1 z0-8, passi 31-38
   r1 ......**......** **************… → NSSSSS**NSSSSS** **************… ×3; r2 **..**..**..**** **************… → **NS**NS**NS**** **************… ×5; r3 ..............** **************… → NSSSSSSSSSSSSS** **************… ×0
  .→S 135: x65-69 y1 z0; x73-77 y1 z0; x97-101 y1 z0; x105-109 y1 z0; +59 scatole, 115 celle
  .→N 60: x2 y1 z0; x6 y1 z0; x10 y1 z0; x72 y1 z0; +56 scatole, 56 celle
  X→. 5: x0 y1 z0; x32 y1 z1; x16 y1 z3; x112 y1 z3; +1 scatole, 1 celle
  X→N 3: x64 y1 z0; x96 y1 z0; x80 y1 z3
#27-28 one×2: 123 celle x0-126 y2-3 z0-11, passi 39-54
  .→N 44: x2 y2 z0; x5 y2 z0; x11 y2 z0; x66 y2 z0; +40 scatole, 40 celle
  .→H 37: x6-7 y3 z1; x38-39 y3 z1; x62-63 y3 z1; x70-71 y3 z1; +28 scatole, 29 celle
  .→K 22: x4 y3 z0; x8 y3 z0; x12 y3 z0; x24 y3 z0; +18 scatole, 18 celle
  Y→A 8: x0 y2 z0; x64 y2 z0; x96 y2 z0; x32 y2 z1; +4 scatole, 4 celle
  D→K 8: x0 y3 z0; x16 y3 z0; x32 y3 z0; x48 y3 z0; +4 scatole, 4 celle
  .→A 2: x40 y2 z1; x24 y2 z3
  .→C 2: x53 y3 z2; x61 y3 z2
 #29 one **. M.* → **M NS* (+7): ×62, 153 celle x0-127 y0 z3-15, passi 55-116
   r1 **. M.* → **M NS* ×10; r2 M.* **. → NS* **M ×7; r3 *. ** M* → *M ** N* ×6; r4 M* ** *. → N* ** *M ×7; r5 M... → NSSM ×6; r6 M.. → .*M ×18; r7 M.... → .***M ×6; r8 *. M* → *M G* ×2
 parte 1/4, passi 55-69:
  .→S 11: x12-13 y0 z4; x8-9 y0 z6; x21 y0 z3; x15 y0 z4; +5 scatole, 5 celle
  .→N 10: x20 y0 z3; x11 y0 z4; x14 y0 z4; x18 y0 z4; +6 scatole, 6 celle
  .→G 1: x4 y0 z6
  M→N 1: x0 y0 z7
  .→M 1: x31 y0 z7
 parte 2/4, passi 70-85:
  .→N 8: x34 y0 z7; x37 y0 z9; x38 y0 z11; x42 y0 z12; +4 scatole, 4 celle
  .→S 7: x32-33 y0 z7; x48-49 y0 z12; x39 y0 z11; x43 y0 z12; +1 scatole, 1 celle
  M→N 1: x31 y0 z7
  .→M 1: x65 y0 z14
 parte 3/4, passi 86-100:
  .→N 8: x90 y0 z11; x82 y0 z12; x94 y0 z12; x85 y0 z13; +4 scatole, 4 celle
  .→S 5: x91 y0 z11; x95 y0 z12; x70 y0 z14; x84 y0 z14; +1 scatole, 1 celle
  .→M 1: x96 y0 z13
  M→. 1: x65 y0 z14
 parte 4/4, passi 101-116:
  .→N 7: x99 y0 z10; x104 y0 z10; x119 y0 z10; x121 y0 z11; +3 scatole, 3 celle
  .→S 6: x100-101 y0 z10; x112-113 y0 z12; x120 y0 z10; x97 y0 z13
  .→G 1: x124 y0 z9
  .→M 1: x127 y0 z10
  M→N 1: x96 y0 z13
#30-31 all×1, one×1: 5 celle x47-127 y0 z10-14, passi 117-121
  N→A 4: x121 y0 z11; x47 y0 z12; x94 y0 z12; x69 y0 z14
  M→. 1: x127 y0 z10
Senza effetto (non hanno mai cambiato una cella):
#32 all X → .: in quel momento nella griglia non c'erano celle "X"
```
