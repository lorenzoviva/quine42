# Orologio astrario (`orologio-astrario-piazza`)

L'orologio astronomico in mezzo a una piazza di Orichalcum: torre di ghisa, quattro quadranti, e in cima i cieli in ottone.

- Collezione: `monumenti-rovine` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (l'ora: le lancette del quadrante davanti in una di quattro posizioni; la cima: sfera armillare, planetario a bracci, cupola con la campana, guglia con la banderuola; il basamento: a gradini, a fontana, a panchine) e ingranaggi di rame in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.292 | ≥ 0.15 |
| distanza minima fra due semi | 0.091 | — |
| tempo del seme più lento | 296 ms | < 1500 ms |
| voxel per seme (1-5) | 12156, 8299, 8452, 11405, 9137 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`orologio-astrario-piazza.png`](orologio-astrario-piazza.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 71 nodi, 201 passi, finito in 302 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), I=ghisa, O=ottone, W=quadranti, K=lancette, C=ingranaggi di rame, S=pietra, A=acqua, L=luce dei quadranti, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: I 4289, A 3735, S 2767, C 843, L 243, O 190, W 81, K 8.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 50 7 u su .: ×1, 16807 celle x1-49 y1-49 z0-6, passi 11, .→u 16807
#6-7 one×1, all×1: 16807 celle x1-49 y1-49 z0-6, passi 12-104
#11-13 cylinder×2, box×1: 6502 celle x4-46 y4-46 z0-5, passi 105-107
#23-40 prl×2, box×7, one×1, all×1, line×2: 15129 celle x1-49 y1-49 z0-38, passi 108-134
 #41 box at 25 25 39 size 50 50 11 u su .: ×1, 26411 celle x1-49 y1-49 z39-49, passi 135, .→u 26411
 #42 one u → 1 (+3) passi=1: ×1, 1 celle x24 y26 z46, passi 136, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #43 all 1u → *1 (+3): ×57, 26410 celle x1-49 y1-49 z39-49, passi 137-193, u→3 26410
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×26410; r4 4u → *4 ×0
#60-65 line×4, ellipsoid×2: 1065 celle x18-32 y18-32 z39-49, passi 194-199
 #69 prl u → . (+4): ×1, 25346 celle x1-49 y1-49 z39-49, passi 200, 3→. 25346
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×25346; r5 4 → . ×0
 #71 prl .I → *C passi=1: ×1, 32 celle x18-32 y18-32 z6-46, passi 201, I→C 32
Senza effetto (non hanno mai cambiato una cella):
#8 box at 25 25 0 size 30 30 2 S su 1
#9 box at 25 25 2 size 24 24 2 S su 1
#10 box at 25 25 4 size 18 18 2 S su 1
#14 box at 25 25 0 size 22 22 6 S su 3
#15 box at 25 8 0 size 16 3 3 O su 3
#16 box at 25 42 0 size 16 3 3 O su 3
#17 box at 8 25 0 size 3 16 3 O su 3
#18 box at 42 25 0 size 3 16 3 O su 3
#19 box at 25 12 0 size 16 7 1 S su 3
#20 box at 25 38 0 size 16 7 1 S su 3
#21 box at 12 25 0 size 7 16 1 S su 3
#22 box at 38 25 0 size 7 16 1 S su 3
… e altri 25
```
