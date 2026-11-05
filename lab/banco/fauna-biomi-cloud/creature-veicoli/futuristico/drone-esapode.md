# Drone esapode (`drone-esapode`)

Il drone a sei zampe che pattuglia le colonie di Sidera: guscio bianco, giunti grigi, un occhio azzurro.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: due scelte a caso (le sei zampe: larghe e basse, alte, in cammino a tripode; il modulo sul dorso: cupola di sensori, rotori spiegati, torretta, antenna) e un'antenna che cresce a rami dal guscio, luci di posizione a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.307 | ≥ 0.15 |
| distanza minima fra due semi | 0.000 | — |
| tempo del seme più lento | 141 ms | < 1500 ms |
| voxel per seme (1-5) | 2605, 2319, 2740, 2462, 2740 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`drone-esapode.png`](drone-esapode.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 67 nodi, 144 passi, finito in 199 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 4=marcatore (marcatore), W=guscio bianco, G=giunti, K=nero opaco, E=occhio, L=luci di posizione, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: G 1248, W 1084, K 260, E 10, L 3.
#2-5 box×3, ellipsoid×1: 21710 celle x0-24 y1-39 z0-21, passi 1-4
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x13 y22 z19, passi 5, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×53, 20092 celle x0-24 y1-39 z0-21, passi 6-58, u→2 20092
   r1 1u → *1 ×0; r2 2u → *2 ×20092; r3 3u → *3 ×0
#20-31 line×12: 1176 celle x1-23 y13-27 z0-21, passi 59-70
 #44 prl u → . (+3): ×1, 18917 celle x0-24 y1-39 z0-21, passi 71, 2→. 18917
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×18917; r4 3 → . ×0
 #45 box at 12 20 14 size 25 40 16 u su .: ×1, 14818 celle x0-24 y1-39 z14-29, passi 72, .→u 14818
 #46 one u → 1 (+3) passi=1: ×1, 1 celle x9 y32 z29, passi 73, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #47 all 1u → *1 (+3): ×61, 14817 celle x0-24 y1-39 z14-29, passi 74-134, u→4 14817
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×14817
#62-63 cylinder×1, box×1: 67 celle x11-13 y13-15 z15-23, passi 135-136
 #64 prl u → . (+4): ×1, 14751 celle x0-24 y1-39 z14-29, passi 137, 4→. 14751
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×14751
#65-67 one×1, prl×2: 14 celle x9-16 y11-30 z14-28, passi 138-144
Senza effetto (non hanno mai cambiato una cella):
#8 line 7 14 12 → 2 14 14 G
#9 line 2 14 14 → 1 14 0 G
#10 line 17 14 12 → 22 14 14 G
#11 line 22 14 14 → 23 14 0 G
#12 line 7 20 12 → 2 20 14 G
#13 line 2 20 14 → 1 20 0 G
#14 line 17 20 12 → 22 20 14 G
#15 line 22 20 14 → 23 20 0 G
#16 line 7 26 12 → 2 26 14 G
#17 line 2 26 14 → 1 26 0 G
#18 line 17 26 12 → 22 26 14 G
#19 line 22 26 14 → 23 26 0 G
… e altri 26
```
