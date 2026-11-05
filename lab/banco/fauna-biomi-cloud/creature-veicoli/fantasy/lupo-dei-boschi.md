# Lupo dei boschi (`lupo-dei-boschi`)

Il lupo grigio delle selve di Aurora, dorso scuro e petto chiaro.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: quattro scelte a caso: andatura (fermo, al trotto, acquattato), corporatura (magro, massiccio, lungo), testa (in avanti, all'ululato, a fiutare il suolo), coda (bassa, alta e arricciata, tesa); il pelo del dorso si scurisce a chiazze.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.387 | ≥ 0.15 |
| distanza minima fra due semi | 0.195 | — |
| tempo del seme più lento | 147 ms | < 1500 ms |
| voxel per seme (1-5) | 2633, 2730, 2330, 3599, 3581 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`lupo-dei-boschi.png`](lupo-dei-boschi.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 63 nodi, 226 passi, finito in 148 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), F=pelliccia grigia, D=dorso scuro, W=petto chiaro, G=zampe, E=occhi ambrati, u=marcatore (marcatore).
Alla fine: F 1589, G 429, D 395, W 218, E 2.
 #2 box at 12 20 0 size 21 38 14 u su .: ×1, 10878 celle x2-22 y2-38 z0-13, passi 1, .→u 10878
#3-4 one×1, all×1: 10878 celle x2-22 y2-38 z0-13, passi 2-49
#13-21 line×4, prl×1: 10878 celle x2-22 y2-38 z0-13, passi 50-54
 #22 box at 12 20 6 size 20 34 18 u su .: ×1, 11044 celle x3-21 y4-36 z6-23, passi 55, .→u 11044
#23-24 one×1, all×1: 11044 celle x3-21 y4-36 z6-23, passi 56-110
 #27 ellipsoid at 12 19 9 size 12 31 10 F su 3: ×1, 1846 celle x7-17 y4-34 z9-18, passi 111, 3→F 1846
 #28 prl u → . (+3): ×1, 9198 celle x3-21 y4-36 z6-23, passi 112, 3→. 9198
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×9198
#29-31 ellipsoid×2, box×1: 9888 celle x0-24 y10-39 z0-29, passi 113-115
#32-33 one×1, all×1: 9338 celle x0-24 y27-39 z0-29, passi 116-163
#34-54 ellipsoid×1, box×3, line×1, cone×2, prl×1: 9338 celle x0-24 y27-39 z0-29, passi 164-171
 #55 box at 12 4 0 size 25 10 30 u su .: ×1, 6612 celle x0-24 y0-8 z0-29, passi 172, .→u 6612
#56-57 one×1, all×1: 6612 celle x0-24 y0-8 z0-29, passi 173-223
#58-63 line×1, prl×2: 6675 celle x0-24 y0-39 z0-29, passi 224-226
Senza effetto (non hanno mai cambiato una cella):
#5 box at 9 13 0 size 3 3 1 K su 1
#6 box at 15 13 0 size 3 3 1 K su 1
#7 box at 9 27 0 size 3 3 1 K su 1
#8 box at 15 27 0 size 3 3 1 K su 1
#9 cylinder at 9 13 0 size 3 3 13 G su 1
#10 cylinder at 15 13 0 size 3 3 13 G su 1
#11 cylinder at 9 27 0 size 3 3 13 G su 1
#12 cylinder at 15 27 0 size 3 3 13 G su 1
#17 line 5 31 0 → 9 27 12 G
#18 line 19 31 0 → 15 27 12 G
#19 line 5 10 0 → 9 13 12 G
#20 line 19 10 0 → 15 13 12 G
… e altri 18
```
