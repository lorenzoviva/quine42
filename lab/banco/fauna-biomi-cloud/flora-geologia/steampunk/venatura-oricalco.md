# Venatura di oricalco (`venatura-oricalco`)

Uno sperone di roccia nera rigato da vene di oricalco che i minatori di Orichalcum seguono a colpi di piccone.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: lo sperone a caso (guglia alta, mensa larga, due denti), massi che crescono da semi a caso attorno, vene di oricalco che nascono in punti a caso della roccia e la attraversano in direzioni a caso, il puntello dei minatori a caso (palo con lanterna, carrello sui binari, piccone piantato).
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.472 | ≥ 0.15 |
| distanza minima fra due semi | 0.041 | — |
| tempo del seme più lento | 447 ms | < 1500 ms |
| voxel per seme (1-5) | 27741, 10481, 11391, 27849, 10566 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`venatura-oricalco.png`](venatura-oricalco.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 40 nodi, 233 passi, finito in 481 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), R=roccia nera, D=roccia grigia, V=oricalco, W=legno, I=ferro, g=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: R 14922, V 11299, D 1450, W 56, I 14.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 44 44 46 u su .: ×1, 85054 celle x4-46 y4-46 z0-45, passi 11, .→u 85054
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x33 y36 z12, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×94, 85053 celle x4-46 y4-46 z0-45, passi 13-106, u→2 85053
   r1 1u → *1 ×0; r2 2u → *2 ×85053; r3 3u → *3 ×0
#10-11 box×1, ellipsoid×1: 26310 celle x9-41 y11-39 z0-33, passi 107-108
 #15 prl u → . (+3): ×1, 58744 celle x4-46 y4-46 z0-45, passi 109, 2→. 58744
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×58744; r4 3 → . ×0
#16-20 box×1, one×2, prl×2: 3349 celle x2-48 y2-48 z0-32, passi 110-132
 #21 prl PR → VP (+2) passi=20: ×20, 20236 celle x10-41 y12-39 z0-33, passi 133-152, R→P 11293, P→V 8943
   r1 PR → VP ×14301; r2 P R → V P ×1894; r3 R P → P V ×1253
 #22 prl P → V: ×1, 2356 celle x10-41 y12-39 z0-33, passi 153, P→V 2356
 #23 box at 25 43 0 size 50 14 30 u su .: ×1, 17026 celle x1-49 y37-49 z0-29, passi 154, .→u 17026
#24-25 one×1, all×1: 17025 celle x1-49 y37-49 z0-29, passi 155-227
#35-38 line×2, ellipsoid×2: 604 celle x9-41 y39-47 z0-17, passi 228-231
#39-40 prl×2: 16511 celle x1-49 y11-49 z0-33, passi 232-233
Senza effetto (non hanno mai cambiato una cella):
#8 cone at 25 25 0 size 26 24 44 R su 1
#9 ellipsoid at 25 25 0 size 30 30 14 R su 1
#12 cone at 18 25 0 size 20 20 40 R su 3
#13 cone at 33 23 0 size 18 18 32 R su 3
#14 ellipsoid at 25 25 0 size 36 26 12 R su 3
#26 line 20 46 0 → 20 46 24 W
#27 line 20 46 24 → 20 41 24 W
#28 box at 20 41 22 size 2 2 2 L su 1
#29 line 20 46 0 → 20 41 0 W
#30 ellipsoid at 25 40 0 size 34 16 4 D su 1
#31 box at 25 44 0 size 30 6 1 I su 2
#32 box at 22 44 2 size 8 5 5 W su 2
… e altri 2
```
