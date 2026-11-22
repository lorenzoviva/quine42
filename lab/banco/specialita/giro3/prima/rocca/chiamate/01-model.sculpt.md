# model.sculpt · piano · gemini-4-argon · 27 s · 7598 token d'ingresso (5549 in cache), 1879 d'uscita, 0 di ragionamento · $0.02

## Richiesta

Sculpt: rocca di confine
What it looks like: rocca di confine: a building one enters, with the door at the front, with a cellar under it
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 16 voxels, a step 3, a person 24 tall; the area is 6.25 × 6.25 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.75 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 9.375 × 9.375 tiles, a tile is 16 voxels, a step 3, a person 24 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.
It is a fortification: merlons (part-battlements) and arrow slits (part-slits) belong to it.
It has a cellar under it: the box goes 20 voxels (1.25 tiles) under the soil, which the kernel writes at z=20; z=0 to 19 are under the ground. Dig it with part-cellar: mark D under the floor of a room on the soil, away from the door and from the foot of the stair, then include part-cellar after the floors rise and before part-stair, and give D, V and k your colours. The cellar must hold: a body goes down to it on foot from the door, and every floor down there is reached; if it does not, the building comes in without it.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-cellar"/>: The cellar (part-cellar): a part one lives in under the ground, included with <import file="part-cellar"/> after your floors have risen and before part-stair, when the request asks for a cellar: the box then has that many voxels under the soil. You mark with D the first layer under the soil, under the floor of the rooms the cellar goes under, before anything else is written there: <all in="h B" out="* D"/> under a plan letter h on the soil, before it rises. D must hold 44 × 14 at least (44 along x) and room beside the stair, and stay 10 voxels back from your front wall: the floor opens over the upper treads (20 × 10 for a cellar of one tile), and one walks between them and the door. It digs the cellar down to the bottom of the box: D is its floor, V its walls, two thick along its edge; from a landing of 5, its stair climbs along its front wall (the side of large y) toward large x by treads of 5 and risers of 3 until your floor, with 5 of floor past its top (a deeper cellar needs a longer room: a tread more for every 3 voxels). Without room under the soil it does nothing. Its letters: D (yours, then the floor of the cellar), V the walls, k the steps (give D, V and k your colours), #90-#93 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one).
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
  Rocca di confine (border fortress with cellar):
  - Main keep (mastio): rear interior 'h' (over the cellar 'D', 45x20 voxels), front hall 'f' (10 voxels deep before cellar), stair zone 's' (20x10 voxels along rear wall), keep walls 'w', main door 'd'.
  - Attached watchtower (torre di guardia) 't' with wall 'u', placed on one of the rear corners of the keep.
  - Side bastion wing (bastione laterale) 'a' with wall 'v', attached to a side of the keep.
  - Seeds change: keep depth (3 or 4 rear cells), which side the bastion wing grows on, which corner the watchtower stands on, and whether a secondary corner buttress 'b' grows.
  - Size difference:
    * At Large (20x20 plan): Keep + watchtower + side bastion + paved forecourt 'c' and road 'r' to the front edge.
    * At Huge (30x30 plan): Outer bailey courtyard 'c' expands around the keep, enclosed by a fortified curtain wall 'W' with corner watch-turrets 'q', a front gatehouse 'G', and a timber lean-to armory 'p' inside the yard.
-->
<sequence values="BHEhfsdwutavbcWqpGr" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhfsdwutavbcWqpGr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Main keep core: 9 cells wide (45 voxels >= 44 for cellar), 3-4 cells behind H, 2 cells in front -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]/E" out="*/f" symmetry="()" steps="2"/>
      <prl in="H" out="h"/>
      <all in="hE" out="*h" symmetry="(x)" steps="4"/>
      <all in="fE" out="*f" symmetry="(x)" steps="4"/>

      <!-- Keep walls 'w' -->
      <all in="[hf]E" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone 's' along the rear wall of the keep (4 cells along x, 2 cells along y) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Corner watchtower 't' (interior) and 'u' (wall) on one rear corner of the keep -->
      <one in="EEE/Eww/Ewh" out="uuu/utw/utw" symmetry="(x)" steps="1"/>
      <all in="E[tu]" out="u*" symmetry="(xy)" steps="1"/>

      <!-- Side bastion wing 'a' (interior) and 'v' (wall) on one flank of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="a*/a*/a*/a*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Optional opposite flank buttress tower 'b' -->
      <one in="Ew/Ew/Ew" out="**/*b/**" symmetry="(x)" steps="1"/>
      <all in="bE" out="*b" symmetry="(xy)" steps="1"/>

      <!-- Huge size expansion: outer bailey courtyard 'c' where 5+ cells of ground remain -->
      <all in="[wuvb]EEEEE" out="*ccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEE" out="*cc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall 'W' around the bailey courtyard (only forms when 'c' exists and has ground beyond) -->
      <all in="cEE" out="*WE" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner turrets 'q' on the outer curtain wall -->
      <all in="EE/EW" out="**/*q"/>
      <all steps="1">
        <rule in="q[EW]" out="*q"/>
        <rule in="q*/*[EW]" out="**/*q"/>
      </all>

      <!-- Timber lean-to shed 'p' inside the bailey courtyard at Huge -->
      <one in="Wcccc/Wcccc/Wcccc/Wcccc" out="Wpppp/Wpppp/Wpppp/Wpppp" symmetry="(xy)" steps="1"/>

      <!-- Front doorway 'd' of the keep, gatehouse 'G' in the curtain wall, and road 'r' to the front edge -->
      <all in="f/w" out="*/d" symmetry="()" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dr]/c" out="*/r" symmetry="()"/>
      <all in="[rc]/W" out="*/G" symmetry="()"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="[dGr]/E" out="*/r" symmetry="()"/>
      <all in="r[cE]" out="*r" symmetry="(x)" steps="1"/>
    </sequence>
  </map>

  <color symbol="E" value="#7a8f52" name="erba"/>
  <color symbol="H" value="#c8b08a" name="centro"/>
  <color symbol="h" value="#c8b08a" name="sala sopra la cantina" area="keep"/>
  <color symbol="f" value="#bfa57e" name="ingresso del mastio" area="keep"/>
  <color symbol="s" value="#9e7a52" name="vano scala" area="keep"/>
  <color symbol="d" value="#6b4428" name="soglia del mastio" area="keep"/>
  <color symbol="w" value="#8c8881" name="muro del mastio" area="keep"/>
  <color symbol="u" value="#75716b" name="muro della torre" area="tower"/>
  <color symbol="t" value="#b59d78" name="camera della torre" area="tower"/>
  <color symbol="a" value="#b09975" name=" camera del bastione" area="keep"/>
  <color symbol="v" value="#7e7a74" name="muro del bastione" area="keep"/>
  <color symbol="b" value="#696560" name="contrafforte" area="keep"/>
  <color symbol="c" value="#b8a88a" name="cortile della rocca" area="courtyard"/>
  <color symbol="W" value="#706c66" name="cinta muraria" area="courtyard"/>
  <color symbol="q" value="#5e5a55" name="torretta d'angolo" area="tower"/>
  <color symbol="p" value="#8c6239" name="tettoia d'arme" area="courtyard"/>
  <color symbol="G" value="#857f78" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#9e927d" name="strada lastricata" area="road"/>
</sequence>
```
