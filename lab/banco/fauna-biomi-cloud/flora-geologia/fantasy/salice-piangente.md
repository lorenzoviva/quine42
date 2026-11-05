# Salice piangente (`salice-piangente`)

Il salice degli stagni di Aurora: tronco corto e storto, rami che si aprono e fronde che ricadono fino all'acqua.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il tronco storto a caso, rami nati in punti a caso che si aprono, poi le fronde: ogni foglia lascia cadere sotto di sé una foglia nuova con una probabilità, così le tende verdi hanno lunghezze diverse a ogni seme; la base a caso (sul prato, sulla riva con le pietre, sulle radici).
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.817 | ≥ 0.15 |
| distanza minima fra due semi | 0.636 | — |
| tempo del seme più lento | 112 ms | < 1500 ms |
| voxel per seme (1-5) | 4756, 5483, 3736, 4804, 4303 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`salice-piangente.png`](salice-piangente.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 27 nodi, 167 passi, finito in 96 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=corteccia, U=corteccia alta, A=rami, F=fronde, L=fronde chiare, S=pietre, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 2212, L 996, T 717, A 388, S 323, U 120.
 #2 box at 20 20 0 size 40 40 5 u su .: ×1, 7605 celle x1-39 y1-39 z0-4, passi 1, .→u 7605
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x33 y16 z4, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×59, 7604 celle x1-39 y1-39 z0-4, passi 3-61, u→2 7604
   r1 1u → *1 ×0; r2 2u → *2 ×7604; r3 3u → *3 ×0
#6-9 ellipsoid×3, cylinder×1: 534 celle x9-31 y13-30 z0-3, passi 62-65
 #15 prl u → . (+3): ×1, 7071 celle x1-39 y1-39 z0-4, passi 66, 2→. 7071
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×7071; r4 3 → . ×0
#16-19 cylinder×1, box×1, one×2: 161 celle x17-26 y17-25 z2-47, passi 67-111
 #20 all T. → *T passi=2: ×2, 413 celle x13-27 y13-27 z0-22, passi 112-113, .→T 413
#21-22 all×1, one×1: 106 celle x21-27 y15-25 z23-46, passi 114-124
 #23 prl e. → Ae (+7) passi=13: ×13, 832 celle x9-39 y2-36 z25-53, passi 125-137, .→n 153, n→A 134, .→e 100, .→s 98, +4
   r1 e. → Ae ×73; r2 *. e* → *e A* ×47; r3 .w → wA ×74; r4 .* *w → w* *A ×38; r5 s/. → A/s ×81; r6 */. s/* → */s A/* ×34; r7 ./n → n/A ×123; r8 ./* */n → n/* */A ×65
#24-25 prl×2: 425 celle x7-39 y0-38 z25-55, passi 138-140
 #26 prl F . → F F passi=26: ×26, 2783 celle x7-39 y0-38 z3-52, passi 141-166, .→F 2783
 #27 prl .F → *L passi=1: ×1, 996 celle x7-39 y0-38 z3-55, passi 167, F→L 996
Senza effetto (non hanno mai cambiato una cella):
#5 cylinder at 20 20 0 size 10 10 2 T su 1
#10 line 20 20 3 → 30 20 0 T
#11 line 20 20 3 → 23 30 0 T
#12 line 20 20 3 → 12 26 0 T
#13 line 20 20 3 → 12 14 0 T
#14 line 20 20 3 → 23 11 0 T
```
