# ADR-0019 — Le decisioni del Concilio diventano regole

Data: 2026-10-20 · Stato: accettato

## Contesto
Un'azione libera approvata (bere da una pentola di terracotta) non restava tra le azioni possibili.
L'autore chiede che le decisioni del Concilio diventino regole del gioco, e un «Altro…» anche
nell'inventario (uso fantasioso) e nel crafting (indicare l'oggetto da fabbricare).

## Decisione
- **Registro delle regole** `world/rules.json`: ogni giudizio (azione libera, fabbricazione) diventa una
  regola `{chiave, testo, possibile, racconto, effetti}`. Le ultime 30 entrano nel contesto di Narratore,
  Fisico e Arbitro: i giudizi successivi devono rispettarle. Ciò che è stato giudicato impossibile non
  viene richiesto di nuovo (stessa cosa, stesso testo).
- **Le azioni possibili si imparano sempre** (non solo se il Narratore le dice ripetibili), purché
  cambino qualcosa; crearsi oggetti dal nulla si impara solo se costa qualcosa (`consuma` o un requisito).
  Le impara il modulo (cose del mondo) oppure la **definizione dell'oggetto** (`ItemDef.actions`, scritta
  nel suo pacchetto): quindi anche ciò che è a terra o in tasca, per ogni copia.
- **Altro… nell'inventario**: `freeItemAction(slot, testo)`; effetti sull'oggetto portato (`distruggi`
  lo consuma, `apri` apre la borsa) o davanti a te; le azioni imparate diventano pulsanti.
- **Altro… nel crafting**: `freeCraft(testo)`; il Narratore dice da cosa (solo cose che porti, nomi
  esatti), il kernel verifica quantità e attrezzi, il risultato è un oggetto esistente o nuovo; la
  ricetta entra in `items.scoperte` (regola del mondo) e viene eseguita.
- **Sessioni del Concilio** (ogni 12 luoghi, massimo 4 per sessione di gioco): l'Arbitro legge regole,
  persone e luoghi e può intervenire una volta (oggetti, un nuovo abitante, una nuova cosa). Il Concilio
  stabilisce la logica di base e poi la fa evolvere.

## Conseguenze
- Il mondo impara dal giocatore e resta coerente: le stesse domande hanno le stesse risposte.
