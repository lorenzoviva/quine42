# ADR-0153 — L'inglese è la lingua interna; il mondo ha la lingua del suo universo; le rune in latino

Data: 2026-11-06 · Stato: accettato (task T306 del backlog) · Riferimenti: D34 dell'autore (05/11 sera), `docs/lingue.md` (T239), `docs/lingua-interna.md`, ADR-0117 (il glossario), ADR-0136 (la versione del kernel), ADR-0152 (l'intervallo dei kernel e le migrazioni). Supera la convenzione «commenti Lua dell'universo in italiano» di `AGENTS.md` e la proposta «l'italiano resta la lingua interna» di `lingue.md` §3.

## Contesto

Il codice TypeScript è in inglese per convenzione, ma tutto ciò che il codice confronta per nome è in italiano: i valori dei domini
(classi, taglie, effetti, momenti, attività…), i nomi di campo dei file dell'universo, i percorsi (`world/giocatori/`), i messaggi del
protocollo, i componenti e parte dell'API che Lua vede, i commenti del Lua e degli XML, i prompt del Concilio. Il censimento di T239
(`docs/lingue-censimento.md`) conta ≈ 130 valori distinti nei domini e 212 nomi di campo su disco. `lingue.md` proponeva di tenere
l'italiano come lingua interna per sempre. L'autore (D34) ha deciso il contrario: **prima della beta l'inglese diventa la lingua interna**,
perché la comunità dello sviluppo agentico possa leggere il repository; il mondo ha **una lingua per universo** (la C di `lingue.md` §2);
i **token delle rune magiche sono latini**; i prompt diventano inglesi (P2); il filtro della quarta parete guarda la lingua del mondo,
l'italiano e l'inglese.

## Decisione

1. **Interno = inglese**: ogni valore che il codice confronta, ogni nome di campo su disco e sul filo, ogni percorso dell'universo e del
   server, ogni nome che Lua vede, i commenti del Lua e degli XML, i prompt. Una parola che è già inglese o latina resta (`lava`,
   `dungeon`, `studio`, `persona`).
2. **Il mondo nella lingua del suo universo**: bibbia, individui, ricordi, battute, trame, canone, lessico e i **nomi** delle cose (`name`
   di moduli, oggetti, terreni, ambienti, rune, incantesimi, modelli) sono testo del mondo. Oggi ogni universo è italiano; il campo
   (`universe.json → language`, `it` se manca) e la scelta alla Genesi li porta T239. Un terreno smette di essere insieme id e testo:
   ha un `id` interno e il `name` del mondo.
3. **Le rune magiche in latino**: `lux`, `ignis`, `aqua`, `terra`, `vita`, `scutum`, `ventus`, uguali in ogni lingua; i token di codice
   (`x`, `speed`) restano Lua; nome e descrizione della runa (Sowilo, «il sole») sono testo del mondo. Il latino non è la lingua di
   nessun viandante: tutti scrivono la stessa runa, come scrivono `speed`. Una runa nuova del Concilio ha un token latino (lo dirà il prompt
   in T310; il validatore di `magic.ts` non lo impone).
4. **La tabella è un dato**: `src/kernel/internalNames.ts` (`INTERNAL_NAMES`, 54 domini, 847 voci), ogni voce italiano → interno con dove
   si legge e se tocca disco, filo, Lua, prompt o solo il codice; `tests/internal-names.test.ts` la tiene senza doppioni, senza catene,
   senza collisioni con i nomi inglesi già usati nello stesso spazio (anche campo per campo nei JSON del seme e dei quattro universi di
   `lab/banco/universi-cloud/`), e la confronta con le costanti del codice e con il seme. `docs/lingua-interna.md` la racconta.
5. **Un contratto per passo, una migrazione per contratto**: T307a (`0.2`, i valori della simulazione e le rune), T307b (`0.3`, la società e il
   Concilio), T308a (`0.4`, campi e percorsi dei file), T308b (`0.5`, il filo e Lua); ognuno registra la sua migrazione in `MIGRATIONS`
   (ADR-0152) e la catena porta un universo della `0.1` all'ultimo contratto. La migrazione cambia i valori solo nei campi del loro dominio,
   rinomina i file, riscrive nel Lua generato solo le stringhe letterali dove il kernel le legge e i nomi dell'API, e rivalida il modulo:
   ciò che non passa resta com'era con un guasto per l'Ingegnere. Per un contratto il validatore ripara i valori italiani che il Concilio
   di oggi scrive ancora, fino a T310.
6. **Ciò che resta**: gli indirizzi (`/api/viandante`, `?universo=`, `window.rune`, le chiavi di `localStorage` del sito) sono
   l'interfaccia e li decide T239; i contenuti che il Concilio ha già scritto e che solo il loro modulo legge (azioni, componenti propri,
   id di oggetti e modelli) restano negli universi salvati; la documentazione e gli ADR restano italiani.
7. **Le convenzioni**: identificatori, commenti TypeScript, commenti di Lua e XML, prompt in inglese; documentazione, UI e testi del mondo
   in italiano (finché T239 non porta le altre lingue). Un nome nuovo su disco, sul filo o visibile a Lua nasce inglese, e chi aggiunge un
   valore a un dominio della tabella lo aggiunge anche lì.

## Alternative scartate

- **L'italiano interno per sempre** (`lingue.md` §3): niente migrazioni, ma un repository che solo chi sa l'italiano legge; l'autore lo
  scarta perché il lancio punta anche alla comunità agentica.
- **Le rune in inglese** (`light`, `fire`): sarebbero parole della lingua di un viandante e non di un altro; e si scontrerebbero con i
  nomi interni dello stesso mondo (l'effetto `light`, il componente `light`), che invece sono codice.
- **Un contratto solo, `0.2`, per tutto**: ≈ 800 file in un task, in conflitto con ogni altro lavoro; e un universo salvato a metà strada
  non avrebbe avuto un contratto che lo descrive.
- **Alias per sempre** (il kernel legge i due nomi): è la retrocompatibilità che D36 ha rimandato, e moltiplica i casi in ogni lettura;
  la migrazione si fa una volta, all'avvio, in un posto solo.
- **Tradurre anche il Lua generato per intero**: i commenti e le stringhe mostrate sono testo del mondo o dell'Ingegnere; si toccano solo
  i nomi che il kernel legge.

## Conseguenze

- `AGENTS.md` (Convenzioni e indice), `docs/glossario.md` (la regola, ciò che non si rinomina, «Lingua interna», «Runa magica»),
  `docs/lingue.md` §2-§4 allineato a D34.
- `KERNEL_VERSION` `0.1.12`: la tabella è un dato che nessuno legge ancora; il contratto cambia con T307a.
- I task: T307 e T308 si spezzano in T307a, T307b, T308a, T308b, da soli e in quest'ordine; T309 e T310 restano, T310 toglie la
  riparazione dei valori italiani e mette nello schema del Narratore il tipo di legame come id.
- Sicurezza: nessuna superficie nuova. I passi che seguono toccano `paths.ts`, `files.ts` e il protocollo (regole 8c, 8f): gli elenchi
  restano elenchi, cambiano solo i nomi, e la suite `tests/sicurezza/` va rinominata con loro.
