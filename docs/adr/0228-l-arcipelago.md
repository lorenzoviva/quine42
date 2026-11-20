# ADR-0228 — L'arcipelago: le isole del kernel e lo stretto più lungo

Data: 2026-11-20 · Stato: accettato (task T441 del backlog, P2 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 1.2 e § 1.5)
· Riferimenti: ADR-0224 (la natura del mondo, la regola 10 «a piedi o a nuoto»), ADR-0225 (il corpo che nuota, la fatica, l'annegare, il
layout che non scava l'acqua), ADR-0226 (la gravità: il passo), ADR-0201 (le regioni dell'atlante, il riempitivo), ADR-0221 (ciò che il kernel
non sa fare non si dice), ADR-0109 (ciò che esce ai client, a elenco), ADR-0136 (la versione del kernel)

## Contesto

Con T437 e T438 l'acqua si nuota ovunque e il layout non la scava più; la regola 10 dice «connesso a piedi o a nuoto» e lasciava a questo
task la garanzia delle isole lontane. Oggi il mare sta dove il rumore del generatore lo mette (`cont`), non lo sa nessuno prima di generarlo
e vicino all'origine non c'è; un luogo tutto mare lo pianificava il Cartografo, pagando. Lo studio proponeva isole entro 4 luoghi l'una
dall'altra (`MAX_STRAIT`); l'autore le vuole più lontane, con il margine che resta misurato sulla fatica a nuoto, ed eventuali isolotti di
riposo garantiti dal kernel sulla rotta.

## Decisione

1. **`nature.geography: 'archipelago'` si accetta** (`NATURE_ACCEPTS`) e la portano i Pirati (`WORLD_THEMES`): un mondo nuovo dei Pirati,
   alla Genesi, è un arcipelago; un universo di oggi resta un continente (la natura è ferma dalla Genesi, ADR-0224).
2. **Le isole sono del kernel, dal solo seme** (`src/kernel/islands.ts`): una griglia di celle di `ISLAND_PITCH` = 180 caselle (10 luoghi),
   un'isola per cella, il centro scosso di al più `ISLAND_JITTER` = 18 caselle, la riva una curva chiusa attorno al centro (il raggio 16-40
   caselle, mosso di al più un quinto da tre armoniche: ogni raggio dal centro la incontra una volta sola). L'isola della partenza è la più
   grande, centrata sulla prima casella. Nessuna chiamata e nessun file: la stessa isola in Node, nel browser e sul server.
3. **Lo stretto più lungo è di 144 caselle, 8 luoghi** (`MAX_STRAIT`), l'acqua fra due rive lungo la retta dei centri. Misurato sul corpo
   che nuota (`straitCost`: il passo a nuoto dei 6 del corpo, l'energia di `sys.needs` camminando per la fatica, ADR-0225):
   - nel mare del seme (passo 0,4, fatica 3): **60 secondi, 17 dei 100 di energia**; senza energia, annegando, 36 di salute;
   - nel mare più faticoso che il Fisico può scrivere (passo 0,2, fatica 6) e col passo più pesante di una gravità (0,9): 133 secondi,
     **77 di energia, sotto i 90 con cui si nasce**; senza energia, 80 di salute.
   Il margine che resta è quindi più dei quattro quinti dell'energia nel mare di ogni mondo nuovo, e uno stretto si passa anche nel caso peggiore.
4. **Gli isolotti sulla rotta.** Fra due isole di celle vicine (sugli assi), se l'acqua fra le rive supera lo stretto più lungo il kernel mette
   un isolotto (raggio 5) a metà di quell'acqua, sulla retta dei centri (`isletBetween`): ogni metà è uno stretto. Così ogni isola è unita
   alle quattro vicine da acqua che non supera mai 144 caselle senza terra sotto i piedi, e dalla partenza si arriva a ogni isola della catena.
   Con questi numeri le isole distano 7 luoghi d'acqua (la mediana), e una coppia su sei ha il suo isolotto. Un isolotto non ridà energia
   (`sys.needs` la ridà solo col cibo e il letto): è un riposo dall'acqua, dove non si annega e la salute torna.
5. **La bozza**: il generatore del seme, in un arcipelago (`world.nature()`), non fa il suo mare (`cont`); il kernel disegna sopra la sua
   bozza le isole (`islandDraft`): fuori dalle rive il mare aperto (`o`), due caselle d'acqua bassa (`w`), dentro due di spiaggia (`s`), poi
   la terra del generatore (il suo mare, se un generatore riscritto lo mette, è una laguna). Ogni riva è una spiaggia che si cammina, quindi
   un approdo. Un generatore che un universo ha riscritto ha le isole lo stesso.
6. **Le isole sono ferme**: dipendono solo dal seme e dalla natura, che sono fermi; l'atlante, il master e il Cartografo non le muovono e non
   le cambiano (il test le ridisegna con un atlante che dice altro).
7. **Il mare aperto costa zero** in ogni mondo: un luogo la cui bozza è tutta acqua profonda che si nuota lo pianifica il kernel (`seaPlan`:
   «Mare aperto» nella lingua del mondo, nessun ambiente, nessuna cosa, nessuna runa, nessuna chiamata, il piano salvato), fuori dalla quota
   e dalla pausa come il riempitivo; non i modelli locali sopra un mondo che non è il loro, che non salvano niente (ADR-0222). Sull'acqua non si posa niente: il Cartografo vi avrebbe scritto solo un nome.
8. **Il Cartografo battezza**: quando pianifica il primo luogo di un'isola (`islandOfPlace`: l'isola con più terra nel luogo) la richiesta
   glielo dice e lo schema chiede `island` (nome e una riga); il kernel controlla il testo (`cleanText`, la quarta parete `metaBreak`) e
   scrive nell'atlante una regione con `island` (l'id dell'isola), il centro e la portata in luoghi, l'ambiente del primo luogo, in un commit.
   I luoghi seguenti dell'isola ne ricevono il nome. Una regione d'isola **non è una regione dei luoghi** (`regionAt` la salta) e non toglie
   il suo ambiente al resto del mondo: i luoghi dell'isola scelgono il loro, mentre lo studio voleva un ambiente per isola (troppo uguale
   per isole di venti luoghi). `island` esce ai client nell'atlante (`REGION_FIELDS`).
9. **Lua legge**: `world.region_at(x, y)` (la regione del luogo, del Cartografo o del master ma mai una trattenuta, e l'id dell'isola sotto la
   casella) e `world.islands(x, y, r)` (le isole e gli isolotti entro r caselle, al più 720, i più vicini prima, al più 32, col nome che il
   Cartografo ha dato), copie in sola lettura; fuori da un arcipelago `world.islands` è vuoto.

## Alternative scartate

- **Isole scritte nell'atlante alla Genesi** e lette dalla bozza (lo studio): un file che la bozza legge può cambiare sotto i piani; le isole
  dal seme sono ferme per costruzione e infinite senza «la frontiera che si sposta».
- **Lo stretto dalla fisica del mondo** (la griglia più larga dove il mare è più facile): le isole dipenderebbero dalla palette, che un task
  futuro (il Fisico a mondo acceso) potrebbe cambiare; con un numero solo e la misura sul caso peggiore la garanzia vale per ogni mare.
- **Un ambiente per isola**: monotono; il nome basta a tenere insieme i luoghi.
- **Isole del master** (`kind: 'island'`): non servono ora; il master dichiara regioni come sempre, che non toccano la bozza.

## Conseguenze

- Contratto invariato (kernel 0.10.4): un universo di oggi non se ne accorge; il mare aperto senza chiamate vale per i luoghi non ancora
  pianificati di ogni mondo, i piani salvati restano.
- Gli NPC restano sulla loro isola (non nuotano, ADR-0225) finché non c'è un traghetto. I porti, i moli e le secche sono P6 dello studio, un task a parte.
- Sicurezza: nessuna superficie nuova verso i client oltre al campo `island` dell'atlante (pubblico, scritto dal kernel); `world.region_at` e
  `world.islands` sono copie in sola lettura entro tetti (portata, numero); il mare aperto costa zero, coste e isole stanno nella quota.
