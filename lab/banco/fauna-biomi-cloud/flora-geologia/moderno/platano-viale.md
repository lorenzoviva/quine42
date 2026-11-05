# Platano di viale (`platano-viale`)

Il platano dei viali di Neapolis: tronco chiazzato che si sfoglia, chioma larga, ai piedi la città.

- Collezione: `flora-geologia` · ambientazione: `moderno` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il piede a caso (griglia di ghisa, panchina tonda, fioriera di cemento), il tronco alto che sale storto a caso, rami nati a caso che si aprono larghi, la chioma che si gonfia a caso, le chiazze della corteccia che si allargano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.761 | ≥ 0.15 |
| distanza minima fra due semi | 0.594 | — |
| tempo del seme più lento | 129 ms | < 1500 ms |
| voxel per seme (1-5) | 4930, 7320, 5449, 5302, 8281 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`platano-viale.png`](platano-viale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 27 nodi, 142 passi, finito in 141 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=corteccia, U=corteccia alta, K=chiazze chiare, A=rami, F=chioma, L=foglie al sole, W=legno della panchina, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 2211, W 1400, T 445, A 407, L 230, K 147, U 90.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 20 20 0 size 40 40 9 u su .: ×1, 13689 celle x1-39 y1-39 z0-8, passi 11, .→u 13689
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x15 y20 z2, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×49, 13688 celle x1-39 y1-39 z0-8, passi 13-61, u→2 13688
   r1 1u → *1 ×0; r2 2u → *2 ×13688; r3 3u → *3 ×0
 #10 cylinder at 20 20 0 size 20 20 5 W su 2: ×1, 1525 celle x11-29 y11-29 z0-4, passi 62, 2→W 1525
 #14 prl u → . (+3): ×1, 12164 celle x1-39 y1-39 z0-8, passi 63, 2→. 12164
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×12164; r4 3 → . ×0
#15-21 cylinder×1, box×1, one×3, all×2: 729 celle x16-24 y16-24 z0-46, passi 64-114
 #22 prl e. → Ae (+7) passi=17: ×17, 856 celle x3-39 y1-22 z28-49, passi 115-131, .→e 168, e→A 154, .→w 148, w→A 134, +2
   r1 e. → Ae ×152; r2 *. e* → *e A* ×44; r3 .w → wA ×130; r4 .* *w → w* *A ×47; r5 s/. → A/s ×0; r6 */. s/* → */s A/* ×0; r7 ./n → n/A ×108; r8 ./* */n → n/* */A ×40
 #23 prl e → F (+4): ×1, 51 celle x3-39 y1-22 z30-49, passi 132, e→F 17, w→F 17, n→F 16, H→F 1
   r1 e → F ×17; r2 w → F ×17; r3 s → F ×0; r4 n → F ×16; r5 H → F ×1
 #24 prl F. → *F passi=6: ×6, 2390 celle x0-39 y0-26 z26-52, passi 133-138, .→F 2390
#25-27 prl×3: 377 celle x0-39 y0-26 z5-52, passi 139-142
Senza effetto (non hanno mai cambiato una cella):
#8 box at 20 20 0 size 16 16 1 I su 1
#9 box at 20 20 1 size 10 10 1 I su 1
#11 cylinder at 20 20 0 size 14 14 5 S su 2
#12 box at 20 20 0 size 18 18 7 S su 3
#13 box at 20 20 7 size 16 16 1 F su 3
```
