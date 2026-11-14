# ADR-0201 — Le regioni del master: il riempitivo che ripete un ambiente del mondo senza chiamate, la regione trattenuta

Data: 2026-11-14 · Stato: **accettato** (T375, step 43; applica ADR-0188 punto 5 con D54.6 riformulata) · Riferimenti:
[`docs/design/campagna-master.md`](../design/campagna-master.md) § 5.1 e § 7 punto 8, ADR-0023 (l'atlante), ADR-0064 (ogni luogo è connesso),
ADR-0196 (il ritmo del mondo), ADR-0109 (gli elenchi di ciò che esce)

## Contesto

ADR-0188 (punto 5) ha deciso che il master dichiara regioni dell'atlante nell'Ufficio dei luoghi e nella Direzione, scritte dal kernel senza
chiamate, con due ambienti del kernel: `mare` e `trattenuta`. L'autore (D54.6) ha riformulato `mare`: non un ambiente del kernel ma una regione
«riempitivo» che sui luoghi nuovi **ripete un ambiente che il mondo ha già** (il mare, un deserto, un bosco…), senza chiamate al Concilio, per
indirizzare i viandanti senza dirlo e senza pagare luoghi che il master non vuole. `trattenuta` resta: una pausa locale, i luoghi dentro bozze
finché il master non la libera.

## Decisione

1. **La forma** (`src/kernel/atlas.ts`): una regione dell'atlante ha due campi facoltativi, `master: true` (l'ha dichiarata il master) e `kind`
   (`filler` o `held`, solo su una regione del master). Senza `kind` una regione del master è come quelle del Cartografo: i luoghi nuovi li
   pianifica il Cartografo con il suo ambiente (`chunk.plan`). Gli universi di prima non hanno nessuno dei due e valgono come oggi: kernel 0.7.11
   (Z).
2. **La precedenza** (`regionAt`): dove copre un luogo, una regione del master vince su quella del Cartografo; fra le sue, la più vicina (un'isola
   nel mare del master è una regione del master più piccola dentro la grande). Il primo luogo non è di nessuna regione, e una regione del master
   non lo copre. Le regioni del master non tolgono il loro ambiente al resto del mondo (`environmentsFor`: «regionali» solo quelle del Cartografo).
3. **Il riempitivo** (`fillerPlan`, `develop`): un luogo nuovo dentro un riempitivo prende l'ambiente detto dal master, steso dal suo programma col
   seme del luogo come ogni piano (`layoutOf`: varchi e sentieri del kernel, la regola 10), il nome e la descrizione della regione, nessuna cosa,
   persona, runa o struttura chiesta, nessuna carta (niente è stato scritto per lui); il piano si salva come gli altri, così torna uguale e resta
   com'è anche se la regione cambia. **Nessuna chiamata**: né il piano, né ciò che un luogo noto chiederebbe tornando, né i battiti del mondo che
   esplorarlo farebbe scattare (pacchetti, abitanti, sessioni; `applyPlan`). Costa zero, quindi né la quota dei luoghi al minuto né la pausa del
   mondo (ADR-0196) lo tengono bozza: è ciò che il master ha chiesto, non ciò che il mondo fa da sé.
4. **La trattenuta**: un luogo nuovo dentro una regione trattenuta resta bozza (il terreno procedurale, ciò che si vede già mentre il Cartografo
   scrive); la pompa non lo riprova (`pumpDevelopment`) e la generazione differita non lo pianifica (`planAhead`). Un luogo già pianificato torna
   com'era. Liberata (o cambiata in un altro tipo), i suoi luoghi si pianificano come il resto del mondo, i più vicini a un viandante per primi.
   L'ambiente di una trattenuta è facoltativo.
5. **Dichiarare e liberare** (`Kernel.declareRegion`, `releaseRegion`): solo il master (`isMaster`; da soli il viandante); uno specchio rifiuta, lo
   decide il mondo. Il controllo è una funzione pura, `masterRegion`: nome e descrizione sono testi di un giocatore (`cleanText`, 40 e 200
   caratteri) e li leggono anche le persone (le direzioni dell'atlante), quindi passano dalla quarta parete locale (`metaBreak`; mai a Jev, D45);
   centro intero entro 200 luoghi dal primo, raggio da 0 a 8, un ambiente che il mondo ha (nessuno solo per `held`), al più 32 regioni del master;
   un `id` cambia una regione del master, mai una del Cartografo. Il kernel scrive `world/atlas.json` con un commit suo, senza chiamate. «Libera»
   toglie solo una regione del master (`withoutMasterRegion`).
6. **Il filo**: il messaggio `region` del client (`op: declare` con `region`, `op: release` con `id`), solo del master, con il ritmo del messaggio
   `pace` (i due insieme: `LIMITS.paceRate`, `paceBurst`); il server lascia passare solo testi e numeri dei campi nominati (`regionAsked`) e il
   kernel controlla il resto; la risposta è la regione come il mondo l'ha scritta. L'atlante torna ai client coi file del mondo.
7. **Ciò che esce** (regola 8f): `world/atlas.json` non va più intero ai client dei giocatori: ogni regione coi campi nominati (`REGION_FIELDS`:
   id, nome, descrizione, ambiente, centro, raggio), senza `master` né `kind`, e senza le regioni trattenute (la valle che il master scriverà dopo è
   il suo piano, non ancora il mondo). Il master riceve i file interi, come oggi.
8. **Dove si fa**: l'atlante dell'Ufficio dei luoghi (`src/ui/atlas.ts`): un clic sceglie un luogo, «Dichiara regione qui» apre il modulo, le regioni
   del master in elenco con «Cambia» e «Libera», disegnate a parte (il riempitivo tinto, la trattenuta tratteggiata); la Direzione
   (`src/ui/studio.ts`): «Dichiara regione» dove è il viandante, «Regione qui» su un luogo in coda, lo stesso elenco; il tavolo della situazione
   dice i luoghi trattenuti e il tipo delle regioni. Il modulo è uno (`src/ui/regions.ts`). Il sito (la pagina della sessione) è di T377.

## Alternative scartate

- **`mare` come ambiente del kernel** (la bozza tutta acqua, ADR-0188 punto 5 com'era): riformulata dall'autore (D54.6); un ambiente che il mondo
  ha già è coerente con ciò che i viandanti vedono altrove e non chiede un aspetto nuovo.
- **Il riempitivo con le cose e le persone delle regole di comparsa** (`fallbackPlan`): una persona nuova chiama il Narratore (`npc.individuate`),
  un oggetto sconosciuto chiama la Fucina. Scartata: il riempitivo non deve costare nulla.
- **Le regioni del master scritte nel ramo del master e pubblicate** (come un file dell'editor): due passi per «riempitivo qui» mentre i giocatori
  ci vanno. Scartata: un comando del kernel, come il ritmo.
- **Il riempitivo fermato dalla pausa del mondo**: in pausa il master che dichiara un riempitivo si aspetta di vederlo; non costa e non è ciò che il
  mondo fa da sé. Scartata.
- **L'atlante intero ai giocatori, come prima**: un campo nuovo uscirebbe senza essere nominato (regola 8f) e una valle trattenuta direbbe ai
  giocatori il piano del master. Scartata.

## Conseguenze

- `AGENTS.md` (l'indice: «Geografia»; la struttura: `src/ui/regions.ts`), `docs/architettura-dettagli.md` (`#geografia`), il glossario («Regione
  del master», «Riempitivo», «Regione trattenuta»), il registro della sicurezza (V-041), ADR-0188 (l'applicazione del punto 5).
- Restano: le regioni del master nel sito (T377); un'isola dentro un riempitivo si fa con una seconda regione del master (non c'è un'operazione
  «isola»); un riempitivo con un ambiente che ha lotti mette le case comuni del mondo (i modelli esistono già dove l'ambiente si è usato).
