# ADR-0204 — Il testo del viandante a Jev solo da OpenRouter con la ritenzione zero

Data: 2026-11-15 · Stato: accettato · Riferimenti: ADR-0157 (Jev, le decisioni chiuse; le guardie di T350), ADR-0193 (l'adattatore OpenRouter,
punto 7), ADR-0197 (il varco delle chiavi), ADR-0099 (il varco della chiave); D45.3 (il testo libero del viandante mai a TypeSafe finché non ha la
ritenzione zero), D55.2 (l'autore, 14/11: sì, ma solo via OpenRouter con `provider.zdr`); T396 (step 43); V-044

## Contesto

Le guardie sul testo che il viandante scrive (`text.guard`: la chat, le azioni libere, la Fucina, lo studio; T350) sono decisioni chiuse, ma fino a
qui rispondeva sempre la regola locale (`guardRule`): `JEV_ZERO_RETENTION`, una costante falsa, teneva il testo nel kernel qualunque fosse la via,
perché TypeSafe conserva ciò che legge (D45.3). Da T362 Jev passa anche da OpenRouter, e ogni richiesta di quella via chiede `provider.zdr: true`:
OpenRouter rifiuta piuttosto che mandarla a un endpoint che conserva, e l'endpoint di TypeSafe è nel suo elenco della ritenzione zero. L'autore (D55.2)
ha deciso che lì il testo può andare; verso TypeSafe diretto mai.

## Decisione

1. **La ritenzione zero è una proprietà della via, non una costante.** `DecisionModels.zeroRetention` la dice la via stessa; `keepsNothing(m)` è vero
   solo se la via lo dice. Lo dice solo `OpenRouterDecisionModels`, che manda `provider.zdr: true` a ogni richiesta. `JevDecisionModels` (TypeSafe
   diretto), i modelli locali e qualunque altra via non lo dicono. `JEV_ZERO_RETENTION` sparisce.
2. **Il kernel decide dalla via.** `Council.decide` manda ai modelli locali una decisione con `freeText` nel censimento (`freeTextDecision`, oggi solo
   `text.guard`) se la via delle decisioni non tiene niente: `(freeTextDecision(task) && !keepsNothing(this.decisions))`. Il resto della regola non
   cambia (manopola `words`, sola lettura, crediti, razione). Se OpenRouter non trova un endpoint a ritenzione zero rifiuta, e risponde la regola.
3. **I varchi tengono la stessa linea da soli** (difesa in profondità), leggendo il corpo e non un segno che il corpo dica di sé:
   `carriesWandererText` (in `fourthwall.ts`) riconosce una domanda della guardia (le sue istruzioni così come sono) o il suo stato (una porta della
   guardia e un testo). `TypeSafeGate` (`jevRequest`) rifiuta un corpo così sempre (403). `OpenRouterGate` (`decisionRequest`) lo rifiuta se non ha
   chiesto `provider.zdr: true` (403), e rifà ogni corpo con `zdr`, come prima.
4. **La stima** conta una riga per le guardie solo quando le decisioni passano da questa via (`hourlyEstimate(…, { decisions, guards })`, nella Genesi
   e nella lobby da soli): una per frase e azione libera che le manopole lasciano passare.
5. **Il sito lo dice** (`site/ia.html`): il testo può andare a Jev per i controlli, solo da OpenRouter con la ritenzione zero, mai a TypeSafe
   direttamente.

## Conseguenze

- Su un mondo che va su OpenRouter (con `OPENROUTER_API_KEY` o senza chiave di Google, ADR-0197) e da soli senza chiave di TypeSafe, ogni testo che
  arriva al Concilio fa una decisione di Jev in più (cinque Noul, circa 900 token): la paga chi paga quella chiamata, come le altre (`chi`, il turno).
- Da soli con la chiave di TypeSafe la via è TypeSafe diretto, e le guardie restano alla regola: chi ha entrambe non manda il testo fuori.
- Il riconoscimento nei varchi si basa sulle domande e sullo stato che il kernel scrive: una decisione nuova con `freeText` nel censimento è tenuta dal
  kernel; perché la tengano anche i varchi va aggiunta a `carriesWandererText` (lo dice il suo commento).
- Non provato contro OpenRouter vero: se l'endpoint di Jev esce dall'elenco della ritenzione zero, le guardie tornano alla regola da sole (il rifiuto
  di OpenRouter).

## Alternative scartate

- **Un segno nel corpo (`freeText: true`) che i varchi leggono**: un corpo senza il segno passerebbe; e `/alpha/decisions` di OpenRouter non lo conosce.
- **Lasciare la costante e accenderla**: varrebbe anche per TypeSafe diretto, che conserva (D45.3).
