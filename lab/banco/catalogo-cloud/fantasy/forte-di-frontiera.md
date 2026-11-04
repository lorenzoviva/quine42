# forte-di-frontiera (fantasy)

Programma: `forte-di-frontiera.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 606 | 2 | 6 | — | 0,00 | 0 | 0 | 7 | 28 | scarto 0,03, alta 1,50 | — |
| 2 | 716 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 31 | scarto 0,03, alta 1,50 | — |
| 3 | 602 | 2 | 5 | — | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,50 | — |
| 4 | 822 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 35 | scarto 0,03, alta 1,50 | — |
| 5 | 708 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 38 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,65, colore 0,19, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 822 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1399 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 25 | scarto 0,03, alta 1,88 | — |
| 2 | 1746 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 31 | scarto 0,03, alta 1,88 | — |
| 3 | 1426 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 26 | scarto 0,03, alta 1,88 | — |
| 4 | 1407 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 26 | scarto 0,03, alta 1,88 | — |
| 5 | 1384 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 43 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,63, colore 0,17, pianta 0,38, perimetro 0,20, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1746 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 66 nodi, 604 passi, finito in 567 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=browN, E=Emerald, z=z, a=fondazione, x=botti di rovere, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=piattaforma della torre, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno di castagno (base), A=acciottolato, R=cammino di ronda, S=pietra squadrata, C=pietra grezza, W=intonaco a calce, U=pietra grezza (fascia), F=assi di quercia, u=intonaco a calce (fascia), K=pietra della scala, Y=gradino di pietra (testa), T=gradino di pietra, k=portone, L=legno di castagno, D=travi scure, V=vetro piombato.
Alla fine: S 13095, C 9796, W 7120, F 6607, D 4480, R 4383, K 3355, V 2240, U 1962, u 1582, i 900, h 348, L 344, k 330, A 44, G 43, T 11, Y 11.
#2-55 prl×15, all×30, one×8: 21069 celle x1-98 y1-99 z0, passi 1-529
  E→z 3328: x6-34 y36-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +9 scatole, 1675 celle
  E→t 2336: x66-94 y36-64 z0; x66-94 y66-94 z0; x36-47 y66-94 z0; +1 scatole, 306 celle
  E→b 1681: x36-64 y6-34 z0; x36-64 y36-49 z0; x36-49 y50-64 z0; +2 scatole, 224 celle
  E→s 165: x50-64 y66-76 z0
  E→X 163: x66-94 y35 z0; x95 y36-64 z0; x35 y66-94 z0; +4 scatole, 76 celle
  E→w 116: x36-64 y5 z0; x35 y6-34 z0; x65 y6-34 z0; +1 scatole, 29 celle
  E→I 93: x65-83 y65 z0; x96-97 y73-77 z0; x96-97 y80-84 z0; +12 scatole, 54 celle
  E→J 47: x65 y36-64 z0; x47-64 y65 z0
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x66-74 y20 z0; x80 y26-34 z0; +1 scatole, 9 celle
  E→i 23: x39-43 y3-4 z0; x51-55 y3-4 z0; x35 y5 z0; +2 scatole, 2 celle
  E→h 22: x49-64 y35 z0; x36-41 y35 z0
  E→H 22: x84-94 y65 z0; x65 y84-94 z0
  E→j 11: x36-46 y65 z0
  E→d 11: x48 y66-76 z0
  E→c 11: x49 y66-76 z0
  E→y 11: x65 y66-76 z0
  E→M 11: x45-55 y95 z0
  E→e 7: x42-48 y35 z0
  N→b 1: x50 y50 z0
#56-66 all×9, one×1, prl×1: 65568 celle x0-99 y0-99 z0-73, passi 530-604
  .→C 9796: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +40 scatole, 7746 celle
  .→S 8364: x65-95 y35-95 z64; x66-95 y35-95 z32; x35-64 y65-95 z64; +42 scatole, 3713 celle
  .→W 7120: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +33 scatole, 5628 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  .→D 4480: x36-50 y73-89 z66-73; x86-94 y74-90 z66-73; x35 y47-48 z12-22; +123 scatole, 1194 celle
  .→R 4383: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +22 scatole, 990 celle
  .→K 3355: x65 y66-76 z1-32; x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; +15 scatole, 2321 celle
  z→. 3328: x6-34 y36-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +9 scatole, 1675 celle
  t→S 2336: x66-94 y36-64 z0; x66-94 y66-94 z0; x36-47 y66-94 z0; +1 scatole, 306 celle
  .→V 2240: x45-51 y5 z12-21; x56-62 y5 z12-21; x65 y10-16 z12-21; +29 scatole, 2030 celle
  .→U 1962: x36-44 y95 z10-23; x56-64 y95 z10-23; x36-43 y5 z11-23; +49 scatole, 1606 celle
  E→. 1861: x0-5 y6-99 z0; x0-99 y0-2 z0; x96-99 y35-72 z0; +22 scatole, 845 celle
  b→S 1682: x36-64 y6-34 z0; x36-64 y36-64 z0
  .→u 1582: x36-44 y95 z42-55; x56-64 y95 z42-55; x35 y87-94 z43-55; +41 scatole, 1226 celle
  .→i 900: x35 y36-53 z39-41; x71-86 y95 z68-70; x35 y22-33 z39-41; +50 scatole, 762 celle
  .→h 348: x36-64 y5 z38; x35 y6-34 z38; x65 y6-34 z38; +9 scatole, 261 celle
  .→L 344: x26-34 y20 z1-8; x66-74 y20 z1-8; x80 y26-34 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  s→S 165: x50-64 y66-76 z0
  X→S 163: x66-94 y35 z0; x95 y36-64 z0; x35 y66-94 z0; +4 scatole, 76 celle
  w→S 116: x36-64 y5 z0; x35 y6-34 z0; x65 y6-34 z0; +1 scatole, 29 celle
  I→S 93: x65-83 y65 z0; x96-97 y73-77 z0; x96-97 y80-84 z0; +12 scatole, 54 celle
  J→S 47: x65 y36-64 z0; x47-64 y65 z0
  i→S 23: x39-43 y3-4 z0; x51-55 y3-4 z0; x35 y5 z0; +2 scatole, 2 celle
  h→S 22: x49-64 y35 z0; x36-41 y35 z0
  H→S 22: x84-94 y65 z0; x65 y84-94 z0
  j→S 11: x36-46 y65 z0
  d→S 11: x48 y66-76 z0
  c→S 11: x49 y66-76 z0
  y→S 11: x65 y66-76 z0
  M→S 11: x45-55 y95 z0
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
  e→S 7: x42-48 y35 z0
  .→G 7: x42-48 y35 z9
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
```
