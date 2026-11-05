# Torre di schermatura (`torre-schermatura`)

Una delle torri che reggono lo scudo sopra le colonie di Sidera: un fusto, gli anelli emettitori, gli archi di energia che ne escono.

- Collezione: `monumenti-rovine` · ambientazione: `futuristico` · classe: `monumento` (scatola 20 × 20 × 60)
- Scelte procedurali: tre scelte a caso (gli anelli: tre uguali, a spirale, crescenti verso l'alto, due dischi grandi; la cima: cupola, punta, forcella; la base: a tripode, a gradoni, a cassone) e archi di energia che nascono in punti a caso degli anelli e salgono storti.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.517 | ≥ 0.15 |
| distanza minima fra due semi | 0.301 | — |
| tempo del seme più lento | 99 ms | < 1500 ms |
| voxel per seme (1-5) | 3414, 3805, 2872, 3478, 4468 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`torre-schermatura.png`](torre-schermatura.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×20×60, 52 nodi, 181 passi, finito in 160 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), T=acciaio, D=acciaio scuro, R=anelli, E=archi di energia, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: T 1245, D 1134, R 1012, E 23.
#2-5 box×3, one×1: 2904 celle x0-19 y0-19 z0-7, passi 1-11
#6-7 one×1, all×1: 2888 celle x1-19 y1-19 z0-7, passi 12-46
#12-17 box×3, prl×1: 2888 celle x1-19 y1-19 z0-7, passi 47-50
#18-19 cylinder×1, box×1: 14490 celle x1-19 y1-19 z6-47, passi 51-52
 #20 one u → 1 (+3) passi=1: ×1, 1 celle x16 y14 z42, passi 53, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #21 all 1u → *1 (+3): ×62, 13439 celle x1-19 y1-19 z8-47, passi 54-115, u→1 13439
   r1 1u → *1 ×13439; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#22-24 cylinder×3: 1008 celle x3-17 y3-17 z16-37, passi 116-118
 #38 prl u → . (+4): ×1, 12432 celle x1-19 y1-19 z8-47, passi 119, 1→. 12432
   r1 u → . ×0; r2 1 → . ×12432; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×0
 #39 box at 10 10 47 size 20 20 13 u su .: ×1, 4668 celle x1-19 y1-19 z47-59, passi 120, .→u 4668
 #40 one u → 1 (+2) passi=1: ×1, 1 celle x10 y11 z59, passi 121, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #41 all 1u → *1 (+2): ×31, 4667 celle x1-19 y1-19 z47-59, passi 122-152, u→3 4667
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×4667
#45-48 line×2, box×2: 199 celle x3-17 y9-11 z48-59, passi 153-156
#49-52 prl×2, one×2: 4515 celle x1-19 y1-19 z18-59, passi 157-181
Senza effetto (non hanno mai cambiato una cella):
#8 line 10 10 6 → 1 4 0 D
#9 line 10 10 6 → 19 4 0 D
#10 line 10 10 6 → 10 19 0 D
#11 cylinder at 10 10 0 size 7 7 7 D su 1
#15 box at 10 10 0 size 16 16 7 D su 3
#16 box at 10 10 7 size 12 12 1 T su 3
#25 box at 15 10 12 size 6 6 2 R su 2
#26 box at 13 14 17 size 6 6 2 R su 2
#27 box at 9 15 22 size 6 6 2 R su 2
#28 box at 5 12 27 size 6 6 2 R su 2
#29 box at 6 8 32 size 6 6 2 R su 2
#30 box at 9 5 37 size 6 6 2 R su 2
… e altri 10
```
