# Fermata della metropolitana (`fermata-metropolitana`)

L'ingresso di una fermata della metropolitana di Neapolis: la scala che scende, la pensilina, il palo con la lettera accesa.

- Collezione: `monumenti-rovine` · ambientazione: `moderno` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (la pensilina: arcuata di vetro, tettoia piatta, ferri liberty, nessuna; il lato della scala: davanti, dietro, a destra, a sinistra; l'arredo: panchina, distributore, cestini, biciclette) e cartacce e chewing-gum a caso sul marciapiede.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.229 | ≥ 0.15 |
| distanza minima fra due semi | 0.050 | — |
| tempo del seme più lento | 480 ms | < 1500 ms |
| voxel per seme (1-5) | 16937, 11032, 11058, 11035, 13047 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`fermata-metropolitana.png`](fermata-metropolitana.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 79 nodi, 233 passi, finito in 433 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 1=marcatore (marcatore), 2=marcatore (marcatore), S=marciapiede, D=gradini, I=ringhiere, V=vetro, R=lettera rossa, W=insegna, Y=distributore, K=cartacce, x=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: D 8961, V 5834, S 1782, Y 165, I 134, W 34, K 18, R 9.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 40 40 8 u su .: ×1, 12168 celle x6-44 y6-44 z0-7, passi 11, .→u 12168
#6-7 one×1, all×1: 12168 celle x6-44 y6-44 z0-7, passi 12-64
#14-32 box×6, prl×1: 12168 celle x6-44 y6-44 z0-7, passi 65-71
#33-34 box×2: 12199 celle x4-46 y4-46 z0-6, passi 72-73
#35-39 prl×3, all×2: 3815 celle x4-46 y4-46 z1-9, passi 74-79
 #40 box at 25 25 7 size 44 44 30 u su .: ×1, 55416 celle x4-46 y4-46 z7-36, passi 80, .→u 55416
 #41 one u → 1 (+3) passi=1: ×1, 1 celle x39 y33 z15, passi 81, u→1 1
   r1 u → 1 ×1; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×0
 #42 all 1u → *1 (+3): ×85, 55415 celle x4-46 y4-46 z7-36, passi 82-166, u→1 55415
   r1 1u → *1 ×55415; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×0
#43-46 ellipsoid×2, line×2: 23954 celle x9-41 y9-41 z7-36, passi 167-170
 #60 prl u → . (+4): ×1, 31462 celle x4-46 y4-46 z7-36, passi 171, 1→. 31462
   r1 u → . ×0; r2 1 → . ×31462; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×0
 #61 prl x → .: ×1, 18074 celle x11-39 y11-39 z7-36, passi 172, x→. 18074
#62-79 line×1, box×5, one×1, all×1, prl×2: 10836 celle x3-46 y4-47 z6-38, passi 173-233
Senza effetto (non hanno mai cambiato una cella):
#8 box at 25 27 6 size 12 2 1 x su 1
#9 box at 25 29 5 size 12 2 2 x su 1
#10 box at 25 31 4 size 12 2 3 x su 1
#11 box at 25 33 3 size 12 2 4 x su 1
#12 box at 25 35 2 size 12 2 5 x su 1
#13 box at 25 37 1 size 12 2 6 x su 1
#20 box at 27 25 6 size 2 12 1 x su 3
#21 box at 29 25 5 size 2 12 2 x su 3
#22 box at 31 25 4 size 2 12 3 x su 3
#23 box at 33 25 3 size 2 12 4 x su 3
#24 box at 35 25 2 size 2 12 5 x su 3
#25 box at 37 25 1 size 2 12 6 x su 3
… e altri 27
```
