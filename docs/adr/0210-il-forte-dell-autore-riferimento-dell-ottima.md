# ADR-0210 — Il forte dell'autore come riferimento dell'ottima: versionato nel banco, un metro nel prompt dello Scultore, una scala di giudizio

Data: 2026-11-17 · Stato: accettato (task T371 del backlog, step 30; D53 dell'autore del 13/11, il forte pronto il 15/11, la scala di D61 del
17/11) · Riferimenti: ADR-0183 (lo Scultore senza scheletro: un programma nel prompt si copia), ADR-0179 (ciò che entra nella taglia, le parti
abitabili), ADR-0185 e ADR-0206 (il tetto dei voxel e il lotto di più luoghi, misurati col forte dell'autore), ADR-0162 (i piani raggiunti a
piedi), T403 (`lab/banco/riferimento/forte-scala.md`, le misure in viandanti), T355, T391, T392, T402 (i giri degli Scultori sul banco delle
taglie), il banco [`lab/banco/riferimento/ottima/`](../../lab/banco/riferimento/ottima/README.md)

## Contesto

L'autore ha disegnato a mano un forte (`lab/mjx/models/handmade/forte-handmade.xml`, 500 × 500 × 150 voxel, 50 × 50 caselle a 10 voxel per
casella: cortili come unioni di rettangoli, mura irregolari con torri agli angoli e lungo i lati, corridoio dentro le mura e camminamento, torri
cave, mastio su più piani) e ha detto (D53) che fissa lo standard della qualità «ottima»: non ci si aspetta che i modelli di oggi lo raggiungano,
è il riferimento. Ha detto anche (15/11) che la prima versione è quella del commit del 15/11 e che potrebbero arrivarne altre: il banco deve
trattarlo come versionato. Il banco delle taglie aveva come forte di riferimento quello di T339 (`lab/banco/pezzi/forte.xml`, dallo stesso pilota
di T337): una composizione senza interni. Lo Scultore delle strutture scrive dal prompt senza scheletro di ADR-0183, e i suoi forti (Argon, Carbon,
Opus, Sonnet, Fable: 5-9 dall'Artista) sono giudicati solo dai controlli del kernel e dal voto dell'Artista, che non dice quanto manca all'ottimo.

## Decisione

1. **Il forte dell'autore è il riferimento dell'ottima, versionato nel banco** (`lab/banco/riferimento/ottima/`): `forte-v1.json` tiene i tratti di
   tre semi e la loro media, l'impronta SHA-256 del file e il commit da cui vengono, la densità (10, D61) e la varietà fra i semi; `forte-v1.png` i
   quattro lati a cartone, `forte-v1-viste.txt` le viste in testo del kernel (ciò che lo Scultore vedrebbe di lui), `forte-v1-lab3d.png` il forte
   nel laboratorio 3D a 10 voxel per casella col viandante nel portone. `REFERENCE_VERSION` (`lab/banco/riferimento/ottima.ts`) dice la versione
   corrente; una versione nuova del forte si misura con `banco-ottima.ts -- --riferimento --versione v2` e sostituisce le misure, la scala resta;
   `lab/tests/ottima.test.ts` controlla che le misure salvate siano del forte su disco (un forte cambiato senza una versione nuova non passa).
   Il programma del forte, i suoi voxel, la sua voce nella libreria del gioco e la densità per voce non cambiano qui (T404).
2. **La scala di giudizio** (`fortTraits`, `SCALE`, `scoreOf`): quattordici tratti letti dai soli voxel, mai dalle lettere della palette, così un
   forte di qualunque Scultore o a mano si misura allo stesso modo: il cortile e i suoi angoli rientranti, gli angoli del contorno, le torri sugli
   angoli convessi, le masse più alte delle mura, l'altezza delle mura e della cima in viandanti, la sagoma, i piani raggiunti a piedi dal portone
   (la camminata del kernel, `habitableParts`, col forte girato verso il fronte su qualunque lato stia il portone), i piani in quota, i piani con
   stanze, le merlature come denti del perimetro, le aperture, il mastio lontano dal portone. Il contorno si legge su celle di un quarto di casella
   alte almeno una casella (le mura, non una siepe) e un varco fino a una casella e mezza non fa uscire il cortile. Ogni tratto vale la quota del
   riferimento raggiunta (al più 1), il voto su 10 è la media, un tratto che il riferimento non ha resta fuori. Il riferimento fa 10 per costruzione;
   la varietà fra i semi (`planDistance`) sta accanto, non nel voto. `lab/scripts/banco-ottima.ts` giudica ogni forte degli Scultori (T355, T391,
   T392, T402) e del banco: fra 4,6 e 6,5 su 10 gli Scultori, 5,9 il forte di T339 e la rocca di frontiera di T181, 4,3 la villetta che non è
   un forte; dove mancano è scritto nel README (il cortile un rettangolo, le mura basse, due piani e nessun camminamento raggiunto, il mastio vicino
   al portone). Le taglie degli Scultori si misurano alla densità della loro voce (`structureVoxels`, `vptOf`: dal T405 a 16
   voxel per casella; T408, che ha integrato questa decisione dopo ADR-0209; a 20 gli Scultori stavano fra 4,7 e 6,2).
3. **Nel prompt delle strutture il forte è un metro, non un esempio**: ADR-0183 ha misurato che un programma nel prompt viene copiato, quindi la
   sezione «The measure of «done well»: the reference fort» di `prompts/agents/sculptor.md` lo descrive in dieci righe (ciò che ha e dove sta) e
   chiede lo stesso per ogni concetto, senza portare il forte in una fattoria. **Il prompt non cresce oltre la misura che aveva** (16 023 caratteri
   dopo T405 il 17/11, ≈ 4 900 token a 3,26 caratteri per token, T325; ora 16 010; il forte vi è detto in voxel, 500 × 500 come la
   gargantuesca dello Scultore, perché è a 10 voxel per casella e lo Scultore scrive a 16): i doppioni di ciò che la richiesta già dice (`bodyLine`: le misure minime
   delle parti e i controlli delle due taglie; `BLOCKS`: le parole dei due blocchi) sono tolti; `tests/sculptor-structures.test.ts` tiene il prompt
   sotto quella misura e il metro dentro.
4. Il kernel non cambia (`src/kernel/` intatto, il prompt sta nel seme `universe/`): la versione resta quella di oggi.

## Alternative scartate

- **Il programma del forte nel prompt**: copiato (T337, ADR-0183); e 26 kB, oltre ogni misura.
- **Una scala sulle lettere** (come `forte-scala.ts`, che legge `A`, `D`, `M`…): vale solo per il forte dell'autore; i forti degli Scultori hanno
  altre lettere.
- **Il voto dell'Artista come misura**: non segue la distanza dall'ottimo (il forte di Opus col 9 fa 4,9, quello col 6 fa 5,7).
- **Un riferimento per ogni concetto**: esiste solo il forte; la scala è del forte e il README lo dice (la villetta fa 4,2 sui tratti generici).
- **La voce del forte con `time` e densità nella libreria**: è T404, in parallelo; qui non si tocca né `block.ts` né `densityFor` né l'indice.

## Conseguenze

- Il banco delle taglie e il banco del cantiere rimandano a `ottima/`; il forte di T339 resta nel banco dei pezzi, giudicato come gli altri.
- L'effetto del metro sullo Scultore vero non è misurato: un giro come quello di T355 con questa scala lo dice; finché non è fatto, il prompt
  nuovo è una decisione da verificare su Gemini e Claude.
- Una v2 del forte: una riga di `REFERENCE_VERSION`, un comando, una tabella rifatta.
- Sicurezza: nessuna superficie nuova (il banco e il prompt; niente server, sessione, sandbox, validatore, crediti).
