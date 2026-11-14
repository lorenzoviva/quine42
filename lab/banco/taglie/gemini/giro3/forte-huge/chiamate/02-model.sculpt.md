# model.sculpt · gemini-4-argon · 48 s

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

## What the game made of it
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, s scala del mastio, w muro del mastio, d porta del mastio, a ala del forte, v muro dell'ala, c cortile, n lastricato, Q pozzo, W mura di cinta, G corpo di guardia, r strada, m fossato, p ponte
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEmmmmmmmmmmmmmmmmmmmmmmmEEE
EEEmmmmmmmmmmmmmmmmmmmmmmmmEEE
EEEmmWWWWWWWWWWWWWWWWWWWWWWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccwwwwwwwwwwwcccccWEEE
EEEmmWccccwhhsssshhhwcccccWEEE
EEEmmWccccwhhsssshhhwvvvvcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccQcwhhhhhhhhhwvvvvcWEEE
EEEmmWccccwwwwdddwwwwcccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWWWWWWWWWGGGWWWWWWWWWWEEE
EEEmmmmmmmmmmmpppmmmmmmmmmmEEE
EEEEmmmmmmmmmmpppmmmmmmmmmmEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 2: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, s scala del mastio, w muro del mastio, d porta del mastio, a ala del forte, v muro dell'ala, c cortile, n lastricato, Q pozzo, W mura di cinta, G corpo di guardia, r strada, m fossato, p ponte
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEmmmmmmmmmmmmmmmmmmmmmmEEEE
EEEEmmmmmmmmmmmmmmmmmmmmmmEEEE
EEEEWWWWWWWWWWWWWWWWWWWWWWEEEE
EEEEWccccccccccccccccccccWEEEE
EEEEWccccccccccccccccccccWEEEE
EEEEWccccccccccccccccccccWEEEE
EEEEWccccccccccccccccccccWEEEE
EEEEWcccccwwwwwwwwwwwccccWEEEE
EEEEWcvvvvwhhsssshhhwccccWEEEE
EEEEWcvaaawhhsssshhhwccccWEEEE
EEEEWcvaaawhhhhhhhhhwccccWEEEE
EEEEWcvaaawhhhhhhhhhwccQcWEEEE
EEEEWcvaaawhhhhhhhhhwccccWEEEE
EEEEWcvaaawhhhhhhhhhwccccWEEEE
EEEEWcvvvvwhhhhhhhhhwccccWEEEE
EEEEWcccccwhhhhhhhhhwccccWEEEE
EEEEWcccccwwwwdddwwwwccccWEEEE
EEEEWcccccccccnnnccccccccWEEEE
EEEEWcccccccccnnnccccccccWEEEE
EEEEWcccccccccnnnccccccccWEEEE
EEEEWcccccccccnnnccccccccWEEEE
EEEEWWWWWWWWWWGGGWWWWWWWWWEEEE
EEEEmmmmmmmmmmpppmmmmmmmmmEEEE
EEEEmmmmmmmmmmpppmmmmmmmmmEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### huge, seed 3: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, s scala del mastio, w muro del mastio, d porta del mastio, a ala del forte, v muro dell'ala, c cortile, n lastricato, Q pozzo, W mura di cinta, G corpo di guardia, r strada, m fossato, p ponte
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEmmmmmmmmmmmmmmmmmmmmmmmEEE
EEEmmmmmmmmmmmmmmmmmmmmmmmmEEE
EEEmmWWWWWWWWWWWWWWWWWWWWWWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccccccccccccccccccWEEE
EEEmmWccccwwwwwwwwwwwvvvvcWEEE
EEEmmWccccwhhsssshhhwaaavcWEEE
EEEmmWccccwhhsssshhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwaaavcWEEE
EEEmmWccccwhhhhhhhhhwvvvvcWEEE
EEEmmWccccwhhhhhhhhhwcccccWEEE
EEEmmWccccwhhhhhhhhhwcccccWEEE
EEEmmWccccwwwwdddwwwwcccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWcccccQccnnncccccccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWccccccccnnncccccccccWEEE
EEEmmWWWWWWWWWGGGWWWWWWWWWWEEE
EEEmmmmmmmmmmmpppmmmmmmmmmmEEE
EEEEmmmmmmmmmmpppmmmmmmmmmmEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
### gargantuan, seed 1: grid 40×40×160, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h sala del mastio, s scala del mastio, w muro del mastio, d porta del mastio, a ala del forte, v muro dell'ala, c cortile, n lastricato, Q pozzo, W mura di cinta, G corpo di guardia, r strada, m fossato, p ponte
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmEEEE
EEEEEmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmEEE
EEEEEmmWWWWWWWWWWWWWWWWWWWWWWWWWWWWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWccccccccccccccccccccccccccWmmEEE
EEEEEmmWcccccccwwwwwwwwwwwccccccccWmmEEE
EEEEEmmWcccccccwhhsssshhhwccccccccWmmEEE
EEEEEmmWcccccccwhhsssshhhwvvvvccccWmmEEE
EEEEEmmWcccccccwhhhhhhhhhwaaavccccWmmEEE
EEEEEmmWcccccccwhhhhhhhhhwaaavccccWmmEEE
EEEEEmmWcccccccwhhhhhhhhhwaaavccccWmmEEE
EEEEEmmWcccccccwhhhhhhhhhwaaavccccWmmEEE
EEEEEmmWcccccccwhhhhhhhhhwaaavccccWmmEEE
EEEEEmmWcccccccwhhhhhhhhhwvvvvccccWmmEEE
EEEEEmmWcccccccwwwwdddwwwwccccccccWmmEEE
EEEEEmmWcccccccccccnnnccccccccccccWmmEEE
EEEEEmmWcccccccccccnnnccccccccccccWmmEEE
EEEEEmmWcccccccccccnnnccccccccccccWmmEEE
EEEEEmmWcccccccccccnnnccccccccccccWmmEEE
EEEEEmmWcccccccccccnnncccQccccccccWmmEEE
EEEEEmmWcccccccccccnnnccccccccccccWmmEEE
EEEEEmmWcccccccccccnnnccccccccccccWmmEEE
EEEEEmmWWWWWWWWWWWWGGGWWWWWWWWWWWWWmmEEE
EEEEEmmmmmmmmmmmmmmpppmmmmmmmmmmmmmmmEEE
EEEEEEmmmmmmmmmmmmmpppmmmmmmmmmmmmmmEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEErrrEEEEEEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.20 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  Concept: Forte (fortress with central keep, courtyard, curtain wall, corner towers, gatehouse, and at Gargantuan an outer moat and bridge).
  Letters:
  - h, s, w, d: keep interior (h), stair zone (s), keep walls (w), keep door (d)
  - a, v: side wing/hall interior (a) and walls (v) attached to the keep, varying by seed
  - c, n, Q: courtyard (c), paved path (n), courtyard well (Q)
  - W, G, t: curtain wall (W), gatehouse (G), corner towers (t)
  - r: road to the front edge
  - m, p: outer moat (m) and bridge (p)
  What seeds change: keep depth, wing placement and side, courtyard well placement.
  What fits by size:
  - Huge (30x30): keep + wing + courtyard with well (Q) + curtain wall (W) + 4 corner towers (t) + gatehouse (G).
  - Gargantuan (40x40): expanded courtyard + 2nd well/shrine + outer moat (m) and bridge (p) around the fort.
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

      <!-- Side wing on the keep, varying by seed -->
      <one in="wEEEE/wEEEE/wEEEE/wEEEE/wEEEE/wEEEE" out="*aaa*/*aaa*/*aaa*/*aaa*/*aaa*/*aaa*" symmetry="(x)" steps="1"/>
      <all in="aE" out="*v"/>
      <all in="vE/*v" out="*v/**"/>

      <!-- Inner courtyard (c) around the keep and wing -->
      <all in="[wv]E" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*ccc***" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- Extra courtyard expansion only at Gargantuan -->
      <all in="cEEEEEEEEEE" out="*ccc*******" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- Curtain wall (W) around the courtyard -->
      <all in="cE" out="*W" steps="1"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- Corner towers (t) on the outer corners of the curtain wall -->
      <all in="EE/EW" out="**/*t"/>
      <all steps="2">
        <rule in="t[EW]" out="*t"/>
        <rule in="t*/*[EW]" out="**/*t"/>
      </all>

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

      <!-- Courtyard well (Q) in open courtyard space -->
      <one in="ccc/ccc/ccc" out="***/*Q*/***" steps="1"/>

      <!-- Outer moat (m) and bridge (p) ONLY at Gargantuan (where 6+ cells of E remain beyond curtain wall) -->
      <all in="cWEEEEEE" out="**mm****" steps="1"/>
      <all in="[WGt]E/*m" out="**/*m"/>
      <all in="mE/*m" out="*m/**" steps="2"/>
      <all in="mr" out="*p"/>
      <all in="pr" out="*p" symmetry="(x)" steps="1"/>
    </sequence>

    <map scale="5 5 1" values="BEhswdavcnQWGtrmpfFKLJPOoNMU#20#21Tk#90#91#92#94" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="v" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="Q" out="QQQQQ/QmmmQ/QmmmQ/QmmmQ/QQQQQ"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="m" out="mmmmm/mmmmm/mmmmm/mmmmm/mmmmm"/>
      <rule in="p" out="ppppp/ppppp/ppppp/ppppp/ppppp"/>

      <sequence symmetry="(xy)">
        <union symbol="+" values="wWtGv"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="wWtG"/>

        <!-- B. Heights -->
        <!-- Keep walls (w) and door wall (d): 2 storeys (64) + 1 parapet = 65 -->
        <all in="B [wd]" out="* w" steps="8"/>
        <all in="B [wd]" out="* K" steps="14"/>
        <all in="B [wd]" out="* w" steps="18"/>
        <all in="B [wd]" out="* K" steps="14"/>
        <all in="B [wd]" out="* w" steps="11"/>

        <!-- Keep interior (h) and stair zone (s): 2 storeys + roof slab at 64 -->
        <all steps="1">
          <rule in="B h" out="h f"/>
          <rule in="B s" out="s f"/>
        </all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="30"/>
        <all in="B s" out="s B" steps="29"/>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <all steps="31">
          <rule in="B h" out="h B"/>
          <rule in="B s" out="s B"/>
        </all>
        <all steps="1">
          <rule in="B h" out="h F"/>
          <rule in="B s" out="s F"/>
        </all>
        <prl>
          <rule in="h" out="B"/>
          <rule in="s" out="B"/>
        </prl>

        <!-- Side wing: walls (v) 33 high, interior (a) 1 storey + pitched roof (J) -->
        <all in="B v" out="v v" steps="8"/>
        <all in="B v" out="v K" steps="12"/>
        <all in="B v" out="v v" steps="12"/>
        <prl in="v" out="J"/>
        <all in="B a" out="a f" steps="1"/>
        <all in="B a" out="a B" steps="31"/>
        <prl in="a" out="J"/>

        <!-- Curtain wall (W): height 24 -->
        <all in="B W" out="W W" steps="24"/>

        <!-- Corner towers (t): height 44 -->
        <all in="B t" out="t t" steps="14"/>
        <all in="B t" out="t K" steps="12"/>
        <all in="B t" out="t t" steps="18"/>

        <!-- Gatehouse (G): height 38 -->
        <all in="B G" out="G G" steps="38"/>

        <!-- Well curb (Q): height 5, with corner posts and small roof -->
        <all in="B Q" out="Q W" steps="5"/>
        <one in="Q" out="P" steps="2"/>
        <all in="B P" out="P N" steps="10"/>
        <prl in="P" out="J"/>
        <all in="JB" out="*J" steps="2"/>

        <!-- Bridge parapets on outer x edges -->
        <all in="pm" out="Qm"/>
        <all in="B Q" out="Q N" steps="4"/>

        <!-- C. Full scale details & parts -->
        <!-- Door seeds (O) at z=1 (just above ground) -->
        <!-- 1. Keep front door (at foot of d, meeting n) -->
        <all in="B d/B n" out="O */* *" symmetry="()" steps="1"/>
        <all in="B w/O d" out="O */* *" symmetry="()" steps="4"/>

        <!-- 2. Gatehouse passage (at foot of G, meeting r and n) -->
        <all in="B G/B [rp]" out="O */* *" symmetry="()" steps="1"/>
        <all in="B G/O G" out="O */* *" symmetry="()" steps="4"/>

        <!-- 3. Internal door between keep (f) and wing (f) through wall (w) -->
        <one in="B B/B w/B w/B w/B w/B w/B B f f/w w/w w/w w/w w/w w/f f" out="* */O */O */O */O */O */* * * */* */* */* */* */* */* *" symmetry="(xy)" steps="1"/>
        <all in="B w/O w" out="O */* *" symmetry="(xy)" steps="4"/>

        <!-- Windows (L) in the window bands (K) -->
        <one steps="18">
          <rule in="BK/BK/BK/BK BK/BK/BK/BK BK/BK/BK/BK BK/BK/BK/BK BK/BK/BK/BK BK/BK/BK/BK" out="*L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L *L/*L/*L/*L"/>
        </one>
        <all in="LK" out="LL"/>
        <prl in="K" out="w"/>

        <!-- Pitched roof on the wing (J) -->
        <all in="*****/*****/**B**/*****/***** **J**/**J**/JJJJJ/**J**/**J**" out="*****/*****/**J**/*****/***** *****/*****/*****/*****/*****" steps="6" symmetry="()"/>

        <!-- Include parts -->
        <import file="part-stair"/>
        <import file="part-door"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>

        <!-- Clean up leftover top markers -->
        <prl in="Q" out="W"/>
      </sequence>
    </map>
  </map>

  <color symbol="E" value="#7a8c56" name="erba" hidden="True"/>
  <color symbol="h" value="#b89f72" name="sala del mastio" area="keep"/>
  <color symbol="s" value="#a3885c" name="scala del mastio" area="keep"/>
  <color symbol="w" value="#8c877e" name="muro del mastio" area="keep"/>
  <color symbol="d" value="#8c877e" name="ingresso del mastio" area="keep"/>
  <color symbol="a" value="#c2a97e" name="sala dell'ala" area="keep"/>
  <color symbol="v" value="#827d74" name="muro dell'ala" area="keep"/>
  <color symbol="c" value="#b5aa94" name="cortile" area="courtyard"/>
  <color symbol="n" value="#9c9382" name="lastricato" area="courtyard"/>
  <color symbol="Q" value="#757067" name="bordo in pietra" area="courtyard"/>
  <color symbol="W" value="#757067" name="mura di cinta" area="courtyard"/>
  <color symbol="G" value="#6b665e" name="corpo di guardia" area="courtyard"/>
  <color symbol="t" value="#635e56" name="torre d'angolo" area="tower"/>
  <color symbol="r" value="#9c9382" name="strada" area="yard"/>
  <color symbol="m" value="#4a6e7d" name="acqua" area="yard"/>
  <color symbol="p" value="#755638" name="ponte di legno" area="yard"/>
  <color symbol="f" value="#8f6b4a" name="pavimento in legno" area="keep"/>
  <color symbol="F" value="#7a5a3c" name="solaio in legno" area="keep"/>
  <color symbol="k" value="#9e7854" name="gradini" area="keep"/>
  <color symbol="J" value="#9e4736" name="tetto in tegole" area="keep"/>
  <color symbol="L" value="#2b3842" name="finestra" area="keep"/>
  <color symbol="O" value="#6e4e32" name="porta in legno" area="keep"/>
  <color symbol="o" value="#4a331f" name="assi della porta" area="keep"/>
  <color symbol="N" value="#544f47" name="stipite in pietra" area="keep"/>
  <color symbol="M" value="#757067" name="merlatura" area="keep"/>
  <color symbol="U" value="#24221f" name="feritoia" area="keep"/>
  <color symbol="#20" value="#000000" name="porta aperta" hidden="True"/>
  <color symbol="#21" value="#000000" name="assi aperte" hidden="True"/>

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
