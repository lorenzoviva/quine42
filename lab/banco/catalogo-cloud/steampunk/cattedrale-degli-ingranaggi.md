# cattedrale-degli-ingranaggi (steampunk)

Programma: `cattedrale-degli-ingranaggi.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 674 | 2 | 6 | — | 0,00 | 0 | 0 | 7 | 31 | scarto 0,03, alta 1,50 | — |
| 2 | 638 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 27 | scarto 0,03, alta 1,50 | — |
| 3 | 539 | 2 | 5 | — | 0,00 | 0 | 0 | 7 | 28 | scarto 0,03, alta 1,50 | — |
| 4 | 743 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 32 | scarto 0,03, alta 1,50 | — |
| 5 | 814 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 37 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,70, colore 0,13, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 814 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1275 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 23 | scarto 0,03, alta 1,88 | — |
| 2 | 1911 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 33 | scarto 0,03, alta 1,88 | — |
| 3 | 1497 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 28 | scarto 0,03, alta 1,88 | — |
| 4 | 1478 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 26 | scarto 0,03, alta 1,88 | — |
| 5 | 1544 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 43 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,65, colore 0,13, pianta 0,35, perimetro 0,19, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1911 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 68 nodi, 617 passi, finito in 754 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 8=rame, N=browN, E=Emerald, z=z, a=fondazione, x=botti cerchiate, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon, y=yellow, g=green, s=slate, c=mattoni della ciminiera, d=dead, dark, H=Honey, b=black, n=lanterna, e=emerald, q=guglia d’ottone, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=legno oliato (base), r=red, A=basolato, R=lamiera di ghisa, S=mattoni cotti, C=mattoni rossi, W=mattoni chiari, U=mattoni rossi (fascia), F=tavolato annerito, u=mattoni chiari (fascia), K=ferro battuto, Y=gradino d’ottone (testa), T=gradino d’ottone, k=porta ferrata, L=legno oliato, D=ghisa, V=vetro ambrato.
Alla fine: R 38623, S 13181, C 10764, W 7720, F 6607, K 3355, V 2450, U 1854, D 1550, u 1366, 8 396, L 344, k 330, A 44, G 43, T 11, Y 11.
#2-57 prl×15, all×31, one×9: 72221 celle x1-98 y1-99 z0-67, passi 1-538
  .→C 10764: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +54 scatole, 8714 celle
  .→S 8424: x65-95 y35-95 z64; x66-95 y35-95 z32; x35-64 y65-95 z64; +46 scatole, 3773 celle
  .→W 7720: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +35 scatole, 6228 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  E→S 4756: x66-80 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +23 scatole, 2466 celle
  .→R 4403: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +24 scatole, 1010 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3323: x6-33 y42-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +17 scatole, 1867 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→8 396: x34 y24 z1-66; x81 y34 z1-66; x88 y34 z1-66; +3 scatole, 198 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x66-74 y20 z1-8; x80 y26-34 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x66-74 y20 z0; x80 y26-34 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#58-68 all×8, one×1, prl×1: 46738 celle x0-99 y0-99 z0-79, passi 539-617
  .→R 34220: x67-93 y37-93 z66-67; x68-92 y38-92 z68-69; x69-91 y39-91 z70-71; +113 scatole, 25954 celle
  z→. 3323: x6-33 y42-64 z0; x6-34 y6-19 z0; x66-94 y6-19 z0; +17 scatole, 1867 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1840: x0-5 y6-99 z0; x0-99 y0-2 z0; x95-99 y6-34 z0; +26 scatole, 831 celle
  U→V 1330: x45-51 y5 z12-21; x56-62 y5 z12-21; x35 y8-14 z12-21; +16 scatole, 1120 celle
  u→V 1120: x74-80 y35 z44-53; x85-91 y35 z44-53; x95 y38-44 z44-53; +13 scatole, 910 celle
  U→D 722: x95 y37-63 z11; x83-84 y35 z12-22; x95 y45-46 z12-22; +63 scatole, 651 celle
  u→D 608: x95 y37-63 z43; x35 y67-93 z43; x95 y45-46 z44-54; +53 scatole, 532 celle
  .→D 220: x36 y36-52 z34-41; x51-64 y70 z74-79
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#63 all ***/*.*/*** *q*/qqq/*q* → ***/*q*/*** ***/***/*** passi=5: in quel momento nella griglia non c'erano celle "q"
```
