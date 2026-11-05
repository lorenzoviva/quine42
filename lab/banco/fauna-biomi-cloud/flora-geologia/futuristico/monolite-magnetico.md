# Monolite magnetico (`monolite-magnetico`)

Una pietra nera dei deserti di Sidera che piega il campo attorno a sé: frammenti trattenuti da linee di luce, limatura che si drizza.

- Collezione: `flora-geologia` · ambientazione: `futuristico` · classe: `monumento` (scatola 20 × 20 × 60)
- Scelte procedurali: il monolite a caso (lastra, obelisco, blocchi sfalsati, anello), i frammenti tenuti da linee di campo a caso (in alto, a spirale, ai lati), aculei di limatura che si drizzano a caso sulla base e segni luminosi a caso sulla pietra.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.441 | ≥ 0.15 |
| distanza minima fra due semi | 0.065 | — |
| tempo del seme più lento | 188 ms | < 1500 ms |
| voxel per seme (1-5) | 2528, 2094, 2600, 2706, 2094 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`monolite-magnetico.png`](monolite-magnetico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 20×20×60, 45 nodi, 156 passi, finito in 132 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), K=pietra nera, D=pietra lucida, G=linee di campo, F=limatura, P=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 1799, D 586, G 73, F 70.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 cylinder×1, box×1: 17192 celle x1-19 y1-19 z0-47, passi 11-12
 #7 one u → 1 (+3) passi=1: ×1, 1 celle x12 y7 z34, passi 13, u→2 1
   r1 u → 1 ×0; r2 u → 2 ×1; r3 u → 3 ×0; r4 u → 4 ×0
 #8 all 1u → *1 (+3): ×55, 16605 celle x1-19 y1-19 z2-47, passi 14-68, u→2 16605
   r1 1u → *1 ×0; r2 2u → *2 ×16605; r3 3u → *3 ×0; r4 4u → *4 ×0
#10-11 box×1, cone×1: 1782 celle x7-13 y7-13 z2-43, passi 69-70
 #21 prl u → . (+4): ×1, 14824 celle x1-19 y1-19 z2-47, passi 71, 2→. 14824
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×14824; r4 3 → . ×0; r5 4 → . ×0
 #22 box at 10 10 20 size 20 20 40 u su .: ×1, 13540 celle x1-19 y1-19 z20-59, passi 72, .→u 13540
 #23 one u → 1 (+2) passi=1: ×1, 1 celle x10 y5 z53, passi 73, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1
 #24 all 1u → *1 (+2): ×56, 13539 celle x1-19 y1-19 z20-59, passi 74-129, u→3 13539
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×13539
#35-40 line×3, box×3: 90 celle x1-19 y9-11 z30-50, passi 130-135
 #41 prl u → . (+3): ×1, 13450 celle x1-19 y1-19 z20-59, passi 136, 3→. 13450
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×13450
#42-43 one×1, all×1: 126 celle x1-19 y2-19 z2-6, passi 137-154
#44-45 prl×2: 46 celle x1-19 y2-18 z2-50, passi 155-156
Senza effetto (non hanno mai cambiato una cella):
#9 box at 10 10 2 size 10 4 40 K su 1
#12 box at 9 10 2 size 9 9 10 K su 3
#13 box at 11 9 12 size 8 8 10 K su 3
#14 box at 9 11 22 size 7 7 10 K su 3
#15 box at 10 10 32 size 6 6 8 K su 3
#16 box at 10 10 2 size 6 6 10 K su 4
#17 line 10 10 12 → 3 10 22 K
#18 line 10 10 12 → 17 10 22 K
#19 line 3 10 22 → 10 10 36 K
#20 line 17 10 22 → 10 10 36 K
#25 line 10 10 38 → 10 10 50 G
#26 box at 10 10 50 size 4 4 4 K su 1
… e altri 8
```
