# Il prompt con i nodi nuovi su Gemini (T336)

Il prompt è quello del gioco per le strutture (`sculptorRole(files, true)`, scritto in `prompt.md` qui accanto): il prompt procedurale di T156
portato in inglese da T310, con la sezione nuova «Nodes that make every seed another building» (`field` con `temperature`, `observe` solo
su pezzi piccoli, `wfc`/`convchain`/`import` solo con i file elencati, ADR-0176). I sette bersagli di T155 e di T156, un tentativo ciascuno,
la prima richiesta, con `--varianza` (5 semi, la taglia del bersaglio e la successiva). Modello `gemini-3.8-flash-high` via `agy`, come T156.
La seconda richiesta non l'ho fatta.

```bash
npx vite-node lab/scripts/banco-strutture.ts -- --bersagli tutti --provider agy --prompt lab/banco/nodi/prompt.md --giro nodi --dir lab/banco --varianza --insieme 3
```

## Un guasto trovato strada facendo: la porta chiusa

Il primo giro ha dato **piani 0 a tutti e sette**, anche allo scheletro del prompt da solo. Non i nodi: dal contratto 0.5 (T308b) l'azione
della porta si chiama `open`, e sia il banco (`esegui` in `misure.ts`) sia il gioco (`reachableStoreys` in `src/kernel/forms.ts`, il controllo
dei piani dello Scultore, ADR-0162) cercavano un'azione `apr…` per misurare la porta aperta: con la porta chiusa nessun corpo entra. Nel
gioco, da allora, lo Scultore vedeva rifiutata ogni struttura procedurale che chiude la porta con `open` (lo scheletro del suo prompt
compreso). Corretto in tutti e due (`/^(open|apr)/`): lo scheletro torna a passare, e le misure qui sotto sono quelle rifatte sugli stessi
XML, senza altre chiamate (`riepilogo.md`; quello con la porta chiusa non si tiene).

## Esito

| bersaglio | T156 (prima richiesta) | T336 (prima richiesta) |
|---|---|---|
| futuristica | **passa** | testa 1,4 (serve 1,5) a Grande, a ogni seme |
| locanda | cantina 0, perimetro 0,06 | nessuna porta sul davanti: il corpo non entra, piani 0 |
| steampunk | piani 1, murato 0,62 | salti 0, sagoma 3 al seme 5 |
| tempio | salti 1 al seme 2 | nessuna porta sul davanti a ogni seme, stanze 1 a 3 semi |
| rocca (Enorme) | piani 1, murato 0,75, porta ostruita | salti 0-1 a due semi, a Enorme e a Gargantuesca |
| pagoda | sagoma 3 al seme 3 | piani 1, murato 0,57, porta bassa |
| moderna | piani 1, murato 0,57 | salti 0 alle due taglie |

**0 su 7 alla prima richiesta, contro 1 su 7 di T156.** Quattro (futuristica, steampunk, rocca, moderna) cadono su una misura sola o su due
vicine (la testa, i salti), che è il genere di difetto che la seconda richiesta con la traccia ha corretto in T156 (la rocca vi è passata).

**Nessuno dei sette usa i nodi nuovi**: niente `field`, `observe`, `wfc`, `convchain`, `import` né figli `<in>`/`<out>`. Gemini parte dallo
scheletro, come il prompt chiede, e ne cambia colori, tetti e facciate: il foglio dei semi della rocca e le foto della futuristica e del tempio
sono la palazzina dello scheletro ricolorata, la stessa sagoma a L e a gradoni in tutti e sette. Compaiono anche pezzi staccati (cubi e pali
luminosi attorno all'edificio nella futuristica e nel tempio) che il banco non conta. La sezione nuova, da sola, non cambia ciò che Gemini
scrive: per i nodi nuovi lo scheletro dovrebbe già usarli (un campo nella scelta delle campate, per esempio), che è il lavoro di T337.

## Costo

| | input | output (con il ragionamento) | dollari |
|---|---|---|---|
| T156, prima richiesta, a chiamata | ~18 850 | 68 000-107 000 | 0,27-0,42 |
| T336, a chiamata | ~17 500 | 71 000-102 000 | 0,28-0,40 |
| T336, sette chiamate | | | **2,39** |

Il prompt inglese è un po' più corto dell'italiano di T156 (17 500 token di input contro 18 850, il sistema di agy compreso), anche con la
sezione nuova.
