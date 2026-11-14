# model.sculpt · gemini-4-carbon · 44 s

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
<!--
Concept: Forte (medieval fort with courtyard, curtain wall, corner towers, gatehouse, central keep, side annex, well, moat & bridge).
Parts & plan letters:
- h, w, s, d: Keep interior (h), keep walls (w), stair strip (s, 4x2 along back wall with landing before & after), keep front door (d).
- a, v, e: Low roofed hall annex (armory/barracks) attached to a side of the keep (a interior, v walls, e door into keep).
- c, n, Q: Courtyard (c) around the keep and annex; paved path (n) from keep door to gatehouse; stone well (Q) where yard is wide enough.
- W, t, p, G: Curtain wall (W, 2 cells thick) with corner towers (t, 4x4 on 2-4 corners) and a tall watchtower turret (p) on one corner; front gatehouse (G, 5 wide with portal).
- r, m, b: Approach road (r) straight to front edge; at Gargantuan (40x40), where ground extends 4+ cells past the curtain wall, a water moat (m, 2 cells wide) rings the fort, crossed by a wooden bridge (b).
Seed variations:
- Keep shifts X (-1, 0, +1) and varies width (8 or 9 cells) and depth (8 or 9 cells).
- Side annex attaches to left or right wall of the keep at variable depth.
- Corner towers appear on 2 to 4 corners, with one chosen at random as the taller watchtower turret (p).
- Well (Q) placed randomly in an open 4x4 courtyard patch.
What fits by size:
- Huge (30x30): Keep + side annex + courtyard + curtain wall + corner towers + gatehouse + well + road.
- Gargantuan (40x40): Courtyard expands outward where extra ground exists, surrounded by a full water moat (m) and bridge (b), plus larger courtyard space.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwsdavcenQWtpGrmbxyz" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- Shift center slightly left/right or stay centered by seed -->
      <one in="EHE" out="x*E" p="0.66" steps="1"/>
      <one in="xHE" out="Ex*" p="0.5" steps="1"/>
      <prl in="x" out="E"/>

      <!-- Keep spine: shifted toward the back so courtyard opens in front -->
      <all in="E/[Hh]" out="h/*" steps="5"/>
      <all in="[Hh]/E" out="*/h" steps="2"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1"/>

      <!-- Keep width: 4 left, 3 or 4 right (interior 8..9 wide x 8..9 deep, 40..45 voxels clear) -->
      <all in="Eh" out="h*" steps="4"/>
      <all in="hE" out="*y" steps="1"/>
      <prl in="yE" out="*z" p="0.5" steps="1"/>
      <all in="yh" out="*h"/>
      <all in="y" out="h"/>
      <all in="zh" out="*h"/>
      <all in="z" out="h"/>
      <all in="[Hh]E" out="*h" steps="2"/>
      <prl in="H" out="h"/>

      <!-- Keep walls (w) -->
      <all in="hE" out="*w" symmetry="(xy)"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- Stair zone inside keep along back wall: 2 cells landing on left, 4 cells stair (s), 2+ cells landing on right -->
      <one in="wwwwwwww/whhhhhhh/whhhhhhh" out="********/whhssssh/whhssssh" steps="1"/>

      <!-- Side hall annex (armory/barracks) on left or right wall of keep -->
      <one in="Ew/Ew/Ew/Ew/Ew/Ew" out="**/**/a*/a*/**/**" symmetry="(x)" steps="1"/>
      <all in="Ea" out="a*" symmetry="(x)" steps="2"/>
      <all in="E/a" out="a/*" steps="1"/>
      <all in="a/E" out="*/a" steps="1"/>
      <all in="aE" out="*v" symmetry="(xy)"/>
      <all in="vE/*v" out="*v/**" symmetry="(xy)"/>
      <!-- Shared doorway between keep and annex -->
      <one in="hva" out="*e*" symmetry="(x)" steps="1"/>
      <all in="w/e" out="e/*" symmetry="(y)" steps="1"/>

      <!-- Courtyard (c) around keep and annex: 2 cells base, plus 2 more in front -->
      <all in="[wv]E" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="cE" out="*c" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <all in="c/E" out="*/c" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Expand courtyard where ample ground remains (Gargantuan 40x40) -->
      <all in="cEEEEEEEE" out="*cc******" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- Curtain wall (W, 2 cells thick) -->
      <all in="cE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>
      <all in="WE" out="*W" symmetry="(xy)" steps="1"/>
      <all in="WE/*W" out="*W/**" symmetry="(xy)"/>

      <!-- Corner towers (t, 4x4): guaranteed on front corners, optional on back corners -->
      <all in="WE/EE" out="*t/**" symmetry="(x)"/>
      <one in="EE/EW" out="**/*t" symmetry="(x)" steps="1"/>
      <prl in="EE/EW" out="**/*t" p="0.5" symmetry="(x)" steps="1"/>
      <all steps="2" symmetry="(xy)">
        <rule in="t[EWc]" out="*t"/>
        <rule in="t*/*[EWc]" out="**/*t"/>
      </all>

      <!-- Promote one corner tower to a taller watchtower turret (p) -->
      <one in="tttt/tttt/tttt/tttt" out="pppp/pppp/pppp/pppp" steps="1"/>

      <!-- Way out: straight forward from front keep wall (d -> n -> G -> r) -->
      <one in="hhhhh/wwwww/ccccc" out="*****/**d**/*****" steps="1"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="[dn]/c" out="*/n"/>
      <all in="[nG]/W" out="*/G"/>
      <all in="[Gr]/E" out="*/r"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="2"/>

      <!-- Stone well (Q) in an open 4x4 courtyard area -->
      <one in="cccc/cccc/cccc/cccc" out="****/*Q**/****/****" steps="1"/>
      <all in="Qc" out="*Q" steps="1"/>
      <all in="Q/c" out="*/Q" steps="1"/>

      <!-- Outer water moat (m) and wooden bridge (b) only where 4+ ground cells remain outside (Gargantuan) -->
      <all in="cWWEEEE" out="***mm**" symmetry="(xy)" steps="1"/>
      <all symmetry="(xy)" steps="40">
        <rule in="m/W/E" out="*/*/m"/>
        <rule in="m/t/E" out="*/*/m"/>
        <rule in="m/p/E" out="*/*/m"/>
        <rule in="mE/WW" out="*m/**"/>
        <rule in="mE/tt" out="*m/**"/>
        <rule in="mE/pp" out="*m/**"/>
        <rule in="mE/Wt" out="*m/**"/>
        <rule in="mE/Wp" out="*m/**"/>
        <rule in="mr/GG" out="*b/**"/>
        <rule in="br/GG" out="*b/**"/>
        <rule in="br/WW" out="*b/**"/>
      </all>
      <all in="[WtGpb]mE" out="**m" symmetry="(xy)" steps="1"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)"/>
      <all in="bm/br" out="*b/*b" symmetry="(x)"/>
      <all in="mr/mb" out="bb/*b" symmetry="(x)"/>
    </sequence>
  </map>

  <color symbol="E" value="124,148,92" name="erba" area="field"/>
  <color symbol="H" value="180,160,120" name="centro" area="keep"/>
  <color symbol="h" value="196,174,136" name="sala del mastio" area="keep"/>
  <color symbol="w" value="138,136,132" name="muro del mastio" area="keep"/>
  <color symbol="s" value="164,132,94" name="scala interna" area="keep"/>
  <color symbol="d" value="112,74,46" name="porta del mastio" area="keep"/>
  <color symbol="a" value="184,162,126" name="armeria" area="hall"/>
  <color symbol="v" value="148,144,138" name="muro dell'armeria" area="hall"/>
  <color symbol="e" value="120,82,52" name="passaggio interno" area="hall"/>
  <color symbol="c" value="172,162,138" name="cortile" area="courtyard"/>
  <color symbol="n" value="154,148,138" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="96,118,138" name="pozzo" area="courtyard"/>
  <color symbol="W" value="126,124,120" name="mura di cinta" area="wall"/>
  <color symbol="t" value="116,114,112" name="torre angolare" area="tower"/>
  <color symbol="p" value="104,102,102" name="torre di guardia" area="tower"/>
  <color symbol="G" value="132,126,118" name="corpo di guardia" area="gate"/>
  <color symbol="r" value="162,146,116" name="strada" area="road"/>
  <color symbol="m" value="74,118,148" name="fossato" area="moat"/>
  <color symbol="b" value="134,96,60" name="ponte di legno" area="bridge"/>
  <color symbol="x" value="200,100,100" name="segno x"/>
  <color symbol="y" value="200,100,100" name="segno y"/>
  <color symbol="z" value="200,100,100" name="segno z"/>
</sequence>
```
