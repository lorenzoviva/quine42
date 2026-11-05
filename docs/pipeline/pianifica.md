# Pianifica (fasi 1-4 della pipeline)

Sei l'agente che pianifica, nel worktree del branch base (`3d`). Non esegui task: li prepari perché
`node tools/pipeline/pipeline.mjs esegui` li lanci. Se l'autore ti ha dato un filtro (una richiesta, un gruppo,
«solo quelle per Claude Code»), lavora solo su quelle.

1. **To-do → backlog.** In `docs/userchats/to-do.md`, sezione «Modifiche da fare», ogni richiesta non ancora
   pianificata diventa uno o più task atomici in `docs/plans/backlog.md` (il formato è quello del file: `### Txx · titolo — \`stato\``,
   contesto, cosa fare, quando è fatto, dipendenze scritte come «dipende da Txx»). Il testo originale va in
   `docs/userchats/to-do-<data>.md`, la richiesta esce dal to-do con un commento `<!-- Pianificate il … -->`.
   Se una richiesta è troppo vaga per un task, apri `docs/pipeline/domande/Txx.md` con le domande (e le tue
   raccomandazioni) e segna il task `in attesa`: è la fase di scambio, l'autore risponde nello stesso file.
2. **Sblocca.** Per ogni task `in attesa`: se la domanda ha una risposta (nel file `domande/`, nel task o nel
   to-do), riscrivi il task con la decisione e portalo a `da fare`; altrimenti lascialo.
3. **Stima e assegna.** Per ogni task `da fare` senza riga `- Pipeline:` scrivi, sotto il titolo:
   `- Pipeline: <provider> · sforzo <livello> · stima <n>% · [approvato ·] priorità <n>`.
   - **Il modello e lo sforzo si scelgono da [`modelli.md`](modelli.md)** (ADR-0146): per il tipo di task, la sua sezione 4.2 dice cosa è provato e cosa no.
   - **Lo sforzo** (`low|medium|high|extra|xhigh|max`; `extra` e `xhigh` sono lo stesso livello). Decisione dell'autore del 05/11: **la qualità conta più del tempo: tanti task `high`, una parte `extra`, `max` qua e là.** `medium` e `low` non sono il predefinito.
     - `max`: architettura, kernel, creazione di programmi MarkovJunior, universi, task complessi dove la qualità è nettamente superiore;
     - `extra`: task impegnativi;
     - `high`: lo sviluppo ordinario, e il predefinito di `assegna` (`sforzoPredefinito`);
     - `medium`, `low`: solo compiti meccanici.
     Uno sforzo alto consuma di più: quanto di più non è ancora misurato, quindi alza la stima a giudizio per `extra` e `max`, e guarda il campo `sforzo` di `consumi.jsonl` appena c'è.
   - `claude` è Opus 5.5 e resta il predefinito. `sonnet` (Sonnet 5.5), `haiku` (Haiku 5.5), `agy-opus` e `agy-sonnet` (Opus e Sonnet su `agy`, sul contatore `Claude and GPT models`) sono in prova, a tetto 1: mai provati da noi su task veri, partono con task piccoli e isolati, e i loro consumi si leggono ai primi lanci.
   - `fable` (Claude Fable 5.1, ADR-0115, ADR-0146) solo per i task più difficili, che chiedono molto ragionamento: consuma in fretta, ha un contatore suo e pesa anche sul settimanale di Claude.
   - Provider: quello scritto dall'autore («> Provider proposto: …», Antigravity = `gemini`) e allora `approvato`;
     altrimenti `claude` per ciò che è delicato (architettura, kernel, multigiocatore, sicurezza, ciò che tocca
     molti file), `gemini` per ciò che è semplice o meccanico (modelli MarkovJunior, documenti, test, UI isolata),
     senza `approvato`; `argon` (Gemini 4 Argon in Antigravity: limiti settimanali stretti e suoi) solo per task piccoli (D31; i consumi misurati in `modelli.md`, 4.3). La stima è sempre la quota del limite del provider scelto. I task che richiedono una verifica nel browser (o screenshot) vanno **sempre e solo sulla CLI di Claude**, di norma `claude` (T87: `claude`, `sonnet`, `haiku`, `fable` hanno `--chrome`; `agy -p` non ha il browser).
   - Stima: % del limite settimanale del provider, **sempre sul piano di riferimento** (Claude Max 5x, Google Ultra): lo script la
     scala da solo per il piano attivo (`abbonamenti` e `piani` in `config.json`, ADR-0119). Parti da `docs/pipeline/consumi.jsonl` (task
     simili; il campo `piano` dice su quale piano è misurato, e la colonna delle 5 ore pesa quanto la settimana) e dalla scala:
     - `claude`: piccolo 0,5-1 % (~6-12 % della sessione di 5 ore), medio 1,5-2,5 % (~18-30 %), grande 3-4 % (~36-48 %);
     - `fable`: complesso 6-8 % sul suo contatore (~50-65 % della sessione di 5 ore).
     Oltre il grande il task va spezzato: non sta in una finestra.
   - Priorità: quella della richiesta («> Priorità: n»), altrimenti prima ciò che sblocca altri task; «> Dipende da:»
     diventa «dipende da Txx» nel task.
   - I contatori attuali (5 ore e settimana, per provider) sono in `docs/pipeline/PIANO.md` dopo `pipeline.mjs uso`.
4. **Il piano.** `node tools/pipeline/pipeline.mjs stato` (rigenera `docs/pipeline/PIANO.md`), controlla che le
   code tornino, committa (`Pipeline: pianifica …`). Di' all'autore cosa è pronto, cosa aspetta la sua
   approvazione e cosa le sue risposte, e il comando per eseguire: `node tools/pipeline/pipeline.mjs esegui`.
