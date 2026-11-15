# model.sculpt · claude-sonnet-5-5 · 436 s

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
  FORTE. A keep in a courtyard, inside a curtain wall with corner towers and a gate.
  Parts and letters on the plan (a cell is 5 voxels):
    H/h  the keep, a hall of 9 wide by 9 or 10 deep around the centre; w its walls
    s    the zone of the stair, in the back-left corner of the keep, with two cells of landing
    d    the keep door, 3 cells wide, on the axis in the front wall
    c    the courtyard, a ring around the keep; n the paving from the keep door to the gate
    W    the curtain wall, one cell thick; G the gate, 3 cells wide, on the axis
    t    corner towers, 5 x 5 cells, placed on 2 to 4 of the 4 outer corners
    r    the road from the gate to the edge, 3 wide
    b    barracks (lean-to), 6 x 4 cells against the inside of the wall; Q a well; a the moat
  The seeds change: the depth of the keep (9 or 10), how many towers (2 to 4) and which corners, where the barracks and the well stand.
  What fits: Large (20) is the keep in a thin yard and ring with towers and a gate.
  Huge (30) widens the yard by 4 and adds barracks and a well.
  Gargantuan (40) widens the yard by another 3 and adds a moat with a causeway at the gate.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtGnrdmsbQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <!-- the keep: a line through H, 4 behind (one more by chance), 4 in front, then 4 to each side -->
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <!-- the zone of the stair: back-left corner of the keep, 2 cells of landing, 4 long, 2 wide -->
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <!-- the courtyard around the keep -->
      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <!-- where the ground goes on, the yard grows: 4 more at Huge, 3 more again at Gargantuan -->
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <!-- the curtain wall, one cell thick, corners filled -->
      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <!-- towers on the outer corners: two for sure, the others by chance -->
      <one in="EE/EW" out="**/*t" steps="2"/>
      <prl in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>

      <!-- the way out from the centre straight to the front: keep door d, paving n, gate G, road r -->
      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <!-- barracks against the wall, 6 wide and 4 deep, only where the yard is deep enough -->
      <one in="WWWWWW/cccccc/cccccc/cccccc/cccccc" out="******/bbbbbb/bbbbbb/bbbbbb/bbbbbb" steps="2"/>
      <!-- a well in 5 x 5 of free yard -->
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <!-- the moat, two cells wide, only where five cells of ground go on past the wall -->
      <all in="cWEEEEE" out="**aa***" steps="1"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="8DAA5B" name="erba"/>
  <color symbol="H" value="D9C27A" name="centro del maschio" area="keep"/>
  <color symbol="h" value="C9B37E" name="pavimento del maschio" area="keep"/>
  <color symbol="w" value="8A8D91" name="muro del maschio"/>
  <color symbol="d" value="7A4A2B" name="porta del maschio"/>
  <color symbol="s" value="B58B4A" name="zona della scala"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="c" value="D8C99B" name="cortile" area="courtyard"/>
  <color symbol="n" value="B9A98A" name="lastricato"/>
  <color symbol="W" value="6E7378" name="muro di cinta"/>
  <color symbol="t" value="4F545C" name="torre" area="tower"/>
  <color symbol="G" value="8C5A3C" name="portale"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="b" value="A9473A" name="caserma" area="barracks"/>
  <color symbol="Q" value="3E5F7F" name="pozzo"/>
  <color symbol="a" value="4F8FB5" name="fossato"/>
</sequence>

## What the game made of it
### large, seed 1: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del maschio, w muro del maschio, c cortile, W muro di cinta, t torre, G portale, n lastricato, r strada, d porta del maschio, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEttttt
EEEEEEEEEEEEEEEttttt
EEEWWWWWWWWWWWWttttt
EEEWcccccccccccccttt
EEEWcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EtttcwwwwdddwwwwcWEE
EtttcccccnnncccccWEE
EtttttWWWGGGWWWWWWEE
EtttttEEErrrEEEEEEEE
EtttttEEErrrEEEEEEEE
```
### large, seed 2: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del maschio, w muro del maschio, c cortile, W muro di cinta, t torre, G portale, n lastricato, r strada, d porta del maschio, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
Etttcccccccccccccttt
Etttcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EtttcwwwwdddwwwwcWEE
EtttcccccnnncccccWEE
EtttttWWWGGGWWWWWWEE
EtttttEEErrrEEEEEEEE
EtttttEEErrrEEEEEEEE
```
### large, seed 3: grid 20×20×80, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del maschio, w muro del maschio, c cortile, W muro di cinta, t torre, G portale, n lastricato, r strada, d porta del maschio, s zona della scala
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEE
EtttttEEEEEEEEEttttt
EtttttEEEEEEEEEttttt
EtttttWWWWWWWWWttttt
Etttcccccccccccccttt
Etttcwwwwwwwwwwwcttt
EEEWcwhhsssshhhwcWEE
EEEWcwhhsssshhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwhhhhhhhhhwcWEE
EEEWcwwwwdddwwwwcttt
EEEWcccccnnncccccttt
EEEWWWWWWGGGWWWttttt
EEEEEEEEErrrEEEttttt
EEEEEEEEErrrEEEttttt
```
### huge, seed 1: grid 30×30×120, one character = 1×1 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E erba, h pavimento del maschio, w muro del maschio, c cortile, W muro di cinta, t torre, G portale, n lastricato, r strada, d porta del maschio, s zona della scala, b caserma, Q pozzo
Plan (the letter of every cell):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttEEEEEEEEEEEEEEEEEtttttE
EEtttttWWWWWWWWWWWWWWWWWtttttE
EEtttccccccccccccccccccccctttE
EEtttccccccccccccccccccccctttE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccccccccccccccccccWEEE
EEEEWcccccwwwwwwwwwwwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhsssshhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcccccWEEE
EEEEWcccccwhhhhhhhhhwcbbbbWEEE
EEEEWccQccwhhhhhhhhhwcbbbbWEEE
EEEEWcccccwhhhhhhhhhwcbbbbWEEE
EEEEWcccccwhhhhhhhhhwcbbbbWEEE
EEEEWcccccwwwwdddwwwwcbbbbWEEE
EEEEWcccccccccnnncccccbbbbWEEE
EEEEWcccbbbbbbnnncccccccccWEEE
EEEEWcccbbbbbbnnncccccccccWEEE
EEtttcccbbbbbbnnnccccccccctttE
EEtttcccbbbbbbnnnccccccccctttE
EEtttttWWWWWWWGGGWWWWWWWtttttE
EEtttttEEEEEEErrrEEEEEEEtttttE
EEtttttEEEEEEErrrEEEEEEEtttttE
EEEEEEEEEEEEEErrrEEEEEEEEEEEEE
```
How much the plans of the seeds differ: 0.14 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).

## Block 2 of 2: the whole program. First correct the composition if the plans say so (the concept, the variety between the seeds, the box, the road to the edge, what the larger size holds). Then add the second map with a block for every plan letter, the heights (the columns, the strip of the stair, the slabs) and the full scale (the doors, the parts included, windows, roofs, cleaning, the colours, the actions). Answer with the whole program.

## Risposta

<!--
  FORTE. A keep in a courtyard, inside a curtain wall with corner towers and a gate.
  Plan letters (a cell is 5 voxels):
    H/h keep floor (9 wide, 9 to 11 deep); w keep wall; s stair zone (back-left corner, two cells of landing)
    d keep door (3 cells, on the axis, front wall); c courtyard; n paving from keep door to gate
    W curtain wall; G gate (3 cells, on the axis); t towers on 2 to 4 corners; u the one tall tower
    r road from the gate to the edge; b barracks lean-to (6 x 4 against the inside of a wall), p its two post cells
    Q well; a moat
  The seeds change: depth of the keep, how many towers and which corners, which tower is tall,
  which walls hold the barracks, where the well stands.
  Large: keep, thin yard, ring, towers, gate. Huge: wider yard, barracks, well. Gargantuan: wider yard again and a moat with a causeway.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwcWtuGnrdmsbpQa" symmetry="()">
    <rule in="E" out="E"/>
    <rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="4"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="4"/>
      <prl in="E/h" out="h/*" p="0.5" steps="1" symmetry="()"/>
      <prl in="h/E" out="*/h" p="0.5" steps="1" symmetry="()"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>

      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>

      <all in="wE" out="*c" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEE" out="*cccc**" steps="1"/>
      <all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEE" out="*ccc****" steps="1"/>
      <all in="cE/*c" out="*c/**"/>

      <all in="cE" out="*W"/>
      <all in="WE/*W" out="*W/**"/>

      <one in="EE/EW" out="**/*t" steps="2"/>
      <prl in="EE/EW" out="**/*t" p="0.5" steps="1"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <one in="t" out="u" steps="1" symmetry="()"/>
      <all in="ut" out="*u"/>

      <all in="H/h" out="*/m" symmetry="()" steps="1"/>
      <all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/>
      <all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/>
      <all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/>
      <all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/>
      <all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>

      <one in="WWWWWW/cccccc/cccccc/cccccc/cccccc" out="******/bbbbbb/bbbbbb/bbbbbb/pbbbbp" steps="2"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>

      <all in="cWEEEEE" out="**aa***" steps="1"/>
      <all in="aE/*a" out="*a/**"/>
    </sequence>

    <map scale="5 5 1" values="BEhgxVwFRLWtuGnrcbPJyQaOoNMUTkds#90#91#92#93#94#20#21" symmetry="()">
      <union symbol="+" values="wxWtuGd"/>
      <union symbol="=" values="hF"/>
      <union symbol="%" values="wxW"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="W" out="WWWWW/WWWWW/WWWWW/WWWWW/WWWWW"/>
      <rule in="t" out="ttttt/ttttt/ttttt/ttttt/ttttt"/>
      <rule in="u" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="G" out="GGGGG/GGGGG/GGGGG/GGGGG/GGGGG"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="b" out="bbbbb/bbbbb/bbbbb/bbbbb/bbbbb"/>
      <rule in="p" out="bbbbb/bPPPb/bPPPb/bPPPb/bbbbb"/>
      <rule in="Q" out="QQQQQ/QaaaQ/QaaaQ/QaaaQ/QQQQQ"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>

      <sequence symmetry="(xy)">
        <!-- B. keep walls (65 high, bands for windows) and the door columns -->
        <all steps="6"><rule in="B w" out="w x"/><rule in="B d" out="d x"/></all>
        <all steps="14"><rule in="B w" out="w V"/><rule in="B d" out="d x"/></all>
        <all steps="12"><rule in="B w" out="w x"/><rule in="B d" out="d x"/></all>
        <all steps="6"><rule in="B w" out="w x"/><rule in="B d" out="d x"/></all>
        <all steps="14"><rule in="B w" out="w V"/><rule in="B d" out="d x"/></all>
        <all steps="13"><rule in="B w" out="w x"/><rule in="B d" out="d x"/></all>
        <prl in="d" out="w"/>

        <!-- curtain wall 24, towers 40, tall tower 56, gate 40, well 8, barracks posts and roof markers -->
        <all in="B b" out="y *" steps="1"/>
        <all steps="7">
          <rule in="B Q" out="Q Q"/><rule in="B W" out="W W"/><rule in="B t" out="t t"/>
          <rule in="B u" out="u u"/><rule in="B G" out="G G"/><rule in="B P" out="P P"/><rule in="B y" out="y B"/>
        </all>
        <all steps="16">
          <rule in="B W" out="W W"/><rule in="B t" out="t t"/><rule in="B u" out="u u"/>
          <rule in="B G" out="G G"/><rule in="B P" out="P P"/><rule in="B y" out="y B"/>
        </all>
        <all steps="10">
          <rule in="B t" out="t t"/><rule in="B u" out="u u"/><rule in="B G" out="G G"/>
          <rule in="B P" out="P P"/><rule in="B y" out="y B"/>
        </all>
        <all steps="6"><rule in="B t" out="t t"/><rule in="B u" out="u u"/><rule in="B G" out="G G"/></all>
        <all in="B u" out="u u" steps="16"/>
        <prl in="y" out="J"/>
        <all in="B P" out="J P" steps="1"/>
        <all in="B J" out="J J" steps="1"/>

        <!-- the keep: floor, strip of the stair, air, slab, air, roof -->
        <all steps="1"><rule in="B h" out="g h"/><rule in="B s" out="s h"/></all>
        <all in="B s" out="s T" steps="1" symmetry="()"/>
        <all in="B g" out="g B" steps="31"/>
        <all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B g" out="g F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B g" out="g B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="g" out="R"/><rule in="s" out="R"/></prl>

        <!-- C. doors from the plan: through the whole thickness of the wall -->
        <all in="x/n" out="O/*" symmetry="()" steps="1"/>
        <all in="x/O" out="O/*" symmetry="()" steps="4"/>
        <all in="G/r" out="O/*" symmetry="()" steps="1"/>
        <all in="G/O" out="O/*" symmetry="()" steps="4"/>

        <!-- windows in the bands of the keep -->
        <one steps="14">
          <rule in="BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV BV/BV/BV/BV/BV/BV" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/>
        </one>
        <all in="LVVVVB" out="*LLLL*"/>
        <prl in="V" out="x"/>

        <!-- the parts -->
        <import file="part-battlements"/>
        <import file="part-slits"/>
        <import file="part-door"/>
        <import file="part-stair"/>
      </sequence>
    </map>
  </map>
  <color symbol="B" value="000000" name="aria"/>
  <color symbol="E" value="8DAA5B" name="erba"/>
  <color symbol="H" value="D9C27A" name="centro del maschio" area="keep"/>
  <color symbol="h" value="C8A870" name="pavimento del maschio" area="keep"/>
  <color symbol="x" value="D8CDB0" name="intonaco del maschio"/>
  <color symbol="w" value="B9AD92" name="pietra del maschio"/>
  <color symbol="F" value="8B6B43" name="solaio"/>
  <color symbol="R" value="7C7F85" name="terrazza del maschio"/>
  <color symbol="L" value="34506E" name="finestra"/>
  <color symbol="s" value="B58B4A" name="zona della scala"/>
  <color symbol="d" value="7A4A2B" name="porta del maschio"/>
  <color symbol="m" value="FF00FF" name="segno"/>
  <color symbol="c" value="D8C99B" name="cortile" area="courtyard"/>
  <color symbol="n" value="B9A98A" name="lastricato"/>
  <color symbol="W" value="6E7378" name="muro di cinta"/>
  <color symbol="t" value="5A606A" name="torre" area="tower"/>
  <color symbol="u" value="4A5058" name="torre alta" area="tower"/>
  <color symbol="G" value="8E8374" name="portale"/>
  <color symbol="r" value="C2A878" name="strada"/>
  <color symbol="b" value="A07E50" name="assito della caserma" area="barracks"/>
  <color symbol="p" value="A07E50" name="angolo della caserma" area="barracks"/>
  <color symbol="P" value="5E3F24" name="palo"/>
  <color symbol="J" value="A9473A" name="tetto di tegole"/>
  <color symbol="Q" value="8D9096" name="pozzo"/>
  <color symbol="a" value="4F8FB5" name="acqua"/>
  <color symbol="M" value="9AA0A6" name="merlo"/>
  <color symbol="U" value="15181C" name="feritoia"/>
  <color symbol="O" value="7A4A2B" name="porta"/>
  <color symbol="o" value="3F2A1B" name="assi della porta"/>
  <color symbol="N" value="5B5F66" name="stipite"/>
  <color symbol="k" value="B8A27A" name="gradino"/>
  <color symbol="#20" value="000000" hidden="True" name="porta aperta"/>
  <color symbol="#21" value="000000" hidden="True" name="assi aperte"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
