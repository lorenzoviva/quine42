# Portale arcano (`portale-arcano`)

Una soglia di pietra runica in una radura di Aurora, con una pellicola di luce tesa nel vano: di là non si vede la radura.

- Collezione: `monumenti-rovine` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la cornice a caso (arco tondo, arco a punta, anello ritto, due obelischi con l'architrave) con la sua pellicola di luce, il basamento a caso (gradini, cerchio, rocce), rune che si accendono a caso sulla pietra e cristalli che spuntano a caso dal basamento.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.489 | ≥ 0.15 |
| distanza minima fra due semi | 0.307 | — |
| tempo del seme più lento | 297 ms | < 1500 ms |
| voxel per seme (1-5) | 7395, 6935, 4671, 5774, 4658 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`portale-arcano.png`](portale-arcano.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 43 nodi, 178 passi, finito in 241 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 7=marcatore (marcatore), 8=marcatore (marcatore), S=pietra runica, D=pietra scura, F=pellicola di luce, R=rune, X=cristalli, x=marcatore (marcatore), P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: D 3548, S 3010, F 612, R 126, X 99.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 30 6 u su .: ×1, 8526 celle x1-49 y11-39 z0-5, passi 11, .→u 8526
#6-7 one×1, all×1: 8526 celle x1-49 y11-39 z0-5, passi 12-70
#11-15 cylinder×1, prl×1: 8526 celle x1-49 y11-39 z0-5, passi 71-72
 #16 box at 25 25 3 size 50 14 47 u su .: ×1, 29396 celle x1-49 y19-31 z3-49, passi 73, .→u 29396
 #17 one u → 1 (+3) passi=1: ×1, 1 celle x37 y23 z15, passi 74, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #18 all 1u → *1 (+3): ×78, 29395 celle x1-49 y19-31 z3-49, passi 75-152, u→1 29395
   r1 1u → *1 ×29395; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#19-22 ellipsoid×3, box×1: 6880 celle x9-41 y21-29 z4-47, passi 153-156
 #36 prl u → . (+4): ×1, 22516 celle x1-49 y19-31 z3-49, passi 157, 1→. 22516
   r1 u → . ×0; r2 1 → . ×22516; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×0
#37-43 prl×5, one×1, all×1: 3411 celle x4-42 y16-36 z4-47, passi 158-178
Senza effetto (non hanno mai cambiato una cella):
#8 box at 25 25 0 size 44 22 2 D su 1
#9 box at 25 25 2 size 38 16 2 D su 1
#10 box at 25 25 4 size 32 12 1 S su 1
#12 ellipsoid at 12 25 0 size 20 20 8 D su 3
#13 ellipsoid at 38 25 0 size 20 20 8 D su 3
#14 box at 25 25 0 size 30 12 3 D su 3
#23 cone at 25 25 3 size 22 1 38 F su 2
#24 cone at 25 25 3 size 22 9 38 x su 2
#25 cone at 25 25 3 size 34 6 48 S su 2
#26 ellipsoid at 25 25 6 size 28 1 28 F su 3
#27 ellipsoid at 25 25 6 size 28 9 28 x su 3
#28 ellipsoid at 25 25 2 size 38 6 36 S su 3
… e altri 7
```
