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
   `- Pipeline: <claude|gemini> · stima <n>% · [approvato ·] priorità <n>`.
   - Provider: quello scritto dall'autore («> Provider proposto: …», Antigravity = `gemini`) e allora `approvato`;
     altrimenti `claude` per ciò che è delicato (architettura, kernel, multigiocatore, sicurezza, ciò che tocca
     molti file), `gemini` per ciò che è semplice o meccanico (modelli MarkovJunior, documenti, test, UI isolata),
     senza `approvato`.
   - Stima: % del limite settimanale del provider. Parti da `docs/pipeline/consumi.jsonl` (task simili, stima e
     tentativi) e, se è vuoto: piccolo 1-2 %, medio 3-5 %, grande 6-10 %; oltre 10 % il task va spezzato.
   - Priorità: prima ciò che sblocca altri task.
4. **Il piano.** `node tools/pipeline/pipeline.mjs stato` (rigenera `docs/pipeline/PIANO.md`), controlla che le
   code tornino, committa (`Pipeline: pianifica …`). Di' all'autore cosa è pronto, cosa aspetta la sua
   approvazione e cosa le sue risposte, e il comando per eseguire: `node tools/pipeline/pipeline.mjs esegui`.
