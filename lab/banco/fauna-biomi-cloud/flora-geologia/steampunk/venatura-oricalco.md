# Venatura di oricalco (`venatura-oricalco`)

Uno sperone di roccia nera rigato da vene di oricalco che i minatori di Orichalcum seguono a colpi di piccone.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: lo sperone a caso (guglia alta, mensa larga, due denti), massi che crescono da semi a caso attorno, vene di oricalco che nascono in punti a caso della roccia e la attraversano in direzioni a caso, il puntello dei minatori a caso (palo con lanterna, carrello sui binari, piccone piantato).
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.303 | ≥ 0.15 |
| distanza minima fra due semi | 0.058 | — |
| tempo del seme più lento | 469 ms | < 1500 ms |
| voxel per seme (1-5) | 27893, 10731, 10840, 10722, 10743 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`venatura-oricalco.png`](venatura-oricalco.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 37 nodi, 227 passi, finito in 518 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), R=roccia nera, D=roccia grigia, V=oricalco, W=legno, L=lanterna, g=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: V 14366, R 11851, D 1428, W 247, L 1.
 #2 box at 25 25 0 size 44 44 46 u su .: ×1, 85054 celle x4-46 y4-46 z0-45, passi 1, .→u 85054
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x6 y27 z40, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×103, 85053 celle x4-46 y4-46 z0-45, passi 3-105, u→2 85053
   r1 1u → *1 ×0; r2 2u → *2 ×85053; r3 3u → *3 ×0
#7-8 box×1, ellipsoid×1: 26310 celle x9-41 y11-39 z0-33, passi 106-107
 #12 prl u → . (+3): ×1, 58744 celle x4-46 y4-46 z0-45, passi 108, 2→. 58744
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×58744; r4 3 → . ×0
#13-17 box×1, one×2, prl×2: 3243 celle x2-48 y2-48 z0-27, passi 109-131
 #18 prl PR → VP (+2) passi=20: ×20, 25775 celle x9-41 y11-39 z0-32, passi 132-151, R→P 14360, P→V 11415
   r1 PR → VP ×17973; r2 P R → V P ×2236; r3 R P → P V ×1750
 #19 prl P → V: ×1, 2951 celle x9-41 y11-39 z0-32, passi 152, P→V 2951
 #20 box at 25 43 0 size 50 14 30 u su .: ×1, 17183 celle x1-49 y37-49 z0-29, passi 153, .→u 17183
#21-22 one×1, all×1: 17183 celle x1-49 y37-49 z0-29, passi 154-220
#23-27 line×3, box×1, ellipsoid×1: 856 celle x9-41 y39-47 z0-25, passi 221-225
#36-37 prl×2: 16420 celle x1-49 y11-49 z0-33, passi 226-227
Senza effetto (non hanno mai cambiato una cella):
#5 cone at 25 25 0 size 26 24 44 R su 1
#6 ellipsoid at 25 25 0 size 30 30 14 R su 1
#9 cone at 18 25 0 size 20 20 40 R su 3
#10 cone at 33 23 0 size 18 18 32 R su 3
#11 ellipsoid at 25 25 0 size 36 26 12 R su 3
#28 box at 25 44 0 size 30 6 1 I su 2
#29 box at 22 44 2 size 8 5 5 W su 2
#30 ellipsoid at 22 44 7 size 7 4 3 V su 2
#31 ellipsoid at 25 40 0 size 34 16 4 D su 2
#32 line 30 40 2 → 33 46 16 W
#33 line 30 46 16 → 36 46 16 I
#34 ellipsoid at 33 44 0 size 8 8 3 D su 3
… e altri 1
```
