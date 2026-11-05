# officina-meccanica (steampunk)

Programma: `officina-meccanica.xml` · classe `struttura` (bersaglio `grande`) · **cantina** (`suolo="E"`, `ground="Z"`, `sotto: 1`) · esito: **passa**

Misurato con `lab/banco/catalogo-cloud/valida-generatore.ts` (le funzioni di `misure.ts` e `varianza.ts`), 5 semi, taglie grande e enorme. Tempo massimo del catalogo: 4500 ms a ogni seme.

## grande: 100 × 100 × 100, 20 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1384 | 2 | 4 | 2,11 | 0,00 | 0 | 0 | 5 | 29 | scarto 0,03, alta 1,50 | — |
| 2 | 1445 | 2 | 4 | 1,82 | 0,00 | 0 | 0 | 4 | 30 | scarto 0,03, alta 1,50 | — |
| 3 | 1262 | 2 | 3 | 1,83 | 0,00 | 0 | 0 | 4 | 29 | scarto 0,03, alta 1,50 | — |
| 4 | 1472 | 2 | 3 | 2,13 | 0,00 | 0 | 0 | 6 | 21 | scarto 0,03, alta 1,50 | — |
| 5 | 1582 | 2 | 4 | 2,13 | 0,00 | 0 | 0 | 4 | 28 | scarto 0,03, alta 1,50 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,65, colore 0,15, pianta 0,33, perimetro 0,19, interno 0,73, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 1582 ms.

## enorme: 120 × 120 × 112, 16 voxel per casella

| seme | ms | piani | stanze | cantina | murato | non raggiunti | staccati | salti | finestre | porta | difetti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2364 | 3 | 4 | 3,31 | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 2 | 2609 | 3 | 4 | 3,35 | 0,00 | 0 | 0 | 5 | 27 | scarto 0,03, alta 1,88 | — |
| 3 | 2403 | 3 | 4 | 3,31 | 0,00 | 0 | 0 | 8 | 33 | scarto 0,03, alta 1,88 | — |
| 4 | 2355 | 3 | 4 | 2,88 | 0,00 | 0 | 0 | 8 | 27 | scarto 0,03, alta 1,88 | — |
| 5 | 2811 | 3 | 5 | 2,93 | 0,00 | 0 | 0 | 5 | 27 | scarto 0,03, alta 1,88 | — |

Varianza su 5 semi (mediane delle coppie): voxel 0,69, colore 0,14, pianta 0,34, perimetro 0,30, interno 0,81, liste di piani 1, di stanze 2, architetture 5/5. Sopra le soglie di `varianza.ts`. Tempo massimo: 2811 ms.

## Piani del seme 1 a grande

| quota (caselle) | area (caselle²) | testa | stanze |
|---|---|---|---|
| 0,10 | 3,16 | 1,50 | 2 |
| 1,70 | 3,02 | 1,50 | 2 |

## Traccia del seme 1 a grande (`src/mj/trace.ts`, forma «differenze»)

```text
Traccia, seme 1: griglia 100×100×100, 80 nodi, 716 passi, finito in 1327 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: 8=rame, N=browN, E=Emerald, z=z, a=fondazione, x=botti cerchiate, Q=aQua, p=purple, l=light, t=teal, O=Orange, P=Purple, m=magenta, o=orange, v=neon, y=yellow, g=green, s=slate, c=mattoni della ciminiera, d=dead, dark, H=Honey, b=black, q=ardesia, w=white, X=X, i=merli, I=Indigo, J=Jungle, j=jungle, M=Magenta, G=legno oliato (base), r=red, A=basolato, R=lamiera di ghisa, S=mattoni cotti, C=mattoni rossi, W=mattoni chiari, U=mattoni rossi (fascia), F=tavolato annerito, u=mattoni chiari (fascia), K=ferro battuto, Y=gradino d’ottone (testa), T=gradino d’ottone, k=porta ferrata, L=legno oliato, Z=Z, D=ghisa, V=vetro ambrato.
Alla fine: R 20149, S 11184, C 9671, W 6036, F 4903, K 4819, a 3696, V 2800, U 2234, A 1755, D 1520, u 1258, x 1008, 8 528, k 330, L 288, G 36, c 35, Y 11, T 11.
#2-63 prl×16, all×35, one×7: 68549 celle x1-98 y1-99 z20-87, passi 1-565
  .→C 9671: x17-34 y65 z21-51; x5 y36-95 z21-29; x95 y36-95 z21-29; +52 scatole, 8033 celle
  .→S 8322: x65-95 y35-95 z52; x5-35 y35-95 z84; x5-35 y35-65 z52; +31 scatole, 3579 celle
  .→W 6036: x17-34 y65 z54-83; x5 y36-95 z54-61; x6-64 y95 z54-61; +30 scatole, 4544 celle
  .→F 4903: x6-34 y36-64 z21; x6-34 y36-64 z53; x17-34 y66-94 z21; +13 scatole, 2699 celle
  .→U 4718: x6-34 y35 z30-43; x66-94 y35 z30-43; x5 y36-64 z30-43; +10 scatole, 3500 celle
  .→R 4364: x66-94 y36-94 z53; x6-34 y36-94 z85; x36-64 y66-94 z85; +17 scatole, 101 celle
  E→z 3325: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +12 scatole, 1324 celle
  .→u 3094: x6-34 y35 z62-75; x5 y36-64 z62-75; x35 y36-64 z62-75; +6 scatole, 1876 celle
  E→S 3038: x5-35 y35-95 z20; x36-64 y65-95 z20; x95 y35-95 z20; +16 scatole, 187 celle
  E→l 1711: x66-94 y36-94 z20
  .→8 528: x96 y62-63 z21-86; x94 y34 z21-86; x36 y48 z21-86; +4 scatole, 264 celle
  .→K 352: x35 y66-76 z21-52
  .→k 330: x45-55 y95 z22-51
  .→L 288: x20 y26-34 z21-28; x80 y26-34 z21-28; x56-64 y50 z21-28; +1 scatole, 72 celle
  E→A 44: x45-55 y96-99 z20
  E→G 36: x20 y26-34 z20; x80 y26-34 z20; x56-64 y50 z20; +1 scatole, 9 celle
  .→N 12: x67 y84-94 z21; x66 y83 z21
  .→Y 11: x51 y66-76 z21
  .→T 11: x52 y66-76 z21
  .→m 11: x66 y84-94 z21
  N→z 1: x50 y50 z20
#64-70 prl×2, all×5: 43138 celle x65-95 y35-95 z0-21, passi 566-602
  .→a 3344: x65 y36-94 z1-19; x95 y36-94 z1-19; x66-94 y35 z1-19; +1 scatole, 551 celle
  .→A 1711: x66-94 y36-94 z9
  l→. 1711: x66-94 y36-94 z20
  .→K 198: x80-85 y84-94 z12; x74-79 y84-94 z15; x68-73 y84-94 z18
  Z→a 176: x65 y36-94 z0; x95 y36-94 z0; x66-94 y35 z0; +1 scatole, 29 celle
  S→a 176: x65 y36-94 z20; x95 y36-94 z20; x66-94 y35 z20; +1 scatole, 29 celle
  N→K 12: x67 y84-94 z21; x66 y83 z21
  m→K 11: x66 y84-94 z21
#71-80 all×7, one×2, prl×1: 40741 celle x0-99 y0-99 z0-99, passi 603-716
  .→R 15785: x67-93 y37-93 z54; x7-33 y37-93 z86; x68-92 y38-92 z55; +37 scatole, 11332 celle
  Z→. 9824: x0-64 y36-99 z0; x0-99 y0-34 z0; x66-94 y36-94 z0; +6 scatole, 453 celle
  .→K 4224: x67-79 y84-94 z12-14; x67-85 y84-94 z10-11; x36-51 y66-76 z22-23; +18 scatole, 3025 celle
  z→. 3326: x36-64 y6-34 z20; x6-34 y6-25 z20; x66-94 y6-25 z20; +12 scatole, 1325 celle
  E→. 1845: x0-99 y0-5 z20; x0-5 y6-34 z20; x95-99 y6-34 z20; +26 scatole, 926 celle
  U→V 1610: x8-14 y35 z32-41; x20-26 y35 z32-41; x75-81 y35 z32-41; +20 scatole, 1400 celle
  u→V 1190: x8-14 y35 z64-73; x17-23 y35 z64-73; x26-32 y35 z64-73; +14 scatole, 980 celle
  .→x 1008: x79-81 y36-37 z10-51; x66-67 y58-60 z10-51; x66-67 y68-70 z10-51; +1 scatole, 252 celle
  U→D 874: x67-93 y95 z31; x22-23 y95 z32-42; x75-76 y95 z32-42; +83 scatole, 803 celle
  u→D 646: x7-33 y35 z63; x35 y37-63 z63; x65 y67-93 z63; +49 scatole, 565 celle
  .→c 35: x6 y72 z86-99; x32 y92 z88-99; x16 y44 z91-99
  Y→K 11: x51 y66-76 z21
  T→K 11: x52 y66-76 z21
  .→Y 11: x35 y66-76 z53
  .→T 11: x36 y66-76 z53
Senza effetto (non hanno mai cambiato una cella):
#47 one *** *** *** *** *** *** *** *** *** *** *** ***… → *** *** *** *** *** *** *** *** *** *** *** ***… passi=1: in quel momento nella griglia non c'erano celle "b"
#48 all ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… → ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **… (+1): in quel momento nella griglia non c'erano celle "n"
#49 one ********* ********* ********* ********* *******… → ********* ********* ********* ********* *******… passi=1: in quel momento nella griglia non c'erano celle "n"
#53 prl * * * * * * * * * * * * * * * * * * * * * * * *… → * * * * * * * * * * * * * * * * * * * * * * * *…: in quel momento nella griglia non c'erano celle "n"
```
