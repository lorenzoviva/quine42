# Passerella pedonale (`passerella-pedonale`)

La passerella che scavalca un viale di Neapolis: impalcato d'acciaio, parapetti, scale o rampe alle teste, i lampioni sopra.

- Collezione: `monumenti-rovine` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (la struttura: archi reticolari sopra, due pile, strallata a un pilone; le teste: scale, rampe, torri degli ascensori; i parapetti: a sbarre, pieni, di vetro) e lampioni che nascono in punti a caso con altezze proprie, graffiti che si allargano a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.612 | ≥ 0.15 |
| distanza minima fra due semi | 0.062 | — |
| tempo del seme più lento | 454 ms | < 1500 ms |
| voxel per seme (1-5) | 2778, 3133, 2696, 2879, 3847 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`passerella-pedonale.png`](passerella-pedonale.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 82 nodi, 252 passi, finito in 446 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), 3=marcatore (marcatore), S=cemento, I=acciaio, W=acciaio chiaro, V=vetro, L=lampioni, G=graffiti, H=graffiti azzurri, x=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 1459, W 769, V 336, I 145, G 36, H 20, L 13.
#2-10 box×4, one×2, line×1, prl×2: 824 celle x0-49 y0-28 z0-35, passi 1-33
 #12 box at 25 25 0 size 50 20 50 u su .: ×1, 45791 celle x1-49 y16-34 z0-49, passi 34, .→u 45791
 #13 one u → 1 (+2) passi=1: ×1, 1 celle x20 y26 z0, passi 35, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0
 #14 all 1u → *1 (+2): ×88, 45790 celle x1-49 y16-34 z0-49, passi 36-123, u→1 45790
   r1 1u → *1 ×45790; r2 2u → *2 ×0; r3 3u → *3 ×0
#15-21 ellipsoid×4, line×3: 3624 celle x2-48 y20-30 z0-43, passi 124-130
 #32 prl u → . (+3): ×1, 42167 celle x1-49 y16-34 z0-49, passi 131, 1→. 42167
   r1 u → . ×0; r2 1 → . ×42167; r3 2 → . ×0; r4 3 → . ×0
 #33 prl x → .: ×1, 2835 celle x5-45 y21-29 z0-40, passi 132, x→. 2835
 #34 box at 25 25 0 size 50 30 22 u su .: ×1, 30276 celle x1-49 y11-39 z0-21, passi 133, .→u 30276
#35-36 one×1, all×1: 30276 celle x1-49 y11-39 z0-21, passi 134-195
#55-58 line×2, box×2: 809 celle x1-49 y11-39 z0-20, passi 196-199
 #63 prl u → . (+3): ×1, 29467 celle x1-49 y11-39 z0-21, passi 200, 2→. 29467
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×29467; r4 3 → . ×0
#64-82 box×5, one×1, all×1, prl×5: 6341 celle x1-49 y11-39 z4-42, passi 201-252
Senza effetto (non hanno mai cambiato una cella):
#11 prl .L → *L passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#22 box at 16 25 0 size 6 6 18 S su 2
#23 box at 34 25 0 size 6 6 18 S su 2
#24 box at 25 25 16 size 30 6 2 I su 2
#25 box at 25 30 0 size 4 4 46 W su 3
#26 line 25 30 44 → 3 28 20 I
#27 line 25 30 44 → 10 28 20 I
#28 line 25 30 44 → 17 28 20 I
#29 line 25 30 44 → 33 28 20 I
#30 line 25 30 44 → 40 28 20 I
#31 line 25 30 44 → 47 28 20 I
#37 box at 3 21 0 size 6 1 18 S su 1
… e altri 28
```
