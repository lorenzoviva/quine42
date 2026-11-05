# Segugio d'ottone (`segugio-ottone`)

Un cane da caccia meccanico di Orichalcum: corpo a caldaia, giunti di ferro, comignoli che fumano sul dorso.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: quattro scelte a caso (andatura ferma, in punta o di corsa; corpo a caldaia, snello o corazzato; testa avanti, a fiutare o all'ululato; coda ad antenna, tesa o a frusta) e comignoli che spuntano a caso sul dorso e salgono storti.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.347 | ≥ 0.15 |
| distanza minima fra due semi | 0.035 | — |
| tempo del seme più lento | 147 ms | < 1500 ms |
| voxel per seme (1-5) | 2277, 2117, 3542, 2141, 3523 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`segugio-ottone.png`](segugio-ottone.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 67 nodi, 237 passi, finito in 159 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), O=ottone, D=ottone scuro, I=giunti di ferro, T=comignoli, L=occhi di brace, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: O 1646, I 564, D 33, T 21, L 13.
 #2 box at 12 20 0 size 21 38 14 u su .: ×1, 10878 celle x2-22 y2-38 z0-13, passi 1, .→u 10878
#3-4 one×1, all×1: 10878 celle x2-22 y2-38 z0-13, passi 2-49
#13-24 line×5, prl×1: 10878 celle x2-22 y2-38 z0-13, passi 50-55
 #25 box at 12 20 6 size 22 34 18 u su .: ×1, 12192 celle x2-22 y4-36 z6-23, passi 56, .→u 12192
#26-27 one×1, all×1: 12192 celle x2-22 y4-36 z6-23, passi 57-107
 #28 line 12 12 14 → 12 28 14 O: ×1, 1400 celle x8-16 y8-32 z10-18, passi 108, 1→O 1400
 #32 prl u → . (+3): ×1, 10792 celle x2-22 y4-36 z6-23, passi 109, 1→. 10792
   r1 u → . ×0; r2 1 → . ×10792; r3 2 → . ×0; r4 3 → . ×0
 #33 box at 12 33 0 size 25 14 30 u su .: ×1, 9311 celle x0-24 y27-39 z0-29, passi 110, .→u 9311
#34-35 one×1, all×1: 9311 celle x0-24 y27-39 z0-29, passi 111-160
#43-55 line×1, box×4, prl×1: 9311 celle x0-24 y27-39 z0-29, passi 161-166
 #56 box at 12 5 0 size 25 12 30 u su .: ×1, 8151 celle x0-24 y0-10 z0-29, passi 167, .→u 8151
#57-58 one×1, all×1: 8151 celle x0-24 y0-10 z0-29, passi 168-224
#59-67 line×1, ellipsoid×1, prl×2, one×1, all×1: 8193 celle x0-24 y0-38 z0-29, passi 225-237
Senza effetto (non hanno mai cambiato una cella):
#5 line 9 13 0 → 9 13 12 I
#6 line 15 13 0 → 15 13 12 I
#7 line 9 27 0 → 9 27 12 I
#8 line 15 27 0 → 15 27 12 I
#9 ellipsoid at 9 13 5 size 3 3 3 D su 1
#10 ellipsoid at 15 13 5 size 3 3 3 D su 1
#11 ellipsoid at 9 27 5 size 3 3 3 D su 1
#12 ellipsoid at 15 27 5 size 3 3 3 D su 1
#18 ellipsoid at 9 32 7 size 3 3 3 D su 2
#19 line 9 36 2 → 9 27 12 I
#20 line 15 34 1 → 15 27 12 I
#21 line 9 3 1 → 9 13 12 I
… e altri 22
```
