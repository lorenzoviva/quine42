# ADR-0050 — Multiplayer: il server è l'unica fonte di verità

Data: 2026-10-23 · Stato: accettato (piano, da attuare: task T33-T45 del backlog) · Completa ADR-0025 (i due tavoli);
tocca ADR-0009 (la corona nascosta), ADR-0021 (i due repository), ADR-0026 (morte), ADR-0039 (registro dei consumi).

## Contesto
La prima bozza del piano del multiplayer (`docs/plans/multiplayer.md`) era stata scritta prima del 3D: parlava di
immagini generate e di sprite, e lasciava ai client la simulazione del proprio cerchio e degli NPC vicini. L'autore
ha risposto nel to-do del 22/10/2026: il multiplayer serve anche a sostenere il gioco (un server nostro, crediti,
contenuti come carte), il server deve essere l'unica fonte di verità, i giocatori non devono poter uscire dal tappeto
né vedere il Concilio.

## Decisione
1. **Due modalità**: *singola* (come oggi; le chiamate all'IA passano dal nostro server) e *multigiocatore* (un master
   e dei giocatori; per i giocatori la corona e il Concilio non esistono, nemmeno nel codice caricato).
2. **Il server è l'unica fonte di verità**: il kernel gira sul server, i client disegnano lo stato, predicono il
   proprio passo e mandano posizione e azioni. Ogni estrazione casuale viene da semi condivisi (universo, tick,
   entità): ciò che un client calcola in anticipo coincide con il server.
3. **Il server** (Google Cloud) è il proxy verso i provider con la nostra chiave, custodisce i repository privati e fa
   riunire il Concilio anche senza il master. I luoghi nuovi li genera una volta, a spese di chi ci arriva.
4. **Crediti e carte**: chi fa generare paga; le decisioni del Concilio per il mondo si dividono. Ogni contenuto
   generato registra autore e pagante (una carta) e i suoi utilizzi.
5. **Il master** è chi crea l'universo multigiocatore e non cambia (si clona l'universo). Gira nel mondo in god mode,
   ha una sola runa del tappeto (verso la Sala del Concilio), è il solo a fare i rollback del repository. I giocatori
   non hanno le rune del tappeto e il kernel ignora le loro scritture di `carpet x y time`.
6. **Scelte definitive alla Genesi** (`universe.json → partita`): quanto è punitiva la morte (in entrambe le modalità,
   un principio per il Concilio), PvP, «Altro…» tra giocatori.

## Conseguenze
- In modalità singola il gioco non cambia; la configurazione della Genesi, l'id del viandante, il determinismo e la
  paternità dei contenuti (fase 0) servono anche da soli.
- Il kernel deve girare headless sul server (come nei test) e non usare l'orologio di sistema nella simulazione.
- La regola 3 (il giocatore può rompere il gioco) vale per il tappeto di ciascuno: la rottura non arriva agli altri.
- La regola 9 (la chiave non arriva al browser) diventa: la chiave non lascia il nostro server, e il proxy non è
  pubblico senza un account.
- Restano aperte quattro domande (fornitore degli account, contenuti tra universi, spese comuni, coefficienti):
  bloccano solo la fase 4 (T44-T45).
