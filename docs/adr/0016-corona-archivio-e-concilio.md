# ADR-0016 — La corona come archivio, il Concilio in carne e ossa

Data: 2026-10-20 · Stato: accettato

## Contesto
La corona mostrava il sorgente carattere per carattere: illeggibile e brutta. L'autore chiede di
raggrupparla in oggetti (file e cartelle) e di rappresentare il Concilio come NPC che parlano tra loro
e accedono fisicamente a file e cartelle.

## Decisione
- `src/kernel/corona.ts`: ogni **cartella** è una stanza dell'anello (settore proporzionale ai file,
  pavimento del suo colore, cartello sulla soglia): Universo, Mondo, Concilio, Nucleo, Sistemi, Luoghi,
  Oggetti, Cose, Persone, Magia. Ogni **file** è un oggetto sugli scaffali della stanza: libro (manifest),
  cristallo (Lua), pergamena (testo), tavoletta (altri dati). `E` vicino a un file lo apre nell'editor.
- `src/kernel/archive.ts`: i sei **agenti** sono figure nella corona. Ogni voce del registro del Concilio
  li muove: chi lavora va al file che tocca (`kernel.pathForFeed`) e dice cosa fa; chi è chiamato in
  causa lo raggiunge. Quando sono liberi si incontrano e parlano del lavoro recente (frasi dal registro,
  nessuna chiamata ai modelli). Camminano lungo l'anello, mai dentro il cerchio.
- `E` vicino a un agente apre una **chat con il Concilio** (`agent.chat`): risponde nel suo ruolo e può
  accettare di creare qualcosa (richiesta alla Fucina, con tutta la validazione).
- La corona resta nascosta finché il tappeto ti tiene (ADR-0009).

## Conseguenze
- Il sorgente si esplora come un luogo; il lavoro degli agenti diventa visibile e coerente col registro.
