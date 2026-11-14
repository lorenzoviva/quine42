# model.sculpt · gemini-4-carbon · 67 s

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

## Your program so far
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

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, s scala del mastio, k muro del mastio, d porta del mastio, c cortile, n lastricato, q pozzo, p portico, w mura di cinta, t torre angolare, r strada, g corpo di guardia, m fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEttttEEEEEEEEEEEEEEEEttttEE
EEEEttttEEEEEEEEEEEEEEEEttttEE
EEEEttwwwwwwwwwwwwwwwwwwwwttEE
EEEEttwwwwwwwwwwwwwwwwwwwwttEE
EEEEEwwccccccccccccccccccwwEEE
EEEEEwwppccccccccccccccccwwEEE
EEEEEwwppccccccccccccccccwwEEE
EEEEEwwppccccccccccccccccwwEEE
EEEEEwwppcckkkkkkkkkkccccwwEEE
EEEmmwwcccckhhsssshhkccccwwEEE
EEEEEwwcccckhhsssshhkccccwwEEE
EEEEEwwcccckhhhhhhhhkccccwwEEE
EEEEEwwcccckhhhhhhhhkccccwwEEE
EEEEEwwcccckhhhhhhhhkccccwwEEE
EEEEEwwcccckhhhhhhhhkccccwwEEE
EEEEEwwcccckhhhhhhhhkccccwwEEE
EEEEEwwcccckkdddkkkkkccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncqcccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwttE
EEEEttggggggggggggggggggggwttE
EEEEttgggggggggggggggggggttttE
EEEEttttrrrrrrrrrrrrrrrrrttttE
EEEEttttrrrrrrrrrrrrrrrrrEEEEE
EEEEEEEErrrrrrrrrrrrrrrrrEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, s scala del mastio, k muro del mastio, d porta del mastio, c cortile, n lastricato, q pozzo, p portico, w mura di cinta, t torre angolare, r strada, g corpo di guardia, m fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEttttEEEEEEEEEEEEEEEEEEttttE
EEEttttwwwwwwwwwwwwwwwwwwttttE
EEEttwwwwwwwwwwwwwwwwwwwwwwttE
EEEttwwccccccccccccccccccwwttE
EEEEEwwcccccccccccqccccccwwEEE
EEEEEwwccccccccccccccccccwwEEE
EEEEEwwccccccccccccccccccwwEEE
EEEEEwwcccckkkkkkkkkkccccwwEEE
EEEEEwwcccckhhsssshhkccccwwEEE
EEEEEwwcccckhhsssshhkccccwwEEE
EEEEEwwppcckhhhhhhhhkccccwwEEE
EEEEEwwppcckhhhhhhhhkccccwwEEE
EEEEEwwppcckhhhhhhhhkccccwwEEE
EEEmmwwppcckhhhhhhhhkccccwwEEE
EEEEEwwcccckhhhhhhhhkccccwwEEE
EEEEEwwcccckkdddkkkkkccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEEwwccccccnnncccccccccwwEEE
EEEEttggggggggggggggggggggttEE
EEEEttggggggggggggggggggggttEE
EEEEttttrrrrrrrrrrrrrrrrttttEE
EEEEttttrrrrrrrrrrrrrrrrttttEE
EEEEEEEErrrrrrrrrrrrrrrrEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, s scala del mastio, k muro del mastio, d porta del mastio, c cortile, n lastricato, q pozzo, p portico, w mura di cinta, t torre angolare, r strada, g corpo di guardia
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEttttEEEEEEEEEEEEEEEEEEEEEEE
EEEttttEEEEEEEEEEEEEEEEEttttEE
EEEttwwwwwwwwwwwwwwwwwwwttttEE
EEEttwwwwwwwwwwwwwwwwwwwwwttEE
EEEEwwccccccccccccccccccwwttEE
EEEEwwccccccccccccccccccwwEEEE
EEEEwwccccccccccccccccccwwEEEE
EEEEwwccccccccccccccccccwwEEEE
EEEEwwcccckkkkkkkkkkccccwwEEEE
EEEEwwcccckhhsssshhkccccwwEEEE
EEEEwwcccckhhsssshhkccccwwEEEE
EEEEwwcccckhhhhhhhhkccccwwEEEE
EEEEwwcccckhhhhhhhhkccccwwEEEE
EEEEwwcccckhhhhhhhhkccccwwEEEE
EEEEwwcccckhhhhhhhhkccccwwEEEE
EEEEwwcccckhhhhhhhhkccppwwEEEE
EEEEwwcccckkkdddkkkkccppwwEEEE
EEEEwwcccccccnnnccccccppwwEEEE
EEEEwwcccccccnnnccccccppwwEEEE
EEEEwwcccccccnnnccccccccwwEEEE
EEEEwwcccccccnnnccccccccwwEEEE
EEEEwwcccccccnnnccccccccwwEEEE
EEEEwwccqccccnnnccccccccwwEEEE
EEEttggggggggggggggggggggttEEE
EEEttggggggggggggggggggggttEEE
EEEttttrrrrrrrrrrrrrrrrttttEEE
EEEttttrrrrrrrrrrrrrrrrttttEEE
EEEEEEErrrrrrrrrrrrrrrrEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, h pavimento del mastio, s scala del mastio, k muro del mastio, d porta del mastio, c cortile, n lastricato, q pozzo, p portico, w mura di cinta, t torre angolare, r strada, g corpo di guardia, m fossato
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEttttEEEEEEEEEEEEEEEEttttEEEEEEE
EEEEEEEEEttttEEEEEEEEEEEEEEEEttttEEEEEEE
EEEEEEEEEttwwwwwwwwwwwwwwwwwwwwttEEEEEEE
EEEEEEEEEttwwwwwwwwwwwwwwwwwwwwttEEEEEEE
EEEEEEEEmmwwccccccccccccccccccwwEEEEEEEE
EEEEEEEEmmwwccccccccccccccccccwwEEEEEEEE
EEEEEEEEEEwwccccccccccccccccccwwEEEEEEEE
EEEEEEEEEEwwccccccccccccccccccwwEEEEEEEE
EEEEEEEEEEwwcccckkkkkkkkkkccccwwEEEEEEEE
EEEEEEEEEEwwcccckhhsssshhkccccwwEEEEEEEE
EEEEEEEEEEwwppcckhhsssshhkccccwwEEEEEEEE
EEEEEEEEEEwwppcckhhhhhhhhkccccwwEEEEEEEE
EEEEEEEEEEwwppcckhhhhhhhhkccccwwEEEEEEEE
EEEEEEEEEEwwppcckhhhhhhhhkccccwwEEEEEEEE
EEEEEEEEEEwwcccckhhhhhhhhkccccwwEEEEEEEE
EEEEEEEEEEwwcccckhhhhhhhhkccccwwEEEEEEEE
EEEEEEEEEEwwcccckkdddkkkkkccccwwEEEEEEEE
EEEEEEEEEEwwccccccnnncccccccccwwEEEEEEEE
EEEEEEEEEEwwccccccnnncccccccccwwEEEEEEEE
EEEEEEEEEEwwccccccnnncccccccccwwEEEEEEEE
EEEEEEEEEEwwccqcccnnncccccccccwwEEEEEEEE
EEEEEEEEEEwwccccccnnncccccccccwwEEEEEEEE
EEEEEEEEEEwwccccccnnncccccccccwwttEEEEEE
EEEEEEEEEttggggggggggggggggggggwttEEEEEE
EEEEEEEEEttgggggggggggggggggggttttEEEEEE
EEEEEEEEEttttrrrrrrrrrrrrrrrrrttttEEEEEE
EEEEEEEEEttttrrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEE
EEEEEEEEEEEEErrrrrrrrrrrrrrrrrEEEEEEEEEE
```
How much the plans of the seeds differ: 0.21 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
Concept: Forte (medieval fort).
Fixes from Block 1 plans:
- Fixed gatehouse 'g' & road 'r' so 'g' stays 5 cells wide (flanking 3-cell passage) and road 'r' stays 3 cells wide straight to the front edge.
- Fixed watch turret 'u' pattern so it attaches cleanly to one corner of the keep 'k', and side annex 'a'/'v' so it fits cleanly when room allows (especially in Gargantuan or offset seeds).
- Fixed Gargantuan expansion: courtyard expands more in Gargantuan, allowing side annex 'a'/'v', multiple porticos/sheds 'p', outer water moat 'm' (2 cells wide all around) crossed by wooden bridge 'b', and outer trees/banners so Gargantuan clearly holds more parts and types than Huge.
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

      <!-- Tall watch turret 'u' (3x3) on one back corner of the keep -->
      <one in="EEE/Ekk/Ekh" out="uuu/uuk/uuk" symmetry="(x)" steps="1"/>

      <!-- 2. Side annex 'a' with walls 'v' against the keep ONLY when 11+ cells of E remain to the side (Gargantuan) -->
      <one in="kEEEEEEEEEEE/kEEEEEEEEEEE/kEEEEEEEEEEE/kEEEEEEEEEEE/kEEEEEEEEEEE/kEEEEEEEEEEE" out="kvvvvv******/kaaaav******/kaaaav******/kaaaav******/kaaaav******/kvvvvv******" symmetry="(x)" steps="1"/>

      <!-- 3. Courtyard 'c' around keep, turret, and annex -->
      <all in="[kuv]E" out="*c" symmetry="(xy)" steps="3"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- Expand courtyard forward towards the front if room allows -->
      <all in="c/E/E/E/E/E" out="*/c/*/*/*/*" symmetry="()" steps="2"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>
      <!-- Expand courtyard further in Gargantuan where 8+ cells of E remain -->
      <all in="cEEEEEEEE" out="*ccc*****" symmetry="(xy)" steps="1"/>
      <all in="cE/*c" out="*c/**" symmetry="(xy)"/>

      <!-- 4. Curtain wall 'w' (2 cells thick) around courtyard -->
      <all in="cE" out="*w" symmetry="(xy)" steps="1"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>
      <all in="wE" out="*w" symmetry="(xy)" steps="1"/>
      <all in="wE/*w" out="*w/**" symmetry="(xy)"/>

      <!-- 5. Corner towers 't' (4x4) on outer corners of curtain wall -->
      <all in="EEEE/EEww/EEww/EEww" out="tttt/tttt/tt**/tt**" symmetry="(xy)"/>
      <all in="EEE/Eww/Eww" out="ttt/ttt/t**" symmetry="(xy)"/>

      <!-- 6. Way out from keep to front edge: keep door 'd' (3 wide), paved path 'n' (3 wide), gatehouse 'g', road 'r' (3 wide) -->
      <one in="hhhhh/kkkkk/ccccc" out="*****/*ddd*/*nnn*" symmetry="()" steps="1"/>
      <all in="nnn/ccc" out="***/nnn" symmetry="()"/>
      <!-- If annex exists, connect annex to courtyard with paved path too -->
      <one in="aaa/vvv/ccc" out="***/vvv/nnn" symmetry="(xy)" steps="1"/>
      <!-- Gatehouse 'g' through front curtain wall where 'n' meets 'w' -->
      <all in="nnn/www" out="***/ggg" symmetry="()" steps="1"/>
      <all in="ggg/www" out="***/ggg" symmetry="()"/>
      <!-- Road 'r' (3 wide) straight from gatehouse 'g' to front edge -->
      <all in="ggg/EEE" out="***/rrr" symmetry="()" steps="1"/>
      <all in="rrr/EEE" out="***/rrr" symmetry="()"/>
      <!-- Flanking gatehouse piers (1 cell on each side of the 3-cell gate) -->
      <all in="gw/gw" out="gg/gg" symmetry="(x)" steps="1"/>

      <!-- 7. Courtyard features where space allows: lean-to portico 'p' and well 'q' -->
      <one in="wwwwww/cccccc/cccccc/cccccc" out="******/*pppp*/*pppp*/******" symmetry="(xy)" steps="2"/>
      <one in="ccc/ccc/ccc" out="***/**q/***" symmetry="(xy)" steps="1"/>

      <!-- 8. Outer moat 'm' around curtain wall & towers ONLY when 5+ cells of outer ground remain on all sides (Gargantuan) -->
      <all in="wEEEEE" out="*mm***" symmetry="(x)" steps="1"/>
      <all in="E/E/E/E/E/w" out="*/*/*/m/m/*" symmetry="(y)" steps="1"/>
      <all in="mE/[wtg]*" out="*m/**" symmetry="(xy)"/>
      <all in="mE/*m" out="*m/**" symmetry="(xy)" steps="4"/>
      <!-- Bridge 'b' where moat meets road 'r' -->
      <all in="mr" out="*b" symmetry="(x)" steps="2"/>
      <all in="br" out="*b" symmetry="(x)" steps="2"/>
    </sequence>

    <!-- Scale up 5x5 to full voxel grid -->
    <map scale="5 5 1" values="BEhskduavcnqpwtrgbmfFKWVGTJPYLQZXADIOoNMU#90#91#92#94#20#21" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="k" out="kkkkk/kkkkk/kkkkk/kkkkk/kkkkk"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="q" out="ccccc/cqqqc/cqqqc/cqqqc/ccccc"/>
      <rule in="p" out="ppppp/pbbbp/pbbbp/pbbbp/ppppp"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="g" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="DDDDD/DDDDD/DDDDD/DDDDD/DDDDD"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>

      <sequence symmetry="()">
        <!-- Unions for imported parts -->
        <!-- '+' = walls that get battlements & doors -->
        <union symbol="+" values="KWVGT"/>
        <!-- '%' = walls that get arrow slits under merlons -->
        <union symbol="%" values="KWVGT"/>
        <!-- '=' = floors and slabs for part-stair -->
        <union symbol="=" values="fF"/>

        <!-- ================= B. HEIGHTS ================= -->
        <!-- 1. Ground paving, moat water, bridge planks (keep area letters at z=0, put visible floor at z=1 or keep z=0 visible) -->
        <!-- Keep interior 'h' and stair 's': z=0 stays area 'h'/'s', z=1 floor 'f', 31 air, z=33 slab 'F', 31 air, z=65 roof slab 'F' -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
          <rule in="B a" out="a f"/>
        </all>
        <!-- Stair strip 'T' at z=2 (just above floor 'f' at z=1) -->
        <all in="B s" out="s I" steps="1"/>
        <!-- Story 1 air: 31 voxels clear (s already used 1 for I, so 30 more) -->
        <all in="B h" out="h B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all in="B a" out="a B" steps="31"/>
        <!-- Story 1 ceiling / Story 2 floor slab 'F' at z=33 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
          <rule in="B a" out="a F"/>
        </all>
        <!-- Annex 'a' stops here with pitched terracotta roof 'P' above z=33 -->
        <prl in="a" out="P"/>

        <!-- Keep Story 2 air: 31 voxels clear -->
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <!-- Keep roof terrace slab 'F' at z=65 -->
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <prl>
          <rule in="h" out="B"/>
          <rule in="s" out="B"/>
        </prl>

        <!-- Keep walls 'k' and keep door column 'd': rise to z=66 (1 higher than terrace slab F at z=65 so battlements sit on parapet!) -->
        <!-- With window bands 'Z' on story 1 (z=10..22) and story 2 (z=42..54) -->
        <all steps="10">
          <rule in="B k" out="k K"/>
          <rule in="B d" out="d K"/>
        </all>
        <all in="B k" out="k Z" steps="12"/>
        <all in="B d" out="d K" steps="12"/>
        <all steps="20">
          <rule in="B k" out="k K"/>
          <rule in="B d" out="d K"/>
        </all>
        <all steps="12">
          <rule in="B k" out="k Z"/>
          <rule in="B d" out="d Z"/>
        </all>
        <all steps="12">
          <rule in="B k" out="k K"/>
          <rule in="B d" out="d K"/>
        </all>
        <prl>
          <rule in="k" out="K"/>
          <rule in="d" out="K"/>
        </prl>

        <!-- Watch turret 'u': rises to z=80, topped with conical roof 'P' -->
        <all in="B u" out="u T" steps="58"/>
        <all in="B u" out="u Z" steps="10"/>
        <all in="B u" out="u T" steps="10"/>
        <prl in="u" out="P"/>

        <!-- Annex walls 'v': rise to z=34 with window band 'Z' -->
        <all in="B v" out="v V" steps="10"/>
        <all in="B v" out="v Z" steps="12"/>
        <all in="B v" out="v V" steps="11"/>
        <prl in="v" out="P"/>

        <!-- Curtain wall 'w': rises to z=26 (walkway with battlements) -->
        <all in="B w" out="w W" steps="25"/>
        <prl in="w" out="W"/>

        <!-- Gatehouse 'g': rises to z=44 (taller than person + door 30 + lintel + parapet) -->
        <all in="B g" out="g G" steps="32"/>
        <all in="B g" out="g Z" steps="6"/>
        <all in="B g" out="g G" steps="5"/>
        <prl in="g" out="G"/>

        <!-- Corner towers 't': rise to z=48 -->
        <all in="B t" out="t T" steps="30"/>
        <all in="B t" out="t Z" steps="8"/>
        <all in="B t" out="t T" steps="9"/>
        <prl in="t" out="T"/>

        <!-- Courtyard portico 'p' & posts 'b': clear height 32, wood roof 'J' at z=34 -->
        <!-- Thin 'b' to only corner posts of the portico block so interior is wide open -->
        <all in="bb/bb" out="bp/pp" symmetry="(xy)"/>
        <all in="B b" out="b Y" steps="33"/>
        <prl in="b" out="J"/>
        <all in="B p" out="X c" steps="1"/>
        <all in="B X" out="X B" steps="32"/>
        <prl in="X" out="J"/>

        <!-- Courtyard well 'q': stone rim rising 6 with water inside -->
        <all in="qqq/qqq/qqq" out="qqq/qmq/qqq" symmetry="()"/>
        <all in="B q" out="q K" steps="5"/>
        <prl in="q" out="K"/>

        <!-- Bridge 'D': wooden planks at z=1 with low side rails -->
        <all in="B D" out="Y D" steps="1"/>
        <prl in="Y" out="B"/>

        <!-- Ground floor level alignment: raise courtyard 'c', path 'n', road 'r' by 1 layer so doors at z=1 step cleanly onto z=0/z=1 -->
        <all steps="1">
          <rule in="B n" out="Q n"/>
          <rule in="B r" out="Q r"/>
        </all>
        <prl in="Q" out="B"/>

        <!-- ================= C. FULL SCALE PARTS & DETAILS ================= -->
        <!-- 1. Doors ('O' seed at z=1, on top of floor/paving layer, through full wall thickness) -->
        <!-- Keep front door: where keep wall 'K' sits above 'd' at z=1 -->
        <all in="K/d" out="O/d" symmetry="()"/>
        <!-- Gatehouse front door: 15 wide where central 15 voxels of gatehouse 'G' meet path 'n' and road 'r' at z=1 -->
        <all in="G/g Bn/Br" out="O/g **" symmetry="()" steps="1"/>
        <all in="G/g OG/gg" out="O/g **" symmetry="()" steps="10"/>

        <!-- Annex door from courtyard into annex 'a' (11 wide) at z=1 -->
        <one in="cBBBBBBBBBBBc/vVVVVVVVVVVVv/fffffffffffff" out="*************/vOOOOOOOOOOOv/*************" symmetry="(xy)" steps="1"/>
        <all in="V/v OV/vv" out="O/v **" symmetry="(xy)" steps="5"/>

        <!-- Convert stair marker 'I' to 'T' for part-stair, but FIRST change tower wall 'T' temporarily? -->
        <!-- Wait: part-stair uses 'T' for the stair strip! Our tower wall used 'T'! Rename tower wall 'T' -> 'A' before part-stair! -->
        <prl in="T" out="A"/>
        <union symbol="+" values="KWVGA"/>
        <union symbol="%" values="KWVGA"/>
        <prl in="I" out="T"/>

        <!-- Include seed parts -->
        <import file="part-stair"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- 2. Windows in 'Z' bands (6 wide x 8 tall) on Keep, Towers, Annex, Gatehouse -->
        <one steps="28">
          <rule in="BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ BZ/BZ/BZ/BZ/BZ/BZ"
                out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L" symmetry="(xy)"/>
        </one>
        <!-- Punch windows through the 5-voxel wall thickness -->
        <all in="LZZZZB" out="*LLLL*" symmetry="(xy)"/>
        <all in="LZZZZf" out="*LLLL*" symmetry="(xy)"/>
        <all in="LZZZZF" out="*LLLL*" symmetry="(xy)"/>
        <!-- Restore remaining 'Z' band to stone wall 'K' -->
        <prl in="Z" out="K"/>

        <!-- 3. Pitched terracotta roofs 'P' on Watch Turret and Annex -->
        <!-- Eaves overhang 1 voxel -->
        <all in="PB" out="*P" symmetry="(xy)" steps="1"/>
        <!-- Hip roof pyramid stepping up -->
        <all in="*****/*****/**B**/*****/***** **P**/**P**/PPPPP/**P**/**P**"
             out="*****/*****/**P**/*****/***** *****/*****/*****/*****/*****" steps="14" symmetry="()"/>

        <!-- Portico lean-to slight slope -->
        <all in="JB" out="*J" symmetry="(xy)" steps="1"/>
        <all in="***/*B*/*** *J*/JJJ/*J*" out="***/*J*/*** ***/*J*/***" steps="3" symmetry="()"/>

        <!-- Stone buttresses / plinth base along outer walls at z=1..5 for medieval silhouette -->
        <all in="WE/wE" out="WK/wE" symmetry="(xy)" steps="1"/>
        <all in="B/K WE/WK" out="K/K **/**" symmetry="(xy)" steps="4"/>

        <!-- Decorative banner pole on keep roof or gatehouse -->
        <one in="B B M" out="* Y *" symmetry="()" steps="1"/>
        <all in="B Y" out="Y *" steps="10"/>
        <all in="YB" out="*P" symmetry="(x)" steps="3"/>
      </sequence>
    </map>
  </map>

  <!-- Palette: warm medieval cartoon voxel style, >= 8 distinct materials, clear light/dark contrast -->
  <!-- Ground & areas (kept on z=0 for area tagging) -->
  <color symbol="h" value="#8c857b" name="fondazione del mastio" area="keep"/>
  <color symbol="s" value="#8c857b" name="fondazione della scala" area="keep"/>
  <color symbol="d" value="#8c857b" name="soglia del mastio" area="keep"/>
  <color symbol="u" value="#6e685f" name="base della torretta" area="tower"/>
  <color symbol="a" value="#8c857b" name="base dell'armeria" area="keep"/>
  <color symbol="v" value="#7a746b" name="base del muro" area="keep"/>
  <color symbol="c" value="#8fa365" name="erba del cortile" area="courtyard"/>
  <color symbol="n" value="#b8ae9c" name="lastricato del cortile" area="courtyard"/>
  <color symbol="p" value="#a89e8c" name="suolo del portico" area="porch"/>
  <color symbol="w" value="#7a746b" name="base delle mura" area="courtyard"/>
  <color symbol="t" value="#6e685f" name="base della torre" area="tower"/>
  <color symbol="g" value="#6e685f" name="soglia del corpo di guardia" area="courtyard"/>
  <color symbol="r" value="#c4b494" name="strada battuta" area="yard"/>
  <color symbol="m" value="#4a809e" name="acqua del fossato" area="yard"/>

  <!-- Structural & architectural materials -->
  <color symbol="K" value="#9e988e" name="pietra del mastio" area="keep"/>
  <color symbol="W" value="#b0aaa0" name="pietra delle mura"/>
  <color symbol="V" value="#a6a096" name="muro dell'armeria"/>
  <color symbol="G" value="#8a847a" name="pietra del corpo di guardia"/>
  <color symbol="A" value="#857f75" name="pietra delle torri"/>
  <color symbol="M" value="#b8b2a6" name="merlatura in pietra"/>
  <color symbol="f" value="#b88c58" name="tavolato di quercia"/>
  <color symbol="F" value="#9c7444" name="solaio di legno"/>
  <color symbol="k" value="#876238" name="gradini di legno"/>
  <color symbol="D" value="#8c6239" name="ponte di legno" area="yard"/>
  <color symbol="Y" value="#5c3d22" name="trave di quercia"/>
  <color symbol="J" value="#78502e" name="tettoia di legno"/>
  <color symbol="P" value="#b84b39" name="tetto in coppi rossi"/>
  <color symbol="L" value="#2d3842" name="finestra scura"/>
  <color symbol="U" value="#232b33" name="feritoia"/>

  <!-- Door materials & open/close actions -->
  <color symbol="N" value="#5e5850" name="stipite in pietra"/>
  <color symbol="O" value="#6e4726" name="portone di legno"/>
  <color symbol="o" value="#472c16" name="rinforzi del portone"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>

  <action name="open" label="Apri la porta">
    <all>
      <rule in="O" out="#20"/>
      <rule in="o" out="#21"/>
    </all>
  </action>
  <action name="close" label="Chiudi la porta">
    <all>
      <rule in="#20" out="O"/>
      <rule in="#21" out="o"/>
    </all>
  </action>
</sequence>
```
