# Ragno meccanico (`ragno-meccanico`)

Un ragno a vapore delle miniere di Orichalcum: otto zampe a pistone, addome-caldaia, occhi di vetro rosso.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: due scelte a caso (la postura di tutto il corpo e delle otto zampe: alta, acquattata, in cammino, all'attacco; l'addome: caldaia grande, serbatoio stretto, gabbia di tubi) e valvole che spuntano a caso sul dorso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.386 | ≥ 0.15 |
| distanza minima fra due semi | 0.010 | — |
| tempo del seme più lento | 256 ms | < 1500 ms |
| voxel per seme (1-5) | 3214, 4395, 5170, 3337, 3214 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`ragno-meccanico.png`](ragno-meccanico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 99 nodi, 151 passi, finito in 190 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 3=marcatore (marcatore), O=piastre d'ottone, D=bronzo scuro, I=zampe di ferro, R=occhi di vetro, T=valvole, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: I 1546, O 1131, D 519, T 16, R 2.
 #2 box at 12 20 0 size 25 40 30 u su .: ×1, 29250 celle x0-24 y1-39 z0-29, passi 1, .→u 29250
 #3 one u → 1 (+3) passi=1: ×1, 1 celle x17 y10 z15, passi 2, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #4 all 1u → *1 (+3): ×61, 29249 celle x0-24 y1-39 z0-29, passi 3-63, u→3 29249
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×29249; r4 4u → *4 ×0
#43-61 box×2, ellipsoid×1, line×16: 1952 celle x0-24 y9-31 z0-21, passi 64-82
 #79 prl u → . (+4): ×1, 27298 celle x0-24 y1-39 z0-29, passi 83, 3→. 27298
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×27298; r5 4 → . ×0
 #80 box at 12 10 0 size 25 22 30 u su .: ×1, 14823 celle x0-24 y0-20 z0-29, passi 84, .→u 14823
 #81 one u → 1 (+2) passi=1: ×1, 1 celle x4 y5 z15, passi 85, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #82 all 1u → *1 (+2): ×50, 14822 celle x0-24 y0-20 z0-29, passi 86-135, u→3 14822
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×14822
#89-94 box×1, line×4, ellipsoid×1: 1246 celle x6-18 y3-20 z0-21, passi 136-141
 #95 prl u → . (+3): ×1, 13577 celle x0-24 y0-20 z0-29, passi 142, 3→. 13577
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×13577
#96-99 one×1, all×1, prl×2: 91 celle x6-18 y4-23 z0-22, passi 143-151
Senza effetto (non hanno mai cambiato una cella):
#5 box at 10 28 17 size 1 2 1 R su 1
#6 box at 14 28 17 size 1 2 1 R su 1
#7 ellipsoid at 12 22 14 size 10 14 8 O su 1
#8 line 8 14 17 → 2 14 24 I
#9 line 2 14 24 → 0 14 0 I
#10 line 16 14 17 → 22 14 24 I
#11 line 22 14 24 → 24 14 0 I
#12 line 8 18 17 → 2 18 24 I
#13 line 2 18 24 → 0 18 0 I
#14 line 16 18 17 → 22 18 24 I
#15 line 22 18 24 → 24 18 0 I
#16 line 8 22 17 → 2 22 24 I
… e altri 49
```
