# Segugio d'ottone (`segugio-ottone`)

Un cane da caccia meccanico di Orichalcum: corpo a caldaia, giunti di ferro, comignoli che fumano sul dorso.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: quattro scelte a caso (andatura ferma, in punta o di corsa; corpo a caldaia, snello o corazzato; testa avanti, a fiutare o all'ululato; coda ad antenna, tesa o a frusta) e comignoli che spuntano a caso sul dorso e salgono storti.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.496 | ≥ 0.15 |
| distanza minima fra due semi | 0.277 | — |
| tempo del seme più lento | 141 ms | < 1500 ms |
| voxel per seme (1-5) | 3391, 2171, 2271, 2302, 2192 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`segugio-ottone.png`](segugio-ottone.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 70 nodi, 243 passi, finito in 181 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), O=ottone, D=ottone scuro, I=giunti di ferro, T=comignoli, L=occhi di brace, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: O 2792, I 499, D 66, T 21, L 13.
#2-5 box×3, one×1: 10894 celle x0-22 y0-38 z0-13, passi 1-11
#6-7 one×1, all×1: 10878 celle x2-22 y2-38 z0-13, passi 12-68
#16-27 line×5, prl×1: 10878 celle x2-22 y2-38 z0-13, passi 69-74
 #28 box at 12 20 6 size 22 34 18 u su .: ×1, 12192 celle x2-22 y4-36 z6-23, passi 75, .→u 12192
 #29 one u → 1 (+2) passi=1: ×1, 1 celle x9 y18 z22, passi 76, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #30 all 1u → *1 (+2): ×47, 12191 celle x2-22 y4-36 z6-23, passi 77-123, u→3 12191
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×12191
#33-34 ellipsoid×1, box×1: 2580 celle x6-18 y7-33 z9-21, passi 124-125
 #35 prl u → . (+3): ×1, 9612 celle x2-22 y4-36 z6-23, passi 126, 3→. 9612
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×9612
 #36 box at 12 33 0 size 25 14 30 u su .: ×1, 9136 celle x0-24 y27-39 z0-29, passi 127, .→u 9136
#37-38 one×1, all×1: 9136 celle x0-24 y27-39 z0-29, passi 128-183
#39-58 line×1, box×4, prl×1: 9136 celle x0-24 y27-39 z0-29, passi 184-189
 #59 box at 12 5 0 size 25 12 30 u su .: ×1, 8070 celle x0-24 y0-10 z0-29, passi 190, .→u 8070
#60-61 one×1, all×1: 8070 celle x0-24 y0-10 z0-29, passi 191-230
#62-70 line×1, ellipsoid×1, prl×2, one×1, all×1: 8112 celle x0-24 y0-32 z0-29, passi 231-243
Senza effetto (non hanno mai cambiato una cella):
#8 line 9 13 0 → 9 13 12 I
#9 line 15 13 0 → 15 13 12 I
#10 line 9 27 0 → 9 27 12 I
#11 line 15 27 0 → 15 27 12 I
#12 ellipsoid at 9 13 5 size 3 3 3 D su 1
#13 ellipsoid at 15 13 5 size 3 3 3 D su 1
#14 ellipsoid at 9 27 5 size 3 3 3 D su 1
#15 ellipsoid at 15 27 5 size 3 3 3 D su 1
#21 ellipsoid at 9 32 7 size 3 3 3 D su 2
#22 line 9 36 2 → 9 27 12 I
#23 line 15 34 1 → 15 27 12 I
#24 line 9 3 1 → 9 13 12 I
… e altri 21
```
