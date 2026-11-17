# Lo Scenografo misurato (lab/banco/scenografo/casa, gli edifici a 16 voxel per casella): villetta, fattoria, tre vie

Ogni costo è in dollari al listino API di Anthropic dai token che la CLI riporta (Opus 5.5, sforzo `low`); accanto quello che la CLI stessa dice (`total_cost_usd`). I semi dell'edificio sono 4; «regge» è la guardia e le misure del banco (`regge` di `scenografo.ts`) con al più 4 semi d'arredo.

| edificio | via | richiesta | costo (listino API) | costo detto dalla CLI | chiamate | correzioni | token in (cache) | token out | secondi | regge al primo | regge entro 4 | pezzi (media) | stanze arredate | animali liberi | piani prima → dopo | perso | varianza |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| villetta | (c) dati | 1 | 0,03 $ | 0,03 $ | 1 | 0 | 2932 (0) | 216 | 4 | 4/4 | 4/4 | 11,25 | 13/16 | 100 % | 2→2 | — | 0,87 |
| fattoria | (c) dati | 1 | 0,02 $ | 0,02 $ | 1 | 0 | 2738 (959) | 360 | 5 | 4/4 | 4/4 | 11,75 | 13/13 | 100 % | 2→2 | stanze | 0,87 |
