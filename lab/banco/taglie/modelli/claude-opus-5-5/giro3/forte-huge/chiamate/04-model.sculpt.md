# model.sculpt · claude-opus-5-5 · 70 s

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
It does not pass: varietà: alla taglia Gargantuesca 18 tipi di parti e 128 parti, alla Enorme 18 e 130: in un'area più grande entra di più (annessi, recinti, campi, mura, torri: un tipo nuovo, o almeno 163 parti), non lo stesso edificio più grande — what the larger size contains against the smaller: the kinds of parts (letters with a piece of 8 voxels or more) and the pieces
What the game made of it, in text:
### Seed 1 at gargantuan: grid 150×150×120, one character = 3×3 cells (the back at the top, the front at the bottom; «.» empty)
Letters: E Emerald, c marker, W muro del mastio, r strada, n selciato, a acqua, F solaio, f assito, k gradini, L finestra, R tetto in cotto, C mura, K pietra delle torri, Y pozzo, M merli, O porta, o assi della porta, N stipite, U feritoia
Plan (the letter on top of every column):
```
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
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE
EEEEEEEEEECCCccccaccccccccccccccccccccCCCCEEEEEEEE
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE
EEEEEEEEEECCCcccccWWcWcWWcWWcWcWWMMcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE
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
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE
EEEEEEEEEECCCccccWWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE
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
00000000007777002220000000000000000000777700000000
00000000007777002220000000000000000000777700000000
00000000007777000000000000000000000000777700000000
00000000007777000000000000000000000000777700000000
00000000007777000000000000000000000000777700000000
0000000000777700mmmmmlmmmmmmmlmmmrr000777700000000
0000000000777700mllllllllllllllllrr000777700000000
0000000000777700llljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700mlljjjjjjjjjjjjjjll000777700000000
0000000000777700llljjjjjjjjjjjjjjll000777700000000
0000000000777700mllllllllllllllllrr000777700000000
0000000000777700mmmmmlmmmmmmmlmmmrr000777700000000
00000000007777000000000000000000000000777700000000
000000dddddddd000000000000000000000000ddbdddd00000
000000dbbbbbbd000000000000000000000000dbbbbbd00000
000000bbbbbbbbd77777777gggggg7777777ddbbbbbbb00000
000000dbbbbbbbd77777777geeeeg7777777dbbbbbbbd00000
000000bbbbbbbbd77777777geeeeg7777777dbbbbbbbb00000
000000dbbbbbbbd77777777ggeggg7777777dbbbbbbbd00000
000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
000000ddddddddd000000000000000000000ddddddddd00000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000
```
Front (looking from the front; the sky at the top):
```
.................................MM...............
.................................MM...............
.................................KK...............
.................................KK...............
.................................KK...............
.................M..M.M..M..M.M..KK...............
.................M.MM.MM.M.MM.MM.KK...............
.................WWWWWWWWWWWWWWWWKK...............
.................WWWWWWWWWWWWWWWWKK...............
.................WWWWWWWWWWWWWWWWKK...............
.................WWWWWWWWWWWWWWWWKK...............
.................WWWWWWWWWWWWWWWWKK...............
.................WWWWWWWWWWWWWWWWKK...............
.................WWWWWWMMMMMWWWWWKK...............
.................WWWWWWMMMMMWWWWWKK...............
.................WWWWWWKKKKKWWWWWKK...............
.......M.MMMMMM..WWWWWWKKKKKKWWWWKK..MMM.M.MM.....
.......MKMMMMMM..WWWWWWKKKKKKWWWWKK..MMMKMKMM.....
.......KKKKKKKK..WWWWWWKKKKKWWWWWKK..KKKKKKKK.....
.......KKKKKKKK..WWWWWWKKKKKWWWWWKK..KKKKKKKK.....
.......KKKKKKKK..WWWWWWKKKKKWWWWWKK..KKKKKKKK.....
.......KKKKKKKK..WWWWWWNooooWWWWWKK..KKKKKKKK.....
.......KKKKKKKK.CWWWWWWNooooWWWWWKK.KKKKKKKKK.....
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
..................MM...............MM.............
..................MM...............MM.............
..................KK...............KK.............
..................KK...............KK.............
..................KK...............KK.............
..................KK.M..M.....M..M.KK.............
..................KK.MM.M.MMM.M.MM.KK.............
..................KKWWWWWWWWWWWWWWWKK.............
..................KKWWWWWWWWWWWWWWWKK.............
..................KKWWWWWWWWWWWWWWWKK.............
..................KKWWWWWWWWWWWWWWWKK.............
..................KKWWWWWWWWWWWWWWWKK.............
..................KKWWWWWWWWWWWWWWWKK.............
..................KKWWWWWWWWWWWWWWWKK...MMM.......
..................KKWWWWWWWWWWWWWWWKK...MMM.......
..................KKWWLLWWWWWWWWWWWKK...KKKM......
...MM.M.MMMM......KKWWLLWWWWWWWWWWWKK.MMMMKM.MM...
...MM.MKMMMM......KKWWLLWWWWWWWWWWWKK.MMMMKM.MM...
...KKKKKKKKK......KKWWWWWWWWWWWWWWWKK.KKKKKKKKK...
...KKKKKKKKK......KKWWWWWWWWWWWWWWWKK.KKKKKKKKK...
...KKKKKKKKK......KKWWWWWWWWWWWWWWWKK.KKKKKKKKK...
...KKKKKKKKK......KKWWWWWWWWWWWWWWWKK.KKKKKKKKK...
...KKKKKKKKK......KKWWWWWWWWWWWWWWWKK.KKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
...KKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKK...
```
Cut at z=11 (the letters at that height: doors, rooms, stairs):
```
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
..........CCC.........................CCCC........
..........CCC.........................CCCC........
..........CCC.........................CCCC........
..........CCC.........................CCCC........
..........CCC.........................CCCC........
..........CCC....WWWWWWWWWWLLWWWWKK...CCCC........
..........CCC....WWWWWWWWWWLLWWWWKK...CCCC........
..........CCC....W.....kkkk......WW...CCCC........
..........CCC....W.....kkkk......LL...CCCC........
..........CCC....L.....kkkk......LL...CCCC........
..........CCC....L...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....L...............LL...CCCC........
..........CCC....L...............LL...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....W...............WW...CCCC........
..........CCC....WWWWWWoooooLLWWWKK...CCCC........
..........CCC....WWWWWWoooooLLWWWKK...CCCC........
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
..............M...................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
..................................................
.................WWWWWWWWLLLLLLWWKK...............
.................WWWWWWWWLLLLLLWWKK...............
.................W...............WW...............
.................W...............WW...............
.................W...............LL...............
.................W...............LL...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................L...............WW...............
.................L...............WW...............
.................W...............WW...............
.................W...............WW...............
.................W...............WW...............
.................WWWWWWWLLWLLWWWWKK...............
.................WWWWWWWLLWLLWWWWKK...............
..................................................
..................................................
..................................................
..............M........KUKKU......................
.......................KKKKK......................
.......................KUKKU......................
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
.................................KK...............
.................................KK...............
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
.................................KK...............
.................................KK...............
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
### Seed 2: plan and heights side by side
```
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEKKKKKKMEEEEEEEEEEEEEEEEEEEEEEEEEEEEKKKKKKMEEEEE   0ddddddddd00000000000000000000000000ddddddddd00000
EEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   0dbbbbbbbd00000000000000000000000000dbbbbbbbd00000
EEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   0bbbbbbbbb00000000000000000000000000bbbbbbbbb00000
EEKKKKKKKKEEEEEEEEEEEEEEEEEEEEEEEEEEEKKKKKKKKEEEEE   0dbbbbbbbd77777777777777777777777777dbbbbbbbd00000
EEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   0bbbbbbbbd77777777777777777777777777dbbbbbbbb00000
EEKKKKKKKKCCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   0dbbbbbbbd77777777777777777777777777dbbbbbbbd00000
EEKKKKKKKMCCCCCCCCCCCCCCCCCCCCCCCCCCCKKKKKKKKEEEEE   0bbbbbbbbd77777777777777777777777777ddbbbbbbb00000
EEKKKKKKccccccccccccccccccccccccccccccKKKKKKKEEEEE   0dbbbbbbd00000000000000000000000000000dbbbbbd00000
EEKKKKKKccccccccccccccccccccccccccccccMKKKKKMEEEEE   0dddddddd00000000000000000000000000000ddbdddd00000
EEEEECCCccccccccccccccccccccccccccccccCCCCEEEEEEEE   00000777700000000000000000000000000000777700000000
EEEEECCCccccccccccWWWWWWWWWWWWWWWcMcccCCCCEEEEEEEE   0000077770000000rrrllllllllllllllrr000777700000000
EEEEECCCcccccccccKWWWWWWWWWWWWWWWMMcccCCCCEEEEEEEE   0000077770000000rrrllllllllllllllrr000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770022200mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCccccaccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770020200mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770022200mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000llljjjjjjjjjjjjjjll000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000mlljjjjjjjjjjjjjjlm000777700000000
EEEEECCCcccccccccWRRRRRRRRRRRRRRRWWcccCCCCEEEEEEEE   0000077770000000llljjjjjjjjjjjjjjll000777700000000
EEEEECCCcccccccccWWWWWWWWWWWWWWWWWWcccCCCCEEEEEEEE   0000077770000000mlllllllllllllllllm000777700000000
EEEEECCCcccccccccWWWWWWWWWWWWWWWWWMcccCCCCEEEEEEEE   0000077770000000mmmmmlmmmmmlmmmmmmm000777700000000
EEEEECCCcccccccccccccccnnnnnccccccccccCCCCEEEEEEEE   00000777700000000000000000000000000000777700000000
EEEKKKKCcccccccccccccccnnnnncccccccccccCKMKKMEEEEE   0dddddddd00000000000000000000000000000ddbdddd00000
EEKKKKKKcccccccccccccccnnnnnccccccccccKKKKKKKEEEEE   0dbbbbbbd00000000000000000000000000000dbbbbbd00000
EEKKKKKKKMCCCCCCCCCCCCCMKKKKMCCCCCCCCKKKKKKKKEEEEE   0bbbbbbbbd7777777777777gggggg7777777ddbbbbbbb00000
EEKKKKKKKKCCCCCCCCCCCCCKKKKKNCCCCCCCCKKKKKKKKEEEEE   0dbbbbbbbd7777777777777geeeeg7777777dbbbbbbbd00000
EEKKKKKKKKCCCCCCCCCCCCCKKKKKNCCCCCCCCKKKKKKKKEEEEE   0bbbbbbbbd7777777777777geeeeg7777777dbbbbbbbb00000
EEKKKKKKKKEEEEEEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   0dbbbbbbbd7777777777777ggeggg7777777dbbbbbbbd00000
EEKKKKKKKKEEEEEEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   0bbbbbbbbb00000000000000000000000000bbbbbbbbb00000
EEKKKKKKKKEEEEEEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   0dbbbbbbbd00000000000000000000000000dbbbbbbbd00000
EEKKKKKKKMEEEEEEEEEEEEErrrrrEEEEEEEEEKKKKKKKMEEEEE   0ddddddddd00000000000000000000000000ddddddddd00000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
### Seed 3: plan and heights side by side
```
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
EEEEEEEEEECCCcccccccccccccccccccccYcccCCCCEEEEEEEE   00000000007777000000000000000000022000777700000000
EEEEEEEEEECCCccccccccccccccccccccYYcccCCCCEEEEEEEE   00000000007777000000000000000000022000777700000000
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE   00000000007777000000000000000000000000777700000000
EEEEEEEEEECCCcccccccccccccccccccccccccCCCCEEEEEEEE   00000000007777000000000000000000000000777700000000
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
EEEEEEEKKKKKKKMCCCCCCCCMKKKKMCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd77777777ggeggg7777777ddbbbbbbb00000
EEEEEEEKKKKKKKKCCCCCCCCKKKKKNCCCCCCCCKKKKKKKKEEEEE   000000dbbbbbbbd77777777geeeeg7777777dbbbbbbbd00000
EEEEEEEKKKKKKKKCCCCCCCCNKKKKNCCCCCCCCKKKKKKKKEEEEE   000000bbbbbbbbd77777777geeeeg7777777dbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd77777777ggeggg7777777dbbbbbbbd00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000bbbbbbbbb000000000000000000000bbbbbbbbb00000
EEEEEEEKKKKKKKKEEEEEEEErrrrrEEEEEEEEEKKKKKKKKEEEEE   000000dbbbbbbbd000000000000000000000dbbbbbbbd00000
EEEEEEEKKKKKKKMEEEEEEEErrrrrEEEEEEEEEKKKKKKKMEEEEE   000000ddddddddd000000000000000000000ddddddddd00000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
EEEEEEEEEEEEEEEEEEEEEEErrrrrEEEEEEEEEEEEEEEEEEEEEE   00000000000000000000000000000000000000000000000000
```
How much the plans of the seeds differ: 0.29 (0 the same building, 1 nothing in common; a building that varies stays between 0.15 and 0.6).
Here is what the program did when the game ran it, node by node:
Traccia, seme 1: griglia 200×200×160, 142 nodi, 639 passi, finito in 1058 ms.
x sinistra→destra, y fondo→davanti, z basso→alto; «.» è la cella vuota; #n è il nodo nell'ordine dell'XML; ×n quante volte ha agito.
Lettere: H=Honey, E=Emerald, h=honey, w=white, x=x, s=slate, c=cyan (marcatore), W=muro del mastio, t=teal, G=Green, r=strada, d=dead, dark, n=selciato, Q=aQua, a=acqua, m=magenta, e=emerald, v=olive, u=blue, g=green, q=aqua, F=solaio, f=assito, T=scala, k=gradini, b=black, L=finestra, R=tetto in cotto, C=mura, K=pietra delle torri, Y=pozzo, M=merli, O=porta, o=assi della porta, N=stipite, U=feritoia, #90=? (marcatore), #91=? (marcatore), #92=? (marcatore).
Alla fine: K 99476, C 98250, W 61609, E 19350, c 9225, o 6510, U 3474, L 3216, k 2720, M 2436, f 2025, R 2025, F 1865, a 1059, N 1025, r 450, n 375, O 240, Y 128.
  #3 map scala 1/5 1/5 1: ×1, 1600 celle x0-39 y0-39 z0-159, passi 1
#5-41 all×29, one×6, prl×2: 905 celle x5-35 y6-39 z0, passi 2-75
   #45 map scala 5 5 1: ×1, 40000 celle x0-199 y0-199 z0-159, passi 76
#47-48 all×2: 11400 celle x75-129 y80-134 z0-6, passi 77-82
    #49 all . w → w b passi=14: ×14, 26600 celle x75-129 y80-134 z6-20, passi 83-96, w→b 13300, .→w 13300
#50-51 all×2: 34200 celle x75-129 y80-134 z20-38, passi 97-114
    #52 all . w → w b passi=14: ×14, 26600 celle x75-129 y80-134 z38-52, passi 115-128, w→b 13300, .→w 13300
    #53 all . w → w W passi=12: ×12, 22800 celle x75-129 y80-134 z52-64, passi 129-140, w→W 11400, .→w 11400
#54-57 all×3, prl×1: 16800 celle x75-129 y80-134 z0-70, passi 141-149
    #58 all . h → h . passi=31: ×31, 113150 celle x80-124 y85-129 z1-32, passi 150-180, h→. 56575, .→h 56575
#59-60 all×2: 16050 celle x80-124 y85-129 z2-33, passi 181-211
    #61 all . h → h . (+1) passi=31: ×31, 125550 celle x80-124 y85-129 z33-64, passi 212-242, h→. 56575, .→h 56575, s→. 6200, .→s 6200
      r1 . h → h . ×56575; r2 . s → s . ×6200
#62-64 prl×2, all×1: 10775 celle x80-129 y80-134 z0-87, passi 243-331
    #65 all . v → v C passi=24: ×24, 189600 celle x35-169 y40-169 z0-24, passi 332-355, v→C 94800, .→v 94800
    #66 prl v → C: ×1, 3950 celle x35-169 y40-169 z24, passi 356, v→C 3950
    #67 all . u → u K passi=39: ×39, 187200 celle x25-179 y30-179 z0-39, passi 357-395, u→K 93600, .→u 93600
#68-75 prl×3, all×4, one×1: 20106 celle x25-179 y30-179 z0-51, passi 396-467
    #76 prl b → W: ×1, 23384 celle x75-129 y80-134 z6-51, passi 468, b→W 23384
#83-86 all×4: 14060 celle x94-110 y130-169 z0-30, passi 469-500
#104-142 all×16, prl×6: 23294 celle x25-179 y30-179 z1-93, passi 501-639
Senza effetto (non hanno mai cambiato una cella):
#42 all [Wt]E/*a → **/*a: le celle cercate c'erano, ma mai disposte come nel pattern
#43 all aE/*a → *a/**: le celle cercate c'erano, ma mai disposte come nel pattern
#78 all S#93 → *S passi=20: in quel momento nella griglia non c'erano celle "S", ""
#79 all S/#93 → */S passi=1: in quel momento nella griglia non c'erano celle "S", ""
#80 all . S → S * passi=39: in quel momento nella griglia non c'erano celle "S"
#81 one #93#93#93#93#93#93#93#93#93#93#93#93#93/SSSSSSS… → *************/*OOOOOOOOOOO*/*OOOOOOOOOOO* passi=1: in quel momento nella griglia non c'erano celle "", "S"
#82 prl #93 → . passi=1: in quel momento nella griglia non c'erano celle ""
#88 all S#93 → *S passi=27: in quel momento nella griglia non c'erano celle "S", ""
#89 all S/#93 → */S passi=17: in quel momento nella griglia non c'erano celle "S", ""
#90 prl SSSSS/SSSSS/SSSSS/SSSSS/SSSSS → *****/*****/**#96**/*****/***** passi=1: in quel momento nella griglia non c'erano celle "S"
#91 all . S → S * passi=63: in quel momento nella griglia non c'erano celle "S"
#92 all . #96 → I * passi=1: in quel momento nella griglia non c'erano celle ""
… e altri 26
Fix it and answer with the whole program.

## Risposta

```xml
<!--
FORTE: a ring of curtain walls with corner towers, a gatehouse on the front axis, a keep in the courtyard.
Plan letters:
  h  keep floor around H; w keep walls; x turret on one corner of the keep; s stair zone along the keep's back wall
  c  courtyard around the keep; W curtain wall, two cells thick; t corner towers
  d  keep door; n paving; G gatehouse in the ring; r road to the front edge (all on the axis, three cells wide)
  Q  well, only where 5x5 of yard is free; A  moat, only where twelve cells of ground go on past the ring
  e  marker: the front of the keep ends here
Seeds change the keep depth, the turret corners, which side of the yard grows wider, and where the well stands.
Huge: keep, yard widened on one side, ring, four towers, gate, road.
Gargantuan: a wider yard with a well, and a moat around the ring, broken by the road.
-->
<sequence values="BHE" symmetry="(xy)" soil="E" origin="bottom">
  <map scale="1/5 1/5 1" values="BHEhwxscWtGrdnQAme" symmetry="()">
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
      <all in="WWEEEEEEEEEEEE" out="**AA**********" steps="1"/>
      <all in="[WtA]E/*A" out="**/*A"/><all in="AE/*A" out="*A/**"/>
      <all in="[WtA]E/*A" out="**/*A"/><all in="AE/*A" out="*A/**"/>
    </sequence>
    <map scale="5 5 1" values="BEhswdxvugcnrqaAFfTkWbLRCKYMOoNU" symmetry="()">
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
      <rule in="A" out="AAAAA/AAAAA/AAAAA/AAAAA/AAAAA"/>
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
  <color symbol="a" value="5a8ab0" name="acqua del pozzo"/>
  <color symbol="A" value="3f6f96" name="fossato"/>
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
