# I programmi di riferimento del cantiere (T181)

Tre programmi MarkovJunior scritti a mano con il metodo descritto in [`../pattern.md`](../pattern.md): nessuna coordinata assoluta, un
piano del cantiere sullo strato z=0, colonne tirate su in un colpo, scale a profilo. Lo stesso XML serve due taglie (il banco riscrive
la `size` della radice) e ogni seme è un altro edificio. Sono il contrario dei modelli di `../finale/` e `../conferma/`, tutti statici.

```bash
npx vite-node lab/scripts/banco-strutture.ts -- --xml lab/banco/riferimento/palazzina.xml --bersagli moderna --giro prova   # misure e foto di un seme
npx vite-node lab/scripts/banco-varianza.ts -- --xml lab/banco/riferimento/forte.xml --bersagli rocca                       # 5 semi, 2 taglie, foglio di contatto
npx vitest run lab/tests/riferimento.test.ts                                                                                   # i tre nel banco, 3 semi
```

| programma | bersaglio | taglie | nodi | tempo | regge (5 semi) | varia (soglia di T180) |
|---|---|---|---|---|---|---|
| `palazzina.xml` | moderna (classe grande) | Grande 100×100×80 vpt 20, Enorme 120×120×96 vpt 16 | 46 | 2,0 s / 3,3 s | **5/5 e 5/5** | **sì**: voxel 0,53 / 0,62, pianta 0,38 / 0,40, perimetro 0,21 / 0,37, interno 0,60 / 0,67, architetture 5/5 |
| `forte.xml` | rocca (Enorme) | Enorme vpt 16, Gargantuesca vpt 12 (stessa griglia) | 58 | 3,7-4,1 s | **5/5 e 5/5** | **sì**: voxel 0,61, pianta 0,57, perimetro 0,29 / 0,31, interno 0,91, architetture 5/5 |
| `tempio.xml` | tempio (classe grande) | Grande, Enorme | 36 | 2,1 s / 3,3 s | **5/5 e 5/5** | **no**: voxel 0,76, pianta 0,20, interno 0,39, ma perimetro 0,00 / 0,02 e architetture 2/5 |

I fogli di contatto (`<nome>-<bersaglio>.png`): una riga per taglia, un seme per colonna, sotto la prima riga le piante del piano terra.
La misura di partenza (T180, `../varianza/riepilogo.md`) era 31 programmi su 31 statici e 1 su 27 che reggeva a Enorme.

## Lo scheletro del prompt (`cantiere.xml`, T182)

La stessa idea della palazzina con regole corte e `steps` (`../pattern.md`, pattern 13): 9 kB invece di 25. È dentro `../prompt.md`. Regge 19-20 semi su 20 a Grande e Enorme (cade su un salto o sulla sagoma) e varia: voxel 0,68 / 0,67, pianta 0,56, perimetro 0,24 / 0,30, interno 0,72 / 0,68, architetture 5/5.

## Palazzina moderna

Reticolo di campate da 30 voxel dal centro del lotto (3×3 a entrambe le taglie, perché il margine chiesto oltre il pilastro è 3); la campata
della porta sul davanti al centro, tre vicine che crescono da lei più un giro a probabilità; le campate a due piani un gruppo connesso che
cresce dalla porta; una coppia di campate alte riceve la scala, che attraversa il muro fra le due (`g`); muri classificati dalle lettere
delle campate; una porta per tratto, un tratto aperto con una panca; due muri esterni portano il piano alto a sbalzo di 4 (il rilievo delle
facciate); finestre sulle fasce; gronda, due volumi tecnici sul tetto.

## Rocca di frontiera

Campate da 36; la cinta è il contorno delle campate scelte (3-5 su 9), spessa 9 per crescita, con il cammino di ronda; torri 13×13 dove le
mura girano; il portone di 24 scava le mura e apre una via di 24 nel cortile, coperta per 20 (l'androne che il banco misura come porta);
il mastio prende due campate in linea dietro il portone, con tre piani (28 d'aria) e due rampe una sull'altra in una striscia da 33 contro
il muro corto; la sua porta guarda la via o il cortile; una scala nel cortile sale al cammino; casse e pozzo nel cortile; merli ogni 8 sulla
faccia esterna e, sotto ogni merlo, una feritoia detta «finestra» (il banco conta solo ciò che sta sul piano principale di ogni lato).

## Tempio a gradoni

Dal centro: la cella (41 o 49 per lato, a caso), la sala 13 oltre, lo zoccolo 4 oltre, ali a caso sullo zoccolo dove c'è posto (a Grande non
c'è); i muri della sala sono le celle della seconda terrazza vicine alla prima, la porta di 24 in mezzo al muro davanti, la via con un
tappeto e due bracieri da saltare; una parete divide il vestibolo (26) dalla sala, con la porta sotto il gradone della cella; la scala sale
nella sala dietro la cella fino al terrazzo (13, ci si cammina) e una porta entra nella cella; nicchie passanti ogni 8 sui muri, colonne
2×2 ogni 9 sul bordo dello zoccolo, cornici d'oro, un gradone sopra la cella.

**Perché non varia.** Il lotto da 100 voxel a Grande, meno il margine, tiene una piramide a tre terrazze (cella, sala, zoccolo) di al più 83 per
lato: l'unica scelta che cambia il perimetro, le ali, non ci sta, e il resto (la cella di 41 o 49, la scala, le nicchie, i bracieri) cambia
l'interno e la massa (voxel 0,76, interno 0,39) ma non il contorno. A Enorme le ali ci stanno (perimetro 0,02: poche e piccole). Un tempio
che vari il perimetro vuole o una scatola più grande o terrazze più sottili di quanto il corpo del gioco richiede per salire e stare.

## Ciò che è stato provato e ciò che no

Provato: `banco-varianza` su 5 semi e 2 taglie per ciascuno (numeri sopra); le foto dei lati di un seme per ciascuno (`lab/out/banco/`, non
in git); il tempo di esecuzione sotto gli 8 s del gioco. Non provato: i programmi dentro il gioco (il seme delle strutture è sempre 1 e un
id non ha taglia: T156); le foto di tutti i semi, solo i fogli di contatto; un giudizio dell'autore sui criteri di `../README.md`.
