# Furgone delle consegne (`furgone-consegne`)

Il furgone che fa il giro dei quartieri di Neapolis, con i pacchi che non stanno mai dentro.

- Collezione: `creature-veicoli` · ambientazione: `moderno` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (carrozzeria: tetto alto, media, cassonato con le casse; porte: chiuse, laterale aperta, posteriori aperte; carico a terra: solo il paraurti, pila di pacchi, carrello; sul tetto della cabina: lampeggiante, scala, antenna) e pacchi che si impilano a caso sul tetto o sul cassone.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.429 | ≥ 0.15 |
| distanza minima fra due semi | 0.004 | — |
| tempo del seme più lento | 157 ms | < 1500 ms |
| voxel per seme (1-5) | 12159, 5515, 15580, 12378, 5501 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`furgone-consegne.png`](furgone-consegne.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 68 nodi, 248 passi, finito in 150 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), W=carrozzeria bianca, R=fascia rossa, K=gomme, V=vetri, C=cartone, L=fari, I=ferro, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: W 9540, R 1134, K 792, I 456, C 159, V 75, L 3.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-9 ellipsoid×4, box×1: 22293 celle x2-22 y1-39 z0-29, passi 11-15
 #10 one u → 1 (+2) passi=1: ×1, 1 celle x5 y2 z11, passi 16, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #11 all 1u → *1 (+2): ×72, 21500 celle x2-22 y1-39 z3-29, passi 17-88, u→2 21500
   r1 1u → *1 ×0; r2 2u → *2 ×21500; r3 3u → *3 ×0
#18-24 box×7: 12243 celle x2-22 y5-39 z4-20, passi 89-95
 #33 prl u → . (+3): ×1, 10392 celle x2-22 y1-39 z3-29, passi 96, 2→. 10392
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×10392; r4 3 → . ×0
 #34 box at 12 20 4 size 25 40 22 u su .: ×1, 9837 celle x0-24 y1-39 z4-25, passi 97, .→u 9837
#35-36 one×1, all×1: 9837 celle x0-24 y1-39 z4-25, passi 98-176
 #44 prl u → . (+3): ×1, 9837 celle x0-24 y1-39 z4-25, passi 177, 1→. 9837
   r1 u → . ×0; r2 1 → . ×9837; r3 2 → . ×0; r4 3 → . ×0
#45-56 box×3, one×1, all×1, line×2, prl×1: 8250 celle x0-24 y0-4 z0-21, passi 178-213
#57-67 box×3, one×2, all×1, line×1, prl×2: 6439 celle x2-22 y18-38 z17-28, passi 214-248
Senza effetto (non hanno mai cambiato una cella):
#12 box at 12 39 12 size 15 1 5 V su 1
#13 box at 12 39 6 size 3 1 1 L su 1
#14 box at 12 18 4 size 21 28 22 W su 1
#15 box at 12 35 4 size 21 10 14 W su 1
#16 box at 12 18 15 size 21 28 3 R su W
#17 box at 12 18 26 size 1 1 1 P su 1
#25 box at 12 39 12 size 15 1 5 V su 3
#26 box at 12 39 6 size 3 1 1 L su 3
#27 box at 12 35 4 size 21 10 15 W su 3
#28 box at 12 16 4 size 21 30 3 I su 3
#29 box at 2 16 7 size 1 30 3 I su 3
#30 box at 22 16 7 size 1 30 3 I su 3
… e altri 16
```
