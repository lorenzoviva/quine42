# Fungo gigante luminoso (`fungo-gigante-luminoso`)

Il fungo alto come un albero che illumina le radure notturne di Aurora: gambo pallido, cappello maculato, lamelle che brillano.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il gambo che sale storto a caso, il cappello a caso (piatto, a cupola, a cono, a due piani), le lamelle luminose che si accendono a caso sotto il cappello, macchie sul cappello e funghetti che nascono in punti a caso della base.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.397 | ≥ 0.15 |
| distanza minima fra due semi | 0.085 | — |
| tempo del seme più lento | 295 ms | < 1500 ms |
| voxel per seme (1-5) | 7172, 7180, 9774, 8368, 9770 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`fungo-gigante-luminoso.png`](fungo-gigante-luminoso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 30 nodi, 141 passi, finito in 298 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 3=marcatore (marcatore), T=gambo, U=gambo alto, C=cappello, W=macchie del cappello, G=lamelle, M=muschio, H=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: C 5428, G 609, T 479, M 460, W 115, U 81.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-7 ellipsoid×1, cylinder×1, box×1: 911 celle x13-27 y13-27 z0-5, passi 11-13
#8-9 one×2: 68 celle x19-22 y18-22 z5-39, passi 14-47
 #10 all T. → *T passi=2: ×2, 216 celle x17-22 y17-23 z5-22, passi 48-49, .→T 216
#11-12 all×1, prl×1: 65 celle x19-23 y17-23 z23-39, passi 50-51
 #13 box at 20 20 30 size 40 40 30 u su .: ×1, 45584 celle x1-39 y1-39 z30-59, passi 52, .→u 45584
 #14 one u → 1 (+3) passi=1: ×1, 1 celle x19 y2 z45, passi 53, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #15 all 1u → *1 (+3): ×72, 45583 celle x1-39 y1-39 z30-59, passi 54-125, u→3 45583
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×45583; r4 4u → *4 ×0
 #18 cone at 20 20 37 size 30 30 22 C su 3: ×1, 5543 celle x6-34 y6-34 z37-58, passi 126, 3→C 5543
 #21 prl u → . (+4): ×1, 40041 celle x1-39 y1-39 z30-59, passi 127, 3→. 40041
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×40041; r5 4 → . ×0
 #23 prl P → U: ×1, 1 celle x22 y22 z39, passi 128, P→U 1
 #24 prl C . → * G passi=1: ×1, 474 celle x6-34 y6-34 z36, passi 129, .→G 474
 #25 prl G . → * G passi=1: ×1, 135 celle x6-34 y6-33 z35, passi 130, .→G 135
 #26 prl . C → * W passi=1: ×1, 60 celle x6-32 y7-34 z37-57, passi 131, C→W 60
#27-30 prl×2, one×1, all×1: 95 celle x6-32 y7-34 z3-57, passi 132-141
Senza effetto (non hanno mai cambiato una cella):
#16 ellipsoid at 20 20 41 size 34 34 9 C su 1
#17 ellipsoid at 20 20 36 size 28 28 20 C su 2
#19 ellipsoid at 20 20 36 size 32 32 8 C su 4
#20 ellipsoid at 20 20 44 size 20 20 10 C su 4
#22 all . P → P U: le celle cercate c'erano, ma mai disposte come nel pattern
```
