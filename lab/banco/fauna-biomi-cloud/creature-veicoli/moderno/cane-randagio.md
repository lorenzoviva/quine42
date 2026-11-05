# Cane randagio (`cane-randagio`)

Il randagio dei vicoli di Neapolis: pelo fulvo a chiazze, orecchie che fanno quello che vogliono.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `animale` (scatola 15 × 20 × 15)
- Scelte procedurali: la postura a caso (in piedi, seduto, sdraiato, a fiutare), poi orecchie che crescono dritte, di sbieco o cadenti, una coda che cresce in una direzione a caso e chiazze del mantello che si allargano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.628 | ≥ 0.15 |
| distanza minima fra due semi | 0.026 | — |
| tempo del seme più lento | 21 ms | < 1500 ms |
| voxel per seme (1-5) | 526, 444, 526, 411, 444 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cane-randagio.png`](cane-randagio.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 15×20×15, 55 nodi, 65 passi, finito in 22 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), F=pelo fulvo, D=chiazze scure, W=muso chiaro, G=zampe, K=naso, P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 457, G 32, D 29, W 7, K 1.
#2-3 box×2: 8 celle x0-6 y0-1 z0, passi 1-2
 #4 one z → . passi=8: ×8, 8 celle x0-6 y0-1 z0, passi 3-10, z→. 8
 #5 box at 7 10 0 size 15 20 15 u su .: ×1, 4275 celle x0-14 y1-19 z0-14, passi 11, .→u 4275
 #6 one u → 1 (+3) passi=1: ×1, 1 celle x6 y11 z10, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #7 all 1u → *1 (+3): ×28, 4274 celle x0-14 y1-19 z0-14, passi 13-40, u→2 4274
   r1 1u → *1 ×0; r2 2u → *2 ×4274; r3 3u → *3 ×0; r4 4u → *4 ×0
#19-28 box×5, ellipsoid×3, line×2: 518 celle x3-11 y3-15 z0-13, passi 41-50
 #49 prl u → . (+4): ×1, 3757 celle x0-14 y1-19 z0-14, passi 51, 2→. 3757
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×3757; r4 3 → . ×0; r5 4 → . ×0
 #50 one . P → P F (+2) passi=4: ×4, 8 celle x4-5 y10-11 z13-14, passi 52-55, P→F 4, .→P 4
   r1 . P → P F ×1; r2 .* *P → P* *F ×1; r3 P* *. → F* *P ×2
 #51 prl P → D: ×1, 2 celle x4-9 y11 z13, passi 56, P→D 2
 #52 one . Q → Q F (+2) passi=4: ×4, 8 celle x7-11 y3 z1-4, passi 57-60, Q→F 4, .→Q 4
   r1 . Q → Q F ×0; r2 .* *Q → Q* *F ×3; r3 Q. → FQ ×1
#53-54 prl×2: 6 celle x6-11 y3-12 z2-10, passi 61-62
 #55 prl DF → *D passi=3: ×3, 22 celle x4-9 y6-12 z2-13, passi 63-65, F→D 22
Senza effetto (non hanno mai cambiato una cella):
#8 box at 7 3 8 size 1 1 1 Q su 1
#9 cylinder at 5 6 0 size 2 2 7 G su 1
#10 cylinder at 9 6 0 size 2 2 7 G su 1
#11 cylinder at 5 13 0 size 2 2 7 G su 1
#12 cylinder at 9 13 0 size 2 2 7 G su 1
#13 ellipsoid at 7 10 5 size 7 14 6 F su 1
#14 box at 5 16 12 size 1 1 1 P su 1
#15 box at 9 16 12 size 1 1 1 P su 1
#16 ellipsoid at 7 16 8 size 6 6 5 F su 1
#17 box at 7 19 9 size 3 2 2 W su 1
#18 box at 7 19 10 size 1 1 1 K su 1
#29 box at 7 3 1 size 1 1 1 Q su 3
… e altri 19
```
