# Cristalli di caverna (`cristallo-caverna`)

Un nido di cristalli che spunta dalla roccia delle caverne di Aurora, ognuno con la sua luce.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: massi che nascono a caso sul terreno e crescono, un cristallo madre a caso (dritto, inclinato, doppio, a ventaglio), poi una ventina di cristalli nati in punti a caso della roccia, ognuno con una direzione e una lunghezza a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.298 | ≥ 0.15 |
| distanza minima fra due semi | 0.184 | — |
| tempo del seme più lento | 425 ms | < 1500 ms |
| voxel per seme (1-5) | 11548, 11389, 11186, 11138, 11774 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cristallo-caverna.png`](cristallo-caverna.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 28 nodi, 158 passi, finito in 387 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 0=marcatore (marcatore), 4=marcatore (marcatore), 7=marcatore (marcatore), 8=marcatore (marcatore), 9=marcatore (marcatore), R=roccia, D=roccia scura, X=cristallo, Y=cristallo chiaro, g=marcatore (marcatore), P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: R 8694, Y 1908, X 558, D 388.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 ellipsoid×1, box×1: 3472 celle x6-44 y6-44 z0-7, passi 11-12
 #7 one Rg → *R passi=6: ×6, 6 celle x19-31 y26-29 z0, passi 13-18, g→R 6
 #8 prl R[.g] → *R (+1) passi=10: ×10, 7036 celle x6-43 y7-43 z0-15, passi 19-28, .→R 6672, g→R 364
   r1 R[.g] → *R ×7182; r2 . R → R * ×2298
 #9 prl g → .: ×1, 1062 celle x6-44 y6-44 z0, passi 29, g→. 1062
 #10 box at 25 25 4 size 40 40 46 u su .: ×1, 63789 celle x6-44 y6-44 z4-49, passi 30, .→u 63789
 #11 one u → 1 (+3) passi=1: ×1, 1 celle x23 y28 z44, passi 31, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #12 all 1u → *1 (+3): ×83, 63784 celle x6-44 y6-44 z4-49, passi 32-114, u→4 63784
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×63784
#19-21 line×3: 1908 celle x11-39 y22-28 z13-41, passi 115-117
 #22 prl u → . (+4): ×1, 61881 celle x6-44 y6-44 z4-49, passi 118, 4→. 61877, u→. 4
   r1 u → . ×4; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×61877
#23-25 one×1, all×1, prl×1: 418 celle x0-45 y6-49 z4-28, passi 119-155
#26-27 prl×2: 369 celle x0-45 y5-49 z4-28, passi 156-157
 #28 prl .R → *D passi=1: ×1, 388 celle x6-43 y7-43 z0-15, passi 158, R→D 388
Senza effetto (non hanno mai cambiato una cella):
#13 line 25 25 4 → 25 25 44 Y
#14 cone at 25 25 44 size 7 7 5 Y su 1
#15 line 25 25 4 → 15 30 38 Y
#16 line 15 30 38 → 13 31 44 Y
#17 line 22 25 4 → 16 22 40 Y
#18 line 28 25 4 → 34 28 34 Y
```
