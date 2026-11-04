# palazzina-degli-inventori (steampunk)

Programma: `palazzina-degli-inventori.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 632 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 26 | scarto 0,03, alta 1,50 | — |
| 2 | 792 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 32 | scarto 0,03, alta 1,50 | — |
| 3 | 826 | 2 | 5 | — | 0,00 | 0 | 0 | 7 | 29 | scarto 0,03, alta 1,50 | — |
| 4 | 650 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 33 | scarto 0,03, alta 1,50 | — |
| 5 | 746 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 39 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,67, colore 0,12, pianta 0,56, perimetro 0,37, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 826 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1330 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 30 | scarto 0,03, alta 1,88 | — |
| 2 | 1307 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 29 | scarto 0,03, alta 1,88 | — |
| 3 | 1718 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 4 | 1332 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 28 | scarto 0,03, alta 1,88 | — |
| 5 | 1445 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 46 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,58, colore 0,13, pianta 0,33, perimetro 0,23, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1718 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 65 nodi, 596 passi, finito in 603 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 4=ringhiera di ghisa, 5=balcone, 8=rame, 9=ottone, N=browN, E=Emerald, z=z, a=fondazione, x=botti cerchiate, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni della ciminiera, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno oliato (base), r=red, A=basolato, S=mattoni cotti, R=lamiera di ghisa, C=mattoni rossi, W=mattoni chiari, U=mattoni rossi (fascia), F=tavolato annerito, u=mattoni chiari (fascia), K=ferro battuto, Y=gradino d’ottone (testa), T=gradino d’ottone, k=porta ferrata, L=legno oliato, D=ghisa, V=vetro ambrato.
Alla fine: R 18845, S 13091, C 9524, F 6607, W 6520, K 3355, V 2240, U 1962, u 1582, D 1216, L 344, k 330, 8 264, 9 108, A 44, G 43, c 18, T 11, Y 11.
#2-57 prl×15, all×31, one×10: 69729 celle x1-98 y1-99 z0-67, passi 1-536
  .→C 9524: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +50 scatole, 7474 celle
  .→S 8376: x65-95 y35-95 z64; x35-64 y65-95 z64; x56-65 y5-65 z32; +44 scatole, 4945 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  .→W 6520: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +31 scatole, 5028 celle
  E→S 4714: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +13 scatole, 1509 celle
  .→R 4363: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +20 scatole, 970 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3289: x66-94 y6-20 z0; x6-34 y36-49 z0; x6-33 y67-79 z0; +19 scatole, 2084 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x80 y26-34 z1-8; x26-34 y50 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  .→8 264: x34 y10 z1-66; x66 y21 z1-66; x34 y67 z1-66; +1 scatole, 66 celle
  .→9 108: x68-76 y33 z33-35; x82-90 y33 z33-35; x97 y47-55 z33-35; +1 scatole, 27 celle
  E→. 72: x68-76 y33-34 z0; x82-90 y33-34 z0; x96-97 y47-55 z0; +1 scatole, 18 celle
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x80 y26-34 z0; x26-34 y50 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#58-65 all×6, one×1, prl×1: 26444 celle x0-99 y0-99 z0-78, passi 537-596
  .→R 14482: x67-93 y37-93 z66-67; x68-92 y38-92 z68-69; x37-64 y67-93 z66-67; +25 scatole, 7142 celle
  z→. 3289: x66-94 y6-20 z0; x6-34 y36-49 z0; x6-33 y67-79 z0; +19 scatole, 2084 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1844: x0-5 y6-99 z0; x0-99 y0-2 z0; x95-99 y6-34 z0; +24 scatole, 835 celle
  U→V 1260: x38-44 y5 z12-21; x52-58 y5 z12-21; x35 y14-20 z12-21; +15 scatole, 1050 celle
  u→V 980: x76-82 y35 z44-53; x86-92 y35 z44-53; x95 y41-47 z44-53; +11 scatole, 770 celle
  U→D 684: x79-80 y35 z12-22; x71-88 y35 z11; x37 y5 z12-22; +67 scatole, 633 celle
  u→D 532: x65 y53-54 z44-54; x81-82 y95 z44-54; x65 y45-62 z43; +49 scatole, 470 celle
  .→c 18: x56 y12 z38-46; x49 y86 z70-78
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
```
