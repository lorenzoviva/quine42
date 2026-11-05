# Cisterna a pressione (`cisterna-pressione`)

Una cisterna del vapore cittadino di Orichalcum: lamiera rivettata, manometri accesi, tubi che partono in tutte le direzioni.

- Collezione: `monumenti-rovine` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: il serbatoio a caso (sfera su gambe, cilindro alto con la cupola, due botti coricate, botte a cerchi), tubi che nascono in punti a caso della lamiera e corrono dritti salendo a gomiti, valvole sulle punte, manometri e ruggine a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.415 | ≥ 0.15 |
| distanza minima fra due semi | 0.016 | — |
| tempo del seme più lento | 604 ms | < 1500 ms |
| voxel per seme (1-5) | 18899, 20190, 19020, 12645, 20167 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cisterna-pressione.png`](cisterna-pressione.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 34 nodi, 136 passi, finito in 451 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), T=lamiera, I=ferro, C=tubi di rame, R=valvole, G=manometri, Z=ruggine, S=basamento, e=marcatore (marcatore), w=marcatore (marcatore), s=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: T 14975, S 3042, Z 637, C 141, G 50, I 38, R 16.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 box×2: 91794 celle x4-46 y4-46 z0-49, passi 11-12
 #7 one u → 1 (+3) passi=1: ×1, 1 celle x20 y36 z35, passi 13, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #8 all 1u → *1 (+3): ×91, 88751 celle x4-46 y4-46 z2-49, passi 14-104, u→2 88751
   r1 1u → *1 ×0; r2 2u → *2 ×88751; r3 3u → *3 ×0; r4 4u → *4 ×0
#14-16 cylinder×1, ellipsoid×1, line×1: 15700 celle x12-36 y14-36 z2-39, passi 105-107
 #28 prl u → . (+4): ×1, 73052 celle x4-46 y4-46 z2-49, passi 108, 2→. 73052
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×73052; r4 3 → . ×0; r5 4 → . ×0
#29-30 one×1, prl×1: 298 celle x0-49 y0-49 z5-37, passi 109-131
#31-32 prl×2: 66 celle x0-49 y0-49 z2-39, passi 132-133
 #33 prl .T → *Z passi=1: ×1, 247 celle x14-36 y14-36 z2-39, passi 134, T→Z 247
 #34 prl ZT → *Z passi=2: ×2, 390 celle x14-36 y14-36 z2-39, passi 135-136, T→Z 390
Senza effetto (non hanno mai cambiato una cella):
#9 ellipsoid at 25 25 12 size 30 30 30 T su 1
#10 line 15 15 2 → 18 18 20 I
#11 line 35 15 2 → 32 18 20 I
#12 line 15 35 2 → 18 32 20 I
#13 line 35 35 2 → 32 32 20 I
#17 ellipsoid at 25 16 6 size 40 14 14 T su 3
#18 ellipsoid at 25 34 6 size 40 14 14 T su 3
#19 box at 12 25 2 size 4 32 6 I su 3
#20 box at 38 25 2 size 4 32 6 I su 3
#21 box at 25 25 18 size 4 22 2 I su 3
#22 line 25 25 19 → 25 25 32 C
#23 cylinder at 25 25 2 size 28 28 24 T su 4
… e altri 4
```
