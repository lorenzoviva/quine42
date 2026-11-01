# ADR-0098 — Il processo delle vulnerabilità

Data: 2026-11-01 · Stato: accettato (task T136 del backlog) · Riferimenti: audit T117 (`docs/sicurezza/audit-2026-11.md`), ADR-0072 (la pipeline), ADR-0078 (l'orchestratore)

## Contesto
L'audit T117 ha trovato sedici rischi e l'autore si aspetta che ne arrivino molti altri. Un report è una fotografia: non dice a che punto è una correzione, non impedisce che una falla
torni e non distingue ciò che è provato da ciò che è solo letto nel codice. Un agente, poi, può essere fermato da un filtro di sicurezza mentre prepara una prova: l'autore può eseguirla di persona.
E non tutto è una vulnerabilità: dentro il gioco, a parte i crediti, tutto si può modificare.

## Decisione
1. **Un percorso solo** (`docs/sicurezza/README.md`): rilevamento → scheda → specifica della contromisura → task della pipeline → test di regressione → chiusura. Dice anche cosa **non** è una vulnerabilità,
   con le tre proprietà dell'autore: non si esce dalla sandbox, i crediti non si toccano, i non master non riscrivono il Lua.
2. **Il registro** (`docs/sicurezza/registro.md`) è la verità corrente: una voce `V-NNN` con gravità, stato (`rilevata specificata «in correzione» chiusa accettata`), superficie, proprietà violata, prova, contromisura,
   task e test. Niente payload né valori di segreti. Gli audit restano come fotografie. V-001…V-016 sono R1…R16; R8 è ridotta alla parte sulla sandbox (V-008) e il resto è `accettato` (V-018).
3. **La suite** (`tests/sicurezza/`, dentro `npm test`, da sola con `npm run test:sicurezza`): ogni test comincia con il suo `V-NNN` e afferma la proprietà. Una vulnerabilità aperta sta in `it.fails`: la suite resta verde per
   tutti gli altri task paralleli e diventa rossa quando la falla si chiude, e chi la chiude toglie `.fails`. Così il test esiste prima della correzione e resta dopo. `registro.test.ts` controlla la forma del registro e il legame con i test.
4. **Dalla gravità alla priorità**: la gravità dà l'ordine; la priorità 0 solo per ciò che è sfruttabile oggi contro soldi o macchina dell'autore, o se lo chiede lui.
5. **L'orchestratore** (`docs/pipeline/orchestra.md`): da una voce `specificata` senza task nasce un task; gli esiti delle prove dell'autore diventano voci. Può scrivere il registro, solo per questo.
6. **Chi esegue un task che tocca server, sandbox, validatore, crediti o pagamenti** lo dice nell'esito: nessuna superficie nuova, o le voci che ha aggiunto, senza correggerle lì.

## Alternative scartate
- **Solo una suite**: i test non dicono cosa è accettato, né cosa è specificato e non ancora scritto, né ciò che si è solo letto.
- **Test rossi finché la falla è aperta**: bloccherebbero la suite di tutti i task in parallelo per settimane.
- **`it.skip` per le voci aperte**: non direbbe a nessuno che la falla si è chiusa e il test resterebbe spento.
- **Un file per scheda**: con molte voci sparge lo stato. Una contromisura grande va in un ADR citato dalla voce.

## Conseguenze
Ogni task di sicurezza tocca nel registro solo le sue voci; i numeri `V-NNN` possono scontrarsi tra task paralleli e li rinumera chi integra, come per gli ADR. Un caso che blocca il processo in una funzione C non può stare in
`it.fails`, perché vitest non lo interrompe: sta in un processo a parte o nel kit dell'autore (T137). I test in `it.fails` costano tempo come gli altri: quello sull'allocazione enorme dura circa due secondi finché T126 non lo chiude.
