# Traliccio dell'alta tensione (`traliccio-alta-tensione`)

Il traliccio d'acciaio che porta la corrente attraverso le campagne di Neapolis.

- Collezione: `flora-geologia` · ambientazione: `moderno` · classe: `monumento` (scatola 20 × 20 × 60)
- Scelte procedurali: la sagoma a caso (a delta, a botte con tre mensole, a Y, a T doppia), gli isolatori che pendono dalle punte con lunghezze a caso, un nido d'uccelli e cartelli in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.389 | ≥ 0.15 |
| distanza minima fra due semi | 0.001 | — |
| tempo del seme più lento | 100 ms | < 1500 ms |
| voxel per seme (1-5) | 2133, 1869, 2133, 1535, 1869 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`traliccio-alta-tensione.png`](traliccio-alta-tensione.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×20×60, 86 nodi, 99 passi, finito in 98 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), I=acciaio, W=nido, R=cartello, S=plinti, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: I 2058, S 72, R 2, W 1.
#2-3 box×2: 8 celle x0-6 y0-1 z0, passi 1-2
 #4 one z → . passi=8: ×8, 8 celle x0-6 y0-1 z0, passi 3-10, z→. 8
#5-8 box×4: 72 celle x0-19 y0-19 z0-1, passi 11-14
 #9 box at 10 10 0 size 20 20 60 u su .: ×1, 21610 celle x1-19 y1-19 z0-59, passi 15, .→u 21610
 #10 one u → 1 (+3) passi=1: ×1, 1 celle x8 y5 z42, passi 16, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #11 all 1u → *1 (+3): ×65, 21609 celle x1-19 y1-19 z0-59, passi 17-81, u→2 21609
   r1 1u → *1 ×0; r2 2u → *2 ×21609; r3 3u → *3 ×0; r4 4u → *4 ×0
#29-31 line×3: 522 celle x1-18 y1-18 z2-55, passi 82-84
#32-33 line×1, box×1: 463 celle x2-18 y2-18 z2-55, passi 85-86
#34-35 box×2: 380 celle x3-17 y3-17 z14-22, passi 87-88
#36-40 box×4, line×1: 415 celle x1-19 y5-15 z30-52, passi 89-93
#41-42 line×2: 280 celle x1-19 y9-11 z43-53, passi 94-95
 #81 prl u → . (+4): ×1, 19550 celle x1-19 y1-19 z0-59, passi 96, 2→. 19550
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×19550; r4 3 → . ×0; r5 4 → . ×0
 #84 one . I → W * passi=1: ×1, 1 celle x2 y14 z7, passi 97, .→W 1
 #86 one .I → *R passi=2: ×2, 2 celle x2-4 y9-12 z22-35, passi 98-99, I→R 2
Senza effetto (non hanno mai cambiato una cella):
#12 line 1 1 0 → 7 7 38 I
#13 line 18 1 0 → 13 7 38 I
#14 line 1 18 0 → 7 13 38 I
#15 line 18 18 0 → 13 13 38 I
#16 box at 10 10 6 size 17 17 1 I su 1
#17 box at 10 10 14 size 14 14 1 I su 1
#18 box at 10 10 22 size 11 11 1 I su 1
#19 box at 10 10 30 size 9 9 1 I su 1
#20 box at 10 10 38 size 6 6 1 I su 1
#21 line 7 10 38 → 10 10 52 I
#22 line 13 10 38 → 10 10 52 I
#23 line 0 10 40 → 19 10 40 I
… e altri 46
```
