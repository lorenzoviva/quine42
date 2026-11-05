# Dirigibile esploratore (`dirigibile-esploratore`)

Il dirigibile delle spedizioni di Orichalcum, ormeggiato al suo traliccio: involucro di tela, gondola di legno, eliche d'ottone.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: quattro scelte a caso (involucro lungo, panciuto o a sigaro alto; traliccio d'ormeggio a prua, al centro o a poppa; gondola lunga, piccola o a due ponti; impennaggi a croce, a X o a tre pinne) e toppe di tela più scura in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.442 | ≥ 0.15 |
| distanza minima fra due semi | 0.039 | — |
| tempo del seme più lento | 516 ms | < 1500 ms |
| voxel per seme (1-5) | 11527, 6875, 8410, 11407, 7329 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`dirigibile-esploratore.png`](dirigibile-esploratore.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 63 nodi, 364 passi, finito in 485 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), T=tela, Q=toppe, W=gondola di legno, I=traliccio di ferro, O=eliche d'ottone, V=oblò, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: T 9714, W 735, I 394, O 344, Q 334, V 6.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 18 size 27 50 32 u su .: ×1, 42336 celle x12-38 y1-49 z18-49, passi 11, .→u 42336
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x37 y43 z26, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×90, 42335 celle x12-38 y1-49 z18-49, passi 13-102, u→2 42335
   r1 1u → *1 ×0; r2 2u → *2 ×42335; r3 3u → *3 ×0
 #9 ellipsoid at 25 25 24 size 24 40 20 T su 2: ×1, 10048 celle x14-36 y6-44 z24-43, passi 103, 2→T 10048
 #11 prl u → . (+3): ×1, 32288 celle x12-38 y1-49 z18-49, passi 104, 2→. 32288
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×32288; r4 3 → . ×0
 #12 box at 25 25 0 size 23 50 41 u su .: ×1, 36776 celle x14-36 y1-49 z0-40, passi 105, .→u 36776
#13-14 one×1, all×1: 36776 celle x14-36 y1-49 z0-40, passi 106-194
#25-30 line×4, box×1, prl×1: 36776 celle x14-36 y1-49 z0-40, passi 195-200
#31-33 box×1, one×1, all×1: 26884 celle x18-32 y6-44 z4-33, passi 201-268
#34-49 box×3, line×4, prl×1: 29578 celle x4-46 y1-44 z4-49, passi 269-276
#50-63 one×1, all×1, box×2, prl×3: 32606 celle x4-46 y1-42 z14-49, passi 277-364
Senza effetto (non hanno mai cambiato una cella):
#8 ellipsoid at 25 25 26 size 18 46 16 T su 1
#10 ellipsoid at 25 25 31 size 16 44 15 T su 3
#15 line 25 49 0 → 25 49 38 I
#16 line 21 49 0 → 25 49 20 I
#17 line 29 49 0 → 25 49 20 I
#18 box at 25 49 0 size 9 3 1 I su 1
#19 line 25 49 36 → 25 40 36 I
#20 line 16 25 0 → 20 25 33 I
#21 line 34 25 0 → 30 25 33 I
#22 line 16 25 8 → 34 25 8 I
#23 box at 16 25 0 size 4 4 1 I su 2
#24 box at 34 25 0 size 4 4 1 I su 2
… e altri 15
```
