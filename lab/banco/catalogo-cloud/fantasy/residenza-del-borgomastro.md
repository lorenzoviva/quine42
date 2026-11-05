# residenza-del-borgomastro (fantasy)

Programma: `residenza-del-borgomastro.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 957 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 28 | scarto 0,03, alta 1,50 | — |
| 2 | 713 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 29 | scarto 0,03, alta 1,50 | — |
| 3 | 941 | 2 | 5 | — | 0,00 | 0 | 0 | 7 | 27 | scarto 0,03, alta 1,50 | — |
| 4 | 742 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |
| 5 | 684 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 28 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,69, colore 0,11, pianta 0,55, perimetro 0,37, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 957 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1477 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 31 | scarto 0,03, alta 1,88 | — |
| 2 | 1375 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 28 | scarto 0,03, alta 1,88 | — |
| 3 | 1394 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,88 | — |
| 4 | 1345 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 29 | scarto 0,03, alta 1,88 | — |
| 5 | 1878 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 43 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,61, colore 0,12, pianta 0,33, perimetro 0,23, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1878 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 66 nodi, 615 passi, finito in 940 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 4=ringhiera di legno, 5=balcone di legno, 9=ferro, N=browN, E=Emerald, z=z, a=fondazione, x=botti di rovere, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno di castagno (base), A=acciottolato, S=pietra squadrata, R=coppi, C=pietra grezza, W=intonaco a calce, U=pietra grezza (fascia), F=assi di quercia, u=intonaco a calce (fascia), K=pietra della scala, Y=gradino di pietra (testa), T=gradino di pietra, k=portone, L=legno di castagno, D=travi scure, V=vetro piombato.
Alla fine: R 26439, S 13087, C 9524, F 6607, W 6520, K 3355, V 2380, U 1854, D 1604, u 1474, L 344, k 330, 9 108, A 44, G 43, T 11, Y 11.
#2-56 prl×15, all×31, one×9: 69457 celle x1-98 y1-99 z0-67, passi 1-532
  .→C 9524: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +50 scatole, 7474 celle
  .→S 8376: x65-95 y35-95 z64; x76-95 y35-95 z32; x35-64 y65-95 z64; +43 scatole, 4335 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  .→W 6520: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +31 scatole, 5028 celle
  E→S 4710: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +9 scatole, 1505 celle
  .→R 4363: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +20 scatole, 970 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3292: x66-94 y6-25 z0; x6-34 y6-19 z0; x6-34 y36-49 z0; +13 scatole, 1900 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x80 y26-34 z1-8; x26-34 y50 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  .→9 108: x67-75 y33 z33-35; x97 y51-59 z33-35; x97 y70-78 z33-35; +1 scatole, 27 celle
  E→. 72: x67-75 y33-34 z0; x96-97 y51-59 z0; x96-97 y70-78 z0; +1 scatole, 18 celle
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x80 y26-34 z0; x26-34 y50 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#57-66 all×8, one×1, prl×1: 34552 celle x0-99 y0-99 z0-78, passi 533-615
  .→R 22076: x67-93 y37-93 z66; x68-92 y38-92 z67; x69-91 y39-91 z68; +204 scatole, 17943 celle
  z→. 3292: x66-94 y6-25 z0; x6-34 y6-19 z0; x6-34 y36-49 z0; +13 scatole, 1900 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1845: x0-5 y6-99 z0; x0-99 y0-2 z0; x95-99 y6-34 z0; +21 scatole, 836 celle
  U→V 1330: x40-46 y5 z12-21; x49-55 y5 z12-21; x35 y8-14 z12-21; +16 scatole, 1120 celle
  u→V 1050: x75-81 y35 z44-53; x85-91 y35 z44-53; x65 y39-45 z44-53; +12 scatole, 840 celle
  U→D 722: x35 y37-63 z11; x47-48 y5 z12-22; x35 y45-46 z12-22; +65 scatole, 651 celle
  u→D 570: x95 y67-93 z43; x65 y46-47 z44-54; x47-48 y65 z44-54; +47 scatole, 499 celle
  .→D 312: x45-61 y71 z71-78; x39-52 y9 z37-44; x39 y10-17 z37-44
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
```
