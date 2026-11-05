# Quercia secolare (`quercia-secolare`)

La quercia dei boschi antichi di Aurora: tronco nodoso e muschioso, rami larghi, chioma a nuvole.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: le radici a caso (larghe, a ceppo, ad arco), il tronco che sale storto a caso, sette rami nati in punti a caso del tronco alto che vanno dalla loro parte e a volte salgono, la chioma che si gonfia a caso dalle punte; muschio a caso sul tronco.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.665 | ≥ 0.15 |
| distanza minima fra due semi | 0.532 | — |
| tempo del seme più lento | 109 ms | < 1500 ms |
| voxel per seme (1-5) | 9002, 10036, 9058, 10271, 11619 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`quercia-secolare.png`](quercia-secolare.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 33 nodi, 160 passi, finito in 116 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=corteccia, U=corteccia alta, A=rami, F=chioma, L=foglie al sole, M=muschio, R=radici, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 6584, T 806, L 551, A 415, R 360, U 221, M 65.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 20 20 0 size 40 40 6 u su .: ×1, 9126 celle x1-39 y1-39 z0-5, passi 11, .→u 9126
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x36 y26 z1, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×64, 9125 celle x1-39 y1-39 z0-5, passi 13-76, u→2 9125
   r1 1u → *1 ×0; r2 2u → *2 ×9125; r3 3u → *3 ×0
#14-15 cylinder×1, cone×1: 706 celle x14-26 y14-26 z0-5, passi 77-78
 #20 prl u → . (+3): ×1, 8420 celle x1-39 y1-39 z0-5, passi 79, 2→. 8420
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×8420; r4 3 → . ×0
#21-24 cylinder×1, box×1, one×2: 424 celle x16-24 y16-26 z0-44, passi 80-120
#25-27 all×2, one×1: 717 celle x16-24 y17-28 z6-43, passi 121-134
 #28 prl e. → Ae (+7) passi=16: ×16, 879 celle x0-37 y5-39 z30-48, passi 135-150, .→w 237, w→A 214, .→e 120, e→A 109, +4
   r1 e. → Ae ×106; r2 *. e* → *e A* ×29; r3 .w → wA ×199; r4 .* *w → w* *A ×73; r5 s/. → A/s ×46; r6 */. s/* → */s A/* ×18; r7 ./n → n/A ×42; r8 ./* */n → n/* */A ×20
#29-30 prl×2: 133 celle x0-37 y5-39 z30-48, passi 151-152
 #31 prl F. → *F passi=6: ×6, 7002 celle x0-39 y1-39 z25-53, passi 153-158, .→F 7002
#32-33 prl×2: 616 celle x0-39 y1-39 z6-52, passi 159-160
Senza effetto (non hanno mai cambiato una cella):
#8 line 20 20 3 → 34 20 0 R
#9 line 20 20 3 → 27 32 0 R
#10 line 20 20 3 → 13 32 0 R
#11 line 20 20 3 → 6 20 0 R
#12 line 20 20 3 → 13 8 0 R
#13 line 20 20 3 → 27 8 0 R
#16 line 20 20 5 → 30 27 0 R
#17 line 20 20 5 → 13 30 0 R
#18 line 20 20 5 → 10 13 0 R
#19 line 20 20 5 → 27 10 0 R
```
