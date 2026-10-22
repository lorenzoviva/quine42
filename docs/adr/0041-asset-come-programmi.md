# ADR-0041 — Gli asset sono programmi MarkovJunior; collisione dai voxel

Data: 2026-10-22 · Stato: accettato (step 9, fase F5) · Attua ADR-0037 (punto 2) e la parte «modello» della
proposta C di [`universo-continuo.md`](../plans/universo-continuo.md).

## Contesto
Con il 3D (ADR-0040) ogni cosa deve avere un aspetto che non sia un'immagine. Il laboratorio (ADR-0036) ha
mostrato modelli interi in XML di MarkovJunior: alberi, rocce, persone con gli arti, strutture con azioni.

## Decisione
1. **Libreria dei modelli nell'universo**: `models/<id>.xml` (il programma, con un commento che dice chi l'ha
   scritto e con che voto) e `models/index.json` (`classe`, `nome`, `autore`, `voto`, `tinta`). Un programma per
   tipo; un'istanza è un **seme** (pochi semi per tipo: 3 per alberi e rocce, 8 per le persone, 1 per gli
   edifici), stabile per chi è (`origin` o nome). Il seme ne ha 28: un modello generico per ogni classe
   (`persona animale bestia albero cespuglio roccia sasso oggetto mobile edificio monumento grande`) più quelli
   del laboratorio (scritti a mano e da Gemini 3.8 nello step 8.2A) e i mobili scritti a mano.
2. **Riferimenti**: `appearance.model` e `appearance.classe` nei manifest; `ItemDef.model` (un oggetto senza
   modello usa il generico `oggetto`, che ha una lettera `tinta` colorata con il colore dell'oggetto: un
   programma per tutti); `TileDef.model` per ciò che sta sulle caselle (alberi sul bosco, massi sulla roccia).
   Un riferimento a un modello che manca usa il generico della sua classe.
3. **Forme** (`src/kernel/forms.ts`): programma + seme (+ tinta) → griglia, impronta (colonne solide fra un
   gradino e la testa), pavimenti, azioni, animazioni. Le esegue un `FormRunner`: in Node il kernel stesso
   (test), nel browser un pool di worker (`src/render/forms.ts`) che fa anche le mesh (corpo, arti attorno ai
   giunti, fotogrammi dell'animazione, peso del vento). Il programma usa la sua `size`; senza, la scatola
   della classe.
4. **Componente `form`** su ogni entità `{model, seed, yaw, tint, done}`: il kernel lo assegna alla nascita.
5. **Collisione dai voxel**: una cosa solida con la forma pronta blocca con la sua impronta, ruotata con lei
   (il pozzo blocca il bordo, non il pozzo intero; si cammina negli angoli della sua casella); finché la forma
   non è pronta blocca la sua casella. Il terreno resta a caselle (ADR-0040, D5 del piano).
6. **Azioni come regole**: le `<action>` del programma che cambierebbero ora il modello compaiono nel menu
   dell'entità («Apri la porta»); farle esegue la regola sui voxel dell'istanza, che ricorda la sequenza
   (`done`) e la salva con la partita (`stato.json → forme`, per origine). Tornati al modello di partenza non
   resta nulla da ricordare.
7. **Il validatore** controlla i modelli: `models/*.xml` deve compilare, finire, poggiare a terra, essere d'un
   pezzo (le forme che il front-end sa riparare le ripara); `appearance.model` e `classe` devono essere validi.
8. **Nel renderer**: le entità con la forma pronta mostrano il loro modello (le persone camminano con gli arti,
   la vegetazione si piega al vento, il falò anima le fiamme); le caselle con un modello lo mostrano in istanze
   (alberi un tile sì e uno no, ruotati e spostati); le icone dell'inventario sono foto dei modelli. I modelli
   sono nella Galleria dell'Artista, come file.

## Conseguenze
- Il seme si chiama `aurora`: il gioco 3D non apre mai l'universo 2D `valmora`.
- Lo Scultore (ADR-0042) scrive i programmi che mancano; la Fucina e i pacchetti dicono la classe e l'aspetto.
- Le strutture nei lotti del piano (case, mulini) arrivano con F7; per ora gli edifici sono ancora muri a caselle.
