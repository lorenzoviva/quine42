# Lo Scenografo misurato (T406, gli edifici a 16 voxel per casella): villetta, fattoria, tre vie

Ogni costo è in dollari al listino API di Anthropic dai token che la CLI riporta (Opus 5.5, sforzo `low`); accanto quello che la CLI stessa dice (`total_cost_usd`). I semi dell'edificio sono 4; «regge» è la guardia e le misure del banco (`regge` di `scenografo.ts`) con al più 4 semi d'arredo.

| edificio | via | richiesta | costo (listino API) | costo detto dalla CLI | chiamate | correzioni | token in (cache) | token out | secondi | regge al primo | regge entro 4 | pezzi (media) | stanze arredate | animali liberi | piani prima → dopo | perso | varianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| villetta | (a) insieme | 1 | 1,29 $ (+ 0,00 $ dell'Artista) | 1,29 $ | 4 | 2 | 93291 (32220) | 39823 | 409 | no: nessun programma valido | — | — | — | — | — | — | — |
| villetta | (a) insieme | 2 | 0,89 $ (+ 0,01 $ dell'Artista) | 0,89 $ | 3 | 1 | 59732 (26100) | 30714 | 316 | voto 8 | — | 7,25 | 8/8 | 100 % | 2→2 | stanze | — |
| villetta | (b) programma | 1 | 0,12 $ | 0,12 $ | 1 | 0 | 6189 (0) | 3282 | 34 | 4/4 | 4/4 | 8,00 | 8/8 | 100 % | 2→2 | — | 0,97 |
| villetta | (b) programma | 2 | 0,06 $ | 0,06 $ | 1 | 0 | 6189 (5829) | 2666 | 24 | 4/4 | 4/4 | 2,00 | 4/8 | 100 % | 2→2 | — | 0,92 |
| villetta | (c) dati | 1 | 0,03 $ | 0,03 $ | 1 | 0 | 2778 (0) | 181 | 4 | 4/4 | 4/4 | 6,75 | 8/8 | 100 % | 2→2 | stanza | 0,85 |
| villetta | (c) dati | 2 | 0,01 $ | 0,01 $ | 1 | 0 | 2778 (2418) | 180 | 3 | 4/4 | 4/4 | 6,75 | 8/8 | 100 % | 2→2 | — | 0,87 |
| fattoria | (a) insieme | 1 | 0,50 $ (+ 0,01 $ dell'Artista) | 0,50 $ | 2 | 0 | 25438 (16110) | 20882 | 234 | voto 8 | — | 10,00 | 4/4 | 100 % | 2→2 | piani, stanze, murato | — |
| fattoria | (a) insieme | 2 | 0,41 $ (+ 0,01 $ dell'Artista) | 0,41 $ | 2 | 0 | 25208 (18047) | 17624 | 191 | voto 8 | — | 13,00 | 9/11 | 100 % | 2→2 | stanze, dominante | — |
| fattoria | (b) programma | 1 | 0,09 $ | 0,09 $ | 1 | 0 | 6042 (4370) | 3567 | 30 | 3/4 | 4/4 | 7,75 | 9/9 | 90 % | 2→2 | stanze | 0,35 |
| fattoria | (b) programma | 2 | 0,07 $ | 0,07 $ | 1 | 0 | 6040 (5682) | 3232 | 27 | 4/4 | 4/4 | 8,75 | 9/9 | 98 % | 2→2 | stanze | 0,89 |
| fattoria | (c) dati | 1 | 0,02 $ | 0,02 $ | 1 | 0 | 2631 (959) | 194 | 4 | 4/4 | 4/4 | 5,50 | 8/9 | 100 % | 2→2 | stanza | 0,79 |
| fattoria | (c) dati | 2 | 0,01 $ | 0,01 $ | 1 | 0 | 2630 (2271) | 194 | 4 | 4/4 | 4/4 | 5,50 | 8/9 | 100 % | 2→2 | stanza | 0,79 |
