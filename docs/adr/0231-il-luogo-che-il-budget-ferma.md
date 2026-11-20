# ADR-0231 — Il luogo che il budget ferma resta una bozza

Data: 2026-11-20 · Stato: accettato (task T457 del backlog, la prima run in closed beta) · Riferimenti: ADR-0099 (il tetto del giorno di
`GeminiGate`), ADR-0196 (il ritmo del mondo: le bozze trattenute), ADR-0201 (le regioni trattenute), ADR-0222 (i modelli locali fuori dal loro
mondo: niente si salva)

## Contesto

Nella prova breve della prima run della beta (T457, `docs/beta/run-1.md`), su una copia di `orichalcum` con Gemini vero e il tetto del giorno a
0,50 $, il Cartografo si è fermato al tetto (`BudgetError`, «budget di sessione esaurito per la spesa del giorno»). Per ogni luogo nuovo che il
viandante avvicinava `makePlan` ripiegava sul piano del kernel (`fallbackPlan`): «Terra senza nome», un ambiente a caso fra quelli del mondo, e
`develop` lo salvava come un piano del Concilio. Sono arrivati al repository quattro luoghi così, con `dungeon` e `ruins` in un mondo del
vapore, per sempre: un piano salvato non si chiede più.

Lo stesso vale per il budget di testo della sessione (`ai.maxText`, 800 chiamate: da soli non c'è quota dei luoghi nuovi, e l'arrivo in un
mondo ne fa una trentina in tre minuti) e per una chiave di OpenRouter senza credito: ogni volta che il budget finisce, il mondo si riempie di
segnaposto che nessuno riscrive.

## Decisione

1. **Un luogo che il budget ferma resta una bozza.** Se il Cartografo non si può chiedere perché il budget è finito (`BudgetError`: il testo
   della sessione, il tetto del giorno del varco, una chiave senza credito), `makePlan` non dà un piano e `develop` lascia il luogo bozza
   trattenuta (`held`), come la quota, la pausa del master o una regione trattenuta: niente piano salvato, niente carta, nessun posto della
   quota consumato. Il viandante cammina sulla bozza come sui luoghi in pausa.
2. **Si richiede dopo un minuto del mondo** (`Kernel.BUDGET_RETRY`, 60 s; `budgetHeld()`): in quel tempo i luoghi nuovi restano bozze senza
   chiamate (`develop`, `pumpDevelopment`); poi uno si richiede, e se il budget è tornato (un giorno nuovo, un tetto alzato, una sessione nuova)
   lo pianifica il Cartografo. Una richiesta oltre il budget non costa: il kernel la ferma prima di chiamare (`limits.text`) o il varco la
   rifiuta con il 402 senza girarla a Google.
3. **La generazione differita** (`planAhead`) risponde `no` per un luogo così: il passo non è fatto e si riprova, mai un segnaposto salvato.
4. **Ogni altro fallimento resta com'era**: tre risposte invalide o un errore che non è di budget danno ancora il piano di ripiego del kernel,
   salvato (con la mancanza nel registro per le risposte invalide). Il mare aperto, i riempitivi e i luoghi dei blocchi restano del kernel,
   senza chiamate.

## Conseguenze

- Al tetto il mondo resta quello di prima: bozze attorno al viandante, che il Cartografo pianifica quando il budget torna; nessun luogo «Terra
  senza nome» nuovo. I quattro della prova restano solo nella copia di `orichalcum` della run (`beta/run-1`), che li tiene come storia.
- Il registro del Concilio dice una volta per luogo «il Concilio non ha budget, resta abbozzato» e il Cartografo dice il suo errore a ogni
  richiesta (una al minuto al più).
- Le persone, le cose e i modelli che il budget ferma restano come prima: questa decisione tocca solo i piani dei luoghi.
- Kernel 0.10.7 (stesso contratto: gli universi della 0.10 restano buoni). La prova: `tests/budget-luoghi.test.ts`.

## Alternative scartate

- **Alzare soltanto i budget per la run**: il tetto del giorno resta il limite vero della spesa e il budget della sessione può sempre finire;
  il segnaposto salvato resterebbe il comportamento di quando finisce.
- **Salvare il ripiego e riscriverlo dopo**: un piano salvato è del mondo (ci sono le cose, le persone, le carte); riscriverlo sotto un
  viandante che l'ha visto cambia un luogo già visitato.
