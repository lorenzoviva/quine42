# Il prompt procedurale su Gemini (T156)

Il prompt è quello del banco (`lab/banco/prompt.md`, T182 con la ricetta della cantina di T258), invariato; i sette bersagli di T155, un tentativo ciascuno, con `--varianza` (5 semi, la taglia del bersaglio e la successiva) e la seconda richiesta con la traccia (`--seconda --traccia --varianza`), come fa ora lo Scultore del gioco. Modello: `gemini-3.8-flash-high` via `agy` (quello che il gioco usa per le strutture, ADR-0042). `gemini-4-argon-high`, che il gioco usa per le taglie rare, non si è potuto provare: due volte il limite dell'abbonamento (`gemini-argon/`, nessun token speso).

## Esito

| bersaglio | prima richiesta | seconda richiesta (con la traccia) |
|---|---|---|
| futuristica | **passa** misure e varianza | — |
| rocca (Enorme) | 1 piano, murato 0,75, porta ostruita | **passa** misure e varianza |
| tempio | salti 1 | risposta vuota: tetto di output |
| pagoda | sagoma 3 | seme 4 a Grande: murato 0,53 |
| moderna | 1 piano, murato 0,57, salti 0 | risposta vuota: tetto di output |
| steampunk | 1 piano, murato 0,62-0,78 | seme 5 a Grande: sagoma 3 |
| locanda (cantina) | cantina 0, perimetro 0,06 | risposta vuota: tetto di output |

**Misure e varianza: 1 su 7 alla prima, 2 su 7 entro due richieste.** Claude Opus col prompt di T182 (giro 3, `diario.md`): 7 su 12 alla prima, 10 su 12 entro due. La soglia del banco non si raggiunge su Gemini.

Il difetto tipico di Gemini alla prima è lo stesso: **la scala non porta al piano di sopra** (un piano solo raggiunto, il resto «murato»), in quattro su sette; Claude lo sbagliava di rado, perché tiene lo scheletro com'è dove regge. Alla seconda la traccia aiuta (rocca: da 1 piano a tutti i semi buoni; moderna, pagoda, steampunk scendono a un difetto, in un seme solo), ma **tre seconde richieste su sei non rispondono**: Gemini ragiona fino al suo tetto di output (circa 126 mila token, metà ragionamento) e consegna il vuoto.

## Le foto (giudizio di chi ha scritto il codice del gioco, non il prompt)

- `futuristica/1/semi.png`, `lati.png`: cinque torri diverse (pianta, masse, tetti), si riconoscono futuristiche (metallo scuro, fasce al neon). **No** per «regge»: cubi di neon e pali staccati galleggiano attorno all'edificio.
- `rocca/1/seconda/semi.png`: masse diverse a ogni seme, merli e torri; si legge come un forte grigio, non come «mura con quattro torri e un cortile». Botti e pali staccati fuori dal muro. Le righe Enorme e Gargantuesca sono identiche in voxel (stessa griglia 120 × 120 × 96, README, punto 5): nel mondo la Gargantuesca è più grande perché la casella ha 12 voxel e non 16.
- Interni sgombri come in T182: è deciso (04/11), gli interni li farà un altro agente.

## Costo (a listino, `prices.ts`)

| | input | output (di cui ragionamento) | dollari | tempo |
|---|---|---|---|---|
| prima richiesta, media di 7 | 18 850 (≈ 10 800 sono il prompt di sistema di agy; nel gioco, via API, non ci sono) | 90 400 (≈ 43 000) | 0,35 | 5-7 min |
| seconda richiesta, media di 6 | 39 000 | 121 900 (≈ 60 000) | 0,49 | 6-8 min |
| tutto il giro, 13 chiamate | | | **5,39** | |

Claude Opus 5.5 col prompt di T182: prima richiesta 10 968 di input, 55 423 di output, 1,15 $; seconda 0,43-1,28 $. Per chiamata Gemini Flash costa un terzo, ma per un programma che passa (2 su 13 chiamate) costa 2,70 $ contro circa 3 $ di Claude (10 su 12 entro due richieste, 30,59 $ in T182 con tre giri): quasi lo stesso, ma Gemini ne fa passare uno su tre bersagli e Claude cinque su sei.

## Strada proposta (decide l'autore)

1. **Il modello**: le strutture grandi (`struttura` di `SculptorAiModels`) su un modello che tiene lo scheletro; Argon andrebbe misurato quando l'abbonamento lo permette (è già il modello delle taglie rare fino al 1° dicembre). Non ho cambiato il predefinito: costa a chi gioca.
2. **Il prompt per Gemini**: dire esplicitamente di non toccare le sezioni 1-2 (reticolo e scala) e di cambiare solo colori, tetto e facciate; e un tetto al ragionamento (sforzo `medium`), perché le seconde richieste finiscono nel vuoto. Un giro di 7 + 7 chiamate, circa 5 $.
3. **Nel gioco oggi**: lo Scultore riprova con il motivo e la traccia; un programma che non regge i controlli del kernel non entra, e il lotto resta con il modello generico della sua classe. I controlli del kernel però non misurano piani e scale: un programma di Gemini con la scala che non porta in alto **entra** nel gioco.
