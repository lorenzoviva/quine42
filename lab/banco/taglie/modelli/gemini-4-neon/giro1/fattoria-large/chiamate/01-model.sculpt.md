# model.sculpt · gemini-4-neon · 77 s

## Richiesta

Sculpt: fattoria
What it looks like: fattoria: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a dwelling (see «What fits»): the house takes most of the area, not a cottage in a garden. At least 10 tiles² of covered floor where a body stands (its centre, half a body off every wall) on the ground floor and on another storey, the ground floor in 2 rooms or more of at least 1.5 tiles² each (the hall and a room) divided by an inner wall with a door: about 75 × 65 voxels inside the outer walls at every size, two storeys.
It is not a fortification: no merlons, no arrow slits, nothing of a fort; its flat tops end in a cornice, a solid parapet, a railing, a skylight or a dome, as its world builds them.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.
- <import file="part-window"/>: Rows of windows (part-window), included after the walls have risen, outside <pieces> and before part-slits: mark with U a band of your walls through their whole thickness, as tall as a window with its sill and lintel (8 to 16), with your wall above and under it. On every straight stretch of a face with air in front and past its ends (a corner, a door) it centres a window 8 wide (9 on an odd stretch), then outward piers of 6 and windows of 8 while 3 of wall stay at the end (on a stretch that runs to the edge of the box, from its free end; none on the faces of an inner corner, a room): the frame N, the sill jutting out by one, the glass G, the wall open behind it. What is left of the band stays U: turn it back to your wall after (<prl in="U" out="W"/>). Give N and G your colours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
  Fattoria (Block 1 — Composizione sulla pianta in scala 1/5):
  - Corpo principale (h: sala anteriore, a: cucina/stanza posteriore, w: muri esterni, j: muro interno, s: zona scala, d: ingresso anteriore):
    casa a due piani con 2 stanze al piano terra, centrata su H (15x13 celle interne = 75x65 voxel), con portico anteriore (p: pavimento, q: pilastri).
  - Varianti per seme: posizione della scala s lungo il muro interno j, lato e posizione della stalla/annesso b, posizione del pozzo Q, disposizione dei solchi l e degli alberi t.
  - Cosa entra per taglia:
    - Large (20x20): casa padronale (sala, cucina, scala), portico anteriore con pilastri e strada r fino al bordo.
    - Huge (30x30): in più la stalla/annesso laterale (b, v), l'aia (c) con lastricato (n) e pozzo (Q), la staccionata (x), i campi arati a solchi (g, l) e gli alberi (t).
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhawjsdpqbvcnrxQgltm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Corpo principale della casa: 6 celle dietro H, 6 davanti, 7 per lato (15x13 interne) -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="6"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="6"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="7"/>
      <all in="[Hh]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Ingresso anteriore d (3 celle) tracciato dal centro H verso il fronte -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>

      <!-- Muro interno j che divide sala anteriore (h) e stanza posteriore (a) -->
      <prl in="H" out="j"/>
      <all in="jh" out="*j" symmetry="(x)"/>
      <all in="h/j" out="a/*" symmetry="()" steps="1"/>
      <all in="ah" out="*a"/>
      <prl in="m" out="h"/>

      <!-- Zona della scala s nella sala anteriore, addossata al muro interno j -->
      <one in="jjjjjjjjj/hhhhhhhhh/hhhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Portico anteriore p (2 celle di profondità) con pilastri q agli angoli -->
      <all in="[wd]/E" out="*/p" symmetry="()" steps="2"/>
      <all in="pE/EE" out="q*/**" symmetry="(x)" steps="1"/>

      <!-- Stalla/annesso laterale (b, v) solo dove c'è spazio (Huge) -->
      <one in="wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE/wEEEEE" out="*b****/*b****/*b****/*b****/*b****/*b****/*b****" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(x)" steps="3"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Aia c davanti al portico solo dove il terreno continua (Huge) -->
      <all in="[pq]/E/E/E/E" out="*/c/c/c/*" symmetry="()" steps="1"/>
      <all in="cEEEE" out="*cc**" symmetry="(x)" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Lastricato n attraverso portico e aia, poi strada r fino al bordo -->
      <all in="[dn]/[pc]" out="*/n" symmetry="()"/>
      <all in="[nr]/E" out="*/r" symmetry="()"/>

      <!-- Pozzo Q nell'aia dove entra 5x5 -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- Staccionata x attorno all'aia -->
      <all in="cE" out="*x"/>
      <all in="xE/*x" out="*x/**"/>

      <!-- Campi arati (g, l) e alberi (t) nel terreno libero esterno (Huge) -->
      <all in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**g**/*****/*****" steps="1"/>
      <all in="gE" out="*g" steps="2"/>
      <convchain on="g" black="g" white="l" n="3" steps="8">
        <sample>ggggggg/lllllll/ggggggg/lllllll/ggggggg/lllllll/ggggggg</sample>
      </convchain>
      <one in="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE" out="*****/*****/**t**/*****/*****" steps="3"/>
    </sequence>
  </map>

  <color symbol="E" value="6A8E4E" hidden="True" name="Terreno"/>
  <color symbol="H" value="FF00FF" name="Centro"/>
  <color symbol="h" value="C8A878" area="hall" name="Pavimento della sala"/>
  <color symbol="a" value="B89668" area="kitchen" name="Pavimento della cucina"/>
  <color symbol="w" value="D8C8B0" name="Muro della fattoria"/>
  <color symbol="j" value="C0B098" name="Muro interno"/>
  <color symbol="s" value="8B6848" area="hall" name="Scala"/>
  <color symbol="d" value="6E452A" name="Ingresso"/>
  <color symbol="p" value="A89880" area="porch" name="Portico"/>
  <color symbol="q" value="5C3A21" name="Pilastro del portico"/>
  <color symbol="b" value="9C8460" area="barn" name="Pavimento della stalla"/>
  <color symbol="v" value="7A5438" name="Muro della stalla"/>
  <color symbol="c" value="C2B280" area="yard" name="Aia"/>
  <color symbol="n" value="9E9A90" area="yard" name="Lastricato"/>
  <color symbol="r" value="A68E68" area="road" name="Strada sterrata"/>
  <color symbol="x" value="6B4C30" name="Staccionata"/>
  <color symbol="Q" value="4E7A9E" name="Pozzo"/>
  <color symbol="g" value="7C5A3A" area="field" name="Campo arato"/>
  <color symbol="l" value="5E4228" area="field" name="Solco"/>
  <color symbol="t" value="3E6B38" name="Albero"/>
  <color symbol="m" value="FF8800" name="Segnaposto"/>
</sequence>

