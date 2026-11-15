# model.sculpt · claude-opus-5-5 · 105 s

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

## Your program so far
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

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre d'angolo, d porta del mastio, n selciato, G torre della porta, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
tttttEEEEEEEEEEEtttt
tttttEEEEEEEEEEEtttt
tttttWWWWWWWWWWWtttt
tttttWWWWWWWWWWWtttt
ttttcccccccccccccttt
EEWWcwwwwwwwwwwwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhHhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwwwwdddwwwwcWWE
EEWWcccccnnncccccWWE
EEWWWWWWWGGGWWWWWWWE
EEWWWWWWWGGGWWWWWWWE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre d'angolo, d porta del mastio, n selciato, G torre della porta, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
tttttEEEEEEEEEEEtttt
tttttEEEEEEEEEEEtttt
tttttWWWWWWWWWWWtttt
tttttWWWWWWWWWWWtttt
ttttcccccccccccccttt
EEWWcwwwwwwwwwwwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhHhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwwwwdddwwwwcWWE
EEWWcccccnnncccccWWE
EEWWWWWWWGGGWWWWWWWE
EEWWWWWWWGGGWWWWWWWE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre d'angolo, d porta del mastio, n selciato, G torre della porta, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
tttttEEEEEEEEEEEtttt
tttttEEEEEEEEEEEtttt
tttttWWWWWWWWWWWtttt
tttttWWWWWWWWWWWtttt
ttttcccccccccccccttt
EEWWcwwwwwwwwwwwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhsssshhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhHhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwhhhhhhhhhwcWWE
EEWWcwwwwdddwwwwcWWE
EEWWcccccnnncccccWWE
EEWWWWWWWGGGWWWWWWWE
EEWWWWWWWGGGWWWWWWWE
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: H centro del mastio, E marker, h pavimento del mastio, w muro del mastio, c cortile, W cinta muraria, t torre d'angolo, d porta del mastio, n selciato, G torre della porta, r strada, x fossato, Q pozzo, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
Etttttxxxxxxxxxxxxxxxxxxxttttt
Etttttxxxxxxxxxxxxxxxxxxxttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
EtttttWWWWWWWWWWWWWWWWWWWttttt
Ettttccccccccccccccccccccctttt
EEEWWcccccccccccccccccccccWWEE
EEEWWccccccccccQccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccccccccccccccccccWWEE
EEEWWcccccwwwwwwwwwwwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhsssshhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhHhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwhhhhhhhhhwcccccWWEE
EEEWWcccccwwwwdddwwwwcccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
EEEWWcccccccccnnncccccccccWWEE
Ettttcccccccccnnnccccccccctttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttWWWWWWWWGGGWWWWWWWWttttt
EtttttEEEEEEEErrrEEEEEEEEttttt
```
How much the plans of the seeds differ: 0.00 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

```xml
<!--
FORTE. Parts and letters on the plan (a cell = 5 voxels):
  H centre; h the floor of the keep (mastio); w its walls; d its door; s the zone of its stair.
  K a corner turret of the keep, at one of its four corners, chosen by the seed.
  c the courtyard around the keep; W the curtain, two cells thick; t the corner towers;
  G the gatehouse on the axis of the keep door; n the paving; r the road to the edge;
  x the moat outside the curtain; Q the well, far from the gate.
Seeds change: the depth of the keep, the corner of the turret, where the stair runs along the back wall.
Sizes: at 5x5 a keep inside a thin ring. At 7.5 a wide yard with a well, a moat and the road over it.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtmdnGrxQsK" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <all in="wE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="***xx**" steps="1"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/>
      <all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="[Wt]E/*x" out="**/*x"/><all in="xE/*x" out="*x/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all in="xx/xW" out="**/*t"/>
      <all steps="2"><rule in="t[EWx]" out="*t"/><rule in="t*/*[EWx]" out="**/*t"/></all>
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
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1">
        <field for="Q" from="n" on="cn"/>
      </one>
      <one in="wwwwwwww/hhhhhhhh/hhhhhhhh" out="********/**ssss**/**ssss**" symmetry="()" steps="1"/>
      <one in="cc/cw" out="KK/KK" steps="1"/>
    </sequence>
    <map scale="5 5 1" values="BEhfFPsTaAVLdOgXqZuYjJcnrxIlkNoMU" symmetry="()">
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="H" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="W" out="qqqqq/qqqqq/qqqqq/qqqqq/qqqqq"/>
      <rule in="t" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="K" out="jjjjj/jjjjj/jjjjj/jjjjj/jjjjj"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="Q" out="IIIII/IlllI/IlllI/IlllI/IIIII"/>
      <sequence symmetry="(xy)">
        <!-- keep walls: 66 high, two bands of windows -->
        <all in="B a" out="a A" steps="6"/><all in="B a" out="a V" steps="14"/><all in="B a" out="a A" steps="12"/>
        <all in="B a" out="a A" steps="6"/><all in="B a" out="a V" steps="14"/><all in="B a" out="a A" steps="13"/>
        <prl in="a" out="A"/>
        <!-- keep door -->
        <all in="B d" out="d O" steps="1"/><all in="B d" out="d A" steps="64"/><prl in="d" out="A"/>
        <!-- keep floors, slab, platform -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="P"/><rule in="s" out="P"/></prl>
        <!-- turret, curtain, towers, gatehouse, well -->
        <all in="B j" out="j J" steps="71"/><prl in="j" out="J"/>
        <all in="B q" out="q Z" steps="23"/><prl in="q" out="Z"/>
        <all in="B u" out="u Y" steps="35"/><prl in="u" out="Y"/>
        <all in="B g" out="g O" steps="1"/><all in="B g" out="g X" steps="39"/><prl in="g" out="X"/>
        <all in="B I" out="I I" steps="3"/>
        <!-- windows -->
        <one steps="14"><rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="A"/>
        <!-- parts -->
        <union symbol="+" values="AZYXJ"/>
        <union symbol="=" values="fFP"/>
        <union symbol="%" values="YXJ"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="E" hidden="True"/>
  <color symbol="A" value="9a958b" name="pietra del mastio" area="keep"/>
  <color symbol="V" value="9a958b" name="pietra del mastio"/>
  <color symbol="L" value="3c5a78" name="finestra"/>
  <color symbol="f" value="a07a4c" name="assito" area="keep"/>
  <color symbol="F" value="7f5f3c" name="solaio" area="keep"/>
  <color symbol="P" value="8a8478" name="terrazza del mastio" area="keep"/>
  <color symbol="T" value="a07a4c" name="scala"/>
  <color symbol="k" value="6b4a2c" name="gradini di legno"/>
  <color symbol="O" value="7a4a2a" name="porta"/>
  <color symbol="o" value="4a2c18" name="assi della porta"/>
  <color symbol="N" value="5a4636" name="stipite"/>
  <color symbol="M" value="b0aa9c" name="merli"/>
  <color symbol="U" value="2a2622" name="feritoia"/>
  <color symbol="Z" value="c2b8a0" name="cinta muraria"/>
  <color symbol="Y" value="7a7268" name="torre d'angolo" area="tower"/>
  <color symbol="X" value="b0583c" name="torre della porta" area="gatehouse"/>
  <color symbol="J" value="5e6a72" name="torretta del mastio" area="tower"/>
  <color symbol="c" hidden="True" area="courtyard"/>
  <color symbol="n" value="a8a090" name="selciato" area="courtyard"/>
  <color symbol="r" value="b09a6a" name="strada"/>
  <color symbol="x" value="4a7fa8" name="fossato"/>
  <color symbol="I" value="6e6a62" name="pozzo" area="courtyard"/>
  <color symbol="l" value="3f6f9a" name="acqua del pozzo"/>
  <color symbol="#20" hidden="True"/>
  <color symbol="#21" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
