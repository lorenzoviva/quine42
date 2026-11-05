# Scogliera frangiflutti (`scogliera-frangiflutti`)

Il frangiflutti del porto di Neapolis: un muro di cemento, scogli e tetrapodi ammucchiati dove batte il mare.

- Collezione: `flora-geologia` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: il muro a caso (con la passeggiata e la ringhiera, a gradoni, con la lanterna verde in testa), poi massi che nascono accanto al muro e crescono, e tetrapodi: punte che spuntano a caso dai massi e crescono di sbieco; alghe a caso sui massi.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.326 | ≥ 0.15 |
| distanza minima fra due semi | 0.029 | — |
| tempo del seme più lento | 262 ms | < 1500 ms |
| voxel per seme (1-5) | 22581, 14710, 19707, 22533, 14798 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`scogliera-frangiflutti.png`](scogliera-frangiflutti.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 28 nodi, 155 passi, finito in 307 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), S=cemento, D=cemento scuro, R=scogli, T=tetrapodi, A=alghe, g=marcatore (marcatore), P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 19012, D 2450, R 1022, A 52, T 45.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 38 0 size 50 24 50 u su .: ×1, 56350 celle x1-49 y27-49 z0-49, passi 11, .→u 56350
 #6 one u → 1 (+2) passi=1: ×1, 1 celle x49 y46 z13, passi 12, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0
 #7 all 1u → *1 (+2): ×103, 56349 celle x1-49 y27-49 z0-49, passi 13-115, u→2 56349
   r1 1u → *1 ×0; r2 2u → *2 ×56349; r3 3u → *3 ×0
#12-14 box×3: 21462 celle x1-49 y30-48 z0-31, passi 116-118
 #19 prl u → . (+3): ×1, 34888 celle x1-49 y27-49 z0-49, passi 119, 2→. 34888
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×34888; r4 3 → . ×0
 #20 box at 25 22 0 size 50 30 1 g su .: ×1, 1078 celle x1-49 y8-29 z0, passi 120, .→g 1078
 #21 one [SDR]g → *R passi=10: ×10, 10 celle x10-49 y29 z0, passi 121-130, g→R 10
 #22 prl R[.g] → *R (+1) passi=9: ×9, 1064 celle x4-49 y22-29 z0-7, passi 131-139, .→R 825, g→R 239
   r1 R[.g] → *R ×958; r2 . R → R * ×412
 #23 prl g → .: ×1, 829 celle x1-49 y8-29 z0, passi 140, g→. 829
 #24 one . R → P * passi=9: ×9, 9 celle x7-49 y23-29 z2-5, passi 141-149, .→P 9
 #25 all .* *P → P* *T (+1) passi=4: ×4, 72 celle x7-49 y22-29 z2-9, passi 150-153, P→T 36, .→P 36
   r1 .* *P → P* *T ×30; r2 . P → P T ×6
#26-28 prl×2: 61 celle x5-49 y22-29 z0-9, passi 154-155
Senza effetto (non hanno mai cambiato una cella):
#8 box at 25 40 0 size 50 14 28 S su 1
#9 box at 25 34 28 size 50 1 4 I su 1
#10 box at 25 46 28 size 50 1 4 I su 1
#11 box at 25 40 28 size 50 10 1 D su 1
#15 box at 25 42 0 size 50 12 24 S su 3
#16 cylinder at 42 42 24 size 8 8 12 S su 3
#17 cylinder at 42 42 36 size 5 5 4 G su 3
#18 cone at 42 42 40 size 7 7 5 D su 3
#27 prl .T → *T passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
```
