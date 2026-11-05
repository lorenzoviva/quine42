# Statua colosso (`statua-colosso`)

Il guardiano di pietra che veglia su un passo di Aurora: ogni seme è un altro eroe, con la sua posa e il suo copricapo.

- Collezione: `monumenti-rovine` · ambientazione: `fantasy` · classe: `monumento` (scatola 20 × 20 × 60)
- Scelte procedurali: tre scelte a caso (la posa: con la lancia, a braccia alzate, con la spada piantata, con lo scudo; il copricapo: elmo crestato, corona, cappuccio; il piedistallo: a gradoni, a tamburo, di roccia) e muschio, licheni e crepe a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.280 | ≥ 0.15 |
| distanza minima fra due semi | 0.034 | — |
| tempo del seme più lento | 124 ms | < 1500 ms |
| voxel per seme (1-5) | 4160, 4713, 4711, 4042, 4840 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`statua-colosso.png`](statua-colosso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×20×60, 55 nodi, 160 passi, finito in 134 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 4=marcatore (marcatore), S=pietra chiara, D=pietra scura, O=bronzo, M=muschio, K=crepe, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 3169, D 667, O 137, M 134, K 53.
#2-5 box×3, one×1: 3265 celle x0-19 y0-19 z0-8, passi 1-11
#6-14 one×1, all×1, cylinder×2, prl×1: 6498 celle x1-19 y1-19 z0-8, passi 12-40
#15-20 line×2, cone×1, box×2, ellipsoid×1: 18772 celle x1-19 y1-19 z8-59, passi 41-46
 #21 one u → 1 (+3) passi=1: ×1, 1 celle x3 y11 z39, passi 47, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #22 all 1u → *1 (+3): ×57, 16557 celle x1-19 y1-19 z8-59, passi 48-104, u→4 16557
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×16557
#35-38 line×3, ellipsoid×1: 271 celle x1-19 y8-15 z22-53, passi 105-108
 #39 prl u → . (+4): ×1, 16287 celle x1-19 y1-19 z8-59, passi 109, 4→. 16287
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×16287
 #40 box at 10 10 40 size 20 20 20 u su .: ×1, 6973 celle x1-19 y1-19 z40-59, passi 110, .→u 6973
#41-42 one×1, all×1: 6973 celle x1-19 y1-19 z40-59, passi 111-153
#43-45 ellipsoid×1, line×2: 219 celle x7-13 y5-16 z42-52, passi 154-156
#52-55 prl×4: 6941 celle x1-19 y1-19 z1-59, passi 157-160
Senza effetto (non hanno mai cambiato una cella):
#8 box at 10 10 0 size 19 19 3 D su 1
#9 box at 10 10 3 size 15 15 3 D su 1
#10 box at 10 10 6 size 12 12 2 S su 1
#13 ellipsoid at 10 10 0 size 20 20 14 D su 3
#23 line 4 10 35 → 3 12 24 S
#24 line 16 10 35 → 17 12 26 S
#25 line 17 12 8 → 17 12 58 O
#26 cone at 17 12 54 size 3 3 5 O su 1
#27 line 4 10 35 → 2 10 50 S
#28 line 16 10 35 → 18 10 50 S
#29 ellipsoid at 2 10 50 size 3 3 3 S su 2
#30 ellipsoid at 18 10 50 size 3 3 3 S su 2
… e altri 10
```
