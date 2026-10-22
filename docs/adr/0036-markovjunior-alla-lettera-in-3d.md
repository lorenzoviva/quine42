# ADR-0036 — Laboratorio voxel: MarkovJunior alla lettera, modelli interi e una sandbox 3D

Data: 2026-10-22 · Stato: sperimentale (fuori dal gioco); sostituisce, per i nuovi modelli, il JSON degli
ADR-0031…0035 e le strutture a blocchi (ADR-0032…0035)

## Contesto
Richiesta in [`docs/userchats/step8.2A.md`](../userchats/step8.2A.md). Le strutture a blocchi funzionavano
scritte a mano ma non con Gemini: lo Scultore dei blocchi e l'Architetto si parlavano attraverso JSON
pieni di informazioni (prese, facce, materiali, descrizioni) e l'Architetto inventava adiacenze che i
modelli 3D dei blocchi non avevano. Nella conversione 3D → 2D (gli sprite) si perdevano i bordi.
L'autore propone di portare tutto in 3D: un solo modello intero per ogni cosa, generato da un programma
MarkovJunior scritto come negli esempi del repository ufficiale, senza passaggi intermedi né JSON; i
movimenti (alberi al vento, un fiore che cresce) anch'essi da MarkovJunior. Prova standalone in `lab/`,
e verifica se `gemini-3.1-flash-lite` (il tetto di spesa) regge il confronto con `gemini-3.8-flash`.

## Decisione
1. **Il formato è l'XML di MarkovJunior** (`lab/mjx/model.ts`, `lab/mjx/xml.ts`), letto alla lettera:
   `values` con la prima lettera vuota, la palette ufficiale (52 lettere, `lab/mjx/palette.ts`), pattern
   con «/» fra le righe e lo spazio fra gli strati **dall'alto in basso** (come `Rule.cs`, che legge lo
   strato `MZ-1-z`), `origin` al centro della scatola, simmetrie `()` `(x)` `(y)` `(z)` `(xy)` `(xyz+)`
   `(xyz)` ereditate dai genitori (predefinita `(xyz)`), regole sul nodo o in `<rule>`, `<union>` ovunque,
   `steps` illimitati se assenti (anche per `prl`), `convolution` con `sum` e `values` sui vicinati 3D di
   MarkovJunior (VonNeumann, NoCorners; Moore in più), `path`, `map` come in `Map.cs` (griglia nuova vuota,
   uscite di qualsiasi misura, regole che si avvolgono, figli alla risoluzione nuova), nodi `d="2"`
   ignorati. Niente `wfc`, `convchain`, inferenza (`observe`, `field`), file di regole.
2. **Fedeltà verificata sugli originali**: 16 modelli 3D del repository (`lab/mjx/official`, copiati senza
   modifiche) girano dal front-end; i test controllano invarianti (Growth: 3001 celle dopo 3000 passi;
   MazeGrowth: un corridoio fra ogni coppia di stanze; Counting). Scrivendo la casa è emerso un errore del
   motore: `all` bloccava le corrispondenze che si sovrappongono anche solo nelle celle lette; in
   MarkovJunior (`AllNode.Fit`) contano solo le celle scritte. Corretto nel motore (vale anche per il JSON).
3. **Estensioni minime, dichiarate**: `size` sulla radice (MarkovJunior la dà fuori dal programma; per gli
   asset la impone la classe), `origin="bottom"` e `ground` (per i modelli convertiti), `<color symbol
   value part hidden>` (la sintassi di `palette.xml`: ricolora una lettera, nomina gli arti, nasconde i
   segni), le forme `box ellipsoid cylinder cone line` (solo per le masse; i modelli delle sessioni prima le
   usano), `<animation name frames>` (nodi eseguiti a ogni fotogramma sul modello finito: fiamme, fumo) e
   `<action name label>` (nodi eseguiti quando qualcuno agisce: la porta si apre). Animazioni e azioni
   lavorano nelle lettere dell'ultima griglia (dopo un `map`).
4. **Modelli interi, niente blocchi**. Una struttura è un solo programma: la casa (`lab/mjx/models/casa.xml`)
   si progetta su una griglia grossa (una cella = 3 voxel), un blocco pieno si scava, il tetto a padiglione
   è un prisma eroso, porta e finestre le trovano i pattern sulla facciata; poi `map scale="3 3 3"` e i
   dettagli voxel per voxel. Le caselle «operative» non servono: la porta sono le sue lettere, e l'azione
   «apri» è una regola che le cambia. Le adiacenze le gestisce MarkovJunior.
5. **I modelli delle sessioni prima sono validi**: `lab/mjx/convert.ts` riscrive i programmi JSON in XML
   con gli stessi voxel (test su tutti gli esempi); `lab/scripts/mjx-port.ts` ha portato in
   `lab/mjx/models/` i migliori di Gemini (steps 8A-8B) e quelli scritti a mano. La lettera B è sempre la
   cella vuota.
6. **Movimento**: la crescita è l'esecuzione stessa (`run` conserva gli stati: fiore, modelli ufficiali);
   fiamme e fumo sono `<animation>`; camminata (arti marcati con `part`, ruotati attorno al giunto) e vento
   (spostamento dei vertici in proporzione all'altezza, nello shader) li fa il kernel, perché lo spostamento
   rigido di un pezzo non è un'operazione naturale per regole di riscrittura locali.
7. **Sandbox 3D** (`lab/3d/`, pagina `/lab/3d/`, three.js): il terreno è il modello `River` di MarkovJunior
   a scala di casella; alberi, rocce, persone, animali, la casa, il falò e i modelli ufficiali sono mesh dei
   loro voxel (facce esposte, occlusione ambientale per vertice), costruite in Web Worker. Il viandante si
   muove con WASD, gli NPC vagano, le collisioni sono sui voxel (le colonne solide all'altezza del corpo;
   pavimenti e soglie fino a 0,2 caselle si salgono), «E» esegue le azioni, dentro una struttura il tetto si
   taglia. Un pannello ispeziona ogni modello (XML modificabile, semi, crescita) e scolpisce con Gemini.
8. **Lo Scultore scrive XML** (`lab/mjx/sculptor.ts`, `lab/prompts/scultore-mj.md`): istruzioni con
   palette, scatole delle classi, idiomi e trappole imparati scrivendo la casa; due esempi della classe. Il
   front-end ripara le forme che i modelli sbagliano e il cui senso è chiaro (spazi o doppioni in `values`,
   lettere usate e non dichiarate, `part` sconosciute, pattern irregolari completati con `*`) e lo dice;
   il resto torna allo Scultore con la riga dell'errore.

## Prova con Gemini
Stessi 12 bersagli (pino, quercia, betulla, masso muschioso, cespuglio con bacche, barile, pozzo, casetta,
viandante, contadina, gatto, lupo), fino a 2 tentativi per errore, un giro di miglioramento con le viste,
ragionamento `low`, e un Artista fisso per tutti (`gemini-3.5-flash`), così i voti sono confrontabili. Due
tornate per modello: la prima prima delle riparazioni di forma, la seconda dopo
(`lab/scripts/mjx-sculpt.ts`, risultati in `lab/out/mjx-*`; i programmi finali della seconda tornata in
`lab/mjx/models/gemini/`, visibili nella sandbox).

| scultore | tornata | validi | al primo colpo | approvati (≥ 7) | voto medio (primo → dopo il giro) | chiamate | token in / risposta / ragionamento |
|---|---|---|---|---|---|---|---|
| gemini-3.1-flash-lite | 1 | 8/12 | 6 | 5 | 6,1 → 6,8 | 28 | 163k / 20k / 33k |
| gemini-3.1-flash-lite | 2 | 9/12 | 5 | 2 | 4,1 → 4,3 | 40 | 248k / 29k / 42k |
| gemini-3.8-flash | 1 | 11/12 | 8 | 8 | 6,5 → 7,3 | 23 | 141k / 31k / 0 |
| gemini-3.8-flash | 2 | 12/12 | 8 | 9 | 5,9 → 7,2 | 25 | 152k / 29k / 0 |

- **3.8-flash** è costante fra le tornate: pino, betulla, masso, barile e pozzo approvati (8-9) senza giri;
  cespuglio, casetta (tetto di paglia, porta, finestre), viandante e contadina approvati dopo un giro. Deboli
  il lupo (3/10: un quadrupede a blocchi), la quercia (4-5) e il gatto nella seconda tornata (4).
- **3.1-flash-lite** regge sulle cose semplici (pino 8-9, barile 7-8; cespuglio e masso 8 nella prima
  tornata, 4 nella seconda) ma varia molto da una tornata all'altra (voto medio 6,1 e 4,1 sugli stessi
  bersagli) e cade sulle cose composte: casetta e contadina mai valide, il viandante valido una volta (4/10),
  il lupo mai sopra 2; quercia e betulla a volte assurde (rami a X, chioma cubica). Il gatto è arrivato a 9
  dopo un giro nella prima tornata e a 3 nella seconda. Ha bisogno di più chiamate (28-40
  contro 23-25) e con il ragionamento `low` ragiona comunque (33-42k token), mentre 3.8 non ragiona affatto:
  in uscita (risposta + ragionamento) 3.1 produce 53-71k token contro i 29-31k di 3.8.
- Verdetto: con il prezzo per token di 3.1 il costo resta più basso, ma la qualità **non è comparabile**
  per figure e strutture. È comparabile per vegetazione, rocce e oggetti semplici, che sono la maggior parte
  degli asset di un mondo. Una via di mezzo sensata: 3.1 per le classi semplici, 3.8 (o un modello di mezzo,
  da provare: 3.5-flash, 3.6-flash) per persone, animali ed edifici; e il riuso dei programmi (ogni programma
  dà infinite varianti con altri semi, gratis).

## Conseguenze
- Per i nuovi modelli il JSON del laboratorio non serve più; resta per gli strumenti degli step 8A-8E.
- Il gioco resta 2D; questa è la prova che la strada 3D è percorribile. Se si sceglie, il kernel dovrebbe
  avere: modelli MarkovJunior come asset (al posto degli sprite), collisioni sui voxel, interni come parte
  del modello, azioni come regole.
- Costi: solo testo, nessuna immagine; il modello si rigenera con altri semi gratis.
