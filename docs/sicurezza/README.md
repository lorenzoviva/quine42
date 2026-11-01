# Le vulnerabilità di QUINE42: il processo

Dal rilevamento alla chiusura ogni vulnerabilità segue lo stesso percorso e ha **una voce** in [`registro.md`](registro.md): lì si guarda
a che punto è. Decisione in [ADR-0098](../adr/0098-il-processo-delle-vulnerabilita.md); il primo audit è [`audit-2026-11.md`](audit-2026-11.md).

```
rilevamento → scheda → specifica della contromisura → task della pipeline → test di regressione → chiusura
```

## Che cosa conta (decisione dell'autore, 01/11)

Tre proprietà non si negoziano:

1. **Non si esce dalla sandbox del gioco.**
2. **I crediti non si toccano.**
3. **I giocatori non master non riscrivono direttamente il codice Lua sul server.**

Le altre voci difendono ciò che queste tre lasciano scoperto: la chiave e la spesa, la macchina che ospita, il servizio vivo.

## Che cosa non è una vulnerabilità

Dentro il gioco, a parte i crediti, **tutto si può modificare**: il codice generato può toccare inventario, bisogni ed entità degli altri
viandanti, e ci sono i rollback. Quindi non sono vulnerabilità, e non diventano né voci aperte né task:

- un prompt avversario che convince il Concilio: difendersi è una guerra persa. Diventa una voce solo ciò che il suo risultato raggiunge
  **a valle**, fuori dal gioco o sui crediti;
- il codice generato che tocca altri viandanti, `U` scrivibile, il `by` delle rune (la parte di R8 che non si fa: V-018, `accettata`);
- un giocatore che rompe il proprio mondo (regola 3 di `AGENTS.md`).

Se qualcuno lo segnala di nuovo, basta indicare V-018 o questa sezione.

## 1. Rilevamento

Le fonti, e chi scrive la voce:

| Fonte | Chi scrive |
|---|---|
| Un audit (`docs/sicurezza/audit-<data>.md`) | l'agente dell'audit, o il task che ne porta le voci nel registro |
| `npm audit` | il task che lo lancia (T131 è il primo) |
| La suite: un test di sicurezza rosso, o un test qualunque che mostra una falla | chi lo vede |
| Le prove dell'autore (T137: `npm run sicurezza:prove`, blocchi per F12) | l'orchestratore, da `docs/sicurezza/esiti/` o dalla chat |
| La revisione di un task che tocca `server/`, `src/session/`, la sandbox (`sandbox.ts`, `prelude.lua`, l'`Host`), il validatore, i crediti o i pagamenti | chi esegue quel task: nell'esito scrive «sicurezza: nessuna superficie nuova» oppure i `V-NNN` che ha aggiunto |

Chi trova una falla fuori dal proprio task **non la corregge lì**: aggiunge la voce `rilevata` e lo dice nell'esito.

## 2. La scheda

Una voce in fondo a `registro.md`, con il primo numero libero nel proprio branch (se due task si scontrano rinumera chi integra, come per
gli ADR, test compresi). I campi sono quelli del modello in testa al registro; `tests/sicurezza/registro.test.ts` li controlla.

- **Gravità**, pensata per il server pubblico, più quanto pesa oggi se è diverso:
  `critica` (viola una delle tre proprietà, o spende soldi veri, o dà codice sulla macchina, senza identità), `alta` (lo stesso con
  condizioni, o ferma il servizio per tutti), `media` (danno limitato o a catena con altre voci), `bassa` (difesa in profondità).
- **Stato**: `rilevata` (la scheda c'è), `specificata` (la contromisura è scritta), `in correzione` (un task ci lavora), `chiusa` (il test la
  tiene chiusa), `accettata` (non si corregge: il perché è nella voce, ed è una decisione dell'autore).
- **Prova**: `test`, `prova dell'autore` o `solo lettura del codice`, con ciò che è stato provato davvero. Una voce letta nel codice si dice
  letta: non diventa provata perché è scritta bene.

**Mai nel registro, nei report o negli esiti**: payload pronti da usare e valori di segreti, veri o no. Si descrive la proprietà e il punto del
codice. Le prove usano solo valori finti, in locale.

## 3. La specifica della contromisura

Una voce è `specificata` quando il campo **Contromisura** dice cosa cambia e dove, abbastanza perché un task la esegua senza riaprire
l'analisi. La difesa sta a valle del codice e dei contenuti; non si difende con il validatore del testo o con i prompt. Se una contromisura è
grande (più di qualche riga di decisione), va in un ADR, citato dalla voce. Se serve una decisione dell'autore: `docs/pipeline/domande/`.

## 4. Il task della pipeline

Da una voce `specificata` senza task nasce un task (la regola è in [`orchestra.md`](../pipeline/orchestra.md)); un task può chiudere più voci e
una voce può avere più task. Dalla gravità alla priorità:

- la gravità dà l'**ordine**: dopo le voci aperte di gravità maggiore o uguale, prima di quelle minori; a parità, prima chi ne sblocca altre;
- **priorità 0** solo se è sfruttabile oggi, sul server locale, contro soldi o macchina dell'autore, o se lo chiede lui;
- i task di sicurezza vanno su `claude`, dove si possono fare le verifiche nel browser, e citano la voce e `dossier` del task da cui nascono.

Ogni task di sicurezza mette la voce `in correzione` quando parte. Nel registro cambia **solo le sue voci**.

## 5. Il test di regressione: `tests/sicurezza/`

La suite gira dentro `npm test`; da sola con `npm run test:sicurezza`. I test sono difensivi: **affermano la proprietà**, non descrivono un attacco.

- Ogni test comincia con il suo `V-NNN`: `it('V-007 un\'allocazione enorme finisce in un guasto', …)`.
- **Vulnerabilità aperta**: `it.fails`. Il corpo afferma la proprietà che oggi non regge: la suite resta verde per tutti gli altri task e diventa
  **rossa quando la falla si chiude**. Chi la chiude toglie `.fails`.
- **Proprietà che già regge**: `it` normale, così non torna indietro.
- **Non si riesce ancora a scrivere**: `it.todo`, con il motivo in un commento.
- **Un caso che blocca il processo** (un ciclo sincrono in una funzione C): vitest non può interromperlo. Sta in un processo a parte con un tempo
  massimo, o nel kit dell'autore (T137), finché la correzione non lo fa finire.

Se un filtro di sicurezza ferma la sessione mentre prepara una prova: non insistere e non riformulare per aggirarlo. La prova va nel kit
dell'autore (T137), con la proprietà da verificare e ciò che resta scoperto in `docs/pipeline/domande/<Txx>.md`.

## 6. La chiusura

Una voce è `chiusa` quando: la contromisura è nel commit del task, nessun `it.fails` la nomina più, il campo **Test** dice il file che la tiene chiusa
(`registro.test.ts` lo controlla), e `npm test` e `npm run typecheck` sono verdi. Il campo **Esito** dice commit e data.
Se un test di una voce chiusa diventa rosso, la voce torna `in correzione`: è una regressione, e il task di correzione ha la priorità della sua gravità.

Il registro è la verità corrente; gli audit restano come fotografie e non si riscrivono, se non per dire voce per voce cosa è stato chiuso (T122, T134).
