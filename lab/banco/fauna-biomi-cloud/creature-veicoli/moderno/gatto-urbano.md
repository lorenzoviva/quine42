# Gatto urbano (`gatto-urbano`)

Il gatto dei tetti di Neapolis: tigrato, sornione, la coda che si muove per conto suo.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `animale` (scatola 15 × 20 × 15)
- Scelte procedurali: la postura a caso (seduto, in cammino, a pagnotta, ad arco, sdraiato su un fianco), una coda lunga che cresce in direzioni a caso e strisce tigrate che si allungano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.390 | ≥ 0.15 |
| distanza minima fra due semi | 0.022 | — |
| tempo del seme più lento | 22 ms | < 1500 ms |
| voxel per seme (1-5) | 368, 368, 368, 467, 368 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`gatto-urbano.png`](gatto-urbano.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 15×20×15, 58 nodi, 63 passi, finito in 32 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 4=marcatore (marcatore), F=pelo grigio, D=strisce, G=zampe, E=occhi, Q=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 271, G 88, D 7, E 2.
 #2 box at 7 10 0 size 15 20 15 u su .: ×1, 4275 celle x0-14 y1-19 z0-14, passi 1, .→u 4275
 #3 one u → 1 (+4) passi=1: ×1, 1 celle x8 y1 z2, passi 2, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1; r5 u → 5 ×0
 #4 all 1u → *1 (+4): ×38, 4274 celle x0-14 y1-19 z0-14, passi 3-40, u→4 4274
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×4274; r5 5u → *5 ×0
#34-35 box×1, line×1: 24 celle x5-7 y4-8 z0-8, passi 41-42
#36-38 line×3: 65 celle x5-9 y4-16 z0-8, passi 43-45
 #39 ellipsoid at 7 10 6 size 6 11 7 F su 4: ×1, 222 celle x5-9 y5-15 z6-12, passi 46, 4→F 222
#40-44 box×2, ellipsoid×1, cone×2: 50 celle x5-9 y13-17 z5-10, passi 47-51
 #54 prl u → . (+5): ×1, 3914 celle x0-14 y1-19 z0-14, passi 52, 4→. 3914
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×3914; r6 5 → . ×0
 #55 one . Q → Q F (+2) passi=7: ×7, 14 celle x3-7 y3-5 z8-11, passi 53-59, .→Q 7, Q→F 7
   r1 . Q → Q F ×1; r2 .* *Q → Q* *F ×2; r3 Q. → FQ ×4
 #56 prl Q → D: ×1, 1 celle x3 y3 z11, passi 60, Q→D 1
 #57 prl . F → * D passi=1: ×1, 2 celle x5-8 y8-16 z8-11, passi 61, F→D 2
 #58 prl DF → *D passi=2: ×2, 4 celle x4-7 y3-16 z8-11, passi 62-63, F→D 4
Senza effetto (non hanno mai cambiato una cella):
#5 box at 7 5 1 size 1 1 1 Q su 1
#6 ellipsoid at 7 8 0 size 8 8 5 F su 1
#7 ellipsoid at 7 9 2 size 6 7 8 F su 1
#8 line 6 12 0 → 6 11 5 G
#9 line 8 12 0 → 8 11 5 G
#10 box at 6 14 11 size 1 1 1 E su 1
#11 box at 8 14 11 size 1 1 1 E su 1
#12 ellipsoid at 7 12 9 size 6 5 4 F su 1
#13 cone at 5 12 12 size 2 2 3 F su 1
#14 cone at 9 12 12 size 2 2 3 F su 1
#15 box at 7 13 7 size 3 1 3 W su 1
#16 box at 7 5 6 size 1 1 1 Q su 2
… e altri 26
```
