# Cantiere 8 — fauna, flora, veicoli e monumenti (60 programmi MarkovJunior 3D)

Sessanta programmi in tre collezioni da venti, cinque per ambientazione (`fantasy` = aurora, `steampunk` = orichalcum, `moderno` = neapolis,
`futuristico` = sidera; `src/kernel/themes.ts`). Ognuno fa **scelte iniziali a caso** (pose, rami, numero di parti, proporzioni) con le
regole di MarkovJunior: semi diversi, modelli diversi. Il metodo è in [`metodo.md`](metodo.md).

Ogni programma passa dal banco (`banco.ts`): il validatore del gioco (`modelErrors` di `src/kernel/validator.ts`, nella scatola della
sua classe), cinque semi (1-5) con 0 voxel fluttuanti (e altri 15 semi provati solo per ciò che si rompe), distanza media di forma fra i semi ≥ 0.15 (voxel pieni in un seme e vuoti
nell'altro su quelli pieni in uno dei due, la misura `voxel` di `lab/banco/varianza.ts`), meno di 1500 ms per seme.

```bash
npx vite-node lab/banco/fauna-biomi-cloud/banco.ts            # tutti
npx vite-node lab/banco/fauna-biomi-cloud/banco.ts -- <nome>  # uno
```

Validi: **60 su 60**. La distanza minima fra due semi è nei rapporti: con molte scelte due semi su cinque possono
cadere sulle stesse opzioni e differire solo per ciò che cresce a caso (antenne, tiranti, pacchi, nidi).

Il nome `torre- schermatura` della richiesta (con uno spazio) è diventato `torre-schermatura`: i nomi dei modelli del gioco non hanno
spazi (`MODEL_RE` in `src/kernel/validator.ts`).

## `creature-veicoli/`

| ambientazione | modello | classe | distanza | fluttuanti | tempo | esito |
|---|---|---|---|---|---|---|
| fantasy | [Cervo reale](creature-veicoli/fantasy/cervo-reale.md) ([xml](creature-veicoli/fantasy/cervo-reale.xml)) | bestia | 0.439 | 0 | 135 ms | valido |
| fantasy | [Lupo dei boschi](creature-veicoli/fantasy/lupo-dei-boschi.md) ([xml](creature-veicoli/fantasy/lupo-dei-boschi.xml)) | bestia | 0.476 | 0 | 185 ms | valido |
| fantasy | [Cinghiale corazzato](creature-veicoli/fantasy/cinghiale-corazzato.md) ([xml](creature-veicoli/fantasy/cinghiale-corazzato.xml)) | bestia | 0.382 | 0 | 136 ms | valido |
| fantasy | [Golem runico](creature-veicoli/fantasy/golem-runico.md) ([xml](creature-veicoli/fantasy/golem-runico.xml)) | persona | 0.306 | 0 | 74 ms | valido |
| fantasy | [Drago antico](creature-veicoli/fantasy/drago-antico.md) ([xml](creature-veicoli/fantasy/drago-antico.xml)) | edificio | 0.446 | 0 | 669 ms | valido |
| steampunk | [Automa sentinella](creature-veicoli/steampunk/automa-sentinella.md) ([xml](creature-veicoli/steampunk/automa-sentinella.xml)) | persona | 0.264 | 0 | 57 ms | valido |
| steampunk | [Segugio d'ottone](creature-veicoli/steampunk/segugio-ottone.md) ([xml](creature-veicoli/steampunk/segugio-ottone.xml)) | bestia | 0.496 | 0 | 180 ms | valido |
| steampunk | [Ragno meccanico](creature-veicoli/steampunk/ragno-meccanico.md) ([xml](creature-veicoli/steampunk/ragno-meccanico.xml)) | bestia | 0.509 | 0 | 193 ms | valido |
| steampunk | [Locomotiva a vapore](creature-veicoli/steampunk/locomotiva-vapore.md) ([xml](creature-veicoli/steampunk/locomotiva-vapore.xml)) | bestia | 0.227 | 0 | 138 ms | valido |
| steampunk | [Dirigibile esploratore](creature-veicoli/steampunk/dirigibile-esploratore.md) ([xml](creature-veicoli/steampunk/dirigibile-esploratore.xml)) | edificio | 0.442 | 0 | 556 ms | valido |
| moderno | [Cane randagio](creature-veicoli/moderno/cane-randagio.md) ([xml](creature-veicoli/moderno/cane-randagio.xml)) | animale | 0.628 | 0 | 21 ms | valido |
| moderno | [Gatto urbano](creature-veicoli/moderno/gatto-urbano.md) ([xml](creature-veicoli/moderno/gatto-urbano.xml)) | animale | 0.711 | 0 | 25 ms | valido |
| moderno | [Furgone delle consegne](creature-veicoli/moderno/furgone-consegne.md) ([xml](creature-veicoli/moderno/furgone-consegne.xml)) | bestia | 0.429 | 0 | 157 ms | valido |
| moderno | [Motocicletta stradale](creature-veicoli/moderno/motocicletta-stradale.md) ([xml](creature-veicoli/moderno/motocicletta-stradale.xml)) | bestia | 0.554 | 0 | 391 ms | valido |
| moderno | [Elicottero di soccorso](creature-veicoli/moderno/elicottero-soccorso.md) ([xml](creature-veicoli/moderno/elicottero-soccorso.xml)) | edificio | 0.431 | 0 | 463 ms | valido |
| futuristico | [Drone esapode](creature-veicoli/futuristico/drone-esapode.md) ([xml](creature-veicoli/futuristico/drone-esapode.xml)) | bestia | 0.428 | 0 | 168 ms | valido |
| futuristico | [Camminatore pesante](creature-veicoli/futuristico/camminatore-pesante.md) ([xml](creature-veicoli/futuristico/camminatore-pesante.xml)) | edificio | 0.496 | 0 | 637 ms | valido |
| futuristico | [Xenofauna cristallina](creature-veicoli/futuristico/xenofauna-cristallina.md) ([xml](creature-veicoli/futuristico/xenofauna-cristallina.xml)) | bestia | 0.383 | 0 | 167 ms | valido |
| futuristico | [Navetta orbitale](creature-veicoli/futuristico/navetta-orbitale.md) ([xml](creature-veicoli/futuristico/navetta-orbitale.xml)) | edificio | 0.366 | 0 | 273 ms | valido |
| futuristico | [Rover da esplorazione](creature-veicoli/futuristico/rover-esplorazione.md) ([xml](creature-veicoli/futuristico/rover-esplorazione.xml)) | bestia | 0.215 | 0 | 93 ms | valido |

## `flora-geologia/`

| ambientazione | modello | classe | distanza | fluttuanti | tempo | esito |
|---|---|---|---|---|---|---|
| fantasy | [Quercia secolare](flora-geologia/fantasy/quercia-secolare.md) ([xml](flora-geologia/fantasy/quercia-secolare.xml)) | albero | 0.665 | 0 | 109 ms | valido |
| fantasy | [Salice piangente](flora-geologia/fantasy/salice-piangente.md) ([xml](flora-geologia/fantasy/salice-piangente.xml)) | albero | 0.848 | 0 | 102 ms | valido |
| fantasy | [Fungo gigante luminoso](flora-geologia/fantasy/fungo-gigante-luminoso.md) ([xml](flora-geologia/fantasy/fungo-gigante-luminoso.xml)) | albero | 0.397 | 0 | 295 ms | valido |
| fantasy | [Arco di roccia muschioso](flora-geologia/fantasy/arco-roccia-muschioso.md) ([xml](flora-geologia/fantasy/arco-roccia-muschioso.xml)) | edificio | 0.476 | 0 | 690 ms | valido |
| fantasy | [Cristalli di caverna](flora-geologia/fantasy/cristallo-caverna.md) ([xml](flora-geologia/fantasy/cristallo-caverna.xml)) | edificio | 0.298 | 0 | 425 ms | valido |
| steampunk | [Albero di ferro fuso](flora-geologia/steampunk/albero-ferro-fuso.md) ([xml](flora-geologia/steampunk/albero-ferro-fuso.xml)) | albero | 0.782 | 0 | 145 ms | valido |
| steampunk | [Camino geotermico](flora-geologia/steampunk/camino-geotermico.md) ([xml](flora-geologia/steampunk/camino-geotermico.xml)) | edificio | 0.191 | 0 | 323 ms | valido |
| steampunk | [Venatura di oricalco](flora-geologia/steampunk/venatura-oricalco.md) ([xml](flora-geologia/steampunk/venatura-oricalco.xml)) | edificio | 0.472 | 0 | 512 ms | valido |
| steampunk | [Ponte di tubi a vapore](flora-geologia/steampunk/ponte-tubi-vapore.md) ([xml](flora-geologia/steampunk/ponte-tubi-vapore.xml)) | edificio | 0.585 | 0 | 269 ms | valido |
| steampunk | [Gru di miniera](flora-geologia/steampunk/gru-miniera.md) ([xml](flora-geologia/steampunk/gru-miniera.xml)) | edificio | 0.524 | 0 | 307 ms | valido |
| moderno | [Platano di viale](flora-geologia/moderno/platano-viale.md) ([xml](flora-geologia/moderno/platano-viale.xml)) | albero | 0.761 | 0 | 129 ms | valido |
| moderno | [Aiuola fiorita](flora-geologia/moderno/aiuola-fiorita-urbana.md) ([xml](flora-geologia/moderno/aiuola-fiorita-urbana.xml)) | cespuglio | 0.342 | 0 | 15 ms | valido |
| moderno | [Scogliera frangiflutti](flora-geologia/moderno/scogliera-frangiflutti.md) ([xml](flora-geologia/moderno/scogliera-frangiflutti.xml)) | edificio | 0.326 | 0 | 262 ms | valido |
| moderno | [Traliccio dell'alta tensione](flora-geologia/moderno/traliccio-alta-tensione.md) ([xml](flora-geologia/moderno/traliccio-alta-tensione.xml)) | monumento | 0.390 | 0 | 101 ms | valido |
| moderno | [Cantiere con la gru](flora-geologia/moderno/cantiere-gru.md) ([xml](flora-geologia/moderno/cantiere-gru.xml)) | edificio | 0.192 | 0 | 871 ms | valido |
| futuristico | [Albero bioluminescente](flora-geologia/futuristico/albero-bioluminescente.md) ([xml](flora-geologia/futuristico/albero-bioluminescente.xml)) | albero | 0.804 | 0 | 147 ms | valido |
| futuristico | [Corallo di silicio](flora-geologia/futuristico/corallo-silicio.md) ([xml](flora-geologia/futuristico/corallo-silicio.xml)) | albero | 0.349 | 0 | 273 ms | valido |
| futuristico | [Monolite magnetico](flora-geologia/futuristico/monolite-magnetico.md) ([xml](flora-geologia/futuristico/monolite-magnetico.xml)) | monumento | 0.441 | 0 | 188 ms | valido |
| futuristico | [Geyser criogenico](flora-geologia/futuristico/geyser-criogenico.md) ([xml](flora-geologia/futuristico/geyser-criogenico.xml)) | edificio | 0.434 | 0 | 641 ms | valido |
| futuristico | [Antenna dello spazio profondo](flora-geologia/futuristico/antenna-array-profondo.md) ([xml](flora-geologia/futuristico/antenna-array-profondo.xml)) | edificio | 0.345 | 0 | 618 ms | valido |

## `monumenti-rovine/`

| ambientazione | modello | classe | distanza | fluttuanti | tempo | esito |
|---|---|---|---|---|---|---|
| fantasy | [Ponte di pietra antico](monumenti-rovine/fantasy/ponte-pietra-antico.md) ([xml](monumenti-rovine/fantasy/ponte-pietra-antico.xml)) | edificio | 0.354 | 0 | 251 ms | valido |
| fantasy | [Circolo megalitico](monumenti-rovine/fantasy/circolo-megalitico.md) ([xml](monumenti-rovine/fantasy/circolo-megalitico.xml)) | edificio | 0.633 | 0 | 163 ms | valido |
| fantasy | [Rovine del tempio sommerso](monumenti-rovine/fantasy/rovine-tempio-sommerso.md) ([xml](monumenti-rovine/fantasy/rovine-tempio-sommerso.xml)) | edificio | 0.246 | 0 | 80 ms | valido |
| fantasy | [Statua colosso](monumenti-rovine/fantasy/statua-colosso.md) ([xml](monumenti-rovine/fantasy/statua-colosso.xml)) | monumento | 0.280 | 0 | 124 ms | valido |
| fantasy | [Portale arcano](monumenti-rovine/fantasy/portale-arcano.md) ([xml](monumenti-rovine/fantasy/portale-arcano.xml)) | edificio | 0.489 | 0 | 257 ms | valido |
| steampunk | [Orologio astrario](monumenti-rovine/steampunk/orologio-astrario-piazza.md) ([xml](monumenti-rovine/steampunk/orologio-astrario-piazza.xml)) | edificio | 0.292 | 0 | 296 ms | valido |
| steampunk | [Ponte levatoio a ingranaggi](monumenti-rovine/steampunk/ponte-levatoio-ingranaggi.md) ([xml](monumenti-rovine/steampunk/ponte-levatoio-ingranaggi.xml)) | edificio | 0.549 | 0 | 676 ms | valido |
| steampunk | [Cisterna a pressione](monumenti-rovine/steampunk/cisterna-pressione.md) ([xml](monumenti-rovine/steampunk/cisterna-pressione.xml)) | edificio | 0.415 | 0 | 546 ms | valido |
| steampunk | [Stazione della teleferica](monumenti-rovine/steampunk/stazione-teleferica.md) ([xml](monumenti-rovine/steampunk/stazione-teleferica.xml)) | edificio | 0.240 | 0 | 294 ms | valido |
| steampunk | [Faro aeronautico](monumenti-rovine/steampunk/faro-aeronautico.md) ([xml](monumenti-rovine/steampunk/faro-aeronautico.xml)) | edificio | 0.465 | 0 | 382 ms | valido |
| moderno | [Monumento di piazza](monumenti-rovine/moderno/monumento-piazza.md) ([xml](monumenti-rovine/moderno/monumento-piazza.xml)) | edificio | 0.338 | 0 | 546 ms | valido |
| moderno | [Fermata della metropolitana](monumenti-rovine/moderno/fermata-metropolitana.md) ([xml](monumenti-rovine/moderno/fermata-metropolitana.xml)) | edificio | 0.229 | 0 | 480 ms | valido |
| moderno | [Mercato coperto](monumenti-rovine/moderno/chiosco-mercato-coperto.md) ([xml](monumenti-rovine/moderno/chiosco-mercato-coperto.xml)) | edificio | 0.645 | 0 | 506 ms | valido |
| moderno | [Passerella pedonale](monumenti-rovine/moderno/passerella-pedonale.md) ([xml](monumenti-rovine/moderno/passerella-pedonale.xml)) | edificio | 0.612 | 0 | 454 ms | valido |
| moderno | [Faro portuale](monumenti-rovine/moderno/faro-portuale.md) ([xml](monumenti-rovine/moderno/faro-portuale.xml)) | edificio | 0.507 | 0 | 235 ms | valido |
| futuristico | [Anello del teletrasporto](monumenti-rovine/futuristico/anello-teletrasporto.md) ([xml](monumenti-rovine/futuristico/anello-teletrasporto.xml)) | edificio | 0.626 | 0 | 733 ms | valido |
| futuristico | [Cupola geodetica](monumenti-rovine/futuristico/cupola-geodetica.md) ([xml](monumenti-rovine/futuristico/cupola-geodetica.xml)) | edificio | 0.477 | 0 | 726 ms | valido |
| futuristico | [Torre di schermatura](monumenti-rovine/futuristico/torre-schermatura.md) ([xml](monumenti-rovine/futuristico/torre-schermatura.xml)) | monumento | 0.517 | 0 | 99 ms | valido |
| futuristico | [Relitto d'astronave](monumenti-rovine/futuristico/relitto-astronave.md) ([xml](monumenti-rovine/futuristico/relitto-astronave.xml)) | edificio | 0.525 | 0 | 822 ms | valido |
| futuristico | [Faro iperspaziale](monumenti-rovine/futuristico/faro-iperspaziale.md) ([xml](monumenti-rovine/futuristico/faro-iperspaziale.xml)) | edificio | 0.470 | 0 | 473 ms | valido |
