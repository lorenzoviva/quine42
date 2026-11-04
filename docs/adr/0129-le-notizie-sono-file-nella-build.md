# ADR-0129 — Le notizie del sito sono file Markdown raccolti alla build

Data: 2026-11-04 · Stato: accettato · Riferimenti: ADR-0095 (il sito), ADR-0111 (la CSP), ADR-0112 (il server di produzione), T234

## Contesto

Dal rilascio in beta l'autore vuole dare notizie: aggiornamenti del kernel, un universo nuovo, sessioni di generazione intensa, sondaggi, la pianificazione dei server. Scrive lui, poche volte, e non vuole aspettare la landing nuova. Il server di produzione ha rotte a elenco e ognuna è superficie (regole 8h, 8j).

## Decisione

- **Una notizia è un file `site/notizie/<nome>.md`** con un'intestazione (`titolo`, `data`, `tag`, `riassunto`, `link` facoltativo) e il testo in Markdown. Il nome del file è il suo indirizzo: `notizie.html?n=<nome>`.
- **Vite li raccoglie alla build** (`import.meta.glob`, `site/notizie-file.ts`): dentro il bundle, nessuna rotta, nessun database, nessuna intestazione nuova. Una notizia nuova si pubblica con una build.
- **Una pagina sola per elenco e notizia**: `site/notizie.html` legge l'indirizzo e confronta ciò che dice con l'elenco, senza mai scriverlo sulla pagina.
- **Il testo non diventa mai HTML eseguibile** (`site/notizie-testo.ts`): il Markdown è un sottoinsieme scritto qui, tutto esce escapato, i soli tag sono quelli del renderer, l'HTML in un file è testo e un link è solo http(s) o del sito. Niente immagini, che la CSP limiterebbe comunque.
- **I tag sono un elenco chiuso** (`NEWS_TAGS`): i filtri restano pochi. Un file che non va resta fuori dal sito e lo dice: nella pagina in sviluppo, in console e in `npm test`.
- **Un sondaggio è un link esterno**, come la pianificazione dei server: si esce dal sito, che non raccoglie risposte.

## Alternative scartate

- **Una libreria Markdown con un sanitizzatore**: due dipendenze per una decina di costrutti, e il filtro per togliere ciò che il parser fa entrare. Qui non entra.
- **Una pagina HTML statica per ogni notizia**: si legge senza JavaScript e si indicizza meglio, ma chiede un plugin che scriva pagine e ne elenchi gli ingressi a Rollup. Se il sito pubblico lo chiederà, il testo è già separato dalla pagina.
- **Una rotta sul server o un database**: aggiunge superficie per testi che cambiano poche volte e li scrive una persona sola.

## Conseguenze

Il bundle della landing contiene le notizie intere: con il tempo si possono spostare le vecchie. Pubblicare chiede una build e un deploy. La sicurezza non ha superfici nuove: nessuna rotta, nessun dato da un client.
