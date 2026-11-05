# Camino geotermico (`camino-geotermico`)

Una bocca di vapore delle terre calde di Orichalcum, incanalata in camini d'ottone che sbuffano.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la collina di roccia cresce da massi nati a caso; i camini a caso (uno grande, tre in fila, un fascio storto, una cupola con valvole); il vapore sale a rami dalle bocche e si gonfia a caso; zolfo a caso sulla roccia.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.202 | ≥ 0.15 |
| distanza minima fra due semi | 0.100 | — |
| tempo del seme più lento | 309 ms | < 1500 ms |
| voxel per seme (1-5) | 12027, 12016, 12057, 12095, 12045 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`camino-geotermico.png`](camino-geotermico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 37 nodi, 132 passi, finito in 316 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), R=roccia calda, Y=zolfo, O=ottone, I=ferro, S=vapore, L=brace, g=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: R 10784, O 793, I 273, Y 156, S 19, L 2.
#2-3 cone×1, box×1: 4340 celle x4-46 y4-46 z0-11, passi 1-2
 #4 one Rg → *R passi=7: ×7, 7 celle x11-39 y11-39 z0, passi 3-9, g→R 7
 #5 prl R[.g] → *R (+1) passi=9: ×9, 7745 celle x4-47 y2-47 z0-17, passi 10-18, .→R 7091, g→R 654
   r1 R[.g] → *R ×7354; r2 . R → R * ×3593
 #6 prl g → .: ×1, 491 celle x4-46 y4-46 z0, passi 19, g→. 491
 #7 box at 25 25 4 size 44 44 32 u su .: ×1, 53285 celle x4-46 y4-46 z4-35, passi 20, .→u 53285
 #8 one u → 1 (+3) passi=1: ×1, 1 celle x18 y46 z15, passi 21, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #9 all 1u → *1 (+3): ×90, 53282 celle x4-46 y4-46 z4-35, passi 22-111, u→1 53282
   r1 1u → *1 ×53282; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#10-13 cylinder×2, box×2: 1069 celle x19-31 y19-31 z14-29, passi 112-115
 #33 prl u → . (+4): ×1, 52216 celle x4-46 y4-46 z4-35, passi 116, 1→. 52214, u→. 2
   r1 u → . ×2; r2 1 → . ×52214; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×0
 #34 one . P → P S (+2) passi=14: ×14, 32 celle x23-26 y22-26 z29-35, passi 117-130, .→P 18, P→S 14
   r1 . P → P S ×1; r2 .* *P → P* *S ×9; r3 .*. *P* → P*P *S* ×4
 #35 prl P → S: ×1, 5 celle x23-26 y22-26 z33-35, passi 131, P→S 5
 #37 prl . R → * Y passi=1: ×1, 156 celle x6-46 y4-47 z0-15, passi 132, R→Y 156
Senza effetto (non hanno mai cambiato una cella):
#14 cylinder at 15 25 6 size 6 6 16 O su 2
#15 cylinder at 25 25 6 size 7 7 22 O su 2
#16 cylinder at 35 25 6 size 6 6 19 O su 2
#17 box at 15 25 22 size 1 1 1 P su 2
#18 box at 25 25 28 size 1 1 1 P su 2
#19 box at 35 25 25 size 1 1 1 P su 2
#20 line 15 25 14 → 35 25 14 I
#21 line 22 25 6 → 16 20 26 O
#22 line 28 25 6 → 33 30 30 O
#23 line 25 28 6 → 26 33 22 I
#24 box at 16 20 28 size 1 1 1 P su 3
#25 box at 33 30 32 size 1 1 1 P su 3
… e altri 8
```
