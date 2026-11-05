# Drago antico (`drago-antico`)

Il drago delle vette di Aurora, accucciato su quattro zampe: squame color bronzo, ali di membrana, corna che crescono storte.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: cinque scelte a caso (corpo, zampe piantate o impennate, ali spiegate, alzate o raccolte, collo eretto, basso o voltato, coda arrotolata a destra, a sinistra o alzata), corna che crescono a caso e creste sul dorso in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.431 | ≥ 0.15 |
| distanza minima fra due semi | 0.293 | — |
| tempo del seme più lento | 700 ms | < 1500 ms |
| voxel per seme (1-5) | 8595, 9065, 9235, 8794, 9459 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`drago-antico.png`](drago-antico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 79 nodi, 426 passi, finito in 715 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), F=squame bronzo, W=ventre, M=membrana delle ali, O=ossa delle ali, A=corna e creste, E=occhi, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 6741, M 1268, W 489, O 56, A 40, E 1.
 #2 box at 25 24 11 size 30 36 22 u su .: ×1, 22330 celle x11-39 y7-41 z11-32, passi 1, .→u 22330
#3-4 one×1, all×1: 22330 celle x11-39 y7-41 z11-32, passi 2-57
#6-8 ellipsoid×1, prl×1: 22330 celle x11-39 y7-41 z11-32, passi 58-59
#9-10 ellipsoid×1, box×1: 29253 celle x6-44 y5-43 z0-19, passi 60-61
#11-12 one×1, all×1: 28764 celle x6-44 y5-43 z0-19, passi 62-133
#17-22 line×4, box×1, prl×1: 28764 celle x6-44 y5-43 z0-19, passi 134-139
 #23 box at 25 24 17 size 50 29 33 u su .: ×1, 43649 celle x1-49 y10-38 z17-49, passi 140, .→u 43649
#24-25 one×1, all×1: 43649 celle x1-49 y10-38 z17-49, passi 141-228
#34-38 ellipsoid×2, line×2, prl×1: 43649 celle x1-49 y10-38 z17-49, passi 229-233
 #39 box at 25 42 8 size 44 16 42 u su .: ×1, 26408 celle x4-46 y35-49 z8-49, passi 234, .→u 26408
#40-41 one×1, all×1: 26408 celle x4-46 y35-49 z8-49, passi 235-314
#55-61 line×1, ellipsoid×1, box×3, prl×1: 26408 celle x4-46 y35-49 z8-49, passi 315-320
 #62 box at 25 9 0 size 48 19 44 u su .: ×1, 36829 celle x2-48 y0-18 z0-43, passi 321, .→u 36829
#63-64 one×1, all×1: 36829 celle x2-48 y0-18 z0-43, passi 322-400
#65-79 line×3, prl×3, one×2, all×1: 36907 celle x2-48 y0-43 z0-43, passi 401-426
Senza effetto (non hanno mai cambiato una cella):
#5 ellipsoid at 25 24 13 size 20 28 15 F su 1
#7 ellipsoid at 25 25 13 size 22 24 16 F su 3
#13 line 17 15 0 → 20 16 17 F
#14 line 33 15 0 → 30 16 17 F
#15 line 17 34 0 → 20 32 17 F
#16 line 33 34 0 → 30 32 17 F
#26 line 19 26 25 → 2 29 31 O
#27 line 31 26 25 → 48 29 31 O
#28 ellipsoid at 10 24 25 size 18 18 3 M su 1
#29 ellipsoid at 40 24 25 size 18 18 3 M su 1
#30 line 18 26 24 → 12 27 48 O
#31 line 32 26 24 → 38 27 48 O
… e altri 22
```
