# Cristalli di caverna (`cristallo-caverna`)

Un nido di cristalli che spunta dalla roccia delle caverne di Aurora, ognuno con la sua luce.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: massi che nascono a caso sul terreno e crescono, un cristallo madre a caso (dritto, inclinato, doppio, a ventaglio), poi una ventina di cristalli nati in punti a caso della roccia, ognuno con una direzione e una lunghezza a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.307 | ≥ 0.15 |
| distanza minima fra due semi | 0.180 | — |
| tempo del seme più lento | 378 ms | < 1500 ms |
| voxel per seme (1-5) | 11660, 11371, 11589, 11634, 11783 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cristallo-caverna.png`](cristallo-caverna.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 25 nodi, 151 passi, finito in 381 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 0=marcatore (marcatore), 4=marcatore (marcatore), 7=marcatore (marcatore), 8=marcatore (marcatore), 9=marcatore (marcatore), R=roccia, D=roccia scura, X=cristallo, Y=cristallo chiaro, g=marcatore (marcatore), P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: R 8723, Y 1897, X 654, D 386.
#2-3 ellipsoid×1, box×1: 3472 celle x6-44 y6-44 z0-7, passi 1-2
 #4 one Rg → *R passi=6: ×6, 6 celle x20-30 y19-30 z0, passi 3-8, g→R 6
 #5 prl R[.g] → *R (+1) passi=10: ×10, 7063 celle x6-43 y6-43 z0-15, passi 9-18, .→R 6752, g→R 311
   r1 R[.g] → *R ×7263; r2 . R → R * ×2289
 #6 prl g → .: ×1, 1115 celle x6-44 y6-44 z0, passi 19, g→. 1115
 #7 box at 25 25 4 size 40 40 46 u su .: ×1, 63711 celle x6-44 y6-44 z4-49, passi 20, .→u 63711
 #8 one u → 1 (+3) passi=1: ×1, 1 celle x32 y36 z19, passi 21, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #9 all 1u → *1 (+3): ×86, 63710 celle x6-44 y6-44 z4-49, passi 22-107, u→4 63710
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×63710
#16-18 line×3: 1897 celle x11-39 y22-28 z13-41, passi 108-110
 #19 prl u → . (+4): ×1, 61814 celle x6-44 y6-44 z4-49, passi 111, 4→. 61814
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×61814
#20-22 one×1, all×1, prl×1: 470 celle x0-46 y1-49 z4-31, passi 112-148
#23-25 prl×3: 825 celle x0-46 y0-49 z0-31, passi 149-151
Senza effetto (non hanno mai cambiato una cella):
#10 line 25 25 4 → 25 25 44 Y
#11 cone at 25 25 44 size 7 7 5 Y su 1
#12 line 25 25 4 → 15 30 38 Y
#13 line 15 30 38 → 13 31 44 Y
#14 line 22 25 4 → 16 22 40 Y
#15 line 28 25 4 → 34 28 34 Y
```
