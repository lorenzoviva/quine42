# Cantiere 8 — fauna, flora, veicoli e monumenti (60 programmi MarkovJunior 3D)

Sessanta programmi in tre collezioni da venti, cinque per ambientazione (`fantasy` = aurora, `steampunk` = orichalcum, `moderno` = neapolis,
`futuristico` = sidera; `src/kernel/themes.ts`). Ognuno fa **scelte iniziali a caso** (pose, rami, numero di parti, proporzioni) con le
regole di MarkovJunior: semi diversi, modelli diversi. Il metodo è in [`metodo.md`](metodo.md).

Ogni programma passa dal banco (`banco.ts`): il validatore del gioco (`modelErrors` di `src/kernel/validator.ts`, nella scatola della
sua classe), cinque semi (1-5) con 0 voxel fluttuanti, distanza media di forma fra i semi ≥ 0.15 (voxel pieni in un seme e vuoti
nell'altro su quelli pieni in uno dei due, la misura `voxel` di `lab/banco/varianza.ts`), meno di 1500 ms per seme.

```bash
npx vite-node lab/banco/fauna-biomi-cloud/banco.ts            # tutti
npx vite-node lab/banco/fauna-biomi-cloud/banco.ts -- <nome>  # uno
```

Validi: **30 su 30**.

## `creature-veicoli/`

| ambientazione | modello | classe | distanza | fluttuanti | tempo | esito |
|---|---|---|---|---|---|---|
| fantasy | [Cervo reale](creature-veicoli/fantasy/cervo-reale.md) ([xml](creature-veicoli/fantasy/cervo-reale.xml)) | bestia | 0.309 | 0 | 121 ms | valido |
| fantasy | [Lupo dei boschi](creature-veicoli/fantasy/lupo-dei-boschi.md) ([xml](creature-veicoli/fantasy/lupo-dei-boschi.xml)) | bestia | 0.387 | 0 | 147 ms | valido |
| fantasy | [Cinghiale corazzato](creature-veicoli/fantasy/cinghiale-corazzato.md) ([xml](creature-veicoli/fantasy/cinghiale-corazzato.xml)) | bestia | 0.346 | 0 | 147 ms | valido |
| fantasy | [Golem runico](creature-veicoli/fantasy/golem-runico.md) ([xml](creature-veicoli/fantasy/golem-runico.xml)) | persona | 0.287 | 0 | 57 ms | valido |
| fantasy | [Drago antico](creature-veicoli/fantasy/drago-antico.md) ([xml](creature-veicoli/fantasy/drago-antico.xml)) | edificio | 0.431 | 0 | 700 ms | valido |
| steampunk | [Automa sentinella](creature-veicoli/steampunk/automa-sentinella.md) ([xml](creature-veicoli/steampunk/automa-sentinella.xml)) | persona | 0.212 | 0 | 58 ms | valido |
| steampunk | [Segugio d'ottone](creature-veicoli/steampunk/segugio-ottone.md) ([xml](creature-veicoli/steampunk/segugio-ottone.xml)) | bestia | 0.347 | 0 | 147 ms | valido |
| steampunk | [Ragno meccanico](creature-veicoli/steampunk/ragno-meccanico.md) ([xml](creature-veicoli/steampunk/ragno-meccanico.xml)) | bestia | 0.386 | 0 | 256 ms | valido |
| steampunk | [Locomotiva a vapore](creature-veicoli/steampunk/locomotiva-vapore.md) ([xml](creature-veicoli/steampunk/locomotiva-vapore.xml)) | bestia | 0.221 | 0 | 164 ms | valido |
| steampunk | [Dirigibile esploratore](creature-veicoli/steampunk/dirigibile-esploratore.md) ([xml](creature-veicoli/steampunk/dirigibile-esploratore.xml)) | edificio | 0.380 | 0 | 490 ms | valido |
| moderno | [Cane randagio](creature-veicoli/moderno/cane-randagio.md) ([xml](creature-veicoli/moderno/cane-randagio.xml)) | animale | 0.354 | 0 | 21 ms | valido |
| moderno | [Gatto urbano](creature-veicoli/moderno/gatto-urbano.md) ([xml](creature-veicoli/moderno/gatto-urbano.xml)) | animale | 0.390 | 0 | 22 ms | valido |
| moderno | [Furgone delle consegne](creature-veicoli/moderno/furgone-consegne.md) ([xml](creature-veicoli/moderno/furgone-consegne.xml)) | bestia | 0.274 | 0 | 148 ms | valido |
| moderno | [Motocicletta stradale](creature-veicoli/moderno/motocicletta-stradale.md) ([xml](creature-veicoli/moderno/motocicletta-stradale.xml)) | bestia | 0.403 | 0 | 247 ms | valido |
| moderno | [Elicottero di soccorso](creature-veicoli/moderno/elicottero-soccorso.md) ([xml](creature-veicoli/moderno/elicottero-soccorso.xml)) | edificio | 0.380 | 0 | 567 ms | valido |
| futuristico | [Drone esapode](creature-veicoli/futuristico/drone-esapode.md) ([xml](creature-veicoli/futuristico/drone-esapode.xml)) | bestia | 0.307 | 0 | 141 ms | valido |
| futuristico | [Camminatore pesante](creature-veicoli/futuristico/camminatore-pesante.md) ([xml](creature-veicoli/futuristico/camminatore-pesante.xml)) | edificio | 0.409 | 0 | 585 ms | valido |
| futuristico | [Xenofauna cristallina](creature-veicoli/futuristico/xenofauna-cristallina.md) ([xml](creature-veicoli/futuristico/xenofauna-cristallina.xml)) | bestia | 0.368 | 0 | 128 ms | valido |
| futuristico | [Navetta orbitale](creature-veicoli/futuristico/navetta-orbitale.md) ([xml](creature-veicoli/futuristico/navetta-orbitale.xml)) | edificio | 0.343 | 0 | 293 ms | valido |
| futuristico | [Rover da esplorazione](creature-veicoli/futuristico/rover-esplorazione.md) ([xml](creature-veicoli/futuristico/rover-esplorazione.xml)) | bestia | 0.237 | 0 | 93 ms | valido |

## `flora-geologia/`

| ambientazione | modello | classe | distanza | fluttuanti | tempo | esito |
|---|---|---|---|---|---|---|
| fantasy | [Quercia secolare](flora-geologia/fantasy/quercia-secolare.md) ([xml](flora-geologia/fantasy/quercia-secolare.xml)) | albero | 0.644 | 0 | 123 ms | valido |
| fantasy | [Salice piangente](flora-geologia/fantasy/salice-piangente.md) ([xml](flora-geologia/fantasy/salice-piangente.xml)) | albero | 0.817 | 0 | 112 ms | valido |
| fantasy | [Fungo gigante luminoso](flora-geologia/fantasy/fungo-gigante-luminoso.md) ([xml](flora-geologia/fantasy/fungo-gigante-luminoso.xml)) | albero | 0.486 | 0 | 266 ms | valido |
| fantasy | [Arco di roccia muschioso](flora-geologia/fantasy/arco-roccia-muschioso.md) ([xml](flora-geologia/fantasy/arco-roccia-muschioso.xml)) | edificio | 0.358 | 0 | 708 ms | valido |
| fantasy | [Cristalli di caverna](flora-geologia/fantasy/cristallo-caverna.md) ([xml](flora-geologia/fantasy/cristallo-caverna.xml)) | edificio | 0.307 | 0 | 378 ms | valido |
| steampunk | [Albero di ferro fuso](flora-geologia/steampunk/albero-ferro-fuso.md) ([xml](flora-geologia/steampunk/albero-ferro-fuso.xml)) | albero | 0.706 | 0 | 126 ms | valido |
| steampunk | [Camino geotermico](flora-geologia/steampunk/camino-geotermico.md) ([xml](flora-geologia/steampunk/camino-geotermico.xml)) | edificio | 0.202 | 0 | 309 ms | valido |
| steampunk | [Venatura di oricalco](flora-geologia/steampunk/venatura-oricalco.md) ([xml](flora-geologia/steampunk/venatura-oricalco.xml)) | edificio | 0.303 | 0 | 469 ms | valido |
| steampunk | [Ponte di tubi a vapore](flora-geologia/steampunk/ponte-tubi-vapore.md) ([xml](flora-geologia/steampunk/ponte-tubi-vapore.xml)) | edificio | 0.509 | 0 | 235 ms | valido |
| steampunk | [Gru di miniera](flora-geologia/steampunk/gru-miniera.md) ([xml](flora-geologia/steampunk/gru-miniera.xml)) | edificio | 0.501 | 0 | 318 ms | valido |
