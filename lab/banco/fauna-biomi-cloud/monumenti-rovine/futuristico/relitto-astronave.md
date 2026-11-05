# Relitto d'astronave (`relitto-astronave`)

Una nave caduta nelle piane di Sidera tanto tempo fa: lo scafo mezzo sepolto, una pinna che punta il cielo, squarci e rottami.

- Collezione: `monumenti-rovine` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (lo scafo: fusoliera lunga, disco, cuneo, spezzato in due; la pinna: alta, doppia, ala spezzata; il cratere: rottami sparsi, sabbia ammucchiata, terra bruciata) e squarci che si aprono a caso nello scafo, rottami che crescono accanto, fumo che sale da punti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.525 | ≥ 0.15 |
| distanza minima fra due semi | 0.150 | — |
| tempo del seme più lento | 822 ms | < 1500 ms |
| voxel per seme (1-5) | 14352, 10037, 13921, 11618, 10930 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`relitto-astronave.png`](relitto-astronave.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 49 nodi, 361 passi, finito in 868 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), H=scafo, K=scafo bruciato, F=pinna, R=rottami, E=braci, M=fumo, x=marcatore (marcatore), g=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: H 11985, R 1321, F 688, K 327, M 18, E 13.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 50 22 u su .: ×1, 52822 celle x1-49 y1-49 z0-21, passi 11, .→u 52822
#6-7 one×1, all×1: 52822 celle x1-49 y1-49 z0-21, passi 12-99
#9-16 ellipsoid×2, prl×1: 52822 celle x1-49 y1-49 z0-21, passi 100-102
 #17 box at 25 25 4 size 50 50 46 u su .: ×1, 102888 celle x1-49 y1-49 z4-49, passi 103, .→u 102888
 #18 one u → 1 (+2) passi=1: ×1, 1 celle x39 y42 z14, passi 104, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #19 all 1u → *1 (+2): ×114, 102887 celle x1-49 y1-49 z4-49, passi 105-218, u→3 102887
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×102887
#24-26 line×2, box×1: 713 celle x8-42 y20-32 z10-38, passi 219-221
 #27 prl u → . (+3): ×1, 102175 celle x1-49 y1-49 z4-49, passi 222, 3→. 102175
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×102175
#28-49 prl×9, box×2, one×4, all×1, line×3: 24856 celle x1-49 y1-49 z0-34, passi 223-361
Senza effetto (non hanno mai cambiato una cella):
#8 ellipsoid at 25 25 -8 size 22 46 26 H su 1
#11 line 25 4 6 → 25 44 10 H
#12 box at 25 24 0 size 18 40 6 H su 3
#13 ellipsoid at 18 14 -6 size 18 24 20 H su 4
#14 ellipsoid at 32 36 -6 size 18 24 22 H su 4
#15 ellipsoid at 25 25 0 size 16 16 8 N su 4
#20 box at 25 18 4 size 2 12 30 F su 1
#21 line 25 14 33 → 25 24 33 F
#22 line 21 20 6 → 15 14 34 F
#23 line 29 20 6 → 35 14 32 F
#38 ellipsoid at 25 25 0 size 48 48 6 N su 2
#39 cylinder at 25 25 0 size 46 46 1 K su 3
… e altri 1
```
