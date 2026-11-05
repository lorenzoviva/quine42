# Camino geotermico (`camino-geotermico`)

Una bocca di vapore delle terre calde di Orichalcum, incanalata in camini d'ottone che sbuffano.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la collina di roccia cresce da massi nati a caso; i camini a caso (uno grande, tre in fila, un fascio storto, una cupola con valvole); il vapore sale a rami dalle bocche e si gonfia a caso; zolfo a caso sulla roccia.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.191 | ≥ 0.15 |
| distanza minima fra due semi | 0.097 | — |
| tempo del seme più lento | 323 ms | < 1500 ms |
| voxel per seme (1-5) | 12077, 12097, 12019, 12084, 12073 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`camino-geotermico.png`](camino-geotermico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 40 nodi, 136 passi, finito in 309 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), R=roccia calda, Y=zolfo, O=ottone, I=ferro, S=vapore, L=brace, g=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: R 10840, O 789, I 273, Y 155, S 18, L 2.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 cone×1, box×1: 4340 celle x4-46 y4-46 z0-11, passi 11-12
 #7 one Rg → *R passi=7: ×7, 7 celle x10-40 y12-35 z0, passi 13-19, g→R 7
 #8 prl R[.g] → *R (+1) passi=9: ×9, 7800 celle x3-47 y3-46 z0-18, passi 20-28, .→R 7147, g→R 653
   r1 R[.g] → *R ×7280; r2 . R → R * ×3661
 #9 prl g → .: ×1, 492 celle x4-46 y4-46 z0, passi 29, g→. 492
 #10 box at 25 25 4 size 44 44 32 u su .: ×1, 53300 celle x4-46 y4-46 z4-35, passi 30, .→u 53300
 #11 one u → 1 (+3) passi=1: ×1, 1 celle x36 y38 z17, passi 31, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #12 all 1u → *1 (+3): ×84, 53292 celle x4-46 y4-46 z4-35, passi 32-115, u→1 53292
   r1 1u → *1 ×53292; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#13-16 cylinder×2, box×2: 1065 celle x19-31 y19-31 z14-29, passi 116-119
 #36 prl u → . (+4): ×1, 52235 celle x4-46 y4-46 z4-35, passi 120, 1→. 52228, u→. 7
   r1 u → . ×7; r2 1 → . ×52228; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×0
#37-38 one×1, prl×1: 35 celle x24-26 y24-28 z29-39, passi 121-135
 #40 prl . R → * Y passi=1: ×1, 155 celle x3-47 y5-45 z0-14, passi 136, R→Y 155
Senza effetto (non hanno mai cambiato una cella):
#17 cylinder at 15 25 6 size 6 6 16 O su 2
#18 cylinder at 25 25 6 size 7 7 22 O su 2
#19 cylinder at 35 25 6 size 6 6 19 O su 2
#20 box at 15 25 22 size 1 1 1 P su 2
#21 box at 25 25 28 size 1 1 1 P su 2
#22 box at 35 25 25 size 1 1 1 P su 2
#23 line 15 25 14 → 35 25 14 I
#24 line 22 25 6 → 16 20 26 O
#25 line 28 25 6 → 33 30 30 O
#26 line 25 28 6 → 26 33 22 I
#27 box at 16 20 28 size 1 1 1 P su 3
#28 box at 33 30 32 size 1 1 1 P su 3
… e altri 8
```
