# Motocicletta stradale (`motocicletta-stradale`)

Una moto delle strade di Neapolis: ogni seme è un'altra moto, dalla sportiva carenata alla custom con la forcella lunga.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (stile: sportiva, custom, naked, turismo con le borse; scarico: basso a destra, alto a sinistra, doppio; cavalletto o casco appoggiato) e adesivi che compaiono a caso sulle carene.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.535 | ≥ 0.15 |
| distanza minima fra due semi | 0.000 | — |
| tempo del seme più lento | 235 ms | < 1500 ms |
| voxel per seme (1-5) | 1390, 2724, 1390, 1288, 2575 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`motocicletta-stradale.png`](motocicletta-stradale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 68 nodi, 214 passi, finito in 241 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), R=carena rossa, K=gomme e sella, M=motore, C=cromature, Y=adesivi, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 729, M 315, C 239, R 103, Y 4.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 box×2: 29250 celle x0-24 y1-39 z0-29, passi 11-12
 #7 one u → 1 (+3) passi=1: ×1, 1 celle x11 y8 z21, passi 13, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #8 all 1u → *1 (+3): ×65, 28934 celle x0-24 y1-39 z0-29, passi 14-78, u→2 28934
   r1 1u → *1 ×0; r2 2u → *2 ×28934; r3 3u → *3 ×0; r4 4u → *4 ×0
#19-27 ellipsoid×3, line×5, box×1: 698 celle x7-17 y1-39 z0-27, passi 79-87
 #49 prl u → . (+4): ×1, 28237 celle x0-24 y1-39 z0-29, passi 88, 2→. 28237
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×28237; r4 3 → . ×0; r5 4 → . ×0
 #50 box at 12 12 0 size 25 24 22 u su .: ×1, 11937 celle x0-24 y1-23 z0-21, passi 89, .→u 11937
#51-52 one×1, all×1: 11937 celle x0-24 y1-23 z0-21, passi 90-144
#54-58 line×1, cylinder×1, prl×1: 11937 celle x0-24 y1-23 z0-21, passi 145-147
 #59 box at 12 20 0 size 25 30 26 u su .: ×1, 17932 celle x0-24 y6-34 z0-25, passi 148, .→u 17932
#60-61 one×1, all×1: 17932 celle x0-24 y6-34 z0-25, passi 149-210
#65-68 line×1, box×1, prl×2: 17936 celle x0-24 y6-34 z0-25, passi 211-214
Senza effetto (non hanno mai cambiato una cella):
#9 ellipsoid at 12 8 0 size 3 12 12 K su 1
#10 ellipsoid at 12 31 0 size 3 12 12 K su 1
#11 line 12 8 6 → 12 31 6 C
#12 ellipsoid at 12 22 10 size 6 9 5 R su 1
#13 ellipsoid at 12 29 7 size 7 9 10 R su 1
#14 box at 12 14 12 size 5 8 2 K su 1
#15 cone at 12 9 12 size 5 6 4 R su 1
#16 box at 12 33 15 size 5 2 3 V su 1
#17 box at 12 34 11 size 2 1 2 L su 1
#18 line 9 28 15 → 15 28 15 C
#28 box at 12 29 18 size 2 2 2 L su 2
#29 ellipsoid at 12 9 0 size 3 12 12 K su 3
… e altri 25
```
