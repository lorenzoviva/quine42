# model.sculpt · gemini-4-carbon · 32 s

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
Concept: Forte (medieval fort).
Parts and plan letters:
- Keep (mastio): interior floor 'h', stair zone 's' (4x2 along a wall), keep walls 'k', keep door 'd', attached watch turret 'u' on one keep corner.
- Side annex (armeria / hall): interior 'a', annex walls 'v', attached to one side of the keep when space permits.
- Courtyard (cortile): 'c' around the keep and annex, paved path 'n' from keep door to gatehouse, optional courtyard well 'q' and portico/lean-to 'p' when courtyard has room.
- Curtain wall & towers: thick wall 'w' (2 cells), corner towers 't' (3x3 or 4x4) on 2 to 4 outer corners, front gatehouse 'g' (3 cells wide) on the axis, road 'r' to the front edge, bridge 'b' across the moat.
- Outer moat (fossato): water ring 'm' around the curtain wall and towers when outer ground 'E' extends far enough (Gargantuan 40x40).
What seeds change: keep proportions (8-9 wide, 7-8 deep) and x-offset, which side gets the annex 'a', which keep corner gets the tall watch turret 'u', tower sizes/positions, placement of stair 's', well 'q' and portico 'p'.
What fits by size:
- Huge (30x30): Keep (with stair + watch turret) + annex or compact yard + curtain wall + corner towers + gatehouse + road (well/portico if yard fits).
- Gargantuan (40x40): Expanded courtyard + annex + portico + well + curtain wall + 4 corner towers + surrounding water moat 'm' crossed by bridge 'b'.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhskduavcnqpwtrgbm" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="()">
      <!-- 1. Keep interior 'h' slightly towards the back of H, 8 or 9 wide, 7 or 8 deep -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="2"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="3"/>
      <one in="hE/hE/hE/hE/hE/hE/hE" out="*h/*h/*h/*h/*h/*h/*h" symmetry="(x)" steps="1"/>
      <all in="hE/*h" out="*h/**" symmetry="(xy)"/>
      <prl in="H" out="h"/>

      <!-- Keep walls 'k' around 'h' -->
      <all in="hE" out="*k" symmetry="(xy)"/>
      <all in="kE/*k" out="*k/**" symmetry="(xy)"/>

      <!-- Stair zone 's' inside keep: 2 cells landing on small-x, 4 cells stair, floor on large-x -->
      <one in="kkkkkkkk/khhhhhhh/khhhhhhh" out="********/***ssss*/***ssss*" symmetry="()" steps="1"/>

      <!-- Tall watch turret 'u' (3x3) on one back/side corner of the keep -->
      <one in="EEk/EEk/kkk" out="uuu/uuu/uu*" symmetry="(x)" steps="1"/>

      <!-- 2. Side annex 'a' with walls 'v' against the keep if at least 7 cells of E remain to the side -->
      <one in="kkkkkEEEEEEE/hhhhkEEEEEEE/hhhhkEEEEEEE/hhhhkEEEEEEE/hhhhkEEEEEEE/kkkkkEEEEEEE" out="*****vvvvv**/****vaaaav**/****vaaaav**/****vaaaav**/****vaaaav**/*****vvvvv**" symmetry="(x)" steps="1"/>

      <!-- 3. Courtyard 'c' around keep, turret, and annex -->
      <all in="[kuv]E" out="*c" symmetry="(xy)" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- Expand courtyard forward towards the front if room allows -->
      <all in="c/E/E/E/E/E" out="*/c/*/*/*/*" symmetry="()" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- Expand courtyard further in Gargantuan where 8+ cells of E remain on sides/front -->
      <all in="cEEEEEEEE" out="*ccc*****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 4. Curtain wall 'w' (2 cells thick) around courtyard -->
      <all in="cE" out="*w" symmetry="(xy)" steps="1"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>
      <all in="wE" out="*w" symmetry="(xy)" steps="1"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- 5. Corner towers 't' (4x4) on outer corners of curtain wall where 2 cells of E exist -->
      <all in="EEEE/EEww/EEww/EEww" out="tttt/tttt/tt**/tt**" symmetry="(xy)"/>
      <!-- Fallback 3x3 corner towers where tighter to edge -->
      <all in="EEE/Eww/Eww" out="ttt/ttt/t**" symmetry="(xy)"/>

      <!-- 6. Way out from keep to front edge: keep door 'd', paved path 'n', gatehouse 'g', road 'r' -->
      <!-- Find middle of front keep wall and carve straight down -->
      <one in="hhh/kkk/ccc" out="***/ddd/nnn" symmetry="()" steps="1"/>
      <all in="n/c" out="*/n" symmetry="()"/>
      <all in="[nc]/w" out="*/g" symmetry="()" steps="1"/>
      <all in="g/w" out="*/g" symmetry="()"/>
      <!-- Widen gatehouse to 5 cells (gate flanked by gatehouse piers) -->
      <all in="gw" out="*g" symmetry="(x)" steps="1"/>
      <all in="[gw]/E" out="*/r" symmetry="()" steps="1"/>
      <all in="r/E" out="*/r" symmetry="()"/>
      <!-- Keep road 3 wide -->
      <one in="ggg/ErE" out="***/rrr" symmetry="()" steps="1"/>
      <all in="rr/EE" out="**/rr" symmetry="(x)"/>

      <!-- 7. Courtyard features where space allows: lean-to portico 'p' (4x2) and well 'q' -->
      <one in="wwwwww/cccccc/cccccc/cccccc" out="******/*pppp*/*pppp*/******" symmetry="(xy)" steps="1"/>
      <one in="ccc/ccc/ccc" out="***/**q/***" symmetry="(xy)" steps="1"/>

      <!-- 8. Outer moat 'm' around curtain wall & towers ONLY when ground extends (Gargantuan) -->
      <one in="wEEEEE" out="*m****" symmetry="(xy)" steps="1"/>
      <all in="mE/[wtg]E" out="*m/**" symmetry="(xy)"/>
      <all in="[wtg]E/*m" out="**/*m" symmetry="(xy)"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)"/>
      <!-- Thicken moat to 2 cells -->
      <all in="[wtg]mE" out="**m" symmetry="(xy)" steps="1"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)"/>
      <!-- Bridge 'b' where moat crosses or touches road 'r' -->
      <all in="mr" out="*b" symmetry="(x)"/>
      <all in="bm/Er" out="*b/**" symmetry="(x)"/>
      <all in="m/r/r" out="*/b/*" symmetry="()"/>
      <all in="b/r/m" out="*/b/*" symmetry="()"/>
    </sequence>
  </map>

  <color symbol="h" value="#c8b89a" name="pavimento del mastio" area="keep"/>
  <color symbol="s" value="#a89070" name="scala del mastio" area="keep"/>
  <color symbol="k" value="#8c8880" name="muro del mastio" area="keep"/>
  <color symbol="d" value="#6b4423" name="porta del mastio" area="keep"/>
  <color symbol="u" value="#757068" name="torretta di guardia" area="tower"/>
  <color symbol="a" value="#bfa888" name="sala d'armi" area="keep"/>
  <color symbol="v" value="#858078" name="muro dell'armeria" area="keep"/>
  <color symbol="c" value="#9ea878" name="cortile" area="courtyard"/>
  <color symbol="n" value="#b0a898" name="lastricato" area="courtyard"/>
  <color symbol="q" value="#586878" name="pozzo" area="courtyard"/>
  <color symbol="p" value="#9c6b40" name="portico" area="porch"/>
  <color symbol="w" value="#9a958c" name="mura di cinta" area="courtyard"/>
  <color symbol="t" value="#7e7a72" name="torre angolare" area="tower"/>
  <color symbol="g" value="#6e6a62" name="corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#b8a88a" name="strada" area="yard"/>
  <color symbol="b" value="#7a5230" name="ponte di legno" area="yard"/>
  <color symbol="m" value="#4a7c9b" name="fossato" area="yard"/>
</sequence>
```
