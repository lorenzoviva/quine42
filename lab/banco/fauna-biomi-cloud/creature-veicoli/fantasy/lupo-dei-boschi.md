# Lupo dei boschi (`lupo-dei-boschi`)

Il lupo grigio delle selve di Aurora, dorso scuro e petto chiaro.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: quattro scelte a caso: andatura (fermo, al trotto, acquattato), corporatura (magro, massiccio, lungo), testa (in avanti, all'ululato, a fiutare il suolo), coda (bassa, alta e arricciata, tesa); il pelo del dorso si scurisce a chiazze.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.476 | ≥ 0.15 |
| distanza minima fra due semi | 0.312 | — |
| tempo del seme più lento | 152 ms | < 1500 ms |
| voxel per seme (1-5) | 2307, 2638, 2339, 3569, 3546 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`lupo-dei-boschi.png`](lupo-dei-boschi.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 66 nodi, 253 passi, finito in 152 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), F=pelliccia grigia, D=dorso scuro, W=petto chiaro, G=zampe, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 1324, G 429, D 343, W 211.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 12 20 0 size 21 38 14 u su .: ×1, 10878 celle x2-22 y2-38 z0-13, passi 11, .→u 10878
#6-7 one×1, all×1: 10878 celle x2-22 y2-38 z0-13, passi 12-68
#16-24 line×4, prl×1: 10878 celle x2-22 y2-38 z0-13, passi 69-73
 #25 box at 12 20 6 size 20 34 18 u su .: ×1, 11044 celle x3-21 y4-36 z6-23, passi 74, .→u 11044
 #26 one u → 1 (+2) passi=1: ×1, 1 celle x6 y31 z6, passi 75, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #27 all 1u → *1 (+2): ×59, 11043 celle x3-21 y4-36 z6-23, passi 76-134, u→1 11043
   r1 1u → *1 ×11043; r2 2u → *2 ×0; r3 3u → *3 ×0
 #28 ellipsoid at 12 20 9 size 11 26 10 F su 1: ×1, 1428 celle x7-17 y8-32 z9-18, passi 135, 1→F 1428
 #31 prl u → . (+3): ×1, 9616 celle x3-21 y4-36 z6-23, passi 136, 1→. 9616
   r1 u → . ×0; r2 1 → . ×9616; r3 2 → . ×0; r4 3 → . ×0
#32-34 ellipsoid×2, box×1: 9919 celle x0-24 y11-39 z0-29, passi 137-139
#35-36 one×1, all×1: 9416 celle x0-24 y27-39 z0-29, passi 140-196
#45-57 ellipsoid×1, line×2, cone×2, prl×1: 9416 celle x0-24 y27-39 z0-29, passi 197-202
 #58 box at 12 4 0 size 25 10 30 u su .: ×1, 6730 celle x0-24 y0-8 z0-29, passi 203, .→u 6730
#59-60 one×1, all×1: 6730 celle x0-24 y0-8 z0-29, passi 204-249
#62-66 line×1, ellipsoid×1, prl×2: 6771 celle x0-24 y0-33 z0-29, passi 250-253
Senza effetto (non hanno mai cambiato una cella):
#8 box at 9 13 0 size 3 3 1 K su 1
#9 box at 15 13 0 size 3 3 1 K su 1
#10 box at 9 27 0 size 3 3 1 K su 1
#11 box at 15 27 0 size 3 3 1 K su 1
#12 cylinder at 9 13 0 size 3 3 13 G su 1
#13 cylinder at 15 13 0 size 3 3 13 G su 1
#14 cylinder at 9 27 0 size 3 3 13 G su 1
#15 cylinder at 15 27 0 size 3 3 13 G su 1
#20 line 5 31 0 → 9 27 12 G
#21 line 19 31 0 → 15 27 12 G
#22 line 5 10 0 → 9 13 12 G
#23 line 19 10 0 → 15 13 12 G
… e altri 19
```
