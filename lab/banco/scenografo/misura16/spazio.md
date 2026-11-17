# Lo spazio calpestabile prima e dopo il riscalamento (T406)

Gli stessi programmi letti a 20 voxel per casella (il banco di T303) e a 16 (il gioco da T405, ADR-0209): i voxel sono gli stessi, un quarto
più grandi. «Calpestabile» è il pavimento coperto dove sta il centro di un corpo (il viandante, 0,44 caselle), tagliato nei passaggi stretti
(`stanzeDi` della misura dello Scenografo), in caselle²; «la sala» è la stanza più grande del piano; il lato è il quadrato più grande del
kernel (`habitableParts`), la misura dello Scultore (almeno 28 voxel). «Mobili che entrano»: ogni stanza chiede 6 pezzi fra i 10 mobili del
seme ricampionati alla densità, e il kernel li posa contro i muri con la sua guardia (`arredaDati`). Media dei 4 semi dell'edificio.

| edificio | scritto da | voxel per casella | piano | stanze | calpestabile (caselle²) | la sala (caselle²) | lato della stanza dello Scultore (caselle) | soffitto (caselle, viandanti) | porte (caselle) | mobili che entrano |
|---|---|---|---|---|---|---|---|---|---|---|
| villetta | T303 (prompt a 20) | 20 | 0 | 1,0 | 4,02 | 4,02 | 2,05 | 1,65, 1,10 | 0,55 × 1,50 | 6,5 |
| villetta | T303 (prompt a 20) | 20 | 1 | 1,0 | 3,37 | 3,37 | 2,05 | 1,55, 1,03 |  |  |
| villetta | T303 (prompt a 20) | 16 | 0 | 1,0 | 6,26 | 6,26 | 2,44 | 2,06, 1,38 | 0,69 × 1,88 | 9,8 |
| villetta | T303 (prompt a 20) | 16 | 1 | 1,0 | 5,23 | 5,23 | 2,44 | 1,94, 1,29 |  |  |
| villetta | T406 (prompt a 16) | 20 | 0 | 1,0 | 3,98 | 3,98 | 2,30 | 3,15, 2,10 | 0,75 × 1,50 | 6,0 |
| villetta | T406 (prompt a 16) | 20 | 1 | 1,0 | 3,83 | 3,83 | 2,30 | 1,55, 1,03 |  |  |
| villetta | T406 (prompt a 16) | 16 | 0 | 1,0 | 6,19 | 6,19 | 2,75 | 3,94, 2,63 | 0,94 × 1,88 | 9,0 |
| villetta | T406 (prompt a 16) | 16 | 1 | 1,0 | 5,96 | 5,96 | 2,75 | 1,94, 1,29 |  |  |
| fattoria | T303 (prompt a 20) | 20 | 0 | 1,0 | 3,06 | 3,06 | 1,80 | 3,15, 2,10 | 0,75 × 1,50 | 5,3 |
| fattoria | T303 (prompt a 20) | 20 | 1 | 1,0 | 2,91 | 2,91 | 1,80 | 1,55, 1,03 |  |  |
| fattoria | T303 (prompt a 20) | 16 | 0 | 2,0 | 5,81 | 4,75 | 2,13 | 3,94, 2,63 | 0,94 × 1,88 | 8,0 |
| fattoria | T303 (prompt a 20) | 16 | 1 | 1,0 | 4,51 | 4,51 | 2,13 | 1,94, 1,29 |  |  |
| fattoria | T406 (prompt a 16) | 20 | 0 | 1,0 | 3,06 | 3,06 | 1,80 | 3,15, 2,10 | 0,75 × 1,50 | 5,3 |
| fattoria | T406 (prompt a 16) | 20 | 1 | 1,0 | 2,91 | 2,91 | 1,80 | 1,55, 1,03 |  |  |
| fattoria | T406 (prompt a 16) | 16 | 0 | 1,3 | 5,01 | 4,75 | 2,13 | 3,94, 2,63 | 0,94 × 1,88 | 6,8 |
| fattoria | T406 (prompt a 16) | 16 | 1 | 1,0 | 4,51 | 4,51 | 2,13 | 1,94, 1,29 |  |  |
