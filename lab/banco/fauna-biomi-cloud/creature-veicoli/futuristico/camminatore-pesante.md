# Camminatore pesante (`camminatore-pesante`)

Il camminatore bipede dei cantieri orbitali di Sidera: gambe a pistone, cabina corazzata, bracci da lavoro o da guardia.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (gambe erette, al passo, accovacciate; cabina larga, a cupola o a torre; bracci con due cannoni, con lanciamissili sulle spalle, con artiglio e cannone) e antenne che crescono a rami dalle spalle, piastre di colore diverso a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.409 | ≥ 0.15 |
| distanza minima fra due semi | 0.002 | — |
| tempo del seme più lento | 585 ms | < 1500 ms |
| voxel per seme (1-5) | 7466, 9300, 9299, 7610, 8606 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`camminatore-pesante.png`](camminatore-pesante.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 59 nodi, 288 passi, finito in 561 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), W=corazza, Y=piastre gialle, G=pistoni, K=giunti, V=cabina di vetro, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: W 3225, G 2323, K 1798, Y 84, V 36.
#2-3 box×2: 40716 celle x6-44 y3-47 z0-25, passi 1-2
 #4 one u → 1 (+2) passi=1: ×1, 1 celle x11 y7 z20, passi 3, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #5 all 1u → *1 (+2): ×93, 40013 celle x6-44 y3-47 z0-22, passi 4-96, u→2 40013
   r1 1u → *1 ×0; r2 2u → *2 ×40013; r3 3u → *3 ×0
#12-17 box×2, line×4: 1627 celle x14-36 y10-42 z0-22, passi 97-102
 #24 prl u → . (+3): ×1, 38387 celle x6-44 y3-47 z0-22, passi 103, 2→. 38387
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×38387; r4 3 → . ×0
#25-27 box×1, one×1, all×1: 30816 celle x12-38 y14-36 z25-49, passi 104-160
#32-34 box×2, prl×1: 15408 celle x12-38 y14-36 z25-49, passi 161-163
#35-39 box×5: 82757 celle x1-49 y11-49 z4-49, passi 164-168
 #40 one u → 1 (+2) passi=1: ×1, 1 celle x18 y25 z48, passi 169, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #41 all 1u → *1 (+2): ×99, 82166 celle x1-49 y11-49 z4-49, passi 170-268, u→1 82166
   r1 1u → *1 ×82166; r2 2u → *2 ×0; r3 3u → *3 ×0
#42-45 line×2, box×2: 1192 celle x8-42 y22-48 z28-34, passi 269-272
 #55 prl u → . (+3): ×1, 80975 celle x1-49 y11-49 z4-49, passi 273, 1→. 80975
   r1 u → . ×0; r2 1 → . ×80975; r3 2 → . ×0; r4 3 → . ×0
#56-59 one×1, prl×3: 106 celle x14-37 y18-26 z28-42, passi 274-288
Senza effetto (non hanno mai cambiato una cella):
#6 box at 17 27 0 size 8 12 3 K su 1
#7 box at 33 27 0 size 8 12 3 K su 1
#8 line 20 25 22 → 17 25 11 G
#9 line 17 25 11 → 17 26 2 G
#10 line 30 25 22 → 33 25 11 G
#11 line 33 25 11 → 33 26 2 G
#18 box at 14 27 0 size 8 12 3 K su 3
#19 box at 36 27 0 size 8 12 3 K su 3
#20 line 20 25 22 → 14 36 13 G
#21 line 14 36 13 → 14 27 2 G
#22 line 30 25 22 → 36 36 13 G
#23 line 36 36 13 → 36 27 2 G
… e altri 13
```
