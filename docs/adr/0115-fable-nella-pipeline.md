# ADR-0115 — Fable nella pipeline

## Contesto

L'abbonamento Max dà il modello Claude Fable 5.1 con un contatore settimanale suo; secondo l'autore il suo consumo pesa anche sul settimanale di tutti i modelli di Claude, fino al 50 %. È molto potente e consuma in fretta. Richiesta dell'autore (02/11/2026): usarlo solo per i task più difficili, mai come orchestratore, e misurare quanto usarlo perché i crediti non restino non consumati al reset settimanale.

## Decisione

- `fable` è un provider di `config.json`: la stessa CLI di `claude`, con `--model claude-fable-5-1`. Un task ci va con `assegna Txx fable …`, non ha alternative: se Fable non può, aspetta.
- Tetto 1 (`limiti.modello.fable`), dentro i 2 della CLI (`limiti.provider.claude`): i tetti restano quelli dell'autore (ADR-0087).
- I contatori: `claude` legge la sessione e il settimanale comune, `fable` anche il suo. Prima `claude` li leggeva tutti: Fable esaurito avrebbe fermato anche gli altri modelli.
- `orchestrabile: false`: Fable non può orchestrare (`canOrchestrate`, sia da `--agente` sia da `/agente` sia da `orchestratore`). `claude` ha il modello scritto, `claude-opus-5-5`, così l'orchestratore e i task non finiscono su Fable se cambia il predefinito della CLI.
- `stessoContoDi: claude`: sotto la soglia, un task di Fable non riprende sul conto dell'orchestratore, come un task di `claude`.

## Conseguenze

- Quanto Fable pesa davvero sul settimanale comune non è misurato: si legge dai contatori (`stato`, `docs/pipeline/consumi.jsonl`) e le stime dei suoi task si correggono di conseguenza.
- Con un nuovo modello di Claude i nomi in `config.json` vanno aggiornati a mano.
