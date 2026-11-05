# stazione-di-transito (futuristico)

Programma: `stazione-di-transito.xml` · classe `struttura` (bersaglio `grande`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 80, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 650 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,50 | — |
| 2 | 600 | 2 | 6 | — | 0,00 | 0 | 0 | 5 | 33 | scarto 0,03, alta 1,50 | — |
| 3 | 518 | 2 | 5 | — | 0,00 | 0 | 0 | 5 | 30 | scarto 0,03, alta 1,50 | — |
| 4 | 656 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 32 | scarto 0,03, alta 1,50 | — |
| 5 | 744 | 2 | 7 | — | 0,00 | 0 | 0 | 4 | 37 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,69, colore 0,16, pianta 0,56, perimetro 0,35, interno 0,68, liste di piani 1, di stanze 3, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 744 ms.

## enorme: 120 × 120 × 96, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1442 | 2 | 7 | — | 0,00 | 0 | 0 | 8 | 33 | scarto 0,03, alta 1,88 | — |
| 2 | 1427 | 2 | 7 | — | 0,00 | 0 | 0 | 6 | 31 | scarto 0,03, alta 1,88 | — |
| 3 | 1505 | 2 | 6 | — | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 4 | 1391 | 2 | 6 | — | 0,00 | 0 | 0 | 10 | 28 | scarto 0,03, alta 1,88 | — |
| 5 | 1303 | 2 | 7 | — | 0,00 | 0 | 0 | 5 | 46 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,62, colore 0,13, pianta 0,37, perimetro 0,20, interno 0,62, liste di piani 1, di stanze 2, architetture 4/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1505 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 5,56 | 1,50 | 4 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×80, 66 nodi, 608 passi, finito in 622 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: N=browN, E=Emerald, z=z, a=fondazione, x=serbatoi, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, v=neon ciano, y=yellow, g=green, s=slate, c=mattoni del camino, d=dead, dark, H=Honey, b=black, n=faro magenta, e=emerald, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, h=merlatura, j=jungle, M=Magenta, G=polimero (base), A=pista, R=pannelli solari, S=lega bianca, C=metallo bianco, W=composito, U=metallo bianco (fascia), F=pannelli del pavimento, u=composito (fascia), K=titanio, Y=gradino luminoso (testa), T=gradino luminoso, k=portello, L=polimero, V=vetro scuro, D=telaio nero.
Alla fine: R 23116, S 12504, C 9524, F 6607, W 6520, K 3355, D 2710, V 2310, U 1962, u 1474, v 511, L 344, k 330, A 44, G 43, T 11, Y 11.
#2-56 prl×15, all×31, one×8: 69133 celle x1-98 y1-99 z0-67, passi 1-528
  .→C 9524: x35 y6-95 z1-9; x65 y35-65 z10-31; x47-64 y65 z1-31; +50 scatole, 7474 celle
  .→S 7793: x36-64 y6-65 z32; x66-94 y36-94 z32; x66-94 y36-94 z64; +55 scatole, 2631 celle
  .→F 6607: x36-64 y6-34 z1; x66-94 y36-64 z1; x66-94 y36-64 z33; +17 scatole, 4084 celle
  .→W 6520: x66-83 y65 z34-63; x95 y36-95 z34-41; x36-94 y95 z34-41; +31 scatole, 5028 celle
  E→S 4710: x66-95 y35-95 z0; x56-65 y5-95 z0; x39-43 y3-95 z0; +9 scatole, 1505 celle
  .→R 4363: x66-94 y36-94 z65; x36-64 y6-34 z33; x36-64 y66-94 z65; +20 scatole, 970 celle
  .→U 3906: x36-64 y5 z10-23; x35 y6-34 z10-23; x65 y6-34 z10-23; +8 scatole, 2688 celle
  E→z 3328: x66-94 y6-25 z0; x6-34 y6-19 z0; x6-34 y36-49 z0; +9 scatole, 1936 celle
  .→u 3094: x66-94 y35 z42-55; x65 y36-64 z42-55; x95 y36-64 z42-55; +6 scatole, 1876 celle
  .→v 511: x36-64 y5 z32; x35 y6-34 z32; x65 y6-34 z32; +16 scatole, 424 celle
  .→K 352: x65 y66-76 z1-32
  .→L 344: x26-34 y20 z1-8; x80 y26-34 z1-8; x26-34 y50 z1-8; +2 scatole, 128 celle
  .→k 330: x45-55 y95 z2-31
  E→A 44: x45-55 y96-99 z0
  E→G 36: x26-34 y20 z0; x80 y26-34 z0; x26-34 y50 z0; +1 scatole, 9 celle
  .→T 11: x48 y66-76 z1
  .→Y 11: x49 y66-76 z1
  .→G 7: x42-48 y35 z9
  N→S 1: x50 y50 z0
#57-66 all×8, one×1, prl×1: 32337 celle x0-99 y0-99 z0-78, passi 529-608
  .→R 18753: x67-93 y37-93 z66; x68-92 y38-92 z67; x69-91 y39-91 z68; +136 scatole, 14620 celle
  z→. 3328: x66-94 y6-25 z0; x6-34 y6-19 z0; x6-34 y36-49 z0; +9 scatole, 1936 celle
  .→K 2981: x49-64 y66-76 z2-3; x50-64 y66-76 z4-5; x51-64 y66-76 z6-7; +13 scatole, 1991 celle
  E→. 1881: x0-5 y6-99 z0; x0-99 y0-2 z0; x96-99 y35-79 z0; +19 scatole, 837 celle
  .→D 1456: x43-52 y13-27 z41-48; x42-53 y89 z71-78; x41 y81-89 z71-78; +2 scatole, 88 celle
  U→V 1260: x38-44 y5 z12-21; x48-54 y5 z12-21; x35 y9-15 z12-21; +15 scatole, 1050 celle
  u→V 1050: x76-82 y35 z44-53; x86-92 y35 z44-53; x65 y39-45 z44-53; +12 scatole, 840 celle
  U→D 684: x35 y80-81 z12-22; x35 y72-89 z11; x37 y5 z12-22; +67 scatole, 633 celle
  u→D 570: x35 y67-93 z43; x35 y75-76 z44-54; x95 y83-84 z44-54; +49 scatole, 499 celle
  T→K 11: x48 y66-76 z1
  Y→K 11: x49 y66-76 z1
  .→T 11: x64 y66-76 z33
  .→Y 11: x65 y66-76 z33
Senza effetto (non hanno mai cambiato una cella):
#52 one **********/**********/**********/**********/***… → **********/**********/**********/**********/***… passi=4: le celle cercate c'erano, ma mai disposte come nel pattern
```
