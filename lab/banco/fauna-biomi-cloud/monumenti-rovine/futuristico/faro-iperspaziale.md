# Faro iperspaziale (`faro-iperspaziale`)

Il faro che indica la rotta alle navi di Sidera: una guglia su tre gambe, anelli che le girano attorno e il fuoco freddo in cima.

- Collezione: `monumenti-rovine` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (la guglia: ago, a gradoni, cristallo; gli anelli: uno grande, due inclinati per lato, tre impilati; la cima: sfera, prisma, corona di punte) e raggi che partono dalla cima e si piegano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.470 | ≥ 0.15 |
| distanza minima fra due semi | 0.226 | — |
| tempo del seme più lento | 473 ms | < 1500 ms |
| voxel per seme (1-5) | 4294, 2876, 3288, 4383, 3764 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`faro-iperspaziale.png`](faro-iperspaziale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 60 nodi, 219 passi, finito in 471 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), T=guglia, D=gambe, R=anelli, L=fuoco freddo, x=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: T 1539, D 1466, R 1121, L 168.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-8 line×3, box×1: 12584 celle x6-44 y10-47 z0-41, passi 11-14
 #9 one u → 1 (+2) passi=1: ×1, 1 celle x19 y30 z19, passi 15, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #10 all 1u → *1 (+2): ×51, 11117 celle x16-34 y16-34 z10-41, passi 16-66, u→2 11117
   r1 1u → *1 ×0; r2 2u → *2 ×11117; r3 3u → *3 ×0
#13-16 box×4: 1539 celle x20-30 y20-30 z10-41, passi 67-70
 #20 prl u → . (+3): ×1, 9579 celle x16-34 y16-34 z10-41, passi 71, 2→. 9579
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×9579; r4 3 → . ×0
 #21 box at 25 25 8 size 50 50 34 u su .: ×1, 79453 celle x1-49 y1-49 z8-41, passi 72, .→u 79453
 #22 one u → 1 (+2) passi=1: ×1, 1 celle x44 y38 z22, passi 73, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #23 all 1u → *1 (+2): ×99, 79452 celle x1-49 y1-49 z8-41, passi 74-172, u→3 79452
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×79452
#33-41 ellipsoid×6, line×3: 1661 celle x13-40 y13-37 z16-34, passi 173-181
 #42 prl u → . (+3): ×1, 77792 celle x1-49 y1-49 z8-41, passi 182, 3→. 77792
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×77792
#43-44 prl×1, box×1: 4132 celle x15-35 y15-35 z16-49, passi 183-184
#45-58 one×1, all×1, cone×1, prl×1: 7184 celle x16-34 y16-34 z40-49, passi 185-219
Senza effetto (non hanno mai cambiato una cella):
#11 cone at 25 25 10 size 8 8 32 T su 1
#12 cylinder at 25 25 10 size 4 4 30 T su 1
#17 cone at 25 25 22 size 12 12 20 T su 3
#18 cone at 25 25 22 size 12 12 -12 T su 3
#19 line 25 25 10 → 25 25 40 T
#24 ellipsoid at 25 25 26 size 34 34 1 x su 1
#25 ellipsoid at 25 25 26 size 40 40 2 R su 1
#26 line 25 25 27 → 44 25 27 R
#27 line 25 25 27 → 16 41 27 R
#28 line 25 25 27 → 15 9 27 R
#29 ellipsoid at 25 25 10 size 1 26 26 x su 2
#30 ellipsoid at 25 25 9 size 2 32 28 R su 2
… e altri 14
```
