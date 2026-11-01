# ADR-0102 — La coda delle CLI blindata

Data: 2026-11-01 · Stato: accettato (task T128, voce V-009 del registro) · Aggiorna ADR-0077.

## Contesto
La coda degli abbonamenti (ADR-0077) porta `system` e `prompt` a una CLI sulla macchina di chi gioca. `POST /api/coda` non aveva autenticazione ed era sempre montata: la pagina di un altro sito aperta nel browser poteva mettere in coda un compito (V-009). La CLI partiva nella cartella del progetto, con tutto l'ambiente e con il testo come argomento.

Provato con la CLI vera (Claude Code 2.1.316, 01/11/2026), in una cartella con un hook, un server MCP e un `CLAUDE.md` di progetto: il solo `--tools ""` di prima **non isola**: l'hook parte, il `CLAUDE.md` guida la risposta e gli strumenti MCP (del progetto e dell'account, 8 nella prova) restano in mano al modello.

## Decisione
1. **La route solo su richiesta**: `QUINE_CODA=1` nel `.env` (`queueWanted`); altrimenti `/api/coda` risponde 404 (non la pagina che Vite dà a un percorso sconosciuto) e il gioco resta sulle API.
2. **Solo da questa macchina e dalla stessa origine**: le regole sono quelle del proxy di Gemini (`accessRefusal`, ADR-0099): indirizzo di loopback, Host di loopback, Origin uguale, niente intestazioni di inoltro.
3. **Un segreto locale**: 32 byte casuali, nella memoria del processo del server, mai su disco (i file di `universes/` li serve il server di sviluppo, V-012). Va in `x-quine-coda` a ogni richiesta, confrontato a tempo costante. La pagina lo chiede a `GET /api/coda/segreto`, che risponde solo con `Sec-Fetch-Site: same-origin`; `QueueModels` lo tiene e lo richiede una volta dopo un 403 (il server è ripartito). Il processo che serve la coda non ne ha bisogno: lavora sul disco.
4. **La CLI non ha nulla con cui agire** (`tools/abbonamenti/servi.ts`):
   - una cartella temporanea vuota per ogni esecuzione, tolta dopo;
   - l'ambiente per nomi ammessi (`cliEnv`): ciò che serve a partire e a trovare il login dell'abbonamento; niente chiavi, niente `.env`, niente `ANTHROPIC_API_KEY` (pagherebbe a consumo);
   - `ISOLATION_ARGS`: `--tools ""`, `--strict-mcp-config` con un elenco vuoto, `--setting-sources ""`, `disableAllHooks`, `--safe-mode`, `--restricted`, `--disable-slash-commands`, `--no-session-persistence`, `--no-chrome`, `--permission-prompts none`. Non `--bare`, che non legge il login dell'abbonamento;
   - il testo su stdin, mai come argomento: per la CLI il prompt è un argomento posizionale, e uno che comincia con un trattino sarebbe un'opzione.
5. **La conferma a ogni esecuzione** (`IsolationCheck`): la CLI gira con i suoi eventi (`stream-json`); il suo `init`, che arriva prima della chiamata al modello, deve dire `tools`, `mcp_servers`, `skills`, `slash_commands` vuoti e soli plugin `builtin`; una lista che non dice conta come breccia. Un hook che parte o un modello che chiede uno strumento sono brecce in qualunque momento. Una breccia uccide la CLI, la richiesta fallisce senza la sua risposta e il processo smette di servire: se una versione nuova della CLI cambia le regole, la coda si ferma invece di fidarsi. Lo stesso vale per un'esecuzione che finisce senza `init`.
6. **Niente Antigravity sulla coda**: `agy` 1.4.12 non ha alcuna opzione che escluda gli strumenti (`--mode plan` e `--sandbox` li limitano, non li tolgono). `antigravity` non è più un provider: nella tabella di `universe.json → ai` vale come uno sconosciuto (`subscriptionsOf`), quindi quegli agenti vanno al predefinito. Il prezzo `abbonamento-antigravity` resta per i registri già scritti. La pipeline continua a usare `agy`: i suoi task li scrive l'autore, non chi gioca.

## Conseguenze
- Per usare gli abbonamenti ora serve `QUINE_CODA=1`: senza, il gioco resta sulle API come quando il servitore è spento.
- Chi sta già sulla macchina e fabbrica le intestazioni con un programma ottiene il segreto: può comunque scrivere sul disco. La difesa è contro altri siti, altre macchine e i giocatori, non contro i processi dell'utente.
- Una falla XSS sulla stessa origine (V-015) leggerebbe il segreto: mettere in coda un testo resta possibile, ma arriva a una CLI senza mani. Il punto 4 è la difesa vera, la route è la prima porta.
- Le richieste in `universes/.coda/` sono file di `universes/`: finché V-012 è aperta il server di sviluppo le serve a chi ne conosce l'id (T130).
- I parametri dell'isolamento dipendono dalla versione della CLI: se cambiano, il punto 5 la ferma e va riprovata la trappola descritta nel Contesto.
- In produzione la coda non c'è: il server di produzione non la monta (T133).
