# Stazione della teleferica (`stazione-teleferica`)

La stazione a monte della teleferica di Orichalcum: la grande ruota delle funi, le funi che partono verso il pilone, una cabina appesa.

- Collezione: `monumenti-rovine` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (il tetto: a falde, a cupola d'ottone, piatto con l'insegna; dove sta la cabina: in partenza, a metà, al pilone, in arrivo; il pilone: a traliccio, di pietra, a cavalletto) e fumo che sale a caso dal comignolo.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.240 | ≥ 0.15 |
| distanza minima fra due semi | 0.047 | — |
| tempo del seme più lento | 294 ms | < 1500 ms |
| voxel per seme (1-5) | 17604, 14110, 16759, 17589, 14109 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`stazione-teleferica.png`](stazione-teleferica.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 67 nodi, 215 passi, finito in 387 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), K=mattoni, I=ferro, O=ottone, R=cabina rossa, V=vetri, F=fumo, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 10654, O 4879, I 1651, R 391, V 15, F 14.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-11 box×3, cylinder×2, line×2: 38640 celle x4-46 y0-49 z0-49, passi 11-17
 #12 one u → 1 (+2) passi=1: ×1, 1 celle x38 y11 z26, passi 18, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #13 all 1u → *1 (+2): ×68, 26431 celle x4-46 y0-18 z17-49, passi 19-86, u→2 26431
   r1 1u → *1 ×0; r2 2u → *2 ×26431; r3 3u → *3 ×0
#25-28 ellipsoid×1, cylinder×1, box×2: 4336 celle x11-39 y1-13 z18-38, passi 87-90
 #33 prl u → . (+3): ×1, 22096 celle x4-46 y0-18 z17-49, passi 91, 2→. 22096
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×22096; r4 3 → . ×0
 #34 box at 18 30 4 size 14 40 34 u su .: ×1, 15427 celle x12-24 y11-49 z4-37, passi 92, .→u 15427
#35-36 one×1, all×1: 15427 celle x12-24 y11-49 z4-37, passi 93-152
#37-49 line×1, box×2, prl×1: 15427 celle x12-24 y11-49 z4-37, passi 153-156
#50-52 box×1, one×1, all×1: 14828 celle x14-36 y40-48 z0-35, passi 157-198
#61-66 line×2, box×1, prl×2, one×1: 7441 celle x10-36 y1-48 z0-44, passi 199-215
Senza effetto (non hanno mai cambiato una cella):
#14 box at 25 6 22 size 40 12 2 I su 1
#15 box at 25 6 24 size 40 10 2 I su 1
#16 box at 25 6 26 size 40 8 2 I su 1
#17 box at 25 6 28 size 40 6 2 I su 1
#18 box at 25 6 30 size 40 4 2 I su 1
#19 box at 25 6 32 size 40 2 2 I su 1
#20 line 25 6 22 → 25 6 20 I
#21 box at 10 6 30 size 3 3 6 K su 1
#22 box at 10 6 36 size 1 1 1 P su 1
#23 line 13 3 17 → 13 3 22 I
#24 line 37 3 17 → 37 3 22 I
#29 box at 25 4 17 size 36 6 4 K su 3
… e altri 21
```
