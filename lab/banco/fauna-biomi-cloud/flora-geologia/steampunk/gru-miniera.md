# Gru di miniera (`gru-miniera`)

La gru a vapore sopra un pozzo di Orichalcum: torre a traliccio, braccio, carrucola e secchia che scende.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la base a caso (binari, zoccolo di pietra, cavalletto di legno), il braccio in una di quattro direzioni con il suo contrappeso, la fune che scende dalla punta per una lunghezza a caso e finisce in una secchia, cumuli di minerale che crescono da semi a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.501 | ≥ 0.15 |
| distanza minima fra due semi | 0.202 | — |
| tempo del seme più lento | 318 ms | < 1500 ms |
| voxel per seme (1-5) | 2565, 2002, 1983, 1895, 1888 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`gru-miniera.png`](gru-miniera.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 56 nodi, 153 passi, finito in 297 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), O=traliccio d'ottone, I=ferro, K=contrappeso, S=pietra, M=minerale, g=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: S 1101, O 1031, M 274, K 103, I 56.
 #2 box at 25 25 0 size 30 30 6 u su .: ×1, 5046 celle x11-39 y11-39 z0-5, passi 1, .→u 5046
 #3 one u → 1 (+2) passi=1: ×1, 1 celle x20 y19 z5, passi 2, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #4 all 1u → *1 (+2): ×44, 5045 celle x11-39 y11-39 z0-5, passi 3-46, u→2 5045
   r1 1u → *1 ×0; r2 2u → *2 ×5045; r3 3u → *3 ×0
 #9 box at 25 25 0 size 16 16 5 S su 2: ×1, 1125 celle x18-32 y18-32 z0-4, passi 47, 2→S 1125
 #15 prl u → . (+3): ×1, 3921 celle x11-39 y11-39 z0-5, passi 48, 2→. 3921
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×3921; r4 3 → . ×0
#16-25 line×5, box×5: 41328 celle x1-49 y1-49 z3-48, passi 49-58
 #26 one u → 1 (+3) passi=1: ×1, 1 celle x7 y26 z38, passi 59, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #27 all 1u → *1 (+3): ×77, 40639 celle x1-49 y1-49 z32-48, passi 60-136, u→3 40639
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×40639; r4 4u → *4 ×0
#38-41 line×3, box×1: 502 celle x23-27 y12-49 z34-46, passi 137-140
 #48 prl u → . (+4): ×1, 40138 celle x1-49 y1-49 z32-48, passi 141, 3→. 40138
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×40138; r5 4 → . ×0
 #53 box at 25 25 0 size 48 48 1 g su .: ×1, 1984 celle x2-48 y2-48 z0, passi 142, .→g 1984
#54-56 one×1, prl×2: 2136 celle x2-48 y2-48 z0-4, passi 143-153
Senza effetto (non hanno mai cambiato una cella):
#5 box at 25 25 0 size 26 4 1 I su 1
#6 box at 25 19 0 size 26 2 1 W su 1
#7 box at 25 31 0 size 26 2 1 W su 1
#8 box at 25 25 1 size 12 12 4 I su 1
#10 line 17 17 0 → 23 23 5 W
#11 line 33 17 0 → 27 23 5 W
#12 line 17 33 0 → 23 27 5 W
#13 line 33 33 0 → 27 27 5 W
#14 box at 25 25 4 size 8 8 2 W su 3
#28 line 25 25 38 → 47 25 40 O
#29 line 25 25 46 → 47 25 40 I
#30 line 25 25 38 → 15 25 38 O
… e altri 17
```
