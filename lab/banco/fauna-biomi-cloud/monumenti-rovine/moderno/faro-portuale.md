# Faro portuale (`faro-portuale`)

Il faro in testa al molo di Neapolis: la torre, la lanterna, gli scogli attorno.

- Collezione: `monumenti-rovine` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (la torre: a strisce bianche e rosse, ottagonale bianca, a traliccio, quadra di pietra; la lanterna: tonda, a cupola, a gabbia; la base: molo di cemento, rocce, piattaforma con la casetta) e scogli che crescono accanto alla base, alghe a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.507 | ≥ 0.15 |
| distanza minima fra due semi | 0.044 | — |
| tempo del seme più lento | 235 ms | < 1500 ms |
| voxel per seme (1-5) | 7374, 6360, 7356, 7518, 7109 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`faro-portuale.png`](faro-portuale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 57 nodi, 194 passi, finito in 254 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), R=rosso, K=pietra, I=ferro, L=lanterna, N=scogli, A=alghe, g=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 5364, I 1466, R 270, N 142, L 125, A 7.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 44 44 8 u su .: ×1, 14792 celle x4-46 y4-46 z0-7, passi 11, .→u 14792
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x22 y13 z2, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×62, 14791 celle x4-46 y4-46 z0-7, passi 13-74, u→2 14791
   r1 1u → *1 ×0; r2 2u → *2 ×14791; r3 3u → *3 ×0
 #10 ellipsoid at 25 25 0 size 34 34 12 K su 2: ×1, 5364 celle x9-41 y9-41 z0-7, passi 75, 2→K 5364
#14-18 prl×3, box×1, one×1: 13563 celle x2-48 y2-48 z0-7, passi 76-93
 #19 box at 25 25 4 size 22 22 36 u su .: ×1, 14112 celle x15-35 y15-35 z8-39, passi 94, .→u 14112
#20-21 one×1, all×1: 14112 celle x15-35 y15-35 z8-39, passi 95-141
#29-36 line×4, cylinder×1, box×3: 1490 celle x17-33 y17-33 z8-39, passi 142-149
 #39 prl u → . (+4): ×1, 12622 celle x15-35 y15-35 z8-39, passi 150, 3→. 12622
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×12622; r5 4 → . ×0
#40-57 cylinder×1, box×3, one×1, all×1, line×5, prl×3: 7481 celle x16-32 y15-34 z0-49, passi 151-194
Senza effetto (non hanno mai cambiato una cella):
#8 box at 25 25 0 size 24 40 5 S su 1
#9 box at 25 25 5 size 16 16 1 S su 1
#11 box at 25 25 0 size 30 30 4 S su 3
#12 box at 34 34 4 size 8 8 6 W su 3
#13 box at 34 34 10 size 9 9 1 R su 3
#22 cylinder at 25 25 12 size 11 11 5 R su 1
#23 cylinder at 25 25 22 size 10 10 5 R su 1
#24 cylinder at 25 25 32 size 9 9 4 R su 1
#25 cone at 25 25 4 size 12 12 70 W su 1
#26 cylinder at 25 25 4 size 11 11 34 W su 2
#27 box at 25 25 4 size 10 10 34 W su 2
#28 box at 25 31 20 size 2 1 3 I su 2
… e altri 6
```
