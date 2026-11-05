# Rover da esplorazione (`rover-esplorazione`)

Il rover a sei ruote che mappa i deserti di Sidera, con l'albero delle telecamere e il braccio dei campioni.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (albero delle telecamere alto, basso o doppio; braccio a riposo, teso a terra o alzato; energia da pannelli piatti, pannelli ad ali o generatore con alette) e polvere che si posa a caso sulle facce in alto.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.237 | ≥ 0.15 |
| distanza minima fra due semi | 0.067 | — |
| tempo del seme più lento | 93 ms | < 1500 ms |
| voxel per seme (1-5) | 3278, 3266, 3401, 3380, 3323 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`rover-esplorazione.png`](rover-esplorazione.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 59 nodi, 164 passi, finito in 138 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=telaio, K=ruote, G=bracci, C=rame, D=polvere, u=marcatore (marcatore).
Alla fine: W 1755, K 677, G 420, C 335, D 91.
#2-15 ellipsoid×6, line×6, box×2: 10361 celle x0-24 y5-38 z0-29, passi 1-14
 #16 one u → 1 (+2) passi=1: ×1, 1 celle x16 y36 z27, passi 15, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #17 all 1u → *1 (+2): ×45, 7649 celle x0-24 y22-38 z12-29, passi 16-60, u→2 7649
   r1 1u → *1 ×0; r2 2u → *2 ×7649; r3 3u → *3 ×0
#21-22 line×1, box×1: 159 celle x5-11 y30-34 z12-20, passi 61-62
 #30 prl u → . (+3): ×1, 7491 celle x0-24 y22-38 z12-29, passi 63, 2→. 7491
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×7491; r4 3 → . ×0
#31-33 box×1, one×1, all×1: 7278 celle x0-24 y33-39 z0-21, passi 64-99
#37-43 line×2, box×1, prl×1: 3639 celle x0-24 y33-39 z0-21, passi 100-103
 #44 box at 12 18 11 size 25 26 19 u su .: ×1, 11524 celle x0-24 y6-30 z11-29, passi 104, .→u 11524
 #45 one u → 1 (+2) passi=1: ×1, 1 celle x2 y12 z25, passi 105, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #46 all 1u → *1 (+2): ×54, 11523 celle x0-24 y6-30 z11-29, passi 106-159, u→3 11523
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×11523
#54-56 cylinder×1, box×2: 413 celle x6-18 y6-16 z12-20, passi 160-162
 #57 prl u → . (+3): ×1, 11111 celle x0-24 y6-30 z11-29, passi 163, 3→. 11111
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×11111
 #58 prl . W → * D passi=1: ×1, 91 celle x5-18 y7-34 z11-20, passi 164, W→D 91
Senza effetto (non hanno mai cambiato una cella):
#18 line 12 30 12 → 12 30 26 G
#19 box at 12 31 26 size 6 4 3 W su 1
#20 box at 12 33 27 size 4 1 1 E su 1
#23 box at 8 34 19 size 5 1 1 E su 2
#24 line 8 30 12 → 8 30 22 G
#25 line 16 30 12 → 16 30 22 G
#26 box at 8 31 22 size 4 4 3 W su 3
#27 box at 16 31 22 size 4 4 3 W su 3
#28 box at 8 33 23 size 2 1 1 E su 3
#29 box at 16 33 23 size 2 1 1 E su 3
#34 line 15 33 10 → 20 37 10 G
#35 line 20 37 10 → 6 38 10 G
… e altri 12
```
