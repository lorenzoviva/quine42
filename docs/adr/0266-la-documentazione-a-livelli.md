# ADR-0266 — La documentazione a livelli: la panoramica sopra il nucleo

Data: 2026-11-27 · Stato: accettato (T524); il resto della catena aspetta D/T524 · Riferimenti: ADR-0120 (il nucleo e i dettagli),
ADR-0045 (il grafo del mondo e graphify), ADR-0117 (il glossario) · Studio: [`docs/design/documentazione.md`](../design/documentazione.md)

## Contesto

L'autore (26/11): il progetto è cresciuto, i documenti degli agenti sono dettagliati ma troppo lunghi da verificare a mano, e manca un
documento ridotto da cui avere il quadro prima di cercare i dettagli. Le misure del 27/11: `AGENTS.md` è passato da 37,9 KB (ADR-0120, 3/11)
a 164 KB, circa 47 000 token che ogni sessione carica per intero; i dettagli da 69 a 422 KB; l'indice dei sottosistemi, che doveva avere una
riga per voce, ha righe di 7 900 caratteri; nessun controllo guarda la lunghezza dei documenti, e il solo tetto scritto (il quadro «sotto le
75 righe») si rispetta allungando le righe. Graphify, rivalutato, non dà né un quadro leggibile né un controllo (studio, § 3).

## Decisione

1. **Tre livelli e i registri.** Livello 1, la **panoramica** (`docs/panoramica.md`): il quadro in due pagine, per l'autore e per ogni agente,
   da leggere per prima. Livello 2, il **nucleo** (`AGENTS.md`): il contratto, come in ADR-0120, che resta l'unica fonte di verità e vince sulla
   panoramica. Livello 3, i **dettagli** per sottosistema e i documenti di riferimento (glossario, lingua interna, fasi, studi, guide). I
   **registri** (ADR, backlog, diario e consumi della pipeline, domande, richieste dell'autore, archivio) si cercano e non si leggono interi.
   Il livello di ogni documento in cima a `docs/` è scritto in `DOC_LEVELS` (`tools/documenti/livelli.ts`).
2. **La panoramica è stabile**: al più 10 000 caratteri e 120 righe; niente versioni né numeri di task (stanno nel quadro, nelle fasi, nel
   backlog); una riga per ogni regola inviolabile del nucleo, nel suo ordine; un link per ogni sezione dei dettagli.
3. **Chi aggiorna che cosa**: un sottosistema che cambia aggiorna il suo livello 3; uno nuovo aggiunge anche la sua riga nell'indice del nucleo
   (ADR-0120) e il suo link nella panoramica; una regola inviolabile nuova o cambiata ha la sua riga nella panoramica nello stesso commit; un
   documento nuovo in cima a `docs/` ha il suo livello. La tabella intera è nello studio, § 2.1.
4. **I controlli sono test** (`tests/documenti.test.ts`): tetto, link e ancore, regole, sezioni, livelli, il rimando dal nucleo. Le misure
   sono in caratteri, non solo in righe. `npx vite-node tools/documenti/mappa.ts` stampa la mappa dei documenti e ciò che non torna.
5. **Graphify resta facoltativo e fuori dal flusso degli agenti** (ADR-0045, punto 2): una prova misurata sul solo codice, con il permesso
   dell'autore di installarlo, è un task della catena (P6), non una dipendenza.

## Alternative scartate

- **Graphify (o un grafo dei documenti fatto da un modello) come panoramica**: archi dedotti, che l'autore non verifica più dei documenti;
  ~1,8 milioni di token per la prima costruzione sui documenti; dà comunità e nodi centrali, non una pagina; non fallisce quando la gerarchia
  si rompe.
- **Asciugare subito il nucleo in questo task**: tocca 164 KB che quindici task al giorno modificano; va fatto a pezzi, spostando e non
  riscrivendo, con il tetto a cricchetto (la catena P1-P5).
- **Un tetto in righe**: si aggira allungandole, come il quadro mostra.
- **La panoramica generata da uno script**: ciò che serve all'autore è una scelta di che cosa conta, che uno script non fa; lo script controlla.

## Conseguenze

- Un documento in più da tenere, piccolo e che cambia di rado: un task lo tocca solo se aggiunge una regola, un sottosistema o un documento in
  cima a `docs/`, e allora il test lo dice.
- Finché la catena non asciuga il nucleo, la panoramica aggiunge ~2 400 token a chi la legge e non ne toglie: il risparmio (~30 000 token a
  sessione, con il nucleo a 60 KB) viene da P1-P3.
- Il nucleo rimanda in testa alla panoramica; il glossario ha la voce «Panoramica» e l'omonimo «nucleo» (di `AGENTS.md`, del prompt dello Scultore).
