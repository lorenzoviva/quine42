# ADR-0187 — Gemini 4 Hydrogen e Orchestrator nella pipeline

Data: 2026-11-13 · Stato: accettato · Riferimenti: ADR-0072 (la pipeline), ADR-0087 (i tetti dell'autore), ADR-0119 (piani e finestra delle 5 ore), ADR-0146 (i modelli e lo sforzo, che questo ADR estende)

## Contesto

Il 12/11 Antigravity ha aggiunto due modelli ([«Gemini 4 Hydrogen and Orchestrator»](https://antigravity.google/blog/gemini-4-hydrogen-in-google-antigravity/)), che `agy` 1.5.8 elenca: **Gemini 4 Hydrogen** (`gemini-4-hydrogen-low|medium|high|xhigh`), «for everyday coding and agentic workflows», 57 % su *Terminal-Bench 4.1* contro 18,2 % di 3.8 Flash; e **Orchestrator (Argon)** (`gemini-pro-orchestrator-g1-pro`), che nella stessa conversazione passa tra un modello di ragionamento (Argon) che pianifica e Hydrogen che scrive e prova, con un successo vicino al modello di punta e meno quota. L'autore (13/11) li vuole nella pipeline.

Fino a T255 ogni modello di `agy` aveva i livelli `low|medium|high`, e la pipeline portava `extra|xhigh|max` a `-high`. Hydrogen ha anche `xhigh`; l'Orchestrator nessun livello.

Ciò che T360 ha verificato sulla CLI (`docs/pipeline/modelli.md`, 1.1 e 1.3):

- i livelli li dice `agy --model <base> --effort <x> -p /model`, senza spendere quota: Hydrogen `low, medium, high, xhigh`, gli altri `low, medium, high`, l'Orchestrator «not adjustable»;
- `agy` ha ora un `--effort`, ma accanto a un id col suffisso, o sull'Orchestrator, è un errore, e un livello che il modello non ha si rifiuta;
- `agy -p /usage` ha gli stessi tre gruppi di prima: Hydrogen e l'Orchestrator non hanno un contatore loro, e l'annuncio non dice quale quota spendono;
- cinque micro-prove sullo stesso compito: nessuna corsa di Hydrogen o dell'Orchestrator ha mosso un contatore; una di Argon puro, con gli stessi token, ha tolto un punto al suo.

## Decisione

- **Due provider nuovi su `agy`, in prova come quelli di ADR-0146**: `hydrogen` (`gemini-4-hydrogen-high`) e `orchestrator` (`gemini-pro-orchestrator-g1-pro`), nei `disponibili` di Google Pro e Ultra, `limiti.modello` 1, `browser: false`, `orchestrabile: false`. Il tetto della CLI (`limiti.provider.agy`) resta 1.
- **I contatori, finché i task veri non misurano**: `hydrogen` su `^Gemini Models$`, con il conto di `gemini` (`stessoContoDi`) e il suo `ratioSessioneSettimana` (3,3), che è del contatore; `orchestrator` su `Gemini Models` **e** `Gemini 4 Argon`, con il conto di `argon` e `ratioSessioneSettimana` 1: decide la settimana più bassa (oggi Argon), le 5 ore sono quelle di `Gemini Models`, un contatore vuoto lo ferma. È la scelta prudente: se l'Orchestrator spende una sola delle due quote, la pipeline lo ferma al più un po' prima del necessario, mai dopo.
- **Lo sforzo su `agy` è il suffisso dell'id, tra i livelli che il modello ha**: ogni provider `agy` dice i suoi `livelli` in `config.json` (senza, `low, medium, high`); `launchArgs` sceglie il più alto che non supera lo sforzo del task (`agyLevel`, `extra` vale `xhigh`): su Hydrogen `extra|xhigh|max` → `-xhigh`, sugli altri `-high` come prima; un id senza suffisso (l'Orchestrator) non cambia. Mai `--effort` su `agy`.
- **L'ordine dell'orchestratore**: `claude, orchestrator, argon, hydrogen, gemini`. Non orchestrabili, i due nuovi si saltano e nulla cambia; se l'autore li spunta nella pagina web, l'Orchestrator viene prima di Argon (risparmia la sua settimana) e Hydrogen prima di Flash. `orchestra.finestra` 200 000 per entrambi: la finestra di contesto di Hydrogen non è pubblicata.
- **Le regole di assegnazione** (`pianifica.md`, `orchestra.md`, `modelli.md` 4.2): `hydrogen` con sforzo `high` o `extra` per la programmazione ordinaria senza browser, test, refactor, documenti, merge e piccoli script (al posto di `gemini`); `orchestrator` per i task di più passi senza browser che oggi andrebbero su `argon`, per risparmiare la settimana di Argon. Opus resta il predefinito; architettura, kernel, sicurezza e MarkovJunior non vanno sui nuovi.

## Conseguenze

- Su quale contatore pesino Hydrogen e l'Orchestrator, e quanto, non è misurato: le prime righe di `consumi.jsonl` (con `prima`, `dopo` e `sforzo`) correggono `contatori`, `stessoContoDi` e `ratioSessioneSettimana`.
- Quando `agy` darà `xhigh` (o `max`) a un altro modello basta scriverlo nei suoi `livelli`: il codice non cambia. Un livello scritto che il modello non ha fa fallire il lancio: i `livelli` si copiano da `agy --model <base> --effort max -p /model`.
- Gemini 4 Carbon e Orchestrator (Carbon) sono solo di Ultra: con l'abbonamento Pro non ci sono e non entrano.
- Il processo dell'orchestratore legge `config.json` (tranne piani e `orchestrabile`) solo all'avvio: i provider nuovi ci sono dal riavvio.
