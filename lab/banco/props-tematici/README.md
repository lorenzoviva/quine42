# Props tematici (Cantiere 2, parte B)

Quaranta modelli MarkovJunior nuovi, dieci per ognuna delle quattro ambientazioni della Genesi (`src/kernel/themes.ts`: medievale qui
detta fantasy/aurora, steampunk/orichalcum, moderno/neapolis, futuristico/sidera): arredi degli interni e oggetti caratteristici.
Ognuno è procedurale (il seme sceglie altezze, larghezze, varianti e dettagli), passa il validatore del gioco a cinque semi senza un
frammento staccato e ha una distanza media fra i semi ≥ 0,15 (media delle medie 0,40). Il banco e il metodo sono quelli di
[`../seme-procedurale/README.md`](../seme-procedurale/README.md); gli indici sono `index-<ambientazione>.json` (classe, nome,
ambientazione, che cosa sceglie il seme).

```bash
npx vite-node lab/banco/seme-procedurale/prova.ts -- lab/banco/props-tematici [id…]
```

Classi: gli arredi da una casella sono `mobile` (20³), le cose alte e strette `monumento` (20 × 20 × 60), quelle grandi su più caselle
`edificio` (50³), l'automa `persona`. L'automobile moderna è alta e da cartone perché `edificio` chiede almeno 30 voxel di altezza.

Limiti noti: in alcune coppie di semi le grandi scelte coincidono e cambia solo un dettaglio (le minime più basse: cassonetto 0,003,
antenna 0,004, scrivania 0,005); qualche variante non compare fra i semi 1..5 (il portapacchi dell'automobile, la scrivania a due schermi,
la pentola alta del calderone); gli avvisi rimasti sono «tocca i bordi» e «colori mai usati» (i colori delle varianti non scelte).

## I modelli

| modello | nome | classe | ambientazione | media | minima | voxel per seme | ms (max) |
|---|---|---|---|---|---|---|---|
| [`fantasy-altare-runico`](fantasy-altare-runico.md) | Altare runico | `mobile` | fantasy (aurora) | 0.390 | 0.038 | 1021 / 1407 / 1565 / 1017 / 1585 | 62 |
| [`fantasy-libreria-alchemica`](fantasy-libreria-alchemica.md) | Libreria alchemica | `mobile` | fantasy (aurora) | 0.496 | 0.251 | 957 / 913 / 1092 / 952 / 1151 | 33 |
| [`fantasy-calderone-bollente`](fantasy-calderone-bollente.md) | Calderone bollente | `mobile` | fantasy (aurora) | 0.351 | 0.048 | 1444 / 1433 / 888 / 1438 / 896 | 36 |
| [`fantasy-statua-guardiano`](fantasy-statua-guardiano.md) | Statua del guardiano | `monumento` | fantasy (aurora) | 0.261 | 0.111 | 4239 / 3018 / 3102 / 3541 / 3792 | 178 |
| [`fantasy-cristallo-arcano`](fantasy-cristallo-arcano.md) | Cristallo arcano | `mobile` | fantasy (aurora) | 0.483 | 0.107 | 1004 / 1001 / 1096 / 1000 / 1092 | 40 |
| [`fantasy-bancarella-mercato`](fantasy-bancarella-mercato.md) | Bancarella del mercato | `mobile` | fantasy (aurora) | 0.280 | 0.017 | 1382 / 1182 / 1920 / 1380 / 1792 | 27 |
| [`fantasy-gabbia-sospesa`](fantasy-gabbia-sospesa.md) | Gabbia sospesa | `monumento` | fantasy (aurora) | 0.566 | 0.085 | 1150 / 906 / 869 / 999 / 1020 | 176 |
| [`fantasy-trono-di-pietra`](fantasy-trono-di-pietra.md) | Trono di pietra | `mobile` | fantasy (aurora) | 0.424 | 0.078 | 854 / 864 / 1985 / 853 / 1926 | 42 |
| [`fantasy-fontana-antica`](fantasy-fontana-antica.md) | Fontana antica | `edificio` | fantasy (aurora) | 0.407 | 0.233 | 6238 / 4926 / 7156 / 6772 / 6272 | 1028 |
| [`fantasy-obelisco-inciso`](fantasy-obelisco-inciso.md) | Obelisco inciso | `monumento` | fantasy (aurora) | 0.210 | 0.040 | 3006 / 2998 / 2672 / 3008 / 2586 | 176 |
| [`futuristico-reattore-fusione`](futuristico-reattore-fusione.md) | Reattore a fusione | `edificio` | futuristico (sidera) | 0.246 | 0.121 | 10452 / 10742 / 11412 / 11644 / 10824 | 138 |
| [`futuristico-capsula-criogenica`](futuristico-capsula-criogenica.md) | Capsula criogenica | `mobile` | futuristico (sidera) | 0.369 | 0.304 | 710 / 1144 / 858 / 825 / 549 | 19 |
| [`futuristico-terminale-olografico`](futuristico-terminale-olografico.md) | Terminale olografico | `mobile` | futuristico (sidera) | 0.540 | 0.334 | 345 / 344 / 344 / 346 / 343 | 8 |
| [`futuristico-drone-cargo`](futuristico-drone-cargo.md) | Drone cargo | `mobile` | futuristico (sidera) | 0.362 | 0.007 | 711 / 603 / 607 / 463 / 602 | 18 |
| [`futuristico-lampione-plasma`](futuristico-lampione-plasma.md) | Lampione al plasma | `monumento` | futuristico (sidera) | 0.454 | 0.364 | 378 / 377 / 381 / 352 / 342 | 16 |
| [`futuristico-torretta-sensoriale`](futuristico-torretta-sensoriale.md) | Torretta sensoriale | `mobile` | futuristico (sidera) | 0.395 | 0.163 | 233 / 255 / 255 / 253 / 250 | 6 |
| [`futuristico-sintetizzatore-materia`](futuristico-sintetizzatore-materia.md) | Sintetizzatore di materia | `mobile` | futuristico (sidera) | 0.273 | 0.028 | 1769 / 1430 / 985 / 968 / 1420 | 11 |
| [`futuristico-cristallo-energetico`](futuristico-cristallo-energetico.md) | Cristallo energetico | `mobile` | futuristico (sidera) | 0.476 | 0.447 | 558 / 591 / 654 / 638 / 649 | 3 |
| [`futuristico-portale-teletrasporto`](futuristico-portale-teletrasporto.md) | Portale di teletrasporto | `edificio` | futuristico (sidera) | 0.195 | 0.015 | 5261 / 4654 / 3541 / 3537 / 4654 | 89 |
| [`futuristico-modulo-idroponico`](futuristico-modulo-idroponico.md) | Modulo botanico idroponico | `mobile` | futuristico (sidera) | 0.360 | 0.052 | 1030 / 806 / 642 / 630 / 795 | 6 |
| [`moderno-semaforo`](moderno-semaforo.md) | Semaforo stradale | `monumento` | moderno (neapolis) | 0.558 | 0.342 | 725 / 697 / 669 / 921 / 949 | 151 |
| [`moderno-cabina`](moderno-cabina.md) | Cabina telefonica o chiosco | `mobile` | moderno (neapolis) | 0.500 | 0.030 | 2913 / 2907 / 1128 / 1079 / 2866 | 39 |
| [`moderno-distributore`](moderno-distributore.md) | Distributore automatico | `mobile` | moderno (neapolis) | 0.346 | 0.012 | 2273 / 2883 / 1910 / 1911 / 2893 | 37 |
| [`moderno-panchina`](moderno-panchina.md) | Panchina con lampione | `monumento` | moderno (neapolis) | 0.630 | 0.017 | 923 / 524 / 359 / 359 / 927 | 176 |
| [`moderno-cassonetto`](moderno-cassonetto.md) | Cassonetto e differenziata | `mobile` | moderno (neapolis) | 0.406 | 0.003 | 1750 / 1237 / 1941 / 2023 / 1237 | 52 |
| [`moderno-automobile`](moderno-automobile.md) | Automobile compatta | `edificio` | moderno (neapolis) | 0.207 | 0.020 | 14421 / 21985 / 19193 / 18781 / 22438 | 823 |
| [`moderno-scrivania`](moderno-scrivania.md) | Scrivania con terminale | `mobile` | moderno (neapolis) | 0.597 | 0.005 | 919 / 844 / 721 / 721 / 844 | 45 |
| [`moderno-scaffale`](moderno-scaffale.md) | Scaffale industriale | `mobile` | moderno (neapolis) | 0.626 | 0.454 | 428 / 778 / 477 / 424 / 598 | 25 |
| [`moderno-antenna`](moderno-antenna.md) | Antenna ripetitore | `monumento` | moderno (neapolis) | 0.447 | 0.004 | 1162 / 942 / 626 / 858 / 942 | 93 |
| [`moderno-generatore`](moderno-generatore.md) | Generatore diesel | `mobile` | moderno (neapolis) | 0.508 | 0.075 | 1503 / 788 / 1853 / 1779 / 850 | 41 |
| [`steampunk-caldaia-a-pressione`](steampunk-caldaia-a-pressione.md) | Caldaia a pressione | `mobile` | steampunk (orichalcum) | 0.265 | 0.052 | 1749 / 1215 / 1679 / 1146 / 1008 | 9 |
| [`steampunk-ingranaggio-monumentale`](steampunk-ingranaggio-monumentale.md) | Ingranaggio monumentale | `monumento` | steampunk (orichalcum) | 0.400 | 0.019 | 1610 / 1772 / 1602 / 1762 / 1606 | 9 |
| [`steampunk-lampione-a-gas`](steampunk-lampione-a-gas.md) | Lampione a gas in ottone | `monumento` | steampunk (orichalcum) | 0.453 | 0.281 | 483 / 485 / 629 / 633 / 401 | 40 |
| [`steampunk-banco-da-orologiaio`](steampunk-banco-da-orologiaio.md) | Banco da orologiaio | `mobile` | steampunk (orichalcum) | 0.269 | 0.118 | 612 / 649 / 631 / 618 / 577 | 6 |
| [`steampunk-automa-a-molla`](steampunk-automa-a-molla.md) | Automa a molla | `persona` | steampunk (orichalcum) | 0.178 | 0.037 | 846 / 923 / 924 / 1070 / 847 | 16 |
| [`steampunk-dirigibile-da-attracco`](steampunk-dirigibile-da-attracco.md) | Dirigibile da attracco | `edificio` | steampunk (orichalcum) | 0.605 | 0.011 | 4076 / 4101 / 4076 / 4096 / 4074 | 37 |
| [`steampunk-pompa-idraulica`](steampunk-pompa-idraulica.md) | Pompa idraulica | `mobile` | steampunk (orichalcum) | 0.251 | 0.083 | 466 / 507 / 503 / 679 / 607 | 16 |
| [`steampunk-archivio-pneumatico`](steampunk-archivio-pneumatico.md) | Archivio pneumatico | `mobile` | steampunk (orichalcum) | 0.276 | 0.152 | 1230 / 1049 / 939 / 1526 / 1126 | 10 |
| [`steampunk-stufa-in-ghisa`](steampunk-stufa-in-ghisa.md) | Stufa in ghisa | `mobile` | steampunk (orichalcum) | 0.306 | 0.007 | 1066 / 535 / 1067 / 537 / 1064 | 8 |
| [`steampunk-telegrafo-a-vapore`](steampunk-telegrafo-a-vapore.md) | Telegrafo a vapore | `mobile` | steampunk (orichalcum) | 0.436 | 0.023 | 412 / 421 / 399 / 411 / 423 | 7 |
