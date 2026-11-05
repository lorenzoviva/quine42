# Circolo megalitico (`circolo-megalitico`)

Un cerchio di pietre ritte su un poggio di Aurora: nessuno sa chi le abbia alzate, ognuna ha la sua altezza.

- Collezione: `monumenti-rovine` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: otto pietre nascono in punti a caso dell'anello, salgono e si fermano a un'altezza propria; il centro a caso (altare, pietra madre, dolmen, cerchio del fuoco); licheni e muschio a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.633 | ≥ 0.15 |
| distanza minima fra due semi | 0.535 | — |
| tempo del seme più lento | 162 ms | < 1500 ms |
| voxel per seme (1-5) | 6500, 7615, 7769, 7184, 7015 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`circolo-megalitico.png`](circolo-megalitico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 31 nodi, 134 passi, finito in 156 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 4=marcatore (marcatore), E=poggio erboso, S=pietra, D=pietra scura, L=licheni, M=muschio, F=fuoco, g=marcatore (marcatore), P=marcatore (marcatore), x=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: E 2963, S 2602, M 392, L 336, D 133, F 74.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-8 cylinder×4: 5244 celle x2-48 y2-48 z0-2, passi 11-14
 #9 one g → P passi=8: ×8, 8 celle x6-44 y10-44 z2, passi 15-22, g→P 8
 #10 prl g → .: ×1, 540 celle x6-44 y6-44 z2, passi 23, g→. 540
 #11 prl . P → P S (+1) passi=36: ×36, 489 celle x6-44 y10-44 z2-38, passi 24-59, .→P 244, P→S 237, P→D 8
   r1 . P → P S ×244; r2 P → D ×10
 #12 prl P → D: ×1, 7 celle x6-44 y10-44 z34-38, passi 60, P→D 7
 #13 all S. → *S passi=2: ×2, 2754 celle x4-46 y8-46 z2-37, passi 61-62, .→S 2754
 #14 box at 25 25 2 size 24 24 40 u su .: ×1, 21160 celle x14-36 y14-36 z2-41, passi 63, .→u 21160
 #15 one u → 1 (+3) passi=1: ×1, 1 celle x19 y30 z13, passi 64, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #16 all 1u → *1 (+3): ×61, 21159 celle x14-36 y14-36 z2-41, passi 65-125, u→4 21159
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×21159
#23-26 cone×1, cylinder×2, line×1: 196 celle x21-29 y21-29 z2-33, passi 126-129
 #27 prl u → . (+4): ×1, 20964 celle x14-36 y14-36 z2-41, passi 130, 4→. 20964
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×20964
#28-29 prl×2: 340 celle x4-46 y8-46 z2-37, passi 131-132
 #30 prl . S → * M passi=1: ×1, 53 celle x5-46 y8-45 z3-37, passi 133, S→M 53
 #31 prl . E → * M passi=1: ×1, 339 celle x2-48 y2-48 z0-1, passi 134, E→M 339
Senza effetto (non hanno mai cambiato una cella):
#17 box at 25 25 2 size 10 6 5 D su 1
#18 box at 25 25 7 size 12 8 2 S su 1
#19 line 25 25 2 → 25 25 36 D
#20 box at 20 25 2 size 3 8 12 S su 3
#21 box at 30 25 2 size 3 8 12 S su 3
#22 box at 25 25 14 size 16 12 3 D su 3
```
