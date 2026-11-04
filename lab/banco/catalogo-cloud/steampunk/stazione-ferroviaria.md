# stazione-ferroviaria (steampunk)

Programma: `stazione-ferroviaria.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 595 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 28 | scarto 0,03, alta 1,50 | — |
| 2 | 746 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 32 | scarto 0,03, alta 1,50 | — |
| 3 | 619 | 2 | 5 | — | 0,00 | 0 | 0 | 5 | 27 | scarto 0,03, alta 1,50 | — |
| 4 | 723 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 35 | scarto 0,03, alta 1,50 | — |
| 5 | 783 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 37 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,68, colore 0,15, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 783 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1219 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 33 | scarto 0,03, alta 1,88 | — |
| 2 | 1341 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 30 | scarto 0,03, alta 1,88 | — |
| 3 | 1196 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 4 | 1264 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 25 | scarto 0,03, alta 1,88 | — |
| 5 | 1285 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 43 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,60, colore 0,12, pianta 0,34, perimetro 0,20, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1341 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 65 nodi, 602 passi, finito in 615 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 8=rame, N=browN, E=Emerald, z=z, a=fondazione, x=botti cerchiate, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni della ciminiera, d=dead, dark, H=Honey, b=black, n=quadrante dell’orologio, e=emerald, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno oliato (base), r=red, A=basolato, R=lamiera di ghisa, S=mattoni cotti, C=mattoni rossi, W=mattoni chiari, U=mattoni rossi (fascia), F=tavolato annerito, u=mattoni chiari (fascia), K=ferro battuto, Y=gradino d’ottone (testa), T=gradino d’ottone, k=porta ferrata, L=legno oliato, V=vetro ambrato, D=ghisa.
Alla fine: R 24476, S 13019, C 9524, F 6607, W 6520, K 3355, V 2310, U 1962, u 1474, D 1254, L 344, k 330, 8 264, A 44, G 43, c 22, T 11, Y 11.
#2-57 prl×15, all×31, one×9: 69405 celle x1-98 y1-99 z0-67, passi 1-532
  .→C 9524: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +50 scatole, 7474 celle
  .→S 8304: x65-95 y35-95 z64; x66-95 y35-95 z32; x35-64 y65-95 z64; +38 scatole, 3653 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  .→W 6520: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +31 scatole, 5028 celle
  E→S 4714: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +13 scatole, 1509 celle
  .→R 4363: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +20 scatole, 970 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3325: x66-94 y6-20 z0; x6-34 y36-49 z0; x6-33 y67-79 z0; +15 scatole, 2120 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x80 y26-34 z1-8; x26-34 y50 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  .→8 264: x34 y10 z1-66; x66 y21 z1-66; x34 y67 z1-66; +1 scatole, 66 celle
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x80 y26-34 z0; x26-34 y50 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#58-65 all×6, one×1, prl×1: 32259 celle x0-99 y0-99 z0-79, passi 533-602
  .→R 20113: x67-93 y37-93 z66; x68-92 y38-92 z67; x69-91 y39-91 z68; +159 scatole, 15980 celle
  z→. 3325: x66-94 y6-20 z0; x6-34 y36-49 z0; x6-33 y67-79 z0; +15 scatole, 2120 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1880: x0-5 y6-99 z0; x0-99 y0-2 z0; x96-99 y35-79 z0; +21 scatole, 836 celle
  U→V 1260: x43-49 y5 z12-21; x53-59 y5 z12-21; x65 y9-15 z12-21; +15 scatole, 1050 celle
  u→V 1050: x68-74 y35 z44-53; x77-83 y35 z44-53; x86-92 y35 z44-53; +12 scatole, 840 celle
  U→D 684: x42 y5 z12-22; x50 y5 z12-22; x52 y5 z12-22; +69 scatole, 651 celle
  u→D 570: x67-93 y35 z43; x75-76 y35 z44-54; x84-85 y35 z44-54; +47 scatole, 499 celle
  .→c 22: x68 y37 z67-79; x64 y71 z71-79
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
```
