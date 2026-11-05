# Cervo reale (`cervo-reale`)

Il cervo dei boschi di Aurora: mantello fulvo, ventre chiaro, palchi d'osso che crescono a rami.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (postura delle zampe: ferma, al passo, in slancio; corporatura: snella, robusta, lunga; portamento della testa: fiero, al pascolo, voltato, al bramito) e i palchi che crescono da due punte con un camminatore che sale, piega o si biforca.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.309 | ≥ 0.15 |
| distanza minima fra due semi | 0.138 | — |
| tempo del seme più lento | 121 ms | < 1500 ms |
| voxel per seme (1-5) | 3032, 3104, 3113, 3130, 2170 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cervo-reale.png`](cervo-reale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 56 nodi, 190 passi, finito in 119 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), F=mantello fulvo, W=ventre chiaro, G=zampe, K=zoccoli e naso, A=palco d'osso, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 2184, G 456, W 366, K 20, A 6.
 #2 box at 12 20 0 size 19 38 15 u su .: ×1, 10545 celle x3-21 y2-38 z0-14, passi 1, .→u 10545
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x4 y10 z13, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×58, 10544 celle x3-21 y2-38 z0-14, passi 3-60, u→2 10544
   r1 1u → *1 ×0; r2 2u → *2 ×10544; r3 3u → *3 ×0
#13-16 line×4: 456 celle x7-17 y7-33 z0-14, passi 61-64
 #21 prl u → . (+3): ×1, 10089 celle x3-21 y2-38 z0-14, passi 65, 2→. 10089
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×10089; r4 3 → . ×0
 #22 box at 12 20 7 size 18 32 16 u su .: ×1, 8194 celle x4-20 y5-35 z7-22, passi 66, .→u 8194
#23-24 one×1, all×1: 8194 celle x4-20 y5-35 z7-22, passi 67-113
#26-28 ellipsoid×1, prl×1: 8194 celle x4-20 y5-35 z7-22, passi 114-115
#29-31 ellipsoid×2, box×1: 10831 celle x0-24 y7-39 z0-29, passi 116-118
#32-33 one×1, all×1: 10465 celle x0-24 y25-39 z0-29, passi 119-179
#34-38 ellipsoid×1, box×3, line×1: 220 celle x10-14 y28-38 z18-27, passi 180-184
#54-56 prl×2, one×1: 10255 celle x0-24 y25-39 z0-29, passi 185-190
Senza effetto (non hanno mai cambiato una cella):
#5 box at 8 12 0 size 3 3 2 K su 1
#6 box at 16 12 0 size 3 3 2 K su 1
#7 box at 8 28 0 size 3 3 2 K su 1
#8 box at 16 28 0 size 3 3 2 K su 1
#9 cylinder at 8 12 0 size 3 3 14 G su 1
#10 cylinder at 16 12 0 size 3 3 14 G su 1
#11 cylinder at 8 28 0 size 3 3 14 G su 1
#12 cylinder at 16 28 0 size 3 3 14 G su 1
#17 line 8 37 1 → 8 28 13 G
#18 line 16 35 0 → 16 28 13 G
#19 line 8 3 0 → 8 12 13 G
#20 line 16 5 1 → 16 12 13 G
… e altri 17
```
