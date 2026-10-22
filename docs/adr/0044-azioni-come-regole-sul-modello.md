# ADR-0044 — Le azioni sono regole sul modello

Data: 2026-10-22 · Stato: accettato (step 9, fase F8, task T02 del backlog) · Segue ADR-0014 (effetti),
ADR-0019 (regole e azioni imparate), ADR-0041 (asset come programmi, `<action>`) e ADR-0042 (lo Scultore).

## Contesto
«Altro…» (ADR-0014, 0019) fa giudicare al Narratore ciò che il viandante scrive e produce **effetti** da un
insieme chiuso; un'azione sensata e ripetibile diventa un'`ActionDef` del modulo o dell'oggetto. Con i modelli
MarkovJunior (ADR-0041) l'aspetto di una cosa è un programma, e un programma sa già cambiare: le `<action>`
(la porta che si apre) girano sul modello finito, compaiono nel menu dell'entità e restano fatte
(`stato.json → forme`). Ma «scheggio la credenza», «accendo la lanterna», «piego il cartello» potevano solo
distruggere la cosa o mandare un messaggio: l'aspetto non cambiava.

## Decisione
1. **Il Narratore dice se cambia l'aspetto**: il giudizio (`action.judge`) ha un campo `forma` (come cambia, in
   poche parole), chiesto solo quando la cosa ha una **forma sua** (`Kernel.shapeModel`): un programma della
   libreria che non sia il generico di una classe (`GENERIC`: lo condividono molti tipi) e non una figura
   (persone e animali cambiano per altre vie). Cose portate e caselle restano agli effetti.
2. **Lo Scultore scrive la regola** (`sculptAction`, compito `model.action`, il modello della categoria della
   classe): una sola `<action name label>` sul programma, con l'elenco delle lettere del modello finito (nome,
   colore, quanti voxel). Il nome è lo slug dell'etichetta (unico nel programma).
3. **Il kernel la prova** (`checkAction`): il programma con l'azione accanto alla radice compila e finisce; sul
   modello finito l'azione **finisce**, **cambia qualcosa** e **non lo svuota** (resta almeno metà di ciò che è
   disegnato); un nome già usato è rifiutato. Ciò che non passa torna allo Scultore con il motivo (2 tentativi),
   poi si rinuncia: restano gli effetti. Una lettera che il modello non usava prende il colore dalla palette di
   MarkovJunior (il front-end ripara, ADR-0036).
4. **Il tipo la impara**: il programma entra nella libreria con `addModel` (validatore, commit «azione imparata»):
   ogni cosa di quel tipo ha l'azione nel menu (`modello:<nome>`, quando la cambierebbe) e «Altro…» con lo stesso
   testo la fa senza chiamate. La cosa su cui si è agito la fa subito (`form.done`, salvato).
5. **Gli effetti restano per ciò che non è forma** (luce, fuoco, bisogni, oggetti, stati): si applicano quella
   volta; `distruggi` cade (la cosa resta, cambiata); non si impara un'`ActionDef` in più (la voce di menu è la
   regola del modello). La regola del mondo (`world/rules.json`) segna `forma` tra gli effetti.

## Conseguenze
- Il mondo cambia aspetto per come lo si tratta, e lo ricorda per tipo: la seconda credenza si scheggia come la
  prima, senza Concilio.
- Una chiamata in più (lo Scultore) solo la prima volta per tipo; prompt brevi (il programma, le lettere).
- Le azioni scritte così sono permanenti nel programma: un'azione inversa (ricomporre, spegnere) è un'altra
  azione, scritta quando qualcuno la chiede.
- Non fatto: azioni di forma sugli oggetti portati (non hanno un'istanza) e sui terreni (istanze dei modelli
  delle caselle); l'Artista non giudica l'aspetto dopo l'azione.
