# Dirigibile esploratore (`dirigibile-esploratore`)

Il dirigibile delle spedizioni di Orichalcum, ormeggiato al suo traliccio: involucro di tela, gondola di legno, eliche d'ottone.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: quattro scelte a caso (involucro lungo, panciuto o a sigaro alto; traliccio d'ormeggio a prua, al centro o a poppa; gondola lunga, piccola o a due ponti; impennaggi a croce, a X o a tre pinne) e toppe di tela più scura in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.380 | ≥ 0.15 |
| distanza minima fra due semi | 0.154 | — |
| tempo del seme più lento | 490 ms | < 1500 ms |
| voxel per seme (1-5) | 12022, 6629, 6879, 7161, 7329 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`dirigibile-esploratore.png`](dirigibile-esploratore.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 60 nodi, 302 passi, finito in 460 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), T=tela, Q=toppe, W=gondola di legno, I=traliccio di ferro, O=eliche d'ottone, V=oblò, u=marcatore (marcatore).
Alla fine: T 9736, W 1120, I 476, O 368, Q 312, V 10.
 #2 box at 25 25 18 size 27 50 32 u su .: ×1, 42336 celle x12-38 y1-49 z18-49, passi 1, .→u 42336
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x32 y10 z46, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×87, 42335 celle x12-38 y1-49 z18-49, passi 3-89, u→2 42335
   r1 1u → *1 ×0; r2 2u → *2 ×42335; r3 3u → *3 ×0
 #6 ellipsoid at 25 25 24 size 24 40 20 T su 2: ×1, 10048 celle x14-36 y6-44 z24-43, passi 90, 2→T 10048
 #8 prl u → . (+3): ×1, 32288 celle x12-38 y1-49 z18-49, passi 91, 2→. 32288
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×32288; r4 3 → . ×0
 #9 box at 25 25 0 size 23 50 41 u su .: ×1, 36776 celle x14-36 y1-49 z0-40, passi 92, .→u 36776
#10-11 one×1, all×1: 36776 celle x14-36 y1-49 z0-40, passi 93-164
#17-27 line×3, prl×1: 36776 celle x14-36 y1-49 z0-40, passi 165-168
#28-30 box×1, one×1, all×1: 26486 celle x18-32 y6-44 z4-33, passi 169-231
#41-46 box×4, line×1, prl×1: 29567 celle x4-46 y1-44 z4-49, passi 232-237
#47-60 one×1, all×1, box×2, prl×3: 32960 celle x4-46 y1-43 z14-49, passi 238-302
Senza effetto (non hanno mai cambiato una cella):
#5 ellipsoid at 25 25 26 size 18 46 16 T su 1
#7 ellipsoid at 25 25 31 size 16 44 15 T su 3
#12 line 25 49 0 → 25 49 38 I
#13 line 21 49 0 → 25 49 20 I
#14 line 29 49 0 → 25 49 20 I
#15 box at 25 49 0 size 9 3 1 I su 1
#16 line 25 49 36 → 25 40 36 I
#20 box at 16 25 0 size 4 4 1 I su 2
#21 box at 34 25 0 size 4 4 1 I su 2
#22 line 25 1 0 → 25 1 38 I
#23 line 21 1 0 → 25 1 20 I
#24 line 29 1 0 → 25 1 20 I
… e altri 19
```
