# Il censimento del medioevo nel seme (T152, ADR-0134)

Ciò che nel seme e nel kernel presuppone il medioevo, fatto cercando le parole (`mediev`, `castell`, `borgo`, `mago`, `fabbro`, `paglia`…) e leggendo cosa sopravvive a una Genesi. Le righe sono quelle del commit di T152.

**Cosa sopravvive a una Genesi**: i prompt degli agenti, canone, lessico, modelli della libreria, moduli senza `origin: esempio` (`core.*`, `sys.*`, `magic.runes`, `runes.fragments`). **Cosa riscrive**: `world/bible.json`, `world/style.md`, `prompts/theme.md`, `world/atlas.json`, terreni e ambienti; i moduli `origin: esempio` (`npc.villager`, `items.base`, mobili, pozzo…) si cancellano. Per questo tre quarti di ciò che è medievale nel seme non va toccato: è il mondo di Valmora, e sparisce da solo.

## Reso neutro

| Dove | Che cosa diceva | Ora |
|---|---|---|
| `universe/prompts/agents/narratore.md:31` | mestieri solo da borgo | mestieri per epoca |
| `universe/prompts/agents/cartografo.md:9-14,37,62-68,76` | castelli, torre del mago, tana di drago, bosco degli elfi, «reame» | un timbro è una forma, non un'epoca; esempi per più epoche |
| `universe/prompts/agents/artista.md` | niente schermi nei modelli | schermi e insegne se l'epoca li ha, senza scritte |
| `universe/prompts/agents/arbitro.md:18` | gli edifici proposti come oggetto: casa, torre, mulino | anche una stazione |
| `universe/world/canone.md` | «dei, antichi maghi», «scuole e maestri di magia» | sezione «In ogni epoca»: stesse rune, ognuno ne parla a modo suo, nessuna macchina le fabbrica; «dei, antichi maghi» resta, sono dicerie |
| `src/kernel/fourthwall.ts` (`COUNCIL_PRINCIPLES`) | mestieri da borgo | ogni mondo ha la sua epoca; le macchine dell'epoca sono cose del mondo (vedi sotto «il filtro») |
| `src/kernel/agents/genesis.ts:190-215,318` | re del passato, paglia delle capanne, ponte levatoio, pozzo e altare come soli esempi | l'epoca nel tono e nella sintesi, il tema anche allo stile e ai terreni, esempi per più epoche |
| `src/kernel/agents/cartography.ts:104,112-115,164-165,214-215` | borghi, castello con fossato, torre di mago, tana di drago «servono» | servono luoghi dove si abita, si lavora, la natura che resta, luoghi notevoli, nell'epoca della bibbia |
| `src/kernel/agents/content.ts:307` | mugnaio, fabbro, locandiera | esempi misti |
| `src/kernel/agents/forge.ts:188` | gli edifici proposti come oggetto (`STRUCTURES`) solo da borgo | anche palazzo, condominio, stazione, fabbrica, officina… |
| `src/kernel/kernel.ts:1857` | il luogo di partenza di riserva cercava `borgo` nell'id | anche `citt`, `quartier` |

## Reso dipendente dal tema

| Dove | Che cosa | Come |
|---|---|---|
| `universe/models/edificio.xml`, `grande.xml` | **le case comuni**: ogni lotto senza struttura chiesta è una casetta di pietra e paglia, o una casa a graticcio. La cosa più visibile di tutte | l'Artista dice `case_comuni` se non sono casette; diventa `commonHouse` nel manifest dei terreni e i lotti comuni chiedono allo Scultore il loro modello, prima di ogni altro |
| `src/kernel/agents/genesis.ts` (`keep`) | con meno di 3 ambienti generati restavano quelli del seme: un castello tra i neon | restano solo quelli senza epoca (`TIMELESS_LAYOUTS`: bosco, campi, rovine, dungeon, deserto, giungla, montagne, lago) |

## Lasciato com'è, e perché

| Dove | Che cosa | Perché |
|---|---|---|
| `universe/prompts/theme.md`, `world/bible.json`, `world/style.md`, `world/atlas.json`, `modules/world.layouts`, `modules/world.terrain`, `modules/npc.villager`, `modules/items.base` | Valmora, i 20 ambienti, i terreni con paglia e ponte levatoio, il contadino, il sidro e il mantello di lana | **sono** il tema medievale: la Genesi li sostituisce, e l'universo di esempio non deve cambiare |
| `src/kernel/stamps.ts:9`, `universe/prompts/agents/cartografo.md` | i nomi dei timbri (`castello`, `tana`, `capanne`…) | sono l'API dei programmi su disco; non escono dal programma, il materiale lo dà `codes`. Ma la forma resta: fossato e mura |
| `universe/models/persona.xml`, `contadina.xml`, `bestia.xml`, `monumento.xml`, `pozzo.xml`, `fattoria.xml`… | i modelli generici di classe | si vedono solo finché lo Scultore non ha scritto il modello proprio di ciò che la Fucina ha nominato; riscriverli costerebbe a ogni Genesi |
| `universe/models/viandante.xml` | mantello, cappuccio e bastone | il viandante è una costante: chi gioca si riconosce in ogni mondo; dopo la Genesi `formFor` lo dà comunque. La frase `protagonista` dello stile oggi non lo cambia |
| `universe/modules/world.terrain/logic.lua:1,34` | «Terreno di Valmora», «un borgo temperato» (commenti) e una bozza fatta di biomi naturali | la bozza è deterministica e condivisa da tutti gli universi; una città si fa con gli ambienti, che prima sgombrano. Lo dice il prompt degli ambienti |
| `src/kernel/agents/genesis.ts:14-29` (`BASE_CODES`) | i codici obbligatori sabbia, giungla, neve… | il kernel e la bozza dipendono da loro; il prompt già dice «adattati al tema» |
| `src/kernel/modeldirector.ts:26` (`ITEM_SHAPES`) | forme comuni: lama, arco, pergamena, candela, lanterna | è un insieme di forme che chiede il Narratore; manca un telefono, ma un oggetto può avere un modello suo |
| `src/kernel/agents/content.ts:99,157`, `forge.ts:290` | la tabella di bottino `contadino` | è un id di dati, non si legge nel mondo |
| `src/kernel/agents/effects.ts:102-103`, `mechanics.ts:81` | a cavallo, con la torcia, le armature | esempi di meccanica, in ogni epoca si capisce cosa vogliono dire |
| `src/ui/console.ts:141` | «un fabbro che parla di spade incantate» | segnaposto per il master, fuori dal mondo |
| `universe/modules/magic.runes` | rune magiche, cristallo magico, mana | è una costante come le rune: il canone dice che ogni epoca ne parla a modo suo |
| `universe/world/lessico.md` | | già uguale in ogni epoca (ADR-0075) |
| `universe/models/suono-*.xml` | musica pastorale, selva, pietra | li sceglie il direttore per ambiente, e un ambiente senza brano va ai generali finché il Musicista non ne scrive uno |
| `src/kernel/kernel.ts:7226`, `genesis.ts:264` | se il pacchetto di oggetti o i terreni falliscono due volte restano quelli del seme | il mondo vuoto è peggio di un mantello di lana in una città; è una mancanza da guardare, non un percorso normale |
| `src/kernel/ai/mock.ts` | i modelli locali scrivono sempre Valmora | sono deterministici e i test ci contano; offline il tema resta scritto ma non si vede. Lo dice la schermata |

## Il filtro della quarta parete

`META_RE` (`src/kernel/fourthwall.ts:33`) vieta parole, non intenzioni: `computer`, `server`, `pixel`, `bug`, `programma`, `giocatore`, `simulatore`. In una città del 1995 «il programma alla radio» e «il giocatore del Milan» sono normali; tra i neon anche `server`. **Non è stato allentato** (regola 0, e la quarta parete vale ovunque): i principi dicono di usare le parole del mondo (trasmissione, calciatore, calcolatore, terminale). Il costo è una bibbia chiesta di nuovo o una riga di contenuto ritirata, mai un gioco rotto. L'alternativa, parole diverse per tema, richiederebbe di sapere il tema anche quando è testo libero.

## Cosa può ancora tradire il tema (da leggere in T153)

Nulla di questo si vede offline: i modelli locali scrivono Valmora.

1. **Le stampe**: un ambiente costruito col timbro `castello` ha fossato e mura anche se si chiama «isolato»; `tana`, `piramide`, `dungeon` restano quello che sono. Guardare se il Cartografo le usa, e come.
2. **La città che non c'è**: la bozza è natura. Il Cartografo sa di dover sgombrare, ma la densità di una «grande città» dipende da quanti lotti stanno in 18×18: può venire un quartiere rado tra i boschi.
3. **I mestieri**: il Narratore può tornare a fabbri e locandiere; i principi e il suo ruolo li nominano ancora tra gli esempi, accanto a pochi altri (i principi vanno con ogni richiesta: `tests/focus.test.ts` ne tiene basso il peso).
4. **Le case comuni**: l'Artista può lasciare vuoto `case_comuni` e il mondo avrà le casette del seme; e finché lo Scultore non finisce, o se il budget si esaurisce, ogni lotto mostra la casetta.
5. **Gli oggetti**: mobili e pacchetti da borgo (madia, sidro), forme comuni senza telefoni né radio; il ricadere su `pergamena` e `lanterna`.
6. **Il filtro**: quante righe di bibbia di «moderno» e «futuristico» vengono ritirate per parole come `programma` o `computer`, e se il mondo ne esce impoverito. Nel feed è `scarta`.
7. **Le leggende**: i misteri tendono a re e draghi; il tema moderno ne vuole di altre.
8. **La magia**: se in «moderno» la gente parla di maghi e incantesimi come in un borgo, invece che sottovoce.
9. **La musica**: il brano che suona in un quartiere prima che il Musicista ne scriva uno.

## La frontiera, le isole e la colonia (T184, ADR-0221)

Tre ambientazioni in più: `western` («Far West»), `pirates` («Pirati»), `space` («Spazio»). Il censimento di T152 vale anche per loro (i prompt parlano di epoca, il canone dice che ogni epoca parla delle rune a modo suo, le case comuni le dice l'Artista); qui ciò che non aveva considerato.

### Reso neutro o dipendente dal tema

| Dove | Che cosa mancava | Ora |
|---|---|---|
| `universe/modules/job.*/manifest.json` | i mestieri della frontiera, del porto e della colonia non trovavano il loro programma | `vicesceriffo`, `secondino` (guardia); `cowboy`, `bovaro`, `buttero` (pastore); `telegrafista`, `capitano di porto`, `quartiermastro` (impiegato); `nostromo`, `mozzo` (pescatore); `contrabbandiere` (mercante); `carpentiere`, `calafato` (fabbro); `piantatore`, `piantatrice` (contadino; `marinaio`, `timoniere` e `serricoltrice` no: sono di programmi propri di neapolis, orichalcum e sidera). `sceriffo` e `cuoco` (anche «di bordo») c'erano già |
| `src/kernel/agents/forge.ts` (`STRUCTURES`) | saloon, ranch, faro, molo, fortino diventavano oggetti di una casella | sono ambienti del Cartografo, in italiano e in inglese |
| `src/mj/classes.ts` (`DWELLING_WORDS`) | un saloon o un ranch non era un'abitazione | lo è, come la taverna e la fattoria; il fortino del ranch no |
| `src/kernel/agents/genesis.ts` (terreni) | esempi solo per il borgo e la città | anche la frontiera (assi, terra battuta, recinto), le isole (assi, corallo, sartiame), un mondo lontano (regolite, ghiaccio, vetro delle serre) |

### Lo spazio: cosa funziona e cosa no

Il tema `space` è **la superficie di un mondo lontano** colonizzato da generazioni, con l'aria che si respira: è ciò che il kernel di oggi sa fare.

**Funziona** (senza toccare il kernel): pianure ocra, canyon, crateri e laghi gelati sono terreni e ambienti come gli altri (il Cartografo li colora e li nomina, `BASE_CODES` dice «adattati al tema»: la neve diventa ghiaccio, la sabbia regolite); i moduli prefabbricati, le serre, le torri dell'acqua e il campo delle navette sono strutture dello Scultore; i mestieri hanno il loro programma (tecnico, meccanico, coltivatore, cuoco, guardia); la navetta posata è un modello come un altro; le rune c'erano prima della colonia, il canone non cambia.

**Non funziona, e il testo non lo chiede** (lo spec è di T432):
- il **vuoto**: camminare fuori dall'aria, tute e ossigeno come stato che si consuma, la morte per asfissia (i bisogni sono fame e sete, `sys.needs`);
- la **gravità** diversa o assente: il passo, il salto e le cadute sono quelli del kernel;
- **volare** e viaggiare tra i mondi: la nave resta in orbita, le navette scendono e basta; nessun luogo sta «sopra»;
- **il cielo**: il renderer ha un cielo solo (`SKY.day`, `dusk`, `night`), azzurro di giorno, un sole e il suo giro; niente due lune, niente stelle diverse, niente cielo nero;
- **l'acqua e il clima**: l'acqua è quella dell'automa (`water.ts`) e il mare quello della bozza; non c'è meteo, né ghiaccio che si scioglie;
- **la bozza naturale** ha boschi, giungle e prati: il pianeta lo fanno i terreni (un bosco può diventare «bosco di licheni»), ma la forma resta quella di una terra temperata.

### I pirati e l'acqua

Le isole del testo sono **vicine e unite da secche, scogli e ponti di corda**: si camminano. Non si naviga (le barche non si guidano, il mare blocca come l'acqua profonda), quindi le navi stanno all'ancora nella baia e il mare si attraversa nei racconti. La bozza non fa un arcipelago: il mare è dove lo dice lei (`o`, `relief.sea`), le isole le fa il Cartografo con gli ambienti (spiagge, insenature) o non vengono.

### Cosa può tradire il tema (da guardare in T185)

Nulla si vede offline: i modelli locali scrivono Valmora.

1. **Il porto senza mare**: un luogo «porto» lontano dal mare della bozza; il Cartografo sa di dover mettere le coste dove sono, ma l'atlante può sbagliare.
2. **Le barche**: il Narratore e la Fucina possono proporre una nave da salire o una scialuppa da guidare; il kernel non ha una meccanica per navigare (T183 la misura): ne verrebbe un oggetto con un'azione che non porta da nessuna parte.
3. **Le armi**: revolver, fucili, pistole e sciabole sono cose del mondo (i principi: «a weapon… is made possible»), ma il loro effetto è un insieme chiuso (`core.effects`): ferire a distanza può diventare un colpo a contatto.
4. **I cavalli**: «a saddled horse» è un esempio dei principi, ma montare a cavallo non è una meccanica del kernel; il bovaro senza cavallo cammina.
5. **Lo spazio che torna terra**: boschi verdi, cielo azzurro, il sole che tramonta come altrove; e i mestieri: un medico o un pilota non hanno un programma loro (stanno fermi o fanno il giro della guardia se il nome glielo trova).
6. **Il filtro**: tra le navette `computer` e `server` sono vietati (anche in italiano); una bibbia della colonia può essere chiesta di nuovo per una parola. Le parole del mondo: calcolatore, terminale.
7. **Le leggende**: nei pirati il tesoro sepolto e la nave fantasma vanno bene; «il mare che non si può attraversare» o «chi naviga troppo lontano torna al porto» sono la quarta parete (il filtro li cerca in parte: `confini invalicabili`, `senza tornare sui propri passi`).
8. **Le case comuni**: baracche di assi, case di corallo, moduli prefabbricati li dice l'Artista in `case_comuni`; se lo lascia vuoto il saloon sta tra le casette di paglia del seme.
9. **Le stampe**: il timbro `castello` può diventare il forte sul promontorio (va bene) ma anche la stazione della colonia, con fossato e mura.
