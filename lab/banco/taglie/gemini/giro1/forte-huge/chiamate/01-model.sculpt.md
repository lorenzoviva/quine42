# model.sculpt · gemini-4-argon · 24 s

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

```xml
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <!--
    Concept: forte (fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, barracks wing, and outer moat at gargantuan size).
    Plan letters:
      i, s: keep interior and stair zone (9x9 to 9x10 clear interior, surrounded by keep wall K)
      K, d: keep wall and keep door
      b, v, u: barracks/armory wing attached to a random side of the keep, its wall v, internal doorway u
      c, n, Q: courtyard around the keep, paved road n from keep door to gatehouse, courtyard well Q
      W, G, t: curtain wall (2 cells thick), gatehouse G on the front axis, corner towers t (3 to 4 towers varied by seed)
      r, p: road to the front edge, bridge p over moat
      a: outer moat around the fort (grows only where enough ground E remains, at gargantuan 40x40)
    Seeds change: keep depth, side and placement of the barracks wing, which corner towers rise, well position in the courtyard.
    Sizes:
      Large (20x20): keep + thin courtyard + curtain wall.
      Huge (30x30): full keep + barracks wing + expanded courtyard + well + 2-thick curtain wall + corner towers + gatehouse.
      Gargantuan (40x40): adds wider courtyard + outer moat (a) with bridge (p) and outer watch posts.
  -->
  <map scale="1/5 1/5 1" values="BHEisKdbvucnQWGtrpa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- 1. Central Keep body around H: 9 wide (4 each side of H), 9 or 10 deep -->
      <all in="E/[Hh]" out="i/*" symmetry="()" steps="4"/>
      <all in="H/E" out="*/i" symmetry="()" steps="1"/>
      <all in="i/E" out="*/i" symmetry="()" steps="4"/>
      <prl in="i/E" out="*/i" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hi]E" out="*i" symmetry="(x)" steps="4"/>
      <prl in="H" out="i"/>
      <all in="iE" out="*K"/>
      <all in="KE/*K" out="*K/**"/>

      <!-- Stair zone inside the keep: along back wall, 2 cells landing on small-x, 4 cells long (20 voxels), 2 cells wide (10 voxels) -->
      <one in="KKKKKKKKKKK/KiiiiiiiiiK/KiiiiiiiiiK" out="***********/***ssss****/***ssss****" symmetry="()" steps="1"/>

      <!-- 2. Barracks wing against a random side of the keep where space allows (at Huge & Gargantuan) -->
      <one in="KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE/KEEEEEEE" out="*******/*bbbbb*/*bbbbb*/*bbbbb*/*bbbbb*/*bbbbb*/*******" symmetry="(x)" steps="1"/>
      <all in="bE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>
      <one in="ib/ib/ib" out="*u/*u/*u" symmetry="(x)" steps="1"/>
      <all in="K/u" out="u/*" symmetry="(xy)" steps="1"/>

      <!-- 3. Courtyard around the keep and wing -->
      <all in="[Kv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Expand courtyard where ground allows (Huge and Gargantuan) -->
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEE" out="*cc*******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- 4. Curtain wall (1 cell at Large, 2 cells where room allows at Huge & Gargantuan) -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>
      <all in="WEE" out="*W*" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- 5. Corner towers on the outer corners of the curtain wall (4x4, only where space outside allows) -->
      <all in="EEE/EEW/EWW" out="***/**t/*tt"/>
      <!-- One corner may stay a low bastion by seed choice -->
      <one in="tt/tt" out="WW/WW" p="0.5" steps="1"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

      <!-- 6. Way out: from keep centre straight to the front (large y) -->
      <all in="i/K" out="*/d" symmetry="()" steps="1"/>
      <all in="dK" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- 7. Courtyard well in a 4x4 patch of free courtyard -->
      <one in="cccc/cccc/cccc/cccc" out="****/*QQ*/*QQ*/****" steps="1"/>

      <!-- 8. Outer moat at Gargantuan size (where at least 4 cells of E remain beyond the curtain wall) -->
      <all in="cWWEEEEE" out="***aa***" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/>
      <all in="aE/*a" out="*a/**"/>
      <all in="ra" out="*a" symmetry="(x)" steps="1"/>
      <prl in="a/r" out="p/*" symmetry="(xy)"/>
      <all in="pa" out="*p" symmetry="(xy)" steps="2"/>
    </sequence>
  </map>
  <color symbol="E" value="120,145,95" name="erba"/>
  <color symbol="H" value="180,170,150" name="centro"/>
  <color symbol="i" value="195,180,155" name="sala del mastio" area="keep"/>
  <color symbol="s" value="175,150,120" name="scala del mastio" area="keep"/>
  <color symbol="K" value="130,128,122" name="muro del mastio" area="keep"/>
  <color symbol="d" value="110,80,55" name="porta del mastio" area="keep"/>
  <color symbol="b" value="185,170,145" name="armeria" area="barn"/>
  <color symbol="v" value="140,135,128" name="muro dell'armeria" area="barn"/>
  <color symbol="u" value="120,90,60" name=" varco dell'armeria" area="barn"/>
  <color symbol="c" value="165,155,135" name="cortile" area="courtyard"/>
  <color symbol="n" value="150,145,138" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="95,125,145" name="pozzo" area="courtyard"/>
  <color symbol="W" value="145,142,135" name="cinta muraria" area="courtyard"/>
  <color symbol="G" value="125,120,115" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="115,112,108" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="160,148,125" name="strada" area="yard"/>
  <color symbol="p" value="135,100,65" name="ponte" area="yard"/>
  <color symbol="a" value="75,115,140" name="fossato" area="yard"/>
</sequence>
```
