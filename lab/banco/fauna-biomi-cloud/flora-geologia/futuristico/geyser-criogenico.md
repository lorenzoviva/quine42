# Geyser criogenico (`geyser-criogenico`)

Un geyser delle lune ghiacciate di Sidera: un cono di ghiaccio e un getto che gela mentre sale.

- Collezione: `flora-geologia` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: il getto a caso (colonna alta, fontana a ombrello che ricade, due getti storti, spruzzo a rami), massi di ghiaccio che crescono accanto al cono, cristalli di brina che nascono a caso con la loro direzione e lunghezza.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.434 | ≥ 0.15 |
| distanza minima fra due semi | 0.267 | — |
| tempo del seme più lento | 641 ms | < 1500 ms |
| voxel per seme (1-5) | 6301, 8715, 5285, 6091, 5353 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`geyser-criogenico.png`](geyser-criogenico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 32 nodi, 181 passi, finito in 633 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 0=marcatore (marcatore), 3=marcatore (marcatore), 7=marcatore (marcatore), 8=marcatore (marcatore), 9=marcatore (marcatore), I=ghiaccio, D=ghiaccio scuro, J=getto gelato, X=brina, g=marcatore (marcatore), P=marcatore (marcatore), Q=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: I 4150, J 1305, D 678, X 168.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 cone×1, box×1: 5566 celle x2-48 y2-48 z0-13, passi 11-12
 #7 one [ID]g → *D passi=7: ×7, 7 celle x9-41 y10-40 z0, passi 13-19, g→D 7
 #8 prl D[.g] → *D (+1) passi=7: ×7, 671 celle x4-46 y5-44 z0-5, passi 20-26, .→D 484, g→D 187
   r1 D[.g] → *D ×610; r2 . D → D * ×213
 #9 prl g → .: ×1, 1222 celle x2-48 y2-48 z0, passi 27, g→. 1222
 #10 box at 25 25 8 size 50 50 42 u su .: ×1, 100464 celle x1-49 y1-49 z8-49, passi 28, .→u 100464
 #11 one u → 1 (+3) passi=1: ×1, 1 celle x10 y47 z43, passi 29, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #12 all 1u → *1 (+3): ×120, 100463 celle x1-49 y1-49 z8-49, passi 30-149, u→3 100463
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×100463; r4 4u → *4 ×0
#18-21 line×2, ellipsoid×2: 1206 celle x12-38 y20-32 z11-43, passi 150-153
 #24 prl u → . (+4): ×1, 99258 celle x1-49 y1-49 z8-49, passi 154, 3→. 99258
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×99258; r5 4 → . ×0
#27-29 prl×1, one×1, all×1: 123 celle x12-38 y17-34 z3-39, passi 155-171
#30-32 prl×3: 235 celle x11-37 y16-35 z3-18, passi 172-181
Senza effetto (non hanno mai cambiato una cella):
#13 cylinder at 25 25 8 size 5 5 32 J su 1
#14 ellipsoid at 25 25 38 size 9 9 10 J su 1
#15 cylinder at 25 25 8 size 4 4 24 J su 2
#16 ellipsoid at 25 25 30 size 30 30 6 J su 2
#17 box at 25 25 33 size 1 1 1 P su 2
#22 cylinder at 25 25 8 size 4 4 14 J su 4
#23 box at 25 25 22 size 1 1 1 P su 4
#25 one . P → P J (+2) passi=40: in quel momento nella griglia non c'erano celle "P"
#26 prl P → J: in quel momento nella griglia non c'erano celle "P"
```
