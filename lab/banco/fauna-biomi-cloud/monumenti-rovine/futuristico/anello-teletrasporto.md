# Anello del teletrasporto (`anello-teletrasporto`)

Un anello di Sidera che apre la strada verso un altro anello: la piattaforma, la corona d'acciaio, il campo che vibra nel vano.

- Collezione: `monumenti-rovine` · ambientazione: `futuristico` · classe: `edificio` (scatola 50 × 50 × 50)
- Scelte procedurali: tre scelte a caso (l'anello: ritto di fronte, ritto di fianco, orizzontale sui piloni, a ferro di cavallo; la piattaforma: tonda a gradini, quadra, a stella; i condotti) e cavi che partono dalla piattaforma in punti a caso e corrono dritti sul terreno, luci a caso.
- Esito: **valido**

| misura | valore | soglia |
|---|---|---|
| errori del validatore (`modelErrors`) e dell'analisi (semi 1-20) | 0 | 0 |
| voxel fluttuanti (fuori dal corpo principale, il peggiore dei semi 1-20) | 0 | 0 |
| distanza media fra i 5 semi (forma) | 0.626 | ≥ 0.15 |
| distanza minima fra due semi | 0.290 | — |
| tempo del seme più lento | 733 ms | < 1500 ms |
| voxel per seme (1-5) | 8115, 7199, 8297, 11117, 7352 | — |

Foglio di contatto dei semi 1-5 (sopra di lato, sotto di fronte): [`anello-teletrasporto.png`](anello-teletrasporto.png).

## Traccia (seme 1, nodi)

```
Traccia, seme 1: griglia 50×50×50, 42 nodi, 230 passi, finito in 740 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 2=marcatore (marcatore), 4=marcatore (marcatore), S=piattaforma, T=acciaio, F=campo, K=cavi, E=emettitori, x=marcatore (marcatore), e=marcatore (marcatore), w=marcatore (marcatore), n=marcatore (marcatore), u=marcatore (marcatore), z=marcatore (marcatore).
Alla fine: S 5476, T 1630, F 783, E 116, K 110.
#2-4 box×2, one×1: 16 celle x0-6 y0-1 z0, passi 1-10
 #5 box at 25 25 0 size 50 50 5 u su .: ×1, 12005 celle x1-49 y1-49 z0-4, passi 11, .→u 12005
#6-7 one×1, all×1: 12005 celle x1-49 y1-49 z0-4, passi 12-92
#10-14 box×1, prl×1: 12005 celle x1-49 y1-49 z0-4, passi 93-94
 #15 box at 25 25 3 size 50 50 47 u su .: ×1, 111478 celle x1-49 y1-49 z3-49, passi 95, .→u 111478
 #16 one u → 1 (+3) passi=1: ×1, 1 celle x29 y49 z40, passi 96, u→4 1
   r1 u → 1 ×0; r2 u → 2 ×0; r3 u → 3 ×0; r4 u → 4 ×1
 #17 all 1u → *1 (+3): ×113, 111477 celle x1-49 y1-49 z3-49, passi 97-209, u→4 111477
   r1 1u → *1 ×0; r2 2u → *2 ×0; r3 3u → *3 ×0; r4 4u → *4 ×111477
#32-36 box×3, ellipsoid×2: 10460 celle x6-44 y21-29 z3-45, passi 210-214
 #37 prl u → . (+4): ×1, 101018 celle x1-49 y1-49 z3-49, passi 215, 4→. 101018
   r1 u → . ×0; r2 1 → . ×0; r3 2 → . ×0; r4 3 → . ×0; r5 4 → . ×101018
#38-42 prl×4, one×1: 8339 celle x0-49 y0-39 z0-45, passi 216-230
Senza effetto (non hanno mai cambiato una cella):
#8 cylinder at 25 25 0 size 42 42 2 S su 1
#9 cylinder at 25 25 2 size 34 34 2 S su 1
#11 box at 25 25 0 size 44 12 3 S su 3
#12 box at 25 25 0 size 12 44 3 S su 3
#13 cylinder at 25 25 0 size 26 26 4 S su 3
#18 ellipsoid at 25 25 6 size 34 1 38 F su 1
#19 ellipsoid at 25 25 6 size 34 6 38 x su 1
#20 ellipsoid at 25 25 2 size 44 6 46 T su 1
#21 box at 25 25 3 size 20 8 4 T su 1
#22 ellipsoid at 25 25 6 size 1 34 38 F su 2
#23 ellipsoid at 25 25 6 size 6 34 38 x su 2
#24 ellipsoid at 25 25 2 size 6 44 46 T su 2
… e altri 7
```
