# ADR-0022 — La corona come studio, il Referente, il viandante trasceso

Data: 2026-10-20 · Stato: accettato

## Contesto
L'autore vuole un'architettura più ricca (edifici, archivi, biblioteche, stanze, come l'ufficio di una
software house di giochi), vedere tutti i contenuti — anche sprite e terreni dipinti, anche quelli creati
in sessione — e le modifiche degli agenti; squadre del Concilio invece di agenti che attraversano l'anello;
che parlino tra loro solo quelli che stanno davvero interagendo; un referente che coordini le richieste;
e un Concilio meno restrittivo con chi è arrivato fin lì (trasceso).

## Decisione
- `src/kernel/corona.ts`: l'anello è il campus dello studio; ogni cartella è un **edificio** (tetto del suo
  colore, insegna, porta sul viale): Direzione, Biblioteca del Mondo, Sala del Concilio, Il Nucleo, Sala
  Sistemi, Ufficio dei Luoghi, Magazzino degli Oggetti, Laboratorio delle Cose, Studio dei Personaggi,
  Torre della Magia, Archivio, più la **Galleria dell'Artista** (ogni sprite e icona, in cornice) e lo
  **Studio del Cartografo** (ogni terreno dipinto, ogni ostacolo).
- Gli interni sono **più grandi dell'esterno**: stanze 24×15 in una regione lontana dello spazio reale,
  su **più piani** uniti da scale; scaffali con i file (libro, cristallo, pergamena, tavoletta), scrivanie
  con i monitor, una **bacheca** con le ultime modifiche. Le porte teletrasportano. Zona `studio`.
- **Modifiche visibili**: i file cambiati dagli ultimi commit della sessione brillano e lo dicono al
  passaggio del mouse (`repo.recentChanges`); la bacheca li elenca con la storia dell'universo.
- Un quadro si guarda da vicino e si può far **ridipingere** all'Artista, dicendo come
  (`requestRepaint`: l'immagine esce dal manifest, l'ArtDirector la ridipinge).
- `src/kernel/archive.ts`: ogni agente è una **squadra**: un membro alla scrivania di ogni edificio in cui
  si fa il suo lavoro, che va allo scaffale del file che cambia; chi viene chiamato in causa compare
  accanto a chi lo chiama. Niente più chiacchiere a caso: si vede parlare solo chi interagisce nel registro.
- **Il Referente** (`referente`, nuovo membro del Concilio) aspetta il viandante sull'anello e porta le sue
  richieste alla squadra giusta: Fucina (oggetti, cose, persone), Cartografo (ambienti), Artista
  (ridipingere), Arbitro (regole), Narratore (pacchetti di oggetti).
- **Trasceso**: uscito dal tappeto, il viandante è parte del Concilio: le sue richieste nella corona
  passano in modalità permissiva (Fucina e Arbitro non obiettano sull'idea, le azioni libere sono
  assecondate); restano esclusi solo distruggere l'universo, se stesso, il gioco.

## Conseguenze
- Il sorgente e tutto ciò che il Concilio ha creato si esplorano come uno studio vivo.
