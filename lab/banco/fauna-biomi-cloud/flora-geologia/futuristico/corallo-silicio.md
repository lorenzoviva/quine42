# Corallo di silicio (`corallo-silicio`)

Un corallo che cresce nell'aria sottile di Sidera, fatto di silicio: rami che si biforcano, punte che si accendono.

- Collezione: `flora-geologia` · ambientazione: `futuristico` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: lo scoglio a caso (masso tondo, disco, tre pietre), punte che nascono in posti a caso dello scoglio e crescono tutte insieme salendo, piegando e biforcandosi a caso; poi i rami si ispessiscono e le punte si accendono.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.349 | ≥ 0.15 |
| distanza minima fra due semi | 0.289 | — |
| tempo del seme più lento | 273 ms | < 1500 ms |
| voxel per seme (1-5) | 44090, 45533, 44687, 46494, 39070 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`corallo-silicio.png`](corallo-silicio.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 19 nodi, 133 passi, finito in 292 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), R=scoglio, A=silicio, D=silicio scuro, X=punte accese, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: A 29205, X 6684, D 5765, R 2436.
 #2 box at 3 0 0 size 7 1 1 z su .: ×1, 7 celle x0-6 y0 z0, passi 1, .→z 7
 #3 box at 0 1 0 size 1 1 1 z su .: ×1, 1 celle x0 y1 z0, passi 2, .→z 1
 #4 one z → . passi=8: ×8, 8 celle x0-6 y0-1 z0, passi 3-10, z→. 8
 #5 box at 20 20 0 size 40 40 12 u su .: ×1, 18252 celle x1-39 y1-39 z0-11, passi 11, .→u 18252
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x32 y13 z3, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×65, 18251 celle x1-39 y1-39 z0-11, passi 13-77, u→2 18251
   r1 1u → *1 ×0; r2 2u → *2 ×18251; r3 3u → *3 ×0
 #9 cylinder at 20 20 0 size 28 28 4 R su 2: ×1, 2436 celle x7-33 y7-33 z0-3, passi 78, 2→R 2436
 #14 prl u → . (+3): ×1, 15816 celle x1-39 y1-39 z0-11, passi 79, 2→. 15816
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×15816; r4 3 → . ×0
 #15 one . R → P * passi=5: ×5, 5 celle x12-19 y10-27 z4, passi 80-84, .→P 5
 #16 prl . P → P A (+2) passi=46: ×46, 64380 celle x0-39 y0-39 z4-50, passi 85-130, .→P 35175, P→A 29205
   r1 . P → P A ×13727; r2 .* *P → P* *A ×30879; r3 .*. *P* → P*P *A* ×1899
 #17 prl P → X: ×1, 5975 celle x0-39 y0-39 z9-50, passi 131, P→X 5975
 #18 all A. → *D passi=1: ×1, 5765 celle x0-39 y0-39 z4-49, passi 132, .→D 5765
 #19 prl . X → X * passi=1: ×1, 709 celle x0-39 y0-39 z34-51, passi 133, .→X 709
Senza effetto (non hanno mai cambiato una cella):
#8 ellipsoid at 20 20 0 size 20 20 10 R su 1
#10 ellipsoid at 13 16 0 size 12 12 8 R su 3
#11 ellipsoid at 27 16 0 size 12 12 9 R su 3
#12 ellipsoid at 20 28 0 size 12 12 8 R su 3
#13 ellipsoid at 20 20 0 size 10 10 6 R su 3
```
