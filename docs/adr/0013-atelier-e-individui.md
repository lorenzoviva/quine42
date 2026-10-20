# ADR-0013 — L'Atelier (immagini in contesto) e gli NPC come individui

Data: 2026-10-20 · Stato: accettato

## Contesto
Gli NPC erano tutti uguali ("Abitante di Valmora", sempre e solo mele): l'archetipo di esempio aveva
una mela in tasca e i moduli generati non avevano inventario. L'autore vuole NPC generati anche
graficamente, con un framework per pattern complessi: coppie di esempio descrizione → immagine, e
animazioni generate dando i fotogrammi precedenti.

## Decisione
- **Individui**: un modulo NPC è un *tipo* (persona, mestiere, contesto). La prima volta che ci parli
  il Narratore crea l'individuo: nome, carattere e storia propri, un dettaglio d'aspetto, 3-6 cose
  che porta (oggetti comuni esistenti o nuovi, definiti al volo). La chat usa la sua persona; "dai"
  cede ciò che porta davvero.
- **Atelier** (`src/kernel/agents/atelier.ts`), sempre in contesto:
  - *few-shot*: per un nuovo sprite si inviano le ultime coppie (descrizione, immagine) dello stesso
    tipo già nel gioco (`world/atelier.json`), con l'istruzione di replicarne stile, scala, palette e
    angolo di vista;
  - *camminata*: `animation: "sheet"` (un'immagine 4×3: giù, sinistra, destra, su × 3 passi, dallo
    sprite base) oppure `"frames"` (fotogramma per fotogramma, ognuno dipinto guardando lo sprite base
    e tutti i fotogrammi precedenti);
  - *a lotti*: 4 texture, 4 ostacoli, 16 icone per immagine; il foglio di icone precedente fa da
    riferimento di stile per il successivo.
- **ArtDirector** (`src/kernel/art.ts`): coda di lavori, uno alla volta, entro il budget immagini:
  texture → ostacoli → sprite (personaggi prima) con camminata → icone. Ogni risultato viene scritto
  nei manifest e committato; il renderer lo mostra a caldo e anima i personaggi secondo direzione e passo.

## Conseguenze
- Un mondo completo costa ~15-25 immagini (riusate ovunque), il resto è testo.
- Gli individui non sono persistiti tra sessioni (lo stato del mondo non lo è ancora): un tipo di
  personaggio incontrato di nuovo è un'altra persona.
- I fogli di animazione dei modelli di immagine non sono sempre perfettamente allineati: la modalità
  `frames` costa di più ma è più coerente.
