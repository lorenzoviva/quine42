# Navetta orbitale (`navetta-orbitale`)

La navetta che fa la spola fra le stazioni di Sidera, posata sui suoi carrelli.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: quattro scelte a caso (fusoliera lunga, tozza o a freccia; ali a delta, a freccia o corte; deriva singola, doppia o a V; motori: due, tre o uno solo grande) e pannelli termici scuri che si allargano a caso sulla pancia.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.362 | ≥ 0.15 |
| distanza minima fra due semi | 0.000 | — |
| tempo del seme più lento | 228 ms | < 1500 ms |
| voxel per seme (1-5) | 5325, 3763, 4453, 5514, 3763 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`navetta-orbitale.png`](navetta-orbitale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 57 nodi, 259 passi, finito in 260 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=scafo, K=pannelli termici, G=carrelli, V=vetri, O=ugelli, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: W 4060, K 611, G 386, V 262, O 6.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-11 line×3, box×4: 16954 celle x16-34 y1-49 z0-23, passi 11-17
 #12 one u → 1 (+2) passi=1: ×1, 1 celle x24 y4 z11, passi 18, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #13 all 1u → *1 (+2): ×67, 16567 celle x16-34 y1-49 z6-23, passi 19-85, u→2 16567
   r1 1u → *1 ×0; r2 2u → *2 ×16567; r3 3u → *3 ×0
 #15 ellipsoid at 25 26 7 size 16 34 14 W su 2: ×1, 3888 celle x18-32 y10-42 z7-20, passi 86, 2→W 3888
 #17 prl u → . (+3): ×1, 12680 celle x16-34 y1-49 z6-23, passi 87, 2→. 12680
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×12680; r4 3 → . ×0
#18-19 ellipsoid×1, box×1: 7132 celle x1-49 y6-40 z8-18, passi 88-89
#20-21 one×1, all×1: 6870 celle x1-49 y6-34 z8-13, passi 90-160
#27-30 box×3, prl×1: 6870 celle x1-49 y6-34 z8-13, passi 161-164
 #31 box at 25 10 14 size 30 14 24 u su .: ×1, 8798 celle x11-39 y4-16 z14-37, passi 165, .→u 8798
#32-33 one×1, all×1: 8798 celle x11-39 y4-16 z14-37, passi 166-206
#35-39 line×2, prl×1: 8798 celle x11-39 y4-16 z14-37, passi 207-209
#40-42 box×1, one×1, all×1: 9180 celle x11-39 y3-11 z4-21, passi 210-248
#47-57 ellipsoid×3, box×3, prl×3: 4802 celle x8-42 y3-39 z4-26, passi 249-259
Senza effetto (non hanno mai cambiato una cella):
#14 ellipsoid at 25 25 8 size 12 44 11 W su 1
#16 ellipsoid at 25 24 8 size 10 46 10 W su 3
#22 ellipsoid at 25 14 10 size 46 22 2 W su 1
#23 line 23 24 11 → 3 8 11 W
#24 line 27 24 11 → 47 8 11 W
#25 line 23 18 11 → 5 6 11 W
#26 line 27 18 11 → 45 6 11 W
#34 box at 25 11 15 size 2 8 18 W su 1
#37 line 24 11 15 → 15 8 30 W
#38 line 26 11 15 → 35 8 30 W
#43 ellipsoid at 21 8 9 size 6 8 6 K su 1
#44 ellipsoid at 29 8 9 size 6 8 6 K su 1
… e altri 4
```
