# Arco di roccia muschioso (`arco-roccia-muschioso`)

Un arco naturale nelle forre di Aurora: roccia grigia rosa, muschio sopra, liane che pendono dall'arco.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: la forma dell'arco a caso (tondo, inclinato, doppio, ponte basso), la roccia che si gonfia a caso in bozze, il muschio sulle facce in alto e liane che nascono in punti a caso sotto l'arco e scendono di lunghezze diverse.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.358 | ≥ 0.15 |
| distanza minima fra due semi | 0.218 | — |
| tempo del seme più lento | 708 ms | < 1500 ms |
| voxel per seme (1-5) | 13716, 13653, 13788, 16695, 13509 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`arco-roccia-muschioso.png`](arco-roccia-muschioso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 30 nodi, 128 passi, finito in 815 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 3=marcatore (marcatore), R=roccia, D=roccia scura, M=muschio, V=liane, P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: R 10891, D 1905, M 818, V 102.
 #2 box at 25 25 0 size 50 50 50 u su .: ×1, 120050 celle x1-49 y1-49 z0-49, passi 1, .→u 120050
 #3 one u → 1 (+3) passi=1: ×1, 1 celle x16 y21 z25, passi 2, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #4 all 1u → *1 (+3): ×86, 120049 celle x1-49 y1-49 z0-49, passi 3-88, u→3 120049
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×120049; r4 4u → *4 ×0
 #14 line 6 25 0 → 8 25 24 R: ×1, 2728 celle x1-13 y20-30 z0-29, passi 89, 3→R 2728
 #15 line 25 25 0 → 25 25 30 R: ×1, 3328 celle x20-30 y20-30 z0-35, passi 90, 3→R 3328
#16-18 line×3: 5112 celle x8-49 y20-30 z0-39, passi 91-93
 #23 prl u → . (+4): ×1, 108882 celle x1-49 y1-49 z0-49, passi 94, 3→. 108882
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×108882; r5 4 → . ×0
 #24 prl R. → *D passi=1: ×1, 350 celle x0-49 y19-31 z0-39, passi 95, .→D 350
 #25 prl D. → *D passi=2: ×2, 2096 celle x0-49 y17-33 z0-41, passi 96-97, .→D 2096
 #26 prl . R → * M passi=1: ×1, 277 celle x1-49 y20-30 z1-39, passi 98, R→M 277
 #27 prl . D → * M passi=1: ×1, 541 celle x0-49 y17-33 z0-40, passi 99, D→M 541
 #28 one R . → * P passi=10: ×10, 10 celle x11-37 y20-29 z14-29, passi 100-109, .→P 10
 #29 prl P . → V P passi=18: ×18, 184 celle x11-35 y20-29 z4-29, passi 110-127, .→P 92, P→V 92
 #30 prl P → V: ×1, 10 celle x11-37 y20-29 z4-20, passi 128, P→V 10
Senza effetto (non hanno mai cambiato una cella):
#5 line 10 25 0 → 12 25 26 R
#6 line 40 25 0 → 38 25 26 R
#7 line 12 25 26 → 20 25 36 R
#8 line 38 25 26 → 30 25 36 R
#9 line 20 25 36 → 30 25 36 R
#10 line 8 22 0 → 16 24 30 R
#11 line 42 28 0 → 36 26 18 R
#12 line 16 24 30 → 36 26 18 R
#13 ellipsoid at 8 22 0 size 16 16 8 D su 2
#19 ellipsoid at 8 25 0 size 16 22 22 R su 4
#20 ellipsoid at 42 25 0 size 16 22 22 R su 4
#21 line 10 25 22 → 40 25 24 R
… e altri 1
```
