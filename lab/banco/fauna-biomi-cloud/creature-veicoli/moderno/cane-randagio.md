# Cane randagio (`cane-randagio`)

Il randagio dei vicoli di Neapolis: pelo fulvo a chiazze, orecchie che fanno quello che vogliono.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `animale` (scatola 15 × 20 × 15)
- Scelte procedurali: la postura a caso (in piedi, seduto, sdraiato, a fiutare), poi orecchie che crescono dritte, di sbieco o cadenti, una coda che cresce in una direzione a caso e chiazze del mantello che si allargano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.354 | ≥ 0.15 |
| distanza minima fra due semi | 0.029 | — |
| tempo del seme più lento | 21 ms | < 1500 ms |
| voxel per seme (1-5) | 411, 411, 411, 444, 411 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cane-randagio.png`](cane-randagio.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 15×20×15, 52 nodi, 56 passi, finito in 36 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 3=marcatore (marcatore), F=pelo fulvo, D=chiazze scure, W=muso chiaro, G=zampe, K=naso, P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 357, D 24, G 22, W 7, K 1.
 #2 box at 7 10 0 size 15 20 15 u su .: ×1, 4275 celle x0-14 y1-19 z0-14, passi 1, .→u 4275
 #3 one u → 1 (+3) passi=1: ×1, 1 celle x12 y12 z7, passi 2, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #4 all 1u → *1 (+3): ×30, 4274 celle x0-14 y1-19 z0-14, passi 3-32, u→3 4274
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×4274; r4 4u → *4 ×0
#26-27 box×1, ellipsoid×1: 300 celle x4-10 y3-16 z0-4, passi 33-34
#28-34 line×2, box×4, ellipsoid×1: 103 celle x4-10 y13-19 z0-7, passi 35-41
 #46 prl u → . (+4): ×1, 3872 celle x0-14 y1-19 z0-14, passi 42, 3→. 3872
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×3872; r5 4 → . ×0
 #47 one . P → P F (+2) passi=4: ×4, 8 celle x5-11 y15-16 z5-9, passi 43-46, .→P 4, P→F 4
   r1 . P → P F ×0; r2 .* *P → P* *F ×2; r3 P* *. → F* *P ×2
 #48 prl P → D: ×1, 2 celle x6-11 y15-16 z5-9, passi 47, P→D 2
 #49 one . Q → Q F (+2) passi=4: ×4, 8 celle x7-9 y3 z1-4, passi 48-51, Q→F 4, .→Q 4
   r1 . Q → Q F ×0; r2 .* *Q → Q* *F ×3; r3 Q. → FQ ×1
 #50 prl Q → W: ×1, 1 celle x9 y3 z4, passi 52, Q→W 1
 #51 prl F → D passi=1: ×1, 5 celle x4-9 y4-16 z0-4, passi 53, F→D 5
 #52 prl DF → *D passi=3: ×3, 17 celle x4-9 y4-16 z0-4, passi 54-56, F→D 17
Senza effetto (non hanno mai cambiato una cella):
#5 box at 7 3 8 size 1 1 1 Q su 1
#6 cylinder at 5 6 0 size 2 2 7 G su 1
#7 cylinder at 9 6 0 size 2 2 7 G su 1
#8 cylinder at 5 13 0 size 2 2 7 G su 1
#9 cylinder at 9 13 0 size 2 2 7 G su 1
#10 ellipsoid at 7 10 5 size 7 14 6 F su 1
#11 box at 5 16 12 size 1 1 1 P su 1
#12 box at 9 16 12 size 1 1 1 P su 1
#13 ellipsoid at 7 16 8 size 6 6 5 F su 1
#14 box at 7 19 9 size 3 2 2 W su 1
#15 box at 7 19 10 size 1 1 1 K su 1
#16 box at 7 3 1 size 1 1 1 Q su 2
… e altri 20
```
