# Il piano di lancio (T240)

> Step 38, Fase IV. Scritto il 05/11/2026 a partire dal blocco T240 del backlog e dalla sezione «Fase IV» di
> [`docs/userchats/to-do-2026-11-04.md`](../userchats/to-do-2026-11-04.md). Nessun account creato, nulla pubblicato.
> Ogni sezione finisce con le **decisioni per l'autore**, voce per voce. Le fonti, con l'URL e la data di accesso, sono in fondo
> (§ Fonti); dove una fonte non si è potuta leggere direttamente lo dico nel testo.
>
> **Limite della ricerca.** Da questa sessione `news.ycombinator.com` e `support.reddithelp.com` non si raggiungono (rete della
> sessione): le regole di Hacker News e di Reddit vengono da ricerche web che citano le pagine ufficiali, e da copie non ufficiali.
> Prima di pubblicare vanno rilette all'origine (§ 3, verifica V1-V3). Le cifre di vendita, traffico e utenti sono di fonti secondarie:
> si usano come ordini di grandezza, mai come promesse.

## Sintesi in dieci righe

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
5. **L'anonimato non è possibile se si incassa in Italia**: il sito deve dire nome, indirizzo, email e partita IVA (art. 7
   d.lgs. 70/2003, art. 35 DPR 633/72), e Stripe mostra i dati pubblici dell'attività. Boa Loger funziona solo come **mascotte
   dichiarata** — e il gioco ha già il posto giusto: i gerboa del Concilio nella corona, che è il tavolo del Dungeon Master e non il
   mondo (la regola 0 resta intatta).
6. **Prima del lancio servono**: una demo giocabile senza account e senza costo (Show HN la richiede), un video di 60-90 s, un
   press kit, e i tetti di spesa misurati al picco: con le stime del kernel un'ora di gioco costa circa **1,04 $** a dettaglio pieno
   e **0,36 $** in «Low Detail»; il tetto predefinito di 10 $/giorno regge una decina di ore di gioco, cioè niente di un picco.

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
> code. Offline mode plays without any API key.*

Ciò che quel commento fa: cita i concorrenti *prima* che li citi qualcun altro (su HN è il modo per non essere smontati), e
mette in primo piano solo ciò che si può verificare giocando.

**Decisioni per l'autore**
- D1.1 — Rinunciare alla frase «non esiste niente del genere» in ogni canale e usare «la combinazione» con i nomi dei concorrenti. *Consiglio: sì.*
- D1.2 — Titolo di Show HN: quello sopra o una variante (vincoli: niente maiuscole enfatiche né superlativi). *Consiglio: quello sopra.*
- D1.3 — Citare *Latent Space* e Voyager nel post tecnico come lavori affini. *Consiglio: sì, rafforza la credibilità.*
- D1.4 — Prima del lancio, una ricerca di un giorno in più su «LLM» + «MarkovJunior» e su giochi «quine»/meta con codice esplorabile (non l'ho chiusa: § Fonti, «non verificato»).

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
5. **Il costo misurato**: ~1 $ l'ora a dettaglio pieno, ~0,36 $ in «Low Detail», con il registro dei consumi per compito. I
   tecnici chiedono sempre il costo; averlo misurato è raro.
6. La pipeline agentica con cui è stato costruito (§ 7) — *come storia a parte*, non nello stesso post.

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

Chi si fa pagare non può essere anonimo, e non per scelta di marketing:
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

Conseguenza: il nome e il cognome dell'autore saranno in fondo a ogni pagina del sito e su ogni ricevuta. Il «finto anonimato
facile da forare» del piano non è una scelta: è già forato per legge. Il premio a chi «scopre» l'autore non c'è. Resta la
mascotte (§ 4). *Non sono un consulente legale: le voci sopra vanno confermate con un commercialista prima di attivare i
pagamenti (V5).*

**Decisioni per l'autore**
- D3.1 — Creare *ora* un account personale su Hacker News e su Reddit e usarli per mesi (commenti utili, nessun link proprio) prima del lancio. *Consiglio: sì, è la voce più importante del piano.*
- D3.2 — Togliere la pubblicazione simultanea; adottare il calendario sfalsato del § 5. *Consiglio: sì.*
- D3.3 — Canali: aggiungere Discord, YouTube, TikTok, newsletter; itch.io alla demo; Bluesky/Mastodon a costo zero; togliere Facebook; Instagram solo come riuso; Steam rimandato. *Consiglio: sì.*
- D3.4 — Partita IVA e dati dell'autore nel piè di pagina del sito prima di accendere Stripe in produzione; verifica con un commercialista (V5). *Obbligatorio.*
- D3.5 — Restare con i Managed Payments di Stripe (merchant of record) se l'accesso viene confermato. *Consiglio: sì, per l'IVA OSS sui consumatori UE.*

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
  Scultore, Artista, Musicista…). Boa Loger come volto del Concilio — il gerboa che parla per la squadra — è onesto e ha fascino.
- **Le interviste animate.** Un formato che regge da solo e si taglia in clip.

### Cosa rischia

| Variante | Rischio |
|---|---|
| **Finto sviluppatore** (Boa Loger «ha creato il gioco») | Alto. Il nome dell'autore è comunque nel piè di pagina (§ 3): chi lo nota non si sente premiato, si sente preso in giro, e su HN e Reddit «chi c'è davvero dietro?» diventa il thread al posto del gioco. Un progetto sull'IA con un autore finto alimenta il sospetto che anche il resto sia finto |
| **Mascotte dichiarata** («Boa Loger, il gerboa del Concilio; il gioco lo fa Lorenzo») | Basso. È ciò che fanno molti studi con una mascotte. Lascia all'autore la storia dei 18 anni, che è il racconto più forte che ha (§ 5) |
| **Voce sintetica** | Medio, gestibile. L'AI Act, art. 50, si applica dal 02/08/2026: chi usa un sistema che genera *deepfake* (contenuti che somigliano a persone esistenti e sembrano autentici) deve dichiararlo; per opere evidentemente artistiche o di finzione basta dichiararlo in modo che non rovini l'opera. Un gerboa a cartone non somiglia a nessuno, ma: (a) se la voce sintetica *imita la voce dell'autore* o di qualcuno, è un deepfake audio e va dichiarato; (b) se Boa Loger *risponde* agli utenti con un LLM (un bot su Discord), l'art. 50(1) chiede di dire che si parla con un'IA. *Consiglio: una riga «voce sintetica» nei titoli di coda di ogni video* (V6) |
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
- D4.1 — Boa Loger come **mascotte dichiarata** e volto del Concilio, non come finto sviluppatore. *Consiglio: sì.*
- D4.2 — Boa Loger nella corona come gerboa del Concilio (Referente o un posto suo). *Consiglio: sì; un task piccolo dopo il via.*
- D4.3 — Boa Loger nel mondo solo come nome ricorrente senza storia d'origine (un easter egg nel lessico o in una leggenda locale). *Consiglio: facoltativo.*
- D4.4 — Voce: quella dell'autore con un filtro, oppure sintetica dichiarata nei titoli. *Consiglio: la voce dell'autore filtrata — costa meno, nessun obbligo, è autentica.*
- D4.5 — Un bot «Boa Loger» su Discord solo se dichiarato come IA nel nome e nella bio. *Consiglio: non subito.*

---

## 5. Calendario e idee

### Ipotesi

Una persona sola, che sviluppa anche; **10 ore a settimana** per la promozione (di più toglie lo sviluppo). Il calendario parte
dal **termine della Fase III** (settimana 0 = Fase III chiusa, le quattro lingue fatte, T239) e lancia alla settimana 10.
Tutto ciò che serve in anticipo (gli account personali, D3.1) parte **subito**, oggi, perché richiede mesi e quasi nessun tempo.

| Quando | Cosa | Ore |
|---|---|---|
| **Da oggi alla Fase III** | Account HN e Reddit personali: 2-3 commenti utili a settimana nelle comunità dove si lancerà (r/proceduralgeneration, r/gamedev). Nessun link proprio | 1 h/sett. |
| Sett. 0-1 | Discord (canali, regole, ruoli), newsletter, account del progetto su YouTube/TikTok/X/Bluesky; press kit (§ 6) | 12 h |
| Sett. 1-2 | Il **video principale** (60-90 s) e 5 clip verticali; pagina itch.io in bozza | 15 h |
| Sett. 2-9 | **Devlog settimanale**: un video lungo ogni due settimane, una clip ogni settimana (TikTok/Shorts/X/Bluesky lo stesso contenuto adattato), una nota sulla newsletter. Discord aperto agli iscritti | 6-8 h/sett. |
| Sett. 4 | Beta chiusa per i primi del Discord e della newsletter: trova i difetti prima di HN, misura i costi veri (§ 6) | 4 h + correzioni |
| Sett. 6 | Post tecnico lungo (§ idea 3), pubblicato sul sito, non ancora promosso | 14 h |
| Sett. 8 | Kit per i creatori di video (§ idea 5) | 6 h |
| **Sett. 10, martedì** | **Show HN** in mattinata (ora degli USA, est), con la demo offline. L'autore resta nel thread tutto il giorno | 8 h |
| Sett. 10, giovedì | r/proceduralgeneration: il post tecnico sui modelli MJ, con GIF | 3 h |
| Sett. 11 | r/IndieGaming / r/indiegames con il video; itch.io pubblico; il post agentico in una subreddit dedicata (§ 7) in un altro giorno | 5 h |
| Sett. 12-14 | Rispondere, correggere, un devlog «cosa è successo al lancio» con i numeri (piace a HN e a r/gamedev) | 6 h/sett. |

Totale prima del lancio: ~110-130 ore in 10 settimane. È il massimo sostenibile; se le ore sono 5 a settimana, il calendario
raddoppia, non si comprime.

### La narrativa

La storia più forte non è un personaggio inventato: è **vera**. Diciotto anni di un sogno, una decina di implementazioni fallite,
SYSTEM-EXE (il giocatore intrappolato in un universo simulato, la morale sulla coscienza di un'IA che simula la propria
esistenza), il 2D ritenuto l'unica strada finché MarkovJunior non ha reso il 3D possibile a un costo raggiungibile. «Ho
provato per 18 anni; quest'anno ha funzionato» è un titolo che HN e r/gamedev premiano, perché è verificabile e umano.
Boa Loger la racconta, l'autore la firma.

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
5. **Kit per i creatori di video** — un universo già avviato con crediti offerti, una pagina con le clip libere, il press kit; da
   mandare a 20-30 youtuber e streamer *piccoli* (5-50 mila iscritti) che giocano sandbox, simulatori o giochi strani: rispondono,
   i grandi no. *Costo: 6 h + 15 min a contatto.*

Idee scartate: il conto alla rovescia di una settimana (poco tempo per costruire un pubblico); Product Hunt come canale
principale (pubblico di prodotti SaaS, non di giochi: va bene un giorno dopo, se avanza tempo); pubblicità a pagamento (prima di
sapere quanto costa un giocatore attivo, § 6).

**Decisioni per l'autore**
- D5.1 — 10 ore a settimana per la promozione: è il numero giusto? (Il calendario si scala con questo.)
- D5.2 — La narrativa dei 18 anni firmata dall'autore, con Boa Loger come narratore. *Consiglio: sì.*
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
- [ ] **Pagina «Come usiamo l'IA»** — onesta: cosa genera (testo, programmi), cosa no (nessuna immagine generata, nessuna
      voce clonata), quali modelli, chi paga, i guardrail (validatore, filtro). È la risposta pronta al thread ostile, e itch.io e
      un giorno Steam la chiedono.
- [ ] **Dati legali nel piè di pagina** (§ 3) e informativa privacy; termini d'uso con la segnalazione dei contenuti generati.
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

**Traffico.** Le guide di terzi parlano di 10-50 mila visite in un giorno per uno Show HN in prima pagina (non verificato, V3).
Uno scenario prudente: **20.000 visite, il 3 % prova un mondo online per 20 minuti** → 600 sessioni × 1/3 h × 1,04 $ ≈ **210 $
in un giorno** a dettaglio pieno, ≈ 72 $ in Low Detail. Il tetto predefinito della chiave (`GEMINI_TETTO_GIORNALIERO` = 10 $,
ADR-0099) si esaurisce dopo circa dieci ore di gioco: poi `GeminiGate` rifiuta con «tetto di spesa del giorno raggiunto».

**Server.** `QUINE_MONDI_MASSIMI` = 16 mondi accesi insieme, ciascuno con `QUINE_MONDO_MEMORIA` = 1024 MB: al picco servono
~16 GB di RAM solo per i mondi; oltre il sedicesimo, chi arriva aspetta o non entra.

**Conseguenze per il lancio**
1. Il link di Show HN porta alla **demo offline**: costo zero, nessun limite di server, nessun tetto da toccare.
2. Il gioco online è **a crediti** (chi gioca paga, commissione decisa dal server): la spesa comune (`comune`) va tenuta piccola,
   e le spese comuni senza un collegato con crediti vanno già ai modelli locali (ADR-0113).
3. Un **tetto della chiave per il lancio** (per esempio 50-100 $ il giorno del lancio, poi di nuovo 10-20 $) e un avviso sul
   telefono a metà tetto. *Il numero lo decide l'autore* (D6.2).
4. Preset predefinito **Low Detail** per gli universi aperti al pubblico nei primi giorni: un terzo del costo.
5. Una prova di carico prima (la beta della settimana 4) per sostituire queste stime con il registro dei consumi vero.

**Decisioni per l'autore**
- D6.1 — Show HN punta alla demo offline, non al multigiocatore. *Consiglio: sì.*
- D6.2 — Tetto della chiave nel giorno del lancio: quanto? (Proposta: 75 $, poi 15 $.)
- D6.3 — Low Detail predefinito per gli universi pubblici della prima settimana. *Consiglio: sì.*
- D6.4 — Quante macchine e quanta RAM per il giorno del lancio (16 mondi = ~16 GB). *Da decidere dopo la beta.*
- D6.5 — Pagina «Come usiamo l'IA» e segnalazione dei contenuti come task prima del lancio. *Consiglio: sì, due task piccoli.*

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
- D7.3 — Rendere pubblico il repository (o una sua parte) per quel pubblico: il kernel, la pipeline? *Domanda aperta: cambia la licenza (`LICENSE.md`) e i segreti vanno ricontrollati (regola 9).*

---

## Verifiche ancora da fare

| # | Cosa | Perché non è chiusa |
|---|---|---|
| V1 | Testo attuale di `news.ycombinator.com/showhn.html`, `newsguidelines.html`, `newsfaq.html` | Il dominio non è raggiungibile da questa sessione; letto solo attraverso ricerche e copie non ufficiali |
| V2 | Pagine di Reddit su spam e autopromozione; regole nella barra di r/proceduralgeneration, r/IndieGaming, r/indiegames, r/gamedev, r/VoxelGameDev, r/ClaudeAI | `support.reddithelp.com` non raggiungibile; le regole delle singole subreddit cambiano spesso |
| V3 | Traffico tipico di uno Show HN, orari migliori | Solo guide di terzi |
| V4 | Regole di itch.io sulla dichiarazione dell'IA generativa | Non cercata a fondo |
| V5 | Obblighi fiscali e del sito con un commercialista (P.IVA, regime, OSS, Managed Payments) | Non sono un consulente; testo dell'art. 7 letto solo nei riassunti |
| V6 | AI Act art. 50 e linee guida della Commissione sulla voce sintetica di un personaggio | Fonti secondarie (studi legali, blog); il codice di buone pratiche era in valutazione |
| V7 | Costo reale di una Genesi e di un'ora di gioco | `hourlyEstimate` è una stima con ipotesi; il registro dei consumi della beta dirà il vero |
| V8 | Stato attuale di Altera / Project Sid, di Latitude Voyage («Heroes»), di Hidden Door | Le ricerche non hanno trovato notizie recenti affidabili |
| V9 | Precedenti di LLM che scrivono programmi MarkovJunior; giochi con il codice sorgente esplorabile | Ricerca non chiusa (D1.4) |

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

**Dal repository**
- `docs/userchats/to-do-2026-11-04.md` (Fase IV); `docs/plans/backlog.md` (T240, T239); `src/kernel/coefficients.ts` (`hourlyEstimate`, `HOUR`, `LOW_DETAIL`); `src/kernel/ai/prices.ts`; `server/geminiProxy.ts` (tetto); `AGENTS.md` (regole 0, 8g, 8i, 9; il Concilio); `docs/architettura-dettagli.md` (#corona: gli avatar gerboa; #sito; #costi); `src/kernel/fourthwall.ts`.
