# Salice piangente (`salice-piangente`)

Il salice degli stagni di Aurora: tronco corto e storto, rami che si aprono e fronde che ricadono fino all'acqua.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il tronco storto a caso, rami nati in punti a caso che si aprono, poi le fronde: ogni foglia lascia cadere sotto di sé una foglia nuova con una probabilità, così le tende verdi hanno lunghezze diverse a ogni seme; la base a caso (sul prato, sulla riva con le pietre, sulle radici).
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.848 | ≥ 0.15 |
| distanza minima fra due semi | 0.768 | — |
| tempo del seme più lento | 102 ms | < 1500 ms |
| voxel per seme (1-5) | 4176, 4774, 3691, 4051, 4013 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`salice-piangente.png`](salice-piangente.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 30 nodi, 179 passi, finito in 98 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=corteccia, U=corteccia alta, A=rami, F=fronde, L=fronde chiare, S=pietre, H=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 1968, T 717, L 676, A 372, S 323, U 120.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 20 20 0 size 40 40 5 u su .: ×1, 7605 celle x1-39 y1-39 z0-4, passi 11, .→u 7605
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x4 y16 z1, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×61, 7604 celle x1-39 y1-39 z0-4, passi 13-73, u→2 7604
   r1 1u → *1 ×0; r2 2u → *2 ×7604; r3 3u → *3 ×0
#9-12 ellipsoid×3, cylinder×1: 534 celle x9-31 y13-30 z0-3, passi 74-77
 #18 prl u → . (+3): ×1, 7071 celle x1-39 y1-39 z0-4, passi 78, 2→. 7071
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×7071; r4 3 → . ×0
#19-22 cylinder×1, box×1, one×2: 161 celle x17-26 y16-24 z2-47, passi 79-123
#23-25 all×2, one×1: 519 celle x13-27 y13-27 z0-46, passi 124-136
 #26 prl e. → Ae (+7) passi=13: ×13, 801 celle x9-39 y18-35 z23-56, passi 137-149, .→s 238, s→A 205, .→e 96, .→w 95, +2
   r1 e. → Ae ×79; r2 *. e* → *e A* ×32; r3 .w → wA ×74; r4 .* *w → w* *A ×28; r5 s/. → A/s ×189; r6 */. s/* → */s A/* ×106; r7 ./n → n/A ×0; r8 ./* */n → n/* */A ×0
#27-28 prl×2: 446 celle x7-39 y17-37 z23-57, passi 150-152
 #29 prl F . → F F passi=26: ×26, 2198 celle x7-39 y17-37 z2-55, passi 153-178, .→F 2198
 #30 prl .F → *L passi=1: ×1, 676 celle x7-39 y17-37 z2-56, passi 179, F→L 676
Senza effetto (non hanno mai cambiato una cella):
#8 cylinder at 20 20 0 size 10 10 2 T su 1
#13 line 20 20 3 → 30 20 0 T
#14 line 20 20 3 → 23 30 0 T
#15 line 20 20 3 → 12 26 0 T
#16 line 20 20 3 → 12 14 0 T
#17 line 20 20 3 → 23 11 0 T
```
