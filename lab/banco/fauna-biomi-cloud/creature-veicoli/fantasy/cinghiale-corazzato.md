# Cinghiale corazzato (`cinghiale-corazzato`)

Un cinghiale enorme con placche d'osso sul dorso e zanne ricurve: la bestia delle forre di Aurora.

- Collezione: `creature-veicoli` · ambientazione: `fantasy` · classe: `bestia` (scatola 25 × 40 × 30)
- Scelte procedurali: tre scelte a caso (zampe ferme o alla carica; corpo massiccio, allungato o tozzo; testa bassa alla carica, alta, voltata) e punte d'osso che spuntano in posti a caso sulle placche e crescono dritte o di sbieco.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.382 | ≥ 0.15 |
| distanza minima fra due semi | 0.158 | — |
| tempo del seme più lento | 136 ms | < 1500 ms |
| voxel per seme (1-5) | 3655, 3820, 5540, 4656, 4750 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cinghiale-corazzato.png`](cinghiale-corazzato.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 25×40×30, 44 nodi, 197 passi, finito in 119 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), F=setole brune, R=placche d'osso, S=punte, G=zampe, T=zanne, K=grugno e zoccoli, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: F 2497, R 651, G 324, T 100, S 54, K 29.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 12 20 0 size 21 38 10 u su .: ×1, 7770 celle x2-22 y2-38 z0-9, passi 11, .→u 7770
#6-7 one×1, all×1: 7770 celle x2-22 y2-38 z0-9, passi 12-58
#8-11 cylinder×4: 324 celle x7-17 y11-29 z0-8, passi 59-62
 #16 prl u → . (+2): ×1, 7446 celle x2-22 y2-38 z0-9, passi 63, 1→. 7446
   r1 u → . ×0; r2 1 → . ×7446; r3 2 → . ×0
 #17 box at 12 20 4 size 24 34 22 u su .: ×1, 16518 celle x1-23 y4-36 z4-25, passi 64, .→u 16518
 #18 one u → 1 (+2) passi=1: ×1, 1 celle x7 y12 z9, passi 65, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #19 all 1u → *1 (+2): ×56, 16517 celle x1-23 y4-36 z4-25, passi 66-121, u→2 16517
   r1 1u → *1 ×0; r2 2u → *2 ×16517; r3 3u → *3 ×0
 #21 ellipsoid at 12 19 6 size 14 32 12 F su 2: ×1, 2784 celle x6-18 y4-34 z6-17, passi 122, 2→F 2784
 #23 prl u → . (+3): ×1, 13734 celle x1-23 y4-36 z4-25, passi 123, 2→. 13734
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×13734; r4 3 → . ×0
#24-25 ellipsoid×1, box×1: 7157 celle x0-24 y9-39 z0-21, passi 124-125
#26-27 one×1, all×1: 6506 celle x0-24 y27-39 z0-21, passi 126-176
#36-44 ellipsoid×1, box×1, line×3, prl×2, one×1, all×1: 6629 celle x0-24 y2-39 z0-23, passi 177-197
Senza effetto (non hanno mai cambiato una cella):
#12 line 8 34 0 → 9 27 8 G
#13 line 16 25 0 → 15 27 8 G
#14 line 8 6 0 → 9 13 8 G
#15 line 16 15 0 → 15 13 8 G
#20 ellipsoid at 12 20 5 size 17 28 15 F su 1
#22 ellipsoid at 12 21 5 size 20 26 17 F su 3
#28 ellipsoid at 12 33 3 size 10 9 9 F su 1
#29 box at 12 38 4 size 5 3 4 K su 1
#30 line 9 37 5 → 7 39 11 T
#31 line 15 37 5 → 17 39 11 T
#32 ellipsoid at 12 33 9 size 10 9 9 F su 2
#33 box at 12 38 10 size 5 3 4 K su 2
… e altri 2
```
