# model.sculpt · gemini-4-argon · 33 s

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
  Concept: Forte (medieval fortress with central keep, side wing, courtyard, curtain wall, corner towers, gatehouse, moat).
  Letters:
    h, s, w, d: keep interior (h), stair zone (s), keep walls (w), keep door (d).
    a, v, e: side wing interior (a), wing walls (v), shared doorway (e).
    c, n, Q: courtyard (c), paved path (n), courtyard well (Q).
    W, G, t: curtain wall (W), gatehouse (G), corner towers (t).
    m, r: outer moat (m) and bridge/road to the front edge (r).
  What seeds change: keep depth/width, side and position of the wing, position of the stair and well.
  What fits by size:
    Large (20x20): Keep with wing, tight yard, curtain wall, gatehouse.
    Huge (30x30): Expanded courtyard with well, 4 corner towers on the curtain wall.
    Gargantuan (40x40): Further expanded courtyard and a water moat surrounding the curtain wall and towers.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavecQWGtnmr" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep: 9 to 10 cells wide, 9 to 10 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="hE/*h" out="*h/**"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing attached to keep (random side and position) -->
      <one in="Ew/Ew/Ew/Ew/Ew" out="**/**/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" symmetry="()" steps="2"/>
      <all in="a/E" out="*/a" symmetry="()" steps="2"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="aw" out="*e" symmetry="(x)"/>
      <all in="a[Ew]" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stair zone inside the keep: 4 cells along X, 2 along Y, with 2 cells landing before it -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- Initial courtyard around keep and wing -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard if Huge (30x30) or larger -->
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Expand courtyard again if Gargantuan (40x40) -->
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Curtain wall around courtyard -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers (4x4) only where enough room remains (Huge and Gargantuan) -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- Moat around curtain wall and towers where ground goes on (Gargantuan) -->
      <all in="cWEEEEE" out="**mm***" steps="1"/>
      <all in="[Wt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**"/>
      <all in="mE" out="*m" steps="1"/>
      <all in="mE/*m" out="*m/**"/>

      <!-- Way out from H straight to the front edge -->
      <all in="[Hh]/h" out="*/n" symmetry="()"/>
      <all in="n/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/[Wt]" out="*/G" symmetry="()"/>
      <all in="[Gr]/[Em]" out="*/r" symmetry="()"/>

      <!-- Widen door, path, gatehouse and road to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="G[Wt]" out="*G" symmetry="(x)" steps="1"/>
      <all in="r[Em]" out="*r" symmetry="(x)" steps="1"/>

      <!-- Clean temporary path inside keep -->
      <prl in="H" out="h"/>
      <prl in="h/n/h" out="*/h/*" symmetry="()"/>
      <prl in="n/d" out="h/*" symmetry="()"/>

      <!-- Courtyard well where a 4x4 patch of yard is free -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" value="#7a8c56" name="erba"/>
  <color symbol="H" value="#c8b89a" name="centro"/>
  <color symbol="h" value="#c8b89a" name="sala del mastio" area="keep"/>
  <color symbol="s" value="#b09070" name="scala del mastio" area="keep"/>
  <color symbol="w" value="#8c8880" name="muro del mastio" area="keep"/>
  <color symbol="d" value="#6e4e32" name="porta del mastio" area="keep"/>
  <color symbol="a" value="#bfa888" name="ala laterale" area="keep"/>
  <color symbol="v" value="#7a7670" name="muro dell'ala" area="keep"/>
  <color symbol="e" value="#9c7a54" name="passaggio interno" area="keep"/>
  <color symbol="c" value="#b8ae9c" name="cortile" area="courtyard"/>
  <color symbol="n" value="#9e9484" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="#4a6e82" name="pozzo" area="courtyard"/>
  <color symbol="W" value="#706c66" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#5c5852" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#524e48" name="torre d'angolo" area="tower"/>
  <color symbol="m" value="#3d6b82" name="fossato"/>
  <color symbol="r" value="#8c7e68" name="strada"/>
</sequence>
