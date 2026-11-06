# Il banco di Jev (T313)

Jev di TypeSafe AI ([typesafe.ai/blog/jev-1-14](https://typesafe.ai/blog/jev-1-14), [docs.typesafe.ai](https://docs.typesafe.ai)) è un modello «System One»: non genera
testo, **sceglie**. Riceve uno stato (testo o JSON) e domande tipizzate — *Choice* (un'opzione di un elenco, con le probabilità), *Score*
(un livello di una rubrica), *Noul* (la probabilità di un sì) — e risponde solo dentro le opzioni. Costa **0,042 $ al milione di token in
ingresso** (l'uscita è gratis), il contesto di produzione è 64k per richiesta e 32k per domanda, immagini e contesto lungo sono «Danger
Zone» e qui non si usano. Questo banco misura se le decisioni chiuse del gioco e alcuni giudizi sulla scultura si possono chiedere a Jev
invece che a Gemini 3.1 Flash-Lite, con le **stesse domande**, e dove conviene.

Niente cambia in `src/`: il banco è solo `lab/`. La proposta di portarlo nel gioco è
[ADR-0157](../../../docs/adr/0157-jev-per-le-decisioni-chiuse.md) (proposta, non decisa).

## Come si usa

```bash
npx vite-node lab/scripts/jev-banco.ts -- --offline                       # risposte finte, nessuna chiave, nessuna spesa (lab/out/jev/)
npx vite-node lab/scripts/jev-banco.ts -- --gruppi decisioni --run giro-2 \
     --env <.env con TYPESAFE_KEY> --env <.env con GEMINI_API_KEY> \
     [--modelli jev-1.13.0,jev-1.14.0,gemini-3.1-flash-lite] [--varianti base,rovescio,domande-2] [--compiti azione,referente] [--casi id,id] [--mostra]
npx vite-node lab/scripts/jev-banco.ts -- --oggi --casi …                 # gli stessi casi con i prompt veri del gioco su Flash-Lite, e i modelli locali
npx vite-node lab/scripts/jev-banco.ts -- --prepara scultura|vita        # riscrive casi/scultura.json, casi/vita.json dal banco e dagli universi
npx vite-node lab/scripts/jev-banco.ts -- --rapporto                     # riepilogo.md dal registro
```

- **Le chiavi** si leggono solo nello script, dai `.env` dati con `--env` (altrimenti quello di questa cartella e del checkout principale):
  `TYPESAFE_KEY` e `GEMINI_API_KEY`. Lo script dice solo dove ha cercato, mai il valore; nel registro non arriva (il test lo prova).
- **I tetti** (`--tetto-typesafe`, predefinito 3 $; `--tetto-gemini`, predefinito 1 $) si sommano su **tutto** il registro, non sul giro:
  prima di ogni chiamata si riserva la stima, dopo vale il costo vero; una chiamata che non ci sta è una riga con `error: tetto`.
- **Il registro** è `consumi.jsonl`: una riga per chiamata (giro, fornitore, modello, versione che ha risposto, gruppo, compito, caso,
  variante, domande, token in/out, cache, ragionamento, dollari, ms, esito, le risposte con le probabilità, quali sono giuste). Le prove
  prima del primo giro (`prova-1`) restano nel registro e fuori dalle tabelle.
- **Il test** (`lab/tests/jev-banco.test.ts`) prova la modalità offline, i tetti, le stesse domande ai due modelli, i casi e che la chiave non
  finisca nel registro.

| file | cosa |
|---|---|
| `banco.ts` | tipi, il giudice Jev (`POST https://api.typesafe.ai/v1/systemone`), il giudice Gemini con le stesse domande (`typedPrompt`: lo stato, le domande, uno schema con gli `enum` delle opzioni, attraverso `lab/scripts/gemini.ts` → `GeminiAiModels` del kernel), quello finto, il voto, il registro, i tetti, il giro |
| `domande.ts` | le domande di ogni compito (in inglese, la lingua interna; lo stato resta nella lingua del mondo), le opzioni chiuse (effetti, squadre, bivi), le `domande-2` |
| `oggi.ts` | gli stessi casi con le chiamate vere del gioco (`judgeAction`, `judgeCombination`, `judgeCraft`, `liaisonReply`, la revisione della quarta parete) su un kernel acceso, a Flash-Lite e ai modelli locali |
| `scultura.ts`, `vita.ts` | i casi dei gruppi 2 e 3 dal banco e dagli universi |
| `rapporto.ts`, `riepilogo.md` | le tabelle, generate dal registro |
| `casi/decisioni.json`, `casi/scultura.json`, `casi/vita.json` | i casi registrati: lo stato, le risposte giuste, la regola di oggi (gruppo 3) |

## Il metodo

**I modelli**: `jev-1.13.0` (produzione) e `jev-1.14.0` (oggi `jev-preview` e `jev-latest` puntano a lui: la 1.14 è uscita il 14/10 con
«supporto multilingue migliore»); `gemini-3.1-flash-lite` con il ragionamento `low` e la temperatura 0,3, come i `lab/scripts`.
**Le stesse domande**: Jev riceve lo stato e le domande; Gemini lo stesso stato in JSON, le stesse domande con le stesse opzioni e una
`responseSchema` che chiude ogni risposta alle opzioni (un Noul diventa un booleano). Domande corte: lo stato del luogo e le scelte, mai la bibbia.

**Le varianti**: `base` le domande scritte prima di misurare; `rovescio` le stesse con le opzioni in ordine inverso (Jev tende alla prima,
dice la sua documentazione); `domande-2` domande più atomiche per la quarta parete e le combinazioni, scritte **dopo** il primo giro (lo
si dice: sono la seconda prova, non la prima); `oggi` i prompt veri del gioco su Flash-Lite, su metà dei casi del gruppo 1 (uno sì e uno
no) e su tutta la quarta parete in una chiamata sola, come fa `reviewFourthWall`; `locale` i modelli locali del gioco (`MockAiModels`) e il
filtro di parole (`metaBreak`): ciò che il kernel fa quando la manopola o i crediti mandano la chiamata lì.

**Le risposte giuste**: le regole registrate dei mondi (`world/rules.json` di valmora, sidera, orichalcum, neapolis), le ricette dei pacchetti,
i moduli che l'Arbitro ha ritirato in valmora (commit `c8478c4` del suo repository) e quelli che ha tenuto, i casi di `tests/fourthwall.test.ts`,
i giudizi di `lab/banco/finale/giudizio.md` e `lab/banco/conferma/giudizio.md`; il resto è scritto per il banco da chi l'ha scritto
(Claude Opus 5.5), con le risposte accettate per ogni caso. **Vanno rilette dall'autore.** Un caso può accettare più risposte; una
domanda senza risposta giusta (speculativa) non si vota.

## I risultati

Spesa del primo giro (`giro-1`, con le varianti e il giro ripetuto): **TypeSafe 0,196 $** su 3 (2176 chiamate, 4,66 milioni di token in
ingresso), **Gemini 0,680 $** su 1 (611 righe). Il primo giro basta a concludere: i tetti più alti (5 $ e 5 $) non sono serviti.
Le tabelle intere, compito per compito e domanda per domanda, sono in [`riepilogo.md`](riepilogo.md).

### Gruppo 1: le decisioni del gioco

Giuste sul totale delle domande votate; costo per 1000 decisioni (ogni domanda fatta è una decisione); latenza mediana di una chiamata.

| compito | Jev 1.13 | Jev 1.14 | Flash-Lite, stesse domande | Flash-Lite, prompt del gioco (`oggi`) | modelli locali | $/1000 Jev | $/1000 Flash-Lite | $/1000 oggi | ms Jev / Flash-Lite / oggi |
|---|---|---|---|---|---|---|---|---|---|
| azione libera (`action.judge`): possibile, effetto, attrezzo, ripetibile | **98 %** | 95 % | 96 % | 92 % | 52 % | 0,013 | 0,107 | 0,539 | 184 / 911 / 2975 |
| squadra del Referente e rifiuto (`referente.coordinate`) | **98 %** | 97 % | 97 % | 90 % | 71 % | 0,016 | 0,153 | 0,507 | 158 / 900 / 1514 |
| oggetto citato → modello della libreria o «nuovo» (compito nuovo) | 93 % (**97 %** composto) | 93 % (97 %) | **100 %** | — (oggi si scolpisce sempre) | — | 0,071 | 0,461 | — | 177 / 941 / — |
| combinazione → oggetto noto o nessuno (`craft.judge`) | 65 % | 65 % | 88 % | **91 %** | 55 % | 0,028 | 0,216 | 0,764 | 168 / 885 / 1623 |
| fabbricazione libera: possibile, quale oggetto noto (`craft.free`) | 79 % (oggetto **100 %**) | 79 % (95 %) | 79 % (90 %) | 67 % (50 %) | 44 % | 0,027 | 0,216 | 0,669 | 161 / 937 / 1398 |
| quarta parete, un Noul | 75 % | 83 % | 62 % | 81 % (una chiamata per 53 testi) | 72 % (`metaBreak`) | 0,026 | 0,283 | 0,054 | 159 / 836 / — |
| quarta parete, quattro Noul (`domande-2`) | 91 % | 91 % | **96 %** | | | 0,006 | 0,078 | | 160 / 937 / — |
| quarta parete, quattro Noul **o** `metaBreak` | 94 % | 94 % | **100 %** | | | | | | |

- **Jev costa 6-12 volte meno di Flash-Lite con le stesse domande (di solito 8-10), 25-40 volte meno dei prompt del gioco, e risponde in 150-250 ms contro 0,9-3 s.**
  Sulle decisioni di classificazione (effetti, squadre, quarta parete, quale oggetto noto) è al livello di Flash-Lite o sopra.
- **Dove no**: le combinazioni («cosa esce da A e B?») vogliono sapere come si fanno le cose: Jev riconosce il panino, non il cuoppo di alici
  né la benda dalla stoffa; la versione `domande-2` non lo aiuta (56 %). Il «si può fare a mano» della fabbricazione sbaglia per tutti e tre
  allo stesso modo: senza fuoco, dicono, pizza e zuppa non si fanno, e le ricette del mondo dicono di sì; non distingue i modelli.
- **Il companion Noul** (lo schema di TypeSafe): per il riuso dei modelli Jev da solo sceglie il modello più vicino anche quando non va (un
  lupo per il drago, il gatto per la pecora); con «la scelta vale solo se `fits` ≥ 0,5» è al 97 %, e la separazione è netta: tutti i «nuovo»
  stanno sotto 0,22 di `fits`, tutti i riusi sopra 0,51, nessun riuso sbagliato a soglia 0,5.
- **I prompt del gioco** su Flash-Lite sono più cari (6000-8500 token in ingresso con la bibbia, il catalogo, il canone) e non migliori sulle
  decisioni; in `craft.free` danno al risultato un nome nuovo invece di quello noto («Panino» per «Panino con la mozzarella»): il kernel ne
  farebbe un doppione. I modelli locali sono il pavimento: 44-72 %.
- **La quarta parete** è il caso in cui la domanda conta più del modello: con un Noul solo che chiede quattro cose Flash-Lite dice quasi
  sempre «no» (62 %); con quattro Noul atomici sale al 96 % e Jev al 91 %. Le parole vietate «anche per altro» («il programma della radio»,
  «i giocatori della squadra») nessun modello le vede: le vede `metaBreak`, che va tenuto davanti.

### Gruppo 2: la scultura

| compito | Jev 1.13 | Jev 1.14 | Flash-Lite | $/1000 Jev | $/1000 Flash-Lite | ms Jev / Flash-Lite |
|---|---|---|---|---|---|---|
| rubriche sulle quattro facciate, il tetto e le piante in testo (`rubrica-viste`, 28 programmi giudicati × 9) | 73 % | 65 % | 81 % | 0,050 | 0,327 | 221 / 1148 |
| rubriche sugli strati (`rubrica-strati`) | 66 % | 43 % | 80 % | 0,037 | 0,257 | 199 / 1169 |
| rubriche sulle scatole per simbolo (`rubrica-simboli`) | 69 % | 64 % | 83 % | 0,013 | 0,106 | 176 / 1102 |
| il nodo che rovina la forma (`colpevole`, 29 programmi che passano con un nodo aggiunto) | **69 %** (nei primi 3: **100 %**) | 69 % | 31 % | 0,659 | 7,975 | 247 / 2290 |

- **Le rubriche non funzionano per nessuno dei due**, e i numeri ingannano: i giudizi del banco sono quasi tutti «sì» (la risposta più
  frequente, criterio per criterio, prende l'87 %). Flash-Lite risponde «sì» e «passa» a tutto (19 veri positivi, 9 falsi positivi, 0 negativi);
  Jev dà quasi sempre lo stesso livello e un «passa» fermo fra 0,19 e 0,43 senza legame con il giudizio. Dalle viste in testo nessuno dei
  due ricava ciò che l'Artista vede nelle foto: `model.judge` resta all'Artista (le immagini di Jev sono Danger Zone).
- **Il nodo colpevole sì**: con il difetto detto a parole («la porta sul davanti è murata») e i nodi del programma come opzioni (fino a
  250, con le celle, le lettere e la scatola di ciò che hanno cambiato) Jev indica quello giusto 20 volte su 29 e lo ha sempre tra i primi
  tre; Flash-Lite 9 su 29, a dodici volte il prezzo. Le porte murate sono le più difficili (2 su 6): il nodo che mura è piccolo e ce ne
  sono altri simili. Sono sabotaggi: un nodo intero aggiunto tardi; un difetto vero può essere un nodo che manca.
- Enorme e Gargantuesca: a mezza risoluzione (un carattere ogni 2×2 voxel) la rocca (Enorme, 120 × 120 × 96) sta in 15 mila token di Jev,
  sotto i 32k di una domanda: «a pezzi» non è servito. A risoluzione piena (circa 90 mila caratteri) non ci starebbe, e lì andrebbe a pezzi.

### Gruppo 3: la vita degli individui

| compito | regola di oggi | Jev 1.13 | Jev 1.14 | Flash-Lite | $/1000 Jev | $/1000 Flash-Lite | ms Jev / Flash-Lite |
|---|---|---|---|---|---|---|---|
| mestiere → programma di lavoro (38 mestieri, 29 da valmora) | 63 % (`matchJob`: 25 mestieri su 34 di valmora senza programma) | **87 %** | 82 % | 76 % | 0,079 | 0,620 | 168 / 892 |
| bivio (20, neapolis) | 55 % (`aspetta`) | 90 % | 90 % | **95 %** | 0,029 | 0,295 | 159 / 874 |
| meta della fase con un fatto del giorno (20, neapolis) | 50 % (la routine) | 75 % | 80 % | 80 % | 0,032 | 0,329 | 161 / 867 |
| le stesse in 3 richieste (`meta-lotto`, 19) | | 74 % | 74 % | 89 % | **0,018** | 0,136 | 167 / 1022 |
| chi entra in squadra (5) | 40 % (`fillTeam`) | 100 % | 100 % | 100 % | 0,026 | 0,294 | 163 / 866 |
| il passo dell'impresa (6) | 100 % (`nextStep`, esatto) | 83 % | 83 % | 83 % | 0,026 | 0,306 | 158 / 853 |

- **La soglia**: «Jev se la sua probabilità è almeno *t*, altrimenti la regola» non aiuta: dove Jev è incerto la regola sbaglia di più
  (mestieri: 87 % Jev solo, 82 % a soglia 0,5, 68 % a 0,7). La regola resta il pavimento per quando la risposta **manca** (rete, tetto,
  modello fuori servizio), non per quando è incerta; e per ciò che è aritmetica (il passo).
- **I lotti**: le mete di una fase chieste tutte insieme costano il 43 % in meno per decisione (434 token invece di 764: lo stato e le ~270
  righe fisse di ogni richiesta si pagano una volta) con la stessa precisione per Jev (74 % e 75 %).
- **Stabilità**: le stesse richieste rifatte danno la stessa risposta nel 99 % dei casi (la probabilità di un Noul si muove di 0,01 in
  mediana, 0,04-0,05 al 90 %); con le opzioni al contrario resta uguale il 90-100 % delle risposte.

## Dove conviene, dove no

- **Conviene** dove la risposta è una scelta fra cose che il gioco già ha e la scelta evita una generazione: il riuso di un modello
  (la scultura è il 60 % della spesa di un'ora: `Modelli nuovi` 0,44 $ e `Revisioni` 0,18 $ su 1,04 $ di `hourlyEstimate` del seme), un
  oggetto noto invece di un doppione, un programma di lavoro esistente invece di nessuno; e dove la regola di oggi è povera e la scelta
  dà vita (bivi, mete con un fatto del giorno, squadre): a 0,00003 $ a decisione un'ora di 30 individui con una meta e un bivio a fase costa
  4,6 ¢ (2,6 a lotti) contro 1,87 $ del `npc.decide` progettato su Flash-Lite.
- **Conviene come filtro**: la quarta parete su ogni testo generato (persone, trame, «Esamina»), con `metaBreak` davanti: oggi il
  controllo del modello è una volta per universo; a Jev costa 2,5 millesimi di centesimo a testo.
- **Conviene per lo Scultore**: i tre nodi sospetti per la seconda richiesta, o da togliere uno alla volta rifacendo le misure, senza modello.
- **Non conviene**: le combinazioni e ciò che vuole sapere come si fanno le cose; i giudizi estetici su viste in testo (né Jev né
  Flash-Lite); i conti (il passo dell'impresa: la regola è esatta); la generazione (racconti, nomi, programmi).
- **Il risparmio grande che l'autore si aspettava c'è sul prezzo per decisione** (6-12× contro Flash-Lite, 25-40× contro i prompt del
  gioco), **ma le decisioni pesano poco nella spesa di oggi**: «Altro…» e fabbricazioni sono 0,01 $ l'ora. Il guadagno vero è indiretto
  (scolpire meno, non fare doppioni) e nella vita del mondo, che Jev rende abbordabile.

## Gruppo 3, parte 1: il censimento di `CENSUS`

I compiti di `src/kernel/coefficients.ts → CENSUS` (nessuno cambia: è la lettura). «Sceglie» vuol dire che la risposta del modello è, in
tutto o in parte, una scelta fra opzioni note.

| compito | cosa sceglie oggi dentro la chiamata | cosa scrive | Jev |
|---|---|---|---|
| `genesis.*` (8) | — | la bibbia, lo stile, i terreni, la fisica, i layout, l'atlante, il cast | no: si genera, una volta |
| `chunk.plan` | l'ambiente (elenco), i moduli dentro e fuori (il catalogo), le rune | nome, descrizione | da provare per le scelte; il nome resta del Cartografo |
| `cartographer.environment`, `forge.concept`, `forge.code`, `forge.fix`, `content.items`, `content.define`, `content.recipes`, `npc.individuate`, `npc.sheet`, `npc.dialogue`, `plot.weave`, `text.examine`, `text.read`, `spell.name`, `rune.invent`, `agent.chat`, `model.sculpt`, `model.action`, `mechanic.design`, `sound.compose` | poco o niente | tutto | no |
| `forge.physics`, `content.physics` | | numeri | no: Jev non fa i conti |
| `forge.review`, `content.review`, `genesis.review` | approvato sì/no | i problemi | da provare come filtro: chiamare il revisore solo quando Jev non è sicuro del sì |
| `action.judge` | possibile, gli effetti (insieme chiuso), l'attrezzo, ripetibile | il racconto, l'etichetta, i parametri | **sì** per le scelte (98 %); il racconto resta da scrivere |
| `craft.judge` | possibile, quale strumento noto | la spiegazione | **no** (65 % contro 91 %) |
| `craft.free` | possibile, quale oggetto noto | racconto, ingredienti | **sì** per «quale oggetto noto» (100 %), no per «si può fare» |
| `referente.coordinate` | la squadra (elenco), il rifiuto | la risposta, la richiesta riformulata | **sì** (98 %) |
| `review.fourthwall` | chi ritirare | il motivo | **sì**, quattro Noul con `metaBreak` (94 %); già economico oggi (una chiamata per universo) |
| `model.judge` | voto, riconoscibile | problemi, consigli | **no** su viste in testo; resta all'Artista con le foto |
| `council.session` | l'intervento (elenco) | la valutazione, la richiesta | da provare per l'intervento |
| `npc.reply` | l'azione (`segui resta vaga dai nessuna`), l'umore, il legame | la battuta | la battuta domina: no |
| `player.death` | perde tutto, ripartenza | il racconto | no: decide già il livello della Genesi |

E le scelte che il kernel fa oggi con una regola fissa, senza chiamate: il programma di un mestiere (`matchJob`), la meta di una fase
(`placeFor` dalla routine), i bivi (non ancora: `npc.decide` è progettato in `docs/design/comportamento-npc.md`, 2.1), la squadra di
un'impresa (`fillTeam`), il passo (`nextStep`). In più un compito nuovo che oggi non c'è: **riusare un modello** prima di scolpirne uno.

## Gruppo 3, parte 2: compito → oggi, con Jev, risparmio, rischio

Misure di questo banco; i dollari l'ora vengono da `hourlyEstimate` del seme (1,04 $ l'ora, Flash-Lite) e dalle ipotesi di `HOUR`
(6 giorni di mondo l'ora, 4 fasi al giorno). Il pavimento è sempre la regola di oggi: se la risposta manca o non è fra le opzioni (Jev non
può, ma il validatore controlla lo stesso) vale lei. In `MockAiModels` (o nella sua parte per le decisioni) la risposta è la regola, così i
test e il gioco senza chiave restano quelli di oggi.

| compito | oggi | con Jev (misurato) | risparmio stimato | rischio | pavimento e `MockAiModels` |
|---|---|---|---|---|---|
| riuso dei modelli, prima di `model.sculpt` (nuovo) | ogni tipo nuovo ha un modello scolpito: 0,62 $ l'ora fra scultura e revisioni | 97 % con il companion Noul, 0 riusi sbagliati a `fits` ≥ 0,5; 0,0001 $ a decisione | **0,19-0,31 $ l'ora** se si riusa il 30-50 % dei modelli chiesti (18-30 % dell'ora), più mondo pronto prima | meno varietà: un tipo nuovo veste un modello vecchio; da decidere per classe (persone sì o no) | scolpire, come oggi |
| mestiere → programma, quando `matchJob` non trova | 25 dei 34 mestieri di valmora non lavorano | 87 % (82 % la 1.14), una volta per mestiere: 0,00008 $ | `job.program` evitati (0,08 $ per universo nel progetto); la gente lavora anche in Cronaca | un mestiere su otto nel programma sbagliato (un bottaio fabbro va bene, uno speziale contadino no) | `matchJob`, poi nessuno |
| bivi (`npc.decide`, progettato) | in progetto: Vita 36 l'ora, Teatro 144 a 0,13 ¢ su Flash-Lite (0,05-0,19 $ l'ora; 0,13-0,50 con l'Attore su 3.8 Flash) | 90 % (Flash-Lite 95 %) a 0,00003 $ | **0,05-0,50 $ l'ora**, o bivi per tutti a ogni fase: 30 individui 2,1 ¢ l'ora | la battuta del bivio resta da scrivere (le righe `dice` dei programmi, o una chiamata solo per chi è vicino) | il seme pesato dai tratti, `aspetta` |
| meta della fase quando il giorno ha un fatto | la routine, sempre (50 % sui casi con un fatto) | 75-80 % (89 % Flash-Lite a lotti); a lotti 0,000018 $ | nessuno da risparmiare: è vita in più; chiedere solo quando c'è un fatto (pioggia, festa, malattia, un appuntamento) | il fatto va scritto nello stato dal kernel (eventi, trame) | la routine |
| squadra di un'impresa | `fillTeam` per mestiere e vicinanza (40 % sui casi con una sfumatura) | 100 % su 5 casi | vita in più (il rivale del capo non entra, il gatto non porta basoli) | campione piccolo | `fillTeam` |
| passo dell'impresa | `nextStep`, esatto | 83 % | — | Jev non conta | **resta la regola** |
| scelte di `action.judge` | 6700 token, 0,002 $ a chiamata, 8 l'ora | 98 %, 0,00005 $ | ~0,01 $ l'ora: poco; scartare senza chiamata ciò che non si può fare, e chiedere il racconto breve solo per ciò che riesce | il testo del viandante è nello stato: un testo scritto per convincere il giudice (jaggedness #6) va provato | il giudizio semplice dei modelli locali |
| squadra del Referente | 1700 token, 0,001 $ a chiamata, solo nello studio | 98 % | poco (lo studio è raro) | la risposta cordiale resta da scrivere | i modelli locali |
| `craft.free`: quale oggetto noto | 50 % dei nomi giusti con il prompt di oggi | 100 % | doppioni e `content.define` evitati | — | il nome scritto, come oggi |
| filtro della quarta parete su ogni testo generato | `metaBreak`, più l'Arbitro una volta per universo | 94 % con `metaBreak` davanti | nessuno: è una guardia nuova a ~0,000025 $ a testo | falsi positivi su ciò che somiglia (le rune di neapolis, il calcolatore della banca): va rimandato al Narratore, non cancellato | `metaBreak` |
| il nodo colpevole per lo Scultore | la seconda richiesta con la traccia (`--traccia`) | 69 %, sempre fra i primi 3, a 0,0007 $ | una seconda richiesta da ~0,015 $ in meno quando togliere il nodo basta | sabotaggi del banco, non difetti veri | la seconda richiesta di oggi |
| `craft.judge`, rubriche dei modelli | | 65 %; rubriche senza discriminazione | — | — | restano a Gemini |

**Come tagliare ancora i token**: domande raggruppate (tutte le mete di una fase in una richiesta: −43 % a decisione, misurato); stato
compresso (i nomi delle persone e i legami in parole, la routine in quattro righe, mai la persona intera: 600-760 token a richiesta);
nessuna chiamata quando lo stato è quello della routine (la meta senza un fatto del giorno, il mestiere già abbinato: una cache per
stato uguale è quasi sempre «la regola»); una risposta per sempre dove la scelta non cambia (mestiere → programma, oggetto → modello,
come oggi le azioni imparate diventano regole). La soglia di probabilità non conviene, per i motivi sopra.

## I limiti di queste misure

- **Le risposte giuste scritte per il banco sono giudizi** di chi ha scritto il banco: 206 casi nel gruppo 1, 92 nel gruppo 3; molti
  accettano più risposte. L'autore dovrebbe rileggerle, soprattutto le combinazioni, i mestieri e i bivi.
- **Campioni piccoli** dove sono piccoli: 5 squadre, 6 passi, 3 lotti; `oggi` su metà dei casi del gruppo 1.
- **Il colpevole è un sabotaggio**: un nodo aggiunto che cambia molte celle, scelto tra quattro tipi; i difetti veri dei programmi del
  Concilio non sono stati provati.
- **Domande in inglese, stato in italiano** in tutto il banco: non è stata provata una versione italiana delle domande.
- **Non provato**: un testo del viandante scritto per ingannare il giudice; il contesto lungo e le immagini (Danger Zone, da non usare);
  Jev dal Vercel AI Gateway (si è usata l'API diretta).

## Sicurezza

Una chiave nuova, `TYPESAFE_KEY`, nel `.env` del base: la legge solo `lab/scripts/jev-banco.ts`, non va in `src/`, `dist/`, nel registro
né in un commit (il test lo prova sul registro). Nessuna superficie nuova nel gioco: niente cambia in `src/` né in `server/`.
