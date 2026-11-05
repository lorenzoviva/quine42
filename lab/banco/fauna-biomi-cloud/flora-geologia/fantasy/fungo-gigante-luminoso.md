# Fungo gigante luminoso (`fungo-gigante-luminoso`)

Il fungo alto come un albero che illumina le radure notturne di Aurora: gambo pallido, cappello maculato, lamelle che brillano.

- Collezione: `flora-geologia` · ambientazione: `fantasy` · classe: `albero` (scatola 40 × 40 × 60)
- Scelte procedurali: il gambo che sale storto a caso, il cappello a caso (piatto, a cupola, a cono, a due piani), le lamelle luminose che si accendono a caso sotto il cappello, macchie sul cappello e funghetti che nascono in punti a caso della base.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, seme peggiore) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.486 | ≥ 0.15 |
| distanza minima fra due semi | 0.116 | — |
| tempo del seme più lento | 266 ms | < 1500 ms |
| voxel per seme (1-5) | 8334, 9777, 7212, 8366, 7308 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`fungo-gigante-luminoso.png`](fungo-gigante-luminoso.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 40×40×60, 27 nodi, 133 passi, finito in 268 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 4=marcatore (marcatore), T=gambo, U=gambo alto, C=cappello, W=macchie del cappello, G=lamelle, M=muschio, H=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore).
Alla fine: C 6227, G 912, T 479, M 460, W 175, U 81.
#2-4 ellipsoid×1, cylinder×1, box×1: 911 celle x13-27 y13-27 z0-5, passi 1-3
#5-6 one×2: 68 celle x20-22 y19-23 z5-39, passi 4-37
 #7 all T. → *T passi=2: ×2, 216 celle x18-23 y18-24 z5-22, passi 38-39, .→T 216
#8-9 all×1, prl×1: 65 celle x19-23 y18-24 z23-39, passi 40-41
 #10 box at 20 20 30 size 40 40 30 u su .: ×1, 45584 celle x1-39 y1-39 z30-59, passi 42, .→u 45584
 #11 one u → 1 (+3) passi=1: ×1, 1 celle x30 y11 z43, passi 43, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #12 all 1u → *1 (+3): ×73, 45583 celle x1-39 y1-39 z30-59, passi 44-116, u→4 45583
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×45583
#16-17 ellipsoid×2: 6402 celle x5-35 y5-35 z36-53, passi 117-118
 #18 prl u → . (+4): ×1, 39182 celle x1-39 y1-39 z30-59, passi 119, 4→. 39182
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×39182
 #20 prl P → U: ×1, 1 celle x21 y23 z39, passi 120, P→U 1
 #21 prl C . → * G passi=1: ×1, 728 celle x5-35 y5-35 z35-47, passi 121, .→G 728
 #22 prl G . → * G passi=1: ×1, 184 celle x5-35 y5-35 z34-45, passi 122, .→G 184
 #23 prl . C → * W passi=1: ×1, 80 celle x6-35 y5-35 z40-53, passi 123, C→W 80
#24-27 prl×2, one×1, all×1: 135 celle x7-35 y5-35 z3-53, passi 124-133
Senza effetto (non hanno mai cambiato una cella):
#13 ellipsoid at 20 20 41 size 34 34 9 C su 1
#14 ellipsoid at 20 20 36 size 28 28 20 C su 2
#15 cone at 20 20 37 size 30 30 22 C su 3
#19 all . P → P U: le celle cercate c'erano, ma mai disposte come nel pattern
```
