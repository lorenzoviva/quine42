# Albero di ferro fuso (`albero-ferro-fuso`)

Un albero di tubi e lamiera nei giardini meccanici di Orichalcum: tronco a canna, rami che piegano ad angolo retto, foglie di rame.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il piede a caso (flangia, treppiede, cassa di ingranaggi), una canna che sale con qualche gomito a caso, rami a tubo nati a caso che vanno dritti e salgono a gradini, foglie di rame piatte che si allargano a caso, rivetti e ruggine a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.782 | ≥ 0.15 |
| distanza minima fra due semi | 0.613 | — |
| tempo del seme più lento | 106 ms | < 1500 ms |
| voxel per seme (1-5) | 2028, 2324, 2127, 2283, 2549 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`albero-ferro-fuso.png`](albero-ferro-fuso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 28 nodi, 150 passi, finito in 110 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=ghisa, U=ghisa alta, A=tubi, F=foglie di rame, O=ottone, Z=ruggine, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: T 939, F 736, A 161, U 115, Z 64, O 13.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 20 20 0 size 40 40 8 u su .: ×1, 12168 celle x1-39 y1-39 z0-7, passi 11, .→u 12168
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x22 y9 z2, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×56, 12167 celle x1-39 y1-39 z0-7, passi 13-68, u→2 12167
   r1 1u → *1 ×0; r2 2u → *2 ×12167; r3 3u → *3 ×0
#10-12 line×3: 456 celle x8-32 y12-33 z0-7, passi 69-71
 #15 prl u → . (+3): ×1, 11712 celle x1-39 y1-39 z0-7, passi 72, 2→. 11712
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×11712; r4 3 → . ×0
#16-19 cylinder×1, box×1, one×2: 167 celle x18-23 y17-22 z0-49, passi 73-116
 #20 all T. → *T passi=1: ×1, 447 celle x7-33 y11-34 z0-25, passi 117, .→T 447
#21-22 all×1, one×1: 100 celle x19-24 y16-20 z26-48, passi 118-126
#23-24 prl×2: 377 celle x7-38 y3-34 z29-49, passi 127-141
 #25 prl F. → *F passi=5: ×5, 596 celle x4-39 y0-38 z29-49, passi 142-146, .→F 596
#26-28 prl×3: 198 celle x4-39 y0-37 z0-51, passi 147-150
Senza effetto (non hanno mai cambiato una cella):
#8 cylinder at 20 20 0 size 14 14 2 O su 1
#9 cylinder at 20 20 2 size 9 9 2 T su 1
#13 box at 20 20 0 size 14 14 7 O su 3
#14 cylinder at 13 20 3 size 2 9 2 T su 3
```
