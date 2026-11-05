# Antenna dello spazio profondo (`antenna-array-profondo`)

Una stazione d'ascolto di Sidera che punta lontano: parabole, pannelli e antenne che crescono come rami.

- Collezione: `flora-geologia` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: lo strumento a caso (una parabola grande, tre parabole sui piloni, pannelli a fase, torre a griglia), poi antenne che nascono in punti a caso della piattaforma e crescono a rami, luci di segnalazione a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.345 | ≥ 0.15 |
| distanza minima fra due semi | 0.012 | — |
| tempo del seme più lento | 601 ms | < 1500 ms |
| voxel per seme (1-5) | 8182, 6965, 8185, 8182, 6960 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`antenna-array-profondo.png`](antenna-array-profondo.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 47 nodi, 179 passi, finito in 635 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), S=piattaforma, W=parabole, I=tralicci, R=luci, P=marcatore (marcatore), x=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 5526, W 1992, I 637, R 27.
#2-3 box×2: 8 celle x0-6 y0-1 z0, passi 1-2
 #4 one z → . passi=8: ×8, 8 celle x0-6 y0-1 z0, passi 3-10, z→. 8
 #5 box at 25 25 0 size 44 44 3 S: ×1, 5547 celle x4-46 y4-46 z0-2, passi 11, .→S 5547
 #6 box at 25 25 3 size 50 50 47 u su .: ×1, 112847 celle x1-49 y1-49 z3-49, passi 12, .→u 112847
 #7 one u → 1 (+3) passi=1: ×1, 1 celle x22 y3 z36, passi 13, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #8 all 1u → *1 (+3): ×106, 112846 celle x1-49 y1-49 z3-49, passi 14-119, u→2 112846
   r1 1u → *1 ×0; r2 2u → *2 ×112846; r3 3u → *3 ×0; r4 4u → *4 ×0
#14-28 line×6, ellipsoid×6: 5493 celle x5-45 y7-45 z3-33, passi 120-131
 #42 prl u → . (+4): ×1, 107354 celle x1-49 y1-49 z3-49, passi 132, 2→. 107354
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×107354; r4 3 → . ×0; r5 4 → . ×0
 #43 prl x → .: ×1, 2904 celle x6-44 y8-44 z23-32, passi 133, x→. 2904
 #44 one . S → P * passi=4: ×4, 4 celle x10-44 y8-36 z3, passi 134-137, .→P 4
 #45 one . P → P I (+2) passi=40: ×40, 82 celle x10-45 y7-37 z3-14, passi 138-177, .→P 42, P→I 40
   r1 . P → P I ×21; r2 .* *P → P* *I ×17; r3 .*. *P* → P*P *I* ×2
 #46 prl P → R: ×1, 6 celle x10-45 y7-36 z7-14, passi 178, P→R 6
 #47 prl .S → *R passi=1: ×1, 21 celle x4-46 y4-46 z0-2, passi 179, S→R 21
Senza effetto (non hanno mai cambiato una cella):
#9 cylinder at 25 25 3 size 8 8 14 I su 1
#10 line 25 25 17 → 25 25 34 I
#11 ellipsoid at 25 25 20 size 36 36 22 x su 1
#12 ellipsoid at 25 25 15 size 40 40 22 W su 1
#13 box at 25 25 34 size 3 3 3 E su 1
#15 box at 12 14 32 size 1 1 2 E su 2
#20 box at 38 14 32 size 1 1 2 E su 2
#25 box at 25 38 32 size 1 1 2 E su 2
#29 box at 12 25 3 size 2 30 26 K su 3
#30 box at 38 25 3 size 2 30 26 K su 3
#31 box at 25 12 3 size 22 2 34 K su 3
#32 box at 25 25 3 size 4 4 40 I su 3
… e altri 9
```
