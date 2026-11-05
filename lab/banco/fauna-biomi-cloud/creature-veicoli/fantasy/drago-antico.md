# Drago antico (`drago-antico`)

Il drago delle vette di Aurora, accucciato su quattro zampe: squame color bronzo, ali di membrana, corna che crescono storte.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: cinque scelte a caso (corpo, zampe piantate o impennate, ali spiegate, alzate o raccolte, collo eretto, basso o voltato, coda arrotolata a destra, a sinistra o alzata), corna che crescono a caso e creste sul dorso in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.446 | ≥ 0.15 |
| distanza minima fra due semi | 0.070 | — |
| tempo del seme più lento | 669 ms | < 1500 ms |
| voxel per seme (1-5) | 8595, 9494, 8539, 8373, 8618 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`drago-antico.png`](drago-antico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 82 nodi, 444 passi, finito in 692 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), F=squame bronzo, W=ventre, M=membrana delle ali, O=ossa delle ali, A=corna e creste, E=occhi, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 6741, M 1268, W 489, O 56, A 40, E 1.
#2-5 box×3, one×1: 22346 celle x0-39 y0-41 z0-32, passi 1-11
#6-7 one×1, all×1: 22330 celle x11-39 y7-41 z11-32, passi 12-75
#9-11 ellipsoid×1, prl×1: 22330 celle x11-39 y7-41 z11-32, passi 76-77
#12-13 ellipsoid×1, box×1: 29253 celle x6-44 y5-43 z0-19, passi 78-79
#14-15 one×1, all×1: 28764 celle x6-44 y5-43 z0-19, passi 80-151
#20-25 line×4, box×1, prl×1: 28764 celle x6-44 y5-43 z0-19, passi 152-157
 #26 box at 25 24 17 size 50 29 33 u su .: ×1, 43649 celle x1-49 y10-38 z17-49, passi 158, .→u 43649
#27-28 one×1, all×1: 43649 celle x1-49 y10-38 z17-49, passi 159-246
#37-40 ellipsoid×2, line×2: 1324 celle x14-36 y11-32 z19-30, passi 247-250
 #41 prl u → . (+3): ×1, 42325 celle x1-49 y10-38 z17-49, passi 251, 3→. 42325
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×42325
 #42 box at 25 42 8 size 44 16 42 u su .: ×1, 26408 celle x4-46 y35-49 z8-49, passi 252, .→u 26408
#43-44 one×1, all×1: 26408 celle x4-46 y35-49 z8-49, passi 253-332
#58-64 line×1, ellipsoid×1, box×3, prl×1: 26408 celle x4-46 y35-49 z8-49, passi 333-338
 #65 box at 25 9 0 size 48 19 44 u su .: ×1, 36829 celle x2-48 y0-18 z0-43, passi 339, .→u 36829
#66-67 one×1, all×1: 36829 celle x2-48 y0-18 z0-43, passi 340-418
#68-82 line×3, prl×3, one×2, all×1: 36907 celle x2-48 y0-43 z0-43, passi 419-444
Senza effetto (non hanno mai cambiato una cella):
#8 ellipsoid at 25 24 13 size 20 28 15 F su 1
#10 ellipsoid at 25 25 13 size 22 24 16 F su 3
#16 line 17 15 0 → 20 16 17 F
#17 line 33 15 0 → 30 16 17 F
#18 line 17 34 0 → 20 32 17 F
#19 line 33 34 0 → 30 32 17 F
#29 line 19 26 25 → 2 29 31 O
#30 line 31 26 25 → 48 29 31 O
#31 ellipsoid at 10 24 25 size 18 18 3 M su 1
#32 ellipsoid at 40 24 25 size 18 18 3 M su 1
#33 line 18 26 24 → 12 27 48 O
#34 line 32 26 24 → 38 27 48 O
… e altri 22
```
