# Automa sentinella (`automa-sentinella`)

La sentinella d'ottone di Orichalcum: caldaia nel petto, rivetti, una lanterna o un'alabarda.

- Collezione: `creature-veicoli` · ambientazione: `steampunk` · classe: `persona` (scatola 20 × 15 × 30)
- Scelte procedurali: quattro scelte a caso (gambe dritte, al passo, piegate; tronco a caldaia, a botte, a cassa con griglia; braccia con alabarda, con lanterna avanti, abbassate; testa a cupola, a cilindro con periscopio, a lanterna) e rivetti di rame in posti a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.264 | ≥ 0.15 |
| distanza minima fra due semi | 0.054 | — |
| tempo del seme più lento | 57 ms | < 1500 ms |
| voxel per seme (1-5) | 1710, 2039, 1945, 1746, 1881 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`automa-sentinella.png`](automa-sentinella.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×15×30, 64 nodi, 191 passi, finito in 67 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), O=ottone, D=ottone brunito, C=rame dei rivetti, I=ferro, L=luce della caldaia, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: O 1139, I 264, L 146, D 132, C 29.
#2-5 box×3, one×1: 3436 celle x0-19 y0-14 z0-11, passi 1-11
#6-7 one×1, all×1: 3420 celle x1-19 y0-14 z0-11, passi 12-47
#12-22 box×2, line×2, prl×1: 3420 celle x1-19 y0-14 z0-11, passi 48-52
 #23 box at 10 7 8 size 20 15 15 u su .: ×1, 4219 celle x1-19 y0-14 z8-22, passi 53, .→u 4219
#24-25 one×1, all×1: 4219 celle x1-19 y0-14 z8-22, passi 54-92
#28-33 ellipsoid×1, box×1, prl×1: 4219 celle x1-19 y0-14 z8-22, passi 93-95
 #34 box at 10 7 2 size 20 15 28 u su .: ×1, 6663 celle x1-19 y0-14 z2-29, passi 96, .→u 6663
 #35 one u → 1 (+2) passi=1: ×1, 1 celle x7 y3 z28, passi 97, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #36 all 1u → *1 (+2): ×49, 6662 celle x1-19 y0-14 z2-29, passi 98-146, u→2 6662
   r1 1u → *1 ×0; r2 2u → *2 ×6662; r3 3u → *3 ×0
#41-43 line×2, box×1: 161 celle x1-18 y6-14 z11-20, passi 147-149
 #49 prl u → . (+3): ×1, 6502 celle x1-19 y0-14 z2-29, passi 150, 2→. 6502
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×6502; r4 3 → . ×0
#50-52 box×1, one×1, all×1: 5898 celle x1-19 y0-14 z19-29, passi 151-186
#60-64 box×2, cone×1, prl×2: 2978 celle x1-19 y0-14 z8-29, passi 187-191
Senza effetto (non hanno mai cambiato una cella):
#8 box at 6 7 0 size 4 6 2 D su 1
#9 box at 14 7 0 size 4 6 2 D su 1
#10 cylinder at 6 7 0 size 3 3 11 I su 1
#11 cylinder at 14 7 0 size 3 3 11 I su 1
#16 box at 4 7 0 size 4 6 2 D su 3
#17 box at 16 7 0 size 4 6 2 D su 3
#18 line 4 7 0 → 6 10 5 I
#19 line 6 10 5 → 7 7 10 I
#20 line 16 7 0 → 14 10 5 I
#21 line 14 10 5 → 13 7 10 I
#26 cylinder at 10 7 9 size 12 11 12 O su 1
#27 box at 10 12 13 size 4 1 3 L su 1
… e altri 19
```
