# Quercia secolare (`quercia-secolare`)

La quercia dei boschi antichi di Aurora: tronco nodoso e muschioso, rami larghi, chioma a nuvole.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: le radici a caso (larghe, a ceppo, ad arco), il tronco che sale storto a caso, sette rami nati in punti a caso del tronco alto che vanno dalla loro parte e a volte salgono, la chioma che si gonfia a caso dalle punte; muschio a caso sul tronco.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.644 | ≥ 0.15 |
| distanza minima fra due semi | 0.589 | — |
| tempo del seme più lento | 123 ms | < 1500 ms |
| voxel per seme (1-5) | 10371, 10288, 10019, 10155, 8430 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`quercia-secolare.png`](quercia-secolare.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 30 nodi, 148 passi, finito in 125 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=corteccia, U=corteccia alta, A=rami, F=chioma, L=foglie al sole, M=muschio, R=radici, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 7795, T 803, L 672, A 452, R 360, U 221, M 68.
 #2 box at 20 20 0 size 40 40 6 u su .: ×1, 9126 celle x1-39 y1-39 z0-5, passi 1, .→u 9126
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x9 y12 z5, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×62, 9125 celle x1-39 y1-39 z0-5, passi 3-64, u→2 9125
   r1 1u → *1 ×0; r2 2u → *2 ×9125; r3 3u → *3 ×0
#11-12 cylinder×1, cone×1: 706 celle x14-26 y14-26 z0-5, passi 65-66
 #17 prl u → . (+3): ×1, 8420 celle x1-39 y1-39 z0-5, passi 67, 2→. 8420
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×8420; r4 3 → . ×0
#18-21 cylinder×1, box×1, one×2: 424 celle x16-24 y16-24 z0-44, passi 68-108
#22-24 all×2, one×1: 717 celle x16-24 y17-26 z6-43, passi 109-122
 #25 prl e. → Ae (+7) passi=16: ×16, 967 celle x1-37 y4-39 z29-49, passi 123-138, .→s 170, .→w 150, s→A 150, w→A 132, +4
   r1 e. → Ae ×70; r2 *. e* → *e A* ×23; r3 .w → wA ×125; r4 .* *w → w* *A ×48; r5 s/. → A/s ×146; r6 */. s/* → */s A/* ×41; r7 ./n → n/A ×91; r8 ./* */n → n/* */A ×38
#26-27 prl×2: 153 celle x1-37 y4-39 z29-49, passi 139-140
 #28 prl F. → *F passi=6: ×6, 8314 celle x0-39 y0-39 z24-55, passi 141-146, .→F 8314
 #29 prl . F → * L passi=1: ×1, 672 celle x0-39 y0-39 z27-55, passi 147, F→L 672
 #30 prl .T → *M passi=1: ×1, 68 celle x17-23 y17-25 z6-26, passi 148, T→M 68
Senza effetto (non hanno mai cambiato una cella):
#5 line 20 20 3 → 34 20 0 R
#6 line 20 20 3 → 27 32 0 R
#7 line 20 20 3 → 13 32 0 R
#8 line 20 20 3 → 6 20 0 R
#9 line 20 20 3 → 13 8 0 R
#10 line 20 20 3 → 27 8 0 R
#13 line 20 20 5 → 30 27 0 R
#14 line 20 20 5 → 13 30 0 R
#15 line 20 20 5 → 10 13 0 R
#16 line 20 20 5 → 27 10 0 R
```
