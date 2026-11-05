# Cupola geodetica (`cupola-geodetica`)

Una serra-habitat di Sidera: la cupola a pannelli, l'ingresso a tunnel, le antenne e i pannelli solari attorno.

- Collezione: `monumenti-rovine` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (il tunnel d'ingresso su uno dei quattro lati; la cupola: emisfera, a cipolla, doppia, schiacciata con la torre; gli impianti in un angolo: pannelli solari, serbatoi, antenna a traliccio) e pannelli di vetro che si alternano a caso a quelli pieni, antenne che crescono a rami.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.477 | ≥ 0.15 |
| distanza minima fra due semi | 0.044 | — |
| tempo del seme più lento | 726 ms | < 1500 ms |
| voxel per seme (1-5) | 13629, 13207, 13180, 13352, 10402 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cupola-geodetica.png`](cupola-geodetica.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 58 nodi, 258 passi, finito in 721 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), W=pannelli pieni, V=pannelli di vetro, T=telaio, E=luci, x=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: W 6658, T 3699, V 3220, E 52.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 box×2: 26411 celle x1-49 y1-49 z0-10, passi 11-12
#7-8 one×1, all×1: 24010 celle x1-49 y1-49 z1-10, passi 13-94
#11-12 box×2: 1173 celle x1-17 y21-29 z1-9, passi 95-96
 #17 prl u → . (+4): ×1, 22837 celle x1-49 y1-49 z1-10, passi 97, 2→. 22837
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×22837; r4 3 → . ×0; r5 4 → . ×0
 #18 box at 25 25 1 size 44 44 48 u su .: ×1, 87822 celle x4-46 y4-46 z1-48, passi 98, .→u 87822
 #19 one u → 1 (+3) passi=1: ×1, 1 celle x15 y37 z19, passi 99, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #20 all 1u → *1 (+3): ×93, 87821 celle x4-46 y4-46 z1-48, passi 100-192, u→1 87821
   r1 1u → *1 ×87821; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#21-22 ellipsoid×2: 27322 celle x5-45 y5-45 z1-31, passi 193-194
 #35 prl u → . (+4): ×1, 60500 celle x4-46 y4-46 z1-48, passi 195, 1→. 60500
   r1 u → . ×0; r2 1 → . ×60500; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×0
 #36 prl x → .: ×1, 17874 celle x1-42 y8-42 z1-27, passi 196, x→. 17874
#37-58 prl×5, box×2, one×2, all×1, cylinder×2, ellipsoid×1: 14898 celle x1-49 y1-45 z0-31, passi 197-258
Senza effetto (non hanno mai cambiato una cella):
#9 box at 43 25 0 size 22 6 7 x su 1
#10 box at 45 25 0 size 18 10 10 W su 1
#13 box at 25 43 0 size 6 22 7 x su 3
#14 box at 25 45 0 size 10 18 10 W su 3
#15 box at 25 7 0 size 6 22 7 x su 4
#16 box at 25 5 0 size 10 18 10 W su 4
#23 ellipsoid at 25 25 0 size 32 32 34 x su 2
#24 ellipsoid at 25 25 -2 size 38 38 40 W su 2
#25 cone at 25 25 32 size 16 16 16 W su 2
#26 ellipsoid at 16 25 -18 size 22 26 40 x su 3
#27 ellipsoid at 34 25 -18 size 22 26 40 x su 3
#28 ellipsoid at 16 25 -20 size 26 30 46 W su 3
… e altri 15
```
