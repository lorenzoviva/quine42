# Navetta orbitale (`navetta-orbitale`)

La navetta che fa la spola fra le stazioni di Sidera, posata sui suoi carrelli.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: quattro scelte a caso (fusoliera lunga, tozza o a freccia; ali a delta, a freccia o corte; deriva singola, doppia o a V; motori: due, tre o uno solo grande) e pannelli termici scuri che si allargano a caso sulla pancia.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.343 | ≥ 0.15 |
| distanza minima fra due semi | 0.059 | — |
| tempo del seme più lento | 293 ms | < 1500 ms |
| voxel per seme (1-5) | 5819, 4161, 4147, 3953, 3763 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`navetta-orbitale.png`](navetta-orbitale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 54 nodi, 269 passi, finito in 237 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=scafo, K=pannelli termici, G=carrelli, V=vetri, O=ugelli, u=marcatore (marcatore).
Alla fine: W 4691, K 474, G 386, V 262, O 6.
#2-8 line×3, box×4: 16954 celle x16-34 y1-49 z0-23, passi 1-7
 #9 one u → 1 (+2) passi=1: ×1, 1 celle x24 y44 z21, passi 8, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #10 all 1u → *1 (+2): ×68, 16567 celle x16-34 y1-49 z6-23, passi 9-76, u→2 16567
   r1 1u → *1 ×0; r2 2u → *2 ×16567; r3 3u → *3 ×0
 #12 ellipsoid at 25 26 7 size 16 34 14 W su 2: ×1, 3888 celle x18-32 y10-42 z7-20, passi 77, 2→W 3888
 #14 prl u → . (+3): ×1, 12680 celle x16-34 y1-49 z6-23, passi 78, 2→. 12680
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×12680; r4 3 → . ×0
#15-16 ellipsoid×1, box×1: 7132 celle x1-49 y6-40 z8-18, passi 79-80
#17-18 one×1, all×1: 6870 celle x1-49 y6-34 z8-13, passi 81-152
#20-27 line×4, prl×1: 6870 celle x1-49 y6-34 z8-13, passi 153-157
 #28 box at 25 10 14 size 30 14 24 u su .: ×1, 8798 celle x11-39 y4-16 z14-37, passi 158, .→u 8798
#29-30 one×1, all×1: 8798 celle x11-39 y4-16 z14-37, passi 159-203
#34-36 line×2, prl×1: 8798 celle x11-39 y4-16 z14-37, passi 204-206
#37-39 box×1, one×1, all×1: 8840 celle x11-39 y3-11 z4-21, passi 207-258
#44-54 ellipsoid×3, box×3, prl×3: 4621 celle x9-45 y3-39 z4-28, passi 259-269
Senza effetto (non hanno mai cambiato una cella):
#11 ellipsoid at 25 25 8 size 12 44 11 W su 1
#13 ellipsoid at 25 24 8 size 10 46 10 W su 3
#19 ellipsoid at 25 14 10 size 46 22 2 W su 1
#24 box at 25 18 10 size 36 10 2 W su 3
#25 box at 7 18 8 size 2 10 6 K su 3
#26 box at 43 18 8 size 2 10 6 K su 3
#31 box at 25 11 15 size 2 8 18 W su 1
#32 line 23 12 16 → 19 8 31 W
#33 line 27 12 16 → 31 8 31 W
#40 ellipsoid at 21 8 9 size 6 8 6 K su 1
#41 ellipsoid at 29 8 9 size 6 8 6 K su 1
#42 box at 21 4 11 size 3 1 3 O su 1
… e altri 3
```
