# model.sculpt · claude-sonnet-5-5 · 212 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · size huge (7.5 × 7.5 × 6 tiles, 20 voxels per tile) · box 150 × 150 × 120 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 7.5 × 7.5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size gargantuan (box 200 × 200 × 160, 10 × 10 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

<!--
FORTE: the parts and where each goes (plan letters, 1 cell = 5 voxels)
- keep h/H (floor), w (walls), d (door): around the centre H, 9 cells wide inside, 9 or 10 deep (the back end grows one more by chance).
  The door d is 3 cells wide in the middle of the front wall.
- stair zone s: inside the keep, along the back wall, 2 cells of landing, 4 long and 2 wide, climbing toward large x.
- yard c: a ring around the keep. It grows 4 cells wider on every side where 6 cells of ground go on past it (Huge and up).
- curtain wall W: one cell thick around the yard, corners filled.
- towers t: 3 x 3 on the outer corners of the wall. 2 are certain, a third and a fourth come by chance, and the seed picks which corners.
- gate G: through the wall on the axis of the keep door. Paving n crosses the yard, road r runs on to the edge, all 3 wide.
- annex a: a barracks 2 x 5 against the inside of the wall, on a side chosen by the seed (2 of them, only where the yard is wide enough).
- well Q: in 5 x 5 of free yard.
- moat x: 2 cells outside the wall only where 5 cells of ground go on past it (Gargantuan). The road crosses it as a causeway.
- trees q: 7 x 7 of lawn beyond the moat (Gargantuan).
What fits: Large = keep inside a thin ring with towers and the gate (nothing else fits).
Huge = a wide yard with 2 annexes and a well.
Gargantuan = the same plus moat and trees.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwdcWtGnraxQqs" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, 3 behind (one more by chance), 5 in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <!-- the door seed on the front end of the line -->
      <all in="h/E" out="*/d" symmetry="()" steps="1"/>
      <!-- 4 cells to each side of the line -->
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <!-- the zone of the stair: on the back wall, 2 cells from the left wall -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <!-- the yard around the keep -->
      <all steps="1"><rule in="wE" out="*c"/><rule in="dE" out="*c"/></all>
      <all in="cE/*c" out="*c/**"/>
      <!-- wider yard where the ground goes on -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- the curtain wall, one cell thick -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <!-- towers on the outer corners: 2 sure, then by chance -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.7"/></one>
      <one steps="1"><rule in="EE/EW" out="**/*t" p="0.5"/></one>
      <all steps="1"><rule in="t[EWc]" out="*t"/><rule in="t*/*[EWc]" out="**/*t"/></all>
      <!-- the way out: door, paving, gate, road to the edge -->
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- two annexes against the inside of the wall, where the yard is wide -->
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <one in="Wcc/Wcc/Wcc/Wcc/Wcc" out="*aa/*aa/*aa/*aa/*aa" steps="1"/>
      <!-- a well in 5 x 5 of yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <!-- the moat, only where the ground goes on past the wall -->
      <all in="cWEEEEE" out="**xx***" steps="1"/>
      <all in="xE/*x" out="*x/**"/>
      <!-- trees in 7 x 7 of free lawn -->
      <one in="EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE/EEEEEEE" out="*******/*******/*******/***q***/*******/*******/*******" steps="3"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="7FA35A" name="terra" hidden="True"/>
  <color symbol="H" value="D8C08A" name="centro del mastio" area="keep"/>
  <color symbol="h" value="C9B28A" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="8E8A82" name="muro del mastio"/>
  <color symbol="d" value="5B3A29" name="porta del mastio"/>
  <color symbol="c" value="9FB36B" name="cortile" area="courtyard"/>
  <color symbol="W" value="6F6B66" name="muro di cinta"/>
  <color symbol="t" value="4F4C4A" name="torre" area="tower"/>
  <color symbol="G" value="3F3C3A" name="porta fortificata"/>
  <color symbol="n" value="C2A878" name="lastricato"/>
  <color symbol="r" value="B08D57" name="strada"/>
  <color symbol="a" value="B5483A" name="alloggio" area="barracks"/>
  <color symbol="x" value="4A90B8" name="fossato"/>
  <color symbol="Q" value="3B6E8F" name="pozzo" area="well"/>
  <color symbol="q" value="3E7D3A" name="albero" area="orchard"/>
  <color symbol="s" value="D96B2B" name="zona della scala"/>
</sequence>
