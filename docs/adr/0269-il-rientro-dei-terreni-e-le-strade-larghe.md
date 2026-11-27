# ADR-0269 — Il rientro dei terreni, il cordolo e le strade larghe

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T548 (C4 di [`docs/design/terreno-ricco.md`](../design/terreno-ricco.md), § 3.2 A, § 3.4 e § 7)
- **Estende**: ADR-0224 (i terreni come dati), ADR-0242 (la mesh dei luoghi in un worker), ADR-0250 (la regola 10 dei gradini), ADR-0267 (la grana del suolo)

## Contesto

Lo studio di T509 ha misurato le strade di oggi: la «strada» di `neapolis` è un quadrato grigio alla stessa altezza del marciapiede, senza
cordolo, e il Concilio non ha un campo per abbassarla. Ha proposto tre vie per lo scavo e l'autore ha scelto la A per strade e marciapiedi
(D3): **il rientro**, solo aspetto, sotto un livello del rilievo. Guardando le foto l'autore ha aggiunto che la strada asfaltata è larga una
casella: **le strade vanno ampie**. In `neapolis` la via con cui il layout scava i sentieri (`p`) si chiama «strada» e il suolo di base (`g`)
«marciapiede»: le vie del layout, i varchi, la `road` dei timbri, le righe di `p` dei programmi sono tutte strade di una casella.

## Decisione

1. **Il rientro è un campo del terreno**, `TerrainDef.inset`: quanto più in basso (negativo) o più in alto la cima delle sue caselle si
   disegna, in caselle, fra −0,2 e 0,2 (`INSET_LIMITS`), sempre meno di un livello del rilievo (0,25): mai un gradino. Si legge senza fidarsi
   (`readInset`, `src/kernel/inset.ts`, puro e leggero come `grain.ts`); il validatore dei manifest lo vuole nell'intervallo (`insetErrors`);
   alla Genesi è facoltativo nello schema dei terreni del Cartografo, solo per il suolo che si cammina (`toPalette`, `insetField`).
2. **Il suolo di base non rientra mai**: `g` è il livello del mondo. Abbassarlo abbasserebbe il mondo e alzerebbe ogni altro terreno (in
   `sidera` il suolo di base è «asfalto bagnato»). Il validatore rifiuta un rientro su `g` diverso da 0, la Genesi non lo scrive, `insetOf` lo
   tiene a 0.
3. **La riparazione dal nome** per gli universi di prima, senza chiamate e senza scrivere niente (`insetByName`, `insetKind`, come
   `grainByName` di ADR-0267): una strada (strada, asfalto, carreggiata, parcheggio, corso, viale; road, street, asphalt…) −0,12, un fosso
   −0,18, la massicciata dei binari +0,06; mai un sentiero né una pista. Ciò che il terreno dice vince, e 0 lo toglie.
4. **Il renderer lo disegna, il kernel non lo legge.** La cima di una casella del suolo è `groundY` + il rientro (`terrainLook`, il terreno
   come la mesh lo legge; nel worker il quinto campo della palette di `ChunkInput`, uguale byte per byte alla pagina); i lati dove il vicino
   è più basso la mesh li disegnava già, quindi **il cordolo nasce da sé** dove la strada tocca il marciapiede. Ciò che vi sta sopra si
   disegna con lo stesso scostamento (`onTop` in `src/render/entities.ts`: il viandante, le persone, le cose, le rune, dove stanno sul suolo
   stesso; su un pavimento, un ponte, una cantina come il kernel dice). Il kernel no: i livelli, `groundAt`, `floorAt`, la collisione, la
   rete, la regola 10, l'acqua restano quelli di prima (`tests/rientro.test.ts` lo prova su un rialzo di otto livelli).
5. **Le strade larghe.** Dove la via del layout è una strada per il suo nome (`isRoad`: la stessa parola del rientro, mai un sentiero), le
   strade di un luogo nuovo si allargano a `width` caselle (`STREET_WIDTH` 3, l'ambiente dice 1-4 con `EnvironmentDef.street.width`, letto
   senza fidarsi; 1 come prima) sul suolo di base e sul marciapiede (`widenStreets`, `src/kernel/streets.ts`): ogni casella di strada si
   allarga di `floor((w−1)/2)` verso le x e le y minori e del resto verso le maggiori, mai su ciò che non è suolo di base (muri, acqua,
   alberi, campi, aiuole, binari), mai sul lotto di un blocco, mai sull'anello del bordo se non lungo il varco di una strada (le stesse
   caselle dai due lati del bordo: il varco è lo stesso per i due luoghi, `gates`, e la strada continua larga nel luogo accanto). I pezzi di
   strada che un programma sparge (meno di `MIN_ROAD` caselle unite, che non portano a un varco) restano pezzi. Il marciapiede ai lati, dentro
   l'anello, dove il mondo ne ha uno diverso dal suolo di base: un terreno che il nome dice marciapiede, o quello dell'ambiente
   (`street.sidewalk`, solo se è suolo che si cammina all'aperto). Il Cartografo può dire la larghezza alla Genesi (`street_width`).
6. **Cambiano solo i codici del suolo che si cammina**: ciò che si cammina resta camminato e ciò che non si cammina resta com'era, quindi
   ciò che si raggiunge (`reachable`), i lotti e la regola 10 sono gli stessi. La rete prende come vie da raggiungere solo le strade com'erano
   posate (`networkOf` salta `LayoutResult.widened`), così è la stessa rete: rampe, enclavi, terra mossa. Col rilievo vero una strada si
   allarga solo su una casella al livello della casella da cui si allarga: non sale un dirupo. `rete-gradini.ts --strada` (la via del seme
   chiamata «strada») dà lo stesso rapporto prima e dopo, col rialzo di otto livelli e col rilievo vero.
7. **Solo nei piani nuovi col loro segno**, `ChunkPlan.streets: true`, che il kernel scrive su ogni piano che fa (come `swim` e `climates`,
   ADR-0225, ADR-0261): un piano di prima tiene le sue strade strette, perché le sue cose e le sue modifiche sono per casella. Il rientro
   invece vale per ogni universo, anche per i luoghi di prima: è solo aspetto.

## Conseguenze

- `neapolis`: la «strada» e il «parcheggio» rientrano di 0,12 e i binari salgono di 0,06 in tutti i luoghi, quelli di prima compresi (il
  cordolo lungo ogni strada); nei suoi luoghi nuovi le strade sono larghe 3 sul marciapiede (che è il suo suolo di base). Sui suoi 95 piani
  rifatti col segno (`lab/scripts/strade-larghe.ts`): 53 cambiano, 1 955 caselle (20,6 a luogo), strada 2 402 → 4 357, marciapiede
  7 667 → 5 712, ciò che si cammina e ciò che si raggiunge uguali in ognuno; le strutture riportano il loro lotto al suolo (`lotsOf`), quindi
  dove c'è un edificio la strada resta com'era.
- `sidera`: niente. La sua via è una «passerella» (non una strada), il suo «asfalto bagnato» è il suolo di base, nessun terreno ha un nome che
  rientra.
- Il seme non cambia: la sua via è un «sentiero»; nessuna mesh dei suoi luoghi cambia.
- Contratto: aggiuntivo (kernel 0.10.43). Un piano senza segno resta com'era, un terreno senza rientro si disegna come prima tranne ciò che il
  nome ripara.
- Non fatto: i modelli allineati sopra la strada (le strisce, i binari a bracci: C5), lo scavo del layout (C6), il marciapiede rialzato
  attorno alle piazze; un piano di prima non si allarga mai.
