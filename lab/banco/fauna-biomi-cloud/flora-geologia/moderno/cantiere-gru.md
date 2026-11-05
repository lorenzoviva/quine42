# Cantiere con la gru (`cantiere-gru`)

Un palazzo in costruzione a Neapolis: platea, pilastri che salgono, solai gettati a metà e la gru a torre.

- Collezione: `flora-geologia` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: sedici pilastri che salgono e si fermano a caso (ognuno ha la sua altezza), due solai gettati attorno ai pilastri che li raggiungono e allargati a caso, la gru a torre in un angolo con il braccio in una di quattro direzioni, il ponteggio su uno dei quattro lati, ferri d'armatura sulle teste dei pilastri e sacchi di materiale a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.192 | ≥ 0.15 |
| distanza minima fra due semi | 0.135 | — |
| tempo del seme più lento | 871 ms | < 1500 ms |
| voxel per seme (1-5) | 7607, 7417, 7879, 7631, 7940 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`cantiere-gru.png`](cantiere-gru.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 100 nodi, 328 passi, finito in 879 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 3=marcatore (marcatore), S=cemento, C=pilastri, R=ferri d'armatura, Y=gru, I=ferro, K=sacchi, W=tavole del ponteggio, P=marcatore (marcatore), s=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 4074, C 2375, Y 711, I 269, W 90, R 83, K 5.
#2-31 box×22, one×1, prl×5, all×2: 8874 celle x0-43 y0-43 z0-45, passi 1-86
 #32 box at 25 25 0 size 50 50 50 u su .: ×1, 113539 celle x1-49 y1-49 z0-49, passi 87, .→u 113539
 #33 one u → 1 (+3) passi=1: ×1, 1 celle x32 y2 z42, passi 88, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #34 all 1u → *1 (+3): ×120, 113538 celle x1-49 y1-49 z0-49, passi 89-208, u→3 113538
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×113538; r4 4u → *4 ×0
#45-49 line×4, box×1: 502 celle x1-37 y1-37 z28-49, passi 209-213
 #54 prl u → . (+4): ×1, 113037 celle x1-49 y1-49 z0-49, passi 214, 3→. 113037
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×113037; r5 4 → . ×0
#55-67 box×8, line×5: 42213 celle x4-46 y4-46 z2-47, passi 215-227
#68-69 one×1, all×1: 41837 celle x8-46 y8-46 z2-31, passi 228-315
#84-90 line×4, box×3: 253 celle x10-44 y43-45 z2-31, passi 316-322
#98-99 prl×1, one×1: 41589 celle x8-46 y8-46 z2-31, passi 323-328
Senza effetto (non hanno mai cambiato una cella):
#35 line 6 6 44 → 46 6 44 Y
#36 line 6 6 44 → 0 6 44 Y
#37 line 6 6 49 → 36 6 44 Y
#38 line 36 6 44 → 36 6 30 I
#39 box at 36 6 28 size 3 3 2 I su 1
#40 line 6 6 44 → 6 46 44 Y
#41 line 6 6 44 → 6 0 44 Y
#42 line 6 6 49 → 6 36 44 Y
#43 line 6 36 44 → 6 36 30 I
#44 box at 6 36 28 size 3 3 2 I su 2
#50 line 6 6 44 → 6 26 46 Y
#51 line 6 6 44 → 6 1 44 Y
… e altri 24
```
