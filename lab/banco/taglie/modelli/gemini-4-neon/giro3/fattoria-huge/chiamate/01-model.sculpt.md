# model.sculpt · gemini-4-neon · 67 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · size huge (9.375 × 9.375 × 7.5 tiles, 16 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 9.375 × 9.375 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 500 × 500 × 160, 31.25 × 31.25 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.
It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
  Fattoria (composizione sul piano 1/5):
  - Parti e lettere:
    h: pavimento della casa principale (due piani, divisa in due stanze dal muro interno j)
    w: muri esterni della casa principale
    j: muro interno divisorio tra sala anteriore e stanza posteriore
    s: zona della scala (lungo il muro interno, nella sala anteriore, verso +x)
    d: porta principale sul fronte (3 celle = 15 voxel)
    p: pavimento del portico sul fronte; b: pilastri agli angoli anteriori del portico
    a: pavimento della stalla / ala laterale; v: muri della stalla
    r: strada selciata dalla porta al bordo anteriore
    c: aia attorno alla fattoria; x: recinto dell'aia; Q: pozzo nell'aia
    l, g: campi arati con solchi oltre il recinto; t: alberi sul terreno libero
  - Variazione tra i semi: profondità della casa (+1 cella a caso), lato e posizione della stalla laterale,
    posizione della scala lungo il muro interno, posizione del pozzo e degli alberi, trama dei solchi.
  - Scala e dimensioni:
    * Huge (30x30): casa principale (circa 15x13 celle interne), portico, stalla laterale, breve aia e strada.
    * Gargantuan (100x100): in più grande aia recintata, pozzo, ampi campi arati con solchi e alberi attorno.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwjsdpbravcxQltg" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa attorno al centro H: 15x13 celle interne (+1 in profondità a caso) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Porta principale sul fronte (3 celle) tracciata dal centro H verso +y -->
      <all in="H/h" out="*/r" symmetry="()" steps="1"/>
      <all in="r/h" out="*/r" symmetry="()"/>
      <all in="r/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <prl in="r" out="h"/>

      <!-- Muro interno j che divide la casa in sala anteriore e stanza posteriore -->
      <all in="[Hj]h" out="*j" symmetry="(x)"/>
      <prl in="H" out="j"/>

      <!-- Zona scala s nella sala anteriore lungo il muro interno (4x2 celle, 2 celle libere prima e dopo) -->
      <one in="jjjjjjjj/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>

      <!-- Portico anteriore p (3 celle di profondità, 7 di larghezza) e pilastri b agli angoli -->
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="p/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="pE/EE" out="b*/**" symmetry="(x)"/>

      <!-- Stalla / ala laterale a contro un lato casuale della casa, con i propri muri v -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c attorno alla casa e alla stalla: si espande dove c'è molto terreno (Gargantuan) -->
      <all in="[wvpbd]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*cccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Recinto x attorno all'aia dove il terreno prosegue -->
      <all in="cEE" out="*x*"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Strada r dalla porta al bordo anteriore (3 celle di larghezza) -->
      <all in="d/p" out="*/r" symmetry="()" steps="1"/>
      <all in="r/[pcxE]" out="*/r" symmetry="()"/>

      <!-- Pozzo Q in uno spazio libero dell'aia -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Campi arati l oltre il recinto (Gargantuan) con solchi g -->
      <all in="xEEEEEE" out="*lllll*" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <all in="lEEEEEE" out="*llll**" steps="1"/>
      <all in="lE/*l" out="*l/**"/>
      <convchain on="l" black="l" white="g" n="3" steps="6">
        <sample>lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll</sample>
      </convchain>

      <!-- Alberi t sul terreno libero attorno -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" hidden="True" name="aria"/>
  <color symbol="E" value="7A9A5B" hidden="True" name="terreno"/>
  <color symbol="H" value="FF00FF" hidden="True" name="centro"/>
  <color symbol="h" value="C9A87C" area="house" name="pavimento della casa"/>
  <color symbol="w" value="D8CFC2" name="muro della casa"/>
  <color symbol="j" value="BFA98E" name="muro interno"/>
  <color symbol="s" value="9C6B3B" area="house" name="zona scala"/>
  <color symbol="d" value="6E4526" name="porta"/>
  <color symbol="p" value="B89B72" area="porch" name="portico"/>
  <color symbol="b" value="6B4423" name="pilastro del portico"/>
  <color symbol="r" value="A89F91" area="road" name="strada"/>
  <color symbol="a" value="B38F5D" area="barn" name="stalla"/>
  <color symbol="v" value="8C6A4A" name="muro della stalla"/>
  <color symbol="c" value="C7B793" area="yard" name="aia"/>
  <color symbol="x" value="7A5433" name="recinto"/>
  <color symbol="Q" value="5B84A6" name="pozzo"/>
  <color symbol="l" value="9E7B4F" area="field" name="campo arato"/>
  <color symbol="g" value="7D5E3A" area="field" name="solco"/>
  <color symbol="t" value="4F7A3E" name="albero"/>
</sequence>
```

