# Furgone delle consegne (`furgone-consegne`)

Il furgone che fa il giro dei quartieri di Neapolis, con i pacchi che non stanno mai dentro.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (carrozzeria: tetto alto, media, cassonato con le casse; porte: chiuse, laterale aperta, posteriori aperte; carico a terra: solo il paraurti, pila di pacchi, carrello) e pacchi che si impilano a caso sul tetto o sul cassone.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.274 | ≥ 0.15 |
| distanza minima fra due semi | 0.024 | — |
| tempo del seme più lento | 148 ms | < 1500 ms |
| voxel per seme (1-5) | 12126, 5620, 5673, 5539, 5754 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`furgone-consegne.png`](furgone-consegne.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 56 nodi, 210 passi, finito in 136 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), W=carrozzeria bianca, R=fascia rossa, K=gomme, V=vetri, C=cartone, L=fari, I=ferro, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: W 9657, R 1134, K 792, I 458, V 75, C 7, L 3.
#2-6 ellipsoid×4, box×1: 22293 celle x2-22 y1-39 z0-29, passi 1-5
 #7 one u → 1 (+2) passi=1: ×1, 1 celle x10 y35 z26, passi 6, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #8 all 1u → *1 (+2): ×69, 21500 celle x2-22 y1-39 z3-29, passi 7-75, u→2 21500
   r1 1u → *1 ×0; r2 2u → *2 ×21500; r3 3u → *3 ×0
#15-21 box×7: 12243 celle x2-22 y5-39 z4-20, passi 76-82
 #30 prl u → . (+3): ×1, 10392 celle x2-22 y1-39 z3-29, passi 83, 2→. 10392
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×10392; r4 3 → . ×0
 #31 box at 12 20 4 size 25 40 22 u su .: ×1, 9837 celle x0-24 y1-39 z4-25, passi 84, .→u 9837
 #32 one u → 1 (+2) passi=1: ×1, 1 celle x16 y34 z23, passi 85, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #33 all 1u → *1 (+2): ×68, 9836 celle x0-24 y1-39 z4-25, passi 86-153, u→2 9836
   r1 1u → *1 ×0; r2 2u → *2 ×9836; r3 3u → *3 ×0
 #35 box at 23 21 5 size 1 10 13 W su 2: ×1, 117 celle x23 y17-25 z5-17, passi 154, 2→W 117
 #41 prl u → . (+3): ×1, 9720 celle x0-24 y1-39 z4-25, passi 155, 2→. 9720
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×9720; r4 3 → . ×0
#42-44 box×1, one×1, all×1: 5500 celle x0-24 y0-4 z0-21, passi 156-201
#45-55 box×1, prl×2, one×1: 2763 celle x0-24 y0-21 z0-21, passi 202-210
Senza effetto (non hanno mai cambiato una cella):
#9 box at 12 39 12 size 15 1 5 V su 1
#10 box at 12 39 6 size 3 1 1 L su 1
#11 box at 12 18 4 size 21 28 22 W su 1
#12 box at 12 35 4 size 21 10 14 W su 1
#13 box at 12 18 15 size 21 28 3 R su W
#14 box at 12 18 26 size 1 1 1 P su 1
#22 box at 12 39 12 size 15 1 5 V su 3
#23 box at 12 39 6 size 3 1 1 L su 3
#24 box at 12 35 4 size 21 10 15 W su 3
#25 box at 12 16 4 size 21 30 3 I su 3
#26 box at 2 16 7 size 1 30 3 I su 3
#27 box at 22 16 7 size 1 30 3 I su 3
… e altri 16
```
