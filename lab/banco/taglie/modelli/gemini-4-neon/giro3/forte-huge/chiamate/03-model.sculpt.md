# model.sculpt · gemini-4-neon · 50 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (9.375 × 9.375 × 7.5 tiles, 16 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 9.375 × 9.375 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 31.25 × 31.25 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

The program you wrote:
<!--
  Concetto: Forte medievale
  Parti e lettere sulla pianta (cella = 5x5 voxel):
  - c, l: cortile interno (erba e chiazze di lastricato) formato dall'unione di rettangoli con bracci casuali
  - W: mura di cinta (spesse 2 celle) attorno al cortile
  - G: corpo di guardia sul lato anteriore delle mura, con passaggio largo 3 celle
  - r: strada esterna dritta dal corpo di guardia al bordo anteriore
  - t: torri (3x3) sugli angoli esterni convessi e lungo i lati lunghi delle mura
  - h, w, s, d: mastio a due piani coperti (pavimento, mura con finestre, zona scala 4x2 con pianerottolo, porta larga 3 celle) posto il più lontano possibile dalla porta
  - n: viale lastricato interno dal corpo di guardia alla porta del mastio
  - a, v: caserma con tetto spiovente addossata all'interno delle mura di cinta dove c'è spazio
  - Q: pozzo nel cortile
  - y: alberi nel terreno circostante

  Cosa cambia tra i semi:
  - forma del cortile (posizione e numero dei bracci rettangolari)
  - posizione del mastio sul fondo del cortile e lato della sua scala
  - posizione della caserma lungo le mura, delle torri intermedie, del pozzo, degli alberi e trama del lastricato

  Cosa entra in ogni taglia:
  - Huge (30x30 celle): cortile con bracci, mura di cinta con torri d'angolo, corpo di guardia, mastio a due piani con scala, viale, pozzo e strada fino al bordo
  - Gargantuan (100x100 celle): cortile ampio a più rettangoli, torri intermedie lungo le mura, caserma interna, pozzo e alberi attorno al forte
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEclWtGhwsdnravQyumK" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Margine dal bordo del lotto per mura e torri -->
      <prl in="***/*E*/***" out="***/*u*/***"/>
      <prl in="Eu" out="*E" steps="5"/>

      <!-- Cortile centrale attorno a H -->
      <all in="u/[Hc]" out="c/*" symmetry="()" steps="6"/>
      <all in="[Hc]/u" out="*/c" symmetry="()" steps="6"/>
      <all in="[Hc]u" out="*c" symmetry="(x)" steps="6"/>

      <!-- Espansione del cortile dove il terreno prosegue (Gargantuan) -->
      <all in="cuuuuuuuuuu" out="*cccccc****" steps="1"/>
      <all in="cu/*c" out="*c/**"/>
      <all in="cuuuuuuuuuuu" out="*ccccc******" steps="1"/>
      <all in="cu/*c" out="*c/**"/>

      <!-- Bracci rettangolari casuali per rompere la scatola del cortile -->
      <one in="cuuu/cuuu/cuuu/cuuu/cuuu/cuuu/cuuu" out="*ccc/*ccc/*ccc/*ccc/*ccc/*ccc/*ccc" symmetry="(xy)" steps="2"/>
      <one in="cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu" out="*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc" symmetry="(xy)" steps="2"/>

      <!-- Ripristino del terreno esterno -->
      <prl in="u" out="E"/>

      <!-- Mura di cinta spesse 2 celle attorno al cortile, angoli pieni -->
      <all in="[Hc]E" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Via d'uscita dal centro verso il fronte: corpo di guardia G e strada r larghi 3 celle (prima delle torri) -->
      <all in="H/c" out="*/m" symmetry="()" steps="1"/>
      <all in="m/c" out="*/m" symmetry="()"/>
      <all in="m/W" out="*/G" symmetry="()"/>
      <all in="G/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="c"/>
        <rule in="H" out="c"/>
      </prl>

      <!-- Torri 3x3 sugli angoli convessi e lungo i tratti lunghi delle mura -->
      <all in="EE/EW" out="**/*t"/>
      <one in="EEEEEEEEEEE/EEEEEEEEEEE/WWWWWWWWWWW" out="***********/***********/*****t*****" symmetry="(xy)" steps="4"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Mastio il più lontano possibile dalla porta -->
      <one in="c" out="K" steps="1">
        <field for="K" from="r" on="cGr"/>
      </one>
      <prl in="K" out="h"/>
      <all in="hc" out="*h" symmetry="(x)" steps="4"/>
      <all in="hc" out="*h" symmetry="(x)" steps="3"/>
      <all in="h/c" out="*/h" symmetry="()" steps="5"/>
      <all in="c/h" out="h/*" symmetry="()" steps="5"/>
      <all in="hc" out="*w" steps="1"/>
      <all in="wc/*w" out="*w/**"/>

      <!-- Zona scala del mastio (4x2) lungo una parete, con 2 celle di pianerottolo prima e 1 dopo -->
      <one in="[wW][wW][wW][wW][wW][wW][wW]/hhhhhhh/hhhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- Porta del mastio rivolta al cortile (larga 3 celle) -->
      <one in="hhh/www/ccc" out="***/ddd/***" symmetry="()" steps="1"/>

      <!-- Viale lastricato dal corpo di guardia alla porta del mastio -->
      <path from="G" to="d" on="c" color="n"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>

      <!-- Caserma addossata all'interno delle mura dove c'è spazio (stanza 6x6 = 30x30 voxel) -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vvvvvvvv" symmetry="(xy)" steps="1"/>

      <!-- Pozzo nel cortile -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi nei dintorni del forte -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***y***/*******/*******/*******" steps="10"/>

      <!-- Trama di lastricato nel cortile -->
      <convchain on="c" black="c" white="l" n="3" steps="6">
        <sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEclnrWtgPhwsdfFavRQyLKOoNTkUGM#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="y" out="EEEEE/EEEEE/EEyEE/EEEEE/EEEEE"/>

      <union symbol="+" values="WPwt"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="WPwt"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->

        <!-- Mura di cinta (altezza 24) -->
        <all in="B W" out="W *" steps="23"/>

        <!-- Torri (altezza 44) -->
        <all in="B t" out="t *" steps="43"/>

        <!-- Corpo di guardia (seme porta O a z=0, poi muro P fino a 36) -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g P" steps="35"/>
        <prl in="g" out="P"/>

        <!-- Mastio: mura con fasce finestre U sui due piani (altezza 64) -->
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w w" steps="14"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w w" steps="14"/>

        <!-- Porta del mastio (seme O a z=0, poi muro w fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="w"/>

        <!-- Interni del mastio: piano terra f, fascia scala T a z=1, solaio F a z=32, soffitto F a z=64 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Caserma: mura alte 32, pavimento f, tetto R -->
        <all in="B v" out="v *" steps="31"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B v" out="R *" steps="1"/>

        <!-- Pozzo nel cortile -->
        <all in="B Q" out="Q *" steps="4"/>

        <!-- Alberi nei dintorni -->
        <all in="B y" out="y K" steps="10"/>
        <prl in="y" out="L"/>
        <all in="LB" out="*L" steps="3"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. Scala piena: finestre, porte, scale, merli, feritoie e tetto della caserma -->
        <import file="part-window"/>
        <prl in="U" out="w"/>

        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>
        </pieces>

        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto spiovente sulla caserma -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6E8A4C" hidden="True" name="Terreno"/>
  <color symbol="c" value="7E9959" area="courtyard" name="Cortile"/>
  <color symbol="l" value="A9A292" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="n" value="B8AF9E" area="courtyard" name="Viale lastricato"/>
  <color symbol="r" value="C2B28F" area="road" name="Strada"/>
  <color symbol="W" value="8B857B" area="wall" name="Mura di cinta"/>
  <color symbol="t" value="756F66" area="tower" name="Torre"/>
  <color symbol="P" value="69635B" area="gatehouse" name="Corpo di guardia"/>
  <color symbol="w" value="948E84" area="keep" name="Mura del mastio"/>
  <color symbol="f" value="C4A47C" area="keep" name="Pavimento in legno"/>
  <color symbol="F" value="9E978B" area="keep" name="Solaio in pietra"/>
  <color symbol="v" value="8C867C" area="barracks" name="Mura della caserma"/>
  <color symbol="R" value="A84A38" area="barracks" name="Tetto in tegole"/>
  <color symbol="Q" value="4F7D96" area="courtyard" name="Pozzo"/>
  <color symbol="K" value="6B4E35" area="grounds" name="Tronco d'albero"/>
  <color symbol="L" value="4E6E3A" area="grounds" name="Chioma d'albero"/>
  <color symbol="O" value="6B4423" name="Porta in legno"/>
  <color symbol="o" value="4D3018" name="Assi della porta"/>
  <color symbol="N" value="59534B" name="Cornice in pietra"/>
  <color symbol="G" value="88B2C4" name="Vetro"/>
  <color symbol="k" value="A67C52" name="Gradini in legno"/>
  <color symbol="M" value="807A70" name="Merli"/>
  <color symbol="U" value="3B3732" name="Feritoia"/>
  <color symbol="#20" value="000000" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="Assi aperte"/>

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
</sequence>
It does not pass: taglia Enorme, seme 1: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 1 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Terreno, c Cortile, l Lastricato del cortile, W Mura di cinta, t Torre, G Vetro, w Mura del mastio, n Viale lastricato, r Strada, Q Pozzo, P Corpo di guardia, f Pavimento in legno, F Solaio in pietra, O Porta in legno, o Assi della porta, N Cornice in pietra, U Feritoia, M Merli
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEMtttMEEEEEEEEEEEEEMttttEEEEEEEEEttttMEEEEEEEE
EEEEEtttttEEEEEEEEEEEEEtttttEEEEEEEEEtttttEEEEEEEE
EEEEEtttttWWWWWWWWWWWWWtttttWWWWWWWWWtttttEEEEEEEE
EEEEEtttttWWWWWWWWWWWWWtttttWWWWWWWWWtttttEEEEEEEE
EEEEEMtttMWWWWWWWWWWWWWMttttWWWWWWWWWttttMEEEEEEEE
EEEEEEEWWWWWWWWWWFFFFFFFFFFFWWWWWWWWWWWWEEEEEEEEEE
EEEEEEEWWWWWWWWWWFFFFFFFFFFFWWWWWWWWWWWWEEEEEEEEEE
EEEEEEEWWWWWWWWWWFFFFFFFFFFFWWWWWWWWWWWWEEEEEEEEEE
EEEEEEEWWWWWWWWWWFFFFFFFFFFFWWWWWWWWWWWWEEEEEEEEEE
EEEEEEEWWWWWWWWWWFFFFFFFFFFFWWWWWWWWWWWWEEEEEEEEEE
EEEEEEEWWWWWWWWMwFFFFFFFFFFFwMllcccccWWWEEEEEEEEEE
EEEEEEEWWWWWWWWwwFFFFFFFFFFFwwllcccccWWWEEEEEEEEEE
EEEEEtttttWWWWWwwFFFFFFFFFFFwwllcccllWWWEEEEEEEEEE
EEEEEtttttWWWWWwwFFFFFFFFFFFwwcccccllWWWEEEEEEEEEE
EEEEEtttttWWWWWwwFFFFFFFFFFFwwcccccllWWWEEEEEEEEEE
EEEEEtttttWWWWWwwwwwwwwwwwwwwwcccccccWWWEEEEEEEEEE
EEEEEMtttMWWWWWMwwwwwwwwwwwwwMcccccccWWWEEEEEEEEEE
EEEEEEEWWWWWWWWcccccccnnnnnnnncccccccWWWEEEEEEEEEE
EEEEEEEWWWlllllcccccccnnnnnnnncclccccWtttEEEEEEEEE
EEEEEEEWWWlllllcccccccnnnnnnnncclcccctttttEEEEEEEE
EEEEEEEWWWlllllcccccccnnnnnnnncclcccctttttEEEEEEEE
EEEEEEEWWWlllllcccccccnnnnnnnncclcccctttttEEEEEEEE
EEEEEtttttlllllllcccccnnnnnnnnccccccctttttEEEEEEEE
EEEEEtttttcllllllcccccnnnnnnnncccclllWWWEEEEEEEEEE
EEEEEtttttcclllllcccccnnnnnnnncccllllWWWEEEEEEEEEE
EEEEEtttttcclllllQccccnnnnnnnnlllllllWWWEEEEEEEEEE
EEEEEMtttMcclllllQccccnnnnnnnnlllllllWWWEEEEEEEEEE
EEEEEEEWWWccclllllccccnnnnnnnnlllllllWWWEEEEEEEEEE
EEEEEEEWWWccclllllccccnnnnnnnncllllllWWWEEEEEEEEEE
EEEEEEEWWWccclllllccccnnnnnnnncclllllWWWEEEEEEEEEE
EEEEEEEWWWWWWWMcccccccnnnnnnnncclllllWWWEEEEEEEEEE
EEEEEEEWWWWWWWWcccccccnnnnnnnncclllllWWWEEEEEEEEEE
EEEEEtttttWWWWWWWWWWWWWPPPPPMWWWWWWWWtttttEEEEEEEE
EEEEEtttttWWWWWWWWWWWWWPPPPPNWWWWWWWWtttttEEEEEEEE
EEEEEtttttWWWWWWWWWWWWWMPPPPNWWWWWWWWtttttEEEEEEEE
EEEEEtttttEEEEEEEEEEEEErrrrrEEEEEEEEEtttttEEEEEEEE
EEEEEMtttMEEEEEEEEEEEEErrrrrEEEEEEEEEttttEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000eeeee0000000000000eeeeee0000000eeeeee00000000
00000eddde7777777777777edddde7777777edddde00000000
00000eddde7777777777777edddde7777777edddde00000000
00000eddde7777777777777edddde7777777edddde00000000
00000eeeee7777777777777eedeee7777777eeedee00000000
0000007777777777jjjjjjjjjjjjj777777777770000000000
0000007777777777jjjjjjjjjjjjj777777777770000000000
0000007777777777jjjjjjjjjjjjj777777777770000000000
0000007777777777jjjjjjjjjjjjj777777777770000000000
0000007777777777jjjjjjjjjjjjj777777777770000000000
000000777777777ljjjjjjjjjjjjjl00000077770000000000
00000eeeee77777ljjjjjjjjjjjjjl00000077770000000000
00000eddde7777bljjjjjjjjjjjjjlb0000077770000000000
00000eddde7777bljjjjjjjjjjjjjlb0000077770000000000
00000ddddd7777bjjjjjjjjjjjjjjjb0000077770000000000
00000eddde77777ljjjjjjjjjjjjjl20000077770000000000
00000eeeee77777llllllljlllllll00000077770000000000
00000077777777800000000000000000000077770000000000
000000777778888000000000000000000000eeeeee00000000
000000777700000000000000000000000000edddde00000000
000000777700000000000000000000000000eddddd00000000
00000eeeee00000000000000000000000000edddde00000000
00000eddde00000000000000000000000000edddde00000000
00000eddde00000000000000000000000000eeeeee00000000
00000dddde0000000000000000000000000077770000000000
00000eddde0000001110000000000000000077770000000000
00000eeeee0000001110000000000000000077770000000000
00000077770000000000000000000000000077770000000000
00000077770000000000000000000000000077770000000000
00000077770000000000000000000000000077770000000000
00000077777888800000000000000000000077770000000000
00000eeeee7777777777777cccccc7777777eeeeee00000000
00000eddde7777777777777cbbbbc7777777edddde00000000
00000eddde7777777777777cbbbbc7777777edddde00000000
00000eddde7777777777777ccbccc7777777ddddde00000000
00000eddde00000000000000000000000000edddde00000000
00000eeeee00000000000000000000000000eeeeee00000000
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
...............M..M..M.M..M..M....................
...............MM.M.MM.MM.M.MM....................
...............wwwwwwwwwwwwwww....................
...............wwwwwwwwwwwwwww....................
...............wwwwwwwwwwwwwww....................
...............wwwwwwwwwwwwwww....................
...............wwwwwwwwwwwwwww....................
.....MM.MM.....wwwGGwwwwwwwwww.......MM.M.........
.....MMMMM.....wwwGGGwwwwwwwww.......MMMMM........
.....ttttt.....wwwGGGwwwwwwwww.......ttttt........
.....ttttt.....wwwGGGwwMMMMMww.......ttttt........
.....ttttt.....wwwwwwwwMMMMMww.......ttttt........
.....ttttt.....wwwwwwwwPPPPPww.......ttttt........
.....ttttt.....wwwwwwwwPPPPPww.......ttttt........
.....ttttt.M.MMwwwwwwwwNooooOw.......ttttt........
.....ttttt.M.MMwwwwwwwwNooooOw.......ttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWNooooOWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWrooooEWWWWWWWWttttt........
```
Right side (looking from the right):
```
...............M..M.M.............................
...............MM.M.MM............................
...............wwwwwww............................
...............wwwwwww............................
...............wwwwwww............................
...............wwwwwww............................
...............wwwwwww............................
.....MM.MM.....wwNGwww..M.MMM.M......MM.M.........
.....MMMMM.....wwGGGww.MMMMMMMMM.....MMMMM........
.....ttttt.....wwGGGww.ttttttttt.....ttttt........
.....ttttt.....wwGGGww.ttttttttt.....ttttt........
.....ttttt.....wwwwwww.ttttttttt.....ttttt........
.....ttttt.....wwwwwww.ttttttttt.....ttttt........
.....ttttt.....wwwwwww.ttttttttt.....ttttt........
.....ttttt.....wwwwwwwMttttttttt...M.ttttt........
.....ttttt.....wwwwwwwMttttttttt...M.ttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
.....ttttt.............ttttt.........ttttt........
.....ttttt.............tttttt.......tttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWtttttWWWWWWWWWttttt........
.......WWWWWWWWWW...........WWWWWWWWWWWW..........
.......WWWWWWWWWW...........WWWWWWWWWWWW..........
.......WWWWWWWWWW...........WWWWWWWWWWWW..........
.......WWWWWWWWWW...........WWWWWWWWWWWW..........
.......WWWWWWWWWW...........WWWWWWWWWWWW..........
.......WWWWWWWWww...........ww.......WWW..........
......tWWWWWWWWww...........ww.......WWW..........
.....tttttWWWWWww...........ww.......WWW..........
.....tttttWWWWWww............w.......WWW..........
.....tttttWWWWWww....................WWW..........
.....tttttWWWWWwwwww..woooooow.......WWW..........
.....tttttWWWWWwwwww..woooooNw.......WWW..........
.......WWWWWWWW......................WWW..........
.......WWW...........................tttt.........
.......WWW...........................ttttt........
.......WWW...........................ttttt........
......tWWW...........................ttttt........
.....ttttt...........................ttttt........
.....ttttt...........................WWW..........
.....ttttt...........................WWW..........
.....ttttt...........................WWW..........
.....ttttt...........................WWW..........
.......WWW...........................WWW..........
.......WWW...........................WWW..........
.......WWW...........................WWW..........
.......WWWWWWWW......................WWW..........
......tWWWWWWWW.....................WWWW..........
.....tttttWWWWWWWWWWWWWooooooWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWooooooWWWWWWWWttttt........
.....tttttWWWWWWWWWWWWWoooooNWWWWWWWWttttt........
.....ttttt...........................ttttt........
.....ttttt...........................tttt.........
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
.....ttttt.............ttttt.........ttttt........
.....ttttt.............ttttt.........ttttt........
.....ttttt.............ttttt.........ttttt........
.....ttttt.............ttttt.........ttttt........
.....ttttt.............ttttt.........ttttt........
..................................................
..................................................
..................................................
..................................................
..................................................
...............ww...........ww....................
...............ww...........ww....................
.....ttttt.....w.............w....................
.....ttttt........................................
.....ttttt.....w.............w....................
.....ttttt.....www..wwwwwwwwww....................
.....ttttt.....www..wwwwwwwwww....................
..................................................
.....................................tttt.........
.....................................ttttt........
.....................................ttttt........
.....................................ttttt........
.....ttttt...........................ttttt........
.....ttttt........................................
.....ttttt........................................
.....ttttt........................................
.....ttttt........................................
..................................................
..................................................
..................................................
..................................................
..................................................
.....ttttt...........................ttttt........
.....ttttt...........................ttttt........
.....ttttt...........................ttttt........
.....ttttt...........................ttttt........
.....ttttt...........................tttt.........
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
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEMtttMEEEEEEEEEEEEEMttttEEEEEEEEEttttMEEEEEEEE   00000eeeee0000000000000eedeee0000000eeedee00000000
EEEEEtttttEEEEEEEEEEEEEtttttEEEEEEEEEtttttEEEEEEEE   00000eddde7777777777777edddde7777777edddde00000000
EEEEEtttttWWWWWWWWWWWWWtttttWWWWWWWWWtttttEEEEEEEE   00000eddde7777777777777edddde7777777edddde00000000
EEEEEtttttWWWWWWWWWWWWWtttttWWWWWWWWWtttttEEEEEEEE   00000eddde7777777777777edddde7777777edddde00000000
EEEEEMtttMWWWWWWWWWWWWWMttttWWWWWWWWWttttMEEEEEEEE   00000eeeee7777777777777eedeee7777777eeeeee00000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFWWWWWWWWWWWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjj77777777777770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFWWWWWWWWWWWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjj77777777777770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFWWWWWWWWWWWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjj77777777777770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFWWWWWWWWWWWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjj77777777777770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFWWWWWWWWWWWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjj77777777777770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFwcccclllllWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjjll000000077770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFwcccclllllWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjjjl000000077770000000000
EEEEEEEWWWWWWWWFFFFFFFFFFFFwNccclllllWWWEEEEEEEEEE   000000777777777jjjjjjjjjjjjjl000000077770000000000
EEEEEMtttMcccWwFFFFFFFFFFFFwMccccccccWWWEEEEEEEEEE   00000eeeee777lljjjjjjjjjjjjjl000000077770000000000
EEEEEtttttccccwFFFFFFFFFFFFwwccccccccWWWEEEEEEEEEE   00000eddde000ljjjjjjjjjjjjjjj000000077770000000000
EEEEEtttttcccwwwwwwwwwwwwwwwllllcccccWWWEEEEEEEEEE   00000edddd000jjjjjjjjjjjjjjjl000000077770000000000
EEEEEtttttccccwwwwwwwwwwwwwwlllccccccWWWEEEEEEEEEE   00000eddde000lljllllllljlllll0000000eeeeee00000000
EEEEEtttttccccclllllllnnnnnnccccccccctttttEEEEEEEE   00000eddde00000000000000000000000000edddde00000000
EEEEEEEWWWlllcclllllllnnnnnnccccccccctttttEEEEEEEE   00000eeeee00000000000000000000000000edddde00000000
EEEEEEEWWWlllcclllllllnnnnnnccccccccctttttEEEEEEEE   000000777700000000000000000000000000edddde00000000
EEEEEEEWWWlllcccccccccnnnnnnllccclllltttttEEEEEEEE   000000777700000000000000000000000000edddde00000000
EEEEEEEWWWlllcccccccccnnnnnnllcccclllttttEEEEEEEEE   000000777700000000000000000000000000eeedee00000000
EEEEEEEWWWlllcclllccccnnnnnnllcccccccWWWEEEEEEEEEE   00000077770000000000000000000000000077770000000000
EEEEEEEWWWccccclllllllnnnnnncccccccccWWWEEEEEEEEEE   00000077770000000000000000000000000077770000000000
EEEEEEEWWWccccclllllllnnnnnncccccccccWWWEEEEEEEEEE   00000077770000000000000000000000000077770000000000
EEEEEEEWWWWWWWMcccllllnnnnnnllccQccccWWWEEEEEEEEEE   00000077777888800000000000000001110077770000000000
EEEEEEEWWWWWWWWcccllllnnnnnnllccQccccWWWEEEEEEEEEE   00000077777777800000000000000001110077770000000000
EEEEEEEWWWWWWWWlllccccnnnnnnllcccllllWWWEEEEEEEEEE   00000077777777800000000000000000000077770000000000
EEEEEEEWWWWWWWWlllccccnnnnnncccccllllWWWEEEEEEEEEE   00000077777777800000000000000000000077770000000000
EEEEEEEWWWWWWWWlllccccnnnnnncccccllllWWWEEEEEEEEEE   00000077777777800000000000000000000077770000000000
EEEEEEEWWWWWWWWlllccccnnnnnncccccccccWWWEEEEEEEEEE   00000077777777800000000000000000000077770000000000
EEEEEEEWWWWWWWWlllccccnnnnnncccccccccWWWEEEEEEEEEE   00000eeeee7777877777777cccccc7777777eeeeee00000000
EEEEEtttttWWWWWWWWWWWWWPPPPPNWWWWWWWWtttttEEEEEEEE   00000eddde7777777777777cbbbbc7777777edddde00000000
EEEEEtttttWWWWWWWWWWWWWPPPPPNWWWWWWWWtttttEEEEEEEE   00000eddde7777777777777cbbbbc7777777edddde00000000
EEEEEtttttWWWWWWWWWWWWWMPPPPMWWWWWWWWtttttEEEEEEEE   00000edddd7777777777777cccccc7777777eddddd00000000
EEEEEtttttEEEEEEEEEEEEErrrrrEEEEEEEEEtttttEEEEEEEE   00000eddde00000000000000000000000000edddde00000000
EEEEEMtttMEEEEEEEEEEEEErrrrrEEEEEEEEEttttEEEEEEEEE   00000eeeee00000000000000000000000000eeedee00000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEMtttMEEEEEEEEEEMtttMEEEEEEEEEEEEttttMEEEEEEEE   00000eeeee0000000000eeeee00000000000eeeeee00000000
EEEEEtttttEEEEEEEEEEtttttEEEEEEEEEEEEtttttEEEEEEEE   00000eddde7777777777eddde77777777777edddde00000000
EEEEEtttttWWWWWWWWWWtttttWWWWWWWWWWWWtttttEEEEEEEE   00000eddde7777777777eddde77777777777edddde00000000
EEEEEtttttWWWWWWWWWWtttttWWWWWWWWWWWWtttttEEEEEEEE   00000eddde7777777777eddde77777777777edddde00000000
EEEEEMtttMWWWWWWWWWWMtttMWWWWWWWWWWWWttttMEEEEEEEE   00000eeeee7777777777eeeee77777777777eeeeee00000000
EEEEEEEWWWWWWWWWWWWWWWWFFFFFFFFFFFFWWWWWEEEEEEEEEE   00000077777777777777777jjjjjjjjjjjj777770000000000
EEEEEEEWWWWWWWWWWWWWWWWFFFFFFFFFFFFWWWWWEEEEEEEEEE   00000077777777777777777jjjjjjjjjjjj777770000000000
EEEEEEEWWWWWWWWWWWWWWWWFFFFFFFFFFFFWWWWWEEEEEEEEEE   00000077777777777777777jjjjjjjjjjjj777770000000000
EEEEEEEWWWWWWWWWWWWWWWWFFFFFFFFFFFFWWWWWEEEEEEEEEE   00000077777777777777777jjjjjjjjjjjj777770000000000
EEEEEEEWWWWWWWWWWWWWWWWFFFFFFFFFFFFWWWWWEEEEEEEEEE   00000077777777777777777jjjjjjjjjjjj777770000000000
EEEEEEEWWWWWWWWlllccccwFFFFFFFFFFFFwMWWWEEEEEEEEEE   000000777777778000000lljjjjjjjjjjjjll7770000000000
EEEEEEEWWWWWWWWlllccccwFFFFFFFFFFFFwwWWWEEEEEEEEEE   00000eeeee77778000000ljjjjjjjjjjjjjjl7770000000000
EEEEEtttttWWWWWlllccccwFFFFFFFFFFFFwwWWWEEEEEEEEEE   00000eddde77778000000ljjjjjjjjjjjjjjl7770000000000
EEEEEtttttWWWWWllllllNwFFFFFFFFFFFFwwWWWEEEEEEEEEE   00000eddde77778000000ljjjjjjjjjjjjjjl7770000000000
EEEEEtttttWWWWWlllllllwFFFFFFFFFFFFwwWWWEEEEEEEEEE   00000dddde77777000000jjjjjjjjjjjjjjjj7770000000000
EEEEEtttttWWWWWlllllllwwwwwwwwwwwwwwwWWWEEEEEEEEEE   00000eddde77778000000ljjjjjjjjjjjjjjl7770000000000
EEEEEMtttMWWWWMlllllllwwwwwwwwwwwwwwMWWWEEEEEEEEEE   00000eeeee78888000000llllljllllllljlleeeee00000000
EEEEEEEWWWlllllllllllllccnnnnnccccccctttttEEEEEEEE   000000777700000000000000000000000000edddde00000000
EEEEEEEWWWlllllllccclllccnnnnnlllcccctttttEEEEEEEE   000000777700000000000000000000000000edddde00000000
EEEEEEEWWWlllllllccclllccnnnnnlllcccctttttEEEEEEEE   000000777700000000000000000000000000edddde00000000
EEEEEEEWWWcccQQcclllcclllnnnnnlllcccctttttEEEEEEEE   000000777700011000000000000000000000edddde00000000
EEEEEEEWWWcccQQcllllcclllnnnnnllllcccttttEEEEEEEEE   00000eeeee00011000000000000000000000eeeeee00000000
EEEEEtttttccclllllllcclllnnnnncclllllWWWEEEEEEEEEE   00000eddde0000000000000000000000000077770000000000
EEEEEtttttccclllllllllcccnnnnncclllllWWWEEEEEEEEEE   00000eddde0000000000000000000000000077770000000000
EEEEEtttttccclllllllllcccnnnnncclllllWWWEEEEEEEEEE   00000edddd0000000000000000000000000077770000000000
EEEEEtttttccccccclllllcccnnnnncccllllWWWEEEEEEEEEE   00000eddde0000000000000000000000000077770000000000
EEEEEMtttMccccccclllllcccnnnnncccllllWWWEEEEEEEEEE   00000eeeee0000000000000000000000000077770000000000
EEEEEEEWWWccccccclllllcccnnnnncccllllWWWEEEEEEEEEE   00000077770000000000000000000000000077770000000000
EEEEEEEWWWWWWWMccclllllccnnnnncccllllWWWEEEEEEEEEE   00000077777888800000000000000000000077770000000000
EEEEEEEWWWWWWWWccclllllccnnnnncccllllWWWEEEEEEEEEE   00000077777777800000000000000000000077770000000000
EEEEEEEWWWWWWWWccclllllnnnnnnncccccccWWWEEEEEEEEEE   00000077777777700000000000000000000077770000000000
EEEEEEEWWWWWWWWccclllllnnnnnnncccccccWWWEEEEEEEEEE   00000eeeee7777877777777ccbccc7777777eeedee00000000
EEEEEtttttWWWWWWWWWWWWWPPPPPNWWWWWWWWtttttEEEEEEEE   00000eddde7777777777777cbbbbc7777777edddde00000000
EEEEEtttttWWWWWWWWWWWWWPPPPPNWWWWWWWWtttttEEEEEEEE   00000eddde7777777777777cbbbbc7777777edddde00000000
EEEEEtttttWWWWWWWWWWWWWMPPPPMWWWWWWWWtttttEEEEEEEE   00000edddd7777777777777ccbccc7777777dddddd00000000
EEEEEtttttEEEEEEEEEEEEErrrrrEEEEEEEEEtttttEEEEEEEE   00000eddde00000000000000000000000000edddde00000000
EEEEEMtttMEEEEEEEEEEEEErrrrrEEEEEEEEEttttEEEEEEEEE   00000eeeee00000000000000000000000000eeeeee00000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.34 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 150×150×120, 187 nodi, 596 passi, finito in 710 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Terreno (marcatore), c=Cortile, l=Lastricato del cortile, W=Mura di cinta, t=Torre, G=Vetro, h=honey, w=Mura del mastio, d=dead, dark, n=Viale lastricato, r=Strada, Q=Pozzo, u=blue, m=magenta, K=Tronco d'albero, g=green, P=Corpo di guardia, f=Pavimento in legno, F=Solaio in pietra, O=Porta in legno, o=Assi della porta, N=Cornice in pietra, U=Feritoia, M=Merli, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore), #94=? (marcatore), #93=? (marcatore), #95=? (marcatore), #96=? (marcatore), #97=? (marcatore).
Alla fine: W 84930, t 76986, w 19386, E 11250, o 6510, U 3246, M 2592, F 2100, c 1600, N 1218, n 1125, l 1100, f 1050, P 900, r 450, G 310, O 240, Q 125.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-47 prl×5, all×22, one×5, path×1, convchain×1: 2073 celle x1-28 y1-29 z0, passi 2-91
   #49 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 92
    #51 all . W → W * passi=23: ×23, 82225 celle x20-119 y20-119 z1-23, passi 93-115, .→W 82225
    #52 all . t → t * passi=43: ×43, 77400 celle x15-124 y15-124 z1-43, passi 116-158, .→t 77400
#53-54 all×2: 10800 celle x70-84 y110-119 z0-36, passi 159-194
#55-59 prl×1, all×4: 15150 celle x45-89 y45-119 z1-38, passi 195-233
#60-62 all×3: 11550 celle x45-89 y45-64 z0-64, passi 234-260
#63-65 all×2, prl×1: 11625 celle x50-84 y30-64 z0-64, passi 261-325
    #67 all . h → h . passi=31: ×31, 65100 celle x50-84 y30-59 z1-32, passi 326-356, h→. 32550, .→h 32550
    #69 all . h → h F (+1) passi=1: ×1, 2100 celle x50-84 y30-59 z32-33, passi 357, h→F 1050, .→h 1050
      r1 . h → h F ×1050; r2 . s → s F ×0
    #70 all . h → h . (+1) passi=31: ×31, 65100 celle x50-84 y30-59 z33-64, passi 358-388, h→. 32550, .→h 32550
      r1 . h → h . ×32550; r2 . s → s . ×0
#71-117 prl×12, all×10: 10808 celle x44-90 y30-94 z1-64, passi 389-466
#118-185 prl×3, pieces×1, all×7: 21431 celle x15-124 y15-124 z0-70, passi 467-532
Senza effetto (non hanno mai cambiato una cella):
#10 all cuuuuuuuuuu → *cccccc**** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#11 all cu/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#12 all cuuuuuuuuuuu → *ccccc****** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#13 all cu/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#15 one cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu… → *cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc… passi=2: le celle cercate c'erano, ma mai disposte come nel pattern
#37 all c/h → h/* passi=5: le celle cercate c'erano, ma mai disposte come nel pattern
#40 one [wW][wW][wW][wW][wW][wW][wW]/hhhhhhh/hhhhhhh → *******/**ssss*/**ssss* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#44 one WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cc… → ********/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/va… passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#46 one EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE… → *******/*******/*******/***y***/*******/*******… passi=10: le celle cercate c'erano, ma mai disposte come nel pattern
#66 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
#68 all . s → s . passi=30: in quel momento nella griglia non c'erano celle "s"
#72 all . v → v * passi=31: in quel momento nella griglia non c'erano celle "v"
… e altri 39
Fix it and answer with the whole program.

## Risposta

```xml
<!--
  Concetto: Forte medievale
  Parti e lettere sulla pianta (cella = 5x5 voxel):
  - c, l: cortile interno (erba e chiazze di lastricato) formato dall'unione di rettangoli con bracci casuali
  - W: mura di cinta (spesse 2 celle) attorno al cortile
  - G: corpo di guardia sul lato anteriore delle mura, con passaggio largo 3 celle
  - r: strada esterna dritta dal corpo di guardia al bordo anteriore
  - t: torri (3x3) sugli angoli esterni convessi e lungo i lati lunghi delle mura
  - h, w, s, d: mastio a due piani coperti (pavimento, mura con finestre, zona scala 4x2 con pianerottolo, porta larga 3 celle) posto il più lontano possibile dalla porta
  - n: viale lastricato interno dal corpo di guardia alla porta del mastio
  - a, v: caserma con tetto spiovente addossata all'interno delle mura di cinta dove c'è spazio
  - Q: pozzo nel cortile
  - y: alberi nel terreno circostante

  Cosa cambia tra i semi:
  - forma del cortile (posizione e numero dei bracci rettangolari)
  - posizione del mastio sul fondo del cortile e lato della sua scala
  - posizione della caserma lungo le mura, delle torri intermedie, del pozzo, degli alberi e trama del lastricato

  Cosa entra in ogni taglia:
  - Huge (30x30 celle): cortile con bracci, mura di cinta con torri d'angolo, corpo di guardia, mastio a due piani con scala, viale, pozzo e strada fino al bordo
  - Gargantuan (100x100 celle): cortile ampio a più rettangoli, torri intermedie lungo le mura, caserma interna, pozzo e alberi attorno al forte
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEclWtGhwsdnravQyumK" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Margine dal bordo del lotto per mura e torri -->
      <prl in="***/*E*/***" out="***/*u*/***"/>
      <prl in="Eu" out="*E" steps="5"/>

      <!-- Cortile centrale attorno a H -->
      <all in="u/[Hc]" out="c/*" symmetry="()" steps="6"/>
      <all in="[Hc]/u" out="*/c" symmetry="()" steps="6"/>
      <all in="[Hc]u" out="*c" symmetry="(x)" steps="6"/>

      <!-- Espansione del cortile dove il terreno prosegue (Gargantuan) -->
      <all in="cuuuuuuuuuu" out="*cccccc****" steps="1"/>
      <all in="cu/*c" out="*c/**"/>
      <all in="cuuuuuuuuuuu" out="*ccccc******" steps="1"/>
      <all in="cu/*c" out="*c/**"/>

      <!-- Bracci rettangolari casuali per rompere la scatola del cortile -->
      <one in="cuuu/cuuu/cuuu/cuuu/cuuu/cuuu/cuuu" out="*ccc/*ccc/*ccc/*ccc/*ccc/*ccc/*ccc" symmetry="(xy)" steps="2"/>
      <one in="cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu/cuuuuuu" out="*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc/*cccccc" symmetry="(xy)" steps="2"/>

      <!-- Ripristino del terreno esterno -->
      <prl in="u" out="E"/>

      <!-- Mura di cinta spesse 2 celle attorno al cortile, angoli pieni -->
      <all in="[Hc]E" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Via d'uscita dal centro verso il fronte: corpo di guardia G e strada r larghi 3 celle (prima delle torri) -->
      <all in="H/c" out="*/m" symmetry="()" steps="1"/>
      <all in="m/c" out="*/m" symmetry="()"/>
      <all in="m/W" out="*/G" symmetry="()"/>
      <all in="G/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl>
        <rule in="m" out="c"/>
        <rule in="H" out="c"/>
      </prl>

      <!-- Torri 3x3 sugli angoli convessi e lungo i tratti lunghi delle mura -->
      <all in="EE/EW" out="**/*t"/>
      <one in="EEEEEEEEEEE/EEEEEEEEEEE/WWWWWWWWWWW" out="***********/***********/*****t*****" symmetry="(xy)" steps="4"/>
      <all steps="1">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Mastio il più lontano possibile dalla porta -->
      <one in="c" out="K" steps="1">
        <field for="K" from="r" on="cGr"/>
      </one>
      <prl in="K" out="h"/>
      <all in="hc" out="*h" symmetry="(x)" steps="4"/>
      <all in="hc" out="*h" symmetry="(x)" steps="3"/>
      <all in="h/c" out="*/h" symmetry="()" steps="5"/>
      <all in="c/h" out="h/*" symmetry="()" steps="5"/>
      <all in="hc" out="*w" steps="1"/>
      <all in="wc/*w" out="*w/**"/>

      <!-- Zona scala del mastio (4x2) lungo una parete, con 2 celle di pianerottolo prima e 1 dopo -->
      <one in="[wWt][wWt][wWt][wWt][wWt][wWt][wWt]/hhhhhhh/hhhhhhh" out="*******/**ssss*/**ssss*" symmetry="()" steps="1"/>

      <!-- Porta del mastio rivolta al cortile (larga 3 celle) -->
      <one in="hhh/www/ccc" out="***/ddd/***" symmetry="()" steps="1"/>

      <!-- Viale lastricato dal corpo di guardia alla porta del mastio -->
      <path from="G" to="d" on="c" color="n"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>

      <!-- Caserma addossata all'interno delle mura dove c'è spazio (stanza 6x6 = 30x30 voxel) -->
      <one in="WWWWWWWW/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc/cccccccc" out="********/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vaaaaaav/vvvvvvvv" symmetry="(xy)" steps="1"/>

      <!-- Pozzo nel cortile -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Alberi nei dintorni del forte -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***y***/*******/*******/*******" steps="10"/>

      <!-- Trama di lastricato nel cortile -->
      <convchain on="c" black="c" white="l" n="3" steps="6">
        <sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample>
      </convchain>
    </sequence>

    <map scale="5 5 1" values="BEclnrWtgPhwsdfFavRQyLKOoNTkUGM#20#21#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="l" out="lllll/lllll/lllll/lllll/lllll"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="Q" out="QQQQQ/QQQQQ/QQQQQ/QQQQQ/QQQQQ"/>
      <rule in="y" out="EEEEE/EEEEE/EEyEE/EEEEE/EEEEE"/>

      <union symbol="+" values="WPwt"/>
      <union symbol="=" values="fF"/>
      <union symbol="%" values="WPwt"/>

      <sequence symmetry="(xy)">
        <!-- B. Altezze: colonne per passi -->

        <!-- Mura di cinta (altezza 24) -->
        <all in="B W" out="W *" steps="23"/>

        <!-- Torri (altezza 44) -->
        <all in="B t" out="t *" steps="43"/>

        <!-- Corpo di guardia (seme porta O a z=0, poi muro P fino a 36) -->
        <all in="B g" out="g O" steps="1"/>
        <all in="B g" out="g P" steps="35"/>
        <prl in="g" out="P"/>

        <!-- Mastio: mura con fasce finestre U sui due piani (altezza 64) -->
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w w" steps="14"/>
        <all in="B w" out="w w" steps="6"/>
        <all in="B w" out="w U" steps="12"/>
        <all in="B w" out="w w" steps="14"/>

        <!-- Porta del mastio (seme O a z=0, poi muro w fino a 64) -->
        <all in="B d" out="d O" steps="1"/>
        <all in="B d" out="d w" steps="63"/>
        <prl in="d" out="w"/>

        <!-- Interni del mastio: piano terra f, fascia scala T a z=1, solaio F a z=32, soffitto F a z=64 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <prl>
          <rule in="h" out="F"/>
          <rule in="s" out="F"/>
        </prl>

        <!-- Caserma: mura alte 32, pavimento f, tetto R -->
        <all in="B v" out="v *" steps="31"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="R"/>
        <all in="B v" out="R *" steps="1"/>

        <!-- Pozzo nel cortile -->
        <all in="B Q" out="Q *" steps="4"/>

        <!-- Alberi nei dintorni -->
        <all in="B y" out="y K" steps="10"/>
        <prl in="y" out="L"/>
        <all in="LB" out="*L" steps="3"/>
        <all in="B L" out="L *" steps="4"/>

        <!-- C. Scala piena: finestre, porte, scale, merli, feritoie e tetto della caserma -->
        <import file="part-window"/>
        <prl in="U" out="w"/>

        <pieces piece="125" margin="24">
          <import file="part-door"/>
          <import file="part-stair"/>
        </pieces>

        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Tetto spiovente sulla caserma -->
        <all in="RB" out="*R" steps="1"/>
        <all in="*****/*****/**B**/*****/***** **R**/**R**/RRRRR/**R**/**R**" out="*****/*****/**R**/*****/***** *****/*****/*****/*****/*****" steps="8" symmetry="()"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="6E8A4C" hidden="True" name="Terreno"/>
  <color symbol="c" value="7E9959" area="courtyard" name="Cortile"/>
  <color symbol="l" value="A9A292" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="n" value="B8AF9E" area="courtyard" name="Viale lastricato"/>
  <color symbol="r" value="C2B28F" area="road" name="Strada"/>
  <color symbol="W" value="8B857B" area="wall" name="Mura di cinta"/>
  <color symbol="t" value="756F66" area="tower" name="Torre"/>
  <color symbol="P" value="69635B" area="gatehouse" name="Corpo di guardia"/>
  <color symbol="w" value="948E84" area="keep" name="Mura del mastio"/>
  <color symbol="f" value="C4A47C" area="keep" name="Pavimento in legno"/>
  <color symbol="F" value="9E978B" area="keep" name="Solaio in pietra"/>
  <color symbol="v" value="8C867C" area="barracks" name="Mura della caserma"/>
  <color symbol="R" value="A84A38" area="barracks" name="Tetto in tegole"/>
  <color symbol="Q" value="4F7D96" area="courtyard" name="Pozzo"/>
  <color symbol="K" value="6B4E35" area="grounds" name="Tronco d'albero"/>
  <color symbol="L" value="4E6E3A" area="grounds" name="Chioma d'albero"/>
  <color symbol="O" value="6B4423" name="Porta in legno"/>
  <color symbol="o" value="4D3018" name="Assi della porta"/>
  <color symbol="N" value="59534B" name="Cornice in pietra"/>
  <color symbol="G" value="88B2C4" name="Vetro"/>
  <color symbol="k" value="A67C52" name="Gradini in legno"/>
  <color symbol="M" value="807A70" name="Merli"/>
  <color symbol="U" value="3B3732" name="Feritoia"/>
  <color symbol="#20" value="000000" hidden="True" name="Porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="Assi aperte"/>

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
</sequence>
```

