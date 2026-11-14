# model.sculpt · gemini-3.8-flash · 23 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

The program you wrote:
<!--
  Fattoria (Country Farmhouse):
  - Casa colonica a due piani con tetto a due falde (capanna).
  - Portico / fienile annesso aperto su colonne/pali in legno con tetto spiovente.
  - Aia lastricata sul fronte, strada dritta verso il bordo.
  - Orto e staccionata attorno. A dimensione Huge pozzo e capanno attrezzi / recinto ampliato.
  - Porta d'ingresso sul fronte (part-door), scala interna a rampa (part-stair).
  - Finestre a piano terra e primo piano.
-->
<sequence values="BHEhwsnbprfgqWUFfLRDkdTOtoNMuycx" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsnbprfgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Linea dorsale della casa attorno ad H (z=0) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <!-- Estensione laterale della casa -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.4" steps="1" symmetry="(x)"/>

      <!-- Zona scala interna: orientata lungo x, 4 celle lungo x (20 voxels) e 2 lungo y (10 voxels) -->
      <one in="E/h/h/h" out="*/*/*/*" steps="1">
        <rule in="hhhhhh/hhhhhh" out="ssss**/ssss**"/>
      </one>

      <!-- Muri della casa attorno a h e s -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Portico / fienile annesso su un lato a caso -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/b*/**/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="2"/>
      <all in="E/b" out="b/*" symmetry="()" steps="1"/>
      <all in="b/E" out="*/b" symmetry="()" steps="1"/>
      <!-- Pali del portico sul perimetro esterno -->
      <all in="bE" out="*p"/>
      <all in="pE/*p" out="*p/**"/>

      <!-- Aia / cortile sul davanti (verso sud) -->
      <all in="[hw]/E" out="*/n" symmetry="()" steps="2"/>
      <all in="nE" out="*n" symmetry="(x)" steps="3"/>
      <all in="n/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE/*n" out="*n/**"/>

      <!-- Strada dall'aia verso il bordo frontale, centrata, larga 3 celle -->
      <one in="n/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orto / campi a lato o dietro dove c'è terra libera E -->
      <all in="[wn]EE" out="**g" steps="1"/>
      <all in="gE" out="*g" steps="3"/>
      <all in="E/g" out="g/*" symmetry="()" steps="2"/>
      <all in="g/E" out="*/g" symmetry="()" steps="2"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Staccionata attorno all'orto dove confina con E -->
      <all in="gE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Pozzo nell'aia dove c'è spazio ampio (tipicamente Huge) -->
      <one in="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Trasformazione di H in pavimento -->
      <prl in="H" out="h"/>
    </sequence>

    <!-- Ritorno alla scala 1:1 dei blocchi 5x5 -->
    <map scale="5 5 1" values="BEhwsnbprfgqWUFfLRDkdTOtoNMuycx" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="p" out="ppppp/pcccp/pcccp/pcccp/ppppp"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="f" out="EEEEE/EEfEE/EEfEE/EEfEE/EEEEE"/>
      <rule in="q" out="nnnnn/nqqqn/nqBqn/nqqqn/nnnnn"/>

      <sequence symmetry="(xy)">
        <!-- LIVELLO B: ELEVAZIONE DELLE COLONNE -->
        <!-- Muri casa: piano terra (h=32) e primo piano (h=32), totale 64 -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Pavimento piano terra per casa e scala a z=0 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>

        <!-- Striscia T per part-stair al livello z=1 sopra il pavimento della zona scala -->
        <all in="B s" out="s T" steps="1"/>

        <!-- Aria piano terra (30 per s, 31 per h) -->
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>

        <!-- Solaio primo piano a z=32 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>

        <!-- Aria primo piano (31 voxels) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Tetto/soffitto sopra il primo piano (z=64) -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Portico: pilastri c che salgono fino a 32, pavimento b a terra -->
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B p" out="p f" steps="1"/>
        <all in="B p" out="p B" steps="31"/>
        <all in="B c" out="c p" steps="32"/>
        <!-- Copertura del portico a z=33 -->
        <prl>
          <rule in="b" out="y"/>
          <rule in="p" out="y"/>
          <rule in="c" out="y"/>
        </prl>
        <all in="B y" out="y R" steps="1"/>
        <prl in="y" out="B"/>

        <!-- Staccionata: pali bassi (altezza 6) -->
        <all in="B f" out="f p" steps="6"/>
        <prl in="f" out="B"/>

        <!-- Pozzo: parapetto in pietra (altezza 8) -->
        <all in="B q" out="q W" steps="8"/>
        <prl in="q" out="B"/>

        <!-- LIVELLO C: DETTAGLI, SCALE, PORTE, FINESTRE, TETTO -->

        <!-- Unioni per le parti importate -->
        <union symbol="+" values="WU"/>
        <union symbol="=" values="fF"/>

        <!-- Scala interna -->
        <import file="part-stair"/>

        <!-- Porta principale sul fronte tra aia n e casa f attraverso il muro W -->
        <!-- Trova un tratto di muro W a contatto con il lastricato n dell'aia -->
        <one in="nWWWWWWf" out="*OOOOO**" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>

        <!-- Finestre aperte nella fascia U (aperture di 3x8 voxel) -->
        <all in="WUUUW" out="WLLLW" steps="12"/>
        <all in="B L" out="L B"/>
        <all in="L B" out="B *"/>
        <!-- Riconversione della restante fascia U in muro W -->
        <prl in="U" out="W"/>

        <!-- Tetto a capanna per la casa colonica (strati inclinati lungo y) -->
        <!-- Grondaia / sporgenza del tetto -->
        <all in="RB" out="*R" steps="2"/>
        <!-- Falde che convergono salendo -->
        <all in="***** ***** **B** ***** *****  ***** ***** RRRRR ***** *****" out="***** ***** RRRRR ***** *****  ***** ***** ***** ***** *****" steps="14" symmetry="()"/>

        <!-- Tetto a spiovente sopra il portico -->
        <all in="RRB" out="**R" steps="1"/>

        <!-- Camino in mattoni rossi sul colmo del tetto -->
        <one in="B B R" out="* D *" steps="1" symmetry="()"/>
        <all in="B D" out="D *" steps="14"/>
        <all in="D D" out="* D" steps="2"/>

        <!-- Pulizia finale dei marcatori -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>

  <!-- AZIONI -->
  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>

  <!-- COLORI DELLA PALETTE -->
  <color symbol="E" value="#5b8c3b" name="prato" hidden="True"/>
  <color symbol="H" value="#d4b483" name="centro" hidden="True"/>
  <color symbol="h" value="#c29b68" name="pavimento_casa" area="house" hidden="True"/>
  <color symbol="w" value="#a39682" name="muro_casa" area="house" hidden="True"/>
  <color symbol="s" value="#9e7b4f" name="scala_casa" area="house" hidden="True"/>
  <color symbol="b" value="#8c6a43" name="pavimento_portico" area="porch" hidden="True"/>
  <color symbol="n" value="#b0a990" name="aia_lastricata" area="yard"/>
  <color symbol="r" value="#c7b389" name="strada" area="yard"/>
  <color symbol="g" value="#4e6e2a" name="orto_coltivato" area="garden"/>
  <color symbol="W" value="#dfd5c6" name="muro_intonacato"/>
  <color symbol="f" value="#9e7343" name="tavolato_legno"/>
  <color symbol="F" value="#825a31" name="solaio_travi"/>
  <color symbol="R" value="#993d29" name="tegole_tetto"/>
  <color symbol="p" value="#593d25" name="legno_scuro"/>
  <color symbol="D" value="#b8432a" name="mattoni_camino"/>
  <color symbol="k" value="#7d532c" name="gradini_scala"/>
  <color symbol="O" value="#452f1e" name="porta_legno"/>
  <color symbol="o" value="#362417" name="assi_porta"/>
  <color symbol="N" value="#8a735b" name="cornice_porta"/>
  <color symbol="#20" value="#452f1e" name="porta_aperta" hidden="True"/>
  <color symbol="#21" value="#362417" name="assi_aperte" hidden="True"/>
  <color symbol="M" value="#a39682" name="merli"/>
  <color symbol="U" value="#1c242b" name="feritoia"/>
</sequence>
It does not pass: taglia Grande, seme 1: stanza: la più grande in cui si sta in piedi ha il lato di 26 voxel (1,30 caselle), una stanza ne vuole almeno 28 (1,40) a ogni taglia: se l'area è piccola fai meno parti, non più piccole — the largest square of covered floor where a body stands (the body counted), under a ceiling at least a storey up
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, n aia_lastricata, p legno_scuro, r strada, g orto_coltivato, W muro_intonacato, F solaio_travi, R tegole_tetto, D mattoni_camino, k gradini_scala
Plan (the letter on top of every column):
```
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
gggggggggggggggggggggggggggggggggggggggggggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRngggggggg
gggggnnnnnnnRRRRRRRRRRRRRRRRRRRRRRRRRRRRnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEE
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEE
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEEE
ggggggggEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
ggggggggEEEEEEEEEEEEEEEEErrrrrrrrEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
000000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxx0000000000
00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyy
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxs00000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxs00000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxs00000000
000000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000020
00000000000000000000000000000000000000000000000020
00000000000000000000000000000000000000000000000000
00000000200000000000000000000000000000000000000000
00000000200000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
........................................RRRRRRRRRR
...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
........................................RRRRRRRRRR
..................................................
...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
........................................RRRRRRRRRR
...........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......D..
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.......D..
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
........p...WWWWWWWWWWWWWWWWWWWWWWWWWWWWpppppppppp
........p...WWWWWWWWWWWWWWWWWWWWWWWWWWWWpppppppppp
ggggggggEEEEEEEEEEEEEEEEErrrrrrrWEEEEEEEEEEEEEEEEE
```
Right side (looking from the right):
```
................RRRRRRRRRRRRRRR...................
..............RRRRRRRRRRRRRRRRRRRRRRRRR...........
................RRRRRRRRRRRRRRR...................
..................................................
..............RRRRRRRRRRRRRRRRRRRRRRRRR...........
................RRRRRRRRRRRRRRR...................
..............RRRRRRRRRRRRRRRRRRRRRRRRR...........
...............WRRRRRRRRRRRRRRRWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WRRRRRRRRRRRRRRRWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WRRRRRRRRRRRRRRRWWWWWWW............
...............WWWWWWWWWDWWWWWWWWWWWWW............
...............WWWWWWWWWDWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WRRRRRRRRRRRRRRRWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWWWWWWWWWWWWWWWWWWWWW............
...............WWWppppppppppppWWWWWWWW.......pp.pp
...............WWWppppppppppppWWWWWWWW.......pp.pp
gggggggggggggggggpppppppppppppgggggggggggggggEEEEE
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW..........kkkkkk....WWWWW..........
............WWW..........kkkkkk....WWWWW..........
............WWWWWW.......kkkkkk......WWW..........
............WWWWWW.......kkkkkk......WWW..........
............WWWWWW.......kkkkk.......WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWW....................WWWWW..........
............WWW....................WWWWW..........
............WWWWW..................WWWWW..........
............WWWWWW.................WWWWW..........
............WWWWWW.................WWWWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW....................WWWWW..........
............WWW....................WWWWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWW....................WWWWW..........
............WWW....................WWWWW..........
............WWWWW..................WWWWW..........
............WWWWWW.................WWWWW..........
............WWWWWW.................WWWWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWW...................WWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
### Seed 2: plan and heights side by side
```
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggggg   000000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxx0000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxv00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxv00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxv00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRngggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxs00000000
gggggnnnnnnnRRRRRRRRRRRRRRRRRRRRRRRRRRRRnnnnnnnngg   000000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEE   00000000000000000000000000000000000000000000000020
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEE   00000000000000000000000000000000000000000000000020
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEEE   00000000000000000000000000000000000000000000000000
ggggggggEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000200000000000000000000000000000000000000000
ggggggggEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000200000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000020
ggggggggggggggggggggggggggggggggggggggggggggggggEE   00000000000000000000000000000000000000000000000000
gggggggggggggggggggggggggggggggggggggggggggggggRRE   000000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyp
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyj
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxs00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxs00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRngggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx00000000
gggggnnnnnnnRRRRRRRRRRRRRRRRRRRRRRRRRRRRnnnnnnnngg   000000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnngg   00000000000000000000000000000000000000000000000000
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEE   00000000000000000000000000000000000000000000000020
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEE   00000000000000000000000000000000000000000000000020
gggggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnEEE   00000000000000000000000000000000000000000000000000
ggggggggEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000200000000000000000000000000000000000000000
ggggggggEErrrrrrrrEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000200000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.05 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 117 nodi, 432 passi, finito in 343 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=prato (marcatore), h=pavimento_casa (marcatore), w=muro_casa (marcatore), s=scala_casa (marcatore), n=aia_lastricata, b=pavimento_portico (marcatore), p=legno_scuro, r=strada, f=tavolato_legno, g=orto_coltivato, W=muro_intonacato, U=feritoia, F=solaio_travi, R=tegole_tetto, D=mattoni_camino, k=gradini_scala, T=Teal (marcatore), y=yellow, c=cyan, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 70400, R 15213, p 9492, g 4875, k 2880, n 1700, F 1215, E 369, r 75, D 4.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-34 all×20, prl×2, one×3: 395 celle x0-19 y0-19 z0, passi 2-47
   #36 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 48
    #38 all . w → w W passi=6: ×6, 13200 celle x25-79 y30-74 z0-6, passi 49-54, w→W 6600, .→w 6600
    #39 all . w → w U passi=14: ×14, 30800 celle x25-79 y30-74 z6-20, passi 55-68, w→U 15400, .→w 15400
    #40 all . w → w W passi=12: ×12, 26400 celle x25-79 y30-74 z20-32, passi 69-80, w→W 13200, .→w 13200
    #41 all . w → w W passi=6: ×6, 13200 celle x25-79 y30-74 z32-38, passi 81-86, w→W 6600, .→w 6600
    #42 all . w → w U passi=14: ×14, 30800 celle x25-79 y30-74 z38-52, passi 87-100, w→U 15400, .→w 15400
    #43 all . w → w W passi=12: ×12, 26400 celle x25-79 y30-74 z52-64, passi 101-112, w→W 13200, .→w 13200
#44-47 prl×1, all×3: 16250 celle x25-79 y30-74 z0-64, passi 113-145
    #48 all . h → h . passi=31: ×31, 72850 celle x30-74 y35-69 z1-32, passi 146-176, h→. 36425, .→h 36425
    #49 all . h → h F (+1) passi=1: ×1, 2750 celle x30-74 y35-69 z32-33, passi 177, h→F 1175, .→h 1175, s→F 200, .→s 200
      r1 . h → h F ×1175; r2 . s → s F ×200
    #50 all . h → h . (+1) passi=31: ×31, 85250 celle x30-74 y35-69 z33-64, passi 178-208, h→. 36425, .→h 36425, s→. 6200, .→s 6200
      r1 . h → h . ×36425; r2 . s → s . ×6200
#51-53 prl×1, all×2: 15775 celle x30-94 y35-69 z0-64, passi 209-241
#54-59 all×4, prl×2: 25936 celle x80-99 y35-59 z0-33, passi 242-308
    #60 all . f → f p passi=6: ×6, 18984 celle x17-99 y35-98 z0-6, passi 309-314, f→p 9492, .→f 9492
#61-93 prl×5, all×9: 15272 celle x17-99 y35-98 z0-32, passi 315-413
    #110 prl U → W: ×1, 30800 celle x25-79 y30-74 z6-51, passi 414, U→W 30800
#111-115 all×4, one×1: 12242 celle x22-99 y27-77 z32-77, passi 415-432
Senza effetto (non hanno mai cambiato una cella):
#7 prl h/E → */h passi=1
#22 all nE/*n → *n/**: le celle cercate c'erano, ma mai disposte come nel pattern
#24 all r/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#32 all fE/*f → *f/**: le celle cercate c'erano, ma mai disposte come nel pattern
#33 one nnnnn/nnnnn/nnnnn/nnnnn/nnnnn → *****/*****/**q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#62 all . q → q W passi=8: in quel momento nella griglia non c'erano celle "q"
#63 prl q → .: in quel momento nella griglia non c'erano celle "q"
#65 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#66 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#67 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#68 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#69 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 28
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (Country Farmhouse):
  - Casa colonica a due piani con tetto a due falde.
  - La casa interna è spaziosa (almeno 7x7 celle di piano libero, cioè 35x35 voxel > 28).
  - La scala interna (part-stair) occupa 4x2 celle lungo una parete lasciando oltre 28 voxel liberi nella stanza.
  - Portico / fienile annesso aperto su pilastri di legno con tetto spiovente.
  - Aia lastricata sul davanti con strada fino al bordo.
  - Porta d'ingresso su aia (part-door) e finestre su tre lati.
-->
<sequence values="BHEhwsnbprfgqWUFfLRDkdTOtoNMuycx" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsnbprfgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno a H: 9x8 celle interne -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      
      <!-- Zona della scala (4 celle in x, 2 in y) posizionata lungo la parete nord/posteriore -->
      <!-- Lascia almeno 6-7 celle libere verso sud per garantire una stanza > 28 voxel -->
      <one in="hhhhhh/hhhhhh" out="ssss**/ssss**" symmetry="()" steps="1"/>

      <!-- Muri perimetrali della casa attorno a h e s -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Portico laterale annesso: 3 celle di profondità fuori da un lato -->
      <one in="wE/wE/wE/wE" out="*b/*b/*b/*b" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="2"/>
      <all in="bE" out="*p"/>
      <all in="pE/*p" out="*p/**"/>

      <!-- Aia lastricata frontale verso y positivo (sud) -->
      <all in="[hw]/E" out="*/n" symmetry="()" steps="1"/>
      <all in="n/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE" out="*n" symmetry="(x)" steps="4"/>

      <!-- Strada verso il bordo frontale -->
      <one in="n/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orto / campi attorno -->
      <all in="[wn]E" out="*g" steps="1"/>
      <all in="gE" out="*g" steps="2"/>
      <all in="E/g" out="g/*" symmetry="()" steps="2"/>

      <!-- Staccionata dell'orto -->
      <all in="gE" out="*f"/>

      <prl in="H" out="h"/>
    </sequence>

    <!-- Espansione in blocchi 5x5 a scala 1:1 -->
    <map scale="5 5 1" values="BEhwsnbprfgqWUFfLRDkdTOtoNMuycx" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="p" out="ppppp/pcccp/pcccp/pcccp/ppppp"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="f" out="EEEEE/EEfEE/EEfEE/EEfEE/EEEEE"/>

      <sequence symmetry="(xy)">
        <!-- LIVELLO B: ELEVAZIONE COLONNE -->
        <!-- Muri casa alti 64 voxel (due piani da 32) con fascia finestre U -->
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <all in="B w" out="w U" steps="14"/>
        <all in="B w" out="w W" steps="12"/>
        <prl in="w" out="R"/>

        <!-- Pavimento piano terra z=0 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>

        <!-- Striscia T per la scala a z=1 -->
        <all in="B s" out="s T" steps="1"/>

        <!-- Spazio interno piano terra (30 voxel su s, 31 su h) -->
        <all in="B s" out="s B" steps="30"/>
        <all in="B h" out="h B" steps="31"/>

        <!-- Solaio primo piano a z=32 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>

        <!-- Spazio interno primo piano (31 voxel) -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>

        <!-- Tetto/soffitto del primo piano a z=64 -->
        <prl>
          <rule in="h" out="R"/>
          <rule in="s" out="R"/>
        </prl>

        <!-- Portico: pilastri c alti 32 voxel, pavimento b -->
        <all in="B b" out="b f" steps="1"/>
        <all in="B b" out="b B" steps="31"/>
        <all in="B p" out="p f" steps="1"/>
        <all in="B p" out="p B" steps="31"/>
        <all in="B c" out="c p" steps="32"/>
        <prl>
          <rule in="b" out="y"/>
          <rule in="p" out="y"/>
          <rule in="c" out="y"/>
        </prl>
        <all in="B y" out="y R" steps="1"/>
        <prl in="y" out="B"/>

        <!-- Staccionata bassa (altezza 6) -->
        <all in="B f" out="f p" steps="6"/>
        <prl in="f" out="B"/>

        <!-- LIVELLO C: SCALE, PORTE, FINESTRE, TETTO -->
        <union symbol="+" values="WU"/>
        <union symbol="=" values="fF"/>

        <!-- Scala interna -->
        <import file="part-stair"/>

        <!-- Porta principale sul fronte a contatto con aia n -->
        <one in="nWWWWWWf" out="*OOOOO**" symmetry="(x)" steps="1"/>
        <all in="O/W" out="*/O" symmetry="()" steps="5"/>
        <all in="W/O" out="O/*" symmetry="()" steps="5"/>
        <import file="part-door"/>

        <!-- Finestre aperte nella fascia U -->
        <all in="WUUUW" out="WLLLW" steps="10"/>
        <all in="B L" out="L B"/>
        <all in="L B" out="B *"/>
        <prl in="U" out="W"/>

        <!-- Tetto a capanna con falde che salgono -->
        <all in="RB" out="*R" steps="2"/>
        <all in="***** ***** **B** ***** *****  ***** ***** RRRRR ***** *****" out="***** ***** RRRRR ***** *****  ***** ***** ***** ***** *****" steps="12" symmetry="()"/>

        <!-- Camino -->
        <one in="B B R" out="* D *" steps="1" symmetry="()"/>
        <all in="B D" out="D *" steps="12"/>

        <!-- Pulizia marcatori -->
        <prl in="T" out="B"/>
      </sequence>
    </map>
  </map>

  <!-- AZIONI -->
  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>

  <!-- PALETTE COLORI -->
  <color symbol="E" value="#5b8c3b" name="prato" hidden="True"/>
  <color symbol="H" value="#d4b483" name="centro" hidden="True"/>
  <color symbol="h" value="#c29b68" name="pavimento_casa" area="house" hidden="True"/>
  <color symbol="w" value="#a39682" name="muro_casa" area="house" hidden="True"/>
  <color symbol="s" value="#9e7b4f" name="scala_casa" area="house" hidden="True"/>
  <color symbol="b" value="#8c6a43" name="pavimento_portico" area="porch" hidden="True"/>
  <color symbol="n" value="#b0a990" name="aia_lastricata" area="yard"/>
  <color symbol="r" value="#c7b389" name="strada" area="yard"/>
  <color symbol="g" value="#4e6e2a" name="orto_coltivato" area="garden"/>
  <color symbol="W" value="#dfd5c6" name="muro_intonacato"/>
  <color symbol="f" value="#9e7343" name="tavolato_legno"/>
  <color symbol="F" value="#825a31" name="solaio_travi"/>
  <color symbol="R" value="#993d29" name="tegole_tetto"/>
  <color symbol="p" value="#593d25" name="legno_scuro"/>
  <color symbol="D" value="#b8432a" name="mattoni_camino"/>
  <color symbol="k" value="#7d532c" name="gradini_scala"/>
  <color symbol="O" value="#452f1e" name="porta_legno"/>
  <color symbol="o" value="#362417" name="assi_porta"/>
  <color symbol="N" value="#8a735b" name="cornice_porta"/>
  <color symbol="#20" value="#452f1e" name="porta_aperta" hidden="True"/>
  <color symbol="#21" value="#362417" name="assi_aperte" hidden="True"/>
  <color symbol="M" value="#a39682" name="merli"/>
  <color symbol="U" value="#1c242b" name="feritoia"/>
</sequence>
```
