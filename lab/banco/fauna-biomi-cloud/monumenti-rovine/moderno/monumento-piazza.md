# Monumento di piazza (`monumento-piazza`)

Il monumento in mezzo a una piazza di Neapolis: un basamento, qualcosa in cima, una vasca, e i piccioni.

- Collezione: `monumenti-rovine` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (il monumento: figura col braccio alzato, obelisco, colonna col capitello, scultura di cubi; la vasca: tonda, quadra, nessuna ma panchine; i lampioni: ai quattro angoli, due, nessuno) e piccioni che si posano in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.338 | ≥ 0.15 |
| distanza minima fra due semi | 0.083 | — |
| tempo del seme più lento | 546 ms | < 1500 ms |
| voxel per seme (1-5) | 8430, 5102, 7917, 8289, 5022 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`monumento-piazza.png`](monumento-piazza.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 63 nodi, 292 passi, finito in 557 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), S=travertino, D=pietra scura, O=bronzo verde, A=acqua, I=ghisa, L=lampade, G=piccioni, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 3407, D 2840, A 1840, I 223, O 110, G 7, L 3.
#2-17 box×6, one×2, all×1, prl×1: 24413 celle x0-48 y0-48 z0-4, passi 1-86
#18-21 box×4: 30832 celle x11-39 y11-39 z1-49, passi 87-90
#22-23 one×1, all×1: 29435 celle x11-39 y11-39 z15-49, passi 91-180
#32-40 cylinder×1, box×1, ellipsoid×1, prl×1: 29435 celle x11-39 y11-39 z15-49, passi 181-184
 #41 box at 25 25 1 size 50 50 28 u su .: ×1, 61712 celle x1-49 y1-49 z1-28, passi 185, .→u 61712
 #42 one u → 1 (+2) passi=1: ×1, 1 celle x6 y24 z3, passi 186, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #43 all 1u → *1 (+2): ×93, 61711 celle x1-49 y1-49 z1-28, passi 187-279, u→3 61711
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×61711
#56-60 line×2, box×3: 226 celle x18-32 y1-3 z1-24, passi 280-284
 #61 prl u → . (+3): ×1, 61486 celle x1-49 y1-49 z1-28, passi 285, 3→. 61486
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×61486
 #62 one . [SDOW] → G * passi=7: ×7, 7 celle x5-36 y2-48 z1-39, passi 286-292, .→G 7
Senza effetto (non hanno mai cambiato una cella):
#9 cylinder at 25 25 1 size 36 36 2 A su 1
#10 cylinder at 25 25 1 size 40 40 3 D su 1
#13 box at 25 7 1 size 18 3 2 W su 3
#14 box at 25 43 1 size 18 3 2 W su 3
#15 box at 7 25 1 size 3 18 2 W su 3
#16 box at 43 25 1 size 3 18 2 W su 3
#24 line 23 25 15 → 23 25 26 O
#25 line 27 25 15 → 27 25 26 O
#26 box at 25 25 26 size 7 5 9 O su 1
#27 ellipsoid at 25 25 35 size 5 5 5 O su 1
#28 line 28 25 33 → 32 25 44 O
#29 line 22 25 33 → 20 27 27 O
… e altri 20
```
