Scrivi un solo programma XML di MarkovJunior che **fa crescere** l'edificio chiesto, un modello a voxel in cui si entra, si sale e si salta. Rispondi con il solo XML, senza commenti né spiegazioni. Non calcolare il programma cella per cella: parti dallo scheletro qui sotto, che già regge, e cambia ciò che serve.

## Il programma gira con molti semi e più taglie
Lo stesso XML gira con almeno 5 semi e 2 taglie: scatola da 100×100×80 (20 voxel per casella, gradino 4, persona alta 30) a 120×120×96 (16 voxel per casella, gradino 3, persona 24; con 12 voxel per casella gradino 2, persona 18). Ogni seme deve dare un altro edificio, con contorno, pianta e stanze diversi, e tutti devono reggere. Quindi niente `<box>`, niente coordinate e niente `size`: solo regole, ancorate al centro del pavimento e a ciò che c'è già.

## Il formato
x da sinistra a destra, y dal retro al davanti (il davanti è y grande), z dal basso in alto. `values` sono le lettere, una lettera per cella (la prima, B, è l'aria), solo lettere: le cifre non hanno colore e servono per i nomi delle `union`. Un pattern: righe (y crescente) separate da `/`, strati separati da spazi, **lo strato in alto per primo**: `in="B t"` è t con sopra l'aria. `*` è qualunque cella (in `out`: non cambia), `[ab]` è a oppure b, `<union symbol="1" values="ab"/>` dà un nome a un insieme.
- `<one>` riscrive una corrispondenza a caso per passo, `<all>` tutte quelle che non si sovrappongono, `<prl>` ognuna con la sua probabilità (`p` sta sulla `<rule>`; un solo passo). Senza `steps` un nodo va finché può; `steps="N"` lo ferma dopo N passi. I nodi girano in ordine.
- La simmetria della radice, `(xy)`, prova ogni regola in tutte le direzioni del piano; `symmetry="()"` solo come è scritta, `(x)` e `(y)` anche specchiata.
- `ground="E"` riempie lo strato z=0, `origin="bottom"` mette la seconda lettera al centro del pavimento.
- Una lettera senza `<color>` usa un colore predefinito: **ogni marcatore deve sparire alla fine**, riscritto da una regola. `glow="True"` dà luce, `alpha="0.5"` è vetro. `<action name="apri" label="Apri la porta">` apre la porta.

## Il corpo
Il corpo è largo 9 voxel (passa in 11), cammina sui pavimenti e non ci passa se sotto i suoi piedi due colonne vicine differiscono più di un gradino. Una scala larga 11 con alzata 2 e pedata 1 sale a ogni taglia. Per questo il corpo non sale di lato su una scala e non scende di lato dal suo ultimo gradino: la scala **sbocca in linea**, su un pavimento alla sua quota. Sotto una scala è pieno.

## Ciò che ogni seme deve avere
- **Porta** sul davanti, in mezzo, alta come una persona e larga 11, con la strada dritta e scoperta fino al bordo (niente sopra di lei a nessuna altezza).
- **Almeno 2 piani coperti** a cui si arriva a piedi, soffitto almeno 30 sopra il pavimento; **almeno 4 stanze** sommando i piani, con varchi di al più 11-20 voxel; nessuna stanza o piano murato. **A 100×100 una campata da 29 conta come stanza solo se è sgombra fino ai muri**: un arredo che sporge più di un voxel la toglie dalla conta (sala di due campate unite, muro aperto: quella regge gli arredi). Lascia sgombre almeno 3 campate a ogni seme.
- **Almeno 2 posti dove il salto serve**: un ostacolo alto più di un gradino e al più 16, che si scavalca verso un pavimento a cui si arriva anche a piedi.
- **Almeno 6 finestre su 3 lati** (vetro o fori, almeno 7 voxel di lato, sul piano esterno del muro; le feritoie si chiamano `name="finestra…"`); **6 materiali visibili**, il più usato sotto il 50 % dei voxel; **4 altezze della cima**; **almeno 24 dettagli** sulle facciate (pezzi di 2-300 voxel di una lettera) su tutti i lati; **il 12 % delle facciate fuori dal piano** (contrafforti, balconi, ali); **almeno il 30 % della pianta della scatola occupato, a ogni taglia** (a 120 sono almeno 5 campate da 30).
- Tutto attaccato, poggiato sul fondo, finito in 8 secondi a 120×120×96.

## Lo scheletro
Regge 19-20 semi su 20 alle due taglie, ed è una palazzina qualunque: è il punto di partenza, non il risultato.
```xml
<sequence values="BNExzaPpQbOHtsgcdvefwXiIJhjMSFCWRVDLUuTYGKAknryql" symmetry="(xy)" ground="E" origin="bottom">
  <union symbol="1" values="be"/>
  <union symbol="2" values="tsdcfv"/>
  <union symbol="3" values="tb"/>
  <color symbol="k" value="5a3a22" name="porta"/><color symbol="S" value="d6d2c8" name="cemento chiaro"/><color symbol="F" value="a8743f" name="legno"/><color symbol="C" value="b9b5ab" name="cemento grigio"/><color symbol="W" value="f0ece2" name="intonaco"/><color symbol="R" value="8f8f88" name="ghiaia"/><color symbol="V" value="86b8c8" alpha="0.5" name="vetro"/><color symbol="D" value="3a3d42" name="telaio"/><color symbol="L" value="7a5a3c" name="rovere"/><color symbol="T" value="e0d9c2" name="gradino"/><color symbol="K" value="c2c7cc" name="acciaio"/><color symbol="A" value="9a9590" name="lastricato"/>
  <!-- 1. reticolo: bracci dal centro, poi le linee -->
  <prl in="***/*E*/***" out="***/*z*/***"/>
  <all in="Nz" out="*a" steps="1"/>
  <all in="[Nx]az" out="*xa" steps="14"/>
  <prl in="a" out="Q"/>
  <all in="xQz" out="*Qa" steps="1"/>
  <all in="[Qx]az" out="*xa" steps="29"/>
  <prl in="a" out="Q"/>
  <all in="z/Q/z" out="a/Q/a" symmetry="()"/>
  <all in="[Qp]/a/z" out="*/p/a" symmetry="(y)" steps="44"/>
  <prl in="a" out="p"/>
  <all in="zQz" out="aQa" symmetry="()"/>
  <all in="[Ql]a[zp]" out="*la" symmetry="(x)" steps="44"/>
  <prl><rule in="a" out="p"/><rule in="l" out="p"/></prl>
  <all in="x/Q/z" out="t/O/*" symmetry="()"/>
  <prl in="Q" out="p"/>
  <prl><rule in="x" out="z"/><rule in="N" out="z"/></prl>
  <all in="Ez" out="*E"/>
  <all><rule in="*p*/ppp/*p*" out="***/*P*/***"/><rule in="ppp/*p*" out="*P*/***"/><rule in="pp/p*" out="P*/**"/></all>
  <all in="Op" out="*O" steps="5"/>
  <all in="tz" out="*t"/>
  <!-- 2. progetto: la scala parte dalla campata davanti e attraversa il muro verso una vicina -->
  <all in="Ot" out="*v"/>
  <all in="vt" out="*v" steps="6"/>
  <one in="*zzzzzzzzzzz/Pppppppppppp/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt/*ttttttttttt" out="************/*yyyyyyyyyyy/*ggggggggggg/************/************/************/************/************/************/************/************/************/************/************/************/************/************/************/************" steps="1"/>
  <all in="[ys]/g/t" out="*/s/g" steps="16"/>
  <all in="s/g" out="c/d"/>
  <all in="z/y" out="t/*"/>
  <all in="tz" out="*t"/>
  <one in="*tttttttttttt/Ppppppppppppp/*tttttttttttt" out="*************/******H******/*************" steps="1"/>
  <!-- attorno alla scala niente porte; altre campate crescono attraverso un muro -->
  <all in="[gsdc]t" out="*v"/>
  <all in="vt" out="*v" steps="9"/>
  <one in="*zzzzzzzzzzzz/Ppppppppppppp/*333333333333" out="******b******/******H******/*************" steps="1"/>
  <all in="bz" out="*b"/>
  <one in="*zzzzzzzzzzzz/Ppppppppppppp/*333333333333" out="******b******/******H******/*************" steps="1"/>
  <all in="bz" out="*b"/>
  <one in="*zzzzzzzzzzzz/Ppppppppppppp/*333333333333" out="******b******/******H******/*************" steps="1"/>
  <all in="bz" out="*b"/>
  <all in="Hp" out="*H" steps="5"/>
  <prl><rule in="tHb" out="*Ht" p="0.07"/></prl>
  <all in="tb" out="*t"/>
  <!-- un muro aperto con la panca -->
  <one in="bHb" out="*n*" steps="1"/>
  <all><rule in="nH" out="*n"/><rule in="np" out="*n"/></all>
  <one in="nnnnnnnnn" out="*eeeeeee*" steps="1"/>
  <prl in="v" out="t"/>
  <!-- 3. i muri dalle lettere vicine -->
  <all><rule in="[zE]p[zE]" out="*q*"/><rule in="[zE]p1" out="*w*"/><rule in="[zE]p2" out="*X*"/><rule in="1p1" out="*i*"/><rule in="2p2" out="*I*"/><rule in="1p2" out="*J*"/><rule in="1H1" out="*h*"/><rule in="1H2" out="*j*"/><rule in="EO2" out="*M*"/></all>
  <prl in="n" out="h"/>
  <all in="P[XIJjHMy]" out="I*"/>
  <all in="P[wihO]" out="i*"/>
  <prl in="P" out="E"/>
  <one steps="6"><rule in="EEEEEEE/EEEEEEE/wwwwwww" out="*iiiii*/*iiiii*/*******"/><rule in="EEEEEEE/EEEEEEE/XXXXXXX" out="*IIIII*/*IIIII*/*******"/></one>
  <one steps="6"><rule in="qqqqqqqqq" out="GGGGGGGGG"/><rule in="zzzzzzzzz" out="GGGGGGGGG"/></one>
  <prl in="q" out="E"/>
  <all in="M/E" out="*/A" symmetry="()"/>
  <all in="A/E" out="*/A" symmetry="()"/>
  <!-- 4. le colonne: ogni lettera sale di tanti strati, e lascia una lettera -->
  <all steps="1" symmetry="()"><rule in="B b" out="b S"/><rule in="B t" out="t S"/><rule in="B s" out="s S"/><rule in="B d" out="d S"/><rule in="B c" out="c S"/><rule in="B e" out="e S"/><rule in="B f" out="f S"/><rule in="B w" out="w S"/><rule in="B X" out="X S"/><rule in="B i" out="i S"/><rule in="B I" out="I S"/><rule in="B J" out="J S"/><rule in="B h" out="h S"/><rule in="B H" out="H S"/><rule in="B j" out="j S"/><rule in="B M" out="M S"/><rule in="B y" out="y S"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="y K"/><rule in="B b" out="b F"/><rule in="B t" out="t F"/><rule in="B s" out="s F"/><rule in="B d" out="s T"/><rule in="B c" out="s Y"/><rule in="B e" out="b G"/><rule in="B f" out="t G"/><rule in="B h" out="h F"/><rule in="B H" out="H F"/><rule in="B j" out="j F"/><rule in="B M" out="M F"/><rule in="B w" out="w C"/><rule in="B X" out="X C"/><rule in="B i" out="i C"/><rule in="B I" out="I C"/><rule in="B J" out="J C"/></all>
  <all steps="30" symmetry="()"><rule in="B y" out="y K"/><rule in="B b" out="b B"/><rule in="B t" out="t B"/><rule in="B s" out="s B"/><rule in="B h" out="h B"/><rule in="B H" out="H B"/><rule in="B j" out="j B"/><rule in="B M" out="M k"/><rule in="B i" out="i C"/><rule in="B I" out="I C"/><rule in="B J" out="J C"/></all>
  <all steps="8" symmetry="()"><rule in="B w" out="w C"/><rule in="B X" out="X C"/></all>
  <all steps="14" symmetry="()"><rule in="B w" out="w U"/><rule in="B X" out="X U"/></all>
  <all steps="8" symmetry="()"><rule in="B w" out="w C"/><rule in="B X" out="X C"/></all>
  <all steps="2" symmetry="()"><rule in="B s" out="s B"/><rule in="B w" out="w S"/><rule in="B X" out="X S"/><rule in="B J" out="J S"/><rule in="B I" out="I S"/><rule in="B j" out="j S"/><rule in="B M" out="M S"/><rule in="B i" out="i S"/><rule in="B h" out="h S"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="y K"/><rule in="B b" out="R S"/><rule in="B t" out="t S"/><rule in="B H" out="H S"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="y B"/><rule in="B t" out="t F"/><rule in="B H" out="H F"/></all>
  <all steps="4" symmetry="()"><rule in="B w" out="w W"/></all>
  <all steps="30" symmetry="()"><rule in="B y" out="y B"/><rule in="B t" out="t B"/><rule in="B s" out="s B"/><rule in="B H" out="H B"/><rule in="B I" out="I W"/><rule in="B M" out="M W"/></all>
  <all steps="8" symmetry="()"><rule in="B X" out="X W"/><rule in="B J" out="J W"/><rule in="B j" out="j W"/></all>
  <all steps="14" symmetry="()"><rule in="B X" out="X u"/><rule in="B J" out="J u"/><rule in="B j" out="j u"/></all>
  <all steps="8" symmetry="()"><rule in="B X" out="X W"/><rule in="B J" out="J W"/><rule in="B j" out="j W"/></all>
  <all steps="1" symmetry="()"><rule in="B y" out="R S"/><rule in="B t" out="R S"/><rule in="B s" out="R S"/><rule in="B H" out="R S"/><rule in="B I" out="R S"/></all>
  <all steps="4" symmetry="()"><rule in="B X" out="X S"/><rule in="B J" out="J S"/><rule in="B j" out="j S"/><rule in="B M" out="M S"/></all>
  <!-- 5. la scala -->
  <all in="*BB *B* TY*" out="*TY *K* KK*" steps="16"/>
  <all in="K B" out="* K" symmetry="()"/>
  <!-- panche -->
  <all steps="8" symmetry="()" in="B G" out="G L"/>
  <!-- 6. finestre, tetto -->
  <all in="UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU UUUUUUUUUUU" out="*********** *DDDDDDDDD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DDDDDDDDD* ***********"/>
  <all in="uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu uuuuuuuuuuu" out="*********** *DDDDDDDDD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DVVVVVVVD* *DDDDDDDDD* ***********"/>
  <one in="B B R" out="* D *" steps="2" symmetry="()"/>
  <all in="DB *R" out="*D **" symmetry="(x)" steps="8"/>
  <all in="D/B */R" out="*/D */*" symmetry="(y)" steps="8"/>
  <all in="B D" out="D *" steps="7" symmetry="()"/>
  <!-- 7. pulizia -->
  <prl><rule in="U" out="C"/><rule in="u" out="W"/><rule in="Y" out="T"/><rule in="G" out="L"/><rule in="E" out="B"/><rule in="z" out="B"/><rule in="w" out="C"/><rule in="X" out="C"/><rule in="J" out="C"/><rule in="j" out="C"/><rule in="M" out="C"/><rule in="i" out="R"/><rule in="h" out="R"/></prl>
</sequence>
<action name="apri" label="Apri la porta"><prl in="k" out="B"/></action>
```
Perché regge, ed è ciò che non si rompe:
- **Sezione 1**: un marcatore cammina solo in avanti se la regola guarda la sua scia (`[Nx]az → *xa`); se può attraversare una linea (`[zp]`), la sua scia ha una lettera diversa (`l`), altrimenti torna indietro. Il reticolo è sempre 3×3 campate da 30: `E` fuori, `z` le campate, `p` le linee, `P` gli incroci, `O` la porta.
- **Sezione 2**: un riempimento (`tz → *t`) si ferma alle linee. Si cresce passando un muro nel punto in cui si mette la porta: così tutto resta collegato, senza cammini da calcolare. Le porte stanno a 1-11 da un pilastro: il resto del muro resta libero. La scala si sceglie **prima** delle altre porte, nella campata davanti: una striscia di 11×17 attaccata a un pilastro, lontana dalla porta (`v`), che attraversa il muro verso una vicina (`y`); 16 passi di scala salgono 32, cioè dal pavimento (z=1) al pavimento di sopra (z=33), in linea oltre `y`. Attorno a lei `v` tiene lontane le altre porte. Le colonne `s`, `c`, `d` non hanno il solaio: è il foro. Una lettera per ogni cosa che sale in modo diverso.
- **Sezione 3**: i muri dicono cosa sono dalle lettere ai loro lati: `w` esterno basso, `X` esterno alto, `i`, `I` interni, `J` interno sotto ed esterno sopra, `h`, `H`, `j` porte interne. `2` è tutto ciò che è alto, `1` ciò che è basso.
- **Sezione 4**: `in="B t" out="t F"` fa salire la testa `t` di uno strato e lascia `F`; `steps` è quanto sale: **le quote sono numeri di passi**, una riga per tratto. Ciò che finisce scrive `R S` e la testa sparisce. Una lettera nuova sulla pianta (`i`, `I` sono già contrafforti: sono due muri davanti a un muro) sale con una riga sua.
- **Il tempo**: una lettera rara nella prima cella (in basso a sinistra) costa poco; un pattern che comincia con `*` o con l'aria su tutta la griglia costa molto.

## Cosa cambiare, secondo l'edificio
L'edificio chiesto deve riconoscersi al primo sguardo: non consegnare lo scheletro ricolorato.
- **Colori e materiali** (`<color>`), e dove vanno: una fascia alta nelle righe di `w`, `X`, uno zoccolo di un'altra lettera, un pavimento per piano.
- **Proporzioni**: il reticolo può essere più largo con passo diverso solo se rifai i conti (passo, `steps` di camminatori e scala); i piani no: 32 strati per piano reggono ogni taglia. Un terzo piano è un'altra lettera alta, con un'altra scala.
- **Masse**: quante campate crescono (5 su 9: di più tolgono varietà al contorno, misurata per seme, di meno non riempiono la scatola grande), quante sono alte (`p`), un'ala bassa, un cortile (campata non costruita, chiusa da mura `q`), torri (una lettera sui pilastri che sale più delle altre), un recinto. Un cortile vale per le rocche: il contorno lo fanno le campate scelte.
- **Il tetto**: la metà di ciò che si vede. A falde o a gradoni, sullo strato `R`: `<all in="***/*B*/*** *R*/RRR/*R*" out="***/*R*/*** ***/***/***" steps="10" symmetry="()"/>` sale di uno strato sopra le celle che hanno `R` attorno, fino al colmo; con una lettera per falda o un'altra lettera in cima si legge il colmo; per le gronde `RB → *R` nello strato prima. Merli: `WWWWWWWW → MMMMmmmm` sulla cima di un muro. Lanterne, comignoli, ciminiere, antenne: `<one in="B B R" out="* D *" steps="2" symmetry="()"/>` e `<all in="B D" out="D *" steps="N" symmetry="()"/>` (una ciminiera è alta e snella).
- **Le facciate**: regole sui muri, dopo le colonne: fasce (`U`, `u`), tubi, travi a vista, ingranaggi, contrafforti, insegna sopra la porta. Le regole in piano valgono sulle quattro facce, così ogni lato ha le sue cose a seconda del seme.
- **Dentro**: ogni stanza chiesta si riconosce. Nelle campate che devono restare sgombre: tappeti e pavimenti di un'altra lettera (alti 1), cose appese ai muri sopra le teste, luci. Nelle sale di due campate: arredi con una regola sulla pianta contro un muro (lettera sua, sale di 8-20 strati): banco, botti, letto, altare. Mai in mezzo.
- **Se il suolo non è a z=0** (cantina, `base` voxel sotto il suolo): lo strato z=0 è sottoterra. Chi non è cantina non scrive nulla di visibile sotto il suolo dove il corpo cammina: sale lasciando `B` fino al suolo, i soli muri possono avere la fondazione piena. Nelle colonne con qualcosa di visibile sotto il suolo il corpo non sta oltre un gradino sopra ciò che ha sotto i piedi: la scala della cantina ha pedate da 6 voxel e alzate da 3 (`in="*BBBBBBB *BBBBBB* *BBBBBB* mn******" out="*KKKKKmn *KKKKKK* *KKKKKK* KK******"`, `steps` le pedate), parte da una campata-cantina con il pavimento pieno fin sotto e sbocca in linea. Almeno due campate unite: 2×2 caselle sgombre.

## Come farlo
Decidi prima, in poche righe, cosa aggiungi allo scheletro e quale lettera per cosa. Poi scrivi il programma intero, in ordine: reticolo, progetto, muri, colonne, scala, facciate, tetto, pulizia. Controlla solo: ogni lettera è nei `values`, ogni pattern ha `in` e `out` della stessa forma, ogni marcatore sparisce.
