# Rovine del tempio sommerso (`rovine-tempio-sommerso`)

Un tempio di Aurora che la palude si è ripresa: lo stilobate sott'acqua, colonne spezzate a ogni altezza, alghe e liane.

- Collezione: `monumenti-rovine` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la pianta a caso (peristilio, due file, cella con le colonne davanti, colonnato a ferro di cavallo), ogni colonna che si spezza a un'altezza sua, il resto del frontone a caso, liane che pendono e alghe sull'acqua.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.246 | ≥ 0.15 |
| distanza minima fra due semi | 0.018 | — |
| tempo del seme più lento | 80 ms | < 1500 ms |
| voxel per seme (1-5) | 14052, 14431, 14111, 17055, 14433 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`rovine-tempio-sommerso.png`](rovine-tempio-sommerso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 60 nodi, 125 passi, finito in 85 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), A=acqua della palude, S=marmo, D=marmo spezzato, C=colonne, G=alghe, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 8234, A 3845, C 1435, D 471, G 67.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-7 box×3: 10776 celle x3-47 y8-42 z0-7, passi 11-13
 #8 one u → 1 (+3) passi=1: ×1, 1 celle x29 y22 z7, passi 14, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #9 all 1u → *1 (+3): ×43, 2541 celle x5-45 y10-40 z6-7, passi 15-57, u→2 2541
   r1 1u → *1 ×0; r2 2u → *2 ×2541; r3 3u → *3 ×0; r4 4u → *4 ×0
#24-33 box×10: 10 celle x9-41 y19-31 z6, passi 58-67
 #50 prl u → . (+4): ×1, 2532 celle x5-45 y10-40 z6-7, passi 68, 2→. 2532
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×2532; r4 3 → . ×0; r5 4 → . ×0
 #51 prl . P → P C (+1) passi=38: ×38, 586 celle x9-41 y19-31 z6-42, passi 69-106, .→P 292, P→C 287, P→D 7
   r1 . P → P C ×292; r2 P → D ×9
 #52 prl P → D: ×1, 8 celle x9-41 y19-31 z40-42, passi 107, P→D 8
 #53 all C. → *C passi=1: ×1, 1148 celle x8-42 y18-32 z6-41, passi 108, .→C 1148
#54-55 all×1, prl×1: 456 celle x8-42 y18-32 z7-49, passi 109-123
 #56 box at 25 25 0 size 50 50 4 A su .: ×1, 3912 celle x1-49 y1-49 z0-3, passi 124, .→A 3912
 #57 prl . A → * G passi=1: ×1, 67 celle x1-49 y1-49 z3, passi 125, A→G 67
Senza effetto (non hanno mai cambiato una cella):
#10 box at 9 13 6 size 1 1 1 P su 1
#11 box at 9 37 6 size 1 1 1 P su 1
#12 box at 17 13 6 size 1 1 1 P su 1
#13 box at 17 37 6 size 1 1 1 P su 1
#14 box at 25 13 6 size 1 1 1 P su 1
#15 box at 25 37 6 size 1 1 1 P su 1
#16 box at 33 13 6 size 1 1 1 P su 1
#17 box at 33 37 6 size 1 1 1 P su 1
#18 box at 41 13 6 size 1 1 1 P su 1
#19 box at 41 37 6 size 1 1 1 P su 1
#20 box at 9 21 6 size 1 1 1 P su 1
#21 box at 41 21 6 size 1 1 1 P su 1
… e altri 21
```
