# Lo Scenografo misurato (T303): villetta, fattoria, tre vie

Ogni costo è in dollari al listino API di Anthropic dai token che la CLI riporta (Opus 5.5, sforzo `low`); accanto quello che la CLI stessa dice (`total_cost_usd`). I semi dell'edificio sono 4; «regge» è la guardia e le misure del banco (`regge` di `scenografo.ts`) con al più 4 semi d'arredo.

| edificio | via | richiesta | costo (listino API) | costo detto dalla CLI | chiamate | correzioni | token in (cache) | token out | secondi | regge al primo | regge entro 4 | pezzi (media) | stanze arredate | animali liberi | piani prima → dopo | perso | varianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| villetta | (a) insieme | 1 | 0,59 $ (+ 0,01 $ dell'Artista) | 0,59 $ | 2 | 0 | 25230 (16062) | 25765 | 291 | voto 8 | — | 6,00 | 8/8 | 100 % | 2→2 | stanze, salti | — |
| villetta | (a) insieme | 2 | 0,69 $ (+ 0,01 $ dell'Artista) | 0,69 $ | 3 | 1 | 40889 (26024) | 28084 | 289 | voto 9 | — | 7,00 | 9/9 | 100 % | 2→2 | stanze | — |
| villetta | (b) programma | 1 | 0,08 $ | 0,08 $ | 1 | 0 | 5952 (0) | 1538 | 15 | 4/4 | 4/4 | 12,00 | 8/8 | 100 % | 2→2 | — | 0,93 |
| villetta | (b) programma | 2 | 0,06 $ | 0,06 $ | 1 | 0 | 5950 (5591) | 2894 | 24 | 4/4 | 4/4 | 1,50 | 4/8 | 100 % | 2→2 | — | 0,84 |
| villetta | (c) dati | 1 | 0,02 $ | 0,02 $ | 1 | 0 | 2539 (0) | 172 | 3 | 2/4 | 4/4 | 4,00 | 8/8 | 100 % | 2→2 | stanza | 0,82 |
| villetta | (c) dati | 2 | 0,01 $ | 0,01 $ | 1 | 0 | 2540 (2180) | 172 | 4 | 2/4 | 4/4 | 4,00 | 8/8 | 100 % | 2→2 | stanza | 0,82 |
| fattoria | (a) insieme | 1 | 0,39 $ (+ 0,01 $ dell'Artista) | 0,39 $ | 2 | 0 | 25139 (16062) | 15840 | 172 | voto 8 | — | 5,00 | 8/8 | 100 % | 2→2 | stanze | — |
| fattoria | (a) insieme | 2 | 1,32 $ (+ 0,00 $ dell'Artista) | 1,32 $ | 4 | 2 | 94287 (34057) | 41448 | 407 | no: nessun programma valido | — | — | — | — | — | — | — |
| fattoria | (b) programma | 1 | 0,08 $ | 0,08 $ | 1 | 0 | 6032 (4370) | 3138 | 25 | 4/4 | 4/4 | 10,00 | 8/8 | 100 % | 2→2 | — | 0,83 |
| fattoria | (b) programma | 2 | 0,07 $ | 0,07 $ | 1 | 0 | 6032 (5672) | 3240 | 27 | 4/4 | 4/4 | 2,00 | 8/8 | 100 % | 2→2 | — | 0,89 |
| fattoria | (c) dati | 1 | 0,02 $ | 0,02 $ | 1 | 0 | 2621 (959) | 221 | 4 | 3/4 | 4/4 | 3,50 | 7/8 | 100 % | 2→2 | — | 0,74 |
| fattoria | (c) dati | 2 | 0,01 $ | 0,01 $ | 1 | 0 | 2621 (2261) | 194 | 4 | 3/4 | 4/4 | 3,50 | 7/8 | 100 % | 2→2 | — | 0,74 |
