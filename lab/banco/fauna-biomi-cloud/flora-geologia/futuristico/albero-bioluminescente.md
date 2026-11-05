# Albero bioluminescente (`albero-bioluminescente`)

Un albero dei giardini di Sidera che brilla di notte: tronco a spirale, baccelli luminosi, viticci che pendono accesi.

- Collezione: `flora-geologia` · ambientazione: `futuristico` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: le radici a caso (aeree, a disco, a tripode), il tronco che sale molto storto, rami nati a caso, baccelli che si gonfiano a caso sulle punte e viticci luminosi che pendono per lunghezze a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.804 | ≥ 0.15 |
| distanza minima fra due semi | 0.608 | — |
| tempo del seme più lento | 143 ms | < 1500 ms |
| voxel per seme (1-5) | 2290, 2108, 2139, 2385, 2385 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`albero-bioluminescente.png`](albero-bioluminescente.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 32 nodi, 174 passi, finito in 133 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=corteccia blu notte, U=corteccia alta, A=rami, F=baccelli, V=viticci, R=radici, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: R 936, T 434, F 408, A 269, V 153, U 90.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 20 20 0 size 40 40 12 u su .: ×1, 18252 celle x1-39 y1-39 z0-11, passi 11, .→u 18252
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x32 y13 z3, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×65, 18251 celle x1-39 y1-39 z0-11, passi 13-77, u→2 18251
   r1 1u → *1 ×0; r2 2u → *2 ×18251; r3 3u → *3 ×0
#15-16 cylinder×1, cone×1: 1114 celle x10-30 y10-30 z0-9, passi 78-79
 #20 prl u → . (+3): ×1, 17138 celle x1-39 y1-39 z0-11, passi 80, 2→. 17138
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×17138; r4 3 → . ×0
#21-22 cylinder×1, box×1: 253 celle x18-22 y18-22 z0-12, passi 81-82
#23-27 one×3, all×2: 317 celle x17-26 y17-24 z6-48, passi 83-129
 #28 prl e. → Ae (+7) passi=12: ×12, 575 celle x10-38 y7-34 z32-50, passi 130-141, .→e 101, .→w 99, .→s 93, e→A 89, +4
   r1 e. → Ae ×76; r2 *. e* → *e A* ×41; r3 .w → wA ×81; r4 .* *w → w* *A ×35; r5 s/. → A/s ×73; r6 */. s/* → */s A/* ×40; r7 ./n → n/A ×10; r8 ./* */n → n/* */A ×4
#29-30 prl×2: 408 celle x8-39 y5-36 z33-52, passi 142-144
#31-32 one×1, prl×1: 153 celle x10-38 y19-34 z17-48, passi 145-174
Senza effetto (non hanno mai cambiato una cella):
#8 line 20 20 10 → 33 20 0 R
#9 line 20 20 10 → 28 30 0 R
#10 line 20 20 10 → 17 33 0 R
#11 line 20 20 10 → 8 26 0 R
#12 line 20 20 10 → 8 14 0 R
#13 line 20 20 10 → 17 7 0 R
#14 line 20 20 10 → 28 10 0 R
#17 line 20 20 9 → 32 20 0 R
#18 line 20 20 9 → 14 30 0 R
#19 line 20 20 9 → 14 10 0 R
```
