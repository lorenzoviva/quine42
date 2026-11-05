# Arco di roccia muschioso (`arco-roccia-muschioso`)

Un arco naturale nelle forre di Aurora: roccia grigia rosa, muschio sopra, liane che pendono dall'arco.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la forma dell'arco a caso (tondo, inclinato, doppio, ponte basso), la roccia che si gonfia a caso in bozze, il muschio sulle facce in alto e liane che nascono in punti a caso sotto l'arco e scendono di lunghezze diverse.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.476 | ≥ 0.15 |
| distanza minima fra due semi | 0.168 | — |
| tempo del seme più lento | 599 ms | < 1500 ms |
| voxel per seme (1-5) | 13527, 16570, 13508, 13760, 16686 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`arco-roccia-muschioso.png`](arco-roccia-muschioso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 33 nodi, 166 passi, finito in 649 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), R=roccia, D=roccia scura, M=muschio, V=liane, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: R 10977, D 1710, M 767, V 73.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 50 50 u su .: ×1, 120050 celle x1-49 y1-49 z0-49, passi 11, .→u 120050
 #6 one u → 1 (+3) passi=1: ×1, 1 celle x40 y8 z35, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #7 all 1u → *1 (+3): ×115, 120049 celle x1-49 y1-49 z0-49, passi 13-127, u→2 120049
   r1 1u → *1 ×0; r2 2u → *2 ×120049; r3 3u → *3 ×0; r4 4u → *4 ×0
#13-16 line×3, ellipsoid×1: 11327 celle x1-48 y15-34 z0-37, passi 128-131
 #26 prl u → . (+4): ×1, 108723 celle x1-49 y1-49 z0-49, passi 132, 2→. 108723
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×108723; r4 3 → . ×0; r5 4 → . ×0
 #27 prl R. → *D passi=1: ×1, 291 celle x0-49 y15-35 z0-37, passi 133, .→D 291
 #28 prl D. → *D passi=2: ×2, 1836 celle x0-49 y13-37 z0-38, passi 134-135, .→D 1836
 #29 prl . R → * M passi=1: ×1, 291 celle x3-48 y15-34 z1-37, passi 136, R→M 291
 #30 prl . D → * M passi=1: ×1, 476 celle x0-49 y13-37 z0-38, passi 137, D→M 476
 #31 one R . → * P passi=10: ×10, 10 celle x17-39 y19-31 z0-21, passi 138-147, .→P 10
 #32 prl P . → V P passi=18: ×18, 126 celle x17-32 y19-31 z5-21, passi 148-165, .→P 63, P→V 63
 #33 prl P → V: ×1, 10 celle x17-39 y19-31 z0-15, passi 166, P→V 10
Senza effetto (non hanno mai cambiato una cella):
#8 line 10 25 0 → 12 25 26 R
#9 line 40 25 0 → 38 25 26 R
#10 line 12 25 26 → 20 25 36 R
#11 line 38 25 26 → 30 25 36 R
#12 line 20 25 36 → 30 25 36 R
#17 line 6 25 0 → 8 25 24 R
#18 line 25 25 0 → 25 25 30 R
#19 line 44 25 0 → 42 25 24 R
#20 line 8 25 24 → 25 25 34 R
#21 line 42 25 24 → 25 25 34 R
#22 ellipsoid at 8 25 0 size 16 22 22 R su 4
#23 ellipsoid at 42 25 0 size 16 22 22 R su 4
… e altri 2
```
