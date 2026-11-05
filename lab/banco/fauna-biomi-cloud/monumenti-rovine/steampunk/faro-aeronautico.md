# Faro aeronautico (`faro-aeronautico`)

Il faro che guida i dirigibili sopra Orichalcum: torre alta, lanterna a gas, fasci di luce e un braccio d'ormeggio.

- Collezione: `monumenti-rovine` · ambientazione: `steampunk` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (la torre: traliccio, mattoni rastremati, tubo con i contrafforti; i fasci: due opposti, quattro a croce, uno lungo, tre; il braccio d'ormeggio da uno dei quattro lati) e rivetti e fuliggine a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.465 | ≥ 0.15 |
| distanza minima fra due semi | 0.142 | — |
| tempo del seme più lento | 382 ms | < 1500 ms |
| voxel per seme (1-5) | 6522, 5506, 4191, 6826, 5809 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`faro-aeronautico.png`](faro-aeronautico.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 60 nodi, 269 passi, finito in 360 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 3=marcatore (marcatore), K=mattoni, I=ferro, O=ottone, L=lanterna, Y=fasci di luce, N=fuliggine, S=pietra, u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: K 4279, S 1119, I 317, L 315, O 298, Y 144, N 50.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
#5-6 cylinder×1, box×1: 19634 celle x14-36 y14-36 z0-37, passi 11-12
#7-8 one×1, all×1: 18515 celle x14-36 y14-36 z3-37, passi 13-70
 #17 cone at 25 25 3 size 18 18 52 K su 2: ×1, 4375 celle x17-33 y17-33 z3-37, passi 71, 2→K 4375
 #24 prl u → . (+3): ×1, 14140 celle x14-36 y14-36 z3-37, passi 72, 2→. 14140
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×14140; r4 3 → . ×0
#25-28 cylinder×2, cone×1, box×1: 10158 celle x1-49 y1-49 z36-49, passi 73-76
#29-30 one×1, all×1: 9424 celle x1-49 y1-49 z39-42, passi 77-159
#37-41 line×1, prl×1: 9424 celle x1-49 y1-49 z39-42, passi 160-161
 #42 box at 25 25 26 size 50 50 14 u su .: ×1, 32747 celle x1-49 y1-49 z26-39, passi 162, .→u 32747
 #43 one u → 1 (+3) passi=1: ×1, 1 celle x46 y46 z35, passi 163, u→3 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×1; r4 u → 4 ×0
 #44 all 1u → *1 (+3): ×99, 32746 celle x1-49 y1-49 z26-39, passi 164-262, u→3 32746
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×32746; r4 4u → *4 ×0
#51-53 line×2, cone×1: 216 celle x24-26 y29-48 z28-39, passi 263-265
 #57 prl u → . (+4): ×1, 32531 celle x1-49 y1-49 z26-39, passi 266, 3→. 32531
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×32531; r5 4 → . ×0
#58-60 prl×3: 55 celle x17-33 y17-48 z3-37, passi 267-269
Senza effetto (non hanno mai cambiato una cella):
#9 line 16 16 3 → 22 22 36 I
#10 line 34 16 3 → 28 22 36 I
#11 line 16 34 3 → 22 28 36 I
#12 line 34 34 3 → 28 28 36 I
#13 box at 25 25 10 size 15 15 1 I su 1
#14 box at 25 25 18 size 12 12 1 I su 1
#15 box at 25 25 26 size 9 9 1 I su 1
#16 cylinder at 25 25 3 size 3 3 34 O su 1
#18 box at 25 25 34 size 3 3 3 K su 2
#19 cylinder at 25 25 3 size 10 10 34 I su 3
#20 line 36 25 3 → 30 25 26 I
#21 line 25 36 3 → 25 30 26 I
… e altri 20
```
