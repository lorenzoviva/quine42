# ADR-0237 — Gemini 4 Neon nella pipeline

Data: 2026-11-21 · Stato: accettato · Riferimenti: ADR-0072 (la pipeline), ADR-0119 (piani e finestra delle 5 ore), ADR-0146 (i modelli e lo sforzo), ADR-0187 (Hydrogen e l'Orchestrator, di cui questo ADR segue la forma)

## Contesto

Il 18/11 Google ha pubblicato Gemini 4 Neon ([«Introducing Gemini 4 Neon»](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/)): quattro livelli di ragionamento (`high` predefinito, `xhigh` il massimo), contesto 1M, API a 3 $/M in ingresso, 0,15 $/M in cache e 15 $/M in uscita, in Antigravity per Google AI Pro e Ultra, 1° sul *Coding Agent Index* di Artificial Analysis (58,6), 65,2 % su *Terminal-Bench 4.1* (Hydrogen 57 %), -32 % di costo a task rispetto a Carbon. L'annuncio non dice su quale quota di Antigravity pesa, né la latenza, l'uscita massima, lo schema JSON o un confronto con Opus 5.5. L'autore (21/11) lo vuole nella pipeline, e vuole sapere quanto vale davvero.

Ciò che T465 ha verificato su `agy` 1.5.14 (`docs/pipeline/modelli.md`, 1.1 e 1.4):

- `agy models` ha `gemini-4-neon-low|medium|high|xhigh` e anche `gemini-pro-orchestrator-neon` (`Orchestrator (Neon)`, non regolabile);
- i livelli li dice `agy --model gemini-4-neon --effort max -p /model` (`low, medium, high, xhigh`); il nome base dà `-high`;
- `agy -p /usage` ha gli stessi tre gruppi; tre micro-prove sullo stesso compito con i contatori appena rinnovati: Neon e l'Orchestrator (Neon) tolgono un punto alle 5 ore di `Gemini Models` a corsa breve, dove Hydrogen non ne toglieva nessuno, e niente ad Argon né a Claude e GPT;
- una prova di qualità: T423, un task chiuso fatto da Opus 5.5, rifatto da Neon nello stesso stato del repository in un worktree usa e getta (sezione 1.5 di `modelli.md`).

## Decisione

- **Un provider nuovo su `agy`, in prova come quelli di ADR-0146 e ADR-0187**: `neon` (`gemini-4-neon-high`, `livelli` `low, medium, high, xhigh`), nei `disponibili` di Google Pro e Ultra, `limiti.modello` 1, `browser: false`, `orchestrabile: false`. Il tetto della CLI (`limiti.provider.agy`) resta 1.
- **Il contatore è `^Gemini Models$`**, misurato e non dedotto, col conto di `gemini` (`stessoContoDi`, lo stesso di `hydrogen`) e il `ratioSessioneSettimana` del contatore (3,3), provvisorio finché `consumi.jsonl` non ha righe di Neon.
- **Lo sforzo** segue ADR-0187 senza codice nuovo: `extra|xhigh|max` → `-xhigh`, gli altri il loro livello.
- **L'ordine dell'orchestratore**: `claude, orchestrator, neon, argon, hydrogen, gemini`, con `orchestra.finestra.neon` 1 000 000. Non orchestrabile, si salta e nulla cambia; spuntato dall'autore, viene prima di Argon perché non spende la sua settimana.
- **Le regole di assegnazione** (`pianifica.md`, `orchestra.md`, `modelli.md` 4.2): Neon è il Gemini per la programmazione di più file senza browser, quando un task da `claude` aspetterebbe la finestra delle 5 ore o al posto di `argon`; non per documenti, test semplici e merge, dove Hydrogen basta con meno quota dello stesso contatore. Opus resta il predefinito; architettura, kernel, sicurezza e MarkovJunior restano su `claude`.
- **L'Orchestrator (Neon) non entra** con questo ADR: non era chiesto e non è misurato su un task; è il candidato di un task a parte.
- **Per il gioco nessun cambio**: se e dove Neon servirebbe al Concilio è una proposta nell'esito di T465 e in `modelli.md` 1.5, non una decisione.

## Conseguenze

- `hydrogen`, `gemini` e `neon` stanno sullo stesso conto: su `agy` gira comunque un task alla volta, e un task di Neon toglie più finestra delle 5 ore di `Gemini Models` di uno di Hydrogen.
- I numeri di `ratioSessioneSettimana` e della stima si correggono dalle prime righe di `consumi.jsonl` con `provider: neon`.
- Il processo dell'orchestratore legge `config.json` (tranne piani e `orchestrabile`) solo all'avvio: `neon` c'è dal riavvio.
- Durante T465 si è trovato in `docs/pipeline/README.md` un danno di T360: la sequenza `` $` `` in un testo passato a `String.replace` aveva copiato dentro una riga tutto il file fino a quel punto (le sezioni comparivano due volte); la copia è stata tolta, e le sostituzioni di T465 si fanno a funzione o con `split`/`join`.
