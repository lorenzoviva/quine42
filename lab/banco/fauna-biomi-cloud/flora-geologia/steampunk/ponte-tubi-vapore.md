# Ponte di tubi a vapore (`ponte-tubi-vapore`)

Un fascio di tubature che scavalca la strada fra due piloni, nel quartiere delle caldaie di Orichalcum: valvole, perdite di vapore.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: i piloni a caso (traliccio, mattoni, cavalletto), il fascio di tubi a caso (tre tubi in fila, due tubi grandi, quattro a gradini), tiranti che pendono dai tubi per lunghezze a caso, valvole in posti a caso e perdite di vapore che nascono a caso sui tubi e salgono a rami.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.585 | ≥ 0.15 |
| distanza minima fra due semi | 0.014 | — |
| tempo del seme più lento | 269 ms | < 1500 ms |
| voxel per seme (1-5) | 7566, 3103, 3391, 7569, 4407 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`ponte-tubi-vapore.png`](ponte-tubi-vapore.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 49 nodi, 201 passi, finito in 279 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), I=ferro, K=mattoni, O=tubi d'ottone, C=tubi di rame, R=valvole, S=vapore, P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 5346, C 898, O 896, I 395, S 16, R 15.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 22 30 u su .: ×1, 30870 celle x1-49 y15-35 z0-29, passi 11, .→u 30870
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x38 y21 z8, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×72, 30869 celle x1-49 y15-35 z0-29, passi 13-84, u→2 30869
   r1 1u → *1 ×0; r2 2u → *2 ×30869; r3 3u → *3 ×0
#18-21 box×4: 5720 celle x1-49 y19-31 z0-27, passi 85-88
 #28 prl u → . (+3): ×1, 25150 celle x1-49 y15-35 z0-29, passi 89, 2→. 25150
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×25150; r4 3 → . ×0
 #29 box at 25 25 26 size 50 22 16 u su .: ×1, 15892 celle x1-49 y15-35 z26-41, passi 90, .→u 15892
 #30 one u → 1 (+2) passi=1: ×1, 1 celle x9 y35 z30, passi 91, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #31 all 1u → *1 (+2): ×71, 15891 celle x1-49 y15-35 z26-41, passi 92-162, u→3 15891
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×15891
#37-40 line×4: 1794 celle x1-49 y17-33 z28-37, passi 163-166
 #41 prl u → . (+3): ×1, 14098 celle x1-49 y15-35 z26-41, passi 167, 3→. 14098
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×14098
#42-48 one×3, prl×4: 92 celle x8-49 y18-33 z19-42, passi 168-201
Senza effetto (non hanno mai cambiato una cella):
#8 line 4 21 0 → 6 25 26 I
#9 line 8 29 0 → 6 25 26 I
#10 line 4 29 0 → 6 25 26 I
#11 line 8 21 0 → 6 25 26 I
#12 line 46 21 0 → 44 25 26 I
#13 line 42 29 0 → 44 25 26 I
#14 line 46 29 0 → 44 25 26 I
#15 line 42 21 0 → 44 25 26 I
#16 box at 6 25 25 size 8 10 3 I su 1
#17 box at 44 25 25 size 8 10 3 I su 1
#22 line 2 25 0 → 6 25 26 I
#23 line 10 25 0 → 6 25 26 I
… e altri 10
```
