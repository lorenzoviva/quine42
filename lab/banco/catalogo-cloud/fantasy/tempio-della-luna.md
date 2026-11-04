# tempio-della-luna (fantasy)

Programma: `tempio-della-luna.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 729 | 2 | 6 | — | 0,00 | 0 | 0 | 6 | 28 | scarto 0,03, alta 1,50 | — |
| 2 | 794 | 2 | 6 | — | 0,00 | 0 | 0 | 7 | 31 | scarto 0,03, alta 1,50 | — |
| 3 | 643 | 2 | 5 | — | 0,00 | 0 | 0 | 7 | 27 | scarto 0,03, alta 1,50 | — |
| 4 | 777 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |
| 5 | 837 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 33 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,70, colore 0,14, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 837 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1365 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 25 | scarto 0,03, alta 1,88 | — |
| 2 | 1553 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,88 | — |
| 3 | 1471 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 24 | scarto 0,03, alta 1,88 | — |
| 4 | 1468 | 2 | 6 | — | 0,00 | 0 | 0 | 7 | 25 | scarto 0,03, alta 1,88 | — |
| 5 | 1546 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 41 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,65, colore 0,11, pianta 0,35, perimetro 0,23, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1553 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 67 nodi, 612 passi, finito in 835 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=browN, E=Emerald, z=z, a=fondazione, x=botti di rovere, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=cuspide d’oro, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno di castagno (base), A=acciottolato, R=gradoni dorati, S=pietra squadrata, C=pietra grezza, W=marmo, U=pietra grezza (fascia), F=assi di quercia, u=marmo (fascia), K=pietra della scala, Y=gradino di pietra (testa), T=gradino di pietra, k=portone, L=legno di castagno, D=travi scure, V=vetro piombato.
Alla fine: R 34745, S 13255, C 11384, W 8320, F 6607, K 3355, V 2450, D 2074, U 1854, u 1366, L 344, k 330, A 44, G 43, T 11, Y 11.
#2-56 prl×15, all×31, one×8: 73153 celle x1-98 y1-99 z0-67, passi 1-534
  .→C 11384: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +56 scatole, 9334 celle
  .→S 8484: x65-95 y35-95 z64; x66-95 y35-95 z32; x35-64 y65-95 z64; +50 scatole, 3833 celle
  .→W 8320: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +37 scatole, 6828 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  E→S 4770: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +15 scatole, 1565 celle
  .→R 4423: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +26 scatole, 1030 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3328: x6-34 y6-34 z0; x66-94 y6-19 z0; x6-34 y36-49 z0; +9 scatole, 1675 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x66-74 y20 z1-8; x80 y26-34 z1-8; x26-34 y50 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  E→A 44: x45-55 y96-99 z0
  E→G 36: x66-74 y20 z0; x80 y26-34 z0; x26-34 y50 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#57-67 all×8, one×1, prl×1: 43350 celle x0-99 y0-99 z0-79, passi 535-612
  .→R 30322: x67-93 y37-93 z66-67; x68-92 y38-92 z68-69; x69-91 y39-91 z70-71; +90 scatole, 22056 celle
  z→. 3328: x6-34 y6-34 z0; x66-94 y6-19 z0; x6-34 y36-49 z0; +9 scatole, 1675 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1821: x0-5 y6-99 z0; x0-99 y0-2 z0; x95-99 y6-34 z0; +26 scatole, 812 celle
  U→V 1330: x40-46 y5 z12-21; x56-62 y5 z12-21; x65 y12-18 z12-21; +16 scatole, 1120 celle
  u→V 1120: x68-74 y35 z44-53; x81-87 y35 z44-53; x95 y38-44 z44-53; +13 scatole, 910 celle
  .→D 744: x41-55 y80-89 z76-79; x39-48 y69 z72-79; x39 y70-77 z72-79
  U→D 722: x35 y37-63 z11; x83-84 y35 z12-22; x35 y45-46 z12-22; +67 scatole, 651 celle
  u→D 608: x95 y37-63 z43; x35 y67-93 z43; x95 y45-46 z44-54; +51 scatole, 532 celle
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#62 all ***/*.*/*** *q*/qqq/*q* → ***/*q*/*** ***/***/*** passi=5: in quel momento nella griglia non c'erano celle "q"
```
