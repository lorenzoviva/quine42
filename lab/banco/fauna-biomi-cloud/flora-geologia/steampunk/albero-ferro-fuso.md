# Albero di ferro fuso (`albero-ferro-fuso`)

Un albero di tubi e lamiera nei giardini meccanici di Orichalcum: tronco a canna, rami che piegano ad angolo retto, foglie di rame.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il piede a caso (flangia, treppiede, cassa di ingranaggi), una canna che sale con qualche gomito a caso, rami a tubo nati a caso che vanno dritti e salgono a gradini, foglie di rame piatte che si allargano a caso, rivetti e ruggine a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.706 | ≥ 0.15 |
| distanza minima fra due semi | 0.608 | — |
| tempo del seme più lento | 126 ms | < 1500 ms |
| voxel per seme (1-5) | 2005, 2698, 2654, 2542, 2658 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`albero-ferro-fuso.png`](albero-ferro-fuso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 25 nodi, 164 passi, finito in 103 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=ghisa, U=ghisa alta, A=tubi, F=foglie di rame, O=ottone, Z=ruggine, H=marcatore (marcatore), e=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: T 945, F 705, A 167, U 115, Z 58, O 15.
 #2 box at 20 20 0 size 40 40 8 u su .: ×1, 12168 celle x1-39 y1-39 z0-7, passi 1, .→u 12168
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x37 y2 z7, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×80, 12167 celle x1-39 y1-39 z0-7, passi 3-82, u→2 12167
   r1 1u → *1 ×0; r2 2u → *2 ×12167; r3 3u → *3 ×0
#7-9 line×3: 456 celle x8-32 y12-33 z0-7, passi 83-85
 #12 prl u → . (+3): ×1, 11712 celle x1-39 y1-39 z0-7, passi 86, 2→. 11712
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×11712; r4 3 → . ×0
#13-16 cylinder×1, box×1, one×2: 167 celle x18-24 y18-22 z0-49, passi 87-130
 #17 all T. → *T passi=1: ×1, 447 celle x7-33 y11-34 z0-25, passi 131, .→T 447
#18-19 all×1, one×1: 100 celle x21-25 y17-22 z26-48, passi 132-140
 #20 prl e. → Ae (+7) passi=14: ×14, 376 celle x21-39 y5-36 z27-44, passi 141-154, .→e 97, e→A 90, .→n 49, .→s 48, +2
   r1 e. → Ae ×90; r2 *. e* → *e A* ×10; r3 .w → wA ×0; r4 .* *w → w* *A ×0; r5 s/. → A/s ×46; r6 */. s/* → */s A/* ×3; r7 ./n → n/A ×46; r8 ./* */n → n/* */A ×4
 #21 prl e → F (+4): ×1, 21 celle x21-39 y5-36 z27-49, passi 155, e→F 10, s→F 5, n→F 5, H→F 1
   r1 e → F ×10; r2 w → F ×0; r3 s → F ×5; r4 n → F ×5; r5 H → F ×1
 #22 prl F. → *F passi=5: ×5, 581 celle x17-39 y1-39 z27-49, passi 156-160, .→F 581
#23-25 prl×3: 176 celle x9-39 y2-38 z1-51, passi 161-164
Senza effetto (non hanno mai cambiato una cella):
#5 cylinder at 20 20 0 size 14 14 2 O su 1
#6 cylinder at 20 20 2 size 9 9 2 T su 1
#10 box at 20 20 0 size 14 14 7 O su 3
#11 cylinder at 13 20 3 size 2 9 2 T su 3
```
