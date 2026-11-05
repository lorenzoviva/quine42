# Ponte di tubi a vapore (`ponte-tubi-vapore`)

Un fascio di tubature che scavalca la strada fra due piloni, nel quartiere delle caldaie di Orichalcum: valvole, perdite di vapore.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: i piloni a caso (traliccio, mattoni, cavalletto), il fascio di tubi a caso (tre tubi in fila, due tubi grandi, quattro a gradini), valvole in posti a caso e perdite di vapore che nascono a caso sui tubi e salgono a rami.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.509 | ≥ 0.15 |
| distanza minima fra due semi | 0.018 | — |
| tempo del seme più lento | 235 ms | < 1500 ms |
| voxel per seme (1-5) | 8841, 3071, 3070, 6463, 3070 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`ponte-tubi-vapore.png`](ponte-tubi-vapore.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 43 nodi, 161 passi, finito in 225 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), I=ferro, K=mattoni, O=tubi d'ottone, C=tubi di rame, R=valvole, S=vapore, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: K 5346, O 2058, C 1029, I 374, S 18, R 16.
 #2 box at 25 25 0 size 50 22 30 u su .: ×1, 30870 celle x1-49 y15-35 z0-29, passi 1, .→u 30870
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x9 y24 z26, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×77, 30869 celle x1-49 y15-35 z0-29, passi 3-79, u→2 30869
   r1 1u → *1 ×0; r2 2u → *2 ×30869; r3 3u → *3 ×0
#15-18 box×4: 5720 celle x1-49 y19-31 z0-27, passi 80-83
 #25 prl u → . (+3): ×1, 25150 celle x1-49 y15-35 z0-29, passi 84, 2→. 25150
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×25150; r4 3 → . ×0
 #26 box at 25 25 26 size 50 22 16 u su .: ×1, 15892 celle x1-49 y15-35 z26-41, passi 85, .→u 15892
 #27 one u → 1 (+2) passi=1: ×1, 1 celle x17 y23 z35, passi 86, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #28 all 1u → *1 (+2): ×53, 15891 celle x1-49 y15-35 z26-41, passi 87-139, u→1 15891
   r1 1u → *1 ×15891; r2 2u → *2 ×0; r3 3u → *3 ×0
#29-31 line×3: 3087 celle x1-49 y18-32 z28-32, passi 140-142
 #38 prl u → . (+3): ×1, 12805 celle x1-49 y15-35 z26-41, passi 143, 1→. 12805
   r1 u → . ×0; r2 1 → . ×12805; r3 2 → . ×0; r4 3 → . ×0
#39-40 prl×1, one×1: 20 celle x1-49 y18-32 z32-33, passi 144-148
#41-42 one×1, prl×1: 32 celle x3-49 y22-26 z32-37, passi 149-161
Senza effetto (non hanno mai cambiato una cella):
#5 line 4 21 0 → 6 25 26 I
#6 line 8 29 0 → 6 25 26 I
#7 line 4 29 0 → 6 25 26 I
#8 line 8 21 0 → 6 25 26 I
#9 line 46 21 0 → 44 25 26 I
#10 line 42 29 0 → 44 25 26 I
#11 line 46 29 0 → 44 25 26 I
#12 line 42 21 0 → 44 25 26 I
#13 box at 6 25 25 size 8 10 3 I su 1
#14 box at 44 25 25 size 8 10 3 I su 1
#19 line 2 25 0 → 6 25 26 I
#20 line 10 25 0 → 6 25 26 I
… e altri 11
```
