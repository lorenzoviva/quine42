# Elicottero di soccorso (`elicottero-soccorso`)

L'elisoccorso di Neapolis, bianco e rosso, posato sui pattini.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (fusoliera grande, compatta o a goccia con la sua trave di coda; rotore a quattro pale dritte, a X, a tre o a cinque pale; dotazione: scaletta, verricello con la barella a terra, galleggianti, faro di ricerca) e i numeri di bordo che compaiono a caso sulle fiancate.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.380 | ≥ 0.15 |
| distanza minima fra due semi | 0.222 | — |
| tempo del seme più lento | 567 ms | < 1500 ms |
| voxel per seme (1-5) | 3763, 4870, 5039, 4436, 4373 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`elicottero-soccorso.png`](elicottero-soccorso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 61 nodi, 252 passi, finito in 413 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=fusoliera bianca, R=fascia rossa, K=pale e pattini, V=vetri, Y=numeri di bordo, O=galleggianti, u=marcatore (marcatore).
Alla fine: W 1462, K 1087, O 892, R 288, V 28, Y 6.
#2-8 line×6, box×1: 35774 celle x11-39 y1-47 z0-29, passi 1-7
 #9 one u → 1 (+2) passi=1: ×1, 1 celle x17 y44 z26, passi 8, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #10 all 1u → *1 (+2): ×87, 35349 celle x11-39 y1-47 z4-29, passi 9-95, u→2 35349
   r1 1u → *1 ×0; r2 2u → *2 ×35349; r3 3u → *3 ×0
#16-20 box×3, ellipsoid×1, line×1: 1802 celle x19-31 y1-35 z6-21, passi 96-100
 #25 prl u → . (+3): ×1, 33548 celle x11-39 y1-47 z4-29, passi 101, 2→. 33548
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×33548; r4 3 → . ×0
#26-47 box×2, cylinder×1, one×1, all×1, line×3, prl×1: 21059 celle x1-49 y3-49 z10-31, passi 102-166
 #48 box at 25 30 0 size 50 40 24 u su .: ×1, 43722 celle x1-49 y11-49 z0-23, passi 167, .→u 43722
 #49 one u → 1 (+3) passi=1: ×1, 1 celle x17 y36 z23, passi 168, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #50 all 1u → *1 (+3): ×80, 43721 celle x1-49 y11-49 z0-23, passi 169-248, u→3 43721
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×43721; r4 4u → *4 ×0
#56-57 ellipsoid×2: 892 celle x13-37 y16-38 z0-5, passi 249-250
 #60 prl u → . (+4): ×1, 42830 celle x1-49 y11-49 z0-23, passi 251, 3→. 42830
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×42830; r5 4 → . ×0
 #61 prl .W → *Y passi=1: ×1, 6 celle x19-29 y2-32 z12-15, passi 252, W→Y 6
Senza effetto (non hanno mai cambiato una cella):
#11 box at 25 39 13 size 9 1 5 V su 1
#12 ellipsoid at 25 26 5 size 16 26 15 W su 1
#13 line 25 14 13 → 25 1 16 W
#14 box at 25 2 16 size 2 4 9 R su 1
#15 line 25 2 21 → 25 2 21 K
#21 box at 25 37 12 size 9 1 6 V su 3
#22 ellipsoid at 25 28 5 size 15 20 15 W su 3
#23 line 25 19 12 → 25 2 17 W
#24 cone at 25 2 17 size 3 5 8 R su 3
#31 line 25 27 30 → 48 27 30 K
#32 line 25 27 30 → 25 50 30 K
#33 line 25 27 30 → 2 27 30 K
… e altri 17
```
