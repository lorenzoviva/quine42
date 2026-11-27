# model.sculpt · gemini-4-neon · 82 s

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

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
  Concetto: Forte medievale
  Parti e lettere sulla pianta (cella = 5x5 voxel):
  - c, l: cortile interno (erba e chiazze di lastricato) formato dall'unione di rettangoli con bracci casuali
  - W: mura di cinta (spesse 2 celle) attorno al cortile
  - t: torri (5x5) su ogni angolo esterno convesso e lungo i lati lunghi delle mura
  - G: corpo di guardia sul lato anteriore delle mura, con passaggio largo 3 celle
  - r: strada esterna dritta dal corpo di guardia al bordo anteriore
  - h, w, s, d: mastio (pavimento, mura, zona scala 4x2 con pianerottolo, porta larga 3 celle) posto il più lontano possibile dalla porta
  - n: viale lastricato interno dal corpo di guardia alla porta del mastio
  - a, v: caserma (pavimento e mura) addossata all'interno delle mura di cinta dove c'è spazio
  - Q: pozzo nel cortile
  - f, p: fossato esterno attorno alle mura (dove il terreno prosegue) e ponte lungo la strada
  - y: alberi nel terreno circostante

  Cosa cambia tra i semi:
  - forma del cortile (posizione e numero dei bracci rettangolari)
  - posizione del mastio sul fondo del cortile e lato della sua scala
  - posizione della caserma lungo le mura, delle torri intermedie, del pozzo, degli alberi e trama del lastricato

  Cosa entra in ogni taglia:
  - Huge (30x30 celle): cortile con bracci, mura di cinta con torri d'angolo, corpo di guardia, mastio con scala, viale, pozzo e strada fino al bordo
  - Gargantuan (100x100 celle): cortile ampio a più rettangoli, torri intermedie lungo le mura, caserma interna, fossato con ponte e alberi attorno al forte
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEclWtGhwsdnravQfpyumK" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Margine dal bordo del lotto per mura, torri e fossato -->
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
      <one in="cuu/cuu/cuu/cuu/cuu" out="*cc/*cc/*cc/*cc/*cc" symmetry="(xy)" steps="2"/>
      <one in="cuuuuu/cuuuuu/cuuuuu/cuuuuu/cuuuuu/cuuuuu/cuuuuu" out="*ccccc/*ccccc/*ccccc/*ccccc/*ccccc/*ccccc/*ccccc" symmetry="(xy)" steps="3"/>

      <!-- Ripristino del terreno esterno -->
      <prl in="u" out="E"/>

      <!-- Mura di cinta spesse 2 celle attorno al cortile, angoli pieni -->
      <all in="[Hc]E" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Torri 5x5 sugli angoli convessi e lungo i tratti lunghi delle mura -->
      <all in="EE/EW" out="**/*t"/>
      <one in="EEEEEEEEE/EEEEEEEEE/WWWWWWWWW" out="*********/*********/****t****" symmetry="(xy)" steps="4"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Via d'uscita dal centro verso il fronte: corpo di guardia G e strada r larghi 3 celle -->
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

      <!-- Mastio il più lontano possibile dalla porta -->
      <one in="c" out="K" steps="1">
        <field for="K" from="r" on="cGr"/>
      </one>
      <prl in="K" out="h"/>
      <all in="hc" out="*h" symmetry="(x)" steps="4"/>
      <all in="hc" out="*h" symmetry="(x)" steps="3"/>
      <all in="h/c" out="*/h" symmetry="()" steps="5"/>
      <all in="c/h" out="h/*" symmetry="()" steps="2"/>
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

      <!-- Fossato esterno dove il terreno prosegue (Gargantuan) e ponte sulla strada -->
      <all in="cWWEEEEE" out="***ff***" steps="1"/>
      <all in="[Wt]E/*f" out="**/*f"/>
      <all in="fE/*f" out="*f/**"/>
      <all in="rf" out="p*" symmetry="(x)"/>
      <all in="pr" out="*p" symmetry="(x)"/>

      <!-- Alberi nei dintorni del forte -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***y***/*******/*******/*******" steps="12"/>

      <!-- Trama di lastricato nel cortile -->
      <convchain on="c" black="c" white="l" n="3" steps="6">
        <sample>cccllll/cccllll/ccclllc/llccccc/llcccll/lllccll/cllllcc</sample>
      </convchain>
    </sequence>
  </map>

  <color symbol="E" value="6E8A4C" hidden="True" name="Terreno"/>
  <color symbol="c" value="7E9959" area="courtyard" name="Cortile"/>
  <color symbol="l" value="A9A292" area="courtyard" name="Lastricato del cortile"/>
  <color symbol="W" value="8B857B" area="wall" name="Mura di cinta"/>
  <color symbol="t" value="756F66" area="tower" name="Torre"/>
  <color symbol="G" value="69635B" area="gatehouse" name="Corpo di guardia"/>
  <color symbol="h" value="C4A47C" area="keep" name="Pavimento del mastio"/>
  <color symbol="w" value="948E84" area="keep" name="Mura del mastio"/>
  <color symbol="s" value="A67C52" area="keep" name="Scala del mastio"/>
  <color symbol="d" value="6B4423" area="keep" name="Porta del mastio"/>
  <color symbol="n" value="B8AF9E" area="courtyard" name="Viale lastricato"/>
  <color symbol="r" value="C2B28F" area="road" name="Strada"/>
  <color symbol="a" value="B5966F" area="barracks" name="Pavimento della caserma"/>
  <color symbol="v" value="8C867C" area="barracks" name="Mura della caserma"/>
  <color symbol="Q" value="4F7D96" area="courtyard" name="Pozzo"/>
  <color symbol="f" value="3D6B82" area="moat" name="Fossato"/>
  <color symbol="p" value="8A623E" area="road" name="Ponte"/>
  <color symbol="y" value="4E6E3A" area="grounds" name="Albero"/>
  <color symbol="u" value="555555" hidden="True" name="Area edificabile"/>
  <color symbol="m" value="AAAAAA" hidden="True" name="Traccia"/>
  <color symbol="K" value="FF0000" hidden="True" name="Seme del mastio"/>
</sequence>
```

