# Gru di miniera (`gru-miniera`)

La gru a vapore sopra un pozzo di Orichalcum: torre a traliccio, braccio, carrucola e secchia che scende.

- Collezione: `flora-geologia` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la base a caso (binari, zoccolo di pietra, cavalletto di legno), il braccio in una di quattro direzioni con il suo contrappeso, la fune che scende dalla punta per una lunghezza a caso e finisce in una secchia, cumuli di minerale che crescono da semi a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.524 | ≥ 0.15 |
| distanza minima fra due semi | 0.224 | — |
| tempo del seme più lento | 283 ms | < 1500 ms |
| voxel per seme (1-5) | 2468, 1960, 2075, 2585, 1912 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`gru-miniera.png`](gru-miniera.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 59 nodi, 186 passi, finito in 306 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), O=traliccio d'ottone, I=ferro, K=contrappeso, S=pietra, M=minerale, g=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 1101, O 1031, M 177, K 103, I 56.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 30 30 6 u su .: ×1, 5046 celle x11-39 y11-39 z0-5, passi 11, .→u 5046
#6-7 one×1, all×1: 5046 celle x11-39 y11-39 z0-5, passi 12-56
 #12 box at 25 25 0 size 16 16 5 S su 2: ×1, 1125 celle x18-32 y18-32 z0-4, passi 57, 2→S 1125
 #18 prl u → . (+3): ×1, 3921 celle x11-39 y11-39 z0-5, passi 58, 2→. 3921
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×3921; r4 3 → . ×0
#19-28 line×5, box×5: 41328 celle x1-49 y1-49 z3-48, passi 59-68
 #29 one u → 1 (+3) passi=1: ×1, 1 celle x13 y1 z48, passi 69, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #30 all 1u → *1 (+3): ×100, 40639 celle x1-49 y1-49 z32-48, passi 70-169, u→3 40639
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×40639; r4 4u → *4 ×0
#41-44 line×3, box×1: 502 celle x23-27 y12-49 z34-46, passi 170-173
 #51 prl u → . (+4): ×1, 40138 celle x1-49 y1-49 z32-48, passi 174, 3→. 40138
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×40138; r5 4 → . ×0
#56-59 box×1, one×1, prl×2: 4077 celle x2-48 y2-48 z0-4, passi 175-186
Senza effetto (non hanno mai cambiato una cella):
#8 box at 25 25 0 size 26 4 1 I su 1
#9 box at 25 19 0 size 26 2 1 W su 1
#10 box at 25 31 0 size 26 2 1 W su 1
#11 box at 25 25 1 size 12 12 4 I su 1
#13 line 17 17 0 → 23 23 5 W
#14 line 33 17 0 → 27 23 5 W
#15 line 17 33 0 → 23 27 5 W
#16 line 33 33 0 → 27 27 5 W
#17 box at 25 25 4 size 8 8 2 W su 3
#31 line 25 25 38 → 47 25 40 O
#32 line 25 25 46 → 47 25 40 I
#33 line 25 25 38 → 15 25 38 O
… e altri 17
```
