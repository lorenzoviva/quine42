# Cervo reale (`cervo-reale`)

Il cervo dei boschi di Aurora: mantello fulvo, ventre chiaro, palchi d'osso che crescono a rami.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (postura delle zampe: ferma, al passo, in slancio; corporatura: snella, robusta, lunga; portamento della testa: fiero, al pascolo, voltato, al bramito) e i palchi che crescono da due punte con un camminatore che sale, piega o si biforca.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.439 | ≥ 0.15 |
| distanza minima fra due semi | 0.244 | — |
| tempo del seme più lento | 125 ms | < 1500 ms |
| voxel per seme (1-5) | 2325, 3113, 2156, 3032, 2146 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cervo-reale.png`](cervo-reale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 59 nodi, 209 passi, finito in 158 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), F=mantello fulvo, W=ventre chiaro, G=zampe, K=zoccoli e naso, A=palco d'osso, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 1588, G 456, W 255, K 20, A 6.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 12 20 0 size 19 38 15 u su .: ×1, 10545 celle x3-21 y2-38 z0-14, passi 11, .→u 10545
#6-7 one×1, all×1: 10545 celle x3-21 y2-38 z0-14, passi 12-71
#16-19 line×4: 456 celle x7-17 y7-33 z0-14, passi 72-75
 #24 prl u → . (+3): ×1, 10089 celle x3-21 y2-38 z0-14, passi 76, 2→. 10089
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×10089; r4 3 → . ×0
 #25 box at 12 20 7 size 18 32 16 u su .: ×1, 8194 celle x4-20 y5-35 z7-22, passi 77, .→u 8194
#26-27 one×1, all×1: 8194 celle x4-20 y5-35 z7-22, passi 78-133
#30-31 ellipsoid×1, prl×1: 8194 celle x4-20 y5-35 z7-22, passi 134-135
#32-34 ellipsoid×2, box×1: 10912 celle x0-24 y7-39 z0-29, passi 136-138
 #35 one u → 1 (+3) passi=1: ×1, 1 celle x0 y36 z5, passi 139, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #36 all 1u → *1 (+3): ×59, 10656 celle x0-24 y25-39 z0-29, passi 140-198, u→1 10656
   r1 1u → *1 ×10656; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#37-41 ellipsoid×1, box×3, line×1: 249 celle x10-14 y27-38 z17-27, passi 199-203
#57-59 prl×2, one×1: 10418 celle x0-24 y25-39 z0-29, passi 204-209
Senza effetto (non hanno mai cambiato una cella):
#8 box at 8 12 0 size 3 3 2 K su 1
#9 box at 16 12 0 size 3 3 2 K su 1
#10 box at 8 28 0 size 3 3 2 K su 1
#11 box at 16 28 0 size 3 3 2 K su 1
#12 cylinder at 8 12 0 size 3 3 14 G su 1
#13 cylinder at 16 12 0 size 3 3 14 G su 1
#14 cylinder at 8 28 0 size 3 3 14 G su 1
#15 cylinder at 16 28 0 size 3 3 14 G su 1
#20 line 8 37 1 → 8 28 13 G
#21 line 16 35 0 → 16 28 13 G
#22 line 8 3 0 → 8 12 13 G
#23 line 16 5 1 → 16 12 13 G
… e altri 17
```
