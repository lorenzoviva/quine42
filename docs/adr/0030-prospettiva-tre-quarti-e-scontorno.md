# ADR-0030 — Prospettiva 3/4 e scontorno delle immagini

Data: 2026-10-20 · Stato: accettato; modifica ADR-0011 e ADR-0026

## Contesto
I fotogrammi della camminata risultavano solo contorni in ogni universo. L'autore ha poi ridipinto gli
sprite in prospettiva 3/4, incongruente con tile ed edifici visti dall'alto, e chiede di passare tutto al 3/4.
Chiede anche perché il magenta come trasparenza intermedia.

## Decisione
- **Scontorno** (`render/imagetools.ts → keyAndFit`): lo sfondo è il magenta se almeno il 10% del bordo
  è magentaico, altrimenti il colore dominante del bordo; riempimento dal bordo, poi i buchi magenta;
  alfa morbida solo sui pixel di contorno (prima era globale e svuotava i soggetti dal colore simile allo
  sfondo); si tiene la componente connessa più grande e quelle ≥ 1/6; si scarta l'immagine se più del 50%
  della fascia di bordo resta opaca.
- **Magenta**: i modelli di immagine di Gemini restituiscono PNG/JPEG **senza canale alfa** (al più
  disegnano una scacchiera). È un limite del modello, non del kernel. L'alternativa è uno scontorno con
  un modello locale (es. RMBG in ONNX), più pesante: rimandata.
- **3/4** (`PERSPECTIVE` in `agents/atelier.ts`, aggiunto alla guida di stile): camera dall'alto a 3/4,
  facce frontali visibili; prompt di texture, ostacoli, sprite e camminate aggiornati, così come la
  Genesi, l'Artista e `world/style.md`. Il renderer disegna i muri con la faccia frontale (corsi di
  mattoni) e i tetti in 3/4 (sollevati, colmo al 33%, gronda, facciata nella fila frontale).

## Conseguenze
- Gli universi esistenti mantengono le immagini; i fotogrammi rovinati vanno ridipinti (Galleria o
  Referente: «ridipingi»). Il renderer ripiega sullo sprite base se un fotogramma ha troppo poco inchiostro.
