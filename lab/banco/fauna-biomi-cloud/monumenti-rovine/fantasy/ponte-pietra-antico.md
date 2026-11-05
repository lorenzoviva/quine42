# Ponte di pietra antico (`ponte-pietra-antico`)

Un ponte di pietra che scavalca un torrente di Aurora da prima che qualcuno ricordi: archi, parapetti sbrecciati, edera.

- Collezione: `monumenti-rovine` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: due scelte a caso (il ponte: un arco grande, due archi, tre archi bassi, crollato a metà sul suo cumulo di pietre; le teste: due statue, due lanterne, una torretta) e poi il tempo: pietre del parapetto che mancano a caso, muschio sopra, edera che pende da sotto gli archi.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.354 | ≥ 0.15 |
| distanza minima fra due semi | 0.023 | — |
| tempo del seme più lento | 258 ms | < 1500 ms |
| voxel per seme (1-5) | 12204, 15436, 12192, 12238, 14463 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`ponte-pietra-antico.png`](ponte-pietra-antico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 54 nodi, 185 passi, finito in 296 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), S=pietra, D=pietra scura, Q=parapetto, M=muschio, V=edera, P=marcatore (marcatore), x=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 10942, D 740, Q 272, V 140, M 110.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 18 34 u su .: ×1, 28322 celle x1-49 y17-33 z0-33, passi 11, .→u 28322
 #6 one u → 1 (+3) passi=1: ×1, 1 celle x22 y32 z23, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #7 all 1u → *1 (+3): ×65, 28321 celle x1-49 y17-33 z0-33, passi 13-77, u→2 28321
   r1 1u → *1 ×0; r2 2u → *2 ×28321; r3 3u → *3 ×0; r4 4u → *4 ×0
#13-18 ellipsoid×2, box×4: 17355 celle x1-49 y19-31 z0-33, passi 78-83
#33-34 prl×2: 17275 celle x1-49 y17-33 z0-33, passi 84-85
 #35 box at 25 25 30 size 50 20 20 u su .: ×1, 17787 celle x1-49 y16-34 z30-49, passi 86, .→u 17787
 #36 one u → 1 (+2) passi=1: ×1, 1 celle x2 y25 z39, passi 87, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #37 all 1u → *1 (+2): ×66, 17786 celle x1-49 y16-34 z30-49, passi 88-153, u→3 17786
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×17786
#46-47 box×1, cone×1: 1039 celle x1-9 y19-31 z31-47, passi 154-155
#48-54 prl×5, one×1: 17160 celle x1-49 y16-34 z0-49, passi 156-185
Senza effetto (non hanno mai cambiato una cella):
#8 ellipsoid at 25 25 -26 size 36 14 52 x su 1
#9 box at 25 20 31 size 50 1 3 Q su 1
#10 box at 25 30 31 size 50 1 3 Q su 1
#11 box at 25 25 30 size 50 12 1 D su 1
#12 box at 25 25 0 size 50 12 30 S su 1
#19 ellipsoid at 9 25 -20 size 12 14 40 x su 3
#20 ellipsoid at 25 25 -20 size 12 14 40 x su 3
#21 ellipsoid at 41 25 -20 size 12 14 40 x su 3
#22 box at 25 20 31 size 50 1 3 Q su 3
#23 box at 25 30 31 size 50 1 3 Q su 3
#24 box at 25 25 30 size 50 12 1 D su 3
#25 box at 25 25 0 size 50 12 30 S su 3
… e altri 16
```
