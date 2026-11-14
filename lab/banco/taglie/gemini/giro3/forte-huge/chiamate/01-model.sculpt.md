# model.sculpt · gemini-4-argon · 34 s

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
  Concept: Forte (fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, and moat/outer works).
  Letters:
  - h, s, w, d: keep interior (h), stair zone (s), keep walls (w), keep door (d)
  - a, v: side wing/hall interior (a) and walls (v) attached to the keep, varying by seed
  - c, n, Q: courtyard (c), paved path (n), courtyard well/shrine (Q)
  - W, G, t: curtain wall (W), gatehouse (G), corner towers (t)
  - r: road to the front edge
  - m, p: outer moat (m) and bridge (p)
  What seeds change: keep front/back depth, wing placement and side, which corners get towers or bastions, courtyard well placement.
  What fits by size:
  - Large (20x20): keep + stair + tight yard + curtain wall + gatehouse.
  - Huge (30x30): expanded keep/wing + wider courtyard with well (Q) + curtain wall with corner towers (t) + gatehouse.
  - Gargantuan (40x40): full fort + wider courtyard + corner towers + outer moat (m) and bridge (p) around the fort.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhswdavcnQWGtrmp" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (h interior, w walls) around H -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Stair zone inside the keep: 4 long (x), 2 wide (y), with 2 cells landing before and after -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Optional side wing on the keep where space permits (Huge & Gargantuan), varying by seed -->
      <one in="wEEEEEE/wEEEEEE/wEEEEEE/wEEEEEE/wEEEEEE" out="*aaa***/*aaa***/*aaa***/*aaa***/*aaa***" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <all in="wv" out="*v"/>

      <!-- Inner courtyard (c) around the keep and wing -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard where ground is ample (Huge & Gargantuan) -->
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEE" out="*ccc*****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Curtain wall (W) around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers (t) on the outer corners of the curtain wall where space allows -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <all in="t[EW]" out="*t" steps="1"/>
      <all in="t*/*[EW]" out="**/*t" steps="1"/>
      <!-- Seed variation: one corner tower grows into a larger bastion -->
      <one in="ttt/ttt/ttt" out="ttt/ttt/ttt" steps="1"/>

      <!-- Way out: from keep interior straight to the front (+y) -->
      <all in="H/h" out="*/d" symmetry="()" steps="1"/>
      <all in="d/[hw]" out="*/d" symmetry="()"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <!-- Widen door, path, gatehouse and road to 3 cells -->
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <!-- Restore interior markers -->
      <prl in="d/d" out="h/*" symmetry="()"/>
      <prl in="H" out="h"/>

      <!-- Courtyard well/cistern (Q) in open courtyard space (fits at Huge and Gargantuan) -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>

      <!-- Outer moat (m) and bridge (p) only where extra ground exists beyond the towers (Gargantuan) -->
      <all in="[WGt]EEEEE" out="*mm***" steps="1"/>
      <all in="mE/*[WGt]" out="*m/**"/>
      <all in="mE/*m" out="*m/**" steps="2"/>
      <all in="mr" out="*p"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>
    </sequence>
  </map>
  <color symbol="E" value="#7a8c56" name="erba" hidden="True"/>
  <color symbol="H" value="#b89f72" name="centro"/>
  <color symbol="h" value="#b89f72" name="sala del mastio" area="keep"/>
  <color symbol="s" value="#a3885c" name="scala del mastio" area="keep"/>
  <color symbol="w" value="#8c877e" name="muro del mastio" area="keep"/>
  <color symbol="d" value="#6e4e32" name="porta del mastio" area="keep"/>
  <color symbol="a" value="#c2a97e" name="ala del forte" area="keep"/>
  <color symbol="v" value="#7d7870" name="muro dell'ala" area="keep"/>
  <color symbol="c" value="#b5aa94" name="cortile" area="courtyard"/>
  <color symbol="n" value="#9c9382" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="#526978" name="pozzo" area="courtyard"/>
  <color symbol="W" value="#757067" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#635e56" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#5c574f" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="#9c9382" name="strada" area="yard"/>
  <color symbol="m" value="#4a6e7d" name="fossato" area="yard"/>
  <color symbol="p" value="#755638" name="ponte" area="yard"/>
</sequence>
