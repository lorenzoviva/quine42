# Il banco dello Scenografo (T259)

Due modi di arredare un edificio il cui scheletro cambia a ogni seme, con le stesse protezioni e le stesse misure prima e dopo. Il progetto e
la raccomandazione sono in [`docs/design/scenografo.md`](../../../docs/design/scenografo.md).

```bash
npx vite-node lab/scripts/banco-scenografo.ts -- [--semi 5] [--solo palazzina,locanda] [--out lab/banco/scenografo]   # nessuna chiamata
npx vitest run lab/tests/scenografo.test.ts
```

| file | cosa |
|---|---|
| `scenografo.ts` | le classi dello strato dei piedi (`piante`), il programma d'arredo (`programmaArredo`, `arredaProgramma`), i mobili come dati (`catalogo`, `CATALOGO`, `arredaDati`), la guardia del kernel (`Guardia`), la ripetizione (`arredaValidato`), il confronto (`confronta`, `regge`, `varianzaInterna`) |
| `riepilogo.md`, `riepilogo.json` | la tabella del giro: 6 edifici, 5 semi, due vie |
| `<edificio>.png` | il piano terra tagliato sopra la testa: vuoto, col programma, coi modelli; un seme per colonna |

## La misura vera (T303)

Le tre vie su due edifici scritti dallo Scultore di oggi (Opus 5.5 sulla CLI dell'abbonamento), a Grande, due richieste per via; i numeri e
la raccomandazione sono al § 9 di [`docs/design/scenografo.md`](../../../docs/design/scenografo.md).

```bash
# gli edifici vuoti e la via (a), l'interno insieme: lo Scultore del gioco con lo strumento di T391
npx vite-node lab/scripts/scultore-gemini.ts -- --root ../../.. --modelli claude-opus-5-5 --solo villetta,fattoria --taglie large --tetto 2 --out lab/banco/scenografo/misura/vuoto
npx vite-node lab/scripts/scultore-gemini.ts -- --root ../../.. --interno --modelli claude-opus-5-5 --ripeti 2 --solo villetta,fattoria --taglie large --tetto 2 --out lab/banco/scenografo/misura/insieme
# le vie (b) programma e (c) dati alla CLI isolata, e le misure di tutte e tre (--misura: nessuna chiamata, --offline: le risposte di offline/)
npx vite-node lab/scripts/scenografo-misura.ts -- [--ripeti 2] [--vie programma,dati] [--solo villetta,fattoria] [--misura] [--offline]
npx vitest run lab/tests/scenografo-misura.test.ts
```

| file | cosa |
|---|---|
| `misura.ts` | ciò che il kernel dice all'edificio (`descrivi`, `stanzeDi`, `animali`), il palco a classi della via (b) (`palco`, `compilaArredo`, `arredaConProgramma`), le regole della via (c) (`leggiRegole`, `sceltaDi`, `arredaConRegole`), l'arredo della via (a) (`arredoInsieme`, i colori «arredo…»), i controlli dopo (`controlli`) |
| `prompt-programma.md`, `prompt-dati.md` | i prompt dello Scenografo delle vie (b) e (c); il primo prende le sezioni del linguaggio dal prompt dello Scultore |
| `offline/` | le risposte senza chiamate, per provare lo script |
| `misura/vuoto/`, `misura/insieme/` | gli edifici dello Scultore, vuoti e con l'interno, come li scrive `scultore-gemini.ts` (chiamate, registro, esito, programma, foto) |
| `misura/<edificio>/<via>-<n>/` | richiesta, risposta (con l'eventuale correzione), programma o regole, `esito.json` (le chiamate della CLI coi token e il costo, le misure seme per seme) |
| `misura/riepilogo.md`, `riepilogo.json` | la tabella di tutte le richieste, e le letture della finestra delle 5 ore |
| `misura/<edificio>.png` | una riga per via (vuoto, a1, a2, b1, b2, c1, c2), due colonne per seme dell'edificio: il piano terra e quello sopra, tagliati poco sopra la testa; la vista dal davanti nasconde ciò che sta contro i muri davanti |
| `misura/giro-*.txt` | l'uscita intera dei tre comandi |

Le scene della misura leggono i piani con due opzioni (`OpzioniPiante` di `scenografo.ts`): solo il pavimento coperto è delle stanze (il cortile e
i campi non si arredano) e un piano si arreda da 2 caselle² coperte (i piani di Opus a Grande sono di 3-4 caselle²; la soglia di T259, 4, li
lascerebbe vuoti). Senza opzioni il banco di T259 non cambia.

## Di nuovo a 16 voxel per casella (T406)

Gli edifici di oggi sono a 16 voxel per casella (T405, ADR-0209). La stessa misura su due edifici nuovi scritti dallo Scultore col prompt a 16,
letti alla densità del gioco, e lo spazio calpestabile di questi e di quelli di T303 a 20 e a 16; i numeri sono al § 9.1 di
[`docs/design/scenografo.md`](../../../docs/design/scenografo.md).

```bash
npx vite-node lab/scripts/scultore-gemini.ts -- --root ../../.. --modelli claude-opus-5-5 --solo villetta,fattoria --taglie large --tetto 2 --out lab/banco/scenografo/misura16/vuoto
npx vite-node lab/scripts/scultore-gemini.ts -- --root ../../.. --interno --modelli claude-opus-5-5 --ripeti 2 --solo villetta,fattoria --taglie large --tetto 2 --out lab/banco/scenografo/misura16/insieme
npx vite-node lab/scripts/scenografo-misura.ts -- --ripeti 2 --out lab/banco/scenografo/misura16          # --densita gioco, il predefinito
npx vite-node lab/scripts/scenografo-misura.ts -- --misura --densita 20 --out lab/banco/scenografo/misura # T303 di nuovo, senza chiamate
npx vite-node lab/scripts/scenografo-spazio.ts -- --senza-casa --out lab/banco/scenografo/misura16       # lo spazio prima e dopo, senza chiamate
```

| file | cosa |
|---|---|
| `misura16/` | come `misura/`, sugli edifici a 16; `giro-misura.txt` le misure di tutte e tre le vie senza chiamate |
| `misura16/spazio.md`, `spazio.json` | il pavimento calpestabile per piano e per stanza, il lato della stanza del kernel, il soffitto, le porte e i mobili che entrano, a 20 e a 16, degli edifici di T303 e di T406 |

## La casa che usa la Grande (T413)

Lo Scultore col prompt dell'abitazione (ADR-0213: almeno 10 caselle² coperte al piano terra e a un altro piano, due stanze a terra; la
richiesta lo dice, i suoi controlli lo misurano con `storeyFloors` del kernel, la stessa misura di `stanzeDi`): due giri, villetta e fattoria
a Grande; poi lo spazio di queste accanto a quelle di T303 e T406 lette a 16, e la via dei dati sulle case del primo giro. I numeri sono al
§ 9.2 di [`docs/design/scenografo.md`](../../../docs/design/scenografo.md).

```bash
npx vite-node lab/scripts/scultore-gemini.ts -- --root ../../.. --modelli claude-opus-5-5 --solo villetta,fattoria --taglie large --tetto 2 --out lab/banco/scenografo/casa/vuoto            # giro1
npx vite-node lab/scripts/scultore-gemini.ts -- --root ../../.. --modelli claude-opus-5-5 --primo 2 --solo villetta,fattoria --taglie large --tetto 2 --out lab/banco/scenografo/casa/vuoto  # giro2
npx vite-node lab/scripts/scenografo-spazio.ts                                                  # lo spazio prima e dopo e il controllo dell'abitazione, senza chiamate
npx vite-node lab/scripts/scenografo-misura.ts -- --vie dati --ripeti 1 --out lab/banco/scenografo/casa  # la via dei dati sulle case del giro1
```

| file | cosa |
|---|---|
| `casa/vuoto/claude-opus-5-5/giro<n>/` | le case scritte col prompt dell'abitazione, come le scrive `scultore-gemini.ts` (chiamate, registro, esito, programma, foto) |
| `casa/spazio.md`, `spazio.json` | pavimento per piano e per stanza, stanza del kernel, soffitto, porte, mobili che entrano e semi che passano il controllo dell'abitazione, di T303 e T406 (prima) e di T413 (dopo), a 16 |
| `casa/<edificio>/dati-1/`, `casa/<edificio>.png`, `casa/riepilogo.md` | la via dei dati (lo Scenografo, una richiesta a Opus) sulle case del giro1 |

Il banco delle misure (`lab/banco/misure.ts`) legge un edificio a 20 voxel per casella se non gli si dice altro; `gioco: true` nel bersaglio
lo legge come il gioco scrive le voci dello Scultore (senza `vpt`: 16), `vpt` lo fissa. Le parti abitabili (`misura.ts`, `PARTI`) si misurano
sugli stessi voxel a ogni densità (i `PARTS` di oggi letti a 16: una stanza 28, un piano 30, una porta 11 × 30), così che 20 rifà T303.

## La cantina (T419)

La cantina come stanza dello Scenografo (`room: "cellar"`) e i mobili che il kernel porta al suo soffitto (ADR-0215); i numeri sono al § 9.4 di
[`docs/design/scenografo.md`](../../../docs/design/scenografo.md).

```bash
npx vite-node lab/scripts/scenografo-cantina.ts -- [--semi 4] [--solo villetta,struttura-locanda]   # nessuna chiamata
npx vite-node lab/scripts/mobili-cantina.ts -- --root ../../.. --scultore gemini-3.8-flash --tetto 0.5  # lo Scultore del gioco su Gemini: costa
npx vitest run tests/cellar-furnished.test.ts
```

| file | cosa |
|---|---|
| `cantina/riepilogo.md`, `riepilogo.json` | la villetta offline con la cantina (4 semi) e le sei cantine del seme arredate con le regole dei modelli locali: pezzi in cantina, rifiuti, la cantina che regge, i piani, il piede della scala, il tempo |
| `cantina/<edificio>.png` | la cantina tagliata al suolo, dal davanti: sopra vuota, sotto arredata, un seme per colonna |
| `cantina/modelli/` | i mobili della cantina dello Scultore con 3.8 Flash (programma, foto dei quattro lati ridotte in jpg, `esito-scaffale.json` e `esito.json` con le chiamate e il costo): `cellar-shelf` e `cellar-rack` sono nel seme, `cellar-cask` no (3/10) |
| `cantina/modelli/flash-lite/` | il primo giro con Flash-Lite, il modello delle cose semplici: uno scaffale a pezzi e una rastrelliera di rumore (3/10) |
