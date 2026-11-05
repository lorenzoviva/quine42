# Cinghiale corazzato (`cinghiale-corazzato`)

Un cinghiale enorme con placche d'osso sul dorso e zanne ricurve: la bestia delle forre di Aurora.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (zampe ferme o alla carica; corpo massiccio, allungato o tozzo; testa bassa alla carica, alta, voltata) e punte d'osso che spuntano in posti a caso sulle placche e crescono dritte o di sbieco.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.346 | ≥ 0.15 |
| distanza minima fra due semi | 0.131 | — |
| tempo del seme più lento | 147 ms | < 1500 ms |
| voxel per seme (1-5) | 3820, 5683, 3827, 5642, 5554 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cinghiale-corazzato.png`](cinghiale-corazzato.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 41 nodi, 183 passi, finito in 115 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), F=setole brune, R=placche d'osso, S=punte, G=zampe, T=zanne, K=grugno e zoccoli, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: F 2410, R 651, G 576, T 100, S 54, K 29.
 #2 box at 12 20 0 size 21 38 10 u su .: ×1, 7770 celle x2-22 y2-38 z0-9, passi 1, .→u 7770
#3-4 one×1, all×1: 7770 celle x2-22 y2-38 z0-9, passi 2-49
#9-12 line×4: 576 celle x6-18 y4-36 z0-9, passi 50-53
 #13 prl u → . (+2): ×1, 7194 celle x2-22 y2-38 z0-9, passi 54, 2→. 7194
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×7194
 #14 box at 12 20 4 size 24 34 22 u su .: ×1, 16358 celle x1-23 y4-36 z4-25, passi 55, .→u 16358
 #15 one u → 1 (+2) passi=1: ×1, 1 celle x12 y32 z12, passi 56, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #16 all 1u → *1 (+2): ×52, 16357 celle x1-23 y4-36 z4-25, passi 57-108, u→2 16357
   r1 1u → *1 ×0; r2 2u → *2 ×16357; r3 3u → *3 ×0
 #18 ellipsoid at 12 19 6 size 14 32 12 F su 2: ×1, 2697 celle x6-18 y4-34 z6-17, passi 109, 2→F 2697
 #20 prl u → . (+3): ×1, 13661 celle x1-23 y4-36 z4-25, passi 110, 2→. 13661
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×13661; r4 3 → . ×0
#21-22 ellipsoid×1, box×1: 7145 celle x0-24 y9-39 z0-21, passi 111-112
#23-24 one×1, all×1: 6494 celle x0-24 y27-39 z0-21, passi 113-162
#33-41 ellipsoid×1, box×1, line×3, prl×2, one×1, all×1: 6617 celle x0-24 y2-39 z0-23, passi 163-183
Senza effetto (non hanno mai cambiato una cella):
#5 cylinder at 8 12 0 size 4 4 9 G su 1
#6 cylinder at 16 12 0 size 4 4 9 G su 1
#7 cylinder at 8 28 0 size 4 4 9 G su 1
#8 cylinder at 16 28 0 size 4 4 9 G su 1
#17 ellipsoid at 12 20 5 size 17 28 15 F su 1
#19 ellipsoid at 12 21 5 size 20 26 17 F su 3
#25 ellipsoid at 12 33 3 size 10 9 9 F su 1
#26 box at 12 38 4 size 5 3 4 K su 1
#27 line 9 37 5 → 7 39 11 T
#28 line 15 37 5 → 17 39 11 T
#29 ellipsoid at 12 33 9 size 10 9 9 F su 2
#30 box at 12 38 10 size 5 3 4 K su 2
… e altri 2
```
