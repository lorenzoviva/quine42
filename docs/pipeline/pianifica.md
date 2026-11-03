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
   `- Pipeline: <claude|fable|gemini|argon> · stima <n>% · [approvato ·] priorità <n>`.
   - `fable` (Claude Fable 5.1, ADR-0115) solo per i task più difficili, che chiedono molto ragionamento: consuma in fretta, ha un contatore suo e pesa anche sul settimanale di Claude; mai come orchestratore.
   - Provider: quello scritto dall'autore («> Provider proposto: …», Antigravity = `gemini`) e allora `approvato`;
     altrimenti `claude` per ciò che è delicato (architettura, kernel, multigiocatore, sicurezza, ciò che tocca
     molti file), `gemini` per ciò che è semplice o meccanico (modelli MarkovJunior, documenti, test, UI isolata),
     senza `approvato`; `argon` (Gemini 4 Argon in Antigravity: molto più forte, limiti settimanali più stretti e suoi) per ciò che è difficile ma Claude non deve fare (strutture complesse, programmi MarkovJunior importanti). La stima è sempre la quota del limite del provider scelto. I task che richiedono una verifica nel browser (o screenshot) vanno **sempre e solo su `claude`** (T87: l'unico con `--chrome`; `agy -p` non ha il browser).
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
