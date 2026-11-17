# Lo spazio calpestabile prima e dopo il prompt della casa (T413)

Gli stessi programmi letti a 20 voxel per casella (il banco di T303) e a 16 (il gioco da T405, ADR-0209): i voxel sono gli stessi, un quarto
più grandi. «Calpestabile» è il pavimento coperto dove sta il centro di un corpo (il viandante, 0,44 caselle), tagliato nei passaggi stretti
(`stanzeDi` della misura dello Scenografo), in caselle²; «la sala» è la stanza più grande del piano; il lato è il quadrato più grande del
kernel (`habitableParts`), la misura dello Scultore (almeno 28 voxel). «Mobili che entrano»: ogni stanza chiede 6 pezzi fra i 10 mobili del
seme ricampionati alla densità, e il kernel li posa contro i muri con la sua guardia (`arredaDati`). Media dei 4 semi dell'edificio.
«Abitazione»: i semi su cui il controllo del kernel (`storeyFloors`, `dwellingErrors`, ADR-0213) passa: almeno 10 caselle² al piano
terra e a un altro piano, il piano terra in 2 stanze di 1,5 caselle² o più. T303 e T406 sono le case di prima, lette alla
densità del gioco; T413 quelle scritte dallo stesso Scultore col prompt dell'abitazione.

| edificio | scritto da | voxel per casella | piano | stanze | calpestabile (caselle²) | la sala (caselle²) | lato della stanza dello Scultore (caselle) | soffitto (caselle, viandanti) | porte (caselle) | mobili che entrano | abitazione: semi che passano |
|---|---|---|---|---|---|---|---|---|---|---|---|
| villetta | T303 (prompt a 20) | 16 | 0 | 1,0 | 6,26 | 6,26 | 2,44 | 2,06, 1,38 | 0,69 × 1,88 | 9,8 | 0 su 4 |
| villetta | T303 (prompt a 20) | 16 | 1 | 1,0 | 5,23 | 5,23 | 2,44 | 1,94, 1,29 |  |  |  |
| villetta | T406 (prompt a 16) | 16 | 0 | 1,0 | 6,19 | 6,19 | 2,75 | 3,94, 2,63 | 0,94 × 1,88 | 9,0 | 0 su 4 |
| villetta | T406 (prompt a 16) | 16 | 1 | 1,0 | 5,96 | 5,96 | 2,75 | 1,94, 1,29 |  |  |  |
| villetta | T413 giro1 (abitazione) | 16 | 0 | 3,0 | 13,18 | 5,67 | 1,81 | 2,06, 1,38 | 0,94 × 1,88 | 14,8 | 4 su 4 |
| villetta | T413 giro1 (abitazione) | 16 | 1 | 1,0 | 13,29 | 13,29 | 3,42 | 1,94, 1,29 |  |  |  |
| fattoria | T303 (prompt a 20) | 16 | 0 | 2,0 | 5,81 | 4,75 | 2,13 | 3,94, 2,63 | 0,94 × 1,88 | 8,0 | 0 su 4 |
| fattoria | T303 (prompt a 20) | 16 | 1 | 1,0 | 4,51 | 4,51 | 2,13 | 1,94, 1,29 |  |  |  |
| fattoria | T406 (prompt a 16) | 16 | 0 | 1,3 | 5,01 | 4,75 | 2,13 | 3,94, 2,63 | 0,94 × 1,88 | 6,8 | 0 su 4 |
| fattoria | T406 (prompt a 16) | 16 | 1 | 1,0 | 4,51 | 4,51 | 2,13 | 1,94, 1,29 |  |  |  |
| fattoria | T413 giro1 (abitazione) | 16 | 0 | 2,3 | 11,01 | 6,04 | 1,81 | 3,94, 2,63 | 0,69 × 1,88, 0,94 × 1,88 | 14,3 | 4 su 4 |
| fattoria | T413 giro1 (abitazione) | 16 | 1 | 1,0 | 14,08 | 14,08 | 3,38 | 1,94, 1,29 |  |  |  |
