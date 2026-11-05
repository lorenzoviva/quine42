# Golem runico (`golem-runico`)

Un guardiano di pietra di Aurora, massi sovrapposti tenuti insieme da rune che brillano; il muschio gli cresce sulle spalle.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `persona` (scatola 20 × 15 × 30)
- Scelte procedurali: quattro scelte a caso (gambe divaricate, al passo o in ginocchio; tronco a blocco, a botte o a gradoni; braccia abbassate, alzate o una avanti; testa a masso, a cuneo o affondata) e rune luminose incise in posti a caso sulle facce, muschio sulle facce in alto.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.306 | ≥ 0.15 |
| distanza minima fra due semi | 0.112 | — |
| tempo del seme più lento | 74 ms | < 1500 ms |
| voxel per seme (1-5) | 2585, 2590, 2506, 2512, 2636 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`golem-runico.png`](golem-runico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×15×30, 51 nodi, 207 passi, finito in 64 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), S=pietra, D=pietra scura, M=muschio, R=rune, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 1284, D 1208, M 53, R 40.
#2-5 box×3, one×1: 3151 celle x0-19 y0-14 z0-10, passi 1-11
#6-7 one×1, all×1: 3135 celle x1-19 y0-14 z0-10, passi 12-47
#10-16 box×3, prl×1: 3135 celle x1-19 y0-14 z0-10, passi 48-51
 #17 box at 10 7 8 size 20 15 16 u su .: ×1, 4354 celle x1-19 y0-14 z8-23, passi 52, .→u 4354
#18-19 one×1, all×1: 4354 celle x1-19 y0-14 z8-23, passi 53-96
#20-25 box×1, prl×1: 4354 celle x1-19 y0-14 z8-23, passi 97-98
 #26 box at 10 7 0 size 20 15 30 u su .: ×1, 6580 celle x1-19 y0-14 z0-29, passi 99, .→u 6580
 #27 one u → 1 (+2) passi=1: ×1, 1 celle x2 y0 z28, passi 100, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #28 all 1u → *1 (+2): ×59, 6579 celle x1-19 y0-14 z0-29, passi 101-159, u→1 6579
   r1 1u → *1 ×6579; r2 2u → *2 ×0; r3 3u → *3 ×0
#29-32 box×4: 510 celle x1-19 y5-9 z2-18, passi 160-163
 #40 prl u → . (+3): ×1, 6070 celle x1-19 y0-14 z0-29, passi 164, 1→. 6070
   r1 u → . ×0; r2 1 → . ×6070; r3 2 → . ×0; r4 3 → . ×0
#41-43 box×1, one×1, all×1: 6078 celle x1-19 y0-14 z18-29, passi 165-201
#46-51 box×1, prl×5: 3132 celle x1-19 y0-14 z0-29, passi 202-207
Senza effetto (non hanno mai cambiato una cella):
#8 box at 5 7 0 size 5 6 10 D su 1
#9 box at 15 7 0 size 5 6 10 D su 1
#13 box at 6 9 0 size 5 9 5 D su 3
#14 box at 14 5 0 size 5 5 10 D su 3
#15 box at 6 7 3 size 5 5 7 D su 3
#21 ellipsoid at 10 7 8 size 16 12 14 S su 2
#22 box at 10 7 9 size 10 9 5 S su 3
#23 box at 10 7 13 size 14 11 5 S su 3
#24 box at 10 7 17 size 17 12 4 S su 3
#33 line 3 7 18 → 2 7 27 D
#34 line 17 7 18 → 18 7 27 D
#35 box at 2 7 26 size 5 5 4 S su 2
… e altri 6
```
