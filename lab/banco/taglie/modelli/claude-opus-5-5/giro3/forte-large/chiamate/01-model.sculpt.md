# model.sculpt · claude-opus-5-5 · 40 s

## Richiesta

Sculpt: forte
What it looks like: forte: a building one enters, with the door at the front
Class: structure · box 100 × 100 × 80 voxels · at least 40 tall
Body: a tile is 20 voxels, a step 4, a person 30 tall; the area is 5 × 5 tiles.
Parts that never shrink, at every size: a door at least 11 × 30, a room at least 28 a side under a ceiling at least 30 up, a lean-to at least 30 clear and 20 deep (1.4 tiles a room). Build what fits at their measure: if the whole building does not fit, build less of it, not a smaller one (a small fort is one tower with a wide base, a small farm a house with a lean-to and the hay behind).
The same program also serves the size huge (box 150 × 150 × 120, 7.5 × 7.5 tiles, a tile is 20 voxels, a step 4, a person 30 tall): there it must contain more, another kind of part or a quarter more parts (an annex, a fence, fields, a wall, towers), not the same building bigger. It runs with 4 seeds: each one is another building of the same kind.

Parts of the seed the program includes with <import file="…"/> (each says what it reads and writes; never use S nor #90-#97):
- <import file="part-battlements"/>: Battlements (part-battlements): a part included with <import file="part-battlements"/> after your walls have risen. On the edge of every flat top of your walls (the union "+": <union symbol="+" values="…"/> in your program wins over this one) it puts merlons of 5 and gaps of 3, 6 high and one thick, regular from every corner (a corner is always a merlon; where two runs meet in the middle of a side the odd cells go to the merlons). Its letters: M the merlons (give M your colour), #90 and #91 its own markers.
- <import file="part-door"/>: The door (part-door): a part one lives in, included with <import file="part-door"/> after your walls have risen. You write the seed of the door with O: at least 11 wide, at the foot of a wall and through its whole thickness, on the layer of the floor, with wall above it. The door rises 30 through the wall (as tall as a person), gets its lintel and its jambs (N) and its dark planks (o). Its letters: O the door and o the planks (yours: give them your colours), N the frame; the union "+" is the letters of your walls (<union symbol="+" values="…"/> in your program wins over this one). The actions that open and close it are yours (<action name="open"> on O and o).
- <import file="part-slits"/>: Arrow slits (part-slits): a part included with <import file="part-slits"/> after part-battlements. Under the middle of every merlon of 5 (M) it opens a slit through the wall (the union "%": the letters of the walls that get slits, <union symbol="%" values="…"/> in your program wins over this one): one wide, 6 high, two cells under the top; regular because the merlons are. Its letter: U the slit (give U your colour); #91, #92 and #94 its own markers.
- <import file="part-stair"/>: The stair (part-stair): a part one lives in, included with <import file="part-stair"/> after your walls, floors and slabs have risen. You mark the strip of the stair with T, with a rule of yours written with symmetry="()": at least 16 long (x) and 10 wide (y), in the air just above a floor (a storey is 32: the stair is twice as high as it is long). The stair takes the first 16 cells from the small-x end of the strip and gives the rest back to the air, climbs toward large x two voxels up for one forward (a body climbs it at every size), opens the slab above those 16 cells (through a slab of any thickness) and is solid under the steps. A body climbs it only in line: leave at least 10 voxels of free floor before the small-x end (it walks onto the first step from there, not from the side) and floor past the 16th cell, where the stair comes out onto the floor above. Its letters: T the strip (yours), k the steps (give k the colour you want), #90, #91 and #92 its own markers; the union "=" is the letters of your floors and slabs (<union symbol="=" values="…"/> in your program wins over this one). The door is yours.

## Block 1 of 2: the composition. Begin with a few comment lines (the parts of this concept, their letters, where each goes relative to the others, what the seeds change, what fits at each size), then write the root, the first map and level A only: the plan on the coarse grid, no second map. Give every plan letter a <color> with a name. XML only.

## Risposta

```xml
<!--
FORTE. Parts and letters on the plan (a cell = 5 voxels):
  H centre; h the floor of the keep (mastio) around H; w its walls.
  c the courtyard ring around the keep; W the curtain wall, two cells thick, around the courtyard.
  t a square tower on every outer corner of the curtain.
  m the axis from H to the front (temporary); d the door of the keep; n the paving across the yard;
  G the gatehouse through the curtain, taller than it; r the road from the gate straight to the edge of the box.
  x the moat, only where ground goes on beyond the curtain. Q the well, as far from the gate as the yard allows.
  s the zone of the stair inside the keep, against its back wall.
Relations: keep at the centre, yard around it, curtain around the yard, towers at the corners,
  gate and road on the axis of the keep door, well far from the gate, moat outside the curtain.
Seeds change: the depth of the keep (one more cell in front or not), so the yard and the tower corners shift.
  They also change where the stair zone sits along the back wall.
Sizes: at 5x5 tiles the plan holds a keep in a thin ring with corner towers.
  At 7.5 the yard grows wider and holds a well.
  At 10 a moat surrounds the curtain and the road crosses it.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtmdnGrxQs" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep around the centre -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <!-- the courtyard, one cell, growing where the area allows -->
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <!-- the moat, measured outward from the yard, only where ground goes on -->
      <all in="cEEEEEE" out="***xx**" steps="1"/>
      <!-- the curtain wall, two thick -->
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <!-- close the moat ring -->
      <all in="[Wt]E/*x" out="**/*x"/><all in="xE/*x" out="*x/**"/>
      <!-- corner towers -->
      <all in="EE/EW" out="**/*t"/>
      <all in="xx/xW" out="**/*t"/>
      <all steps="2"><rule in="t[EWx]" out="*t"/><rule in="t*/*[EWx]" out="**/*t"/></all>
      <!-- the way out, from the centre to the front edge -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/[Ex]" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Ex]" out="*r" symmetry="(x)" steps="1"/>
      <prl in="m" out="h"/>
      <!-- the well, far from the gate, where 5x5 of yard is free -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1">
        <field for="Q" from="n" on="cn"/>
      </one>
      <!-- the stair zone against the back wall of the keep -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="H" value="8a7a66" name="centro del mastio" area="keep"/>
  <color symbol="h" value="9c8b72" name="pavimento del mastio" area="keep"/>
  <color symbol="w" value="7d7a74" name="muro del mastio"/>
  <color symbol="c" value="b8a678" name="cortile" area="courtyard"/>
  <color symbol="W" value="8f8c84" name="cinta muraria"/>
  <color symbol="t" value="6e6b66" name="torre d'angolo" area="tower"/>
  <color symbol="m" value="ff00ff" name="asse"/>
  <color symbol="d" value="7a4a2a" name="porta del mastio"/>
  <color symbol="n" value="a8a090" name="selciato"/>
  <color symbol="G" value="5e5b57" name="torre della porta" area="gatehouse"/>
  <color symbol="r" value="b09a6a" name="strada"/>
  <color symbol="x" value="4a7fa8" name="fossato"/>
  <color symbol="Q" value="4f6e8a" name="pozzo"/>
  <color symbol="s" value="a0703a" name="zona della scala"/>
</sequence>
```
