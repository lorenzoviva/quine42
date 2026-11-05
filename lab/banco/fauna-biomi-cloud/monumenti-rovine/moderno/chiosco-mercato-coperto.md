# Mercato coperto (`chiosco-mercato-coperto`)

Un piccolo mercato coperto di Neapolis: un tetto d'acciaio sopra i banchi, la frutta, le cassette impilate.

- Collezione: `monumenti-rovine` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (il tetto: a capanna, a volta, a ombrello, a dente di sega; i banchi: due file, a U, uno lungo; le tende: a strisce rosse, verdi, nessuna) e la frutta che si posa a caso sui banchi in tre colori, cassette impilate a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.645 | ≥ 0.15 |
| distanza minima fra due semi | 0.088 | — |
| tempo del seme più lento | 506 ms | < 1500 ms |
| voxel per seme (1-5) | 11465, 15005, 11055, 20104, 14146 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`chiosco-mercato-coperto.png`](chiosco-mercato-coperto.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 88 nodi, 322 passi, finito in 553 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), S=pavimento, I=acciaio, R=lamiera del tetto, W=banchi, U=tende verdi, Y=limoni, E=pomodori, G=mele verdi, C=cassette, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore), x=x.
Alla fine: R 5316, S 1995, I 1726, W 1450, U 630, C 308, Y 14, G 14, E 12.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-12 box×2, line×6: 68070 celle x1-49 y1-49 z0-49, passi 11-18
 #13 one u → 1 (+3) passi=1: ×1, 1 celle x8 y1 z42, passi 19, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #14 all 1u → *1 (+3): ×108, 64688 celle x1-49 y1-49 z23-49, passi 20-127, u→2 64688
   r1 1u → *1 ×0; r2 2u → *2 ×64688; r3 3u → *3 ×0; r4 4u → *4 ×0
#23-25 ellipsoid×2, box×1: 40937 celle x1-49 y1-49 z23-49, passi 128-130
 #53 prl u → . (+4): ×1, 23752 celle x1-49 y1-49 z23-49, passi 131, 2→. 23752
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×23752; r4 3 → . ×0; r5 4 → . ×0
 #54 prl x → .: ×1, 35321 celle x2-48 y2-48 z23-49, passi 132, x→. 35321
 #55 box at 25 25 1 size 40 40 6 u su .: ×1, 8958 celle x6-44 y6-44 z1-6, passi 133, .→u 8958
#56-57 one×1, all×1: 8958 celle x6-44 y6-44 z1-6, passi 134-182
#58-64 box×2, prl×1: 8958 celle x6-44 y6-44 z1-6, passi 183-185
#65-67 box×3: 13930 celle x1-49 y1-49 z18-23, passi 186-188
#68-69 one×1, all×1: 13860 celle x1-49 y1-49 z18-23, passi 189-267
#80-81 box×2: 630 celle x8-42 y3-47 z19-21, passi 268-269
#83-88 prl×2, one×2, all×1: 13618 celle x1-49 y1-49 z1-23, passi 270-322
Senza effetto (non hanno mai cambiato una cella):
#15 box at 25 25 24 size 48 46 2 R su 1
#16 box at 25 25 26 size 48 40 2 R su 1
#17 box at 25 25 28 size 48 34 2 R su 1
#18 box at 25 25 30 size 48 28 2 R su 1
#19 box at 25 25 32 size 48 22 2 R su 1
#20 box at 25 25 34 size 48 16 2 R su 1
#21 box at 25 25 36 size 48 10 2 R su 1
#22 box at 25 25 38 size 48 4 2 R su 1
#26 cone at 25 25 24 size 50 50 20 R su 3
#27 line 25 25 1 → 25 25 24 I
#28 box at 25 25 23 size 48 46 1 I su 4
#29 box at 25 4 24 size 48 3 2 R su 4
… e altri 39
```
