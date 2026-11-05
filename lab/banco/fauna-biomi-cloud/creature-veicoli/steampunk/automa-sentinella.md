# Automa sentinella (`automa-sentinella`)

La sentinella d'ottone di Orichalcum: caldaia nel petto, rivetti, una lanterna o un'alabarda.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `persona` (scatola 20 × 15 × 30)
- Scelte procedurali: quattro scelte a caso (gambe dritte, al passo, piegate; tronco a caldaia, a botte, a cassa con griglia; braccia con alabarda, con lanterna avanti, abbassate; testa a cupola, a cilindro con periscopio, a lanterna) e rivetti di rame in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.212 | ≥ 0.15 |
| distanza minima fra due semi | 0.000 | — |
| tempo del seme più lento | 58 ms | < 1500 ms |
| voxel per seme (1-5) | 1780, 1838, 1875, 1736, 1736 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`automa-sentinella.png`](automa-sentinella.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×15×30, 61 nodi, 171 passi, finito in 63 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), O=ottone, D=ottone brunito, C=rame dei rivetti, I=ferro, L=luce della caldaia, u=marcatore (marcatore).
Alla fine: O 1190, I 276, D 186, L 100, C 28.
 #2 box at 10 7 0 size 20 15 12 u su .: ×1, 3420 celle x1-19 y0-14 z0-11, passi 1, .→u 3420
#3-4 one×1, all×1: 3420 celle x1-19 y0-14 z0-11, passi 2-31
#9-19 box×2, line×2, prl×1: 3420 celle x1-19 y0-14 z0-11, passi 32-36
 #20 box at 10 7 8 size 20 15 15 u su .: ×1, 4219 celle x1-19 y0-14 z8-22, passi 37, .→u 4219
#21-22 one×1, all×1: 4219 celle x1-19 y0-14 z8-22, passi 38-74
#23-30 cylinder×1, prl×1: 4219 celle x1-19 y0-14 z8-22, passi 75-76
 #31 box at 10 7 2 size 20 15 28 u su .: ×1, 6628 celle x1-19 y0-14 z2-29, passi 77, .→u 6628
 #32 one u → 1 (+2) passi=1: ×1, 1 celle x2 y2 z6, passi 78, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #33 all 1u → *1 (+2): ×52, 6627 celle x1-19 y0-14 z2-29, passi 79-130, u→1 6627
   r1 1u → *1 ×6627; r2 2u → *2 ×0; r3 3u → *3 ×0
#34-37 line×3, box×1: 175 celle x1-19 y6-11 z2-29, passi 131-134
 #46 prl u → . (+3): ×1, 6453 celle x1-19 y0-14 z2-29, passi 135, 1→. 6453
   r1 u → . ×0; r2 1 → . ×6453; r3 2 → . ×0; r4 3 → . ×0
#47-49 box×1, one×1, all×1: 5752 celle x1-19 y0-14 z19-29, passi 136-166
#57-61 box×2, cone×1, prl×2: 2904 celle x1-19 y0-14 z9-29, passi 167-171
Senza effetto (non hanno mai cambiato una cella):
#5 box at 6 7 0 size 4 6 2 D su 1
#6 box at 14 7 0 size 4 6 2 D su 1
#7 cylinder at 6 7 0 size 3 3 11 I su 1
#8 cylinder at 14 7 0 size 3 3 11 I su 1
#13 box at 4 7 0 size 4 6 2 D su 3
#14 box at 16 7 0 size 4 6 2 D su 3
#15 line 4 7 0 → 6 10 5 I
#16 line 6 10 5 → 7 7 10 I
#17 line 16 7 0 → 14 10 5 I
#18 line 14 10 5 → 13 7 10 I
#24 box at 10 12 13 size 4 1 3 L su 1
#25 ellipsoid at 10 7 8 size 14 12 14 O su 2
… e altri 19
```
