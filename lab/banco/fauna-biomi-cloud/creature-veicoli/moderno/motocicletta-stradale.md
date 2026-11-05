# Motocicletta stradale (`motocicletta-stradale`)

Una moto delle strade di Neapolis: ogni seme è un'altra moto, dalla sportiva carenata alla custom con la forcella lunga.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (stile: sportiva, custom, naked, turismo con le borse; scarico: basso a destra, alto a sinistra, doppio; cavalletto o casco appoggiato) e adesivi che compaiono a caso sulle carene.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.403 | ≥ 0.15 |
| distanza minima fra due semi | 0.000 | — |
| tempo del seme più lento | 247 ms | < 1500 ms |
| voxel per seme (1-5) | 1358, 1418, 1418, 2577, 1358 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`motocicletta-stradale.png`](motocicletta-stradale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 63 nodi, 195 passi, finito in 269 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), R=carena rossa, K=gomme e sella, M=motore, C=cromature, L=faro, Y=adesivi, u=marcatore (marcatore).
Alla fine: K 645, M 315, C 259, R 114, L 24, Y 1.
#2-3 box×2: 29250 celle x0-24 y1-39 z0-29, passi 1-2
 #4 one u → 1 (+3) passi=1: ×1, 1 celle x22 y16 z15, passi 3, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #5 all 1u → *1 (+3): ×60, 28934 celle x0-24 y1-39 z0-29, passi 4-63, u→3 28934
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×28934; r4 4u → *4 ×0
#26-33 ellipsoid×3, line×3, box×1, cylinder×1: 731 celle x7-17 y4-35 z0-19, passi 64-71
 #44 prl u → . (+4): ×1, 28204 celle x0-24 y1-39 z0-29, passi 72, 3→. 28204
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×28204; r5 4 → . ×0
 #45 box at 12 12 0 size 25 24 22 u su .: ×1, 11900 celle x0-24 y1-23 z0-21, passi 73, .→u 11900
#46-47 one×1, all×1: 11900 celle x0-24 y1-23 z0-21, passi 74-127
#51-53 line×2, prl×1: 11900 celle x0-24 y1-23 z0-21, passi 128-130
 #54 box at 12 20 0 size 25 30 26 u su .: ×1, 17636 celle x0-24 y6-34 z0-25, passi 131, .→u 17636
#55-56 one×1, all×1: 17636 celle x0-24 y6-34 z0-25, passi 132-192
#58-63 ellipsoid×1, prl×2: 17637 celle x0-24 y6-34 z0-25, passi 193-195
Senza effetto (non hanno mai cambiato una cella):
#6 ellipsoid at 12 8 0 size 3 12 12 K su 1
#7 ellipsoid at 12 31 0 size 3 12 12 K su 1
#8 line 12 8 6 → 12 31 6 C
#9 ellipsoid at 12 22 10 size 6 9 5 R su 1
#10 ellipsoid at 12 29 7 size 7 9 10 R su 1
#11 box at 12 14 12 size 5 8 2 K su 1
#12 cone at 12 9 12 size 5 6 4 R su 1
#13 box at 12 33 15 size 5 2 3 V su 1
#14 box at 12 34 11 size 2 1 2 L su 1
#15 line 9 28 15 → 15 28 15 C
#16 ellipsoid at 12 7 0 size 3 13 13 K su 2
#17 ellipsoid at 12 35 0 size 3 11 11 K su 2
… e altri 25
```
