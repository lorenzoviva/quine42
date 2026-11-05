# Xenofauna cristallina (`xenofauna-cristallina`)

Una bestia delle lune di Sidera, a sei zampe, con cristalli vivi che le crescono dal dorso e le danno luce.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (corpo allungato, gobbo o a segmenti; sei zampe dritte, aperte o arcuate; testa a cuneo, a ventaglio o con mandibole) e cristalli che nascono in posti a caso sul dorso, crescono storti e si ispessiscono a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.383 | ≥ 0.15 |
| distanza minima fra due semi | 0.162 | — |
| tempo del seme più lento | 167 ms | < 1500 ms |
| voxel per seme (1-5) | 2784, 2742, 2655, 2761, 2958 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`xenofauna-cristallina.png`](xenofauna-cristallina.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 63 nodi, 196 passi, finito in 137 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), F=carapace viola, D=carapace scuro, G=zampe, X=cristallo, E=occhi, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 1575, G 666, X 298, D 243, E 2.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 12 20 0 size 25 40 14 u su .: ×1, 13650 celle x0-24 y1-39 z0-13, passi 11, .→u 13650
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x11 y35 z3, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×57, 13649 celle x0-24 y1-39 z0-13, passi 13-69, u→2 13649
   r1 1u → *1 ×0; r2 2u → *2 ×13649; r3 3u → *3 ×0
#14-19 line×6: 666 celle x0-24 y9-32 z0-12, passi 70-75
 #32 prl u → . (+3): ×1, 12984 celle x0-24 y1-39 z0-13, passi 76, 2→. 12984
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×12984; r4 3 → . ×0
 #33 box at 12 20 5 size 22 36 20 u su .: ×1, 14282 celle x2-22 y3-37 z5-24, passi 77, .→u 14282
 #34 one u → 1 (+2) passi=1: ×1, 1 celle x11 y35 z19, passi 78, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #35 all 1u → *1 (+2): ×57, 14281 celle x2-22 y3-37 z5-24, passi 79-135, u→1 14281
   r1 1u → *1 ×14281; r2 2u → *2 ×0; r3 3u → *3 ×0
 #36 ellipsoid at 12 20 7 size 12 28 10 F su 1: ×1, 1636 celle x7-17 y7-33 z7-16, passi 136, 1→F 1636
 #41 prl u → . (+3): ×1, 12646 celle x2-22 y3-37 z5-24, passi 137, 1→. 12646
   r1 u → . ×0; r2 1 → . ×12646; r3 2 → . ×0; r4 3 → . ×0
#42-63 box×3, one×2, all×2, ellipsoid×2, prl×3: 13401 celle x0-24 y7-39 z2-24, passi 138-196
Senza effetto (non hanno mai cambiato una cella):
#8 line 8 13 11 → 6 13 0 G
#9 line 16 13 11 → 18 13 0 G
#10 line 8 20 11 → 6 20 0 G
#11 line 16 20 11 → 18 20 0 G
#12 line 8 27 11 → 6 27 0 G
#13 line 16 27 11 → 18 27 0 G
#20 line 8 13 11 → 1 13 9 G
#21 line 16 13 11 → 23 13 9 G
#22 line 8 20 11 → 1 20 9 G
#23 line 16 20 11 → 23 20 9 G
#24 line 8 27 11 → 1 27 9 G
#25 line 16 27 11 → 23 27 9 G
… e altri 20
```
