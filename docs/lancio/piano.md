# Il piano di lancio (T240, aggiornato da T378)

> Step 38, Fase IV. Scritto il 05/11/2026 a partire dal blocco T240 del backlog e dalla sezione «Fase IV» di
> [`docs/userchats/to-do-2026-11-04.md`](../userchats/to-do-2026-11-04.md). **Aggiornato il 14/11/2026 (T378)** dopo la lettura
> dell'autore: il lancio è la **open beta** (Fase IV, [ADR-0184](../adr/0184-la-open-beta-senza-pagamenti-all-autore.md),
> [`docs/design/open-beta.md`](../design/open-beta.md), [`docs/fasi.md`](../fasi.md#fase-iv-la-open-beta)), senza pagamenti all'autore,
> con OpenRouter e la chiave del giocatore e con l'hosting esterno o in casa; i pagamenti e la partita IVA passano alla Fase VI; il volto
> del lancio è l'autore, Boa Loger resta mascotte (§ 4 e § 4 bis). Nessun account creato, nulla pubblicato.
> Ogni sezione finisce con le **decisioni per l'autore**, voce per voce. Le fonti, con l'URL e la data di accesso, sono in fondo
> (§ Fonti); dove una fonte non si è potuta leggere direttamente lo dico nel testo.
>
> **Limite della ricerca.** Da questa sessione `news.ycombinator.com` e `support.reddithelp.com` non si raggiungono (rete della
> sessione): le regole di Hacker News e di Reddit vengono da ricerche web che citano le pagine ufficiali, e da copie non ufficiali.
> Prima di pubblicare vanno rilette all'origine (§ 3, verifica V1-V3). Le cifre di vendita, traffico e utenti sono di fonti secondarie:
> si usano come ordini di grandezza, mai come promesse.

## Le decisioni (D35), aggiornate il 14/11

Il testo di ogni voce, con il consiglio, è nella sua sezione. Qui l'elenco come sta dopo T378; in fondo che cosa è cambiato rispetto al 05/11.

- **Da decidere ora:**
  - D3.1 — account personali su Hacker News e su Reddit **da subito**, usati per mesi (commenti utili, nessun link proprio) prima del
    lancio. *Consiglio: sì, è ancora la voce più importante del piano.* Gli account sono a nome tuo (§ 4 bis), non di Boa Loger.
  - D4.6 — **il volto del lancio sei tu**, con nome e cognome, in prima persona; Boa Loger mai portavoce. *Consiglio: sì.*
- **Senza consiglio, tue:**
  - D5.1 — 10 ore a settimana di promozione?
  - D6.2 — la chiave del server nella open beta: nessuna (i modelli li pagano solo le chiavi dei giocatori) oppure una chiave tua con un
    tetto piccolo per un universo vetrina (proposta: 10-20 $ al giorno, `OPENROUTER_TETTO_GIORNALIERO`). Non più i 75 $ del 05/11.
  - D6.4 — quanti mondi accesi sul server ufficiale (la RAM la paghi tu): proposta 4-8 al lancio, e chi trova pieno va alla demo offline e
    alla guida dell'installazione. Da fissare con la prova di carico (§ 6) e con T45f.
  - D7.3 — il codice pubblico, o il pacchetto pubblico con una licenza: **non è più solo per l'articolo sulla pipeline**, è un requisito della
    Fase IV («un mondo in self-hosting seguendo la guida» vuole che qualcuno possa scaricare il gioco). Va deciso prima che T367 pubblichi
    l'immagine.
- **Obbligatoria, in Fase VI:** D3.4 — partita IVA e dati fiscali nel piè di pagina prima di accendere Stripe in produzione, con un
  commercialista. **Nella open beta no**: non si incassa niente. Resta, già nella open beta, l'informativa privacy che nomina il titolare del
  trattamento (tu, con un'email) se il sito ha account (D3.6).
- **Consiglio sì, approvabili in blocco:** D1.1 niente «non esiste niente del genere», si dice «la combinazione»; D1.2 il titolo di Show HN
  (aggiornato, § 1); D1.3 citare *Latent Space* e Voyager; D1.4 un giorno di ricerca su LLM + MarkovJunior e sui giochi col codice
  esplorabile; D1.5 «porta la tua chiave» e «installalo tu» nel messaggio per i tecnici; D2.1 tre ordini per tre pubblici; D2.2 niente «AI»
  nel titolo per i giocatori, detta con onestà nella descrizione; D2.3 carte come collezione, niente parole di rendita; D3.2 calendario
  sfalsato; D3.3 canali (più Discord, YouTube, TikTok, newsletter, itch.io alla demo; niente Facebook; Steam rimandato); D3.6 informativa
  privacy col tuo nome nella open beta; D3.7 niente incassi di nessun tipo nella open beta (donazioni, sponsor, template a provvigione);
  D4.1 Boa Loger mascotte dentro il gioco e nella corona, non volto né portavoce; D4.2 Boa Loger gerboa nella corona; D4.4 nei video la tua
  voce vera o nessuna voce, mai sintetica; D4.7 i post li scrivi tu, l'IA indica gli errori e non riscrive; D4.8 una frase sola, uguale
  ovunque; D4.9 niente tecniche di PNL, al loro posto le cinque regole del § 4 bis; D5.2 la storia dei 18 anni raccontata e firmata da te;
  D5.3 le cinque idee, tutte; D5.4 Show HN martedì o mercoledì, mattina della costa est; D6.1 Show HN punta alla demo offline, con la chiave
  e l'installazione come passo dopo; D6.3 Low Detail proposto come predefinito nella lobby della prima settimana; D6.5 pagina «Come usiamo
  l'IA» (T368) e segnalazione dei contenuti; D7.1 articolo in inglese sulla pipeline, 2-3 settimane dopo; D7.2 tradurre solo `AGENTS.md` e
  `docs/pipeline/README.md`.
- **Facoltativa:** D4.3 Boa Loger easter egg nel mondo (senza storia d'origine).
- **Tolte:** D4.5 il bot «Boa Loger» su Discord (un bot che parla per il progetto è un portavoce: contraddice D4.6); D3.5 i Managed Payments
  di Stripe passano alla Fase VI con D3.4 (non serve deciderli ora).
- **Non verificato nel piano (V1-V12):** regole di HN, Reddit, itch.io lette da fonti secondarie; obblighi del sito e GDPR in un servizio
  gratuito; AI Act; costo reale di una Genesi; il limite proposto dall'OAuth di OpenRouter; alcune fonti del § 4 bis citate senza rileggerle.

**Cambiato rispetto al 05/11:** D3.4 dalla Fase IV alla Fase VI; D3.5 rimandata; D4.1 Boa Loger non è più «volto del Concilio» nel lancio;
D4.4 niente filtro né voce sintetica; D4.5 tolta; D5.2 narrata da te, non da Boa Loger; D6.2 e D6.4 riscritte per le chiavi dei giocatori e il
self-hosting; D7.3 diventa un requisito della Fase IV. Nuove: D1.5, D3.6, D3.7, D4.6-D4.9.

## Sintesi

1. **«Non esiste niente del genere» non regge.** Ognuno dei quattro punti di forza elencati dall'autore ha già qualcuno che lo fa:
   narrativa generativa (AI Dungeon dal 2019, Generative Agents, Project Sid, inZOI), giochi che creano giochi (Roblox, Latitude
   Voyage, Hidden Door), meccaniche generate durante il gioco (Meshy *Black Box: Infinite Arsenal*, UNBOUNDED, il prototipo
   *Latent Space*), codice scritto da LLM che gira in un mondo (Voyager, Mindcraft). Su Hacker News la frase verrebbe smontata
   nel primo commento, con i link.
2. **Ciò che non ho trovato da nessuna parte è l'insieme**, e due pezzi in particolare: un mondo che *contiene il proprio codice
   sorgente* come luogo da raggiungere (il tappeto, la corona), e rune che sono *token di codice eseguiti* quando li componi. La
   frase difendibile è nel § 1.
3. **Il pubblico dei giocatori è ostile all'IA generativa** (GDC 2026: il 52 % degli sviluppatori la giudica dannosa; Quantic
   Foundry: 77-83 % dei giocatori contrari a missioni e dialoghi generati). Per i giocatori si mostra il gioco, non l'IA; per i
   tecnici si mostra l'architettura. Due narrazioni, non una.
4. **Il piano dei sei account nuovi con gli stessi spoiler lo stesso giorno è il profilo esatto dello spam** per i filtri di Reddit
   e per i moderatori; su HN un account verde che pubblica un link il primo giorno parte svantaggiato. Meglio pochi canali,
   sfalsati, con un account che ha già una storia.
5. **Il lancio è la open beta, e la open beta non incassa** (Fase IV, ADR-0184, ADR-0189): `QUINE_PAGAMENTI=spenti`, niente Stripe,
   commissione 0. Quindi niente partita IVA né dati fiscali nel piè di pagina finché non si incassa (Fase VI, D3.4); resta l'informativa
   privacy che nomina il titolare, cioè l'autore (§ 3). L'anonimato non c'è comunque, e il piano non lo cerca più: **il volto del lancio è
   l'autore** (§ 4 bis). Boa Loger resta **mascotte** dentro il gioco e nella corona, che è il tavolo del Dungeon Master e non il mondo
   (la regola 0 resta intatta), mai portavoce.
6. **I modelli li paga chi gioca, con la sua chiave** (OpenRouter, l'OAuth PKCE o la chiave incollata; T362-T364), e le macchine chi
   ospita: il server ufficiale su una VM dell'autore (T45f), un hosting esterno o il PC di casa con la guida (T367). Per i tecnici sono due
   punti di forza da dire chiari: **«porta la tua chiave»** (vedi il costo di ogni chiamata, l'autore non prende niente) e **«installalo
   tu»** (`docker compose up`). Per i giocatori la chiave è un attrito: la porta d'ingresso resta la demo offline.
7. **Prima del lancio servono**: una demo giocabile senza account e senza costo (Show HN la richiede), un video di 60-90 s, un
   press kit, la pagina «Come usiamo l'IA» (T368) e la guida dell'installazione. Un'ora di gioco costa al giocatore circa **1,10 $** a
   dettaglio pieno e **0,38 $** in «Low Detail» (le stime del kernel più il 5,5 % di OpenRouter sull'acquisto dei crediti); **all'autore,
   al picco, costa la macchina, non i modelli** (§ 6).
8. **La voce**: l'autore in prima persona, con il suo inglese, post brevi scritti da lui (l'IA indica gli errori, non riscrive: dal 2026 HN
   vieta i commenti generati o ritoccati dall'IA), video in cui parla il gioco, l'italiano dove il pubblico è italiano. La programmazione
   neurolinguistica non ha basi scientifiche solide e su HN la persuasione si nota; funzionano una frase sola ripetuta uguale, mostrare
   prima di dire, numeri verificabili, la prima persona e la coerenza tra canali (§ 4 bis).

---

## 1. I concorrenti, punto per punto

Ho confrontato ogni punto di forza (quelli dell'autore e quelli che non aveva elencato) con chi lo fa già. «Quanto» è il mio
giudizio sulla distanza da QUINE42, con il motivo.

| Punto di forza | Chi lo fa già | Quanto | Cosa resta di QUINE42 |
|---|---|---|---|
| **Procedurale + generativo**: MJ offline, l'IA arricchisce con moduli | *Dwarf Fortress* (mondo e storia procedurali, Legends mode, oltre un milione di copie su Steam), *Minecraft* (procedurale, mod LLM sopra), Roblox Cube (oggetti 3D e «4D» interattivi da testo, 2025) | Molto: il procedurale infinito è un genere; Roblox genera già oggetti con comportamento | La combinazione: un motore procedurale che funziona senza rete *e* un Concilio che vi aggiunge moduli validati. Nessuno dei citati ha entrambe le metà |
| **Il master crea giochi** parlando al Concilio | Roblox (piattaforma UGC, con IA per gli asset), **Latitude Voyage** (aprile 2026: «World Engine», giochi progettati in linguaggio naturale), Hidden Door (mondi narrativi su licenza, accesso anticipato 2025) | Molto per l'idea, meno per la forma: Voyage e Hidden Door sono narrativi testuali, Roblox è scripting umano | Il master crea *meccaniche con codice* in un mondo 3D condiviso, non solo storie |
| **Narrativa generativa** (NPC, trame, legami, memoria) | AI Dungeon (dal 2019, ~1,5 M utenti mensili in un dato vecchio), **Generative Agents / Smallville** (Park et al. 2023: 25 agenti, memoria, riflessione, pianificazione), **Project Sid** (Altera, 2024: 10-1000+ agenti in Minecraft, ruoli, leggi votate, religioni), **inZOI Smart Zoi** (Krafton + NVIDIA ACE, modello da 0,5 B in locale, accesso anticipato 03/2025), AI Town, decine di mod di Minecraft (SecondBrain, Player2NPC, MetaNPC, Speaking Villagers) | **Moltissimo. È il punto più debole come «unico».** La domanda dell'autore («possibile che solo io l'abbia integrata?») ha risposta: no, è il campo più affollato | Società coerente su file (famiglie bidirezionali, trame con tappe e missioni, ricordi per viandante) *dentro* un gioco giocabile, più del prototipo di ricerca. È una qualità, non una prima volta |
| **Proprietà dei contenuti** (carte, eredità dei cloni, chi paga possiede) | Roblox (mercato UGC con incassi), Minecraft Marketplace, il modding in generale | Medio: la proprietà di ciò che si *crea* esiste; quella di ciò che si *fa generare pagando* in un mondo condiviso, con le quote ereditate dai cloni, non l'ho trovata | Le carte con utilizzi e la catena dei titolari (ADR-0084). Rischio: ricorda gli NFT a chi la legge di fretta (§ 2) |
| **Meccaniche e codice generati durante il gioco** | **Meshy *Black Box: Infinite Arsenal*** (GDC 2026: armi con meccaniche composte a runtime da un «Designer Agent»), **UNBOUNDED** (Google/UNC 2024: meccaniche generate da LLM), ***Latent Space*** (arXiv 2510.16952: frasi → DSL → ECS a runtime), **Voyager** (2023: libreria di abilità come codice eseguibile), **Mindcraft** (LLM che scrivono ed eseguono codice in Minecraft) | Molto, ed è recente: il 2026 è l'anno in cui se ne parla | QUINE42 genera **moduli Lua completi** (manifest + logica) che passano da un validatore e da una sandbox che non vede il kernel; l'Ingegnere ripara ciò che fallisce. *Latent Space* è il più vicino per filosofia (motore deterministico, IA vincolata): va citato, non ignorato |
| **Il mondo fatto del proprio codice** (tappeto, corona, studio del Concilio) | Nessuno trovato. Parenti lontani: giochi meta (*Baba Is You*: regole come parole spostabili; *Hack 'n' Slash* di Double Fine, 2014: si modifica il codice del gioco), *Quine* come genere di programmi | Poco | **Il punto più forte e più raro.** Le regole come oggetti esistono (*Baba Is You*); un mondo che si può lasciare per entrare nel proprio sorgente, dove si vedono gli agenti che lo scrivono, no |
| **Rune che sono token di codice eseguiti** | *Baba Is You* (parole-regola), linguaggi visivi in gioco (*Factorio* circuiti, *Minecraft* redstone, *Hack 'n' Slash*) | Poco | Un token Lua vero per casella, frasi eseguite dal kernel: si può rompere la simulazione o uscirne. Unico nella forma trovata |
| **Modelli come programmi di testo** (MarkovJunior 3D scritti da un LLM, un programma per tipo, istanze come semi) | MarkovJunior (mxgmn, ~7.700 stelle, 153 esempi) come strumento procedurale; text-to-3D (Roblox Cube, Meshy) come mesh | Medio: l'MJ esiste e gli LLM che scrivono codice di generazione esistono; l'unione in un gioco giocato, con un critico (l'Artista) che guarda le foto, non l'ho trovata | Costo: testo invece di immagini o mesh (ADR-0037); ogni modello è leggibile, modificabile a mano, versionato in git |
| **Due tavoli** (il mondo non sa di essere un gioco, filtro della quarta parete) | Prompt di sistema di ogni gioco con LLM; Hidden Door «impone limiti nel mondo» | Medio | Il filtro è codice (`fourthwall.ts`), non solo prompt; ma è un dettaglio da articolo tecnico, non da titolo |

**Ciò che resta davvero unico, nella forma più prudente:** *l'insieme* — un kernel che l'IA non può toccare, attorno al quale
un concilio di agenti scrive durante il gioco codice Lua, aspetto 3D (come programmi MarkovJunior) e storia, tutto validato e
versionato in git; e un mondo che contiene il proprio codice sorgente come luogo, raggiungibile componendo rune che sono token
eseguiti. Ogni pezzo singolo ha un precedente; l'unione e i due pezzi meta no, almeno in ciò che una ricerca di un giorno
trova. Questo va scritto così, con la clausola.

**La frase per Hacker News** (inglese, perché lì si scrive in inglese; il titolo deve descrivere, non lodare):

> *Show HN: QUINE42 – a voxel world written by LLM agents while you play, and you can walk out into its source code*

Il primo commento dell'autore (le linee guida di Show HN chiedono di esserci e di raccontare il retroscena):

> *Not the first game with LLM NPCs (AI Dungeon, Smallville, Project Sid did that) or runtime-generated mechanics (Latent
> Space, Meshy's Black Box). What I haven't seen elsewhere is the combination: a TypeScript kernel the AI can't touch; a
> "council" of Gemini agents writing sandboxed Lua modules, 3D models as MarkovJunior text programs, and the story — all
> validated and committed to a git repo; and runes on the ground that are real Lua tokens, so the sentence you lay down runs.
> Stop the carpet that keeps you at the centre and you reach the "corona": the studio where the agents work on the world's
> code. Offline mode plays without any API key. With the real agents you bring your own OpenRouter key and see the cost of
> every call; or you run the whole thing yourself with docker compose. It's an open beta: I don't take any money.*

Ciò che quel commento fa: cita i concorrenti *prima* che li citi qualcun altro (su HN è il modo per non essere smontati), e
mette in primo piano solo ciò che si può verificare giocando.

**Attenzione (14/11): quel commento è una bozza scritta da un modello, e così non si può pubblicare.** Dal marzo 2026 le linee guida di
HN dicono «Don't post generated comments or AI-edited comments. HN is for conversation between humans» (V1). Il primo commento è un
commento: lo scrive l'autore, con le sue parole, in prima persona («I'm Lorenzo, a solo developer from Italy…»), tenendo da qui solo
l'ordine delle cose da dire. Come gestire l'inglese è nel § 4 bis.

**Decisioni per l'autore**
- D1.1 — Rinunciare alla frase «non esiste niente del genere» in ogni canale e usare «la combinazione» con i nomi dei concorrenti. *Consiglio: sì.*
- D1.2 — Titolo di Show HN: quello sopra o una variante (vincoli: niente maiuscole enfatiche né superlativi). *Consiglio: quello sopra.*
- D1.3 — Citare *Latent Space* e Voyager nel post tecnico come lavori affini. *Consiglio: sì, rafforza la credibilità.*
- D1.4 — Prima del lancio, una ricerca di un giorno in più su «LLM» + «MarkovJunior» e su giochi «quine»/meta con codice esplorabile (non l'ho chiusa: § Fonti, «non verificato»).
- D1.5 — «Porta la tua chiave» e «installalo tu» nel messaggio per i tecnici (primo commento di Show HN, post tecnico, README del pacchetto), detti come fatti: chi paga cosa, quanto, e che l'autore non incassa. *Consiglio: sì.* Nei canali dei giocatori non in testa: lì la chiave è un attrito, non un vantaggio.

---

## 2. I punti di forza, in ordine, per pubblico

L'ordine dell'autore (1 procedurale+generativo, 2 master, 3 narrativa, 4 proprietà) mette in testa i punti più affollati.
Propongo un ordine diverso per ogni pubblico, perché i tre pubblici vogliono cose opposte.

### Tecnico (Hacker News, r/programming, r/proceduralgeneration, Lobsters, sviluppatori)

1. **Il mondo fatto del proprio codice, e le rune eseguite.** È il gancio: nessuno l'ha visto, si capisce in una GIF, è
   tecnicamente vero (token Lua, `Crossing`, kernel immutabile).
2. **L'IA non rompe mai il gioco; il giocatore sì** (regole 1-3): kernel in TypeScript, sandbox Lua senza `_G`, validatore per
   ogni contenuto generato, rollback in git, riparazione automatica. È la risposta alla prima obiezione di ogni tecnico
   («e quando l'LLM scrive codice rotto?»).
3. **I modelli 3D come programmi di testo** (MarkovJunior), scritti dallo Scultore e giudicati dall'Artista su foto: niente
   immagini generate, costo da testo. Interessa r/proceduralgeneration più di ogni altra cosa.
4. **L'universo è un repository git**: ogni stato valido è un commit; si può clonare un mondo, vederne la storia.
5. **Il costo misurato, pagato con la propria chiave**: ~1 $ l'ora a dettaglio pieno, ~0,36 $ in «Low Detail» (più il 5,5 % di
   OpenRouter sui crediti), con il registro dei consumi per compito e, con OpenRouter, il costo vero di ogni chiamata (`usage.cost`). I
   tecnici chiedono sempre il costo; averlo misurato è raro, e un gioco che non ricarica niente sopra il prezzo dei modelli lo è ancora di più.
6. **Installalo tu**: lo stesso pacchetto del server ufficiale, un'immagine Docker con la guida (VPS, Railway, Fly, il PC di casa dietro un
   Cloudflare Tunnel; T367). Per HN e r/selfhosted è un argomento a sé. Vale solo se il pacchetto si può scaricare davvero (D7.3).
7. La pipeline agentica con cui è stato costruito (§ 7) — *come storia a parte*, non nello stesso post.

### Giocatori (r/IndieGaming, r/proceduralgeneration lato gioco, TikTok, YouTube)

Qui il dato del § 3 pesa: la parola «IA» nel titolo fa perdere metà del pubblico. Si parte dall'esperienza.

1. **Rompere il mondo con una frase**: raccogli rune, componi una frase, il tappeto si ferma, la corona appare. È un mistero da
   scoprire, perfetto per clip brevi («ho scritto `speed = 9` e…»).
2. **La magia componibile**: formule di rune dove l'ordine conta e il Concilio dà nome all'incantesimo la prima volta che
   qualcuno lo pronuncia — *il tuo* incantesimo, con il tuo nome nella carta.
3. **Un mondo che risponde a «Altro…»**: puoi provare qualunque azione e il mondo la giudica e la fa diventare regola.
4. **Persone con famiglie, routine e memoria** — senza dire «IA»: «si ricordano di te».
5. Lo stile a cartone e voxel, la musica generata come programma.

### Creatori (modder, chi fa modelli voxel, master di D&D)

1. **Fare il master**: un mondo tuo, regolato nella lobby, in cui chiedi al Concilio meccaniche, luoghi, regole; amici dentro.
   Il paragone giusto è il Dungeon Master, non Roblox.
2. **Il laboratorio di MarkovJunior** (`/lab/`, editor, SoundLab): l'autore stesso lo trova il pezzo più divertente; un modello
   bello si vede, si condivide, ha un autore.
3. **Le carte**: ciò che crei o paghi porta il tuo nome e conta i suoi utilizzi; i cloni ereditano le quote. *Attenzione*: va
   presentato come «riconoscimento e collezione», mai come investimento — chi ha visto gli NFT nel 2021-22 ci legge una
   promessa di guadagno, e se le quote diventassero denaro la cosa cambierebbe natura anche legalmente (§ 3, DSA).

**Decisioni per l'autore**
- D2.1 — Adottare tre ordini diversi per i tre pubblici. *Consiglio: sì.*
- D2.2 — Nei canali dei giocatori non mettere «AI» nel titolo né nella prima frase; dirlo nella descrizione, con onestà (Steam e itch lo chiedono comunque, § 3). *Consiglio: sì.*
- D2.3 — Le carte presentate come collezione e riconoscimento, senza parole di rendita. *Consiglio: sì.*

---

## 3. Il piano dell'autore, giudicato

Il piano: account dedicati (Gmail, Reddit, Hacker News, X, Instagram, Facebook), una settimana di spoiler pubblicati lo stesso
giorno ovunque, un post finale con il link il giorno del rilascio, una narrativa attorno a Boa Loger.

### Le regole che il piano incontra

**Hacker News** (fonti in fondo; pagine ufficiali non lette direttamente da qui):
- Show HN è per qualcosa che *si può provare*: niente pagine di atterraggio, liste d'attesa, iscrizioni obbligatorie. Se non è
  pronto da provare, «non fare uno Show HN».
- «Non chiedere ad amici di votare o commentare»: vietato, con penalità per invii, account e siti; anche gli anelli di voto e gli
  account multipli.
- Gli account nuovi sono in verde; i loro commenti e invii vengono guardati con più sospetto (questo da guide di terzi, non
  dalle FAQ: da verificare, V1).
- Il sito non va usato principalmente per promuoversi: un account che esiste solo per il lancio è esattamente questo.

**Reddit**:
- La regola dei 9 a 1 (al più un decimo dell'attività per i propri contenuti) è una norma della comunità ripresa da molte
  subreddit (per esempio r/pcgaming la scrive nel wiki), non una regola di sito; ogni subreddit ha le sue, e alcune vietano del
  tutto l'autopromozione.
- I filtri antispam penalizzano gli account nuovi e con poco karma nella comunità; l'aiuto di Reddit stesso suggerisce di
  commentare prima di pubblicare (riportato da fonti secondarie, V2).
- r/gamedev: autopromozione tollerata solo se il post insegna qualcosa (post-mortem, tecnica); i moderatori tolgono i post
  travestiti da «chiedo un parere».
- Lo stesso testo e lo stesso link in molte subreddit nello stesso giorno è il segnale classico dello spam.

### Giudizio, voce per voce

| Voce del piano | Giudizio | Perché |
|---|---|---|
| Account dedicati nuovi | **Da cambiare** | Su HN e Reddit l'età e la storia dell'account contano; un account creato per il lancio non ha né l'una né l'altra. Meglio un account personale dell'autore (che serve comunque, § 3 identità) creato **ora** e usato per commentare per mesi, prima. Su X, YouTube, TikTok, Instagram un account del progetto va bene: lì un marchio è normale |
| Spoiler nello stesso giorno ovunque | **Da togliere** | Stesso contenuto, stessa data, account nuovi: per i filtri e i moderatori è spam, e si brucia l'attenzione di tutti i canali in un colpo solo. Ogni canale ha il suo formato e il suo momento |
| Una settimana di spoiler | **Da allungare e spostare** | Una settimana non costruisce un pubblico; 8-10 settimane di devlog sì (§ 5). Gli spoiler vanno dove ci si può iscrivere (YouTube, Discord, newsletter), così il giorno del lancio qualcuno c'è già |
| Post finale unico con il link | **Da sfalsare** | Show HN un giorno, r/proceduralgeneration con un post tecnico un altro, r/IndieGaming con un video un altro ancora: ogni post scritto per quella comunità |
| Gmail dedicato | Va bene | Serve per gli account del progetto e il press kit |
| X | Va bene, priorità media | Comunità di gamedev e IA ancora lì; il traffico verso link esterni è debole |
| Instagram | Priorità bassa | Riusa le clip verticali di TikTok; non vale lavoro dedicato |
| Facebook | **Da togliere** | Pubblico lontano da questo gioco; costo senza ritorno per una persona sola |

**Canali che mancano**, in ordine di valore:
1. **Discord** — la casa della comunità: master che cercano giocatori, chi fa modelli MJ, segnalazioni. Necessario prima del
   lancio, perché il giorno del lancio la gente deve avere un posto dove restare.
2. **YouTube** — devlog lunghi (5-10 min) e Shorts; è dove un gioco strano diventa comprensibile. Il video della landing
   (ADR-0131) è già un primo pezzo.
3. **TikTok** — clip di 15-30 s del momento «ho rotto il mondo con una frase»; è il canale con più portata per un gioco visivo
   e strano, e non chiede storia dell'account.
4. **Una newsletter** (o la lista d'attesa del sito) — l'unico pubblico che possiedi: un indirizzo email vale più di un follower.
5. **itch.io** — una pagina per la versione nel browser, ben vista da chi gioca indie; chiede di dichiarare l'uso di IA
   generativa (da verificare, V4).
6. **Bluesky e Mastodon** (gamedev.place) — molta della comunità gamedev e tecnica si è spostata lì; costo minimo se si
   ripubblica.
7. **Steam** — *non ora*: è per giochi scaricabili, costa 100 $ di iscrizione, e per i contenuti generati durante il gioco Valve
   chiede di descrivere i guardrail contro i contenuti illegali e dà ai giocatori un pulsante per segnalarli. Una pagina «coming
   soon» ha senso solo se un giorno ci sarà una versione desktop.

### L'identità pubblica in UE

**Aggiornato il 14/11.** Il lancio è la open beta, che non incassa (Fase IV, ADR-0184, ADR-0189); gli obblighi qui sotto valgono in due
tempi.

**Nella open beta (Fase IV).** Niente Stripe, niente commissione, nessun prezzo: niente partita IVA né dati fiscali nel piè di pagina.
Restano:
- **GDPR, art. 13**: se il sito ha account (Firebase) o tiene dati di chi gioca, l'informativa privacy dice chi è il titolare del
  trattamento e come contattarlo, cioè il nome dell'autore e un'email. Un servizio pubblico non è un uso personale: l'esenzione domestica
  non si applica (V11).
- **Il d.lgs. 70/2003** parla di servizi «normalmente dietro retribuzione»: per un servizio gratuito senza nessun incasso l'obbligo dell'art. 7
  è meno chiaro. Il nome e un contatto in una pagina «chi siamo» costano niente e coprono il dubbio; il resto va chiesto a un professionista
  (V5, V11).
- **Nessun incasso, di nessun tipo**: donazioni, Patreon, sponsor, link di affiliazione o un template di Railway con la provvigione (D52.6)
  sono incassi, e riportano qui sotto prima del tempo (D3.7).
- **Il self-hosting sposta la responsabilità**: chi ospita un server suo è titolare dei dati dei suoi giocatori; la guida (T367) lo dice.

Per il piano della voce questo cambia poco: il nome dell'autore c'è comunque (nell'informativa e, per scelta, in prima persona, § 4 bis).

**Nella produzione (Fase VI).** Chi si fa pagare non può essere anonimo, e non per scelta di marketing:
- **Art. 7 d.lgs. 70/2003** (recepimento dell'art. 5 della direttiva 2000/31/CE): chi presta un servizio della società
  dell'informazione deve rendere accessibili nome o ragione sociale, domicilio o sede, contatti incluso l'email, l'eventuale
  iscrizione al registro delle imprese e **la partita IVA** se l'attività vi è soggetta; l'omissione è sanzionata (art. 21).
- **Art. 35 DPR 633/72**: la partita IVA va indicata nella home page del sito (la prassi la mette nel piè di pagina).
- **Codice del consumo** (contratti a distanza): identità e indirizzo del professionista prima dell'acquisto.
- **GDPR**: l'informativa sulla privacy nomina il titolare del trattamento — chi è, non come si chiama la mascotte.
- **Stripe**: il nome pubblico dell'attività, il telefono e l'email di assistenza compaiono su ricevute ed estratti conto
  (*statement descriptor*). Con i **Managed Payments** (in anteprima privata secondo la documentazione di Stripe) il
  *merchant of record* è Stripe/Link («Sold through Link»): toglie molto lavoro su IVA e rimborsi, **ma non toglie gli obblighi del
  d.lgs. 70/2003** sul sito, che resta un servizio dell'autore.
- **DSA, art. 30** (tracciabilità dei commercianti): riguarda i *mercati online* in cui terzi vendono ai consumatori. Oggi QUINE42
  non lo è (i crediti si comprano dal gestore, le carte non si vendono). Se un giorno le carte o le quote si potessero vendere tra
  giocatori, QUINE42 diventerebbe una piattaforma con obblighi di verifica dei venditori: è un motivo in più per tenere le carte
  fuori dal denaro (D2.3).

Conseguenza: dalla Fase VI il nome e il cognome dell'autore saranno in fondo a ogni pagina del sito e su ogni ricevuta. Il «finto
anonimato facile da forare» del piano non è una scelta: è forato per legge appena si incassa, e già nella open beta dall'informativa
privacy. Il premio a chi «scopre» l'autore non c'è. Resta la mascotte (§ 4), e il volto è l'autore (§ 4 bis). *Non sono un consulente
legale: le voci sopra vanno confermate con un commercialista prima di attivare i pagamenti (V5), e quelle della open beta prima di aprire
gli account al pubblico (V11).*

**Decisioni per l'autore**
- D3.1 — Creare *ora* un account personale su Hacker News e su Reddit e usarli per mesi (commenti utili, nessun link proprio) prima del lancio. *Consiglio: sì, è la voce più importante del piano.*
- D3.2 — Togliere la pubblicazione simultanea; adottare il calendario sfalsato del § 5. *Consiglio: sì.*
- D3.3 — Canali: aggiungere Discord, YouTube, TikTok, newsletter; itch.io alla demo; Bluesky/Mastodon a costo zero; togliere Facebook; Instagram solo come riuso; Steam rimandato. *Consiglio: sì.*
- D3.4 — Partita IVA e dati dell'autore nel piè di pagina del sito prima di accendere Stripe in produzione; verifica con un commercialista (V5). *Obbligatorio, in Fase VI* (dal 10/11: la open beta non incassa).
- D3.5 — Restare con i Managed Payments di Stripe (merchant of record) se l'accesso viene confermato. *Rimandata alla Fase VI, con D3.4* (il consiglio resta sì, per l'IVA OSS sui consumatori UE).
- D3.6 — Nella open beta un'informativa privacy che nomina l'autore come titolare, con un'email, e una pagina «chi siamo» con nome e contatto. *Consiglio: sì* (GDPR; V11).
- D3.7 — Nella open beta nessun incasso di nessun tipo (donazioni, sponsor, affiliazioni, template a provvigione). *Consiglio: sì*: è ciò che tiene la partita IVA fuori dalla Fase IV.

---

## 4. Boa Loger

L'idea: un gerboa, Boa Loger, «sviluppatore» del gioco che vi ha giocato a lungo; finto anonimato facile da forare; citato nella
narrativa («il viandante Boa Loger, passato anni fa…»); intervistato nei video con la voce dell'autore o una voce sintetica;
simbolo del «collettivo artistico» che fa i contenuti.

### Cosa tenere

- **Il gerboa.** Il gioco ce l'ha già: gli avatar del Concilio nella corona sono gerboa giganti con un cappello per ruolo
  (T50, T158) e il sito ha «il segreto dei gerboa» nel piè di pagina. Boa Loger non va inventato: va *promosso*. È coerente,
  riconoscibile, disegnabile.
- **Il «collettivo artistico».** È la descrizione *vera* di come il gioco è fatto: un Concilio di agenti con ruoli (Narratore,
  Scultore, Artista, Musicista…). Boa Loger come gerboa del Concilio *dentro il gioco* è onesto e ha fascino.
- ~~**Le interviste animate.**~~ *Tolte il 14/11*: un gerboa intervistato parla per il progetto, cioè fa il portavoce (§ 4 bis).

**Aggiornato il 14/11.** L'autore, rileggendo il piano, pensa che debba metterci la faccia lui, senza nome finto e forse senza personaggio,
e chiede se un personaggio darebbe un messaggio sbagliato. La risposta è sì, per questo progetto, ed è nel § 4 bis: **Boa Loger resta
mascotte dentro il gioco e nella corona, mai portavoce** (né nei post, né nei video, né su Discord).

### Cosa rischia

| Variante | Rischio |
|---|---|
| **Finto sviluppatore** (Boa Loger «ha creato il gioco») | Alto. Il nome dell'autore è comunque nel piè di pagina (§ 3): chi lo nota non si sente premiato, si sente preso in giro, e su HN e Reddit «chi c'è davvero dietro?» diventa il thread al posto del gioco. Un progetto sull'IA con un autore finto alimenta il sospetto che anche il resto sia finto |
| **Mascotte dichiarata** («Boa Loger, il gerboa del Concilio; il gioco lo fa Lorenzo») | Basso. È ciò che fanno molti studi con una mascotte. Lascia all'autore la storia dei 18 anni, che è il racconto più forte che ha (§ 5) |
| **Mascotte portavoce** (il gerboa dichiarato che parla per il progetto: interviste, post, video narrati) | Medio, e il 14/11 lo giudico troppo: in un progetto sull'IA una voce che non è una persona fa pensare a un testo o a una voce generati, e la fiducia cala (§ 4 bis); copre la storia vera invece di raccontarla |
| **Voce sintetica** | Medio, gestibile. L'AI Act, art. 50, si applica dal 02/08/2026: chi usa un sistema che genera *deepfake* (contenuti che somigliano a persone esistenti e sembrano autentici) deve dichiararlo; per opere evidentemente artistiche o di finzione basta dichiararlo in modo che non rovini l'opera. Un gerboa a cartone non somiglia a nessuno, ma: (a) se la voce sintetica *imita la voce dell'autore* o di qualcuno, è un deepfake audio e va dichiarato; (b) se Boa Loger *risponde* agli utenti con un LLM (un bot su Discord), l'art. 50(1) chiede di dire che si parla con un'IA. *Consiglio del 05/11: una riga «voce sintetica» nei titoli di coda di ogni video* (V6). *Superato il 14/11 da D4.4: nessuna voce sintetica, quindi nessun obbligo da gestire* |
| **Nella narrativa del mondo** («il viandante Boa Loger, passato anni fa…») | Dipende da dove. Vedi sotto |

### La regola 0

La regola 0 (ADR-0025) vieta il meta-gioco *dentro il mondo*: nessun abitante sa che il mondo è un gioco. Allora:

- **Nella corona sì, senza limiti.** La corona è il tavolo del Dungeon Master: lì il Concilio è dichiarato, i gerboa lavorano al
  codice. Boa Loger come gerboa del Concilio (per esempio il Referente, che accoglie chi trascende, o un gerboa che non lavora e
  osserva) è coerente con tutto il progetto e non tocca la regola.
- **Nel mondo, solo come personaggio del mondo.** «Boa Loger, un viandante che passò di qui anni fa e scavò il pozzo» è
  ammissibile *se* non allude allo sviluppatore, al creatore, a chi «ha fatto» il mondo, a chi vi ha giocato. «Il viandante che ha
  creato queste terre» è meta-gioco travestito da leggenda (esattamente il caso che `COUNCIL_PRINCIPLES` vieta: «nemmeno
  allusioni travestite da leggenda»). Un nome ricorrente è un *easter egg*; un nome che spiega l'origine del mondo è una crepa.
- **Tecnicamente**: se il nome entra nei contenuti generati, entra dal lessico o dalla bibbia, non da una regola del kernel; e
  `metaBreak` non lo fermerebbe (il nome non è nel filtro), quindi la frase giusta va scritta a mano nel seme e controllata.

**Decisioni per l'autore**
- D4.1 — Boa Loger come **mascotte dichiarata dentro il gioco e nella corona** (e nel press kit come immagine), non come finto sviluppatore né come portavoce. *Consiglio: sì.* (Riscritta il 14/11: prima diceva «volto del Concilio».)
- D4.2 — Boa Loger nella corona come gerboa del Concilio (Referente o un posto suo). *Consiglio: sì; un task piccolo dopo il via.*
- D4.3 — Boa Loger nel mondo solo come nome ricorrente senza storia d'origine (un easter egg nel lessico o in una leggenda locale). *Consiglio: facoltativo.*
- D4.4 — Voce nei video: quella vera dell'autore, senza filtro, oppure nessuna voce (parla il gioco, con i sottotitoli); mai una voce sintetica. *Consiglio: sì.* (Riscritta il 14/11: prima consigliava la voce filtrata; un filtro su una persona vera fa pensare a una voce generata e non serve più, perché non c'è un personaggio da far parlare.)
- ~~D4.5 — Un bot «Boa Loger» su Discord.~~ *Tolta il 14/11*: un bot che risponde per il progetto è un portavoce. Su Discord risponde l'autore.

---

## 4 bis. La voce dell'autore

Aggiunto il 14/11 (T378). La domanda dell'autore: il suo inglese non è perfetto, per questo pensava a Boa Loger come portavoce; leggendo il
piano pensa che debba metterci la faccia, e chiede se un personaggio screditerebbe il gioco. Chiede anche di considerare la
«programmazione neurolinguistica» perché il messaggio arrivi forte e chiaro.

### Un personaggio darebbe il messaggio sbagliato?

Sì, qui. Tre ragioni, in ordine di peso.

1. **Il progetto è sull'IA, e il sospetto del pubblico è già quello.** Il § 2 lo dice con i numeri: i giocatori sono ostili all'IA
   generativa. Un portavoce che non è una persona (un gerboa, una voce che potrebbe essere sintetica, un testo levigato) è letto come
   «anche questo l'ha fatto l'IA». Uno studio del 2025 (Schilke e Reimann, 13 esperimenti) misura che dire di aver usato l'IA per un
   lavoro abbassa la fiducia in chi l'ha fatto, e che essere scoperti senza averlo detto la abbassa di più: un personaggio che sembra
   nascondere qualcosa paga il conto peggiore. Non c'è uno studio sui gerboa portavoce; il ragionamento è questo.
2. **Un personaggio si riconosce come strumento di marketing.** Il modello della *persuasion knowledge* (Friestad e Wright, 1994): quando
   il pubblico riconosce un tentativo di persuasione, lo valuta come tale e sconta il messaggio. Su HN e Reddit il pubblico è
   addestrato a riconoscerlo.
3. **La storia più forte è dell'autore**, e un personaggio la copre: uno sviluppatore italiano, da solo, 18 anni di tentativi, un lavoro
   da dipendente, un gioco che non gli porta un euro nella open beta. È verificabile, è umana, è il tipo di storia che HN e r/gamedev
   premiano. Chi parla in prima persona con nome e cognome è anche più credibile come fonte (la credibilità della fonte è uno dei
   risultati più vecchi della psicologia della persuasione: Hovland e Weiss, 1951).

Boa Loger ha comunque un posto, dove non parla per nessuno: dentro il gioco, nella corona, nel logo e nelle immagini del press kit (§ 4).

### L'inglese non perfetto

**Non è un difetto da nascondere: è parte della storia.** HN e Reddit sono pieni di autori che non sono madrelingua, e nessuno li
penalizza per una preposizione sbagliata; li penalizza per un testo che sembra scritto da un'IA. Sul parlato con un accento la ricerca è
discorde: Lev-Ari e Keysar (2010) misurano che frasi dette con un accento straniero forte sembrano meno vere; repliche successive in parte
non trovano l'effetto (Souza e Markman, 2013) e in parte sì (Boduch-Grabka e Lev-Ari, 2021). Ne segue solo che nei video conviene che
parli il gioco, con i sottotitoli, e che la voce dell'autore sia un di più, non il veicolo del messaggio.

Come gestirlo, per canale:

| Canale | Chi scrive o parla | Come |
|---|---|---|
| **Hacker News** (titolo, primo commento, risposte) | l'autore | Frasi brevi, una idea per frase, niente aggettivi di lode. Dal marzo 2026 le linee guida di HN vietano i commenti generati **o ritoccati** dall'IA (V1): l'IA può *indicare* gli errori (un elenco: «riga 3, *informations* → *information*»), l'autore li corregge a mano; un correttore ortografico non generativo va bene. Una riga onesta in fondo se serve: «English isn't my first language». |
| **Reddit** | l'autore | Come su HN. Molte subreddit tolgono i post scritti dall'IA, e i lettori li riconoscono dal ritmo e dalle parole tipiche; un post imperfetto e concreto vale di più. Ogni post scritto per quella subreddit (§ 3). |
| **Video** (YouTube, TikTok, Shorts) | il gioco | Il gioco dal primo secondo (§ 6), i sottotitoli in inglese scritti dall'autore e corretti come sopra; la voce dell'autore solo dove aggiunge (il devlog lungo), vera, senza filtro (D4.4). |
| **Post tecnico e press kit** | l'autore, poi una rilettura | Qui il testo è lungo e resta: l'autore lo scrive, l'IA segnala gli errori, una persona madrelingua (un beta tester, un amico) lo rilegge se c'è. Mai riscritto da un modello. |
| **Discord, newsletter** | l'autore | Breve e frequente; gli errori qui contano meno di tutto. |
| **Pubblico italiano** (comunità italiane di gamedev, stampa di settore italiana, il devlog in italiano) | l'autore, in italiano | Dove il pubblico è italiano si scrive in italiano: è la lingua in cui l'autore è più forte, e un primo pubblico italiano è un punto d'appoggio per il resto. |

### La programmazione neurolinguistica

Detto con onestà: **la PNL non ha basi scientifiche solide.** Le revisioni della letteratura trovano poche prove e di qualità bassa: Sturt e
altri (2012, revisione sistematica sugli esiti in salute: poche prove che funzioni), Witkowski (2010, trentacinque anni di ricerca: la
maggior parte degli studi controllati non conferma i suoi assunti), Passmore e Rowson (2019, nel coaching: le pratiche proprie della PNL
sono poco sostenute dalle prove). E su HN ha un costo in più: le tecniche di persuasione (ancoraggi, comandi incassati, presupposizioni,
scarsità finta, «ultime ore») si notano, e chi le nota sconta il messaggio (il modello di Friestad e Wright, sopra). Su un pubblico tecnico
costano credibilità invece di darne.

Al suo posto, ciò che ha prove o almeno una pratica consolidata dietro, e che non ha bisogno di nascondersi:

1. **Una frase sola, uguale ovunque.** La stessa frase nel titolo del video, nella bio di ogni account, nella prima riga del sito, nel press
   kit, detta dall'autore in ogni intervista. La ripetizione fa ricordare e rende una frase più facile da credere (l'effetto della verità
   illusoria: Hasher e altri, 1977; meta-analisi di Dechêne e altri, 2010) — funziona anche con le frasi false, ed è per questo che la
   frase deve essere vera e verificabile in un minuto di gioco. Il principio della frase semplice, concreta e ripetuta è anche il cuore di
   *Made to Stick* (Heath e Heath, 2007). La proposta, senza «IA» (D2.2):
   - EN: ***You can walk out of the world and into its source code.***
   - IT: ***Puoi uscire dal mondo ed entrare nel suo codice sorgente.***

   La seconda frase cambia per pubblico (§ 2): ai tecnici «…written by LLM agents while you play», ai giocatori «…by laying runes on the
   ground».
2. **Mostrare prima di dire.** Il gioco dal primo secondo di ogni video, prima del logo e prima del testo: chi guarda decide in pochi
   secondi, e chi studia i trailer dei giochi indipendenti (Zukowski, Kenney) lo consiglia per questo. La demo offline senza account è la
   stessa regola applicata al link.
3. **Numeri verificabili.** 1,04 $ l'ora, il costo di ogni chiamata nel registro, 18 anni, una persona, quante righe, quanti ADR, il
   kernel che l'IA non tocca: ogni numero si può controllare, e un numero controllato vale più di un aggettivo. Mai un numero che non si può
   controllare (traffico, utenti) presentato come certo.
4. **Prima persona.** «Ho fatto», «non so ancora», «questo non funziona bene». Dire i limiti prima degli altri è ciò che il § 1 già fa con
   i concorrenti; la ricerca sui messaggi a due lati (che presentano un'obiezione e la confutano) li trova più persuasivi di quelli a un lato
   solo (O'Keefe, 1999; citato senza rileggerlo, V12).
5. **Coerenza tra canali.** La stessa frase, gli stessi numeri, la stessa faccia, lo stesso nome dappertutto. Su HN qualcuno confronta
   sempre il sito, il README e i post: una differenza diventa il thread.

**Decisioni per l'autore**
- D4.6 — Il volto del lancio è l'autore, con nome e cognome, in prima persona; Boa Loger mai portavoce. *Consiglio: sì.*
- D4.7 — I testi pubblici li scrive l'autore; l'IA segnala gli errori e non riscrive (su HN è una regola, altrove è credibilità). *Consiglio: sì.*
- D4.8 — Una frase sola, uguale in ogni canale e lingua (quella sopra o una variante). *Consiglio: sì, e deciderla prima di aprire gli account del progetto.*
- D4.9 — Niente tecniche di PNL o di persuasione nascosta; al loro posto le cinque regole sopra. *Consiglio: sì.*

---

## 5. Calendario e idee

### Ipotesi

Una persona sola, che sviluppa anche; **10 ore a settimana** per la promozione (di più toglie lo sviluppo). Il lancio è **la open
beta** (Fase IV): il calendario parte quando la Fase III è chiusa (il kernel 1.0.0, le quattro lingue, T239) **e** il gioco ha ciò che
la open beta chiede (la modalità senza pagamenti, T361, fatta; OpenRouter e la chiave del giocatore, T362-T364; la pagina «Come usiamo
l'IA», T368; il pacchetto e la guida, T367; il server ufficiale su una VM, T45f). Settimana 0 = tutto questo fatto; il lancio è alla
settimana 10. Tutto ciò che serve in anticipo (gli account personali, D3.1) parte **subito**, oggi, perché richiede mesi e quasi
nessun tempo.

| Quando | Cosa | Ore |
|---|---|---|
| **Da oggi alla Fase IV** | Account HN e Reddit personali, a nome dell'autore: 2-3 commenti utili a settimana nelle comunità dove si lancerà (r/proceduralgeneration, r/gamedev, r/selfhosted). Nessun link proprio. Scritti da lui, come nel § 4 bis | 1 h/sett. |
| Sett. 0-1 | La frase (D4.8); Discord (canali, regole, ruoli), newsletter, account del progetto su YouTube/TikTok/X/Bluesky, tutti con la stessa frase e lo stesso nome dell'autore; press kit (§ 6) | 12 h |
| Sett. 1-2 | Il **video principale** (60-90 s) e 5 clip verticali, con il gioco che parla e i sottotitoli; pagina itch.io in bozza | 15 h |
| Sett. 2-9 | **Devlog settimanale**: un video lungo ogni due settimane, una clip ogni settimana (TikTok/Shorts/X/Bluesky lo stesso contenuto adattato), una nota sulla newsletter; il devlog anche in italiano. Discord aperto agli iscritti | 6-8 h/sett. |
| Sett. 4 | **Prova della open beta** con i primi del Discord e della newsletter (la closed beta della Fase II è già passata): ognuno con la sua chiave OpenRouter sul server ufficiale, misura la RAM e i mondi accesi (D6.4); due o tre di loro seguono la guida e installano il gioco da sé, e dove si bloccano la guida si corregge | 4 h + correzioni |
| Sett. 6 | Post tecnico lungo (§ idea 3), pubblicato sul sito, non ancora promosso | 14 h |
| Sett. 8 | Kit per i creatori di video (§ idea 5): la demo, un universo vetrina, la guida dell'installazione | 6 h |
| **Sett. 10, martedì** | **Show HN** in mattinata (ora degli USA, est), con la demo offline; nel primo commento la chiave e l'installazione (§ 1). L'autore resta nel thread tutto il giorno | 8 h |
| Sett. 10, giovedì | r/proceduralgeneration: il post tecnico sui modelli MJ, con GIF | 3 h |
| Sett. 11 | r/IndieGaming / r/indiegames con il video; itch.io pubblico; r/selfhosted con la guida (un altro giorno); il post agentico in una subreddit dedicata (§ 7) in un altro giorno ancora | 6 h |
| Sett. 12-14 | Rispondere, correggere, un devlog «cosa è successo al lancio» con i numeri (piace a HN e a r/gamedev) | 6 h/sett. |
| **Fase VI** | Il secondo momento, più piccolo: i pagamenti accesi (Stripe, D3.4, D3.5), detti a chi c'è già (Discord, newsletter, un devlog), non un nuovo lancio su HN | — |

Totale prima del lancio: ~110-130 ore in 10 settimane. È il massimo sostenibile; se le ore sono 5 a settimana, il calendario
raddoppia, non si comprime.

### La narrativa

La storia più forte non è un personaggio inventato: è **vera**. Diciotto anni di un sogno, una decina di implementazioni fallite,
SYSTEM-EXE (il giocatore intrappolato in un universo simulato, la morale sulla coscienza di un'IA che simula la propria
esistenza), il 2D ritenuto l'unica strada finché MarkovJunior non ha reso il 3D possibile a un costo raggiungibile. «Ho
provato per 18 anni; quest'anno ha funzionato» è un titolo che HN e r/gamedev premiano, perché è verificabile e umano.
**La racconta e la firma l'autore** (§ 4 bis), in prima persona, nella sua lingua dove il pubblico è italiano e nel suo inglese altrove.
La open beta aggiunge un pezzo alla storia, e anche quello è verificabile: «nella beta non prendo un centesimo: paghi i modelli con la tua
chiave, al prezzo di Google, oppure installi tutto da te».

### Cinque idee, con il costo

1. **La demo «rompi il mondo» senza account** — `?offline`, modelli locali, costo zero di API, un seme scelto dove le prime rune
   sono vicine. È il requisito di Show HN *e* la clip perfetta. *Costo: 10-20 h* (scegliere il seme, un'introduzione di due righe,
   provare su telefono). **La più importante.**
2. **«Il tuo incantesimo ha il tuo nome»** — ogni settimana del devlog, la formula più strana pronunciata dai beta tester, con il
   nome del primo che l'ha detta (le carte lo registrano già). Coinvolgimento a costo quasi zero, e mostra il punto unico.
   *Costo: 1 h/settimana.*
3. **Il post tecnico «Un kernel che l'IA non può rompere»** — come il Concilio scrive Lua, perché il validatore lo prova su bozze
   vere, come il giocatore invece può rompere tutto, quanto costa un'ora. Pubblicato sul sito, linkato una settimana dopo Show
   HN come invio normale (non Show HN). È il contenuto che viene ripreso dalle newsletter tecniche. *Costo: 14-18 h.*
4. **Galleria dei modelli MJ della comunità** — una sfida mensile nel laboratorio (`/lab/editor/`): un tema, i modelli più belli
   entrano nell'universo di prova con la carta dell'autore. Dà ai creatori il riconoscimento che l'autore stesso cerca, ed è il
   materiale perfetto per r/proceduralgeneration e r/VoxelGameDev. *Costo: 6 h di preparazione + 2 h/mese.*
5. **Kit per i creatori di video** — un universo già avviato (nella open beta niente crediti da offrire: l'universo vetrina con la
   chiave dell'autore e il suo tetto, se D6.2 la prevede, altrimenti la loro chiave), una pagina con le clip libere, il press kit; da
   mandare a 20-30 youtuber e streamer *piccoli* (5-50 mila iscritti) che giocano sandbox, simulatori o giochi strani: rispondono,
   i grandi no. *Costo: 6 h + 15 min a contatto.*

Idee scartate: il conto alla rovescia di una settimana (poco tempo per costruire un pubblico); Product Hunt come canale
principale (pubblico di prodotti SaaS, non di giochi: va bene un giorno dopo, se avanza tempo); pubblicità a pagamento (prima di
sapere quanto costa un giocatore attivo, § 6).

**Decisioni per l'autore**
- D5.1 — 10 ore a settimana per la promozione: è il numero giusto? (Il calendario si scala con questo.)
- D5.2 — La narrativa dei 18 anni raccontata e firmata dall'autore, in prima persona; Boa Loger non la narra. *Consiglio: sì.* (Riscritta il 14/11: prima diceva «con Boa Loger come narratore».)
- D5.3 — Le cinque idee: quali tenere (consiglio: tutte; la 1 è obbligatoria per Show HN).
- D5.4 — Giorno di Show HN: un martedì o mercoledì, mattina della costa est degli USA. *Consiglio: sì (prassi comune, non una regola: V3).*

---

## 6. Ciò che il gioco deve avere prima

### Checklist

- [ ] **Demo giocabile senza account e senza costo** (`?offline`), che regga sul telefono o dica chiaramente che serve un computer.
- [ ] **Video principale** di 60-90 s: i primi 3 secondi sono la frase che rompe il mondo; niente logo all'inizio; sottotitoli
      (si guarda senza audio); versione orizzontale e verticale. Già previsto dal sito (ADR-0131, `QUINE_VIDEO`).
- [ ] **Press kit** su una pagina del sito: descrizione in 50, 150 e 400 parole (EN e IT), 8-10 screenshot, 3 GIF, il video,
      logo e Boa Loger in PNG trasparente, la storia dei 18 anni, contatti, cosa usa l'IA e cosa no, fatti verificabili (prezzo,
      piattaforme, lingue).
- [ ] **Pagina «Come usiamo l'IA»** (T368) — onesta: cosa genera (testo, programmi), cosa no (nessuna immagine generata, nessuna
      voce clonata), quali modelli, chi paga (la chiave del giocatore, a turno per le spese comuni), dove va il testo (a OpenRouter e
      da lì a Google; a Jev solo dati del mondo, D45), i guardrail (validatore, filtro). È la risposta pronta al thread ostile, e itch.io
      e un giorno Steam la chiedono.
- [ ] **La modalità senza pagamenti** sul server ufficiale (`QUINE_PAGAMENTI=spenti`, T361, fatta) e **nessun incasso** altrove (D3.7).
- [ ] **«Collega OpenRouter»** nel gioco e nel sito (T362-T364), provato da chi non ha mai usato OpenRouter: quanti passi, quanto costa la
      prima ricarica (5 $ di crediti ne costano 5,80 con la commissione minima di OpenRouter).
- [ ] **Il pacchetto e la guida dell'installazione** (T367), provati da due o tre persone fuori dal progetto (§ 5, sett. 4); il pacchetto
      scaricabile con una licenza detta (D7.3).
- [ ] **Il server ufficiale** su una VM (T45f) con il numero di mondi deciso (D6.4) e un messaggio chiaro quando è pieno, che porta alla
      demo offline e alla guida.
- [ ] **Informativa privacy** con il titolare (§ 3, D3.6) e termini d'uso con la segnalazione dei contenuti generati; **i dati fiscali
      nel piè di pagina solo in Fase VI** (D3.4).
- [ ] **Segnalazione di un contenuto generato** dal gioco (Valve la impone per i contenuti generati dal vivo; anche senza Steam è
      una protezione).
- [ ] **Le quattro lingue** (T239), almeno l'inglese completo: HN, Reddit e YouTube sono in inglese.
- [ ] **Tetti di spesa misurati al picco** (sotto).
- [ ] **Un piano se il server cade**: la demo offline è statica e regge qualunque traffico; il multigiocatore no (sotto).

### Costi al picco, con i numeri del repository

Fonti: `hourlyEstimate` in `src/kernel/coefficients.ts` (ipotesi di un'ora di gioco in `HOUR`: 40 luoghi nuovi, 20 frasi, 8 azioni
libere…), prezzi in `src/kernel/ai/prices.ts` (letti il 22/10/2026), configurazione del seme (`universe/universe.json → ai`).
Calcolato oggi con `npx vite-node`:

| Configurazione | Chiamate/ora | $/ora oggi | $/ora dal 01/01/2027 |
|---|---|---|---|
| Dettaglio pieno (coefficienti a 1) | 363 | **1,04** | 1,41 (3.8 Flash e Argon raddoppiano) |
| «Low Detail» (`LOW_DETAIL`) | 198 | **0,36** | 0,36 |

Più la Genesi di ogni universo nuovo (~60-80 chiamate di testo: nell'ordine di 0,1-0,5 $ con le stesse ipotesi di peso; stima
non misurata, V7).

**Con OpenRouter** (aggiornato il 14/11, [`docs/design/open-beta.md`](../design/open-beta.md) § 1.5): gli stessi modelli allo stesso
prezzo, OpenRouter non ricarica; il giocatore paga il 5,5 % (minimo 0,80 $) quando compra crediti, quindi **≈ 1,10 $ l'ora a dettaglio
pieno e ≈ 0,38 $ in Low Detail**. Ma questi dollari **non sono più dell'autore**: li paga la chiave di chi gioca, e le spese comuni vanno a
turno sulle chiavi dei collegati (ADR-0184, T363). Le decisioni chiuse di Jev passano anch'esse da OpenRouter con la chiave del giocatore
(D52). Nel 2027 la stima cresce come già dice `prices.ts` (3.8 Flash e Argon raddoppiano).

**Chi paga che cosa nella open beta**

| Voce | Chi paga | Note |
|---|---|---|
| I modelli di chi gioca | il giocatore, con la sua chiave | l'autore non incassa né anticipa niente |
| Le spese comuni (Genesi, trame, luoghi nuovi) | a turno i collegati con una chiave; o il master se l'universo lo dice (ADR-0188) | senza nessuno con una chiave vanno ai modelli locali, come oggi (ADR-0113) |
| La demo offline | nessuno | statica, regge qualunque traffico |
| Il sito statico | l'autore | pochi euro, o niente |
| **Il server ufficiale** (una VM, T45f) | **l'autore** | **è la sua spesa vera al picco**: RAM per ogni mondo acceso |
| Un universo vetrina, se c'è | l'autore, con la sua chiave e un tetto | D6.2 |
| Un server di un master o di chi installa | chi lo ospita, direttamente al fornitore | VPS, Railway, Fly, il PC di casa (T367) |

**Traffico.** Le guide di terzi parlano di 10-50 mila visite in un giorno per uno Show HN in prima pagina (non verificato, V3).
Lo scenario del 05/11 (**20.000 visite, il 3 % prova un mondo online per 20 minuti**: 600 sessioni, ≈ 210 $ di modelli a dettaglio pieno)
cambia in due modi:
- **I 210 $ non sono dell'autore**: si dividono sulle chiavi di chi gioca (≈ 0,37 $ a testa per 20 minuti).
- **Meno persone provano online**: serve un account OpenRouter e una prima ricarica (5,80 $). La mia ipotesi, non misurata: dallo 0,5 all'1 %
  delle visite, cioè **100-200 sessioni** invece di 600. La demo offline prende il resto.

**Server.** In produzione non c'è la rotta dei modelli per il browser (regola 8h): chi gioca con il Concilio vero sul server ufficiale
gioca in un mondo di molti, cioè **un processo sulla macchina dell'autore**, con `QUINE_MONDO_MEMORIA` = 1024 MB ciascuno, anche da solo.
Con 100-200 sessioni da 20 minuti sparse su una dozzina di ore, i mondi accesi insieme sono in media 3-6, al picco forse il doppio (stima
mia, da misurare nella prova della settimana 4). `QUINE_MONDI_MASSIMI` = 16 vuole ~16 GB solo per i mondi; 4-8 mondi ne vogliono 4-8. Il
prezzo di una VM europea non l'ho verificato (`docs/design/open-beta.md` § 2.2); per ordine di grandezza, su Fly un server con un mondo da
1 GB sta intorno ai 12-15 $ al mese (stima di quel documento, non misurata). Chi trova il server pieno ha due porte che non costano
all'autore: la demo offline e **«installalo tu»**.

**Conseguenze per il lancio**
1. Il link di Show HN porta alla **demo offline**: costo zero, nessun limite di server, nessun tetto da toccare. La chiave e
   l'installazione sono il passo dopo, detto nel primo commento.
2. Il gioco online è **con la chiave del giocatore** (OpenRouter, T362-T364), commissione 0, nessuna ricarica venduta (ADR-0189). Chi non
   ha una chiave gioca la demo offline, non un mondo sul server: un mondo senza chiavi non costa modelli ma costa RAM.
3. **Nessuna chiave del server**, oppure una sola per un universo vetrina con un tetto piccolo e un avviso sul telefono a metà tetto
   (D6.2). Il tetto della chiave di oggi (`GEMINI_TETTO_GIORNALIERO`, ADR-0099) vale per Gemini; per OpenRouter il suo gemello
   (`OPENROUTER_TETTO_GIORNALIERO`, proposto in `docs/design/open-beta.md` § 2.4, non ancora scritto).
4. **Low Detail proposto come predefinito** nella lobby degli universi della prima settimana: con le chiavi dei giocatori la scelta è loro
   (il tetto di ogni viandante resta suo, 8b-bis), ma il predefinito decide quanto spende chi non tocca niente: un terzo.
5. Una prova di carico prima (settimana 4) per sostituire queste stime con il registro dei consumi vero e con la RAM vera.

**Decisioni per l'autore**
- D6.1 — Show HN punta alla demo offline; la chiave e l'installazione nel primo commento. *Consiglio: sì.*
- D6.2 — La chiave del server nella open beta: nessuna, oppure una tua per un universo vetrina con un tetto piccolo (proposta: 10-20 $ al giorno). *Senza consiglio: dipende da quanto vuoi che chi non ha una chiave veda il Concilio vero.* (Riscritta il 14/11: prima era il tetto della chiave che pagava tutti, 75 $ il giorno del lancio.)
- D6.3 — Low Detail proposto come predefinito nella lobby per gli universi della prima settimana. *Consiglio: sì.*
- D6.4 — Quanti mondi accesi sul server ufficiale, cioè quanta RAM paghi (proposta: 4-8 al lancio; chi trova pieno va alla demo offline e alla guida). *Da fissare dopo la prova della settimana 4 e con T45f.* (Riscritta il 14/11: prima erano 16 mondi, ~16 GB, per chi giocava a crediti.)
- D6.5 — Pagina «Come usiamo l'IA» (T368) e segnalazione dei contenuti come task prima del lancio. *Consiglio: sì.*

---

## 7. Il pubblico dello sviluppo agentico

L'autore pensa che interessi anche la storia di *come* il gioco è stato fatto: la pipeline (code, budget, worktree, provider in
parallelo), l'orchestratore, i task atomici, gli ADR, le sessioni brevi. Ha ragione sull'interesse, con due avvertenze.

**Benefici**
- È un pubblico grande e in crescita (r/ClaudeAI, r/ChatGPTCoding, r/cursor, r/singularity in parte, HN stesso), che premia i
  resoconti concreti con numeri: oltre 250 task, 135 ADR, un'orchestra di agenti con tetti di spesa, verifiche nel browser. Pochi
  progetti di questa dimensione hanno il pregresso *scritto*.
- Raggiunge sviluppatori che non giocano, ma che condividono.
- Ha un formato naturale: «come ho costruito un gioco di ~100.000 righe di codice (TypeScript, Lua, script; misurate il 05/11/2026) con un'orchestra di agenti, e cosa non ha funzionato».

**Costi e rischi**
- **Rafforza l'obiezione dei giocatori.** «Un gioco fatto dall'IA, che genera contenuti con l'IA» è, per il pubblico ostile del
  § 3, la conferma del pregiudizio. *Le due storie vanno tenute separate*: canali diversi, giorni diversi, mai nello stesso post.
- **r/LocalLLaMA non è il posto**: parla di modelli in locale; QUINE42 usa Gemini (i «modelli locali» del gioco sono procedurali,
  non LLM). Un post lì sarebbe fuori tema.
- **La lingua.** Tutto il pregresso è in italiano. Misurato dal censimento (T239) su `docs/`: ~398.000 parole in tutto; gli ADR ~91.000; il backlog
  ~115.000; pipeline e orchestrazione ~57.000; `AGENTS.md` + `docs/architettura-dettagli.md` ~22.000. Il censimento completo
  delle lingue (T239) è in [`docs/lingue-censimento.md`](../lingue-censimento.md). Tradurre con un modello costa pochi dollari;
  **rileggere** costa le ore dell'autore: a ~2.500 parole l'ora, 20.000 parole sono ~8 ore, tutto il pregresso ~160 ore — e poi
  ogni modifica va fatta due volte.

**Raccomandazione.** Conviene, ma come **un solo articolo in inglese** (~4.000-6.000 parole: la pipeline, l'orchestratore, i
numeri, gli errori), più la traduzione di `AGENTS.md` e del README della pipeline (~10-12 ore di rilettura). Il pregresso non si
traduce: si linka in italiano, e chi è curioso usa un traduttore. Si pubblica **due-tre settimane dopo** il lancio del gioco,
quando il gioco ha già una sua reputazione e l'articolo porta un secondo picco invece di contaminare il primo.

**Decisioni per l'autore**
- D7.1 — Un articolo in inglese sulla pipeline, separato dal lancio del gioco, 2-3 settimane dopo. *Consiglio: sì.*
- D7.2 — Tradurre solo `AGENTS.md` e `docs/pipeline/README.md`; il resto no. *Consiglio: sì.*
- D7.3 — Rendere pubblico il repository (o una sua parte): il kernel, il server, la pipeline? *Senza consiglio, tua; cambia la licenza (`LICENSE.md`) e i segreti vanno ricontrollati (regola 9).* **Aggiornata il 14/11: non è più solo per questo pubblico.** La Fase IV finisce quando un mondo gira in self-hosting seguendo la guida (`docs/fasi.md`), quindi qualcuno deve poter scaricare il gioco: almeno l'immagine Docker pubblica con una licenza che permetta di ospitarla, o il codice. Le opzioni, dalla più chiusa: (a) solo l'immagine, con una licenza d'uso per ospitare in proprio; (b) il codice leggibile con una licenza *source-available* (si legge e si ospita, non si rivende); (c) una licenza aperta. Su HN e r/selfhosted la (c) è un argomento forte e la (a) attira la domanda «where's the source?». Va decisa prima che T367 pubblichi l'immagine.

*Nota del 14/11*: r/LocalLLaMA resta fuori tema finché il gioco usa solo modelli via OpenRouter; se un giorno ci sarà l'endpoint compatibile
per i modelli a pesi aperti (`docs/design/open-beta.md` § 2.5, riga 10 del § 6) diventa il posto giusto per quel post.

---

## Verifiche ancora da fare

| # | Cosa | Perché non è chiusa |
|---|---|---|
| V1 | Testo attuale di `news.ycombinator.com/showhn.html`, `newsguidelines.html`, `newsfaq.html`; in particolare la regola sui commenti generati o ritoccati dall'IA (marzo 2026) e se tocca anche il primo commento di uno Show HN e il testo dell'invio | Il dominio non è raggiungibile da questa sessione; letto solo attraverso ricerche e copie non ufficiali (14/11: la regola sull'IA è riportata da più fonti, con il testo della pagina) |
| V2 | Pagine di Reddit su spam e autopromozione; regole nella barra di r/proceduralgeneration, r/IndieGaming, r/indiegames, r/gamedev, r/VoxelGameDev, r/ClaudeAI | `support.reddithelp.com` non raggiungibile; le regole delle singole subreddit cambiano spesso |
| V3 | Traffico tipico di uno Show HN, orari migliori | Solo guide di terzi |
| V4 | Regole di itch.io sulla dichiarazione dell'IA generativa | Non cercata a fondo |
| V5 | Obblighi fiscali e del sito con un commercialista (P.IVA, regime, OSS, Managed Payments) | Non sono un consulente; testo dell'art. 7 letto solo nei riassunti |
| V6 | AI Act art. 50 e linee guida della Commissione sulla voce sintetica di un personaggio (dal 14/11 serve solo se si torna a una voce sintetica, D4.4) | Fonti secondarie (studi legali, blog); il codice di buone pratiche era in valutazione |
| V7 | Costo reale di una Genesi e di un'ora di gioco | `hourlyEstimate` è una stima con ipotesi; il registro dei consumi della beta dirà il vero |
| V8 | Stato attuale di Altera / Project Sid, di Latitude Voyage («Heroes»), di Hidden Door | Le ricerche non hanno trovato notizie recenti affidabili |
| V9 | Precedenti di LLM che scrivono programmi MarkovJunior; giochi con il codice sorgente esplorabile | Ricerca non chiusa (D1.4) |
| V10 | Se la schermata dell'OAuth di OpenRouter lascia al giocatore cambiare il limite proposto dal gioco; quanti passi servono a chi non ha un account | Da provare con T364 (`docs/design/open-beta.md` § 1.2) |
| V11 | Obblighi di un servizio gratuito senza incassi: informativa GDPR e titolare, art. 7 d.lgs. 70/2003 («normalmente dietro retribuzione»), il self-hoster titolare dei dati dei suoi giocatori | Ragionamento mio, non una fonte; da chiedere a un professionista prima di aprire gli account al pubblico |
| V12 | Le fonti del § 4 bis lette solo in sintesi: Witkowski 2010 (le cifre da una sintesi secondaria), O'Keefe 1999 e Hovland e Weiss 1951 (citati senza rileggerli), Zukowski (riferito da altri) | Ricerca web del 14/11 su abstract e sintesi; nessun testo intero letto |

## Fonti

Tutte consultate il **05/11/2026** attraverso la ricerca web della sessione; «(secondaria)» indica un articolo o una guida che
riferisce la fonte primaria.

**Concorrenti**
- AI Dungeon / Latitude Voyage: https://www.businesswire.com/news/home/20260421658665/en/ (comunicato, aprile 2026); https://respawn.outlookindia.com/gaming/gaming-news/design-your-own-world-latitude-unveils-voyage-ai-rpg (secondaria); utenti mensili: https://techcrunch.com/?p=2108869 (dato vecchio, secondaria)
- Project Sid: https://arxiv.org/abs/2411.00114 ; https://github.com/altera-al/project-sid ; https://tomsguide.com/ai/a-company-gave-1000-ai-agents-access-to-minecraft-and-they-built-a-society (secondaria)
- Generative Agents: https://arxiv.org/pdf/2304.03442 ; https://techxplore.com/news/2023-04-scientists-believable-human-interactions-ai.html (secondaria)
- inZOI / Smart Zoi: https://www.nvidia.com/en-gb/geforce/news/nvidia-ace-naraka-bladepoint-inzoi-launch-this-month ; https://www.pcgamer.com/games/life-sim/inzoi-is-creating-a-newfangled-life-sim-npc-that-can-grow-and-develop-its-own-personality-with-nvidias-ai-tech (secondaria); https://thegameswiki.com/inzoi/wiki/smart-zoi (wiki della comunità)
- Voyager: https://arxiv.org/abs/2305.16291 ; https://neurips.cc/virtual/2023/79179
- Mindcraft: https://sites.uci.edu/kolbynottingham/2024/10/30/mindcraft ; arXiv 2504.17950
- Mod di Minecraft con LLM: https://modrinth.com/project/secondbrain ; https://modrinth.com/mod/player2npc ; https://www.curseforge.com/minecraft/mc-mods/metanpcmod ; https://modrinth.com/mod/speaking-villagers-chatgpt-and-tts/version/wTFrRlbz
- Dwarf Fortress: https://en.wikipedia.org/wiki/Dwarf_Fortress ; https://www.pcgamer.com/games/sim/dwarf-fortress-sells-1-million-copies-on-steam-so-now-bay-12-games-can-afford-that-little-party-it-planned (secondaria)
- Roblox Cube: https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube ; https://www.pcgamesn.com/roblox/4d-generative-ai-model-update (secondaria)
- Hidden Door: https://www.pcgamer.com/hidden-door-ai-game-narrative-rpg (secondaria); https://gamesbeat.com/hidden-door-launches-social-role-playing-platform-with-ai/ (secondaria)
- Meccaniche generate durante il gioco: UNBOUNDED https://arxiv.org/pdf/2410.18975 ; *Latent Space* https://arxiv.org/pdf/2510.16952v1 ; Meshy *Black Box: Infinite Arsenal* https://app.cinevva.com/news/2026-03-09-meshy-labs-ai-runtime-gameplay (secondaria)
- Modelli di mondo: Genie 3 https://www.engadget.com/ai/google-deepminds-genie-3-can-dynamically-alter-the-state-of-its-simulated-worlds-140052124.html (secondaria); Oasis https://techcrunch.com/2024/10/31/decarts-ai-simulates-a-real-time-playable-version-of-minecraft/ (secondaria)
- MarkovJunior: https://github.com/mxgmn/MarkovJunior

**Atteggiamento verso l'IA generativa**
- GDC State of the Industry 2026 (52 % negativo): https://www.techspot.com/news/111128-more-than-50-game-developers-generative-ai-harming.html (secondaria)
- Quantic Foundry, giocatori: https://www.gamesmarket.global/quantic-foundry-most-gamers-are-negative-about-the-use-of-gen-ai-in-video-games (secondaria)

**Regole delle piattaforme**
- Hacker News: https://news.ycombinator.com/showhn.html ; https://news.ycombinator.com/newsguidelines.html ; https://news.ycombinator.com/newsfaq.html (citate nelle ricerche, non lette direttamente: V1)
- Reddit: https://redship.io/blog/reddit-self-promotion-rules-2026 (secondaria); r/pcgaming, wiki sull'autopromozione (copia): https://redlib.belloworld.it/r/pcgaming/wiki/selfpromotion ; r/gamedev: https://cal1.lr.ggtyler.dev/r/gamedev/wiki/good_posts (copia)
- Steam, contenuti generati: https://pcgamer.com/valve-updates-its-steam-policy-on-ai-so-it-can-release-the-vast-majority-of-games-that-use-it ; https://www.pcgamer.com/software/ai/steam-updates-ai-disclosure-form-to-specify-that-its-focused-on-ai-generated-content-that-is-consumed-by-players-not-efficiency-tools-used-behind-the-scenes/ (secondarie)

**Obblighi in UE e in Italia**
- d.lgs. 70/2003: https://www.normattiva.it/eli/id/2003/04/14//003G0090/CONSOLIDATED ; https://www.ecnews.it/gli-aspetti-procedurali-del-commercio-elettronico/ (secondaria); art. 35 DPR 633/72 nel sito: https://fiscomania.com/indicazioni-obbligatorie-siti-web (secondaria)
- DSA, art. 30: https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-30/
- AI Act, art. 50: https://www.reedsmith.com/our-insights/blogs/viewpoints/102nfqg/always-read-the-label-eu-ai-transparency-rules-and-questions-that-remain-unanswe/ ; https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/07/CSA_research_note_eu_ai_act_article_50_transparency_20260729-csa-styled-1.pdf (secondarie)
- Stripe: https://docs.stripe.com/payments/managed-payments ; https://docs.stripe.com/payments/managed-payments/how-it-works ; https://support.stripe.com/questions/what-is-a-statement-descriptor-and-how-to-update-it

**La voce dell'autore** (§ 4 bis; consultate il **14/11/2026**, attraverso la ricerca web della sessione)
- Hacker News, «Don't post generated comments or AI-edited comments» (marzo 2026): https://news.ycombinator.com/newsguidelines.html (non letta direttamente: V1); commento di dang riportato in https://hn.svelte.dev/item/45077654 (copia); copertura: https://aitoolly.com/ai-news/article/2026-03-12-hacker-news-updates-guidelines-prohibits-ai-generated-or-edited-comments-to-foster-human-conversatio (secondaria)
- PNL: Sturt e altri, «Neurolinguistic programming: a systematic review of the effects on health outcomes», *British Journal of General Practice* 62 (2012), https://wrap.warwick.ac.uk/49754 ; Witkowski, «Thirty-Five Years of Research on Neuro-Linguistic Programming», *Polish Psychological Bulletin* 41 (2010) (cifre da una sintesi secondaria: V12); Passmore e Rowson, «Neuro-linguistic programming: a critical review of NLP research and the application of NLP in coaching», *International Coaching Psychology Review* 14 (2019), https://core.ac.uk/download/326501965.pdf
- Fiducia e IA: Schilke e Reimann, «The transparency dilemma: How AI disclosure erodes trust», *Organizational Behavior and Human Decision Processes* 188 (2025), doi:10.1016/j.obhdp.2025.104405, https://ideas.repec.org/a/eee/jobhdp/v188y2025ics0749597825000172.html ; sintesi: https://news.arizona.edu/employee-news/being-honest-about-using-ai-work-makes-people-trust-you-less-research-finds (secondaria)
- Persuasione riconosciuta: Friestad e Wright, «The Persuasion Knowledge Model: How People Cope with Persuasion Attempts», *Journal of Consumer Research* 21 (1994), doi:10.1086/209380, https://ideas.repec.org/a/oup/jconrs/v21y1994i1p1-31.html
- Credibilità della fonte: Hovland e Weiss, «The Influence of Source Credibility on Communication Effectiveness», *Public Opinion Quarterly* 15 (1951) (citato senza rileggerlo: V12)
- Messaggi a due lati: O'Keefe, «How to handle opposing arguments in persuasive messages: a meta-analytic review of the effects of one-sided and two-sided messages», *Communication Yearbook* 22 (1999) (citato senza rileggerlo: V12)
- Accento e credibilità: Lev-Ari e Keysar, *Journal of Experimental Social Psychology* 46 (2010), https://www.sciencedaily.com/releases/2010/07/100719164002.htm (secondaria); il quadro delle repliche (Souza e Markman 2013, Stocker, Boduch-Grabka e Lev-Ari 2021): https://journalofcognition.org/articles/353 e https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10885845/
- Ripetizione: Hasher, Goldstein e Toppino (1977) e la meta-analisi di Dechêne e altri (2010), riassunte in https://journalofcognition.org/articles/161 ; Heath e Heath, *Made to Stick*, Random House, 2007
- Il gioco prima del logo nei trailer: Zukowski riferito in https://newsletter.gamediscover.co/p/game-trailers-breaking-down-a-key e https://gamedeveloper.com/business/the-simplest-trailer-to-make-for-your-steam-page (secondarie); https://www.kenney.nl/learn/tips-for-game-promotion

**Dal repository**
- `docs/design/open-beta.md` (T345: OpenRouter, hosting, self-hosting, i costi via OpenRouter); ADR-0184, ADR-0188, ADR-0189; `docs/fasi.md` (Fasi IV-VI); `docs/pipeline/domande/aperte.md` (D35, D52); i dossier di T361-T368 e T45f.
- `docs/userchats/to-do-2026-11-04.md` (Fase IV); `docs/plans/backlog.md` (T240, T239); `src/kernel/coefficients.ts` (`hourlyEstimate`, `HOUR`, `LOW_DETAIL`); `src/kernel/ai/prices.ts`; `server/geminiProxy.ts` (tetto); `AGENTS.md` (regole 0, 8g, 8i, 9; il Concilio); `docs/architettura-dettagli.md` (#corona: gli avatar gerboa; #sito; #costi); `src/kernel/fourthwall.ts`.
