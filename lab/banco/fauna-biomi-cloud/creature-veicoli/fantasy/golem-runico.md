# Golem runico (`golem-runico`)

Un guardiano di pietra di Aurora, massi sovrapposti tenuti insieme da rune che brillano; il muschio gli cresce sulle spalle.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `persona` (scatola 20 × 15 × 30)
- Scelte procedurali: quattro scelte a caso (gambe divaricate, al passo o in ginocchio; tronco a blocco, a botte o a gradoni; braccia abbassate, alzate o una avanti; testa a masso, a cuneo o affondata) e rune luminose incise in posti a caso sulle facce, muschio sulle facce in alto.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.287 | ≥ 0.15 |
| distanza minima fra due semi | 0.053 | — |
| tempo del seme più lento | 57 ms | < 1500 ms |
| voxel per seme (1-5) | 2568, 2931, 2773, 2661, 2552 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`golem-runico.png`](golem-runico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×15×30, 48 nodi, 180 passi, finito in 64 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), S=pietra, D=pietra scura, M=muschio, R=rune, u=marcatore (marcatore).
Alla fine: S 1296, D 1177, M 48, R 47.
 #2 box at 10 7 0 size 20 15 11 u su .: ×1, 3135 celle x1-19 y0-14 z0-10, passi 1, .→u 3135
#3-4 one×1, all×1: 3135 celle x1-19 y0-14 z0-10, passi 2-32
#7-13 box×3, prl×1: 3135 celle x1-19 y0-14 z0-10, passi 33-36
 #14 box at 10 7 8 size 20 15 16 u su .: ×1, 4354 celle x1-19 y0-14 z8-23, passi 37, .→u 4354
#15-16 one×1, all×1: 4354 celle x1-19 y0-14 z8-23, passi 38-73
#17-22 box×1, prl×1: 4354 celle x1-19 y0-14 z8-23, passi 74-75
 #23 box at 10 7 0 size 20 15 30 u su .: ×1, 6580 celle x1-19 y0-14 z0-29, passi 76, .→u 6580
 #24 one u → 1 (+2) passi=1: ×1, 1 celle x1 y2 z8, passi 77, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #25 all 1u → *1 (+2): ×51, 6579 celle x1-19 y0-14 z0-29, passi 78-128, u→2 6579
   r1 1u → *1 ×0; r2 2u → *2 ×6579; r3 3u → *3 ×0
#30-33 line×2, box×2: 460 celle x1-19 y5-9 z16-29, passi 129-132
 #37 prl u → . (+3): ×1, 6120 celle x1-19 y0-14 z0-29, passi 133, 2→. 6120
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×6120; r4 3 → . ×0
#38-40 box×1, one×1, all×1: 5294 celle x1-19 y0-14 z18-29, passi 134-174
#42-48 cone×1, prl×5: 2742 celle x1-19 y0-14 z1-29, passi 175-180
Senza effetto (non hanno mai cambiato una cella):
#5 box at 5 7 0 size 5 6 10 D su 1
#6 box at 15 7 0 size 5 6 10 D su 1
#10 box at 6 9 0 size 5 9 5 D su 3
#11 box at 14 5 0 size 5 5 10 D su 3
#12 box at 6 7 3 size 5 5 7 D su 3
#18 ellipsoid at 10 7 8 size 16 12 14 S su 2
#19 box at 10 7 9 size 10 9 5 S su 3
#20 box at 10 7 13 size 14 11 5 S su 3
#21 box at 10 7 17 size 17 12 4 S su 3
#26 box at 2 7 3 size 4 5 16 D su 1
#27 box at 18 7 3 size 4 5 16 D su 1
#28 box at 2 7 2 size 4 6 4 S su 1
… e altri 6
```
