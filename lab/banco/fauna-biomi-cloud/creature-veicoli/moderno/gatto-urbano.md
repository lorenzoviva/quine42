# Gatto urbano (`gatto-urbano`)

Il gatto dei tetti di Neapolis: tigrato, sornione, la coda che si muove per conto suo.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `animale` (scatola 15 × 20 × 15)
- Scelte procedurali: la postura a caso (seduto, in cammino, a pagnotta, ad arco, sdraiato su un fianco), una coda lunga che cresce in direzioni a caso e strisce tigrate che si allungano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.711 | ≥ 0.15 |
| distanza minima fra due semi | 0.032 | — |
| tempo del seme più lento | 44 ms | < 1500 ms |
| voxel per seme (1-5) | 340, 368, 299, 368, 467 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`gatto-urbano.png`](gatto-urbano.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 15×20×15, 61 nodi, 65 passi, finito in 23 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 3=marcatore (marcatore), F=pelo grigio, D=strisce, E=occhi, Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 322, D 16, E 2.
#2-3 box×2: 8 celle x0-6 y0-1 z0, passi 1-2
 #4 one z → . passi=8: ×8, 8 celle x0-6 y0-1 z0, passi 3-10, z→. 8
 #5 box at 7 10 0 size 15 20 15 u su .: ×1, 4275 celle x0-14 y1-19 z0-14, passi 11, .→u 4275
 #6 one u → 1 (+4) passi=1: ×1, 1 celle x11 y18 z1, passi 12, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0; r5 u → 5 ×0
 #7 all 1u → *1 (+4): ×41, 4274 celle x0-14 y1-19 z0-14, passi 13-53, u→3 4274
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×4274; r4 4u → *4 ×0; r5 5u → *5 ×0
 #30 box at 7 5 2 size 1 1 1 Q su 3: ×1, 1 celle x7 y5 z2, passi 54, 3→Q 1
 #31 ellipsoid at 7 9 0 size 8 11 6 F su 3: ×1, 277 celle x4-10 y4-14 z0-5, passi 55, 3→F 277
#32-33 box×2: 2 celle x6-8 y16 z6, passi 56-57
 #34 ellipsoid at 7 14 4 size 6 5 4 F su 3: ×1, 54 celle x5-9 y12-16 z4-7, passi 58, 3→F 54
#35-36 cone×2: 6 celle x5-9 y14 z7-9, passi 59-60
 #57 prl u → . (+5): ×1, 3935 celle x0-14 y1-19 z0-14, passi 61, 3→. 3935
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×3935; r5 4 → . ×0; r6 5 → . ×0
 #59 prl Q → D: ×1, 1 celle x7 y5 z2, passi 62, Q→D 1
 #60 prl . F → * D passi=1: ×1, 5 celle x6-9 y6-14 z4-9, passi 63, F→D 5
 #61 prl DF → *D passi=2: ×2, 10 celle x5-9 y5-11 z2-5, passi 64-65, F→D 10
Senza effetto (non hanno mai cambiato una cella):
#8 box at 7 5 1 size 1 1 1 Q su 1
#9 ellipsoid at 7 8 0 size 8 8 5 F su 1
#10 ellipsoid at 7 9 2 size 6 7 8 F su 1
#11 line 6 12 0 → 6 11 5 G
#12 line 8 12 0 → 8 11 5 G
#13 box at 6 14 11 size 1 1 1 E su 1
#14 box at 8 14 11 size 1 1 1 E su 1
#15 ellipsoid at 7 12 9 size 6 5 4 F su 1
#16 cone at 5 12 12 size 2 2 3 F su 1
#17 cone at 9 12 12 size 2 2 3 F su 1
#18 box at 7 13 7 size 3 1 3 W su 1
#19 box at 7 5 6 size 1 1 1 Q su 2
… e altri 31
```
