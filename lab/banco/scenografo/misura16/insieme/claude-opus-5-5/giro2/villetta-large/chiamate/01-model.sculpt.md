# model.sculpt · claude-opus-5-5 · 20 s

## Richiesta

Sculpt: villetta
What it looks like: villetta: a building one enters, with the door at the front. Furnished inside, in the same program: every room of every storey has its furniture (beds, tables, benches, shelves, chests, a hearth, barrels; mangers and hay where animals stay), standing on the floor against the walls, each piece a small body of its own material. Keep free what a body needs, the checks are the same: the door and the straight way in from it, two cells of free floor before every stair and where it comes out, a passage at least 11 voxels wide between the pieces to every room and every stair. Give every furniture material a colour of its own whose name begins with «arredo» (arredo letto, arredo tavolo…).
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
villetta: una casa di campagna a due piani con un'ala più bassa e un portico.
Parti (lettere del piano):
  h  interno del corpo principale (2 piani), w i suoi muri
  s  zona della scala, dentro h, lungo il muro di fondo
  a  interno dell'ala (1 piano, più bassa), v i suoi muri; l'ala sta a sinistra o a destra (seme)
  p  portico davanti alla porta, sotto un tetto a falda, su pali
  d  soglia della porta nel muro frontale, r il vialetto dritto al bordo
  g  giardino attorno alla casa, x la siepe che lo chiude (solo dove il terreno continua: Huge)
  t  alberi nel prato (dove ci stanno 7x7 liberi), q pozzo nel giardino (Huge)
Relazioni: corpo attorno al centro, porta in mezzo davanti, portico davanti alla porta, ala su un fianco,
scala contro il muro di fondo. I semi cambiano la profondità del corpo, il lato e la posizione dell'ala, gli alberi.
Large: casa + ala + portico + vialetto. Huge: in più giardino con siepe, pozzo e alberi.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsavpdrgxtqim" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- corpo principale -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- l'ala, contro un muro laterale -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <!-- la scala lungo il muro di fondo -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- la via d'uscita: porta, portico, vialetto -->
      <prl in="H" out="i"/>
      <all in="i/h" out="*/i" symmetry="()"/>
      <all in="i/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="d/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pE" out="*p" symmetry="(x)" steps="2"/>
      <all in="p/E" out="*/p" symmetry="()" steps="1"/>
      <all in="pp/EE" out="**/**" symmetry="()"/>
      <one in="ppp/EEE" out="***/rrr" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <prl in="i" out="h"/>
      <!-- giardino e siepe, solo dove il terreno continua oltre -->
      <all in="[wvp]EEEEEE" out="*gg****" steps="1"/>
      <all in="gE/[wvpg]g" out="*g/**"/>
      <all in="gEEEE" out="*x***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <prl in="xr" out="xr"/>
      <!-- pozzo e alberi -->
      <one in="ggg/ggg/ggg" out="***/*q*/***" steps="1"/>
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***t***/*******/*******/*******" steps="4"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="h" value="c9a77a" name="pavimento di casa" area="house"/>
  <color symbol="w" value="e8dcc0" name="muro intonacato"/>
  <color symbol="s" value="8a6a45" name="zona della scala" area="house"/>
  <color symbol="a" value="b89060" name="pavimento dell'ala" area="house"/>
  <color symbol="v" value="d8c8a0" name="muro dell'ala"/>
  <color symbol="p" value="a07850" name="portico" area="porch"/>
  <color symbol="d" value="5a3a20" name="soglia"/>
  <color symbol="r" value="b0a490" name="vialetto"/>
  <color symbol="g" value="8fb060" name="giardino" area="garden"/>
  <color symbol="x" value="4a7a35" name="siepe"/>
  <color symbol="t" value="3d6b2a" name="albero"/>
  <color symbol="q" value="7a8a9a" name="pozzo"/>
  <color symbol="i" value="ff00ff" name="segno"/>
  <color symbol="m" value="ff00ff" name="segno"/>
  <color symbol="H" value="ff0000" name="centro"/>
</sequence>
```
