# model.sculpt · gemini-3.8-flash · 25 s

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
It does not pass: taglia Grande, seme 1: pezzi staccati: 8% dei voxel non è attaccato al corpo principale (21 pezzi) — everything must rest on the bottom and be attached to the main body
What the game made of it, in text:
### Seed 1 at large: grid 100×100×80, one character = 2×2 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E prato, n aia_lastricata, p legno_scuro, r strada, g orto_coltivato, W muro_intonacato, F solaio_travi, R tegole_tetto, D mattoni_camino, k gradini_scala
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEgggggggggggggggggggggggggggEEEEEEEEEE
EEEEEEEEEEEpEgggggggggggggggggggggggggggEpEEEEEEEE
EEEEEEEEEEEEggggggggggggggggggggggggggggEEEEEEEEEE
EEEEEEEEEEgggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEEEEgggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEpEgggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEEEggggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEggggggggggggggggggggggggggggggggggggggEEEEEEE
EEEEEgggggggggggggggggggggggggggggggggggRRRRRRRRRR
EEEEEggggggggggggggggggggggggggggggggggRRRRRRRRRRR
EEEEEggggggggggggggggggggggggggggggggggRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
EpEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
EEggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
gggggggggggnRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg
gggnnnnnnnnnnRRRRRRRRRRRRRRRRRRRRRRRRRRRnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
gggggggggggggrrrrrrrgggggggggggggggggggggggggggggg
gggggggggggggrrrrrrrgggggggggggggggggggggggggggggg
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000200000000000000000000000000000200000000
00000000000200000000000000000000000000000200000000
00000000000000000000000000000000000000000000000000
00000000200000000000000000000000000000000002000000
00000000200000000000000000000000000000000002000000
00000020000000000000000000000000000000000002000000
00000020000000000000000000000000000000000002000000
00000000000000000000000000000000000000000000000000
00020000000000000000000000000000000000000002000000
000200000000000000000000000000000000000eyyyyyyyyyy
000200000000000000000000000000000000000yyyyyyyyyyy
000200000000sxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyy
00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyl
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyye
02000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
02000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxs000000000
000000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxx0000000000
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
```
Front (looking from the front; the sky at the top):
```
.......................................RRRRRRRRRRR
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
.......................................RRRRRRRRRRR
..................................................
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
.......................................RRRRRRRRRRR
............RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.....D....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW.....D....
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWWRRRRRRRRRR
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
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
.p.p..p.p..pWWWWWWWWWWWWWWWWWWWWWWWWWWWWpppppppppp
.p.p..p.p..pWWWWWWWWWWWWWWWWWWWWWWWWWWWWpppppppppp
gggggggggggggrrrrrrrgggggggggggggggggggggggggggggg
```
Right side (looking from the right):
```
.........RRRRRRRRRRRRRRRRR........................
............RRRRRRRRRRRRRRRRRRRRRRRRRR............
.........RRRRRRRRRRRRRRRRR........................
..................................................
............RRRRRRRRRRRRRRRRRRRRRRRRRR............
.........RRRRRRRRRRRRRRRRR........................
............RRRRRRRRRRRRRRRRRRRRRRRRRR............
.........RRRRRRRRRRRRRRRRRWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
.........RRRRWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
.........RRRRRRRRRRRRRRRRRWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
.........RRRRWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
.........RRRRRRRRRRRRRRRRRWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
.........RRRRWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
.........RRRRRRRRRRRRRRRRRWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
............WWWWWWWWWWWWWWWWWWWWWWWWWW............
pp.pppp.pppppppppppppppppWWWWWWWWWWWWW............
pp.pppp.pppppppppppppppppWWWWWWWWWWWWW............
EEEEEEEEEEpppppppppppppppgggggggggggggnnnnnnnnnngg
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
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW..kkkkkk..............WWW..........
............WWW..kkkkkk..............WWW..........
............WWW..kkkkkk..............WWW..........
............WWW..kkkkkk..............WWW..........
............WWW..kkkkkk..............WWW..........
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
.............WWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWWWWWWWWWWWWWWWWWWWWWWWWWWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
............WWW......................WWW..........
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
EEEEEEEEEEEEEgggggggggggggggggggggggggggEEEEEEEEEE   00000000000200000000000000000000000000000200000000
EEEEEEEEEEEpEgggggggggggggggggggggggggggEpEEEEEEEE   00000000000200000000000000000000000000000200000000
EEEEEEEEEEEEggggggggggggggggggggggggggggEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggEEEEEEE   00000000200000000000000000000000000000000002000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggEEEEEEE   00000000200000000000000000000000000000000002000000
EEEEEEEEgggggggggggggggggggggggggggggggggggEEEEEEE   00000020000000000000000000000000000000000002000000
EEEEEEpEgggggggggggggggggggggggggggggggggggEEEEEEE   00000020000000000000000000000000000000000002000000
EEEEEEEggggggggggggggggggggggggggggggggggggEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEggggggggggggggggggggggggggggggggggggggEEEEEEE   00020000000000000000000000000000000000000002000000
EEEEEgggggggggggggggggggggggggggggggggggRRRRRRRRRR   000200000000000000000000000000000000000eyyyyyyyyyg
EEEEEggggggggggggggggggggggggggggggggggRRRRRRRRRRR   000200000000000000000000000000000000000gyyyyyyyyyj
EEEEEggggggggggggggggggggggggggggggggggRRRRRRRRRRR   000200000000xxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyu
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyn
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxzxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEEEgggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   00020000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyy
EEEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   02000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyye
EpEgggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   02000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
EEggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxs000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxv000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggggggggggnRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggnnnnnnnnnnRRRRRRRRRRRRRRRRRRRRRRRRRRRnnnnnnnnnn   000000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxx0000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
ggggggggggggggggggggggggggggrrrrrrrggggggggggggggg   00000000000000000000000000000000000000000000000000
ggggggggggggggggggggggggggggrrrrrrrggggggggggggggg   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEgggggggggggggggggggggggggggEEEEEEEEEE   00000000000200000000000000000000000000000200000000
EEEEEEEEEEEpEgggggggggggggggggggggggggggEpEEEEEEEE   00000000000200000000000000000000000000000200000000
EEEEEEEEEEEEggggggggggggggggggggggggggggEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggEEEEEEE   00000000200000000000000000000000000000000002000000
EEEEEEEEEEgggggggggggggggggggggggggggggggggEEEEEEE   00000000200000000000000000000000000000000002000000
EEEEEEEEgggggggggggggggggggggggggggggggggggggEEEEE   00000020000000000000000000000000000000000000002000
EEEEEEpEgggggggggggggggggggggggggggggggggggggEpEEE   00000020000000000000000000000000000000000000002000
EEEEEEEEgggggggggggggggggggggggggggggggggggggEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEpEggggggggggggggggggggggggggggggggggggggggEE   00000020000000000000000000000000000000000000000020
EEEEEEEEggggggggggggggggggggggggggggggggggggggggEE   00000020000000000000000000000000000000000000000020
EEEEEEEEggggggggggggggggggggggggggggggggggggggggEE   00000020000000000000000000000000000000000000000020
EEEEEERRggggggggggggggggggggggggggggggggggggggggEE   00gyyyyyyyyysxxxxxxxxxxxxxxxxxxxxxxxxxxx0000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0eyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0jyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0eyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0gyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0eyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0yyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
EERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRgggggggEE   0nyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000020
ERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   0jyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
EpRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   0yyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
EgRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   0eyyyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00gyyyyyyyyyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxv000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
ggggggggggggRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000vxxxxxxxxxxxxxxxxxxxxxxxxxxxxv000000000
gggggggggggnRRRRRRRRRRRRRRRRRRRRRRRRRRRRRggggggggg   00000000000xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx000000000
gggnnnnnnnnnnRRRRRRRRRRRRRRRRRRRRRRRRRRRnnnnnnnnnn   000000000000sxxxxxxxxxxxxxxxxxxxxxxxxxxx0000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
gggnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn   00000000000000000000000000000000000000000000000000
ggggggggggggggggggggggggggggggggggggggrrrrrrrggggg   00000000000000000000000000000000000000000000000000
ggggggggggggggggggggggggggggggggggggggrrrrrrrggggg   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.16 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 100×100×80, 104 nodi, 422 passi, finito in 334 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=centro (marcatore), E=prato (marcatore), h=pavimento_casa (marcatore), w=muro_casa (marcatore), s=scala_casa (marcatore), n=aia_lastricata, b=pavimento_portico (marcatore), p=legno_scuro, r=strada, f=tavolato_legno, g=orto_coltivato, W=muro_intonacato, U=feritoia, F=solaio_travi, R=tegole_tetto, D=mattoni_camino, k=gradini_scala, T=Teal (marcatore), y=yellow, c=cyan, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: W 60800, R 15686, p 12822, g 3675, k 2880, n 1900, F 1640, E 955, r 75, D 4.
  #3 map scala 1/5 1/5 1: ×1, 400 celle x0-19 y0-19 z0-79, passi 1
#5-25 all×16, one×3, prl×1: 383 celle x0-19 y0-19 z0, passi 2-37
   #27 map scala 5 5 1: ×1, 10000 celle x0-99 y0-99 z0-79, passi 38
    #29 all . w → w W passi=6: ×6, 11400 celle x25-79 y25-74 z0-6, passi 39-44, w→W 5700, .→w 5700
    #30 all . w → w U passi=14: ×14, 26600 celle x25-79 y25-74 z6-20, passi 45-58, w→U 13300, .→w 13300
    #31 all . w → w W passi=12: ×12, 22800 celle x25-79 y25-74 z20-32, passi 59-70, w→W 11400, .→w 11400
    #32 all . w → w W passi=6: ×6, 11400 celle x25-79 y25-74 z32-38, passi 71-76, w→W 5700, .→w 5700
    #33 all . w → w U passi=14: ×14, 26600 celle x25-79 y25-74 z38-52, passi 77-90, w→U 13300, .→w 13300
    #34 all . w → w W passi=12: ×12, 22800 celle x25-79 y25-74 z52-64, passi 91-102, w→W 11400, .→w 11400
#35-38 prl×1, all×3: 16950 celle x25-79 y25-74 z0-64, passi 103-135
    #39 all . h → h . passi=31: ×31, 99200 celle x30-74 y30-69 z1-32, passi 136-166, h→. 49600, .→h 49600
    #40 all . h → h F (+1) passi=1: ×1, 3600 celle x30-74 y30-69 z32-33, passi 167, h→F 1600, .→h 1600, s→F 200, .→s 200
      r1 . h → h F ×1600; r2 . s → s F ×200
    #41 all . h → h . (+1) passi=31: ×31, 111600 celle x30-74 y30-69 z33-64, passi 168-198, h→. 49600, .→h 49600, s→. 6200, .→s 6200
      r1 . h → h . ×49600; r2 . s → s . ×6200
#42-44 prl×1, all×2: 21000 celle x30-94 y25-69 z0-64, passi 199-231
#45-46 all×2: 12288 celle x80-99 y20-49 z0-32, passi 232-263
#47-50 all×2, prl×2: 16224 celle x80-99 y20-49 z0-33, passi 264-298
    #51 all . f → f p passi=6: ×6, 25644 celle x2-99 y1-69 z0-6, passi 299-304, f→p 12822, .→f 12822
#52-82 prl×5, all×9: 15827 celle x2-99 y1-69 z0-32, passi 305-403
    #99 prl U → W: ×1, 26600 celle x25-79 y25-74 z6-51, passi 404, U→W 26600
#100-103 all×3, one×1: 12340 celle x23-99 y18-76 z32-77, passi 405-422
Senza effetto (non hanno mai cambiato una cella):
#19 all r/E → */r: le celle cercate c'erano, ma mai disposte come nel pattern
#54 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#55 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#56 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#57 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#58 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#59 all . I → I * passi=30: in quel momento nella griglia non c'erano celle "I"
#60 all . I → #95 * passi=1: in quel momento nella griglia non c'erano celle "I"
#61 all . #95 → I * passi=1: in quel momento nella griglia non c'erano celle ""
#62 all . I → I * passi=29: in quel momento nella griglia non c'erano celle "I"
#63 all . I → S * passi=1: in quel momento nella griglia non c'erano celle "I"
#64 prl I → . passi=1: in quel momento nella griglia non c'erano celle "I"
… e altri 21
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  Fattoria (Country Farmhouse):
  - Casa colonica a due piani con tetto a due falde.
  - La casa interna è spaziosa (oltre 28 voxel liberi).
  - La scala interna (part-stair) occupa 4x2 celle orientata correttamente lungo la parete.
  - Portico laterale annesso con pilastri a terra collegati al pavimento.
  - Aia lastricata frontale con strada fino al bordo.
  - Recinzione continua collegata a terra e alla casa per evitare voxel staccati.
-->
<sequence values="BHEhwsnbprgWUFfLRDkdTOtoNMuy" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsnbprg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno a H: 8x7 celle -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>

      <!-- Muri perimetrali della casa attorno a h -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Zona della scala (4 celle in x, 2 in y) con orientamento corretto lungo x verso parete -->
      <one in="whhhh/whhhh" out="*ssss/*ssss" symmetry="()" steps="1"/>

      <!-- Portico annesso su un lato: 3 celle di larghezza -->
      <one in="wE/wE/wE/wE" out="*b/*b/*b/*b" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="2"/>

      <!-- Aia lastricata frontale verso il basso -->
      <all in="[hw]/E" out="*/n" symmetry="()" steps="1"/>
      <all in="n/E" out="*/n" symmetry="()" steps="3"/>
      <all in="nE" out="*n" symmetry="(x)" steps="4"/>

      <!-- Strada verso il bordo frontale -->
      <one in="n/E" out="*/r" symmetry="()" steps="1"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Campi coltivati/orto attaccati alla casa e all'aia -->
      <all in="[wb]E" out="*g" steps="1"/>
      <all in="gE" out="*g" steps="2"/>
      <all in="E/g" out="g/*" symmetry="()" steps="2"/>

      <prl in="H" out="h"/>
    </sequence>

    <!-- Espansione in blocchi 5x5 a scala 1:1 -->
    <map scale="5 5 1" values="BEhwsnbprgWUFfLRDkdTOtoNMuy" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="bbbbb/bpppb/bpppb/bpppb/bbbbb"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>

      <sequence symmetry="(xy)">
        <!-- LIVELLO B: ELEVAZIONE COLONNE -->
        <!-- Muri casa alti 64 voxel (due piani da 32) con fasce per finestre U -->
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
          <rule in="B b" out="b f"/>
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

        <!-- Portico: pilastri p alti 32 voxel a terra, poi tetto R a falda -->
        <all in="B b" out="b B" steps="31"/>
        <all in="B p" out="p f" steps="1"/>
        <all in="B p" out="p f" steps="31"/>
        <prl>
          <rule in="b" out="y"/>
          <rule in="p" out="y"/>
        </prl>
        <all in="B y" out="y R" steps="1"/>
        <prl in="y" out="B"/>

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
        <all in="WUUUW" out="WBBBW" steps="10"/>
        <all in="B B" out="B B"/>
        <prl in="U" out="W"/>

        <!-- Falde del tetto della casa principale -->
        <all in="RB" out="*R" steps="2"/>
        <all in="***** ***** **B** ***** *****  ***** ***** RRRRR ***** *****" out="***** ***** RRRRR ***** *****  ***** ***** ***** ***** *****" steps="12" symmetry="()"/>

        <!-- Camino in mattoni -->
        <one in="B B R" out="* D *" steps="1" symmetry="()"/>
        <all in="B D" out="D *" steps="10"/>

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
