# Xenofauna cristallina (`xenofauna-cristallina`)

Una bestia delle lune di Sidera, a sei zampe, con cristalli vivi che le crescono dal dorso e le danno luce.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (corpo allungato, gobbo o a segmenti; sei zampe dritte, aperte o arcuate; testa a cuneo, a ventaglio o con mandibole) e cristalli che nascono in posti a caso sul dorso, crescono storti e si ispessiscono a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.368 | ≥ 0.15 |
| distanza minima fra due semi | 0.106 | — |
| tempo del seme più lento | 128 ms | < 1500 ms |
| voxel per seme (1-5) | 2610, 2933, 3810, 2742, 2784 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`xenofauna-cristallina.png`](xenofauna-cristallina.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 60 nodi, 190 passi, finito in 118 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), F=carapace viola, D=carapace scuro, G=zampe, X=cristallo, E=occhi, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 1563, G 666, D 237, X 142, E 2.
 #2 box at 12 20 0 size 25 40 14 u su .: ×1, 13650 celle x0-24 y1-39 z0-13, passi 1, .→u 13650
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x3 y14 z12, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×58, 13649 celle x0-24 y1-39 z0-13, passi 3-60, u→2 13649
   r1 1u → *1 ×0; r2 2u → *2 ×13649; r3 3u → *3 ×0
#11-16 line×6: 666 celle x0-24 y9-32 z0-12, passi 61-66
 #29 prl u → . (+3): ×1, 12984 celle x0-24 y1-39 z0-13, passi 67, 2→. 12984
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×12984; r4 3 → . ×0
 #30 box at 12 20 5 size 22 36 20 u su .: ×1, 14282 celle x2-22 y3-37 z5-24, passi 68, .→u 14282
 #31 one u → 1 (+2) passi=1: ×1, 1 celle x17 y6 z9, passi 69, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #32 all 1u → *1 (+2): ×61, 14281 celle x2-22 y3-37 z5-24, passi 70-130, u→1 14281
   r1 1u → *1 ×14281; r2 2u → *2 ×0; r3 3u → *3 ×0
 #33 ellipsoid at 12 20 7 size 12 28 10 F su 1: ×1, 1636 celle x7-17 y7-33 z7-16, passi 131, 1→F 1636
 #38 prl u → . (+3): ×1, 12646 celle x2-22 y3-37 z5-24, passi 132, 1→. 12646
   r1 u → . ×0; r2 1 → . ×12646; r3 2 → . ×0; r4 3 → . ×0
#39-60 box×3, one×2, all×2, ellipsoid×1, line×2, prl×3: 13413 celle x0-24 y7-39 z2-23, passi 133-190
Senza effetto (non hanno mai cambiato una cella):
#5 line 8 13 11 → 6 13 0 G
#6 line 16 13 11 → 18 13 0 G
#7 line 8 20 11 → 6 20 0 G
#8 line 16 20 11 → 18 20 0 G
#9 line 8 27 11 → 6 27 0 G
#10 line 16 27 11 → 18 27 0 G
#17 line 8 13 11 → 1 13 9 G
#18 line 16 13 11 → 23 13 9 G
#19 line 8 20 11 → 1 20 9 G
#20 line 16 20 11 → 23 20 9 G
#21 line 8 27 11 → 1 27 9 G
#22 line 16 27 11 → 23 27 9 G
… e altri 19
```
