# ADR-0012 — Contenuti guidati dai dati: oggetti, bottino, ricette, bisogni, azioni

Data: 2026-10-20 · Stato: accettato

## Contesto
L'autore vuole un'alta complessità di gioco generata durante il gioco ("tipo Project Zomboid: grafica
semplice, moltissimi contenuti"), oggetti sulla mappa interagibili, oggetti comuni trovati spesso, e
nota che il testo costa molto meno delle immagini.

## Decisione
- **Oggetti come dati** (`ItemDef`): categoria (cibo, bevanda, medicina, attrezzo, arma, materiale,
  luce, vestiario, contenitore, varie), peso, pila, tag, effetti (fame/sete/energia/salute),
  impugnabile, prompt dell'icona. Arrivano in **pacchetti** (moduli `data` con `items`, `recipes`,
  `loot`): il Narratore ne scrive decine, il Fisico corregge pesi ed effetti, l'Arbitro li rimanda se
  fuori dal mondo; ricette e tabelle di bottino nello stesso passaggio. Solo testo.
- **Il mondo cresce**: un pacchetto alla Genesi (~30 oggetti), poi uno ogni 10 luoghi esplorati
  (`ai.maxPacks` per sessione).
- **Bottino per tag**: casse, credenze e banchi (`container`) si riempiono alla prima apertura dalla
  loro tabella; per terra ogni luogo ha la tabella `terreno`. Ogni nuovo pacchetto arricchisce tutto.
- **Oggetti citati**: quando in una chat si nomina qualcosa (`oggetti_citati`), se non esiste il
  Narratore lo definisce (pacchetto `items.citati`), e da allora compare più spesso nei bottini e nei
  luoghi (`wanted`), se coerente.
- **Uso generico** in Lua (`core.items`): mangiare, bere, curarsi, accendere, secondo categoria ed
  effetti; logica propria solo per gli oggetti speciali (`module`).
- **Bisogni** (`sys.needs`): fame, sete, energia calano (camminare stanca); a zero cala la salute; a
  salute zero il viandante sviene e la simulazione lo rimette in piedi.
- **Ricette** (scheda Crea dell'inventario), **combinazioni** libere giudicate dal Concilio.
- **Azioni sugli oggetti**: `E` apre un menu (Parla, Apri, Raccogli, Esamina, Usa lo strumento
  impugnato, e le azioni del modulo con eventuale requisito, gestite in Lua da `on_act`). "Esamina"
  fa descrivere al Narratore (una volta, poi in cache).

## Conseguenze
- La varietà cresce con il testo, non con le immagini: un oggetto senza icona è subito giocabile
  (glifo della sua categoria); l'icona arriva poi, in un foglio da 16.
- Tutto ciò che entra passa dal validatore (`validateItems`, risoluzione dei nomi nelle ricette).
