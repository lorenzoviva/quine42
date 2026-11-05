# Camminatore pesante (`camminatore-pesante`)

Il camminatore bipede dei cantieri orbitali di Sidera: gambe a pistone, cabina corazzata, bracci da lavoro o da guardia.

- Collezione: `creature-veicoli` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (gambe erette, al passo, accovacciate; cabina larga, a cupola o a torre; bracci con due cannoni, con lanciamissili sulle spalle, con artiglio e cannone) sfiati che spuntano a caso sulla cabina, antenne che crescono a rami dalle spalle e piastre di colore diverso a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.496 | ≥ 0.15 |
| distanza minima fra due semi | 0.006 | — |
| tempo del seme più lento | 637 ms | < 1500 ms |
| voxel per seme (1-5) | 8178, 8622, 7149, 8177, 7628 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`camminatore-pesante.png`](camminatore-pesante.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 65 nodi, 290 passi, finito in 633 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), W=corazza, Y=piastre gialle, G=pistoni, K=giunti, V=cabina di vetro, P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: W 3219, G 1819, K 1782, Y 1322, V 36.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 box×2: 40716 celle x6-44 y3-47 z0-25, passi 11-12
#7-8 one×1, all×1: 40014 celle x6-44 y3-47 z0-22, passi 13-82
#15-20 box×2, line×4: 1627 celle x14-36 y10-42 z0-22, passi 83-88
 #27 prl u → . (+3): ×1, 38387 celle x6-44 y3-47 z0-22, passi 89, 2→. 38387
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×38387; r4 3 → . ×0
#28-30 box×1, one×1, all×1: 30816 celle x12-38 y14-36 z25-49, passi 90-135
#35-37 box×2, prl×1: 15408 celle x12-38 y14-36 z25-49, passi 136-138
#38-42 box×5: 82757 celle x1-49 y11-49 z4-49, passi 139-143
 #43 one u → 1 (+2) passi=1: ×1, 1 celle x39 y12 z47, passi 144, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #44 all 1u → *1 (+2): ×118, 82166 celle x1-49 y11-49 z4-49, passi 145-262, u→2 82166
   r1 1u → *1 ×0; r2 2u → *2 ×82166; r3 3u → *3 ×0
#49-52 box×2, line×2: 1886 celle x6-44 y20-32 z16-43, passi 263-266
 #58 prl u → . (+3): ×1, 80281 celle x1-49 y11-49 z4-49, passi 267, 2→. 80281
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×80281; r4 3 → . ×0
#59-65 one×2, all×1, prl×4: 148 celle x14-36 y19-30 z26-46, passi 268-290
Senza effetto (non hanno mai cambiato una cella):
#9 box at 17 27 0 size 8 12 3 K su 1
#10 box at 33 27 0 size 8 12 3 K su 1
#11 line 20 25 22 → 17 25 11 G
#12 line 17 25 11 → 17 26 2 G
#13 line 30 25 22 → 33 25 11 G
#14 line 33 25 11 → 33 26 2 G
#21 box at 14 27 0 size 8 12 3 K su 3
#22 box at 36 27 0 size 8 12 3 K su 3
#23 line 20 25 22 → 14 36 13 G
#24 line 14 36 13 → 14 27 2 G
#25 line 30 25 22 → 36 36 13 G
#26 line 36 36 13 → 36 27 2 G
… e altri 13
```
