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
