# suono-fantasy-esplorazione-giorno

> Fantasy, di giorno in cammino: un'arpa che sale sulle radici, un flauto dorico che vaga, tamburi a mano leggeri.

Sorgente: `lab/banco/suoni-cloud/fantasy/suono-fantasy-esplorazione-giorno.xml`. Rigenera con `npx vite-node lab/banco/suoni-cloud/valida.ts -- lab/banco/suoni-cloud/fantasy/suono-fantasy-esplorazione-giorno.xml`.

## Esito
Dieci terne su dieci senza difetti; il validatore (`modelErrors`, semi 1, 2, 3) non rimanda niente. Distanza fra i semi di ogni terna almeno 0,15 (tre volte la soglia 0,05); media fra i 30 semi 0.85 (minima fra due semi 0.70), 30 partiture diverse su 30.

## Le dieci terne
| semi | verdetto | distanza | eventi | note diverse (min) | RMS dBFS | picco grezzo (max) | silenzio (max) | dinamica dB (min) | giuntura (max) | aspri (max) | periodo (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1, 2, 3 | pulito | 0.88 | 186-198 | 23 | -23.0..-22.3 | 0.97 | 3 % | 17.8 | 0.01 | 12 % | 128/128 |
| 4, 5, 6 | pulito | 0.84 | 195-196 | 21 | -23.4..-22.0 | 1.13 | 4 % | 19.2 | 0.01 | 11 % | 128/128 |
| 7, 8, 9 | pulito | 0.86 | 180-193 | 24 | -22.8..-22.5 | 0.96 | 3 % | 18.8 | 0.01 | 16 % | 128/128 |
| 10, 11, 12 | pulito | 0.87 | 183-187 | 23 | -23.4..-22.5 | 1.06 | 4 % | 18.6 | 0.02 | 8 % | 128/128 |
| 13, 14, 15 | pulito | 0.82 | 181-200 | 24 | -23.5..-23.1 | 1.13 | 5 % | 17.6 | 0.01 | 8 % | 128/128 |
| 16, 17, 18 | pulito | 0.85 | 171-195 | 22 | -23.3..-22.0 | 0.91 | 5 % | 19.8 | 0.01 | 5 % | 128/128 |
| 19, 20, 21 | pulito | 0.84 | 176-191 | 21 | -22.7..-22.4 | 0.92 | 6 % | 18.5 | 0.04 | 9 % | 128/128 |
| 22, 23, 24 | pulito | 0.86 | 180-200 | 21 | -22.7..-22.2 | 0.97 | 5 % | 18.0 | 0.01 | 10 % | 128/128 |
| 25, 26, 27 | pulito | 0.87 | 186-198 | 24 | -22.8..-22.1 | 0.95 | 4 % | 15.9 | 0.00 | 15 % | 128/128 |
| 28, 29, 30 | pulito | 0.86 | 182-192 | 22 | -23.0..-22.2 | 1.02 | 4 % | 19.2 | 0.05 | 12 % | 128/128 |

## Rapporto completo: Suono: suono-fantasy-esplorazione-giorno (semi 1, 2, 3)

128 passi, 8 battute, ciclo di 20.87 s a 92 bpm.
Dichiarata: D dorian (root 50); swing 0.08, cutoff 3600 Hz, space 0.50.
Tracce: y0 lead 0.55, y1 pad 0.50, y2 lead 0.32, y3 bass 0.60, y4 bass 0.45.

### Verdetto
Nessun difetto tra quelli che le soglie vedono. Il resto si ascolta: lab/banco/suono.md dice cosa le misure non possono dire.

### La partitura, seme 1
Una parola per passo: D4 nota, D4! accento, d4 ghost, ~3 durata in passi, K cassa, H hi-hat, O aperto, C rullante, «.» niente, + insieme.
battuta 1:
  y0 lead: D5!~2 . C5~2 . B4~2 . C5~2 . D5~3 . . B4~3 . . G4~6 .
  y1 pad: D3~14+F3~14+A3~14 . . . . . . . . . . . . . . .
  y2 lead: . . A4 . F4 . D4 . . . A4 . D5 . . .
  y3 bass: K+D2!~12 . . . . . . . . . . . F2~4 . . .
  y4 bass: K . . . H . . . K . H . H . . .
battuta 2:
  y0 lead: . . . . F4 G4 A4~3 . . C5~2 . B4~2 . C5~3 . .
  y1 pad: G3~8+B3~8+D4~8 . . . . . . . G3~6+B3~6+D4~6 . . . . . . .
  y2 lead: G4 . B4 . D5 . G5 . D5 . B4 . D5 . . .
  y3 bass: G2!~6 . . . . . . . G2~4 . . . D3~4 . . .
  y4 bass: . . . . H . . . . . . . H . . .
battuta 3:
  y0 lead: E5~2 . F5~2 . G5 A5~4 . . . A5~2 . G5~2 . . . F5~3
  y1 pad: G3~14+B3~14+D4~14 . . . . . . . . . . . . . . .
  y2 lead: G4 . . D5 . . G5 . . D5 . . B4 . . .
  y3 bass: G2!~8 . . . . . . . D3~4 . . . G2~4 . . .
  y4 bass: K . . . H . . . K . H . H . . .
battuta 4:
  y0 lead: . . D5 . . . . E5~4 . . . E5~2 . . . .
  y1 pad: D3~8+F3~8 . . . . . . . F3~8+A3~8 . . . . . . .
  y2 lead: D4 . . A4 . . D5 . . A4 . . F4 . . .
  y3 bass: K+D2!~12 . . . . . . . . . . . F2~4 . . .
  y4 bass: K . . . H . . . K . H . H . . .
battuta 5:
  y0 lead: . F5~6 . . . . . e5 f5 . . G5~2 . F5 E5~2 .
  y1 pad: A3~8+C4~8+E4~8 . . . . . . . A3~6+C4~6+E4~6 . . . . . . .
  y2 lead: A4 . C5 . E5 . A5 . E5 . C5 . E5 . . .
  y3 bass: A2!~8 . . . . . . . E3~4 . . . A2~4 . . .
  y4 bass: K . . . H . . . K . H . H . . .
battuta 6:
  y0 lead: . . F5~2 . G5!~3 . . . . . . E5~2 . D5 E5 D5
  y1 pad: A3~14+C4~14+E4~14 . . . . . . . . . . . . . . .
  y2 lead: . . E5 . C5 . A4 . . . E5 . A5 . . .
  y3 bass: A2!~8 . . . . . . . E3~4 . . . A2~4 . . .
  y4 bass: K . . . . . . . H . . . H . H H
battuta 7:
  y0 lead: C5~6 . . . . . B4 A4~2 . G4 F4~3 . . A4 G4 A4~2
  y1 pad: D3~14+F3~14+A3~14 . . . . . . . . . . . . . . .
  y2 lead: D4 . . A4 . . D5 . . A4 . . F4 . . .
  y3 bass: K+D2!~6 . . . . . . . D2~4 . . . A2~4 . . .
  y4 bass: K . . . H . . . K . H . H . . .
battuta 8:
  y0 lead: . B4 C5~2 . B4!~2 . A4 B4~6 . . . . . A4~2 . .
  y1 pad: A3~14+C4~14+E4~14 . . . . . . . . . . . . . . .
  y2 lead: A4 . . E5 . . A5 . . E5 . . C5 . . .
  y3 bass: A2!~8 . . . . . . . E3~4 . . . A2~4 . . .
  y4 bass: K . . . H . . . K . H . H . . .

### Per seme
| seme | eventi | densità | note diverse | estensione | sulla scala | tonica | effettiva (accordo) | dichiarata | aspri | periodo |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 186 | 70 % | 23 | D2..A5 (43 semitoni) | 100 % | 22 % | D dorian (0.96) | 0.96 | 5 % | 128/128 |
| 2 | 198 | 72 % | 25 | D2..A5 (43 semitoni) | 100 % | 19 % | D dorian (0.88) | 0.88 | 12 % | 128/128 |
| 3 | 186 | 68 % | 25 | D2..A5 (43 semitoni) | 100 % | 26 % | D dorian (0.93) | 0.93 | 6 % | 128/128 |

### Per traccia, per seme
| seme | traccia | note | colpi | per battuta | diverse | estensione | densità | durata media | periodo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | y0 lead | 49 | 0 | 7 6 7 3 6 6 8 6 | 10 | F4..A5 (16 semitoni) | 38 % | 2.2 | 128/128 |
| 1 | y1 pad | 31 | 0 | 3 6 3 4 6 3 3 3 | 8 | D3..E4 (14 semitoni) | 9 % | 10.5 | 128/128 |
| 1 | y2 lead | 44 | 0 | 5 7 5 5 7 5 5 5 | 10 | D4..A5 (19 semitoni) | 34 % | 1.0 | 128/128 |
| 1 | y3 bass | 22 | 3 | 3 3 3 3 3 3 4 3 | 6 | D2..E3 (14 semitoni) | 17 % | 5.6 | 128/128 |
| 1 | y4 bass | 0 | 37 | 5 2 5 5 5 5 5 5 | 0 | - | 29 % | 0.0 | 128/128 |
| 2 | y0 lead | 51 | 0 | 7 6 5 4 6 8 6 9 | 12 | D4..A5 (19 semitoni) | 40 % | 2.0 | 128/128 |
| 2 | y1 pad | 39 | 0 | 3 3 6 6 3 6 6 6 | 9 | D3..F4 (15 semitoni) | 10 % | 8.6 | 128/128 |
| 2 | y2 lead | 48 | 0 | 5 7 7 7 5 5 5 7 | 11 | D4..A5 (19 semitoni) | 38 % | 1.0 | 128/128 |
| 2 | y3 bass | 24 | 1 | 4 3 3 3 3 3 3 3 | 9 | D2..F3 (15 semitoni) | 19 % | 5.2 | 128/128 |
| 2 | y4 bass | 0 | 35 | 5 5 2 2 5 5 6 5 | 0 | - | 27 % | 0.0 | 128/128 |
| 3 | y0 lead | 45 | 0 | 5 6 7 6 5 6 4 6 | 5 | D5..A5 (7 semitoni) | 35 % | 2.3 | 128/128 |
| 3 | y1 pad | 32 | 0 | 3 3 6 6 4 3 3 4 | 10 | D3..F4 (15 semitoni) | 9 % | 9.9 | 128/128 |
| 3 | y2 lead | 44 | 0 | 5 5 5 7 5 7 5 5 | 12 | D4..A5 (19 semitoni) | 34 % | 1.0 | 128/128 |
| 3 | y3 bass | 22 | 3 | 3 3 4 4 3 3 2 3 | 9 | D2..F3 (15 semitoni) | 17 % | 5.5 | 128/128 |
| 3 | y4 bass | 0 | 40 | 6 5 6 5 2 5 5 6 | 0 | - | 31 % | 0.0 | 128/128 |

### Tra i semi
Distanza media tra le partiture (0 uguali, 1 niente in comune): 0.88; y0 0.99, y1 0.80, y2 0.91, y3 0.89, y4 0.72.

### Il segnale (il ciclo)
| seme | durata | picco dBFS | picco grezzo | RMS dBFS | cresta dB | al limite | silenzio | silenzio più lungo | dinamica dB | centro Hz | giuntura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 20.87 s | -0.2 | 0.97 | -22.3 | 22.1 | 0.00 % | 3 % | 0.08 s | 17.8 | 340 | 0.00 |
| 2 | 20.87 s | -0.9 | 0.90 | -23.0 | 22.1 | 0.00 % | 3 % | 0.10 s | 18.3 | 358 | 0.01 |
| 3 | 20.87 s | -0.2 | 0.97 | -22.4 | 22.1 | 0.00 % | 3 % | 0.15 s | 19.3 | 408 | 0.00 |

### Lo spettro (quota di energia per banda)
| seme | sub | bassi | medio-bassi | medi | medio-alti | alti | brillanza |
|---|---|---|---|---|---|---|---|
| 1 | 0 % | 65 % | 15 % | 17 % | 2 % | 0 % | 0 % |
| 2 | 0 % | 58 % | 22 % | 19 % | 2 % | 0 % | 0 % |
| 3 | 0 % | 62 % | 12 % | 21 % | 4 % | 0 % | 0 % |

## Traccia, seme 1
```
Traccia, seme 1: griglia 128×5×16, 36 nodi, 122 passi, finito.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=Nota, S=Sustain, A=Accento, G=Ghost, K=Kick, H=Hi-hat, M=Testa della melodia (marcatore), T=Testa degli accordi (marcatore), W=Soffitto degli accordi (marcatore), R=Radice (marcatore), X=Segno del pad (marcatore), Y=Segno del basso (marcatore), Z=Segno dell'arpeggio (marcatore), D=Battuta (marcatore).
Alla fine: S 457, N 133, H 24, K 13, A 11, G 2.
#2-21 line×20: 1290 celle x0-127 y0-4 z0-15, passi 1-20
  .→W 1280: x0-127 y3 z6-15
  .→D 8: x0 y4 z0; x16 y4 z0; x32 y4 z0; x48 y4 z0; +4 scatole, 4 celle
  .→T 1: x0 y3 z0
  .→M 1: x0 y0 z7
#22-23 one×1, all×1: 15 celle x0-112 y3 z0-4, passi 21-28
  .→R 7: x48 y3 z0; x96 y3 z0; x16 y3 z3; x32 y3 z3; +3 scatole, 3 celle
  T→R 1: x0 y3 z0
 #24 all W → .: ×1, 1280 celle x0-127 y3 z6-15, passi 29
  W→. 1280: x0-127 y3 z6-15
 #25 all ././R → X/Z/Y: ×1, 24 celle x0-112 y1-3 z0-4, passi 30
  .→X 8: x0 y1 z0; x48 y1 z0; x96 y1 z0; x16 y1 z3; +4 scatole, 4 celle
  .→Z 8: x0 y2 z0; x48 y2 z0; x96 y2 z0; x16 y2 z3; +4 scatole, 4 celle
  R→Y 8: x0 y3 z0; x48 y3 z0; x96 y3 z0; x16 y3 z3; +4 scatole, 4 celle
 #26 one ..............** **************** .............… → NSSSSSSSSSSSSS** **************** NSSSSSSSSSSSS… (+2): ×8, 326 celle x0-125 y1 z0-8, passi 31-38
   r1 ..............** **************… → NSSSSSSSSSSSSS** **************… ×5; r2 ..............** **************… → NSSSSSSSNSSSSS** **************… ×2; r3 ********........ **************… → ********NSSSSSSS **************… ×1
  .→S 295: x1-13 y1 z0; x97-109 y1 z0; x1-13 y1 z2; x97-109 y1 z2; +27 scatole, 243 celle
  .→N 23: x0 y1 z2; x48 y1 z2; x56 y1 z2; x96 y1 z2; +19 scatole, 19 celle
  X→N 8: x0 y1 z0; x48 y1 z0; x96 y1 z0; x16 y1 z3; +4 scatole, 4 celle
 #27 one ******.********* **************** *************… → ******N********* **************** *************… (+2): ×8, 46 celle x0-124 y2 z0-11, passi 39-46
   r1 ******.********* **************… → ******N********* **************… ×2; r2 ******.********* **************… → ******N********* **************… ×4; r3 ************.*** **************… → ************N*** **************… ×2
  .→N 38: x6 y2 z0; x4 y2 z2; x60 y2 z2; x108 y2 z2; +34 scatole, 34 celle
  Z→N 6: x48 y2 z0; x96 y2 z0; x16 y2 z3; x32 y2 z3; +2 scatole, 2 celle
  Z→. 2: x0 y2 z0; x80 y2 z4
 #28 one ********....**** **************** *************… → ********NSSS**** **************** *************… (+2): ×8, 124 celle x0-127 y3 z0-8, passi 47-54
   r1 ********....**** **************… → ********NSSS**** **************… ×4; r2 ************.... **************… → ************NSSS **************… ×2; r3 ************.... **************… → ************NSSS **************… ×2
  .→S 102: x1-11 y3 z0; x49-59 y3 z0; x33-39 y3 z3; x65-71 y3 z4; +18 scatole, 66 celle
  .→N 14: x104 y3 z0; x12 y3 z2; x60 y3 z2; x24 y3 z3; +10 scatole, 10 celle
  Y→A 8: x0 y3 z0; x48 y3 z0; x96 y3 z0; x16 y3 z3; +4 scatole, 4 celle
 #29 one ****.*****.*.*** D*******.******* → ****H*****H*H*** K*******K******* (+3): ×8, 38 celle x0-124 y4 z0-1, passi 55-62
   r1 ****.*****.*.*** D*******.*****… → ****H*****H*H*** K*******K*****… ×6; r2 ***.*****.****.* D*****.*****.*… → ***H*****H****H* K*****K*****K*… ×0; r3 ********.***.*.. D*************… → ********H***H*HH K*************… ×1; r4 ****.*******.*** D*************… → ****H*******H*** .*************… ×1
  .→H 24: x94-95 y4 z1; x4 y4 z1; x10 y4 z1; x12 y4 z1; +19 scatole, 19 celle
  D→K 7: x0 y4 z0; x32 y4 z0; x48 y4 z0; x64 y4 z0; +3 scatole, 3 celle
  .→K 6: x8 y4 z0; x40 y4 z0; x56 y4 z0; x72 y4 z0; +2 scatole, 2 celle
  D→. 1: x16 y4 z0
 #30 one **. M.* → **M NS* (+10): ×56, 172 celle x0-127 y0 z2-11, passi 63-118
   r1 **. M.* → **M NS* ×10; r2 M.* **. → NS* **M ×10; r3 *. M* → *M N* ×8; r4 M* *. → N* *M ×6; r5 M.... → NSSSM ×2; r6 ***. **** M..* → ***M **** NSS* ×3; r7 M..* **** ***. → NSS* **** ***M ×4; r8 M.. → .*M ×5; r9 M.... → .***M ×2; r10 M.....* ******. → NSSSSS* ******M ×4; r11 *. M* → *M G* ×2
 parte 1/4, passi 63-76:
  .→S 20: x15-19 y0 z3; x23-24 y0 z4; x12-13 y0 z5; x30-31 y0 z6; +8 scatole, 9 celle
  .→N 13: x20 y0 z2; x14 y0 z3; x21 y0 z3; x22 y0 z4; +9 scatole, 9 celle
  M→N 1: x0 y0 z7
  .→M 1: x34 y0 z9
 parte 2/4, passi 77-90:
  .→S 17: x66-70 y0 z9; x56-58 y0 z8; x38-40 y0 z11; x48-49 y0 z9; +4 scatole, 4 celle
  .→N 9: x50 y0 z7; x55 y0 z8; x59 y0 z8; x47 y0 z9; +5 scatole, 5 celle
  .→M 1: x71 y0 z8
  M→N 1: x34 y0 z9
 parte 3/4, passi 91-104:
  .→N 9: x93 y0 z7; x95 y0 z7; x78 y0 z8; x91 y0 z8; +5 scatole, 5 celle
  .→S 6: x85-86 y0 z10; x79 y0 z8; x92 y0 z8; x83 y0 z9; +1 scatole, 1 celle
  .→M 1: x96 y0 z6
  M→G 1: x71 y0 z8
  .→G 1: x72 y0 z9
 parte 4/4, passi 105-118:
  .→S 17: x120-124 y0 z5; x97-101 y0 z6; x107-108 y0 z2; x104 y0 z4; +4 scatole, 4 celle
  .→N 13: x106 y0 z2; x105 y0 z3; x110 y0 z3; x103 y0 z4; +9 scatole, 9 celle
```
