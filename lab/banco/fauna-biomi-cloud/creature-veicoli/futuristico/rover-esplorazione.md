# Rover da esplorazione (`rover-esplorazione`)

Il rover a sei ruote che mappa i deserti di Sidera, con l'albero delle telecamere e il braccio dei campioni.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (albero delle telecamere alto, basso o doppio; braccio a riposo, teso a terra o alzato; energia da pannelli piatti, pannelli ad ali o generatore con alette) e polvere che si posa a caso sulle facce in alto.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.215 | ≥ 0.15 |
| distanza minima fra due semi | 0.064 | — |
| tempo del seme più lento | 90 ms | < 1500 ms |
| voxel per seme (1-5) | 3278, 3266, 3362, 3455, 3323 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`rover-esplorazione.png`](rover-esplorazione.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 62 nodi, 184 passi, finito in 103 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=telaio, K=ruote, G=bracci, C=rame, D=polvere, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: W 1754, K 677, G 420, C 335, D 92.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-18 ellipsoid×6, line×6, box×2: 10361 celle x0-24 y5-38 z0-29, passi 11-24
#19-20 one×1, all×1: 7650 celle x0-24 y22-38 z12-29, passi 25-76
#24-25 line×1, box×1: 159 celle x5-11 y30-34 z12-20, passi 77-78
 #33 prl u → . (+3): ×1, 7491 celle x0-24 y22-38 z12-29, passi 79, 2→. 7491
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×7491; r4 3 → . ×0
#34-36 box×1, one×1, all×1: 7278 celle x0-24 y33-39 z0-21, passi 80-124
#40-46 line×2, box×1, prl×1: 3639 celle x0-24 y33-39 z0-21, passi 125-128
 #47 box at 12 18 11 size 25 26 19 u su .: ×1, 11524 celle x0-24 y6-30 z11-29, passi 129, .→u 11524
 #48 one u → 1 (+2) passi=1: ×1, 1 celle x16 y27 z17, passi 130, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #49 all 1u → *1 (+2): ×49, 11523 celle x0-24 y6-30 z11-29, passi 131-179, u→3 11523
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×11523
#57-59 cylinder×1, box×2: 413 celle x6-18 y6-16 z12-20, passi 180-182
 #60 prl u → . (+3): ×1, 11111 celle x0-24 y6-30 z11-29, passi 183, 3→. 11111
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×11111
 #61 prl . W → * D passi=1: ×1, 92 celle x5-18 y7-34 z11-20, passi 184, W→D 92
Senza effetto (non hanno mai cambiato una cella):
#21 line 12 30 12 → 12 30 26 G
#22 box at 12 31 26 size 6 4 3 W su 1
#23 box at 12 33 27 size 4 1 1 E su 1
#26 box at 8 34 19 size 5 1 1 E su 2
#27 line 8 30 12 → 8 30 22 G
#28 line 16 30 12 → 16 30 22 G
#29 box at 8 31 22 size 4 4 3 W su 3
#30 box at 16 31 22 size 4 4 3 W su 3
#31 box at 8 33 23 size 2 1 1 E su 3
#32 box at 16 33 23 size 2 1 1 E su 3
#37 line 15 33 10 → 20 37 10 G
#38 line 20 37 10 → 6 38 10 G
… e altri 12
```
