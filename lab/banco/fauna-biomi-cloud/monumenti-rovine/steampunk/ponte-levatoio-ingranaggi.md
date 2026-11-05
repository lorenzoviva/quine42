# Ponte levatoio a ingranaggi (`ponte-levatoio-ingranaggi`)

La porta di un quartiere di Orichalcum: due torri di mattoni con le ruote dentate, e un ponte che si alza a vapore.

- Collezione: `monumenti-rovine` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (il ponte: abbassato, alzato, a metà; le torri: tonde, quadre, a traliccio; le ruote dentate: una grande per torre, due piccole, un treno di tre) e denti delle ruote, rivetti e ruggine a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.549 | ≥ 0.15 |
| distanza minima fra due semi | 0.165 | — |
| tempo del seme più lento | 589 ms | < 1500 ms |
| voxel per seme (1-5) | 17021, 4859, 15016, 16760, 5723 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`ponte-levatoio-ingranaggi.png`](ponte-levatoio-ingranaggi.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 75 nodi, 315 passi, finito in 524 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), K=mattoni, W=tavolato, I=ferro, O=ruote d'ottone, Z=ruggine, N=catene, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 14164, W 1295, I 1146, O 276, N 84, Z 56.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 38 0 size 50 24 50 u su .: ×1, 56350 celle x1-49 y27-49 z0-49, passi 11, .→u 56350
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x49 y46 z13, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×103, 56349 celle x1-49 y27-49 z0-49, passi 13-115, u→2 56349
   r1 1u → *1 ×0; r2 2u → *2 ×56349; r3 3u → *3 ×0
#13-17 box×5: 15074 celle x2-48 y31-45 z0-39, passi 116-120
 #29 prl u → . (+3): ×1, 41276 celle x1-49 y27-49 z0-49, passi 121, 2→. 41276
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×41276; r4 3 → . ×0
#30-31 box×2: 29792 celle x14-36 y1-35 z0-37, passi 122-123
#32-33 one×1, all×1: 29532 celle x14-36 y1-35 z0-37, passi 124-191
#41-52 line×11, prl×1: 29532 celle x14-36 y1-35 z0-37, passi 192-203
 #53 box at 25 38 4 size 50 24 44 u su .: ×1, 35568 celle x1-49 y27-49 z4-47, passi 204, .→u 35568
 #54 one u → 1 (+2) passi=1: ×1, 1 celle x4 y43 z42, passi 205, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #55 all 1u → *1 (+2): ×99, 35567 celle x1-49 y27-49 z4-47, passi 206-304, u→2 35567
   r1 1u → *1 ×0; r2 2u → *2 ×35567; r3 3u → *3 ×0
#60-67 ellipsoid×4, line×4: 308 celle x1-49 y30-46 z10-30, passi 305-312
#72-75 prl×3: 35316 celle x1-49 y27-49 z0-47, passi 313-315
Senza effetto (non hanno mai cambiato una cella):
#8 cylinder at 9 38 0 size 14 14 36 K su 1
#9 cylinder at 41 38 0 size 14 14 36 K su 1
#10 cone at 9 38 36 size 16 16 10 I su 1
#11 cone at 41 38 36 size 16 16 10 I su 1
#12 box at 25 38 26 size 24 8 10 K su 1
#18 line 4 33 0 → 8 37 36 I
#19 line 14 33 0 → 10 37 36 I
#20 line 4 43 0 → 8 39 36 I
#21 line 14 43 0 → 10 39 36 I
#22 line 36 33 0 → 40 37 36 I
#23 line 46 33 0 → 42 37 36 I
#24 line 36 43 0 → 40 39 36 I
… e altri 20
```
