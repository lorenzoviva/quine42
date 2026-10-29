# ADR-0078 — L'orchestratore della pipeline

Data: 2026-10-29 · Stato: accettato · Estende ADR-0072.

## Contesto
La prima esecuzione completa della pipeline (29/10/2026: T43b, T44a, T65, T68, T63, T66, T43c, T30) l'ha guidata una sessione di
Claude Code: pianificazione, `esegui`, riepiloghi, integrazioni con i conflitti degli ADR, verifiche nel browser. Tre problemi:
- i task su Claude hanno consumato le 5 ore dell'account su cui girava la sessione stessa, che si è fermata a metà delle integrazioni
  (e due task, T51 e T53, sono finiti «falliti» perché il messaggio del limite delle 5 ore non era riconosciuto);
- ciò che la sessione sapeva (ADR rinumerati, conflitti risolti, verifiche mancanti, cosa restava) viveva solo nella chat;
- i task che chiedono una verifica nel browser non la facevano: `claude -p` girava senza Claude in Chrome.

## Decisione
1. **L'orchestratore è un agente** (Claude Code o Antigravity) da cui l'autore lancia sempre la pipeline, con la procedura di
   `docs/pipeline/orchestra.md` (`/pipeline` in entrambi): riprende dal report, pianifica, lancia `esegui`, riporta ogni task, delega le
   verifiche nel browser mancanti a un subagente, integra (l'ADR del task che entra prende il primo numero libero; due aggiunte nello
   stesso punto restano entrambe; test verdi prima del commit di merge).
2. **Il suo provider è riservato**: `orchestratore` in `config.json` (predefinito `claude`) o `node tools/pipeline/pipeline.mjs
   orchestratore <provider>` (in `.pipeline/orchestratore.json`); sotto `sogliaUnSolo` (settimana o 5 ore) su quel provider partono
   **zero** task (`capOf`), sugli altri uno. In Antigravity conta il modello dell'orchestratore (`argon` o `gemini`). Quando i crediti
   finiscono l'autore cambia orchestratore a mano e il nuovo riparte dal report.
3. **Il report** `docs/pipeline/orchestrazione.md`: un passaggio di consegne che l'orchestratore riscrive (in corso, da integrare,
   verifiche, domande, prossimo passo) e un diario che lo script allunga da solo (`say`: lanci, esiti, limiti, integrazioni) e
   l'orchestratore con `nota`.
4. **Verifica nel browser da chi esegue**: Claude gira con `--chrome`; il prompt chiede la verifica quando il «Fatto quando» la
   chiede e una riga `BROWSER: verificato|da verificare — …`, che `esegui` legge e scrive nel diario.
5. Correzioni: `usageLimit` riconosce «hit your 5-hour limit · resets 10pm» (e l'ora di ripartenza); `riprendi <Txx>` rimette in
   coda una conversazione fermata; `esegui` non sovrascrive più ciò che `integra` e `riprendi` scrivono in `esecuzioni.json`; un task
   integrato non torna tra quelli da integrare.

## Conseguenze
- L'orchestrazione non si ferma per i crediti che i task consumano; si ferma solo con i propri, e allora passa di mano senza perdere nulla.
- Più task in parallelo usano lo stesso browser: ognuno nella sua scheda e sulla sua porta.
- Gli ADR si scontrano ancora tra task paralleli; li rinumera chi integra.
