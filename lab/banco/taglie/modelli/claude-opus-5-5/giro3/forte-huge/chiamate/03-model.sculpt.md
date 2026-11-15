# model.sculpt · claude-opus-5-5 · 51 s

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

The program you wrote:
<!--
FORTE: a ring of curtain walls with corner towers, a gatehouse on the front axis, a keep in the courtyard.
Plan letters:
  h  keep floor around H; w keep walls; x turret on one corner of the keep; s stair zone along the keep's back wall
  c  courtyard around the keep; W curtain wall, two cells thick; t corner towers
  d  keep door; n paving; G gatehouse in the ring; r road to the front edge (all on the axis, three cells wide)
  Q  well, only where 5x5 of yard is free; a  moat, only where 8 cells of ground go on past the ring
  e  marker: the front of the keep ends here
Seeds change the keep depth, the turret corner, a second turret, and where the well stands.
Huge: keep, thin yard, ring, four towers, gate, road.
Gargantuan: a wider yard with a well, and a moat at the back and sides.
Heights: wall 25, towers 40, gatehouse 48, keep 70 (two storeys), turret 88.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwxscWtGrdnQame" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <prl in="e" out="E"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*cccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="wwwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="WWEEEEEEEE" out="**aa******" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdxvugcnrqaFfTkWbLRCKYMOoNU" symmetry="()">
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="W" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <!-- keep walls, with the door seed at the foot -->
        <all steps="1"><rule in="B w" out="w W"/><rule in="B d" out="w O"/></all>
        <all in="B w" out="w W" steps="5"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <prl in="w" out="W"/>
        <!-- keep floors: planks, stair strip, slab, roof -->
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <!-- turret, curtain, towers, gatehouse, well -->
        <all in="B x" out="x K" steps="87"/><prl in="x" out="K"/>
        <all in="B v" out="v C" steps="24"/><prl in="v" out="C"/>
        <all in="B u" out="u K" steps="39"/><prl in="u" out="K"/>
        <all in="B g" out="g O" steps="1"/><all in="B g" out="g K" steps="46"/><prl in="g" out="K"/>
        <all in="B q" out="q Y" steps="7"/><prl in="q" out="Y"/>
        <!-- windows of the keep -->
        <one steps="14"><rule in="Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LbbbbB" out="*LLLL*"/>
        <prl in="b" out="W"/>
        <union symbol="+" values="WCK"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="CK"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="c" value="c9b98a" hidden="True" area="courtyard"/>
  <color symbol="n" value="a09070" name="selciato" area="courtyard"/>
  <color symbol="r" value="b89c6a" name="strada"/>
  <color symbol="a" value="5a8ab0" name="acqua"/>
  <color symbol="f" value="b08a5a" name="assito" area="keep"/>
  <color symbol="F" value="8a6a44" name="solaio" area="keep"/>
  <color symbol="W" value="d8cfbc" name="muro del mastio"/>
  <color symbol="L" value="3a5070" name="finestra"/>
  <color symbol="R" value="a83a2a" name="tetto in cotto" area="keep"/>
  <color symbol="C" value="a8a296" name="mura"/>
  <color symbol="K" value="857f74" name="pietra delle torri" area="tower"/>
  <color symbol="Y" value="6e6a62" name="pozzo"/>
  <color symbol="M" value="9a9488" name="merli"/>
  <color symbol="U" value="2a2a2a" name="feritoia"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2c16" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="T" value="6a4a30" name="scala"/>
  <color symbol="k" value="6a4a30" name="gradini"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
It does not pass: taglia Enorme, seme 2: piani: 1 (serve ≥ 2) — the covered storeys a body reaches on foot from the front of the box, through the door the action open takes away, climbing stairs in line
What the game made of it, in text:
### Seed 2 at huge: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, c marker, W muro del mastio, r strada, n selciato, F solaio, f assito, L finestra, R tetto in cotto, C mura, K pietra delle torri, M merli, O porta, o assi della porta, N stipite, U feritoia
Plan (the letter on top of every column):
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEKKKKKKMEEEEEEEEEEEEEEEEEEEEEEEKKKKKKMEEEEE
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE
EEEEEEEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE
EEEEEEEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE
EEEEEEEKKKKKKKMCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE
EEEEEEEKKKKKKcccccccccccccccccccccccccKKKKKKKEEEEE
EEEEEEEKKKKKKcccccccccccccccccccccccccMKKKKKMEEEEE
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE
EEEEEEEEEECCCcccccWWWWWWWWWWWWWWWcMcccCCCCEEEEEEEE
EEEEEEEEEECCCccccKWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWWWcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWWMcccCCCCEEEEEEEE
EEEEEEEEEECCCccccccccccnnnnnccccccccccCCCCEEEEEEEE
EEEEEEEEKKKKCccccccccccnnnnncccccccccccCKMKKMEEEEE
EEEEEEEKKKKKKccccccccccnnnnnccccccccccKKKKKKKEEEEE
EEEEEEEKKKKKKKMCCCCCCCCMKKKKNCCCCCCCCKKKKKKKKEEEEE
EEEEEEEKKKKKKKKCCCCCCCCKKKKKNCCCCCCCCKKKKKKKKEEEEE
EEEEEEEKKKKKKKKCCCCCCCCKKKKKMCCCCCCCCKKKKKKKKEEEEE
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE
EEEEEEEKKKKKKKMEEEEEEEErrrrrEEEEEEEEEKKKKKKKMEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE
```
Heights (the top of every column, from 0 to z: 36 steps of the height of the grid):
```
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
000000ddddddddd000000000000000000000ddddddddd00000
000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
000000dbbbbbbbd777777777777777777777dbbbbbbbd00000
000000bbbbbbbbd777777777777777777777dbbbbbbbb00000
000000dbbbbbbbd777777777777777777777dbbbbbbbd00000
000000bbbbbbbbd777777777777777777777ddbbbbbbb00000
000000dbbbbbbd000000000000000000000000dbbbbbd00000
000000dddddddd000000000000000000000000ddbdddd00000
00000000007777000000000000000000000000777700000000
0000000000777700rrrllllllllllllllrr000777700000000
0000000000777700rrrllllllllllllllrr000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700llljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
0000000000777700llljjjjjjjjjjjjjjll000777700000000
0000000000777700mlllllllllllllllllm000777700000000
0000000000777700mmmmmlmmmmmlmmmmmmm000777700000000
00000000007777000000000000000000000000777700000000
000000dddddddd000000000000000000000000ddbdddd00000
000000dbbbbbbd000000000000000000000000dbbbbbd00000
000000bbbbbbbbd77777777gggggg7777777ddbbbbbbb00000
000000dbbbbbbbd77777777geeeeg7777777dbbbbbbbd00000
000000bbbbbbbbd77777777geeeeg7777777dbbbbbbbb00000
000000dbbbbbbbd77777777gggggg7777777dbbbbbbbd00000
000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
000000ddddddddd000000000000000000000ddddddddd00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.................M...............MM...............
.................M...............MM...............
.................K...............KK...............
.................K...............KK...............
.................K...............KK...............
.................M..M.M...M.M..M.MM...............
.................M.MM.MM.MM.MM.M.MM...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWWWWWWWWWWWWW...............
.................WWWWWWMMMWMWWWWWWW...............
.................WWWWWLMMMWMWLLWWWW...............
.................WWWWWLKKKKKWLLWWWW...............
.......M.MMMMMM..WWWWWLKKKKKWLLWWWW..MMM.M.MM.....
.......MKMMMMMM..WWWWWWKKKKKWLLWWWW..MMMKMKMM.....
.......KKKKKKKK..WWWWWWKKKKKWWWWWWW..KKKKKKKK.....
.......KKKKKKKK..WWWWWWKKKKKWWWWWWW..KKKKKKKK.....
.......KKKKKKKK..WWWWWWKKKKKWWWWWWW..KKKKKKKK.....
.......KKKKKKKK..WWWWWWNooooOWWWWWW..KKKKKKKK.....
.......KKKKKKKK.CWWWWWWNooooOWWWWWW.KKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCNooooOCCCCCCCCKKKKKKKK.....
......EKKKKKKKKCCCCCCCCrooooECCCCCCCCKKKKKKKK.....
```
Right side (looking from the right):
```
..................MM..............................
..................MM..............................
..................KK..............................
..................KK..............................
..................KK..............................
..................KK..M..M.M..M..M.M..............
..................KKM.M.MM.MM.M.MM.MM.............
..................KKWWWWWWWWWWWWWWWWW.............
..................KKWWWWWWWWWWWWWWWWW.............
..................KKWWWWWWWWWWWWWWWWW.............
..................KKWWWWWWWWWWWWWWWWW.............
..................KKWWWWWWWWWWWWWWWWW.............
..................KKWWWWWWWWWWWWWWWWW.............
..................KKWWWWWWWWWWWWWWWWW...MMM.......
..................KKWWWWWWWWWWWWWWWWW...MMM.......
..................KKWWLLWWWWWWWWWWWWW...KKKM......
........MM.M.MMMM.KKWWLLWWWWWWWWWWWWW.MMMMKM.MM...
........MM.MKMMMM.KKWWLLWWWWWWWWWWWWW.MMMMKM.MM...
........KKKKKKKKK.KKWWWWWWWWWWWWWWWWW.KKKKKKKKK...
........KKKKKKKKK.KKWWWWWWWWWWWWWWWWW.KKKKKKKKK...
........KKKKKKKKK.KKWWWWWWWWWWWWWWWWW.KKKKKKKKK...
........KKKKKKKKK.KKWWWWWWWWWWWWWWWWW.KKKKKKKKK...
........KKKKKKKKK.KKWWWWWWWWWWWWWWWWW.KKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
........KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.......KKKKKKKK......................KKKKKKKK.....
.......KKKKKKKK......................KKKKKKKK.....
.......KKKKKKKK......................KKKKKKKK.....
.......KKKKKKKK.....................KKKKKKKKK.....
.......KKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKK.....
.......KKKKKK.........................KKKKKKK.....
.......KKKKKK.........................KKKKKKK.....
..........CCC.........................CCCC........
..........CCC....KWWWWWWWWLLWWWWWKK...CCCC........
..........CCC....KWWWWWWWWLLWWWWWKK...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....L...............WW...CCCC........
..........CCC....L...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............LL...CCCC........
..........CCC....L...............LL...CCCC........
..........CCC....L...............WW...CCCC........
..........CCC....L...............WW...CCCC........
..........CCC....L...............WW...CCCC........
..........CCC....WWWWWWoooooNWWWWWW...CCCC........
..........CCC....WWWWWWoooooNWWWWWW...CCCC........
..........CCC.........................CCCC........
.......KKKKKK.........................KKKKKKK.....
.......KKKKKK.........................KKKKKKK.....
.......KKKKKKKKCCCCCCCCoooooNCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCooooooCCCCCCCCKKKKKKKK.....
.......KKKKKKKKCCCCCCCCooooooCCCCCCCCKKKKKKKK.....
.......KKKKKKKK.....................KKKKKKKKK.....
.......KKKKKKKK......................KKKKKKKK.....
.......KKKKKKKK......................KKKKKKKK.....
.......KKKKKKKK......................KKKKKKKK.....
..................................................
..................................................
..................................................
```
Cut at z=43 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..............M...................................
..................................................
..................................................
..................................................
.................KWWWWLLWWWWWWWWWKK...............
.................KWWWWLLWWWWWWWWWKK...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................WWWWWLLWWLLWLLWWWW...............
.................WWWWWLLWWLLWLLWWWW...............
..................................................
..................................................
..................................................
..............M........KKKKU......................
.......................KKKKK......................
.......................KKKKU......................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
Cut at z=75 (the letters at that height: doors, rooms, stairs):
```
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................K................K...............
.................K...............KK...............
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
```
### Seed 1: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEKKKKKKMEEEEEEEEEEEEEEEEEEEEEEEKKKKKKMEEEEE   000000ddddddddd000000000000000000000ddddddddd00000
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd777777777777777777777dbbbbbbbd00000
EEEEEEEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd777777777777777777777dbbbbbbbb00000
EEEEEEEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   000000dbbbbbbbd777777777777777777777dbbbbbbbd00000
EEEEEEEKKKKKKKMCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd777777777777777777777ddbbbbbbb00000
EEEEEEEKKKKKKcccccccccccccccccccccccccKKKKKKKEEEEE   000000dbbbbbbd000000000000000000000000dbbbbbd00000
EEEEEEEKKKKKKcccccccccccccccccccccccccMKKKKKMEEEEE   000000dddddddd000000000000000000000000ddbdddd00000
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE   00000000007777000000000000000000000000777700000000
EEEEEEEEEECCCcccccWWcWcWWcWWcWcWWMMcccCCCCEEEEEEEE   0000000000777700mmmmmlmmmmmmmlmmmrr000777700000000
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE   0000000000777700mllllllllllllllllrr000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700llljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700llljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE   0000000000777700mllllllllllllllllrr000777700000000
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE   0000000000777700mmmmmlmmmmmmmlmmmrr000777700000000
EEEEEEEEEECCCccccccccccnnnnnccccccccccCCCCEEEEEEEE   00000000007777000000000000000000000000777700000000
EEEEEEEEKKKKCccccccccccnnnnncccccccccccCKMKKMEEEEE   000000dddddddd000000000000000000000000ddbdddd00000
EEEEEEEKKKKKKccccccccccnnnnnccccccccccKKKKKKKEEEEE   000000dbbbbbbd000000000000000000000000dbbbbbd00000
EEEEEEEKKKKKKKMCCCCCCCCMKKKKMCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd77777777gggggg7777777ddbbbbbbb00000
EEEEEEEKKKKKKKKCCCCCCCCKKKKKNCCCCCCCCKKKKKKKKEEEEE   000000dbbbbbbbd77777777geeeeg7777777dbbbbbbbd00000
EEEEEEEKKKKKKKKCCCCCCCCNKKKKNCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd77777777geeeeg7777777dbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd77777777gggggg7777777dbbbbbbbd00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
EEEEEEEKKKKKKKMEEEEEEEErrrrrEEEEEEEEEKKKKKKKMEEEEE   000000ddddddddd000000000000000000000ddddddddd00000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEKKKKKKMEEEEEEEEEEEEEEEEEEEEEEEKKKKKKMEEEEE   000000ddddddddd000000000000000000000ddddddddd00000
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd777777777777777777777dbbbbbbbd00000
EEEEEEEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd777777777777777777777dbbbbbbbb00000
EEEEEEEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   000000dbbbbbbbd777777777777777777777dbbbbbbbd00000
EEEEEEEKKKKKKKMCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd777777777777777777777ddbbbbbbb00000
EEEEEEEKKKKKKcccccccccccccccccccccccccKKKKKKKEEEEE   000000dbbbbbbd000000000000000000000000dbbbbbd00000
EEEEEEEKKKKKKcccccccccccccccccccccccccMKKKKKMEEEEE   000000dddddddd000000000000000000000000ddbdddd00000
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE   00000000007777000000000000000000000000777700000000
EEEEEEEEEECCCcccccMWcWWcWWcWcWWcWWMcccCCCCEEEEEEEE   0000000000777700rrrlmmmmmmmlmmmmmmm000777700000000
EEEEEEEEEECCCccccKWWWWWWWWWWWWWWWWWcccCCCCEEEEEEEE   0000000000777700rrrlllllllllllllllm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700llljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjll000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700mlljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000000000777700llljjjjjjjjjjjjjjlm000777700000000
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE   0000000000777700mllllllllllllllllrr000777700000000
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE   0000000000777700mmmmmlmmmmmmmlmmmrr000777700000000
EEEEEEEEEECCCccccccccccnnnnnccccccccccCCCCEEEEEEEE   00000000007777000000000000000000000000777700000000
EEEEEEEEKKKKCccccccccccnnnnncccccccccccCKMKKMEEEEE   000000dddddddd000000000000000000000000ddbdddd00000
EEEEEEEKKKKKKccccccccccnnnnnccccccccccKKKKKKKEEEEE   000000dbbbbbbd000000000000000000000000dbbbbbd00000
EEEEEEEKKKKKKKMCCCCCCCCMKKKKNCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd77777777gggggg7777777ddbbbbbbb00000
EEEEEEEKKKKKKKKCCCCCCCCKKKKKNCCCCCCCCKKKKKKKKEEEEE   000000dbbbbbbbd77777777geeeeg7777777dbbbbbbbd00000
EEEEEEEKKKKKKKKCCCCCCCCNKKKKMCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd77777777geeeeg7777777dbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd77777777ggeggg7777777dbbbbbbbd00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
EEEEEEEKKKKKKKMEEEEEEEErrrrrEEEEEEEEEKKKKKKKMEEEEE   000000ddddddddd000000000000000000000ddddddddd00000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.01 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 2: griglia 150×150×120, 140 nodi, 476 passi, finito in 680 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald, h=honey, w=white, x=x, c=cyan (marcatore), W=muro del mastio, t=teal, G=Green, r=strada, d=dead, dark, n=selciato, m=magenta, e=emerald, v=olive, u=blue, g=green, F=solaio, f=assito, b=black, L=finestra, R=tetto in cotto, C=mura, K=pietra delle torri, M=merli, O=porta, o=assi della porta, N=stipite, U=feritoia, #90=? (marcatore), #91=? (marcatore).
Alla fine: K 99446, W 61897, C 60750, E 11575, o 6510, U 3504, L 2928, c 2450, M 2436, f 2025, F 2025, R 2025, N 1025, r 300, O 240, n 150.
  #3 map scala 1/5 1/5 1: ×1, 900 celle x0-29 y0-29 z0-119, passi 1
#5-36 all×25, one×3, prl×2: 498 celle x4-26 y5-29 z0, passi 2-49
   #43 map scala 5 5 1: ×1, 22500 celle x0-149 y0-149 z0-119, passi 50
#45-46 all×2: 11400 celle x50-104 y55-109 z0-6, passi 51-56
    #47 all . w → w b passi=14: ×14, 26600 celle x50-104 y55-109 z6-20, passi 57-70, w→b 13300, .→w 13300
#48-49 all×2: 34200 celle x50-104 y55-109 z20-38, passi 71-88
    #50 all . w → w b passi=14: ×14, 26600 celle x50-104 y55-109 z38-52, passi 89-102, w→b 13300, .→w 13300
    #51 all . w → w W passi=12: ×12, 22800 celle x50-104 y55-109 z52-64, passi 103-114, w→W 11400, .→w 11400
#52-54 all×2, prl×1: 16400 celle x50-104 y55-109 z0-70, passi 115-122
    #56 all . h → h . passi=31: ×31, 125550 celle x55-99 y60-104 z1-32, passi 123-153, h→. 62775, .→h 62775
    #58 all . h → h F (+1) passi=1: ×1, 4050 celle x55-99 y60-104 z32-33, passi 154, h→F 2025, .→h 2025
      r1 . h → h F ×2025; r2 . s → s F ×0
    #59 all . h → h . (+1) passi=31: ×31, 125550 celle x55-99 y60-104 z33-64, passi 155-185, h→. 62775, .→h 62775
      r1 . h → h . ×62775; r2 . s → s . ×0
#60-62 prl×2, all×1: 10775 celle x50-104 y55-104 z0-87, passi 186-274
    #63 all . v → v C passi=24: ×24, 117600 celle x30-124 y35-129 z0-24, passi 275-298, v→C 58800, .→v 58800
    #64 prl v → C: ×1, 2450 celle x30-124 y35-129 z24, passi 299, v→C 2450
    #65 all . u → u K passi=39: ×39, 187200 celle x20-134 y25-139 z0-39, passi 300-338, u→K 93600, .→u 93600
#66-73 prl×2, all×3, one×1: 19578 celle x20-134 y25-139 z0-51, passi 339-402
    #74 prl b → W: ×1, 23672 celle x50-104 y55-109 z6-51, passi 403, b→W 23672
#81-140 all×11, prl×2: 23154 celle x20-134 y25-139 z0-93, passi 404-476
Senza effetto (non hanno mai cambiato una cella):
#18 all cEEEEEEEEEEE → *cccc******* passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#19 all cE/*c → *c/**: le celle cercate c'erano, ma mai disposte come nel pattern
#37 one wwwwwww/whhhhhh/whhhhhh → *******/***ssss/***ssss passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#38 one ccccc/ccccc/ccccc/ccccc/ccccc → *****/*****/**Q**/*****/***** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#39 all WWEEEEEEEE → **aa****** passi=1: le celle cercate c'erano, ma mai disposte come nel pattern
#40 all [Wt]E/*a → **/*a: in quel momento nella griglia non c'erano celle "a"
#41 all aE/*a → *a/**: in quel momento nella griglia non c'erano celle "a"
#55 all . s → s T passi=1: in quel momento nella griglia non c'erano celle "s"
#57 all . s → s . passi=30: in quel momento nella griglia non c'erano celle "s"
#70 all . q → q Y passi=7: in quel momento nella griglia non c'erano celle "q"
#71 prl q → Y: in quel momento nella griglia non c'erano celle "q"
#76 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
… e altri 48
Fix it and answer with the whole program.

## Risposta

```xml
<!--
FORTE: a ring of curtain walls with corner towers, a gatehouse on the front axis, a keep in the courtyard.
Plan letters:
  h  keep floor around H; w keep walls; x turret on one corner of the keep; s stair zone along the keep's back wall
  c  courtyard around the keep; W curtain wall, two cells thick; t corner towers
  d  keep door; n paving; G gatehouse in the ring; r road to the front edge (all on the axis, three cells wide)
  Q  well, only where 5x5 of yard is free; a  moat, only where 8 cells of ground go on past the ring
  e  marker: the front of the keep ends here
Seeds change the keep depth, the turret corners, which side of the yard grows wider, and where the well stands.
Huge: keep, yard widened on one side, ring, four towers, gate, road.
Gargantuan: a wider yard with a well, and a moat.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwxscWtGrdnQame" symmetry="()">
    <rule in="E" out="E"/><rule in="H" out="H"/>
    <sequence symmetry="(xy)">
      <all in="E/[Hh]" out="h/*" symmetry="()" steps="3"/>
      <all in="[Hh]/E" out="*/h" symmetry="()" steps="5"/>
      <one steps="1" symmetry="()"><rule in="h/E" out="*/h"/><rule in="h/E" out="*/e"/></one>
      <prl in="e" out="E"/>
      <all in="[Hh]E" out="*h" symmetry="(x)" steps="4"/>
      <all in="hE" out="*w"/>
      <all in="wE/*w" out="*w/**"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <one in="EE/Ew" out="**/*x" steps="1"/>
      <all in="[wx]E" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*c" steps="1"/><all in="cE/*c" out="*c/**"/>
      <one in="cEEEEEEEE" out="*ccc*****" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cEEEEEEEEEEE" out="*cccc*******" steps="1"/><all in="cE/*c" out="*c/**"/>
      <all in="cE" out="*W"/><all in="WE/*W" out="*W/**"/><all in="WE" out="*W" steps="1"/><all in="WE/*W" out="*W/**"/>
      <all in="EE/EW" out="**/*t"/>
      <all steps="2"><rule in="t[EW]" out="*t"/><rule in="t*/*[EW]" out="**/*t"/></all>
      <all in="H/h" out="*/m" symmetry="()" steps="1"/><all in="m/h" out="*/m" symmetry="()"/>
      <all in="m/w" out="*/d" symmetry="()" steps="1"/><all in="[dn]/c" out="*/n" symmetry="()"/>
      <all in="[nG]/W" out="*/G" symmetry="()"/><all in="[Gr]/E" out="*/r" symmetry="()"/>
      <all in="dw" out="*d" symmetry="(x)" steps="1"/><all in="nc" out="*n" symmetry="(x)" steps="1"/>
      <all in="GW" out="*G" symmetry="(x)" steps="1"/><all in="rE" out="*r" symmetry="(x)" steps="1"/>
      <prl><rule in="m" out="h"/><rule in="H" out="h"/></prl>
      <one in="[wx]wwwwww/whhhhhh/whhhhhh" out="*******/***ssss/***ssss" symmetry="()" steps="1"/>
      <one in="ccccc/ccccc/ccccc/ccccc/ccccc" out="*****/*****/**Q**/*****/*****" steps="1"/>
      <all in="WWEEEEEEEE" out="**aa******" steps="1"/>
      <all in="[Wt]E/*a" out="**/*a"/><all in="aE/*a" out="*a/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdxvugcnrqaFfTkWbLRCKYMOoNU" symmetry="()">
      <rule in="h" out="hhhhh/hhhhh/hhhhh/hhhhh/hhhhh"/>
      <rule in="s" out="sssss/sssss/sssss/sssss/sssss"/>
      <rule in="w" out="wwwww/wwwww/wwwww/wwwww/wwwww"/>
      <rule in="d" out="ddddd/ddddd/ddddd/ddddd/ddddd"/>
      <rule in="x" out="xxxxx/xxxxx/xxxxx/xxxxx/xxxxx"/>
      <rule in="W" out="vvvvv/vvvvv/vvvvv/vvvvv/vvvvv"/>
      <rule in="t" out="uuuuu/uuuuu/uuuuu/uuuuu/uuuuu"/>
      <rule in="G" out="ggggg/ggggg/ggggg/ggggg/ggggg"/>
      <rule in="c" out="ccccc/ccccc/ccccc/ccccc/ccccc"/>
      <rule in="n" out="nnnnn/nnnnn/nnnnn/nnnnn/nnnnn"/>
      <rule in="r" out="rrrrr/rrrrr/rrrrr/rrrrr/rrrrr"/>
      <rule in="Q" out="qqqqq/qaaaq/qaaaq/qaaaq/qqqqq"/>
      <rule in="a" out="aaaaa/aaaaa/aaaaa/aaaaa/aaaaa"/>
      <rule in="E" out="EEEEE/EEEEE/EEEEE/EEEEE/EEEEE"/>
      <sequence symmetry="(xy)">
        <all steps="1"><rule in="B w" out="w W"/><rule in="B d" out="w O"/></all>
        <all in="B w" out="w W" steps="5"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/><all in="B w" out="w b" steps="14"/><all in="B w" out="w W" steps="12"/>
        <all in="B w" out="w W" steps="6"/>
        <prl in="w" out="W"/>
        <all steps="1"><rule in="B h" out="h f"/><rule in="B s" out="s f"/></all>
        <all in="B s" out="s T" steps="1"/>
        <all in="B h" out="h B" steps="31"/><all in="B s" out="s B" steps="30"/>
        <all steps="1"><rule in="B h" out="h F"/><rule in="B s" out="s F"/></all>
        <all steps="31"><rule in="B h" out="h B"/><rule in="B s" out="s B"/></all>
        <prl><rule in="h" out="R"/><rule in="s" out="R"/></prl>
        <all in="B x" out="x K" steps="87"/><prl in="x" out="K"/>
        <all in="B v" out="v C" steps="24"/><prl in="v" out="C"/>
        <all in="B u" out="u K" steps="39"/><prl in="u" out="K"/>
        <all in="B g" out="g O" steps="1"/><all in="B g" out="g K" steps="46"/><prl in="g" out="K"/>
        <all in="B q" out="q Y" steps="7"/><prl in="q" out="Y"/>
        <one steps="14"><rule in="Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb Bb/Bb/Bb/Bb/Bb/Bb" out="*L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L *L/*L/*L/*L/*L/*L"/></one>
        <all in="LbbbbB" out="*LLLL*"/>
        <prl in="b" out="W"/>
        <union symbol="+" values="WCK"/>
        <union symbol="=" values="fF"/>
        <union symbol="%" values="CK"/>
        <import file="part-door"/>
        <import file="part-stair"/>
        <import file="part-battlements"/>
        <import file="part-slits"/>
      </sequence>
    </map>
  </map>
  <color symbol="c" value="c9b98a" hidden="True" area="courtyard"/>
  <color symbol="n" value="a09070" name="selciato" area="courtyard"/>
  <color symbol="r" value="b89c6a" name="strada"/>
  <color symbol="a" value="5a8ab0" name="acqua"/>
  <color symbol="f" value="b08a5a" name="assito" area="keep"/>
  <color symbol="F" value="8a6a44" name="solaio" area="keep"/>
  <color symbol="W" value="d8cfbc" name="muro del mastio"/>
  <color symbol="L" value="3a5070" name="finestra"/>
  <color symbol="R" value="a83a2a" name="tetto in cotto" area="keep"/>
  <color symbol="C" value="a8a296" name="mura"/>
  <color symbol="K" value="857f74" name="pietra delle torri" area="tower"/>
  <color symbol="Y" value="6e6a62" name="pozzo"/>
  <color symbol="M" value="9a9488" name="merli"/>
  <color symbol="U" value="2a2a2a" name="feritoia"/>
  <color symbol="O" value="7a4a28" name="porta"/>
  <color symbol="o" value="4a2c16" name="assi della porta"/>
  <color symbol="N" value="5a4a3a" name="stipite"/>
  <color symbol="T" value="6a4a30" name="scala"/>
  <color symbol="k" value="6a4a30" name="gradini"/>
  <color symbol="#20" value="000000" hidden="True"/>
  <color symbol="#21" value="000000" hidden="True"/>
  <action name="open" label="Apri la porta"><all><rule in="O" out="#20"/><rule in="o" out="#21"/></all></action>
  <action name="close" label="Chiudi la porta"><all><rule in="#20" out="O"/><rule in="#21" out="o"/></all></action>
</sequence>
```
