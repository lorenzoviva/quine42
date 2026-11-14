# model.sculpt · gemini-3.8-flash · 31 s

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

## Your program so far
<!--
  Fattoria:
  - Casa colonica principale (corpo a due piani con tetto a capanna) attorno al centro.
    Lettere: h (pavimento casa), w (muri casa), s (zona scala interna).
  - Portico / fienile / stalla annessa su un lato (tetto spiovente più basso, pali p, pavimento b).
  - Aia / cortile lastricato sul davanti con strada r verso il bordo sud. Lettere: n (lastricato aia), r (strada).
  - Recinto/staccionata e orto/campi ai lati: f (staccionata), g (orto/terra coltivata).
  - A misura grande (Huge, 30x30 celle): orto esteso con pozzo q, recinto per animali allargato, capanno attrezzi laterale.
  - Variazione tra semi: lato del portico (destra/sinistra), profondità della casa, ampiezza aia e orto.
-->
<sequence values="BHEhwsnbprfgq" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsnbprfgq" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Linea dorsale della casa attorno ad H (z=0) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <!-- Estensione laterale della casa (larghezza circa 7-8 celle interne) -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <prl in="hE" out="*h" p="0.4" steps="1" symmetry="(x)"/>

      <!-- Zona scala interna: lungo la parete nord, 4 celle lungo x (20 voxels), 2 lungo y (10 voxels) -->
      <!-- Lasciamo 2 celle a ovest come pianerottolo -->
      <one in="E/h/h/h" out="*/*/*/*" steps="1">
        <rule in="hhhhhh/hhhhhh" out="ssss**/ssss**"/>
      </one>

      <!-- Muri della casa attorno a h e s -->
      <all in="[hs]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Portico / stalla annessa su uno dei lati scelti a caso -->
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

      <!-- Strada dall'aia verso il bordo frontale, larga 3 celle -->
      <one in="n/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Orto / campi a lato o dietro dove c'è spazio di terra -->
      <all in="[wn]EE" out="**g" steps="1"/>
      <all in="gE" out="*g" steps="3"/>
      <all in="E/g" out="g/*" symmetry="()" steps="2"/>
      <all in="g/E" out="*/g" symmetry="()" steps="2"/>
      <all in="gE/*g" out="*g/**"/>

      <!-- Staccionata attorno all'orto dove confina con la terra incolta E -->
      <all in="gE" out="*f"/>
      <all in="fE/*f" out="*f/**"/>

      <!-- Se c'è spazio abbondante (a Huge / 30x30), pozzo nell'aia o nell'orto -->
      <one in="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn" out="*****/*****/**q**/*****/*****" steps="1"/>

      <!-- Sostituzione H con pavimento -->
      <prl in="H" out="h"/>
    </sequence>
  </map>
  <color symbol="E" value="#5b8c3b" name="prato" hidden="True"/>
  <color symbol="H" value="#d4b483" name="centro" hidden="True"/>
  <color symbol="h" value="#c29b68" name="pavimento_casa" area="house"/>
  <color symbol="w" value="#a39682" name="muro_casa" area="house"/>
  <color symbol="s" value="#9e7b4f" name="scala_casa" area="house"/>
  <color symbol="b" value="#8c6a43" name="pavimento_portico" area="porch"/>
  <color symbol="p" value="#593d25" name="palo_portico" area="porch"/>
  <color symbol="n" value="#b0a990" name="aia_lastricata" area="yard"/>
  <color symbol="r" value="#c7b389" name="strada" area="yard"/>
  <color symbol="f" value="#694a29" name="staccionata" area="yard"/>
  <color symbol="g" value="#4e6e2a" name="orto_coltivato" area="garden"/>
  <color symbol="q" value="#737982" name="pozzo" area="yard"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h pavimento_casa, w muro_casa, s scala_casa, n aia_lastricata, b pavimento_portico, p palo_portico, r strada, f staccionata, g orto_coltivato
Plan (the letter of every cell):
```
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggwwwwwwwwwwwgggg
gggggwhhhsssshwwpppp
gggggwwhhsssshhwbbbp
gggggwwhhhhhhhhwbbbp
gggggwhhhhhhhhwwbbbp
gggggwwhhhhhhhwwpppp
gggggwwhhhhhhhhwgggg
gggggwwhhhhhhhhwgggg
gggggwwwwwwwwwwwgggg
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnnf
gggfEEEEEErrrEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h pavimento_casa, w muro_casa, s scala_casa, n aia_lastricata, b pavimento_portico, p palo_portico, r strada, f staccionata, g orto_coltivato
Plan (the letter of every cell):
```
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggggggggggggggggg
gggggwwwwwwwwwwwgggg
gggggwwhhhhhhhhwpppp
gggggwwhhhhhhhwwbbbp
gggggwwhhhhsshwwbbbp
gggggwwhhhhsshhwbbbp
gggggwhhhhhsshwwpppp
gggggwwhhhhsshhwgggg
gggggwwhhhhhhhwwgggg
gggggwwwwwwwwwwwgggg
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnnf
gggfrrrEEEEEEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h pavimento_casa, w muro_casa, s scala_casa, n aia_lastricata, b pavimento_portico, p palo_portico, r strada, f staccionata, g orto_coltivato
Plan (the letter of every cell):
```
gggggggggggggggggggf
gggggggggggggggggggf
gggggggggggggggggggf
gggggggggggggggggggf
gggggggggggggggggggf
gggggggggggggggggggf
gggggwwwwwwwwwwwpppp
gggggwwhhhhhhhwwbbbp
gggggwwhhhhsshwwbbbp
gggggwwhhhhsshhwbbbp
gggggwwhhhhsshhwpppp
gggggwwhhhhsshwwgggg
gggggwwhhhhhhhwwgggg
gggggwhhhhhhhhwwgggg
gggggwwwwwwwwwwwgggg
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnng
ggnnnnnnnnnnnnnnnnnf
gggfrrrEEEEEEEEEEEEE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, h pavimento_casa, w muro_casa, s scala_casa, n aia_lastricata, b pavimento_portico, p palo_portico, r strada, f staccionata, g orto_coltivato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
Efffffffffffffffffffffffffffff
Efggggggggggggggggggggggggffff
Efggggggggggggggggggggggggffff
Efggggggggggggggggggggggggffff
Efggggggggggggggggggggggggffff
Efggggggggggggggggggggggggffff
Efggggggggggggggggggggggggffff
Efggggggggggggggggggggggggffff
Efggggggggwwwwwwwwwwwgggggffff
Efggggggggwhhhsssshwwppppgffff
Efggggggggwwhhsssshhwbbbpgffff
Efggggggggwwhhhhhhhhwbbbpfffff
Efggggggggwhhhhhhhhwwbbbpggggf
Efggggggggwwhhhhhhhwwppppggggf
Efggggggggwwhhhhhhhhwggggggggf
Efggggggggwwhhhhhhhhwggggggggf
Efggggggggwwwwwwwwwwwggggggggf
Efgggggnnnnnnnnnnnnnnnnngggggf
Efgggggnnnnnnnnnnnnnnnnngggggf
Efgggggnnnnnnnnnnnnnnnnngggggf
Efgggggnnnnnnnnnnnnnnnnngggggf
Efgggggggggggggrrrgggggggggggf
Efgggggggggggggrrrgggggggggggf
Efgggggggggggggrrrgggggggggggf
Efgggggggggggggrrrgggggggggggf
Efgggggggggggggrrrgggggggggggf
Efgggggggggggggrrrgggggggggggf
```
How much the plans of the seeds differ: 0.16 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

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
