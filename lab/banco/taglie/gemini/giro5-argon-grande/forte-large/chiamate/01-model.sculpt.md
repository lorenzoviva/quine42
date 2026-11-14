# model.sculpt · gemini-4-argon · 32 s

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
Concept: Forte (medieval fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, and moat/well at larger sizes).
Parts & Letters:
- H, h: interior floor of the central keep (mastio), with s as the stair zone (4x2 cells along the back wall).
- w: stone walls of the central keep.
- a, v: side annex (arme / guardhouse) attached to the keep, with floor a and wall v (varies by seed side/position).
- c: courtyard (cortile) around the keep.
- W: outer curtain wall (mura di cinta) surrounding the courtyard.
- t: corner towers (torri angolari) on the outer corners of the curtain wall (number and corners vary with seed/size).
- d, n, G, r: main axis to the front (+y) — d: keep doorway, n: paved path across courtyard, G: gatehouse through curtain wall, r: road to edge.
- Q: courtyard well (pozzo) placed where courtyard is wide enough (Huge/Gargantuan).
- m: outer moat (fossato) outside the curtain wall where enough ground remains (Huge/Gargantuan).
What fits at each size:
- Large (20x20): Keep (9x8 or 9x9 inside) + side annex + compact courtyard + curtain wall + gatehouse + 1-2 corner towers.
- Huge (30x30) & Gargantuan (40x40): Courtyard expands outward, accommodates a well (Q), all 4 corner towers (t) of 4x4, and a water moat (m) around the fortress.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwavcdWtnGrQm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- Central Keep (mastio) interior: 3 behind H, 3 in front (+1 by chance), 4 to each side -> 9 wide, 7-8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="3"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <prl in="H" out="h"/>

      <!-- Keep walls -->
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- Side wing / annex (corpo di guardia) on one random side of the keep -->
      <one in="Ew/Ew/Ew/Ew" out="**/*a/*a/**" symmetry="(x)" steps="1"/>
      <all in="aE" out="*a" symmetry="(x)" steps="1"/>
      <all in="E/a" out="a/*" symmetry="()" steps="1"/>
      <all in="a/E" out="*/a" symmetry="()" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Stair zone inside the keep along the back wall (2 cells landing on left, 4x2 stair strip) -->
      <one in="wwwwwwwww/whhhhhhhh/whhhhhhhh" out="*********/***ssss**/***ssss**" symmetry="()" steps="1"/>

      <!-- Courtyard around keep and annex: 2 cells at Large, expands by 3 more where ground allows (Huge/Gargantuan) -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Outer curtain wall around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers: at Large, 2 random outer corners get 3x3 towers; where ground is wide (Huge+), all corners get 4x4 towers -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <all in="EEE/EEE/EEW" out="***/***/*t*"/>
      <all steps="2">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Well in the courtyard where a 4x4 patch of courtyard is free (fits at Huge and Gargantuan) -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q*/*c" out="**/*Q" steps="1"/>

      <!-- Entrance axis from the keep front straight to the south edge (+y) -->
      <one in="whw/hhh/hhh/hhh/www" out="***/***/***/***/*d*" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>

      <!-- Moat around the curtain wall and towers where at least 4 cells of ground remain to the edge (fits at Huge+) -->
      <all in="[Wt]EEEE" out="*mm**" steps="1"/>
      <all in="mE/*m" out="*m/**" steps="2"/>
    </sequence>
  </map>

  <color symbol="E" value="118,138,88" name="prato"/>
  <color symbol="H" value="185,155,115" name="sala del mastio"/>
  <color symbol="h" value="185,155,115" name="sala del mastio"/>
  <color symbol="s" value="160,125,85" name="vano scala"/>
  <color symbol="w" value="135,132,125" name="muro del mastio"/>
  <color symbol="a" value="175,145,105" name="corpo di guardia"/>
  <color symbol="v" value="125,122,115" name="muro del corpo di guardia"/>
  <color symbol="c" value="195,180,145" name="cortile"/>
  <color symbol="W" value="150,146,138" name="mura di cinta"/>
  <color symbol="t" value="118,115,108" name="torre angolare"/>
  <color symbol="d" value="110,75,45" name="portale del mastio"/>
  <color symbol="n" value="168,162,152" name="lastricato"/>
  <color symbol="G" value="105,102,96" name=" corpo di guardia del portone"/>
  <color symbol="r" value="158,142,112" name="strada"/>
  <color symbol="Q" value="85,125,155" name="pozzo"/>
  <color symbol="m" value="72,118,148" name="fossato"/>
</sequence>
```
