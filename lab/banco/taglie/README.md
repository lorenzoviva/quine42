# Strutture che si adattano alla taglia: ciò che entra, non l'edificio rimpicciolito (T338, T346)

L'autore (07/11): se l'area è piccola non si forza l'edificio completo del tipo; un forte piccolo è una torre a base larga, una fattoria
di 5 × 5 è una casa normale con una tettoia e la paglia dietro; a un'area più grande si aggiungono campi, staccionata, sentiero, il
fienile; alla più grande il pascolo. La decisione è [ADR-0179](../../../docs/adr/0179-cio-che-entra-nella-taglia.md). Poi (10/11, T346):
la forma che cambia con la taglia va bene, i difetti sono nei dettagli (le porte fra camminamento e torri, i merli irregolari, le
feritoie sparse, i blocchi chiari della staccionata, gli animali che non sono del programma), e la fattoria deve unire l'architettura
di T338 alla varianza dei campi di T339; le parti abitabili diventano sottoblocchi del seme (passo 1 di D48,
[ADR-0182](../../../docs/adr/0182-parti-abitabili-aree-mappe-che-tornano.md)). Si rifà tutto offline, senza modelli (costo in dollari: zero):

```bash
node lab/banco/taglie/parti.mjs                                                     # riscrive universe/models/part-*.xml
node lab/banco/taglie/genera.mjs                                                    # riscrive fattoria.xml e forte.xml
npx vite-node lab/scripts/banco-taglie.ts -- --parti --foto                         # le quattro parti da sole: validatore, misure, parti.png
npx vite-node lab/scripts/banco-taglie.ts -- --semi 2 --foto --json lab/banco/taglie/misure.json
npx vite-node lab/scripts/banco-taglie.ts -- --misura --semi 2                      # le strutture del seme e lo scheletro
```

## In breve

- **Una scala sola**: le strutture che crescono a regole girano a 20 voxel per casella a ogni taglia: Grande 100 × 100 × 80, Enorme
  150 × 150 × 120, Gargantuesca 200 × 200 × 160 (`densityFor`). Le voci già scolpite tengono la loro scatola.
- **Le parti abitabili** hanno misure minime in caselle (`PARTS`): porta 0,55 × 1,5 (11 × 30), piano 1,5 di luce (30), stanza 1,4 di
  lato (28), tettoia 1,5 di luce e 1 di fondo. Dal T346 la scala, la porta, i merli e le feritoie sono **sottoblocchi del seme**
  (`universe/models/part-stair.xml`, `part-door.xml`, `part-battlements.xml`, `part-slits.xml`) che un programma include con
  `<import file="part-…"/>` invece di scriverli; ognuno da solo costruisce la sua scena dall'origine e passa il validatore della libreria.
- **Ciò che entra**: lo stesso programma, a un'area più grande, deve contenere di più (un tipo di parte in più, o un quarto di parti in
  più; `varietyError`).
- **Il piano e il dettaglio**: la fattoria decide il piano su una griglia a un decimo (`map scale="1/10 1/10 1"`, una cella mezza
  casella), due `map` la portano ai voxel e il dettaglio gira a scala piena: un programma le cui `map` tornano alla scatola
  (`mapsBackToBox`) prende la scatola di ogni taglia come uno senza `map`, e tiene `soil`.
- **Le aree**: una lettera della palette porta `area="pasture"` (anche nascosta) e `areasOf` dice l'area di ogni casella del suolo:
  nessun animale è disegnato, il programma marca dove stanno (per il Narratore e lo Scenografo).

## Le parti del seme (`--parti`)

| parte | contratto | da sola |
|---|---|---|
| `part-stair` | chi include marca la striscia `T` (16 × 11 nell'aria sopra un pavimento, con `symmetry="()"`); sale verso le x grandi 2 per 1, apre il solaio (unione `=`, i pavimenti), riempie sotto, scrive `k` | una casa di 55 × 35 a due piani con la porta: piani raggiunti 1 e 33, porta 11 × 30, 0,19 s |
| `part-door` | chi include scrive il seme `O` di 11 attraverso il muro al piede; sale 30 attraverso l'unione `+` (i muri), architrave e stipiti `N`, assi `o`; le azioni `open`/`close` sono di chi include | un muro di 41 × 2 × 40 con la porta |
| `part-battlements` | sul bordo di ogni cima piatta delle lettere `+`: merli `M` di 5 e vuoti di 3, alti 6, regolari da ogni angolo | una torre di 29 × 29: 16 merli, tutti di 5 |
| `part-slits` | dopo i merli: sotto il centro di ogni merlo di 5 una feritoia `U` di 1 × 6 attraverso l'unione `%` | la stessa torre: 16 feritoie |

I marcatori delle parti sono `#90`-`#91`; la lettera `S` è la scena di prova, che un'inclusione non ha mai (quei nodi non fanno niente
inclusi).

![le parti da sole](parti.png)

## La fattoria (`fattoria.xml`)

Il piano (A, una cella mezza casella): il seme arretra finché ha otto righe libere dietro e si sposta di lato se ne ha otto; la casa
di 6 × 4 celle con la tettoia di 2 dietro; il cortile (una cella ai lati e dietro, tre davanti) con la strada dalla porta al bordo; dove
restano sei celle di lato, quattro di cortile in più (il posto del fienile); il bordo del cortile ondeggia a caso; la staccionata dove
restano due celle libere (la strada conta), con gli angoli chiusi; il fienile di 3 × 4 dove entra una finestra di cortile di 5 × 6; i
tracciati dalla staccionata al bordo dove restano due celle di campo, almeno tre l'uno dall'altro; gli appezzamenti fra i tracciati,
ognuno del tipo di una cella estratta (grano più spesso, poi pascolo, orto, frutteto); i pascoli con il recinto sul bordo (unito a quello
del cortile) e i cancelli lungo i tracciati; gli alberi del frutteto. Poi (B) ogni cella dieci per dieci, le recinzioni da centro a
centro con un paletto ogni cinque, e (C) il dettaglio di T338: la casa sale a due piani con il solaio e il tetto, `part-stair` e
`part-door`, le finestre, la tettoia con i pali e il fieno, il fienile con l'apertura, paletti, traverse e sbarre dei cancelli, il grano
sulle file seminate, gli ortaggi, gli alberi, il comignolo. Le aree: `house`, `shelter`, `yard`, `barn`, `field`, `orchard`, `pasture`.

| taglia | cosa contiene (seme 1) | parti (tipi) | tempo a seme | aree (caselle) |
|---|---|---|---|---|
| Grande, 5 × 5 caselle | la casa di due piani (60 × 40, stanza 31, porta 11 × 30, scala), il tetto col comignolo, la tettoia dietro con tre balle di paglia, il cortile e la strada | 32-176 (16-22) | 0,27-0,37 s | house 4, shelter 3, yard 18 |
| Enorme, 7,5 × 7,5 | + la staccionata irregolare con la strada come varco, i **campi** tutt'attorno (grano a file, o pascoli e orti secondo il seme), i tracciati davanti | 580-610 (22-23) | 0,33-0,40 s | field 33, yard 23 |
| Gargantuesca, 10 × 10 | + il **fienile** a lato della casa (30 × 40, apertura di 15 × 28), più appezzamenti a incastro con i recinti dei pascoli e i cancelli, gli alberi del frutteto | 420-830 (22-26) | 0,69-0,72 s | barn 1, field 59 o pasture 52 + orchard 6, yard 32-34 |

![la fattoria Grande](fattoria-large.png)
![la fattoria Enorme](fattoria-huge.png)
![la fattoria Gargantuesca](fattoria-gargantuan.png)

## Il forte (`forte.xml`)

| taglia | cosa contiene (seme 1) | parti (tipi) | tempo a seme | aree (caselle) |
|---|---|---|---|---|
| Grande, 5 × 5 | **una torre a base larga**: il mastio di 51 × 47 con la scarpa, due piani (stanza 33, porta 11 × 30 da `part-door`, scala da `part-stair`), la terrazza con i **merli regolari** (`part-battlements`: 22 di 5, 6 di 3 agli angoli) e **una feritoia sotto ogni merlo** (`part-slits`), l'asta | 58 (13) | 0,15 s | courtyard 16, keep 9 |
| Enorme, 7,5 × 7,5 | + il cortile e la **cinta** di 12 (24 di altezza) con il camminamento fra due merlature e la strada come porta | 122 (14) | 0,27 s | courtyard 22, keep 8 |
| Gargantuesca, 10 × 10 | + le **torri cave** di 21 sugli angoli (60 di altezza, il pavimento al camminamento, il tetto di ardesia) con **una porta dal camminamento in ogni torre**, larga quanto il camminamento fra i merli e alta 30 | 89 (16) | 0,43 s | courtyard 24, keep 4, tower 12 |

![il forte Grande](forte-large.png)
![il forte Enorme](forte-huge.png)
![il forte Gargantuesco](forte-gargantuan.png)

Le foto sono del seme 1, i quattro lati (davanti, destra, dietro, sinistra), a cartone. Le misure intere sono in `misure.json`; i merli
per lunghezza (`merlonRuns`) dicono che quasi tutti sono di 5, i pochi di 3-4 stanno agli angoli e dove due corse si incontrano.

## Costo

Nessuna chiamata ai modelli: i programmi sono scritti a mano (`genera.mjs`, `parti.mjs`). Un giro del forte costa 0,15-0,45 s a seme,
uno della fattoria 0,3-0,7; `checkProgram` a una taglia (quattro semi e uno alla successiva) 1,4-2 s con le parti incluse.

## Ciò che non c'è ancora

- **Lo Scultore su Gemini** con le parti e il prompt senza scheletro: T354 (il prompt) e T355 (il giro).
- **Chi mette persone e animali nelle aree**: le aree sono lette (`formAreas`), nessuno le usa ancora; il Narratore e lo Scenografo (T259)
  le riceveranno in un task loro.
- **La fattoria di 50 × 50** e il tetto dei voxel delle gargantuesche: T356.
- **La varietà degli appezzamenti a 10 × 10**: in 20 celle restano 2-5 celle di campo attorno al cortile, quindi pochi tracciati e due o
  tre tipi di appezzamento per seme; la varianza dei campi di T339 vuole l'area di T356.
- **Le torri del forte** hanno la porta dal camminamento ma il camminamento non ha una scala dal cortile: la cinta si raggiunge dalle
  torri solo sul piano; una scala del camminamento è una parte da aggiungere.
